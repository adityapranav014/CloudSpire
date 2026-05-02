import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

// ---------------------------------------------------------------------------
// Redis connection — lazy initialization
//
// The queue, events, and helpers are created on first use (not at import time)
// so the server can boot gracefully when Redis is unavailable.
// ---------------------------------------------------------------------------

const REDIS_URL  = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const QUEUE_NAME = "report-generation";

let _queue       = null;
let _queueEvents = null;
let _redisAvailable = null;   // null = unknown, true/false = resolved

/** Creates a new ioredis connection with error suppression. */
export const createRedisConnection = () => {
    const conn = new IORedis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy: (times) => {
            if (times > 5) return null;          // stop retrying after 5 attempts
            return Math.min(times * 500, 3000);
        },
    });

    // Suppress unhandled error events (we handle failures at the caller)
    conn.on("error", () => {});

    return conn;
};

/**
 * Probes Redis availability once. Subsequent calls return cached result.
 * @returns {Promise<boolean>}
 */
export const isRedisAvailable = async () => {
    if (_redisAvailable !== null) return _redisAvailable;

    try {
        const probe = createRedisConnection();
        await probe.connect();
        await probe.ping();
        probe.disconnect();
        _redisAvailable = true;
    } catch {
        _redisAvailable = false;
        console.warn("[Queue] Redis is not available — queue features disabled.");
    }

    return _redisAvailable;
};

/** Lazily initializes and returns the report queue. */
const getQueue = () => {
    if (!_queue) {
        const conn = createRedisConnection();
        conn.connect().catch(() => {});

        _queue = new Queue(QUEUE_NAME, {
            connection: conn,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "exponential", delay: 3000 },
                removeOnComplete: { age: 3600, count: 200 },
                removeOnFail:     { age: 86400, count: 500 },
            },
        });

        _queue.on("error", () => {});
    }
    return _queue;
};

/** Lazily initializes and returns queue events (for polling). */
const getQueueEvents = () => {
    if (!_queueEvents) {
        const conn = createRedisConnection();
        conn.connect().catch(() => {});
        _queueEvents = new QueueEvents(QUEUE_NAME, { connection: conn });
        _queueEvents.on("error", () => {});
    }
    return _queueEvents;
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Enqueues a PDF report generation job.
 * Throws an AppError-friendly message if Redis is down.
 */
export const enqueueReportJob = async (payload) => {
    const available = await isRedisAvailable();
    if (!available) {
        throw new Error("Report queue is unavailable — Redis is not connected. Use the sync endpoint instead.");
    }

    const queue = getQueue();
    const job = await queue.add("generate-pdf", payload, { priority: 1 });
    return job;
};

/**
 * Returns the current state of a job by ID.
 */
export const getJobStatus = async (jobId) => {
    const available = await isRedisAvailable();
    if (!available) return null;

    const queue = getQueue();
    const job = await queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();

    return {
        id:           job.id,
        status:       state,
        progress:     job.progress || 0,
        result:       job.returnvalue || null,
        failedReason: job.failedReason || null,
    };
};

// Re-export the queue name for the worker
export { QUEUE_NAME };

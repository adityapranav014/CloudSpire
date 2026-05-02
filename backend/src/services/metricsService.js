import si from "systeminformation";

// ---------------------------------------------------------------------------
// In-memory cache — avoids excessive system calls.
// Each key stores { data, timestamp }.  TTL is configurable (default 5 s).
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5_000;

const cache = new Map();

/**
 * Returns cached data if still fresh, otherwise `null`.
 * @param {string} key
 * @returns {object|null}
 */
const getFromCache = (key) => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.data;
};

/**
 * Stores data in the cache with a current timestamp.
 * @param {string} key
 * @param {object} data
 */
const setCache = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
};

// ---------------------------------------------------------------------------
// Fetch-lock: prevents thundering-herd when multiple requests hit an expired
// cache simultaneously.  Only one system call runs; others await its result.
// ---------------------------------------------------------------------------
const inflightRequests = new Map();

/**
 * Wraps an async fetcher so that concurrent callers share a single in-flight
 * promise.  Combined with the TTL cache above this guarantees:
 *   • At most ONE system call every `CACHE_TTL_MS` milliseconds
 *   • Sub-millisecond responses for cache hits
 *   • No thundering-herd on cache expiry
 *
 * @param {string} key   Cache / lock key
 * @param {Function} fn  Async function that produces the data
 * @returns {Promise<object>}
 */
const cachedFetch = async (key, fn) => {
    // 1. Try cache first
    const cached = getFromCache(key);
    if (cached) return cached;

    // 2. Coalesce concurrent callers behind a single in-flight promise
    if (inflightRequests.has(key)) {
        return inflightRequests.get(key);
    }

    const promise = fn().then((data) => {
        setCache(key, data);
        inflightRequests.delete(key);
        return data;
    }).catch((err) => {
        inflightRequests.delete(key);
        throw err;
    });

    inflightRequests.set(key, promise);
    return promise;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches current system metrics (cached for 5 s).
 *
 * @returns {Promise<{
 *   cpu:     number,
 *   memory:  { used: number, total: number, percent: number },
 *   disk:    Array<{ fs: string, size: number, used: number, available: number, use: number, mount: string }>,
 *   network: { rx: number, tx: number },
 *   uptime:  number,
 *   load:    { avgLoad: number, currentLoad: number, cpus: number[] }
 * }>}
 */
export const getSystemMetrics = () =>
    cachedFetch("metrics:full", async () => {
        // Fire all async lookups concurrently — no blocking calls
        const [cpuLoad, memory, disk, network, uptimeSec] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize(),
            si.networkStats(),
            si.time(),
        ]);

        // --- CPU -----------------------------------------------------------
        const cpu = parseFloat(cpuLoad.currentLoad.toFixed(2));

        // --- Memory --------------------------------------------------------
        const memUsed = memory.used;
        const memTotal = memory.total;
        const memPercent = parseFloat(((memUsed / memTotal) * 100).toFixed(2));

        // --- Disk ----------------------------------------------------------
        const diskInfo = disk.map((d) => ({
            fs:        d.fs,
            size:      d.size,
            used:      d.used,
            available: d.available,
            use:       parseFloat(d.use.toFixed(2)),
            mount:     d.mount,
        }));

        // --- Network -------------------------------------------------------
        const rx = network.reduce((sum, iface) => sum + (iface.rx_bytes || 0), 0);
        const tx = network.reduce((sum, iface) => sum + (iface.tx_bytes || 0), 0);

        // --- Uptime --------------------------------------------------------
        const uptime = typeof uptimeSec === "object" ? uptimeSec.uptime : uptimeSec;

        // --- Load Average --------------------------------------------------
        const load = {
            avgLoad:     cpuLoad.avgLoad,
            currentLoad: parseFloat(cpuLoad.currentLoad.toFixed(2)),
            cpus:        cpuLoad.cpus.map((c) => parseFloat(c.load.toFixed(2))),
        };

        return {
            cpu,
            memory: { used: memUsed, total: memTotal, percent: memPercent },
            disk: diskInfo,
            network: { rx, tx },
            uptime,
            load,
        };
    });

/**
 * Lightweight health-check (cached for 5 s).
 * Returns only CPU %, memory %, and uptime.
 */
export const getQuickHealth = () =>
    cachedFetch("metrics:health", async () => {
        const [cpuLoad, memory, uptimeSec] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.time(),
        ]);

        return {
            cpu:    parseFloat(cpuLoad.currentLoad.toFixed(2)),
            memory: parseFloat(((memory.used / memory.total) * 100).toFixed(2)),
            uptime: typeof uptimeSec === "object" ? uptimeSec.uptime : uptimeSec,
        };
    });

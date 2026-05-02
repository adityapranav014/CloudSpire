/**
 * metricsService.js — Real-time infrastructure metrics via systeminformation.
 *
 * Collects CPU, RAM, Disk, and Network every 3 seconds and emits them to
 * the org's Socket.IO room. Designed for the "live" dashboard demo.
 *
 * Collector lifecycle:
 *   startMetricCollection(orgId, teamId, serverId, socketId)
 *     → creates an interval, stores in collectorsMap
 *   stopMetricCollection(serverId, socketId)
 *     → clears the specific collector
 *   stopAllCollectorsForSocket(socketId)
 *     → called on disconnect, clears ALL collectors owned by that socket
 *
 * Key: `${socketId}:${serverId}` — allows one socket to monitor multiple servers
 * and prevents collectors from leaking when a client reconnects.
 *
 * ── OS permission notes ──────────────────────────────────────────────────────
 * systeminformation v5 runs on Linux, macOS, and Windows without elevated
 * privileges for most metrics. Exceptions:
 *   - Disk I/O stats (fsStats): requires root on some Linux distros
 *   - Network interface speed: requires root on Linux (falls back to 0 safely)
 *   - Windows: WMI calls may be slow on first run (~500ms)
 * All calls are wrapped in try/catch — failures return zero values, never crash.
 */

import si from 'systeminformation';
import { emitToOrg } from './socketService.js';
import { logger } from '../utils/logger.js';

const INTERVAL_MS = 3_000; // emit every 3 seconds

/**
 * Map key: `${socketId}:${serverId}`
 * Value: { intervalId, orgId, teamId, serverId, socketId }
 */
const collectorsMap = new Map();

// ── Cost estimation constants ──────────────────────────────────────────────────
// Rough $/hr rates for estimation — replace with real pricing API in Sprint 2
const COST_PER_CPU_PERCENT_PER_HOUR  = 0.00010; // ~$0.10 per vCPU-hour at 100%
const COST_PER_GB_RAM_PER_HOUR       = 0.00013; // ~$0.013 per GB-hour

// ── Metric collection ──────────────────────────────────────────────────────────

/**
 * Collects one snapshot of all metrics.
 * Returns a safe object — never throws.
 */
async function collectMetrics() {
    const [cpuLoad, mem, disk, netStats] = await Promise.allSettled([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
    ]);

    // CPU — overall load percentage
    const cpuPercent = cpuLoad.status === 'fulfilled'
        ? parseFloat((cpuLoad.value.currentLoad ?? 0).toFixed(1))
        : 0;

    // RAM — used / total in GB
    const memData    = mem.status === 'fulfilled' ? mem.value : {};
    const ramUsedGB  = parseFloat(((memData.active ?? 0) / 1e9).toFixed(2));
    const ramTotalGB = parseFloat(((memData.total ?? 0) / 1e9).toFixed(2));
    const ramPercent = ramTotalGB > 0
        ? parseFloat(((ramUsedGB / ramTotalGB) * 100).toFixed(1))
        : 0;

    // Disk — aggregate across all mounted filesystems
    const diskData    = disk.status === 'fulfilled' ? disk.value : [];
    const diskUsedGB  = parseFloat((diskData.reduce((s, d) => s + (d.used ?? 0), 0) / 1e9).toFixed(2));
    const diskTotalGB = parseFloat((diskData.reduce((s, d) => s + (d.size ?? 0), 0) / 1e9).toFixed(2));
    const diskPercent = diskTotalGB > 0
        ? parseFloat(((diskUsedGB / diskTotalGB) * 100).toFixed(1))
        : 0;

    // Network — sum rx/tx bytes across all active interfaces
    const netData   = netStats.status === 'fulfilled' ? netStats.value : [];
    const rxBytesPS = netData.reduce((s, n) => s + (n.rx_sec ?? 0), 0);
    const txBytesPS = netData.reduce((s, n) => s + (n.tx_sec ?? 0), 0);

    return {
        cpu: {
            percent: cpuPercent,
        },
        ram: {
            usedGB:  ramUsedGB,
            totalGB: ramTotalGB,
            percent: ramPercent,
        },
        disk: {
            usedGB:  diskUsedGB,
            totalGB: diskTotalGB,
            percent: diskPercent,
        },
        network: {
            rxBytesPerSec: Math.round(rxBytesPS),
            txBytesPerSec: Math.round(txBytesPS),
        },
    };
}

/**
 * Estimates cost delta for the 3-second interval based on resource usage.
 * This is a simplified model — Sprint 2 will replace with real pricing APIs.
 */
function estimateCostDelta(metrics) {
    const intervalHours = INTERVAL_MS / 1000 / 3600;
    const cpuCost = (metrics.cpu.percent / 100) * COST_PER_CPU_PERCENT_PER_HOUR * intervalHours;
    const ramCost = metrics.ram.usedGB * COST_PER_GB_RAM_PER_HOUR * intervalHours;
    return parseFloat((cpuCost + ramCost).toFixed(6));
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Starts a metric collection loop for a given server.
 *
 * @param {string} orgId      - Org ID (from JWT via socketAuth)
 * @param {string} teamId     - Team ID (for cost:update event scoping)
 * @param {string} serverId   - Arbitrary server identifier (e.g. EC2 instance ID)
 * @param {string} socketId   - Socket ID of the requesting client
 */
export function startMetricCollection(orgId, teamId, serverId, socketId) {
    const key = `${socketId}:${serverId}`;

    // Prevent duplicate collectors for the same socket+server
    if (collectorsMap.has(key)) {
        logger.debug({ key }, 'Metric collector already running — skipping duplicate start');
        return;
    }

    const intervalId = setInterval(async () => {
        try {
            const metrics   = await collectMetrics();
            const costDelta = estimateCostDelta(metrics);
            const timestamp = new Date().toISOString();

            // metrics:update — matches frontend useSocket hook expectation
            emitToOrg(orgId, 'metrics:update', {
                serverId,
                timestamp,
                cpu:     metrics.cpu,
                ram:     metrics.ram,
                disk:    metrics.disk,
                network: metrics.network,
            });

            // cost:update — estimated cost delta for this interval
            emitToOrg(orgId, 'cost:update', {
                teamId,
                amount:   costDelta,
                period:   `${INTERVAL_MS / 1000}s`,
                delta:    costDelta,
                currency: 'USD',
                timestamp,
            });
        } catch (err) {
            // Non-fatal — log and continue; next interval will retry
            logger.error({ err, key, orgId }, 'Metrics collection tick failed');
        }
    }, INTERVAL_MS);

    collectorsMap.set(key, { intervalId, orgId, teamId, serverId, socketId });
    logger.info({ key, orgId, teamId, serverId }, 'Metric collector started');
}

/**
 * Stops a specific metric collector.
 *
 * @param {string} serverId  - Server identifier passed at start
 * @param {string} socketId  - Socket ID of the requesting client
 */
export function stopMetricCollection(serverId, socketId) {
    const key = `${socketId}:${serverId}`;
    const collector = collectorsMap.get(key);

    if (!collector) return;

    clearInterval(collector.intervalId);
    collectorsMap.delete(key);
    logger.info({ key }, 'Metric collector stopped');
}

/**
 * Stops ALL collectors owned by a socket.
 * Called automatically by socketService.js on disconnect.
 *
 * @param {string} socketId  - Disconnected socket ID
 */
export function stopAllCollectorsForSocket(socketId) {
    let stopped = 0;
    for (const [key, collector] of collectorsMap.entries()) {
        if (collector.socketId === socketId) {
            clearInterval(collector.intervalId);
            collectorsMap.delete(key);
            stopped++;
        }
    }
    if (stopped > 0) {
        logger.info({ socketId, stopped }, 'Metric collectors cleaned up on disconnect');
    }
}

/**
 * Returns the current number of active collectors.
 * Useful for health checks and debugging.
 */
export function getActiveCollectorCount() {
    return collectorsMap.size;
}

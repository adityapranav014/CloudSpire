import { getSystemMetrics, getQuickHealth } from "../services/metricsService.js";
import { catchAsync } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * GET /api/metrics
 * Returns full system metrics (CPU, memory, disk, network, uptime, load).
 */
export const getMetrics = catchAsync(async (req, res, next) => {
    console.log('[METRICS] GET /metrics — User:', req.user);

    const metrics = await getSystemMetrics();

    if (!metrics) {
        console.log('[METRICS] getMetrics error: Unable to retrieve system metrics');
        return next(
            new AppError("Unable to retrieve system metrics", 500, "METRICS_UNAVAILABLE")
        );
    }

    console.log('[METRICS] getMetrics success — cpu:', metrics.cpu?.usage, 'memory:', metrics.memory?.usedPercent);
    res.status(200).json({
        success: true,
        data: metrics,
    });
});

/**
 * GET /api/metrics/health
 * Lightweight health-check — CPU %, memory %, uptime only.
 */
export const getHealth = catchAsync(async (req, res, next) => {
    console.log('[METRICS] GET /metrics/health — User:', req.user);

    const health = await getQuickHealth();

    if (!health) {
        console.log('[METRICS] getHealth error: Unable to retrieve health status');
        return next(
            new AppError("Unable to retrieve health status", 500, "HEALTH_UNAVAILABLE")
        );
    }

    console.log('[METRICS] getHealth success — cpu:', health.cpu, 'memory:', health.memory);
    res.status(200).json({
        success: true,
        data: health,
    });
});

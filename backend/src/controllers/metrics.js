import { getSystemMetrics, getQuickHealth } from "../services/metricsService.js";
import { catchAsync } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * GET /api/metrics
 * Returns full system metrics (CPU, memory, disk, network, uptime, load).
 */
export const getMetrics = catchAsync(async (req, res, next) => {
    const metrics = await getSystemMetrics();

    if (!metrics) {
        return next(
            new AppError("Unable to retrieve system metrics", 500, "METRICS_UNAVAILABLE")
        );
    }

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
    const health = await getQuickHealth();

    if (!health) {
        return next(
            new AppError("Unable to retrieve health status", 500, "HEALTH_UNAVAILABLE")
        );
    }

    res.status(200).json({
        success: true,
        data: health,
    });
});

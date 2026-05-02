import { cleanupOldReports } from "../services/storageService.js";

// ---------------------------------------------------------------------------
// Report Cleanup Cron
//
// Runs every hour to remove generated PDF files older than 24 hours.
// Uses setInterval instead of node-cron to avoid an extra dependency.
// ---------------------------------------------------------------------------

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;   // 1 hour

/**
 * Starts the periodic report cleanup job.
 * Safe to call at server boot — logs results to stdout.
 */
export const initReportCleanup = () => {
    // Run once at startup (after a short delay to let boot finish)
    setTimeout(async () => {
        try {
            const removed = await cleanupOldReports();
            if (removed > 0) console.log(`[Cleanup] Startup sweep removed ${removed} old report(s)`);
        } catch (err) {
            console.warn("[Cleanup] Startup sweep failed:", err.message);
        }
    }, 10_000);

    // Then repeat every hour
    const intervalId = setInterval(async () => {
        try {
            await cleanupOldReports();
        } catch (err) {
            console.warn("[Cleanup] Scheduled sweep failed:", err.message);
        }
    }, CLEANUP_INTERVAL_MS);

    // Don't prevent Node from exiting
    intervalId.unref();

    console.log("[Cleanup] Report cleanup scheduled (every 1 hour, 24h max age)");
};

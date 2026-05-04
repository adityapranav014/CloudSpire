// ---------------------------------------------------------------------------
// Report Cleanup Cron
//
// Reports are now generated on-demand and not stored to disk.
// This cleanup job is no longer needed.
// ---------------------------------------------------------------------------

/**
 * Starts the periodic report cleanup job.
 * Safe to call at server boot — no-op since reports are streamed on-demand.
 */
export const initReportCleanup = () => {
    console.log("[Cleanup] Report cleanup disabled — reports are streamed on-demand, not stored");
};

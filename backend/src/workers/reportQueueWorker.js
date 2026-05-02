import { Worker } from "bullmq";
import { createRedisConnection, isRedisAvailable, QUEUE_NAME } from "../config/queue.js";
import { generatePDFReport } from "./reportWorker.js";
import { saveReport, generateFilename } from "../services/storageService.js";

import CostRecord from "../models/CostRecord.js";
import Team from "../models/Team.js";
import Alert from "../models/Alert.js";
import Optimization from "../models/Optimization.js";

// ---------------------------------------------------------------------------
// BullMQ Worker — processes "report-generation" jobs off the queue.
//
// Each job:
//   1. Fetches costs, teams, alerts & optimizations from MongoDB
//   2. Shapes the data into the PDF template format
//   3. Generates a PDF via Puppeteer (reportWorker)
//   4. Saves the file and returns the path as the job result
//
// The API never blocks — it enqueues and returns a job ID immediately.
// ---------------------------------------------------------------------------

/**
 * Starts the BullMQ worker. Call once at server boot.
 * Returns null if Redis is not available.
 * @returns {Worker|null}
 */
export const startReportWorker = async () => {
    const available = await isRedisAvailable();
    if (!available) {
        console.warn("[ReportWorker] Skipped — Redis unavailable.");
        return null;
    }

    const conn = createRedisConnection();
    await conn.connect();

    const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
            const { teamId, dateRange, userId } = job.data;

            console.log(`[ReportWorker] Processing job ${job.id} for team ${teamId}`);
            await job.updateProgress(10);

            // ---- 1. Date window ----------------------------------------
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const rangeStart = dateRange?.start ? new Date(dateRange.start) : startOfMonth;
            const rangeEnd   = dateRange?.end   ? new Date(dateRange.end)   : now;
            const dateFilter  = { $gte: rangeStart, $lte: rangeEnd };

            const rangeLabel =
                `${rangeStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ` +
                `${rangeEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

            await job.updateProgress(20);

            // ---- 2. Parallel DB fetches --------------------------------
            const [costsByService, costsByTeam, teams, alerts, optimizations] =
                await Promise.all([
                    CostRecord.aggregate([
                        { $match: { teamId, date: dateFilter } },
                        { $group: { _id: { service: "$service", provider: "$provider" }, totalCost: { $sum: "$cost" } } },
                        { $sort: { totalCost: -1 } },
                    ]),
                    CostRecord.aggregate([
                        { $match: { date: dateFilter } },
                        { $group: { _id: "$teamId", totalCost: { $sum: "$cost" } } },
                    ]),
                    Team.find({}).lean(),
                    Alert.find({ teamId, status: { $in: ["open", "acknowledged"] } })
                        .sort({ dateDetected: -1 }).limit(15).lean(),
                    Optimization.find({ teamId, status: "pending" })
                        .sort({ potentialSavings: -1 }).limit(10).lean(),
                ]);

            await job.updateProgress(50);

            // ---- 3. Shape data -----------------------------------------
            const totalCost = costsByService.reduce((s, r) => s + r.totalCost, 0);
            const totalSavings = optimizations.reduce((s, o) => s + (o.potentialSavings || 0), 0);

            const costSummary = {
                totalCost:      `$${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                monthOverMonth: "—",
                forecasted:     `$${(totalCost * 1.05).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                totalSavings:   `$${totalSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            };

            const teamMap = new Map(teams.map((t) => [t._id.toString(), t]));
            const teamBreakdown = costsByTeam.map((row) => {
                const team = teamMap.get(row._id?.toString()) || {};
                const budget = team.budget || 0;
                const actual = row.totalCost;
                const variance = budget - actual;
                const status =
                    variance > 0 ? "Under Budget" :
                    variance === 0 ? "On Track" :
                    Math.abs(variance) / (budget || 1) > 0.15 ? "Over Budget" : "At Risk";

                return {
                    team:     team.name || "Unknown",
                    budget:   `$${budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                    actual:   `$${actual.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                    variance: `${variance >= 0 ? "-" : "+"}$${Math.abs(variance).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                    status,
                };
            });

            const serviceBreakdown = costsByService.map((row) => ({
                service:  row._id.service,
                provider: row._id.provider?.toUpperCase() || "—",
                cost:     `$${row.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                percent:  totalCost > 0 ? `${((row.totalCost / totalCost) * 100).toFixed(1)}%` : "0%",
                trend:    "—",
            }));

            const alertRows = alerts.map((a) => ({
                severity: a.severity,
                message:  a.title,
                resource: a.resourceId,
                date:     new Date(a.dateDetected).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            }));

            const insights = optimizations.map(
                (o) => `${o.title} — potential savings $${o.potentialSavings.toLocaleString("en-US")} (${o.provider.toUpperCase()}, ${o.type})`
            );

            await job.updateProgress(70);

            // ---- 4. Generate PDF and save via storage service ----------
            const filename = generateFilename(`CloudSpire_Report_${rangeStart.toISOString().slice(0, 10)}`);

            const pdfBuffer = await generatePDFReport(
                { reportTitle: "CloudSpire Report", dateRange: rangeLabel, costSummary, teamBreakdown, serviceBreakdown, alerts: alertRows, insights },
            );

            const stored = await saveReport(pdfBuffer, filename);

            await job.updateProgress(100);
            console.log(`[ReportWorker] Job ${job.id} complete → ${stored.downloadUrl}`);

            return { filename: stored.filename, downloadUrl: stored.downloadUrl, generatedAt: stored.savedAt, requestedBy: userId || null };
        },
        {
            connection: conn,
            concurrency: 2,
            limiter: { max: 5, duration: 60_000 },
        },
    );

    // ---- Lifecycle events ---------------------------------------------
    worker.on("completed", (job) => {
        console.log(`[ReportWorker] ✓ Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
        console.error(`[ReportWorker] ✗ Job ${job?.id} failed: ${err.message}`);
    });

    worker.on("error", (err) => {
        console.error("[ReportWorker] Worker error:", err.message);
    });

    console.log("[ReportWorker] Worker started — listening for jobs");
    return worker;
};

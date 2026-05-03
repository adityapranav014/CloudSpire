import { mockReports } from '../data/mockReports.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { generateStandardReport } from '../jobs/reportWorker.js';
import { generatePDFReport } from '../workers/reportWorker.js';
import { enqueueReportJob, getJobStatus } from '../config/queue.js';
import { getReport } from '../services/storageService.js';

import CostRecord from '../models/CostRecord.js';
import Team from '../models/Team.js';
import Alert from '../models/Alert.js';
import Optimization from '../models/Optimization.js';

// -----------------------------------------------------------------------
// GET  /api/v1/reports          — list report templates & schedules
// -----------------------------------------------------------------------
export const getReports = catchAsync(async (_req, res) => {
    res.status(200).json({
        success: true,
        data: mockReports,
    });
});

// -----------------------------------------------------------------------
// POST /api/v1/reports/generate — CSV / JSON (existing async worker)
// -----------------------------------------------------------------------
export const triggerReportGeneration = catchAsync(async (req, res, _next) => {
    const { format } = req.body;
    const teamId = req.user?.teamId || '000000000000000000000000';

    generateStandardReport(teamId, format).catch(e => console.error("Worker process failure:", e));

    res.status(202).json({
        success: true,
        data: {
            message: "Report generation started. We will notify you when it's ready.",
            status: "processing"
        }
    });
});

// -----------------------------------------------------------------------
// POST /api/v1/reports/generate-pdf — Non-blocking, BullMQ-queued PDF
// -----------------------------------------------------------------------
export const generatePDFQueued = catchAsync(async (req, res, _next) => {
    const teamId = req.user?.teamId || '000000000000000000000000';
    const userId = req.user?.id || null;
    const { dateRange } = req.body;

    const job = await enqueueReportJob({ teamId, dateRange, userId });

    res.status(202).json({
        success: true,
        data: {
            jobId:   job.id,
            status:  'queued',
            message: 'PDF report generation has been queued. Poll /api/v1/reports/status/:jobId for progress.',
        },
    });
});

// -----------------------------------------------------------------------
// GET  /api/v1/reports/status/:jobId — Poll job progress
// -----------------------------------------------------------------------
export const getReportJobStatus = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;

    const status = await getJobStatus(jobId);

    if (!status) {
        return next(new AppError(`Job "${jobId}" not found.`, 404, 'JOB_NOT_FOUND'));
    }

    res.status(200).json({
        success: true,
        data: status,
    });
});

// -----------------------------------------------------------------------
// POST /api/v1/reports/generate-pdf/sync — Synchronous PDF download
//   (Fallback when Redis is unavailable or for small on-demand reports)
// -----------------------------------------------------------------------
export const generatePDFDownload = catchAsync(async (req, res, next) => {
    const teamId = req.user?.teamId || '000000000000000000000000';
    const { dateRange } = req.body;

    // 1. Date window
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeStart = dateRange?.start ? new Date(dateRange.start) : startOfMonth;
    const rangeEnd   = dateRange?.end   ? new Date(dateRange.end)   : now;

    const dateFilter = { $gte: rangeStart, $lte: rangeEnd };
    const rangeLabel =
        `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ` +
        `${rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // 2. Parallel DB fetches
    const [costsByService, costsByTeam, teams, alerts, optimizations] = await Promise.all([
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
        Alert.find({ teamId, status: { $in: ['open', 'acknowledged'] } })
            .sort({ dateDetected: -1 }).limit(15).lean(),
        Optimization.find({ teamId, status: 'pending' })
            .sort({ potentialSavings: -1 }).limit(10).lean(),
    ]);

    // 3. Shape data
    const totalCost = costsByService.reduce((sum, r) => sum + r.totalCost, 0);
    const totalSavings = optimizations.reduce((sum, o) => sum + (o.potentialSavings || 0), 0);

    const costSummary = {
        totalCost:      `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        monthOverMonth: '—',
        forecasted:     `$${(totalCost * 1.05).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        totalSavings:   `$${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    };

    const teamMap = new Map(teams.map((t) => [t._id.toString(), t]));
    const teamBreakdown = costsByTeam.map((row) => {
        const team = teamMap.get(row._id?.toString()) || {};
        const budget = team.budget || 0;
        const actual = row.totalCost;
        const variance = budget - actual;
        const status =
            variance > 0 ? 'Under Budget' :
            variance === 0 ? 'On Track' :
            Math.abs(variance) / (budget || 1) > 0.15 ? 'Over Budget' : 'At Risk';

        return {
            team:     team.name || row._id?.toString() || 'Unknown',
            budget:   `$${budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            actual:   `$${actual.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            variance: `${variance >= 0 ? '-' : '+'}$${Math.abs(variance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            status,
        };
    });

    const serviceBreakdown = costsByService.map((row) => ({
        service:  row._id.service,
        provider: row._id.provider?.toUpperCase() || '—',
        cost:     `$${row.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        percent:  totalCost > 0 ? `${((row.totalCost / totalCost) * 100).toFixed(1)}%` : '0%',
        trend:    '—',
    }));

    const alertRows = alerts.map((a) => ({
        severity: a.severity,
        message:  a.title,
        resource: a.resourceId,
        date:     new Date(a.dateDetected).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    const insights = optimizations.map(
        (o) => `${o.title} — potential savings $${o.potentialSavings.toLocaleString('en-US')} (${o.provider.toUpperCase()}, ${o.type})`
    );

    // 4. Generate PDF
    const pdfBuffer = await generatePDFReport({
        reportTitle: 'CloudSpire Report',
        dateRange: rangeLabel,
        costSummary, teamBreakdown, serviceBreakdown, alerts: alertRows, insights,
    });

    if (!pdfBuffer || pdfBuffer.length === 0) {
        return next(new AppError('PDF generation failed — empty output.', 500, 'PDF_GENERATION_FAILED'));
    }

    // 5. Stream download
    const filename = `CloudSpire_Report_${rangeStart.toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).end(pdfBuffer);
});

// -----------------------------------------------------------------------
// GET /api/v1/reports/download/:filename — Serve a saved PDF
// -----------------------------------------------------------------------
export const downloadReport = catchAsync(async (req, res, next) => {
    const { filename } = req.params;

    const report = await getReport(filename);

    if (!report) {
        return next(new AppError('Report not found or has expired.', 404, 'REPORT_NOT_FOUND'));
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', report.buffer.length);
    res.status(200).end(report.buffer);
});
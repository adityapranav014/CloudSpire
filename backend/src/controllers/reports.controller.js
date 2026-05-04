import mongoose from 'mongoose';
import { mockReports } from '../data/mockReports.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { generateStandardReport } from '../jobs/reportWorker.js';
import { generatePDFReport } from '../workers/reportWorker.js';
import { enqueueReportJob, getJobStatus, isRedisAvailable } from '../config/queue.js';

import CostRecord from '../models/CostRecord.model.js';
import Team from '../models/Team.model.js';
import Alert from '../models/Alert.model.js';
import Optimization from '../models/Optimization.model.js';

// ── Mock data for when the database is empty ────────────────────────────────
const MOCK_COST_SUMMARY = {
    totalCost:      '$24,580.00',
    monthOverMonth: '+8.3%',
    forecasted:     '$26,100.00',
    totalSavings:   '$3,420.00',
};

const MOCK_TEAM_BREAKDOWN = [
    { team: 'Platform Engineering', budget: '$15,000.00', actual: '$14,200.00', variance: '-$800.00', status: 'Under Budget' },
    { team: 'Data Science',        budget: '$8,000.00',  actual: '$8,950.00',  variance: '+$950.00',  status: 'Over Budget' },
    { team: 'Mobile Apps',         budget: '$4,000.00',  actual: '$3,430.00',  variance: '-$570.00',  status: 'Under Budget' },
];

const MOCK_SERVICE_BREAKDOWN = [
    { service: 'EC2',        provider: 'AWS',   cost: '$9,840.00', percent: '40.0%', trend: '↑ +12%' },
    { service: 'S3',         provider: 'AWS',   cost: '$4,200.00', percent: '17.1%', trend: '↑ +5%' },
    { service: 'Cloud SQL',  provider: 'GCP',   cost: '$3,680.00', percent: '15.0%', trend: '↓ -3%' },
    { service: 'Azure VMs',  provider: 'AZURE', cost: '$3,100.00', percent: '12.6%', trend: '→ 0%' },
    { service: 'Lambda',     provider: 'AWS',   cost: '$2,160.00', percent: '8.8%',  trend: '↑ +22%' },
    { service: 'CloudFront', provider: 'AWS',   cost: '$1,600.00', percent: '6.5%',  trend: '↓ -8%' },
];

const MOCK_ALERTS = [
    { severity: 'critical', message: 'EC2 spend 45% above forecast',          resource: 'i-0abc12def34',     date: 'May 2' },
    { severity: 'high',     message: 'Lambda invocations spike detected',     resource: 'fn-data-pipeline',  date: 'May 1' },
    { severity: 'medium',   message: 'Unused EBS volumes found (5 volumes)',  resource: 'vol-*',             date: 'Apr 30' },
    { severity: 'low',      message: 'S3 lifecycle policy missing on bucket', resource: 'logs-archive-2026', date: 'Apr 28' },
];

const MOCK_INSIGHTS = [
    'Rightsize 3 over-provisioned EC2 instances — estimated savings $180/month (AWS, rightsize)',
    'Delete 5 orphaned EBS volumes — estimated savings $45/month (AWS, cleanup)',
    'Switch stable workloads to Reserved Instances — estimated savings $320/month (AWS, reserved-instance)',
    'Schedule dev/staging shutdowns during off-hours — estimated savings $200/month (Azure, shutdown)',
];

// -----------------------------------------------------------------------
// GET  /api/v1/reports          — list report templates & schedules
// -----------------------------------------------------------------------
export const getReports = catchAsync(async (req, res) => {
    console.log('[REPORTS] GET /reports — User:', req.user?.id, 'OrgId:', req.user?.orgId);
    console.log('[REPORTS] getReports success — templates:', mockReports?.reportTemplates?.length || 0,
                'scheduled:', mockReports?.scheduledReports?.length || 0);
    res.status(200).json({
        success: true,
        data: mockReports,
    });
});

// -----------------------------------------------------------------------
// POST /api/v1/reports/generate — CSV / JSON report
// -----------------------------------------------------------------------
export const triggerReportGeneration = catchAsync(async (req, res, next) => {
    const orgId  = req.user?.orgId;
    const teamId = req.user?.teamId;
    const userId = req.user?.id;
    const { format } = req.body;

    console.log('[REPORTS] POST /reports/generate — User:', userId,
                'OrgId:', orgId, 'TeamId:', teamId, 'Format:', format);

    if (!orgId) {
        console.error('[REPORTS] triggerReportGeneration — missing orgId on req.user');
        return next(new AppError('Organisation context is required to generate reports.', 400, 'MISSING_ORG'));
    }

    // ── Fetch data from DB ──
    console.log('[REPORTS] triggerReportGeneration — fetching cost data from DB...');
    const fetchStart = Date.now();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const matchFilter = { orgId: new mongoose.Types.ObjectId(orgId) };
    if (teamId) matchFilter.teamId = new mongoose.Types.ObjectId(teamId);
    matchFilter.date = { $gte: twelveMonthsAgo };

    let costs, teams, alerts;
    try {
        [costs, teams, alerts] = await Promise.all([
            CostRecord.aggregate([
                { $match: matchFilter },
                { $group: { _id: { svc: '$service', prov: '$provider' }, totalCost: { $sum: '$cost' } } },
                { $sort: { totalCost: -1 } },
            ]),
            Team.find({ orgId: matchFilter.orgId }).lean(),
            Alert.find({ orgId: matchFilter.orgId, status: { $in: ['open', 'acknowledged'] } }).lean()
        ]);
        console.log('[REPORTS] triggerReportGeneration — DB fetch completed in', Date.now() - fetchStart, 'ms, costs:', costs.length, 'teams:', teams.length, 'alerts:', alerts.length);
    } catch (dbErr) {
        console.error('[REPORTS] triggerReportGeneration — DB query failed:', dbErr.message);
        return next(new AppError('Failed to fetch data for report.', 500, 'DB_QUERY_FAILED'));
    }

    // ── Real data: call the worker ──
    console.log('[REPORTS] triggerReportGeneration — Before worker call');
    const workerStart = Date.now();

    try {
        const result = await generateStandardReport(orgId.toString(), format, { costs, teams, alerts });
        const elapsed = Date.now() - workerStart;

        console.log('[REPORTS] triggerReportGeneration — After worker completion, elapsed:', elapsed, 'ms, result:', result);

        if (result === 'No data') {
             // Mock behavior if no data
            console.log('[REPORTS] triggerReportGeneration — no cost data found, serving mock report');
            const mockData = MOCK_SERVICE_BREAKDOWN.map(s => ({
                _id: { svc: s.service, prov: s.provider },
                totalCost: parseFloat(s.cost.replace(/[$,]/g, '')),
            }));

            let fileContent = '';
            if (format === 'csv') {
                const header = 'Service,Provider,Total Cost';
                const rows = mockData.map(r => `${r._id.svc},${r._id.prov},$${r.totalCost.toFixed(2)}`);
                fileContent = [header, ...rows].join('\n');
            } else {
                fileContent = JSON.stringify(mockData, null, 2);
            }

            return res.status(200).json({
                success: true,
                data: {
                    message: 'Report generated (sample data — no live cost records found).',
                    status: 'completed',
                    format,
                    content: fileContent,
                    isSampleData: true,
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'Report generated successfully.',
                status: 'completed',
                format,
                fileName: result,
                generationTimeMs: elapsed,
            },
        });
    } catch (workerErr) {
        console.error('[REPORTS] triggerReportGeneration — worker FAILED:', workerErr.message, workerErr.stack);
        return next(new AppError(
            `Report generation failed: ${workerErr.message}`,
            500,
            'REPORT_WORKER_FAILED',
        ));
    }
});

// -----------------------------------------------------------------------
// POST /api/v1/reports/generate-pdf — Non-blocking, BullMQ-queued PDF
// -----------------------------------------------------------------------
export const generatePDFQueued = catchAsync(async (req, res, next) => {
    const orgId  = req.user?.orgId;
    const teamId = req.user?.teamId;
    const userId = req.user?.id;
    const { dateRange } = req.body;

    console.log('[REPORTS] POST /reports/generate-pdf — User:', userId,
                'OrgId:', orgId, 'TeamId:', teamId, 'DateRange:', dateRange);

    if (!orgId) {
        console.error('[REPORTS] generatePDFQueued — missing orgId on req.user');
        return next(new AppError('Organisation context is required.', 400, 'MISSING_ORG'));
    }

    // Check Redis availability first
    const redisUp = await isRedisAvailable();
    if (!redisUp) {
        console.warn('[REPORTS] generatePDFQueued — Redis unavailable, redirecting to sync generation');

        // Fallback: generate synchronously instead of queueing
        return generatePDFDownloadInternal(req, res, next);
    }

    console.log('[REPORTS] generatePDFQueued — enqueueing job to BullMQ...');
    const job = await enqueueReportJob({ orgId: orgId.toString(), teamId, dateRange, userId });

    console.log('[REPORTS] generatePDFQueued — job enqueued successfully, jobId:', job.id);
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
    console.log('[REPORTS] GET /reports/status/', jobId, '— User:', req.user?.id);

    const status = await getJobStatus(jobId);

    if (!status) {
        console.log('[REPORTS] getReportJobStatus — Job not found:', jobId);
        return next(new AppError(`Job "${jobId}" not found.`, 404, 'JOB_NOT_FOUND'));
    }

    console.log('[REPORTS] getReportJobStatus — jobId:', jobId, 'state:', status.status, 'progress:', status.progress);
    res.status(200).json({
        success: true,
        data: status,
    });
});

// -----------------------------------------------------------------------
// POST /api/v1/reports/generate-pdf/sync — Synchronous PDF download
// -----------------------------------------------------------------------
export const generatePDFDownload = catchAsync(async (req, res, next) => {
    return generatePDFDownloadInternal(req, res, next);
});

/**
 * Internal PDF generation logic — used by both the sync endpoint and as
 * a fallback when BullMQ/Redis is unavailable.
 */
const generatePDFDownloadInternal = async (req, res, next) => {
    const orgId  = req.user?.orgId;
    const teamId = req.user?.teamId;
    const userId = req.user?.id;
    const { dateRange } = req.body;

    console.log('[REPORTS] generatePDFDownload — User:', userId,
                'OrgId:', orgId, 'TeamId:', teamId, 'DateRange:', dateRange);

    if (!orgId) {
        console.error('[REPORTS] generatePDFDownload — missing orgId on req.user');
        return next(new AppError('Organisation context is required.', 400, 'MISSING_ORG'));
    }

    // 1. Date window
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeStart = dateRange?.start ? new Date(dateRange.start) : startOfMonth;
    const rangeEnd   = dateRange?.end   ? new Date(dateRange.end)   : now;

    const dateFilter = { $gte: rangeStart, $lte: rangeEnd };
    const rangeLabel =
        `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ` +
        `${rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    console.log('[REPORTS] generatePDFDownload — date range:', rangeLabel);

    // 2. Parallel DB fetches — scoped by orgId (primary tenant boundary)
    console.log('[REPORTS] generatePDFDownload — starting parallel DB fetches...');
    const fetchStart = Date.now();

    let costsByService, costsByTeam, teams, alerts, optimizations;
    try {
        const orgMatch = { orgId: new mongoose.Types.ObjectId(orgId) };

        [costsByService, costsByTeam, teams, alerts, optimizations] = await Promise.all([
            CostRecord.aggregate([
                { $match: { ...orgMatch, date: dateFilter } },
                { $group: { _id: { service: "$service", provider: "$provider" }, totalCost: { $sum: "$cost" } } },
                { $sort: { totalCost: -1 } },
            ]),
            CostRecord.aggregate([
                { $match: { ...orgMatch, date: dateFilter } },
                { $group: { _id: "$teamId", totalCost: { $sum: "$cost" } } },
            ]),
            Team.find({ orgId: new mongoose.Types.ObjectId(orgId) }).lean(),
            Alert.find({ orgId: new mongoose.Types.ObjectId(orgId), status: { $in: ['open', 'acknowledged'] } })
                .sort({ dateDetected: -1 }).limit(15).lean(),
            Optimization.find({ orgId: new mongoose.Types.ObjectId(orgId), status: 'pending' })
                .sort({ potentialSavings: -1 }).limit(10).lean(),
        ]);

        const fetchElapsed = Date.now() - fetchStart;
        console.log('[REPORTS] generatePDFDownload — DB fetches completed in', fetchElapsed, 'ms');
        console.log('[REPORTS]   costsByService:', costsByService.length,
                    '| costsByTeam:', costsByTeam.length,
                    '| teams:', teams.length,
                    '| alerts:', alerts.length,
                    '| optimizations:', optimizations.length);
    } catch (dbErr) {
        console.warn('[REPORTS] generatePDFDownload — DB query failed (using mock data):', dbErr.message);
        // Fallback to mock data when DB is unavailable
        costsByService = [];
        costsByTeam = [];
        teams = [];
        alerts = [];
        optimizations = [];
    }

    // 3. Use live data or fall back to mock
    const hasLiveData = costsByService.length > 0;
    let costSummary, teamBreakdown, serviceBreakdown, alertRows, insights;

    if (hasLiveData) {
        console.log('[REPORTS] generatePDFDownload — using LIVE data for PDF');

        // Shape data
        const totalCost = costsByService.reduce((sum, r) => sum + r.totalCost, 0);
        const totalSavings = optimizations.reduce((sum, o) => sum + (o.potentialSavings || 0), 0);

        costSummary = {
            totalCost:      `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            monthOverMonth: '—',
            forecasted:     `$${(totalCost * 1.05).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            totalSavings:   `$${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        };

        const teamMap = new Map(teams.map((t) => [t._id.toString(), t]));
        teamBreakdown = costsByTeam.map((row) => {
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

        serviceBreakdown = costsByService.map((row) => ({
            service:  row._id.service,
            provider: row._id.provider?.toUpperCase() || '—',
            cost:     `$${row.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            percent:  totalCost > 0 ? `${((row.totalCost / totalCost) * 100).toFixed(1)}%` : '0%',
            trend:    '—',
        }));

        alertRows = alerts.map((a) => ({
            severity: a.severity,
            message:  a.title,
            resource: a.resourceId,
            date:     new Date(a.dateDetected).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));

        insights = optimizations.map(
            (o) => `${o.title} — potential savings $${o.potentialSavings.toLocaleString('en-US')} (${o.provider.toUpperCase()}, ${o.type})`
        );
    } else {
        console.log('[REPORTS] generatePDFDownload — no live data, using MOCK data for PDF');
        costSummary      = MOCK_COST_SUMMARY;
        teamBreakdown    = MOCK_TEAM_BREAKDOWN;
        serviceBreakdown = MOCK_SERVICE_BREAKDOWN;
        alertRows        = MOCK_ALERTS;
        insights         = MOCK_INSIGHTS;
    }

    // 4. Generate PDF
    console.log('[REPORTS] generatePDFDownload — calling Puppeteer PDF generator...');
    const pdfStart = Date.now();

    let pdfBuffer;
    try {
        pdfBuffer = await generatePDFReport({
            reportTitle: 'CloudSpire Report',
            dateRange: rangeLabel,
            costSummary,
            teamBreakdown,
            serviceBreakdown,
            alerts: alertRows,
            insights,
        });
        const pdfElapsed = Date.now() - pdfStart;
        console.log('[REPORTS] generatePDFDownload — PDF generated in', pdfElapsed, 'ms, size:', pdfBuffer?.length || 0, 'bytes');
    } catch (pdfErr) {
        console.error('[REPORTS] generatePDFDownload — PDF generation FAILED:', pdfErr.message, pdfErr.stack);
        return next(new AppError(
            `PDF generation failed: ${pdfErr.message}. This may be due to a missing Puppeteer/Chrome installation.`,
            500,
            'PDF_GENERATION_FAILED',
        ));
    }

    if (!pdfBuffer || (pdfBuffer.length === 0 && !pdfBuffer._isHtmlFallback)) {
        console.error('[REPORTS] generatePDFDownload — PDF generation returned empty buffer');
        return next(new AppError('PDF generation produced an empty file.', 500, 'PDF_EMPTY'));
    }

    // 5. Stream download — detect HTML fallback (Puppeteer/Chrome unavailable on Render free tier)
    const isHtmlFallback = pdfBuffer._isHtmlFallback === true;
    const ext = isHtmlFallback ? 'html' : 'pdf';
    const contentType = isHtmlFallback ? 'text/html' : 'application/pdf';
    const filename = `CloudSpire_Report_${rangeStart.toISOString().slice(0, 10)}.${ext}`;

    console.log('[REPORTS] generatePDFDownload — streaming to client, filename:', filename,
                'isSampleData:', !hasLiveData, 'isHtmlFallback:', isHtmlFallback);

    if (isHtmlFallback) {
        console.warn('[REPORTS] generatePDFDownload — Chrome unavailable, sending HTML report instead of PDF');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    if (!hasLiveData) res.setHeader('X-CloudSpire-Sample-Data', 'true');
    if (isHtmlFallback) res.setHeader('X-CloudSpire-Format', 'html-fallback');
    res.status(200).end(pdfBuffer);
};

// -----------------------------------------------------------------------
// GET /api/v1/reports/download/:filename — Reports are streamed on-demand
// -----------------------------------------------------------------------
export const downloadReport = catchAsync(async (req, res, next) => {
    const { filename } = req.params;
    console.log('[REPORTS] GET /reports/download/', filename, '— User:', req.user?.id);
    
    // Reports are now generated and streamed on-demand, not stored
    return next(new AppError(
        'Reports are generated and streamed on-demand. Use POST /api/v1/reports/generate-pdf/sync to download a report.',
        410,
        'REPORT_ON_DEMAND'
    ));
});
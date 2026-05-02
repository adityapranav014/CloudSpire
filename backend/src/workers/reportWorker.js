import { generatePDF } from "../utils/pdfGenerator.js";

// ---------------------------------------------------------------------------
// PDF Report Worker — CloudSpire
// Generates professional A4 PDF reports asynchronously from structured data.
// Delegates Puppeteer lifecycle to the shared `pdfGenerator` utility.
// ---------------------------------------------------------------------------

/**
 * Generates a full CloudSpire cost report PDF.
 *
 * @param {object}  data
 * @param {string}  [data.reportTitle]   — Custom title (default: "CloudSpire Report")
 * @param {string}  [data.dateRange]     — e.g. "Apr 1 – Apr 30, 2026"
 *
 * @param {object}  data.costSummary
 * @param {string}  data.costSummary.totalCost       — e.g. "$24,580"
 * @param {string}  data.costSummary.monthOverMonth  — e.g. "+8.3%"
 * @param {string}  data.costSummary.forecasted      — e.g. "$26,100"
 * @param {string}  data.costSummary.totalSavings     — e.g. "$3,420"
 *
 * @param {Array<{ team: string, budget: string, actual: string, variance: string, status: string }>}
 *        data.teamBreakdown
 *
 * @param {Array<{ service: string, provider: string, cost: string, percent: string, trend: string }>}
 *        data.serviceBreakdown
 *
 * @param {Array<{ severity: string, message: string, resource: string, date: string }>}
 *        data.alerts
 *
 * @param {string[]} data.insights — Free-text insight bullets
 *
 * @param {string}  [outputPath]  — If provided, saves PDF to disk and returns the path
 *
 * @returns {Promise<Buffer|string>}  PDF Buffer, or file path if outputPath was set
 */
export const generatePDFReport = async (data, outputPath = null) => {
    const html = buildCloudSpireHTML(data);

    return generatePDF(html, {
        outputPath,
        format: "A4",
        margin: { top: "18mm", right: "14mm", bottom: "18mm", left: "14mm" },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
            <div style="font-size:7px; width:100%; text-align:center; color:#94a3b8; padding-top:4px;">
                CloudSpire — Confidential
            </div>`,
        footerTemplate: `
            <div style="font-size:7px; width:100%; text-align:center; color:#94a3b8;">
                Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>`,
    });
};

// ---------------------------------------------------------------------------
// CloudSpire HTML Template
// ---------------------------------------------------------------------------

function buildCloudSpireHTML(data) {
    const {
        reportTitle = "CloudSpire Report",
        dateRange = "",
        costSummary = {},
        teamBreakdown = [],
        serviceBreakdown = [],
        alerts = [],
        insights = [],
    } = data;

    const now = new Date();
    const timestamp = now.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    });

    // ---- Cost Summary Cards -------------------------------------------
    const summaryItems = [
        { label: "Total Cost",       value: costSummary.totalCost      || "—", color: "#6366f1" },
        { label: "Month-over-Month", value: costSummary.monthOverMonth || "—", color: costSummary.monthOverMonth?.startsWith("+") ? "#ef4444" : "#22c55e" },
        { label: "Forecasted",       value: costSummary.forecasted     || "—", color: "#f59e0b" },
        { label: "Total Savings",    value: costSummary.totalSavings   || "—", color: "#22c55e" },
    ];

    const summaryCardsHTML = summaryItems
        .map(
            (s) => `
            <div class="card">
                <span class="card-label">${esc(s.label)}</span>
                <span class="card-value" style="color:${s.color}">${esc(s.value)}</span>
            </div>`
        )
        .join("");

    // ---- Team Breakdown Table -----------------------------------------
    const teamRowsHTML = teamBreakdown
        .map(
            (t) => `
            <tr>
                <td>${esc(t.team)}</td>
                <td>${esc(t.budget)}</td>
                <td>${esc(t.actual)}</td>
                <td class="${varianceClass(t.variance)}">${esc(t.variance)}</td>
                <td><span class="badge ${statusClass(t.status)}">${esc(t.status)}</span></td>
            </tr>`
        )
        .join("");

    // ---- Service Breakdown Table --------------------------------------
    const serviceRowsHTML = serviceBreakdown
        .map(
            (s) => `
            <tr>
                <td>${esc(s.service)}</td>
                <td>${esc(s.provider)}</td>
                <td>${esc(s.cost)}</td>
                <td>${esc(s.percent)}</td>
                <td class="${trendClass(s.trend)}">${esc(s.trend)}</td>
            </tr>`
        )
        .join("");

    // ---- Alerts Summary -----------------------------------------------
    const alertRowsHTML = alerts
        .map(
            (a) => `
            <tr>
                <td><span class="badge ${severityClass(a.severity)}">${esc(a.severity)}</span></td>
                <td>${esc(a.message)}</td>
                <td class="mono">${esc(a.resource)}</td>
                <td>${esc(a.date)}</td>
            </tr>`
        )
        .join("");

    // ---- Insights Section ---------------------------------------------
    const insightsHTML = insights
        .map((text) => `<li>${esc(text)}</li>`)
        .join("");

    // ---- Full HTML Document -------------------------------------------
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
/* ================================================================
   CloudSpire PDF Report — Minimal, A4-friendly stylesheet
   ================================================================ */

/* ---- Reset ---- */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif;
    font-size: 12px;
    color: #1e293b;
    background: #fff;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

/* ---- Page header ---- */
.report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #6366f1;
    padding-bottom: 14px;
    margin-bottom: 24px;
}
.report-header .brand h1 {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.3px;
}
.report-header .brand h1 span { color: #6366f1; }
.report-header .brand .subtitle {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
}
.report-header .meta {
    text-align: right;
    font-size: 10px;
    color: #64748b;
    line-height: 1.7;
}

/* ---- Section titles ---- */
.section-title {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin: 28px 0 10px;
    padding-bottom: 5px;
    border-bottom: 2px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

/* ---- Summary cards ---- */
.summary-grid {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
}
.card {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
}
.card-label {
    display: block;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 3px;
}
.card-value {
    display: block;
    font-size: 20px;
    font-weight: 700;
}

/* ---- Tables ---- */
table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 11px;
}
thead tr { background: #6366f1; color: #fff; }
th {
    padding: 7px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}
td {
    padding: 7px 10px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
}
tbody tr:nth-child(even) { background: #f8fafc; }
.mono { font-family: 'Cascadia Code', 'Consolas', monospace; font-size: 10px; }

/* ---- Badges ---- */
.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}
.badge-green  { background: #dcfce7; color: #15803d; }
.badge-yellow { background: #fef9c3; color: #a16207; }
.badge-red    { background: #fee2e2; color: #b91c1c; }
.badge-gray   { background: #f1f5f9; color: #475569; }

/* ---- Variance / Trend colors ---- */
.text-green  { color: #16a34a; font-weight: 600; }
.text-red    { color: #dc2626; font-weight: 600; }
.text-muted  { color: #64748b; }

/* ---- Insights list ---- */
.insights-list {
    list-style: none;
    padding: 0;
}
.insights-list li {
    position: relative;
    padding: 6px 0 6px 18px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 11px;
    line-height: 1.5;
}
.insights-list li::before {
    content: "▸";
    position: absolute;
    left: 0;
    color: #6366f1;
    font-weight: 700;
}

/* ---- Footer ---- */
.report-footer {
    margin-top: 32px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 9px;
    color: #94a3b8;
}

/* ---- Print helpers ---- */
.page-break { page-break-before: always; }
.no-break   { page-break-inside: avoid; }
</style>
</head>
<body>

    <!-- ============================================================
         HEADER
         ============================================================ -->
    <div class="report-header">
        <div class="brand">
            <h1>Cloud<span>Spire</span> Report</h1>
            <div class="subtitle">${dateRange ? esc(dateRange) : "Cloud Cost &amp; Operations Summary"}</div>
        </div>
        <div class="meta">
            Generated: ${esc(timestamp)}<br/>
            Format: PDF / A4
        </div>
    </div>

    <!-- ============================================================
         1. TOTAL COST SUMMARY
         ============================================================ -->
    <div class="section-title">Cost Summary</div>
    <div class="summary-grid no-break">
        ${summaryCardsHTML}
    </div>

    <!-- ============================================================
         2. TEAM-WISE BREAKDOWN
         ============================================================ -->
    ${teamBreakdown.length ? `
    <div class="section-title">Team-wise Breakdown</div>
    <table class="no-break">
        <thead>
            <tr>
                <th>Team</th>
                <th>Budget</th>
                <th>Actual</th>
                <th>Variance</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>${teamRowsHTML}</tbody>
    </table>` : ""}

    <!-- ============================================================
         3. SERVICE BREAKDOWN
         ============================================================ -->
    ${serviceBreakdown.length ? `
    <div class="section-title">Service Breakdown</div>
    <table class="no-break">
        <thead>
            <tr>
                <th>Service</th>
                <th>Provider</th>
                <th>Cost</th>
                <th>% of Total</th>
                <th>Trend</th>
            </tr>
        </thead>
        <tbody>${serviceRowsHTML}</tbody>
    </table>` : ""}

    <!-- ============================================================
         4. ALERTS SUMMARY
         ============================================================ -->
    ${alerts.length ? `
    <div class="section-title">Alerts Summary</div>
    <table class="no-break">
        <thead>
            <tr>
                <th>Severity</th>
                <th>Alert</th>
                <th>Resource</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>${alertRowsHTML}</tbody>
    </table>` : ""}

    <!-- ============================================================
         5. INSIGHTS
         ============================================================ -->
    ${insights.length ? `
    <div class="section-title">Insights &amp; Recommendations</div>
    <ul class="insights-list no-break">
        ${insightsHTML}
    </ul>` : ""}

    <!-- ============================================================
         FOOTER
         ============================================================ -->
    <div class="report-footer">
        CloudSpire &bull; Confidential &bull; ${esc(timestamp)}
    </div>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** HTML entity escaping. */
function esc(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/** Determines CSS class for variance values (negative = good / green). */
function varianceClass(v) {
    if (!v) return "text-muted";
    return v.startsWith("-") ? "text-green" : v === "0%" || v === "$0" ? "text-muted" : "text-red";
}

/** Determines CSS class for trend arrows / text. */
function trendClass(t) {
    if (!t) return "text-muted";
    const lower = t.toLowerCase();
    if (lower.includes("down") || lower.startsWith("-")) return "text-green";
    if (lower.includes("up") || lower.startsWith("+")) return "text-red";
    return "text-muted";
}

/** Maps status string to badge color class. */
function statusClass(s) {
    if (!s) return "badge-gray";
    const lower = s.toLowerCase();
    if (lower === "on track" || lower === "under budget") return "badge-green";
    if (lower === "warning" || lower === "at risk") return "badge-yellow";
    if (lower === "over budget" || lower === "critical") return "badge-red";
    return "badge-gray";
}

/** Maps severity string to badge color class. */
function severityClass(s) {
    if (!s) return "badge-gray";
    const lower = s.toLowerCase();
    if (lower === "critical" || lower === "high") return "badge-red";
    if (lower === "medium" || lower === "warning") return "badge-yellow";
    if (lower === "low" || lower === "info") return "badge-green";
    return "badge-gray";
}

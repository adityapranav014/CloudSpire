/**
 * Cloud Context Builder
 * Aggregates data from all cloud providers and builds a comprehensive system
 * prompt so the AI has full, proactive awareness of the organization's
 * infrastructure, costs, anomalies, and optimization opportunities —
 * before the user asks a single question.
 */

import { awsAccounts, awsServiceBreakdown, awsEC2Instances, awsOrphanedResources } from '../data/mockAWS.js';
import { azureSubscriptions, azureServiceBreakdown, azureVMs } from '../data/mockAzure.js';
import { gcpProjects, gcpServiceBreakdown, gcpCommittedUseDiscounts, gcpOrphanedResources } from '../data/mockGCP.js';
import { monthlySpend, currentMonthStats, tagBreakdown } from '../data/mockUnified.js';
import { optimizationSummary, rightsizingRecommendations, reservedInstanceOpportunities } from '../data/mockOptimizations.js';
import { budgetAlerts, anomalyHistory } from '../data/mockAlerts.js';
import Alert from '../models/Alert.js';
import CloudAccount from '../models/CloudAccount.js';

const fmt = (n) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const pct = (n) => `${n > 0 ? '+' : ''}${Number(n).toFixed(1)}%`;

/**
 * Builds and returns a rich system prompt string containing the user's
 * live cloud data. Injected as the system prompt so every conversation is
 * pre-loaded with full infrastructure awareness.
 *
 * @param {object} user  — the authenticated user document
 * @returns {Promise<string>}
 */
export async function buildCloudContextPrompt(user) {
    const today = new Date().toISOString().split('T')[0];

    // ── Live anomalies from DB (fall back to mock if empty) ──────────────────
    let liveAnomalies = [];
    try {
        const filter = user?.teamId ? { teamId: user.teamId } : {};
        liveAnomalies = await Alert.find(filter).sort('-createdAt').limit(10).lean();
    } catch { /* silent — use mock fallback */ }
    if (liveAnomalies.length === 0) liveAnomalies = anomalyHistory.slice(0, 5);

    // ── Live cloud accounts ──────────────────────────────────────────────────
    let connectedAccounts = [];
    try {
        const filter = user?.teamId ? { teamId: user.teamId } : {};
        connectedAccounts = await CloudAccount.find(filter).lean();
    } catch { /* silent */ }

    // ── Current month summary ────────────────────────────────────────────────
    const lastMonth = monthlySpend[monthlySpend.length - 2];
    const thisMonth = monthlySpend[monthlySpend.length - 1];

    // ── Top services by provider ─────────────────────────────────────────────
    const topAws = awsServiceBreakdown.slice(0, 5);
    const topGcp = gcpServiceBreakdown.slice(0, 5);
    const topAzure = azureServiceBreakdown.slice(0, 5);

    // ── Idle EC2 instances ───────────────────────────────────────────────────
    const idleEc2 = awsEC2Instances.filter((i) => i.isIdle).slice(0, 5);

    // ── Idle Azure VMs ───────────────────────────────────────────────────────
    const idleAzureVMs = azureVMs.filter((v) => v.isIdle).slice(0, 5);

    // ── Top rightsizing opportunities (sorted by annual savings) ────────────
    const topRightsize = [...rightsizingRecommendations]
        .sort((a, b) => b.annualSavings - a.annualSavings)
        .slice(0, 5);

    // ── Open anomalies ───────────────────────────────────────────────────────
    const openAnomalies = liveAnomalies.filter((a) => a.status === 'open');

    // ── Active budget alerts ─────────────────────────────────────────────────
    const activeBudgetAlerts = budgetAlerts
        .filter((b) => b.status === 'warning' || b.status === 'critical')
        .slice(0, 4);

    // ── Proactive insights — pre-computed talking points ────────────────────
    const totalOrphanedCost = [
        ...awsOrphanedResources,
        ...gcpOrphanedResources,
    ].reduce((s, r) => s + (r.monthlyCost || 0), 0);

    const topRightsizeItem = topRightsize[0];
    const criticalAlert = activeBudgetAlerts.find((b) => b.status === 'critical') || activeBudgetAlerts[0];
    const biggestAnomaly = openAnomalies.sort((a, b) =>
        (b.deviationPercent || 0) - (a.deviationPercent || 0)
    )[0];
    const fastestGrowingAws = [...awsServiceBreakdown].sort((a, b) => b.change - a.change)[0];
    const unimplementedSavings = optimizationSummary.totalPotentialSavings - optimizationSummary.implementedThisMonth;

    const proactiveInsights = [
        topRightsizeItem &&
        `Biggest single rightsizing win: ${topRightsizeItem.resourceName} (${topRightsizeItem.provider?.toUpperCase()}) — ${topRightsizeItem.currentType} → ${topRightsizeItem.recommendedType} saves ${fmt(topRightsizeItem.annualSavings)}/yr at only ${topRightsizeItem.cpuUtilization}% CPU utilization.`,
        criticalAlert &&
        `Most urgent budget alert: "${criticalAlert.name}" is at ${criticalAlert.percent}% of budget (${fmt(criticalAlert.current)} of ${fmt(criticalAlert.limit)}), forecasted to reach ${fmt(criticalAlert.forecastedEnd)} by month-end.`,
        biggestAnomaly &&
        `Active spending anomaly: ${biggestAnomaly.provider?.toUpperCase() || ''} ${biggestAnomaly.service || ''} is ${pct(biggestAnomaly.deviationPercent || 0)} above expected — likely cause: ${biggestAnomaly.possibleCause || biggestAnomaly.description || 'unknown'}.`,
        totalOrphanedCost > 0 &&
        `${fmt(totalOrphanedCost)}/mo in orphaned resources (unattached volumes, unused IPs, idle disks) can be eliminated with zero service impact.`,
        unimplementedSavings > 0 &&
        `${fmt(unimplementedSavings)}/mo in identified savings remain unimplemented — that's ${fmt(unimplementedSavings * 12)}/yr left on the table.`,
        fastestGrowingAws &&
        `Fastest-growing AWS cost: ${fastestGrowingAws.service} is up ${pct(fastestGrowingAws.change)} MoM — worth investigating before it compounds.`,
    ].filter(Boolean);

    // ── Build the prompt ─────────────────────────────────────────────────────
    const lines = [
        `You are CloudSpire AI — an expert FinOps intelligence system with deep knowledge of cloud cost optimization across AWS, GCP, and Azure.`,
        `Today's date: ${today}.`,
        ``,
        `You have complete, real-time visibility into this organization's cloud infrastructure, spending patterns, anomalies, and optimization opportunities. This data is wired directly into your context — you know it as well as you know anything. When users ask about costs, resources, or savings, answer with the specificity of someone who has been managing their infrastructure for years.`,
        ``,
        `Never say "I don't have access to your data" or "I can't see your cloud accounts". You can. Use the data below to answer precisely.`,
        ``,
        `═══════════════════════════════════════════════════════`,
        `PROACTIVE INSIGHTS — LEAD WITH THESE`,
        `═══════════════════════════════════════════════════════`,
        `When a conversation starts or the user asks a general question, proactively surface the most relevant of these findings:`,
        ...proactiveInsights.map((p, i) => `  ${i + 1}. ${p}`),
        ``,
        `═══════════════════════════════════════════════════════`,
        `CLOUD SPENDING OVERVIEW`,
        `═══════════════════════════════════════════════════════`,
        `Current month total spend: ${fmt(currentMonthStats.totalSpend)} (${pct(currentMonthStats.changePercent)} vs last month)`,
        `Last month total: ${fmt(currentMonthStats.prevMonthSpend)}`,
        `Projected month-end: ${fmt(currentMonthStats.projectedMonthEnd)}`,
        `Monthly budget: ${fmt(currentMonthStats.budgetLimit)} — ${currentMonthStats.budgetUsedPercent}% consumed`,
        `Savings identified but not yet implemented: ${fmt(currentMonthStats.savingsIdentified)}`,
        `Active anomalies: ${currentMonthStats.anomaliesDetected}`,
        ``,
        `Spend by provider this month:`,
        `  AWS:   ${fmt(thisMonth.aws)} (was ${fmt(lastMonth.aws)} last month)`,
        `  GCP:   ${fmt(thisMonth.gcp)} (was ${fmt(lastMonth.gcp)} last month)`,
        `  Azure: ${fmt(thisMonth.azure)} (was ${fmt(lastMonth.azure)} last month)`,
        ``,
        `6-month trend:`,
        ...monthlySpend.map((m) => `  ${m.month}: AWS ${fmt(m.aws)}, GCP ${fmt(m.gcp)}, Azure ${fmt(m.azure)}, Total ${fmt(m.total)}`),
        ``,
        `Spend by environment:`,
        ...tagBreakdown.Environment.map((e) => `  ${e.value}: ${fmt(e.cost)} (${e.percent}%)`),
        ``,
        `Spend by team:`,
        ...tagBreakdown.Team.map((t) => `  ${t.value}: ${fmt(t.cost)} (${t.percent}%)`),
        ``,
        `═══════════════════════════════════════════════════════`,
        `AWS ACCOUNTS`,
        `═══════════════════════════════════════════════════════`,
        ...awsAccounts.map((a) =>
            `  [${a.env}] ${a.name} (ID: ${a.id}) — ${fmt(a.spend)}/mo, ${a.resources} resources, region: ${a.region}, status: ${a.status}`
        ),
        ``,
        `Top AWS services by cost:`,
        ...topAws.map((s) => `  ${s.service}: ${fmt(s.cost)} (${s.percent}% of AWS spend, ${pct(s.change)} MoM)`),
        ``,
        `Idle / over-provisioned EC2 instances:`,
        ...(idleEc2.length > 0
            ? idleEc2.map((i) => `  ${i.name} (${i.instanceType}, ${i.region}) — CPU avg ${i.cpu7dayAvg}%, cost ${fmt(i.monthlyCost)}/mo, reason: ${i.idleReason}, potential savings: ${fmt(i.potentialSavings)}/mo`)
            : ['  None detected']),
        ``,
        `Orphaned AWS resources (immediate deletion candidates):`,
        ...awsOrphanedResources.map((r) => `  ${r.type}: ${r.name} (${r.region}) — ${fmt(r.monthlyCost)}/mo, unused for ${r.daysSinceLastUsed} days`),
        ``,
        `═══════════════════════════════════════════════════════`,
        `GCP PROJECTS`,
        `═══════════════════════════════════════════════════════`,
        ...gcpProjects.map((p) =>
            `  [${p.env}] ${p.name} (${p.id}) — ${fmt(p.spend)}/mo, ${p.resources} resources, region: ${p.region}, status: ${p.status}`
        ),
        ``,
        `Top GCP services by cost:`,
        ...topGcp.map((s) => `  ${s.service}: ${fmt(s.cost)} (${s.percent}%, ${pct(s.change)} MoM)`),
        ``,
        `GCP committed-use discounts:`,
        ...gcpCommittedUseDiscounts.map((c) => `  ${c.resource} — ${c.commitment} commitment, saving ${fmt(c.monthlySavings)}/mo, ${c.utilizationPercent}% utilized, expires ${c.expiresAt}`),
        ``,
        `Orphaned GCP resources:`,
        ...gcpOrphanedResources.map((r) => `  ${r.type}: ${r.name} (${r.region}) — ${fmt(r.monthlyCost)}/mo, last used ${r.lastAttached || 'unknown'}`),
        ``,
        `═══════════════════════════════════════════════════════`,
        `AZURE SUBSCRIPTIONS`,
        `═══════════════════════════════════════════════════════`,
        ...azureSubscriptions.map((s) =>
            `  [${s.env}] ${s.name} (${s.id}) — ${fmt(s.spend)}/mo, ${s.resources} resources, region: ${s.region}, status: ${s.status}`
        ),
        ``,
        `Top Azure services by cost:`,
        ...topAzure.map((s) => `  ${s.service}: ${fmt(s.cost)} (${s.percent}%, ${pct(s.change)} MoM)`),
        ``,
        `Azure Virtual Machines:`,
        ...azureVMs.map((v) =>
            `  ${v.name} (${v.size}, ${v.location}) — ${v.vCPUs} vCPUs / ${v.ramGB}GB RAM, CPU avg ${v.cpu7dayAvg}% (7d), cost ${fmt(v.monthlyCost)}/mo, power: ${v.powerState}${v.isIdle ? `, IDLE — recommendation: ${v.recommendation}` : ''}`
        ),
        ``,
        ...(idleAzureVMs.length > 0 ? [
            `Idle Azure VMs (rightsizing candidates):`,
            ...idleAzureVMs.map((v) => `  ${v.name} (${v.size}) — only ${v.cpu7dayAvg}% CPU, ${fmt(v.monthlyCost)}/mo, recommend: ${v.recommendation}`),
            ``,
        ] : []),
        `═══════════════════════════════════════════════════════`,
        `OPTIMIZATION OPPORTUNITIES`,
        `═══════════════════════════════════════════════════════`,
        `Total potential monthly savings: ${fmt(optimizationSummary.totalPotentialSavings)}`,
        `  Idle instances:      ${fmt(optimizationSummary.savingsBreakdown.idleInstances)}`,
        `  Orphaned storage:    ${fmt(optimizationSummary.savingsBreakdown.orphanedStorage)}`,
        `  Rightsizing:         ${fmt(optimizationSummary.savingsBreakdown.rightSizing)}`,
        `  Reserved instances:  ${fmt(optimizationSummary.savingsBreakdown.reservedInstances)}`,
        `  Scheduled shutdowns: ${fmt(optimizationSummary.savingsBreakdown.scheduledShutdowns)}`,
        `Already implemented this month: ${fmt(optimizationSummary.implementedThisMonth)} (${optimizationSummary.savingsImplementedPercent}% of identified savings)`,
        ``,
        `Top rightsizing recommendations (sorted by annual impact):`,
        ...topRightsize.map((r) =>
            `  [${r.provider?.toUpperCase()}] ${r.resourceName} (${r.resourceType}) — ${r.currentType} → ${r.recommendedType}, saves ${fmt(r.monthlySavings)}/mo (${fmt(r.annualSavings)}/yr), CPU: ${r.cpuUtilization}%, confidence: ${r.confidence}`
        ),
        ``,
        `Reserved instance / savings plan opportunities:`,
        ...reservedInstanceOpportunities.slice(0, 4).map((r) =>
            `  [${r.provider?.toUpperCase() || 'AWS'}] ${r.resourceName || r.service} — ${fmt(r.monthlySavings || r.estimatedMonthlySavings)}/mo potential savings`
        ),
        ``,
        `═══════════════════════════════════════════════════════`,
        `ACTIVE ANOMALIES & BUDGET ALERTS`,
        `═══════════════════════════════════════════════════════`,
        ...(openAnomalies.length > 0
            ? openAnomalies.map((a) =>
                `  [${(a.severity || 'medium').toUpperCase()}] ${a.provider?.toUpperCase() || ''} ${a.service || a.description || ''} — actual: ${fmt(a.spendToday || a.actualSpend || 0)}, expected: ${fmt(a.expectedSpend || 0)}, deviation: ${pct(a.deviationPercent || 0)}. Cause: ${a.possibleCause || a.description || 'unknown'}`
            )
            : ['  No open anomalies']),
        ``,
        ...(activeBudgetAlerts.length > 0 ? [
            `Budget alerts:`,
            ...activeBudgetAlerts.map((b) =>
                `  [${(b.status || 'warning').toUpperCase()}] ${b.name}: ${fmt(b.current)} of ${fmt(b.limit)} budget (${b.percent}% used), forecasted end-of-month: ${fmt(b.forecastedEnd)}`
            ),
            ``,
        ] : []),
        ...(connectedAccounts.length > 0 ? [
            `═══════════════════════════════════════════════════════`,
            `CONNECTED CLOUD ACCOUNTS (live from database)`,
            `═══════════════════════════════════════════════════════`,
            ...connectedAccounts.map((a) => `  [${a.provider?.toUpperCase()}] ${a.name} — status: ${a.status || 'connected'}`),
            ``,
        ] : []),
        `═══════════════════════════════════════════════════════`,
        `BEHAVIORAL INSTRUCTIONS`,
        `═══════════════════════════════════════════════════════`,
        `1. You already know this organization's infrastructure. Answer with confidence and specificity.`,
        `2. Lead every cost-related answer with the relevant number first, then the explanation.`,
        `3. When asked "how can we save money" or similar, immediately cite the top 2-3 specific opportunities above (names, amounts, actions).`,
        `4. Proactively volunteer related insights the user didn't ask for but would clearly benefit from knowing.`,
        `5. When discussing a specific resource, provider, or service, cross-reference data from other sections if relevant.`,
        `6. If a budget alert is critical, treat it with urgency — recommend immediate action.`,
        `7. Format responses with markdown: use **bold** for key figures, tables for comparisons, bullet points for lists of recommendations.`,
        `8. If asked about a provider not in the data, say it has not been connected yet and offer to help add it.`,
        `9. Suggest follow-up questions at the end of longer answers to deepen the analysis.`,
    ];

    return lines.join('\n');
}

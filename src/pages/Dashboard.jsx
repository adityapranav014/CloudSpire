import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Zap,
  AlertTriangle, ArrowRight, Download, ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import MetricCard from '../components/ui/MetricCard'
import AreaSpendChart from '../components/charts/AreaSpendChart'
import DonutAllocationChart from '../components/charts/DonutAllocationChart'
import BarBreakdownChart from '../components/charts/BarBreakdownChart'
import ProviderBadge from '../components/ui/ProviderBadge'
import TrendBadge from '../components/ui/TrendBadge'
import SeverityBadge from '../components/ui/SeverityBadge'
import { currentMonthStats, dailySpend } from '../data/mockUnified'
import { awsServiceBreakdown } from '../data/mockAWS'
import { gcpServiceBreakdown } from '../data/mockGCP'
import { azureServiceBreakdown } from '../data/mockAzure'
import { anomalies, budgetAlerts } from '../data/mockAlerts'
import { rightsizingRecommendations, optimizationSummary } from '../data/mockOptimizations'

const fmt    = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtAge = (iso) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000)
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}

const now        = new Date()
const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
const dayLabel   = `${now.toLocaleString('en-US', { month: 'short' })} 1\u2013${now.getDate()}, ${now.getFullYear()}`

const PROVIDERS = [
  { provider: 'aws',   name: 'Amazon Web Services', spend: 82400, change: 8.2,  accounts: 4, unit: 'accounts',      color: '#FF9900' },
  { provider: 'gcp',   name: 'Google Cloud',         spend: 39100, change: 12.4, accounts: 4, unit: 'projects',       color: '#4285F4' },
  { provider: 'azure', name: 'Microsoft Azure',      spend: 27900, change: 6.8,  accounts: 3, unit: 'subscriptions', color: '#0078D4' },
]
const TOTAL_SPEND = PROVIDERS.reduce((s, p) => s + p.spend, 0)

const topServices = [
  ...awsServiceBreakdown.slice(0, 4),
  ...gcpServiceBreakdown.slice(0, 3),
  ...azureServiceBreakdown.slice(0, 3),
].sort((a, b) => b.cost - a.cost)
  .slice(0, 8)
  .map(s => ({ service: s.service, cost: s.cost, percent: +(s.cost / 149400 * 100).toFixed(1) }))

const topRegions = [
  { label: 'N. Virginia', cost: 41200, provider: 'aws' },
  { label: 'Iowa (GCP)',  cost: 22800, provider: 'gcp' },
  { label: 'US West',     cost: 18600, provider: 'aws' },
  { label: 'East US',     cost: 16800, provider: 'azure' },
  { label: 'EU Ireland',  cost: 11400, provider: 'aws' },
]

const sparkData = dailySpend.slice(-14).map(d => ({
  ...d,
  savings:    d.total * 0.05 + Math.random() * 500,
  budgetLine: d.total * 1.1  - Math.random() * 200,
}))

const stagger = { animate: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-bold tracking-widest uppercase shrink-0" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
    </div>
  )
}

function CardHeader({ icon: Icon, iconBg, iconColor, title, badge, badgeBg, badgeColor, aside }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          <Icon size={13} style={{ color: iconColor }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
        {badge && (
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none" style={{ background: badgeBg, color: badgeColor }}>
            {badge}
          </span>
        )}
      </div>
      {aside && <div>{aside}</div>}
    </div>
  )
}

function CardFooterLink({ to, label }) {
  return (
    <Link
      to={to}
      className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-medium group"
      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
    >
      <span>{label}</span>
      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--accent-cyan)' }} />
    </Link>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-2.5 w-32 rounded-full" style={{ background: 'var(--bg-hover)' }} />
            <div className="h-7 w-48 rounded-lg" style={{ background: 'var(--bg-hover)' }} />
            <div className="h-2.5 w-56 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
          </div>
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-20 rounded-lg" style={{ background: 'var(--bg-hover)' }} />
            <div className="h-8 w-28 rounded-lg" style={{ background: 'var(--bg-hover)' }} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-36 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-28 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }} />
          ))}
        </div>
        <div className="h-80 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <div key={i} className="h-64 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }} />
          ))}
        </div>
      </div>
    )
  }

  const openAlerts      = anomalies.filter(a => a.status === 'open')
  const criticalBudgets = budgetAlerts.filter(b => b.status === 'critical').length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-6 lg:p-8"
    >
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Live · Last synced 2 min ago</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Cost Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {dayLabel} · {PROVIDERS.length} cloud providers
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <Link
            to="/reports"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-[--bg-hover]"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <Download size={13} /> Export
          </Link>
          <Link
            to="/cost-explorer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
          >
            Deep Dive <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          {
            // Spend up = bad for cost cards
            title: 'Total Spend',
            value: fmt.format(currentMonthStats.totalSpend),
            subtitle: monthLabel,
            trend: 'up',
            trendValue: `+${currentMonthStats.changePercent}% MoM`,
            icon: DollarSign,
            accentColor: '#F59E0B',
            upIsGood: false,
            sparklineKey: 'total',
          },
          {
            // Delta vs prior month — up = overspending = bad
            title: 'vs Last Month',
            value: `${currentMonthStats.totalSpend - currentMonthStats.prevMonthSpend >= 0 ? '+' : ''}${fmt.format(currentMonthStats.totalSpend - currentMonthStats.prevMonthSpend)}`,
            subtitle: `prev: ${fmt.format(currentMonthStats.prevMonthSpend)}`,
            trend: currentMonthStats.changePercent > 0 ? 'up' : 'down',
            trendValue: `${currentMonthStats.changePercent > 0 ? '+' : ''}${currentMonthStats.changePercent}%`,
            icon: currentMonthStats.changePercent > 0 ? TrendingUp : TrendingDown,
            accentColor: currentMonthStats.changePercent > 0 ? '#F43F5E' : '#10B981',
            upIsGood: false,
            sparklineKey: 'total',
          },
          {
            // Budget utilisation — amber warning at 83%
            title: 'Month-End Forecast',
            value: fmt.format(currentMonthStats.projectedMonthEnd),
            subtitle: `${currentMonthStats.budgetUsedPercent}% of budget consumed`,
            trend: 'warning',
            trendValue: 'Approaching limit',
            icon: Calendar,
            accentColor: '#F59E0B',
            sparklineKey: 'budgetLine',
          },
          {
            // Savings are always positive — more = better
            title: 'Savings Identified',
            value: fmt.format(currentMonthStats.savingsIdentified),
            subtitle: 'Apply in Optimizer',
            trend: 'neutral',
            trendValue: `${fmt.format(optimizationSummary.totalPotentialSavings)} available`,
            icon: Zap,
            accentColor: '#10B981',
            sparklineKey: 'savings',
          },
        ].map((props, i) => (
          <motion.div key={i} variants={fadeUp}>
            <MetricCard {...props} sparklineData={sparkData} />
          </motion.div>
        ))}
      </motion.div>

      {/* Provider Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {PROVIDERS.map((p, i) => {
          const pct = ((p.spend / TOTAL_SPEND) * 100).toFixed(0)
          return (
            <motion.div
              key={p.provider}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="rounded-xl border p-5"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                borderLeftWidth: 3,
                borderLeftColor: p.color,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <ProviderBadge provider={p.provider} size="md" />
                <TrendBadge value={p.change} invertColors />
              </div>
              <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{p.name}</p>
              <p
                className="text-xl font-bold mb-2"
                style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                {fmt.format(p.spend)}
              </p>
              <div className="w-full h-1 rounded-full mb-2" style={{ background: 'var(--bg-elevated)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: p.color, opacity: 0.75 }}
                />
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {p.accounts} {p.unit}
                </span>
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ background: `${p.color}18`, color: p.color }}
                >
                  {pct}% of total
                </span>
              </div>
              <Link
                to="/accounts"
                className="text-xs font-medium flex items-center gap-1 transition-all hover:gap-1.5"
                style={{ color: 'var(--accent-cyan)' }}
              >
                View accounts <ChevronRight size={11} />
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Spend Trend */}
      <div className="mb-6"><AreaSpendChart /></div>

      {/* Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <DonutAllocationChart data={topServices} title="Cost by Service" />
        <BarBreakdownChart data={topRegions} title="Top Regions by Spend" />
      </div>

      {/* Active Intelligence */}
      <SectionDivider label="Active Intelligence" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Alerts */}
        <div className="rounded-xl border p-5 flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          <CardHeader
            icon={AlertTriangle}
            iconBg="rgba(244,63,94,0.1)"
            iconColor="var(--accent-rose)"
            title="Active Alerts"
            badge={`${openAlerts.length} open`}
            badgeBg="rgba(244,63,94,0.12)"
            badgeColor="var(--accent-rose)"
          />
          <div className="space-y-2.5 flex-1">
            {openAlerts.slice(0, 3).map(a => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <SeverityBadge severity={a.severity} />
                    <ProviderBadge provider={a.provider} size="sm" />
                  </div>
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.service}</p>
                  <p className="text-[11px]" style={{ color: 'var(--accent-rose)' }}>+{a.deviationPercent}% deviation</p>
                </div>
                <span className="text-[10px] shrink-0 mt-0.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {fmtAge(a.detectedAt)}
                </span>
              </div>
            ))}
          </div>
          <CardFooterLink to="/anomalies" label={`View all ${anomalies.length} alerts`} />
        </div>

        {/* Top Savings */}
        <div className="rounded-xl border p-5 flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          <CardHeader
            icon={Zap}
            iconBg="rgba(16,185,129,0.1)"
            iconColor="var(--accent-emerald)"
            title="Top Savings"
            aside={
              <span
                className="text-xs font-bold tabular-nums"
                style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                {fmt.format(optimizationSummary.totalPotentialSavings)}/mo
              </span>
            }
          />
          <div className="space-y-2.5 flex-1">
            {rightsizingRecommendations.slice(0, 3).map(r => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
              >
                <ProviderBadge provider={r.provider} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.resourceName}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.currentType} \u2192 {r.recommendedType}</p>
                </div>
                <span
                  className="text-xs font-bold shrink-0 tabular-nums"
                  style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  -{fmt.format(r.monthlySavings)}/mo
                </span>
              </div>
            ))}
          </div>
          <CardFooterLink to="/optimizer" label="Open Optimizer" />
        </div>

        {/* Budget Health */}
        <div className="rounded-xl border p-5 flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          <CardHeader
            icon={Calendar}
            iconBg="rgba(6,182,212,0.1)"
            iconColor="var(--accent-cyan)"
            title="Budget Health"
            badge={criticalBudgets > 0 ? `${criticalBudgets} critical` : undefined}
            badgeBg="rgba(244,63,94,0.12)"
            badgeColor="var(--accent-rose)"
          />
          <div className="space-y-4 flex-1">
            {budgetAlerts.map(b => {
              const color =
                b.status === 'critical' ? 'var(--accent-rose)'
                : b.status === 'warning' ? 'var(--accent-amber)'
                : 'var(--accent-emerald)'
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{b.name}</span>
                    <span
                      className="text-xs font-bold ml-2 shrink-0 tabular-nums"
                      style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {b.percent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(b.percent, 100)}%`, background: color }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{fmt.format(b.current)}</span>
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>of {fmt.format(b.limit)}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <CardFooterLink to="/accounts" label="Manage budgets" />
        </div>

      </div>
    </motion.div>
  )
}

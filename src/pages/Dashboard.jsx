import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, Calendar, Zap, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import MetricCard from '../components/ui/MetricCard'
import AreaSpendChart from '../components/charts/AreaSpendChart'
import DonutAllocationChart from '../components/charts/DonutAllocationChart'
import BarBreakdownChart from '../components/charts/BarBreakdownChart'
import ProviderBadge from '../components/ui/ProviderBadge'
import TrendBadge from '../components/ui/TrendBadge'
import SeverityBadge from '../components/ui/SeverityBadge'
import { currentMonthStats, dailySpend } from '../data/mockUnified'
import { awsServiceBreakdown, awsRegionBreakdown } from '../data/mockAWS'
import { gcpServiceBreakdown } from '../data/mockGCP'
import { azureServiceBreakdown } from '../data/mockAzure'
import { anomalies, budgetAlerts } from '../data/mockAlerts'
import { rightsizingRecommendations, optimizationSummary } from '../data/mockOptimizations'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtTime = (iso) => {
  const d = new Date(iso)
  const diff = Math.round((Date.now() - d.getTime()) / 3600000)
  return diff < 24 ? `${diff}h ago` : `${Math.round(diff / 24)}d ago`
}

// Merge top services from all providers
const topServices = [
  ...awsServiceBreakdown.slice(0, 4),
  ...gcpServiceBreakdown.slice(0, 3),
  ...azureServiceBreakdown.slice(0, 3),
]
  .sort((a, b) => b.cost - a.cost)
  .slice(0, 8)
  .map(s => ({ service: s.service, cost: s.cost, percent: +(s.cost / 149400 * 100).toFixed(1) }))

// Top regions across providers
const topRegions = [
  { label: 'US East (N. Virginia)', cost: 41200, provider: 'aws' },
  { label: 'Iowa, USA (GCP)', cost: 22800, provider: 'gcp' },
  { label: 'US West (Oregon)', cost: 18600, provider: 'aws' },
  { label: 'East US (Virginia)', cost: 16800, provider: 'azure' },
  { label: 'Europe (Ireland)', cost: 11400, provider: 'aws' },
]

const sparkData = dailySpend.slice(-14).map(d => ({
  ...d,
  savings: d.total * 0.05 + Math.random() * 500,
  budgetLine: d.total * 1.1 - Math.random() * 200
}))

const container = {
  animate: { transition: { staggerChildren: 0.08 } },
}
const card = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

/** Hero dashboard page — KPIs, charts, alerts, optimizations, budget health */
export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded-lg mb-2"></div>
        <div className="h-4 w-64 bg-white/5 rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/5"></div>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5"></div>)}
        </div>
        <div className="h-80 bg-white/5 rounded-xl border border-white/5"></div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-7">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          April 2025 — Multi-cloud spend overview
        </p>
      </div>

      {/* KPI Cards */}
      <motion.div variants={container} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div variants={card}>
          <MetricCard
            title="Total Spend This Month"
            value={fmt.format(currentMonthStats.totalSpend)}
            subtitle="April 2025"
            trend="up"
            trendValue={`+${currentMonthStats.changePercent}%`}
            icon={DollarSign}
            accentColor="#3B82F6"
            sparklineData={sparkData}
          />
        </motion.div>
        <motion.div variants={card}>
          <MetricCard
            title="vs Last Month"
            value={`${currentMonthStats.totalSpend - currentMonthStats.prevMonthSpend >= 0 ? '+' : ''}${fmt.format(currentMonthStats.totalSpend - currentMonthStats.prevMonthSpend)}`}
            subtitle={`vs ${fmt.format(currentMonthStats.prevMonthSpend)}`}
            trend={currentMonthStats.changePercent > 0 ? 'up' : 'down'}
            trendValue={`${currentMonthStats.changePercent > 0 ? '+' : ''}${currentMonthStats.changePercent}%`}
            icon={currentMonthStats.changePercent > 0 ? TrendingUp : TrendingDown}
            accentColor={currentMonthStats.changePercent > 0 ? '#F59E0B' : '#10B981'}
            sparklineData={sparkData}
            sparklineKey="total"
          />
        </motion.div>
        <motion.div variants={card}>
          <MetricCard
            title="Forecasted Month-End"
            value={fmt.format(currentMonthStats.projectedMonthEnd)}
            subtitle={`Budget: ${currentMonthStats.budgetUsedPercent}%`}
            trend="up"
            trendValue="83% used"
            icon={Calendar}
            accentColor="#06B6D4"
            sparklineData={sparkData}
            sparklineKey="budgetLine"
          />
        </motion.div>
        <motion.div variants={card}>
          <MetricCard
            title="Savings Identified"
            value={fmt.format(currentMonthStats.savingsIdentified)}
            subtitle="Click to view"
            trend="down"
            trendValue="$18,400 found"
            icon={Zap}
            accentColor="#10B981"
            sparklineData={sparkData}
            sparklineKey="savings"
          />
        </motion.div>
      </motion.div>

      {/* Provider summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { provider: 'aws', name: 'Amazon Web Services', spend: 82400, change: 8.2, accounts: '4 accounts' },
          { provider: 'gcp', name: 'Google Cloud', spend: 39100, change: 12.4, accounts: '4 projects' },
          { provider: 'azure', name: 'Microsoft Azure', spend: 27900, change: 6.8, accounts: '3 subscriptions' },
        ].map(p => (
          <motion.div
            key={p.provider}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-xl border p-5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <ProviderBadge provider={p.provider} size="md" />
              <TrendBadge value={p.change} invertColors />
            </div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{p.name}</p>
            <p className="text-xl font-bold font-mono mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
              {fmt.format(p.spend)}
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{p.accounts}</p>
            <Link
              to="/accounts"
              className="text-xs font-medium flex items-center gap-1 transition-colors hover:gap-2"
              style={{ color: 'var(--accent-cyan)' }}
            >
              View Details <ArrowRight size={11} />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main chart */}
      <div className="mb-6">
        <AreaSpendChart />
      </div>

      {/* Middle row: donut + bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DonutAllocationChart data={topServices} title="Cost by Service" />
        <BarBreakdownChart data={topRegions} title="Top Regions by Spend" />
      </div>

      {/* Bottom row: alerts / optimizations / budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Active Alerts */}
        <div className="rounded-xl border p-5 flex flex-col justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle size={14} style={{ color: 'var(--accent-rose)' }} /> Active Alerts
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--accent-rose)' }}>
                {anomalies.filter(a => a.status === 'open').length} open
              </span>
            </div>
            <div className="space-y-3">
              {anomalies.filter(a => a.status === 'open').slice(0, 3).map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={a.severity} />
                      <ProviderBadge provider={a.provider} size="sm" />
                    </div>
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.service}</p>
                    <p className="text-xs" style={{ color: 'var(--accent-rose)' }}>+{a.deviationPercent}% deviation</p>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{fmtTime(a.detectedAt)}</span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/anomalies" className="mt-4 flex items-center gap-1 text-xs font-medium transition-colors hover:gap-2"
            style={{ color: 'var(--accent-cyan)' }}>
            See all {anomalies.length} alerts <ArrowRight size={11} />
          </Link>
        </div>

        {/* Top Optimization Wins */}
        <div className="rounded-xl border p-5 flex flex-col justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Zap size={14} style={{ color: 'var(--accent-emerald)' }} /> Top Savings
              </h3>
              <span className="text-xs font-mono font-semibold" style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt.format(optimizationSummary.totalPotentialSavings)}/mo
              </span>
            </div>
            <div className="space-y-3">
              {rightsizingRecommendations.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
                  <ProviderBadge provider={r.provider} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.resourceName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.currentType} → {r.recommendedType}</p>
                  </div>
                  <span className="text-xs font-semibold font-mono shrink-0" style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>
                    -{fmt.format(r.monthlySavings)}/mo
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/optimizer" className="mt-4 flex items-center gap-1 text-xs font-medium transition-colors hover:gap-2"
            style={{ color: 'var(--accent-cyan)' }}>
            Open Optimizer <ArrowRight size={11} />
          </Link>
        </div>

        {/* Budget Health */}
        <div className="rounded-xl border p-5 flex flex-col justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          <div>
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Budget Health</h3>
            <div className="space-y-4">
            {budgetAlerts.slice(0, 3).map(b => {
              const color = b.status === 'critical' ? '#F43F5E' : b.status === 'warning' ? '#F59E0B' : '#10B981'
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{b.name}</span>
                    <span className="text-xs font-mono ml-2 shrink-0" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
                      {b.percent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(b.percent, 100)}%`, background: color }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{fmt.format(b.current)}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{fmt.format(b.limit)}</span>
                  </div>
                </div>
              )
            })}
          </div>
          </div>
          <Link to="/accounts" className="mt-4 flex items-center gap-1 text-xs font-medium transition-colors hover:gap-2"
            style={{ color: 'var(--accent-cyan)' }}>
            Manage Budgets <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

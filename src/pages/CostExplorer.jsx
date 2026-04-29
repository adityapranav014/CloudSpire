import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Filter, ChevronUp, ChevronDown, BarChart3, AreaChart as AreaChartIcon } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import PageHeader from '../components/layout/PageHeader'
import { BrandLogo, getBrandAsset } from '../constants/brandAssets'
import ProviderBadge from '../components/ui/ProviderBadge'
import TrendBadge from '../components/ui/TrendBadge'
import { dailySpend, tagBreakdown } from '../data/mockUnified'
import { awsAccounts, awsRegionBreakdown, awsServiceBreakdown } from '../data/mockAWS'
import { gcpProjects, gcpRegionBreakdown, gcpServiceBreakdown } from '../data/mockGCP'
import { azureRegionBreakdown, azureServiceBreakdown, azureSubscriptions } from '../data/mockAzure'
import { useToast } from '../context/ToastContext'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const DATE_PRESETS = ['This Month', 'Last Month', 'Last 30d', 'Last 90d', 'Last 12m', 'Custom']
const PROVIDERS = ['AWS', 'GCP', 'Azure']
const GROUP_BY = ['Service', 'Region', 'Account', 'Team', 'Resource Type']
const CHART_MODE = ['Bar', 'Area']

const providerColors = {
  aws: '#F79009',
  gcp: '#3B82F6',
  azure: '#06B6D4',
}

const PROVIDERS_ORDER = ['aws', 'gcp', 'azure']

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="rounded-xl border p-3 text-sm shadow-2xl min-w-[180px]"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
      <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.color ?? providerColors[p.dataKey] }} />
            <BrandLogo brandKey={p.dataKey} size={13} />
            <span style={{ color: 'var(--text-secondary)' }}>{getBrandAsset(p.dataKey)?.label ?? p.dataKey.toUpperCase()}</span>
          </div>
          <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
            {fmt.format(p.value)}
          </span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="border-t mt-2 pt-2 flex justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total</span>
          <span className="font-semibold font-mono" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
            {fmt.format(total)}
          </span>
        </div>
      )}
    </div>
  )
}

const ChartLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-2 pt-3">
    {(payload ?? PROVIDERS_ORDER.map(k => ({ dataKey: k, color: providerColors[k] }))).map(p => {
      const color = p.color ?? providerColors[p.dataKey]
      const label = getBrandAsset(p.dataKey)?.label ?? p.dataKey.toUpperCase()
      return (
        <div
          key={p.dataKey}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
          style={{ borderColor: color + '40', background: color + '12', color: 'var(--text-secondary)' }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          {label}
        </div>
      )
    })}
  </div>
)

const groupedData = {
  Service: [
    { label: 'Compute', aws: 36000, gcp: 18400, azure: 15200 },
    { label: 'Storage', aws: 12800, gcp: 4100, azure: 3100 },
    { label: 'Databases', aws: 11400, gcp: 2900, azure: 5200 },
    { label: 'Containers', aws: 4800, gcp: 3800, azure: 2800 },
    { label: 'AI / ML', aws: 2400, gcp: 1300, azure: 1800 },
  ],
  Region: [
    { label: 'us-east-1', aws: 41200, gcp: 0, azure: 0 },
    { label: 'us-central1', aws: 0, gcp: 22800, azure: 0 },
    { label: 'eastus', aws: 0, gcp: 0, azure: 16800 },
    { label: 'us-west-2', aws: 18600, gcp: 0, azure: 0 },
    { label: 'westeurope', aws: 0, gcp: 0, azure: 6400 },
  ],
  Account: [
    { label: 'AWS Prod', aws: 82400, gcp: 0, azure: 0 },
    { label: 'GCP Prod', aws: 0, gcp: 39100, azure: 0 },
    { label: 'Azure Prod', aws: 0, gcp: 0, azure: 27900 },
    { label: 'AWS Staging', aws: 14200, gcp: 0, azure: 0 },
    { label: 'GCP Data', aws: 0, gcp: 12400, azure: 0 },
  ],
  Team: [
    { label: 'DevOps', aws: 16200, gcp: 12400, azure: 10800 },
    { label: 'Backend', aws: 18800, gcp: 8200, azure: 6900 },
    { label: 'Data Science', aws: 14100, gcp: 9300, azure: 5200 },
    { label: 'Frontend', aws: 9600, gcp: 2800, azure: 1800 },
    { label: 'QA', aws: 4200, gcp: 1200, azure: 900 },
  ],
  'Resource Type': [
    { label: 'VM / Compute', aws: 31200, gcp: 18400, azure: 12400 },
    { label: 'Object Storage', aws: 12800, gcp: 4100, azure: 3100 },
    { label: 'Managed DB', aws: 11400, gcp: 2900, azure: 5200 },
    { label: 'Containers', aws: 4800, gcp: 3800, azure: 2800 },
    { label: 'Serverless', aws: 8200, gcp: 1400, azure: 1400 },
  ],
}

const granularityMap = {
  Daily: 30,
  Weekly: 60,
  Monthly: 90,
}

// Build flat table rows from all services
const tableRows = [
  ...awsServiceBreakdown.map(s => ({
    date: 'Apr 2025', provider: 'aws', account: 'Production - Main',
    service: s.service, region: s.region || 'us-east-1',
    usage: '744', unit: 'Hrs', cost: s.cost, change: s.change,
  })),
  ...gcpServiceBreakdown.map(s => ({
    date: 'Apr 2025', provider: 'gcp', account: 'Production Platform',
    service: s.service, region: s.region || 'us-central1',
    usage: '730', unit: 'Hrs', cost: s.cost, change: s.change,
  })),
  ...azureServiceBreakdown.map(s => ({
    date: 'Apr 2025', provider: 'azure', account: 'Production Workloads',
    service: s.service, region: s.resourceGroup || 'eastus',
    usage: '744', unit: 'Hrs', cost: s.cost, change: s.change,
  })),
]

const accountRows = [
  ...awsAccounts.map(account => ({ label: account.name, provider: 'aws', cost: account.spend })),
  ...gcpProjects.map(account => ({ label: account.name, provider: 'gcp', cost: account.spend })),
  ...azureSubscriptions.map(account => ({ label: account.name, provider: 'azure', cost: account.spend })),
]

const regionRows = [
  ...awsRegionBreakdown.map(region => ({ label: region.region, provider: 'aws', cost: region.cost })),
  ...gcpRegionBreakdown.map(region => ({ label: region.region, provider: 'gcp', cost: region.cost })),
  ...azureRegionBreakdown.map(region => ({ label: region.region, provider: 'azure', cost: region.cost })),
]

const PAGE_SIZE = 25

function normalizeDateRows(granularity) {
  const rows = dailySpend.slice(-granularityMap[granularity]).map((day, index) => ({
    label: granularity === 'Monthly'
      ? new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
      : granularity === 'Weekly'
        ? `W${Math.floor(index / 7) + 1}`
        : new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    aws: day.aws,
    gcp: day.gcp,
    azure: day.azure,
  }))

  if (granularity === 'Daily') return rows.slice(-14)

  const aggregated = rows.reduce((acc, row) => {
    const existing = acc.find(item => item.label === row.label)
    if (existing) {
      existing.aws += row.aws
      existing.gcp += row.gcp
      existing.azure += row.azure
      return acc
    }
    acc.push({ ...row })
    return acc
  }, [])

  return aggregated.map((row) => ({
    ...row,
    aws: +row.aws.toFixed(2),
    gcp: +row.gcp.toFixed(2),
    azure: +row.azure.toFixed(2),
  }))
}

function getChartData(groupBy, granularity) {
  if (groupBy === 'Service' || groupBy === 'Region' || groupBy === 'Account' || groupBy === 'Team' || groupBy === 'Resource Type') {
    return groupedData[groupBy]
  }
  return normalizeDateRows(granularity)
}

function buildCsv(rows) {
  const header = ['Date', 'Provider', 'Account', 'Service', 'Region', 'Usage Quantity', 'Unit', 'Cost', 'vs Last Period']
  const lines = rows.map((row) => [row.date, row.provider, row.account, row.service, row.region, row.usage, row.unit, row.cost, row.change].join(','))
  return [header.join(','), ...lines].join('\n')
}

/** Cost Explorer — deep-dive spend analysis with filters and comparison */
export default function CostExplorer() {
  const [datePreset, setDatePreset] = useState('This Month')
  const [selectedProviders, setSelectedProviders] = useState(['aws', 'gcp', 'azure'])
  const [groupBy, setGroupBy] = useState('Service')
  const [granularity, setGranularity] = useState('Daily')
  const [chartMode, setChartMode] = useState('Bar')
  const [sortKey, setSortKey] = useState('cost')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [tagKey, setTagKey] = useState('Environment')
  const { addToast } = useToast()

  const filtered = tableRows
    .filter(r => selectedProviders.includes(r.provider))
    .sort((a, b) => {
      const aVal = a[sortKey] ?? 0
      const bVal = b[sortKey] ?? 0
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const toggleProvider = (provider) => {
    const providerKey = provider.toLowerCase()
    setSelectedProviders((current) => {
      if (current.includes(providerKey)) {
        return current.length === 1 ? current : current.filter(item => item !== providerKey)
      }
      return [...current, providerKey]
    })
    setPage(0)
  }

  const activeChartData = getChartData(groupBy, granularity).map((row) => ({
    ...row,
    aws: selectedProviders.includes('aws') ? row.aws ?? 0 : 0,
    gcp: selectedProviders.includes('gcp') ? row.gcp ?? 0 : 0,
    azure: selectedProviders.includes('azure') ? row.azure ?? 0 : 0,
  }))

  const handleExport = () => {
    const csv = buildCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cloudspire-cost-explorer-${datePreset.toLowerCase().replace(/\s+/g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    addToast('Export ready, downloading...', 'success')
  }

  const SortIcon = ({ col }) => (
    sortKey === col
      ? (sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)
      : <ChevronDown size={12} style={{ opacity: 0.3 }} />
  )

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Cost Explorer" subtitle="Deep-dive into cloud spend with filtering and date comparison">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-white/10"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          <Download size={14} /> Export CSV
        </button>
      </PageHeader>

      {/* Filter bar */}
      <div
        className="flex flex-wrap gap-3 p-4 rounded-xl border mb-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
      >
        {/* Date preset */}
        <div>
          <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Date Range</p>
          <div className="flex gap-1">
            {DATE_PRESETS.map(p => (
              <button key={p} onClick={() => { setDatePreset(p); setPage(0) }}
                className="px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: datePreset === p ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                  color: datePreset === p ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${datePreset === p ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Granularity */}
        <div>
          <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Granularity</p>
          <div className="flex gap-1">
            {['Daily', 'Weekly', 'Monthly'].map(g => (
              <button key={g} onClick={() => setGranularity(g)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: granularity === g ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                  color: granularity === g ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${granularity === g ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Provider */}
        <div>
          <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Provider</p>
          <div className="flex gap-1">
            {PROVIDERS.map(p => (
              <button key={p} onClick={() => toggleProvider(p)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: selectedProviders.includes(p.toLowerCase()) ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                  color: selectedProviders.includes(p.toLowerCase()) ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${selectedProviders.includes(p.toLowerCase()) ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Group by */}
        <div>
          <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Group By</p>
          <div className="flex gap-1">
            {GROUP_BY.map(g => (
              <button key={g} onClick={() => { setGroupBy(g); setPage(0) }}
                className="px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: groupBy === g ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                  color: groupBy === g ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${groupBy === g ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
                }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px" style={{ background: 'var(--border-subtle)' }} />

        <div>
          <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Chart</p>
          <div className="flex gap-1">
            {CHART_MODE.map(mode => (
              <button key={mode} onClick={() => setChartMode(mode)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1"
                style={{
                  background: chartMode === mode ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                  color: chartMode === mode ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${chartMode === mode ? 'var(--accent-violet)' : 'var(--border-default)'}`,
                }}>
                {mode === 'Bar' ? <BarChart3 size={12} /> : <AreaChartIcon size={12} />}
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis chart */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Spend Breakdown by {groupBy}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Grouped by provider with {granularity.toLowerCase()} filtering for {datePreset.toLowerCase()}</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'Bar' ? (
              <BarChart data={activeChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => fmt.format(value)} tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<ChartLegend />} />
                <Bar dataKey="aws" name="AWS" fill={providerColors.aws} radius={[6, 6, 0, 0]} />
                <Bar dataKey="gcp" name="GCP" fill={providerColors.gcp} radius={[6, 6, 0, 0]} />
                <Bar dataKey="azure" name="Azure" fill={providerColors.azure} radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={activeChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="awsArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={providerColors.aws} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={providerColors.aws} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gcpArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={providerColors.gcp} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={providerColors.gcp} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="azureArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={providerColors.azure} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={providerColors.azure} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => fmt.format(value)} tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<ChartLegend />} />
                <Area type="monotone" dataKey="aws" name="AWS" stroke={providerColors.aws} fill="url(#awsArea)" strokeWidth={2} />
                <Area type="monotone" dataKey="gcp" name="GCP" stroke={providerColors.gcp} fill="url(#gcpArea)" strokeWidth={2} />
                <Area type="monotone" dataKey="azure" name="Azure" stroke={providerColors.azure} fill="url(#azureArea)" strokeWidth={2} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { provider: 'aws', current: 82400, prev: 76100, label: 'AWS This Period' },
          { provider: 'gcp', current: 39100, prev: 34800, label: 'GCP This Period' },
          { provider: 'azure', current: 27900, prev: 26100, label: 'Azure This Period' },
        ].map(c => (
          <div key={c.provider} className="rounded-xl border p-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <div className="flex items-center justify-between mb-2">
              <ProviderBadge provider={c.provider} />
              <TrendBadge value={+((c.current - c.prev) / c.prev * 100).toFixed(1)} invertColors />
            </div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
              {fmt.format(c.current)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>vs {fmt.format(c.prev)} last period</p>
          </div>
        ))}
      </div>

      {/* Data table */}
      <div className="rounded-xl border mb-6" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Spend Records <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>({filtered.length} rows)</span>
          </span>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Date', 'Provider', 'Account', 'Service', 'Region', 'Usage', 'Unit', 'Cost ($)', 'vs Last (%)'].map(col => {
                const key = col.toLowerCase().replace(' ($)', '').replace(' (%)', '').replace(' ', '_')
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(key === 'vs_last' ? 'change' : key === 'cost_' ? 'cost' : key)}
                    className="text-left px-4 py-3 font-semibold cursor-pointer select-none hover:text-cyan-400 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span className="flex items-center gap-1">{col} <SortIcon col={key} /></span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={i}
                className="border-b cursor-pointer transition-colors hover:bg-white/[0.03]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>{row.date}</td>
                <td className="px-4 py-2.5"><ProviderBadge provider={row.provider} size="sm" /></td>
                <td className="px-4 py-2.5 truncate max-w-[120px]" style={{ color: 'var(--text-secondary)' }}>{row.account}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>{row.service}</td>
                <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{row.region}</td>
                <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>{row.usage}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>{row.unit}</td>
                <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt.format(row.cost)}
                </td>
                <td className="px-4 py-2.5"><TrendBadge value={row.change} invertColors /></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3"
          style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Page {page + 1} of {totalPages} — {filtered.length} records
          </span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40 transition-colors hover:bg-white/10"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Prev
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs rounded-lg border disabled:opacity-40 transition-colors hover:bg-white/10"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Tag breakdown */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Cost by Tag</h3>
          <div className="flex gap-1">
            {Object.keys(tagBreakdown).map(k => (
              <button key={k} onClick={() => setTagKey(k)}
                className="px-2.5 py-1 text-xs rounded-lg transition-all"
                style={{
                  background: tagKey === k ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                  color: tagKey === k ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${tagKey === k ? 'var(--accent-violet)' : 'var(--border-default)'}`,
                }}>
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          {tagBreakdown[tagKey].map((t, i) => (
            <div key={t.value} className="flex items-center gap-3">
              <span className="text-xs w-28 text-right font-mono" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                {t.value}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${t.percent}%`,
                    background: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#06B6D4'][i % 6],
                  }}
                />
              </div>
              <span className="text-xs font-mono w-20" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt.format(t.cost)}
              </span>
              <span className="text-xs w-12 text-right" style={{ color: 'var(--text-muted)' }}>{t.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

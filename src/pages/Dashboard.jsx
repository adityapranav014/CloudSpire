import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Zap,
  AlertTriangle, ArrowRight, Download, Settings2, X,
  GripVertical, LayoutGrid, Check, RotateCcw, ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../components/ui/tooltip'
import MetricCard from '../components/ui/MetricCard'
import AreaSpendChart from '../components/charts/AreaSpendChart'
import DonutAllocationChart from '../components/charts/DonutAllocationChart'
import BarBreakdownChart from '../components/charts/BarBreakdownChart'
import ProviderBadge from '../components/ui/ProviderBadge'
import TrendBadge from '../components/ui/TrendBadge'
import SeverityBadge from '../components/ui/SeverityBadge'
import WidgetGalleryPanel from '../components/dashboard/WidgetGalleryPanel'
import { WIDGET_REGISTRY } from '../components/dashboard/WidgetRegistry'

import { currentMonthStats, dailySpend } from '../data/mockUnified'
import { awsServiceBreakdown } from '../data/mockAWS'
import { gcpServiceBreakdown } from '../data/mockGCP'
import { azureServiceBreakdown } from '../data/mockAzure'
import { anomalies, budgetAlerts } from '../data/mockAlerts'
import { rightsizingRecommendations, optimizationSummary } from '../data/mockOptimizations'

// --- Grid config --------------------------------------------
const BREAKPOINTS = { lg: 1024, md: 768, sm: 480, xs: 0 }
const COLS        = { lg: 12,   md: 8,   sm: 4,   xs: 2 }
const ROW_HEIGHT  = 80
const MARGIN      = [12, 12]
const STORAGE_KEY = 'cloudspire-dashboard-v4'

// --- Static data ---------------------------------------------
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtAge = (iso) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000)
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}

const now = new Date()
const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
const dayLabel = `${now.toLocaleString('en-US', { month: 'short' })} 1\u2013${now.getDate()}, ${now.getFullYear()}`

const PROVIDERS = [
  { provider: 'aws',   name: 'Amazon Web Services', spend: 82400, change: 8.2,  accounts: 4, unit: 'accounts',     color: '#FF9900' },
  { provider: 'gcp',   name: 'Google Cloud',         spend: 39100, change: 12.4, accounts: 4, unit: 'projects',      color: '#4285F4' },
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

// --- Default layouts per breakpoint -------------------------
// lg = 12 cols, md = 8 cols, sm = 4 cols, xs = 2 cols
const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'kpi-total-spend',   x: 0,  y: 0,  w: 3,  h: 3, minW: 2, minH: 3 },
    { i: 'kpi-vs-last-month', x: 3,  y: 0,  w: 3,  h: 3, minW: 2, minH: 3 },
    { i: 'kpi-forecast',      x: 6,  y: 0,  w: 3,  h: 3, minW: 2, minH: 3 },
    { i: 'kpi-savings',       x: 9,  y: 0,  w: 3,  h: 3, minW: 2, minH: 3 },
    { i: 'provider-aws',      x: 0,  y: 3,  w: 4,  h: 3, minW: 3, minH: 3 },
    { i: 'provider-gcp',      x: 4,  y: 3,  w: 4,  h: 3, minW: 3, minH: 3 },
    { i: 'provider-azure',    x: 8,  y: 3,  w: 4,  h: 3, minW: 3, minH: 3 },
    { i: 'chart-area-spend',  x: 0,  y: 6,  w: 12, h: 5, minW: 6, minH: 4 },
    { i: 'chart-donut',       x: 0,  y: 11, w: 6,  h: 5, minW: 4, minH: 4 },
    { i: 'chart-bar-regions', x: 6,  y: 11, w: 6,  h: 5, minW: 4, minH: 4 },
    { i: 'intel-alerts',      x: 0,  y: 16, w: 4,  h: 6, minW: 3, minH: 4 },
    { i: 'intel-savings',     x: 4,  y: 16, w: 4,  h: 6, minW: 3, minH: 4 },
    { i: 'intel-budget',      x: 8,  y: 16, w: 4,  h: 6, minW: 3, minH: 4 },
  ],
  md: [
    { i: 'kpi-total-spend',   x: 0, y: 0,  w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'kpi-vs-last-month', x: 4, y: 0,  w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'kpi-forecast',      x: 0, y: 3,  w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'kpi-savings',       x: 4, y: 3,  w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'provider-aws',      x: 0, y: 6,  w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'provider-gcp',      x: 4, y: 6,  w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'provider-azure',    x: 0, y: 9,  w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'chart-area-spend',  x: 0, y: 12, w: 8, h: 5, minW: 4, minH: 4 },
    { i: 'chart-donut',       x: 0, y: 17, w: 4, h: 5, minW: 2, minH: 4 },
    { i: 'chart-bar-regions', x: 4, y: 17, w: 4, h: 5, minW: 2, minH: 4 },
    { i: 'intel-alerts',      x: 0, y: 22, w: 4, h: 6, minW: 2, minH: 4 },
    { i: 'intel-savings',     x: 4, y: 22, w: 4, h: 6, minW: 2, minH: 4 },
    { i: 'intel-budget',      x: 0, y: 28, w: 8, h: 6, minW: 2, minH: 4 },
  ],
  sm: [
    { i: 'kpi-total-spend',   x: 0, y: 0,  w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'kpi-vs-last-month', x: 2, y: 0,  w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'kpi-forecast',      x: 0, y: 3,  w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'kpi-savings',       x: 2, y: 3,  w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'provider-aws',      x: 0, y: 6,  w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'provider-gcp',      x: 0, y: 9,  w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'provider-azure',    x: 0, y: 12, w: 4, h: 3, minW: 2, minH: 3 },
    { i: 'chart-area-spend',  x: 0, y: 15, w: 4, h: 5, minW: 2, minH: 4 },
    { i: 'chart-donut',       x: 0, y: 20, w: 4, h: 5, minW: 2, minH: 4 },
    { i: 'chart-bar-regions', x: 0, y: 25, w: 4, h: 5, minW: 2, minH: 4 },
    { i: 'intel-alerts',      x: 0, y: 30, w: 4, h: 6, minW: 2, minH: 4 },
    { i: 'intel-savings',     x: 0, y: 36, w: 4, h: 6, minW: 2, minH: 4 },
    { i: 'intel-budget',      x: 0, y: 42, w: 4, h: 6, minW: 2, minH: 4 },
  ],
  xs: [
    { i: 'kpi-total-spend',   x: 0, y: 0,  w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'kpi-vs-last-month', x: 0, y: 3,  w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'kpi-forecast',      x: 0, y: 6,  w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'kpi-savings',       x: 0, y: 9,  w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'provider-aws',      x: 0, y: 12, w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'provider-gcp',      x: 0, y: 15, w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'provider-azure',    x: 0, y: 18, w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'chart-area-spend',  x: 0, y: 21, w: 2, h: 5, minW: 2, minH: 4 },
    { i: 'chart-donut',       x: 0, y: 22, w: 2, h: 5, minW: 2, minH: 4 },
    { i: 'chart-bar-regions', x: 0, y: 27, w: 2, h: 5, minW: 2, minH: 4 },
    { i: 'intel-alerts',      x: 0, y: 32, w: 2, h: 6, minW: 2, minH: 4 },
    { i: 'intel-savings',     x: 0, y: 38, w: 2, h: 6, minW: 2, minH: 4 },
    { i: 'intel-budget',      x: 0, y: 44, w: 2, h: 6, minW: 2, minH: 4 },
  ],
}

// --- Storage helpers -----------------------------------------
function loadLayouts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function saveLayouts(layouts) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts)) } catch {}
}

// Derive the set of active widget IDs from any breakpoint layout
function getActiveIds(layouts) {
  const bp = layouts.lg ?? layouts.md ?? layouts.sm ?? layouts.xs ?? []
  return new Set(bp.map(l => l.i))
}

// --- Widget Shell --------------------------------------------
function WidgetShell({ id, isEditMode, onRemove, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <TooltipProvider delay={400}>
      <div
        className="h-full w-full relative"
        onMouseEnter={() => isEditMode && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="h-full w-full rounded-xl overflow-hidden" style={{ pointerEvents: isEditMode ? 'none' : 'auto' }}>
          {children}
        </div>
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 0 2px var(--accent-primary)',
                background: 'color-mix(in srgb, var(--accent-primary) 4%, transparent)',
              }}
            >
              <motion.div
                animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-2.5 right-2.5 flex items-center gap-0.5 p-1 rounded-lg shadow-sm border pointer-events-auto backdrop-blur-md"
                style={{ 
                  background: 'color-mix(in srgb, var(--bg-surface) 85%, transparent)', 
                  borderColor: 'var(--border-subtle)',
                  zIndex: 30
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="w-6 h-6 flex items-center justify-center rounded cursor-grab active:cursor-grabbing transition-colors hover:bg-[--bg-hover]" 
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <GripVertical size={13} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Drag to move</TooltipContent>
                </Tooltip>
                
                <div className="w-[1px] h-3 mx-0.5" style={{ background: 'var(--border-default)' }} />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onMouseDown={e => { e.stopPropagation(); e.preventDefault() }}
                      onClick={e => { e.stopPropagation(); onRemove(id) }}
                      className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-[color-mix(in_srgb,var(--accent-rose)_15%,transparent)]"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-rose)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      <X size={13} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Remove widget</TooltipContent>
                </Tooltip>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}

// --- Widget content renders -----------------------------------
function ProviderCard({ provider: p }) {
  const pct = ((p.spend / TOTAL_SPEND) * 100).toFixed(0)
  return (
    <div
      className="h-full rounded-xl layer-raised p-4 flex flex-col"
    >
      <div className="flex items-start justify-between mb-2">
        <ProviderBadge provider={p.provider} size="md" />
        <TrendBadge value={p.change} invertColors />
      </div>
      <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{p.name}</p>
      <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
        {fmt.format(p.spend)}
      </p>
      <div className="w-full h-1.5 rounded-full mb-2" style={{ background: 'var(--bg-elevated)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: p.color, opacity: 0.75 }} />
      </div>
      <div className="flex items-center justify-between mb-auto">
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.accounts} {p.unit}</span>
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: `${p.color}18`, color: p.color }}>
          {pct}% of total
        </span>
      </div>
      <Link
        to="/accounts"
        className="mt-3 pt-3 border-t text-xs font-medium flex items-center gap-1 transition-all hover:gap-1.5"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-cyan)' }}
      >
        View accounts <ChevronRight size={11} />
      </Link>
    </div>
  )
}

function AlertsWidget() {
  const openAlerts = anomalies.filter(a => a.status === 'open')
  return (
    <div className="h-full rounded-xl layer-raised p-4 flex flex-col">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(244,63,94,0.1)' }}>
          <AlertTriangle size={13} style={{ color: 'var(--accent-rose)' }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Active Alerts</span>
        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--accent-rose)' }}>
          {openAlerts.length} open
        </span>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
        {openAlerts.slice(0, 5).map(a => (
          <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <SeverityBadge severity={a.severity} />
                <ProviderBadge provider={a.provider} size="sm" />
              </div>
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.service}</p>
              <p className="text-[11px]" style={{ color: 'var(--accent-rose)' }}>+{a.deviationPercent}% deviation</p>
            </div>
            <span className="text-[10px] shrink-0 mt-0.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>{fmtAge(a.detectedAt)}</span>
          </div>
        ))}
      </div>
      <Link to="/anomalies" className="mt-3 pt-3 border-t flex items-center justify-between text-xs font-medium group" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
        <span>View all {anomalies.length} alerts</span>
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--accent-cyan)' }} />
      </Link>
    </div>
  )
}

function SavingsWidget() {
  return (
    <div className="h-full rounded-xl layer-raised p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <Zap size={13} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Top Savings</span>
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>
          {fmt.format(optimizationSummary.totalPotentialSavings)}/mo
        </span>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
        {rightsizingRecommendations.slice(0, 5).map(r => (
          <div key={r.id} className="flex items-center gap-2.5 p-2.5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <ProviderBadge provider={r.provider} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.resourceName}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.currentType} to {r.recommendedType}</p>
            </div>
            <span className="text-xs font-bold shrink-0 tabular-nums" style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>
              -{fmt.format(r.monthlySavings)}/mo
            </span>
          </div>
        ))}
      </div>
      <Link to="/optimizer" className="mt-3 pt-3 border-t flex items-center justify-between text-xs font-medium group" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
        <span>Open Optimizer</span>
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--accent-cyan)' }} />
      </Link>
    </div>
  )
}

function BudgetWidget() {
  const criticalCount = budgetAlerts.filter(b => b.status === 'critical').length
  return (
    <div className="h-full rounded-xl layer-raised p-4 flex flex-col">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(6,182,212,0.1)' }}>
          <Calendar size={13} style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Budget Health</span>
        {criticalCount > 0 && (
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--accent-rose)' }}>
            {criticalCount} critical
          </span>
        )}
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
        {budgetAlerts.map(b => {
          const color =
            b.status === 'critical' ? 'var(--accent-rose)'
            : b.status === 'warning' ? 'var(--accent-amber)'
            : 'var(--accent-emerald)'
          return (
            <div key={b.id} className="p-2.5 rounded-lg layer-recessed border border-transparent" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{b.name}</span>
                <span className="text-xs font-bold ml-2 shrink-0 tabular-nums" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
                  {b.percent}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(b.percent, 100)}%`, background: color }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{fmt.format(b.current)}</span>
                <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>of {fmt.format(b.limit)}</span>
              </div>
            </div>
          )
        })}
      </div>
      <Link to="/accounts" className="mt-3 pt-3 border-t flex items-center justify-between text-xs font-medium group" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
        <span>Manage budgets</span>
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--accent-cyan)' }} />
      </Link>
    </div>
  )
}

// --- Dashboard -----------------------------------------------
export default function Dashboard() {
  const [layouts, setLayouts] = useState(() => loadLayouts() || DEFAULT_LAYOUTS)
  const [editMode, setEditMode] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [droppingItem, setDroppingItem] = useState(null)
  const { width: containerWidth, containerRef } = useContainerWidth({ initialWidth: 1200 })

  const activeWidgetIds = useMemo(() => getActiveIds(layouts), [layouts])
  const openAlerts = anomalies.filter(a => a.status === 'open')

  const computedLayouts = useMemo(() => {
    const result = {}
    for (const bp in layouts) {
      result[bp] = layouts[bp].map(item => ({
        ...item,
        static: !editMode
      }))
    }
    return result
  }, [layouts, editMode])

  // When RGL fires onLayoutChange it passes (currentLayout, allLayouts)
  const handleLayoutChange = useCallback((_current, allLayouts) => {
    setLayouts(allLayouts)
    saveLayouts(allLayouts)
  }, [])

  const handleRemoveWidget = useCallback((id) => {
    const next = {}
    Object.keys(layouts).forEach(bp => {
      next[bp] = layouts[bp].filter(l => l.i !== id)
    })
    setLayouts(next)
    saveLayouts(next)
  }, [layouts])

  const handleAddWidget = useCallback((widget) => {
    if (activeWidgetIds.has(widget.id)) return
    const next = {}
    Object.entries(DEFAULT_LAYOUTS).forEach(([bp, items]) => {
      const existing = layouts[bp] ?? items
      const maxY = existing.reduce((m, l) => Math.max(m, l.y + l.h), 0)
      const cols = COLS[bp]
      const w = Math.min(widget.defaultW, cols)
      next[bp] = [
        ...existing,
        {
          i: widget.id,
          x: 0,
          y: maxY,
          w,
          h: widget.defaultH,
          minW: Math.min(widget.minW, cols),
          minH: widget.minH,
        },
      ]
    })
    setLayouts(next)
    saveLayouts(next)
  }, [layouts, activeWidgetIds])

  const handleResetLayout = useCallback(() => {
    setLayouts(DEFAULT_LAYOUTS)
    saveLayouts(DEFAULT_LAYOUTS)
  }, [])

  // All active widget IDs come from the lg layout (source of truth)
  const activeIds = useMemo(() => {
    const lg = layouts.lg ?? DEFAULT_LAYOUTS.lg
    return new Set(lg.map(l => l.i))
  }, [layouts])

  function renderWidgetContent(id) {
    switch (id) {
      case 'kpi-total-spend':
        return (
          <MetricCard
            className="h-full"
            title="Total Spend"
            value={fmt.format(currentMonthStats.totalSpend)}
            subtitle={monthLabel}
            trend="up"
            trendValue={`+${currentMonthStats.changePercent}% MoM`}
            icon={DollarSign}
            accentColor="#F59E0B"
            upIsGood={false}
            sparklineKey="total"
            sparklineData={sparkData}
          />
        )
      case 'kpi-vs-last-month':
        return (
          <MetricCard
            className="h-full"
            title="vs Last Month"
            value={`${currentMonthStats.totalSpend - currentMonthStats.prevMonthSpend >= 0 ? '+' : ''}${fmt.format(currentMonthStats.totalSpend - currentMonthStats.prevMonthSpend)}`}
            subtitle={`prev: ${fmt.format(currentMonthStats.prevMonthSpend)}`}
            trend={currentMonthStats.changePercent > 0 ? 'up' : 'down'}
            trendValue={`${currentMonthStats.changePercent > 0 ? '+' : ''}${currentMonthStats.changePercent}%`}
            icon={currentMonthStats.changePercent > 0 ? TrendingUp : TrendingDown}
            accentColor={currentMonthStats.changePercent > 0 ? '#F43F5E' : '#10B981'}
            upIsGood={false}
            sparklineKey="total"
            sparklineData={sparkData}
          />
        )
      case 'kpi-forecast':
        return (
          <MetricCard
            className="h-full"
            title="Month-End Forecast"
            value={fmt.format(currentMonthStats.projectedMonthEnd)}
            subtitle={`${currentMonthStats.budgetUsedPercent}% of budget consumed`}
            trend="warning"
            trendValue="Approaching limit"
            icon={Calendar}
            accentColor="#F59E0B"
            sparklineKey="budgetLine"
            sparklineData={sparkData}
          />
        )
      case 'kpi-savings':
        return (
          <MetricCard
            className="h-full"
            title="Savings Identified"
            value={fmt.format(currentMonthStats.savingsIdentified)}
            subtitle="Apply in Optimizer"
            trend="neutral"
            trendValue={`${fmt.format(optimizationSummary.totalPotentialSavings)} available`}
            icon={Zap}
            accentColor="#10B981"
            sparklineKey="savings"
            sparklineData={sparkData}
          />
        )
      case 'provider-aws':
        return <ProviderCard provider={PROVIDERS[0]} />
      case 'provider-gcp':
        return <ProviderCard provider={PROVIDERS[1]} />
      case 'provider-azure':
        return <ProviderCard provider={PROVIDERS[2]} />
      case 'chart-area-spend':
        return <AreaSpendChart />
      case 'chart-donut':
        return <DonutAllocationChart data={topServices} title="Cost by Service" />
      case 'chart-bar-regions':
        return <BarBreakdownChart data={topRegions} title="Top Regions by Spend" />
      case 'intel-alerts':
        return <AlertsWidget />
      case 'intel-savings':
        return <SavingsWidget />
      case 'intel-budget':
        return <BudgetWidget />
      default:
        return null
    }
  }

  // Items rendered are driven by the lg layout keys (all breakpoints carry same ids)
  const renderedIds = useMemo(() => {
    const lg = layouts.lg ?? DEFAULT_LAYOUTS.lg
    return lg.map(l => l.i)
  }, [layouts])

  return (
    <>
      <WidgetGalleryPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        activeWidgetIds={activeIds}
        onAdd={handleAddWidget}
        onRemove={handleRemoveWidget}
        onReset={handleResetLayout}
        onDragStart={(widget) => setDroppingItem({ i: widget.id, w: widget.defaultW, h: widget.defaultH })}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* -- Header ------------------------------------ */}
        <div
          className="relative mb-6 rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
          <div className="relative px-4 sm:px-6 pt-5 pb-4">
            {/* Live pill */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Live &bull; Last synced 2 min ago</span>
            </div>

            {/* Title + actions row */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  Cost Overview
                </h1>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {PROVIDERS.length} providers &bull; {monthLabel}
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {editMode ? (
                  <>
                    <button
                      onClick={handleResetLayout}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-[--bg-hover]"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                    <button
                      onClick={() => setPanelOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors"
                      style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', background: 'var(--accent-primary-subtle)' }}
                    >
                      <LayoutGrid size={12} />
                      <span className="hidden sm:inline">Widgets</span>
                    </button>
                    <button
                      onClick={() => { setEditMode(false); setPanelOpen(false) }}
                      className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 shiny-emerald"
                      style={{ color: '#fff' }}
                    >
                      <Check size={12} />
                      <span className="hidden sm:inline">Done</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/reports"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-[--bg-hover]"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                    >
                      <Download size={12} /> Export
                    </Link>
                    <Link
                      to="/cost-explorer"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-[--bg-hover]"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                    >
                      Deep Dive <ArrowRight size={12} />
                    </Link>
                    <button
                      onClick={() => { setEditMode(true); setPanelOpen(true) }}
                        className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 shiny-primary"
                        style={{ color: '#fff' }}
                    >
                      <Settings2 size={12} />
                      <span>Customize</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats bar */}
            <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-0" style={{ borderColor: 'var(--border-subtle)' }}>
              {[
                { label: 'MTD Spend',      value: fmt.format(TOTAL_SPEND),                                      color: 'var(--text-primary)' },
                { label: 'Providers',      value: String(PROVIDERS.length),                                     color: 'var(--text-primary)' },
                { label: 'Open Alerts',    value: String(openAlerts.length),                                     color: openAlerts.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' },
                { label: 'Savings Avail.', value: `${fmt.format(optimizationSummary.totalPotentialSavings)}/mo`, color: 'var(--accent-emerald)' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center">
                  {i > 0 && <div className="hidden sm:block w-px h-7 mx-4" style={{ background: 'var(--border-subtle)' }} />}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                    <p className="text-sm font-bold leading-none" style={{ color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
              <AnimatePresence>
                {editMode && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="hidden sm:flex sm:ml-auto items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium col-span-2"
                    style={{ background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)', color: 'var(--accent-primary)' }}
                  >
                    <GripVertical size={12} /> Drag to rearrange � Resize from corners
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* -- Responsive Grid ---------------------------- */}
        <div ref={containerRef} className={editMode ? 'dashboard-edit-mode' : ''}>
          <ResponsiveGridLayout
            layouts={computedLayouts}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            width={containerWidth}
            margin={MARGIN}
            containerPadding={[0, 0]}
            isDraggable={editMode}
            isResizable={editMode}
            isDroppable={editMode}
            droppingItem={droppingItem ?? undefined}
            onLayoutChange={handleLayoutChange}
            compactType="vertical"
            preventCollision={false}
            resizeHandles={['se']}
          >
            {renderedIds.map(id => (
              <div key={id} style={{ cursor: editMode ? 'grab' : 'default', height: '100%' }}>
                <WidgetShell id={id} isEditMode={editMode} onRemove={handleRemoveWidget}>
                  {renderWidgetContent(id)}
                </WidgetShell>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>

        {renderedIds.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed text-center layer-raised"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--accent-primary-subtle)' }}>
              <LayoutGrid size={22} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No widgets on your dashboard</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Open the widget library to add charts and metrics</p>
            <button
              onClick={() => { setEditMode(true); setPanelOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shiny-primary"
              style={{ color: '#fff' }}
            >
              <LayoutGrid size={14} /> Open Widget Library
            </button>
          </motion.div>
        )}
      </motion.div>
    </>
  )
}


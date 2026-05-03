import { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, CheckCircle, Clock, DollarSign,
  ExternalLink, X, ChevronDown, ChevronUp, Settings, Bell,
  Layers, AlertCircle, CheckCircle2, RefreshCw, Sparkles,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '../components/layout/PageHeader'
import SeverityBadge from '../components/ui/SeverityBadge'
import ProviderBadge from '../components/ui/ProviderBadge'
import { useToast } from '../context/ToastContext'
import { usePermissions } from '../hooks/usePermissions'
import api from '../services/api'
import {
  selectActiveAlerts, setInitialAlerts, removeAlert,
} from '../store/slices/alertsSlice'
import { useMigrationData } from '../hooks/useMigrationData'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDate = (iso) => {
  const d = new Date(iso)
  const diff = Math.round((Date.now() - d.getTime()) / 3600000)
  if (diff < 24) return `${diff}h ago`
  return `${Math.round(diff / 24)}d ago`
}

const statusColor = { open: '#F43F5E', acknowledged: '#F59E0B', resolved: '#10B981' }

/** Anomaly detection page — AI-powered spend deviation alerts */
export default function Anomalies() {
  const dispatch   = useDispatch()
  const { addToast } = useToast()
  const { can } = usePermissions()

  // Socket-driven live alerts from Redux (updated by useSocket → alert:new)
  const liveAlerts = useSelector(selectActiveAlerts)

  // SWR for initial load + stats data (budget alerts, history, anomalyStats)
  const { data: d0, isLoading: l0, isError: e0, errorMessage: em0, mutate } = useMigrationData('/alerts')
  const { anomalies: apiAnomalies = [], budgetAlerts, anomalyHistory, anomalyStats } = d0?.data || {}
  const { data: d1, isLoading: l1 } = useMigrationData('/roles')
  const { PERMISSIONS } = d1 || {}

  // Seed Redux with API data on first load; after that, socket events update it
  useEffect(() => {
    if (apiAnomalies.length > 0 && liveAlerts.length === 0) {
      dispatch(setInitialAlerts(apiAnomalies))
    }
  }, [apiAnomalies, liveAlerts.length, dispatch])

  // Use live Redux alerts if available, else fall back to SWR data
  const anomalies = liveAlerts.length > 0 ? liveAlerts : apiAnomalies

  const isLoading = l0 || l1;


  const [filter, setFilter]         = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [threshold, setThreshold]   = useState(20)
  const [alertFrequency, setAlertFrequency] = useState('Immediate')
  const [providerToggles, setProviderToggles] = useState({ aws: true, gcp: true, azure: true })


  if (isLoading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading alerts…</p>
      </div>
    </div>
  )

  if (e0 && anomalies.length === 0) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="font-semibold mb-1" style={{ color: 'var(--accent-rose)' }}>Failed to load anomalies</p>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{em0}</p>
        <button
          onClick={() => mutate()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg"
          style={{ background: 'var(--accent-blue)', color: '#fff' }}
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    </div>
  )


  const filtered = anomalies.filter(a =>
    filter === 'all' || a.status === filter
  )

  const updateStatus = useCallback(async (id, status, successMsg) => {
    try {
      // api.js already has withCredentials: true (Task 2)
      await api.put(`/alerts/${id}`, { status })
      // Optimistically update Redux state
      if (status === 'dismissed') {
        dispatch(removeAlert(id))
      } else {
        dispatch(setInitialAlerts(
          anomalies.map(a => a._id === id || a.id === id ? { ...a, status } : a)
        ))
      }
      addToast(successMsg, 'success')
      mutate() // revalidate SWR cache too
    } catch (err) {
      addToast(err.response?.data?.error || err.message || 'Failed to update anomaly status', 'error')
    }
  }, [anomalies, dispatch, addToast, mutate])


  const acknowledge = (id) => updateStatus(id, 'acknowledged', 'Anomaly acknowledged')
  const resolve     = (id) => updateStatus(id, 'resolved', 'Anomaly marked as resolved')
  const dismiss     = (id) => updateStatus(id, 'dismissed', 'Anomaly dismissed')

  const createTicket = (anomaly) => addToast(`Ticket created for ${anomaly.title || anomaly.service}`, 'success')

  const counts = {
    open:         anomalies.filter(a => a.status === 'open').length,
    acknowledged: anomalies.filter(a => a.status === 'acknowledged').length,
    resolved:     anomalies.filter(a => a.status === 'resolved').length,
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Anomaly Detection" subtitle="AI-powered spend deviation alerts across all providers" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Alerts', value: counts.open, color: '#F43F5E', icon: AlertTriangle },
          { label: 'Acknowledged', value: counts.acknowledged, color: '#F59E0B', icon: Clock },
          { label: 'Resolved This Month', value: anomalyStats?.resolvedThisMonth || 4, color: '#10B981', icon: CheckCircle },
          { label: 'Spend Prevented', value: fmt.format(anomalyStats?.spendPrevented || 2780), color: '#3B82F6', icon: DollarSign },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border shadow-depth-card p-4"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={15} style={{ color: s.color }} />
                <span className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {s.value}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 mb-5 p-1 rounded-xl shadow-depth-inset border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)', display: 'inline-flex' }}>
        {[
          { key: 'all', label: `All (${anomalies.length})`, icon: Layers },
          { key: 'open', label: `Open (${counts.open})`, icon: AlertCircle },
          { key: 'acknowledged', label: `Acknowledged (${counts.acknowledged})`, icon: Clock },
          { key: 'resolved', label: `Resolved (${counts.resolved})`, icon: CheckCircle2 },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filter === tab.key ? 'shadow-depth-1 border' : 'border border-transparent'}`}
              style={{
                background: filter === tab.key ? 'var(--bg-surface)' : 'transparent',
                color: filter === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderColor: filter === tab.key ? 'var(--border-default)' : 'transparent',
              }}>
              <Icon size={14} style={{ color: filter === tab.key ? 'var(--accent-blue)' : 'inherit' }} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Anomaly feed */}
      <div className="space-y-4 mb-6">
        {filtered.length === 0 && (
          <div className="rounded-xl border shadow-depth-card p-10 text-center" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
            <CheckCircle size={36} className="mx-auto mb-3" style={{ color: 'var(--accent-emerald)' }} />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No anomalies in this category</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>All clear — spend patterns look normal.</p>
          </div>
        )}
        {filtered.map(a => {
          const alertId = a._id || a.id
          const isExpanded = expandedId === alertId
          const isResolved = a.status === 'resolved'
          const severityAccent = { critical: '#F43F5E', high: '#F59E0B', medium: '#3B82F6', low: '#8A9BB8' }
          const accent = severityAccent[a.severity] || '#8A9BB8'
          const deviationColor = a.deviationPercent >= 100 ? '#F43F5E' : a.deviationPercent >= 50 ? '#F59E0B' : '#8A9BB8'
          return (
            <motion.div
              key={alertId}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: isResolved ? 0.6 : 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border shadow-depth-card overflow-hidden"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)',
                borderLeft: `3px solid ${accent}`,
              }}
            >
              {/* Card body */}
              <div className="p-4 sm:p-5">
                {/* Header row: badges + service name + dismiss */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <SeverityBadge severity={a.severity} />
                    <ProviderBadge provider={a.provider} size="sm" />
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: isResolved ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: isResolved ? 'line-through' : 'none',
                      }}
                    >
                      {a.service}
                    </span>
                    {a.status === 'acknowledged' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide"
                        style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                        ACKNOWLEDGED
                      </span>
                    )}
                    {a.status === 'resolved' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                        RESOLVED
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(alertId)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--text-muted)', display: can(PERMISSIONS?.MANAGE_ANOMALIES) ? undefined : 'none' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Metrics grid — 2 cols on mobile, 4 cols on sm+ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  <div className="rounded-lg p-3 shadow-depth-inset border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                    <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Spend Today</p>
                    <p className="text-base font-bold font-mono leading-none" style={{ color: '#F43F5E', fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmt.format(a.spendToday)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3 shadow-depth-inset border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                    <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Expected</p>
                    <p className="text-base font-bold font-mono leading-none" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmt.format(a.expectedSpend)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3 shadow-depth-inset border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                    <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Deviation</p>
                    <p className="text-base font-bold font-mono leading-none" style={{ color: deviationColor, fontFamily: "'JetBrains Mono', monospace" }}>
                      +{a.deviationPercent}%
                    </p>
                    <p className="text-[10px] font-mono mt-1 opacity-80" style={{ color: deviationColor, fontFamily: "'JetBrains Mono', monospace" }}>
                      +{fmt.format(a.deviationAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3 shadow-depth-inset border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                    <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Detected</p>
                    <p className="text-sm font-semibold leading-none" style={{ color: 'var(--text-secondary)' }}>
                      {fmtDate(a.detectedAt)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a.description}</p>

                {/* Expandable details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3"
                        style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="rounded-lg p-3 shadow-depth-inset border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                          <p className="text-[10px] font-semibold tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Possible Cause
                          </p>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{a.possibleCause || a.description}</p>
                        </div>
                        <div className="rounded-lg p-3 shadow-depth-inset border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                          <p className="text-[10px] font-semibold tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Affected Resource
                          </p>
                          <p className="text-[10px] font-mono break-all leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                            {a.affectedResource || a.resourceId || '—'}
                          </p>
                        </div>

                        {/* AI Explanation — populated by Task 8 (Gemini integration) */}
                        <div className="sm:col-span-2 rounded-lg p-3 border" style={{ background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--bg-base))', borderColor: 'color-mix(in srgb, var(--accent-primary) 20%, var(--border-subtle))' }}>
                          <p className="text-[10px] font-semibold tracking-wide mb-1.5 flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                            <Sparkles size={10} /> AI Explanation
                          </p>
                          <p className="text-xs leading-relaxed" style={{ color: a.aiExplanation ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {a.aiExplanation || 'AI analysis pending — Gemini integration active in Task 8.'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action footer */}
              <div
                className="px-4 sm:px-5 py-3 border-t flex flex-wrap items-center justify-between gap-3"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : alertId)}
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {isExpanded
                    ? <><ChevronUp size={12} /> Collapse</>
                    : <><ChevronDown size={12} /> View Details</>}
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  {a.status === 'open' && can(PERMISSIONS?.ACKNOWLEDGE_ANOMALIES) && (
                    <button
                      onClick={() => acknowledge(alertId)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-80"
                      style={{ background: '#F59E0B', color: '#fff' }}
                    >
                      Acknowledge
                    </button>
                  )}
                  {a.status !== 'resolved' && can(PERMISSIONS?.MANAGE_ANOMALIES) && (
                    <button
                      onClick={() => resolve(alertId)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-80"
                      style={{ background: '#10B981', color: '#fff' }}
                    >
                      Resolve
                    </button>
                  )}
                  {a.status !== 'resolved' && can(PERMISSIONS?.MANAGE_ANOMALIES) && (
                    <button
                      onClick={() => createTicket(a)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:opacity-80"
                      style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.08)' }}
                    >
                      Create Ticket
                    </button>
                  )}
                  <button
                    onClick={() => addToast('Opening in cloud console...', 'info')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1 transition-all hover:opacity-80"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'transparent' }}
                  >
                    Console <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Alert history chart */}
      <div className="rounded-xl border shadow-depth-card p-5 mb-6" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Anomaly History — Last 30 Days</h3>
        <div className="rounded-lg p-4 shadow-depth-inset border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)', minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height={120} minWidth={0}>
            <AreaChart data={anomalyHistory} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D40" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} interval={4}
                tickFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, boxShadow: 'var(--shadow-depth-2)' }}
                labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="count" fillOpacity={0.2} strokeWidth={2} stroke="var(--accent-rose)" fill="var(--accent-rose)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Configure alerts */}
      <div className="rounded-xl border shadow-depth-card overflow-hidden" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
        <button
          className="w-full flex items-center justify-between p-5 text-sm font-semibold transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-primary)' }}
          onClick={() => setConfigOpen(v => !v)}
        >
          <span className="flex items-center gap-2"><Settings size={15} /> Configure Alert Rules</span>
          {configOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        <AnimatePresence>
          {configOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Deviation Threshold
                    </label>
                    <span className="font-mono text-sm font-semibold" style={{ color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {threshold}%
                    </span>
                  </div>
                  <input type="range" min={5} max={100} value={threshold} onChange={e => setThreshold(+e.target.value)}
                    className="w-full accent-cyan-400" style={{ accentColor: 'var(--accent-cyan)' }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Email Alerts', enabled: true },
                    { label: 'Slack Notifications', enabled: false },
                    { label: 'Webhook Alerts', enabled: true },
                    { label: 'Slack Digest', enabled: false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <button
                        className="w-9 h-5 rounded-full transition-colors relative overflow-hidden"
                        style={{ background: item.enabled ? 'var(--accent-cyan)' : 'var(--border-default)' }}
                      >
                        <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                          style={{ transform: item.enabled ? 'translateX(14px)' : 'translateX(0px)' }} />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Alert Frequency</p>
                  <div className="flex gap-2">
                    {['Immediate', 'Digest (daily)'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setAlertFrequency(mode)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                        style={{
                          background: alertFrequency === mode ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                          color: alertFrequency === mode ? '#fff' : 'var(--text-secondary)',
                          borderColor: alertFrequency === mode ? 'var(--accent-blue)' : 'var(--border-default)',
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Providers</p>
                  <div className="flex flex-wrap gap-2">
                    {['aws', 'gcp', 'azure'].map((provider) => (
                      <button
                        key={provider}
                        onClick={() => setProviderToggles((current) => ({ ...current, [provider]: !current[provider] }))}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                        style={{
                          background: providerToggles[provider] ? 'rgba(59,130,246,0.12)' : 'var(--bg-elevated)',
                          color: providerToggles[provider] ? 'var(--accent-blue)' : 'var(--text-secondary)',
                          borderColor: providerToggles[provider] ? 'var(--accent-blue)' : 'var(--border-default)',
                        }}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { addToast('Alert settings saved', 'success'); setConfigOpen(false) }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90"
                  style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                  Save Settings
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

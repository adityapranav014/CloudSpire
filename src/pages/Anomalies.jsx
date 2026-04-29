import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, CheckCircle, Clock, DollarSign,
  ExternalLink, X, ChevronDown, ChevronUp, Settings, Bell
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '../components/layout/PageHeader'
import SeverityBadge from '../components/ui/SeverityBadge'
import ProviderBadge from '../components/ui/ProviderBadge'
import { anomalies, budgetAlerts, anomalyHistory } from '../data/mockAlerts'
import { useToast } from '../context/ToastContext'

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
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [localAnomalies, setLocalAnomalies] = useState(anomalies)
  const [configOpen, setConfigOpen] = useState(false)
  const [threshold, setThreshold] = useState(20)
  const [alertFrequency, setAlertFrequency] = useState('Immediate')
  const [providerToggles, setProviderToggles] = useState({ aws: true, gcp: true, azure: true })
  const { addToast } = useToast()

  const filtered = localAnomalies.filter(a =>
    filter === 'all' || a.status === filter
  )

  const acknowledge = (id) => {
    setLocalAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a))
    addToast('Anomaly acknowledged', 'info')
  }
  const resolve = (id) => {
    setLocalAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a))
    addToast('Anomaly marked as resolved', 'success')
  }
  const dismiss = (id) => {
    setLocalAnomalies(prev => prev.filter(a => a.id !== id))
    addToast('Anomaly dismissed', 'info')
  }
  const createTicket = (anomaly) => addToast(`Ticket created for ${anomaly.service}`, 'success')

  const counts = {
    open: localAnomalies.filter(a => a.status === 'open').length,
    acknowledged: localAnomalies.filter(a => a.status === 'acknowledged').length,
    resolved: localAnomalies.filter(a => a.status === 'resolved').length,
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Anomaly Detection" subtitle="AI-powered spend deviation alerts across all providers" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Alerts', value: counts.open, color: '#F43F5E', icon: AlertTriangle },
          { label: 'Acknowledged', value: counts.acknowledged, color: '#F59E0B', icon: Clock },
          { label: 'Resolved This Month', value: 4, color: '#10B981', icon: CheckCircle },
          { label: 'Spend Prevented', value: '$2,780', color: '#3B82F6', icon: DollarSign },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border p-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
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
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { key: 'all', label: `All (${localAnomalies.length})` },
          { key: 'open', label: `Open (${counts.open})` },
          { key: 'acknowledged', label: `Acknowledged (${counts.acknowledged})` },
          { key: 'resolved', label: `Resolved (${counts.resolved})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
            style={{
              background: filter === tab.key ? 'var(--accent-blue)' : 'var(--bg-elevated)',
              color: filter === tab.key ? '#fff' : 'var(--text-secondary)',
              borderColor: filter === tab.key ? 'var(--accent-blue)' : 'var(--border-default)',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Anomaly feed */}
      <div className="space-y-4 mb-6">
        {filtered.length === 0 && (
          <div className="rounded-xl border p-10 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <CheckCircle size={36} className="mx-auto mb-3" style={{ color: 'var(--accent-emerald)' }} />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No anomalies in this category</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>All clear — spend patterns look normal.</p>
          </div>
        )}
        {filtered.map(a => {
          const isExpanded = expandedId === a.id
          const isResolved = a.status === 'resolved'
          const severityAccent = { critical: '#F43F5E', high: '#F59E0B', medium: '#3B82F6', low: '#8A9BB8' }
          const accent = severityAccent[a.severity] || '#8A9BB8'
          const deviationColor = a.deviationPercent >= 100 ? '#F43F5E' : a.deviationPercent >= 50 ? '#F59E0B' : '#8A9BB8'
          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: isResolved ? 0.6 : 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border overflow-hidden"
              style={{
                background: 'var(--bg-card)',
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
                    onClick={() => dismiss(a.id)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Metrics grid — 2 cols on mobile, 4 cols on sm+ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Spend Today</p>
                    <p className="text-base font-bold font-mono leading-none" style={{ color: '#F43F5E', fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmt.format(a.spendToday)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Expected</p>
                    <p className="text-base font-bold font-mono leading-none" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmt.format(a.expectedSpend)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-[10px] font-medium tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Deviation</p>
                    <p className="text-base font-bold font-mono leading-none" style={{ color: deviationColor, fontFamily: "'JetBrains Mono', monospace" }}>
                      +{a.deviationPercent}%
                    </p>
                    <p className="text-[10px] font-mono mt-1 opacity-80" style={{ color: deviationColor, fontFamily: "'JetBrains Mono', monospace" }}>
                      +{fmt.format(a.deviationAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
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
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                          <p className="text-[10px] font-semibold tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Possible Cause
                          </p>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{a.possibleCause}</p>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                          <p className="text-[10px] font-semibold tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Affected Resource
                          </p>
                          <p className="text-[10px] font-mono break-all leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                            {a.affectedResource}
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
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {isExpanded
                    ? <><ChevronUp size={12} /> Collapse</>
                    : <><ChevronDown size={12} /> View Details</>}
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  {a.status === 'open' && (
                    <button
                      onClick={() => acknowledge(a.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:opacity-80"
                      style={{ borderColor: '#F59E0B', color: '#F59E0B', background: 'rgba(245,158,11,0.08)' }}
                    >
                      Acknowledge
                    </button>
                  )}
                  {a.status !== 'resolved' && (
                    <button
                      onClick={() => resolve(a.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:opacity-80"
                      style={{ borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.08)' }}
                    >
                      Resolve
                    </button>
                  )}
                  {a.status !== 'resolved' && (
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
      <div className="rounded-xl border p-5 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Anomaly History — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={anomalyHistory} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D40" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} interval={4}
              tickFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <YAxis tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12 }}
              labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Area type="monotone" dataKey="count" fillOpacity={0.2} strokeWidth={2} stroke="var(--accent-rose)" fill="var(--accent-rose)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Configure alerts */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
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

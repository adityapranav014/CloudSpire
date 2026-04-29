import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Trash2, StopCircle, Play, ArrowRight, CheckCircle, AlertCircle,
  HardDrive, Cpu, Server, Globe, Database
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import ProviderBadge from '../components/ui/ProviderBadge'
import { awsEC2Instances, awsOrphanedResources } from '../data/mockAWS'
import { azureVMs } from '../data/mockAzure'
import {
  optimizationSummary, rightsizingRecommendations,
  reservedInstanceOpportunities, scheduledShutdowns
} from '../data/mockOptimizations'
import { useToast } from '../context/ToastContext'
import { usePermissions } from '../hooks/usePermissions'
import { PERMISSIONS } from '../data/mockRoles'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDec = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TABS = ['Idle Instances', 'Orphaned Resources', 'Right-Sizing', 'Reserved Instances', 'Scheduled Shutdowns']

const resourceTypeIcon = (type) => {
  if (type?.includes('Volume') || type?.includes('Snapshot')) return HardDrive
  if (type?.includes('IP')) return Globe
  if (type?.includes('Load')) return Server
  return Database
}

const confidenceStyle = {
  high: { bg: 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)', color: 'var(--accent-emerald)' },
  medium: { bg: 'color-mix(in srgb, var(--accent-amber) 12%, transparent)', color: 'var(--accent-amber)' },
  low: { bg: 'color-mix(in srgb, var(--text-secondary) 10%, transparent)', color: 'var(--text-secondary)' },
}

/** ConfirmModal — generic action confirmation */
function ConfirmModal({ open, onClose, onConfirm, title, description, action }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border p-6 w-full max-w-sm shadow-2xl"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent-rose) 12%, transparent)' }}>
            <AlertCircle size={20} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        </div>
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{description}</p>
        <p className="text-xs mb-5 px-3 py-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--accent-rose) 8%, transparent)', color: 'var(--accent-rose)' }}>
          ⚠ This action cannot be undone
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border transition-colors hover:bg-[--bg-hover]"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-rose)', color: '#fff' }}>
            {action}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/** Optimizer — savings recommendations across all providers */
export default function Optimizer() {
  const [activeTab, setActiveTab] = useState('Idle Instances')
  const [modal, setModal] = useState(null)
  const [selectedRows, setSelectedRows] = useState([])
  const [dismissed, setDismissed] = useState([])
  const [schedules, setSchedules] = useState(scheduledShutdowns)
  const { addToast } = useToast()
  const { can } = usePermissions()

  const idleInstances = [
    ...awsEC2Instances.filter(i => i.isIdle).map(i => ({
      id: i.instanceId, name: i.name, provider: 'aws', type: i.instanceType,
      cpu: i.cpu7dayAvg, cost: i.monthlyCost, reason: i.idleReason,
      region: i.region, savings: i.potentialSavings, state: i.state,
    })),
    ...azureVMs.filter(v => v.isIdle).map(v => ({
      id: v.resourceId, name: v.name, provider: 'azure', type: v.size,
      cpu: v.cpu7dayAvg, cost: v.monthlyCost, reason: 'CPU < 5% for 7 days',
      region: v.location, savings: v.monthlyCost * 0.8, state: v.powerState,
    })),
    ...rightsizingRecommendations
      .filter(item => item.provider === 'gcp' && item.cpuUtilization < 5)
      .map(item => ({
        id: item.resourceId,
        name: item.resourceName,
        provider: 'gcp',
        type: item.currentType,
        cpu: item.cpuUtilization,
        cost: item.currentMonthlyCost,
        reason: 'CPU < 5% for 7 days',
        region: item.region,
        savings: item.monthlySavings,
        state: 'running',
      })),
  ]

  const orphanedResources = [
    ...awsOrphanedResources.map(resource => ({ ...resource, provider: 'aws', daysSinceLastUsed: 42 })),
    {
      resourceId: 'disk-gcp-unused-001',
      provider: 'gcp',
      type: 'Persistent Disk',
      name: 'stale-analytics-disk',
      region: 'us-central1',
      monthlyCost: 22.8,
      createdAt: '2024-09-14',
      lastAttached: '2024-10-28',
      savingsIfDeleted: 22.8,
      daysSinceLastUsed: 180,
    },
    {
      resourceId: 'azure-ip-unused-001',
      provider: 'azure',
      type: 'Public IP',
      name: 'orphaned-pip-eastus',
      region: 'eastus',
      monthlyCost: 8.2,
      createdAt: '2024-11-08',
      lastAttached: '2024-12-01',
      savingsIfDeleted: 8.2,
      daysSinceLastUsed: 149,
    },
  ]
  const orphaned = orphanedResources.filter(r => !dismissed.includes(r.resourceId))

  const handleAction = (label, savingsMsg) => {
    setModal(null)
    setSelectedRows([])
    addToast(`${label} — ${savingsMsg}`, 'success')
  }

  const toggleRow = (id) => setSelectedRows(prev =>
    prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
  )

  const toggleSchedule = (id) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ConfirmModal
        open={!!modal}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction(modal?.action, modal?.savingsMsg)}
        title={modal?.title}
        description={modal?.description}
        action={modal?.action}
      />

      <PageHeader title="Cost Optimizer" subtitle="Identified savings opportunities across all cloud providers">
        {can(PERMISSIONS.APPLY_OPTIMIZATIONS) && (
          <button
            onClick={() => addToast('Review scheduled with FinOps team', 'success')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors hover:bg-[--bg-hover]"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Schedule Review
          </button>
        )}
        {can(PERMISSIONS.APPLY_OPTIMIZATIONS) && (
          <button
            onClick={() => setModal({
              title: 'Implement All Recommendations',
              description: `Apply all ${rightsizingRecommendations.length + idleInstances.length} pending recommendations to maximize savings.`,
              action: 'Implement All',
              savingsMsg: `${fmt.format(optimizationSummary.totalPotentialSavings)}/month saved`,
            })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-emerald)', color: '#fff' }}
          >
            <Zap size={14} /> Implement All ({fmt.format(optimizationSummary.totalPotentialSavings)}/mo)
          </button>
        )}
      </PageHeader>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Idle Instances', amount: optimizationSummary.savingsBreakdown.idleInstances, color: 'var(--accent-rose)' },
          { label: 'Orphaned Storage', amount: optimizationSummary.savingsBreakdown.orphanedStorage, color: 'var(--accent-amber)' },
          { label: 'Right-Sizing', amount: optimizationSummary.savingsBreakdown.rightSizing, color: 'var(--accent-violet)' },
          { label: 'Reserved Instances', amount: optimizationSummary.savingsBreakdown.reservedInstances, color: 'var(--accent-primary)' },
          { label: 'Scheduled Shutdowns', amount: optimizationSummary.savingsBreakdown.scheduledShutdowns, color: 'var(--accent-emerald)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3 text-center"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <p className="text-lg font-bold font-mono" style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>
              {fmt.format(s.amount)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="rounded-xl border p-4 mb-6 flex items-center gap-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
        <div className="flex-1">
          <div className="flex justify-between mb-1.5">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Implemented this month</span>
            <span className="text-sm font-mono font-semibold" style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>
              {fmt.format(optimizationSummary.implementedThisMonth)} ({optimizationSummary.savingsImplementedPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <div className="h-full rounded-full" style={{ width: `${optimizationSummary.savingsImplementedPercent}%`, background: 'var(--accent-emerald)' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto scrollbar-hide mb-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px shrink-0 whitespace-nowrap"
              style={{
                borderBottomColor: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Idle Instances */}
      {activeTab === 'Idle Instances' && (
        <div>
          {selectedRows.length > 0 && can(PERMISSIONS.APPLY_OPTIMIZATIONS) && (
            <div className="flex items-center gap-3 mb-3 p-3 rounded-xl border"
              style={{ background: 'color-mix(in srgb, var(--accent-rose) 8%, transparent)', borderColor: 'var(--accent-rose)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--accent-rose)' }}>
                {selectedRows.length} selected — {fmt.format(idleInstances.filter(i => selectedRows.includes(i.id)).reduce((s, i) => s + i.savings, 0))} savings
              </span>
              <button
                onClick={() => setModal({
                  title: 'Terminate Selected',
                  description: `Terminate ${selectedRows.length} selected idle instances. All data on instance storage will be lost.`,
                  action: 'Terminate',
                  savingsMsg: `${fmt.format(idleInstances.filter(i => selectedRows.includes(i.id)).reduce((s, i) => s + i.savings, 0))}/month saved`,
                })}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg"
                style={{ background: 'var(--accent-rose)', color: '#fff' }}>
                <Trash2 size={12} className="inline mr-1" /> Terminate Selected
              </button>
            </div>
          )}
          <div className="overflow-x-auto scrollbar-hide rounded-xl border" style={{ borderColor: 'var(--border-default)' }}>
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" onChange={e => setSelectedRows(e.target.checked ? idleInstances.map(i => i.id) : [])}
                      checked={selectedRows.length === idleInstances.length && idleInstances.length > 0}
                      className="accent-blue-500" />
                  </th>
                  {['Instance', 'Provider', 'Region', 'Type', 'CPU 7d', 'Cost/mo', 'Reason', 'Savings', 'Action'].map(h => (
                    <th key={h} className="text-left px-3 py-3 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {idleInstances.map(inst => (
                  <tr key={inst.id} className="border-b cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--border-subtle)', background: selectedRows.includes(inst.id) ? 'var(--accent-primary-subtle)' : undefined }}
                    onMouseEnter={e => e.currentTarget.style.background = selectedRows.includes(inst.id) ? 'var(--accent-primary-subtle)' : 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = selectedRows.includes(inst.id) ? 'var(--accent-primary-subtle)' : ''}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedRows.includes(inst.id)}
                        onChange={() => toggleRow(inst.id)} className="accent-blue-500" />
                    </td>
                    <td className="px-3 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{inst.name}</td>
                    <td className="px-3 py-3"><ProviderBadge provider={inst.provider} size="sm" /></td>
                    <td className="px-3 py-3 font-mono" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{inst.region}</td>
                    <td className="px-3 py-3 font-mono" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>{inst.type}</td>
                    <td className="px-3 py-3">
                      <span className="font-mono" style={{ color: inst.cpu < 5 ? 'var(--accent-rose)' : 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {inst.cpu}%
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmtDec.format(inst.cost)}
                    </td>
                    <td className="px-3 py-3 max-w-[120px]" style={{ color: 'var(--text-muted)' }}>{inst.reason}</td>
                    <td className="px-3 py-3 font-mono font-semibold" style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmtDec.format(inst.savings)}/mo
                    </td>
                    <td className="px-3 py-3">
                      {can(PERMISSIONS.APPLY_OPTIMIZATIONS) ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setModal({ title: 'Terminate Instance', description: `Terminate "${inst.name}" (${inst.type})?`, action: 'Terminate', savingsMsg: `${fmtDec.format(inst.savings)}/month saved` })}
                            className="px-2 py-1 text-[10px] font-semibold rounded-lg flex items-center gap-1"
                            style={{ background: 'color-mix(in srgb, var(--accent-rose) 12%, transparent)', color: 'var(--accent-rose)' }}>
                            <Trash2 size={10} /> Terminate
                          </button>
                          <button
                            onClick={() => setModal({ title: 'Stop Instance', description: `Stop "${inst.name}" to save on compute costs?`, action: 'Stop', savingsMsg: 'Compute charges paused' })}
                            className="px-2 py-1 text-[10px] font-semibold rounded-lg flex items-center gap-1"
                            style={{ background: 'color-mix(in srgb, var(--accent-amber) 12%, transparent)', color: 'var(--accent-amber)' }}>
                            <StopCircle size={10} /> Stop
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Orphaned Resources */}
      {activeTab === 'Orphaned Resources' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
            {orphaned.map(r => {
              const Icon = resourceTypeIcon(r.type)
              return (
                <div key={r.resourceId} className="rounded-xl border p-4"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.1)' }}>
                      <Icon size={16} style={{ color: 'var(--accent-rose)' }} />
                    </div>
                    <ProviderBadge provider={r.provider} size="sm" />
                  </div>
                  <p className="text-sm font-semibold mb-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{r.type} · {r.region}</p>
                  {r.sizeGB && <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{r.sizeGB} GB</p>}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Monthly Cost</p>
                      <p className="text-base font-bold font-mono" style={{ color: 'var(--accent-rose)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmtDec.format(r.monthlyCost)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Last Used</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.daysSinceLastUsed} days ago</p>
                    </div>
                  </div>
                  {can(PERMISSIONS.APPLY_OPTIMIZATIONS) && (
                    <button
                      onClick={() => setModal({
                        title: `Delete ${r.type}`,
                        description: `Delete "${r.name}"? This will save ${fmtDec.format(r.savingsIfDeleted)}/month.`,
                        action: 'Delete',
                        savingsMsg: `${fmtDec.format(r.savingsIfDeleted)}/month saved`,
                      })}
                      className="w-full py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                      style={{ background: 'color-mix(in srgb, var(--accent-rose) 12%, transparent)', color: 'var(--accent-rose)', border: '1px solid color-mix(in srgb, var(--accent-rose) 20%, transparent)' }}>
                      <Trash2 size={12} /> Delete Resource
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Total: {orphaned.length} orphaned resources costing{' '}
            <span className="font-semibold font-mono" style={{ color: 'var(--accent-rose)', fontFamily: "'JetBrains Mono', monospace" }}>
              {fmtDec.format(orphaned.reduce((s, r) => s + r.monthlyCost, 0))}/month
            </span>
          </p>
        </div>
      )}

      {/* Tab: Right-Sizing */}
      {activeTab === 'Right-Sizing' && (
        <div className="overflow-x-auto scrollbar-hide rounded-xl border" style={{ borderColor: 'var(--border-default)' }}>
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                {['Resource', 'Provider', 'Current → Recommended', 'CPU %', 'Mem %', 'Current $/mo', 'Savings $/mo', 'Confidence', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rightsizingRecommendations.map(r => (
                <tr key={r.id} className="border-b transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.resourceName}</p>
                    <p style={{ color: 'var(--text-muted)' }}>{r.resourceType}</p>
                  </td>
                  <td className="px-4 py-3"><ProviderBadge provider={r.provider} size="sm" /></td>
                  <td className="px-4 py-3 font-mono text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.currentType}</span>
                    <span style={{ color: 'var(--text-muted)' }}> → </span>
                    <span style={{ color: 'var(--accent-emerald)' }}>{r.recommendedType}</span>
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: r.cpuUtilization < 15 ? 'var(--accent-rose)' : 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {r.cpuUtilization}%
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>{r.memoryUtilization}%</td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtDec.format(r.currentMonthlyCost)}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold" style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>
                    -{fmtDec.format(r.monthlySavings)}/mo
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: confidenceStyle[r.confidence].bg, color: confidenceStyle[r.confidence].color }}>
                      {r.confidence.charAt(0).toUpperCase() + r.confidence.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {can(PERMISSIONS.APPLY_OPTIMIZATIONS) ? (
                      <button
                        onClick={() => setModal({
                          title: `Apply Right-Sizing`,
                          description: `Resize "${r.resourceName}" from ${r.currentType} to ${r.recommendedType}. Estimated monthly savings: ${fmtDec.format(r.monthlySavings)}.`,
                          action: 'Apply',
                          savingsMsg: `${fmtDec.format(r.monthlySavings)}/month saved`,
                        })}
                        className="px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-opacity hover:opacity-90"
                        style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                        Apply
                      </button>
                    ) : (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Reserved Instances */}
      {activeTab === 'Reserved Instances' && (
        <div className="grid grid-cols-3 gap-4">
          {reservedInstanceOpportunities.map(ri => (
            <div key={ri.id} className="rounded-xl border p-5"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
              <div className="flex items-center justify-between mb-3">
                <ProviderBadge provider={ri.provider} />
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)', color: 'var(--accent-emerald)' }}>
                  {ri.term}
                </span>
              </div>
              <p className="font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{ri.instanceType}</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{ri.service} · {ri.region}</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>On-Demand /mo</p>
                  <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtDec.format(ri.onDemandMonthlyCost)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Reserved /mo</p>
                  <p className="text-sm font-mono font-semibold" style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtDec.format(ri.reservedMonthlyCost)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Annual Savings</p>
                  <p className="text-sm font-mono font-semibold" style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmt.format(ri.monthlySavings * 12)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Utilization Est.</p>
                  <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {ri.utilizationEstimate}%
                  </p>
                </div>
              </div>
              {can(PERMISSIONS.APPLY_OPTIMIZATIONS) && (
                <button
                  onClick={() => setModal({
                    title: ri.provider === 'gcp' ? 'Create Committed Use Discount' : 'Purchase Reserved Instance',
                    description: `Commit to ${ri.instanceType} for ${ri.term} at ${ri.paymentOption}. Annual savings: ${fmt.format(ri.monthlySavings * 12)}.`,
                    action: ri.provider === 'gcp' ? 'Create CUD' : 'Purchase RI',
                    savingsMsg: `${fmt.format(ri.monthlySavings * 12)}/year saved`,
                  })}
                  className="w-full py-2 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
                  style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                  {ri.provider === 'gcp' ? 'Create CUD' : 'Purchase RI'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Scheduled Shutdowns */}
      {activeTab === 'Scheduled Shutdowns' && (
        <div className="space-y-4">
          {schedules.map(s => (
            <div key={s.id} className="rounded-xl border p-5 flex items-start gap-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
              {can(PERMISSIONS.SCHEDULE_SHUTDOWNS) ? (
                <button
                  onClick={() => toggleSchedule(s.id)}
                  className="w-11 h-6 rounded-full transition-colors relative overflow-hidden shrink-0 mt-0.5"
                  style={{ background: s.enabled ? 'var(--accent-emerald)' : 'var(--border-default)' }}
                >
                  <span className="absolute left-0.5 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: s.enabled ? 'translateX(20px)' : 'translateX(0px)' }} />
                </button>
              ) : (
                <div
                  className="w-11 h-6 rounded-full relative overflow-hidden shrink-0 mt-0.5 opacity-40"
                  style={{ background: s.enabled ? 'var(--accent-emerald)' : 'var(--border-default)' }}
                >
                  <span className="absolute left-0.5 top-1 w-4 h-4 rounded-full bg-white shadow"
                    style={{ transform: s.enabled ? 'translateX(20px)' : 'translateX(0px)' }} />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{s.description}</p>
                <div className="flex gap-4 text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Schedule: <span style={{ color: 'var(--text-secondary)' }}>{s.schedule}</span></span>
                  {s.nextRun && <span style={{ color: 'var(--text-muted)' }}>Next run: <span style={{ color: 'var(--accent-cyan)' }}>{new Date(s.nextRun).toLocaleString()}</span></span>}
                  {s.estimatedSavings > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>Saves: <span className="font-mono" style={{ color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>{fmt.format(s.estimatedSavings)}/mo</span></span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Download, Clock, Mail, Calendar, Plus, Play, Settings,
  BarChart3, Users2, ShieldAlert, Layers, TrendingUp, SlidersHorizontal
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { useToast } from '../context/ToastContext'

const reportTemplates = [
  { id: 1, title: 'Monthly Cost Digest', description: 'PDF summary of all providers with trend analysis and top cost drivers.', icon: BarChart3, color: 'var(--accent-primary)' },
  { id: 2, title: 'Cost by Team', description: 'Budget vs actuals breakdown per team for finance allocation.', icon: Users2, color: 'var(--accent-emerald)' },
  { id: 3, title: 'Anomaly Report', description: 'All detected anomalies with root cause analysis and resolution status.', icon: ShieldAlert, color: 'var(--accent-rose)' },
  { id: 4, title: 'RI Utilization', description: 'Reserved Instance and Committed Use Discount coverage report.', icon: Layers, color: 'var(--accent-violet)' },
  { id: 5, title: 'Year-over-Year', description: '12-month trend comparison across all cloud providers and services.', icon: TrendingUp, color: 'var(--accent-amber)' },
  { id: 6, title: 'Custom Report', description: 'Build your own report by selecting dimensions, filters, and date range.', icon: SlidersHorizontal, color: 'var(--accent-cyan)' },
]

const scheduledReports = [
  { id: 1, name: 'Monthly Cost Digest', frequency: 'Monthly', recipients: 'cfo@company.com', format: 'PDF', lastSent: 'Apr 1, 2025', nextSend: 'May 1, 2025' },
  { id: 2, name: 'Weekly Anomalies', frequency: 'Weekly', recipients: 'devops@company.com', format: 'Email', lastSent: 'Apr 22, 2025', nextSend: 'Apr 29, 2025' },
  { id: 3, name: 'Team Budget Report', frequency: 'Monthly', recipients: 'finance@company.com', format: 'CSV', lastSent: 'Apr 1, 2025', nextSend: 'May 1, 2025' },
]

/** Reports page — scheduled reports, export billing data */
export default function Reports() {
  const [exportFormat, setExportFormat] = useState('CSV')
  const [exportGranularity, setExportGranularity] = useState('Daily')
  const [exportProvider, setExportProvider] = useState('All Providers')
  const { addToast } = useToast()

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Reports" subtitle="Scheduled reports, templates, and billing data exports">
        <button
          onClick={() => addToast('New report schedule created', 'success')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent-blue)', color: '#fff' }}
        >
          <Plus size={14} /> Schedule Report
        </button>
      </PageHeader>

      {/* Report Templates */}
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Report Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {reportTemplates.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="rounded-xl border p-5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${r.color}18` }}
              >
                <r.icon size={20} style={{ color: r.color }} strokeWidth={1.75} />
              </div>
              <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: r.color }} />
            </div>
            <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{r.title}</h3>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{r.description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => addToast(`Generating "${r.title}"...`, 'info')}
                className="flex-1 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-opacity hover:opacity-90"
                style={{ background: r.color, color: '#fff' }}
              >
                <Play size={11} /> Generate Now
              </button>
              <button
                onClick={() => addToast(`"${r.title}" scheduled`, 'success')}
                className="flex-1 py-1.5 text-xs font-medium rounded-xl border transition-colors hover:bg-white/10 flex items-center justify-center gap-1"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <Clock size={11} /> Schedule
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scheduled Reports */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Scheduled Reports</h2>
        <div className="overflow-x-auto scrollbar-hide rounded-xl border" style={{ borderColor: 'var(--border-default)' }}>
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                {['Report Name', 'Frequency', 'Recipients', 'Format', 'Last Sent', 'Next Send', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduledReports.map(r => (
                <tr key={r.id} className="border-b"
                  style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    <span className="flex items-center gap-2"><FileText size={12} style={{ color: 'var(--text-muted)' }} />{r.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)' }}>
                      {r.frequency}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.recipients}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent-emerald)' }}>
                      {r.format}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{r.lastSent}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--accent-cyan)' }}>{r.nextSend}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => addToast(`Running "${r.name}" now...`, 'info')}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors hover:bg-white/10"
                        style={{ color: 'var(--accent-blue)' }}>
                        Run Now
                      </button>
                      <button onClick={() => addToast('Report schedule updated', 'success')}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <Settings size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Data */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
        <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Download size={14} /> Export Raw Data
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5">
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" defaultValue="2025-04-01"
                className="px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }} />
              <input type="date" defaultValue="2025-04-28"
                className="px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Provider</label>
            <div className="flex gap-1">
              {['All Providers', 'AWS', 'GCP', 'Azure'].map(p => (
                <button key={p} onClick={() => setExportProvider(p)}
                  className="flex-1 py-2 text-[10px] font-medium rounded-xl border transition-all"
                  style={{
                    background: exportProvider === p ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                    color: exportProvider === p ? '#fff' : 'var(--text-secondary)',
                    borderColor: exportProvider === p ? 'var(--accent-blue)' : 'var(--border-default)',
                  }}>
                  {p === 'All Providers' ? 'All' : p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Format</label>
            <div className="flex gap-1">
              {['CSV', 'JSON', 'Parquet'].map(f => (
                <button key={f} onClick={() => setExportFormat(f)}
                  className="flex-1 py-2 text-xs font-medium rounded-xl border transition-all"
                  style={{
                    background: exportFormat === f ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                    color: exportFormat === f ? '#fff' : 'var(--text-secondary)',
                    borderColor: exportFormat === f ? 'var(--accent-violet)' : 'var(--border-default)',
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Granularity</label>
            <div className="flex gap-1">
              {['Daily', 'Monthly'].map(g => (
                <button key={g} onClick={() => setExportGranularity(g)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border transition-all"
                  style={{
                    background: exportGranularity === g ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                    color: exportGranularity === g ? '#fff' : 'var(--text-secondary)',
                    borderColor: exportGranularity === g ? 'var(--accent-cyan)' : 'var(--border-default)',
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => addToast('Export ready, downloading...', 'success')}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-primary)', color: 'var(--bg-base)' }}
          >
            <Download size={14} /> Download Export
          </button>
        </div>
      </div>
    </motion.div>
  )
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Clock, Calendar, Plus, Play, Settings,
  BarChart3, Users2, ShieldAlert, Layers, TrendingUp, SlidersHorizontal, Database, FileJson, CalendarDays, Globe
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../data/mockRoles';
import { CloudProviderIcon } from '../components/ui/CloudProviderIcon';
import { getBrandSurfaceStyles } from '../constants/brandAssets';
import DateRangePickerSaaS from '../components/ui/DateRangePickerSaaS';

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
  const [exportProvider, setExportProvider] = useState('all')
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const { addToast } = useToast()
  const { can } = usePermissions()

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Reports" subtitle="Scheduled reports, templates, and billing data exports">
        {can(PERMISSIONS.SCHEDULE_REPORTS) && (
          <button
            onClick={() => addToast('New report schedule created', 'success')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shiny-primary transition-opacity hover:opacity-90"
          >
            <Plus size={14} /> Schedule Report
          </button>
        )}
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
            className="rounded-xl border p-5 shadow-depth-card"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-depth-inset"
                style={{ background: `color-mix(in srgb, ${r.color} 10%, var(--bg-base))` }}
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
                className="flex-1 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-depth-1 transition-opacity hover:opacity-90"
                style={{ background: r.color, color: '#fff', border: '1px solid transparent', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.15)' }}
              >
                <Play size={11} fill="currentColor" /> Generate Now
              </button>
              {can(PERMISSIONS.SCHEDULE_REPORTS) && (
                <button
                  onClick={() => addToast(`"${r.title}" scheduled`, 'success')}
                  className="flex-1 py-1.5 text-xs font-medium rounded-xl border shadow-depth-1 transition-colors flex items-center justify-center gap-1 hover:bg-[--bg-hover]"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  <Clock size={11} /> Schedule
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scheduled Reports */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Scheduled Reports</h2>
        <div className="overflow-x-auto scrollbar-hide rounded-xl border shadow-depth-inset" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)' }}>
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
                        className="px-2 py-1 rounded-lg text-[10px] border shadow-depth-1 font-semibold transition-colors hover:bg-[--bg-hover]"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--accent-blue)' }}>
                        Run Now
                      </button>
                      {can(PERMISSIONS.SCHEDULE_REPORTS) && (
                        <button onClick={() => addToast('Report schedule updated', 'success')}
                          className="p-1.5 rounded-lg hover:bg-[--bg-hover] bg-[--bg-surface] border shadow-depth-1 transition-colors" style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                          <Settings size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Raw Data */}
      <div className="rounded-xl border mb-10" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', boxShadow: '0 4px 6px -1px rgba(15,23,42,0.06), 0 2px 4px -2px rgba(15,23,42,0.04)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-primary-subtle)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
            <Download size={18} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Export Raw Data</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Download billing data for custom analysis</p>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-end gap-x-0 gap-y-5 px-6 py-5">

          {/* Date Range */}
          <div className="pr-6">
            <p className="text-[10px] font-semibold tracking-wide mb-1.5 uppercase" style={{ color: 'var(--text-muted)' }}>Date Range</p>
            <DateRangePickerSaaS value={dateRange} onChange={setDateRange} />
          </div>

          <div className="w-px self-stretch mx-0.5" style={{ background: 'var(--border-subtle)' }} />

          {/* Provider */}
          <div className="px-6">
            <p className="text-[10px] font-semibold tracking-wide mb-1.5 uppercase" style={{ color: 'var(--text-muted)' }}>Provider</p>
            <div className="flex gap-1.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'aws', label: 'AWS' },
                { key: 'gcp', label: 'GCP' },
                { key: 'azure', label: 'Azure' },
              ].map(p => {
                const isSelected = exportProvider === p.key;
                const brandStyle = p.key !== 'all' ? getBrandSurfaceStyles(p.key, 0.1) : null;
                return (
                  <button
                    key={p.key}
                    onClick={() => setExportProvider(p.key)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                    style={{
                      background: isSelected
                        ? p.key === 'all' ? 'var(--accent-primary)' : brandStyle?.background
                        : 'var(--bg-elevated)',
                      color: isSelected
                        ? p.key === 'all' ? '#fff' : brandStyle?.color
                        : 'var(--text-secondary)',
                      border: `1px solid ${isSelected
                        ? p.key === 'all' ? 'var(--accent-primary)' : brandStyle?.borderColor
                        : 'var(--border-default)'}`,
                    }}
                  >
                    {p.key === 'all'
                      ? <Globe size={13} />
                      : <CloudProviderIcon provider={p.key} className="h-3.5 w-3.5" />
                    }
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-px self-stretch mx-0.5" style={{ background: 'var(--border-subtle)' }} />

          {/* Format */}
          <div className="px-6">
            <p className="text-[10px] font-semibold tracking-wide mb-1.5 uppercase" style={{ color: 'var(--text-muted)' }}>Format</p>
            <div className="flex gap-1.5">
              {[
                { key: 'CSV', Icon: FileText },
                { key: 'JSON', Icon: FileJson },
                { key: 'Parquet', Icon: Database },
              ].map(({ key, Icon }) => {
                const isSelected = exportFormat === key;
                return (
                  <button
                    key={key}
                    onClick={() => setExportFormat(key)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                    style={{
                      background: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                    }}
                  >
                    <Icon size={12} /> {key}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-px self-stretch mx-0.5" style={{ background: 'var(--border-subtle)' }} />

          {/* Granularity */}
          <div className="px-6">
            <p className="text-[10px] font-semibold tracking-wide mb-1.5 uppercase" style={{ color: 'var(--text-muted)' }}>Granularity</p>
            <div className="flex gap-1.5">
              {[
                { key: 'Daily', Icon: CalendarDays },
                { key: 'Monthly', Icon: Calendar },
              ].map(({ key, Icon }) => {
                const isSelected = exportGranularity === key;
                return (
                  <button
                    key={key}
                    onClick={() => setExportGranularity(key)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                    style={{
                      background: isSelected ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                      boxShadow: isSelected ? 'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${isSelected ? 'var(--border-strong)' : 'var(--border-default)'}`,
                    }}
                  >
                    <Icon size={12} /> {key}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Download — pushed to end */}
          <div className="ml-auto pl-4">
            <button
              onClick={() => addToast('Export ready, downloading...', 'success')}
              disabled={!can(PERMISSIONS.EXPORT_DATA)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl shiny-primary transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Download size={15} /> Download Export
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

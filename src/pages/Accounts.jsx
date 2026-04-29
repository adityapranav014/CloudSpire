import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, CheckCircle, Link2, ExternalLink, Shield, Server, Box } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import ProviderBadge from '../components/ui/ProviderBadge'
import TrendBadge from '../components/ui/TrendBadge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "../components/ui/sheet"
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { awsAccounts, awsServiceBreakdown } from '../data/mockAWS'
import { gcpProjects, gcpServiceBreakdown } from '../data/mockGCP'
import { azureSubscriptions, azureServiceBreakdown } from '../data/mockAzure'
import { dailySpend } from '../data/mockUnified'
import { useToast } from '../context/ToastContext'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtShort = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 1, notation: 'compact' })

const TABS = ['All Accounts', 'AWS', 'GCP', 'Azure']

const allAccounts = [
  ...awsAccounts.map(a => ({ ...a, provider: 'aws', lastSync: '2 min ago', status: 'connected', region: 'us-east-1' })),
  ...gcpProjects.map(p => ({ id: p.id, name: p.name, spend: p.spend, resources: p.resources, env: p.env, provider: 'gcp', lastSync: '3 min ago', status: 'connected', region: 'us-central1' })),
  ...azureSubscriptions.map(s => ({ id: s.id, name: s.name, spend: s.spend, resources: s.resources, env: s.env, provider: 'azure', lastSync: '4 min ago', status: 'connected', region: 'eastus' })),
]

const providerServiceBreakdowns = {
  aws: awsServiceBreakdown,
  gcp: gcpServiceBreakdown,
  azure: azureServiceBreakdown,
}

const providerResourceTemplates = {
  aws: [
    { type: 'EC2', name: 'prod-web-server-01', status: 'Running' },
    { type: 'RDS', name: 'prod-db-cluster', status: 'Available' },
    { type: 'S3', name: 'analytics-archive-bucket', status: 'Healthy' },
    { type: 'Lambda', name: 'prod-data-processor', status: 'Active' },
  ],
  gcp: [
    { type: 'Compute Engine', name: 'prod-api-node-01', status: 'Running' },
    { type: 'BigQuery', name: 'finops_reporting', status: 'Healthy' },
    { type: 'Cloud SQL', name: 'platform-postgres', status: 'Available' },
    { type: 'GKE', name: 'prod-gke-cluster', status: 'Active' },
  ],
  azure: [
    { type: 'VM', name: 'vm-prod-web-001', status: 'Running' },
    { type: 'SQL Database', name: 'prod-sql-eastus', status: 'Online' },
    { type: 'AKS', name: 'aks-prod-eastus', status: 'Healthy' },
    { type: 'Blob Storage', name: 'prodblobarchive01', status: 'Available' },
  ],
}

function buildAccountTrend(account) {
  const providerKey = account.provider === 'azure' ? 'azure' : account.provider
  const providerTotal = allAccounts
    .filter(item => item.provider === account.provider)
    .reduce((sum, item) => sum + item.spend, 0)
  const accountShare = providerTotal > 0 ? account.spend / providerTotal : 0

  return dailySpend.slice(-90).map((day) => {
    const dailyProviderSpend = day[providerKey] ?? 0
    return {
      date: day.date,
      spend: +(dailyProviderSpend * accountShare).toFixed(2),
    }
  })
}

function buildAccountResources(account) {
  return providerResourceTemplates[account.provider].map((resource, index) => ({
    ...resource,
    monthlyCost: account.spend / (8 + index * 2),
    region: account.region,
  }))
}

/** Accounts page — connected cloud accounts and per-account data */
export default function Accounts() {
  const [tab, setTab] = useState('All Accounts')
  const [connectOpen, setConnectOpen] = useState(false)
  const [connectTab, setConnectTab] = useState('aws')
  const { addToast } = useToast()

  const filtered = tab === 'All Accounts'
    ? allAccounts
    : allAccounts.filter(a => a.provider === tab.toLowerCase())

  const [selectedAccount, setSelectedAccount] = useState(null)

  const selectedServices = selectedAccount ? providerServiceBreakdowns[selectedAccount.provider].slice(0, 5) : []
  const selectedTrend = selectedAccount ? buildAccountTrend(selectedAccount) : []
  const selectedResources = selectedAccount ? buildAccountResources(selectedAccount) : []

  const handleSync = () => addToast('Syncing all accounts...', 'info')
  const handleConnect = () => {
    setConnectOpen(false)
    addToast('Connection test successful! Account added.', 'success')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Cloud Accounts" subtitle="Manage connected cloud accounts and view per-account data">
        <button onClick={handleSync}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors hover:bg-white/10"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
          <RefreshCw size={14} /> Sync All
        </button>
        <button onClick={() => setConnectOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent-blue)', color: '#fff' }}>
          <Plus size={14} /> Connect Account
        </button>
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { provider: 'aws', label: 'AWS', accounts: awsAccounts.length, spend: awsAccounts.reduce((s, a) => s + a.spend, 0) },
          { provider: 'gcp', label: 'Google Cloud', accounts: gcpProjects.length, spend: gcpProjects.reduce((s, p) => s + p.spend, 0) },
          { provider: 'azure', label: 'Microsoft Azure', accounts: azureSubscriptions.length, spend: azureSubscriptions.reduce((s, a) => s + a.spend, 0) },
        ].map(p => (
          <div key={p.provider} className="rounded-xl border p-4 flex items-center gap-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <ProviderBadge provider={p.provider} size="lg" />
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.label}</p>
              <p className="font-bold font-mono" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt.format(p.spend)}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.accounts} account{p.accounts !== 1 ? 's' : ''} connected</p>
            </div>
            <CheckCircle size={16} className="ml-auto" style={{ color: 'var(--accent-emerald)' }} />
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
            style={{
              background: tab === t ? 'var(--accent-blue)' : 'var(--bg-elevated)',
              color: tab === t ? '#fff' : 'var(--text-secondary)',
              borderColor: tab === t ? 'var(--accent-blue)' : 'var(--border-default)',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Accounts table */}
      <div className="rounded-xl border overflow-x-auto scrollbar-hide" style={{ borderColor: 'var(--border-default)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Provider', 'Account ID / Project', 'Name', 'Environment', 'Monthly Spend', 'Resources', 'Status', 'Last Sync', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((acct, i) => (
              <tr key={acct.id} className="border-b cursor-pointer hover:bg-white/[0.03] transition-colors"
                style={{ borderColor: 'var(--border-subtle)' }}
                onClick={(e) => {
                  if (e.target.closest('button')) return; // Ignore button clicks
                  setSelectedAccount(acct);
                }}>
                <td className="px-4 py-3"><ProviderBadge provider={acct.provider} size="sm" /></td>
                <td className="px-4 py-3 font-mono text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", maxWidth: 140 }}>
                  <span className="truncate block" title={acct.id}>{acct.id}</span>
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{acct.name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      background: acct.env === 'production' ? 'rgba(59,130,246,0.12)' : acct.env === 'staging' ? 'rgba(245,158,11,0.12)' : 'rgba(138,155,184,0.1)',
                      color: acct.env === 'production' ? 'var(--accent-blue)' : acct.env === 'staging' ? 'var(--accent-amber)' : 'var(--text-muted)',
                    }}>
                    {acct.env}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt.format(acct.spend)}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{acct.resources}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--accent-emerald)' }}>
                    <CheckCircle size={11} /> Connected
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{acct.lastSync}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => addToast(`Syncing ${acct.name}...`, 'info')}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }} title="Sync now">
                      <RefreshCw size={12} />
                    </button>
                    <button onClick={() => addToast('Opening in cloud console', 'info')}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }} title="Open in console">
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Connect modal */}
      {connectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border p-6 w-full max-w-lg shadow-2xl"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Connect Cloud Account</h3>
              <button onClick={() => setConnectOpen(false)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>

            {/* Provider tabs */}
            <div className="flex gap-2 mb-5">
              {['aws', 'gcp', 'azure'].map(p => (
                <button key={p} onClick={() => setConnectTab(p)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: connectTab === p ? 'var(--bg-card)' : 'var(--bg-surface)',
                    border: `1px solid ${connectTab === p ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                    color: connectTab === p ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>
                  <ProviderBadge provider={p} size="sm" />
                </button>
              ))}
            </div>

            {connectTab === 'aws' && (
              <div className="space-y-3">
                {[
                  { label: 'AWS Access Key ID', placeholder: 'AKIAIOSFODNN7EXAMPLE' },
                  { label: 'AWS Secret Access Key', placeholder: '••••••••••••••••••••' },
                  { label: 'Account Name (optional)', placeholder: 'e.g. Production - Main' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                    <input type={f.label.includes('Secret') ? 'password' : 'text'} placeholder={f.placeholder}
                      className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }} />
                  </div>
                ))}
              </div>
            )}
            {connectTab === 'gcp' && (
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Upload Service Account JSON</label>
                <div className="border-2 border-dashed rounded-xl p-8 text-center transition-colors"
                  style={{ borderColor: 'var(--border-default)' }}>
                  <Link2 size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Drag & drop service-account.json here</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>or click to browse</p>
                </div>
              </div>
            )}
            {connectTab === 'azure' && (
              <div className="space-y-3">
                {['Tenant ID', 'Client ID', 'Client Secret', 'Subscription ID'].map(f => (
                  <div key={f}>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{f}</label>
                    <input type={f === 'Client Secret' ? 'password' : 'text'}
                      placeholder={f === 'Tenant ID' ? 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' : f}
                      className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setConnectOpen(false)}
                className="flex-1 py-2.5 text-sm rounded-xl border hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button onClick={() => addToast('Testing connection...', 'info')}
                className="px-4 py-2.5 text-sm rounded-xl border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
                Test Connection
              </button>
              <button onClick={handleConnect}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                Connect
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Account Details Sheet */}
      <Sheet open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <SheetContent showCloseButton={false} className="w-[420px] sm:w-[500px] overflow-y-auto p-0 border-l" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)' }}>
          {selectedAccount && (() => {
            const accentColor =
              selectedAccount.provider === 'aws' ? '#F79009' :
              selectedAccount.provider === 'gcp' ? '#3B82F6' : '#0078D4'
            return (
              <>
                {/* Header band */}
                <div className="relative px-6 pt-5 pb-5 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  {/* Provider accent stripe */}
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accentColor }} />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProviderBadge provider={selectedAccount.provider} size="lg" />
                      <div className="min-w-0">
                        <SheetTitle className="text-base font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                          {selectedAccount.name}
                        </SheetTitle>
                        <SheetDescription className="mt-0.5 font-mono text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                          {selectedAccount.id}
                        </SheetDescription>
                      </div>
                    </div>
                    <SheetClose className="shrink-0 p-1.5 rounded-lg hover:bg-black/[0.06] transition-colors" style={{ color: 'var(--text-muted)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </SheetClose>
                  </div>

                  {/* Inline stats row */}
                  <div className="mt-4 grid grid-cols-3 divide-x" style={{ divideColor: 'var(--border-subtle)' }}>
                    {[
                      { label: 'MTD Spend', value: fmt.format(selectedAccount.spend), sub: '↑ 12% vs last mo', subColor: '#F43F5E' },
                      { label: 'Resources', value: selectedAccount.resources, sub: selectedAccount.region },
                      { label: 'Status', value: 'Connected', sub: `Synced ${selectedAccount.lastSync}`, valueColor: '#10B981' },
                    ].map((s, i) => (
                      <div key={i} className="px-3 first:pl-0 last:pr-0">
                        <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                        <p className="text-sm font-bold font-mono leading-tight" style={{ color: s.valueColor ?? 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
                        <p className="text-[10px] mt-0.5 truncate" style={{ color: s.subColor ?? 'var(--text-muted)' }}>{s.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">

                  {/* Account health */}
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest mb-2.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ACCOUNT HEALTH</p>
                    <div className="rounded-xl border overflow-hidden divide-y" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <Shield size={13} style={{ color: '#10B981' }} />
                          <span>IAM Status</span>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>Secure</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <CheckCircle size={13} style={{ color: 'var(--accent-blue)' }} />
                          <span>Sync Schedule</span>
                        </div>
                        <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>Every 1 hour</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <Server size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>Region</span>
                        </div>
                        <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>{selectedAccount.region}</span>
                      </div>
                    </div>
                  </div>

                  {/* 90-Day Spend Trend */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[10px] font-semibold tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>90-DAY SPEND TREND</p>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Daily</span>
                    </div>
                    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
                      <div className="h-36 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={selectedTrend} margin={{ top: 4, right: 0, left: -8, bottom: 0 }}>
                            <defs>
                              <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={accentColor} stopOpacity={0.18} />
                                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                            <XAxis dataKey="date" hide />
                            <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={36} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '11px' }}
                              formatter={v => [fmt.format(v), 'Spend']}
                            />
                            <Area type="monotone" dataKey="spend" stroke={accentColor} strokeWidth={1.5} fillOpacity={1} fill="url(#areaColor)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Top Spend by Service */}
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest mb-2.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TOP SERVICES</p>
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
                      {selectedServices.map((svc, i) => {
                        const max = selectedServices[0]?.spend ?? 1
                        const pct = Math.round((svc.spend / max) * 100)
                        return (
                          <div key={svc.service} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
                            <span className="text-xs w-5 text-right shrink-0 font-mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                            <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{svc.service}</span>
                            <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accentColor }} />
                            </div>
                            <span className="text-[11px] font-mono font-semibold shrink-0" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{fmtShort.format(svc.spend)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Top Resources */}
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest mb-2.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TOP RESOURCES</p>
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
                      {selectedResources.map((resource) => (
                        <div key={resource.name} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--bg-elevated)' }}>
                            <Box size={11} style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{resource.name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{resource.type} · {resource.status}</p>
                          </div>
                          <span className="text-[11px] font-mono font-semibold shrink-0" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>{fmtShort.format(resource.monthlyCost)}/mo</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 pb-2">
                    <button onClick={() => addToast(`Syncing ${selectedAccount.name}...`, 'info')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-xl border transition-colors hover:bg-black/[0.04]"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                      <RefreshCw size={12} /> Sync Now
                    </button>
                    <button onClick={() => addToast('Opening in cloud console', 'info')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl transition-opacity hover:opacity-90"
                      style={{ background: accentColor, color: '#fff' }}>
                      <ExternalLink size={12} /> Open Console
                    </button>
                  </div>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}

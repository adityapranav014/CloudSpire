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
      <div className="flex gap-1 mb-4">
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
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
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
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto border-l" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          {selectedAccount && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <ProviderBadge provider={selectedAccount.provider} size="lg" />
                  <div>
                    <SheetTitle style={{ color: 'var(--text-primary)', fontSize: '1.25rem' }}>{selectedAccount.name}</SheetTitle>
                    <SheetDescription style={{ color: 'var(--text-muted)' }} className="font-mono text-[10px] mt-0.5">
                      {selectedAccount.id}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
                    <p className="text-xs mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>Mtd Spend</p>
                    <p className="font-mono text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {fmt.format(selectedAccount.spend)}
                    </p>
                    <div className="mt-2 text-xs text-red-400 flex items-center gap-1">↑ 12% vs last mo</div>
                  </div>
                  <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
                    <p className="text-xs mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>Active Resources</p>
                    <p className="font-mono text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedAccount.resources}
                    </p>
                  </div>
                </div>

                {/* Status List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
                    <div className="flex items-center gap-2 text-sm"><Shield size={16} className="text-emerald-400" /> IAM Status</div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Secure</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
                    <div className="flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-blue-400" /> Sync Schedule</div>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Every 1 hour</span>
                  </div>
                </div>

                {/* 90 Day Spend Chart */}
                <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>90-Day Spend Trend</h4>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Daily spend for this account</span>
                  </div>
                  <div className="h-40 w-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedTrend}>
                        <defs>
                          <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={
                              selectedAccount.provider === 'aws' ? '#F79009' :
                              selectedAccount.provider === 'gcp' ? '#3B82F6' : '#06B6D4'
                            } stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={
                              selectedAccount.provider === 'aws' ? '#F79009' :
                              selectedAccount.provider === 'gcp' ? '#3B82F6' : '#06B6D4'
                            } stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                        <XAxis dataKey="date" hide />
                        <YAxis tickFormatter={v => `$${v/1000}k`} width={40} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                          itemStyle={{ color: '#fff' }} formatter={v => fmt.format(v)}
                        />
                        <Area
                          type="monotone"
                          dataKey="spend"
                          stroke={
                            selectedAccount.provider === 'aws' ? '#F79009' :
                            selectedAccount.provider === 'gcp' ? '#3B82F6' : '#06B6D4'
                          }
                          fillOpacity={1}
                          fill="url(#areaColor)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Services Bar Chart */}
                <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
                  <h4 className="text-xs font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Spend by Service</h4>
                  <div className="h-40 w-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedServices} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="var(--border-subtle)" />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="service" width={80} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          formatter={v => fmt.format(v)}
                        />
                        <Bar dataKey="spend" radius={[0, 4, 4, 0]} fill={
                          selectedAccount.provider === 'aws' ? '#F79009' :
                          selectedAccount.provider === 'gcp' ? '#3B82F6' : '#06B6D4'
                        }/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Resources List */}
                <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Top Resources</h4>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Representative resources in this account</span>
                  </div>
                  <div className="space-y-2.5">
                    {selectedResources.map((resource) => (
                      <div
                        key={resource.name}
                        className="flex items-center justify-between p-3 rounded-xl border"
                        style={{ borderColor: 'var(--border-default)', background: 'rgba(255,255,255,0.02)' }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{resource.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>{resource.type}</span>
                          </div>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{resource.region} · {resource.status}</p>
                        </div>
                        <span className="text-xs font-mono font-semibold shrink-0" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {fmtShort.format(resource.monthlyCost)}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}

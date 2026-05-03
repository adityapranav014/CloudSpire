import { useMigrationData } from '../hooks/useMigrationData';
import { useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, CheckCircle, Link2, ExternalLink, Shield, Server, Box, Loader2 } from 'lucide-react'
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
import api from '../services/api'
import { selectUser } from '../store/slices/authSlice'

import { useToast } from '../context/ToastContext'
import { usePermissions } from '../hooks/usePermissions'


const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtShort = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 1, notation: 'compact' })

const TABS = ['All Accounts', 'AWS', 'GCP', 'Azure']

/** Accounts page — connected cloud accounts and per-account data */
export default function Accounts() {
  const currentUser = useSelector(selectUser);

  // Real connected accounts list
  const { data: accountsData, isLoading: accountsLoading, mutate: reloadAccounts } = useMigrationData('/cloud');
  // Provider-scoped data (falls back to sample data on backend if no real accounts)
  const { data: d0, isLoading: l0 } = useMigrationData('/cloud/aws');
  const { awsAccounts = [], awsServiceBreakdown = [] } = d0 || {};
  const { data: d1, isLoading: l1 } = useMigrationData('/cloud/gcp');
  const { gcpProjects = [], gcpServiceBreakdown = [] } = d1 || {};
  const { data: d2, isLoading: l2 } = useMigrationData('/cloud/azure');
  const { azureSubscriptions = [], azureServiceBreakdown = [] } = d2 || {};
  const { data: d3, isLoading: l3 } = useMigrationData('/unified');
  const { dailySpend = [] } = d3 || {};
  const { data: d4, isLoading: l4 } = useMigrationData('/roles');
  const { PERMISSIONS = {} } = d4 || {};

  const isLoading = accountsLoading || l0 || l1 || l2 || l3 || l4;

  const [tab, setTab] = useState('All Accounts')
  const [connectOpen, setConnectOpen] = useState(false)
  const [connectTab, setConnectTab] = useState('aws')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const { addToast } = useToast()
  const { can } = usePermissions()

  // Form state for each provider
  const [awsForm, setAwsForm] = useState({ accessKeyId: '', secretAccessKey: '', accountName: '' })
  const [azureForm, setAzureForm] = useState({ tenantId: '', clientId: '', clientSecret: '', subscriptionId: '' })
  const [gcpJsonText, setGcpJsonText] = useState('')

  // Normalize real CloudAccount documents to display shape
  const realAccounts = (accountsData?.data?.accounts || []).map(a => ({
    id: a._id,
    _id: a._id,
    provider: a.provider,
    name: a.name,
    env: 'production',
    spend: 0,
    resources: '—',
    lastSync: a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : '—',
    region: '—',
    trendData: [],
    resourceList: [],
    isReal: true,
    isMock: false,
  }));

  // Mock accounts from provider API sample data — always shown alongside real accounts
  const mockAccounts = [
    ...awsAccounts.map(a => ({ ...a, provider: 'aws',   isMock: true, isReal: false })),
    ...gcpProjects.map(p => ({ ...p, provider: 'gcp',   isMock: true, isReal: false })),
    ...azureSubscriptions.map(s => ({ ...s, provider: 'azure', isMock: true, isReal: false })),
  ];

  // Real accounts first, then mock/sample accounts
  const allAccounts = [...realAccounts, ...mockAccounts]

  const providerServiceBreakdowns = {
    aws: awsServiceBreakdown,
    gcp: gcpServiceBreakdown,
    azure: azureServiceBreakdown,
  }

  const filtered = tab === 'All Accounts'
    ? allAccounts
    : allAccounts.filter(a => a.provider === tab.toLowerCase())

  const selectedServices = selectedAccount ? (providerServiceBreakdowns[selectedAccount.provider] || []).slice(0, 5) : []
  const selectedTrend = selectedAccount ? (selectedAccount.trendData || []) : []
  const selectedResources = selectedAccount ? (selectedAccount.resourceList || []) : []
  const handleSync = () => addToast('Syncing all accounts...', 'info')

  const handleConnect = useCallback(async () => {
    setIsConnecting(true)
    try {
      let payload = { provider: connectTab, name: '' }

      if (connectTab === 'aws') {
        if (!awsForm.accessKeyId || !awsForm.secretAccessKey) {
          addToast('Please fill in AWS Access Key ID and Secret Access Key.', 'error'); setIsConnecting(false); return;
        }
        payload.name = awsForm.accountName || `AWS Account (${awsForm.accessKeyId.slice(0, 8)}...)`
        payload.credentials = { accessKeyId: awsForm.accessKeyId, secretAccessKey: awsForm.secretAccessKey }
      } else if (connectTab === 'azure') {
        const { tenantId, clientId, clientSecret, subscriptionId } = azureForm;
        if (!tenantId || !clientId || !clientSecret) {
          addToast('Please fill in Tenant ID, Client ID, and Client Secret.', 'error'); setIsConnecting(false); return;
        }
        payload.name = `Azure (${subscriptionId || tenantId.slice(0, 8)}...)`
        payload.credentials = { tenantId, clientId, clientSecret, subscriptionId }
      } else if (connectTab === 'gcp') {
        if (!gcpJsonText) {
          addToast('Please provide a GCP service account JSON.', 'error'); setIsConnecting(false); return;
        }
        let parsed;
        try { parsed = JSON.parse(gcpJsonText); } catch { addToast('Invalid JSON file.', 'error'); setIsConnecting(false); return; }
        payload.name = parsed.project_id || 'GCP Project'
        payload.credentials = { serviceAccountJson: gcpJsonText }
      }

      await api.post('/cloud/connect', payload)
      addToast(`${connectTab.toUpperCase()} account connected successfully!`, 'success')
      setConnectOpen(false)
      // Reset forms
      setAwsForm({ accessKeyId: '', secretAccessKey: '', accountName: '' })
      setAzureForm({ tenantId: '', clientId: '', clientSecret: '', subscriptionId: '' })
      setGcpJsonText('')
      // Reload accounts list
      reloadAccounts()
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to connect account'
      addToast(msg, 'error')
    } finally {
      setIsConnecting(false)
    }
  }, [connectTab, awsForm, azureForm, gcpJsonText, addToast, reloadAccounts])

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Cloud Accounts" subtitle="Manage connected cloud accounts and view per-account data">
        {can(PERMISSIONS.SYNC_ACCOUNTS) && (
          <button onClick={handleSync}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors shadow-depth-1 hover:bg-[--bg-hover]"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            <RefreshCw size={14} /> Sync All
          </button>
        )}
        {can(PERMISSIONS.CONNECT_ACCOUNTS) && (
          <button onClick={() => setConnectOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shiny-primary transition-opacity hover:opacity-90">
            <Plus size={14} /> Connect Account
          </button>
        )}
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { provider: 'aws', label: 'AWS', accounts: allAccounts.filter(a => a.provider === 'aws').length, spend: allAccounts.filter(a => a.provider === 'aws').reduce((s, a) => s + (a.spend || 0), 0) },
          { provider: 'gcp', label: 'Google Cloud', accounts: allAccounts.filter(a => a.provider === 'gcp').length, spend: allAccounts.filter(a => a.provider === 'gcp').reduce((s, a) => s + (a.spend || 0), 0) },
          { provider: 'azure', label: 'Microsoft Azure', accounts: allAccounts.filter(a => a.provider === 'azure').length, spend: allAccounts.filter(a => a.provider === 'azure').reduce((s, a) => s + (a.spend || 0), 0) },
        ].map(p => (
          <div key={p.provider} className="rounded-xl border p-4 flex items-center gap-4 shadow-depth-card"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
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
        {TABS.map(t => {
          const isSelected = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
              style={{
                background: isSelected ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                boxShadow: isSelected ? 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(0,0,0,0.06)' : 'none',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderColor: isSelected ? 'var(--border-strong)' : 'var(--border-default)',
              }}>
              {t}
            </button>
          )
        })}
      </div>

      {/* Legend — only shown when real + mock accounts coexist */}
      {realAccounts.length > 0 && mockAccounts.length > 0 && (
        <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5"><CheckCircle size={11} style={{ color: 'var(--accent-emerald)' }} /> <span style={{ color: 'var(--accent-emerald)' }}>Live</span> — real connected account</span>
          <span className="flex items-center gap-1.5"><Box size={11} style={{ color: 'var(--accent-amber)' }} /> <span style={{ color: 'var(--accent-amber)' }}>Demo</span> — sample data for reference</span>
        </div>
      )}

      {/* Accounts table */}
      <div className="rounded-xl border overflow-x-auto scrollbar-hide shadow-depth-inset" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)' }}>
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
              <tr key={acct.id || i}
                className="border-b cursor-pointer hover:bg-[--bg-hover] transition-colors"
                style={{
                  borderColor: 'var(--border-subtle)',
                  opacity: acct.isMock ? 0.82 : 1,
                  borderLeft: acct.isMock ? '3px solid var(--accent-amber)' : '3px solid transparent',
                }}
                onClick={(e) => {
                  if (e.target.closest('button')) return;
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
                  {acct.isMock ? (
                    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--accent-amber)' }}>
                      <Box size={11} /> Demo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--accent-emerald)' }}>
                      <CheckCircle size={11} /> Live
                    </span>
                  )}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{acct.lastSync}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {can(PERMISSIONS.SYNC_ACCOUNTS) && (
                      <button onClick={(e) => { e.stopPropagation(); addToast(`Syncing ${acct.name}...`, 'info'); }}
                        className="p-1.5 rounded-lg hover:bg-[--bg-hover] transition-colors" style={{ color: 'var(--text-muted)' }} title="Sync now">
                        <RefreshCw size={12} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); addToast('Opening in cloud console', 'info'); }}
                      className="p-1.5 rounded-lg hover:bg-[--bg-hover] transition-colors" style={{ color: 'var(--text-muted)' }} title="Open in console">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
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
              {['aws', 'gcp', 'azure'].map(p => {
                const isSelected = connectTab === p;
                return (
                  <button key={p} onClick={() => setConnectTab(p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${isSelected ? 'shadow-depth-1' : ''}`}
                    style={{
                      background: isSelected ? 'var(--bg-surface)' : 'var(--bg-base)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                      border: `1px solid ${isSelected ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                    }}>
                    <ProviderBadge provider={p} size="sm" />
                  </button>
                )
              })}
            </div>

            {connectTab === 'aws' && (
              <div className="space-y-3">
                {[
                  { label: 'AWS Access Key ID', key: 'accessKeyId', placeholder: 'AKIAIOSFODNN7EXAMPLE', type: 'text' },
                  { label: 'AWS Secret Access Key', key: 'secretAccessKey', placeholder: '••••••••••••••••••••', type: 'password' },
                  { label: 'Account Name (optional)', key: 'accountName', placeholder: 'e.g. Production - Main', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={awsForm[f.key]}
                      onChange={e => setAwsForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border outline-none shadow-depth-1"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }} />
                  </div>
                ))}
              </div>
            )}
            {connectTab === 'gcp' && (
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Paste or upload service-account.json</label>
                <textarea rows={6} value={gcpJsonText} onChange={e => setGcpJsonText(e.target.value)}
                  placeholder='{"type": "service_account", "project_id": "my-project", ...}'
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border outline-none shadow-depth-1 resize-none"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }} />
              </div>
            )}
            {connectTab === 'azure' && (
              <div className="space-y-3">
                {[
                  { label: 'Tenant ID', key: 'tenantId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
                  { label: 'Client ID', key: 'clientId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
                  { label: 'Client Secret', key: 'clientSecret', placeholder: '••••••••••••••••••••', type: 'password' },
                  { label: 'Subscription ID', key: 'subscriptionId', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={azureForm[f.key]}
                      onChange={e => setAzureForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border outline-none shadow-depth-1"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setConnectOpen(false)} disabled={isConnecting}
                className="flex-1 py-2.5 text-sm rounded-xl border hover:bg-[--bg-hover] shadow-depth-1 transition-colors disabled:opacity-50"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button onClick={handleConnect} disabled={isConnecting}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl shiny-primary transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {isConnecting ? <><Loader2 size={14} className="animate-spin" /> Connecting...</> : 'Connect Account'}
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
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
                    <div className="rounded-xl border overflow-hidden divide-y shadow-depth-inset" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
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
                      <div className="h-36 w-full" style={{ minWidth: 0, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <AreaChart data={selectedTrend} margin={{ top: 4, right: 0, left: -8, bottom: 0 }}>
                            <defs>
                              <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={accentColor} stopOpacity={0.18} />
                                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                            <XAxis dataKey="date" hide />
                            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={36} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
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
                    <div className="rounded-xl border overflow-hidden shadow-depth-inset" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
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
                    <div className="rounded-xl border overflow-hidden shadow-depth-inset" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
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
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border shadow-depth-1 rounded-xl transition-colors hover:bg-[--bg-hover]"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                      <RefreshCw size={12} /> Sync Now
                    </button>
                    <button onClick={() => addToast('Opening in cloud console', 'info')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl shadow-depth-1 transition-opacity hover:opacity-90"
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

import { useMigrationData } from '../hooks/useMigrationData';
import axios from 'axios';
import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Link2, CreditCard, Users, Key, Plus, Trash2, Eye, EyeOff, Copy, AlertCircle } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { BrandLogo, getBrandAsset } from '../constants/brandAssets'
import { useToast } from '../context/ToastContext'
import { usePermissions } from '../hooks/usePermissions'


import UserAvatar from '../components/ui/UserAvatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

const TABS = ['Profile', 'Notifications', 'Integrations', 'Team Members', 'API Keys']

// Maps each restricted tab to the permission required to see it
// defined inside Settings because PERMISSIONS is fetched dynamically

/** ConfirmModal — generic destructive action confirmation */
function ConfirmModal({ open, onClose, onConfirm, title, description, action, danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border p-6 w-full max-w-sm shadow-2xl"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: danger ? 'color-mix(in srgb, var(--accent-rose) 12%, transparent)' : 'color-mix(in srgb, var(--accent-amber) 12%, transparent)' }}>
            <AlertCircle size={20} style={{ color: danger ? 'var(--accent-rose)' : 'var(--accent-amber)' }} />
          </div>
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        </div>
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{description}</p>
        <p className="text-xs mb-5 px-3 py-2 rounded-lg"
          style={{ background: danger ? 'color-mix(in srgb, var(--accent-rose) 8%, transparent)' : 'color-mix(in srgb, var(--accent-amber) 8%, transparent)', color: danger ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>
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
            style={{ background: danger ? 'var(--accent-rose)' : 'var(--accent-amber)', color: '#fff' }}>
            {action}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/** Settings page — profile, notifications, integrations, billing, team, API keys */
export default function Settings() {
  const { data: d0, isLoading: l0, isError: e0, errorMessage: em0 } = useMigrationData('/roles');
  const { PERMISSIONS } = d0?.data || d0 || {};
  const { data: d1, isLoading: l1 } = useMigrationData('/users');
  const { CURRENT_USER, getOrgMembers } = d1?.data || d1 || {};
  const { data: d2, isLoading: l2 } = useMigrationData('/settings');
  const { data: d3, isLoading: l3, mutate: revalidateApiKeys } = useMigrationData('/settings/api-keys');

  const integrations = d2?.data?.integrations || d2?.integrations || [];
  const apiKeys = d3?.data?.keys || d3?.keys || [];

  const teamMembers = d1?.data?.users || d1?.users || [];

  const TAB_PERMISSIONS = {
    Integrations: PERMISSIONS?.MANAGE_INTEGRATIONS,
    'Team Members': PERMISSIONS?.MANAGE_TEAM_MEMBERS,
    'API Keys': PERMISSIONS?.MANAGE_API_KEYS,
  }

  const [activeTab, setActiveTab] = useState('Profile')
  const [showKey, setShowKey] = useState({})
  const [confirmModal, setConfirmModal] = useState(null)
  const [notifSettings, setNotifSettings] = useState({
    emailAnomalies: true, slack: false, weeklyDigest: true, budgetAlerts: true, dailySummary: false,
  })
  const [budgetThreshold, setBudgetThreshold] = useState(80)
  const [inviteRole, setInviteRole] = useState('Viewer')
  const { addToast } = useToast()
  const { can } = usePermissions()
  const visibleTabs = TABS.filter(tab => !TAB_PERMISSIONS[tab] || can(TAB_PERMISSIONS[tab]))

  const isLoading = l0 || l1 || l2 || l3;
  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  if (e0 || (!d0 && !l0) || (!d1 && !l1) || (!d2 && !l2)) return <div className="h-screen flex items-center justify-center"><div className="text-center"><p className="text-red-400 font-semibold mb-1">Failed to load settings</p><p className="text-sm text-zinc-500">{em0 || 'Please make sure the backend is running.'}</p></div></div>;

  const toggleNotif = (key) => setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }))

  const roleColors = {
    Admin: { bg: 'color-mix(in srgb, var(--accent-rose) 12%, transparent)', color: 'var(--accent-rose)' },
    FinOps: { bg: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)', color: 'var(--accent-primary)' },
    Viewer: { bg: 'color-mix(in srgb, var(--text-secondary) 10%, transparent)', color: 'var(--text-secondary)' },
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ConfirmModal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => { confirmModal?.onConfirm?.(); setConfirmModal(null) }}
        title={confirmModal?.title}
        description={confirmModal?.description}
        action={confirmModal?.action}
        danger={confirmModal?.danger ?? true}
      />
      <PageHeader title="Settings" subtitle="Manage your account, notifications, and integrations" />

      {/* Tab bar */}
      <div className="overflow-x-auto scrollbar-hide mb-6 border-b" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-base)', padding: '8px 8px 0 8px', borderRadius: '8px 8px 0 0' }}>
        <div className="flex gap-1 min-w-max">
          {visibleTabs.map(tab => {
            const icons = { Profile: User, Notifications: Bell, Integrations: Link2, 'Team Members': Users, 'API Keys': Key }
            const Icon = icons[tab]
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-4 py-2.5 text-sm font-medium transition-all rounded-t-lg -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                style={{
                  background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
                  boxShadow: activeTab === tab ? 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 -2px 4px rgba(0,0,0,0.03)' : 'none',
                  border: activeTab === tab ? '1px solid var(--border-default)' : '1px solid transparent',
                  borderBottomColor: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>
                <Icon size={14} className={activeTab === tab ? 'text-[var(--accent-primary)]' : ''} /> {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* Profile */}
      {activeTab === 'Profile' && (
        <div className="max-w-lg space-y-5">
          <div className="flex items-center gap-4 p-5 rounded-xl border shadow-depth-card" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <UserAvatar user={CURRENT_USER} size="xl" rounded="xl" />
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{CURRENT_USER.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{CURRENT_USER.role} · {CURRENT_USER.company}</p>
              <button onClick={() => addToast('Upload functionality coming soon', 'info')}
                className="text-xs mt-1 transition-colors" style={{ color: 'var(--accent-cyan)' }}>
                Change avatar
              </button>
            </div>
          </div>

          {[
            { label: 'Full Name', value: CURRENT_USER.name },
            { label: 'Email', value: CURRENT_USER.email },
            { label: 'Role', value: CURRENT_USER.role },
            { label: 'Company', value: CURRENT_USER.company },
            { label: 'Timezone', value: CURRENT_USER.timezone },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
              <input
                defaultValue={f.value}
                className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none shadow-depth-1"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
              />
            </div>
          ))}
          <button
            onClick={() => addToast('Profile saved', 'success')}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl shiny-primary transition-opacity hover:opacity-90">
            Save Changes
          </button>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'Notifications' && (
        <div className="max-w-lg space-y-4">
          {[
            { key: 'emailAnomalies', label: 'Email alerts for anomalies', sub: 'Receive email when a new anomaly is detected' },
            { key: 'slack', label: 'Slack notifications', sub: 'Connect Slack to enable', cta: 'Connect Slack' },
            { key: 'weeklyDigest', label: 'Weekly spend digest', sub: 'Summary of spend every Monday morning' },
            { key: 'budgetAlerts', label: 'Budget threshold alerts', sub: 'Alert when budget usage exceeds threshold' },
            { key: 'dailySummary', label: 'Daily summary email', sub: 'Daily spend summary at 8am' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border shadow-depth-card"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {item.sub}
                  {item.cta && !notifSettings[item.key] && (
                    <button onClick={() => addToast('Connect Slack in Integrations tab', 'info')}
                      className="ml-2 font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                      {item.cta} →
                    </button>
                  )}
                </p>
              </div>
              <button
                onClick={() => toggleNotif(item.key)}
                className="w-11 h-6 rounded-full relative overflow-hidden transition-colors"
                style={{ background: notifSettings[item.key] ? 'var(--accent-primary)' : 'var(--border-default)' }}>
                <span className="absolute left-0.5 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: notifSettings[item.key] ? 'translateX(20px)' : 'translateX(0px)' }} />
              </button>
            </div>
          ))}

          <div className="p-4 rounded-xl border shadow-depth-card" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Budget Alert Threshold</p>
              <span className="text-sm font-mono font-semibold" style={{ color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>
                {budgetThreshold}%
              </span>
            </div>
            <input type="range" min={50} max={100} value={budgetThreshold} onChange={e => setBudgetThreshold(+e.target.value)}
              className="w-full" style={{ accentColor: 'var(--accent-cyan)' }} />
          </div>

          <button onClick={() => addToast('Notification settings saved', 'success')}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl shiny-primary transition-opacity hover:opacity-90">
            Save Preferences
          </button>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'Integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {integrations.map(ig => (
            <div key={ig.name} className="rounded-xl border p-5 shadow-depth-card"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl border flex items-center justify-center shadow-depth-inset"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                  <BrandLogo brandKey={ig.key} size={22} />
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold`}
                  style={ig.connected
                    ? { background: 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)', color: 'var(--accent-emerald)' }
                    : { background: 'color-mix(in srgb, var(--text-muted) 20%, transparent)', color: 'var(--text-muted)' }}>
                  {ig.connected ? '✓ Connected' : 'Not connected'}
                </span>
              </div>
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{ig.name}</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{ig.description}</p>
              <button
                onClick={() => ig.connected
                  ? setConfirmModal({
                    title: `Disconnect ${ig.name}`,
                    description: `Are you sure you want to disconnect ${ig.name}? You will stop receiving notifications and lose any active integrations.`,
                    action: 'Disconnect',
                    onConfirm: () => addToast(`${ig.name} disconnected`, 'info'),
                  })
                  : addToast(`Connecting to ${ig.name}...`, 'success')
                }
                className="w-full py-2 text-xs font-semibold rounded-xl border transition-colors shadow-depth-1"
                style={{
                  background: ig.connected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  borderColor: ig.connected ? 'var(--accent-rose)' : 'var(--accent-primary)',
                  color: ig.connected ? 'var(--accent-rose)' : 'var(--accent-primary)',
                }}>
                {ig.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Team Members */}
      {activeTab === 'Team Members' && (
        <div className="max-w-2xl">
          <div className="rounded-xl border overflow-hidden mb-4 shadow-depth-inset" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-base)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Name', 'Email', 'Role', 'Added', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamMembers.map(m => (
                  <tr key={m.email} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={m} size="sm" />
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{m.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: roleColors[m.orgRole]?.bg, color: roleColors[m.orgRole]?.color }}>
                        {m.orgRole}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{m.addedAt}</td>
                    <td className="px-4 py-3">
                      {m.orgRole !== 'Admin' && (
                        <button
                          onClick={() => setConfirmModal({
                            title: 'Remove Team Member',
                            description: `Remove ${m.name} (${m.email}) from your organization? They will immediately lose access to CloudSpire.`,
                            action: 'Remove',
                            onConfirm: () => addToast(`${m.name} removed`, 'info'),
                          })}
                          className="p-1.5 rounded-lg hover:bg-[--bg-hover] transition-colors" style={{ color: 'var(--accent-rose)' }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Add Member</p>
            <div className="flex gap-3">
              <input type="email" placeholder="colleague@company.com"
                className="flex-1 px-3 py-2 text-sm rounded-xl border outline-none shadow-depth-1"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }} />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-[38px] min-w-[100px] rounded-xl border text-sm shadow-depth-1"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                  <SelectItem value="FinOps">FinOps</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={() => addToast('Invitation sent', 'success')}
                className="px-4 py-2 text-sm font-semibold rounded-xl shiny-primary transition-opacity hover:opacity-90 flex items-center gap-1.5">
                <Plus size={13} /> Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys */}
      {activeTab === 'API Keys' && (
        <div className="max-w-2xl">
          <div className="rounded-xl border overflow-hidden mb-4 shadow-depth-inset" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-base)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Key Name', 'API Key', 'Created', 'Last Used', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apiKeys.map(k => (
                  <tr key={k._id || k.name} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{k.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {k.prefix || k.key?.slice(0, 12) + '•••'}
                        </span>
                        <button onClick={() => addToast('Cannot reveal or copy hashed keys. Generate a new one instead.', 'info')}
                          className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                          <Copy size={11} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : k.created}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : k.lastUsed || 'Never'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirmModal({
                          title: 'Revoke API Key',
                          description: `Revoke "${k.name}"? Any services using this key will immediately lose API access.`,
                          action: 'Revoke',
                          onConfirm: async () => {
                            try {
                              const token = localStorage.getItem('cloudspire_token');
                              await axios.delete(`http://localhost:4000/api/v1/settings/api-keys/${k._id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              addToast(`API key "${k.name}" revoked`, 'info');
                              revalidateApiKeys();
                            } catch (e) {
                              addToast(e.response?.data?.error || 'Failed to revoke API key', 'error');
                            }
                          }
                        })}
                        className="px-2 py-1 text-[10px] font-semibold rounded-lg transition-colors hover:bg-[--bg-hover]"
                        style={{ color: 'var(--accent-rose)' }}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={async () => {
            try {
              const name = window.prompt("Enter a name for the new API Key:");
              if (!name) return;
              const token = localStorage.getItem('cloudspire_token');
              const res = await axios.post('http://localhost:4000/api/v1/settings/api-keys', { name }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.data.success) {
                const rawKey = res.data.data?.rawKey || res.data.rawKey;
                if (rawKey) navigator.clipboard.writeText(rawKey);
                addToast(`Key "${name}" created and copied to clipboard! (Save this, it won't be shown again)`, 'success');
                revalidateApiKeys();
              }
            } catch (err) {
              addToast(err.response?.data?.error || 'Failed to create API key', 'error');
            }
          }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl shiny-primary transition-opacity hover:opacity-90">
            <Plus size={14} /> Generate New API Key
          </button>
        </div>
      )}
    </motion.div>
  )
}

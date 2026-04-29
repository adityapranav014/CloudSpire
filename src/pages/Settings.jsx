import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Link2, CreditCard, Users, Key, Plus, Trash2, Eye, EyeOff, Copy, AlertCircle } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { BrandLogo, getBrandAsset } from '../constants/brandAssets'
import { useToast } from '../context/ToastContext'
import { CURRENT_USER, getOrgMembers } from '../data/mockUsers'
import UserAvatar from '../components/ui/UserAvatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

const TABS = ['Profile', 'Notifications', 'Integrations', 'Billing', 'Team Members', 'API Keys']

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

const integrations = [
  { key: 'slack', name: 'Slack', connected: false, description: 'Get anomaly alerts and spend digests in Slack.' },
  { key: 'teams', name: 'Microsoft Teams', connected: false, description: 'Receive CloudSpire notifications in MS Teams channels.' },
  { key: 'jira', name: 'Jira', connected: false, description: 'Auto-create tickets for anomalies and optimization tasks.' },
  { key: 'pagerduty', name: 'PagerDuty', connected: false, description: 'Page on-call engineers for critical spend anomalies.' },
  { key: 'terraform', name: 'Terraform', connected: true, description: 'Manage cloud resources with Terraform integration.' },
  { key: 'githubActions', name: 'GitHub Actions', connected: false, description: 'Trigger cost reports in CI/CD pipelines.' },
]

const teamMembers = getOrgMembers()

const apiKeys = [
  { name: 'Production API Key', key: 'csp_live_xxxxxxxxxxxxxxxxxxxx', created: 'Jan 10, 2025', lastUsed: '2 hours ago' },
  { name: 'CI/CD Integration', key: 'csp_live_yyyyyyyyyyyyyyyyyyyy', created: 'Mar 1, 2025', lastUsed: '3 days ago' },
]

/** Settings page — profile, notifications, integrations, billing, team, API keys */
export default function Settings() {
  const [activeTab, setActiveTab] = useState('Profile')
  const [showKey, setShowKey] = useState({})
  const [confirmModal, setConfirmModal] = useState(null)
  const [notifSettings, setNotifSettings] = useState({
    emailAnomalies: true, slack: false, weeklyDigest: true, budgetAlerts: true, dailySummary: false,
  })
  const [budgetThreshold, setBudgetThreshold] = useState(80)
  const [inviteRole, setInviteRole] = useState('Viewer')
  const { addToast } = useToast()

  const toggleNotif = (key) => setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }))
  const Toggle = ({ name }) => (
    <button onClick={() => toggleNotif(name)}
      className="w-11 h-6 rounded-full relative overflow-hidden transition-colors"
      style={{ background: notifSettings[name] ? 'var(--accent-primary)' : 'var(--border-default)' }}>
      <span className="absolute left-0.5 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: notifSettings[name] ? 'translateX(20px)' : 'translateX(0px)' }} />
    </button>
  )

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
      <div className="overflow-x-auto scrollbar-hide mb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex gap-1 min-w-max">
        {TABS.map(tab => {
          const icons = { Profile: User, Notifications: Bell, Integrations: Link2, Billing: CreditCard, 'Team Members': Users, 'API Keys': Key }
          const Icon = icons[tab]
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              style={{
                borderBottomColor: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}>
              <Icon size={13} /> {tab}
            </button>
          )
        })}
        </div>
      </div>

      {/* Profile */}
      {activeTab === 'Profile' && (
        <div className="max-w-lg space-y-5">
          <div className="flex items-center gap-4 p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
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
                className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
              />
            </div>
          ))}
          <button
            onClick={() => addToast('Profile saved', 'success')}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-blue)', color: '#fff' }}>
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
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
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
              <Toggle name={item.key} />
            </div>
          ))}

          <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
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
            className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-blue)', color: '#fff' }}>
            Save Preferences
          </button>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'Integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {integrations.map(ig => (
            <div key={ig.name} className="rounded-xl border p-5"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl border flex items-center justify-center"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
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
                className="w-full py-2 text-xs font-semibold rounded-xl border transition-colors hover:bg-[--bg-hover]"
                style={{
                  borderColor: ig.connected ? 'var(--accent-rose)' : 'var(--accent-primary)',
                  color: ig.connected ? 'var(--accent-rose)' : 'var(--accent-primary)',
                }}>
                {ig.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Billing */}
      {activeTab === 'Billing' && (
        <div className="max-w-lg space-y-4">
          <div className="rounded-xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Plan</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>Growth</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>$149 / month</p>
              </div>
              <div className="px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)' }}>
                Active
              </div>
            </div>
            <div className="p-3 rounded-xl mb-4" style={{ background: 'color-mix(in srgb, var(--accent-amber) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-amber) 20%, transparent)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent-amber)' }}>Usage Limit Warning</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>You're tracking $149,400 of cloud spend. Your Growth plan limit is $50,000/month.</p>
            </div>
            <button onClick={() => addToast('Redirecting to upgrade page...', 'info')}
              className="w-full py-3 font-semibold text-sm rounded-xl transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent-primary)', color: 'var(--bg-base)' }}>
              Upgrade to Enterprise
            </button>
          </div>
          <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Next Invoice</p>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>May 1, 2025</span>
              <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>$149.00</span>
            </div>
          </div>
        </div>
      )}

      {/* Team Members */}
      {activeTab === 'Team Members' && (
        <div className="max-w-2xl">
          <div className="rounded-xl border overflow-hidden mb-4" style={{ borderColor: 'var(--border-default)' }}>
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
                className="flex-1 px-3 py-2 text-sm rounded-xl border outline-none"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }} />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-[38px] min-w-[100px] rounded-xl border text-sm"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                  <SelectItem value="FinOps">FinOps</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={() => addToast('Invitation sent', 'success')}
                className="px-4 py-2 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 flex items-center gap-1.5"
                style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                <Plus size={13} /> Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys */}
      {activeTab === 'API Keys' && (
        <div className="max-w-2xl">
          <div className="rounded-xl border overflow-hidden mb-4" style={{ borderColor: 'var(--border-default)' }}>
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
                  <tr key={k.name} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{k.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {showKey[k.name] ? k.key : k.key.slice(0, 12) + '•'.repeat(16)}
                        </span>
                        <button onClick={() => setShowKey(prev => ({ ...prev, [k.name]: !prev[k.name] }))}
                          className="p-1 rounded hover:bg-[--bg-hover] transition-colors" style={{ color: 'var(--text-muted)' }}>
                          {showKey[k.name] ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                        <button onClick={() => addToast('Key copied to clipboard', 'success')}
                          className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                          <Copy size={11} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{k.created}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{k.lastUsed}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirmModal({
                          title: 'Revoke API Key',
                          description: `Revoke "${k.name}"? Any services using this key will immediately lose API access.`,
                          action: 'Revoke',
                          onConfirm: () => addToast(`API key "${k.name}" revoked`, 'info'),
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
          <button onClick={() => addToast('New API key generated and copied to clipboard', 'success')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-blue)', color: '#fff' }}>
            <Plus size={14} /> Generate New API Key
          </button>
        </div>
      )}
    </motion.div>
  )
}

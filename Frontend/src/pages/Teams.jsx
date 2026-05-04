import { useMigrationData } from '../hooks/useMigrationData';
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, X, Edit3, BarChart2, Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import PageHeader from '../components/layout/PageHeader'
import DonutAllocationChart from '../components/charts/DonutAllocationChart'
import ProviderBadge from '../components/ui/ProviderBadge'
import TrendBadge from '../components/ui/TrendBadge'
import UserAvatar from '../components/ui/UserAvatar'
import { useToast } from '../context/ToastContext'
import { usePermissions } from '../hooks/usePermissions'
import api from '../services/api'
import { TeamsSkeleton } from '../components/ui/PageSkeleton'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

// ─── Team Detail Modal ────────────────────────────────────────────────────────
function TeamDetailModal({ team, onClose }) {
  if (!team) return null
  const sparkData = [
    { label: '90d', value: team.spend90d },
    { label: '60d', value: team.spend60d },
    { label: '30d', value: team.spend30d },
  ]
  const members = (team.memberList || []).slice(0, 5)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar user={{ name: team.lead }} size="lg" rounded="xl" className="border-2" style={{ borderColor: team.color }} />
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{team.name}</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lead: {team.lead}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[--bg-hover] transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { label: '30d Spend', value: fmt.format(team.spend30d) },
            { label: '60d Spend', value: fmt.format(team.spend60d) },
            { label: '90d Spend', value: fmt.format(team.spend90d) },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border shadow-depth-inset text-center" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-5 mb-5">
          <div style={{ minWidth: 0 }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Spend Trend</p>
            <ResponsiveContainer width="100%" height={120} minWidth={0}>
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="value" stroke={team.color} strokeWidth={2} dot={{ fill: team.color }} />
                <XAxis dataKey="label" tick={{ fill: '#4A5568', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12 }} formatter={v => [fmt.format(v), 'Spend']} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <DonutAllocationChart data={team.serviceBreakdown || []} title="Service Breakdown" />
        </div>

        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Members</p>
          <div className="space-y-2">
            {members.length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No members added yet.</p>}
            {members.map((member, i) => (
              <div key={member.name || i} className="flex items-center gap-2.5 p-2.5 rounded-xl border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                <UserAvatar user={member} size="md" />
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{member.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Add Team Modal ───────────────────────────────────────────────────────────
function AddTeamModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', monthlyBudget: '' })
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = useCallback(async () => {
    if (!form.name.trim()) { addToast('Team name is required.', 'error'); return; }
    setSaving(true)
    try {
      await api.post('/teams', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        monthlyBudget: form.monthlyBudget ? Number(form.monthlyBudget) : 0,
      })
      addToast(`Team "${form.name}" created successfully!`, 'success')
      onCreated()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create team'
      addToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }, [form, addToast, onCreated, onClose])

  const fields = [
    { label: 'Team Name *', name: 'name', placeholder: 'e.g. Platform Engineering' },
    { label: 'Description', name: 'description', placeholder: 'e.g. Owns all cloud infra' },
    { label: 'Monthly Budget (USD)', name: 'monthlyBudget', placeholder: 'e.g. 25000', type: 'number' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="rounded-2xl border p-6 w-full max-w-md shadow-2xl"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Add Team</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[--bg-hover] transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.name}>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
              <input
                name={f.name}
                type={f.type || 'text'}
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 text-sm rounded-xl border transition-colors hover:bg-[--bg-hover]"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent-blue)', color: '#fff', opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Team'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Edit Budget Modal ────────────────────────────────────────────────────────
function EditBudgetModal({ team, onClose, onUpdated }) {
  const [budget, setBudget] = useState(String(team?.monthlyBudget || ''))
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  const handleSave = useCallback(async () => {
    if (!budget || isNaN(Number(budget))) { addToast('Enter a valid budget amount.', 'error'); return; }
    setSaving(true)
    try {
      await api.patch(`/teams/${team.id}`, { monthlyBudget: Number(budget) })
      addToast(`Budget updated for ${team.name}`, 'success')
      onUpdated()
      onClose()
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update budget', 'error')
    } finally {
      setSaving(false)
    }
  }, [budget, team, addToast, onUpdated, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="rounded-2xl border p-6 w-full max-w-sm shadow-2xl"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Edit Budget — {team?.name}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[--bg-hover]" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Monthly Budget (USD)</label>
        <input
          type="number"
          value={budget}
          onChange={e => setBudget(e.target.value)}
          placeholder="e.g. 25000"
          className="w-full px-3 py-2 text-sm rounded-xl border outline-none mb-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
        />
        <div className="flex gap-3">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 text-sm rounded-xl border hover:bg-[--bg-hover]"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: 'var(--accent-blue)', color: '#fff', opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Budget'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Teams() {
  const { data: d0, isLoading: l0, mutate: reloadTeams } = useMigrationData('/teams')
  const { data: d1, isLoading: l1 } = useMigrationData('/roles')
  const { PERMISSIONS = {}, ROLES = {} } = d1 || {}

  const rawTeams = d0?.data?.teams
  const teams = rawTeams ? rawTeams.map(t => ({
    ...t,
    id: t._id || t.id,
    lead: t.createdBy?.name || t.lead || 'Unassigned',
    monthlySpend: t.monthlySpend || 0,
    monthlyBudget: t.monthlyBudget || 0,
    budgetPercent: t.monthlySpend && t.monthlyBudget ? Math.round((t.monthlySpend / t.monthlyBudget) * 100) : (t.budgetPercent || 0),
    overBudget: t.monthlySpend > (t.monthlyBudget || Infinity) || !!t.overBudget,
    spend30d: t.spend30d || 0,
    spend60d: t.spend60d || 0,
    spend90d: t.spend90d || 0,
    memberCount: Array.isArray(t.members) ? t.members.length : (t.members || 0),
    resourceCount: Array.isArray(t.servers) ? t.servers.length : (t.resources || 0),
    providers: t.providers || [],
    topService: t.topService || 'None',
    topServiceCost: t.topServiceCost || 0,
    color: t.color || '#3B82F6',
    memberList: Array.isArray(t.members) && t.members[0]?.name ? t.members : (t.memberList || []),
    serviceBreakdown: t.serviceBreakdown || [],
    budgetHistory: t.budgetHistory || [],
  })) : null

  const isLoading = l0 || l1
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editBudgetTeam, setEditBudgetTeam] = useState(null)
  const { addToast } = useToast()
  const { can, isRole, persona } = usePermissions()

  if (isLoading) return <TeamsSkeleton />

  if (!teams) return (
    <div className="h-screen flex items-center justify-center">
      <p style={{ color: 'var(--text-muted)' }}>Failed to load teams.</p>
    </div>
  )

  const visibleTeams = isRole(ROLES?.TEAM_LEAD)
    ? teams.filter(t => t.id === persona?.teamId)
    : teams

  const totalSpend = visibleTeams.reduce((s, t) => s + t.monthlySpend, 0)
  const totalBudget = visibleTeams.reduce((s, t) => s + t.monthlyBudget, 0)
  const overBudgetTeams = visibleTeams.filter(t => t.overBudget)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Modals */}
      <TeamDetailModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      <AnimatePresence>
        {addModalOpen && (
          <AddTeamModal
            onClose={() => setAddModalOpen(false)}
            onCreated={() => reloadTeams()}
          />
        )}
        {editBudgetTeam && (
          <EditBudgetModal
            team={editBudgetTeam}
            onClose={() => setEditBudgetTeam(null)}
            onUpdated={() => reloadTeams()}
          />
        )}
      </AnimatePresence>

      <PageHeader title="Teams" subtitle="Cost allocation and budget tracking by team">
        {can(PERMISSIONS.MANAGE_TEAMS) && !isRole(ROLES?.TEAM_LEAD) && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shiny-primary transition-opacity hover:opacity-90"
          >
            <Plus size={14} /> Add Team
          </button>
        )}
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Monthly Spend', value: fmt.format(totalSpend), color: 'var(--accent-blue)' },
          { label: 'Total Budget', value: fmt.format(totalBudget), color: 'var(--text-secondary)' },
          { label: 'Budget Utilization', value: totalBudget ? `${Math.round(totalSpend / totalBudget * 100)}%` : 'N/A', color: 'var(--accent-amber)' },
          { label: 'Over-Budget Teams', value: overBudgetTeams.length, color: 'var(--accent-rose)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border shadow-depth-card p-4"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {visibleTeams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
          <Users size={36} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No teams yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Create a team to start tracking costs by group.</p>
          {can(PERMISSIONS.MANAGE_TEAMS) && (
            <button onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shiny-primary">
              <Plus size={14} /> Add Team
            </button>
          )}
        </div>
      )}

      {/* Team cards grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {visibleTeams.map((team, i) => {
          const pct = team.budgetPercent
          const barColor = team.overBudget ? 'var(--accent-rose)' : pct > 85 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
          const trendPct = team.spend60d ? +((team.spend30d - team.spend60d) / team.spend60d * 100).toFixed(1) : 0

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="rounded-xl border shadow-depth-card p-5"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: team.overBudget ? 'color-mix(in srgb, var(--accent-rose) 40%, transparent)' : 'var(--border-default)',
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <UserAvatar user={{ name: team.lead }} size="lg" rounded="xl"
                    className="border-2" style={{ borderColor: team.color }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{team.name}</p>
                      {team.overBudget && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: 'color-mix(in srgb, var(--accent-rose) 12%, transparent)', color: 'var(--accent-rose)' }}>
                          OVER BUDGET
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lead: {team.lead}</p>
                  </div>
                </div>
                <TrendBadge value={trendPct} invertColors />
              </div>

              {/* Spend row */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {fmt.format(team.monthlySpend)}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {fmt.format(team.monthlyBudget)} budget</span>
              </div>

              {/* Budget bar */}
              <div className="mb-1">
                <div className="w-full h-2 rounded-full overflow-hidden mb-1 shadow-depth-inset border"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-semibold" style={{ color: barColor }}>{pct}% used</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {fmt.format(Math.abs(team.monthlyBudget - team.monthlySpend))} {team.overBudget ? 'over' : 'remaining'}
                  </span>
                </div>
              </div>

              {/* Metadata row */}
              <div className="flex items-center gap-3 my-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><Users size={11} /> {team.memberCount} members</span>
                <span>·</span>
                <span>{team.resourceCount} resources</span>
                {team.providers.length > 0 && <><span>·</span><span className="flex gap-1">{team.providers.map(p => <ProviderBadge key={p} provider={p} size="sm" />)}</span></>}
              </div>

              {/* Top service */}
              <div className="flex items-center justify-between text-xs mb-4 p-2.5 rounded-xl border shadow-depth-inset"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Top service</span>
                <span style={{ color: 'var(--text-secondary)' }}>{team.topService}</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {fmt.format(team.topServiceCost)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTeam(team)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors shadow-depth-1 hover:bg-[--bg-hover]"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                  <BarChart2 size={12} /> View Details
                </button>
                {can(PERMISSIONS.MANAGE_TEAMS) && (
                  <button
                    onClick={() => setEditBudgetTeam(team)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors shadow-depth-1 hover:bg-[--bg-hover]"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>
                    <Edit3 size={12} /> Edit Budget
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

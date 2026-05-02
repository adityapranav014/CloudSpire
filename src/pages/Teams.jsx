import { useMigrationData } from '../hooks/useMigrationData';
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, TrendingUp, TrendingDown, Plus, X, Edit3, BarChart2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import PageHeader from '../components/layout/PageHeader'
import DonutAllocationChart from '../components/charts/DonutAllocationChart'
import ProviderBadge from '../components/ui/ProviderBadge'
import TrendBadge from '../components/ui/TrendBadge'
import UserAvatar from '../components/ui/UserAvatar'

import { useToast } from '../context/ToastContext'
import { usePermissions } from '../hooks/usePermissions'


const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

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
            <UserAvatar user={{ name: team.lead, avatar: team.avatar }} size="lg" rounded="xl"
              className="border-2" style={{ borderColor: team.color }} />
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
            { label: '30d Spend', value: fmt.format(team.spend30d), color: 'var(--text-primary)' },
            { label: '60d Spend', value: fmt.format(team.spend60d), color: 'var(--text-secondary)' },
            { label: '90d Spend', value: fmt.format(team.spend90d), color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border shadow-depth-inset text-center" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="font-mono font-bold text-sm" style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-5 mb-5">
          <div style={{ minWidth: 0, minHeight: 0 }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Spend Trend</p>
            <ResponsiveContainer width="100%" height={120} minWidth={0} minHeight={0}>
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="value" stroke={team.color} strokeWidth={2} dot={{ fill: team.color }} />
                <XAxis dataKey="label" tick={{ fill: '#4A5568', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12 }}
                  formatter={v => [fmt.format(v), 'Spend']}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <DonutAllocationChart data={team.serviceBreakdown || []} title="Service Breakdown" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Providers</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {team.providers.map(p => <ProviderBadge key={p} provider={p} size="md" />)}
            </div>

            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Members</p>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.name} className="flex items-center justify-between p-2.5 shadow-depth-inset rounded-xl border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar user={member} size="md" />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{member.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{member.teamRole}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ minWidth: 0, minHeight: 0 }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Budget History</p>
            <ResponsiveContainer width="100%" height={160} minWidth={0} minHeight={0}>
              <LineChart data={team.budgetHistory || []}>
                <Line type="monotone" dataKey="budget" stroke="#64748B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="spend" stroke={team.color} strokeWidth={2} dot={{ fill: team.color }} />
                <XAxis dataKey="month" tick={{ fill: '#4A5568', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4A5568', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12 }}
                  formatter={v => [fmt.format(v), 'Amount']}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Resource List</p>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="space-y-2 min-w-[380px]">
              {(team.resourceList || []).map((resource) => (
                <div key={resource.name} className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-3 p-3 rounded-xl text-xs" style={{ background: 'var(--bg-card)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{resource.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{resource.type}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{resource.owner}</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{fmt.format(resource.monthlyCost)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/** Teams page — cost allocation by team with budget management */
export default function Teams() {
  const { data: d0, isLoading: l0 } = useMigrationData('/teams');
  const { teams } = d0 || {};
  const { data: d1, isLoading: l1 } = useMigrationData('/roles');
  const { PERMISSIONS, ROLES } = d1 || {};

  const isLoading = l0 || l1;

  const [selectedTeam, setSelectedTeam] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const { addToast } = useToast()
  const { can, isRole, persona } = usePermissions()

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  if (!teams || !PERMISSIONS) return <div className="h-screen flex items-center justify-center"><p className="text-red-500">Failed to load teams data.</p></div>;


  // Team Leads only see their own team
  const visibleTeams = isRole(ROLES.TEAM_LEAD)
    ? teams.filter(t => t.id === persona.teamId)
    : teams

  const totalSpend = visibleTeams.reduce((s, t) => s + t.monthlySpend, 0)
  const totalBudget = visibleTeams.reduce((s, t) => s + t.monthlyBudget, 0)
  const overBudgetTeams = visibleTeams.filter(t => t.overBudget)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <TeamDetailModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />

      <PageHeader title="Teams" subtitle="Cost allocation and budget tracking by team">
        {can(PERMISSIONS.MANAGE_TEAMS) && !isRole(ROLES.TEAM_LEAD) && (
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
          { label: 'Budget Utilization', value: `${Math.round(totalSpend / totalBudget * 100)}%`, color: 'var(--accent-amber)' },
          { label: 'Over-Budget Teams', value: overBudgetTeams.length, color: 'var(--accent-rose)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border shadow-depth-card p-4"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Team cards grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {visibleTeams.map((team, i) => {
          const pct = team.budgetPercent
          const barColor = team.overBudget ? 'var(--accent-rose)' : pct > 85 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
          const trendPct = +((team.spend30d - team.spend60d) / team.spend60d * 100).toFixed(1)

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
                  <UserAvatar user={{ name: team.lead, avatar: team.avatar }} size="lg" rounded="xl"
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
                <span className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt.format(team.monthlySpend)}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {fmt.format(team.monthlyBudget)} budget</span>
              </div>

              {/* Budget bar */}
              <div className="mb-1">
                <div className="w-full h-2 rounded-full overflow-hidden mb-1 shadow-depth-inset border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-semibold" style={{ color: barColor }}>{pct}% used</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {fmt.format(team.monthlyBudget - team.monthlySpend)} {team.overBudget ? 'over' : 'remaining'}
                  </span>
                </div>
              </div>

              {/* Metadata row */}
              <div className="flex items-center gap-3 my-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><Users size={11} /> {team.members} members</span>
                <span>·</span>
                <span>{team.resources} resources</span>
                <span>·</span>
                <span className="flex gap-1">{team.providers.map(p => <ProviderBadge key={p} provider={p} size="sm" />)}</span>
              </div>

              {/* Top service */}
              <div className="flex items-center justify-between text-xs mb-4 p-2.5 rounded-xl border shadow-depth-inset"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Top service</span>
                <span style={{ color: 'var(--text-secondary)' }}>{team.topService}</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
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
                    onClick={() => addToast(`Budget updated for ${team.name}`, 'success')}
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

      {/* Add Team modal */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl border p-6 w-full max-w-md shadow-2xl"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Add Team</h3>
                <button onClick={() => setAddModalOpen(false)} className="p-2 rounded-lg hover:bg-[--bg-hover] transition-colors" style={{ color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Team Name', placeholder: 'e.g. Platform Engineering' },
                  { label: 'Team Lead', placeholder: 'e.g. Jane Smith' },
                  { label: 'Monthly Budget ($)', placeholder: 'e.g. 25000' },
                  { label: 'Department Tag', placeholder: 'e.g. platform-engineering' },
                  { label: 'Cost Center Tag', placeholder: 'e.g. PE-006' },
                  { label: 'Provider Accounts', placeholder: 'e.g. AWS Prod, GCP Data' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors"
                      style={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2.5 text-sm rounded-xl border transition-colors hover:bg-[--bg-hover]"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button
                  onClick={() => { setAddModalOpen(false); addToast('Team created successfully', 'success') }}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
                  style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                  Create Team
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

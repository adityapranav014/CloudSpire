import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#3B82F6', '#FF9900', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#F43F5E', '#64748B']
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border p-3 text-sm shadow-2xl"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{d.service}</p>
      <p style={{ color: 'var(--text-secondary)' }}>{fmt.format(d.cost)} <span style={{ color: 'var(--text-muted)' }}>({d.percent}%)</span></p>
    </div>
  )
}

/**
 * Donut chart showing cost allocation by service.
 * Props: data (array of {service, cost, percent}), title
 */
export default function DonutAllocationChart({ data, title = 'Cost by Service' }) {
  return (
    <div className="rounded-xl flex flex-col group layer-raised p-5 h-full">
      <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <div className="flex items-center gap-4 flex-1 layer-recessed rounded-xl p-4">
        <div className="relative w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] shrink-0" style={{ minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                innerRadius="65%"
                outerRadius="92%"
                dataKey="cost"
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Total</p>
            <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
              {fmt.format(data.reduce((s, d) => s + d.cost, 0))}
            </p>
          </div>
        </div>
        <ul className="flex-1 space-y-2">
          {data.map((d, i) => (
            <li key={d.service}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2.5 h-2.5 rounded shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-xs truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{d.service}</span>
                <span className="text-xs font-mono shrink-0 w-9 text-right" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {d.percent}%
                </span>
              </div>
              <div className="ml-[18px] h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                <div className="h-full rounded-full" style={{ width: `${d.percent}%`, background: COLORS[i % COLORS.length], opacity: 0.75 }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

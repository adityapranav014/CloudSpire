import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { BrandLogo, getBrandAsset } from '../../constants/brandAssets'

const fmt = (v) => `$${(v / 1000).toFixed(0)}k`
const fmtFull = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  const color = item.provider ? (getBrandAsset(item.provider)?.color ?? '#3B82F6') : '#3B82F6'
  return (
    <div className="rounded-xl border p-3 text-sm shadow-2xl"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
      <div className="flex items-center gap-2 mb-1.5">
        {item.provider
          ? <BrandLogo brandKey={item.provider} size={13} />
          : <span className="w-2.5 h-2.5 rounded shrink-0" style={{ background: color }} />
        }
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
      </div>
      <p className="font-mono font-semibold pl-5" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
        {fmtFull.format(payload[0]?.value)}
      </p>
    </div>
  )
}

/**
 * Horizontal bar chart for region/account spend breakdown.
 * Props: data (array of {label, cost, provider?}), title, colorMap
 */
export default function BarBreakdownChart({ data, title = 'Top Regions', yAxisWidth = 80 }) {
  const COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B']

  return (
    <div className="rounded-xl border p-5 h-full" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
      <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2D40" horizontal={false} />
          <XAxis type="number" tickFormatter={fmt} tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={yAxisWidth}
            tick={{ fill: '#8A9BB8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={16}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.provider ? (getBrandAsset(entry.provider)?.color ?? COLORS[i % COLORS.length]) : COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

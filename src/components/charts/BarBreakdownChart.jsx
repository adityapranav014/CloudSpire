import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts'
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

const CustomBarLabel = ({ x, y, width, height, value }) => {
  if (!value) return null
  return (
    <text
      x={x + width + 8}
      y={y + height / 2 + 1}
      fill="var(--text-muted)"
      fontSize={10}
      fontFamily="'JetBrains Mono', monospace"
      dominantBaseline="middle"
    >
      {fmt(value)}
    </text>
  )
}

/**
 * Horizontal bar chart for region/account spend breakdown.
 * Props: data (array of {label, cost, provider?}), title, colorMap
 */
export default function BarBreakdownChart({ data, title = 'Top Regions', yAxisWidth = 90 }) {
  const COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B']

  // build unique providers for legend
  const providers = [...new Set(data.map(d => d.provider).filter(Boolean))]

  return (
    <div className="rounded-xl flex flex-col group layer-raised p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {providers.length > 0 && (
          <div className="flex items-center gap-3">
            {providers.map(p => {
              const brand = getBrandAsset(p)
              return brand ? (
                <div key={p} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: brand.color }} />
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{brand.label ?? p.toUpperCase()}</span>
                </div>
              ) : null
            })}
          </div>
        )}
      </div>

      <div className="flex-1 layer-recessed rounded-xl p-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ top: 2, right: 48, left: 0, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={fmt}
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={yAxisWidth}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
          <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={14}>
            <LabelList content={<CustomBarLabel />} />
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.provider ? (getBrandAsset(entry.provider)?.color ?? COLORS[i % COLORS.length]) : COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}

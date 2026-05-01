
import { useState } from 'react'
import { Check } from 'lucide-react'
import {
  ResponsiveContainer, ComposedChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

import { BrandLogo, getBrandAsset } from '../../constants/brandAssets'
import { useMigrationData } from '../../hooks/useMigrationData'

const fmt = (v) => `$${(v / 1000).toFixed(1)}k`
const fmtDate = (str) => {
  const d = new Date(str + 'T00:00:00')
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="rounded-xl border p-3 text-sm shadow-2xl min-w-[160px]"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
      <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <BrandLogo brandKey={p.dataKey} size={13} />
            <span style={{ color: 'var(--text-secondary)' }}>{getBrandAsset(p.dataKey)?.label ?? p.dataKey.toUpperCase()}</span>
          </div>
          <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
            ${p.value?.toLocaleString()}
          </span>
        </div>
      ))}
      <div className="border-t mt-2 pt-2 flex justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Total</span>
        <span className="font-semibold font-mono" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
          ${total.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

/** Stacked area chart of cloud spend over time */
export default function AreaSpendChart() {
  const { data: d0 } = useMigrationData('/unified');
  const dailySpend = d0?.dailySpend || [];

  const [range, setRange] = useState('30d')
  const days = RANGES.find(r => r.label === range)?.days || 30
  const data = dailySpend.slice(-days).map(d => ({
    ...d,
    date: fmtDate(d.date),
  }))

  return (
    <div className="rounded-xl flex flex-col group layer-raised p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Spend Over Time</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Daily spend by cloud provider</p>
        </div>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${range === r.label ? 'shiny-primary' : 'layer-raised'}`}
              style={{
                color: range === r.label ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <div className="flex items-center gap-1.5">
                {range === r.label && <Check size={12} className="opacity-80" />}
                <span>{r.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 layer-recessed rounded-xl p-4 mt-2">
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="awsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF9900" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#FF9900" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gcpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4285F4" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="azureGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0078D4" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#0078D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D40" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#4A5568', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(days / 7)}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fill: '#4A5568', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 12 }}
              content={({ payload }) => (
                <div className="flex items-center justify-center gap-2 pt-3">
                  {payload.map(p => (
                    <div
                      key={p.dataKey}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
                      style={{ borderColor: p.color + '40', background: p.color + '12', color: 'var(--text-secondary)' }}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                      {getBrandAsset(p.dataKey)?.label ?? p.dataKey.toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
            />
            <Area type="monotone" dataKey="aws" stroke="#FF9900" strokeWidth={2} fill="url(#awsGrad)" dot={false} />
            <Area type="monotone" dataKey="gcp" stroke="#4285F4" strokeWidth={2} fill="url(#gcpGrad)" dot={false} />
            <Area type="monotone" dataKey="azure" stroke="#0078D4" strokeWidth={2} fill="url(#azureGrad)" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

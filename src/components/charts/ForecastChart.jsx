import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, ReferenceArea
} from 'recharts'
import { dailySpend, monthlySpend } from '../../data/mockUnified'

const fmt = (v) => `$${(v / 1000).toFixed(1)}k`

// Build 90-day historical + 14-day forecast
const buildData = () => {
  const hist = dailySpend.slice(-60).map(d => ({
    date: d.date,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    actual: d.total,
    forecast: undefined,
  }))
  const last = dailySpend[dailySpend.length - 1]
  const avg = dailySpend.slice(-7).reduce((s, d) => s + d.total, 0) / 7
  for (let i = 1; i <= 10; i++) {
    const d = new Date(last.date + 'T00:00:00')
    d.setDate(d.getDate() + i)
    hist.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: undefined,
      forecast: +(avg * (1 + (i % 3 - 1) * 0.04)).toFixed(0),
    })
  }
  return hist
}

const data = buildData()
const TODAY = dailySpend[dailySpend.length - 1].date

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const p = payload.find(p => p.value !== undefined)
  if (!p) return null
  const isActual = p.dataKey === 'actual'
  const color = isActual ? '#3B82F6' : '#F59E0B'
  return (
    <div className="rounded-xl border p-3 text-sm shadow-2xl"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="flex items-center gap-2">
        <svg width="18" height="10" className="shrink-0" aria-hidden="true">
          <line x1="0" y1="5" x2="18" y2="5" stroke={color} strokeWidth="2.5"
            strokeDasharray={isActual ? undefined : '4 2'} strokeLinecap="round" />
          {isActual && <circle cx="9" cy="5" r="2" fill={color} />}
        </svg>
        <span style={{ color: 'var(--text-secondary)' }}>{isActual ? 'Actual' : 'Forecast'}</span>
        <span className="font-mono font-semibold ml-auto" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
          ${p.value?.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

/** Area + forecast line chart for Cost Explorer page */
export default function ForecastChart() {
  return (
    <div className="rounded-xl flex flex-col group layer-raised p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Spend & Forecast</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>60-day history + 10-day projection</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
            style={{ borderColor: '#3B82F640', background: '#3B82F612', color: 'var(--text-secondary)' }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#3B82F6' }} />
            Actual
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
            style={{ borderColor: '#F59E0B40', background: '#F59E0B12', color: 'var(--text-secondary)' }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#F59E0B' }} />
            Forecast
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="fcastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2D40" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} interval={9} />
          <YAxis tickFormatter={fmt} tick={{ fill: '#4A5568', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceArea
            x1={data.find(d => d.date === TODAY)?.label}
            x2={data[data.length - 1].label}
            fill="#F59E0B"
            fillOpacity={0.04}
          />
          <ReferenceLine
            x={data.find(d => d.date === TODAY)?.label}
            stroke="#F59E0B"
            strokeDasharray="4 4"
            label={{ value: 'Today', fill: '#F59E0B', fontSize: 10, position: 'top' }}
          />
          <Area type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} fill="url(#fcastGrad)" dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="forecast" stroke="#F59E0B" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

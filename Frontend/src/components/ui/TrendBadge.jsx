import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * Trend badge — colored arrow + percentage.
 * Props: value (number), suffix ("%"), invertColors (bool — for cost where up is bad)
 */
export default function TrendBadge({ value, suffix = '%', invertColors = false }) {
  if (value === 0 || value === null || value === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(74,85,104,0.2)', color: 'var(--text-muted)' }}>
        <Minus size={11} /> —
      </span>
    )
  }

  const isPositive = value > 0
  // For costs: up = bad (red), down = good (green) if invertColors=true
  const isGood = invertColors ? !isPositive : isPositive
  const color = isGood ? '#10B981' : '#F43F5E'
  const bg = isGood ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)'

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: bg, color }}
    >
      {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  )
}

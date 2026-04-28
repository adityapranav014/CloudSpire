import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function MetricCard({ title, value, subtitle, trend, trendValue, icon: Icon, accentColor = 'var(--accent-primary)', sparklineData = [], sparklineKey = 'total', isCurrency = false }) {
  const displayValue = isCurrency && typeof value === 'number' ? fmt.format(value) : value
  const isSavings = title.toLowerCase().includes('savings')
  const trendUp   = trend === 'up'
  const trendColor = trend === 'neutral'
    ? 'var(--text-muted)'
    : trendUp
      ? (isSavings ? 'var(--accent-emerald)' : 'var(--accent-rose)')
      : (isSavings ? 'var(--accent-rose)'    : 'var(--accent-emerald)')

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative rounded-2xl overflow-hidden flex flex-col group"
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid var(--border-default)`,
      }}
    >
      {/* Top accent bar — solid 2px line, no glow */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: accentColor }}
      />

      {/* Card body */}
      <div className="px-5 pt-5 pb-3 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest leading-none" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          {Icon && (
            <div
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${accentColor} 20%, transparent)`,
              }}
            >
              <Icon size={16} style={{ color: accentColor }} />
            </div>
          )}
        </div>

        {/* Value */}
        <p
          className="text-[1.7rem] leading-none font-bold tracking-tight"
          style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {displayValue}
        </p>

        {/* Trend + subtitle */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: trendColor,
              background: `color-mix(in srgb, ${trendColor} 12%, transparent)`,
            }}
          >
            {trend === 'up'      && <TrendingUp  size={11} />}
            {trend === 'down'    && <TrendingDown size={11} />}
            {trend === 'neutral' && <Minus        size={11} />}
            {trendValue}
          </span>
          {subtitle && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{subtitle}</span>
          )}
        </div>
      </div>

      {/* Sparkline flush to bottom */}
      {sparklineData.length > 0 && (
        <div className="h-14 w-full -mb-px">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`sg-${sparklineKey}-${title.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={accentColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={sparklineKey}
                stroke={accentColor}
                strokeWidth={1.5}
                fill={`url(#sg-${sparklineKey}-${title.replace(/\s/g,'')})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}

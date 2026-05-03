/**
 * Severity badge for anomalies.
 * Props: severity ("critical"|"high"|"medium"|"low")
 */
export default function SeverityBadge({ severity }) {
  const configs = {
    critical: { label: 'CRITICAL', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
    high: { label: 'HIGH', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    medium: { label: 'MEDIUM', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    low: { label: 'LOW', color: '#8A9BB8', bg: 'rgba(138,155,184,0.1)' },
  }
  const cfg = configs[severity] || configs.low

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

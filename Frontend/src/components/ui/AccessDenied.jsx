
import { useNavigate } from 'react-router-dom'
import { ShieldOff, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePermissions } from '../../hooks/usePermissions'
import { useMigrationData } from '../../hooks/useMigrationData'

/** Rendered when a role tries to access a page they don't have permission for */
export default function AccessDenied({ page }) {
  const { data: d0 } = useMigrationData('/roles');
  const ROLE_META = d0?.ROLE_META || {};
  const navigate = useNavigate()
  const { persona } = usePermissions()
  const meta = ROLE_META[persona?.role] || {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      {/* Icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'color-mix(in srgb, var(--accent-rose) 10%, transparent)' }}
      >
        <ShieldOff size={36} style={{ color: 'var(--accent-rose)' }} />
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Access Restricted
      </h1>
      <p className="text-base mb-4 max-w-md" style={{ color: 'var(--text-secondary)' }}>
        Your current role doesn't have permission to view this page.
      </p>

      {/* Current role badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8"
        style={{ background: meta.bg, color: meta.color }}
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: meta.color }}
        >
          {persona?.initials}
        </span>
        Logged in as: {meta.label}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-[--bg-hover]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>
        <button
          onClick={() => {
            // Open the demo switcher by dispatching a custom event
            window.dispatchEvent(new CustomEvent('cloudspire:open-role-switcher'))
          }}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent-primary)' }}
        >
          Switch Role
        </button>
      </div>

      {/* Helper note */}
      <p className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
        Use the <strong>Demo Role Switcher</strong> (bottom-right) to log in as a different role.
      </p>
    </motion.div>
  )
}

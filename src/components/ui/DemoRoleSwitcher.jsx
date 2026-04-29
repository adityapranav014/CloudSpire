import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Check, ChevronUp, X } from 'lucide-react'
import { DEMO_PERSONAS, ROLE_META } from '../../data/mockRoles'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import UserAvatar from './UserAvatar'

/**
 * DemoRoleSwitcher — floating bottom-right widget.
 *
 * Shows the current role as a colored pill. Clicking it opens a full-screen
 * backdrop with 6 role cards. Selecting a card calls switchRole() and fires
 * a toast. Also responds to the 'cloudspire:open-role-switcher' custom event
 * (dispatched by the AccessDenied page's "Switch Role" button).
 */
export default function DemoRoleSwitcher() {
  const [open, setOpen] = useState(false)
  const { persona, switchRole } = useAuth()
  const { addToast } = useToast()
  const meta = ROLE_META[persona.role]

  // Allow AccessDenied page to open the switcher programmatically
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('cloudspire:open-role-switcher', handler)
    return () => window.removeEventListener('cloudspire:open-role-switcher', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleSelect = (p) => {
    if (p.role === persona.role) { setOpen(false); return }
    switchRole(p.role)
    addToast(`Switched to ${ROLE_META[p.role].label} — ${p.name}`, 'success')
    setOpen(false)
  }

  return (
    <>
      {/* Floating trigger pill */}
      <div className="fixed bottom-5 right-5 z-40">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl text-sm font-semibold border transition-all"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: meta.color,
            color: meta.color,
            boxShadow: `0 4px 24px ${meta.color}33`,
          }}
        >
          {/* Avatar photo */}
          <UserAvatar user={persona} size="sm" />
          <span className="hidden sm:block">{meta.label}</span>
          <Users size={13} className="sm:hidden" />
          {open
            ? <X size={13} />
            : <ChevronUp size={13} />
          }
        </motion.button>
      </div>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Demo Role Switcher
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Select a persona to explore CloudSpire from their perspective
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[--bg-hover] transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Role grid */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto">
                {DEMO_PERSONAS.map((p) => {
                  const m = ROLE_META[p.role]
                  const isActive = p.role === persona.role
                  return (
                    <motion.button
                      key={p.role}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handleSelect(p)}
                      className="relative text-left rounded-xl border p-4 transition-all"
                      style={{
                        background: isActive ? m.bg : 'var(--bg-card)',
                        borderColor: isActive ? m.color : 'var(--border-default)',
                        borderWidth: isActive ? '2px' : '1px',
                      }}
                    >
                      {/* Active check */}
                      {isActive && (
                        <span
                          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: m.color }}
                        >
                          <Check size={11} color="#fff" strokeWidth={3} />
                        </span>
                      )}

                      {/* Avatar + name */}
                      <div className="flex items-center gap-3 mb-3">
                        <UserAvatar user={p} size="lg" rounded="xl" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {p.name}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {p.title}
                          </p>
                        </div>
                      </div>

                      {/* Role badge */}
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide mb-2"
                        style={{ background: m.bg, color: m.color }}
                      >
                        {m.label}
                      </span>

                      {/* Tagline */}
                      <p className="text-[11px] mb-2.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                        {p.tagline}
                      </p>

                      {/* Permission highlights */}
                      <ul className="space-y-1">
                        {p.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            <span className="mt-0.5 w-1 h-1 rounded-full shrink-0" style={{ background: m.color }} />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </motion.button>
                  )
                })}
              </div>

              {/* Footer */}
              <div
                className="px-6 py-3 border-t flex justify-end"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[--bg-hover]"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

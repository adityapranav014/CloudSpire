/**
 * DemoBanner.jsx
 *
 * Shown when an org has no connected cloud accounts — i.e. the dashboard
 * is displaying official AWS Cost and Usage Report sample data from:
 *   https://github.com/aws-samples/aws-cost-and-usage-report-samples
 *
 * Props:
 *   show        {boolean}  — controlled by isSampleData from dashboardSlice
 *   onDismiss   {function} — called when user clicks ✕ (session-only hide)
 *
 * Design:
 *   - Amber/warning tone to differentiate from real data
 *   - Shows the data source for trust/transparency
 *   - CTA leads to /settings/accounts (cloud account setup)
 *   - Framer Motion enter/exit animation
 *   - Dismissible for the session (does NOT persist to localStorage)
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * @param {{ show: boolean }} props
 */
export default function DemoBanner({ show }) {
  const [dismissed, setDismissed] = useState(false)

  // show=false means org has real accounts → never render
  if (!show || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        key="demo-banner"
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <div
          className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 rounded-xl border mb-5 text-sm"
          style={{
            background: 'color-mix(in srgb, #F59E0B 10%, var(--bg-elevated))',
            borderColor: 'color-mix(in srgb, #F59E0B 35%, var(--border-subtle))',
          }}
          role="status"
          aria-label="Demo data notice"
        >
          {/* Icon + Text */}
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <div
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, #F59E0B 15%, transparent)' }}
            >
              <Sparkles size={15} style={{ color: '#F59E0B' }} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-snug" style={{ color: '#F59E0B' }}>
                Viewing official AWS sample data
              </p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Numbers come from the{' '}
                <a
                  href="https://github.com/aws-samples/aws-cost-and-usage-report-samples"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--accent-amber)' }}
                >
                  aws-samples/aws-cost-and-usage-report-samples
                </a>{' '}
                repo — the same billing format your real AWS account uses. Connect
                your account to see your actual costs.
              </p>
            </div>
          </div>

          {/* CTA + Dismiss */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/settings"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-opacity hover:opacity-80"
              style={{ background: '#F59E0B', color: '#000' }}
            >
              Connect Account <ArrowRight size={11} />
            </Link>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss demo banner"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useSocket } from '../../hooks/useSocket'

/**
 * AppLayout — persistent shell for all authenticated pages.
 *
 * useSocket() is called here (not in individual pages) so:
 *   - The socket connection persists across page navigation
 *   - Metric streaming continues when switching between /dashboard and /anomalies
 *   - Disconnect happens automatically when the user logs out and AppLayout unmounts
 *
 * serverId: 'local' collects host machine metrics for the live dashboard demo.
 * In Sprint 2, serverId will come from the user's selected cloud account.
 */
export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const isFullBleed = location.pathname === '/chat'
  const { startMetrics, stopMetrics } = useSocket()

  useEffect(() => {
      // Start collecting local machine metrics for the live dashboard widget.
      // The socket must be connected before this emit fires — useSocket internally
      // emits 'metrics:start' after the 'connect' event via startMetrics().
      // We defer with setTimeout(0) so the socket.on('connect') handler fires first.
      const timer = setTimeout(() => {
          startMetrics('local')
      }, 500)

      return () => {
          clearTimeout(timer)
          stopMetrics('local')
      }
  }, [startMetrics, stopMetrics])

  return (
    <div className="h-[100dvh] overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />
      <TopBar onOpenMenu={() => setMobileNavOpen(true)} />
      {isFullBleed ? (
        <main className="pt-14 h-[100dvh] overflow-hidden lg:ml-56 flex flex-col">
          <Outlet />
        </main>
      ) : (
        <main className="pt-14 h-[100dvh] overflow-y-auto lg:ml-56">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      )}
    </div>
  )
}

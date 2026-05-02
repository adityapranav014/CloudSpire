import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useSocket } from '../../hooks/useSocket'

/** Main shell — sidebar + topbar + scrollable content area */
export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const isFullBleed = location.pathname === '/chat'
  
  // Initialize Socket.io connection globally for the authenticated app
  useSocket();

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

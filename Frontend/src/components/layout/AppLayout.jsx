import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

/** Main shell — sidebar + topbar + scrollable content area */
export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="h-[100dvh] overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />
      <TopBar onOpenMenu={() => setMobileNavOpen(true)} />
      <main className="pt-14 h-[100dvh] overflow-y-auto lg:ml-56">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

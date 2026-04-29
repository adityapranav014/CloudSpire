import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ToastProvider } from './context/ToastContext'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import CostExplorer from './pages/CostExplorer'
import Anomalies from './pages/Anomalies'
import Optimizer from './pages/Optimizer'
import Teams from './pages/Teams'
import Accounts from './pages/Accounts'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import Landing from './pages/Landing'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

/** Root app — sets up routing and global providers */
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cost-explorer" element={<CostExplorer />} />
            <Route path="/anomalies" element={<Anomalies />} />
            <Route path="/optimizer" element={<Optimizer />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

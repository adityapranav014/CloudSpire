import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

/** Root app — sets up routing and global providers */
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
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

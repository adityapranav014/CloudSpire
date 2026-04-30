import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
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

/** Root app — sets up routing and global providers */
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard"     element={<ProtectedRoute page="/dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/cost-explorer" element={<ProtectedRoute page="/cost-explorer"><CostExplorer /></ProtectedRoute>} />
            <Route path="/anomalies"     element={<ProtectedRoute page="/anomalies"><Anomalies /></ProtectedRoute>} />
            <Route path="/optimizer"     element={<ProtectedRoute page="/optimizer"><Optimizer /></ProtectedRoute>} />
            <Route path="/teams"         element={<ProtectedRoute page="/teams"><Teams /></ProtectedRoute>} />
            <Route path="/accounts"      element={<ProtectedRoute page="/accounts"><Accounts /></ProtectedRoute>} />
            <Route path="/reports"       element={<ProtectedRoute page="/reports"><Reports /></ProtectedRoute>} />
            <Route path="/settings"      element={<ProtectedRoute page="/settings"><Settings /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}


import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Search, AlertTriangle, Zap, Users,
  Link2, FileText, Settings, TrendingUp, MessageSquare
} from 'lucide-react'

import { usePermissions } from '../../hooks/usePermissions'
import { Sheet, SheetContent } from '../ui/sheet'
import { useMigrationData } from '../../hooks/useMigrationData'
import logo from '../../assets/cloudSpire.svg'

/** Main sidebar navigation */
export default function Sidebar({ mobileOpen = false, onMobileOpenChange = () => { } }) {
  const { data: d0 } = useMigrationData('/alerts');
  const anomalies = d0?.anomalies || [];
  const openAnomalies = anomalies.filter(a => a.status === 'open').length

  const navSections = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
        { label: 'Cost Explorer', icon: Search, to: '/cost-explorer' },
      ],
    },
    {
      label: 'Management',
      items: [
        { label: 'Anomalies', icon: AlertTriangle, to: '/anomalies', badge: openAnomalies },
        { label: 'Optimizer', icon: Zap, to: '/optimizer' },
        { label: 'Teams', icon: Users, to: '/teams' },
        { label: 'Accounts', icon: Link2, to: '/accounts' },
      ],
    },
    {
      label: 'Reporting',
      items: [
        { label: 'Reports', icon: FileText, to: '/reports' },
      ],
    },
    {
      label: 'AI',
      items: [
        { label: 'AI Chat', icon: MessageSquare, to: '/chat' },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Metrics', icon: TrendingUp, to: '/metrics' },
        { label: 'Settings', icon: Settings, to: '/settings' },
      ],
    },
  ]

  const location = useLocation()
  const { canAccessPage } = usePermissions()

  const navMarkup = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <img src={logo} alt="CloudSpire" className="h-9 w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map(section => {
          const visibleItems = section.items.filter(item => canAccessPage(item.to))
          if (visibleItems.length === 0) return null
          return (
            <div key={section.label}>
              <p className="text-[10px] font-semibold tracking-wide px-2 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map(item => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.to
                  return (
                    <motion.li key={item.to} whileHover={{ x: 2 }}>
                      <NavLink
                        to={item.to}
                        onClick={() => onMobileOpenChange(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 relative group"
                        style={({ isActive }) => ({
                          background: isActive ? 'var(--accent-primary-subtle)' : undefined,
                          color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        })}
                        onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'var(--bg-hover)' }}
                        onMouseLeave={e => { const active = location.pathname === item.to; if (!active) e.currentTarget.style.background = '' }}
                      >
                        <Icon size={15} />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge ? (
                          <span className="text-[10px] font-bold bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            {item.badge}
                          </span>
                        ) : null}
                      </NavLink>
                    </motion.li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-56 flex-col z-30 border-r"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        {navMarkup}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[84vw] max-w-[320px] p-0 border-r"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="h-full flex flex-col">{navMarkup}</div>
        </SheetContent>
      </Sheet>
    </>
  )
}

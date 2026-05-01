import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, User, ChevronDown, LogOut, Settings, HelpCircle, PanelLeftOpen } from 'lucide-react'
import { anomalies } from '../../data/mockAlerts'
import { awsAccounts } from '../../data/mockAWS'
import { usePermissions } from '../../hooks/usePermissions'
import { ROLE_META } from '../../data/mockRoles'
import UserAvatar from '../ui/UserAvatar'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command"

const openCount = anomalies.filter(a => a.status === 'open').length
const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '')).replace(/\/$/, '')
const backendHealthUrl = `${backendBaseUrl}/health`
const commandItems = {
  pages: [
    { label: 'Dashboard', action: '/dashboard' },
    { label: 'Cost Explorer', action: '/cost-explorer' },
    { label: 'Optimizer', action: '/optimizer' },
    { label: 'Anomalies', action: '/anomalies' },
    { label: 'Accounts', action: '/accounts' },
    { label: 'Teams & Budgets', action: '/teams' },
    { label: 'Reports', action: '/reports' },
  ],
  recent: [
    { label: 'AWS Production Account', action: '/accounts' },
    { label: 'Lambda Anomaly', action: '/anomalies' },
    { label: 'Monthly Cost Digest', action: '/reports' },
  ],
  accounts: awsAccounts.slice(0, 3).map((account) => ({ label: account.name, action: '/accounts' })),
}

/** Top application bar with search, notifications, and user menu */
export default function TopBar({ onOpenMenu = () => { } }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking')
  const userMenuRef = useRef(null)
  const navigate = useNavigate()
  const { persona } = usePermissions()
  const meta = ROLE_META[persona.role]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((searchOpen) => !searchOpen)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    let isMounted = true

    const checkBackendHealth = async () => {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 4000)

      try {
        const response = await fetch(backendHealthUrl, {
          method: 'GET',
          signal: controller.signal,
        })

        if (!isMounted) return

        setBackendStatus(response.ok ? 'connected' : 'disconnected')
      } catch {
        if (isMounted) {
          setBackendStatus('disconnected')
        }
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    checkBackendHealth()
    const intervalId = window.setInterval(checkBackendHealth, 30000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const isBackendConnected = backendStatus === 'connected'
  const isBackendChecking = backendStatus === 'checking'
  const backendPillLabel = isBackendConnected ? 'Backend online' : backendStatus === 'checking' ? 'Checking backend' : 'Backend offline'

  return (
    <header
      className="fixed top-0 left-0 right-0 lg:left-56 h-14 flex items-center justify-between px-4 sm:px-6 z-20 border-b gap-3 shadow-depth-1"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Search */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          className="lg:hidden p-2 rounded-lg transition-colors hover:bg-[--bg-hover]"
          onClick={onOpenMenu}
          title="Open navigation"
        >
          <PanelLeftOpen size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>

        <div className="relative min-w-0 flex-1 max-w-xl">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search pages, accounts, services... (⌘K)"
            className="pl-9 pr-4 py-1.5 text-sm rounded-lg w-full outline-none border transition-colors cursor-pointer shadow-depth-inset"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)',
            }}
            onClick={() => setSearchOpen(true)}
            readOnly
          />
        </div>
      </div>

      <div className="flex items-center shrink-0">
        <div
          className="flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap"
          style={{
            background: isBackendConnected
              ? 'rgba(34, 197, 94, 0.12)'
              : isBackendChecking
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
            borderColor: isBackendConnected
              ? 'rgba(34, 197, 94, 0.3)'
              : isBackendChecking
                ? 'rgba(245, 158, 11, 0.3)'
                : 'rgba(239, 68, 68, 0.3)',
            color: isBackendConnected ? '#15803d' : isBackendChecking ? '#b45309' : '#b91c1c',
          }}
          title={backendHealthUrl}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background: isBackendConnected ? '#22c55e' : backendStatus === 'checking' ? '#f59e0b' : '#ef4444',
              boxShadow: isBackendConnected
                ? '0 0 0 4px rgba(34, 197, 94, 0.12)'
                : isBackendChecking
                  ? '0 0 0 4px rgba(245, 158, 11, 0.12)'
                  : '0 0 0 4px rgba(239, 68, 68, 0.12)',
            }}
          />
          <span className="hidden md:inline">{backendPillLabel}</span>
          <span className="md:hidden">API</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-[--bg-hover]"
          onClick={() => navigate('/anomalies')}
          title="View anomalies"
        >
          <Bell size={17} style={{ color: 'var(--text-secondary)' }} />
          {openCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center">
              {openCount}
            </span>
          )}
        </button>

        {/* User avatar dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-[--bg-hover]"
            onClick={() => setUserMenuOpen(v => !v)}
          >
            <UserAvatar user={persona} size="sm" />
            <span className="hidden sm:block text-sm" style={{ color: 'var(--text-secondary)' }}>
              {persona.name.split(' ')[0]} {persona.name.split(' ')[1]?.[0]}.
            </span>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-depth-3 py-1 z-50 bg-surface"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <UserAvatar user={persona} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{persona.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{persona.email}</p>
                  </div>
                </div>
                <span
                  className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
              </div>
              {[
                { icon: User, label: 'Profile' },
                { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
                { icon: HelpCircle, label: 'Help & Docs' },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-[--bg-hover]"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => { action?.(); setUserMenuOpen(false) }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
              <div className="border-t mt-1 pt-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-[--bg-hover]"
                  style={{ color: 'var(--accent-rose)' }}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('cloudspire:open-role-switcher'))
                    setUserMenuOpen(false)
                  }}
                >
                  <LogOut size={14} />
                  Switch Role / Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {commandItems.pages.map((item) => (
              <CommandItem key={item.label} onSelect={() => { navigate(item.action); setSearchOpen(false) }}>{item.label}</CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Recent">
            {commandItems.recent.map((item) => (
              <CommandItem key={item.label} onSelect={() => { navigate(item.action); setSearchOpen(false) }}>{item.label}</CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Accounts">
            {commandItems.accounts.map((item) => (
              <CommandItem key={item.label} onSelect={() => { navigate(item.action); setSearchOpen(false) }}>{item.label}</CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  )
}

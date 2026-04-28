import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, User, ChevronDown, LogOut, Settings, HelpCircle, Sun, Moon, PanelLeftOpen } from 'lucide-react'
import { anomalies } from '../../data/mockAlerts'
import { awsAccounts } from '../../data/mockAWS'
import { useTheme } from "../../context/ThemeContext"
import { CURRENT_USER } from '../../data/mockUsers'
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
export default function TopBar({ onOpenMenu = () => {} }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

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

  return (
    <header
      className="fixed top-0 left-0 right-0 lg:left-56 h-14 flex items-center justify-between px-4 sm:px-6 z-20 border-b gap-3"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Search */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/10"
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
          className="pl-9 pr-4 py-1.5 text-sm rounded-lg w-full outline-none border transition-colors cursor-pointer"
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

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Settings */}
        <button
          className="hidden sm:flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-white/10"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} style={{ color: 'var(--text-secondary)' }} /> : <Moon size={17} style={{ color: 'var(--text-secondary)' }} />}
        </button>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-white/10"
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
        <div className="relative">
          <button
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-white/10"
            onClick={() => setUserMenuOpen(v => !v)}
          >
            <UserAvatar user={CURRENT_USER} size="sm" />
            <span className="hidden sm:block text-sm" style={{ color: 'var(--text-secondary)' }}>{CURRENT_USER.name.split(' ')[0]} {CURRENT_USER.name.split(' ')[1]?.[0]}.</span>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-2xl py-1 z-50"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
            >
              <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{CURRENT_USER.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{CURRENT_USER.email}</p>
              </div>
              {[
                { icon: User, label: 'Profile' },
                { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
                { icon: HelpCircle, label: 'Help & Docs' },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => { action?.(); setUserMenuOpen(false) }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
              <div className="border-t mt-1 pt-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-white/10"
                  style={{ color: 'var(--accent-rose)' }}
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LogOut size={14} />
                  Sign out
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

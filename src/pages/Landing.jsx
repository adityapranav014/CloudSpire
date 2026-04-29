import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Menu, X, BarChart3, Zap, AlertTriangle,
  Users, TrendingDown, FileText, CheckCircle, ChevronRight,
  Shield, Clock, Activity, DollarSign, Layers, Quote,
} from 'lucide-react'
import { BrandLogo } from '../constants/brandAssets'
import dashboardImg from '../assets/dashboard.png'

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { visible: { transition: { staggerChildren: 0.09 } } }

function AnomalyMockup() {
  const items = [
    { svc: 'Lambda — us-east-1', provider: 'aws', delta: '+$1,402', severity: 'critical', time: '14 min ago' },
    { svc: 'BigQuery Exports', provider: 'gcp', delta: '+$887', severity: 'high', time: '2 hr ago' },
    { svc: 'Blob Storage Egress', provider: 'azure', delta: '+$341', severity: 'medium', time: '6 hr ago' },
  ]
  const colors = { critical: '#dc2626', high: '#d97706', medium: '#2563eb' }
  return (
    <div className="rounded-xl border overflow-hidden w-full" style={{ background: '#fff', borderColor: '#e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} style={{ color: '#dc2626' }} />
          <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>Live Anomalies</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>7 open</span>
      </div>
      <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
        {items.map((item, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3">
            <div className="w-1 h-7 rounded-full shrink-0" style={{ background: colors[item.severity] }} />
            <BrandLogo brandKey={item.provider} size={15} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#0f172a' }}>{item.svc}</p>
              <p className="text-[10px]" style={{ color: '#94a3b8' }}>{item.time}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold" style={{ color: colors[item.severity], fontFamily: "'JetBrains Mono', monospace" }}>{item.delta}</p>
              <p className="text-[10px] capitalize" style={{ color: colors[item.severity] }}>{item.severity}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t flex items-center gap-2" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <Activity size={11} style={{ color: '#16a34a' }} />
        <span className="text-[10px]" style={{ color: '#64748b' }}>AI root-cause analysis running…</span>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
          <motion.div className="h-full rounded-full" style={{ background: '#16a34a' }}
            initial={{ width: '0%' }} animate={{ width: '72%' }} transition={{ duration: 2, ease: 'easeOut', delay: 0.4 }} />
        </div>
      </div>
    </div>
  )
}

function OptimizerMockup() {
  const recs = [
    { title: 'Rightsize EC2 t3.large → t3.medium', savings: '$4,200/mo', provider: 'aws', effort: 'Low' },
    { title: 'Delete 14 unattached EBS volumes', savings: '$1,840/mo', provider: 'aws', effort: 'Low' },
    { title: 'Committed use discounts (GCP)', savings: '$6,100/mo', provider: 'gcp', effort: 'Medium' },
    { title: 'Azure Reserved Instances (3-yr)', savings: '$9,200/mo', provider: 'azure', effort: 'Medium' },
  ]
  return (
    <div className="rounded-xl border overflow-hidden w-full" style={{ background: '#fff', borderColor: '#e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <div className="flex items-center gap-2 mb-0.5">
          <Zap size={13} style={{ color: '#2563eb' }} />
          <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>AI Recommendations</span>
        </div>
        <p className="text-[10px]" style={{ color: '#64748b' }}>
          Total identified: <span className="font-bold" style={{ color: '#16a34a' }}>$34,100/mo</span>
        </p>
      </div>
      <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
        {recs.map((r, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center gap-3">
            <BrandLogo brandKey={r.provider} size={13} />
            <p className="flex-1 text-[11px]" style={{ color: '#475569' }}>{r.title}</p>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold" style={{ color: '#16a34a', fontFamily: "'JetBrains Mono', monospace" }}>{r.savings}</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                background: r.effort === 'Low' ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.08)',
                color: r.effort === 'Low' ? '#16a34a' : '#d97706',
              }}>{r.effort}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamsMockup() {
  const teams = [
    { name: 'Platform', budget: 50000, used: 38200, color: '#2563eb' },
    { name: 'Data', budget: 30000, used: 27800, color: '#d97706' },
    { name: 'Frontend', budget: 15000, used: 8400, color: '#16a34a' },
    { name: 'ML / AI', budget: 40000, used: 41200, color: '#dc2626' },
  ]
  const fmt = v => '$' + (v / 1000).toFixed(0) + 'K'
  return (
    <div className="rounded-xl border overflow-hidden w-full" style={{ background: '#fff', borderColor: '#e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <Users size={13} style={{ color: '#8b5cf6' }} />
        <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>Team Budgets — April 2026</span>
      </div>
      <div className="p-4 space-y-4">
        {teams.map(t => {
          const pct = Math.min((t.used / t.budget) * 100, 100)
          const over = t.used > t.budget
          return (
            <div key={t.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: '#0f172a' }}>{t.name}</span>
                <span className="text-[10px]" style={{ color: over ? '#dc2626' : '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt(t.used)} / {fmt(t.budget)}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                <motion.div className="h-full rounded-full" style={{ background: over ? '#dc2626' : t.color }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const navLinks = ['Features', 'How it works', 'Pricing']

  const featureTabs = [
    {
      label: 'Anomaly Detection',
      icon: AlertTriangle,
      accentColor: '#dc2626',
      headline: 'Know about cost spikes before your CFO does.',
      desc: "ML models learn your baseline spend and fire alerts the moment something looks off — whether it's a runaway Lambda or a misconfigured data pipeline.",
      bullets: [
        'ML baseline learning across services and regions',
        'Root-cause analysis with AI-generated explanations',
        'Slack / PagerDuty / webhook integrations',
        'Smart suppression to cut alert fatigue',
      ],
      link: '/anomalies',
      Mockup: AnomalyMockup,
    },
    {
      label: 'AI Optimizer',
      icon: Zap,
      accentColor: '#16a34a',
      headline: 'AI finds the waste. You approve the changes.',
      desc: 'Rightsizing, idle resource detection, and commitment discount strategies — ranked by impact vs. effort. Average customer saves 34% in 90 days.',
      bullets: [
        'EC2 / GCE / VM rightsizing with utilization data',
        'Reserved instance and savings plan modeling',
        'Idle resource detection and deletion workflows',
        'One-click Terraform export for approved changes',
      ],
      link: '/optimizer',
      Mockup: OptimizerMockup,
    },
    {
      label: 'Team Budgets',
      icon: Users,
      accentColor: '#8b5cf6',
      headline: 'Every team owns their cloud spend.',
      desc: 'Allocate budgets to any team, product, or cost center. CloudSpire maps spend to your org structure automatically using tags and account hierarchies.',
      bullets: [
        'Budget allocation by team, tag, or account',
        'Configurable threshold alerts at 80%, 95%, 100%',
        'Chargeback and showback report exports',
        'Slack DMs when a team is about to overspend',
      ],
      link: '/teams',
      Mockup: TeamsMockup,
    },
  ]

  const testimonials = [
    {
      quote: "We found $47K in monthly waste during our first week. CloudSpire paid for itself in the first hour.",
      name: 'Sarah K.',
      role: 'Head of Platform Engineering',
      company: 'StackEdge',
      initials: 'SK',
      color: '#2563eb',
    },
    {
      quote: "The anomaly detection caught a runaway Fargate task that would have cost us $22K. It's now the first thing I check every morning.",
      name: 'Marcus T.',
      role: 'VP of Engineering',
      company: 'Luminary AI',
      initials: 'MT',
      color: '#16a34a',
    },
    {
      quote: "Finally a FinOps tool engineers actually want to use. The team budget feature changed how we do sprint planning.",
      name: 'Priya D.',
      role: 'Staff SRE',
      company: 'Novex Systems',
      initials: 'PD',
      color: '#d97706',
    },
  ]

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      highlight: false,
      desc: 'Get started with cloud cost visibility at no cost.',
      features: ['1 cloud provider', 'Up to $50K monthly spend', 'Dashboard + basic charts', '30-day history', 'Email support'],
    },
    {
      name: 'Growth',
      price: '$149',
      period: '/mo',
      highlight: true,
      desc: 'Full visibility, anomaly detection, and AI optimization.',
      features: ['All 3 cloud providers', 'Unlimited spend', 'AI Optimizer + anomalies', '90-day history + forecasting', 'Team budgets + Slack alerts', 'Priority support'],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      highlight: false,
      desc: 'For large orgs with compliance, SSO, and chargeback.',
      features: ['Everything in Growth', 'SSO / SAML', 'Custom data retention', 'Chargeback & showback', 'Dedicated CSM', 'SLA guarantee'],
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)', borderColor: '#e2e8f0' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between" style={{ height: 60 }}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="CloudSpire" className="w-7 h-7" />
            <span className="font-bold text-sm" style={{ color: '#0f172a' }}>CloudSpire</span>
          </button>
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm transition-colors hover:text-slate-900"
                style={{ color: '#64748b' }}>
                {link}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => navigate('/dashboard')}
              className="text-sm px-4 py-2 rounded-lg transition-colors hover:bg-slate-50"
              style={{ color: '#64748b' }}>
              Sign in
            </button>
            <button onClick={() => navigate('/onboarding')}
              className="text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
              style={{ background: '#0f172a', color: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1e293b' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0f172a' }}>
              Get started <ArrowRight size={13} />
            </button>
          </div>
          <button className="md:hidden p-2 rounded-lg" onClick={() => setMobileMenuOpen(v => !v)} style={{ color: '#64748b' }}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              <div className="px-5 py-4 space-y-1">
                {navLinks.map(link => (
                  <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block text-sm py-2.5 px-3 rounded-lg" style={{ color: '#475569' }}
                    onClick={() => setMobileMenuOpen(false)}>{link}
                  </a>
                ))}
                <div className="pt-3 space-y-2 border-t mt-2" style={{ borderColor: '#e2e8f0' }}>
                  <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false) }}
                    className="w-full text-sm py-2.5 rounded-lg border text-center" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                    Sign in
                  </button>
                  <button onClick={() => { navigate('/onboarding'); setMobileMenuOpen(false) }}
                    className="w-full text-sm font-semibold py-2.5 rounded-lg text-center" style={{ background: '#0f172a', color: '#fff' }}>
                    Get started free
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO */}
      <section className="overflow-hidden" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-7 border"
                style={{ borderColor: '#dbeafe', background: '#eff6ff', color: '#2563eb' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Now with multi-region anomaly detection
              </div>
              <h1 className="font-bold tracking-tight leading-[1.06] mb-5"
                style={{ fontSize: 'clamp(2.1rem, 5vw, 3.4rem)', color: '#0f172a' }}>
                Every cloud dollar,<br />finally accounted for.
              </h1>
              <p className="text-lg leading-relaxed mb-8 max-w-md" style={{ color: '#475569' }}>
                Unify AWS, GCP, and Azure in one dashboard. Catch anomalies in minutes,
                eliminate waste with AI, and give every team full cost ownership.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <button onClick={() => navigate('/onboarding')}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: '#2563eb', color: '#fff' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#2563eb' }}>
                  Start for free <ArrowRight size={15} />
                </button>
                <button onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border transition-colors hover:bg-slate-50"
                  style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                  Explore the demo <ChevronRight size={15} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {[
                  { value: '$2.4B+', label: 'cloud spend managed', green: false },
                  { value: '4,800+', label: 'engineering teams', green: false },
                  { value: '34%', label: 'avg cost reduction', green: true },
                ].map((s, i) => (
                  <div key={i} className="flex items-baseline gap-1.5">
                    <span className="font-bold text-base" style={{ color: s.green ? '#16a34a' : '#0f172a' }}>{s.value}</span>
                    <span className="text-sm" style={{ color: '#94a3b8' }}>{s.label}</span>
                    {i < 2 && <span className="hidden sm:block ml-3 w-px h-3.5 self-center" style={{ background: '#e2e8f0' }} />}
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div className="rounded-xl overflow-hidden border"
                style={{ borderColor: '#e2e8f0', boxShadow: '0 20px 60px rgba(15,23,42,0.1), 0 4px 16px rgba(15,23,42,0.06)' }}>
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fca5a5' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fcd34d' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#86efac' }} />
                  <div className="flex-1 mx-3 h-5 rounded flex items-center justify-center" style={{ background: '#e2e8f0' }}>
                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>app.cloudspire.io/dashboard</span>
                  </div>
                </div>
                <img src={dashboardImg} alt="CloudSpire Dashboard" className="w-full block" loading="eager" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS BAR */}
      <section className="border-t border-b py-10" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <p className="text-xs font-medium mr-2" style={{ color: '#94a3b8' }}>Works with</p>
          {[
            { key: 'aws', label: 'Amazon Web Services' },
            { key: 'gcp', label: 'Google Cloud' },
            { key: 'azure', label: 'Microsoft Azure' },
          ].map(p => (
            <div key={p.key} className="flex items-center gap-2 px-4 py-2 rounded-lg border" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
              <BrandLogo brandKey={p.key} size={16} />
              <span className="text-sm font-medium" style={{ color: '#475569' }}>{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES — tabbed showcase */}
      <section id="features" className="py-24 px-5 sm:px-8" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp} className="mb-12">
            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: '#2563eb', letterSpacing: '0.12em' }}>FEATURES</p>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight max-w-lg" style={{ color: '#0f172a' }}>
              The full FinOps stack,<br />out of the box.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2 space-y-1">
              {featureTabs.map((tab, i) => {
                const Icon = tab.icon
                const active = activeTab === i
                return (
                  <button key={i} onClick={() => setActiveTab(i)}
                    className="w-full text-left px-4 py-3.5 rounded-lg transition-all duration-200"
                    style={{
                      background: active ? '#f8fafc' : 'transparent',
                      borderLeft: `2px solid ${active ? tab.accentColor : 'transparent'}`,
                    }}>
                    <div className="flex items-center gap-3 mb-0.5">
                      <Icon size={15} style={{ color: active ? tab.accentColor : '#94a3b8' }} />
                      <span className="text-sm font-semibold" style={{ color: active ? '#0f172a' : '#64748b' }}>
                        {tab.label}
                      </span>
                    </div>
                    <AnimatePresence>
                      {active && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="text-xs leading-relaxed pl-6 overflow-hidden" style={{ color: '#64748b' }}>
                          {tab.desc}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </button>
                )
              })}
              <div className="pt-5 pl-4 space-y-2.5 border-t mt-3" style={{ borderColor: '#f1f5f9' }}>
                {[
                  { icon: TrendingDown, label: '90-day spend forecasting' },
                  { icon: FileText, label: 'Scheduled executive reports' },
                  { icon: BarChart3, label: 'Multi-account cost explorer' },
                ].map(f => {
                  const FIcon = f.icon
                  return (
                    <div key={f.label} className="flex items-center gap-2.5">
                      <FIcon size={13} style={{ color: '#cbd5e1' }} />
                      <span className="text-sm" style={{ color: '#94a3b8' }}>{f.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}>
                  <div className="mb-5">
                    {(() => { const M = featureTabs[activeTab].Mockup; return <M /> })()}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                    {featureTabs[activeTab].bullets.map(b => (
                      <div key={b} className="flex items-start gap-2">
                        <CheckCircle size={13} className="mt-0.5 shrink-0" style={{ color: '#16a34a' }} />
                        <span className="text-xs leading-relaxed" style={{ color: '#475569' }}>{b}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate(featureTabs[activeTab].link)}
                    className="text-sm font-medium flex items-center gap-1.5 transition-opacity hover:opacity-60"
                    style={{ color: '#2563eb' }}>
                    Explore this feature <ArrowRight size={14} />
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-5 sm:px-8" style={{ background: '#f8fafc' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp} className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight max-w-lg" style={{ color: '#0f172a' }}>
              Engineering teams who stopped<br className="hidden sm:block" /> paying for cloud waste.
            </h2>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
            variants={stagger}>
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp}
                className="rounded-xl border p-6 flex flex-col"
                style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
                <Quote size={18} className="mb-4" style={{ color: '#cbd5e1' }} />
                <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: '#475569' }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>{t.role} · {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-5 sm:px-8" style={{ background: '#ffffff' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp} className="mb-14">
            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: '#2563eb', letterSpacing: '0.12em' }}>HOW IT WORKS</p>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight max-w-md" style={{ color: '#0f172a' }}>
              Up and running in under 5 minutes.
            </h2>
          </motion.div>
          <div className="space-y-0">
            {[
              {
                title: 'Connect your cloud accounts',
                desc: 'Paste read-only IAM credentials for AWS, a GCP service account, or an Azure AD app. CloudSpire never writes to your infrastructure — we only read billing data.',
                badge: 'Takes 3 minutes · Read-only access only',
                icon: Layers,
              },
              {
                title: 'We normalize 90 days of history',
                desc: 'CloudSpire ingests your billing data, normalizes it across all three provider schemas, and builds a unified cost graph your whole team can explore and query.',
                badge: 'Automatic · No ETL required',
                icon: Activity,
              },
              {
                title: 'Start saving on day one',
                desc: 'Your dashboard goes live within minutes. AI optimization recommendations appear in under an hour. Most teams identify their first $10K in savings that same day.',
                badge: 'Avg $34K found in first 7 days',
                icon: DollarSign,
              },
            ].map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45, delay: i * 0.08 }}
                  className="flex gap-6 sm:gap-8 py-8 border-b last:border-0"
                  style={{ borderColor: '#f1f5f9' }}>
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold"
                      style={{ borderColor: '#e2e8f0', color: '#94a3b8', background: '#f8fafc' }}>
                      {i + 1}
                    </div>
                    {i < 2 && <div className="w-px flex-1 mt-3 min-h-8" style={{ background: '#e2e8f0' }} />}
                  </div>
                  <div className="pb-2 pt-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Icon size={16} style={{ color: '#2563eb' }} />
                      <h3 className="font-semibold text-base" style={{ color: '#0f172a' }}>{step.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: '#64748b' }}>{step.desc}</p>
                    <span className="inline-flex text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: '#f0f7ff', color: '#2563eb' }}>
                      {step.badge}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-start gap-3">
            <button onClick={() => navigate('/onboarding')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all"
              style={{ background: '#2563eb', color: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2563eb' }}>
              Connect my clouds — it's free <ArrowRight size={15} />
            </button>
            <p className="text-xs self-center" style={{ color: '#94a3b8' }}>No credit card required. Read-only access.</p>
          </motion.div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-5 sm:px-8" style={{ background: '#f8fafc' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp} className="mb-12">
            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: '#2563eb', letterSpacing: '0.12em' }}>PRICING</p>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight mb-2" style={{ color: '#0f172a' }}>
              Simple, transparent pricing.
            </h2>
            <p className="text-base" style={{ color: '#64748b' }}>Start free. No credit card. No surprises.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan, i) => (
              <motion.div key={plan.name}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.45 }}
                className="rounded-xl border p-6 flex flex-col relative"
                style={{
                  background: '#ffffff',
                  borderColor: plan.highlight ? '#2563eb' : '#e2e8f0',
                  boxShadow: plan.highlight
                    ? '0 0 0 1px #2563eb, 0 8px 32px rgba(37,99,235,0.1)'
                    : '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: '#2563eb', color: '#fff' }}>
                    Most popular
                  </div>
                )}
                <div className="mb-5">
                  <p className="text-sm font-semibold mb-2" style={{ color: '#0f172a' }}>{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold" style={{ color: '#0f172a' }}>{plan.price}</span>
                    {plan.period && <span className="text-sm" style={{ color: '#94a3b8' }}>{plan.period}</span>}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{plan.desc}</p>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle size={13} className="mt-0.5 shrink-0" style={{ color: '#16a34a' }} />
                      <span className="text-xs" style={{ color: '#475569' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate(plan.name === 'Enterprise' ? '#' : '/onboarding')}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    background: plan.highlight ? '#2563eb' : 'transparent',
                    color: plan.highlight ? '#fff' : '#2563eb',
                    border: plan.highlight ? 'none' : '1px solid #2563eb',
                  }}
                  onMouseEnter={e => { if (plan.highlight) e.currentTarget.style.background = '#1d4ed8' }}
                  onMouseLeave={e => { if (plan.highlight) e.currentTarget.style.background = '#2563eb' }}>
                  {plan.name === 'Enterprise' ? 'Contact sales' : plan.name === 'Starter' ? 'Get started free' : 'Start free trial'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-5 sm:px-8" style={{ background: '#0f172a' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
            className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16">
            <div className="flex-1">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Start finding waste<br />in the next 5 minutes.
              </h2>
              <p className="text-base leading-relaxed" style={{ color: '#475569' }}>
                Connect your cloud accounts with read-only credentials.
                No credit card. Cancel anytime. Most teams identify over $10K in savings their first day.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <button onClick={() => navigate('/onboarding')}
                className="px-7 py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: '#2563eb', color: '#fff' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2563eb' }}>
                Get started for free <ArrowRight size={15} />
              </button>
              <button onClick={() => navigate('/dashboard')}
                className="px-7 py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 border transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}>
                Explore the demo <ChevronRight size={15} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-14 px-5 sm:px-8" style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/favicon.svg" alt="CloudSpire" className="w-6 h-6" />
                <span className="font-bold text-sm" style={{ color: '#0f172a' }}>CloudSpire</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#64748b' }}>
                The FinOps platform for engineering teams who care about cloud costs.
              </p>
            </div>
            {[
              { heading: 'Product', links: ['Dashboard', 'Cost Explorer', 'Anomaly Detection', 'Optimizer', 'Reports'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { heading: 'Legal', links: ['Privacy Policy', 'Terms', 'Security', 'SOC 2'] },
            ].map(col => (
              <div key={col.heading}>
                <p className="text-xs font-semibold mb-4 tracking-widest" style={{ color: '#94a3b8', letterSpacing: '0.1em' }}>
                  {col.heading.toUpperCase()}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm transition-colors hover:text-slate-900" style={{ color: '#64748b' }}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: '#f1f5f9' }}>
            <p className="text-xs" style={{ color: '#94a3b8' }}>© 2026 CloudSpire, Inc. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {[
                { icon: Shield, label: 'SOC 2 Type II' },
                { icon: Clock, label: '99.9% SLA' },
                { icon: CheckCircle, label: 'GDPR Ready' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <Icon size={12} style={{ color: '#cbd5e1' }} />
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

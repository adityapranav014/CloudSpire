import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ArrowRight, X, Upload, ShieldCheck } from 'lucide-react'
import { BrandLogo } from '../constants/brandAssets'

const PROVIDER_META = {
  aws: {
    key: 'aws',
    name: 'Amazon Web Services',
    short: 'AWS',
    color: '#FF9900',
    bg: 'rgba(255,153,0,0.07)',
    border: 'rgba(255,153,0,0.3)',
    desc: 'EC2, RDS, S3, Lambda, and 200+ services',
    fields: [
      { label: 'Access Key ID', placeholder: 'AKIAIOSFODNN7EXAMPLE', type: 'text' },
      { label: 'Secret Access Key', placeholder: 'Your secret key', type: 'password' },
      { label: 'Account alias (optional)', placeholder: 'e.g. production', type: 'text' },
    ],
    connected: { accounts: '4 AWS accounts found', spend: '$82,400/mo detected' },
  },
  gcp: {
    key: 'gcp',
    name: 'Google Cloud Platform',
    short: 'GCP',
    color: '#4285F4',
    bg: 'rgba(66,133,244,0.07)',
    border: 'rgba(66,133,244,0.3)',
    desc: 'Compute Engine, BigQuery, Cloud Run, GKE',
    fields: null,
    connected: { accounts: '4 GCP projects found', spend: '$39,100/mo detected' },
  },
  azure: {
    key: 'azure',
    name: 'Microsoft Azure',
    short: 'Azure',
    color: '#0078D4',
    bg: 'rgba(0,120,212,0.07)',
    border: 'rgba(0,120,212,0.3)',
    desc: 'VMs, Azure SQL, Blob Storage, Functions',
    fields: [
      { label: 'Tenant ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
      { label: 'Client ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
      { label: 'Client Secret', placeholder: 'Your client secret', type: 'password' },
      { label: 'Subscription ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
    ],
    connected: { accounts: '3 Azure subscriptions found', spend: '$27,900/mo detected' },
  },
}

const SYNC_STEPS = [
  'Authenticating with cloud providers',
  'Fetching 90 days of billing history',
  'Normalizing data across providers',
  'Running AI optimization scan',
  'Building your dashboard',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('account')
  const [selectedProviders, setSelectedProviders] = useState([])
  const [connectedProviders, setConnectedProviders] = useState({})
  const [testingProvider, setTestingProvider] = useState(null)
  const [syncProgress, setSyncProgress] = useState(-1)

  // Dynamic step list based on selected providers
  const steps = useMemo(() => [
    'account',
    'providers',
    ...selectedProviders.map(p => `connect-${p}`),
    'sync',
  ], [selectedProviders])

  const currentStepIndex = steps.indexOf(phase)

  const stepLabels = steps.map(s => {
    if (s === 'account') return 'Account'
    if (s === 'providers') return 'Connect'
    if (s.startsWith('connect-')) return PROVIDER_META[s.replace('connect-', '')].short
    return 'Syncing'
  })

  useEffect(() => {
    if (phase === 'sync') {
      setSyncProgress(0)
      let current = 0
      const timer = setInterval(() => {
        current++
        setSyncProgress(current)
        if (current >= SYNC_STEPS.length - 1) {
          clearInterval(timer)
          setTimeout(() => navigate('/dashboard'), 1400)
        }
      }, 900)
      return () => clearInterval(timer)
    }
  }, [phase])

  const goNext = () => {
    const next = steps[currentStepIndex + 1]
    if (next) setPhase(next)
  }

  const goBack = () => {
    const prev = steps[currentStepIndex - 1]
    if (prev) setPhase(prev)
  }

  const toggleProvider = key => {
    setSelectedProviders(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  const handleTestConnection = providerKey => {
    setTestingProvider(providerKey)
    setTimeout(() => {
      setTestingProvider(null)
      setConnectedProviders(p => ({ ...p, [providerKey]: true }))
    }, 1600)
  }

  const Spinner = ({ color = '#2563eb' }) => (
    <span className="w-4 h-4 rounded-full border-2 animate-spin inline-block shrink-0"
      style={{ borderColor: color, borderTopColor: 'transparent' }} />
  )

  const Field = ({ label, placeholder, type = 'text' }) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#475569' }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-all"
        style={{ background: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }}
        onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }}
        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>

      {/* ── Top header ── */}
      <header className="border-b shrink-0" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
        <div className="max-w-lg mx-auto px-5 flex items-center justify-between" style={{ height: 52 }}>
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="CloudSpire" className="w-6 h-6" />
            <span className="font-bold text-sm" style={{ color: '#0f172a' }}>CloudSpire</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs transition-colors hover:text-slate-600"
            style={{ color: '#94a3b8' }}>
            <X size={13} /> Exit setup
          </button>
        </div>
      </header>

      {/* ── Progress bar (top, always visible) ── */}
      <div className="shrink-0 border-b" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
        <div className="max-w-lg mx-auto px-5 py-3.5">
          <div className="flex items-center">
            {stepLabels.map((label, i) => {
              const done = i < currentStepIndex
              const active = i === currentStepIndex
              return (
                <div key={i} className="flex items-center" style={{ flex: i < stepLabels.length - 1 ? 1 : 'none' }}>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300"
                      style={{
                        background: done ? '#16a34a' : active ? '#2563eb' : '#f1f5f9',
                        color: done || active ? '#fff' : '#94a3b8',
                      }}>
                      {done ? <CheckCircle size={11} /> : i + 1}
                    </div>
                    <span className="text-xs font-medium hidden sm:block"
                      style={{ color: active ? '#0f172a' : done ? '#64748b' : '#94a3b8' }}>
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className="flex-1 h-px mx-2.5 transition-all duration-500"
                      style={{ background: done ? '#16a34a' : '#e2e8f0' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-start justify-center px-5 py-10 sm:py-14">
        <div className="w-full max-w-[440px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}>

              {/* ════ STEP: account ════ */}
              {phase === 'account' && (
                <div>
                  <div className="mb-7">
                    <h1 className="text-2xl font-bold mb-2" style={{ color: '#0f172a' }}>
                      Create your workspace
                    </h1>
                    <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                      You'll be up and running in under 5 minutes.
                    </p>
                  </div>

                  <div className="space-y-4 mb-7">
                    <Field label="Your name" placeholder="Alex Johnson" />
                    <Field label="Work email" placeholder="alex@company.com" type="email" />
                    <Field label="Company name" placeholder="Acme Inc." />
                  </div>

                  <button
                    onClick={goNext}
                    className="w-full py-3 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all"
                    style={{ background: '#2563eb', color: '#fff' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2563eb' }}>
                    Continue <ArrowRight size={15} />
                  </button>

                  <p className="text-center mt-5 text-xs" style={{ color: '#94a3b8' }}>
                    Already set up?{' '}
                    <button onClick={() => navigate('/dashboard')}
                      className="font-medium hover:underline" style={{ color: '#2563eb' }}>
                      Go to dashboard
                    </button>
                  </p>
                </div>
              )}

              {/* ════ STEP: providers ════ */}
              {phase === 'providers' && (
                <div>
                  <div className="mb-7">
                    <h1 className="text-2xl font-bold mb-2" style={{ color: '#0f172a' }}>
                      Which clouds do you use?
                    </h1>
                    <p className="text-sm" style={{ color: '#64748b' }}>
                      Select all that apply. You can add more later in Settings.
                    </p>
                  </div>

                  <div className="space-y-2.5 mb-7">
                    {Object.values(PROVIDER_META).map(provider => {
                      const selected = selectedProviders.includes(provider.key)
                      return (
                        <button
                          key={provider.key}
                          onClick={() => toggleProvider(provider.key)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200"
                          style={{
                            borderColor: selected ? provider.color : '#e2e8f0',
                            background: selected ? provider.bg : '#ffffff',
                          }}>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                            style={{ background: '#fff', borderColor: '#e2e8f0' }}>
                            <BrandLogo brandKey={provider.key} size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{provider.name}</p>
                            <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{provider.desc}</p>
                          </div>
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                            style={{
                              borderColor: selected ? provider.color : '#e2e8f0',
                              background: selected ? provider.color : 'transparent',
                            }}>
                            {selected && <CheckCircle size={11} color="#fff" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={goNext}
                    disabled={selectedProviders.length === 0}
                    className="w-full py-3 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: '#2563eb', color: '#fff' }}
                    onMouseEnter={e => { if (selectedProviders.length > 0) e.currentTarget.style.background = '#1d4ed8' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2563eb' }}>
                    Connect{selectedProviders.length > 0 ? ` ${selectedProviders.length} provider${selectedProviders.length > 1 ? 's' : ''}` : ' providers'} <ArrowRight size={15} />
                  </button>

                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button onClick={goBack} className="text-xs hover:underline" style={{ color: '#94a3b8' }}>Back</button>
                    <span style={{ color: '#e2e8f0' }}>|</span>
                    <button onClick={() => navigate('/dashboard')} className="text-xs hover:underline" style={{ color: '#94a3b8' }}>
                      Skip — explore demo
                    </button>
                  </div>
                </div>
              )}

              {/* ════ STEP: connect-{provider} ════ */}
              {phase.startsWith('connect-') && (() => {
                const providerKey = phase.replace('connect-', '')
                const provider = PROVIDER_META[providerKey]
                const isConnected = connectedProviders[providerKey]
                const isTesting = testingProvider === providerKey
                const isLast = selectedProviders.indexOf(providerKey) === selectedProviders.length - 1

                return (
                  <div>
                    <div className="flex items-center gap-3.5 mb-6">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center border-2 shrink-0"
                        style={{ background: provider.bg, borderColor: provider.border }}>
                        <BrandLogo brandKey={provider.key} size={22} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold leading-tight" style={{ color: '#0f172a' }}>
                          Connect {provider.name}
                        </h2>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>
                          {provider.key === 'aws' && 'Read-only IAM access to Cost Explorer API'}
                          {provider.key === 'gcp' && 'Service account with BigQuery billing read access'}
                          {provider.key === 'azure' && 'Azure AD app with Cost Management Reader role'}
                        </p>
                      </div>
                    </div>

                    {/* Fields or file upload */}
                    {provider.fields ? (
                      <div className="space-y-3.5 mb-5">
                        {provider.fields.map(f => (
                          <Field key={f.label} label={f.label} placeholder={f.placeholder} type={f.type} />
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => !isConnected && handleTestConnection(providerKey)}
                        disabled={isTesting || isConnected}
                        className="w-full border-2 border-dashed rounded-xl p-8 text-center mb-5 transition-all"
                        style={{
                          borderColor: isConnected ? '#16a34a' : '#e2e8f0',
                          background: isConnected ? 'rgba(22,163,74,0.04)' : '#ffffff',
                        }}>
                        {isTesting ? (
                          <div className="flex flex-col items-center gap-2.5">
                            <Spinner color={provider.color} />
                            <p className="text-sm" style={{ color: '#64748b' }}>Validating service account…</p>
                          </div>
                        ) : isConnected ? (
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle size={22} style={{ color: '#16a34a' }} />
                            <p className="text-sm font-medium" style={{ color: '#16a34a' }}>Service account connected</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload size={20} style={{ color: '#94a3b8' }} />
                            <p className="text-sm font-medium" style={{ color: '#64748b' }}>Drop service-account.json here</p>
                            <p className="text-xs" style={{ color: '#94a3b8' }}>or click to simulate upload</p>
                          </div>
                        )}
                      </button>
                    )}

                    {/* Connected banner */}
                    <AnimatePresence>
                      {isConnected && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg border mb-5"
                          style={{ background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.2)' }}>
                          <CheckCircle size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>{provider.connected.accounts}</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>{provider.connected.spend}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Read-only note */}
                    <div className="flex items-start gap-2.5 mb-5 px-3.5 py-3 rounded-lg" style={{ background: '#f8fafc' }}>
                      <ShieldCheck size={14} className="shrink-0 mt-0.5" style={{ color: '#94a3b8' }} />
                      <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                        CloudSpire uses <strong>read-only</strong> access. We never write to or modify your cloud infrastructure.
                      </p>
                    </div>

                    {/* Action row */}
                    <div className="flex gap-2.5">
                      <button onClick={goBack}
                        className="px-4 py-2.5 text-sm rounded-lg border transition-colors hover:bg-slate-50"
                        style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                        Back
                      </button>
                      {provider.fields && !isConnected && (
                        <button
                          onClick={() => handleTestConnection(providerKey)}
                          disabled={!!testingProvider}
                          className="px-4 py-2.5 text-sm font-medium rounded-lg border flex items-center justify-center gap-2 transition-colors hover:bg-slate-50 disabled:opacity-40"
                          style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                          {isTesting ? <><Spinner color="#475569" /><span>Testing…</span></> : 'Test connection'}
                        </button>
                      )}
                      <button
                        onClick={() => isLast ? setPhase('sync') : goNext()}
                        disabled={!isConnected}
                        className="flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                        style={{ background: provider.color, color: '#fff' }}>
                        {isLast ? 'Finish setup' : 'Next'} <ArrowRight size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => isLast ? setPhase('sync') : goNext()}
                      className="w-full mt-3 py-1.5 text-xs text-center transition-colors hover:text-slate-700"
                      style={{ color: '#94a3b8' }}>
                      Skip this provider for now
                    </button>
                  </div>
                )
              })()}

              {/* ════ STEP: sync ════ */}
              {phase === 'sync' && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                      style={{ background: '#eff6ff' }}>
                      <motion.svg
                        width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="#2563eb" strokeWidth="2" strokeLinecap="round"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                        <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.5-3.5M20 15a9 9 0 01-15.5 3.5" />
                      </motion.svg>
                    </div>
                    <h2 className="text-xl font-bold mb-1.5" style={{ color: '#0f172a' }}>
                      Setting up your workspace
                    </h2>
                    <p className="text-sm" style={{ color: '#64748b' }}>
                      Pulling in billing data. Takes about 30 seconds.
                    </p>
                  </div>

                  <div className="w-full h-1 rounded-full mb-7 overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <motion.div className="h-full rounded-full" style={{ background: '#2563eb' }}
                      initial={{ width: '0%' }}
                      animate={{ width: syncProgress >= 0 ? `${Math.round(((syncProgress + 1) / SYNC_STEPS.length) * 100)}%` : '0%' }}
                      transition={{ duration: 0.5, ease: 'easeOut' }} />
                  </div>

                  <div className="space-y-3">
                    {SYNC_STEPS.map((s, i) => {
                      const done = i <= syncProgress
                      const active = i === syncProgress + 1
                      return (
                        <motion.div key={s}
                          initial={{ opacity: 0.35 }}
                          animate={{ opacity: done || active ? 1 : 0.35 }}
                          className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                            style={{ background: done ? '#16a34a' : active ? '#eff6ff' : '#f1f5f9' }}>
                            {done
                              ? <CheckCircle size={11} style={{ color: '#fff' }} />
                              : active
                                ? <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#2563eb' }} />
                                : null}
                          </div>
                          <span className="text-sm flex-1" style={{ color: done ? '#0f172a' : '#94a3b8' }}>{s}</span>
                          {done && <span className="text-xs font-medium" style={{ color: '#16a34a' }}>Done</span>}
                        </motion.div>
                      )
                    })}
                  </div>

                  {syncProgress >= SYNC_STEPS.length - 1 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-7">
                      <div className="flex items-center gap-2.5 p-3.5 rounded-lg border mb-4"
                        style={{ background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.2)' }}>
                        <CheckCircle size={15} style={{ color: '#16a34a' }} />
                        <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>
                          Workspace ready! Redirecting…
                        </p>
                      </div>
                      <button onClick={() => navigate('/dashboard')}
                        className="w-full py-3 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all"
                        style={{ background: '#2563eb', color: '#fff' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#2563eb' }}>
                        Open my dashboard <ArrowRight size={15} />
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  )
}

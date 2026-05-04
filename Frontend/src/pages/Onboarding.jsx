import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ArrowRight, X, Upload, ShieldCheck, AlertCircle } from 'lucide-react'
import { BrandLogo } from '../constants/brandAssets'
import api from '../services/api'
import { completeOnboarding } from '../store/slices/authSlice'

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVIDER_META = {
  aws: {
    key: 'aws', name: 'Amazon Web Services', short: 'AWS', color: '#FF9900',
    bg: 'rgba(255,153,0,0.07)', border: 'rgba(255,153,0,0.3)',
    desc: 'EC2, RDS, S3, Lambda, and 200+ services',
    fields: [
      { label: 'Access Key ID', placeholder: 'AKIAIOSFODNN7EXAMPLE', type: 'text' },
      { label: 'Secret Access Key', placeholder: 'Your secret key', type: 'password' },
      { label: 'Account alias (optional)', placeholder: 'e.g. production', type: 'text' },
    ],
    connected: { accounts: '4 AWS accounts found', spend: '$82,400/mo detected' },
  },
  gcp: {
    key: 'gcp', name: 'Google Cloud Platform', short: 'GCP', color: '#4285F4',
    bg: 'rgba(66,133,244,0.07)', border: 'rgba(66,133,244,0.3)',
    desc: 'Compute Engine, BigQuery, Cloud Run, GKE',
    fields: null,
    connected: { accounts: '4 GCP projects found', spend: '$39,100/mo detected' },
  },
  azure: {
    key: 'azure', name: 'Microsoft Azure', short: 'Azure', color: '#0078D4',
    bg: 'rgba(0,120,212,0.07)', border: 'rgba(0,120,212,0.3)',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const Spinner = ({ color = '#2563eb' }) => (
  <span className="w-4 h-4 rounded-full border-2 animate-spin inline-block shrink-0"
    style={{ borderColor: color, borderTopColor: 'transparent' }} />
)

const Field = ({ label, placeholder, type = 'text', value, onChange }) => (
  <div>
    <label className="block text-xs font-medium mb-1.5 text-slate-600">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(label, e.target.value)}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [phase, setPhase] = useState('account')
  const [selectedProviders, setSelectedProviders] = useState([])
  const [connectedProviders, setConnectedProviders] = useState({})
  const [testingProvider, setTestingProvider] = useState(null)
  const [syncProgress, setSyncProgress] = useState(-1)
  const [connectionError, setConnectionError] = useState(null)
  const [formData, setFormData] = useState({})

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

  // Sync phase: animate steps then call completeOnboarding and redirect
  useEffect(() => {
    if (phase !== 'sync') return

    setSyncProgress(0)
    let current = 0

    const timer = setInterval(() => {
      current++
      setSyncProgress(current)
      if (current >= SYNC_STEPS.length - 1) {
        clearInterval(timer)
        // Fire-and-forget: mark onboarding complete on the server
        dispatch(completeOnboarding())
        setTimeout(() => navigate('/dashboard'), 1400)
      }
    }, 900)

    return () => clearInterval(timer)
  }, [phase, dispatch, navigate])

  const goNext = () => {
    const next = steps[currentStepIndex + 1]
    if (next) setPhase(next)
  }

  const goBack = () => {
    const prev = steps[currentStepIndex - 1]
    if (prev) setPhase(prev)
  }

  const toggleProvider = (key) => {
    setSelectedProviders(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  const handleInputChange = (fieldLabel, value) => {
    setFormData(prev => ({ ...prev, [fieldLabel]: value }))
  }

  /**
   * Connects a cloud provider account via the real API.
   * Uses the central api.js instance (includes the Bearer token automatically).
   */
  const handleTestConnection = async (providerKey) => {
    setTestingProvider(providerKey)
    setConnectionError(null)

    try {
      const payload = {
        provider: providerKey,
        name: `${PROVIDER_META[providerKey].short} Environment`,
        accountId: formData['Account alias (optional)'] || `acc-${Date.now()}`,
        credentials: {
          // AWS fields
          accessKey: formData['Access Key ID'],
          secretKey: formData['Secret Access Key'],
          // Azure fields
          tenantId: formData['Tenant ID'],
          clientId: formData['Client ID'],
          clientSecret: formData['Client Secret'],
          subscriptionId: formData['Subscription ID'],
          // GCP (placeholder until real connector ships)
          serviceAccountJson: providerKey === 'gcp' ? 'pending' : undefined,
        },
      }

      await api.post('/cloud/connect', payload)
      setConnectedProviders(p => ({ ...p, [providerKey]: true }))
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Connection failed. Check your credentials.'
      setConnectionError(msg)
    } finally {
      setTestingProvider(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">

      {/* ── Top header ── */}
      <header className="shrink-0 bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <img src="/cloudSpire.svg" alt="CloudSpire" className="h-8 w-auto" />
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-100">
            <X size={13} /> Exit setup
          </button>
        </div>
      </header>

      {/* ── Stepper ── */}
      <div className="shrink-0 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-8">
          <div className="flex items-center gap-0">
            {stepLabels.map((label, i) => {
              const done = i < currentStepIndex
              const active = i === currentStepIndex
              return (
                <div key={i} className={`flex items-center ${i < stepLabels.length - 1 ? 'flex-1' : ''}`}>
                  <div className="flex flex-col items-center relative z-10 shrink-0">
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 shadow-sm"
                      style={{
                        background: done ? '#16a34a' : active ? '#2563eb' : '#f1f5f9',
                        color: done || active ? '#fff' : '#94a3b8',
                        boxShadow: active ? '0 0 0 4px rgba(37,99,235,0.12)' : 'none',
                      }}>
                      {done ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <span className={`absolute top-full mt-2 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors duration-200 ${active ? 'text-slate-900' : done ? 'text-slate-500' : 'text-slate-400'} ${active ? 'block' : 'hidden sm:block'}`}>
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 sm:mx-3 rounded-full transition-all duration-500"
                      style={{ background: done ? '#16a34a' : '#e2e8f0' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-start justify-center px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
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
                      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900">
                        Create your workspace
                      </h1>
                      <p className="text-sm leading-relaxed text-slate-500">
                        You'll be up and running in under 5 minutes.
                      </p>
                    </div>

                    <div className="space-y-4 mb-7">
                      <Field label="Your name" placeholder="Alex Johnson" value={formData['Your name']} onChange={handleInputChange} />
                      <Field label="Work email" placeholder="alex@company.com" type="email" value={formData['Work email']} onChange={handleInputChange} />
                      {/* Company name → sent as companyName to /auth/register → becomes Org.name */}
                      <Field label="Company name" placeholder="Acme Inc." value={formData['Company name']} onChange={handleInputChange} />
                    </div>

                    <button
                      onClick={goNext}
                      className="w-full py-3.5 font-semibold text-sm rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center gap-2 transition-colors shadow-sm">
                      Continue <ArrowRight size={15} />
                    </button>

                    <p className="text-center mt-5 text-xs text-slate-400">
                      Already set up?{' '}
                      <button onClick={() => navigate('/login')}
                        className="font-medium text-blue-600 hover:underline">
                        Log in
                      </button>
                    </p>
                  </div>
                )}

                {/* ════ STEP: providers ════ */}
                {phase === 'providers' && (
                  <div>
                    <div className="mb-6">
                      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900">
                        Which clouds do you use?
                      </h1>
                      <p className="text-sm text-slate-500">
                        Select all that apply. Add more later in Settings.
                      </p>
                    </div>

                    <div className="space-y-3 mb-7">
                      {Object.values(PROVIDER_META).map(provider => {
                        const selected = selectedProviders.includes(provider.key)
                        return (
                          <button
                            key={provider.key}
                            onClick={() => toggleProvider(provider.key)}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-sm"
                            style={{
                              borderColor: selected ? provider.color : '#e2e8f0',
                              background: selected ? provider.bg : '#fafafa',
                            }}>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 bg-white shadow-sm">
                              <BrandLogo brandKey={provider.key} size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900">{provider.name}</p>
                              <p className="text-xs text-slate-400 truncate mt-0.5">{provider.desc}</p>
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
                      className="w-full py-3.5 font-semibold text-sm rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                      Connect{selectedProviders.length > 0 ? ` ${selectedProviders.length} provider${selectedProviders.length > 1 ? 's' : ''}` : ' providers'} <ArrowRight size={15} />
                    </button>

                    <div className="flex items-center justify-center gap-4 mt-4">
                      <button onClick={goBack} className="text-xs text-slate-400 hover:text-slate-600 hover:underline transition-colors">Back</button>
                      <span className="text-slate-200">|</span>
                      <button onClick={() => {
                        dispatch(completeOnboarding())
                        navigate('/dashboard')
                      }} className="text-xs text-slate-400 hover:text-slate-600 hover:underline transition-colors">
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
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 shrink-0 shadow-sm"
                          style={{ background: provider.bg, borderColor: provider.border }}>
                          <BrandLogo brandKey={provider.key} size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold leading-tight text-slate-900">
                            Connect {provider.name}
                          </h2>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {provider.key === 'aws' && 'Read-only IAM access to Cost Explorer API'}
                            {provider.key === 'gcp' && 'Service account with BigQuery billing read access'}
                            {provider.key === 'azure' && 'Azure AD app with Cost Management Reader role'}
                          </p>
                        </div>
                      </div>

                      {provider.fields ? (
                        <div className="space-y-4 mb-5">
                          {provider.fields.map(f => (
                            <Field key={f.label} label={f.label} placeholder={f.placeholder}
                              type={f.type} value={formData[f.label]} onChange={handleInputChange} />
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => !isConnected && handleTestConnection(providerKey)}
                          disabled={isTesting || isConnected}
                          className="w-full border-2 border-dashed rounded-xl p-8 text-center mb-5 transition-all"
                          style={{
                            borderColor: isConnected ? '#16a34a' : '#e2e8f0',
                            background: isConnected ? 'rgba(22,163,74,0.04)' : '#fafafa',
                          }}>
                          {isTesting ? (
                            <div className="flex flex-col items-center gap-2.5">
                              <Spinner color={provider.color} />
                              <p className="text-sm text-slate-500">Validating service account…</p>
                            </div>
                          ) : isConnected ? (
                            <div className="flex flex-col items-center gap-2">
                              <CheckCircle size={24} className="text-green-600" />
                              <p className="text-sm font-medium text-green-600">Service account connected</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload size={22} className="text-slate-400" />
                              <p className="text-sm font-medium text-slate-600">Drop service-account.json here</p>
                              <p className="text-xs text-slate-400">or click to simulate upload</p>
                            </div>
                          )}
                        </button>
                      )}

                      <AnimatePresence>
                        {isConnected && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50 mb-5">
                            <CheckCircle size={16} className="text-green-600 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-green-700">{provider.connected.accounts}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{provider.connected.spend}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {connectionError && (
                        <div className="flex items-start gap-2.5 mb-3 px-3.5 py-3 rounded-xl border border-red-200 bg-red-50">
                          <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
                          <p className="text-xs leading-relaxed text-red-600">{connectionError}</p>
                        </div>
                      )}

                      <div className="flex items-start gap-2.5 mb-5 px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-100">
                        <ShieldCheck size={14} className="shrink-0 mt-0.5 text-slate-400" />
                        <p className="text-xs leading-relaxed text-slate-500">
                          CloudPulse uses <strong className="text-slate-700">read-only</strong> access. We never write to your cloud infrastructure.
                        </p>
                      </div>

                      <div className="flex gap-2.5">
                        <button onClick={goBack}
                          className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                          Back
                        </button>
                        {provider.fields && !isConnected && (
                          <button
                            onClick={() => handleTestConnection(providerKey)}
                            disabled={!!testingProvider}
                            className="px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-40">
                            {isTesting ? <><Spinner color="#475569" /><span>Testing…</span></> : 'Test connection'}
                          </button>
                        )}
                        <button
                          onClick={() => isLast ? setPhase('sync') : goNext()}
                          disabled={!isConnected}
                          className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-35 disabled:cursor-not-allowed text-white shadow-sm"
                          style={{ background: provider.color }}>
                          {isLast ? 'Finish setup' : 'Next'} <ArrowRight size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => isLast ? setPhase('sync') : goNext()}
                        className="w-full mt-3 py-1.5 text-xs text-center text-slate-400 hover:text-slate-600 transition-colors">
                        Skip this provider for now
                      </button>
                    </div>
                  )
                })()}

                {/* ════ STEP: sync ════ */}
                {phase === 'sync' && (
                  <div>
                    <div className="text-center mb-8">
                      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-blue-50">
                        <motion.svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                          stroke="#2563eb" strokeWidth="2" strokeLinecap="round"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                          <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.5-3.5M20 15a9 9 0 01-15.5 3.5" />
                        </motion.svg>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold mb-1.5 text-slate-900">
                        Setting up your workspace
                      </h2>
                      <p className="text-sm text-slate-500">Pulling in billing data. Takes about 30 seconds.</p>
                    </div>

                    <div className="w-full h-1.5 rounded-full mb-7 overflow-hidden bg-slate-100">
                      <motion.div className="h-full rounded-full bg-blue-600"
                        initial={{ width: '0%' }}
                        animate={{ width: syncProgress >= 0 ? `${Math.round(((syncProgress + 1) / SYNC_STEPS.length) * 100)}%` : '0%' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }} />
                    </div>

                    <div className="space-y-3.5">
                      {SYNC_STEPS.map((s, i) => {
                        const done = i <= syncProgress
                        const active = i === syncProgress + 1
                        return (
                          <motion.div key={s}
                            initial={{ opacity: 0.35 }}
                            animate={{ opacity: done || active ? 1 : 0.35 }}
                            className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${done ? 'bg-green-500' : active ? 'bg-blue-50' : 'bg-slate-100'}`}>
                              {done
                                ? <CheckCircle size={12} className="text-white" />
                                : active
                                  ? <div className="w-2 h-2 rounded-full animate-pulse bg-blue-600" />
                                  : null}
                            </div>
                            <span className={`text-sm flex-1 ${done ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
                            {done && <span className="text-xs font-medium text-green-600">Done</span>}
                          </motion.div>
                        )
                      })}
                    </div>

                    {syncProgress >= SYNC_STEPS.length - 1 && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-7">
                        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-green-200 bg-green-50 mb-4">
                          <CheckCircle size={15} className="text-green-600 shrink-0" />
                          <p className="text-sm font-semibold text-green-700">Workspace ready! Redirecting…</p>
                        </div>
                        <button onClick={() => navigate('/dashboard')}
                          className="w-full py-3.5 font-semibold text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors shadow-sm">
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
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ArrowRight, Upload, ShieldCheck, TrendingDown, Users, BarChart3, Zap } from 'lucide-react'
import { BrandLogo } from '../constants/brandAssets'

const STEPS = ['Welcome', 'Connect AWS', 'Connect GCP', 'Connect Azure', 'Syncing Data']
const STEP_SUBTITLES = ['Get started', 'AWS billing access', 'GCP service account', 'Azure AD credentials', 'Fetching data']

const syncSteps = [
  'Authenticating with cloud providers',
  'Fetching 90 days of billing history',
  'Normalizing data across providers',
  'Running optimization scan',
  'Building your dashboard',
]

const features = [
  { icon: BarChart3, text: 'Unified spend dashboard across AWS, GCP & Azure' },
  { icon: Zap, text: 'AI-powered cost optimization recommendations' },
  { icon: TrendingDown, text: 'Real-time anomaly detection with instant alerts' },
  { icon: Users, text: 'Team-level budget allocation and chargeback' },
  { icon: ShieldCheck, text: 'Read-only access — your data is never written to' },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [syncProgress, setSyncProgress] = useState(-1)
  const [connectedProviders, setConnectedProviders] = useState({})
  const [testingProvider, setTestingProvider] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (step === 4) {
      let current = 0
      setSyncProgress(0)
      const timer = setInterval(() => {
        current += 1
        if (current >= syncSteps.length - 1) {
          clearInterval(timer)
          setTimeout(() => navigate('/dashboard'), 1200)
        }
        setSyncProgress(current)
      }, 950)
      return () => clearInterval(timer)
    }
  }, [step])

  const handleTestConnection = (provider) => {
    setTestingProvider(provider)
    setTimeout(() => {
      setTestingProvider(null)
      setConnectedProviders(p => ({ ...p, [provider]: true }))
    }, 1500)
  }

  const Field = ({ label, placeholder, type = 'text' }) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-all"
        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
        onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )

  const ConnectedBanner = ({ accounts, spend }) => (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border mt-4"
      style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' }}
    >
      <CheckCircle size={16} style={{ color: '#10B981', flexShrink: 0 }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: '#10B981' }}>{accounts} connected</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{spend} spend detected</p>
      </div>
    </motion.div>
  )

  const Spinner = () => (
    <span className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
      style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
  )

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'var(--bg-base)' }}>

      {/* Left brand panel — desktop only */}
      <div
        className="hidden lg:flex lg:w-[400px] lg:min-h-screen flex-shrink-0 flex-col px-8 py-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f1e3a 0%, #1a1040 60%, #0d1520 100%)' }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: '#3B82F6' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: '#8B5CF6' }} />

        <div className="flex items-center gap-2.5 mb-12 z-10">
          <img src="/favicon.svg" alt="CloudSpire" className="w-8 h-8" />
          <span className="text-lg font-bold text-white">CloudSpire</span>
        </div>

        <div className="z-10 mb-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Your cloud costs,<br />finally under control.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect AWS, GCP, and Azure in minutes. CloudSpire normalizes your billing data and surfaces savings automatically.
          </p>
        </div>

        <ul className="space-y-3.5 z-10 mb-12">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(59,130,246,0.18)' }}>
                <Icon size={14} style={{ color: '#60A5FA' }} />
              </span>
              <span className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.7)' }}>{text}</span>
            </li>
          ))}
        </ul>

        {step < 4 && (
          <div className="z-10 mt-auto">
            <p className="text-[10px] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
              Setup progress
            </p>
            <div className="space-y-2">
              {STEPS.slice(0, 4).map((label, i) => {
                const done = i < step
                const active = i === step
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all"
                      style={{
                        background: done ? '#10B981' : active ? '#3B82F6' : 'rgba(255,255,255,0.08)',
                        color: done || active ? '#fff' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {done ? <CheckCircle size={13} /> : i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium" style={{ color: active ? '#fff' : done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>
                        {label}
                      </p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{STEP_SUBTITLES[i]}</p>
                    </div>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right content panel */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b lg:hidden"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="CloudSpire" className="w-7 h-7" />
            <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>CloudSpire</span>
          </div>
          {step < 4 && (
            <div className="flex items-center gap-1.5">
              {STEPS.slice(0, 4).map((_, i) => (
                <div key={i} className="rounded-full transition-all"
                  style={{
                    width: i === step ? 18 : 6,
                    height: 6,
                    background: i < step ? '#10B981' : i === step ? '#3B82F6' : 'var(--border-default)',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
              >

                {/* Step 0: Welcome */}
                {step === 0 && (
                  <div>
                    <div className="mb-7">
                      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Welcome to CloudSpire
                      </h1>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Set up takes about 3 minutes. Connect your cloud accounts and we will start pulling in billing data right away.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl border mb-6"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
                      {['aws', 'gcp', 'azure'].map(p => (
                        <div key={p} className="flex-1 flex flex-col items-center gap-2 py-1.5">
                          <BrandLogo brandKey={p} size={22} />
                          <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            {p === 'aws' ? 'Amazon' : p === 'gcp' ? 'Google' : 'Microsoft'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setStep(1)}
                      className="w-full py-3 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 mb-3 transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)', color: '#fff' }}
                    >
                      Get Started <ArrowRight size={15} />
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full py-2.5 text-sm rounded-xl border transition-colors hover:bg-black/5"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
                    >
                      Skip — explore demo
                    </button>
                  </div>
                )}

                {/* Step 1: AWS */}
                {step === 1 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0"
                        style={{ background: 'rgba(255,153,0,0.08)', borderColor: 'rgba(255,153,0,0.2)' }}>
                        <BrandLogo brandKey="aws" size={22} />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>Connect Amazon Web Services</h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Read-only IAM access to Cost Explorer API</p>
                      </div>
                    </div>
                    <div className="space-y-3.5 mb-5">
                      <Field label="AWS Access Key ID" placeholder="AKIAIOSFODNN7EXAMPLE" />
                      <Field label="AWS Secret Access Key" placeholder="Your secret key" type="password" />
                      <Field label="Account alias (optional)" placeholder="e.g. Production" />
                    </div>
                    {connectedProviders.aws && <ConnectedBanner accounts="4 AWS accounts" spend="$82,400" />}
                    <div className="flex gap-2.5 mt-5">
                      <button
                        onClick={() => handleTestConnection('aws')}
                        disabled={!!testingProvider || !!connectedProviders.aws}
                        className="flex-1 py-2.5 text-sm font-medium rounded-xl border flex items-center justify-center gap-2 transition-colors hover:bg-black/5 disabled:opacity-40"
                        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                      >
                        {testingProvider === 'aws' ? <Spinner /> : 'Test connection'}
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        disabled={!connectedProviders.aws}
                        className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-35"
                        style={{ background: '#FF9900', color: '#fff' }}
                      >
                        Continue <ArrowRight size={14} />
                      </button>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="w-full mt-3 py-1.5 text-xs text-center hover:underline" style={{ color: 'var(--text-muted)' }}>
                      Skip to demo
                    </button>
                  </div>
                )}

                {/* Step 2: GCP */}
                {step === 2 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0"
                        style={{ background: 'rgba(66,133,244,0.08)', borderColor: 'rgba(66,133,244,0.2)' }}>
                        <BrandLogo brandKey="gcp" size={22} />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>Connect Google Cloud</h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Service account with BigQuery billing read access</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTestConnection('gcp')}
                      disabled={!!testingProvider || !!connectedProviders.gcp}
                      className="w-full border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-all hover:border-blue-400/50 disabled:opacity-50"
                      style={{ borderColor: 'var(--border-default)' }}
                    >
                      {testingProvider === 'gcp' ? (
                        <div className="flex flex-col items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full border-2 animate-spin block" style={{ borderColor: '#4285F4', borderTopColor: 'transparent' }} />
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Testing connection...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload size={22} style={{ color: 'var(--text-muted)' }} />
                          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Drop service-account.json here</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>or click to simulate a connection test</p>
                        </div>
                      )}
                    </button>
                    {connectedProviders.gcp && <ConnectedBanner accounts="4 GCP projects" spend="$39,100" />}
                    <div className="flex gap-2.5 mt-5">
                      <button onClick={() => setStep(1)}
                        className="px-5 py-2.5 text-sm rounded-xl border transition-colors hover:bg-black/5"
                        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                        Back
                      </button>
                      <button onClick={() => setStep(3)} disabled={!connectedProviders.gcp}
                        className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-35"
                        style={{ background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)', color: '#fff' }}>
                        Continue <ArrowRight size={14} />
                      </button>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="w-full mt-3 py-1.5 text-xs text-center hover:underline" style={{ color: 'var(--text-muted)' }}>
                      Skip to demo
                    </button>
                  </div>
                )}

                {/* Step 3: Azure */}
                {step === 3 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0"
                        style={{ background: 'rgba(0,120,212,0.08)', borderColor: 'rgba(0,120,212,0.2)' }}>
                        <BrandLogo brandKey="azure" size={22} />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>Connect Microsoft Azure</h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Azure AD app with Cost Management Reader role</p>
                      </div>
                    </div>
                    <div className="space-y-3.5 mb-5">
                      <Field label="Tenant ID" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                      <Field label="Client ID" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                      <Field label="Client Secret" placeholder="Your client secret" type="password" />
                      <Field label="Subscription ID" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                    </div>
                    {connectedProviders.azure && <ConnectedBanner accounts="3 Azure subscriptions" spend="$27,900" />}
                    <div className="flex gap-2.5 mt-5">
                      <button onClick={() => setStep(2)}
                        className="px-5 py-2.5 text-sm rounded-xl border transition-colors hover:bg-black/5"
                        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                        Back
                      </button>
                      <button
                        onClick={() => handleTestConnection('azure')}
                        disabled={!!testingProvider || !!connectedProviders.azure}
                        className="px-5 py-2.5 text-sm font-medium rounded-xl border flex items-center justify-center gap-2 transition-colors hover:bg-black/5 disabled:opacity-40"
                        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                      >
                        {testingProvider === 'azure' ? <Spinner /> : 'Test'}
                      </button>
                      <button
                        onClick={() => setStep(4)}
                        disabled={!connectedProviders.azure}
                        className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-35"
                        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)', color: '#fff' }}>
                        Finish setup <ArrowRight size={14} />
                      </button>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="w-full mt-3 py-1.5 text-xs text-center hover:underline" style={{ color: 'var(--text-muted)' }}>
                      Skip to demo
                    </button>
                  </div>
                )}

                {/* Step 4: Syncing */}
                {step === 4 && (
                  <div>
                    <div className="text-center mb-8">
                      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)' }}>
                        <svg className="w-7 h-7 text-white animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.5-3.5M20 15a9 9 0 01-15.5 3.5" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>Syncing your data</h2>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This takes about 30 seconds. Hang tight.</p>
                    </div>

                    <div className="w-full h-1.5 rounded-full mb-7 overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #3B82F6, #06B6D4)' }}
                        initial={{ width: '0%' }}
                        animate={{ width: syncProgress >= 0 ? Math.round(((syncProgress + 1) / syncSteps.length) * 100) + '%' : '0%' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>

                    <div className="space-y-3">
                      {syncSteps.map((s, i) => {
                        const done = i <= syncProgress
                        const active = i === syncProgress + 1
                        return (
                          <motion.div
                            key={s}
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: done || active ? 1 : 0.35 }}
                            className="flex items-center gap-3 py-0.5"
                          >
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: done ? '#10B981' : active ? 'rgba(59,130,246,0.15)' : 'var(--border-subtle)' }}>
                              {done
                                ? <CheckCircle size={13} style={{ color: '#fff' }} />
                                : active
                                  ? <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                  : null}
                            </div>
                            <span className="text-sm flex-1" style={{ color: done ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s}</span>
                            {done && <span className="text-xs font-medium" style={{ color: '#10B981' }}>Done</span>}
                          </motion.div>
                        )
                      })}
                    </div>

                    {syncProgress >= syncSteps.length - 1 && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-7">
                        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl border"
                          style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' }}>
                          <CheckCircle size={16} style={{ color: '#10B981' }} />
                          <p className="text-sm font-semibold" style={{ color: '#10B981' }}>All set! Redirecting to your dashboard...</p>
                        </div>
                        <button onClick={() => navigate('/dashboard')}
                          className="w-full py-3 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)', color: '#fff' }}>
                          Open Dashboard <ArrowRight size={14} />
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

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, CheckCircle, ArrowRight, Upload, Link2 } from 'lucide-react'
import { BrandLogo } from '../constants/brandAssets'

const STEPS = ['Welcome', 'Connect AWS', 'Connect GCP', 'Connect Azure', 'Syncing Data']

const syncSteps = [
  'Authenticating with AWS',
  'Fetching 90 days of billing history',
  'Normalizing service data across providers',
  'Running optimization scan',
  'Building your dashboard',
]

/** Onboarding wizard — standalone page without AppLayout */
export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [syncProgress, setSyncProgress] = useState(-1)
  const [connectedProviders, setConnectedProviders] = useState({})
  const [testingProvider, setTestingProvider] = useState(null)
  const navigate = useNavigate()

  // Auto-advance sync steps
  useEffect(() => {
    if (step === 4 && syncProgress < syncSteps.length - 1) {
      const timer = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= syncSteps.length - 1) {
            clearInterval(timer)
            setTimeout(() => navigate('/dashboard'), 1000)
            return prev
          }
          return prev + 1
        })
      }, 900)
      setSyncProgress(0)
      return () => clearInterval(timer)
    }
  }, [step])

  const startSync = () => {
    setStep(4)
  }

  const handleTestConnection = (provider) => {
    setTestingProvider(provider)
    setTimeout(() => {
      setTestingProvider(null)
      setConnectedProviders(p => ({ ...p, [provider]: true }))
    }, 1500)
  }

  const Input = ({ label, placeholder, type = 'text' }) => (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-colors"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border-default)' }} />
    </div>
  )

  const MockSuccess = ({ provider, accounts, spend }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-4 rounded-xl border mt-4"
      style={{ background: 'color-mix(in srgb, var(--accent-emerald) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--accent-emerald) 25%, transparent)' }}
    >
      <CheckCircle size={20} style={{ color: 'var(--accent-emerald)' }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--accent-emerald)' }}>
          ✓ Connected — {accounts}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{spend} spend detected</p>
      </div>
    </motion.div>
  )

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-grid-pattern"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--accent-blue)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-8 blur-3xl"
          style={{ background: 'var(--accent-violet)' }} />
      </div>

      <div className="w-full max-w-5xl px-4 z-10 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Logo */}
        <div className="hidden lg:block rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-primary)' }}>
              <Cloud size={18} style={{ color: 'var(--bg-base)' }} />
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>CloudSpire</span>
          </div>
          <div className="space-y-3">
            {STEPS.map((item, index) => {
              const active = index === step
              const done = index < step
              return (
                <div key={item} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{
                      background: done ? 'var(--accent-emerald)' : active ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                      color: done || active ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {done ? <CheckCircle size={14} /> : index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{item}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {index === 0 ? 'Intro and demo access' : index === 4 ? 'Final sync and dashboard provisioning' : 'Secure mock provider connection'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
        <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-primary)' }}>
              <Cloud size={18} style={{ color: 'var(--bg-base)' }} />
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>CloudSpire</span>
          </div>
        </div>

        {/* Step progress */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            {STEPS.slice(0, 4).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                    style={{
                      background: i < step ? 'var(--accent-emerald)' : i === step ? 'var(--accent-primary)' : 'var(--border-default)',
                      color: i <= step ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {i < step ? <CheckCircle size={12} /> : i + 1}
                  </div>
                  <span className="text-[11px] hidden sm:block" style={{ color: i === step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {s}
                  </span>
                </div>
                {i < 3 && <div className="w-6 h-px" style={{ background: i < step ? 'var(--accent-emerald)' : 'var(--border-subtle)' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border p-8 shadow-2xl"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'var(--accent-primary)' }}>
                <Cloud size={30} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Your cloud spend, unified.</h1>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                CloudSpire connects to AWS, GCP, and Azure to give you a single pane of glass for all your cloud costs, anomalies, and optimization opportunities.
              </p>
              <div className="flex gap-3 justify-center mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                {['Real-time anomaly detection', 'AI-powered optimization', 'Team cost allocation'].map(f => (
                  <span key={f} className="flex items-center gap-1.5">
                    <CheckCircle size={13} style={{ color: 'var(--accent-emerald)' }} /> {f}
                  </span>
                ))}
              </div>
              <button onClick={() => setStep(1)}
                className="w-full py-3 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors hover:opacity-90"
                style={{ background: 'var(--accent-primary)', color: 'var(--bg-base)' }}>
                Get Started <ArrowRight size={15} />
              </button>
              <button onClick={() => navigate('/dashboard')}
                className="w-full py-2 mt-3 text-sm transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                Skip — view demo
              </button>
            </div>
          )}

          {/* Step 1: AWS */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'rgba(255,153,0,0.25)' }}>
                  <BrandLogo brandKey="aws" size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Connect Amazon Web Services</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Regions: us-east-1, us-west-2, eu-west-1, ap-southeast-1 and 15 more</p>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <Input label="AWS Access Key ID" placeholder="AKIAIOSFODNN7EXAMPLE" />
                <Input label="AWS Secret Access Key" placeholder="••••••••••••••••••••" type="password" />
                <Input label="Account Name (optional)" placeholder="e.g. Production - Main" />
              </div>
              {connectedProviders.aws && <MockSuccess provider="aws" accounts="4 accounts found" spend="$82,400" />}
              <div className="flex flex-col gap-3 mt-5">
                <div className="flex gap-3">
                  <button onClick={() => handleTestConnection('aws')} disabled={testingProvider === 'aws' || connectedProviders.aws}
                    className="flex-1 py-2.5 text-sm font-medium rounded-xl border flex justify-center items-center gap-2 transition-colors hover:bg-[--bg-hover] disabled:opacity-50"
                    style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}>
                    {testingProvider === 'aws' ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'currentcolor', borderTopColor: 'transparent' }} /> : 'Test Connection'}
                  </button>
                  <button onClick={() => setStep(2)} disabled={!connectedProviders.aws}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{ background: 'var(--color-aws)', color: '#fff', opacity: connectedProviders.aws ? 1 : 0.45 }}>
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
                <button onClick={() => navigate('/dashboard')} className="text-xs transition-colors hover:underline text-center" style={{ color: 'var(--text-muted)' }}>Skip to Demo</button>
              </div>
            </div>
          )}

          {/* Step 2: GCP */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'rgba(66,133,244,0.25)' }}>
                  <BrandLogo brandKey="gcp" size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Connect Google Cloud</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Upload a GCP service account JSON with BigQuery billing read access</p>
                </div>
              </div>
              <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Service Account JSON
              </label>
              <button
                onClick={() => handleTestConnection('gcp')} disabled={testingProvider === 'gcp' || connectedProviders.gcp}
                className="w-full border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-colors hover:border-cyan-500/50 disabled:opacity-50"
                style={{ borderColor: 'var(--border-default)' }}
              >
                {testingProvider === 'gcp' ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="block w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-1" style={{ borderColor: 'var(--text-secondary)', borderTopColor: 'transparent' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Uploading & Testing...</p>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Drag & drop service-account.json here</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>or click to browse to test connection</p>
                  </>
                )}
              </button>
              {connectedProviders.gcp && <MockSuccess provider="gcp" accounts="4 projects found" spend="$39,100" />}
              <div className="flex flex-col gap-3 mt-5">
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)}
                    className="px-4 py-2.5 text-sm rounded-xl border transition-colors hover:bg-[--bg-hover]"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                    Back
                  </button>
                  <button onClick={() => setStep(3)} disabled={!connectedProviders.gcp}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{ background: 'var(--color-gcp)', color: '#fff', opacity: connectedProviders.gcp ? 1 : 0.45 }}>
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
                <button onClick={() => navigate('/dashboard')} className="text-xs transition-colors hover:underline text-center" style={{ color: 'var(--text-muted)' }}>Skip to Demo</button>
              </div>
            </div>
          )}

          {/* Step 3: Azure */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'rgba(0,120,212,0.25)' }}>
                  <BrandLogo brandKey="azure" size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Connect Microsoft Azure</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Enter Azure AD credentials with Cost Management Reader access</p>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <Input label="Tenant ID" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                <Input label="Client ID" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                <Input label="Client Secret" placeholder="••••••••••••••••••••" type="password" />
                <Input label="Subscription ID" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </div>
              {connectedProviders.azure && <MockSuccess provider="azure" accounts="3 subscriptions found" spend="$27,900" />}
              <div className="flex flex-col gap-3 mt-5">
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)}
                    className="px-4 py-2.5 text-sm rounded-xl border transition-colors hover:bg-[--bg-hover]"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                    Back
                  </button>
                  <button onClick={() => handleTestConnection('azure')} disabled={testingProvider === 'azure' || connectedProviders.azure}
                    className="py-2.5 px-4 text-sm font-medium rounded-xl border transition-colors flex justify-center items-center hover:bg-[--bg-hover] disabled:opacity-50"
                    style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
                    {testingProvider === 'azure' ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin mx-2" style={{ borderColor: 'currentcolor', borderTopColor: 'transparent' }} /> : 'Test Connection'}
                  </button>
                  <button onClick={startSync} disabled={!connectedProviders.azure}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{ background: 'var(--accent-primary)', color: 'var(--bg-base)', opacity: connectedProviders.azure ? 1 : 0.45 }}>
                    Finish Setup <ArrowRight size={14} />
                  </button>
                </div>
                <button onClick={() => navigate('/dashboard')} className="text-xs transition-colors hover:underline text-center" style={{ color: 'var(--text-muted)' }}>Skip to Demo</button>
              </div>
            </div>
          )}

          {/* Step 4: Syncing */}
          {step === 4 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'var(--accent-primary)' }}>
                <Cloud size={30} style={{ color: 'var(--bg-base)' }} className="animate-pulse" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Syncing Your Data</h2>
              <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
                CloudSpire is fetching and normalizing your cloud billing data...
              </p>
              <div className="space-y-3 text-left">
                {syncSteps.map((s, i) => {
                  const done = i <= syncProgress
                  const current = i === syncProgress + 1
                  return (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: done || current ? 1 : 0.4 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: done ? 'var(--accent-emerald)' : current ? 'var(--accent-primary-subtle)' : 'var(--border-default)',
                        }}>
                        {done && <CheckCircle size={12} className="text-white" />}
                        {!done && current && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                      </div>
                      <span className="text-sm" style={{ color: done ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {s}
                      </span>
                      {done && <span className="ml-auto text-xs" style={{ color: 'var(--accent-emerald)' }}>✓</span>}
                    </motion.div>
                  )
                })}
              </div>
              {syncProgress >= syncSteps.length - 1 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                  <p className="text-sm font-semibold mb-3" style={{ color: 'var(--accent-emerald)' }}>All done! Redirecting to dashboard...</p>
                  <button onClick={() => navigate('/dashboard')}
                    className="w-full py-3 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors hover:opacity-90"
                    style={{ background: 'var(--accent-primary)', color: 'var(--bg-base)' }}>
                    Go to Dashboard <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  )
}

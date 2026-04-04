'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Map, DollarSign, CheckCircle, ChevronRight, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { formatINR } from '@/lib/utils'

const STEPS = ['Your Info', 'Platform', 'Earnings', 'Choose Plan']
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad']
const PLATFORMS = ['ZOMATO', 'SWIGGY', 'ZEPTO', 'AMAZON', 'FLIPKART', 'DUNZO', 'OTHER']
const TIERS = [
  { id: 'BASIC', label: 'Basic', coverage: '30–50%', color: 'border-white/20', desc: 'Essential protection' },
  { id: 'PLUS', label: 'Plus', coverage: '50–70%', color: 'border-brand-500', popular: true, desc: 'Best value' },
  { id: 'MAX', label: 'Max', coverage: '70–90%', color: 'border-white/20', desc: 'Full shield' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quote, setQuote] = useState<any>(null)

  const [form, setForm] = useState({
    name: '', phone: '', city: 'Mumbai', zones: ['Mumbai'],
    platform: 'ZOMATO', weeklyBaseEarning: 4500,
    avgHoursPerDay: 8, workingDaysPerWeek: 6,
    tier: 'PLUS',
  })

  function update(k: string, v: any) { setForm((p) => ({ ...p, [k]: v })) }

  async function fetchQuote(tier: string) {
    try {
      const { data } = await api.post('/pricing/quote', {
        city: form.city, weeklyBaseEarning: form.weeklyBaseEarning,
        avgHoursPerDay: form.avgHoursPerDay, workingDaysPerWeek: form.workingDaysPerWeek,
        platform: form.platform, tier,
      })
      setQuote(data)
    } catch { /* show existing quote */ }
  }

  async function nextStep() {
    if (step === 2) { await fetchQuote(form.tier) }
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else await submit()
  }

  async function submit() {
    setLoading(true); setError('')
    try {
      // 1. Create worker profile
      await api.post('/workers', {
        name: form.name, phone: form.phone, city: form.city,
        zones: [form.city.toLowerCase()], platform: form.platform,
        weeklyBaseEarning: form.weeklyBaseEarning,
        avgHoursPerDay: form.avgHoursPerDay, workingDaysPerWeek: form.workingDaysPerWeek,
      })
      // 2. Create policy
      await api.post('/policies', { tier: form.tier })
      window.location.href = '/worker/dashboard'
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Setup failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? 'bg-gradient-brand text-white' : 'bg-white/10 text-white/40'}`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-16 sm:w-24 transition-all ${i < step ? 'bg-brand-500' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-white/50 text-sm">{STEPS[step]}</div>
        </div>

        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Step 0 – Personal info */}
              {step === 0 && (
                <>
                  <h2 className="text-2xl font-black text-white">Tell us about yourself</h2>
                  <div>
                    <label className="label">Full name</label>
                    <input className="input-field" placeholder="Rahul Kumar" value={form.name} onChange={(e) => update('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Mobile number</label>
                    <input className="input-field" placeholder="+919876543210" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <select className="input-field" value={form.city} onChange={(e) => { update('city', e.target.value); update('zones', [e.target.value.toLowerCase()]) }}>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Step 1 – Platform */}
              {step === 1 && (
                <>
                  <h2 className="text-2xl font-black text-white">Your delivery platform</h2>
                  <p className="text-muted">Which platform do you primarily deliver for?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p} type="button"
                        onClick={() => update('platform', p)}
                        className={`p-4 rounded-xl border text-sm font-semibold transition-all ${form.platform === p ? 'border-brand-500 bg-brand-500/20 text-white' : 'border-white/15 text-white/60 hover:border-white/30'}`}
                      >{p}</button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 2 – Earnings */}
              {step === 2 && (
                <>
                  <h2 className="text-2xl font-black text-white">Your typical earnings</h2>
                  <p className="text-muted">We use this to calculate your coverage band and premium.</p>
                  <div>
                    <label className="label">Expected weekly earnings (₹)</label>
                    <input type="number" className="input-field" min={1000} max={20000}
                      value={form.weeklyBaseEarning} onChange={(e) => update('weeklyBaseEarning', Number(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Hours worked per day</label>
                      <input type="number" className="input-field" min={1} max={18}
                        value={form.avgHoursPerDay} onChange={(e) => update('avgHoursPerDay', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="label">Days per week</label>
                      <input type="number" className="input-field" min={1} max={7}
                        value={form.workingDaysPerWeek} onChange={(e) => update('workingDaysPerWeek', Number(e.target.value))} />
                    </div>
                  </div>
                </>
              )}

              {/* Step 3 – Plan Selection */}
              {step === 3 && (
                <>
                  <h2 className="text-2xl font-black text-white">Choose your plan</h2>
                  {quote && (
                    <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-4">
                      <div className="text-sm text-white/60 mb-1">Your personalised premium for <span className="text-white font-semibold">{form.tier}</span></div>
                      <div className="text-3xl font-black text-white">{formatINR(quote.weeklyPremium)}<span className="text-lg font-normal text-white/50">/week</span></div>
                      <div className="text-xs text-white/40 mt-1">Coverage: {formatINR(quote.minPayout)} – {formatINR(quote.maxPayout)}</div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {TIERS.map((t) => (
                      <button key={t.id} type="button" onClick={() => { update('tier', t.id); fetchQuote(t.id) }}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${form.tier === t.id ? `${t.color} bg-brand-500/10` : 'border-white/10 hover:border-white/25'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {t.label}
                              {t.popular && <span className="badge-info text-xs">Recommended</span>}
                            </div>
                            <div className="text-muted text-sm mt-0.5">{t.desc} · {t.coverage} income covered</div>
                          </div>
                          {form.tier === t.id && <CheckCircle className="w-5 h-5 text-brand-400" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-4 text-danger-400 text-sm bg-danger-500/10 border border-danger-500/20 rounded-lg px-4 py-3">{error}</div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="btn-secondary flex-1">Back</button>
            )}
            <button
              onClick={nextStep}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              id={`onboarding-step-${step}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {step === STEPS.length - 1 ? (loading ? 'Activating…' : 'Activate Coverage') : (
                <span className="flex items-center gap-2">Continue <ChevronRight className="w-4 h-4" /></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

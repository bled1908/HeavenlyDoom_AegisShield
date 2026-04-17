'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, CheckCircle, Loader2, ArrowLeft, Zap, TrendingUp, Lock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatINR } from '@/lib/utils'
import Link from 'next/link'

const TIERS = [
  {
    id: 'BASIC' as const,
    label: 'Basic',
    coverage: '30–50%',
    desc: 'Essential protection for rainy days',
    icon: Shield,
    color: 'border-white/20 hover:border-white/40',
    activeColor: 'border-white/50 bg-white/5',
  },
  {
    id: 'PLUS' as const,
    label: 'Plus',
    coverage: '50–70%',
    desc: 'Best value — most workers choose this',
    icon: Zap,
    color: 'border-brand-500/30 hover:border-brand-500/60',
    activeColor: 'border-brand-500 bg-brand-500/10',
    popular: true,
  },
  {
    id: 'MAX' as const,
    label: 'Max',
    coverage: '70–90%',
    desc: 'Full shield against income loss',
    icon: Lock,
    color: 'border-aegis-500/30 hover:border-aegis-500/60',
    activeColor: 'border-aegis-500 bg-aegis-500/10',
  },
]

export default function PolicyPage() {
  const [selectedTier, setSelectedTier] = useState<'BASIC' | 'PLUS' | 'MAX'>('PLUS')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Fetch worker profile to get earnings for quote
  const { data: worker } = useQuery({
    queryKey: ['worker-profile'],
    queryFn: () => api.get('/workers/me').then((r) => r.data),
  })

  // Fetch pricing quote for selected tier
  const { data: quote, isFetching: quoteLoading, refetch: refetchQuote } = useQuery({
    queryKey: ['pricing-quote', selectedTier],
    queryFn: () =>
      api
        .post('/pricing/quote', {
          city: worker?.city ?? 'Mumbai',
          weeklyBaseEarning: Number(worker?.weeklyBaseEarning ?? 4500),
          avgHoursPerDay: worker?.avgHoursPerDay ?? 8,
          workingDaysPerWeek: worker?.workingDaysPerWeek ?? 6,
          platform: worker?.platform ?? 'OTHER',
          tier: selectedTier,
        })
        .then((r) => r.data),
    enabled: !!worker,
  })

  useEffect(() => {
    if (worker) refetchQuote()
  }, [selectedTier, worker]) // eslint-disable-line

  async function handleActivate() {
    setLoading(true)
    setError('')
    try {
      await api.post('/policies', { tier: selectedTier })
      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/worker/dashboard'
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to activate policy. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-aegis-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-aegis-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Coverage Activated!</h1>
          <p className="text-white/50">Your {selectedTier} plan is now active. Redirecting to dashboard…</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/worker/dashboard"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">Get Covered</h1>
          </div>
          <p className="text-white/50">Choose a weekly plan and activate your income protection instantly.</p>
        </div>

        {/* Worker context */}
        {worker && (
          <motion.div
            className="glass-card p-4 mb-6 flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TrendingUp className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-white font-medium">{worker.name}</span>
              <span className="text-white/40 mx-2">·</span>
              <span className="text-white/60">{worker.platform}</span>
              <span className="text-white/40 mx-2">·</span>
              <span className="text-white/60">{worker.city}</span>
              <span className="text-white/40 mx-2">·</span>
              <span className="text-aegis-400 font-medium">{formatINR(Number(worker.weeklyBaseEarning))}/week base</span>
            </div>
          </motion.div>
        )}

        {/* Tier Selection */}
        <div className="space-y-3 mb-6">
          <AnimatePresence>
            {TIERS.map((tier, i) => {
              const isActive = selectedTier === tier.id
              return (
                <motion.button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`w-full p-5 rounded-2xl border text-left transition-all duration-200 relative
                    ${isActive ? tier.activeColor : `${tier.color} bg-white/3`}`}
                >
                  {tier.popular && (
                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-brand rounded-full text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-gradient-brand' : 'bg-white/10'}`}>
                        <tier.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-base">{tier.label}</div>
                        <div className="text-white/50 text-sm">{tier.desc}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-white font-semibold text-sm">{tier.coverage}</div>
                      <div className="text-white/40 text-xs">income covered</div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Live Quote */}
        <motion.div
          className="glass-card p-6 mb-6 border border-brand-500/20"
          key={selectedTier}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-muted text-sm mb-3">Your personalised quote for <span className="text-white font-semibold">{selectedTier}</span> plan</div>

          {quoteLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
              <span className="text-white/50 text-sm">Calculating premium…</span>
            </div>
          ) : quote ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-3xl font-black text-white">{formatINR(quote.weeklyPremium)}</div>
                <div className="text-xs text-white/40 mt-1">per week</div>
              </div>
              <div>
                <div className="text-xl font-bold text-aegis-500">{formatINR(quote.minPayout)}</div>
                <div className="text-xs text-white/40 mt-1">min payout</div>
              </div>
              <div>
                <div className="text-xl font-bold text-aegis-400">{formatINR(quote.maxPayout)}</div>
                <div className="text-xs text-white/40 mt-1">max payout</div>
              </div>
            </div>
          ) : (
            <div className="text-white/50 text-sm">Login to see your personalised premium</div>
          )}

          {quote?.riskFactors && quote.riskFactors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs text-white/40 mb-2">Risk factors considered</div>
              <div className="flex flex-wrap gap-2">
                {quote.riskFactors.map((f: string) => (
                  <span key={f} className="badge badge-info text-xs">{f}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* What's covered */}
        <div className="glass-card p-5 mb-6">
          <h2 className="text-white font-bold mb-3">What you get</h2>
          <div className="space-y-2">
            {[
              'Automatic trigger when a disruption is detected in your city',
              'Zero paperwork — payout is calculated and sent instantly',
              'AI fraud checks happen in the background, no action needed',
              'Renews automatically each week — cancel any time',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-white/70">
                <CheckCircle className="w-4 h-4 text-aegis-500 flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-danger-400 text-sm bg-danger-500/10 border border-danger-500/20 rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleActivate}
          disabled={loading || !worker}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
          id="activate-policy"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
          {loading ? 'Activating…' : `Activate ${selectedTier} Coverage`}
        </button>

        <p className="text-center text-white/30 text-xs mt-4">
          By activating, you agree to the weekly auto-renewal. Cancel from your dashboard.
        </p>
      </div>
    </div>
  )
}

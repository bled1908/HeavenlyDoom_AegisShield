'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, Zap, TrendingUp, Lock, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  { icon: Zap, title: 'Zero-Touch Claims', desc: 'Parametric triggers fire automatically when disruptions are detected. No forms, no waiting.' },
  { icon: Shield, title: 'AI Fraud Defense', desc: 'Multi-signal fraud engine with GPS verification, behavioral analysis, and graph detection.' },
  { icon: TrendingUp, title: 'Dynamic Pricing', desc: 'Weekly premiums calculated using city risk, seasonality, and your work patterns.' },
  { icon: Lock, title: 'Instant Payouts', desc: 'Approved claims are paid directly to your account within minutes.' },
]

const tiers = [
  { name: 'Basic', premium: '₹120–₹200', coverage: '30–50%', color: 'border-white/20' },
  { name: 'Plus', premium: '₹200–₹320', coverage: '50–70%', color: 'border-brand-500', popular: true },
  { name: 'Max', premium: '₹320–₹480', coverage: '70–90%', color: 'border-white/20' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-brand-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              AegisShield
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
              Login
            </Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">
              Get Protected
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/40 bg-brand-500/10 text-brand-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-slow" />
              Built for DEVTrails 2026
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Your Income,{' '}
              <span className="bg-gradient-to-r from-brand-400 to-aegis-500 bg-clip-text text-transparent">
                Protected
              </span>
              <br />Automatically
            </h1>

            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              When rain stops your deliveries, AegisShield pays you — automatically, 
              instantly, with zero paperwork. AI-powered parametric insurance built 
              for India's gig delivery workers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group">
                Start Coverage Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/insurer/dashboard" className="btn-secondary text-lg px-8 py-4">
                Insurer Dashboard
              </Link>
            </div>
          </motion.div>

          {/* ── Stats ─────────────────────────────────────────── */}
          <motion.div
            className="grid grid-cols-3 gap-6 mt-16 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {[
              { value: '< 5 min', label: 'Average payout time' },
              { value: '₹0', label: 'Claim paperwork' },
              { value: '99%', label: 'Fraud blocked' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-3">
            Built different. Designed to protect.
          </h2>
          <p className="text-white/50 text-center mb-12">Everything traditional insurance doesn't do.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card-hover p-6 flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ─────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-3">Weekly Plans</h2>
          <p className="text-white/50 text-center mb-12">Priced to match how you earn. Cancel anytime.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`glass-card p-6 border ${tier.color} relative ${tier.popular ? 'border-brand-500 shadow-glow' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-brand rounded-full text-xs font-semibold text-white">
                    Most popular
                  </div>
                )}
                <div className="text-lg font-bold text-white mb-1">{tier.name}</div>
                <div className="text-2xl font-black text-white mb-1">{tier.premium}</div>
                <div className="text-sm text-white/50 mb-4">per week</div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 text-aegis-500" />
                  {tier.coverage} of lost income covered
                </div>
                <Link href="/register" className={`mt-6 block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${tier.popular ? 'btn-primary' : 'btn-secondary'}`}>
                  Get {tier.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-brand-400" />
          <span className="font-bold text-white">AegisShield</span>
        </div>
        <p className="text-white/30 text-sm">
          © 2026 HeavenlyDoom – Built for DEVTrails 2026. Build fast. Defend hard. Never go bankrupt.
        </p>
      </footer>
    </main>
  )
}

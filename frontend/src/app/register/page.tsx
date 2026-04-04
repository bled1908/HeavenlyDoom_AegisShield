'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Shield, Eye, EyeOff, Loader2, Check } from 'lucide-react'
import api from '@/lib/api'

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  { label: 'Contains a special character', test: (p: string) => /[!@#$%^&*]/.test(p) },
]

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/register', { email, password, role: 'WORKER' })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      window.location.href = '/worker/onboarding'
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const passStrength = PASSWORD_RULES.filter((r) => r.test(password)).length

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-brand mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Create account</h1>
          <p className="text-white/50 mt-2">Start protecting your weekly income</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field" placeholder="rahul@example.com"
                required autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12" placeholder="Choose a strong password"
                  required autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < passStrength
                        ? passStrength === 1 ? 'bg-danger-500' : passStrength === 2 ? 'bg-warning-500' : 'bg-aegis-500'
                        : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <div className="space-y-1">
                    {PASSWORD_RULES.map((rule) => (
                      <div key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${rule.test(password) ? 'text-aegis-500' : 'text-white/30'}`}>
                        <Check className="w-3 h-3" />
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="text-danger-400 text-sm bg-danger-500/10 border border-danger-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || passStrength < 3}
              className="btn-primary w-full flex items-center justify-center gap-2" id="register-submit">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Creating account…' : 'Create account & start'}
            </button>
          </form>

          <div className="divider" />
          <p className="text-center text-white/50 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

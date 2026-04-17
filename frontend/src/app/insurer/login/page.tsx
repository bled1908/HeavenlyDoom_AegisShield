'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Shield, Eye, EyeOff, Loader2, Building2 } from 'lucide-react'
import api from '@/lib/api'

function decodeJwtRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role ?? null
  } catch {
    return null
  }
}

export default function InsurerLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)

      const role = decodeJwtRole(data.accessToken)
      if (role === 'INSURER' || role === 'ADMIN') {
        window.location.href = '/insurer/dashboard'
      } else {
        setError('This account does not have insurer access. Please use the worker login.')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-aegis-600 to-brand-600 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Insurer Portal</h1>
          <p className="text-white/50 mt-2">Sign in to the AegisShield operations dashboard</p>
        </div>

        <div className="glass-card p-8">
          {/* Insurer badge */}
          <div className="flex items-center gap-2 px-3 py-2 mb-6 rounded-xl bg-aegis-500/10 border border-aegis-500/20">
            <span className="w-2 h-2 rounded-full bg-aegis-500 animate-pulse-slow" />
            <span className="text-aegis-400 text-xs font-medium">Insurer / Admin Access Only</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="insurer-email" className="label">Email address</label>
              <input
                id="insurer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="insurer@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="insurer-password" className="label">Password</label>
              <div className="relative">
                <input
                  id="insurer-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-danger-400 text-sm bg-danger-500/10 border border-danger-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              id="insurer-login-submit"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign in to Dashboard'}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-white/40 text-xs">
            Delivery worker?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
              Sign in here →
            </Link>
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          <Shield className="w-3 h-3 inline mr-1" />
          AegisShield Insurer Operations · Protected access
        </p>
      </div>
    </div>
  )
}

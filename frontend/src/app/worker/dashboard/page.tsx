'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap, LogOut } from 'lucide-react'
import api from '@/lib/api'
import { formatINR, formatDate, getStatusColor } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, sub, color = 'text-brand-400' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted">{label}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <div className="text-muted">{sub}</div>}
    </div>
  )
}

export default function WorkerDashboard() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['worker-profile'],
    queryFn: () => api.get('/workers/me').then((r) => r.data),
  })

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ['my-claims'],
    queryFn: () => api.get('/claims/me').then((r) => r.data),
  })

  const { data: disruptions } = useQuery({
    queryKey: ['disruptions'],
    queryFn: () => api.get('/disruptions').then((r) => r.data),
  })

  const activePolicy = profile?.policies?.[0]
  const recentClaims = claims?.slice(0, 5) ?? []
  const totalProtected = claims
    ?.filter((c: any) => c.status === 'APPROVED')
    ?.reduce((sum: number, c: any) => sum + Number(c.payoutAmount ?? 0), 0) ?? 0

  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="glass-card border-b border-white/10 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">AegisShield</div>
              <div className="text-muted text-xs">Worker Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="text-right hidden sm:block">
                <div className="text-white text-sm font-medium">{profile.name}</div>
                <div className="text-muted text-xs">{profile.platform}</div>
              </div>
            )}
            <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* ── Active Coverage Banner ─────────────────────────── */}
        {activePolicy ? (
          <motion.div
            className="glass-card p-6 border border-aegis-500/30 bg-aegis-500/5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-aegis-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-aegis-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-lg">Coverage Active</span>
                    <span className="badge-success">{activePolicy.tier}</span>
                  </div>
                  <div className="text-muted text-sm mt-0.5">
                    {formatDate(activePolicy.weekStart)} – {formatDate(activePolicy.weekEnd)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{formatINR(activePolicy.maxPayout)}</div>
                <div className="text-muted text-sm">max coverage this week</div>
                <div className="text-xs text-white/30 mt-1">Premium: {formatINR(activePolicy.weeklyPremium)}/week</div>
              </div>
            </div>
          </motion.div>
        ) : !profileLoading && (
          <div className="glass-card p-6 border border-warning-500/30 bg-warning-500/5 flex items-center gap-4">
            <AlertTriangle className="w-10 h-10 text-warning-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-white">No active coverage</div>
              <div className="text-muted text-sm">You're unprotected this week. Get covered now.</div>
            </div>
            <a href="/worker/policy" className="btn-primary text-sm">Get Covered</a>
          </div>
        )}

        {/* ── Stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Total Protected" value={formatINR(totalProtected)} color="text-aegis-500" />
          <StatCard icon={Zap} label="Claims Processed" value={claims?.length ?? 0} />
          <StatCard
            icon={CheckCircle}
            label="Approved Claims"
            value={claims?.filter((c: any) => c.status === 'APPROVED').length ?? 0}
            color="text-aegis-500"
          />
          <StatCard
            icon={Clock}
            label="Pending Review"
            value={claims?.filter((c: any) => ['PENDING', 'ESCALATED'].includes(c.status)).length ?? 0}
            color="text-warning-400"
          />
        </div>

        {/* ── Disruption Alert ───────────────────────────────── */}
        {disruptions && disruptions.length > 0 && (
          <div className="glass-card p-5 border border-brand-500/20">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-400" />
              Active Disruptions
            </h2>
            <div className="space-y-3">
              {disruptions.slice(0, 3).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <div className="text-white text-sm font-medium">{d.title}</div>
                    <div className="text-muted text-xs">{d.zone} · {formatDate(d.startTime)}</div>
                  </div>
                  <span className={`badge ${d.severity === 'CRITICAL' || d.severity === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
                    {d.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Claims ──────────────────────────────────── */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Recent Claims</h2>
          {claimsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : recentClaims.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <Shield className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p>No claims yet. You're well protected!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted border-b border-white/10">
                    <th className="text-left pb-3 font-medium">Disruption</th>
                    <th className="text-right pb-3 font-medium">Lost</th>
                    <th className="text-right pb-3 font-medium">Payout</th>
                    <th className="text-right pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClaims.map((claim: any) => (
                    <tr key={claim.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3">
                        <div className="text-white font-medium">{claim.disruptionEvent?.title ?? 'Disruption'}</div>
                        <div className="text-muted text-xs">{formatDate(claim.createdAt)}</div>
                      </td>
                      <td className="py-3 text-right text-danger-400 font-medium">
                        {formatINR(claim.lostEarning)}
                      </td>
                      <td className="py-3 text-right text-aegis-500 font-medium">
                        {claim.payoutAmount ? formatINR(claim.payoutAmount) : '—'}
                      </td>
                      <td className="py-3 text-right">
                        <span className={getStatusColor(claim.status)}>{claim.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

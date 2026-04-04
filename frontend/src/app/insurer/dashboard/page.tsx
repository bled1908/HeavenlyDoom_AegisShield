'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Shield, TrendingUp, AlertTriangle, Users, DollarSign, Activity, LogOut, Zap } from 'lucide-react'
import api from '@/lib/api'
import { formatINR, formatDate, getStatusColor } from '@/lib/utils'

function KPICard({ icon: Icon, label, value, sub, trend, color = 'text-brand-400' }: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; trend?: string; color?: string
}) {
  return (
    <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-muted text-xs uppercase tracking-wider mb-2">{label}</div>
          <div className="text-3xl font-black text-white">{value}</div>
          {sub && <div className="text-muted text-xs mt-1">{sub}</div>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && <div className="text-xs text-aegis-500 mt-2 font-medium">{trend}</div>}
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-sm border border-white/20">
      <div className="text-muted mb-1">{label}</div>
      <div className="text-white font-bold">{formatINR(payload[0]?.value ?? 0)}</div>
    </div>
  )
}

export default function InsurerDashboard() {
  const { data: kpis } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data),
    refetchInterval: 30_000,
  })

  const { data: zoneRisk } = useQuery({
    queryKey: ['zone-risk'],
    queryFn: () => api.get('/admin/zone-risk').then((r) => r.data),
  })

  const { data: lossTrend } = useQuery({
    queryKey: ['loss-trend'],
    queryFn: () => api.get('/admin/loss-ratio-trend').then((r) => r.data),
  })

  const { data: fraudAlerts } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: () => api.get('/admin/fraud-alerts').then((r) => r.data),
    refetchInterval: 15_000,
  })

  const { data: escapedClaims } = useQuery({
    queryKey: ['escalated-claims'],
    queryFn: () => api.get('/fraud/escalated-claims').then((r) => r.data),
  })

  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="glass-card border-b border-white/10 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">AegisShield</div>
              <div className="text-muted text-xs">Insurer Operations</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-aegis-500/10 border border-aegis-500/20">
              <span className="w-2 h-2 rounded-full bg-aegis-500 animate-pulse-slow" />
              <span className="text-aegis-500 text-xs font-medium">Live monitoring</span>
            </div>
            <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── KPI Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={Users} label="Active Policies" value={kpis?.activePolicies ?? '—'} sub={`${kpis?.totalWorkers ?? 0} workers enrolled`} />
          <KPICard icon={DollarSign} label="Total Protected" value={kpis ? formatINR(kpis.totalPayoutAmount) : '—'} color="text-aegis-500" trend="Completed payouts" />
          <KPICard
            icon={Activity}
            label="Loss Ratio"
            value={kpis ? `${kpis.lossRatio.toFixed(1)}%` : '—'}
            color={kpis?.lossRatio > 70 ? 'text-danger-400' : 'text-warning-400'}
            sub="Payouts / Premiums"
          />
          <KPICard
            icon={AlertTriangle}
            label="Fraud Signals Today"
            value={kpis?.fraudSignalsToday ?? '—'}
            color="text-danger-400"
            sub={`${kpis?.escalatedClaims ?? 0} claims escalated`}
          />
        </div>

        {/* ── Charts Row ────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Payout trend chart */}
          <div className="glass-card p-6">
            <h2 className="section-title mb-1">Payout Trend</h2>
            <p className="text-muted text-sm mb-5">Daily payouts by city (last 30 days)</p>
            {lossTrend && lossTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={lossTrend.slice(-14)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="payout" fill="#246bff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-muted">
                No payout data yet
              </div>
            )}
          </div>

          {/* Zone risk heatmap (bar chart) */}
          <div className="glass-card p-6">
            <h2 className="section-title mb-1">Zone Disruption Risk</h2>
            <p className="text-muted text-sm mb-5">Disruption event count by zone</p>
            {zoneRisk && zoneRisk.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={zoneRisk.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="zone" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} tickLine={false} width={80} />
                  <Tooltip formatter={(v: number) => [`${v} events`, 'Disruptions']} />
                  <Bar dataKey="disruptionCount" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-muted">
                No zone data yet
              </div>
            )}
          </div>
        </div>

        {/* ── Fraud & Escalations Row ───────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Live fraud alerts */}
          <div className="glass-card p-6">
            <h2 className="section-title mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-400" />
              Live Fraud Signals
            </h2>
            <p className="text-muted text-sm mb-4">Refreshes every 15 seconds</p>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {fraudAlerts && fraudAlerts.length > 0 ? fraudAlerts.map((alert: any) => (
                <div key={alert.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'bg-danger-500 animate-pulse' : 'bg-warning-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{alert.worker?.name}</div>
                    <div className="text-muted text-xs">{alert.signalType.replace(/_/g, ' ')} · {alert.worker?.city}</div>
                  </div>
                  <span className={`badge flex-shrink-0 ${alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`}>
                    {alert.severity}
                  </span>
                </div>
              )) : (
                <div className="text-center py-8 text-muted">
                  <Zap className="w-10 h-10 text-white/10 mx-auto mb-2" />
                  No fraud signals detected
                </div>
              )}
            </div>
          </div>

          {/* Escalated claims */}
          <div className="glass-card p-6">
            <h2 className="section-title mb-1">Escalated Claims</h2>
            <p className="text-muted text-sm mb-4">Requires manual review</p>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {escapedClaims && escapedClaims.length > 0 ? escapedClaims.map((claim: any) => (
                <div key={claim.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-white text-sm font-medium">{claim.worker?.name}</div>
                    <span className="badge-danger">ESCALATED</span>
                  </div>
                  <div className="text-muted text-xs">{claim.disruptionEvent?.title}</div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-white/40">{formatDate(claim.createdAt)}</span>
                    <span className="text-danger-400">Fraud score: {Math.round(claim.fraudScore ?? 0)}/100</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted">
                  <Shield className="w-10 h-10 text-white/10 mx-auto mb-2" />
                  No escalated claims
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

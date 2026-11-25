'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Icon from '@/components/Icon'

const PRICE_PER_SUBMISSION = 8
const AUTO_REFRESH_SECONDS = 60

type Submission = {
  id: string
  admin_ref: string | null
  status: string
  approved_at: string | null
}

type Admin = {
  ref_code: string
  name: string
}

// Day keys use the viewer's local time, not UTC
function localKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDayLabel(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null
  const w = 160
  const h = 70
  const pad = 8
  const max = Math.max(...values, 1)
  const pts = values.map((v, i) => ({
    x: values.length === 1 ? w / 2 : pad + (i / (values.length - 1)) * (w - pad * 2),
    y: h - pad - (v / max) * (h - pad * 2),
  }))
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <polyline
        points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#60a5fa" />
      ))}
    </svg>
  )
}

export default function FinancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const busyRef = useRef(false)

  const loadData = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    const supabase = createClient()

    const { data: subsData } = await supabase
      .from('submissions')
      .select('id, admin_ref, status, approved_at')
      .in('status', ['under_review', 'approved', 'posted'])

    const { data: adminsData } = await supabase.from('admins').select('ref_code, name')

    setSubmissions(subsData || [])
    setAdmins(adminsData || [])
    setLastUpdated(Date.now())
    busyRef.current = false
  }, [])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data: me } = await supabase
        .from('admins')
        .select('role')
        .eq('id', user.id)
        .single()

      if (me?.role !== 'main') {
        router.push('/admin/dashboard')
        return
      }
      setIsMainAdmin(true)

      await loadData()
      setLoading(false)
    }
    init()
  }, [router, loadData])

  // Tick once a second so the countdown moves
  useEffect(() => {
    if (!isMainAdmin) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [isMainAdmin])

  const secondsLeft = lastUpdated
    ? Math.min(AUTO_REFRESH_SECONDS, Math.max(0, AUTO_REFRESH_SECONDS - Math.floor((now - lastUpdated) / 1000)))
    : AUTO_REFRESH_SECONDS

  // Auto-refresh when the countdown reaches zero
  useEffect(() => {
    if (isMainAdmin && lastUpdated && secondsLeft === 0) {
      loadData()
    }
  }, [secondsLeft, isMainAdmin, lastUpdated, loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading finance data...</p>
      </div>
    )
  }
  if (!isMainAdmin) return null

  const today = new Date()
  const todayKey = localKey(today)

  // Only approved and posted submissions count as revenue
  const paid = submissions.filter((s) => s.status === 'approved' || s.status === 'posted')
  const pendingReview = submissions.filter((s) => s.status === 'under_review').length

  const totalRevenue = paid.length * PRICE_PER_SUBMISSION
  const todayRevenue =
    paid.filter((s) => s.approved_at && localKey(new Date(s.approved_at)) === todayKey).length *
    PRICE_PER_SUBMISSION
  const monthRevenue =
    paid.filter((s) => {
      if (!s.approved_at) return false
      const d = new Date(s.approved_at)
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
    }).length * PRICE_PER_SUBMISSION
  const pendingValue = pendingReview * PRICE_PER_SUBMISSION

  const perAdmin = admins
    .map((a) => {
      const count = paid.filter((s) => s.admin_ref === a.ref_code).length
      return { key: a.ref_code, name: a.name, earnings: count * PRICE_PER_SUBMISSION }
    })
    .sort((x, y) => y.earnings - x.earnings)

  const directCount = paid.filter((s) => !s.admin_ref).length
  if (directCount > 0) {
    perAdmin.push({ key: '_direct', name: 'Direct', earnings: directCount * PRICE_PER_SUBMISSION })
  }

  const dayMap: Record<string, number> = {}
  paid.forEach((s) => {
    if (!s.approved_at) return
    const key = localKey(new Date(s.approved_at))
    dayMap[key] = (dayMap[key] || 0) + 1
  })
  const dailyHistory = Object.entries(dayMap)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 14)
  const chartValues = dailyHistory
    .slice(0, 7)
    .reverse()
    .map(([, count]) => count * PRICE_PER_SUBMISSION)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto px-3 py-4 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight">Finance</h1>
          <p className="text-sm text-slate-400">Revenue counts once a submission is approved.</p>
        </div>

        {/* Total + refresh */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Icon name="dollar" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Earnings</p>
              <p className="text-4xl font-extrabold leading-none">${totalRevenue}</p>
              <p className="text-xs text-green-300 mt-1">Today: ${todayRevenue}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-50 transition"
            >
              <Icon name="refresh" className="h-4 w-4" />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {lastUpdated && (
              <p className="text-[11px] text-slate-500 mt-2 leading-snug">
                Last updated:
                <br />
                {new Date(lastUpdated).toLocaleTimeString()}
                <br />
                next auto-refresh in {secondsLeft}s
              </p>
            )}
          </div>
        </div>

        {/* Small cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Icon name="clock" className="h-3.5 w-3.5 text-blue-300" /> Today
            </p>
            <p className="text-xl font-extrabold mt-1">${todayRevenue}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Icon name="card" className="h-3.5 w-3.5 text-green-300" /> This Month
            </p>
            <p className="text-xl font-extrabold mt-1">${monthRevenue}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Icon name="eye" className="h-3.5 w-3.5 text-yellow-300" /> Pending Review
            </p>
            <p className="text-xl font-extrabold mt-1">${pendingValue}</p>
          </div>
        </div>

        {/* Earnings by admin */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h2 className="font-extrabold mb-3 flex items-center gap-2">
            <Icon name="users" className="h-5 w-5 text-blue-300" /> Earnings by Admin
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {perAdmin.map((a) => (
              <div key={a.key} className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                <div className="h-9 w-9 mx-auto rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center mb-1.5">
                  {a.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs text-slate-300 truncate">{a.name}</p>
                <p className="font-extrabold">${a.earnings}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue history */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h2 className="font-extrabold mb-3">Recent Revenue History</h2>
          {dailyHistory.length === 0 ? (
            <p className="text-sm text-slate-500">No approved submissions yet.</p>
          ) : (
            <div className="flex gap-4 items-center">
              <div className="flex-1 min-w-0 divide-y divide-slate-800">
                {dailyHistory.slice(0, 5).map(([day, count]) => (
                  <div key={day} className="flex justify-between py-2 text-sm">
                    <span className="text-slate-400">{formatDayLabel(day)}</span>
                    <span className="font-bold">${count * PRICE_PER_SUBMISSION}</span>
                  </div>
                ))}
              </div>
              <div className="w-32 h-20 shrink-0">
                <Sparkline values={chartValues} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const PRICE_PER_SUBMISSION = 8

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

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export default function FinancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()

    const { data: subsData } = await supabase
      .from('submissions')
      .select('id, admin_ref, status, approved_at')
      .in('status', ['approved', 'posted'])

    const { data: adminsData } = await supabase
      .from('admins')
      .select('ref_code, name')

    setSubmissions(subsData || [])
    setAdmins(adminsData || [])
    setLastUpdated(new Date())
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-gray-500">Loading finance data...</p>
      </div>
    )
  }
  if (!isMainAdmin) return null

  const totalRevenue = submissions.length * PRICE_PER_SUBMISSION
  const todayRevenue = submissions.filter(
    (s) => s.approved_at && isToday(s.approved_at)
  ).length * PRICE_PER_SUBMISSION

  const perAdmin = admins.map((a) => {
    const count = submissions.filter((s) => s.admin_ref === a.ref_code).length
    return { name: a.name, refCode: a.ref_code, count, earnings: count * PRICE_PER_SUBMISSION }
  })

  const directCount = submissions.filter((s) => !s.admin_ref).length
  const directEarnings = directCount * PRICE_PER_SUBMISSION

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="bg-blue-950 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <span className="font-bold">Campus Profiles Admin</span>
        </div>
        <a href="/admin/dashboard" className="text-blue-200 hover:text-white text-sm transition">
          Back to Dashboard
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-blue-950">Finance</h1>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">
                Last updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-sm font-semibold px-4 py-2 rounded-full bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-50 transition"
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-3xl font-extrabold text-blue-950">${todayRevenue}</p>
            <p className="text-xs text-gray-500 mt-1">Today's Revenue</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className="text-3xl font-extrabold text-green-700">${totalRevenue}</p>
            <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-lg mb-4">Earnings by Admin</h2>
          <div className="space-y-3">
            {perAdmin.map((a) => (
              <div key={a.refCode} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.count} approved submission{a.count !== 1 ? 's' : ''}</p>
                </div>
                <p className="font-bold text-blue-700">${a.earnings}</p>
              </div>
            ))}
            {directCount > 0 && (
              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <div>
                  <p className="font-semibold">Direct (no admin link)</p>
                  <p className="text-xs text-gray-400">{directCount} approved submission{directCount !== 1 ? 's' : ''}</p>
                </div>
                <p className="font-bold text-blue-700">${directEarnings}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
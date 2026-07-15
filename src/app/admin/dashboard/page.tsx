'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const PRICE_PER_SUBMISSION = 8

type Submission = {
  id: string
  bio: string
  ig_handle: string
  photo_urls: string[]
  payment_screenshot_url: string | null
  admin_ref: string | null
  status: string
  created_at: string
  approved_at: string | null
}

const statusStyles: Record<string, string> = {
  pending_payment: 'bg-gray-100 text-gray-600',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-700',
  posted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(blobUrl)
}

export default function DashboardPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const stats = {
    total: submissions.length,
    underReview: submissions.filter((s) => s.status === 'under_review').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    posted: submissions.filter((s) => s.status === 'posted').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  }

  const myEarnings =
    submissions.filter((s) => s.status === 'approved' || s.status === 'posted').length *
    PRICE_PER_SUBMISSION

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data: adminData } = await supabase
        .from('admins')
        .select('name, role, ref_code')
        .eq('id', user.id)
        .single()

      setAdminName(adminData?.name || '')
      setIsMainAdmin(adminData?.role === 'main')

      let query = supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (adminData?.role !== 'main') {
        query = query.eq('admin_ref', adminData?.ref_code)
      }

      const { data, error } = await query

      if (!error) setSubmissions(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    const updates: { status: string; approved_at?: string } = { status }
    if (status === 'approved') {
      updates.approved_at = new Date().toISOString()
    }
    await supabase.from('submissions').update(updates).eq('id', id)
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    )
  }

  const deleteSubmission = async (id: string, igHandle: string) => {
    if (!confirm(`Permanently delete ${igHandle}'s submission? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('submissions').delete().eq('id', id)
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
  }

  const copyBio = async (id: string, bio: string) => {
    await navigator.clipboard.writeText(bio)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const downloadAllPhotos = async (photoUrls: string[], igHandle: string) => {
    for (let i = 0; i < photoUrls.length; i++) {
      await downloadFile(photoUrls[i], `${igHandle.replace('@', '')}-photo-${i + 1}.jpg`)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Top bar */}
      <div className="bg-blue-950 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <span className="font-bold">Campus Profiles Admin</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {isMainAdmin && (
            <>
              <a href="/admin/finance" className="text-blue-200 hover:text-white transition">
                Finance
              </a>
              <a href="/admin/manage" className="text-blue-200 hover:text-white transition">
                Manage Admins
              </a>
            </>
          )}
          <button onClick={handleLogout} className="text-blue-200 hover:text-white transition">
            Log out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-blue-950 mb-1">Welcome, {adminName}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {isMainAdmin
            ? 'Viewing all submissions across every admin link'
            : 'Viewing submissions from your link only'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-blue-950' },
            { label: 'Under Review', value: stats.underReview, color: 'text-yellow-700' },
            { label: 'Approved', value: stats.approved, color: 'text-blue-700' },
            { label: 'Posted', value: stats.posted, color: 'text-green-700' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Personal earnings — sub-admins only */}
        {!isMainAdmin && (
          <div className="bg-blue-700 text-white rounded-2xl p-6 mb-8 flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">Your Earnings</p>
              <p className="text-sm text-blue-200">From your approved & posted submissions</p>
            </div>
            <p className="text-3xl font-extrabold">${myEarnings}</p>
          </div>
        )}
        {isMainAdmin && <div className="mb-4" />}

        <div className="space-y-4">
          {submissions.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm">
              No submissions yet.
            </div>
          )}

          {submissions.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-lg">{s.ig_handle}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(s.created_at)}
                    {s.admin_ref && ` · via ${s.admin_ref}`}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyles[s.status] || 'bg-gray-100 text-gray-600'}`}
                >
                  {s.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">{s.bio}</p>
                <button
                  onClick={() => copyBio(s.id, s.bio)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                >
                  {copiedId === s.id ? '✓ Copied' : '📋 Copy bio'}
                </button>
              </div>

              <div className="flex gap-2 mb-3 overflow-x-auto">
                {s.photo_urls.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                ))}
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                <button
                  onClick={() => downloadAllPhotos(s.photo_urls, s.ig_handle)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  ⬇️ Download photos
                </button>
                {s.payment_screenshot_url && (
                  <button
                    onClick={() => downloadFile(s.payment_screenshot_url!, `${s.ig_handle.replace('@', '')}-payment.jpg`)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    ⬇️ Download screenshot
                  </button>
                )}
                {s.payment_screenshot_url && (
                  <a
                    href={s.payment_screenshot_url}
                    target="_blank"
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    👁 View screenshot
                  </a>
                )}
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                {s.status === 'under_review' && (
                  <>
                    <button
                      onClick={() => updateStatus(s.id, 'approved')}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(s.id, 'rejected')}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Reject
                    </button>
                  </>
                )}
                {s.status === 'approved' && (
                  <button
                    onClick={() => updateStatus(s.id, 'posted')}
                    className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Mark as Posted
                  </button>
                )}
                {s.status === 'posted' && (
                  <span className="text-sm text-green-700 font-medium">✓ Posted</span>
                )}

                <button
                  onClick={() => deleteSubmission(s.id, s.ig_handle)}
                  className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Submission = {
  id: string
  bio: string
  ig_handle: string
  school_name: string | null
  photo_urls: string[]
  payment_screenshot_url: string | null
  admin_ref: string | null
  status: string
  created_at: string
  is_featured: boolean
}

type Preview = { url: string; name: string } | null

const statusStyles: Record<string, string> = {
  pending_payment: 'bg-gray-100 text-gray-600',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-700',
  posted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const PRICE_PER_SUBMISSION = 8
const MAX_FEATURED = 3

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getExt(url: string) {
  const clean = url.split('?')[0]
  const match = clean.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : 'jpg'
}

async function downloadFile(url: string, filename: string) {
  try {
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
  } catch {
    // If the direct download is blocked, open the image so it can be saved manually
    window.open(url, '_blank')
  }
}

function DownloadIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
    </svg>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [featuredError, setFeaturedError] = useState('')
  const [preview, setPreview] = useState<Preview>(null)

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

  const featuredCount = submissions.filter((s) => s.is_featured).length

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

  const toggleFeatured = async (id: string, current: boolean) => {
    setFeaturedError('')
    if (!current && featuredCount >= MAX_FEATURED) {
      setFeaturedError(`You can only feature up to ${MAX_FEATURED} profiles. Unfeature one first.`)
      return
    }
    const supabase = createClient()
    await supabase.from('submissions').update({ is_featured: !current }).eq('id', id)
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_featured: !current } : s))
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
    const handle = igHandle.replace('@', '')
    for (let i = 0; i < photoUrls.length; i++) {
      await downloadFile(photoUrls[i], `${handle}-photo-${i + 1}.${getExt(photoUrls[i])}`)
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

        {isMainAdmin && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Homepage featured slots: <span className="font-bold text-blue-950">{featuredCount}/{MAX_FEATURED}</span>
            </p>
            {featuredError && <p className="text-xs text-red-600">{featuredError}</p>}
          </div>
        )}

        {/* Personal earnings: sub-admins only */}
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

        <div className="space-y-5">
          {submissions.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm">
              No submissions yet.
            </div>
          )}

          {submissions.map((s) => {
            const handle = s.ig_handle.replace('@', '')
            return (
              <div key={s.id} className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
                {/* Header */}
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="font-bold text-lg break-all">{s.ig_handle}</p>
                    {s.school_name && (
                      <p className="text-sm font-semibold text-blue-700">🏫 {s.school_name}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDate(s.created_at)}
                      {s.admin_ref && ` · via ${s.admin_ref}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyles[s.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                    {s.is_featured && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Bio</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line mb-3">{s.bio}</p>
                  <button
                    onClick={() => copyBio(s.id, s.bio)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                  >
                    {copiedId === s.id ? '✓ Copied' : '📋 Copy bio'}
                  </button>
                </div>

                {/* Photos: all visible in a grid */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Photos ({s.photo_urls.length})
                    </p>
                    {s.photo_urls.length > 1 && (
                      <button
                        onClick={() => downloadAllPhotos(s.photo_urls, s.ig_handle)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                      >
                        ⬇️ Download all
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {s.photo_urls.map((url, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                      >
                        <img
                          src={url}
                          alt=""
                          onClick={() =>
                            setPreview({ url, name: `${handle}-photo-${i + 1}.${getExt(url)}` })
                          }
                          className="w-full h-full object-cover cursor-pointer"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadFile(url, `${handle}-photo-${i + 1}.${getExt(url)}`)
                          }}
                          aria-label={`Download photo ${i + 1}`}
                          className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition"
                        >
                          <DownloadIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment proof */}
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                    Payment proof
                  </p>
                  {s.payment_screenshot_url ? (
                    <div className="flex gap-3 items-start">
                      <div className="relative w-36 sm:w-44 shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                        <img
                          src={s.payment_screenshot_url}
                          alt="Payment screenshot"
                          onClick={() =>
                            setPreview({
                              url: s.payment_screenshot_url!,
                              name: `${handle}-payment.${getExt(s.payment_screenshot_url!)}`,
                            })
                          }
                          className="w-full max-h-56 object-cover object-top cursor-pointer"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadFile(
                              s.payment_screenshot_url!,
                              `${handle}-payment.${getExt(s.payment_screenshot_url!)}`
                            )
                          }}
                          aria-label="Download payment screenshot"
                          className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition"
                        >
                          <DownloadIcon />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() =>
                            setPreview({
                              url: s.payment_screenshot_url!,
                              name: `${handle}-payment.${getExt(s.payment_screenshot_url!)}`,
                            })
                          }
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-left"
                        >
                          👁 View full size
                        </button>
                        <button
                          onClick={() =>
                            downloadFile(
                              s.payment_screenshot_url!,
                              `${handle}-payment.${getExt(s.payment_screenshot_url!)}`
                            )
                          }
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-left"
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No payment screenshot uploaded yet.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap items-center border-t border-gray-100 pt-4">
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
                  {s.status === 'posted' && isMainAdmin && (
                    <button
                      onClick={() => toggleFeatured(s.id, s.is_featured)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        s.is_featured
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {s.is_featured ? '★ Unfeature' : '☆ Feature on homepage'}
                    </button>
                  )}
                  {s.status === 'posted' && !isMainAdmin && (
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
            )
          })}
        </div>
      </div>

      {/* Full-size preview */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 flex flex-col items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <img
            src={preview.url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[78vh] max-w-full rounded-xl object-contain"
          />
          <div className="flex gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => downloadFile(preview.url, preview.name)}
              className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-sm px-5 py-2.5 rounded-full transition"
            >
              ⬇️ Download
            </button>
            <button
              onClick={() => setPreview(null)}
              className="bg-white/15 hover:bg-white/25 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
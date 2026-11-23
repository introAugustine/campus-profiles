'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Submission = {
  id: string
  bio: string
  ig_handle: string
  snapchat_handle?: string | null
  school_name: string | null
  photo_urls: string[]
  payment_screenshot_url: string | null
  admin_ref: string | null
  status: string
  created_at: string
  is_featured: boolean
}

type Preview = { url: string; name: string } | null

const ICONS = {
  download: 'M12 4v11m0 0l-4-4m4 4l4-4M5 20h14',
  copy: 'M8 7h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2zM9 7V5a2 2 0 012-2h2a2 2 0 012 2v2',
  check: 'M5 13l4 4L19 7',
  x: 'M6 18L18 6M6 6l12 12',
  trash:
    'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  external: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  star: 'M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  bookmark: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
  home: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10',
}

type IconName = keyof typeof ICONS

function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[name]} />
    </svg>
  )
}

const statusStyles: Record<string, string> = {
  pending_payment: 'bg-slate-700/60 text-slate-300',
  under_review: 'bg-yellow-500/15 text-yellow-300',
  approved: 'bg-blue-500/15 text-blue-300',
  posted: 'bg-green-500/15 text-green-300',
  rejected: 'bg-red-500/15 text-red-300',
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

export default function DashboardPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [featuredError, setFeaturedError] = useState('')
  const [preview, setPreview] = useState<Preview>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

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

  const statCards: { label: string; value: number; icon: IconName; tone: string }[] = [
    { label: 'Total', value: stats.total, icon: 'layers', tone: 'bg-blue-500/15 text-blue-300' },
    { label: 'Under Review', value: stats.underReview, icon: 'clock', tone: 'bg-yellow-500/15 text-yellow-300' },
    { label: 'Approved', value: stats.approved, icon: 'check', tone: 'bg-sky-500/15 text-sky-300' },
    { label: 'Posted', value: stats.posted, icon: 'bookmark', tone: 'bg-green-500/15 text-green-300' },
    { label: 'Rejected', value: stats.rejected, icon: 'x', tone: 'bg-red-500/15 text-red-300' },
  ]

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
      setFeaturedError(`Max ${MAX_FEATURED} featured. Unfeature one first.`)
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

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">🎓</span>
          <span className="font-bold leading-tight">Campus Profiles Admin</span>
        </div>
        <div className="flex items-center gap-2 text-sm shrink-0">
          {isMainAdmin && (
            <>
              <a
                href="/admin/finance"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-full transition"
              >
                Finance
              </a>
              <a href="/admin/manage" className="text-slate-300 hover:text-white px-2 transition">
                Manage Admins
              </a>
            </>
          )}
          <button onClick={handleLogout} className="text-slate-300 hover:text-white px-2 transition">
            Log out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 py-4 space-y-4">
        {/* Welcome + stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center shrink-0">
              <Icon name="user" className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold leading-tight">Welcome, {adminName}</h1>
              <p className="text-xs text-slate-400">
                {isMainAdmin
                  ? 'Viewing all submissions across every admin link'
                  : 'Viewing submissions from your link only'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {statCards.map((stat, i) => (
              <div
                key={stat.label}
                className={`bg-slate-800/60 rounded-xl p-3 flex items-center gap-3 ${
                  i === statCards.length - 1 ? 'col-span-2 sm:col-span-1' : ''
                }`}
              >
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${stat.tone}`}>
                  <Icon name={stat.icon} />
                </div>
                <div>
                  <p className="text-xl font-extrabold leading-none">{stat.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {isMainAdmin && (
            <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
              <p className="text-sm text-slate-200 flex items-center gap-2">
                <Icon name="home" className="h-4 w-4 text-blue-300" />
                Homepage featured slots:{' '}
                <span className="font-bold">
                  {featuredCount}/{MAX_FEATURED}
                </span>
              </p>
              {featuredError && <p className="text-xs text-red-300">{featuredError}</p>}
            </div>
          )}

          {!isMainAdmin && (
            <div className="mt-3 bg-blue-600 rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-bold">Your Earnings</p>
                <p className="text-xs text-blue-100">From your approved & posted submissions</p>
              </div>
              <p className="text-2xl font-extrabold">${myEarnings}</p>
            </div>
          )}
        </div>

        {/* Submissions */}
        {submissions.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            No submissions yet.
          </div>
        )}

        {submissions.map((s) => {
          const handle = s.ig_handle.replace('@', '')
          const photos = s.photo_urls || []
          const isExpanded = !!expanded[s.id]
          const proofName = s.payment_screenshot_url
            ? `${handle}-payment.${getExt(s.payment_screenshot_url)}`
            : ''

          return (
            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              {/* Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="h-12 w-12 rounded-full bg-blue-500/15 text-blue-300 flex items-center justify-center overflow-hidden shrink-0">
                  {photos[0] ? (
                    <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="user" className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-lg leading-tight break-all">{s.ig_handle}</p>
                  {s.school_name && (
                    <p className="text-sm font-semibold text-blue-400 leading-tight">🏫 {s.school_name}</p>
                  )}
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Icon name="clock" className="h-3 w-3" />
                    {formatDate(s.created_at)}
                    {s.admin_ref && ` • via ${s.admin_ref}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusStyles[s.status] || statusStyles.pending_payment}`}
                  >
                    {s.status.replace('_', ' ')}
                  </span>
                  {s.is_featured && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300">
                      ⭐ Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mt-3 bg-slate-800/60 rounded-xl p-3 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Bio</p>
                  <p
                    className={`text-sm text-slate-200 whitespace-pre-line ${isExpanded ? '' : 'line-clamp-2'}`}
                  >
                    {s.bio}
                  </p>
                  {s.bio.length > 90 && (
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [s.id]: !isExpanded }))}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 mt-1"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => copyText(`${s.id}-bio`, s.bio)}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 transition"
                >
                  <Icon name={copiedKey === `${s.id}-bio` ? 'check' : 'copy'} className="h-3.5 w-3.5" />
                  {copiedKey === `${s.id}-bio` ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Handles */}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-lg shrink-0">
                    📷
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-400">Instagram</p>
                    <a
                      href={`https://instagram.com/${handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-slate-100 hover:text-blue-300 break-all"
                    >
                      @{handle}
                    </a>
                  </div>
                  <button
                    onClick={() => copyText(`${s.id}-ig`, `@${handle}`)}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 transition"
                  >
                    <Icon name={copiedKey === `${s.id}-ig` ? 'check' : 'copy'} className="h-3.5 w-3.5" />
                    {copiedKey === `${s.id}-ig` ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {s.snapchat_handle && (
                  <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-yellow-400 flex items-center justify-center text-lg shrink-0">
                      👻
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-400">Snapchat</p>
                      <p className="text-sm text-slate-100 break-all">{s.snapchat_handle}</p>
                    </div>
                    <button
                      onClick={() => copyText(`${s.id}-snap`, s.snapchat_handle!)}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 transition"
                    >
                      <Icon name={copiedKey === `${s.id}-snap` ? 'check' : 'copy'} className="h-3.5 w-3.5" />
                      {copiedKey === `${s.id}-snap` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>

              {/* Photos */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold">Photos ({photos.length})</p>
                  {photos.length > 1 && (
                    <button
                      onClick={() => downloadAllPhotos(photos, s.ig_handle)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      Download all <Icon name="download" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {photos.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden bg-slate-800"
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
                        className="absolute bottom-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 transition"
                      >
                        <Icon name="download" className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment proof */}
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="text-sm font-bold mb-2">Payment Proof</p>
                {s.payment_screenshot_url ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-28 shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                      <img
                        src={s.payment_screenshot_url}
                        alt="Payment screenshot"
                        onClick={() => setPreview({ url: s.payment_screenshot_url!, name: proofName })}
                        className="w-full h-full object-cover object-top cursor-pointer"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadFile(s.payment_screenshot_url!, proofName)
                        }}
                        aria-label="Download payment screenshot"
                        className="absolute bottom-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 transition"
                      >
                        <Icon name="download" className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => setPreview({ url: s.payment_screenshot_url!, name: proofName })}
                      className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 transition"
                    >
                      <Icon name="external" className="h-4 w-4" />
                      View Full Size
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No payment screenshot uploaded yet.</p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                {s.status === 'under_review' && (
                  <>
                    <button
                      onClick={() => updateStatus(s.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-bold transition"
                    >
                      <Icon name="check" /> Approve
                    </button>
                    <button
                      onClick={() => updateStatus(s.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 py-2.5 rounded-xl text-sm font-bold transition"
                    >
                      <Icon name="x" /> Reject
                    </button>
                  </>
                )}
                {s.status === 'approved' && (
                  <button
                    onClick={() => updateStatus(s.id, 'posted')}
                    className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 py-2.5 rounded-xl text-sm font-bold transition"
                  >
                    <Icon name="bookmark" /> Mark as Posted
                  </button>
                )}
                {s.status === 'posted' && isMainAdmin && (
                  <button
                    onClick={() => toggleFeatured(s.id, s.is_featured)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition ${
                      s.is_featured
                        ? 'bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/25'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <Icon name="star" />
                    {s.is_featured ? 'Unfeature' : 'Feature on homepage'}
                  </button>
                )}
                {s.status === 'posted' && !isMainAdmin && (
                  <div className="flex-1 flex items-center justify-center gap-2 text-green-300 text-sm font-semibold">
                    <Icon name="check" /> Posted
                  </div>
                )}
                {(s.status === 'pending_payment' || s.status === 'rejected') && (
                  <div className="flex-1 flex items-center text-xs text-slate-500">
                    {s.status === 'pending_payment' ? 'Waiting for payment proof' : 'Rejected'}
                  </div>
                )}

                <button
                  onClick={() => deleteSubmission(s.id, s.ig_handle)}
                  className="flex-1 sm:flex-none sm:px-5 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-bold transition"
                >
                  <Icon name="trash" /> Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Full-size preview */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4"
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
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-sm px-5 py-2.5 rounded-full transition"
            >
              <Icon name="download" /> Download
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
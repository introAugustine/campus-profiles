'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Icon, { type IconName } from '@/components/Icon'

type Admin = {
  id: string
  name: string
  email: string
  ref_code: string
  role: string
  status: string
  last_login: string | null
  created_at: string
}

const ONLINE_WINDOW_MS = 15 * 60 * 1000

function isOnline(lastLogin: string | null) {
  if (!lastLogin) return false
  return Date.now() - new Date(lastLogin).getTime() < ONLINE_WINDOW_MS
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const inputClass =
  'block w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function ManageAdminsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [refCode, setRefCode] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const loadAdmins = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('admins').select('*').order('created_at')
    setAdmins(data || [])
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/admin/login')
        return
      }
      setCurrentUserId(user.id)

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

      await loadAdmins()
      setLoading(false)
    }
    init()
  }, [router])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setInviting(true)

    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, refCode, requesterId: currentUserId }),
    })

    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Something went wrong.')
    } else {
      setSuccessMsg(`Invite sent to ${email}`)
      setName('')
      setEmail('')
      setRefCode('')
      await loadAdmins()
    }
    setInviting(false)
  }

  const toggleStatus = async (admin: Admin) => {
    setMenuFor(null)
    const supabase = createClient()
    const newStatus = admin.status === 'active' ? 'suspended' : 'active'
    await supabase.from('admins').update({ status: newStatus }).eq('id', admin.id)
    await loadAdmins()
  }

  const removeAdmin = async (admin: Admin) => {
    setMenuFor(null)
    if (!confirm(`Remove ${admin.name} permanently?`)) return
    const supabase = createClient()
    await supabase.from('admins').delete().eq('id', admin.id)
    await loadAdmins()
  }

  const copyLink = async (admin: Admin) => {
    const link = `${window.location.origin}/apply?ref=${admin.ref_code}`
    await navigator.clipboard.writeText(link)
    setCopiedId(admin.id)
    setTimeout(() => {
      setCopiedId(null)
      setMenuFor(null)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }
  if (!isMainAdmin) return null

  const total = admins.length
  const activeCount = admins.filter((a) => a.status === 'active').length
  const suspendedCount = admins.filter((a) => a.status === 'suspended').length

  const activity: { id: string; icon: IconName; text: string; at: string }[] = admins
    .flatMap((a) => {
      const items: { id: string; icon: IconName; text: string; at: string }[] = []
      if (a.role !== 'main' && a.created_at) {
        items.push({ id: `${a.id}-added`, icon: 'users', text: `${a.name} was added`, at: a.created_at })
      }
      if (a.last_login) {
        items.push({ id: `${a.id}-login`, icon: 'clock', text: `${a.name} logged in`, at: a.last_login })
      }
      return items
    })
    .sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime())
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto px-3 py-4 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight">Manage Admins</h1>
          <p className="text-sm text-slate-400">Invite, suspend and share links with your admins.</p>
        </div>

        {/* Total + invite */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
              <Icon name="users" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-blue-100">Total Admins</p>
              <p className="text-3xl font-extrabold leading-none">{total}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setError('')
              setSuccessMsg('')
              setShowInvite(true)
            }}
            className="bg-white/10 hover:bg-white/20 border border-white/30 font-bold text-sm px-4 py-2.5 rounded-full transition"
          >
            + Invite New Admin
          </button>
        </div>

        {/* Your admins */}
        <section>
          <h2 className="text-lg font-extrabold border-l-4 border-blue-500 pl-3 mb-3">Your Admins</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {admins.map((a) => (
              <div key={a.id} className="relative bg-slate-900 border border-slate-800 rounded-2xl p-3">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-full bg-blue-500/20 text-blue-300 font-bold text-lg flex items-center justify-center shrink-0">
                    {a.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-tight truncate">
                      {a.name}
                      {a.role === 'main' && (
                        <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-semibold align-middle">
                          Main
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 break-all">{a.email}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          a.status === 'active'
                            ? 'bg-green-500/15 text-green-300'
                            : 'bg-yellow-500/15 text-yellow-300'
                        }`}
                      >
                        ● {a.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                      {isOnline(a.last_login) && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">
                          Online now
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      {a.last_login ? `Last login ${formatDate(a.last_login)}` : 'Has not logged in yet'}
                    </p>
                    <p className="text-[11px] text-slate-600 break-all">/apply?ref={a.ref_code}</p>
                  </div>
                  <button
                    onClick={() => setMenuFor(menuFor === a.id ? null : a.id)}
                    aria-label="Admin options"
                    className="h-8 w-8 rounded-lg hover:bg-slate-800 text-slate-300 text-xl leading-none flex items-center justify-center shrink-0"
                  >
                    ⋮
                  </button>
                </div>

                {menuFor === a.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                    <div className="absolute right-2 top-12 z-20 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-1">
                      <button
                        onClick={() => copyLink(a)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-700"
                      >
                        {copiedId === a.id ? '✓ Link copied' : '🔗 Copy link'}
                      </button>
                      {a.role !== 'main' && (
                        <>
                          <button
                            onClick={() => toggleStatus(a)}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-700"
                          >
                            {a.status === 'active' ? '⏸ Suspend' : '▶ Activate'}
                          </button>
                          <button
                            onClick={() => removeAdmin(a)}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-slate-700"
                          >
                            🗑 Remove
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Overview */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h2 className="font-extrabold mb-3">Admin Overview</h2>
          <div className="grid grid-cols-3 divide-x divide-slate-800 text-center">
            <div>
              <p className="text-2xl font-extrabold">{total}</p>
              <p className="text-xs text-slate-400">Total Admins</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-green-300">{activeCount}</p>
              <p className="text-xs text-slate-400">Active</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-yellow-300">{suspendedCount}</p>
              <p className="text-xs text-slate-400">Suspended</p>
            </div>
          </div>
        </section>

        {/* Recent activity */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h2 className="font-extrabold mb-3">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing yet.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-blue-300">
                    <Icon name={item.icon} className="h-4 w-4" />
                  </span>
                  <p className="text-sm flex-1 min-w-0 truncate">{item.text}</p>
                  <p className="text-xs text-slate-500 shrink-0">{formatDate(item.at)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Invite pop-up */}
      {showInvite && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center p-3"
          onClick={() => setShowInvite(false)}
        >
          <form
            onSubmit={handleInvite}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-lg">Invite New Admin</h2>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                aria-label="Close"
                className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
            <input
              type="text"
              placeholder="Unique link code (e.g. kwame)"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              className={inputClass}
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {successMsg && <p className="text-green-400 text-sm">{successMsg}</p>}
            <button
              type="submit"
              disabled={inviting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition"
            >
              {inviting ? 'Sending invite...' : 'Send Invite'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
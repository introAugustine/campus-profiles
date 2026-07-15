'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Admin = {
  id: string
  name: string
  email: string
  ref_code: string
  role: string
  status: string
  last_login: string | null
}

function isRecentlyActive(lastLogin: string | null) {
  if (!lastLogin) return false
  const diffMs = Date.now() - new Date(lastLogin).getTime()
  return diffMs < 15 * 60 * 1000 // 15 minutes
}

export default function ManageAdminsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')

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
    const supabase = createClient()
    const newStatus = admin.status === 'active' ? 'suspended' : 'active'
    await supabase.from('admins').update({ status: newStatus }).eq('id', admin.id)
    await loadAdmins()
  }

  const removeAdmin = async (admin: Admin) => {
    if (!confirm(`Remove ${admin.name} permanently?`)) return
    const supabase = createClient()
    await supabase.from('admins').delete().eq('id', admin.id)
    await loadAdmins()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }
  if (!isMainAdmin) return null

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
        <h1 className="text-2xl font-extrabold text-blue-950 mb-6">Manage Admins</h1>

        <form onSubmit={handleInvite} className="bg-white rounded-2xl shadow-sm p-6 mb-8 space-y-3">
          <h2 className="font-bold text-lg mb-2">Invite New Admin</h2>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Unique link code (e.g. kwame)"
            value={refCode}
            onChange={(e) => setRefCode(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            className="block w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}
          <button
            type="submit"
            disabled={inviting}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50 transition"
          >
            {inviting ? 'Sending invite...' : 'Send Invite'}
          </button>
        </form>

        <div className="space-y-3">
          {admins.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl shadow-sm p-5 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{a.name}</p>
                  {a.role === 'main' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      Main Admin
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isRecentlyActive(a.last_login)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isRecentlyActive(a.last_login) ? '● Active' : '○ Offline'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{a.email}</p>
                <p className="text-xs text-gray-400">
                  Link: /apply?ref={a.ref_code} · Status: {a.status}
                </p>
              </div>
              {a.role !== 'main' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(a)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    {a.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    onClick={() => removeAdmin(a)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
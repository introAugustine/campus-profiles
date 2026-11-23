'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

type Status = 'hidden' | 'ready' | 'enabled' | 'denied'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export default function EnableNotifications() {
  const [status, setStatus] = useState<Status>('hidden')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [justEnabled, setJustEnabled] = useState(false)

  const saveSubscription = useCallback(async (sub: PushSubscription) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    })
    return res.ok
  }, [])

  const refresh = useCallback(async () => {
    const supported =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    if (!supported) return

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setStatus('hidden')
      return
    }

    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    if (Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        // Re-attach this device to whoever is logged in right now
        await saveSubscription(existing)
        setStatus('enabled')
        return
      }
    }

    setStatus('ready')
  }, [saveSubscription])

  useEffect(() => {
    refresh()
    const supabase = createClient()
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refresh()
    })
    return () => listener.subscription.unsubscribe()
  }, [refresh])

  const enable = async () => {
    setBusy(true)
    setMessage('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'ready')
        return
      }

      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) {
        setMessage('Notifications are not set up yet.')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
        }))

      const ok = await saveSubscription(sub)
      if (ok) {
        setStatus('enabled')
        setJustEnabled(true)
        setTimeout(() => setJustEnabled(false), 3000)
      } else {
        setMessage('Could not save. Please try again.')
      }
    } catch {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'hidden') return null

  if (status === 'enabled') {
    if (!justEnabled) return null
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-green-600 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg">
        ✓ Notifications on
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="fixed bottom-4 left-4 right-24 z-50 bg-white text-gray-700 text-xs px-4 py-3 rounded-2xl shadow-lg">
        🔕 Notifications are blocked. Allow them for this app in your phone or browser settings.
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
      {message && (
        <p className="bg-white text-red-600 text-xs px-3 py-2 rounded-xl shadow">{message}</p>
      )}
      <button
        onClick={enable}
        disabled={busy}
        className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-4 py-3 rounded-full shadow-lg disabled:opacity-50 transition"
      >
        {busy ? 'Turning on...' : '🔔 Turn on notifications'}
      </button>
    </div>
  )
}
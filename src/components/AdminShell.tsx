'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Icon, { type IconName } from '@/components/Icon'

const BARE_ROUTES = ['/admin/login', '/admin/set-password']

type Me = { name: string; role: string; status: string }

const mainItems: { href: string; label: string; icon: IconName; mainOnly?: boolean }[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/admin/finance', label: 'Finance', icon: 'card', mainOnly: true },
  { href: '/admin/manage', label: 'Manage Admins', icon: 'users', mainOnly: true },
]

const siteItems: { href: string; label: string; icon: IconName }[] = [
  { href: '/#faq', label: 'FAQs', icon: 'help' },
  { href: '/terms', label: 'Terms', icon: 'document' },
  { href: '/privacy', label: 'Privacy', icon: 'shield' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [checking, setChecking] = useState(true)
  const [open, setOpen] = useState(false)

  const bare = BARE_ROUTES.some((r) => pathname.startsWith(r))

  useEffect(() => {
    if (bare) {
      setMe(null)
      setChecking(false)
      return
    }
    setChecking(true)
    const load = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }
      const { data } = await supabase
        .from('admins')
        .select('name, role, status')
        .eq('id', user.id)
        .single()
      setMe(data)
      setChecking(false)
    }
    load()
  }, [bare, router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // Login and set-password pages have no sidebar
  if (bare) return <>{children}</>

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  if (!me || me.status !== 'active') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <h1 className="text-xl font-extrabold mb-2">
            {me ? 'Account suspended' : 'No admin access'}
          </h1>
          <p className="text-sm text-slate-400 mb-5">
            {me
              ? 'Your admin account is suspended. Contact the main admin to get access back.'
              : "This account doesn't have admin access."}
          </p>
          <button
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl transition"
          >
            Log out
          </button>
        </div>
      </div>
    )
  }

  const isMain = me.role === 'main'
  const visible = mainItems.filter((i) => !i.mainOnly || isMain)

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
      active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <span className="font-bold">Campus Profiles</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
        >
          <Icon name="menu" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pt-6 pb-4 flex items-center justify-between md:block">
          <div>
            <div className="text-4xl mb-2">🎓</div>
            <p className="font-extrabold leading-tight">
              Campus Profiles
              <br />
              <span className="text-blue-400">Admin</span>
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="md:hidden h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
          {visible.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={linkClass(pathname.startsWith(item.href))}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </a>
          ))}

          <p className="px-3 pt-5 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Site
          </p>
          {siteItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="h-9 w-9 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center shrink-0">
              {me.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{me.name}</p>
              <p className="text-xs text-slate-500">{isMain ? 'Main admin' : 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <Icon name="logout" className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
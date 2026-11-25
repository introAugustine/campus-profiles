'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Icon, { type IconName } from '@/components/Icon'

type FeaturedProfile = {
  id: string
  ig_handle: string
  bio: string
  photo_urls: string[]
}

const steps = [
  { title: 'Create Profile' },
  { title: 'Pay $8' },
  { title: 'Get Posted' },
]

const benefits: { icon: IconName; label: string }[] = [
  { icon: 'users', label: 'Join the Community' },
  { icon: 'shield', label: 'Trusted Platform' },
  { icon: 'bolt', label: 'Quick Approval' },
]

const faqs = [
  {
    q: 'What happens after I submit?',
    a: 'Your profile goes into a review queue. Once approved, it gets posted for other students to see.',
  },
  {
    q: 'What does the $8 include?',
    a: 'The $8 covers review and featuring your profile so incoming students can discover you.',
  },
  {
    q: 'How many photos can I upload?',
    a: 'You can upload between 1 and 10 photos.',
  },
  {
    q: 'Can I update my profile after submitting?',
    a: 'Yes, reach out and we can help you make changes before it gets posted.',
  },
  {
    q: 'How long does review take?',
    a: 'Most profiles are reviewed and posted quickly, usually within a day or two.',
  },
  {
    q: 'Is my Instagram handle required?',
    a: "Yes, it's how other students will connect with you once your profile is featured.",
  },
]

function StarIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7L12 17.8 5.8 21.2l1.6-7L2 9.5l7.1-.6L12 2z" />
    </svg>
  )
}

export default function HomePage() {
  const [featured, setFeatured] = useState<FeaturedProfile[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAllFaqs, setShowAllFaqs] = useState(false)

  useEffect(() => {
    const loadFeatured = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('submissions')
        .select('id, ig_handle, bio, photo_urls')
        .eq('is_featured', true)
        .eq('status', 'posted')
        .order('created_at', { ascending: false })

      setFeatured(data || [])
    }
    loadFeatured()
  }, [])

  const visibleFaqs = showAllFaqs ? faqs : faqs.slice(0, 3)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="relative bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-lg">
            Campus <span className="text-blue-400">Profiles</span>
          </span>
        </a>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Menu"
          className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
        >
          <Icon name={menuOpen ? 'x' : 'menu'} />
        </button>

        {menuOpen && (
          <nav className="absolute right-3 top-full mt-2 z-40 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-2">
            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl hover:bg-slate-800 text-sm font-semibold"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl hover:bg-slate-800 text-sm font-semibold"
            >
              FAQ
            </a>
            <a
              href="/apply"
              className="block px-3 py-2.5 rounded-xl bg-yellow-400 text-blue-950 text-sm font-bold text-center mt-1"
            >
              Get Featured
            </a>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-5 pt-8 pb-12 rounded-b-[2.5rem]">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-400/10" />
        <div className="absolute right-10 bottom-0 h-32 w-32 rounded-full bg-blue-300/10" />
        <div className="relative max-w-xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-3">
            Get Discovered by Your <span className="text-yellow-400">Incoming</span> Class.
          </h1>
          <p className="text-blue-100 mb-6 max-w-sm">
            Create your profile, connect with future classmates, and get noticed before the semester begins.
          </p>
          <a
            href="/apply"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold px-6 py-3 rounded-full transition"
          >
            Get Featured <Icon name="arrowRight" />
          </a>
        </div>
      </section>

      {/* Featured Students */}
      {featured.length > 0 && (
        <section id="featured" className="px-4 pt-7 max-w-xl mx-auto">
          <h2 className="text-xl font-extrabold border-l-4 border-blue-500 pl-3 mb-3">Featured Students</h2>
          <div className="grid grid-cols-3 gap-2">
            {featured.map((profile) => (
              <div
                key={profile.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-2 text-center"
              >
                <div className="h-14 w-14 mx-auto rounded-full overflow-hidden bg-slate-800 flex items-center justify-center mb-1.5">
                  {profile.photo_urls?.[0] ? (
                    <img src={profile.photo_urls[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="user" className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <p className="text-xs font-bold truncate">{profile.ig_handle}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">{profile.bio}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how-it-works" className="px-4 pt-7 max-w-xl mx-auto scroll-mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-extrabold border-l-4 border-blue-500 pl-3">How It Works</h2>
          <span className="text-sm text-blue-300 font-semibold">Simple. Fast. Easy.</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start justify-between">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center text-center w-20">
                <div className="h-10 w-10 rounded-full bg-blue-600 font-bold flex items-center justify-center mb-2">
                  {i + 1}
                </div>
                <p className="text-sm font-bold leading-tight">{step.title}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 flex justify-center pt-2.5 text-slate-600">
                  <Icon name="arrowRight" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-3 divide-x divide-slate-800">
          {benefits.map((b) => (
            <div key={b.label} className="p-3 flex flex-col items-center text-center gap-1.5">
              <span className="text-blue-300">
                <Icon name={b.icon} className="h-6 w-6" />
              </span>
              <p className="text-xs font-semibold leading-tight">{b.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 pt-7 max-w-xl mx-auto scroll-mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-extrabold border-l-4 border-blue-500 pl-3">FAQ</h2>
          <button
            onClick={() => setShowAllFaqs((v) => !v)}
            className="text-sm text-blue-300 hover:text-blue-200 font-semibold flex items-center gap-1"
          >
            {showAllFaqs ? 'Show less' : 'View All FAQs'}
            {!showAllFaqs && <Icon name="arrowRight" className="h-4 w-4" />}
          </button>
        </div>
        <div className="space-y-2">
          {visibleFaqs.map((item) => (
            <details key={item.q} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 group">
              <summary className="font-semibold text-sm cursor-pointer list-none flex justify-between items-center gap-3">
                {item.q}
                <span className="text-blue-300 group-open:rotate-180 transition-transform shrink-0">
                  <Icon name="chevronDown" className="h-4 w-4" />
                </span>
              </summary>
              <p className="text-slate-400 text-sm mt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer (extra bottom padding so the sticky button never covers it) */}
      <footer className="px-4 pt-7 pb-28 max-w-xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 text-center">
          <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 text-sm text-slate-300">
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <span className="text-slate-700">|</span>
            <a href="/terms" className="hover:text-white">Terms</a>
            <span className="text-slate-700">|</span>
            <a href="/refund" className="hover:text-white">Refunds</a>
            <span className="text-slate-700">|</span>
            <a href="/admin/login" className="hover:text-white">Admin Login</a>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            © {new Date().getFullYear()} Campus Profiles. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Sticky CTA: delete this whole block if you don't want it */}
      <div className="fixed bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur border-t border-slate-800 px-4 py-3 z-30">
        <a
          href="/apply"
          className="flex items-center justify-center gap-2 max-w-xl mx-auto bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold py-3.5 rounded-full transition"
        >
          <StarIcon /> Get Featured Today
        </a>
      </div>
    </div>
  )
}
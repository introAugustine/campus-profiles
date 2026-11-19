'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type FeaturedProfile = {
  id: string
  ig_handle: string
  bio: string
  photo_urls: string[]
}

const steps = [
  { title: 'Create Profile', desc: 'Add your school, bio, Instagram, and photos.' },
  { title: 'Make Payment', desc: 'Pay $8 and upload proof of payment.' },
  { title: 'Get Posted', desc: 'Your profile goes live for everyone to see.' },
]

const benefits = [
  { emoji: '🎓', title: 'Student Focused', desc: 'Made for incoming students' },
  { emoji: '⚡', title: 'Fast Review', desc: 'Posted quickly after review' },
  { emoji: '📱', title: 'Real Reach', desc: 'Seen by students on Instagram' },
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

export default function HomePage() {
  const [featured, setFeatured] = useState<FeaturedProfile[]>([])

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

  return (
    <div>
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center gap-2">
        <span className="text-2xl">🎓</span>
        <span className="font-bold text-xl text-blue-700">Campus Profiles</span>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-700 to-blue-950 text-white px-6 py-12 text-center">
        <p className="uppercase tracking-widest text-xs text-blue-200 mb-3">
          Meet your future classmates before you arrive
        </p>
        <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4 max-w-2xl mx-auto">
          Get Discovered by Your Incoming Class
        </h1>
        <p className="text-blue-100 max-w-xl mx-auto mb-6">
          Create your profile, connect with future classmates, and get noticed before the semester even starts.
        </p>
        <a
          href="/apply"
          className="inline-block bg-yellow-400 text-blue-950 font-bold px-8 py-3 rounded-xl text-lg hover:bg-yellow-300 transition"
        >
          Get Featured
        </a>
      </section>

      {/* Recently Featured: swipe sideways */}
      {featured.length > 0 && (
        <section className="py-10">
          <div className="max-w-md mx-auto px-6 mb-4">
            <h2 className="text-2xl font-extrabold text-center">🔥 Recently Featured</h2>
            <p className="text-gray-500 text-sm text-center mt-1">
              Real students already discovered by their incoming class
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-6 pb-2 max-w-md mx-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.map((profile) => (
              <div
                key={profile.id}
                className="snap-start shrink-0 w-64 bg-white rounded-2xl shadow-sm p-4 flex gap-3 items-start"
              >
                {profile.photo_urls?.[0] && (
                  <img
                    src={profile.photo_urls[0]}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{profile.ig_handle}</p>
                  <p className="text-xs text-gray-600 line-clamp-3">{profile.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How it works + benefits */}
      <section className="px-6 py-10 bg-blue-50">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold text-center mb-6">How It Works</h2>
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
            {steps.map((step, i) => (
              <div key={step.title} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="font-bold">{step.title}</p>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs uppercase tracking-widest text-gray-500 text-center mt-8 mb-3">
            Why submit your profile
          </p>
          <div className="grid grid-cols-3 gap-3">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl shadow-sm p-3 text-center">
                <div className="text-2xl mb-1">{b.emoji}</div>
                <p className="font-bold text-sm">{b.title}</p>
                <p className="text-xs text-gray-500 mt-1">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-10">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 group">
                <summary className="font-semibold text-sm cursor-pointer list-none flex justify-between items-center gap-3">
                  {item.q}
                  <span className="text-blue-700 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="text-gray-600 text-sm mt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer (extra bottom padding so the sticky button never covers it) */}
      <footer className="text-center pt-4 pb-28 text-sm text-gray-400 space-x-4">
        <a href="/privacy" className="hover:text-gray-600 transition">Privacy</a>
        <a href="/terms" className="hover:text-gray-600 transition">Terms</a>
        <a href="/refund" className="hover:text-gray-600 transition">Refunds</a>
        <a href="/admin/login" className="hover:text-gray-600 transition">Admin Login</a>
      </footer>

      {/* Sticky CTA: delete this whole block if you don't want it */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t px-4 py-3 z-50">
        <a
          href="/apply"
          className="block max-w-md mx-auto text-center bg-yellow-400 text-blue-950 font-bold py-3 rounded-xl hover:bg-yellow-300 transition"
        >
          Get Featured
        </a>
      </div>
    </div>
  )
}
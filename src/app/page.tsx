export default function HomePage() {
  return (
    <div>
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center gap-2">
        <span className="text-2xl">🎓</span>
        <span className="font-bold text-xl text-blue-700">Campus Profiles</span>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-700 to-blue-950 text-white px-6 py-20 text-center">
        <p className="uppercase tracking-widest text-sm text-blue-200 mb-4">
          Meet your future classmates before you arrive
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6 max-w-2xl mx-auto">
          Get Discovered by Your Incoming Class
        </h1>
        <p className="text-blue-100 max-w-xl mx-auto mb-8">
          Create your profile, connect with future classmates, and get noticed before the semester even starts.
        </p>
        <a
          href="/apply"
          className="inline-block bg-yellow-400 text-blue-950 font-bold px-8 py-4 rounded-xl text-lg hover:bg-yellow-300 transition"
        >
          Get Featured
        </a>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-md mx-auto">
        <h2 className="text-3xl font-extrabold text-center mb-10">How It Works</h2>
        <div className="space-y-6">
          {[
            { emoji: '✍️', title: 'Create Profile', desc: 'Add your bio, Instagram, and photos.' },
            { emoji: '📸', title: 'Make Payment', desc: 'Pay $8 and upload proof of payment.' },
            { emoji: '🤝', title: 'Get Posted', desc: 'Your profile goes live for everyone to see.' },
          ].map((step) => (
            <div key={step.title} className="bg-white border rounded-2xl p-8 text-center shadow-sm">
              <div className="text-4xl mb-4">{step.emoji}</div>
              <h3 className="font-bold text-xl mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="px-6 py-16 max-w-md mx-auto bg-blue-50">
        <h2 className="text-3xl font-extrabold text-center mb-10">Why Submit Your Profile?</h2>
        <div className="space-y-6">
          {[
            { emoji: '🎓', title: 'Student Focused', desc: 'Built specifically for incoming students to get known before arriving.' },
            { emoji: '⚡', title: 'Fast Review', desc: 'Profiles are reviewed and posted quickly after submission.' },
            { emoji: '📱', title: 'Real Reach', desc: 'Get your profile seen by other students on Instagram.' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="font-bold text-lg mb-1">{item.emoji} {item.title}</p>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 max-w-md mx-auto">
        <h2 className="text-3xl font-extrabold text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
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
              a: 'Yes — it\'s how other students will connect with you once your profile is featured.',
            },
          ].map((item) => (
            <details key={item.q} className="bg-white rounded-2xl shadow-sm p-5 group">
              <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
                {item.q}
                <span className="text-blue-700 group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="text-gray-600 text-sm mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400 space-x-4">
        <a href="/privacy" className="hover:text-gray-600 transition">Privacy</a>
        <a href="/terms" className="hover:text-gray-600 transition">Terms</a>
        <a href="/refund" className="hover:text-gray-600 transition">Refunds</a>
        <a href="/admin/login" className="hover:text-gray-600 transition">Admin Login</a>
      </footer>
    </div>
  )
}
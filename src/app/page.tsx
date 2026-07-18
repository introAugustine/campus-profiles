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
          The easiest way to meet your incoming class
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6 max-w-2xl mx-auto">
          Get Featured to the Incoming Class
        </h1>
        <p className="text-blue-100 max-w-xl mx-auto mb-8">
          Submit your photos, bio, and Instagram — get discovered by fellow students before the semester even starts.
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

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400">
        <a href="/admin/login" className="hover:text-gray-600 transition">
          Admin Login
        </a>
      </footer>
    </div>
  )
}
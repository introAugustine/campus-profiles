import PublicHeader from '@/components/PublicHeader'

export default function LegalPage({
  title,
  paragraphs,
}: {
  title: string
  paragraphs: string[]
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-3 py-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h1 className="text-2xl font-extrabold mb-4">{title}</h1>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            {paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
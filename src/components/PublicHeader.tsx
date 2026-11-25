import Icon from '@/components/Icon'

export default function PublicHeader() {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      <a href="/" className="flex items-center gap-2">
        <span className="text-2xl">🎓</span>
        <span className="font-bold leading-tight text-white">
          Campus
          <br />
          Profiles
        </span>
      </a>
      <a
        href="/"
        aria-label="Home"
        className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition"
      >
        <Icon name="home" />
      </a>
    </header>
  )
}
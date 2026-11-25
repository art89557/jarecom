// Kerangka halaman setelah login: menu samping (desktop), menu bawah (ponsel), dan area isi.
import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../state'
import { Logo } from './ui'
import Tour from './Tour'

// Menu utama. `tour` = penanda untuk tur panduan (atribut data-tour); `icon` = gambar SVG.
const items = [
  { to: '/beranda', tour: 'nav-beranda', label: 'Beranda', icon: <path d="M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10" /> },
  { to: '/materi', tour: 'nav-materi', label: 'Materi', icon: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7" /> },
  { to: '/kuis', tour: 'nav-kuis', label: 'Kuis', icon: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></> },
  { to: '/progres', tour: 'nav-progres', label: 'Progres', icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> }
]

// Menu ponsel sama dengan menu utama ditambah Profil (di desktop Profil ada di bawah menu samping).
const mobileItems = [...items, { to: '/profil', tour: 'nav-profil', label: 'Profil', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> }]

// Judul tab browser per alamat. Urutan penting: pola yang lebih spesifik ditaruh lebih dulu.
const TITLES: [RegExp, string][] = [
  [/^\/beranda/, 'Beranda'], [/^\/materi\/\d+\/selesai/, 'Materi selesai'], [/^\/materi\/\d+/, 'Materi'], [/^\/materi/, 'Peta level'],
  [/^\/kuis\/\d+\/hasil/, 'Hasil kuis'], [/^\/kuis\/\d+/, 'Soal kuis'], [/^\/kuis/, 'Daftar kuis'],
  [/^\/progres\/lencana/, 'Progres: lencana'], [/^\/progres\/riwayat/, 'Progres: riwayat XP'], [/^\/progres/, 'Progres'],
  [/^\/bantuan/, 'Bantuan'], [/^\/profil/, 'Profil dan pengaturan']
]

/** Pembungkus ikon SVG seragam untuk menu. */
const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

/** Kerangka halaman terlindungi. Halaman yang cocok dengan rute tampil di <Outlet />. */
export default function Shell() {
  const { user, signOut, tour } = useApp()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)
  // Judul halaman berubah per layar; setelah pindah layar fokus ke isi halaman (WCAG 2.4.2, 2.4.3).
  useEffect(() => {
    const t = TITLES.find(([re]) => re.test(pathname))?.[1]
    document.title = t ? `${t} · Jar’ecom` : 'Jar’ecom'
    if (first.current) { first.current = false; return }
    main.current?.focus({ preventScroll: true })
  }, [pathname])
  // Gaya tautan menu: biru saat aktif.
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-bg')
  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px]">
      <a href="#isi" onClick={(e) => { e.preventDefault(); main.current?.focus() }} className="sr-only z-[60] rounded-xl bg-white px-4 py-3 font-semibold text-primary focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Lewati ke isi halaman</a>
      <aside aria-label="Menu samping" className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-2 border-r border-line bg-white p-4 md:flex">
        <div className="px-2 py-3"><Logo size={40} /></div>
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} data-tour={i.tour} className={(s) => `flex min-h-[48px] items-center gap-3 rounded-xl px-3 font-semibold ${cls(s)}`}>
            <Icon>{i.icon}</Icon>{i.label}
          </NavLink>
        ))}
        <div className="flex-1" />
        <button onClick={() => nav('/profil')} data-tour="nav-profil" className="flex min-h-[52px] items-center gap-3 rounded-xl px-3 text-left hover:bg-bg">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{user?.name.charAt(0).toUpperCase()}</span>
          <span className="truncate text-sm font-semibold">{user?.name}</span>
        </button>
        <button onClick={async () => { await signOut(); nav('/masuk') }} className="min-h-[44px] rounded-xl px-3 text-left text-sm font-medium text-ink-soft hover:bg-bg">Keluar</button>
      </aside>
      <main id="isi" ref={main} tabIndex={-1} className="min-w-0 flex-1 px-5 pb-28 pt-8 outline-none md:px-10 md:pb-10">
        <Outlet />
      </main>
      <nav aria-label="Menu utama" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {mobileItems.map((i) => (
          <NavLink key={i.to} to={i.to} data-tour={i.tour} className={(s) => `flex min-h-[64px] flex-1 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${s.isActive ? 'text-primary' : 'text-ink-soft'}`}>
            <Icon>{i.icon}</Icon>{i.label}
          </NavLink>
        ))}
      </nav>
      {tour && <Tour />}
    </div>
  )
}

// Kerangka halaman setelah login: menu samping (desktop), menu bawah (ponsel), dan area isi.
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../state'
import { LevelPill, Logo, XpBadge } from './ui'
import { Icon as Ic } from './icons'
import { levelLabel } from '../lib/engine'
import Tour from './Tour'

// Menu utama. `tour` = penanda untuk tur panduan (atribut data-tour); `icon` = gambar SVG.
const items = [
  { to: '/beranda', tour: 'nav-beranda', label: 'Beranda', icon: <path d="M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10" /> },
  { to: '/materi', tour: 'nav-materi', label: 'Materi', icon: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7" /> },
  { to: '/kuis', tour: 'nav-kuis', label: 'Kuis', icon: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></> },
  { to: '/lab', tour: 'nav-lab', label: 'Lab', icon: <><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M12 7.5v5M12 12.5 6.5 17M12 12.5l5.5 4.5" /></> },
  { to: '/simulasi', tour: 'nav-simulasi', label: 'Simulasi', icon: <path d="M3 4h18v12H3zM8 20h8M12 16v4M10 7.5l4.5 2.5-4.5 2.5z" /> },
  { to: '/progres', tour: 'nav-progres', label: 'Progres', icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
  { to: '/kredit', tour: 'nav-kredit', label: 'Kredit', icon: <path d="M16 21v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /> }
]

// Menu ponsel sama dengan menu utama ditambah Profil, tanpa Kredit (dibuka dari Profil) dan tanpa Simulasi (tab di halaman Lab). Di desktop Profil ada di bawah menu samping.
const mobileItems = [...items.filter((i) => i.to !== '/kredit' && i.to !== '/simulasi'), { to: '/profil', tour: 'nav-profil', label: 'Profil', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> }]

// Judul tab browser per alamat. Urutan penting: pola yang lebih spesifik ditaruh lebih dulu.
const TITLES: [RegExp, string][] = [
  [/^\/beranda/, 'Beranda'], [/^\/materi\/\d+\/selesai/, 'Materi selesai'], [/^\/materi\/\d+/, 'Materi'], [/^\/materi/, 'Materi'],
  [/^\/kuis\/\d+\/hasil/, 'Hasil kuis'], [/^\/kuis\/\d+/, 'Soal kuis'], [/^\/kuis/, 'Kuis'],
  [/^\/progres\/lencana/, 'Progres: lencana'], [/^\/progres\/riwayat/, 'Progres: riwayat XP'], [/^\/progres/, 'Progres'],
  [/^\/lab\/\d+/, 'Misi lab'], [/^\/lab/, 'Lab'], [/^\/simulasi/, 'Simulasi'], [/^\/kredit/, 'Kredit'], [/^\/bantuan/, 'Bantuan'], [/^\/profil/, 'Profil']
]

/** Pembungkus ikon SVG seragam untuk menu. */
const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

/** Kerangka halaman terlindungi. Halaman yang cocok dengan rute tampil di <Outlet />. */
export default function Shell() {
  const { user, signOut, tour, progress } = useApp()
  const [stuck, setStuck] = useState(false) // judul besar halaman sudah tergulir di bawah bar atas
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
  // Bar atas: tampilkan judul kecil setelah judul besar (h1) halaman tergulir di bawah bar.
  useEffect(() => {
    // Halaman tanpa judul besar yang terlihat (h1 sr-only): judul selalu tampil di bar.
    const on = () => { const h = main.current?.querySelector<HTMLElement>('h1:not(.sr-only)'); setStuck(h ? h.getBoundingClientRect().bottom < 64 : true) }
    on(); addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on)
  }, [pathname])
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? ''
  const wide = /^\/lab\/\d+/.test(pathname) // area kerja lab butuh layar lebar
  // Gaya tautan menu: biru saat aktif.
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-bg')
  return (
    <div className="flex min-h-screen">
      <a href="#isi" onClick={(e) => { e.preventDefault(); main.current?.focus() }} className="sr-only z-[60] rounded-xl bg-white px-4 py-3 font-semibold text-primary focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Lewati ke isi halaman</a>
      <aside aria-label="Menu samping" className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-1.5 border-r border-line bg-white px-4 pb-5 pt-6 md:flex lg:w-[280px] lg:px-5">
        <div className="mb-4 px-3 py-2"><Logo size={40} /></div>
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} data-tour={i.tour} className={(s) => `flex min-h-[52px] items-center gap-3.5 rounded-xl px-4 text-[17px] font-semibold ${cls(s)}`}>
            <Icon>{i.icon}</Icon>{i.label}
          </NavLink>
        ))}
        <div className="flex-1" />
        <button onClick={() => nav('/profil')} data-tour="nav-profil" className="flex min-h-[56px] items-center gap-3 rounded-xl px-4 text-left hover:bg-bg">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{user?.name.charAt(0).toUpperCase()}</span>
          <span className="truncate text-sm font-semibold">{user?.name}</span>
        </button>
        <button onClick={async () => { await signOut(); nav('/masuk') }} className="min-h-[44px] rounded-xl px-4 text-left text-[15px] font-medium text-ink-soft hover:bg-bg">Keluar</button>
      </aside>
      <main id="isi" ref={main} tabIndex={-1} className="min-w-0 flex-1 px-5 pb-28 pt-8 outline-none md:px-10 md:pb-10">
        <div className={`sticky top-0 z-30 -mx-5 -mt-8 mb-3 flex min-h-[60px] items-center border-b px-5 transition-colors md:-mx-10 md:px-10 ${stuck ? 'border-line bg-bg/95 backdrop-blur' : 'border-transparent bg-bg'}`}>
          <div className={`mx-auto flex w-full items-center gap-3 ${wide ? 'max-w-[1180px]' : 'max-w-5xl'}`}>
            <span aria-hidden={!stuck} className={`min-w-0 flex-1 truncate font-display text-[20px] font-bold transition-opacity md:text-[22px] ${stuck ? 'opacity-100' : 'opacity-0'}`}>{title}</span>
            <div className="flex shrink-0 gap-2" aria-label="Ringkasan belajar" data-tour="bar">
              <XpBadge><Ic name="zap" size={16} sw={2.2} fill="#F5B301" className="mr-1.5" />{progress.xp} XP</XpBadge>
              <LevelPill><Ic name="award" size={16} sw={2.2} className="mr-1.5" />Level {levelLabel(progress)}</LevelPill>
            </div>
          </div>
        </div>
        <div className={`mx-auto w-full ${wide ? 'max-w-[1180px]' : 'max-w-5xl'}`}><Outlet /></div>
      </main>
      <nav aria-label="Menu utama" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {mobileItems.map((i) => (
          <NavLink key={i.to} to={i.to} data-tour={i.tour} className={(s) => `flex min-h-[64px] flex-1 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${s.isActive || (i.to === '/lab' && pathname.startsWith('/simulasi')) ? 'text-primary' : 'text-ink-soft'}`}>
            <Icon>{i.icon}</Icon>{i.label}
          </NavLink>
        ))}
      </nav>
      {tour && <Tour />}
    </div>
  )
}

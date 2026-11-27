// Kerangka halaman setelah login: menu samping (desktop), menu bawah (ponsel), dan area isi.
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../state'
import { LevelPill, Logo, Netty, XpBadge } from './ui'
import { Icon as Ic, type IconName } from './icons'
import { levelLabel } from '../lib/engine'
import Tour from './Tour'

// Menu utama. `tour` = penanda untuk tur panduan (atribut data-tour); `icon` = gambar SVG.
const items = [
  { to: '/beranda', tour: 'nav-beranda', label: 'Beranda', icon: <path d="M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10" /> },
  { to: '/materi', tour: 'nav-materi', label: 'Materi', icon: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7" /> },
  { to: '/kuis', tour: 'nav-kuis', label: 'Kuis', icon: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></> },
  { to: '/lab', tour: 'nav-lab', label: 'Lab', icon: <><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M12 7.5v5M12 12.5 6.5 17M12 12.5l5.5 4.5" /></> },
  { to: '/progres', tour: 'nav-progres', label: 'Progres', icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> }
]

// Menu ponsel sama persis dengan menu samping: 5 ikon. Simulasi adalah tab di dalam Lab; Profil, Bantuan, dan Kredit ada di menu akun (avatar kanan atas).

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

/** Menu akun di kanan atas: tombol avatar membuka Profil, Bantuan, Kredit, dan Keluar. Tutup dengan Escape atau klik di luar. */
function AccountMenu({ name, level, xp, onSignOut }: { name: string; level: string | number; xp: number; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  useEffect(() => {
    if (!open) return
    const out = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', out); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc) }
  }, [open])
  const go = (to: string) => { setOpen(false); nav(to) }
  const rows: [IconName, string, string][] = [['user', 'Profil', '/profil'], ['help', 'Bantuan', '/bantuan'], ['users', 'Kredit', '/kredit']]
  return (
    <div ref={box} className="relative shrink-0">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" aria-label={`Menu akun ${name}`} data-tour="nav-profil"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-display text-base font-bold text-white transition hover:shadow-[0_0_0_4px_#E8EEFF]">{name.charAt(0).toUpperCase()}</button>
      {open && (
        <div role="menu" className="pop absolute right-0 top-[52px] z-40 flex w-[240px] flex-col rounded-2xl border border-line bg-white p-2 shadow-[0_12px_32px_rgba(15,27,45,.14)]">
          <div className="mb-1.5 border-b border-line px-3 pb-3 pt-2"><div className="truncate font-bold">{name}</div><div className="help">Level {level} · {xp} XP</div></div>
          {rows.map(([ic, t, to]) => (
            <button key={to} type="button" role="menuitem" onClick={() => go(to)} className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-left text-[15px] font-semibold hover:bg-bg"><Ic name={ic} size={20} />{t}</button>
          ))}
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onSignOut() }} className="mt-1 flex min-h-[44px] items-center gap-3 rounded-xl border-t border-line px-3 pt-1 text-left text-[15px] font-semibold text-fail hover:bg-fail-soft"><Ic name="logout" size={20} />Keluar</button>
        </div>
      )}
    </div>
  )
}

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
  const on = (to: string, isActive: boolean) => isActive || (to === '/lab' && pathname.startsWith('/simulasi')) // Lab juga aktif di tab Simulasi
  const cls = (to: string) => ({ isActive }: { isActive: boolean }) => (on(to, isActive) ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-bg')
  return (
    <div className="flex min-h-screen">
      <a href="#isi" onClick={(e) => { e.preventDefault(); main.current?.focus() }} className="sr-only z-[60] rounded-xl bg-white px-4 py-3 font-semibold text-primary focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Lewati ke isi halaman</a>
      <aside aria-label="Menu samping" className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-1.5 border-r border-line bg-white px-4 pb-5 pt-6 md:flex lg:w-[280px] lg:px-5">
        <div className="mb-4 px-3 py-2"><Logo size={40} /></div>
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} data-tour={i.tour} className={(s) => `flex min-h-[52px] items-center gap-3.5 rounded-xl px-4 text-[17px] font-semibold ${cls(i.to)(s)}`}>
            <Icon>{i.icon}</Icon>{i.label}
          </NavLink>
        ))}
        <div className="flex-1" />
        <div className="flex justify-center pb-2"><Netty pose="halo" size={72} lines={[`Halo, ${user?.name.split(' ')[0] ?? 'teman'}!`, 'Aku temani belajar ya.', 'Jangan lupa istirahat sebentar.']} side="atas" /></div>
      </aside>
      <main id="isi" ref={main} tabIndex={-1} className="min-w-0 flex-1 px-5 pb-28 pt-8 outline-none md:px-10 md:pb-10">
        <div className={`sticky top-0 z-30 -mx-5 -mt-8 mb-3 flex min-h-[60px] items-center border-b px-5 transition-colors md:-mx-10 md:px-10 ${stuck ? 'border-line bg-bg/95 backdrop-blur' : 'border-transparent bg-bg'}`}>
          <div className={`mx-auto flex w-full items-center gap-3 ${wide ? 'max-w-[1180px]' : 'max-w-5xl'}`}>
            <span aria-hidden={!stuck} className={`min-w-0 flex-1 truncate font-display text-[20px] font-bold transition-opacity md:text-[22px] ${stuck ? 'opacity-100' : 'opacity-0'}`}>{title}</span>
            <div className="flex shrink-0 gap-2" aria-label="Ringkasan belajar" data-tour="bar">
              <XpBadge><Ic name="zap" size={16} sw={2.2} fill="#F5B301" className="mr-1.5" />{progress.xp} XP</XpBadge>
              <LevelPill><Ic name="award" size={16} sw={2.2} className="mr-1.5" />Level {levelLabel(progress)}</LevelPill>
            </div>
            <AccountMenu name={user?.name ?? ''} level={levelLabel(progress)} xp={progress.xp} onSignOut={async () => { await signOut(); nav('/masuk') }} />
          </div>
        </div>
        <div className={`mx-auto w-full ${wide ? 'max-w-[1180px]' : 'max-w-5xl'}`}><Outlet /></div>
      </main>
      <nav aria-label="Menu utama" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} data-tour={i.tour} className={(s) => `flex min-h-[64px] flex-1 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${on(i.to, s.isActive) ? 'text-primary' : 'text-ink-soft'}`}>
            <Icon>{i.icon}</Icon>{i.label}
          </NavLink>
        ))}
      </nav>
      {tour && <Tour />}
    </div>
  )
}

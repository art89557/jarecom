// Peta level: 11 banner level; level yang dibuka menampilkan jalur sub-topik dan kuis. Panel samping (desktop) berisi ringkasan.
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LEVELS, type LevelContent } from '../content'
import { badgeState, isUnlocked, latestBadge, levelPctLive, nextLevel, nodeState, quizAvailable, type Progress } from '../lib/engine'
import { getDoneSubtopics } from '../lib/position'
import { useApp } from '../state'
import { Icon, LevelBadge, type IconName } from '../components/icons'
import { Netty, Ring } from '../components/ui'

/** Jenis node di jalur: selesai, aktif, berikutnya, terkunci, kuis terkunci, kuis terbuka. */
type Kind = 'done' | 'act' | 'next' | 'lock' | 'quiz' | 'quizOpen'
// Gaya dasar node bulat, dan variasi warna per jenis (bayangan bawah memberi kesan tombol timbul).
const BASE = 'relative flex h-[72px] w-[72px] items-center justify-center rounded-full transition duration-100'
const KIND: Record<Kind, string> = {
  done: 'bg-pass text-white shadow-[0_6px_0_#0A5A3C] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#0A5A3C]',
  act: 'node-act bg-primary text-white shadow-[0_6px_0_#143AA8] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#143AA8]',
  next: 'border-[3px] border-[#B9C2D0] bg-white text-ink shadow-[0_6px_0_#DDE3EC] hover:-translate-y-0.5 active:translate-y-1',
  lock: 'cursor-not-allowed bg-[#E4E9F2] text-[#66738A] shadow-[0_6px_0_#C9D1DE]',
  quiz: 'cursor-not-allowed bg-[#EFE6FA] text-quiz shadow-[0_6px_0_#D3C3E8]',
  quizOpen: 'node-act bg-quiz text-white shadow-[0_6px_0_#5B1A99] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#5B1A99]'
}

/** Satu node di jalur. Node terkunci berupa tombol yang menampilkan pesan; node lain berupa tautan. `dx` menggeser ke kiri/kanan agar jalur berkelok. */
function Node({ kind, icon, to, label, aria, dx, onLock, extra }: { kind: Kind; icon: IconName; to?: string; label: string; aria: string; dx: number; onLock?: () => void; extra?: ReactNode }) {
  const cls = `${BASE} ${KIND[kind]}`
  const locked = kind === 'lock' || kind === 'quiz'
  return (
    <li className="flex flex-col items-center gap-2" style={{ transform: `translateX(${dx}px)` }}>
      <div className="relative">
        {kind === 'act' || kind === 'quizOpen' ? (
          <span className="pop absolute -top-11 left-1/2 -translate-x-1/2 rounded-xl border-2 border-primary bg-white px-3 py-1 text-sm font-bold tracking-wide text-primary after:absolute after:left-1/2 after:top-full after:-mt-1.5 after:h-3 after:w-3 after:-translate-x-1/2 after:rotate-45 after:border-b-2 after:border-r-2 after:border-primary after:bg-white">MULAI</span>
        ) : null}
        {locked ? (
          <button type="button" className={cls} aria-label={aria} aria-disabled="true" onClick={onLock}><Icon name={icon} size={30} sw={2.4} /></button>
        ) : (
          <Link to={to ?? '/materi'} className={cls} aria-label={aria}><Icon name={icon} size={30} sw={2.4} /></Link>
        )}
        {extra}
      </div>
      <span className={`w-[150px] text-center text-sm leading-snug ${kind === 'next' || locked ? 'font-medium text-ink-soft' : 'font-semibold text-[#3D4A5E]'}`}>{label}</span>
    </li>
  )
}

// Pergeseran horizontal per node mengikuti gelombang sinus supaya jalur berkelok.
const dxOf = (i: number) => Math.round(Math.sin(i * 1.15) * 54)

/** Banner satu level (hijau selesai, biru aktif, abu terkunci). Bisa dibuka/ditutup untuk menampilkan jalurnya. */
function Banner({ lv, state, right, onToggle, expanded }: { lv: LevelContent; state: 'done' | 'act' | 'lock'; right?: ReactNode; onToggle?: () => void; expanded?: boolean }) {
  const bg = { done: 'bg-pass', act: 'bg-primary', lock: 'bg-[#8A95A8]' }[state]
  const tag = { done: 'SELESAI', act: 'AKTIF', lock: 'TERKUNCI' }[state]
  const ic: IconName = { done: 'check', act: 'book', lock: 'lock' }[state] as IconName
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20"><Icon name={ic} size={24} sw={2.4} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold tracking-wide opacity-90">LEVEL {lv.level} · {tag}</span>
        <span className="block font-display text-xl font-bold leading-tight">{lv.judul}</span>
      </span>
    </>
  )
  return (
    <div className={`flex items-center gap-2 rounded-2xl text-white ${bg}`}>
      {onToggle ? (
        <button type="button" onClick={onToggle} aria-expanded={expanded} aria-label={`Level ${lv.level}, ${lv.judul}. ${expanded ? 'Tutup jalur' : 'Buka jalur'}`} className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3.5 rounded-2xl py-4 pl-4 text-left">{body}</button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3.5 py-4 pl-4">{body}</div>
      )}
      <span className="flex shrink-0 items-center gap-2 pr-4">{right}{onToggle && <span className={`transition ${expanded ? 'rotate-180' : ''}`}><Icon name="chevd" size={22} sw={2.4} /></span>}</span>
    </div>
  )
}

/** Jalur satu level: node tiap sub-topik lalu node kuis. Netty menemani di node aktif. */
function Path({ lv, progress, uid, onLock }: { lv: LevelContent; progress: Progress; uid: string; onLock: (m: string) => void }) {
  const n = lv.level
  const levelDone = progress.completed.includes(n)
  // Jumlah sub-topik selesai: semua jika materi tuntas, kalau tidak dari posisi baca di perangkat.
  const doneCount = levelDone ? lv.subtopik.length : getDoneSubtopics(uid, n)
  const quizOk = quizAvailable(n, progress)
  const passed = progress.passed.includes(n)
  // Node aktif = sub-topik pertama yang belum selesai.
  const activeIdx = lv.subtopik.findIndex((_, i) => nodeState(i, doneCount, levelDone) === 'active')
  const lockMsg = () => onLock(`Kuis Level ${n} terbuka setelah semua sub-topik selesai.`)
  return (
    <ul className="flex flex-col items-center gap-9 pb-4 pt-12" aria-label={`Jalur Level ${n}`}>
      {lv.subtopik.map((s, i) => {
        const st = nodeState(i, doneCount, levelDone)
        const kind: Kind = st === 'done' ? 'done' : st === 'active' ? 'act' : 'next'
        const icon: IconName = st === 'done' ? 'check' : st === 'active' ? 'play' : 'book'
        const dx = dxOf(i)
        return (
          <Node key={s.id} kind={kind} icon={icon} to={`/materi/${n}`} dx={dx} label={s.judul}
            aria={`${s.judul}, ${st === 'done' ? 'selesai' : st === 'active' ? 'lanjutkan di sini' : 'belum dipelajari'}`}
            extra={i === activeIdx ? <span className={`bob absolute top-1 hidden w-[84px] min-[380px]:block ${dx > 20 ? 'right-full mr-3' : 'left-full ml-3'}`}><Netty size={84} label="Netty menemani" /></span> : null} />
        )
      })}
      <Node kind={passed ? 'done' : quizOk ? 'quizOpen' : 'quiz'} icon="trophy" to={`/kuis/${n}`} dx={dxOf(lv.subtopik.length)} onLock={lockMsg}
        label={`Kuis Level ${n}`} aria={`Kuis Level ${n}, ${passed ? 'lulus' : quizOk ? 'siap dikerjakan' : 'terkunci sampai semua sub-topik selesai'}`} />
    </ul>
  )
}

/** Panel samping desktop: XP dan level, ringkasan level aktif, daftar hadiah, dan lencana terbaru. */
function SidePanel({ current, progress, uid }: { current: number | null; progress: Progress; uid: string }) {
  const lv = current ? LEVELS.find((l) => l.level === current) : null
  const bd = latestBadge(progress)
  const kuis = current !== null && progress.completed.includes(current)
  // Persen level aktif (sama dengan Beranda). Semua tuntas = 100.
  const pct = current && lv ? levelPctLive(current, progress, getDoneSubtopics(uid, current), lv.subtopik.length) : 100
  // Baris hadiah: [ikon, teks, XP, warna latar, warna ikon].
  const rows: [IconName, string, string, string, string][] = [
    ['book', 'Semua materi selesai', '+20 XP', '#E8EEFF', '#1B46D1'],
    ['trophy', 'Kuis lulus (skor 70+)', '+50 XP', '#EFE6FA', '#7E22CE'],
    ['star', 'Skor 100 di kuis', '+20 XP', '#FEF3C7', '#8A5A00']
  ]
  return (
    <aside className="sticky top-20 hidden h-fit w-[340px] shrink-0 flex-col gap-4 lg:flex" aria-label="Ringkasan level">
      {lv ? (
        <section className="card flex flex-col gap-3.5 p-5">
          <h2 className="text-lg font-bold">Level {lv.level}: {lv.judul}</h2>
          <div className="flex items-center gap-4">
            <Ring pct={pct} size={84} stroke={10} label={`Progres Level ${lv.level}: ${pct} persen`} />
            <p className="text-[15px] leading-relaxed text-[#3D4A5E]">{kuis ? 'Materi selesai. Tinggal lulus kuis untuk membuka level berikutnya.' : 'Selesaikan semua sub-topik, lalu kerjakan kuis.'}</p>
          </div>
          <Link to={kuis ? `/kuis/${lv.level}` : `/materi/${lv.level}`} className="btn min-h-[48px]">{kuis ? 'Mulai kuis' : 'Lanjutkan belajar'}</Link>
        </section>
      ) : null}
      <section className="card flex flex-col gap-3 p-5">
        <h2 className="text-lg font-bold">Hadiah{lv ? ` Level ${lv.level}` : ''}</h2>
        {rows.map(([i, t, x, bg, fg]) => (
          <div key={t} className="flex items-center gap-3 text-[15px]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: bg, color: fg }}><Icon name={i} size={20} sw={2.2} /></span>
            <span className="flex-1">{t}</span><b className="text-xp">{x}</b>
          </div>
        ))}
      </section>
      <Link to="/progres/lencana" className="card flex items-center gap-3.5 px-5 py-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
        {bd !== null ? <LevelBadge level={bd} state={badgeState(bd, progress)} size={48} /> : <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#E4E9F2] text-ink-soft"><Icon name="award" size={26} sw={2.4} /></span>}
        <div className="flex-1"><div className="font-bold">Lencana terbaru</div><div className="help">{bd !== null ? `Level ${bd}, ${badgeState(bd, progress) === 'gold' ? 'skor sempurna' : 'lulus'}` : 'Lulus kuis untuk meraih lencana'}</div></div>
        <Icon name="arrow" size={20} sw={2.2} className="text-ink-soft" />
      </Link>
    </aside>
  )
}

/** Halaman Peta level. */
export default function MapPage() {
  const { user, progress } = useApp()
  const [toast, setToast] = useState('') // pesan singkat (mis. level terkunci)
  const [pick, setPick] = useState<number | null>(null)
  // Tampilkan pesan singkat selama 3,5 detik.
  const say = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(''), 3500)
  }
  // Level terbuka secara bawaan = level aktif; pilihan pengguna menggantikannya (-1 = semua tertutup).
  const current = nextLevel(progress)
  const openLv = pick ?? current
  const toggle = (n: number) => setPick(openLv === n ? -1 : n)
  return (
    <div className="flex gap-10">
      <div className="min-w-0 max-w-xl flex-1">
        <header>
          <h1 className="text-[28px] font-bold tracking-tight md:text-[34px]">Peta level</h1>
        </header>
        <p className="help mt-1">Level terbuka setelah materi sebelumnya selesai dan kuisnya lulus. Ketuk banner untuk membuka jalurnya.</p>
        <div className="mt-5 flex flex-col gap-3">
          {LEVELS.map((lv) => {
            const open = isUnlocked(lv.level, progress)
            const done = progress.completed.includes(lv.level) && progress.passed.includes(lv.level)
            if (!open) {
              return (
                <button key={lv.level} type="button" aria-disabled="true" className="text-left" onClick={() => say(`Level ${lv.level} terkunci. Selesaikan materi dan lulus kuis Level ${lv.level - 1} dulu.`)}>
                  <Banner lv={lv} state="lock" />
                </button>
              )
            }
            const isCur = lv.level === current
            const bs = badgeState(lv.level, progress)
            const expanded = openLv === lv.level
            return (
              <section key={lv.level} aria-label={`Level ${lv.level}`}>
                <Banner lv={lv} state={isCur ? 'act' : done ? 'done' : 'act'} onToggle={() => toggle(lv.level)} expanded={expanded}
                  right={isCur ? <Link to={`/materi/${lv.level}`} className="hidden min-h-[44px] items-center gap-1.5 rounded-xl bg-white/20 px-3.5 text-sm font-semibold text-white hover:bg-white/30 sm:inline-flex"><Icon name="book" size={18} sw={2.2} />Materi</Link>
                    : bs !== 'off' ? <span className={`flex h-9 w-9 items-center justify-center rounded-full ${bs === 'gold' ? 'bg-[#FACC15] text-[#7A4B00]' : 'bg-white/25 text-white'}`} role="img" aria-label={bs === 'gold' ? 'Lencana emas' : 'Lencana diraih'}><Icon name="award" size={22} sw={2.4} /></span> : null} />
                {expanded && <Path lv={lv} progress={progress} uid={user?.id ?? ''} onLock={say} />}
              </section>
            )
          })}
        </div>
      </div>
      <SidePanel current={current} progress={progress} uid={user?.id ?? ''} />
      {toast && <div role="status" className="fixed inset-x-4 bottom-24 z-30 mx-auto max-w-md rounded-2xl bg-ink px-4 py-3 text-center text-sm font-medium text-white md:bottom-8">{toast}</div>}
    </div>
  )
}

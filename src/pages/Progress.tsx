// Halaman Progres dengan tiga tab: Ringkasan (cincin, peta panas, detail level), Lencana, dan Riwayat XP.
import { useEffect, useRef, useState } from 'react'
import { useDialog } from '../lib/useDialog'
import { Link, NavLink } from 'react-router-dom'
import { LEVELS } from '../content'
import { badgeState, bestScore, heatState, LEVEL_XP_MAX, levelXp, overallPct, XP_MATERIAL, type HeatState, type Progress, type XpEvent } from '../lib/engine'
import { useApp } from '../state'
import { Ring } from '../components/ui'
import { Icon, LevelBadge, type IconName } from '../components/icons'

// Nama pendek tiap level (urut level 1 sampai 11) untuk petak peta panas.
const SHORT = ['Jaringan Terkini', 'IP Address', 'Topologi', 'OSI vs TCP/IP', 'Physical Layer', 'Netmask', 'Subnetting', 'Routing', 'VPN', 'Manajemen', 'Keamanan']
// Gaya petak peta panas per status, dan nama status untuk pembaca layar.
const HEAT_CLS: Record<HeatState, string> = {
  gold: 'border-[#B8860B] bg-xp-soft text-[#5C3A00]',
  pass: 'border-primary bg-primary-soft text-[#143AA8]',
  materi: 'border-primary bg-white text-[#1B46D1]',
  locked: 'cursor-default border-dashed border-[#B9C2D0] bg-locked text-[#4A5568]'
}
const HEAT_NAME: Record<HeatState, string> = { gold: 'emas', pass: 'lulus', materi: 'materi selesai, kuis siap', locked: 'terkunci' }

/** Hitung naik dari 0 ke `target` selama 0,7 detik (efek angka bergulir). Langsung ke nilai akhir jika animasi dikurangi. */
function useCount(target: number) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (document.documentElement.classList.contains('reduce-motion') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 700)
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return v
}

/** Kartu ringkasan: cincin persen total, total XP (bergulir), dan tiga statistik (lulus, emas, lencana). */
function RingCard({ progress }: { progress: Progress }) {
  const pct = overallPct(progress) // persen keseluruhan semua level
  const xp = useCount(progress.xp)
  const gold = progress.perfect.length
  const chip = (v: string, l: string, i: IconName, cls: string) => (
    <div className={`flex-1 rounded-xl px-2 py-2.5 text-center ${cls}`}><div className="flex items-center justify-center gap-1 font-display text-xl font-bold"><Icon name={i} size={18} sw={2.4} />{v}</div><div className="text-sm">{l}</div></div>
  )
  return (
    <section className="card flex flex-col gap-4 p-[18px]" aria-label="Ringkasan progres">
      <div className="flex items-center gap-[18px]">
        <Ring pct={pct} size={120} stroke={13} label={`Total progres ${pct} persen`} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink-soft">TOTAL XP</div>
          <div className="flex items-center gap-2 font-display text-4xl font-bold leading-none text-xp"><Icon name="zap" size={30} sw={2.2} fill="#F5B301" className="text-[#F5B301]" /><span aria-label={`${progress.xp} XP`}>{xp}</span></div>
          <p className="help mt-1.5 leading-snug">Progres seluruh level: materi 50% dan kuis 50% per level.</p>
        </div>
      </div>
      <div className="flex gap-2">
        {chip(`${progress.passed.length}/11`, 'Lulus', 'trophy', 'bg-primary-soft text-[#1B46D1]')}
        {chip(String(gold), 'Emas', 'star', 'bg-xp-soft text-[#8A5A00]')}
        {chip(String(progress.passed.length), 'Lencana', 'award', 'bg-pass-soft text-pass-ink')}
      </div>
    </section>
  )
}

/** Peta panas: satu petak per level dengan warna menurut status (emas, lulus, materi selesai, terkunci). */
function Heat({ progress, sel, onSel }: { progress: Progress; sel: number | null; onSel: (n: number) => void }) {
  return (
    <ul className="grid grid-cols-3 gap-2.5 lg:grid-cols-4">
      {LEVELS.map((l) => {
        const st = heatState(l.level, progress)
        const best = bestScore(l.level, progress)
        const foot = st === 'locked' ? 'Terkunci' : st === 'materi' ? 'Kuis siap' : `Skor ${best ?? '-'}`
        const body = (
          <>
            <span className="flex w-full items-center justify-between">
              <span className="font-display text-[26px] font-bold leading-none">{l.level}</span>
              <Icon name={st === 'gold' ? 'star' : st === 'pass' ? 'check' : st === 'materi' ? 'book' : 'lock'} size={20} sw={st === 'pass' ? 3 : 2.2} fill={st === 'gold' ? '#FACC15' : 'none'} />
            </span>
            <span className="mt-1 text-sm font-semibold leading-tight">{SHORT[l.level - 1]}</span>
            <span className="text-sm leading-tight opacity-90">{foot}</span>
          </>
        )
        const cls = `flex min-h-[112px] flex-col items-start gap-0.5 rounded-2xl border-2 p-3 text-left transition ${HEAT_CLS[st]}`
        return (
          <li key={l.level}>
            {st === 'locked' ? <div role="img" aria-label={`Level ${l.level}, ${SHORT[l.level - 1]}, terkunci`} className={`${cls} w-full`}>{body}</div>
              : <button type="button" onClick={() => onSel(l.level)} aria-pressed={sel === l.level} aria-label={`Level ${l.level}, ${SHORT[l.level - 1]}, ${HEAT_NAME[st]}. Lihat detail`} className={`${cls} w-full hover:-translate-y-0.5 hover:shadow-md ${sel === l.level ? 'shadow-[0_0_0_4px_#D5E0FF]' : ''}`}>{body}</button>}
          </li>
        )
      })}
    </ul>
  )
}

/** Keterangan warna peta panas. */
function Legend() {
  const it: [string, string, string][] = [['bg-locked', 'border-dashed border-[#B9C2D0]', 'Terkunci'], ['bg-white', 'border-primary', 'Materi selesai'], ['bg-primary-soft', 'border-primary', 'Lulus'], ['bg-xp-soft', 'border-[#B8860B]', 'Emas']]
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Keterangan warna">
      {it.map(([bg, b, t]) => <span key={t} className="inline-flex items-center gap-1.5 text-sm text-[#3D4A5E]"><span className={`h-4 w-4 rounded-[5px] border-2 ${bg} ${b}`} />{t}</span>)}
    </div>
  )
}

/** Detail satu level: lencana, status materi, skor terbaik, dan bintang emas beserta XP-nya. */
function Detail({ n, progress }: { n: number; progress: Progress }) {
  const lv = LEVELS[n - 1]
  const done = progress.completed.includes(n)
  const best = bestScore(n, progress)
  const bs = badgeState(n, progress)
  // Tiga baris detail: [ikon, judul, keterangan, XP, warna latar, warna ikon].
  const rows: [IconName, string, string, string, string, string][] = [
    ['book', 'Materi', done ? `${lv.subtopik.length} dari ${lv.subtopik.length} sub-topik selesai` : 'Belum selesai', done ? `+${XP_MATERIAL} XP` : '-', '#E8EEFF', '#1B46D1'],
    ['trophy', 'Skor terbaik', best === null ? 'Belum dikerjakan' : `${best}, ${progress.passed.includes(n) ? 'lulus' : 'belum lulus'} (minimal 70)`, progress.passed.includes(n) ? '+50 XP' : '-', '#EFE6FA', '#7E22CE'],
    ['star', 'Bintang emas', progress.perfect.includes(n) ? 'Diraih dengan skor 100' : 'Belum. Skor 100 memberi bonus.', progress.perfect.includes(n) ? '+20 XP' : '+20 XP', '#FEF3C7', '#8A5A00']
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3.5">
        <LevelBadge level={n} state={bs} size={76} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink-soft">LEVEL {n}</div>
          <h2 className="text-[22px] font-bold leading-tight">{lv.judul}</h2>
          <div className={`mt-0.5 text-sm font-semibold ${bs === 'off' ? 'text-ink-soft' : 'text-pass-ink'}`}>Lencana: {bs === 'gold' ? 'emas' : bs === 'got' ? 'lulus' : 'belum diraih'}</div>
        </div>
      </div>
      {rows.map(([i, t, d, x, bg, fg]) => (
        <div key={t} className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: bg, color: fg }}><Icon name={i} size={22} sw={2.2} /></span>
          <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold">{t}</div><div className="help leading-snug">{d}</div></div>
          <b className={`text-[15px] ${x === '-' ? 'text-ink-soft' : 'text-xp'}`}>{x}</b>
        </div>
      ))}
      <div className="flex items-center justify-between rounded-xl bg-bg px-3.5 py-3"><span className="text-[15px] text-[#3D4A5E]">XP dari level ini</span><b className="font-display text-xl">{levelXp(n, progress)} <span className="text-[15px] font-medium text-ink-soft">dari {LEVEL_XP_MAX}</span></b></div>
      <Link to="/materi" className="btn2 min-h-[48px] border-primary text-primary">Lihat di Peta level</Link>
    </div>
  )
}

/** Label hari untuk riwayat: "Hari ini", "Kemarin", atau tanggal (mis. 12 November). */
const dayLabel = (at: number): string => {
  const d = new Date(at)
  const t = new Date()
  const k = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((k(t) - k(d)) / 86400000)
  return diff <= 0 ? 'Hari ini' : diff === 1 ? 'Kemarin' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
}
// Tampilan tiap jenis XP di riwayat: ikon, warna, teks utama, dan keterangan.
const EV: Record<XpEvent['type'], { icon: IconName; bg: string; fg: string; label: (n: number, p: Progress) => string; sub: string }> = {
  materi: { icon: 'book', bg: '#E8EEFF', fg: '#1B46D1', label: (n) => `Materi Level ${n} selesai`, sub: 'Materi' },
  kuis: { icon: 'trophy', bg: '#EFE6FA', fg: '#7E22CE', label: (n, p) => `Kuis Level ${n} lulus${bestScore(n, p) !== null ? `, skor ${bestScore(n, p)}` : ''}`, sub: 'Kuis' },
  bonus: { icon: 'star', bg: '#FEF3C7', fg: '#8A5A00', label: () => 'Bonus skor 100', sub: 'Kuis' }
}

/** Satu baris riwayat XP. */
function EventRow({ e, progress }: { e: XpEvent; progress: Progress }) {
  const m = EV[e.type]
  return (
    <div className="flex items-center gap-3 px-4 py-3 [&+&]:border-t [&+&]:border-[#E6EAF1]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: m.bg, color: m.fg }}><Icon name={m.icon} size={22} sw={2.2} /></span>
      <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold leading-snug">{m.label(e.level, progress)}</div><div className="help">Level {e.level} · {m.sub}</div></div>
      <span className="inline-flex items-center gap-1 rounded-full bg-xp-soft px-2.5 py-1 text-[15px] font-bold text-xp"><Icon name="zap" size={14} sw={2.4} fill="#F5B301" />+{e.xp}</span>
    </div>
  )
}

/** Tab Riwayat XP: ringkasan per jenis XP dan daftar peristiwa dikelompokkan per hari. */
function Riwayat({ progress, aside }: { progress: Progress; aside?: boolean }) {
  const ev = progress.events // sudah urut terbaru di depan
  const sum = (t: XpEvent['type']) => ev.filter((e) => e.type === t).reduce((a, e) => a + e.xp, 0)
  const parts: [string, number, string][] = [['Materi selesai', sum('materi'), '#2457F5'], ['Kuis lulus', sum('kuis'), '#7E22CE'], ['Bonus skor 100', sum('bonus'), '#B8860B']]
  // Kelompokkan peristiwa berurutan yang harinya sama.
  const groups: { label: string; items: XpEvent[] }[] = []
  for (const e of ev) {
    const label = dayLabel(e.at)
    const g = groups[groups.length - 1]
    if (g && g.label === label) g.items.push(e)
    else groups.push({ label, items: [e] })
  }
  const summary = (
    <section className="card flex flex-col gap-3 p-4">
      <div className="flex items-baseline justify-between"><span className="text-[17px] font-bold">Total {progress.xp} XP</span><span className="help">dari {ev.length} kejadian</span></div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-md bg-line" role="img" aria-label={parts.map(([t, v]) => `${t} ${v}`).join(', ')}>
        {parts.map(([t, v, c]) => v > 0 ? <span key={t} style={{ flex: v, background: c }} /> : null)}
      </div>
      <div className="flex flex-col gap-2">{parts.map(([t, v, c]) => <div key={t} className="flex items-center gap-2 text-[15px]"><span className="h-3 w-3 rounded" style={{ background: c }} /><span className="flex-1">{t}</span><b>{v} XP</b></div>)}</div>
    </section>
  )
  const list = ev.length === 0 ? (
    <div className="card text-center"><p className="font-semibold">Belum ada riwayat XP</p><p className="help mt-1">XP muncul di sini setelah kamu menyelesaikan materi atau lulus kuis.</p></div>
  ) : (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.label}><div className="mx-1 mb-1.5 text-sm font-bold tracking-wide text-ink-soft">{g.label.toUpperCase()}</div><div className="overflow-hidden rounded-2xl border-[1.5px] border-line bg-white">{g.items.map((e, i) => <EventRow key={`${e.type}${e.level}${i}`} e={e} progress={progress} />)}</div></div>
      ))}
    </div>
  )
  if (aside) return <div className="flex flex-col gap-4 lg:flex-row lg:items-start"><div className="min-w-0 flex-1 order-2 lg:order-1">{list}</div><div className="order-1 lg:order-2 lg:w-[380px] lg:shrink-0">{summary}</div></div>
  return list
}

/** Lembar detail level untuk layar kecil (di desktop detail tampil di samping). */
function DetailSheet({ n, progress, onClose }: { n: number; progress: Progress; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  useDialog(box, onClose)
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-ink/55 lg:hidden" onClick={onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={`Detail Level ${n}`} onClick={(e) => e.stopPropagation()} className="rise max-h-[85vh] w-full overflow-y-auto rounded-t-[26px] bg-white px-5 pb-7 pt-3 shadow-2xl">
        <div className="mx-auto mb-1 h-[5px] w-11 rounded-full bg-[#C9D1DE]" />
        <div className="flex justify-end"><button type="button" onClick={onClose} aria-label="Tutup" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-bg"><Icon name="x" size={22} sw={2.2} /></button></div>
        <div className="-mt-3"><Detail n={n} progress={progress} /></div>
      </div>
    </div>
  )
}

/** Halaman Progres. `tab` ditentukan oleh rute: /progres, /progres/lencana, /progres/riwayat. */
export default function ProgressPage({ tab }: { tab: 'ringkasan' | 'lencana' | 'riwayat' }) {
  const { progress } = useApp()
  const [sel, setSel] = useState<number | null>(null) // level yang dipilih di peta panas
  const [badgeSel, setBadgeSel] = useState(1)
  const got = LEVELS.filter((l) => badgeState(l.level, progress) !== 'off').length
  const cur = LEVELS.find((l) => l.level === badgeSel) ?? LEVELS[0]
  const curState = badgeState(cur.level, progress)
  // Level yang detailnya tampil secara bawaan: lulus terakhir, atau materi selesai terakhir, atau level 1.
  const defSel = sel ?? (progress.passed.length ? Math.max(...progress.passed) : progress.completed.length ? Math.max(...progress.completed) : 1)
  const tabs: [string, string][] = [['/progres', 'Ringkasan'], ['/progres/lencana', 'Lencana'], ['/progres/riwayat', 'Riwayat XP']]
  // Pindah tab mengosongkan pilihan level.
  useEffect(() => { setSel(null) }, [tab])
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight md:text-[34px]">Progres</h1>
      <nav className="mt-4 flex gap-1 rounded-2xl bg-[#E4E9F2] p-1 md:max-w-[440px]" aria-label="Tampilan progres">
        {tabs.map(([to, t]) => (
          <NavLink key={to} to={to} end replace className={({ isActive }) => `flex min-h-[44px] flex-1 items-center justify-center rounded-xl text-[15px] font-semibold transition ${isActive ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:bg-[#D9E0EC]'}`}>{t}</NavLink>
        ))}
      </nav>

      {tab === 'lencana' && (
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
            <div className="card flex items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FACC15] text-[#7A4B00]"><Icon name="award" size={26} sw={2.4} /></span>
              <div><div className="text-[17px] font-bold">{got} dari 11 lencana</div><div className="help">Lulus kuis untuk meraih lencana Level. Skor 100 menambah bintang emas.</div></div>
            </div>
            <ul className="mt-4 grid grid-cols-3 gap-2.5 md:grid-cols-4">
              {LEVELS.map((l) => {
                const st = badgeState(l.level, progress)
                return (
                  <li key={l.level}>
                    <button type="button" onClick={() => setBadgeSel(l.level)} aria-pressed={badgeSel === l.level} aria-label={`Level ${l.level}, ${l.judul}: ${st === 'gold' ? 'diraih dengan skor 100' : st === 'got' ? 'diraih' : 'belum diraih'}`}
                      className={`flex w-full flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center transition hover:bg-[#E4E9F2] ${badgeSel === l.level ? 'bg-primary-soft' : ''}`}>
                      <LevelBadge level={l.level} state={st} size={88} />
                      <span className={`text-sm font-semibold ${st === 'off' ? 'text-ink-soft' : ''}`}>Level {l.level}</span>
                      <span className="text-sm leading-tight text-ink-soft">{SHORT[l.level - 1]}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <aside className="card flex flex-col items-center gap-2 text-center md:w-[320px] md:shrink-0" aria-live="polite">
            <LevelBadge level={cur.level} state={curState} size={140} />
            <div className="text-sm font-semibold tracking-wide text-ink-soft">LEVEL {cur.level}</div>
            <h2 className="text-xl font-bold">{cur.judul}</h2>
            <p className="help">{curState === 'gold' ? 'Diraih dengan skor sempurna.' : curState === 'got' ? 'Diraih. Ulangi kuis dan raih skor 100 untuk bintang emas.' : 'Belum diraih. Lulus kuis Level ini (skor 70 atau lebih). Kuis boleh diulang.'}</p>
          </aside>
        </div>
      )}

      {tab === 'riwayat' && <div className="mt-5"><Riwayat progress={progress} aside /></div>}

      {tab === 'ringkasan' && (
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <RingCard progress={progress} />
            <h2 className="mt-1 text-xl font-bold">Peta panas level</h2>
            <Heat progress={progress} sel={sel} onSel={setSel} />
            <Legend />
            <p className="help leading-snug">Ketuk petak level untuk melihat detail. Halaman ini hanya untuk dilihat.</p>
          </div>
          <aside className="hidden w-[380px] shrink-0 flex-col gap-4 lg:flex" aria-label="Detail level">
            <section className="card p-5"><Detail n={defSel} progress={progress} /></section>
            <section className="overflow-hidden rounded-[20px] border-[1.5px] border-line bg-white pt-1.5">
              <div className="flex items-center justify-between px-4 pb-1.5 pt-3"><h2 className="text-lg font-bold">Riwayat XP terbaru</h2><Link to="/progres/riwayat" className="link text-[15px]">Lihat semua</Link></div>
              {progress.events.length === 0 ? <p className="help px-4 pb-4">Belum ada riwayat.</p> : progress.events.slice(0, 3).map((e, i) => <EventRow key={i} e={e} progress={progress} />)}
            </section>
          </aside>
          {sel !== null && <DetailSheet n={sel} progress={progress} onClose={() => setSel(null)} />}
        </div>
      )}
    </div>
  )
}

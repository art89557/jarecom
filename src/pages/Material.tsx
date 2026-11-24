import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getLevel } from '../content'
import { repo } from '../lib'
import { isUnlocked, levelPct, PASS_SCORE } from '../lib/engine'
import { getDoneSubtopics, setDoneSubtopics } from '../lib/position'
import { play } from '../lib/sound'
import { useApp } from '../state'
import { Icon, type IconName } from '../components/icons'
import { Back, ErrorMsg, Netty, Segments, XpBadge } from '../components/ui'

export default function Material() {
  const n = Number(useParams().n)
  const lv = getLevel(n)
  const { user, progress, refresh } = useApp()
  const nav = useNavigate()
  const total = lv?.subtopik.length ?? 0
  const alreadyDone = progress.completed.includes(n)
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!user || !lv) return
    setIdx(alreadyDone ? 0 : Math.min(getDoneSubtopics(user.id, n), total - 1))
    setPicked(null)
  }, [user, n, lv, total, alreadyDone])

  if (!lv) return <Navigate to="/materi" replace />
  if (!isUnlocked(n, progress)) return <Navigate to="/materi" replace />
  const s = lv.subtopik[idx]
  const correct = picked !== null && picked === s.cek.benar
  const last = idx === total - 1

  function pick(i: number) {
    if (correct) return
    setPicked(i)
    play(i === s.cek.benar ? 'benar' : 'salah')
  }
  // Alur tombol "Lanjut":
  // - Bukan sub-topik terakhir: simpan posisi baca (di perangkat dulu, lalu server) dan pindah ke sub-topik berikutnya.
  // - Sub-topik terakhir: tandai materi selesai di server (+XP sekali per level), muat ulang progres, lalu ke layar selesai.
  async function next() {
    if (!user) return
    if (!last) {
      const v = Math.max(getDoneSubtopics(user.id, n), idx + 1)
      setDoneSubtopics(user.id, n, v)
      // Kirim ke server tanpa menunggu. Jika gagal tidak masalah: posisi sudah aman di perangkat.
      void repo.savePosition(n, v).catch(() => { /* tetap tersimpan di perangkat */ })
      setIdx(idx + 1); setPicked(null); window.scrollTo(0, 0)
      return
    }
    setBusy(true); setErr('')
    try {
      const r = await repo.completeMaterial(n)
      await refresh()
      nav(`/materi/${n}/selesai`, { state: { xp: r.xpGained } })
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Back to="/materi">Kembali ke peta</Back>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-primary">Level {n} · {lv.judul} · Sub-topik {idx + 1} dari {total}</span>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-[38px]">{s.judul}</h1>
        <Segments total={total} done={idx + 1} />
      </div>
      <p className="text-base leading-[1.7] md:text-[17px]">{s.uraian}</p>
      <ul className="card flex flex-col gap-2.5">
        {s.poin.map((p) => (
          <li key={p} className="flex gap-3 text-[15px] leading-relaxed"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />{p}</li>
        ))}
      </ul>

      <section className="mt-2 flex flex-col gap-3" aria-label="Cek pemahaman">
        <h2 className="text-xl font-bold">Cek pemahaman</h2>
        <p className="font-semibold">{s.cek.pertanyaan}</p>
        <div className="flex flex-col gap-2.5">
          {s.cek.opsi.map((o, i) => (
            <button key={o} type="button" onClick={() => pick(i)} aria-pressed={picked === i}
              className={`opt ${picked === i ? (i === s.cek.benar ? 'ok' : 'no') : ''}`}>
              <span className="font-semibold">{'ABC'[i]}.</span><span className="flex-1">{o}</span>
              {picked === i && (i === s.cek.benar
                ? <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold"><Icon name="check" size={20} sw={2.8} />Benar</span>
                : <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold"><Icon name="x" size={20} sw={2.8} />Belum tepat</span>)}
            </button>
          ))}
        </div>
        {picked !== null && (
          <div role="status" className={`rise flex items-start gap-3 rounded-xl p-3 text-sm leading-snug ${correct ? 'bg-pass-soft text-pass-ink' : 'bg-fail-soft text-fail-ink'}`}>
            <Netty pose={correct ? 'senang' : 'sedih'} size={56} />
            <span><b>{correct ? 'Benar.' : 'Belum tepat, coba lagi.'}</b> {correct ? s.cek.penjelasan : 'Baca lagi uraian di atas, lalu pilih jawaban lain.'}</span>
          </div>
        )}
      </section>

      <ErrorMsg>{err}</ErrorMsg>
      {last && correct && !alreadyDone && <p className="help">Semua sub-topik selesai. Tandai materi untuk mendapat <XpBadge>+20 XP</XpBadge></p>}
      <button className="btn mt-2" disabled={!correct || busy} onClick={() => void next()}>
        {last ? (alreadyDone ? 'Selesai' : 'Tandai materi selesai') : 'Sub-topik berikutnya'}
      </button>
      {alreadyDone && last && correct && <Link to={`/kuis/${n}`} className="btn2">Kerjakan kuis</Link>}
    </div>
  )
}

const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 37 + 11) % 96 + 2,
  s: 8 + ((i * 5) % 7),
  d: ((i * 13) % 30) / 10,
  t: 3 + ((i * 7) % 25) / 10,
  c: ['#FACC15', '#FFFFFF', '#7FE3B5', '#9CB4FF', '#F5B301'][i % 5],
  r: i % 3 === 0
}))

export function Done() {
  const n = Number(useParams().n)
  const lv = getLevel(n)
  const { progress } = useApp()
  if (!lv) return <Navigate to="/materi" replace />
  const xp = (history.state?.usr as { xp?: number } | null)?.xp ?? 0
  const stat = (icon: IconName, v: string, l: string) => (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-white/15 px-2 py-3.5">
      <Icon name={icon} size={22} sw={2.2} /><b className="font-display text-xl">{v}</b><span className="text-sm opacity-90">{l}</span>
    </div>
  )
  return (
    <div className="relative mx-auto mt-2 flex max-w-md flex-col items-center gap-3.5 overflow-hidden rounded-[28px] bg-primary px-6 pb-6 pt-8 text-center text-white">
      {CONFETTI.map((c, i) => (
        <span key={i} aria-hidden="true" className="pointer-events-none absolute top-0" style={{ left: `${c.x}%`, width: c.s, height: c.r ? c.s : c.s * 2, borderRadius: c.r ? '50%' : 2, background: c.c, animation: `fall ${c.t}s linear ${c.d}s infinite` }} />
      ))}
      <div className="bob relative flex h-[210px] w-[210px] items-center justify-center rounded-[36px] bg-white/15"><Netty pose="rayakan" size={180} label="Netty merayakan" /></div>
      <p className="relative text-sm font-semibold tracking-wide opacity-90">LEVEL {n} · {lv.judul.toUpperCase()}</p>
      <h1 className="rise relative text-[34px] font-bold tracking-tight">Materi selesai!</h1>
      {xp > 0 && (
        <span className="pop relative inline-flex min-h-[56px] items-center gap-2.5 rounded-full bg-xp-soft px-6 font-display text-[28px] font-bold text-xp"><Icon name="zap" size={28} sw={2.2} fill="#F5B301" />+{xp} XP</span>
      )}
      <div className="relative flex w-full flex-col gap-1.5">
        <div className="flex justify-between text-sm font-semibold"><span>Progres Level {n}</span><span>{levelPct(n, progress)}%</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={levelPct(n, progress)}>
          <div className="h-full rounded-full bg-[#FACC15]" style={{ width: `${levelPct(n, progress)}%`, animation: 'grow 1.2s ease-out both' }} />
        </div>
      </div>
      <div className="relative flex w-full gap-2.5">{stat('book', `${lv.subtopik.length}/${lv.subtopik.length}`, 'Sub-topik')}{stat('zap', String(progress.xp), 'Total XP')}{stat('trophy', 'Terbuka', 'Kuis')}</div>
      <p className="relative text-[15px] opacity-95">Lulus kuis dengan skor {PASS_SCORE} atau lebih untuk membuka Level {Math.min(n + 1, 11)}.</p>
      <div className="relative mt-1 flex w-full flex-col gap-2.5">
        <Link to={`/kuis/${n}`} className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-white px-5 font-semibold text-ink active:scale-[.97]">Kerjakan kuis Level {n}</Link>
        <Link to="/materi" className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border-[1.5px] border-[#5C7BE0] px-5 font-medium text-white hover:bg-white/10 active:scale-[.97]">Kembali ke peta</Link>
      </div>
    </div>
  )
}

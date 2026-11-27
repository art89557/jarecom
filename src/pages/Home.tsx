// Beranda: ringkasan dan jalan pintas. Kartu "Lanjutkan belajar", pintasan kuis/bintang/lencana, peta mini, dan fakta hari ini.
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state'
import { getLevel, LEVELS } from '../content'
import { badgeState, latestBadge, levelPctLive, nextLevel, quizAvailable, type Progress } from '../lib/engine'
import { getDoneSubtopics } from '../lib/position'
import { pickFakta } from '../lib/fakta'
import { Icon, LevelBadge } from '../components/icons'
import { Netty, Ring } from '../components/ui'
import FaktaCard from '../components/Fakta'
import { tourSeen } from '../lib/tour'
import { MISSIONS, labDone, labOpen } from '../lib/lab'

/** Garis segmen di kartu Lanjut: terisi penuh jika materi selesai, segmen berikutnya setengah terang. */
function Segs({ total, done, kuis }: { total: number; done: number; kuis: boolean }) {
  return (
    <div className="flex gap-1.5" role="img" aria-label={`${done} dari ${total} sub-topik selesai`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-2 flex-1 rounded-full ${kuis || i < done ? 'bg-white' : i === done ? 'bg-white/55' : 'bg-white/25'}`} />
      ))}
    </div>
  )
}

/** Salam sesuai jam di perangkat. */
const sapa = () => { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam' }

/** Kartu besar "Lanjutkan belajar" untuk level yang sedang dikerjakan (materi atau kuis). */
function Lanjut({ n, uid, progress }: { n: number; uid: string; progress: Progress }) {
  const lv = getLevel(n)!
  const kuis = progress.completed.includes(n) // materi selesai berarti tinggal kuis
  const total = lv.subtopik.length
  // Sub-topik yang sudah selesai: semua jika materi tuntas, kalau tidak dari posisi baca di perangkat.
  const done = kuis ? total : Math.min(getDoneSubtopics(uid, n), total)
  // Sudah mulai belajar? (punya XP atau minimal satu sub-topik selesai)
  const started = progress.xp > 0 || done > 0
  // Persen level memakai rumus yang sama dengan halaman Peta.
  const pct = levelPctLive(n, progress, done, total)
  // Teks pendukung: subjudul, gelembung ucapan Netty, tujuan tautan, dan label tombol.
  const sub = kuis ? 'Materi selesai. Kuis 10 soal siap dikerjakan.' : `Sub-topik ${Math.min(done + 1, total)} dari ${total}: ${lv.subtopik[Math.min(done, total - 1)].judul}`
  const bub = kuis ? 'Tinggal satu langkah lagi. Kuismu sudah siap!' : started ? `${sapa()}! Ayo lanjut, sedikit lagi beres.` : `${sapa()}! Yuk mulai dari Level 1.`
  const to = kuis ? `/kuis/${n}` : `/materi/${n}`
  const cta = kuis ? 'Mulai kuis' : started ? 'Lanjut belajar' : 'Mulai belajar'
  return (
    <section className={`flex flex-col gap-4 rounded-[22px] p-[18px] text-white md:flex-row md:items-center md:gap-7 md:p-7 ${kuis ? 'bg-quiz' : 'bg-primary'}`} aria-label="Lanjutkan belajar" data-tour="lanjut">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center gap-4">
          <Ring pct={pct} size={80} stroke={9} fg="#fff" track="rgba(255,255,255,.28)" text="#fff" label={`Progres Level ${n}: ${pct} persen`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide opacity-90">LANJUTKAN BELAJAR</p>
            <h2 className="font-display text-xl font-bold leading-tight md:text-3xl">Level {n} · {lv.judul}</h2>
            <p className="mt-1 text-[15px] leading-snug opacity-95">{sub}</p>
          </div>
        </div>
        <Segs total={total} done={done} kuis={kuis} />
        <Link to={to} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-bold transition hover:shadow-[0_0_0_4px_rgba(255,255,255,.35)] active:scale-[.97] md:self-start md:min-w-[220px]" style={{ color: kuis ? '#7E22CE' : '#2457F5' }}>
          <Icon name={kuis ? 'play' : 'arrow'} size={20} sw={2.4} />{cta}
        </Link>
      </div>
      <div className="hidden justify-center md:flex md:w-[300px] md:flex-none">
        <Netty pose={kuis ? 'menari' : 'halo'} size={120} say={bub} side="atas" lines={[`${sapa()}!`, 'Ketuk tombol putih untuk lanjut.', 'Aku suka paket data. Hehe.']} />
      </div>
      <div className="md:hidden">
        <Netty pose={kuis ? 'menari' : 'halo'} size={72} say={bub} side="kanan" lines={[`${sapa()}!`, 'Ketuk tombol putih untuk lanjut.']} />
      </div>
    </section>
  )
}

/** Peta mini: 11 titik level (centang = lulus, biru = sedang dipelajari). Mengarah ke halaman Peta. */
function MiniMap({ cur, kuis, progress }: { cur: number | null; kuis: boolean; progress: Progress }) {
  const passed = progress.passed.length
  return (
    <Link to="/materi" aria-label="Buka peta level" data-tour="peta" className="block rounded-[18px] border-[1.5px] border-line bg-white p-4 transition hover:border-primary hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div><div className="font-display text-lg font-bold">Peta belajar</div><div className="help">{passed} dari 11 level lulus</div></div>
        <span className="inline-flex items-center gap-1 text-[15px] font-semibold text-primary">Buka peta<Icon name="arrow" size={18} sw={2.2} /></span>
      </div>
      <ol className="relative mt-3 flex items-center justify-between py-2">
        <span aria-hidden className="absolute left-3 right-3 top-1/2 h-1 -translate-y-1/2 rounded bg-line" />
        {LEVELS.map((l) => {
          const done = progress.passed.includes(l.level)
          const here = l.level === cur
          const st = done ? 'lulus' : here ? (kuis ? 'kuis siap' : 'sedang dipelajari') : 'belum'
          return (
            <li key={l.level} aria-label={`Level ${l.level}, ${st}`} className={`relative flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold md:h-9 md:w-9 ${done ? 'bg-pass text-white' : here ? `node-act ${kuis ? 'bg-quiz' : 'bg-primary'} text-white` : 'border-2 border-[#C9D1DE] bg-[#E4E9F2] text-ink-soft'}`}>
              {done ? <Icon name="check" size={14} sw={3.2} /> : <span className="hidden md:inline">{l.level}</span>}
            </li>
          )
        })}
      </ol>
    </Link>
  )
}

/** Halaman Beranda. */
export default function Home() {
  const { user, progress, ready, tour, setTour } = useApp()
  // Tur muncul otomatis sekali saat pertama kali masuk Beranda.
  useEffect(() => {
    if (ready && user && !tour && !user.tourSeen && !tourSeen(user.id)) setTour(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.id])
  // Data turunan untuk kartu-kartu di bawah.
  const next = nextLevel(progress) // level yang sedang dikerjakan
  const kuis = next !== null && progress.completed.includes(next)
  const uid = user?.id ?? ''
  const fakta = pickFakta(progress, uid)
  const sisaEmas = progress.passed.filter((n) => !progress.perfect.includes(n)).sort((a, b) => a - b)
  const siap = LEVELS.find((l) => quizAvailable(l.level, progress) && !progress.passed.includes(l.level) && l.level !== next)
  const bd = latestBadge(progress) // level lencana terbaru
  const first = user?.name.split(' ')[0]
  // Rekomendasi: simulasi yang cocok dengan level aktif, dan misi lab berikutnya yang terbuka.
  const sim: [string, string] | null = next === null ? null : next <= 2 ? ['ip-biner', 'IP Address dan Biner'] : next <= 4 ? ['perangkat', 'Hub vs Switch vs Router'] : next === 5 ? ['kabel', 'Kabel Straight vs Cross'] : ['subnet', 'Kalkulator Subnet']
  const ld = uid ? labDone(uid) : []
  const mis = MISSIONS.find((m) => !ld.includes(m.n) && labOpen(ld, m.n))
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <h1 className="sr-only">Beranda, {progress.xp === 0 ? 'selamat datang' : 'halo lagi'} {first}</h1>

      {next ? <Lanjut n={next} uid={uid} progress={progress} /> : (
        <section className="card flex items-center gap-4"><Netty pose="menari" size={110} label="Netty merayakan" lines={['Kamu hebat!', 'Ulangi kuis untuk bintang emas.']} /><div><h2 className="text-xl font-bold">Semua level selesai</h2><p className="text-ink-soft">Kamu menamatkan 11 level. Kuis bisa diulang kapan saja untuk bintang emas.</p></div></section>
      )}

      <h2 className="mt-1 text-[20px] font-bold">Rekomendasi untukmu</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sim && (
          <Link to={`/simulasi/${sim[0]}`} className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-line bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-primary-soft text-primary"><Icon name="sim" size={26} sw={2.2} /></span>
            <span className="min-w-0"><span className="block font-bold">Simulasi: {sim[1]}</span><span className="help block leading-snug">Cocok untuk Level {next}. Geser dan bandingkan sendiri.</span></span>
          </Link>
        )}
        {mis && (
          <Link to={`/lab/${mis.n}`} className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-line bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-pass-soft text-pass"><Icon name="share" size={26} sw={2.2} /></span>
            <span className="min-w-0"><span className="block font-bold">Lab · Misi {mis.n}</span><span className="help block leading-snug">{mis.title}</span></span>
          </Link>
        )}
        {siap && (
          <Link to="/kuis" className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-line bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#EFE6FA] text-quiz"><Icon name="trophy" size={26} sw={2.2} /></span>
            <span className="min-w-0"><span className="block font-bold">Kuis siap</span><span className="help block leading-snug">Level {siap.level} bisa dikerjakan. +50 XP saat lulus.</span></span>
          </Link>
        )}
        {sisaEmas.length > 0 && (
          <Link to="/kuis" className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-line bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-xp-soft text-[#B8860B]"><Icon name="star" size={26} sw={2.2} fill="#FACC15" /></span>
            <span className="min-w-0"><span className="block font-bold">Bintang emas tersisa</span><span className="help block leading-snug">Level {sisaEmas[0]} belum skor 100. Ulangi kuis untuk +20 XP.</span></span>
          </Link>
        )}
        {bd !== null && (
          <Link to="/progres/lencana" className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-line bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
            <LevelBadge level={bd} state={badgeState(bd, progress)} size={48} />
            <span className="min-w-0"><span className="block font-bold">Lencana terbaru</span><span className="help block leading-snug">Level {bd}, {badgeState(bd, progress) === 'gold' ? 'emas' : 'lulus'}. Kamu punya {progress.passed.length} dari 11 lencana.</span></span>
          </Link>
        )}
      </div>

      <MiniMap cur={next} kuis={kuis} progress={progress} />
      {fakta && <FaktaCard f={fakta} tall />}
    </div>
  )
}

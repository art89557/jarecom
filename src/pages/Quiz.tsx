// Kuis: daftar kuis per level (QuizList), mengerjakan soal satu per satu (QuizPlay), dan layar hasil (QuizResultPage).
// Kunci jawaban tidak ada di klien: jawaban diperiksa dan dinilai oleh repo (server pada mode produksi).
import { Icon, LevelBadge, ReadyBadge, type IconName } from '../components/icons'
import { useEffect, useRef, useState } from 'react'
import { useDialog } from '../lib/useDialog'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getLevel, LEVELS } from '../content'
import { repo } from '../lib'
import { badgeState, bestScore, nextLevel, PASS_SCORE, quizAvailable, quizStatus } from '../lib/engine'
import type { CheckResult, QuizQuestion, QuizResult } from '../lib/repo'
import { play } from '../lib/sound'
import { useApp } from '../state'
import { Back, ErrorMsg, Netty, XpBadge } from '../components/ui'

/** Filter daftar kuis. */
type Filter = 'semua' | 'siap' | 'lulus' | 'belum-emas'

/** Kartu kuis satu level di daftar: lencana, judul, status (emas/lulus/siap/terkunci), dan skor terbaik. */
function QuizCard({ n, onOpen }: { n: number; onOpen: (n: number) => void }) {
  const { progress } = useApp()
  const lv = LEVELS[n - 1]
  const st = quizStatus(n, progress)
  const best = bestScore(n, progress)
  // Label status kuis; yang terkunci hanya hiasan (tidak bisa diklik).
  const chip = {
    gold: <span className="inline-flex items-center gap-1 rounded-full bg-xp-soft px-2.5 py-1 text-sm font-bold text-[#8A5A00]"><Icon name="star" size={15} sw={2.4} />Emas</span>,
    pass: <span className="inline-flex items-center gap-1 rounded-full bg-pass-soft px-2.5 py-1 text-sm font-bold text-pass-ink"><Icon name="check" size={15} sw={2.8} />Lulus</span>,
    ready: <span className="inline-flex items-center gap-1 rounded-full bg-[#EFE6FA] px-2.5 py-1 text-sm font-bold text-[#5B1A99]"><Icon name="play" size={15} sw={2.4} />Siap</span>,
    locked: <span className="inline-flex items-center gap-1 rounded-full bg-[#E4E9F2] px-2.5 py-1 text-sm font-bold text-[#4A5568]"><Icon name="lock" size={15} sw={2.4} />Terkunci</span>
  }[st]
  const top = st === 'ready' ? <ReadyBadge size={72} /> : <LevelBadge level={n} state={st === 'gold' ? 'gold' : st === 'pass' ? 'got' : 'off'} size={72} />
  const body = (
    <>
      <div className="flex w-full items-start justify-between">{top}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink-soft">Level {n}</div>
      <div className="min-h-[42px] font-display text-[17px] font-bold leading-tight">{lv.judul}</div>
      <div className="flex flex-wrap items-center gap-2">{chip}{best !== null ? <span className="help">Terbaik {best}</span> : st === 'ready' ? <span className="help">+50 XP</span> : null}</div>
      {st === 'pass' && <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#8A5A00]"><Icon name="star" size={15} sw={2.2} fill="#FACC15" />Ulangi untuk emas</span>}
      {st === 'locked' && <span className="text-sm leading-snug text-ink-soft">Selesaikan materinya dulu</span>}
    </>
  )
  const base = 'flex h-full w-full flex-col items-start gap-2 rounded-[18px] border-[1.5px] p-3.5 text-left'
  if (st === 'locked') return <div role="img" aria-label={`Level ${n}, ${lv.judul}, terkunci`} className={`${base} cursor-not-allowed border-dashed border-[#B9C2D0] bg-locked text-[#5B6779]`}>{body}</div>
  return (
    <button type="button" onClick={() => onOpen(n)} aria-label={`Level ${n}, ${lv.judul}, ${st === 'ready' ? 'siap dikerjakan' : st === 'gold' ? 'emas' : 'lulus'}`}
      className={`${base} bg-white transition hover:-translate-y-1 hover:shadow-lg ${st === 'ready' ? 'border-2 border-quiz shadow-[0_0_0_4px_rgba(126,34,206,.12)]' : 'border-line hover:border-primary'}`}>{body}</button>
  )
}

/** Lembar persiapan sebelum kuis: jumlah soal, nilai lulus, XP, dan tombol mulai/ulangi. */
function PrepSheet({ n, onClose }: { n: number; onClose: () => void }) {
  const { progress } = useApp()
  const lv = LEVELS[n - 1]
  const st = quizStatus(n, progress)
  const best = bestScore(n, progress)
  const box = useRef<HTMLDivElement>(null)
  useDialog(box, onClose)
  // Baris aturan kuis: [ikon, teks, warna latar, warna ikon].
  const rows: [IconName, string, string, string][] = [
    ['help', `${lv.kuis.length} soal pilihan ganda`, '#E8EEFF', '#1B46D1'],
    ['check', `Lulus dengan skor ${PASS_SCORE} atau lebih`, '#E3F5EC', '#0A5C3F'],
    ['zap', '+50 XP saat lulus pertama, bonus +20 XP jika skor 100', '#FEF3C7', '#8A5A00'],
    ['repeat', 'Boleh diulang kapan saja', '#EFE6FA', '#5B1A99']
  ]
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/55 md:items-center" onClick={onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={`Persiapan kuis Level ${n}`} onClick={(e) => e.stopPropagation()} className="rise w-full rounded-t-[26px] bg-white px-5 pb-7 pt-3 shadow-2xl md:w-[460px] md:rounded-[26px] md:px-7">
        <div className="mx-auto mb-1 h-[5px] w-11 rounded-full bg-[#C9D1DE] md:hidden" />
        <div className="flex justify-end"><button type="button" onClick={onClose} aria-label="Tutup" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-bg"><Icon name="x" size={22} sw={2.2} /></button></div>
        <div className="-mt-3 flex flex-col items-center gap-1 text-center">
          {st === 'ready' ? <ReadyBadge size={110} /> : <LevelBadge level={n} state={st === 'gold' ? 'gold' : 'got'} size={110} />}
          <div className="mt-1 text-sm font-semibold text-ink-soft">LEVEL {n}</div>
          <h2 className="text-2xl font-bold">{lv.judul}</h2>
          <p className="text-[15px] text-ink-soft">{st === 'ready' ? 'Materi selesai. Kuis siap dikerjakan.' : `Skor terbaikmu ${best ?? '-'}. ${st === 'gold' ? 'Sudah emas, kamu boleh mengulang untuk latihan.' : 'Ulangi untuk meraih skor 100.'}`}</p>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {rows.map(([i, t, bg, fg]) => (
            <div key={t} className="flex items-center gap-3 text-[15px] leading-snug"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: bg, color: fg }}><Icon name={i} size={20} sw={2.2} /></span>{t}</div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-2.5">
          <Link to={`/kuis/${n}`} autoFocus className="btn">{st === 'ready' ? 'Mulai kuis' : 'Ulangi kuis'}</Link>
          <button type="button" onClick={onClose} className="btn2 border-transparent text-primary">Nanti saja</button>
        </div>
      </div>
    </div>
  )
}

/** Halaman daftar kuis (/kuis) dengan kartu "Kuis berikutnya", bintang emas, filter, dan grid kuis. */
export function QuizList() {
  const { progress } = useApp()
  const [filter, setFilter] = useState<Filter>('semua')
  const [sheet, setSheet] = useState<number | null>(null) // level yang lembar persiapannya terbuka
  const stat = (n: number) => quizStatus(n, progress)
  const nums = LEVELS.map((l) => l.level)
  const nextQ = nums.find((n) => stat(n) === 'ready') // kuis pertama yang siap dikerjakan
  const retry = nums.find((n) => stat(n) === 'pass') // lulus tetapi belum 100: dianjurkan mengulang untuk bintang emas
  const gold = progress.perfect.length // jumlah bintang emas
  // Jumlah kuis per filter, daftar yang ditampilkan menurut filter, dan daftar tab filter.
  const counts = { semua: 11, siap: nums.filter((n) => stat(n) === 'ready').length, lulus: nums.filter((n) => stat(n) === 'pass' || stat(n) === 'gold').length, 'belum-emas': nums.filter((n) => stat(n) === 'pass').length }
  const shown = nums.filter((n) => filter === 'semua' ? true : filter === 'siap' ? stat(n) === 'ready' : filter === 'lulus' ? stat(n) === 'pass' || stat(n) === 'gold' : stat(n) === 'pass')
  const filters: [Filter, string][] = [['semua', 'Semua'], ['siap', 'Siap'], ['lulus', 'Lulus'], ['belum-emas', 'Belum emas']]
  const waiting = nextLevel(progress) // level yang materinya perlu diselesaikan dulu
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 md:gap-5">
      <header>
        <h1 className="text-[28px] font-bold tracking-tight md:text-[34px]">Kuis</h1>
        <p className="help mt-1">{`10 soal per kuis. Skor minimal ${PASS_SCORE} untuk lulus. Boleh diulang kapan saja.`}</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="flex items-center gap-3 overflow-hidden rounded-[22px] bg-primary p-5 text-white md:p-6" aria-label="Kuis berikutnya">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <span className="text-sm font-semibold tracking-wide opacity-90">{nextQ ? 'KUIS BERIKUTNYA' : 'BELUM ADA KUIS SIAP'}</span>
            {nextQ ? (
              <>
                <h2 className="font-display text-[22px] font-bold leading-tight md:text-[28px]">Level {nextQ} · {LEVELS[nextQ - 1].judul}</h2>
                <div className="flex flex-wrap gap-2"><span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">{LEVELS[nextQ - 1].kuis.length} soal</span><span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">Lulus skor {PASS_SCORE}</span><span className="rounded-full bg-xp-soft px-3 py-1 text-sm font-bold text-[#8A5A00]">+50 XP</span></div>
                <button type="button" onClick={() => setSheet(nextQ)} className="mt-1.5 inline-flex min-h-[52px] items-center gap-2 self-start rounded-xl bg-white px-6 font-bold text-primary transition hover:shadow-[0_0_0_4px_rgba(255,255,255,.35)] active:scale-[.97]"><Icon name="play" size={20} sw={2.4} />Mulai kuis</button>
              </>
            ) : (
              <>
                <h2 className="font-display text-[22px] font-bold leading-tight md:text-[26px]">{waiting ? `Selesaikan materi Level ${waiting} dulu` : 'Semua kuis sudah lulus'}</h2>
                {waiting && <Link to={`/materi/${waiting}`} className="mt-1.5 inline-flex min-h-[52px] items-center gap-2 self-start rounded-xl bg-white px-6 font-bold text-primary"><Icon name="book" size={20} sw={2.4} />Ke materi</Link>}
              </>
            )}
          </div>
          <Netty pose="senang" size={108} label="Netty bersemangat" bob />
        </section>
        <section className="card flex flex-col gap-3 p-4" aria-label="Bintang emas">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-xp-soft text-[#B8860B]"><Icon name="star" size={24} sw={2.2} fill="#FACC15" /></span>
            <div className="flex-1"><div className="text-[17px] font-bold">Bintang emas: {gold} dari 11</div><div className="help leading-snug">Raih skor 100 di kuis untuk bonus +20 XP.</div></div>
          </div>
          <div className="flex flex-wrap gap-1.5" role="img" aria-label={`${gold} dari 11 bintang emas`}>
            {nums.map((n) => <span key={n} className={`h-[18px] w-[18px] rounded-full border-2 ${progress.perfect.includes(n) ? 'border-[#B8860B] bg-[#FACC15]' : 'border-[#C9D1DE] bg-[#E4E9F2]'}`} />)}
          </div>
          {retry !== undefined && (
            <div className="flex items-center justify-between gap-2.5 rounded-xl bg-xp-soft px-3 py-2.5">
              <span className="text-sm leading-snug text-[#5C3A00]">Level {retry} skor {bestScore(retry, progress)}. Ulangi untuk skor 100.</span>
              <button type="button" onClick={() => setSheet(retry)} className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-bold text-[#8A5A00] hover:bg-[#FFF8E1]"><Icon name="repeat" size={16} sw={2.3} />Ulangi</button>
            </div>
          )}
        </section>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter kuis">
        {filters.map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-4 text-[15px] font-semibold transition ${filter === k ? 'border-primary bg-primary text-white' : 'border-line bg-white text-[#3D4A5E] hover:border-primary hover:bg-primary-soft'}`}>{t} <span className="opacity-80">{counts[k]}</span></button>
        ))}
      </div>
      {shown.length === 0 ? <p className="help py-6 text-center">Belum ada kuis di filter ini.</p> : (
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3.5 xl:grid-cols-4">
          {shown.map((n) => <li key={n}><QuizCard n={n} onOpen={setSheet} /></li>)}
        </ul>
      )}
      {sheet !== null && <PrepSheet n={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}

/** Halaman mengerjakan kuis (/kuis/:n): satu soal per layar, jawaban diperiksa lewat repo, soal terakhir mengirim hasil. */
export function QuizPlay() {
  const n = Number(useParams().n)
  const lv = getLevel(n)
  const { progress, refresh } = useApp()
  const nav = useNavigate()
  const [qs, setQs] = useState<QuizQuestion[] | null>(null) // soal dari repo; null = sedang dimuat
  const [i, setI] = useState(0) // indeks soal aktif
  const [answers, setAnswers] = useState<number[]>([]) // jawaban yang sudah diperiksa, per soal
  const [sel, setSel] = useState<number | null>(null) // opsi yang sedang dipilih
  const [fb, setFb] = useState<CheckResult | null>(null) // umpan balik setelah diperiksa (jawaban benar + penjelasan)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const started = useRef(false) // penanda soal sudah diminta

  // Soal diambil dari server tanpa kunci jawaban. `started` mencegah pengambilan ganda (React StrictMode memanggil effect dua kali).
  useEffect(() => {
    if (started.current || !lv) return
    started.current = true
    repo.getQuiz(n).then(setQs).catch((e: Error) => setErr(e.message))
  }, [n, lv])

  // Level tidak ada atau kuis belum tersedia: kembali ke daftar. Soal belum tiba: tampilkan "Memuat".
  if (!lv || !quizAvailable(n, progress)) return <Navigate to="/kuis" replace />
  if (!qs) return <div className="mx-auto max-w-2xl pt-10"><ErrorMsg>{err}</ErrorMsg>{!err && <p className="help">Memuat soal…</p>}</div>

  const q = qs[i] // soal aktif
  const lastQ = i === qs.length - 1
  // Periksa satu jawaban lewat server (kunci jawaban tidak ada di klien), tampilkan benar/salah dan penjelasan.
  async function check() {
    if (sel === null) return
    setBusy(true); setErr('')
    try {
      const r = await repo.checkAnswer(n, i, sel)
      setFb(r)
      setAnswers((a) => { const c = [...a]; c[i] = sel; return c })
      play(r.benar === sel ? 'benar' : 'salah')
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  // Soal berikutnya. Setelah soal terakhir, kirim semua jawaban: server menghitung skor, kelulusan (>= 70), dan XP,
  // lalu hasilnya dibawa ke halaman hasil lewat state router.
  async function next() {
    if (!lastQ) { setI(i + 1); setSel(null); setFb(null); return }
    setBusy(true); setErr('')
    try {
      const res = await repo.submitQuiz(n, answers)
      await refresh()
      if (res.passed) play('lulus')
      nav(`/kuis/${n}/hasil`, { state: res })
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const right = fb && fb.benar === sel // jawaban terpilih benar?

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <Back to="/kuis">Keluar kuis</Back>
        <span className="text-sm font-semibold text-ink-soft">Soal {i + 1} dari {qs.length}</span>
      </div>
      <div className="flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={qs.length} aria-valuenow={i + 1} aria-label="Nomor soal">
        {qs.map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full ${k <= i ? 'bg-quiz' : 'bg-line'}`} />)}
      </div>
      <p className="text-sm font-semibold text-quiz">Kuis Level {n} · {lv.judul}</p>
      <h1 className="text-[26px] font-bold leading-tight tracking-tight md:text-[32px]">{q.pertanyaan}</h1>
      <div className="flex flex-col gap-2.5">
        {q.opsi.map((o, k) => {
          let c = ''
          if (fb) c = k === fb.benar ? 'ok pop' : k === sel ? 'no' : 'dim'
          else if (sel === k) c = 'sel'
          return (
            <button key={o} type="button" disabled={!!fb} aria-pressed={sel === k} onClick={() => { setSel(k); play('tekan') }} className={`opt ${c}`}>
              <span className="font-semibold">{'ABCD'[k]}.</span><span className="flex-1">{o}</span>
              {fb && k === fb.benar && <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold"><Icon name="check" size={20} sw={2.8} />{k === sel ? 'Benar' : 'Jawaban benar'}</span>}
              {fb && k !== fb.benar && k === sel && <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold"><Icon name="x" size={20} sw={2.8} />Belum tepat</span>}
            </button>
          )
        })}
      </div>
      <ErrorMsg>{err}</ErrorMsg>
      {fb ? (
        <div role="status" className={`rise flex flex-col gap-3 rounded-[18px] border-[1.5px] p-4 ${right ? 'border-pass bg-pass-soft' : 'border-fail bg-fail-soft'}`}>
          <div className="flex items-center gap-3">
            <Netty pose={right ? 'senang' : 'sedih'} size={84} label={right ? 'Netty senang' : 'Netty sedih'} />
            <div className={right ? 'text-pass-ink' : 'text-fail-ink'}>
              <div className="text-lg font-bold">{right ? 'Benar!' : 'Belum tepat'}</div>
              <div className="text-sm leading-snug">{right ? fb.penjelasan : `Jawaban yang benar adalah ${'ABCD'[fb.benar]}. ${fb.penjelasan}`}</div>
            </div>
          </div>
          <button className="btn" disabled={busy} onClick={() => void next()}>{lastQ ? 'Lihat hasil' : 'Soal berikutnya'}</button>
        </div>
      ) : (
        <button className="btn mt-2" disabled={sel === null || busy} onClick={() => void check()}>Periksa jawaban</button>
      )}
    </div>
  )
}

/** Layar hasil kuis (/kuis/:n/hasil): skor, lulus atau belum, XP, lencana. Data dibawa lewat state router; tanpa itu kembali ke daftar. */
export function QuizResultPage() {
  const n = Number(useParams().n)
  const { state } = useLocation() as { state: QuizResult | null }
  const { progress } = useApp()
  if (!state) return <Navigate to={`/kuis`} replace />
  const lv = getLevel(n)
  const ok = state.passed
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 pt-6 text-center">
      {ok ? (
        <div className="relative flex flex-col items-center">
          <span className="badge-pop"><LevelBadge level={n} state={badgeState(n, progress) === 'gold' || state.score === 100 ? 'gold' : 'got'} size={150} /></span>
          <span className="pop -mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-1.5 text-sm font-bold text-[#1B46D1]"><Icon name="award" size={16} sw={2.4} />Lencana Level {n} diraih</span>
          {state.score === 100 && <span className="pop mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-xp-soft px-3.5 py-1.5 text-sm font-bold text-[#8A5A00]"><Icon name="star" size={16} sw={2.2} fill="#FACC15" />Bintang emas, skor sempurna!</span>}
        </div>
      ) : <Netty pose="sedih" size={170} label="Netty sedih" />}
      <div className="pop flex h-32 w-32 flex-col items-center justify-center rounded-full border-[6px] bg-white" style={{ borderColor: ok ? '#0F7B55' : '#C0262D' }} aria-label={`Skor ${state.score}`}>
        <span className="font-display text-4xl font-bold">{state.score}</span><span className="help">dari 100</span>
      </div>
      <h1 className="text-[28px] font-bold">{ok ? 'Lulus' : 'Belum lulus'} · Level {n}</h1>
      <p className="text-ink-soft">{state.correct} dari {state.total} soal benar. Skor minimal {PASS_SCORE}. {lv?.judul}</p>
      {state.xpGained > 0 && <span className="pop"><XpBadge>+{state.xpGained} XP</XpBadge></span>}
      {ok && n < 11 && progress.passed.includes(n) && <p className="font-semibold text-pass-ink">Level {n + 1} sekarang terbuka.</p>}
      {!ok && <p className="help">Level {n + 1} tetap terkunci sampai kuis ini lulus. Kamu boleh mengulang kapan saja.</p>}
      {ok && n < 11 ? <Link to={`/materi/${n + 1}`} className="btn">Lanjut ke Level {n + 1}</Link> : null}
      <Link to={`/kuis/${n}`} className={ok ? 'btn2' : 'btn'}>Ulangi kuis</Link>
      {!ok && <Link to={`/materi/${n}`} className="btn2">Pelajari materi lagi</Link>}
      <Link to="/beranda" className="link min-h-[44px] leading-[44px]">Ke beranda</Link>
    </div>
  )
}

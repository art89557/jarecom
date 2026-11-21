import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { repo } from '../lib'
import { useApp } from '../state'
import { Back, ErrorMsg, Logo, Netty, type Pose } from '../components/ui'

const STEPS: { pose: Pose; judul: string; teks: string }[] = [
  { pose: 'halo', judul: 'Belajar jaringan, level demi level', teks: '11 level dari dasar jaringan sampai keamanan. Selesaikan materi dan kuis untuk membuka level berikutnya.' },
  { pose: 'berpikir', judul: 'Cek pemahaman di setiap sub-topik', teks: 'Setiap sub-topik ditutup satu pertanyaan singkat. Kuis akhir level butuh skor minimal 70.' },
  { pose: 'rayakan', judul: 'Kumpulkan XP', teks: 'Materi selesai +20 XP, kuis lulus +50 XP, dan bonus +20 XP untuk skor 100.' }
]

interface BIPEvent extends Event { prompt: () => Promise<void> }

export function Splash() {
  const { user, ready } = useApp()
  const [i, setI] = useState(0)
  const [bip, setBip] = useState<BIPEvent | null>(null)
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setBip(e as BIPEvent) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])
  if (ready && user) return <Navigate to="/beranda" replace />
  const s = STEPS[i]
  const last = i === STEPS.length - 1
  return (
    <AuthFrame>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Logo />
        <Netty pose={s.pose} size={200} label={`Netty, maskot Jar’ecom`} bob />
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{s.judul}</h1>
        <p className="max-w-[320px] text-base leading-relaxed text-ink-soft">{s.teks}</p>
        <div className="flex gap-2" aria-hidden="true">
          {STEPS.map((_, k) => <span key={k} className={`h-2 rounded-full ${k === i ? 'w-6 bg-primary' : 'w-2 bg-line'}`} />)}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {last ? <Link to="/daftar" className="btn">Mulai belajar</Link> : <button className="btn" onClick={() => setI(i + 1)}>Lanjut</button>}
        {last ? <Link to="/masuk" className="btn2">Saya sudah punya akun</Link> : <Link to="/masuk" className="btn2">Lewati</Link>}
        {bip && <button className="link min-h-[44px]" onClick={() => void bip.prompt()}>Pasang aplikasi ke layar utama</button>}
      </div>
    </AuthFrame>
  )
}

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col gap-6 px-6 pb-8 pt-10">{children}</main>
  )
}

export function Field(p: { id: string; label: string; type?: string; value: string; set: (v: string) => void; err?: string; auto?: string; hint?: string; bad?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={p.id} className="text-sm font-semibold">{p.label}</label>
      <input id={p.id} type={p.type ?? 'text'} value={p.value} onChange={(e) => p.set(e.target.value)} autoComplete={p.auto}
        aria-invalid={p.err || p.bad ? true : undefined} aria-describedby={p.err ? `${p.id}-e` : p.hint ? `${p.id}-h` : undefined} className={`field ${p.err || p.bad ? 'err' : ''}`} />
      {p.hint && !p.err && <span id={`${p.id}-h`} className="help">{p.hint}</span>}
      {p.err && <span id={`${p.id}-e`} className="flex items-start gap-1.5"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E1B21" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.01" /></svg><ErrorMsg>{p.err}</ErrorMsg></span>}
    </div>
  )
}

export function Login() {
  const { setUser } = useApp()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    try { setUser(await repo.signIn(email, pw)); nav('/beranda') } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  return (
    <AuthFrame>
      <Back to="/" />
      <div className="flex flex-col items-center gap-3 text-center">
        <Netty pose={err ? 'sedih' : 'halo'} size={130} label={err ? 'Netty sedih' : 'Netty melambai'} />
        <h1 className="text-[30px] font-bold tracking-tight">Masuk</h1>
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field id="email" label="Email" type="email" value={email} set={setEmail} auto="email" bad={!!err} />
        <Field id="pw" label="Kata sandi" type="password" value={pw} set={setPw} auto="current-password" err={err || undefined} />
        <button className="btn" disabled={busy || !email || !pw}>{busy ? 'Memproses…' : 'Masuk'}</button>
        <Link to="/lupa" className="link self-center min-h-[44px] leading-[44px]">Lupa kata sandi?</Link>
      </form>
      <p className="text-center text-base">Belum punya akun? <Link to="/daftar" className="link">Daftar</Link></p>
    </AuthFrame>
  )
}

export function Register() {
  const { setUser } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', pw: '' })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    const x: Record<string, string> = {}
    if (!f.name.trim()) x.name = 'Nama wajib diisi'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Masukkan email yang valid'
    if (f.pw.length < 8) x.pw = 'Kata sandi minimal 8 karakter'
    setErrs(x)
    const firstBad = (['name', 'email', 'pw'] as const).find((k) => x[k])
    if (firstBad) { setTimeout(() => document.getElementById(firstBad)?.focus(), 0); return }
    setBusy(true)
    try { setUser(await repo.signUp(f.name, f.email, f.pw)); nav('/beranda') } catch (z) { setErrs({ email: (z as Error).message }) } finally { setBusy(false) }
  }
  return (
    <AuthFrame>
      <Back to="/" />
      <h1 className="text-[30px] font-bold tracking-tight">Buat akun</h1>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field id="name" label="Nama" value={f.name} set={(v) => setF({ ...f, name: v })} auto="name" err={errs.name} />
        <Field id="email" label="Email" type="email" value={f.email} set={(v) => setF({ ...f, email: v })} auto="email" err={errs.email} />
        <Field id="pw" label="Kata sandi" type="password" value={f.pw} set={(v) => setF({ ...f, pw: v })} auto="new-password" err={errs.pw} hint="Minimal 8 karakter" />
        <button className="btn" disabled={busy}>{busy ? 'Memproses…' : 'Daftar'}</button>
      </form>
      <p className="text-center text-base">Sudah punya akun? <Link to="/masuk" className="link">Masuk</Link></p>
    </AuthFrame>
  )
}

export function Forgot() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    try { await repo.resetPassword(email); setSent(true) } catch (x) { setErr((x as Error).message) }
  }
  return (
    <AuthFrame>
      <Back to="/masuk" />
      {sent ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Netty pose="senang" size={160} label="Netty senang" />
          <h1 className="text-[28px] font-bold">Cek email kamu</h1>
          <p className="max-w-[320px] text-ink-soft">Jika email terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim.</p>
          <Link to="/masuk" className="btn">Kembali ke masuk</Link>
        </div>
      ) : (
        <>
          <h1 className="text-[30px] font-bold tracking-tight">Lupa kata sandi</h1>
          <p className="text-ink-soft">Masukkan email akunmu. Kami kirim tautan untuk mengatur ulang kata sandi.</p>
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <Field id="email" label="Email" type="email" value={email} set={setEmail} auto="email" err={err || undefined} />
            <button className="btn" disabled={!email}>Kirim tautan</button>
          </form>
        </>
      )}
    </AuthFrame>
  )
}

export function NewPassword() {
  const { ready, user, setUser } = useApp()
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    const x: Record<string, string> = {}
    if (pw.length < 8) x.pw = 'Kata sandi minimal 8 karakter'
    if (pw2 !== pw) x.pw2 = 'Kata sandi tidak sama'
    setErrs(x)
    const firstBad = (['pw', 'pw2'] as const).find((k) => x[k])
    if (firstBad) { setTimeout(() => document.getElementById(firstBad)?.focus(), 0); return }
    setBusy(true)
    try { await repo.updatePassword(pw); setDone(true); if (user) setUser(user) } catch (z) { setErrs({ pw: (z as Error).message }) } finally { setBusy(false) }
  }
  if (!ready) return <AuthFrame><p role="status" className="help text-center">Memuat…</p></AuthFrame>
  if (done) {
    return (
      <AuthFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Netty pose="senang" size={160} label="Netty senang" />
          <h1 className="text-[28px] font-bold">Kata sandi diperbarui</h1>
          <p className="max-w-[320px] text-ink-soft">Mulai sekarang masuk dengan kata sandi yang baru.</p>
          <button type="button" className="btn" onClick={() => nav('/beranda')}>Ke beranda</button>
        </div>
      </AuthFrame>
    )
  }
  if (!user) {
    return (
      <AuthFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Netty pose="sedih" size={140} label="Netty sedih" />
          <h1 className="text-[28px] font-bold">Tautan tidak berlaku</h1>
          <p className="max-w-[320px] text-ink-soft">Tautan atur ulang kata sandi sudah dipakai atau kedaluwarsa. Minta tautan baru.</p>
          <Link to="/lupa" className="btn">Minta tautan baru</Link>
          <Link to="/masuk" className="link min-h-[44px] leading-[44px]">Kembali ke masuk</Link>
        </div>
      </AuthFrame>
    )
  }
  return (
    <AuthFrame>
      <h1 className="text-[30px] font-bold tracking-tight">Atur kata sandi baru</h1>
      <p className="text-ink-soft">Untuk akun {user.email}. Pilih kata sandi yang belum pernah kamu pakai.</p>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field id="pw" label="Kata sandi baru" type="password" value={pw} set={setPw} auto="new-password" err={errs.pw} hint="Minimal 8 karakter" />
        <Field id="pw2" label="Ulangi kata sandi baru" type="password" value={pw2} set={setPw2} auto="new-password" err={errs.pw2} />
        <button className="btn" disabled={busy}>{busy ? 'Memproses…' : 'Simpan kata sandi'}</button>
      </form>
    </AuthFrame>
  )
}

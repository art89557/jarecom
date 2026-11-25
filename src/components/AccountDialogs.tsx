// Dialog ubah nama dan ubah kata sandi di halaman Profil. Keduanya memakai kerangka <Sheet>.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { repo } from '../lib'
import type { User } from '../lib/repo'
import { useDialog } from '../lib/useDialog'
import { Icon } from './icons'
import { Field } from '../pages/Auth'

/** Kerangka dialog: latar gelap (klik untuk menutup), judul, tombol Tutup, dan isi. Aksesibel lewat useDialog. */
function Sheet({ title, id, onClose, children }: { title: string; id: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  useDialog(box, onClose)
  // Fokus awal ke kolom isian, bukan ke tombol Tutup.
  useEffect(() => { box.current?.querySelector<HTMLInputElement>('input')?.focus() }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 sm:items-center" onClick={onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby={id} onClick={(e) => e.stopPropagation()} className="rise w-full max-w-[440px] rounded-t-[26px] bg-white px-5 pb-7 pt-3 shadow-2xl sm:rounded-[26px]">
        <div className="flex items-center justify-between gap-3">
          <h2 id={id} className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-bg"><Icon name="x" size={22} sw={2.2} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Dialog ubah nama tampilan. Memvalidasi: wajib diisi dan maksimal 60 karakter. */
export function NameDialog({ current, onClose, onSaved }: { current: string; onClose: () => void; onSaved: (u: User) => void }) {
  const [name, setName] = useState(current)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) { setErr('Nama wajib diisi'); document.getElementById('nm')?.focus(); return }
    if (n.length > 60) { setErr('Nama maksimal 60 karakter'); document.getElementById('nm')?.focus(); return }
    setBusy(true); setErr('')
    try { onSaved(await repo.updateName(n)) } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  return (
    <Sheet title="Ubah nama" id="nm-judul" onClose={onClose}>
      <form onSubmit={submit} noValidate className="mt-3 flex flex-col gap-4">
        <Field id="nm" label="Nama" value={name} set={setName} auto="name" err={err || undefined} />
        <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
        <button type="button" className="btn2" onClick={onClose}>Batal</button>
      </form>
    </Sheet>
  )
}

/** Dialog ubah kata sandi. Memvalidasi: kata sandi lama terisi, baru minimal 8 karakter dan berbeda, ulangi harus sama. */
export function PasswordDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ cur: '', pw: '', pw2: '' }) // cur = saat ini, pw = baru, pw2 = ulangi
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    const x: Record<string, string> = {}
    if (!f.cur) x.cur = 'Isi kata sandi saat ini'
    if (f.pw.length < 8) x.pw = 'Kata sandi minimal 8 karakter'
    else if (f.pw === f.cur) x.pw = 'Kata sandi baru harus berbeda dari yang lama'
    if (f.pw2 !== f.pw) x.pw2 = 'Kata sandi tidak sama'
    setErrs(x)
    // Fokus ke kolom salah pertama agar pembaca layar langsung diarahkan ke sana.
    const firstBad = (['cur', 'pw', 'pw2'] as const).find((k) => x[k])
    if (firstBad) { setTimeout(() => document.getElementById(`pk-${firstBad}`)?.focus(), 0); return }
    setBusy(true)
    try { await repo.updatePassword(f.pw, f.cur); onSaved() } catch (z) {
      const m = (z as Error).message
      const k = /saat ini/.test(m) ? 'cur' : 'pw'
      setErrs({ [k]: m }); setTimeout(() => document.getElementById(`pk-${k}`)?.focus(), 0)
    } finally { setBusy(false) }
  }
  return (
    <Sheet title="Ubah kata sandi" id="pk-judul" onClose={onClose}>
      <form onSubmit={submit} noValidate className="mt-3 flex flex-col gap-4">
        <Field id="pk-cur" label="Kata sandi saat ini" type="password" value={f.cur} set={(v) => setF({ ...f, cur: v })} auto="current-password" err={errs.cur} />
        <Field id="pk-pw" label="Kata sandi baru" type="password" value={f.pw} set={(v) => setF({ ...f, pw: v })} auto="new-password" err={errs.pw} hint="Minimal 8 karakter" />
        <Field id="pk-pw2" label="Ulangi kata sandi baru" type="password" value={f.pw2} set={(v) => setF({ ...f, pw2: v })} auto="new-password" err={errs.pw2} />
        <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan kata sandi'}</button>
        <button type="button" className="btn2" onClick={onClose}>Batal</button>
      </form>
    </Sheet>
  )
}

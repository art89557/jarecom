// Profil dan pengaturan: identitas, etalase lencana, kartu pencapaian, pengaturan (suara, gerak, pasang aplikasi), dan akun.
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { repo } from '../lib'
import { setSound, soundOn } from '../lib/sound'
import { setVoice, voiceOn } from '../lib/voice'
import { nettyQuiet, reduceOn, setNettyQuiet, setReduce } from '../lib/prefs'
import { shareCard } from '../lib/shareCard'
import { badgeState, levelLabel } from '../lib/engine'
import { LEVELS } from '../content'
import { useApp } from '../state'
import { Icon, LevelBadge, type IconName } from '../components/icons'
import { LevelPill, Netty, XpBadge } from '../components/ui'
import { NameDialog, PasswordDialog } from '../components/AccountDialogs'

/** Kotak ikon bulat untuk baris pengaturan (abu-abu jika fitur "segera hadir"). */
const chipIc = (i: IconName, soon = false) => (
  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${soon ? 'bg-[#E4E9F2] text-[#4A5568]' : 'bg-primary-soft text-[#1B46D1]'}`}><Icon name={i} size={22} sw={2.2} /></span>
)

/** Baris pengaturan dengan saklar hidup/mati (suara, suara panduan, kurangi animasi). */
function Toggle({ icon, title, desc, on, onChange }: { icon: IconName; title: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative flex min-h-[72px] cursor-pointer items-center gap-3.5 px-4 py-3 hover:bg-bg [&+&]:border-t [&+&]:border-[#E6EAF1]">
      {chipIc(icon)}
      <span className="flex flex-1 flex-col gap-0.5"><span className="text-base font-semibold">{title}</span><span className="help leading-snug">{desc}</span></span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden className="relative h-[30px] w-[52px] shrink-0 rounded-full bg-[#8995A8] transition peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink after:absolute after:left-[3px] after:top-[3px] after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition after:content-[''] peer-checked:after:translate-x-[22px]" />
    </label>
  )
}

/** Baris menu biasa: tautan ke halaman lain, atau label "segera" jika belum tersedia. */
function Row({ icon, title, desc, to, soon }: { icon: IconName; title: string; desc: string; to?: string; soon?: boolean }) {
  const inner = (
    <>
      {chipIc(icon, soon)}
      <span className="flex flex-1 flex-col gap-0.5"><span className="text-base font-semibold">{title}</span><span className="help leading-snug">{desc}</span></span>
      {soon ? <span className="shrink-0 rounded-full bg-[#E4E9F2] px-2.5 py-0.5 text-sm font-bold text-[#4A5568]">Segera</span> : <Icon name="arrow" size={20} sw={2.2} className="text-ink-soft" />}
    </>
  )
  const cls = 'flex min-h-[72px] items-center gap-3.5 px-4 py-3 [&+&]:border-t [&+&]:border-[#E6EAF1]'
  return soon ? <div role="button" aria-disabled="true" className={`${cls} cursor-not-allowed`}>{inner}</div> : <Link to={to ?? '/'} className={`${cls} hover:bg-bg`}>{inner}</Link>
}

/** Pengelompokan baris pengaturan dengan judul. */
const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <section><h2 className="mx-1 mb-2 text-base text-[#3D4A5E]">{title}</h2><div className="overflow-hidden rounded-2xl border-[1.5px] border-line bg-white">{children}</div></section>
)

/** Halaman Profil (/profil). */
export default function Profile() {
  const { user, progress, signOut, setTour, setUser } = useApp()
  const nav = useNavigate()
  const [snd, setSnd] = useState(soundOn()) // efek suara aktif
  const [vc, setVc] = useState(voiceOn()) // suara panduan aktif
  const [red, setRed] = useState(reduceOn()) // kurangi animasi aktif
  const [quiet, setQuiet] = useState(nettyQuiet()) // Netty diam (tanpa gelembung ucapan)
  const [msg, setMsg] = useState('') // pesan hasil bagikan kartu
  const [dlg, setDlg] = useState<'nama' | 'sandi' | null>(null) // dialog yang terbuka
  const [note, setNote] = useState('') // pesan setelah ubah nama/kata sandi
  // Peristiwa pemasangan PWA yang ditahan browser; dipakai tombol "Pasang aplikasi".
  const [bip, setBip] = useState<{ prompt: () => Promise<void> } | null>(null)
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setBip(e as unknown as { prompt: () => Promise<void> }) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])
  const name = user?.name ?? ''
  // Etalase lencana: tampilkan hingga 3 slot, emas lebih dulu lalu biru, sisanya diisi "Berikutnya".
  const earned = LEVELS.map((l) => l.level).filter((n) => badgeState(n, progress) !== 'off')
  const show = [...earned.filter((n) => badgeState(n, progress) === 'gold').reverse(), ...earned.filter((n) => badgeState(n, progress) === 'got').reverse()].slice(0, 3)
  const nextN = LEVELS.map((l) => l.level).find((n) => badgeState(n, progress) === 'off')
  const slots: { n: number; cap: string }[] = show.map((n) => ({ n, cap: `Level ${n} · ${badgeState(n, progress) === 'gold' ? 'Emas' : 'Lulus'}` }))
  while (slots.length < 3 && nextN !== undefined) slots.push({ n: nextN + (slots.length - show.length), cap: 'Berikutnya' })
  // Bagikan kartu pencapaian (Web Share) atau unduh sebagai gambar.
  async function share() {
    setMsg('')
    try {
      const r = await shareCard(name, progress)
      setMsg(r === 'diunduh' ? 'Kartu tersimpan sebagai gambar.' : r === 'dibagikan' ? 'Kartu dibagikan.' : '')
    } catch { setMsg('Kartu belum bisa dibuat. Coba lagi.') }
  }
  const stat = (v: string, l: string) => <div className="min-w-0 flex-1 rounded-xl bg-white/[.16] px-1 py-2 text-center"><div className="font-display text-[22px] font-bold leading-tight">{v}</div><div className="text-sm">{l}</div></div>
  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Profil dan pengaturan</h1>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-7">
        <div className="flex min-w-0 flex-col gap-4 lg:w-[520px] lg:shrink-0">
          <section className="card flex items-center gap-4 p-[18px]" aria-label="Profil">
            <span aria-hidden className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-primary font-display text-4xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[26px] font-bold leading-tight">{name}</div>
              <div className="help truncate">{user?.email}</div>
              <div className="mt-1.5 flex flex-wrap gap-2"><LevelPill><Icon name="award" size={16} sw={2.2} className="mr-1.5" />Level {levelLabel(progress)}</LevelPill><XpBadge><Icon name="zap" size={16} sw={2.2} fill="#F5B301" className="mr-1.5" />{progress.xp} XP</XpBadge></div>
            </div>
          </section>

          <section className="card flex flex-col gap-1.5 p-4" aria-label="Etalase lencana">
            <div className="flex items-center justify-between"><h2 className="text-lg">Etalase lencana</h2><Link to="/progres/lencana" className="inline-flex min-h-[44px] items-center gap-1 text-[15px] font-semibold text-primary hover:underline">Lihat semua<Icon name="arrow" size={18} sw={2.2} /></Link></div>
            <div className="flex justify-between gap-2">
              {slots.map((s, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1 text-center"><LevelBadge level={Math.min(s.n, 11)} state={s.cap === 'Berikutnya' ? 'off' : badgeState(s.n, progress)} size={84} /><span className="text-sm font-semibold">{s.cap}</span></div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3" aria-label="Kartu pencapaian">
            <div className="flex items-center justify-between"><h2 className="text-lg">Kartu pencapaian</h2><span className="help">Pratinjau gambar</span></div>
            <div className="flex flex-col gap-3.5 rounded-[22px] bg-primary p-[18px] text-white shadow-[0_10px_24px_rgba(36,87,245,.25)]">
              <div className="flex items-center gap-3.5">
                <Netty pose="rayakan" size={84} label="Netty merayakan" bob />
                <div className="min-w-0"><div className="text-sm font-semibold tracking-wide opacity-90">KARTU PENCAPAIAN</div><div className="truncate font-display text-[26px] font-bold leading-tight">{name} · Level {levelLabel(progress)}</div><div className="text-[15px] opacity-95">Belajar Jaringan Komputer</div></div>
              </div>
              <div className="flex gap-2">{stat(String(progress.xp), 'XP')}{stat(String(progress.passed.length), 'Lencana')}{stat(String(progress.perfect.length), 'Emas')}{stat(`${progress.passed.length}/11`, 'Lulus')}</div>
              <div className="flex items-center gap-2 text-sm font-semibold"><img src="/logo.svg" width={22} height={22} alt="" aria-hidden className="rounded-md bg-white p-0.5" />Jar’ecom</div>
            </div>
            <button type="button" onClick={() => void share()} className="btn gap-2"><Icon name="share2" size={20} sw={2.2} />Bagikan kartu</button>
            {msg && <p role="status" className="help text-center">{msg}</p>}
          </section>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Group title="Suara dan gerak">
            <Toggle icon="volume" title="Suara efek" desc="Bunyi saat jawaban benar atau salah" on={snd} onChange={(v) => { setSnd(v); setSound(v) }} />
            <Toggle icon="volume" title="Suara panduan" desc="Tombol Dengarkan di tur panduan" on={vc} onChange={(v) => { setVc(v); setVoice(v) }} />
            <Toggle icon="motion" title="Kurangi animasi" desc="Matikan gerak Netty dan efek perayaan" on={red} onChange={(v) => { setRed(v); setReduce(v) }} />
            <Toggle icon="chat" title="Netty diam" desc="Sembunyikan gelembung ucapan Netty" on={quiet} onChange={(v) => { setQuiet(v); setNettyQuiet(v) }} />
          </Group>
          {bip && (
            <Group title="Aplikasi">
              <button type="button" onClick={() => void bip.prompt()} className="flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3 text-left hover:bg-bg">
                {chipIc('phone')}<span className="flex flex-1 flex-col gap-0.5"><span className="text-base font-semibold">Pasang ke layar utama</span><span className="help leading-snug">Buka Jar’ecom seperti aplikasi biasa</span></span><Icon name="arrow" size={20} sw={2.2} className="text-ink-soft" />
              </button>
            </Group>
          )}
          <Group title="Bantuan">
            <button type="button" onClick={() => { nav('/beranda'); setTour(true) }} className="flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3 text-left hover:bg-bg">
              {chipIc('help')}<span className="flex flex-1 flex-col gap-0.5"><span className="text-base font-semibold">Lihat panduan lagi</span><span className="help leading-snug">Ulangi tur singkat cara memakai Jar’ecom</span></span><Icon name="arrow" size={20} sw={2.2} className="text-ink-soft" />
            </button>
            <Row icon="book" title="Bantuan" desc="Baca langkah-langkahnya sebagai teks" to="/bantuan" />
            <Row icon="users" title="Kredit" desc="Tim pengembang, sumber, dan tentang Jar’ecom" to="/kredit" />
          </Group>
          <Group title="Akun">
            <button type="button" onClick={() => { setNote(''); setDlg('nama') }} className="flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3 text-left hover:bg-bg [&+&]:border-t [&+&]:border-[#E6EAF1]">
              {chipIc('edit')}<span className="flex flex-1 flex-col gap-0.5"><span className="text-base font-semibold">Ubah nama</span><span className="help leading-snug">Ganti nama yang tampil di profil</span></span><Icon name="arrow" size={20} sw={2.2} className="text-ink-soft" />
            </button>
            <button type="button" onClick={() => { setNote(''); setDlg('sandi') }} className="flex min-h-[72px] w-full items-center gap-3.5 border-t border-[#E6EAF1] px-4 py-3 text-left hover:bg-bg">
              {chipIc('key')}<span className="flex flex-1 flex-col gap-0.5"><span className="text-base font-semibold">Ubah kata sandi</span><span className="help leading-snug">Perbarui kata sandi akunmu</span></span><Icon name="arrow" size={20} sw={2.2} className="text-ink-soft" />
            </button>
          </Group>
          {note && <p role="status" className="help">{note}</p>}
          <p className="help">Mode data: {repo.mode === 'supabase' ? 'Supabase (tersimpan di server)' : 'lokal (tersimpan di browser ini)'}</p>
          <button type="button" onClick={async () => { await signOut(); nav('/masuk') }} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-[#C0262D] font-semibold text-[#8E1B21] transition hover:bg-fail-soft"><Icon name="logout" size={20} sw={2.2} />Keluar</button>
        </div>
      </div>
      {dlg === 'nama' && <NameDialog current={name} onClose={() => setDlg(null)} onSaved={(u) => { setUser(u); setDlg(null); setNote('Nama diperbarui.') }} />}
      {dlg === 'sandi' && <PasswordDialog onClose={() => setDlg(null)} onSaved={() => { setDlg(null); setNote('Kata sandi diperbarui.') }} />}
    </div>
  )
}

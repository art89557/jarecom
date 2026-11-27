// Daftar misi Lab (/lab): Netty, progres, filter kelompok, dan kartu misi bergambar topologi. Misi terbuka berurutan per kelompok.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/icons'
import { Netty, type Pose } from '../../components/ui'
import { LabThumb } from '../../components/Art'
import { useApp } from '../../state'
import { LabTabs } from '../Simulasi'
import { GROUPS, MISSIONS, labDone, labOpen } from '../../lib/lab'

// ---------------------------------------------------------------- Daftar misi

/** Halaman /lab: kartu enam misi, terbuka berurutan. */
export function LabList() {
  const { user } = useApp()
  const done = user ? labDone(user.id) : []
  const [tab, setTab] = useState<string>('semua') // filter kelompok misi
  const nextM = MISSIONS.find((m) => !done.includes(m.n) && labOpen(done, m.n)) // misi berikutnya yang bisa dimainkan
  // Netty berganti pose dan ucapan sesuai kelompok yang dipilih.
  const inGroup = tab === 'semua' ? nextM : MISSIONS.find((m) => m.group === tab && !done.includes(m.n) && labOpen(done, m.n))
  const allDone = tab !== 'semua' && MISSIONS.filter((m) => m.group === tab).every((m) => done.includes(m.n))
  const [pose, say]: [Pose, string] = allDone ? ['menari', 'Semua misi di kelompok ini sudah selesai. Keren!']
    : inGroup ? ['menunjuk', `Misi ${inGroup.n} siap: ${inGroup.title}.`]
    : tab === 'semua' ? ['menari', 'Semua 12 misi selesai. Kamu jago merakit jaringan!']
    : ['tidur', 'Misi di sini masih terkunci. Selesaikan kelompok sebelumnya dulu ya.']
  const tabs: [string, string][] = [['semua', 'Semua'], ...GROUPS.map(([g, gt]) => [g, gt] as [string, string])]
  return (
    <div className="flex flex-col gap-6">
      <LabTabs />
      <h1 className="sr-only">Lab Topologi: rakit jaringan seperti di Cisco Packet Tracer</h1>
      <div className="flex flex-col gap-4 rounded-[20px] bg-primary-soft px-4 py-3 sm:flex-row sm:items-center md:px-5">
        <div className="min-w-0 flex-1"><Netty pose={pose} say={say} size={84} lines={['Di Lab tidak ada kabel yang bisa putus beneran.', 'Ingat: PC ke PC pakai kabel cross.', 'Klik misi yang terbuka untuk mulai.']} /></div>
        <div className="flex shrink-0 flex-col gap-1.5 sm:w-[220px]">
          <span className="text-[15px] text-[#33415A]"><b className="text-ink">{done.length} dari {MISSIONS.length}</b> misi selesai</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={MISSIONS.length} aria-valuenow={done.length} aria-label="Misi lab selesai"><span className="block h-full rounded-full bg-primary" style={{ width: `${(done.length / MISSIONS.length) * 100}%` }} /></span>
        </div>
      </div>
      <div role="tablist" aria-label="Kelompok misi" className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {tabs.map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`min-h-[44px] shrink-0 rounded-xl px-4 text-[15px] font-semibold ${tab === k ? 'bg-ink text-white' : 'bg-white text-ink-soft border border-line hover:border-primary'}`}>{t}</button>
        ))}
      </div>
      {GROUPS.filter(([g]) => tab === 'semua' || g === tab).map(([g, gt]) => (
      <section key={g} aria-labelledby={`g-${g}`} className="flex flex-col gap-3">
        <h2 id={`g-${g}`} className="text-[20px] font-bold">{gt}</h2>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MISSIONS.filter((m) => m.group === g).map((m) => {
          const ok = done.includes(m.n), open = labOpen(done, m.n)
          const tn = ok ? 'done' : open ? 'open' : 'lock'
          const body = (
            <>
              <span className={`paper block h-[118px] w-full ${ok ? 'bg-pass-soft' : open ? 'bg-primary-soft' : 'bg-white'}`}><LabThumb n={m.n} t={tn} /></span>
              <span className="flex flex-col gap-1 p-4">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-ink-soft">Misi {m.n}</span>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${ok ? 'bg-pass-soft text-pass' : open ? 'bg-primary text-white' : 'text-ink-soft'}`}>{ok ? <><Icon name="check" size={14} sw={3} />Selesai</> : open ? 'Mulai' : <><Icon name="lock" size={14} />Terkunci</>}</span>
                </span>
                <span className="text-[18px] font-bold">{m.title}</span>
                <span className="text-[15px] leading-snug text-[#33415A]">{m.goal}</span>
              </span>
            </>
          )
          const cls = `flex h-full flex-col overflow-hidden rounded-[18px] border-[1.5px] bg-white text-left transition${nextM?.n === m.n ? ' ring-2 ring-primary' : ''}`
          return (
            <li key={m.n}>
              {open
                ? <Link to={`/lab/${m.n}`} className={`${cls} border-line hover:-translate-y-0.5 hover:border-primary hover:shadow-md`}>{body}</Link>
                : <div aria-disabled="true" className={`${cls} border-dashed border-[#CBD5E1] bg-[#FAFBFD]`}>{body}</div>}
            </li>
          )
        })}
      </ul>
      </section>))}
    </div>
  )
}


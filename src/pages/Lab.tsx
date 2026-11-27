// Lab Topologi (/lab dan /lab/:n): enam misi bergaya Cisco Packet Tracer.
// Istilah alat mengikuti Packet Tracer (bahasa Inggris) dengan keterangan kecil bahasa Indonesia.
// Aturan permainan dan pengecekan langkah ada di src/lib/lab.ts.
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/icons'
import { Back, Netty, type Pose } from '../components/ui'
import { LabThumb } from '../components/Art'
import Confirm from '../components/Confirm'
import { useApp } from '../state'
import { reduceOn } from '../lib/prefs'
import { LabTabs } from './Simulasi'
import {
  CABLE, GROUPS, LABEL, MISSIONS, MODEL, dev, freePort, ipPdu, ipNum, isEnd, labDone, labOpen, linkDown, linkOf, needKind, ping, portAt, setLabDone, validMask, wrongCable,
  type CableKind, type Dev, type DevType, type Link as Cable, type Mission, type Net, type Pdu
} from '../lib/lab'

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
              <span className={`block h-[118px] w-full ${ok ? 'bg-pass-soft' : open ? 'bg-primary-soft' : 'bg-white'}`}><LabThumb n={m.n} t={tn} /></span>
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

// ---------------------------------------------------------------- Ikon perangkat

/** Gambar garis perangkat (bukan emoji), 32 px. */
function DevIcon({ t }: { t: DevType }) {
  const p = { width: 32, height: 32, viewBox: '0 0 40 40', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (t === 'pc') return <svg {...p}><rect x="4" y="6" width="32" height="21" rx="3" /><path d="M14 34h12M20 27v7" /></svg>
  if (t === 'laptop') return <svg {...p}><rect x="8" y="8" width="24" height="16" rx="2" /><path d="M3 31h34l-3-7H6z" /></svg>
  if (t === 'router') return <svg {...p}><circle cx="20" cy="20" r="15" /><path d="M13 16h11l-3-3M27 24H16l3 3" /></svg>
  if (t === 'hub') return <svg {...p}><rect x="3" y="12" width="34" height="16" rx="3" /><circle cx="12" cy="20" r="2" /><circle cx="20" cy="20" r="2" /><circle cx="28" cy="20" r="2" /></svg>
  return <svg {...p}><rect x="3" y="12" width="34" height="16" rx="3" /><path d="M9 20h3M15 20h3M21 20h3M27 20h3" /></svg>
}

// ---------------------------------------------------------------- Halaman misi

type Tool = 'select' | 'delete' | 'place' | 'cable' | 'pdu'
type Cat = 'network' | 'end' | 'conn'
/** Paket yang sedang berjalan di mode Simulation. */
interface Anim { path: string[]; hop: number; t: number; from: string; to: string }

const W = 800, H = 520 // koordinat virtual area kerja

/** Halaman satu misi lab. */
export function LabPlay() {
  const { n } = useParams()
  const nav = useNavigate()
  const { user } = useApp()
  const m = MISSIONS.find((x) => String(x.n) === n)
  const done = user ? labDone(user.id) : []
  const blocked = !m || !labOpen(done, m.n)
  useEffect(() => { if (blocked) nav('/lab', { replace: true }) }, [blocked, nav])

  const [net, setNet] = useState<Net>(() => m?.start?.() ?? { devices: [], links: [] })
  const [cableKind, setCableKind] = useState<'auto' | CableKind>('auto')
  const [pdus, setPdus] = useState<Pdu[]>([])
  const [step, setStep] = useState(0)
  const [since, setSince] = useState(0)
  const [tool, setTool] = useState<Tool>('select')
  const [cat, setCat] = useState<Cat>('network')
  const [placeType, setPlaceType] = useState<DevType | null>(null)
  const [first, setFirst] = useState<string | null>(null) // ujung pertama kabel / pengirim PDU
  const [mode, setMode] = useState<'realtime' | 'sim'>('realtime')
  const [anim, setAnim] = useState<Anim | null>(null)
  const [events, setEvents] = useState<string[]>([])
  const [dialog, setDialog] = useState<string | null>(null)
  const [hint, setHint] = useState(true)
  const [toast, setToast] = useState<{ text: string; warn?: boolean } | null>(null)
  const [finished, setFinished] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const area = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; ox: number; oy: number; cx: number; cy: number; moved: boolean } | null>(null)

  const [mood, setMood] = useState<[Pose, string]>(['menunjuk', 'Ikuti langkah biru di bawah ya.']) // reaksi Netty
  const say = (text: string, warn = false) => { setToast({ text, warn }); if (warn) setMood(['khawatir', /salah untuk/.test(text) ? 'Kabelnya salah jenis. Lihat lampu merahnya.' : 'Ups, cek lagi ya.']) }
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t) }, [toast])

  // Kabel baru menyala oranye dulu, lalu hijau setelah 1,3 detik (seperti port switch di Packet Tracer).
  useEffect(() => {
    if (!net.links.some((l) => !l.ready)) return
    const t = setTimeout(() => setNet((p) => ({ ...p, links: p.links.map((l) => ({ ...l, ready: true })) })), 1300)
    return () => clearTimeout(t)
  }, [net.links])

  // Majukan langkah selama syaratnya terpenuhi. Kemajuan tidak mundur (seperti Completion di Packet Tracer).
  useEffect(() => {
    if (!m) return
    let i = step, s = since
    while (i < m.steps.length && m.steps[i].ok({ net, pdus: pdus.slice(s) })) { i++; s = pdus.length }
    if (i !== step) { setStep(i); setSince(s); if (i < m.steps.length) setMood(['senang', 'Langkah selesai, lanjut!']) }
    if (i === m.steps.length && !finished) { setFinished(true); setShowDone(true); setMood(['menari', 'Misi selesai! Keren!']); if (user) setLabDone(user.id, m.n) }
  }, [net, pdus, step, since, m, finished, user])

  // Gerakkan paket di mode Simulation; dengan "kurangi animasi" paket langsung sampai.
  const animRef = useRef<Anim | null>(null)
  animRef.current = anim
  const netRef = useRef(net)
  const pdusRef = useRef<Pdu[]>([])
  netRef.current = net
  useEffect(() => {
    if (!anim) return
    if (reduceOn() || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setAnim(null); finishPdu(anim.from, anim.to, true); return }
    let raf = 0, last = performance.now()
    const tick = (now: number) => {
      const a = animRef.current; if (!a) return
      let t = a.t + (now - last) / 450, hop = a.hop
      last = now
      if (t >= 1) {
        hop++; t = 0
        if (hop >= a.path.length - 1) { setAnim(null); finishPdu(a.from, a.to, true); return }
        const g = netRef.current
        setEvents((e) => [...e, hopText(g, a.path[hop - 1], a.path[hop], a.path[hop + 1])].slice(-8))
      }
      setAnim({ ...a, t, hop })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim === null])

  if (!m || blocked) return null

  /** Catat hasil PDU ke daftar. */
  function finishPdu(from: string, to: string, sim = false) {
    record({ ...makePdu(from, to, pdusRef.current.length + 1), sim })
  }
  /** Simple PDU: di misi ber-IP memakai IP tujuan, di misi lain cukup jalur kabel. */
  function makePdu(from: string, to: string, num: number): Pdu {
    const g = netRef.current, t = dev(g, to)
    if (!m?.ip) return ping(g, from, to, num)
    if (!t?.ip) return { n: num, src: dev(g, from)?.name ?? '?', dst: t?.name ?? '?', ok: false, why: `${t?.name} belum punya IP Address.`, path: [], cmd: 'pdu' }
    return ipPdu(g, from, t.ip, num, 'pdu')
  }
  /** Catat satu hasil ke PDU List (juga dipakai Command Prompt). */
  function record(r: Pdu) {
    pdusRef.current = [...pdusRef.current, r]
    setPdus(pdusRef.current)
    say(r.ok ? `Successful: ${r.src} ke ${r.dst}` : `Failed: ${r.why}`, !r.ok)
    if (r.ok) setMood(['senang', 'Paketnya sampai!'])
    setEvents((e) => [...e, r.ok ? `ICMP Echo Reply sampai di ${r.src}` : `Paket gagal: ${r.why}`].slice(-8))
  }

  // Undo: simpan keadaan area kerja sebelum setiap aksi pengguna (taruh, sambung, hapus, geser). Paling banyak 30 langkah.
  const hist = useRef<Net[]>([])
  const [, setHistLen] = useState(0)
  const snap = () => { hist.current = [...hist.current.slice(-29), netRef.current]; setHistLen(hist.current.length) }
  function undo() {
    const prev = hist.current.pop(); setHistLen(hist.current.length)
    if (!prev) return
    setNet(prev); setFirst(null); say('Aksi terakhir dibatalkan.')
  }
  const [askReset, setAskReset] = useState(false) // dialog konfirmasi Reset Activity
  // Ctrl+Z / Cmd+Z membatalkan aksi terakhir (kecuali sedang mengetik di kolom isian atau dialog perangkat terbuka).
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || e.shiftKey || dialog) return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable="true"]')) return
      e.preventDefault(); undo()
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  })

  /** Pilih alat di toolbar. */
  const pick = (t: Tool, type: DevType | null = null) => { setTool(t); setPlaceType(type); setFirst(null) }

  /** Klik area kerja kosong: taruh perangkat. Keyboard: Enter menaruh di posisi kosong berikutnya. */
  function placeAt(x: number, y: number) {
    if (tool !== 'place' || !placeType) return
    let c = 0
    while (net.devices.some((x) => x.name === `${LABEL[placeType]}${c}`)) c++
    const d: Dev = { id: `d${Date.now()}${c}`, type: placeType, name: `${LABEL[placeType]}${c}`, x, y, on: true, off: {} }
    snap()
    setNet((p) => ({ ...p, devices: [...p.devices, d] }))
  }
  function areaClick(e: React.MouseEvent<HTMLButtonElement>) {
    const r = area.current!.getBoundingClientRect()
    if (e.detail === 0) { const k = net.devices.length; placeAt(120 + (k % 5) * 140, 110 + Math.floor(k / 5) * 140); return }
    placeAt(Math.max(48, Math.min(W - 48, ((e.clientX - r.left) * W) / r.width)), Math.max(48, Math.min(H - 70, ((e.clientY - r.top) * H) / r.height)))
  }

  /** Klik perangkat: tergantung alat yang aktif. */
  function devClick(id: string) {
    const d = dev(net, id)!
    if (tool === 'delete') {
      snap()
      setNet((p) => ({ devices: p.devices.filter((x) => x.id !== id), links: p.links.filter((l) => l.a !== id && l.b !== id) }))
      return say(`${d.name} dihapus beserta kabelnya.`)
    }
    if (tool === 'cable') {
      if (!first) { if (!freePort(net, d)) return say(`${d.name} hanya punya 1 port (FastEthernet0) dan sudah terpakai.`, true); setFirst(id); return say(`Kabel dari ${d.name}. Klik perangkat tujuan.`) }
      if (first === id) { setFirst(null); return }
      const a = dev(net, first)!
      if (linkOf(net, a.id, d.id)) { setFirst(null); return say(`${a.name} dan ${d.name} sudah tersambung.`, true) }
      const pa = freePort(net, a), pb = freePort(net, d)
      if (!pa || !pb) { setFirst(null); return say(`Port ${!pa ? a.name : d.name} sudah penuh.`, true) }
      const need = needKind(a.type, d.type)
      const kind = cableKind === 'auto' ? need : cableKind
      const l: Cable = { id: `l${Date.now()}`, a: a.id, b: d.id, pa, pb, ready: false, kind, manual: cableKind !== 'auto' }
      snap()
      setNet((p) => ({ ...p, links: [...p.links, l] }))
      setFirst(null)
      if (kind !== need) return say(`Kabel ${CABLE[kind]} salah untuk ${a.name}–${d.name}: lampu merah. Yang benar ${CABLE[need]}.`, true)
      return say(`Tersambung (${CABLE[kind]}): ${a.name} ${pa} ke ${d.name} ${pb}. Tunggu lampu hijau.`)
    }
    if (tool === 'pdu') {
      if (!isEnd(d)) return say('Simple PDU dikirim dari PC atau Laptop.', true)
      if (!first) { setFirst(id); return say(`Pengirim: ${d.name}. Klik PC tujuan.`) }
      if (first === id) { setFirst(null); return }
      const from = first; setFirst(null)
      if (mode === 'realtime' || anim) return finishPdu(from, id)
      const path = makePdu(from, id, 0).path
      setEvents([`ICMP Echo Request dibuat di ${dev(net, from)?.name} untuk ${d.name}`])
      if (path.length < 2) return finishPdu(from, id)
      setAnim({ path: [...path, ...path.slice(0, -1).reverse()], hop: 0, t: 0, from, to: id })
      return
    }
    if (tool === 'select') setDialog(id)
  }

  // Geser perangkat dengan alat Select.
  function down(e: RPE, id: string) {
    if (tool !== 'select') return
    const d = dev(net, id)!
    drag.current = { id, ox: d.x, oy: d.y, cx: e.clientX, cy: e.clientY, moved: false }
  }
  function move(e: RPE) {
    const g = drag.current; if (!g) return
    const r = area.current!.getBoundingClientRect()
    const dx = ((e.clientX - g.cx) * W) / r.width, dy = ((e.clientY - g.cy) * H) / r.height
    if (!g.moved && Math.hypot(dx, dy) < 6) return
    if (!g.moved) snap() // satu langkah undo per geseran
    g.moved = true
    const x = Math.max(48, Math.min(W - 48, g.ox + dx)), y = Math.max(48, Math.min(H - 70, g.oy + dy))
    setNet((p) => ({ ...p, devices: p.devices.map((d) => (d.id === g.id ? { ...d, x, y } : d)) }))
  }
  const up = () => { setTimeout(() => (drag.current = null), 0) }
  const wasDrag = () => !!drag.current?.moved

  function cableClick(l: Cable) {
    if (tool !== 'delete') return say('Untuk mencabut kabel, pilih alat Delete lalu klik kabelnya.')
    snap()
    setNet((p) => ({ ...p, links: p.links.filter((x) => x.id !== l.id) }))
    say(`Kabel ${dev(net, l.a)?.name}–${dev(net, l.b)?.name} dicabut.`)
  }

  function reset(mm: Mission | undefined = m) {
    hist.current = []; setHistLen(0)
    setMood(['menunjuk', 'Mulai lagi dari awal. Semangat!']); setNet(mm?.start?.() ?? { devices: [], links: [] }); pdusRef.current = []; setPdus([]); setStep(0); setSince(0); setEvents([]); setAnim(null)
    setFinished(false); setShowDone(false); pick('select'); say('Activity di-reset. Mulai dari langkah 1.')
  }

  const pct = Math.round((Math.min(step, m.steps.length) / m.steps.length) * 100)
  const cur = m.steps[Math.min(step, m.steps.length - 1)]
  const next = MISSIONS.find((x) => x.n === m.n + 1)
  const status = tool === 'place' && placeType ? `Klik area kerja untuk menaruh ${MODEL[placeType]}.`
    : tool === 'cable' ? (first ? `Kabel dari ${dev(net, first)?.name}: klik perangkat tujuan.` : 'Kabel Automatic: klik perangkat pertama.')
    : tool === 'pdu' ? (first ? `Pengirim ${dev(net, first)?.name}: klik PC tujuan.` : 'Add Simple PDU: klik PC pengirim.')
    : tool === 'delete' ? 'Delete: klik perangkat atau kabel yang mau dihapus.' : 'Select: klik perangkat untuk membuka, seret untuk memindah.'

  return (
    <div className="-mx-1 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Back to="/lab">Lab Topologi</Back>
        <div className="mr-auto">
          <h1 className="font-display text-[24px] font-bold tracking-tight md:text-[28px]">Misi {m.n} · {m.title}</h1>
        </div>
        <ToolBtn on={hint} onClick={() => setHint((h) => !h)} label="Petunjuk"><Icon name="help" size={20} /></ToolBtn>
        <ToolBtn onClick={() => undo()} label="Undo" sub="Batalkan (Ctrl+Z)" disabled={hist.current.length === 0}><Icon name="undo" size={20} /></ToolBtn>
        <ToolBtn onClick={() => (net.devices.length || pdus.length ? setAskReset(true) : reset())} label="Reset Activity" sub="Ulang dari awal"><Icon name="repeat" size={20} /></ToolBtn>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 lg:row-span-2">
        {/* Instructions: seperti jendela Activity di Packet Tracer */}
        <section aria-labelledby="ins" className="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-line bg-white p-4">
          <h2 id="ins" className="text-[18px] font-bold">Instructions <span className="text-[14px] font-medium text-ink-soft">· petunjuk misi</span></h2>
          <p className="text-[15px] leading-snug text-[#33415A]">{m.goal}</p>
          <Netty pose={mood[0]} say={mood[1]} size={64} lines={['Aku pantau kabelnya.', 'Pelan-pelan saja.']} />
          <div>
            <p className="text-[14px] font-bold">Completion: {pct}%</p>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#E2E8F0]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Completion"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} /></div>
          </div>
          <ol className="flex flex-col gap-1">
            {m.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 py-1 text-[15px] leading-snug" aria-current={i === step ? 'step' : undefined}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${i < step ? 'bg-[#16A34A] text-white' : i === step ? 'bg-primary text-white' : 'bg-[#F1F5F9] text-[#475569]'}`}>{i < step ? <Icon name="check" size={14} sw={3} /> : i + 1}</span>
                <span className={i < step ? 'text-[#475569] line-through' : i === step ? 'font-bold' : 'text-[#475569]'}>{s.text}</span>
              </li>
            ))}
          </ol>
          {hint && step < m.steps.length && <p className="rounded-xl bg-[#EEF2FF] px-3.5 py-3 text-[15px] leading-relaxed text-[#1E3A8A]">{cur.hint}</p>}
          {m.table && (
            <div>
              <h3 className="text-[16px] font-bold">Addressing Table <span className="text-[14px] font-medium text-ink-soft">· tabel alamat</span></h3>
              <div className="mt-1.5 overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead><tr className="text-ink-soft"><th className="py-1 pr-2 font-semibold">Perangkat</th><th className="py-1 font-semibold">IP, Mask, Gateway</th></tr></thead>
                  <tbody>{m.table.map((r, i) => <tr key={i} className="border-t border-[#E6EAF1] align-top"><td className="py-1.5 pr-2"><b>{r.dev}</b><br /><span className="text-ink-soft">{r.iface}</span></td><td className="py-1.5 font-mono">{r.ip}<br /><span className="text-ink-soft">{r.mask}</span>{r.gw !== '-' && <><br /><span className="font-sans">GW </span>{r.gw}</>}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Daftar PDU dan Event List */}
        <section aria-labelledby="pdu" className="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-line bg-white p-4">
          <h2 id="pdu" className="text-[18px] font-bold">PDU List <span className="text-[14px] font-medium text-ink-soft">· hasil ping</span></h2>
          {pdus.length === 0 ? <p className="help">Belum ada PDU. Pilih Add Simple PDU, klik PC pengirim lalu PC tujuan.</p> : (
            <ul className="flex flex-col gap-1.5">
              {pdus.slice(-6).reverse().map((p) => (
                <li key={p.n} className="flex items-center justify-between gap-2 rounded-lg bg-bg px-2.5 py-2 text-[14px]">
                  <span className="truncate">#{p.n} {p.cmd === 'ping' ? 'ping ' : p.cmd === 'tracert' ? 'tracert ' : ''}{p.src} → {p.dst}</span>
                  <span className={`shrink-0 font-bold ${p.ok ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>{p.ok ? 'Successful' : 'Failed'}</span>
                </li>))}
            </ul>)}
          {mode === 'sim' && <>
            <h3 className="text-[16px] font-bold">Event List <span className="text-[14px] font-medium text-ink-soft">· jejak paket</span></h3>
            {events.length === 0 ? <p className="help">Kirim PDU di mode Simulation untuk melihat paket berjalan per hop.</p>
              : <ol className="flex flex-col gap-1 text-[14px] leading-snug text-[#33415A]">{events.map((e, i) => <li key={i}>{e}</li>)}</ol>}
          </>}
          <p className="help mt-auto">Segitiga hijau = port aktif. Bulat oranye = port bersiap. Segitiga merah = port mati atau kabel salah jenis.</p>
        </section>
        </div>
        {/* Area kerja */}
        <section aria-label="Area kerja" className="order-first flex min-w-0 flex-col lg:order-none overflow-hidden rounded-[18px] border-[1.5px] border-line bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-2.5">
            <ToolBtn on={tool === 'select'} onClick={() => pick('select')} label="Select"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d="M5 3l14 8-6 2-3 6z" /></svg></ToolBtn>
            <ToolBtn on={tool === 'delete'} onClick={() => pick('delete')} label="Delete"><Icon name="x" size={18} sw={2.6} /></ToolBtn>
            <ToolBtn on={tool === 'pdu'} onClick={() => pick('pdu')} label="Add Simple PDU"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg></ToolBtn>
            <span className="ml-auto inline-flex overflow-hidden rounded-xl border border-line" role="group" aria-label="Mode">
              {(['realtime', 'sim'] as const).map((k) => (
                <button key={k} type="button" aria-pressed={mode === k} onClick={() => { setMode(k); setAnim(null) }} className={`min-h-[44px] px-3.5 text-[14px] font-semibold ${mode === k ? 'bg-primary text-white' : 'bg-white text-ink'}`}>{k === 'realtime' ? 'Realtime' : 'Simulation'}</button>
              ))}
            </span>
          </div>
          <p className="border-b border-line bg-primary-soft px-3 py-2 text-[15px] font-semibold text-[#1B46D1] lg:hidden">{step < m.steps.length ? `Langkah ${step + 1}/${m.steps.length}: ${cur.text}` : 'Semua langkah selesai'}</p>
          <p className="border-b border-line bg-bg px-3 py-2 text-[14px] text-[#33415A]" aria-live="polite">{status}</p>

          <div ref={area} onPointerMove={move} onPointerUp={up} onPointerLeave={up} className="lab-grid relative w-full touch-none select-none" style={{ aspectRatio: `${W} / ${H}`, minHeight: 320 }}>
            <button type="button" aria-label={tool === 'place' ? 'Logical Workspace: taruh perangkat' : 'Logical Workspace'} onClick={areaClick} className={`absolute inset-0 h-full w-full ${tool === 'place' ? 'cursor-crosshair' : 'cursor-default'}`} />
            {!net.devices.length && <p className="pointer-events-none absolute inset-x-4 top-[42%] text-center text-[15px] leading-relaxed text-[#475569]">Logical Workspace masih kosong.<br />Buka <b>Network Devices</b> di bawah, pilih <b>Switch 2960</b>, lalu klik di sini.</p>}

            {/* Kabel */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
              {net.links.map((l) => { const a = dev(net, l.a)!, b = dev(net, l.b)!; const dn = linkDown(net, l); return <line key={l.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={dn ? '#DC2626' : '#0F172A'} strokeWidth={2.5} strokeDasharray={l.kind === 'cross' ? '7 5' : undefined} vectorEffect="non-scaling-stroke" /> })}
            </svg>
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {net.links.map((l) => { const a = dev(net, l.a)!, b = dev(net, l.b)!; return (
                <line key={l.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={22} vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'stroke' }} className={tool === 'delete' ? 'cursor-pointer' : ''} onClick={() => cableClick(l)}>
                  <title>{`Kabel ${a.name} ${l.pa} – ${b.name} ${l.pb}`}</title>
                </line>) })}
            </svg>
            {/* Lampu port: segitiga hijau = up, segitiga merah = down, bulat oranye = menyiapkan */}
            {net.links.flatMap((l) => [l.a, l.b].map((end) => {
              const a = dev(net, end)!, b = dev(net, end === l.a ? l.b : l.a)!
              const x = a.x + (b.x - a.x) * 0.28, y = a.y + (b.y - a.y) * 0.28
              const dn = linkDown(net, l)
              return (
                <span key={l.id + end} aria-hidden className="pointer-events-none absolute z-[3] -translate-x-1/2 -translate-y-1/2" style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}>
                  {dn ? <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="1,1 13,1 7,13" fill="#DC2626" stroke="#fff" strokeWidth="1.5" /></svg>
                    : l.ready ? <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 13,13 1,13" fill="#16A34A" stroke="#fff" strokeWidth="1.5" /></svg>
                    : <svg className="lab-blink" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="#F59E0B" stroke="#fff" strokeWidth="1.5" /></svg>}
                </span>)
            }))}

            {/* Perangkat */}
            {net.devices.map((d) => {
              const core = !isEnd(d)
              const sel = first === d.id
              return (
                <button key={d.id} type="button" aria-label={`${d.name}, ${MODEL[d.type]}${d.on ? '' : ', mati'}`}
                  onPointerDown={(e) => down(e, d.id)} onClick={() => { if (!wasDrag()) devClick(d.id) }}
                  className="absolute z-[2] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-xl p-1"
                  style={{ left: `${(d.x / W) * 100}%`, top: `${(d.y / H) * 100}%` }}>
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 ${core ? 'border-primary bg-[#E8EEFE] text-primary' : 'border-[#CBD5E1] bg-white text-ink'} ${sel ? 'ring-4 ring-[#F59E0B]' : ''} ${d.on ? '' : 'opacity-45 grayscale'}`}><DevIcon t={d.type} /></span>
                  <span className="rounded-md bg-white/90 px-1.5 text-[14px] font-bold leading-tight">{d.name}</span>
                </button>)
            })}

            {/* Paket (mode Simulation) */}
            {anim && dev(net, anim.path[anim.hop])?.type === 'hub' && net.links.filter((l) => (l.a === anim.path[anim.hop] || l.b === anim.path[anim.hop]) && !linkDown(net, l)).map((l) => {
              const h = dev(net, anim.path[anim.hop])!, o = dev(net, l.a === h.id ? l.b : l.a)!
              if (o.id === anim.path[anim.hop + 1] || o.id === anim.path[anim.hop - 1]) return null
              const x = h.x + (o.x - h.x) * anim.t, y = h.y + (o.y - h.y) * anim.t
              return <span key={l.id} aria-hidden className="pointer-events-none absolute z-[4] flex h-6 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-[#94A3B8] text-white" style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg></span>
            })}
            {anim && (() => {
              const a = dev(net, anim.path[anim.hop]), b = dev(net, anim.path[anim.hop + 1]); if (!a || !b) return null
              const x = a.x + (b.x - a.x) * anim.t, y = a.y + (b.y - a.y) * anim.t
              const reply = anim.hop >= (anim.path.length - 1) / 2
              return <span aria-hidden className={`pointer-events-none absolute z-[4] flex h-6 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md text-white ${reply ? 'bg-[#7C3AED]' : 'bg-primary'}`} style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg></span>
            })()}

            {toast && <div role="status" className={`pointer-events-none absolute inset-x-3 top-3 z-[5] mx-auto max-w-xl rounded-xl border px-4 py-2.5 text-center text-[15px] font-semibold ${toast.warn ? 'border-[#FCD34D] bg-[#FFFBEB] text-[#78350F]' : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]'}`}>{toast.text}</div>}
          </div>

          {/* Palet perangkat di kiri bawah, seperti Packet Tracer */}
          <div className="flex flex-col gap-2 border-t border-line p-2.5">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Kategori perangkat">
              {([['network', 'Network Devices'], ['end', 'End Devices'], ['conn', 'Connections']] as const).map(([k, t]) => (
                <button key={k} type="button" aria-pressed={cat === k} onClick={() => setCat(k)} className={`min-h-[44px] rounded-xl border px-3 text-[14px] font-bold ${cat === k ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>{t}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {cat === 'network' && (['router', 'switch', 'hub'] as DevType[]).map((t) => <PaletteBtn key={t} on={tool === 'place' && placeType === t} onClick={() => pick('place', t)} t={t} />)}
              {cat === 'end' && (['pc', 'laptop'] as DevType[]).map((t) => <PaletteBtn key={t} on={tool === 'place' && placeType === t} onClick={() => pick('place', t)} t={t} />)}
              {cat === 'conn' && ([['auto', 'Automatic', 'Pilih jenis otomatis'], ['straight', 'Copper Straight-Through', 'Kabel lurus'], ['cross', 'Copper Cross-Over', 'Kabel silang']] as const).map(([k, t, sub]) => (
                <button key={k} type="button" aria-pressed={tool === 'cable' && cableKind === k} onClick={() => { pick('cable'); setCableKind(k) }} className={`flex min-h-[52px] items-center gap-2 rounded-xl border-2 px-3 text-left ${tool === 'cable' && cableKind === k ? 'border-primary bg-primary-soft' : 'border-line bg-white'}`}>
                  {k === 'auto' ? <Icon name="zap" size={22} /> : <svg width="26" height="22" viewBox="0 0 26 22" aria-hidden><path d={k === 'straight' ? 'M2 20 24 2' : 'M2 20 24 2'} stroke="#0F172A" strokeWidth="2.4" strokeDasharray={k === 'cross' ? '4 3' : undefined} /></svg>}
                  <span><span className="block text-[14px] font-bold">{t}</span><span className="block text-[14px] text-ink-soft">{sub}</span></span>
                </button>
              ))}
            </div>
          </div>
        </section>

      </div>

      {dialog && dev(net, dialog) && <DeviceDialog d={dev(net, dialog)!} net={net} onCmd={(src, kind, ip) => { const r = ipPdu(netRef.current, src, ip, pdusRef.current.length + 1, kind); record(r); return r }} onClose={() => setDialog(null)} onChange={(nd) => setNet((p) => ({ ...p, devices: p.devices.map((x) => (x.id === nd.id ? nd : x)) }))} />}

      {askReset && <Confirm title="Reset Activity?" body="Semua perangkat, kabel, dan hasil ping di area kerja akan dihapus, dan langkah mulai lagi dari 1." ok="Ya, reset" cancel="Batal" onOk={() => { setAskReset(false); reset() }} onCancel={() => setAskReset(false)} />}
      {showDone && !dialog && (
        <div role="dialog" aria-modal="true" aria-labelledby="done" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4">
          <div className="pop w-full max-w-md rounded-[22px] bg-white p-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#15803D]"><Icon name="check" size={30} sw={2.6} /></span>
            <h2 id="done" className="mt-3 text-[22px] font-bold">Misi {m.title} selesai!</h2>
            <p className="mt-1 text-[14px] font-bold text-ink-soft">Completion 100%</p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#33415A]">{m.lesson}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => setShowDone(false)} className="min-h-[52px] flex-1 rounded-2xl border-2 border-line px-4 font-semibold">Coba-coba lagi</button>
              {next ? <button type="button" onClick={() => { setShowDone(false); reset(next); nav(`/lab/${next.n}`) }} className="btn flex-1">Lanjut: Misi {next.title.replace('Topologi ', '')}</button>
                : <Link to="/lab" className="btn flex-1">Kembali ke daftar misi</Link>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Kalimat Event List untuk paket yang tiba di `at`: hub menyalin ke semua port, switch hanya ke port tujuan. */
function hopText(n: Net, prev: string | undefined, at: string, next: string): string {
  const d = dev(n, at), nx = dev(n, next)
  if (!d || !nx) return ''
  if (d.type === 'hub') {
    const all = n.links.filter((l) => (l.a === at || l.b === at) && !linkDown(n, l)).map((l) => dev(n, l.a === at ? l.b : l.a)!).filter((o) => o.id !== prev).map((o) => o.name)
    return `${d.name} (Layer 1): salin ke SEMUA port: ${all.join(', ')}`
  }
  const l = linkOf(n, at, next)
  if (d.type === 'switch') return `${d.name} (Layer 2): teruskan hanya ke ${l ? portAt(l, at).replace('Fa', 'FastEthernet') : 'port'} (${nx.name})`
  if (d.type === 'router') return `${d.name} (Layer 3): arahkan ke jaringan lain lewat ${l ? portAt(l, at) : 'port'} (${nx.name})`
  return `${d.name}: kirim ke ${nx.name}`
}

/** Tombol alat dengan label Packet Tracer dan keterangan kecil opsional. */
function ToolBtn({ on = false, onClick, label, sub, disabled = false, children }: { on?: boolean; onClick: () => void; label: string; sub?: string; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} title={sub} disabled={disabled} className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${on ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:bg-bg'}`}>
      {children}{label}
    </button>
  )
}

/** Satu perangkat di palet. */
function PaletteBtn({ t, on, onClick }: { t: DevType; on: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`flex min-h-[52px] items-center gap-2 rounded-xl border-2 px-3 text-left ${on ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-white'}`}>
      <DevIcon t={t} /><span><span className="block text-[14px] font-bold text-ink">{t === 'switch' ? 'Switch 2960' : t === 'router' ? 'Router 1941' : MODEL[t]}</span><span className="block text-[14px] text-ink-soft">{LABEL[t]}</span></span>
    </button>
  )
}

/** Kolom isian alamat IP dengan peringatan format. */
function IpField({ label, value, onChange, mask = false }: { label: string; value?: string; onChange: (v: string) => void; mask?: boolean }) {
  const v = value ?? ''
  const bad = v !== '' && (mask ? !validMask(v) : ipNum(v) === null)
  const id = useMemo(() => `ip-${Math.random().toString(36).slice(2)}`, [])
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[14px] font-semibold">{label}</label>
      <input id={id} inputMode="decimal" autoComplete="off" spellCheck={false} value={v} onChange={(e) => onChange(e.target.value.trim())} placeholder={mask ? '255.255.255.0' : '192.168.1.10'}
        aria-invalid={bad} className={`min-h-[44px] rounded-xl border-2 px-3 font-mono text-[15px] outline-none focus:border-primary ${bad ? 'border-[#DC2626]' : 'border-line'}`} />
      {bad && <span className="text-[14px] text-[#B91C1C]">{mask ? 'Mask tidak sah, contoh 255.255.255.0' : 'Format IP: empat angka 0-255 dipisah titik'}</span>}
    </div>
  )
}

type Cmd = (src: string, kind: 'ping' | 'tracert', ip: string) => Pdu

/** Command Prompt sederhana: ipconfig, ping, tracert, help, cls. */
function Prompt({ d, onCmd }: { d: Dev; onCmd: Cmd }) {
  const [lines, setLines] = useState<string[]>(['Packet Tracer PC Command Line 1.0', 'Ketik help untuk daftar perintah.'])
  const [cmd, setCmd] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [lines])
  function run(e: React.FormEvent) {
    e.preventDefault()
    const c = cmd.trim(); setCmd(''); if (!c) return
    const [w, arg] = c.split(/\s+/)
    const out: string[] = [`C:\\>${c}`]
    if (w === 'cls') return setLines([])
    if (w === 'help') out.push('ipconfig       tampilkan IP perangkat ini', 'ping <IP>      uji sambungan ke IP tujuan', 'tracert <IP>   lihat lompatan menuju IP tujuan', 'cls            bersihkan layar')
    else if (w === 'ipconfig') out.push('FastEthernet0 Connection:', `   IPv4 Address. . . . : ${d.ip || '0.0.0.0'}`, `   Subnet Mask . . . . : ${d.mask || '0.0.0.0'}`, `   Default Gateway . . : ${d.gw || '0.0.0.0'}`)
    else if ((w === 'ping' || w === 'tracert') && arg) {
      const r = onCmd(d.id, w, arg)
      if (w === 'ping') {
        out.push(`Pinging ${arg} with 32 bytes of data:`)
        for (let i = 0; i < 4; i++) out.push(r.ok ? `Reply from ${arg}: bytes=32 time<1ms TTL=128` : 'Request timed out.')
        out.push(`Ping statistics for ${arg}: Sent = 4, Received = ${r.ok ? 4 : 0}, Lost = ${r.ok ? 0 : 4} (${r.ok ? 0 : 100}% loss)`)
        if (!r.ok && r.why) out.push(`Catatan: ${r.why}`)
      } else {
        out.push(`Tracing route to ${arg} over a maximum of 30 hops:`)
        ;(r.hops ?? []).forEach((h, i) => out.push(`  ${i + 1}   0 ms   0 ms   0 ms   ${h}`))
        if (!r.ok) out.push(`  ${(r.hops?.length ?? 0) + 1}   *   *   *   Request timed out.`, `Catatan: ${r.why}`)
        out.push('Trace complete.')
      }
    } else out.push(`Invalid Command. Contoh: ping 192.168.1.11`)
    setLines((l) => [...l, ...out, ''].slice(-60))
  }
  return (
    <div className="mt-3 overflow-hidden rounded-xl bg-[#0F172A] text-[#E2E8F0]">
      <div className="max-h-56 overflow-y-auto whitespace-pre-wrap px-3 py-2 font-mono text-[14px] leading-snug" aria-live="polite">{lines.join('\n')}<div ref={end} /></div>
      <form onSubmit={run} className="flex items-center gap-2 border-t border-[#334155] px-3">
        <label htmlFor="cmd" className="font-mono text-[14px]">C:\&gt;</label>
        <input id="cmd" value={cmd} onChange={(e) => setCmd(e.target.value)} autoComplete="off" spellCheck={false} className="min-h-[44px] flex-1 bg-transparent font-mono text-[15px] text-white outline-none" placeholder="ping 192.168.1.11" />
        <button type="submit" className="min-h-[44px] rounded-lg px-3 text-[14px] font-bold text-[#93C5FD]">Enter</button>
      </form>
    </div>
  )
}

/** Jendela perangkat seperti Packet Tracer: Physical (Power), Config (port), Desktop (IP Configuration dan Command Prompt). */
function DeviceDialog({ d, net, onClose, onChange, onCmd }: { d: Dev; net: Net; onClose: () => void; onChange: (d: Dev) => void; onCmd: Cmd }) {
  const end = isEnd(d)
  const [tab, setTab] = useState<'physical' | 'config' | 'desktop'>(end ? 'desktop' : 'config')
  const [app, setApp] = useState<'ip' | 'cmd'>('ip')
  const ports = useMemo(() => net.links.filter((l) => l.a === d.id || l.b === d.id).map((l) => ({ port: portAt(l, d.id), to: dev(net, l.a === d.id ? l.b : l.a)?.name, wrong: wrongCable(net, l) })), [net, d.id])
  const routerPorts = d.type === 'router' ? ['Gig0/0', 'Gig0/1'] : []
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.focus(); const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [onClose])
  const portName = (p: string) => (p.startsWith('Gig') ? 'GigabitEthernet' + p.slice(3) : 'FastEthernet' + p.slice(2))
  const tabs: ('physical' | 'config' | 'desktop')[] = end ? ['physical', 'config', 'desktop'] : ['physical', 'config']
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="devt" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4" onClick={onClose}>
      <div ref={ref} tabIndex={-1} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[22px] bg-white p-5 outline-none">
        <div className="flex items-center justify-between gap-3">
          <h2 id="devt" className="text-[20px] font-bold">{d.name} <span className="text-[14px] font-medium text-ink-soft">{MODEL[d.type]}</span></h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-bg"><Icon name="x" size={20} /></button>
        </div>
        <div className="mt-3 flex gap-2" role="tablist">
          {tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`min-h-[44px] rounded-xl px-4 text-[14px] font-bold ${tab === t ? 'bg-ink text-white' : 'bg-bg'}`}>{t === 'physical' ? 'Physical' : t === 'config' ? 'Config' : 'Desktop'}</button>)}
        </div>
        {tab === 'physical' && (
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={() => onChange({ ...d, on: !d.on })} aria-pressed={d.on} className={`flex h-14 w-14 items-center justify-center rounded-full border-4 ${d.on ? 'border-[#16A34A] text-[#16A34A]' : 'border-[#94A3B8] text-[#64748B]'}`} aria-label={d.on ? 'Matikan perangkat' : 'Nyalakan perangkat'}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0" /></svg>
            </button>
            <p className="text-[15px] leading-snug">Power: <b>{d.on ? 'Menyala' : 'Mati'}</b><br /><span className="text-ink-soft">Tekan tombol untuk menyalakan atau mematikan.</span></p>
          </div>
        )}
        {tab === 'config' && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-[14px] font-bold uppercase tracking-wider text-ink-soft">Interface</p>
            {d.type === 'router' && routerPorts.map((p) => {
              const c = ports.find((x) => x.port === p)
              const v = d.ips?.[p] ?? { ip: '', mask: '' }
              const set = (k: 'ip' | 'mask', val: string) => onChange({ ...d, ips: { ...d.ips, [p]: { ...v, [k]: val } } })
              return (
                <div key={p} className="flex flex-col gap-2 rounded-xl bg-bg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[15px]"><b>{portName(p)}</b><br /><span className="text-[14px] text-ink-soft">{c ? `ke ${c.to}` : 'belum tersambung'}</span></span>
                    <PortToggle on={!d.off[p]} onToggle={() => onChange({ ...d, off: { ...d.off, [p]: !d.off[p] } })} />
                  </div>
                  <IpField label="IPv4 Address" value={v.ip} onChange={(x) => set('ip', x)} />
                  <IpField label="Subnet Mask" value={v.mask} onChange={(x) => set('mask', x)} mask />
                </div>)
            })}
            {d.type !== 'router' && (ports.length === 0 ? <p className="help">Belum ada kabel tersambung ke perangkat ini.</p> : (
              <ul className="flex flex-col gap-2">
                {ports.map((p) => (
                  <li key={p.port} className="flex items-center justify-between gap-3 rounded-xl bg-bg px-3 py-2">
                    <span className="text-[15px]"><b>{portName(p.port)}</b><br /><span className="text-[14px] text-ink-soft">ke {p.to}{p.wrong ? ' · kabel salah jenis' : ''}</span></span>
                    <PortToggle on={!d.off[p.port]} onToggle={() => onChange({ ...d, off: { ...d.off, [p.port]: !d.off[p.port] } })} />
                  </li>))}
              </ul>))}
          </div>
        )}
        {tab === 'desktop' && (
          <div className="mt-4">
            <div className="flex gap-2">
              {([['ip', 'IP Configuration'], ['cmd', 'Command Prompt']] as const).map(([k, t]) => <button key={k} type="button" aria-pressed={app === k} onClick={() => setApp(k)} className={`min-h-[44px] flex-1 rounded-xl border-2 px-3 text-[14px] font-bold ${app === k ? 'border-primary bg-primary-soft text-[#1B46D1]' : 'border-line'}`}>{t}</button>)}
            </div>
            {app === 'ip' ? (
              <div className="mt-3 flex flex-col gap-3">
                <p className="text-[14px] text-ink-soft">Static. Perubahan langsung tersimpan.</p>
                <IpField label="IPv4 Address" value={d.ip} onChange={(v) => onChange({ ...d, ip: v })} />
                <IpField label="Subnet Mask" value={d.mask} onChange={(v) => onChange({ ...d, mask: v })} mask />
                <IpField label="Default Gateway" value={d.gw} onChange={(v) => onChange({ ...d, gw: v })} />
              </div>
            ) : <Prompt d={d} onCmd={onCmd} />}
          </div>
        )}
      </div>
    </div>
  )
}

/** Saklar Port Status On/Off. */
function PortToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <label className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 text-[14px] font-semibold">
      Port Status
      <input type="checkbox" className="h-5 w-5 accent-[#2457F5]" checked={on} onChange={onToggle} />
      {on ? 'On' : 'Off'}
    </label>
  )
}

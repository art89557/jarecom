// Lab Topologi (/lab dan /lab/:n): enam misi bergaya Cisco Packet Tracer.
// Istilah alat mengikuti Packet Tracer (bahasa Inggris) dengan keterangan kecil bahasa Indonesia.
// Aturan permainan dan pengecekan langkah ada di src/lib/lab.ts.
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/icons'
import { Back } from '../components/ui'
import { useApp } from '../state'
import { reduceOn } from '../lib/prefs'
import {
  LABEL, MISSIONS, MODEL, dev, freePort, isEnd, labDone, labOpen, linkDown, linkOf, ping, portAt, setLabDone,
  type Dev, type DevType, type Link as Cable, type Net, type Pdu
} from '../lib/lab'

// ---------------------------------------------------------------- Daftar misi

/** Halaman /lab: kartu enam misi, terbuka berurutan. */
export function LabList() {
  const { user } = useApp()
  const done = user ? labDone(user.id) : []
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-tight md:text-[34px]">Lab Topologi</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-[#33415A]">Rakit jaringan sendiri seperti di Cisco Packet Tracer: taruh switch dan PC, pasang kabel, lalu kirim Simple PDU untuk membuktikan cara kerja tiap topologi. Misi terbuka berurutan.</p>
      </header>
      <p className="help -mt-2">Paling pas setelah menyelesaikan Level 3: Topologi Jaringan. Paling nyaman dipakai di laptop atau tablet.</p>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MISSIONS.map((m) => {
          const ok = done.includes(m.n), open = labOpen(done, m.n)
          const body = (
            <>
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${ok ? 'bg-[#DCFCE7] text-[#15803D]' : open ? 'bg-primary-soft text-[#1B46D1]' : 'bg-[#E4E9F2] text-[#4A5568]'}`}>
                {ok ? <Icon name="check" size={24} sw={2.6} /> : open ? <span className="font-display text-xl font-bold">{m.n}</span> : <Icon name="lock" size={22} />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-bold uppercase tracking-wider text-ink-soft">Misi {m.n} · {ok ? 'Selesai' : open ? 'Terbuka' : 'Terkunci'}</span>
                <span className="text-[18px] font-bold">{m.title}</span>
                <span className="text-[15px] leading-snug text-[#33415A]">{m.goal}</span>
              </span>
            </>
          )
          const cls = 'flex h-full min-h-[112px] items-start gap-3.5 rounded-[18px] border-[1.5px] bg-white p-4 text-left'
          return (
            <li key={m.n}>
              {open
                ? <Link to={`/lab/${m.n}`} className={`${cls} border-line hover:border-primary`}>{body}</Link>
                : <div aria-disabled="true" className={`${cls} border-line opacity-70`}>{body}</div>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------- Ikon perangkat

/** Gambar garis perangkat (bukan emoji), 32 px. */
function DevIcon({ t }: { t: DevType }) {
  const p = { width: 32, height: 32, viewBox: '0 0 40 40', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (t === 'pc') return <svg {...p}><rect x="4" y="6" width="32" height="21" rx="3" /><path d="M14 34h12M20 27v7" /></svg>
  if (t === 'laptop') return <svg {...p}><rect x="8" y="8" width="24" height="16" rx="2" /><path d="M3 31h34l-3-7H6z" /></svg>
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

  const [net, setNet] = useState<Net>({ devices: [], links: [] })
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
  const counters = useRef<Record<string, number>>({})
  const area = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; ox: number; oy: number; cx: number; cy: number; moved: boolean } | null>(null)

  const say = (text: string, warn = false) => setToast({ text, warn })
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
    if (i !== step) { setStep(i); setSince(s) }
    if (i === m.steps.length && !finished) { setFinished(true); setShowDone(true); if (user) setLabDone(user.id, m.n) }
  }, [net, pdus, step, since, m, finished, user])

  // Gerakkan paket di mode Simulation; dengan "kurangi animasi" paket langsung sampai.
  const animRef = useRef<Anim | null>(null)
  animRef.current = anim
  const netRef = useRef(net)
  const pdusRef = useRef<Pdu[]>([])
  netRef.current = net
  useEffect(() => {
    if (!anim) return
    if (reduceOn() || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setAnim(null); finishPdu(anim.from, anim.to); return }
    let raf = 0, last = performance.now()
    const tick = (now: number) => {
      const a = animRef.current; if (!a) return
      let t = a.t + (now - last) / 450, hop = a.hop
      last = now
      if (t >= 1) {
        hop++; t = 0
        if (hop >= a.path.length - 1) { setAnim(null); finishPdu(a.from, a.to); return }
        const g = netRef.current
        setEvents((e) => [...e, `${dev(g, a.path[hop])?.name}: teruskan ke ${dev(g, a.path[hop + 1])?.name}`].slice(-8))
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
  function finishPdu(from: string, to: string) {
    const r = ping(netRef.current, from, to, pdusRef.current.length + 1)
    pdusRef.current = [...pdusRef.current, r]
    setPdus(pdusRef.current)
    say(r.ok ? `Successful: ${r.src} ke ${r.dst}` : `Failed: ${r.why}`, !r.ok)
    setEvents((e) => [...e, r.ok ? `ICMP Echo Reply sampai di ${r.src}` : `Paket gagal: ${r.why}`].slice(-8))
  }

  /** Pilih alat di toolbar. */
  const pick = (t: Tool, type: DevType | null = null) => { setTool(t); setPlaceType(type); setFirst(null) }

  /** Klik area kerja kosong: taruh perangkat. Keyboard: Enter menaruh di posisi kosong berikutnya. */
  function placeAt(x: number, y: number) {
    if (tool !== 'place' || !placeType) return
    const c = counters.current[placeType] ?? 0
    counters.current[placeType] = c + 1
    const d: Dev = { id: `d${Date.now()}${c}`, type: placeType, name: `${LABEL[placeType]}${c}`, x, y, on: true, off: {} }
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
      setNet((p) => ({ devices: p.devices.filter((x) => x.id !== id), links: p.links.filter((l) => l.a !== id && l.b !== id) }))
      return say(`${d.name} dihapus beserta kabelnya.`)
    }
    if (tool === 'cable') {
      if (!first) { if (!freePort(net, d)) return say(`${d.name} hanya punya 1 port (FastEthernet0) dan sudah terpakai.`, true); setFirst(id); return say(`Kabel dari ${d.name}. Klik perangkat tujuan.`) }
      if (first === id) { setFirst(null); return }
      const a = dev(net, first)!
      if (linkOf(net, a.id, d.id)) { setFirst(null); return say(`${a.name} dan ${d.name} sudah tersambung.`, true) }
      if (isEnd(a) && isEnd(d)) { setFirst(null); return say('Di lab ini PC disambung lewat switch atau hub, bukan langsung ke PC.', true) }
      const pa = freePort(net, a), pb = freePort(net, d)
      if (!pa || !pb) { setFirst(null); return say(`Port ${!pa ? a.name : d.name} sudah penuh.`, true) }
      const l: Cable = { id: `l${Date.now()}`, a: a.id, b: d.id, pa, pb, ready: false }
      setNet((p) => ({ ...p, links: [...p.links, l] }))
      setFirst(null)
      return say(`Tersambung: ${a.name} ${pa} ke ${d.name} ${pb}. Tunggu lampu hijau.`)
    }
    if (tool === 'pdu') {
      if (!isEnd(d)) return say('Simple PDU dikirim dari PC atau Laptop.', true)
      if (!first) { setFirst(id); return say(`Pengirim: ${d.name}. Klik PC tujuan.`) }
      if (first === id) { setFirst(null); return }
      const from = first; setFirst(null)
      if (mode === 'realtime' || anim) return finishPdu(from, id)
      const path = ping(net, from, id, 0).path
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
    g.moved = true
    const x = Math.max(48, Math.min(W - 48, g.ox + dx)), y = Math.max(48, Math.min(H - 70, g.oy + dy))
    setNet((p) => ({ ...p, devices: p.devices.map((d) => (d.id === g.id ? { ...d, x, y } : d)) }))
  }
  const up = () => { setTimeout(() => (drag.current = null), 0) }
  const wasDrag = () => !!drag.current?.moved

  function cableClick(l: Cable) {
    if (tool !== 'delete') return say('Untuk mencabut kabel, pilih alat Delete lalu klik kabelnya.')
    setNet((p) => ({ ...p, links: p.links.filter((x) => x.id !== l.id) }))
    say(`Kabel ${dev(net, l.a)?.name}–${dev(net, l.b)?.name} dicabut.`)
  }

  function reset() {
    setNet({ devices: [], links: [] }); pdusRef.current = []; setPdus([]); setStep(0); setSince(0); setEvents([]); setAnim(null)
    setFinished(false); setShowDone(false); counters.current = {}; pick('select'); say('Activity di-reset. Mulai dari langkah 1.')
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
          <p className="text-sm font-bold uppercase tracking-wider text-ink-soft">Lab Topologi · gaya Packet Tracer</p>
          <h1 className="font-display text-[24px] font-bold tracking-tight md:text-[28px]">Misi {m.n} · {m.title}</h1>
        </div>
        <ToolBtn on={hint} onClick={() => setHint((h) => !h)} label="Petunjuk"><Icon name="help" size={20} /></ToolBtn>
        <ToolBtn onClick={reset} label="Reset Activity" sub="Ulang dari awal"><Icon name="repeat" size={20} /></ToolBtn>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 lg:row-span-2">
        {/* Instructions: seperti jendela Activity di Packet Tracer */}
        <section aria-labelledby="ins" className="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-line bg-white p-4">
          <h2 id="ins" className="text-[18px] font-bold">Instructions <span className="text-[14px] font-medium text-ink-soft">· petunjuk misi</span></h2>
          <p className="text-[15px] leading-snug text-[#33415A]">{m.goal}</p>
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
        </section>

        {/* Daftar PDU dan Event List */}
        <section aria-labelledby="pdu" className="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-line bg-white p-4">
          <h2 id="pdu" className="text-[18px] font-bold">PDU List <span className="text-[14px] font-medium text-ink-soft">· hasil ping</span></h2>
          {pdus.length === 0 ? <p className="help">Belum ada PDU. Pilih Add Simple PDU, klik PC pengirim lalu PC tujuan.</p> : (
            <ul className="flex flex-col gap-1.5">
              {pdus.slice(-6).reverse().map((p) => (
                <li key={p.n} className="flex items-center justify-between gap-2 rounded-lg bg-bg px-2.5 py-2 text-[14px]">
                  <span className="truncate">#{p.n} {p.src} → {p.dst}</span>
                  <span className={`shrink-0 font-bold ${p.ok ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>{p.ok ? 'Successful' : 'Failed'}</span>
                </li>))}
            </ul>)}
          {mode === 'sim' && <>
            <h3 className="text-[16px] font-bold">Event List <span className="text-[14px] font-medium text-ink-soft">· jejak paket</span></h3>
            {events.length === 0 ? <p className="help">Kirim PDU di mode Simulation untuk melihat paket berjalan per hop.</p>
              : <ol className="flex flex-col gap-1 text-[14px] leading-snug text-[#33415A]">{events.map((e, i) => <li key={i}>{e}</li>)}</ol>}
          </>}
          <p className="help mt-auto">Segitiga hijau = port aktif. Bulat oranye = port bersiap. Segitiga merah = port mati.</p>
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
              {net.links.map((l) => { const a = dev(net, l.a)!, b = dev(net, l.b)!; const dn = linkDown(net, l); return <line key={l.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={dn ? '#DC2626' : '#0F172A'} strokeWidth={2.5} strokeDasharray={dn ? '6 5' : undefined} vectorEffect="non-scaling-stroke" /> })}
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
              {cat === 'network' && (['switch', 'hub'] as DevType[]).map((t) => <PaletteBtn key={t} on={tool === 'place' && placeType === t} onClick={() => pick('place', t)} t={t} />)}
              {cat === 'end' && (['pc', 'laptop'] as DevType[]).map((t) => <PaletteBtn key={t} on={tool === 'place' && placeType === t} onClick={() => pick('place', t)} t={t} />)}
              {cat === 'conn' && (
                <button type="button" aria-pressed={tool === 'cable'} onClick={() => pick('cable')} className={`flex min-h-[52px] items-center gap-2 rounded-xl border-2 px-3 text-left ${tool === 'cable' ? 'border-primary bg-primary-soft' : 'border-line bg-white'}`}>
                  <Icon name="zap" size={22} /><span><span className="block text-[14px] font-bold">Automatic</span><span className="block text-[14px] text-ink-soft">Kabel otomatis</span></span>
                </button>
              )}
            </div>
          </div>
        </section>

      </div>

      {dialog && dev(net, dialog) && <DeviceDialog d={dev(net, dialog)!} net={net} onClose={() => setDialog(null)} onChange={(nd) => setNet((p) => ({ ...p, devices: p.devices.map((x) => (x.id === nd.id ? nd : x)) }))} />}

      {showDone && (
        <div role="dialog" aria-modal="true" aria-labelledby="done" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4">
          <div className="pop w-full max-w-md rounded-[22px] bg-white p-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#15803D]"><Icon name="check" size={30} sw={2.6} /></span>
            <h2 id="done" className="mt-3 text-[22px] font-bold">Misi {m.title} selesai!</h2>
            <p className="mt-1 text-[14px] font-bold text-ink-soft">Completion 100%</p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#33415A]">{m.lesson}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => setShowDone(false)} className="min-h-[52px] flex-1 rounded-2xl border-2 border-line px-4 font-semibold">Coba-coba lagi</button>
              {next ? <button type="button" onClick={() => { setShowDone(false); nav(`/lab/${next.n}`); reset() }} className="btn flex-1">Lanjut: Misi {next.title.replace('Topologi ', '')}</button>
                : <Link to="/lab" className="btn flex-1">Kembali ke daftar misi</Link>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Tombol alat dengan label Packet Tracer dan keterangan kecil opsional. */
function ToolBtn({ on = false, onClick, label, sub, children }: { on?: boolean; onClick: () => void; label: string; sub?: string; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} title={sub} className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-[14px] font-semibold ${on ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:bg-bg'}`}>
      {children}{label}
    </button>
  )
}

/** Satu perangkat di palet. */
function PaletteBtn({ t, on, onClick }: { t: DevType; on: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`flex min-h-[52px] items-center gap-2 rounded-xl border-2 px-3 text-left ${on ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-white'}`}>
      <DevIcon t={t} /><span><span className="block text-[14px] font-bold text-ink">{t === 'switch' ? 'Switch 2960' : MODEL[t]}</span><span className="block text-[14px] text-ink-soft">{LABEL[t]}</span></span>
    </button>
  )
}

/** Jendela perangkat: tab Physical (Power) dan Config (Port Status), seperti Packet Tracer. */
function DeviceDialog({ d, net, onClose, onChange }: { d: Dev; net: Net; onClose: () => void; onChange: (d: Dev) => void }) {
  const [tab, setTab] = useState<'physical' | 'config'>('physical')
  const ports = useMemo(() => net.links.filter((l) => l.a === d.id || l.b === d.id).map((l) => ({ port: portAt(l, d.id), to: dev(net, l.a === d.id ? l.b : l.a)?.name })), [net, d.id])
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.focus(); const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [onClose])
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="devt" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4" onClick={onClose}>
      <div ref={ref} tabIndex={-1} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-[22px] bg-white p-5 outline-none">
        <div className="flex items-center justify-between gap-3">
          <h2 id="devt" className="text-[20px] font-bold">{d.name} <span className="text-[14px] font-medium text-ink-soft">{MODEL[d.type]}</span></h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-bg"><Icon name="x" size={20} /></button>
        </div>
        <div className="mt-3 flex gap-2" role="tablist">
          {(['physical', 'config'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`min-h-[44px] rounded-xl px-4 text-[14px] font-bold ${tab === t ? 'bg-ink text-white' : 'bg-bg'}`}>{t === 'physical' ? 'Physical' : 'Config'}</button>)}
        </div>
        {tab === 'physical' ? (
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={() => onChange({ ...d, on: !d.on })} aria-pressed={d.on} className={`flex h-14 w-14 items-center justify-center rounded-full border-4 ${d.on ? 'border-[#16A34A] text-[#16A34A]' : 'border-[#94A3B8] text-[#64748B]'}`} aria-label={d.on ? 'Matikan perangkat' : 'Nyalakan perangkat'}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0" /></svg>
            </button>
            <p className="text-[15px] leading-snug">Power: <b>{d.on ? 'Menyala' : 'Mati'}</b><br /><span className="text-ink-soft">Tekan tombol untuk menyalakan atau mematikan.</span></p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-[14px] font-bold uppercase tracking-wider text-ink-soft">Interface</p>
            {ports.length === 0 ? <p className="help mt-2">Belum ada kabel tersambung ke perangkat ini.</p> : (
              <ul className="mt-2 flex flex-col gap-2">
                {ports.map((p) => (
                  <li key={p.port} className="flex items-center justify-between gap-3 rounded-xl bg-bg px-3 py-2">
                    <span className="text-[15px]"><b>FastEthernet{p.port.slice(2)}</b><br /><span className="text-[14px] text-ink-soft">ke {p.to}</span></span>
                    <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-[14px] font-semibold">
                      Port Status
                      <input type="checkbox" className="h-5 w-5 accent-[#2457F5]" checked={!d.off[p.port]} onChange={() => onChange({ ...d, off: { ...d.off, [p.port]: !d.off[p.port] } })} />
                      {d.off[p.port] ? 'Off' : 'On'}
                    </label>
                  </li>))}
              </ul>)}
            <p className="help mt-3">Command Prompt dan IP Configuration belum dipakai di lab ini; fokusnya bentuk topologi.</p>
          </div>
        )}
      </div>
    </div>
  )
}

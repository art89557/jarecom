// Dialog perangkat seperti di Packet Tracer: tab Physical (port), Config (IP router), dan Desktop (IP Configuration, Command Prompt).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/icons'
import { MODEL, dev, ipNum, isEnd, portAt, validMask, wrongCable, type Dev, type Net, type Pdu } from '../../lib/lab'

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
export function DeviceDialog({ d, net, onClose, onChange, onCmd }: { d: Dev; net: Net; onClose: () => void; onChange: (d: Dev) => void; onCmd: Cmd }) {
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


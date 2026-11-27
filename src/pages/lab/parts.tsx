// Komponen kecil Lab: ikon perangkat, tombol alat, tombol palet, dan kalimat Event List.
import type { ReactNode } from 'react'
import { LABEL, MODEL, dev, linkDown, linkOf, portAt, type DevType, type Net } from '../../lib/lab'

// ---------------------------------------------------------------- Ikon perangkat

/** Gambar garis perangkat (bukan emoji), 32 px. */
export function DevIcon({ t }: { t: DevType }) {
  const p = { width: 32, height: 32, viewBox: '0 0 40 40', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (t === 'pc') return <svg {...p}><rect x="4" y="6" width="32" height="21" rx="3" /><path d="M14 34h12M20 27v7" /></svg>
  if (t === 'laptop') return <svg {...p}><rect x="8" y="8" width="24" height="16" rx="2" /><path d="M3 31h34l-3-7H6z" /></svg>
  if (t === 'router') return <svg {...p}><circle cx="20" cy="20" r="15" /><path d="M13 16h11l-3-3M27 24H16l3 3" /></svg>
  if (t === 'hub') return <svg {...p}><rect x="3" y="12" width="34" height="16" rx="3" /><circle cx="12" cy="20" r="2" /><circle cx="20" cy="20" r="2" /><circle cx="28" cy="20" r="2" /></svg>
  return <svg {...p}><rect x="3" y="12" width="34" height="16" rx="3" /><path d="M9 20h3M15 20h3M21 20h3M27 20h3" /></svg>
}

/** Kalimat Event List untuk paket yang tiba di `at`: hub menyalin ke semua port, switch hanya ke port tujuan. */
export function hopText(n: Net, prev: string | undefined, at: string, next: string): string {
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
export function ToolBtn({ on = false, onClick, label, sub, disabled = false, children }: { on?: boolean; onClick: () => void; label: string; sub?: string; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} title={sub} disabled={disabled} className={`flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${on ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:bg-bg'}`}>
      {children}{label}
    </button>
  )
}

/** Satu perangkat di palet. */
export function PaletteBtn({ t, on, onClick }: { t: DevType; on: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`flex min-h-[52px] shrink-0 items-center gap-2 rounded-xl border-2 px-3 text-left ${on ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-white'}`}>
      <DevIcon t={t} /><span><span className="block text-[14px] font-bold text-ink">{t === 'switch' ? 'Switch 2960' : t === 'router' ? 'Router 1941' : MODEL[t]}</span><span className="block text-[14px] text-ink-soft">{LABEL[t]}</span></span>
    </button>
  )
}


import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export const POSES = ['default', 'halo', 'senang', 'rayakan', 'berpikir', 'sedih', 'offline'] as const
export type Pose = (typeof POSES)[number]

export function Netty({ pose = 'default', size = 120, label, bob = false }: { pose?: Pose; size?: number; label?: string; bob?: boolean }) {
  return (
    <img
      src={`/netty/${pose}.svg`}
      width={size}
      height={Math.round((size * 200) / 220)}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={bob ? 'bob' : undefined}
    />
  )
}

export function Logo({ size = 44, withName = true }: { size?: number; withName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <img src="/logo.svg" width={size} height={size} alt="" aria-hidden />
      {withName && <span className="font-display text-[28px] font-bold tracking-tight">Jar’ecom</span>}
    </span>
  )
}

export function Back({ to, children = 'Kembali' }: { to: string; children?: ReactNode }) {
  return (
    <Link to={to} className="inline-flex min-h-[44px] items-center gap-1 self-start font-semibold text-primary hover:underline">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
      {children}
    </Link>
  )
}

export function Segments({ total, done, color = 'bg-primary' }: { total: number; done: number; color?: string }) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Kemajuan">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < done ? color : 'bg-line'}`} />
      ))}
    </div>
  )
}

export function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export const XpBadge = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-xp-soft px-3 py-1.5 text-sm font-bold text-xp">{children}</span>
)

export function ErrorMsg({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <p role="alert" className="text-sm font-medium text-fail">{children}</p>
}

export function Ring({ pct, size = 112, stroke = 12, fg = '#2457F5', track = '#E4E9F2', text = '#0F1B2D', label }: { pct: number; size?: number; stroke?: number; fg?: string; track?: string; text?: string; label: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const h = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0">
      <circle cx={h} cy={h} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={h} cy={h} r={r} fill="none" stroke={fg} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} transform={`rotate(-90 ${h} ${h})`} />
      <text x={h} y={h + size * 0.11} textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize={size * 0.24} fontWeight="700" fill={text}>{pct}%</text>
    </svg>
  )
}

export const LevelPill = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1.5 text-sm font-bold text-[#1B46D1]">{children}</span>
)

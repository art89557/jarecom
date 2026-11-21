import { LEVELS } from '../content'
import type { Progress } from './engine'

export interface Fakta { level: number; judul: string; tanya: string; jawab: string }

/** Satu fakta per hari dari sub-topik pada level yang materinya sudah selesai (tanpa data baru). */
export function pickFakta(p: Progress, uid: string, now = Date.now()): Fakta | null {
  const pool = LEVELS.filter((l) => p.completed.includes(l.level)).flatMap((l) => l.subtopik.map((s) => ({ l, s })))
  if (!pool.length) return null
  let h = 0
  for (const c of uid) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const { l, s } = pool[(Math.floor(now / 86400000) + h) % pool.length]
  const jawab = s.uraian.split(/(?<=[.!?])\s/)[0]
  return { level: l.level, judul: s.judul, tanya: `Apa yang perlu kamu ingat tentang ${s.judul}?`, jawab }
}

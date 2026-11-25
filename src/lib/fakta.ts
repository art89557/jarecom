import { LEVELS } from '../content'
import type { Progress } from './engine'

/** Satu kartu "fakta hari ini": pertanyaan pendek dan jawabannya. */
export interface Fakta { level: number; judul: string; tanya: string; jawab: string }

/** Satu fakta per hari dari sub-topik pada level yang materinya sudah selesai (tanpa data baru). */
export function pickFakta(p: Progress, uid: string, now = Date.now()): Fakta | null {
  // Kumpulan sub-topik dari level yang materinya sudah selesai.
  const pool = LEVELS.filter((l) => p.completed.includes(l.level)).flatMap((l) => l.subtopik.map((s) => ({ l, s })))
  if (!pool.length) return null
  // Hash sederhana dari id pengguna, supaya tiap pengguna mendapat urutan fakta yang berbeda.
  let h = 0
  for (const c of uid) h = (h * 31 + c.charCodeAt(0)) >>> 0
  // Satu fakta per hari: indeks berganti setiap 86.400.000 ms (24 jam).
  const { l, s } = pool[(Math.floor(now / 86400000) + h) % pool.length]
  // Jawaban = kalimat pertama uraian sub-topik.
  const jawab = s.uraian.split(/(?<=[.!?])\s/)[0]
  return { level: l.level, judul: s.judul, tanya: `Apa yang perlu kamu ingat tentang ${s.judul}?`, jawab }
}

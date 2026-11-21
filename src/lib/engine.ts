// Aturan sistem Jar'ecom (PRD "Aturan sistem"). Fungsi murni, dipakai mode lokal dan diuji.
export const PASS_SCORE = 70
export const XP_MATERIAL = 20
export const XP_QUIZ = 50
export const XP_BONUS = 20
export const TOTAL = 11

export type XpKind = 'materi' | 'kuis' | 'bonus'
export interface XpEvent { type: XpKind; level: number; xp: number; at: number }

export interface Progress {
  completed: number[] // level yang materinya sudah ditandai selesai
  passed: number[] // level yang kuisnya sudah lulus
  perfect: number[] // level yang pernah skor 100 (bonus sudah diberikan)
  xp: number
  best: Record<string, number> // skor tertinggi per level (kunci = nomor level)
  events: XpEvent[] // riwayat XP, terbaru di depan
}

export const emptyProgress = (): Progress => ({ completed: [], passed: [], perfect: [], xp: 0, best: {}, events: [] })

/** Data lama (tanpa best/events) dan data server dilengkapi supaya selalu utuh. */
export const normalizeProgress = (p: Partial<Progress> | null | undefined): Progress => ({ ...emptyProgress(), ...(p ?? {}), best: { ...(p?.best ?? {}) }, events: [...(p?.events ?? [])] })

export const bestScore = (n: number, p: Progress): number | null => p.best[String(n)] ?? null

export const isUnlocked = (n: number, p: Progress): boolean =>
  n === 1 || (p.completed.includes(n - 1) && p.passed.includes(n - 1))

export const quizAvailable = (n: number, p: Progress): boolean => isUnlocked(n, p) && p.completed.includes(n)

export const computeScore = (correct: number, total: number): number =>
  total === 0 ? 0 : Math.round((correct / total) * 100)

export const isPass = (score: number): boolean => score >= PASS_SCORE

export const userLevel = (p: Progress): number => 1 + p.passed.length
/** Setelah semua 11 kuis lulus, Level tampil sebagai Tamat. */
export const isTamat = (p: Progress): boolean => p.passed.length >= TOTAL
export const levelLabel = (p: Progress): string => (isTamat(p) ? 'Tamat' : String(userLevel(p)))

export const levelPct = (n: number, p: Progress): number =>
  (p.completed.includes(n) ? 50 : 0) + (p.passed.includes(n) ? 50 : 0)

export const nextLevel = (p: Progress): number | null => {
  for (let n = 1; n <= TOTAL; n++) {
    if (isUnlocked(n, p) && !(p.completed.includes(n) && p.passed.includes(n))) return n
  }
  return null
}

export function applyMaterial(p: Progress, n: number, at = Date.now()): { next: Progress; xpGained: number } {
  if (!isUnlocked(n, p)) throw new Error('Level masih terkunci')
  if (p.completed.includes(n)) return { next: p, xpGained: 0 }
  const events: XpEvent[] = [{ type: 'materi', level: n, xp: XP_MATERIAL, at }, ...p.events]
  return { next: { ...p, completed: [...p.completed, n], xp: p.xp + XP_MATERIAL, events }, xpGained: XP_MATERIAL }
}

export function applyQuiz(p: Progress, n: number, score: number, at = Date.now()): { next: Progress; xpGained: number; passed: boolean } {
  if (!quizAvailable(n, p)) throw new Error('Kuis belum tersedia')
  const passed = isPass(score)
  let xp = 0
  const next: Progress = { ...p, passed: [...p.passed], perfect: [...p.perfect], best: { ...p.best }, events: [...p.events] }
  next.best[String(n)] = Math.max(score, p.best[String(n)] ?? 0)
  if (passed && !p.passed.includes(n)) {
    next.passed.push(n)
    next.events.unshift({ type: 'kuis', level: n, xp: XP_QUIZ, at })
    xp += XP_QUIZ
  }
  if (score === 100 && !p.perfect.includes(n)) {
    next.perfect.push(n)
    next.events.unshift({ type: 'bonus', level: n, xp: XP_BONUS, at })
    xp += XP_BONUS
  }
  next.xp = p.xp + xp
  return { next, xpGained: xp, passed }
}

export type BadgeState = 'gold' | 'got' | 'off'
/** Lencana per level diturunkan dari data yang ada: lulus = biru, pernah skor 100 = emas. */
export const badgeState = (n: number, p: Progress): BadgeState =>
  p.passed.includes(n) ? (p.perfect.includes(n) ? 'gold' : 'got') : 'off'

export type NodeState = 'done' | 'active' | 'next'
/** Status node sub-topik pada jalur: selesai, aktif (posisi berikutnya), belum. */
export const nodeState = (i: number, doneCount: number, levelDone: boolean): NodeState =>
  levelDone || i < doneCount ? 'done' : i === doneCount ? 'active' : 'next'

export type QuizStatus = 'gold' | 'pass' | 'ready' | 'locked'
/** Status kartu kuis: emas (pernah 100), lulus, siap dikerjakan, atau terkunci. */
export const quizStatus = (n: number, p: Progress): QuizStatus =>
  p.perfect.includes(n) ? 'gold' : p.passed.includes(n) ? 'pass' : quizAvailable(n, p) ? 'ready' : 'locked'

export type HeatState = 'gold' | 'pass' | 'materi' | 'locked'
/** Petak peta panas Progres: emas, lulus, materi selesai (kuis belum lulus), atau terkunci/belum mulai. */
export const heatState = (n: number, p: Progress): HeatState =>
  p.perfect.includes(n) ? 'gold' : p.passed.includes(n) ? 'pass' : p.completed.includes(n) ? 'materi' : 'locked'

/** XP yang sudah didapat dari satu level, dan maksimumnya. */
export const levelXp = (n: number, p: Progress): number => p.events.filter((e) => e.level === n).reduce((a, e) => a + e.xp, 0)
export const LEVEL_XP_MAX = XP_MATERIAL + XP_QUIZ + XP_BONUS

export const overallPct = (p: Progress): number => {
  let t = 0
  for (let n = 1; n <= TOTAL; n++) t += levelPct(n, p)
  return Math.round(t / TOTAL)
}

/** Level terakhir yang lulus (untuk "lencana terbaru"). */
export const latestBadge = (p: Progress): number | null => (p.passed.length ? Math.max(...p.passed) : null)

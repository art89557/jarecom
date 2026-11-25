// Aturan sistem Jar'ecom (PRD "Aturan sistem"). Fungsi murni, dipakai mode lokal dan diuji.
//
// PENTING: aturan ini ada di DUA tempat. Di sini (mode demo/localRepo, sisi klien)
// dan di supabase/schema.sql (fungsi Postgres, dipakai produksi). Ubah keduanya bersamaan,
// lalu jalankan `npm test`. Di produksi yang berlaku adalah aturan di server.

// ===== Konstanta aturan =====
export const PASS_SCORE = 70 // nilai minimum kuis agar dianggap lulus
export const XP_MATERIAL = 20 // XP saat materi satu level ditandai selesai (sekali per level)
export const XP_QUIZ = 50 // XP saat kuis satu level pertama kali lulus (sekali per level)
export const XP_BONUS = 20 // XP bonus saat pertama kali mendapat skor 100 (sekali per level)
export const TOTAL = 11 // jumlah level

// ===== Tipe data =====
/** Jenis perolehan XP: materi selesai, kuis lulus, atau bonus skor 100. */
export type XpKind = 'materi' | 'kuis' | 'bonus'
/** Satu catatan perolehan XP (dipakai untuk riwayat di halaman Progres). */
export interface XpEvent { type: XpKind; level: number; xp: number; at: number /* waktu, ms sejak 1970 */ }

/** Seluruh kemajuan belajar seorang pengguna. Semua tampilan membaca dari bentuk data ini. */
export interface Progress {
  completed: number[] // level yang materinya sudah ditandai selesai
  passed: number[] // level yang kuisnya sudah lulus
  perfect: number[] // level yang pernah skor 100 (bonus sudah diberikan)
  xp: number // total XP
  best: Record<string, number> // skor tertinggi per level (kunci = nomor level)
  events: XpEvent[] // riwayat XP, terbaru di depan
}

/** Kemajuan kosong untuk pengguna baru. */
export const emptyProgress = (): Progress => ({ completed: [], passed: [], perfect: [], xp: 0, best: {}, events: [] })

/** Data lama (tanpa best/events) dan data server dilengkapi supaya selalu utuh. */
export const normalizeProgress = (p: Partial<Progress> | null | undefined): Progress => ({ ...emptyProgress(), ...(p ?? {}), best: { ...(p?.best ?? {}) }, events: [...(p?.events ?? [])] })

/** Skor tertinggi di satu level, atau null jika belum pernah mengerjakan kuis. */
export const bestScore = (n: number, p: Progress): number | null => p.best[String(n)] ?? null


// ===== Aturan buka level dan kuis =====
/** Level 1 selalu terbuka. Level n terbuka jika materi dan kuis level n-1 sudah selesai dan lulus. */
export const isUnlocked = (n: number, p: Progress): boolean =>
  n === 1 || (p.completed.includes(n - 1) && p.passed.includes(n - 1))

/** Kuis level n bisa dikerjakan jika levelnya terbuka dan materinya sudah selesai. */
export const quizAvailable = (n: number, p: Progress): boolean => isUnlocked(n, p) && p.completed.includes(n)

/** Skor 0 sampai 100 (dibulatkan). Tanpa soal dianggap 0 supaya tidak membagi dengan nol. */
export const computeScore = (correct: number, total: number): number =>
  total === 0 ? 0 : Math.round((correct / total) * 100)

/** Lulus jika skor mencapai nilai minimum (70). */
export const isPass = (score: number): boolean => score >= PASS_SCORE


// ===== Level dan persentase =====
/** Level pengguna saat ini = 1 + jumlah kuis yang sudah lulus. */
export const userLevel = (p: Progress): number => 1 + p.passed.length
/** Setelah semua 11 kuis lulus, Level tampil sebagai Tamat. */
export const isTamat = (p: Progress): boolean => p.passed.length >= TOTAL
export const levelLabel = (p: Progress): string => (isTamat(p) ? 'Tamat' : String(userLevel(p)))

/** Persen satu level: 50 jika materi selesai, ditambah 50 jika kuis lulus. */
export const levelPct = (n: number, p: Progress): number =>
  (p.completed.includes(n) ? 50 : 0) + (p.passed.includes(n) ? 50 : 0)

/** Persen level yang ikut menghitung sub-topik materi yang sudah selesai (maks 50 dari porsi materi). Satu rumus untuk Beranda, Peta, dan halaman lain. */
export const levelPctLive = (n: number, p: Progress, doneSub: number, totalSub: number): number => {
  const base = levelPct(n, p)
  if (p.completed.includes(n) || totalSub <= 0) return base
  const d = Math.max(0, Math.min(doneSub, totalSub))
  return base + Math.round((d / totalSub) * 50)
}

/** Level berikutnya yang perlu dikerjakan (terbuka tetapi belum tuntas), atau null jika semua tuntas. */
export const nextLevel = (p: Progress): number | null => {
  for (let n = 1; n <= TOTAL; n++) {
    if (isUnlocked(n, p) && !(p.completed.includes(n) && p.passed.includes(n))) return n
  }
  return null
}


// ===== Perubahan kemajuan (dipakai mode demo; produksi memakai fungsi Postgres yang setara) =====
/** Tandai materi level n selesai. Mengembalikan kemajuan baru tanpa mengubah yang lama, dan XP yang didapat. Sekali per level. */
export function applyMaterial(p: Progress, n: number, at = Date.now()): { next: Progress; xpGained: number } {
  if (!isUnlocked(n, p)) throw new Error('Level masih terkunci')
  if (p.completed.includes(n)) return { next: p, xpGained: 0 }
  const events: XpEvent[] = [{ type: 'materi', level: n, xp: XP_MATERIAL, at }, ...p.events]
  return { next: { ...p, completed: [...p.completed, n], xp: p.xp + XP_MATERIAL, events }, xpGained: XP_MATERIAL }
}

/**
 * Catat hasil kuis level n: perbarui skor tertinggi, lalu beri XP kuis (jika baru lulus)
 * dan bonus (jika baru mendapat 100). Masing-masing hanya sekali per level, jadi kuis boleh diulang.
 */
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


// ===== Status tampilan (diturunkan dari Progress, tidak disimpan) =====
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
/** XP maksimum yang bisa didapat dari satu level. */
export const LEVEL_XP_MAX = XP_MATERIAL + XP_QUIZ + XP_BONUS

/** Persen keseluruhan = rata-rata persen semua level (belum menghitung sub-topik). */
export const overallPct = (p: Progress): number => {
  let t = 0
  for (let n = 1; n <= TOTAL; n++) t += levelPct(n, p)
  return Math.round(t / TOTAL)
}

/** Level terakhir yang lulus (untuk "lencana terbaru"). */
export const latestBadge = (p: Progress): number | null => (p.passed.length ? Math.max(...p.passed) : null)

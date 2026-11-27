import { getLevel } from '../content'
import { applyMaterial, applyQuiz, computeScore, emptyProgress, normalizeProgress, type Progress } from './engine'
import { AppError, type CheckResult, type QuizQuestion, type QuizResult, type Repo, type User } from './repo'

// Mode demo: semua data di localStorage browser. Kata sandi tidak di-hash; jangan dipakai untuk data nyata.
// Dipakai otomatis saat variabel lingkungan Supabase kosong (lihat lib/index.ts). Aturan XP memakai engine.ts.

/** Bentuk data yang disimpan di localStorage di bawah satu kunci. */
interface Db {
  users: Record<string, { id: string; name: string; password: string }>
  session: string | null // email pengguna yang sedang masuk, atau null
  progress: Record<string, Progress>
}
const KEY = 'jarecom:db'

/** Baca seluruh data dari localStorage; kosong jika belum ada atau rusak. */
function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch { /* abaikan */ }
  return { users: {}, session: null, progress: {} }
}
/** Tulis seluruh data kembali ke localStorage. */
function save(db: Db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* abaikan */ }
}
// Email disamakan (huruf kecil, tanpa spasi) agar tidak terdaftar ganda.
const norm = (e: string) => e.trim().toLowerCase()

// Jawaban kuis yang sedang berjalan: level -> (nomor soal -> pilihan pertama). Hanya di memori, hilang saat halaman dimuat ulang.
const locked = new Map<number, Map<number, number>>()

export const localRepo: Repo = {
  mode: 'local',

  // --- Akun ---
  async markTourSeen() { /* mode lokal: penanda disimpan di perangkat oleh lib/tour.ts */ },
  async getUser() {
    const db = load()
    if (!db.session) return null
    const u = db.users[db.session]
    return u ? { id: u.id, name: u.name, email: db.session } : null
  },
  async signUp(name, email, password) {
    const db = load()
    const e = norm(email)
    if (db.users[e]) throw new AppError('Email ini sudah terdaftar')
    const id = crypto.randomUUID()
    db.users[e] = { id, name: name.trim(), password }
    db.progress[id] = emptyProgress()
    db.session = e
    save(db)
    return { id, name: name.trim(), email: e }
  },
  async signIn(email, password) {
    const db = load()
    const e = norm(email)
    const u = db.users[e]
    if (!u || u.password !== password) throw new AppError('Email atau kata sandi salah')
    db.session = e
    save(db)
    return { id: u.id, name: u.name, email: e }
  },
  async signOut() {
    const db = load()
    db.session = null
    save(db)
  },
  // Mode demo: hapus pengguna, progres, dan posisi baca dari browser ini.
  async deleteAccount() {
    const db = load()
    const u = db.session ? db.users[db.session] : null
    if (!u || !db.session) throw new AppError('Belum masuk')
    delete db.progress[u.id]
    delete db.users[db.session]
    db.session = null
    save(db)
    try { Object.keys(localStorage).filter((k) => k.includes(u.id)).forEach((k) => localStorage.removeItem(k)) } catch { /* abaikan */ }
  },
  async updateName(name) {
    const db = load()
    const u = db.session ? db.users[db.session] : null
    if (!db.session || !u) throw new AppError('Belum masuk')
    u.name = name.trim()
    save(db)
    return { id: u.id, name: u.name, email: db.session }
  },
  async updatePassword(next, current) {
    const db = load()
    const u = db.session ? db.users[db.session] : null
    if (!u) throw new AppError('Belum masuk')
    if (current !== undefined && u.password !== current) throw new AppError('Kata sandi saat ini salah')
    if (u.password === next) throw new AppError('Kata sandi baru harus berbeda dari yang lama')
    u.password = next
    save(db)
  },

  // --- Kemajuan belajar ---
  async savePosition() { /* mode lokal: posisi sudah tersimpan di perangkat oleh lib/position.ts */ },
  async resetPassword(email) {
    if (!email.includes('@')) throw new AppError('Masukkan email yang valid')
  },
  async getProgress() {
    const db = load()
    const u = db.session ? db.users[db.session] : null
    if (!u) throw new AppError('Belum masuk')
    return normalizeProgress(db.progress[u.id])
  },
  async completeMaterial(level) {
    const db = load()
    const u = db.session ? db.users[db.session] : null
    if (!u) throw new AppError('Belum masuk')
    const { next, xpGained } = applyMaterial(normalizeProgress(db.progress[u.id]), level)
    db.progress[u.id] = next
    save(db)
    return { xpGained }
  },

  // --- Kuis (kunci jawaban ada di konten lokal, jadi aman untuk demo saja) ---
  async getQuiz(level): Promise<QuizQuestion[]> {
    const l = getLevel(level)
    if (!l) throw new AppError('Level tidak ada')
    // Membuka kuis = percobaan baru: jawaban terkunci dari percobaan sebelumnya dihapus (sama dengan get_quiz di server).
    locked.delete(level)
    // Hanya pertanyaan dan opsi yang diberikan, kunci jawaban tidak ikut.
    return l.kuis.map((k) => ({ pertanyaan: k.pertanyaan, opsi: k.opsi }))
  },
  async checkAnswer(level, index, choice): Promise<CheckResult> {
    const k = getLevel(level)?.kuis[index]
    if (!k) throw new AppError('Soal tidak ada')
    // Jawaban pertama per soal dikunci (sama dengan check_answer di server).
    const m = locked.get(level) ?? new Map<number, number>()
    if (!m.has(index)) m.set(index, choice)
    locked.set(level, m)
    return { benar: k.benar, penjelasan: k.penjelasan }
  },
  async submitQuiz(level, answers): Promise<QuizResult> {
    const db = load()
    const u = db.session ? db.users[db.session] : null
    if (!u) throw new AppError('Belum masuk')
    const l = getLevel(level)
    if (!l) throw new AppError('Level tidak ada')
    // Hitung jawaban benar dari jawaban yang terkunci (bukan dari `answers` kiriman halaman), ubah ke skor,
    // lalu catat hasilnya lewat aturan di engine.ts. Soal yang belum diperiksa dihitung salah.
    const m = locked.get(level) ?? new Map<number, number>()
    void answers
    const correct = l.kuis.reduce((n, k, i) => n + (m.get(i) === k.benar ? 1 : 0), 0)
    locked.delete(level)
    const score = computeScore(correct, l.kuis.length)
    const { next, xpGained, passed } = applyQuiz(normalizeProgress(db.progress[u.id]), level, score)
    db.progress[u.id] = next
    save(db)
    return { score, passed, xpGained, correct, total: l.kuis.length }
  }
}

export type { User }

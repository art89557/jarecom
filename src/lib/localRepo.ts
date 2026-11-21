import { getLevel } from '../content'
import { applyMaterial, applyQuiz, computeScore, emptyProgress, normalizeProgress, type Progress } from './engine'
import { AppError, type CheckResult, type QuizQuestion, type QuizResult, type Repo, type User } from './repo'

// Mode demo: semua data di localStorage browser. Kata sandi tidak di-hash; jangan dipakai untuk data nyata.
interface Db {
  users: Record<string, { id: string; name: string; password: string }>
  session: string | null
  progress: Record<string, Progress>
}
const KEY = 'jarecom:db'

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch { /* abaikan */ }
  return { users: {}, session: null, progress: {} }
}
function save(db: Db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* abaikan */ }
}
const norm = (e: string) => e.trim().toLowerCase()

export const localRepo: Repo = {
  mode: 'local',
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
  async getQuiz(level): Promise<QuizQuestion[]> {
    const l = getLevel(level)
    if (!l) throw new AppError('Level tidak ada')
    return l.kuis.map((k) => ({ pertanyaan: k.pertanyaan, opsi: k.opsi }))
  },
  async checkAnswer(level, index): Promise<CheckResult> {
    const k = getLevel(level)?.kuis[index]
    if (!k) throw new AppError('Soal tidak ada')
    return { benar: k.benar, penjelasan: k.penjelasan }
  },
  async submitQuiz(level, answers): Promise<QuizResult> {
    const db = load()
    const u = db.session ? db.users[db.session] : null
    if (!u) throw new AppError('Belum masuk')
    const l = getLevel(level)
    if (!l) throw new AppError('Level tidak ada')
    const correct = l.kuis.reduce((n, k, i) => n + (answers[i] === k.benar ? 1 : 0), 0)
    const score = computeScore(correct, l.kuis.length)
    const { next, xpGained, passed } = applyQuiz(normalizeProgress(db.progress[u.id]), level, score)
    db.progress[u.id] = next
    save(db)
    return { score, passed, xpGained, correct, total: l.kuis.length }
  }
}

export type { User }

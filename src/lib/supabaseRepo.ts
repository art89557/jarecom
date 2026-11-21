import { createClient } from '@supabase/supabase-js'
import { normalizeProgress, type Progress } from './engine'
import { mergeDoneSubtopics } from './position'
import { AppError, type CheckResult, type QuizQuestion, type Repo, type User } from './repo'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const supabaseConfigured = Boolean(url && key)

const sb = supabaseConfigured ? createClient(url!, key!) : null
const client = () => {
  if (!sb) throw new AppError('Supabase belum dikonfigurasi')
  return sb
}
const fail = (e: { message: string } | null): never => {
  throw new AppError(e?.message ?? 'Terjadi kesalahan')
}
const passwordError = (m: string): string =>
  /different from the old/i.test(m) ? 'Kata sandi baru harus berbeda dari yang lama'
    : /at least|weak|pwned|compromised|easy to guess/i.test(m) ? 'Kata sandi terlalu lemah atau pernah bocor. Coba yang lain'
    : m
const toUser = (u: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User => ({
  id: u.id,
  email: u.email ?? '',
  name: String(u.user_metadata?.name ?? u.email ?? ''),
  tourSeen: u.user_metadata?.tour_done === true
})

// Semua penghitungan XP, skor, dan unlock dilakukan oleh fungsi Postgres (lihat supabase/schema.sql).
export const supabaseRepo: Repo = {
  mode: 'supabase',
  async getUser() {
    const { data } = await client().auth.getUser()
    return data.user ? toUser(data.user) : null
  },
  async signUp(name, email, password) {
    const { data, error } = await client().auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } })
    if (error) fail(error)
    if (!data.user) throw new AppError('Pendaftaran gagal')
    if (!data.session) throw new AppError('Cek email kamu untuk konfirmasi, lalu masuk')
    return toUser(data.user)
  },
  async signIn(email, password) {
    const { data, error } = await client().auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new AppError('Email atau kata sandi salah')
    return toUser(data.user)
  },
  async signOut() {
    await client().auth.signOut()
  },
  // Penanda tur disimpan di metadata akun (hanya preferensi tampilan, bukan data aturan sistem).
  async markTourSeen() {
    const { error } = await client().auth.updateUser({ data: { tour_done: true } })
    if (error) fail(error)
  },
  async resetPassword(email) {
    const { error } = await client().auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/sandi-baru' })
    if (error) fail(error)
  },
  async updateName(name) {
    const n = name.trim()
    const { data, error } = await client().auth.updateUser({ data: { name: n } })
    if (error || !data.user) fail(error)
    // Nama di tabel profil ikut diperbarui; jika gagal, nama di akun tetap berlaku.
    await client().from('profiles').update({ nama: n }).eq('id', data.user!.id)
    return toUser(data.user!)
  },
  async updatePassword(next, current) {
    if (current !== undefined) {
      const { data } = await client().auth.getUser()
      const email = data.user?.email
      if (!email) throw new AppError('Belum masuk')
      const { error } = await client().auth.signInWithPassword({ email, password: current })
      if (error) throw new AppError('Kata sandi saat ini salah')
    }
    const { error } = await client().auth.updateUser({ password: next })
    if (error) throw new AppError(passwordError(error.message))
  },
  async savePosition(level, done) {
    const { error } = await client().rpc('save_position', { p_level: level, p_done: done })
    if (error) fail(error)
  },
  async getProgress() {
    const { data, error } = await client().rpc('get_state')
    if (error) fail(error)
    const d = data as Partial<Progress> & { pos?: Record<string, number> }
    const { data: s } = await client().auth.getSession()
    if (s.session) mergeDoneSubtopics(s.session.user.id, d.pos)
    return normalizeProgress(d)
  },
  async completeMaterial(level) {
    const { data, error } = await client().rpc('complete_material', { p_level: level })
    if (error) fail(error)
    return { xpGained: Number((data as { xp_gained: number }).xp_gained) }
  },
  async getQuiz(level) {
    const { data, error } = await client().rpc('get_quiz', { p_level: level })
    if (error) fail(error)
    return data as QuizQuestion[]
  },
  async checkAnswer(level, index, choice) {
    const { data, error } = await client().rpc('check_answer', { p_level: level, p_index: index, p_choice: choice })
    if (error) fail(error)
    return data as CheckResult
  },
  async submitQuiz(level, answers) {
    const { data, error } = await client().rpc('submit_quiz', { p_level: level, p_answers: answers })
    if (error) fail(error)
    const d = data as { score: number; passed: boolean; xp_gained: number; correct: number; total: number }
    return { score: d.score, passed: d.passed, xpGained: d.xp_gained, correct: d.correct, total: d.total }
  }
}

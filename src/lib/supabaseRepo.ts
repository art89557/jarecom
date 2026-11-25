import { createClient } from '@supabase/supabase-js'
import { normalizeProgress, type Progress } from './engine'
import { mergeDoneSubtopics } from './position'
import { AppError, type CheckResult, type QuizQuestion, type Repo, type User } from './repo'

// Konfigurasi dari variabel lingkungan (diatur di Vercel / file .env). Hanya kunci publik (anon) yang dipakai di klien.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
/** True jika URL dan kunci Supabase terisi; lib/index.ts memakainya untuk memilih repo. */
export const supabaseConfigured = Boolean(url && key)

// Klien dibuat sekali. Bila belum dikonfigurasi, `client()` melempar galat yang jelas.
const sb = supabaseConfigured ? createClient(url!, key!) : null
const client = () => {
  if (!sb) throw new AppError('Supabase belum dikonfigurasi')
  return sb
}
/** Ubah galat Supabase menjadi AppError agar pesannya bisa ditampilkan ke pengguna. */
const fail = (e: { message: string } | null): never => {
  throw new AppError(e?.message ?? 'Terjadi kesalahan')
}
/** Terjemahkan pesan galat kata sandi dari Supabase (Inggris) ke bahasa Indonesia. */
const passwordError = (m: string): string =>
  /different from the old/i.test(m) ? 'Kata sandi baru harus berbeda dari yang lama'
    : /at least|weak|pwned|compromised|easy to guess/i.test(m) ? 'Kata sandi terlalu lemah atau pernah bocor. Coba yang lain'
    : m
/** Petakan pengguna Supabase ke tipe User aplikasi. */
const toUser = (u: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User => ({
  id: u.id,
  email: u.email ?? '',
  name: String(u.user_metadata?.name ?? u.email ?? ''),
  tourSeen: u.user_metadata?.tour_done === true
})

// Semua penghitungan XP, skor, dan unlock dilakukan oleh fungsi Postgres (lihat supabase/schema.sql).
// Berkas ini hanya memanggil fungsi tersebut lewat rpc() dan menerjemahkan hasilnya ke tipe aplikasi.
// Klien tidak menulis langsung ke tabel dan tidak pernah menerima kunci jawaban kuis.
export const supabaseRepo: Repo = {
  mode: 'supabase',

  // --- Akun (Supabase Auth) ---
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

  // --- Kemajuan belajar (fungsi Postgres lewat rpc) ---
  // Simpan posisi baca ke server (save_position).
  async savePosition(level, done) {
    const { error } = await client().rpc('save_position', { p_level: level, p_done: done })
    if (error) fail(error)
  },
  // Ambil seluruh kemajuan (get_state) dan gabungkan posisi baca server ke perangkat.
  async getProgress() {
    const { data, error } = await client().rpc('get_state')
    if (error) fail(error)
    const d = data as Partial<Progress> & { pos?: Record<string, number> }
    const { data: s } = await client().auth.getSession()
    if (s.session) mergeDoneSubtopics(s.session.user.id, d.pos)
    return normalizeProgress(d)
  },
  // Tandai materi selesai (complete_material). Server yang menentukan XP dan menolak level terkunci.
  async completeMaterial(level) {
    const { data, error } = await client().rpc('complete_material', { p_level: level })
    if (error) fail(error)
    return { xpGained: Number((data as { xp_gained: number }).xp_gained) }
  },

  // --- Kuis ---
  // Ambil soal tanpa kunci jawaban (get_quiz).
  async getQuiz(level) {
    const { data, error } = await client().rpc('get_quiz', { p_level: level })
    if (error) fail(error)
    return data as QuizQuestion[]
  },
  // Periksa satu jawaban (check_answer): server mengembalikan jawaban benar dan penjelasan.
  async checkAnswer(level, index, choice) {
    const { data, error } = await client().rpc('check_answer', { p_level: level, p_index: index, p_choice: choice })
    if (error) fail(error)
    return data as CheckResult
  },
  // Kirim semua jawaban (submit_quiz): server menghitung skor, kelulusan, dan XP, lalu klien memetakan nama kolomnya.
  async submitQuiz(level, answers) {
    const { data, error } = await client().rpc('submit_quiz', { p_level: level, p_answers: answers })
    if (error) fail(error)
    // Server memakai snake_case (xp_gained); aplikasi memakai camelCase (xpGained).
    const d = data as { score: number; passed: boolean; xp_gained: number; correct: number; total: number }
    return { score: d.score, passed: d.passed, xpGained: d.xp_gained, correct: d.correct, total: d.total }
  }
}

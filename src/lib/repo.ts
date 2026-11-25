// Antarmuka data aplikasi. Semua halaman hanya memakai tipe dan fungsi di sini (lewat `repo` dari index.ts),
// sehingga sumber datanya (lokal atau Supabase) bisa ditukar tanpa mengubah halaman.
import type { Progress } from './engine'

/** Pengguna yang sedang masuk. */
export interface User { id: string; name: string; email: string; tourSeen?: boolean }
/** Soal kuis untuk klien. Sengaja tanpa kunci jawaban; kunci hanya ada di server. */
export interface QuizQuestion { pertanyaan: string; opsi: string[] }
/** Hasil memeriksa satu jawaban: indeks jawaban yang benar dan penjelasannya. */
export interface CheckResult { benar: number; penjelasan: string }
/** Hasil akhir kuis: skor, lulus atau tidak, XP yang didapat, dan jumlah benar dari total soal. */
export interface QuizResult { score: number; passed: boolean; xpGained: number; correct: number; total: number }

/** Galat dengan pesan yang aman ditampilkan langsung ke pengguna. */
export class AppError extends Error {}

/** Satu antarmuka, dua implementasi: lokal (demo) dan Supabase (produksi). */
export interface Repo {
  readonly mode: 'local' | 'supabase'

  // --- Akun ---
  getUser(): Promise<User | null>
  signUp(name: string, email: string, password: string): Promise<User>
  signIn(email: string, password: string): Promise<User>
  signOut(): Promise<void>
  /** Tandai tur panduan sudah dilihat (disimpan di akun pada mode Supabase). */
  markTourSeen(): Promise<void>
  resetPassword(email: string): Promise<void>
  /** Ganti nama tampilan; mengembalikan pengguna yang sudah diperbarui. */
  updateName(name: string): Promise<User>
  /** Atur kata sandi baru. Jika `current` diberikan, kata sandi saat ini diperiksa dulu. */
  updatePassword(next: string, current?: string): Promise<void>

  // --- Kemajuan belajar ---
  /** Simpan posisi baca (jumlah sub-topik yang sudah lolos cek) untuk satu level. */
  savePosition(level: number, done: number): Promise<void>
  /** Ambil seluruh kemajuan pengguna. */
  getProgress(): Promise<Progress>
  /** Tandai materi satu level selesai (+XP sekali per level). */
  completeMaterial(level: number): Promise<{ xpGained: number }>

  // --- Kuis ---
  /** Ambil soal satu level (tanpa kunci jawaban). */
  getQuiz(level: number): Promise<QuizQuestion[]>
  /** Periksa satu jawaban; server mengembalikan jawaban benar dan penjelasan. */
  checkAnswer(level: number, index: number, choice: number): Promise<CheckResult>
  /** Kirim semua jawaban; server menghitung skor, kelulusan, dan XP. */
  submitQuiz(level: number, answers: number[]): Promise<QuizResult>
}

import type { Progress } from './engine'

export interface User { id: string; name: string; email: string; tourSeen?: boolean }
export interface QuizQuestion { pertanyaan: string; opsi: string[] }
export interface CheckResult { benar: number; penjelasan: string }
export interface QuizResult { score: number; passed: boolean; xpGained: number; correct: number; total: number }

export class AppError extends Error {}

/** Satu antarmuka, dua implementasi: lokal (demo) dan Supabase (produksi). */
export interface Repo {
  readonly mode: 'local' | 'supabase'
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
  /** Simpan posisi baca (jumlah sub-topik yang sudah lolos cek) untuk satu level. */
  savePosition(level: number, done: number): Promise<void>
  getProgress(): Promise<Progress>
  completeMaterial(level: number): Promise<{ xpGained: number }>
  getQuiz(level: number): Promise<QuizQuestion[]>
  checkAnswer(level: number, index: number, choice: number): Promise<CheckResult>
  submitQuiz(level: number, answers: number[]): Promise<QuizResult>
}

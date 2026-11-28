// Memeriksa bentuk data materi: setiap penjelasan lengkap dan contoh soal yang diisi harus utuh,
// supaya halaman materi tidak menampilkan bagian kosong.
import { describe, expect, it } from 'vitest'
import { LEVELS } from './index'

const semuaSub = LEVELS.flatMap((l) => l.subtopik.map((s) => ({ level: l.level, s })))

describe('konten materi', () => {
  it('penjelasan lengkap yang diisi punya paragraf dan istilah yang tidak kosong', () => {
    for (const { level, s } of semuaSub) {
      if (!s.lengkap) continue
      const nama = `Level ${level} sub-topik ${s.id}`
      expect(s.lengkap.caraKerja.length, nama).toBeGreaterThan(0)
      for (const p of s.lengkap.caraKerja) expect(p.trim().length, nama).toBeGreaterThan(40)
      for (const t of s.lengkap.istilah ?? []) {
        expect(t.istilah.trim(), nama).not.toBe('')
        expect(t.arti.trim(), nama).not.toBe('')
      }
    }
  })

  it('contoh soal punya soal, minimal dua langkah, dan jawaban', () => {
    for (const { level, s } of semuaSub) {
      if (!s.contohSoal) continue
      const nama = `Level ${level} sub-topik ${s.id}`
      expect(s.contohSoal.soal.trim(), nama).not.toBe('')
      expect(s.contohSoal.langkah.length, nama).toBeGreaterThanOrEqual(2)
      expect(s.contohSoal.jawaban.trim(), nama).not.toBe('')
    }
  })

  it('Level 1 sampai 3 sudah punya penjelasan lengkap di semua sub-topik', () => {
    for (const l of LEVELS.filter((x) => x.level <= 3)) {
      for (const s of l.subtopik) expect(s.lengkap, `Level ${l.level} sub-topik ${s.id}`).toBeDefined()
    }
  })

  it('kunci jawaban cek pemahaman selalu menunjuk opsi yang ada', () => {
    for (const { level, s } of semuaSub) {
      expect(s.cek.benar, `Level ${level} sub-topik ${s.id}`).toBeLessThan(s.cek.opsi.length)
    }
  })
})

// Posisi terakhir di materi (sub-topik yang sudah lolos cek) disimpan per pengguna di perangkat.
// Kunci localStorage per pengguna dan level, contoh: jarecom:pos:<id pengguna>:3
const k = (uid: string, n: number) => `jarecom:pos:${uid}:${n}`
/** Jumlah sub-topik yang sudah lolos cek di level n (0 jika belum ada atau penyimpanan tidak tersedia). */
export const getDoneSubtopics = (uid: string, n: number): number => {
  try { return Number(localStorage.getItem(k(uid, n)) ?? 0) } catch { return 0 }
}
/** Simpan jumlah sub-topik yang sudah lolos. Galat penyimpanan (mode privat) diabaikan. */
export const setDoneSubtopics = (uid: string, n: number, v: number) => {
  try { localStorage.setItem(k(uid, n), String(v)) } catch { /* abaikan */ }
}

/** Gabungkan posisi dari server ke perangkat; yang lebih jauh menang. */
export const mergeDoneSubtopics = (uid: string, pos: Record<string, number> | null | undefined) => {
  for (const [lv, v] of Object.entries(pos ?? {})) {
    const n = Number(lv)
    if (Number.isFinite(n) && Number(v) > getDoneSubtopics(uid, n)) setDoneSubtopics(uid, n, Number(v))
  }
}

// Sub-topik yang cek pemahamannya sudah dijawab benar tapi tombol Lanjut belum ditekan (misalnya pindah menu dulu).
const ck = (uid: string, n: number) => `jarecom:cek:${uid}:${n}`
/** Indeks sub-topik yang ceknya sudah benar dan belum dilanjutkan, atau -1. */
export const getAnsweredCheck = (uid: string, n: number): number => {
  try { const v = localStorage.getItem(ck(uid, n)); return v === null ? -1 : Number(v) } catch { return -1 }
}
/** Catat cek sub-topik idx sudah benar; idx = -1 menghapus catatan. */
export const setAnsweredCheck = (uid: string, n: number, idx: number) => {
  try { if (idx < 0) localStorage.removeItem(ck(uid, n)); else localStorage.setItem(ck(uid, n), String(idx)) } catch { /* abaikan */ }
}

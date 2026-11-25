// Langkah tur panduan. Teks yang sama dipakai di halaman Bantuan.
/** Satu langkah tur: `target` cocok dengan atribut data-tour pada elemen yang disorot. */
export interface TourStep { target: string; title: string; body: string }

/** Daftar langkah tur, urut dari awal sampai akhir. */
export const TOUR_STEPS: TourStep[] = [
  { target: 'lanjut', title: 'Mulai dari sini', body: 'Beranda menunjukkan level yang sedang kamu pelajari. Ketuk tombolnya untuk melanjutkan belajar.' },
  { target: 'peta', title: 'Peta belajar', body: 'Ada 11 level yang terbuka berurutan. Selesaikan satu level untuk membuka level berikutnya.' },
  { target: 'nav-materi', title: 'Baca materinya', body: 'Di tab Materi kamu membaca uraian dan ilustrasi, lalu menjawab cek pemahaman.' },
  { target: 'nav-kuis', title: 'Uji pemahamanmu', body: 'Setelah materi selesai, kerjakan kuis. Skor 70 atau lebih berarti lulus dan level berikutnya terbuka.' },
  { target: 'nav-progres', title: 'Pantau kemajuanmu', body: 'Lihat XP, level, peta panas, dan lencana yang sudah kamu kumpulkan.' },
  { target: 'nav-profil', title: 'Atur akunmu', body: 'Di Profil kamu bisa mengatur suara dan gerak, memasang aplikasi, dan melihat panduan ini lagi.' }
]

// Kunci localStorage penanda tur sudah dilihat, per pengguna.
const key = (uid: string) => `jarecom:tur:${uid}`

/** Sudah pernah melihat tur di perangkat ini? */
export const tourSeen = (uid: string): boolean => {
  try { return localStorage.getItem(key(uid)) === '1' } catch { return true }
}
/** Catat bahwa tur sudah dilihat di perangkat ini. */
export const markTourSeen = (uid: string) => {
  try { localStorage.setItem(key(uid), '1') } catch { /* abaikan */ }
}

/** Elemen sasaran yang sedang terlihat (menu ada dua: samping dan bawah). */
export function findTarget(name: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)
  for (const el of all) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}

// Langkah tur panduan. Teks yang sama dipakai di halaman Bantuan.
/** Satu langkah tur: `target` cocok dengan atribut data-tour pada elemen yang disorot. */
export interface TourStep { target: string; title: string; body: string }

/** Daftar langkah tur, urut dari awal sampai akhir. */
export const TOUR_STEPS: TourStep[] = [
  { target: 'lanjut', title: 'Mulai dari sini', body: 'Kartu biru menunjukkan level dan sub-topik yang sedang kamu pelajari. Ketuk tombolnya untuk lanjut belajar.' },
  { target: 'bar', title: 'XP dan level', body: 'Bar di atas selalu menampilkan XP dan level kamu, di halaman mana pun.' },
  { target: 'peta', title: 'Peta belajar', body: 'Ada 11 level yang terbuka berurutan. Selesaikan materi dan lulus kuis untuk membuka level berikutnya.' },
  { target: 'nav-materi', title: 'Baca materinya', body: 'Di Materi kamu membaca per sub-topik, lalu menjawab cek pemahaman.' },
  { target: 'nav-kuis', title: 'Uji pemahamanmu', body: 'Setelah materi selesai, kerjakan kuis 10 soal. Skor 70 atau lebih berarti lulus.' },
  { target: 'nav-lab', title: 'Rakit jaringan', body: 'Lab punya dua tab. Rakit: 12 misi seperti Cisco Packet Tracer. Simulasi: gambar interaktif kabel, OSI, hub dan switch, IP, dan subnet.' },
  { target: 'nav-progres', title: 'Pantau kemajuanmu', body: 'Lihat XP, lencana, dan peta panas 11 level.' },
  { target: 'nav-profil', title: 'Menu akun', body: 'Ketuk lingkaran inisialmu di kanan atas untuk membuka Profil, Bantuan, Kredit, atau keluar.' }
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

// ===== Tur Lab =====
/** Tur singkat halaman misi Lab: muncul sekali saat pertama membuka misi, bisa diulang dari tombol Tur. */
export const LAB_TOUR_STEPS: TourStep[] = [
  { target: 'lab-palet', title: 'Palet perangkat', body: 'Di sini ada perangkat dan kabel. Pilih kategori Network Devices atau End Devices, lalu pilih perangkatnya.' },
  { target: 'lab-area', title: 'Area kerja', body: 'Setelah memilih perangkat, ketuk area kerja untuk menaruhnya. Ketuk perangkat untuk mengisi IP, seret untuk memindah.' },
  { target: 'lab-kabel', title: 'Sambungkan kabel', body: 'Buka Connections, pilih kabel, lalu ketuk dua perangkat yang mau disambung. Kabel Automatic memilih jenis yang tepat.' },
  { target: 'lab-pdu', title: 'Uji dengan ping', body: 'Add Simple PDU mengirim ping: ketuk PC pengirim lalu PC tujuan. Hasilnya muncul di PDU List.' },
  { target: 'lab-ins', title: 'Ikuti Instructions', body: 'Langkah misi dan Completion ada di sini. Salah langkah? Tekan Undo atau Ctrl+Z. Tur ini bisa diulang dari tombol Tur.' }
]

const labKey = (uid: string) => `jarecom:tur-lab:${uid}`
/** Sudah pernah melihat tur Lab di perangkat ini? */
export const labTourSeen = (uid: string): boolean => {
  try { return localStorage.getItem(labKey(uid)) === '1' } catch { return true }
}
/** Catat bahwa tur Lab sudah dilihat di perangkat ini. */
export const markLabTourSeen = (uid: string) => {
  try { localStorage.setItem(labKey(uid), '1') } catch { /* abaikan */ }
}

/** Pesan Netty di misi yang pertama kali memunculkan alat baru (lihat missionTools di lib/lab.ts). */
export const NEW_TOOL_TIPS: Record<number, string> = {
  7: 'Alat baru: kabel Copper Straight-Through dan Cross-Over. Cek di Connections ya.',
  8: 'Alat baru: Hub, dan tombol Simulation untuk melihat paket berjalan pelan.',
  10: 'Alat baru: Router, untuk menghubungkan dua jaringan yang berbeda.'
}

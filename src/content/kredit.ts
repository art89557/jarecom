// Isi halaman Kredit (/kredit): tim, sumber, dan keterangan aplikasi.
// Semua teks ada di sini supaya mudah diubah tanpa menyentuh tampilan.

/** Anggota tim. `nim` dan `foto` boleh kosong; kalau kosong, bagian itu tidak ditampilkan / diganti inisial. */
export interface Anggota {
  nama: string
  nim?: string
  role: string
  /** Alamat gambar di folder public, mis. '/tim/rafif.jpg'. Kosong = tampil inisial nama. */
  foto?: string
}

/** Tim pengembang (urutan sama dengan slide kelompok). Foto ada di public/tim/ (persegi 256 px). */
export const TIM: Anggota[] = [
  { nama: 'Ahmad Rafif Taufiqurrahman', nim: '1152800016', role: 'Project Manager', foto: '/tim/rafif.jpg' },
  { nama: 'Muhamad Ikbar Tikanto', nim: '1152800011', role: 'Programmer', foto: '/tim/ikbar.jpg' },
  { nama: 'Muhammad Arik Hadi Sucahyo', nim: '1152800017', role: 'Analis', foto: '/tim/arik.jpg' },
  { nama: 'Ibrahim Hafid Hatim', nim: '1152800006', role: 'Designer', foto: '/tim/hafid.jpg' }
]

/** Satu kelompok sumber: judul kecil dan daftar butir. */
export interface Sumber { judul: string; butir: string[] }

/** Daftar sumber dan referensi, dikelompokkan. */
export const SUMBER: Sumber[] = [
  {
    judul: 'Kurikulum dan materi',
    butir: [
      'RPS Jaringan Komputer (IF432103), Program Studi Teknik Informatika, 3 SKS, semester 4: acuan urutan topik dan capaian belajar.',
      'Materi kuliah Jaringan Komputer (P-01 sampai P-11, slide dan PDF) yang dirangkum menjadi 11 level.'
    ]
  },
  {
    judul: 'Pustaka (menurut RPS)',
    butir: [
      'Kurose, J. F. dan Ross, K. W. (2012). Computer Networking: A Top-Down Approach, edisi ke-6. Addison-Wesley.',
      'Palmer, M. (2013). Hands-on Networking Fundamentals. Cengage Learning.',
      'Structured Computer Organization. Prentice-Hall India.'
    ]
  },
  {
    judul: 'Aset',
    butir: [
      'Logo Jar’ecom, maskot Netty, ikon, dan suara efek: dibuat oleh tim pengembang.',
      'Font: Space Grotesk dan Inter (Google Fonts, SIL Open Font License).'
    ]
  },
  {
    judul: 'Teknologi',
    butir: [
      'React, TypeScript, Vite, Tailwind CSS, React Router, dan Howler.js (suara).',
      'Supabase untuk akun dan penyimpanan kemajuan; service worker (vite-plugin-pwa) agar bisa dipasang sebagai aplikasi.'
    ]
  }
]

/** Versi aplikasi. Samakan dengan "version" di package.json bila diubah. */
export const VERSI = '0.1.0'

/** Riwayat perubahan, terbaru di atas. */
export const CHANGELOG: { tanggal: string; isi: string }[] = [
  { tanggal: '26 Nov 2026', isi: 'Lab Topologi gaya Packet Tracer (6 misi: Bus sampai Hybrid), halaman Kredit, dan menu samping yang lebih lega.' },
  { tanggal: '25 Nov 2026', isi: 'Komentar penjelas di seluruh kode agar mudah dibaca.' },
  { tanggal: '22 Nov 2026', isi: 'Persen level di Peta ikut menghitung sub-topik yang sudah selesai.' },
  { tanggal: '21 Nov 2026', isi: 'Suara efek, suara panduan tur, halaman atur kata sandi baru, dan menyimpan posisi baca di akun.' },
  { tanggal: '21 Nov 2026', isi: 'Rilis awal: 11 level materi dan kuis, XP, lencana, tur panduan, dan halaman Bantuan.' }
]

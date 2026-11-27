# Jar'ecom

PWA belajar Jaringan Komputer: 11 level, kuis dengan skor lulus 70, XP, dan level yang terbuka berurutan. Isi materi dari 11 file materi dosen (lihat `src/content/`).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173, mode lokal (data di browser)
npm test           # aturan XP dan unlock
npm run build      # build produksi + PWA
```

Tanpa konfigurasi, aplikasi berjalan di **mode lokal**: akun dan progres disimpan di `localStorage` browser. Ini hanya untuk demo; kata sandi tidak di-hash.

## Memakai Supabase (produksi)

1. Buat proyek di supabase.com. Di Authentication, pakai Email (kata sandi minimal 8 karakter).
2. SQL Editor: jalankan `supabase/schema.sql`, lalu `supabase/seed.sql`.
3. Salin `.env.example` menjadi `.env`, isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (Project Settings, API).
4. Authentication > URL Configuration: isi Site URL dengan alamat aplikasi dan tambahkan `<alamat>/sandi-baru` ke Redirect URLs (halaman atur kata sandi baru).
5. `npm run dev` lagi. Halaman Profil menampilkan "Mode data: Supabase".

Skor kuis, XP, dan unlock dihitung oleh fungsi Postgres (`complete_material`, `submit_quiz`, `get_state`). Tabel progres tidak punya policy tulis, dan tabel `quiz_questions` (kunci jawaban) tidak bisa dibaca klien. Jawaban pertama per soal dikunci di tabel `quiz_answers`, dan saat build dengan Supabase kunci jawaban dibuang dari bundle (`stripQuizKeys` di `vite.config.ts`). `delete_account()` menghapus akun pemanggil beserta progresnya.
Mengubah soal: edit `src/content/level-N.json`, lalu `npm run seed:sql` dan jalankan ulang `supabase/seed.sql`.

## Deploy

Vercel atau Netlify: build command `npm run build`, output `dist`. Aturan SPA sudah ada (`vercel.json`, `public/_redirects`). Isi dua variabel `VITE_SUPABASE_*` di pengaturan hosting.

## Struktur

- `src/lib/engine.ts` aturan sistem (diuji di `engine.test.ts`)
- `src/lib/repo.ts` antarmuka data; `localRepo.ts` (demo) dan `supabaseRepo.ts` (produksi)
- `src/pages/` layar: Auth, Home, MapPage (jalur level), Material (termasuk layar perayaan), Quiz, Progress (tab Ringkasan `/progres`, Lencana `/progres/lencana`, Riwayat XP `/progres/riwayat`), Profile (kartu pencapaian, tema, ukuran teks, hapus akun), Help, Credit, Simulasi
- `src/pages/lab/` Lab Topologi 12 misi: `LabList` (daftar misi), `LabPlay` (area kerja bergaya Packet Tracer), `DeviceDialog` (Physical, Config, Desktop dengan Command Prompt), `parts`; logika di `src/lib/lab.ts` (diuji di `lab.test.ts`)
- `src/lib/labDraft.ts` simpan otomatis Lab per misi; `src/lib/useLeaveGuard.ts` konfirmasi keluar kuis; `src/lib/tour.ts` langkah tur aplikasi dan tur Lab; `src/lib/prefs.ts` preferensi (gerak, Netty diam, ukuran teks, tema)
- `src/components/` Netty (maskot beranimasi), Art (gambar topologi dan diagram materi), Tour, Confirm, Shell (menu 5 item dan menu akun), ErrorBoundary
- `src/components/icons.tsx` set ikon SVG dan lencana (tanpa emoji)
- `src/content/` materi dan soal per level (JSON)
- `public/netty/` maskot, `public/sfx/` bunyi (Howler.js)

## Aturan

Level 1 terbuka. Level n+1 terbuka jika materi n selesai dan kuis n lulus (skor 70 atau lebih). XP: materi selesai +20, kuis lulus +50 (sekali), skor 100 bonus +20 (sekali). Kuis boleh diulang. Progres hanya untuk dilihat.

Skor terbaik per level (`best`) dan riwayat XP (`events`) disimpan di progres; `get_state` di `schema.sql` mengembalikan keduanya, jadi jalankan ulang `schema.sql` di proyek Supabase. Status kuis dan heatmap juga diturunkan (`quizStatus`, `heatState`).

Lencana: satu per level. Biru saat kuis lulus, emas jika pernah skor 100. Dihitung dari progres (`badgeState` di `engine.ts`), tidak disimpan. Status node jalur juga dihitung (`nodeState`).

## Catatan

- Level 2, 3, 9, dan 10 isinya perlu dicocokkan dengan slide asli (lihat `sumber` di tiap JSON).
- Animasi Lottie belum dipasang; umpan balik memakai animasi CSS (dimatikan saat prefers-reduced-motion) dan bunyi Howler.
- Posisi terakhir di materi tersimpan di perangkat dan disinkronkan ke server (`save_position`). Pekerjaan Lab tersimpan di perangkat saja (tidak pindah antar-perangkat).

## Suara

- **Suara efek** (`public/sfx/*.wav`) dibuat dengan `python3 tools/gen-sfx.py` (nada orisinal, bukan sampel pihak lain). Ubah nada di skrip itu lalu jalankan lagi.
- **Suara panduan** pada tur: taruh rekaman `public/voice/tur-1.mp3` sampai `tur-8.mp3` (satu per langkah tur aplikasi). Tur Lab (5 langkah) memakai suara bawaan perangkat. Jika file tidak ada, aplikasi memakai suara bahasa Indonesia bawaan perangkat. Tidak berbunyi sendiri; hanya dari tombol "Dengarkan".

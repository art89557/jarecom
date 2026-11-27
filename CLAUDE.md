# Jar'ecom

PWA belajar Jaringan Komputer. Baca README.md untuk perintah.

## Aturan sistem (jangan diubah tanpa persetujuan)
- Level 1 terbuka; level n+1 butuh materi n selesai dan kuis n lulus (skor >= 70)
- XP: materi +20, kuis lulus +50, skor 100 bonus +20; masing-masing sekali per level
- Kuis boleh diulang; Progres read-only
- Di mode Supabase semua hitungan ada di fungsi Postgres (supabase/schema.sql), bukan di klien. Ubah engine.ts dan schema.sql bersamaan, dan jalankan `npm test`.

- Lencana, status node jalur, status kuis, dan warna heatmap diturunkan dari progres, tidak disimpan. Hanya `best` dan `events` yang disimpan tambahan.
- Rute Progres: /progres, /progres/lencana, /progres/riwayat (read-only)

## Keamanan kuis (jangan dilemahkan)
- Kunci jawaban tidak boleh sampai ke klien di mode Supabase: `stripQuizKeys` di vite.config.ts membuang `benar` dan `penjelasan` kuis dari JSON level saat build.
- Jawaban pertama per soal dikunci di tabel `quiz_answers` (`check_answer`); `submit_quiz` menghitung skor dari jawaban terkunci; `get_quiz` mereset percobaan.
- Hapus akun lewat RPC `delete_account()` (hanya akun pemanggil). Jangan pernah taruh service_role key di frontend.

## Lab dan alur belajar
- Kode Lab ada di src/pages/lab/ (LabList, LabPlay, DeviceDialog, parts); logika murni di src/lib/lab.ts (diuji di lab.test.ts).
- `missionTools(n)` menentukan alat yang tampil per misi: kabel manual dari misi 7, Hub dan Simulation dari misi 8, Router dari misi 10. Tombol "Semua alat" menampilkan semuanya. Pesan Netty untuk alat baru ada di `NEW_TOOL_TIPS` (src/lib/tour.ts).
- Pekerjaan Lab tersimpan otomatis per misi di perangkat (src/lib/labDraft.ts); Reset Activity menghapusnya.
- Kuis memakai `useLeaveGuard` (src/lib/useLeaveGuard.ts): pindah lewat link, Back, atau refresh meminta konfirmasi selama kuis berjalan.
- Tur: `TOUR_STEPS` (tur aplikasi, 8 langkah, rekaman public/voice/tur-N.mp3) dan `LAB_TOUR_STEPS` (tur Lab, 5 langkah, suara perangkat). Komponen src/components/Tour.tsx; sasaran ditandai atribut `data-tour`.

## Gaya
- Tanpa emoji; pakai ikon dari src/components/icons.tsx
- Bahasa UI: Indonesia. Penamaan: "Level 1" sampai "Level 11", judul sesuai file materi.
- Token warna di tailwind.config.js; teks bantu minimal 14 px; area sentuh minimal 44 px
- Semua animasi harus mati saat prefers-reduced-motion
- Mode gelap: kelas `html.dark` dan tabel override warna di akhir src/index.css. Elemen `.paper` (gambar, area kerja Lab) tetap terang; `.on-color` untuk tombol putih di kartu berwarna.
- Istilah Packet Tracer di Lab tetap bahasa Inggris dengan keterangan kecil bahasa Indonesia.

## Alur kerja
- Kerjakan di branch fitur; jangan merge ke main tanpa persetujuan (push ke main = deploy ke jarecom.vercel.app).
- Sebelum push: `npx tsc --noEmit -p .`, `npm test`, `npm run build`. CI (.github/workflows/ci.yml) menjalankan tes dan build di setiap push.
- .env tidak di-commit.

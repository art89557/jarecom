# Jar'ecom

PWA belajar Jaringan Komputer. Baca README.md untuk perintah.

## Aturan sistem (jangan diubah tanpa persetujuan)
- Level 1 terbuka; level n+1 butuh materi n selesai dan kuis n lulus (skor >= 70)
- XP: materi +20, kuis lulus +50, skor 100 bonus +20; masing-masing sekali per level
- Kuis boleh diulang; Progres read-only
- Di mode Supabase semua hitungan ada di fungsi Postgres (supabase/schema.sql), bukan di klien. Ubah engine.ts dan schema.sql bersamaan, dan jalankan `npm test`.

- Lencana, status node jalur, status kuis, dan warna heatmap diturunkan dari progres, tidak disimpan. Hanya `best` dan `events` yang disimpan tambahan.
- Rute Progres: /progres, /progres/lencana, /progres/riwayat (read-only)

## Gaya
- Tanpa emoji; pakai ikon dari src/components/icons.tsx
- Bahasa UI: Indonesia. Penamaan: "Level 1" sampai "Level 11", judul sesuai file materi.
- Token warna di tailwind.config.js; teks bantu minimal 14 px; area sentuh minimal 44 px
- Semua animasi harus mati saat prefers-reduced-motion

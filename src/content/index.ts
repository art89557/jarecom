// Konten belajar: satu file JSON per level (materi per sub-topik dan 10 soal kuis).
// Konten ikut terbangun di aplikasi, bukan diambil dari database.
import l1 from './level-1.json'
import l2 from './level-2.json'
import l3 from './level-3.json'
import l4 from './level-4.json'
import l5 from './level-5.json'
import l6 from './level-6.json'
import l7 from './level-7.json'
import l8 from './level-8.json'
import l9 from './level-9.json'
import l10 from './level-10.json'
import l11 from './level-11.json'

/** Satu soal pilihan ganda. `benar` = indeks opsi yang benar (mulai 0). Dipakai untuk cek sub-topik dan kuis. */
export interface CekQ { pertanyaan: string; opsi: string[]; benar: number; penjelasan: string }
/** Satu istilah penting beserta artinya, ditampilkan di "Penjelasan lengkap". */
export interface Istilah { istilah: string; arti: string }
/**
 * Penjelasan lengkap satu sub-topik (opsional), dibuka lewat tombol "Penjelasan lengkap".
 * `caraKerja` = beberapa paragraf penjelasan; `analogi` = perumpamaan sehari-hari;
 * `contoh` = contoh di jaringan nyata; `istilah` = daftar istilah penting.
 */
export interface Lengkap { caraKerja: string[]; analogi?: string; contoh?: string; istilah?: Istilah[] }
/** Contoh soal yang dikerjakan langkah demi langkah (opsional, untuk topik hitungan). */
export interface ContohSoal { soal: string; langkah: string[]; jawaban: string }
/**
 * Satu sub-topik materi: uraian ringkas, poin, satu soal cek pemahaman,
 * lalu (opsional) penjelasan lengkap dan contoh soal bertahap.
 */
export interface SubTopik { id: number; judul: string; uraian: string; poin: string[]; cek: CekQ; lengkap?: Lengkap; contohSoal?: ContohSoal }
/** Isi satu level: materi per sub-topik, lalu soal kuis akhir. */
export interface LevelContent { level: number; judul: string; sumber: string; subtopik: SubTopik[]; kuis: CekQ[] }

/** Semua level, urut dari 1 sampai 11. */
export const LEVELS: LevelContent[] = [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11] as LevelContent[]
/** Jumlah level yang tersedia. */
export const TOTAL_LEVELS = LEVELS.length
/** Ambil isi satu level, atau undefined jika nomornya tidak ada. */
export const getLevel = (n: number): LevelContent | undefined => LEVELS.find((l) => l.level === n)

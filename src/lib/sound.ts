import { Howl } from 'howler'

// Efek suara (Howler). Pilihan suara disimpan di perangkat dan aktif secara bawaan.
const KEY = 'jarecom:sound'
let enabled = true
try { enabled = localStorage.getItem(KEY) !== 'off' } catch { /* abaikan */ }

const NAMES = ['benar', 'salah', 'lulus', 'tekan'] as const
type Nama = (typeof NAMES)[number]

// Dibuat langsung saat modul dimuat dan dipramuat. Dengan preload:false Howler tidak
// pernah memuat file-nya, sehingga play() diam saja. Membuat Howl lebih awal juga membuat
// Howler memasang pembuka kunci audio pada sentuhan pertama (perlu di iOS/Safari).
const cache = {} as Record<Nama, Howl>
for (const n of NAMES) cache[n] = new Howl({ src: [`/sfx/${n}.wav`], volume: 0.6, preload: true })

/** Apakah efek suara aktif? */
export const soundOn = () => enabled
/** Aktifkan atau matikan efek suara, dan simpan pilihannya. */
export const setSound = (v: boolean) => {
  enabled = v
  try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch { /* abaikan */ }
}
// Hanya dipanggil dari aksi pengguna (klik), jadi lolos aturan autoplay browser.
/** Putar satu efek suara jika suara aktif. */
export const play = (n: Nama) => {
  if (enabled) cache[n].play()
}
/** Apakah sistem pengguna meminta gerak dikurangi? Dipakai untuk menahan animasi dan suara tambahan. */
export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

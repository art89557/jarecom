import { Howl } from 'howler'

const KEY = 'jarecom:sound'
let enabled = true
try { enabled = localStorage.getItem(KEY) !== 'off' } catch { /* abaikan */ }

const NAMES = ['benar', 'salah', 'lulus'] as const
type Nama = (typeof NAMES)[number]

// Dibuat langsung saat modul dimuat dan dipramuat. Dengan preload:false Howler tidak
// pernah memuat file-nya, sehingga play() diam saja. Membuat Howl lebih awal juga membuat
// Howler memasang pembuka kunci audio pada sentuhan pertama (perlu di iOS/Safari).
const cache = {} as Record<Nama, Howl>
for (const n of NAMES) cache[n] = new Howl({ src: [`/sfx/${n}.wav`], volume: 0.6, preload: true })

export const soundOn = () => enabled
export const setSound = (v: boolean) => {
  enabled = v
  try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch { /* abaikan */ }
}
// Hanya dipanggil dari aksi pengguna (klik), jadi lolos aturan autoplay browser.
export const play = (n: Nama) => {
  if (enabled) cache[n].play()
}
export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

import { Howl } from 'howler'

const KEY = 'jarecom:sound'
let enabled = true
try { enabled = localStorage.getItem(KEY) !== 'off' } catch { /* abaikan */ }

const cache: Record<string, Howl> = {}
const get = (n: string) => (cache[n] ??= new Howl({ src: [`/sfx/${n}.wav`], volume: 0.6, preload: false }))

export const soundOn = () => enabled
export const setSound = (v: boolean) => {
  enabled = v
  try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch { /* abaikan */ }
}
// Hanya dipanggil dari aksi pengguna (klik), jadi lolos aturan autoplay browser.
export const play = (n: 'benar' | 'salah' | 'lulus') => {
  if (enabled) get(n).play()
}
export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

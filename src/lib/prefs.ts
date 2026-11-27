// Preferensi tampilan di perangkat ini. "Kurangi animasi" menambah kelas pada <html>.
const KEY = 'jarecom:reduce'
/** Apakah "kurangi animasi" aktif di perangkat ini? */
export const reduceOn = (): boolean => {
  try { return localStorage.getItem(KEY) === 'on' } catch { return false }
}
/** Terapkan ke halaman: kelas `reduce-motion` mematikan semua animasi lewat CSS. */
export const applyReduce = (v: boolean) => {
  document.documentElement.classList.toggle('reduce-motion', v)
}
/** Simpan pilihan pengguna lalu langsung terapkan. */
export const setReduce = (v: boolean) => {
  try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch { /* abaikan */ }
  applyReduce(v)
}

// "Netty diam": sembunyikan gelembung ucapan Netty di perangkat ini. Komponen Netty mendengarkan perubahannya.
const QKEY = 'jarecom:netty-diam'
const qSubs = new Set<(v: boolean) => void>()
/** Apakah Netty diminta diam (tanpa gelembung ucapan)? */
export const nettyQuiet = (): boolean => {
  try { return localStorage.getItem(QKEY) === 'on' } catch { return false }
}
/** Simpan pilihan "Netty diam" dan beri tahu semua Netty yang tampil. */
export const setNettyQuiet = (v: boolean) => {
  try { localStorage.setItem(QKEY, v ? 'on' : 'off') } catch { /* abaikan */ }
  qSubs.forEach((f) => f(v))
}
/** Dengarkan perubahan "Netty diam". Mengembalikan fungsi untuk berhenti mendengarkan. */
export const onNettyQuiet = (f: (v: boolean) => void) => { qSubs.add(f); return () => { qSubs.delete(f) } }

// Ukuran teks: memperbesar seluruh tampilan (teks, tombol, dan jarak ikut membesar) lewat CSS `zoom` pada <html>.
// Dipakai zoom, bukan font-size, karena banyak ukuran teks ditulis dalam piksel.
export type TextSize = 'normal' | 'besar' | 'sangat-besar'
export const TEXT_SIZES: [TextSize, string, number][] = [['normal', 'Normal', 1], ['besar', 'Besar', 1.125], ['sangat-besar', 'Sangat besar', 1.25]]
const TKEY = 'jarecom:teks'
/** Ukuran teks yang dipilih di perangkat ini. */
export const textSize = (): TextSize => {
  try { const v = localStorage.getItem(TKEY); return TEXT_SIZES.some(([k]) => k === v) ? (v as TextSize) : 'normal' } catch { return 'normal' }
}
/** Terapkan ukuran teks ke halaman. */
export const applyTextSize = (v: TextSize) => {
  const z = TEXT_SIZES.find(([k]) => k === v)?.[2] ?? 1
  document.documentElement.style.setProperty('zoom', z === 1 ? '' : String(z))
}
/** Simpan pilihan ukuran teks lalu langsung terapkan. */
export const setTextSize = (v: TextSize) => {
  try { localStorage.setItem(TKEY, v) } catch { /* abaikan */ }
  applyTextSize(v)
}

// Tema: terang, gelap, atau ikut pengaturan perangkat. Mode gelap = kelas `dark` pada <html> (warna di index.css).
export type Theme = 'terang' | 'gelap' | 'sistem'
export const THEMES: [Theme, string][] = [['terang', 'Terang'], ['gelap', 'Gelap'], ['sistem', 'Ikut perangkat']]
const MKEY = 'jarecom:tema'
const media = () => window.matchMedia?.('(prefers-color-scheme: dark)')
/** Tema yang dipilih di perangkat ini (bawaan: ikut perangkat). */
export const theme = (): Theme => {
  try { const v = localStorage.getItem(MKEY); return THEMES.some(([k]) => k === v) ? (v as Theme) : 'sistem' } catch { return 'sistem' }
}
/** Terapkan tema: pasang/lepas kelas `dark` dan sesuaikan warna bilah browser. */
export const applyTheme = (v: Theme) => {
  const dark = v === 'gelap' || (v === 'sistem' && !!media()?.matches)
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B1220' : '#2457F5')
}
/** Simpan pilihan tema lalu langsung terapkan. */
export const setTheme = (v: Theme) => {
  try { localStorage.setItem(MKEY, v) } catch { /* abaikan */ }
  applyTheme(v)
}
/** Saat tema "Ikut perangkat", ikuti perubahan mode gelap perangkat secara langsung. */
export const watchSystemTheme = () => media()?.addEventListener?.('change', () => { if (theme() === 'sistem') applyTheme('sistem') })

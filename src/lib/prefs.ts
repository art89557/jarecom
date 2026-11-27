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

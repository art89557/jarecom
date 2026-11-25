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

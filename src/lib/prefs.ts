// Preferensi tampilan di perangkat ini. "Kurangi animasi" menambah kelas pada <html>.
const KEY = 'jarecom:reduce'
export const reduceOn = (): boolean => {
  try { return localStorage.getItem(KEY) === 'on' } catch { return false }
}
export const applyReduce = (v: boolean) => {
  document.documentElement.classList.toggle('reduce-motion', v)
}
export const setReduce = (v: boolean) => {
  try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch { /* abaikan */ }
  applyReduce(v)
}

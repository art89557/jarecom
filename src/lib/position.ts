// Posisi terakhir di materi (sub-topik yang sudah lolos cek) disimpan per pengguna di perangkat.
const k = (uid: string, n: number) => `jarecom:pos:${uid}:${n}`
export const getDoneSubtopics = (uid: string, n: number): number => {
  try { return Number(localStorage.getItem(k(uid, n)) ?? 0) } catch { return 0 }
}
export const setDoneSubtopics = (uid: string, n: number, v: number) => {
  try { localStorage.setItem(k(uid, n), String(v)) } catch { /* abaikan */ }
}

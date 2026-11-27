// Simpanan sementara pekerjaan Lab per misi di perangkat ini, supaya pindah menu tidak menghapus area kerja.
import type { Net, Pdu } from './lab'

/** Keadaan satu misi yang bisa dilanjutkan. */
export interface LabDraft { net: Net; pdus: Pdu[]; step: number; since: number; finished: boolean }

const key = (uid: string, n: number) => `jarecom:lab-draft:${uid}:${n}`

/** Ambil simpanan misi ke-n, atau null bila tidak ada atau rusak. */
export function loadLabDraft(uid: string, n: number): LabDraft | null {
  try {
    const d = JSON.parse(localStorage.getItem(key(uid, n)) ?? 'null') as LabDraft | null
    return d && Array.isArray(d.net?.devices) && Array.isArray(d.pdus) ? d : null
  } catch { return null }
}
/** Simpan keadaan misi ke-n; area kerja kosong tanpa kemajuan berarti simpanan dihapus. */
export function saveLabDraft(uid: string, n: number, d: LabDraft) {
  try {
    if (!d.net.devices.length && !d.pdus.length && d.step === 0) localStorage.removeItem(key(uid, n))
    else localStorage.setItem(key(uid, n), JSON.stringify(d))
  } catch { /* penyimpanan penuh atau diblokir: abaikan */ }
}

// State global aplikasi: siapa yang masuk dan bagaimana kemajuannya.
// Halaman membacanya lewat useApp(); setelah aksi (mis. kuis selesai) cukup panggil refresh().
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { repo } from './lib'
import { emptyProgress, type Progress } from './lib/engine'
import type { User } from './lib/repo'

/** Isi state yang dibagikan ke semua halaman. */
interface Ctx {
  ready: boolean // true setelah pemeriksaan sesi awal selesai (mencegah kedipan halaman login)
  user: User | null // null jika belum masuk
  progress: Progress // kemajuan belajar; kosong jika belum masuk
  setUser: (u: User | null) => void // dipanggil setelah masuk/daftar; otomatis memuat ulang progres
  refresh: () => Promise<void> // muat ulang pengguna dan progres dari sumber data
  signOut: () => Promise<void> // keluar dan kosongkan state
  tour: boolean // apakah tur panduan sedang tampil
  setTour: (v: boolean) => void
}
const C = createContext<Ctx | null>(null)

/** Penyedia state. Dipasang sekali di main.tsx. */
export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<Progress>(emptyProgress())
  const [tour, setTour] = useState(false)

  // Muat ulang pengguna lalu progresnya. Jika jaringan putus, data terakhir dipertahankan.
  const refresh = useCallback(async () => {
    try {
      const u = await repo.getUser()
      setUser(u)
      setProgress(u ? await repo.getProgress() : emptyProgress())
    } catch {
      /* jaringan putus: pertahankan data terakhir */
    }
  }, [])

  // Saat aplikasi dibuka: cek sesi tersimpan, lalu tandai siap.
  useEffect(() => { void refresh().finally(() => setReady(true)) }, [refresh])

  // Nilai konteks dibuat ulang hanya bila datanya berubah, supaya halaman tidak render berlebihan.
  const value = useMemo<Ctx>(() => ({
    ready, user, progress, tour, setTour,
    setUser: (u) => { setUser(u); void refresh() },
    refresh,
    signOut: async () => { await repo.signOut(); setUser(null); setProgress(emptyProgress()); setTour(false) }
  }), [ready, user, progress, refresh, tour])

  return <C.Provider value={value}>{children}</C.Provider>
}

/** Ambil state global. Hanya boleh dipakai di dalam AppProvider. */
export const useApp = (): Ctx => {
  const v = useContext(C)
  if (!v) throw new Error('AppProvider hilang')
  return v
}

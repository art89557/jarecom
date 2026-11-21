import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { repo } from './lib'
import { emptyProgress, type Progress } from './lib/engine'
import type { User } from './lib/repo'

interface Ctx {
  ready: boolean
  user: User | null
  progress: Progress
  setUser: (u: User | null) => void
  refresh: () => Promise<void>
  signOut: () => Promise<void>
  tour: boolean
  setTour: (v: boolean) => void
}
const C = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<Progress>(emptyProgress())
  const [tour, setTour] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const u = await repo.getUser()
      setUser(u)
      setProgress(u ? await repo.getProgress() : emptyProgress())
    } catch {
      /* jaringan putus: pertahankan data terakhir */
    }
  }, [])

  useEffect(() => { void refresh().finally(() => setReady(true)) }, [refresh])

  const value = useMemo<Ctx>(() => ({
    ready, user, progress, tour, setTour,
    setUser: (u) => { setUser(u); void refresh() },
    refresh,
    signOut: async () => { await repo.signOut(); setUser(null); setProgress(emptyProgress()); setTour(false) }
  }), [ready, user, progress, refresh, tour])

  return <C.Provider value={value}>{children}</C.Provider>
}

export const useApp = (): Ctx => {
  const v = useContext(C)
  if (!v) throw new Error('AppProvider hilang')
  return v
}

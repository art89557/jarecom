// Penjaga keluar halaman: selama `active`, pindah lewat link mana pun (menu, logo, menu akun), tombol Back
// browser/HP, atau refresh meminta konfirmasi dulu. Dipakai di kuis karena keluar berarti mulai lagi dari soal 1.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useLeaveGuard(active: boolean) {
  const nav = useNavigate()
  const [pending, setPending] = useState<string | null>(null) // tujuan yang menunggu konfirmasi ('back' = tombol Back)
  const on = useRef(active)
  on.current = active
  const armed = useRef(false) // entri riwayat penahan tombol Back sudah dipasang
  const leaving = useRef(false) // pengguna sudah memilih keluar: jangan tahan lagi

  useEffect(() => {
    if (!active) return
    // Refresh atau tutup tab: peringatan bawaan browser.
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    // Klik link internal: tahan sebelum React Router berpindah (fase capture di document berjalan lebih dulu).
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || a.hasAttribute('download') || a.origin !== location.origin) return
      const to = a.pathname + a.search + a.hash
      if (to === location.pathname + location.search) return
      e.preventDefault(); e.stopPropagation(); setPending(to)
    }
    // Tombol Back: pasang satu entri riwayat dengan alamat yang sama; saat Back ditekan, pasang lagi lalu tanya.
    if (!armed.current) { history.pushState({ ...history.state, jarecomGuard: true }, ''); armed.current = true }
    const pop = () => { if (!on.current || leaving.current) return; history.pushState({ ...history.state, jarecomGuard: true }, ''); setPending('back') }
    addEventListener('beforeunload', unload)
    document.addEventListener('click', click, true)
    addEventListener('popstate', pop)
    return () => { removeEventListener('beforeunload', unload); document.removeEventListener('click', click, true); removeEventListener('popstate', pop) }
  }, [active])

  /** Lanjut keluar ke tujuan yang tadi ditahan. */
  const leave = useCallback(() => {
    const to = pending; leaving.current = true; setPending(null)
    if (to === 'back') history.go(-2) // lewati entri penahan dan halaman kuis ini
    else if (to) nav(to)
  }, [pending, nav])
  const stay = useCallback(() => setPending(null), [])
  return { pending: pending !== null, leave, stay }
}

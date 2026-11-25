import { useEffect, type RefObject } from 'react'

// Elemen yang bisa menerima fokus keyboard di dalam dialog.
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

/** Dialog aksesibel: fokus masuk, Tab berputar di dalam, Esc menutup, fokus kembali ke pemicu. */
export function useDialog(ref: RefObject<HTMLElement>, onClose: () => void, focusFirst = true) {
  useEffect(() => {
    // Ingat elemen pemicu supaya fokus bisa dikembalikan saat dialog ditutup.
    const opener = document.activeElement as HTMLElement | null
    const root = ref.current
    if (root && focusFirst) (root.querySelector<HTMLElement>(FOCUSABLE) ?? root).focus()
    // Esc menutup dialog. Tab dan Shift+Tab berputar di dalam dialog (focus trap).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
      if (e.key !== 'Tab' || !ref.current) return
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null)
      if (items.length === 0) return
      const first = items[0], last = items[items.length - 1]
      const a = document.activeElement
      if (e.shiftKey && (a === first || !ref.current.contains(a))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (a === last || !ref.current.contains(a))) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    // Pembersihan: lepas pendengar dan kembalikan fokus ke pemicu.
    return () => {
      document.removeEventListener('keydown', onKey, true)
      if (opener && document.contains(opener)) opener.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

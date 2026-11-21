import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { repo } from '../lib'
import { useApp } from '../state'
import { findTarget, markTourSeen, TOUR_STEPS, type TourStep } from '../lib/tour'
import { useDialog } from '../lib/useDialog'

interface Box { top: number; left: number; width: number; height: number }

/** Tur panduan: sorotan satu elemen per langkah dengan kartu penjelasan. */
export default function Tour() {
  const { user, setTour, refresh } = useApp()
  const [steps, setSteps] = useState<TourStep[]>([])
  const [i, setI] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  const card = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    if (user) markTourSeen(user.id)
    setTour(false)
    // Simpan juga di akun supaya tidak muncul lagi di perangkat lain; gagal simpan tidak mengganggu.
    if (user && !user.tourSeen) void repo.markTourSeen().then(refresh).catch(() => { /* abaikan */ })
  }, [user, setTour, refresh])

  useDialog(card, close, false)

  // Langkah yang sasarannya tidak ada di layar dilewati tanpa galat.
  useEffect(() => {
    const ok = TOUR_STEPS.filter((s) => findTarget(s.target))
    if (ok.length === 0) close()
    else setSteps(ok)
  }, [close])

  const step = steps[i]
  const measure = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight })
    const el = step ? findTarget(step.target) : null
    if (!el) { setBox(null); return }
    const r = el.getBoundingClientRect()
    const pad = 6
    setBox({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 })
  }, [step])

  useLayoutEffect(() => {
    if (!step) return
    const el = findTarget(step.target)
    if (el) {
      const r = el.getBoundingClientRect()
      if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'center' })
    }
    measure()
  }, [step, measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [measure])

  useEffect(() => { card.current?.querySelector<HTMLElement>('[data-next]')?.focus() }, [i, steps.length])

  if (!step) return null
  const last = i === steps.length - 1
  const w = Math.min(350, vp.w - 40)
  const below = box ? box.top + box.height / 2 < vp.h / 2 : true
  const pos: React.CSSProperties = { width: w, left: Math.max(20, Math.min((box ? box.left + box.width / 2 : vp.w / 2) - w / 2, vp.w - w - 20)) }
  if (box && below) pos.top = Math.min(box.top + box.height + 14, vp.h - 260)
  else if (box) pos.bottom = Math.max(vp.h - box.top + 14, 20)
  else pos.top = vp.h / 2 - 120

  return (
    <div className="fixed inset-0 z-50">
      {box && <div aria-hidden className="pointer-events-none fixed rounded-2xl border-[3px] border-white transition-all duration-200" style={{ ...box, boxShadow: '0 0 0 9999px rgba(15,27,45,.68)' }} />}
      {!box && <div aria-hidden className="fixed inset-0 bg-ink/70" />}
      <div ref={card} role="dialog" aria-modal="true" aria-labelledby="tur-judul" aria-describedby="tur-isi" className="fixed flex flex-col gap-2.5 rounded-[20px] bg-white p-[18px] shadow-[0_12px_32px_rgba(15,27,45,.35)]" style={pos}>
        <div className="flex items-center justify-between gap-3">
          <span aria-live="polite" className="text-sm font-bold text-ink-soft">Langkah {i + 1} dari {steps.length}</span>
          <span aria-hidden className="flex gap-1.5">{steps.map((_, k) => <span key={k} className={`h-2 rounded-full ${k === i ? 'w-[18px] bg-primary' : 'w-2 bg-[#C9D1DE]'}`} />)}</span>
        </div>
        <h2 id="tur-judul" className="text-[22px] font-bold leading-tight">{step.title}</h2>
        <p id="tur-isi" className="text-base leading-relaxed text-[#33415A]">{step.body}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <button type="button" onClick={close} className="mr-auto inline-flex min-h-[48px] items-center rounded-xl px-1.5 text-[15px] font-semibold text-[#4A5568] hover:underline">Lewati</button>
          {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="inline-flex min-h-[48px] items-center rounded-xl border-2 border-primary px-4 font-semibold text-primary hover:bg-primary-soft">Kembali</button>}
          <button type="button" data-next onClick={() => (last ? close() : setI(i + 1))} className="inline-flex min-h-[48px] items-center rounded-xl bg-primary px-[18px] font-semibold text-white hover:bg-primary-dark">{last ? 'Selesai' : 'Lanjut'}</button>
        </div>
      </div>
    </div>
  )
}

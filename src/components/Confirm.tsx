// Dialog konfirmasi sebelum aksi yang menghilangkan pekerjaan (keluar kuis, reset Lab).
// Tombol aman (batal) menerima fokus lebih dulu, jadi Enter tidak langsung menghapus.
import { useRef } from 'react'
import { useDialog } from '../lib/useDialog'
import { Netty } from './Netty'

interface Props {
  title: string // pertanyaan, mis. "Keluar dari kuis?"
  body: string // akibatnya, mis. "Jawabanmu belum disimpan."
  ok: string // label aksi berisiko, mis. "Ya, keluar"
  cancel?: string // label tombol batal
  onOk: () => void
  onCancel: () => void
}

/** Dialog konfirmasi aksesibel (fokus terkunci di dalam, Esc = batal). */
export default function Confirm({ title, body, ok, cancel = 'Batal', onOk, onCancel }: Props) {
  const box = useRef<HTMLDivElement>(null)
  useDialog(box, onCancel)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div ref={box} role="alertdialog" aria-modal="true" aria-labelledby="cf-t" aria-describedby="cf-b" className="pop flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-xl">
        <Netty pose="khawatir" size={88} />
        <h2 id="cf-t" className="text-xl font-bold">{title}</h2>
        <p id="cf-b" className="text-[15px] leading-snug text-[#33415A]">{body}</p>
        <div className="mt-1 flex w-full flex-col gap-2">
          <button type="button" className="btn" onClick={onCancel}>{cancel}</button>
          <button type="button" onClick={onOk} className="min-h-[48px] rounded-xl font-semibold text-fail hover:bg-fail-soft">{ok}</button>
        </div>
      </div>
    </div>
  )
}

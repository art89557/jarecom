// Kartu "fakta jaringan" di Beranda: sisi depan pertanyaan, sisi belakang jawaban.
import { Icon } from './icons'
import type { Fakta } from '../lib/fakta'

/** Kartu fakta yang bisa dibalik (checkbox tersembunyi, bisa dengan keyboard). */
export default function FaktaCard({ f, tall = false }: { f: Fakta; tall?: boolean }) {
  return (
    <label className="flip block cursor-pointer" aria-label="Kartu fakta jaringan, tekan untuk membalik">
      <input type="checkbox" className="sr-only" />
      <div className="flip-in" style={{ height: tall ? 190 : 170 }}>
        <div className="flip-face flex flex-col gap-2 rounded-[18px] border-[1.5px] border-line bg-white p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-xp-soft text-xp"><Icon name="sparkle" size={20} sw={2.2} /></span>
            <span className="text-sm font-bold text-ink-soft">FAKTA JARINGAN · LEVEL {f.level}</span>
          </div>
          <p className="font-display text-xl font-bold leading-tight">{f.tanya}</p>
          <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary"><Icon name="repeat" size={16} sw={2.3} />Ketuk untuk membalik</span>
        </div>
        <div className="flip-face flip-back flex flex-col gap-2 rounded-[18px] border-[1.5px] border-[#9DB4F8] bg-primary-soft p-4">
          <span className="text-sm font-bold text-[#1B46D1]">JAWABAN</span>
          <p className="line-clamp-4 text-[15px] leading-snug">{f.jawab}</p>
          <span className="mt-auto text-sm font-semibold text-[#1B46D1]">Dari materi: {f.judul}</span>
        </div>
      </div>
    </label>
  )
}

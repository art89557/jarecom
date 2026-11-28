// Bagian tambahan di halaman materi: "Penjelasan lengkap" dan "Contoh soal langkah demi langkah".
// Keduanya memakai <details> bawaan HTML supaya bisa dibuka-tutup dengan mouse, sentuh, maupun keyboard
// tanpa kode tambahan. Ringkasan (uraian dan poin) tetap tampil di atas, jadi pemula tidak langsung disodori teks panjang.
import type { ContohSoal, Lengkap } from '../content'
import { Icon } from './icons'

/** Judul yang bisa diklik untuk membuka/menutup satu bagian. */
function Ringkas({ icon, children }: { icon: 'book' | 'hash'; children: React.ReactNode }) {
  return (
    <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-[#1B46D1]"><Icon name={icon} size={20} sw={2.2} /></span>
      <span className="flex-1">{children}</span>
      <span className="shrink-0 transition-transform motion-reduce:transition-none group-open:rotate-180"><Icon name="chevd" size={20} sw={2.4} /></span>
    </summary>
  )
}

/** Penjelasan lengkap satu sub-topik: cara kerja, analogi, contoh nyata, dan istilah penting. */
export function PenjelasanLengkap({ data }: { data: Lengkap }) {
  return (
    <details className="group card !p-0">
      <Ringkas icon="book">Penjelasan lengkap</Ringkas>
      <div className="flex flex-col gap-3 border-t border-line px-4 pb-4 pt-3 text-[15px] leading-[1.7] [overflow-wrap:anywhere] md:text-base">
        {data.caraKerja.map((p) => <p key={p}>{p}</p>)}
        {data.analogi && (
          <div className="rounded-xl bg-primary-soft p-3">
            <p className="text-sm font-bold text-[#1B46D1]">Analogi</p>
            <p className="mt-1">{data.analogi}</p>
          </div>
        )}
        {data.contoh && (
          <div>
            <p className="text-sm font-bold">Contoh di dunia nyata</p>
            <p className="mt-1">{data.contoh}</p>
          </div>
        )}
        {data.istilah && data.istilah.length > 0 && (
          <div>
            <p className="text-sm font-bold">Istilah penting</p>
            <dl className="mt-1.5 flex flex-col gap-1.5">
              {data.istilah.map((t) => (
                <div key={t.istilah} className="flex flex-col sm:flex-row sm:gap-2">
                  <dt className="shrink-0 font-semibold sm:w-40">{t.istilah}</dt>
                  <dd className="text-ink-soft">{t.arti}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </details>
  )
}

/** Contoh soal yang dikerjakan langkah demi langkah, untuk topik hitungan. */
export function ContohSoalBertahap({ data }: { data: ContohSoal }) {
  return (
    <details className="group card !p-0">
      <Ringkas icon="hash">Contoh soal langkah demi langkah</Ringkas>
      <div className="flex flex-col gap-3 border-t border-line px-4 pb-4 pt-3 text-[15px] leading-[1.7] [overflow-wrap:anywhere] md:text-base">
        <p><b>Soal:</b> {data.soal}</p>
        <ol className="flex flex-col gap-2">
          {data.langkah.map((l, i) => (
            <li key={l} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
              <span className="flex-1">{l}</span>
            </li>
          ))}
        </ol>
        <p className="rounded-xl bg-pass-soft p-3 text-pass-ink"><b>Jawaban:</b> {data.jawaban}</p>
      </div>
    </details>
  )
}

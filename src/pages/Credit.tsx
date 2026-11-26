// Halaman Kredit (/kredit): tim pengembang, sumber dan referensi, serta keterangan tentang Jar’ecom.
import { Netty } from '../components/ui'
import { Icon } from '../components/icons'
import { CHANGELOG, SUMBER, TIM, VERSI, type Anggota } from '../content/kredit'

/** Judul bagian: label kecil di atas, judul besar di bawah. */
const Heading = ({ id, label, children }: { id: string; label: string; children: string }) => (
  <header className="mb-4">
    <p className="text-sm font-bold uppercase tracking-wider text-ink-soft">{label}</p>
    <h2 id={id} className="text-[22px] font-bold tracking-tight md:text-[26px]">{children}</h2>
  </header>
)

/** Kartu satu anggota: foto bulat (atau inisial jika foto belum ada), nama, NIM, dan peran. */
function Kartu({ a }: { a: Anggota }) {
  return (
    <li className="flex flex-col items-center rounded-[18px] border-[1.5px] border-line bg-white px-4 pb-5 pt-6 text-center">
      {a.foto ? (
        <img src={a.foto} alt={`Foto ${a.nama}`} width={88} height={88} className="h-[88px] w-[88px] rounded-full object-cover" />
      ) : (
        <span aria-hidden className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-primary-soft font-display text-[34px] font-bold text-[#1B46D1]">{a.nama.charAt(0).toUpperCase()}</span>
      )}
      <h3 className="mt-3 text-[17px] font-bold leading-snug">{a.nama}</h3>
      {a.nim && <p className="mt-0.5 text-[15px] text-[#33415A]">NIM {a.nim}</p>}
      <p className="mt-1.5 rounded-full bg-primary-soft px-3 py-1 text-[15px] font-semibold text-[#1B46D1]">{a.role}</p>
    </li>
  )
}

/** Halaman Kredit. Isi teks diambil dari src/content/kredit.ts. */
export default function Credit() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <h1 className="text-[28px] font-bold tracking-tight md:text-[34px]">Kredit</h1>

      <section aria-labelledby="tim">
        <Heading id="tim" label="Tim pengembang">Tim Pengembang</Heading>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">{TIM.map((a) => <Kartu key={a.nama} a={a} />)}</ul>
      </section>

      <section aria-labelledby="sumber">
        <Heading id="sumber" label="Sumber dan referensi">Sumber &amp; Referensi</Heading>
        <div className="flex flex-col gap-4 rounded-[18px] border-[1.5px] border-line bg-white p-4 md:p-5">
          {SUMBER.map((g) => (
            <div key={g.judul}>
              <h3 className="text-[17px] font-bold">{g.judul}</h3>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {g.butir.map((b) => (
                  <li key={b} className="flex gap-2.5 text-[15px] leading-relaxed text-[#33415A]">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="tentang">
        <Heading id="tentang" label="Tentang">Tentang Jar’ecom</Heading>
        <div className="flex flex-col gap-5 rounded-[18px] border-[1.5px] border-line bg-white p-4 md:flex-row md:p-6">
          <div className="flex shrink-0 justify-center md:items-start"><Netty pose="senang" size={120} label="Netty, maskot Jar’ecom" bob /></div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[19px] font-bold">Belajar jaringan komputer, selangkah demi selangkah</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#33415A]">
              Jar’ecom adalah aplikasi belajar Jaringan Komputer untuk mahasiswa. Ada 11 level yang terbuka berurutan: baca materi, jawab cek pemahaman, lalu kerjakan kuis. Netty, si maskot, menemanimu: berpikir saat kamu memilih, senang saat benar, dan merayakan setiap level yang selesai.
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-bg px-2.5 py-1 font-mono text-[14px] font-semibold">Versi {VERSI}</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-2.5 py-1 text-[14px] font-semibold text-[#1B46D1]"><Icon name="phone" size={16} sw={2.2} />PWA, bisa dipasang di perangkat</span>
            </p>
            <h4 className="mt-4 text-[16px] font-bold">Riwayat perubahan</h4>
            <ul className="mt-1.5 flex flex-col">
              {CHANGELOG.map((c) => (
                <li key={c.tanggal + c.isi} className="flex flex-col gap-0.5 border-t border-[#E6EAF1] py-2 text-[15px] leading-relaxed text-[#33415A] first:border-t-0 sm:flex-row sm:gap-3">
                  <span className="shrink-0 font-semibold text-ink sm:w-28">{c.tanggal}</span><span>{c.isi}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

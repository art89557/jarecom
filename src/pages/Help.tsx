// Halaman Bantuan (/bantuan): langkah tur dalam bentuk teks, pertanyaan umum, dan buku panduan PDF.
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/icons'
import { Back } from '../components/ui'
import { LAB_TOUR_STEPS, TOUR_STEPS } from '../lib/tour'
import { useApp } from '../state'

/** Pertanyaan yang paling sering muncul. */
const FAQ: [string, string][] = [
  ['Kenapa level masih terkunci?', 'Selesaikan materi level sebelumnya dan luluskan kuisnya dengan skor 70 atau lebih.'],
  ['Kenapa tombol Sub-topik berikutnya tidak aktif?', 'Jawab cek pemahaman di akhir sub-topik sampai benar.'],
  ['Kenapa XP tidak bertambah saat mengulang kuis?', 'XP materi, kuis lulus, dan skor 100 hanya diberikan sekali per level.'],
  ['Apa bedanya Lab dan Simulasi?', 'Di Lab kamu merakit jaringan sendiri. Di Simulasi kamu mengamati dan membandingkan konsep lewat gambar interaktif. Di HP, Simulasi ada sebagai tab di halaman Lab.'],
  ['Kalau pindah menu, progresku hilang?', 'Tidak. Materi melanjutkan dari sub-topik terakhir, dan pekerjaan di setiap misi Lab tersimpan otomatis di perangkat ini. Kuis berbeda: kalau keluar di tengah kuis, kamu mulai lagi dari soal 1, jadi aplikasi selalu bertanya dulu.'],
  ['Kenapa alat di Lab belum lengkap?', 'Alat muncul bertahap sesuai misi: kabel manual dari Misi 7, Hub dan mode Simulation dari Misi 8, Router dari Misi 10. Mau mencoba semuanya? Tekan Semua alat di palet.'],
  ['Di Lab, ping gagal atau lampu kabel merah?', 'Lampu merah berarti jenis kabel salah atau port mati. Kalau ping gagal, baca catatannya: biasanya IP beda subnet atau Default Gateway kosong.'],
  ['Animasi membuat pusing?', 'Nyalakan Kurangi animasi di Profil.']
]

/** Bantuan: padanan teks tur panduan, pertanyaan umum, dan unduhan panduan lengkap. */
export default function Help() {
  const { setTour } = useApp()
  const nav = useNavigate()
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Back to="/profil">Profil</Back>
      <h1 className="sr-only">Bantuan</h1>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => { nav('/beranda'); setTour(true) }} className="btn gap-2 sm:w-auto sm:px-6"><Icon name="play" size={20} sw={2.2} />Mulai tur panduan</button>
        <a href="/Panduan_Jarecom.pdf" download className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-line bg-white px-6 font-semibold"><Icon name="book" size={20} sw={2.2} />Unduh buku panduan (PDF)</a>
      </div>
      <section aria-labelledby="langkah">
        <h2 id="langkah" className="mb-2 text-[20px] font-bold">Langkah tur</h2>
        <ol className="overflow-hidden rounded-[18px] border-[1.5px] border-line bg-white">
          {TOUR_STEPS.map((s, k) => (
            <li key={s.target} className="flex items-start gap-3.5 px-4 py-3.5 [&+&]:border-t [&+&]:border-[#E6EAF1]">
              <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[15px] font-bold text-[#1B46D1]">{k + 1}</span>
              <div><h3 className="text-[17px] font-bold">{s.title}</h3><p className="mt-1 text-[15px] leading-relaxed text-[#33415A]">{s.body}</p></div>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="langkah-lab">
        <h2 id="langkah-lab" className="mb-2 text-[20px] font-bold">Tur Lab</h2>
        <p className="mb-2 text-[15px] text-[#33415A]">Muncul saat pertama membuka misi Lab. Ulangi kapan saja lewat tombol Tur di halaman misi.</p>
        <ol className="overflow-hidden rounded-[18px] border-[1.5px] border-line bg-white">
          {LAB_TOUR_STEPS.map((s, k) => (
            <li key={s.target} className="flex items-start gap-3.5 px-4 py-3.5 [&+&]:border-t [&+&]:border-[#E6EAF1]">
              <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[15px] font-bold text-[#1B46D1]">{k + 1}</span>
              <div><h3 className="text-[17px] font-bold">{s.title}</h3><p className="mt-1 text-[15px] leading-relaxed text-[#33415A]">{s.body}</p></div>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="faq">
        <h2 id="faq" className="mb-2 text-[20px] font-bold">Pertanyaan umum</h2>
        <div className="overflow-hidden rounded-[18px] border-[1.5px] border-line bg-white">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-4 [&+&]:border-t [&+&]:border-[#E6EAF1]">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 text-[16px] font-semibold">{q}<Icon name="chevd" size={20} className="shrink-0 transition group-open:rotate-180" /></summary>
              <p className="pb-4 text-[15px] leading-relaxed text-[#33415A]">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}

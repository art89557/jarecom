// Halaman Bantuan (/bantuan): isi langkah tur dalam bentuk teks, plus tombol untuk memutar tur lagi.
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/icons'
import { Back } from '../components/ui'
import { TOUR_STEPS } from '../lib/tour'
import { useApp } from '../state'

/** Padanan teks tur panduan, supaya pengguna yang melewati tur tetap bisa membacanya. */
export default function Help() {
  const { setTour } = useApp()
  const nav = useNavigate()
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Back to="/profil">Profil</Back>
      <h1 className="text-[28px] font-bold tracking-tight md:text-[34px]">Bantuan</h1>
      <p className="text-base leading-relaxed text-[#33415A]">Enam langkah singkat cara memakai Jar’ecom. Isinya sama dengan tur panduan, jadi kamu tetap bisa membacanya kalau tur dilewati.</p>
      <button type="button" onClick={() => { nav('/beranda'); setTour(true) }} className="btn gap-2 md:w-auto md:self-start md:px-8"><Icon name="play" size={20} sw={2.2} />Mulai tur panduan</button>
      <ol className="overflow-hidden rounded-[18px] border-[1.5px] border-line bg-white">
        {TOUR_STEPS.map((s, k) => (
          <li key={s.target} className="flex items-start gap-3.5 px-4 py-3.5 [&+&]:border-t [&+&]:border-[#E6EAF1]">
            <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[15px] font-bold text-[#1B46D1]">{k + 1}</span>
            <div><h2 className="text-[17px] font-bold">{s.title}</h2><p className="mt-1 text-[15px] leading-relaxed text-[#33415A]">{s.body}</p></div>
          </li>
        ))}
      </ol>
    </div>
  )
}

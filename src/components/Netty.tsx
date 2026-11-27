// Maskot Netty yang hidup: digambar langsung sebagai SVG supaya tangan, mata, dan badannya bisa bergerak.
// Pose lama (default, rayakan, sedih, offline) tetap didukung supaya pemakaian lama tidak berubah.
import { useEffect, useState } from 'react'
import { nettyQuiet, onNettyQuiet } from '../lib/prefs'

export const POSES = ['default', 'halo', 'senang', 'rayakan', 'menari', 'berpikir', 'sedih', 'khawatir', 'offline', 'tidur', 'menunjuk'] as const
export type Pose = (typeof POSES)[number]

// Pose dasar yang benar-benar digambar. Pose lama dipetakan ke pose dasar.
type Base = 'diam' | 'halo' | 'senang' | 'menari' | 'berpikir' | 'sedih' | 'khawatir' | 'tidur' | 'menunjuk'
const BASE: Record<Pose, Base> = { default: 'diam', halo: 'halo', senang: 'senang', rayakan: 'menari', menari: 'menari', berpikir: 'berpikir', sedih: 'sedih', khawatir: 'khawatir', offline: 'tidur', tidur: 'tidur', menunjuk: 'menunjuk' }

// Sudut tangan kanan dan kiri (negatif = terangkat) dan kelas animasinya.
const ARMS: Record<Base, [number, number, string, string]> = {
  diam: [24, 24, '', ''], halo: [-62, 20, 'nt-wave', ''], senang: [-48, -48, 'nt-flap', 'nt-flap2'], menari: [-56, -20, 'nt-flap', 'nt-flap2'],
  berpikir: [118, 22, '', ''], sedih: [40, 40, '', ''], khawatir: [52, 52, '', ''], tidur: [34, 34, '', ''], menunjuk: [-4, 24, 'nt-point', '']
}
const MOUTH: Record<Base, string> = {
  diam: 'M89 120 Q100 130 111 120', halo: 'M88 120 Q100 132 112 120', senang: 'M84 116 Q100 146 116 116 Z', menari: 'M84 116 Q100 146 116 116 Z',
  berpikir: 'M93 125 Q101 121 108 125', sedih: 'M88 130 Q100 118 112 130', khawatir: 'M86 128 Q93 120 100 127 Q107 134 114 126',
  tidur: 'M96 122 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0', menunjuk: 'M90 120 Q101 130 112 119'
}
const FX: Partial<Record<Base, [string, string]>> = { berpikir: ['?', '#7E22CE'], tidur: ['z', '#64748B'], menari: ['♪', '#F5B301'], senang: ['✦', '#F5B301'] }
const ARM = 'M164 103 C176 96 196 99 198 108 C200 117 184 122 164 115 Z'

interface Props {
  pose?: Pose
  size?: number // lebar piksel
  label?: string // teks alternatif; tanpa label Netty dianggap hiasan
  bob?: boolean // diterima demi kompatibilitas; gerak diam selalu aktif kecuali animasi dikurangi
  say?: string // isi gelembung ucapan
  side?: 'kanan' | 'kiri' | 'atas' // letak gelembung
  lines?: string[] // kalimat bergantian saat Netty diketuk
  hideAfter?: number // gelembung hilang setelah sekian milidetik (0 = tetap tampil)
  bubbleClass?: string // gaya tambahan gelembung (mis. di atas latar biru)
}

/** Netty. Bergerak sesuai pose, melompat setiap pose atau ucapan berubah, dan bisa diketuk bila `lines` diisi. */
export function Netty({ pose = 'default', size = 120, label, say, side = 'kanan', lines, hideAfter = 0, bubbleClass = '' }: Props) {
  const [tap, setTap] = useState(0)
  const [quiet, setQuiet] = useState(nettyQuiet())
  const [shown, setShown] = useState(true)
  useEffect(() => onNettyQuiet(setQuiet), [])
  // Pose atau ucapan berubah: ketukan direset dan gelembung muncul lagi (hilang sendiri bila hideAfter diisi).
  useEffect(() => { setTap(0); setShown(true) }, [pose, say])
  useEffect(() => {
    if (!hideAfter || !shown) return
    const t = window.setTimeout(() => setShown(false), hideAfter)
    return () => window.clearTimeout(t)
  }, [hideAfter, shown, pose, say, tap])
  const b = tap > 0 && BASE[pose] !== 'tidur' ? 'senang' : BASE[pose]
  const text = tap > 0 && lines?.length ? lines[(tap - 1) % lines.length] : say
  const [ar, al, arc, alc] = ARMS[b]
  const open = !['senang', 'menari', 'tidur'].includes(b)
  const dx = b === 'menunjuk' ? 5 : b === 'berpikir' ? -3 : 0
  const dy = b === 'berpikir' ? -5 : 0
  const fx = FX[b]
  const h = Math.round((size * 216) / 220)
  const svg = (
    <span key={`${pose}|${say}|${tap}`} className="nt-pop block">
      <svg className={`nt-${b} block overflow-visible`} width={size} height={h} viewBox="-10 -16 220 216" aria-hidden="true">
        <ellipse cx="100" cy="191" rx="52" ry="5" fill="#0F1B2D" fillOpacity=".1" />
        <g transform={`translate(200 0) scale(-1 1) rotate(${al} 166 108) translate(166 108) scale(1.3) translate(-166 -108)`}><path className={`nt-arm ${alc}`} d={ARM} fill="#fff" stroke="#0F1B2D" strokeWidth="3.5" /></g>
        <g transform={`rotate(${ar} 166 108) translate(166 108) scale(1.3) translate(-166 -108)`}><path className={`nt-arm ${arc}`} d={ARM} fill="#fff" stroke="#0F1B2D" strokeWidth="3.5" /></g>
        <ellipse cx="80" cy="176" rx="15" ry="9" fill="#fff" stroke="#0F1B2D" strokeWidth="3.5" />
        <ellipse cx="120" cy="176" rx="15" ry="9" fill="#fff" stroke="#0F1B2D" strokeWidth="3.5" />
        <circle cx="100" cy="100" r="70" fill="#fff" />
        <g fill="none" stroke="#2457F5" strokeWidth="3.6" strokeLinecap="round"><ellipse cx="100" cy="100" rx="34" ry="70" /><path d="M100 30V170M26 100H174M24 66 Q100 80 176 66M24 134 Q100 120 176 134" /></g>
        <circle cx="100" cy="100" r="70" fill="none" stroke="#0F1B2D" strokeWidth="4" />
        {['senang', 'menari', 'halo'].includes(b) && <><circle cx="64" cy="116" r="8" fill="#FF9DB0" fillOpacity=".75" /><circle cx="136" cy="116" r="8" fill="#FF9DB0" fillOpacity=".75" /></>}
        {open && <>
          <ellipse className="nt-eye" cx={82 + dx} cy={97 + dy} rx="7.5" ry="11" fill="#0F1B2D" /><ellipse className="nt-eye" cx={118 + dx} cy={97 + dy} rx="7.5" ry="11" fill="#0F1B2D" />
          <circle cx={85 + dx} cy={92 + dy} r="2.6" fill="#fff" /><circle cx={121 + dx} cy={92 + dy} r="2.6" fill="#fff" />
        </>}
        {(b === 'senang' || b === 'menari') && <path d="M71 101 Q82 85 93 101M107 101 Q118 85 129 101" fill="none" stroke="#0F1B2D" strokeWidth="5.5" strokeLinecap="round" />}
        {b === 'tidur' && <path d="M72 99 Q82 106 92 99M108 99 Q118 106 128 99" fill="none" stroke="#0F1B2D" strokeWidth="5" strokeLinecap="round" />}
        {(b === 'khawatir' || b === 'sedih') && <path d={b === 'khawatir' ? 'M70 82 L90 76M130 82 L110 76' : 'M72 80 L90 84M128 80 L110 84'} fill="none" stroke="#0F1B2D" strokeWidth="4.5" strokeLinecap="round" />}
        <path d={MOUTH[b]} fill={b === 'senang' || b === 'menari' ? '#0F1B2D' : 'none'} stroke="#0F1B2D" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {b === 'khawatir' && <path d="M150 52 Q158 64 150 70 Q142 64 150 52 Z" fill="#7CC4FF" stroke="#0F1B2D" strokeWidth="2.5" />}
        {fx && <><text className="nt-fx" x="150" y="40" fontSize="30" fontWeight="700" fill={fx[1]}>{fx[0]}</text><text className="nt-fx2" x="168" y="58" fontSize="22" fontWeight="700" fill={fx[1]}>{fx[0]}</text></>}
      </svg>
    </span>
  )
  const body = lines?.length ? (
    <button type="button" onClick={() => setTap((t) => t + 1)} aria-label={label ? `${label}. Ketuk untuk menyapa` : 'Netty, ketuk untuk menyapa'} className="shrink-0 rounded-2xl leading-none">{svg}</button>
  ) : (
    <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="shrink-0 leading-none">{svg}</span>
  )
  if (!text || quiet) return body
  const dir = side === 'atas' ? 'flex-col-reverse items-center' : side === 'kiri' ? 'flex-row-reverse items-start' : 'flex-row items-start'
  const radius = side === 'kanan' ? 'rounded-2xl rounded-bl' : side === 'kiri' ? 'rounded-2xl rounded-br' : 'rounded-2xl'
  return (
    <span className={`inline-flex gap-2 ${dir}`}>
      {body}
      <span role="status" className={`min-w-0 max-w-[260px] ${shown ? '' : 'invisible'}`}>
        {shown && <span key={`${text}|${tap}`} className={`nt-bubble block border-2 border-line bg-white px-3.5 py-2.5 text-[15px] font-semibold leading-snug text-ink shadow-[0_3px_0_#DDE3EC] ${radius} ${bubbleClass}`}>{text}</span>}
      </span>
    </span>
  )
}

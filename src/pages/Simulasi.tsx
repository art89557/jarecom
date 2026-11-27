// Simulasi (/simulasi dan /simulasi/:slug): gambar interaktif untuk membandingkan konsep jaringan.
// Beda dengan Lab: di Lab siswa merakit jaringan; di sini siswa melihat dan membandingkan konsep.
// Semua gambar SVG buatan sendiri, bisa dipakai dengan keyboard, dan animasinya ikut "Kurangi animasi".
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { Back, Netty } from '../components/ui'
import { SimThumb } from '../components/Art'
import { reduceOn } from '../lib/prefs'

/** Animasi dimatikan? (pengaturan aplikasi atau pengaturan perangkat) */
const still = () => reduceOn() || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Daftar simulasi, urut sesuai level materi. */
const SIMS: { slug: string; title: string; level: string; desc: string }[] = [
  { slug: 'ip-biner', title: 'IP Address dan Bilangan Biner', level: 'Level 2', desc: 'Klik bit 0/1 dan lihat oktet, kelas IP, serta IP privat atau publik.' },
  { slug: 'perangkat', title: 'Hub vs Switch vs Router', level: 'Level 3 dan 4', desc: 'Kirim paket dan bandingkan siapa yang menerima di tiap perangkat.' },
  { slug: 'osi', title: 'OSI vs TCP/IP', level: 'Level 4', desc: 'Petakan 7 layer OSI ke 4 layer TCP/IP, lalu ikuti enkapsulasi data.' },
  { slug: 'kabel', title: 'Kabel Straight vs Cross-Over', level: 'Level 5', desc: 'Lihat susunan warna T568A/T568B dan ke mana tiap pin tersambung.' },
  { slug: 'subnet', title: 'Kalkulator Subnet', level: 'Level 6 dan 7', desc: 'Geser prefix /8 sampai /30 dan lihat network, broadcast, dan jumlah host.' }
]

// Warna latar gambar sampul tiap simulasi.
const SIM_BG: Record<string, string> = { kabel: 'bg-[#FFF7ED]', osi: 'bg-primary-soft', perangkat: 'bg-[#F5F3FF]', 'ip-biner': 'bg-pass-soft', subnet: 'bg-[#FEFCE8]' }

/** Tab Rakit / Simulasi (hanya di HP; di laptop keduanya punya menu sendiri). */
export function LabTabs() {
  const cls = ({ isActive }: { isActive: boolean }) => `flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-6 text-[15px] font-semibold ${isActive ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`
  return (
    <nav aria-label="Lab dan Simulasi" className="flex gap-1 self-start rounded-2xl bg-[#E4E9F2] p-1">
      <NavLink to="/lab" end className={cls}>Rakit</NavLink>
      <NavLink to="/simulasi" className={cls}>Simulasi</NavLink>
    </nav>
  )
}

/** Halaman /simulasi: kartu tiap simulasi. */
export function SimList() {
  return (
    <div className="flex flex-col gap-5">
      <LabTabs />
      <h1 className="sr-only">Simulasi: gambar interaktif untuk membandingkan konsep jaringan</h1>
      <div className="flex items-center gap-4 rounded-[20px] bg-pass-soft px-4 py-3 md:px-5">
        <Netty pose="berpikir" size={84} say="Bingung bedanya straight dan cross? Coba simulasi kabel dulu." lines={['Semua simulasi bisa diutak-atik, tidak ada yang rusak.', 'Kalkulator Subnet cocok untuk Level 6 dan 7.', 'Klik bit-nya, angka desimalnya ikut berubah.']} />
      </div>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SIMS.map((s) => (
          <li key={s.slug}>
            <Link to={`/simulasi/${s.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[18px] border-[1.5px] border-line bg-white transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
              <span className={`paper block h-[130px] w-full px-4 py-3 ${SIM_BG[s.slug] ?? 'bg-primary-soft'}`}><SimThumb slug={s.slug} /></span>
              <span className="flex flex-col gap-1.5 p-4">
                <span className="text-sm font-bold uppercase tracking-wider text-ink-soft">{s.level}</span>
                <span className="text-[18px] font-bold">{s.title}</span>
                <span className="text-[15px] leading-snug text-[#33415A]">{s.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Halaman /simulasi/:slug. */
export function SimPage() {
  const { slug } = useParams()
  const nav = useNavigate()
  const s = SIMS.find((x) => x.slug === slug)
  useEffect(() => { if (!s) nav('/simulasi', { replace: true }) }, [s, nav])
  if (!s) return null
  const body: Record<string, ReactNode> = { kabel: <Kabel />, osi: <Osi />, perangkat: <Perangkat />, 'ip-biner': <IpBiner />, subnet: <Subnet /> }
  return (
    <div className="flex flex-col gap-4">
      <Back to="/simulasi">Simulasi</Back>
      <h1 className="text-[24px] font-bold tracking-tight md:text-[28px]">{s.title} <span className="ml-1 align-middle text-[14px] font-semibold text-ink-soft">{s.level}</span></h1>
      {body[s.slug]}
      <Recap slug={s.slug} />
    </div>
  )
}

// Penutup tiap simulasi: inti yang dipelajari dan langkah lanjutan ke Materi dan Lab.
const RECAP: Record<string, { poin: string[]; materi: [number, string]; lab?: [number, string] }> = {
  kabel: { poin: ['Straight dipakai untuk perangkat berbeda jenis, misalnya PC ke switch.', 'Cross-over dipakai untuk perangkat sejenis: PC ke PC, switch ke switch.', 'Straight: kedua ujung T568B. Cross: satu ujung T568A, satu T568B.'], materi: [5, ''], lab: [7, 'Kabel Straight dan Cross-Over'] },
  osi: { poin: ['OSI punya 7 lapisan, TCP/IP punya 4.', 'Application, Presentation, dan Session OSI menjadi satu Application di TCP/IP.', 'Saat dikirim, data dibungkus header di tiap lapisan (enkapsulasi).'], materi: [4, ''] },
  perangkat: { poin: ['Hub meneruskan paket ke semua port.', 'Switch belajar alamat MAC lalu mengirim hanya ke port tujuan.', 'Router menghubungkan jaringan yang berbeda memakai IP.'], materi: [5, ''], lab: [8, 'Hub vs Switch'] },
  'ip-biner': { poin: ['IPv4 terdiri dari 4 oktet, tiap oktet 8 bit (0 sampai 255).', 'Nilai oktet pertama menentukan kelas IP.', '10.x, 172.16 sampai 31.x, dan 192.168.x adalah IP privat.'], materi: [2, ''], lab: [9, 'IP Address dan Subnet'] },
  subnet: { poin: ['Prefix menentukan berapa bit untuk network.', 'Jumlah host = 2 pangkat (bit host) dikurangi 2.', 'Setiap tambahan 1 bit prefix membagi jaringan menjadi 2 kali lebih banyak subnet.'], materi: [7, ''], lab: [9, 'IP Address dan Subnet'] }
}

/** Kartu "Yang kamu pelajari" di akhir setiap simulasi. */
function Recap({ slug }: { slug: string }) {
  const r = RECAP[slug]
  if (!r) return null
  return (
    <section aria-labelledby="recap" className="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-[#B7E4CB] bg-pass-soft p-4 md:flex-row md:items-start md:gap-5 md:p-5">
      <Netty pose="senang" size={88} label="Netty senang" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <h2 id="recap" className="text-[18px] font-bold">Yang kamu pelajari</h2>
        <ul className="flex flex-col gap-1.5">{r.poin.map((p) => <li key={p} className="flex gap-2.5 text-[15px] leading-snug"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-pass" />{p}</li>)}</ul>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link to={`/materi/${r.materi[0]}`} className="inline-flex min-h-[44px] items-center rounded-xl bg-white px-4 text-[15px] font-semibold text-[#1B46D1] hover:bg-primary-soft">Baca Materi Level {r.materi[0]}</Link>
          {r.lab && <Link to={`/lab/${r.lab[0]}`} className="inline-flex min-h-[44px] items-center rounded-xl bg-white px-4 text-[15px] font-semibold text-pass-ink hover:bg-[#DCFCE7]">Praktik di Lab · Misi {r.lab[0]}</Link>}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- Bagian bersama

const Card = ({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) => (
  <section className={`paper rounded-[18px] border-[1.5px] border-line bg-white p-4 md:p-5 ${className}`}>
    {title && <h2 className="mb-3 text-[18px] font-bold">{title}</h2>}
    {children}
  </section>
)

/** Tombol pilihan (segmented). */
function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-2xl bg-[#E4E9F2] p-1">
      {options.map(([k, t]) => <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)} className={`min-h-[44px] rounded-xl px-3.5 text-[14px] font-semibold ${value === k ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}>{t}</button>)}
    </div>
  )
}

/** Tabel perbandingan sederhana. */
function Compare({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-[15px]">
        <thead><tr>{head.map((h) => <th key={h} className="bg-primary-soft px-3 py-2 font-bold first:rounded-l-lg last:rounded-r-lg">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-[#E6EAF1] align-top">{r.map((c, j) => <td key={j} className={`px-3 py-2 ${j === 0 ? 'font-semibold' : 'text-[#33415A]'}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------- 1. Kabel straight vs cross-over

type Wire = 'wo' | 'o' | 'wg' | 'g' | 'wbl' | 'bl' | 'wbr' | 'br'
const T568B: Wire[] = ['wo', 'o', 'wg', 'bl', 'wbl', 'g', 'wbr', 'br']
const T568A: Wire[] = ['wg', 'g', 'wo', 'bl', 'wbl', 'o', 'wbr', 'br']
const COLOR: Record<Wire, [string, string]> = { // [warna utama, nama]
  wo: ['#F97316', 'Putih-Oranye'], o: ['#F97316', 'Oranye'], wg: ['#16A34A', 'Putih-Hijau'], g: ['#16A34A', 'Hijau'],
  wbl: ['#2563EB', 'Putih-Biru'], bl: ['#2563EB', 'Biru'], wbr: ['#92400E', 'Putih-Cokelat'], br: ['#92400E', 'Cokelat']
}
const ROLE = ['TX+ (kirim)', 'TX− (kirim)', 'RX+ (terima)', 'tidak dipakai*', 'tidak dipakai*', 'RX− (terima)', 'tidak dipakai*', 'tidak dipakai*']

function Kabel() {
  const [mode, setMode] = useState<'straight' | 'cross'>('straight')
  const [pin, setPin] = useState<number | null>(0)
  const right = mode === 'straight' ? T568B : T568A
  const to = (i: number) => right.indexOf(T568B[i]) // pin kanan untuk kabel di pin kiri i
  const y = (i: number) => 46 + i * 30
  const ROLE_R = (j: number) => ROLE[j]
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Seg label="Jenis kabel" value={mode} onChange={(v) => { setMode(v); setPin(0) }} options={[['straight', 'Straight-Through (B ke B)'], ['cross', 'Cross-Over (B ke A)']]} />
          <p className="text-[14px] text-ink-soft">Klik nomor pin untuk menelusuri kabelnya.</p>
        </div>
        <div className="mt-3 overflow-x-auto"><svg viewBox="0 0 640 300" className="w-full min-w-[560px]" role="group" aria-label={`Kabel ${mode === 'straight' ? 'straight-through' : 'cross-over'}: ${T568B.map((_, i) => `pin ${i + 1} ke pin ${to(i) + 1}`).join(', ')}`}>
          <text x="70" y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0F172A">Ujung A · T568B</text>
          <text x="570" y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0F172A">Ujung B · {mode === 'straight' ? 'T568B' : 'T568A'}</text>
          <rect x="40" y="32" width="60" height="252" rx="8" fill="#F1F5F9" stroke="#CBD5E1" />
          <rect x="540" y="32" width="60" height="252" rx="8" fill="#F1F5F9" stroke="#CBD5E1" />
          {T568B.map((w, i) => {
            const j = to(i), on = pin === null || pin === i
            const d = `M100 ${y(i)} C 300 ${y(i)}, 340 ${y(j)}, 540 ${y(j)}`
            const [c] = COLOR[w], white = w.startsWith('w')
            return (
              <g key={w} opacity={on ? 1 : 0.15} style={{ transition: 'opacity .2s' }}>
                <path d={d} fill="none" stroke={white ? '#FFFFFF' : c} strokeWidth="7" />
                {white && <path d={d} fill="none" stroke={c} strokeWidth="7" strokeDasharray="6 6" />}
                <path d={d} fill="none" stroke="#0F172A" strokeOpacity=".25" strokeWidth="9" style={{ mixBlendMode: 'multiply' }} />
              </g>
            )
          })}
          {T568B.map((w, i) => (
            <g key={'l' + i} role="button" tabIndex={0} aria-label={`Pin ${i + 1} ujung A, ${COLOR[w][1]}`} onClick={() => setPin(pin === i ? null : i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPin(pin === i ? null : i) } }} style={{ cursor: 'pointer' }}>
              <rect x="44" y={y(i) - 12} width="52" height="24" rx="6" fill={pin === i ? '#2457F5' : '#FFFFFF'} stroke="#94A3B8" />
              <text x="70" y={y(i) + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={pin === i ? '#FFFFFF' : '#0F172A'}>{i + 1}</text>
            </g>
          ))}
          {right.map((_, j) => <g key={'r' + j}><rect x="544" y={y(j) - 12} width="52" height="24" rx="6" fill={pin !== null && to(pin) === j ? '#2457F5' : '#FFFFFF'} stroke="#94A3B8" /><text x="570" y={y(j) + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={pin !== null && to(pin) === j ? '#FFFFFF' : '#0F172A'}>{j + 1}</text></g>)}
        </svg></div>
        {pin !== null && (
          <p className="mt-2 rounded-xl bg-[#EEF2FF] px-3.5 py-3 text-[15px] text-[#1E3A8A]" aria-live="polite">
            Kabel <b>{COLOR[T568B[pin]][1]}</b>: pin {pin + 1} ujung A (<b>{ROLE[pin]}</b>) tersambung ke pin {to(pin) + 1} ujung B (<b>{ROLE_R(to(pin))}</b>).
            {mode === 'cross' && (pin === 0 || pin === 1) && ' Jalur kirim bertemu jalur terima: itulah sebabnya dua perangkat sejenis bisa langsung bicara.'}
            {mode === 'straight' && (pin === 0 || pin === 1) && ' Kirim tetap di pin yang sama; switch yang menukar jalur kirim dan terima di dalamnya.'}
          </p>
        )}
        <p className="help mt-2">* Pin 4, 5, 7, 8 tidak dipakai di Fast Ethernet 100 Mbps, tetapi dipakai di Gigabit Ethernet.</p>
      </Card>
      <Card title="Uji cepat: kabel apa yang dipakai?"><KabelQuiz /></Card>
      <Card title="Perbandingan">
        <Compare head={['', 'Straight-Through', 'Cross-Over']} rows={[
          ['Susunan ujung', 'T568B di kedua ujung (atau A–A)', 'T568B di satu ujung, T568A di ujung lain'],
          ['Pin yang bertukar', 'Tidak ada: 1→1, 2→2, 3→3, 6→6', '1↔3 dan 2↔6'],
          ['Menghubungkan', 'Perangkat beda kelompok', 'Perangkat sekelompok'],
          ['Contoh', 'PC–Switch, Router–Switch, PC–Hub', 'Switch–Switch, PC–PC, PC–Router, Switch–Hub'],
          ['Catatan', 'Paling sering dipakai', 'Banyak perangkat modern punya Auto-MDIX yang menyesuaikan sendiri']
        ]} />
        <p className="help mt-3">Kelompok 1: PC, laptop, server, router. Kelompok 2: switch, hub. Beda kelompok = straight; sekelompok = cross.</p>
      </Card>
    </div>
  )
}

function KabelQuiz() {
  const Q: [string, 'straight' | 'cross'][] = [['PC ke Switch', 'straight'], ['Switch ke Switch', 'cross'], ['PC ke PC', 'cross'], ['Router ke Switch', 'straight'], ['PC ke Router', 'cross'], ['Switch ke Hub', 'cross']]
  const [ans, setAns] = useState<Record<number, 'straight' | 'cross'>>({})
  const right = Object.entries(ans).filter(([i, a]) => Q[+i][1] === a).length
  return (
    <div>
      <ul className="grid gap-2 md:grid-cols-2">
        {Q.map(([q, k], i) => {
          const a = ans[i]
          return (
            <li key={q} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg px-3 py-2">
              <span className="text-[15px] font-semibold">{q}</span>
              <span className="flex gap-1.5">
                {(['straight', 'cross'] as const).map((c) => (
                  <button key={c} type="button" aria-pressed={a === c} onClick={() => setAns({ ...ans, [i]: c })}
                    className={`min-h-[44px] rounded-xl border-2 px-3 text-[14px] font-bold ${a === c ? (c === k ? 'border-[#16A34A] bg-[#DCFCE7] text-[#14532D]' : 'border-[#DC2626] bg-[#FEE2E2] text-[#7F1D1D]') : 'border-line bg-white'}`}>
                    {c === 'straight' ? 'Straight' : 'Cross'}{a === c ? (c === k ? ' · benar' : ' · salah') : ''}
                  </button>
                ))}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-[15px] font-semibold" aria-live="polite">{Object.keys(ans).length ? `${right} dari ${Q.length} benar` : 'Pilih jawaban untuk tiap pasangan.'}</p>
    </div>
  )
}

// ---------------------------------------------------------------- 2. OSI vs TCP/IP

const OSI: { n: number; name: string; fn: string; pdu: string; proto: string; dev: string }[] = [
  { n: 7, name: 'Application', fn: 'Layanan jaringan untuk aplikasi pengguna.', pdu: 'Data', proto: 'HTTP, DNS, SMTP, FTP', dev: '-' },
  { n: 6, name: 'Presentation', fn: 'Format data, enkripsi, dan kompresi.', pdu: 'Data', proto: 'TLS/SSL, JPEG, ASCII', dev: '-' },
  { n: 5, name: 'Session', fn: 'Membuka, mengatur, dan menutup sesi komunikasi.', pdu: 'Data', proto: 'NetBIOS, RPC', dev: '-' },
  { n: 4, name: 'Transport', fn: 'Pengiriman ujung ke ujung, nomor port, keandalan.', pdu: 'Segment', proto: 'TCP, UDP', dev: '-' },
  { n: 3, name: 'Network', fn: 'Alamat logis (IP) dan pemilihan jalur (routing).', pdu: 'Packet', proto: 'IP, ICMP', dev: 'Router' },
  { n: 2, name: 'Data Link', fn: 'Alamat fisik (MAC), frame, deteksi galat.', pdu: 'Frame', proto: 'Ethernet, Wi-Fi (802.11), PPP', dev: 'Switch' },
  { n: 1, name: 'Physical', fn: 'Bit dikirim sebagai sinyal listrik, cahaya, atau radio.', pdu: 'Bit', proto: 'UTP, fiber optik, RJ45', dev: 'Hub, kabel' }
]
const TCPIP: { name: string; layers: number[] }[] = [
  { name: 'Application', layers: [7, 6, 5] }, { name: 'Transport', layers: [4] }, { name: 'Internet', layers: [3] }, { name: 'Network Access', layers: [2, 1] }
]
const ENC = [
  { label: 'Data', layer: 7, parts: [['Data', '#E8EEFF']] },
  { label: 'Segment', layer: 4, parts: [['TCP', '#DCFCE7'], ['Data', '#E8EEFF']] },
  { label: 'Packet', layer: 3, parts: [['IP', '#FEF3C7'], ['TCP', '#DCFCE7'], ['Data', '#E8EEFF']] },
  { label: 'Frame', layer: 2, parts: [['Ethernet', '#F3E8FF'], ['IP', '#FEF3C7'], ['TCP', '#DCFCE7'], ['Data', '#E8EEFF'], ['FCS', '#F3E8FF']] },
  { label: 'Bit', layer: 1, parts: [['0 1 1 0 1 0 0 1 1 0 1 0 1 1 0 0 1 0 …', '#E2E8F0']] }
]

function Osi() {
  const [sel, setSel] = useState(4)
  const [enc, setEnc] = useState(0)
  const L = OSI.find((l) => l.n === sel)!
  const group = TCPIP.find((g) => g.layers.includes(sel))!
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="grid grid-cols-[1fr_1fr] gap-x-3 gap-y-0 md:grid-cols-[1fr_1fr_1.3fr] md:gap-x-5">
          <p className="pb-2 text-[14px] font-bold uppercase tracking-wider text-ink-soft">Model OSI (7)</p>
          <p className="pb-2 text-[14px] font-bold uppercase tracking-wider text-ink-soft">TCP/IP (4)</p>
          <div className="row-span-[8] hidden md:block">
            <div className="sticky top-20 rounded-xl bg-[#EEF2FF] p-4 text-[15px] text-[#1E3A8A]" aria-live="polite">
              <p className="text-[18px] font-bold text-ink">Layer {L.n} · {L.name}</p>
              <p className="mt-1">{L.fn}</p>
              <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-1.5"><dt className="font-semibold">PDU</dt><dd>{L.pdu}</dd><dt className="font-semibold">Protokol</dt><dd>{L.proto}</dd><dt className="font-semibold">Perangkat</dt><dd>{L.dev}</dd><dt className="font-semibold">Di TCP/IP</dt><dd>{group.name}</dd></dl>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {OSI.map((l) => (
              <button key={l.n} type="button" aria-pressed={sel === l.n} onClick={() => setSel(l.n)}
                className={`flex min-h-[48px] items-center gap-2 rounded-xl border-2 px-3 text-left text-[15px] font-semibold transition ${sel === l.n ? 'border-primary bg-primary text-white' : group.layers.includes(l.n) ? 'border-primary bg-primary-soft' : 'border-line bg-white'}`}>
                <span className="w-5 text-center font-bold">{l.n}</span>{l.name}
              </button>))}
          </div>
          <div className="flex flex-col gap-1.5">
            {TCPIP.map((g) => (
              <button key={g.name} type="button" aria-pressed={g === group} onClick={() => setSel(g.layers[0])} style={{ minHeight: g.layers.length * 48 + (g.layers.length - 1) * 6 }}
                className={`flex items-center justify-center rounded-xl border-2 px-3 text-center text-[15px] font-semibold transition ${g === group ? 'border-primary bg-primary text-white' : 'border-line bg-white'}`}>{g.name}</button>))}
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-[#EEF2FF] p-4 text-[15px] text-[#1E3A8A] md:hidden" aria-live="polite">
          <p className="text-[17px] font-bold text-ink">Layer {L.n} · {L.name}</p><p className="mt-1">{L.fn}</p>
          <p className="mt-2"><b>PDU:</b> {L.pdu} · <b>Protokol:</b> {L.proto} · <b>Perangkat:</b> {L.dev} · <b>TCP/IP:</b> {group.name}</p>
        </div>
      </Card>
      <Card title="Enkapsulasi: data turun dari layer atas ke kabel">
        <div className="flex flex-wrap gap-2">
          {ENC.map((e, i) => <button key={e.label} type="button" aria-pressed={enc === i} onClick={() => { setEnc(i); setSel(e.layer) }} className={`min-h-[44px] rounded-xl border-2 px-3 text-[14px] font-bold ${enc === i ? 'border-primary bg-primary text-white' : 'border-line bg-white'}`}>{i + 1}. {e.label}</button>)}
        </div>
        <div className="mt-4 flex min-h-[64px] flex-wrap items-stretch overflow-hidden rounded-xl border-2 border-ink/80" aria-live="polite" aria-label={`${ENC[enc].label}: ${ENC[enc].parts.map((p) => p[0]).join(' + ')}`}>
          {ENC[enc].parts.map(([t, c], i) => <span key={t + i} className="pop flex min-h-[60px] flex-1 items-center justify-center border-r-2 border-ink/20 px-3 text-center font-mono text-[15px] font-bold last:border-r-0" style={{ background: c, flexGrow: t === 'Data' ? 2 : 1 }}>{t}</span>)}
        </div>
        <p className="mt-3 text-[15px] text-[#33415A]">{['Aplikasi membuat data, misalnya permintaan halaman web.', 'Transport menambah header TCP berisi nomor port: jadilah segment.', 'Network menambah header IP berisi alamat IP asal dan tujuan: jadilah packet.', 'Data Link menambah header Ethernet (alamat MAC) dan FCS untuk cek galat: jadilah frame.', 'Physical mengubah frame menjadi bit yang dikirim lewat kabel atau udara.'][enc]} Di penerima urutannya dibalik (dekapsulasi).</p>
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={enc === 0} onClick={() => { setEnc(enc - 1); setSel(ENC[enc - 1].layer) }} className="min-h-[44px] rounded-xl border-2 border-line px-4 font-semibold disabled:opacity-40">Sebelumnya</button>
          <button type="button" disabled={enc === ENC.length - 1} onClick={() => { setEnc(enc + 1); setSel(ENC[enc + 1].layer) }} className="btn w-auto px-6">Turun satu layer</button>
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- 3. Hub vs switch vs router

type Box = 'hub' | 'switch' | 'router'
const PCS = [{ id: 'A', x: 110, y: 70 }, { id: 'B', x: 530, y: 70 }, { id: 'C', x: 110, y: 290 }, { id: 'D', x: 530, y: 290 }]
const CENTER = { x: 320, y: 180 }
const NET: Record<string, 1 | 2> = { A: 1, C: 1, B: 2, D: 2 } // jaringan di mode router

function Perangkat() {
  const [box, setBox] = useState<Box>('switch')
  const [src, setSrc] = useState('A')
  const [dst, setDst] = useState('D')
  const [mac, setMac] = useState<Record<string, boolean>>({}) // tabel MAC switch: PC yang sudah dikenal
  const [run, setRun] = useState<{ recv: string[]; t: number; note: string; bc: boolean } | null>(null)
  const raf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  useEffect(() => { setRun(null); setMac({}) }, [box])

  function send(broadcast: boolean) {
    const others = PCS.map((p) => p.id).filter((x) => x !== src)
    let recv: string[], note: string
    if (box === 'hub') { recv = others; note = broadcast ? 'Hub menyalin broadcast ke semua port.' : `Hub tidak membaca alamat: paket disalin ke SEMUA port. Hanya PC ${dst} yang memakainya; yang lain membuang.` }
    else if (box === 'switch') {
      if (broadcast) { recv = others; note = 'Broadcast (misalnya ARP) tetap dikirim switch ke semua port.' }
      else if (mac[dst]) { recv = [dst]; note = `Switch sudah mengenal MAC PC ${dst} di tabelnya, jadi paket hanya dikirim ke port PC ${dst}.` }
      else { recv = others; note = `Switch belum mengenal PC ${dst}: paket dikirim ke semua port sekali (flooding). Saat PC ${dst} membalas, switch mencatat MAC-nya. Kirim lagi untuk melihat bedanya.` }
      setMac((m) => ({ ...m, [src]: true, ...(broadcast ? {} : { [dst]: true }) }))
    } else {
      if (broadcast) { recv = others.filter((x) => NET[x] === NET[src]); note = 'Router tidak meneruskan broadcast ke jaringan lain. Broadcast hanya sampai di jaringan pengirim.' }
      else if (NET[dst] === NET[src]) { recv = [dst]; note = `PC ${src} dan PC ${dst} satu jaringan, jadi router tidak perlu meneruskan ke jaringan lain.` }
      else { recv = [dst]; note = `Router membaca IP tujuan (jaringan ${NET[dst]}), lalu meneruskan paket lewat port ke jaringan itu.` }
    }
    cancelAnimationFrame(raf.current)
    if (still()) { setRun({ recv, t: 2, note, bc: broadcast }); return }
    const t0 = performance.now()
    const tick = (now: number) => { const t = Math.min(2, (now - t0) / 700); setRun({ recv, t, note, bc: broadcast }); if (t < 2) raf.current = requestAnimationFrame(tick) }
    raf.current = requestAnimationFrame(tick)
  }

  const pos = (id: string) => PCS.find((p) => p.id === id)!
  const env = (a: { x: number; y: number }, b: { x: number; y: number }, t: number, k: string, grey = false) => {
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t
    return <g key={k} transform={`translate(${x - 14} ${y - 10})`}><rect width="28" height="20" rx="4" fill={grey ? '#94A3B8' : '#2457F5'} /><path d="M3 4l11 8 11-8" fill="none" stroke="#fff" strokeWidth="2" /></g>
  }
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Seg label="Perangkat pusat" value={box} onChange={setBox} options={[['hub', 'Hub'], ['switch', 'Switch'], ['router', 'Router']]} />
          <label className="flex items-center gap-2 text-[15px] font-semibold">Dari
            <select value={src} onChange={(e) => { setSrc(e.target.value); if (e.target.value === dst) setDst(PCS.find((p) => p.id !== e.target.value)!.id) }} className="min-h-[44px] rounded-xl border-2 border-line bg-white px-2">{PCS.map((p) => <option key={p.id}>{p.id}</option>)}</select>
          </label>
          <label className="flex items-center gap-2 text-[15px] font-semibold">Ke
            <select value={dst} onChange={(e) => setDst(e.target.value)} className="min-h-[44px] rounded-xl border-2 border-line bg-white px-2">{PCS.filter((p) => p.id !== src).map((p) => <option key={p.id}>{p.id}</option>)}</select>
          </label>
          <button type="button" onClick={() => send(false)} className="btn w-auto px-5">Kirim paket</button>
          <button type="button" onClick={() => send(true)} className="min-h-[52px] rounded-2xl border-2 border-line px-4 font-semibold">Kirim broadcast</button>
        </div>
        <div className="mt-3 overflow-x-auto"><svg viewBox="0 0 640 360" className="w-full min-w-[520px]" role="img" aria-label={`${box} dengan empat PC. ${run ? `Penerima: ${run.recv.map((r) => 'PC ' + r).join(', ')}` : ''}`}>
          {box === 'router' && <><rect x="20" y="20" width="200" height="320" rx="16" fill="#EFF6FF" /><rect x="420" y="20" width="200" height="320" rx="16" fill="#FFF7ED" />
            <text x="120" y="190" textAnchor="middle" fontSize="14" fill="#1E3A8A" fontWeight="700">Jaringan 1</text><text x="120" y="208" textAnchor="middle" fontSize="14" fill="#1E3A8A">192.168.1.0/24</text>
            <text x="520" y="190" textAnchor="middle" fontSize="14" fill="#9A3412" fontWeight="700">Jaringan 2</text><text x="520" y="208" textAnchor="middle" fontSize="14" fill="#9A3412">192.168.2.0/24</text></>}
          {PCS.map((p) => <line key={p.id} x1={p.x} y1={p.y} x2={CENTER.x} y2={CENTER.y} stroke="#0F172A" strokeWidth="2.5" />)}
          <g transform={`translate(${CENTER.x - 42} ${CENTER.y - 26})`}><rect width="84" height="52" rx="12" fill="#E8EEFE" stroke="#2457F5" strokeWidth="2.5" /><text x="42" y="32" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1B44C4">{box === 'hub' ? 'Hub' : box === 'switch' ? 'Switch' : 'Router'}</text></g>
          {PCS.map((p) => {
            const got = !!run && run.t >= 2 && run.recv.includes(p.id), mine = got && (run!.bc || p.id === dst)
            return (
              <g key={p.id} transform={`translate(${p.x - 36} ${p.y - 28})`}>
                <rect width="72" height="56" rx="12" fill={p.id === src ? '#2457F5' : got ? (mine ? '#DCFCE7' : '#FEF3C7') : '#FFFFFF'} stroke={got ? (mine ? '#16A34A' : '#D97706') : '#94A3B8'} strokeWidth="2.5" />
                <text x="36" y="26" textAnchor="middle" fontSize="16" fontWeight="700" fill={p.id === src ? '#fff' : '#0F172A'}>PC {p.id}</text>
                <text x="36" y="44" textAnchor="middle" fontSize="13" fill={p.id === src ? '#fff' : '#475569'}>{box === 'router' ? `.${NET[p.id]}.${p.id.charCodeAt(0) - 54}` : p.id === src ? 'pengirim' : got ? (mine ? 'diterima' : 'dibuang') : ''}</text>
              </g>)
          })}
          {run && run.t < 1 && env(pos(src), CENTER, run.t, 'in')}
          {run && run.t >= 1 && run.t < 2 && run.recv.map((r) => env(CENTER, pos(r), run.t - 1, r, !run.bc && r !== dst))}
        </svg></div>
        <p className="mt-2 min-h-[48px] rounded-xl bg-[#EEF2FF] px-3.5 py-3 text-[15px] text-[#1E3A8A]" aria-live="polite">{run ? run.note : 'Pilih perangkat pusat, PC pengirim dan tujuan, lalu tekan Kirim paket.'}</p>
        {box === 'switch' && <p className="help mt-2">Tabel MAC switch: {Object.keys(mac).length ? Object.keys(mac).sort().map((k) => `PC ${k}`).join(', ') : 'masih kosong'}</p>}
      </Card>
      <Card title="Perbandingan">
        <Compare head={['', 'Hub', 'Switch', 'Router']} rows={[
          ['Layer OSI', 'Layer 1 (Physical)', 'Layer 2 (Data Link)', 'Layer 3 (Network)'],
          ['Alamat yang dibaca', 'Tidak ada', 'MAC address', 'IP address'],
          ['Cara meneruskan', 'Salin ke semua port', 'Hanya ke port tujuan (setelah belajar MAC)', 'Ke jaringan tujuan lewat tabel routing'],
          ['Broadcast', 'Diteruskan', 'Diteruskan ke semua port', 'Diblokir antar jaringan'],
          ['Tabrakan data', 'Satu domain tabrakan bersama', 'Tiap port domain sendiri', 'Tiap port domain sendiri'],
          ['Dipakai untuk', 'Jarang dipakai lagi', 'Menyambung PC dalam satu LAN', 'Menyambung LAN berbeda dan internet']
        ]} />
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- 4. IP ke biner

/** Kelas IPv4 dan keterangannya dari oktet pertama. */
function ipInfo(o: number[]) {
  const a = o[0]
  const cls = a === 0 ? '-' : a === 127 ? 'Loopback' : a < 128 ? 'A' : a < 192 ? 'B' : a < 224 ? 'C' : a < 240 ? 'D (multicast)' : 'E (eksperimen)'
  const mask = cls === 'A' ? '255.0.0.0 (/8)' : cls === 'B' ? '255.255.0.0 (/16)' : cls === 'C' ? '255.255.255.0 (/24)' : '-'
  const priv = a === 10 || (a === 172 && o[1] >= 16 && o[1] <= 31) || (a === 192 && o[1] === 168)
  return { cls, mask, priv }
}

function IpBiner() {
  const [o, setO] = useState([192, 168, 1, 10])
  const set = (i: number, v: number) => setO(o.map((x, k) => (k === i ? Math.max(0, Math.min(255, v | 0)) : x)))
  const info = ipInfo(o)
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-center font-mono text-[28px] font-bold md:text-[34px]" aria-live="polite">{o.join('.')}</p>
        <p className="text-center font-mono text-[15px] text-ink-soft md:text-[17px]">{o.map((x) => x.toString(2).padStart(8, '0')).join('.')}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {o.map((x, i) => (
            <fieldset key={i} className="rounded-xl bg-bg p-3">
              <legend className="sr-only">Oktet {i + 1}</legend>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-bold">Oktet {i + 1}</span>
                <label className="flex items-center gap-2 text-[14px]">Desimal<input type="number" min={0} max={255} value={x} onChange={(e) => set(i, +e.target.value)} className="min-h-[44px] w-20 rounded-xl border-2 border-line px-2 font-mono text-[15px]" /></label>
              </div>
              <div className="mt-2 grid grid-cols-8 gap-1">
                {[128, 64, 32, 16, 8, 4, 2, 1].map((w) => {
                  const on = (x & w) !== 0
                  return (
                    <button key={w} type="button" aria-pressed={on} onClick={() => set(i, x ^ w)} className="flex flex-col items-center gap-0.5">
                      <span className="text-[13px] text-ink-soft">{w}<span className="sr-only"> (nilai bit)</span></span>
                      <span className={`flex h-11 w-full items-center justify-center rounded-lg font-mono text-[18px] font-bold transition ${on ? 'bg-primary text-white' : 'border-2 border-line bg-white text-ink-soft'}`}>{on ? 1 : 0}</span>
                    </button>)
                })}
              </div>
              <p className="mt-1.5 text-[14px] text-ink-soft">{[128, 64, 32, 16, 8, 4, 2, 1].filter((w) => x & w).join(' + ') || '0'} = <b className="text-ink">{x}</b></p>
            </fieldset>
          ))}
        </div>
      </Card>
      <Card title="Keterangan alamat ini">
        <Compare head={['', 'Nilai']} rows={[['Kelas', info.cls], ['Subnet mask bawaan', info.mask], ['Jenis', info.priv ? 'IP privat (hanya di jaringan lokal)' : 'IP publik / khusus'], ['Rentang IP privat', '10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16']]} />
        <div className="mt-3 flex flex-wrap gap-2">
          {([[10, 0, 0, 1], [172, 16, 5, 4], [192, 168, 1, 10], [8, 8, 8, 8], [127, 0, 0, 1]] as number[][]).map((v) => <button key={v.join('.')} type="button" onClick={() => setO(v)} className="min-h-[44px] rounded-xl border-2 border-line px-3 font-mono text-[14px] font-semibold">{v.join('.')}</button>)}
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------- 5. Kalkulator subnet

const toIp = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.')
const parseIp = (s: string): number | null => { const m = s.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/); if (!m) return null; const p = m.slice(1).map(Number); return p.some((x) => x > 255) ? null : ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3] }

function Subnet() {
  const [ipS, setIpS] = useState('192.168.1.70')
  const [pre, setPre] = useState(26)
  const ip = parseIp(ipS)
  const r = useMemo(() => {
    if (ip === null) return null
    const mask = pre === 0 ? 0 : ((0xffffffff << (32 - pre)) >>> 0)
    const net = (ip & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0
    const hosts = pre >= 31 ? 0 : 2 ** (32 - pre) - 2
    const oct = Math.min(3, Math.floor(pre / 8)), block = 2 ** (8 - (pre - oct * 8))
    const val = (ip >>> (24 - oct * 8)) & 255
    return { mask, net, bc, hosts, oct, block, idx: Math.floor(val / block), count: 256 / block }
  }, [ip, pre])
  const bits = ip === null ? '' : (ip >>> 0).toString(2).padStart(32, '0')
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-[14px] font-semibold">IP Address
            <input value={ipS} onChange={(e) => setIpS(e.target.value)} inputMode="decimal" aria-invalid={ip === null} className={`min-h-[44px] w-48 rounded-xl border-2 px-3 font-mono text-[16px] ${ip === null ? 'border-[#DC2626]' : 'border-line'}`} />
          </label>
          <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-[14px] font-semibold">Prefix: /{pre}
            <input type="range" min={8} max={30} value={pre} onChange={(e) => setPre(+e.target.value)} className="h-11 accent-[#2457F5]" aria-valuetext={`/${pre}`} />
          </label>
        </div>
        {ip === null ? <p className="mt-3 text-[15px] text-[#B91C1C]">Format IP: empat angka 0-255 dipisah titik.</p> : r && (
          <>
            <div className="mt-4 flex flex-wrap gap-0.5 font-mono text-[15px]" role="img" aria-label={`${pre} bit network, ${32 - pre} bit host`}>
              {bits.split('').map((b, i) => <span key={i} className={`flex h-9 w-[clamp(14px,2.6vw,26px)] items-center justify-center rounded ${i < pre ? 'bg-primary text-white' : 'bg-[#FEF3C7] text-[#78350F]'} ${i % 8 === 7 && i < 31 ? 'mr-2' : ''}`}>{b}</span>)}
            </div>
            <p className="mt-2 text-[14px]"><span className="mr-1 inline-block h-3 w-3 rounded bg-primary align-middle" /> {pre} bit network <span className="ml-3 mr-1 inline-block h-3 w-3 rounded bg-[#FEF3C7] align-middle" /> {32 - pre} bit host</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[['Subnet mask', toIp(r.mask)], ['Network', `${toIp(r.net)}/${pre}`], ['Broadcast', toIp(r.bc)], ['Host pertama', toIp(r.net + 1)], ['Host terakhir', toIp(r.bc - 1)], ['Jumlah host', `${r.hosts.toLocaleString('id-ID')} (2^${32 - pre} − 2)`]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-bg px-3 py-2.5"><p className="text-[14px] text-ink-soft">{k}</p><p className="font-mono text-[17px] font-bold">{v}</p></div>))}
            </div>
          </>
        )}
      </Card>
      {ip !== null && r && (
        <Card title={`Pembagian oktet ke-${r.oct + 1}: ${r.count} subnet, tiap blok ${r.block}`}>
          <div className="flex h-12 w-full overflow-hidden rounded-xl border-2 border-line" role="img" aria-label={`IP ini ada di subnet ke-${r.idx + 1} dari ${r.count}`}>
            {Array.from({ length: r.count }, (_, i) => <span key={i} title={`${i * r.block}–${i * r.block + r.block - 1}`} className={`flex-1 border-r border-white last:border-r-0 ${i === r.idx ? 'bg-primary' : i % 2 ? 'bg-[#DBE4FF]' : 'bg-[#EEF2FF]'}`} />)}
          </div>
          <p className="mt-3 text-[15px] text-[#33415A]">IP ini ada di <b>subnet ke-{r.idx + 1}</b>: nilai oktet ke-{r.oct + 1} dari <b>{r.idx * r.block}</b> sampai <b>{r.idx * r.block + r.block - 1}</b>. Angka pertama blok = alamat network, angka terakhir = broadcast.</p>
          <Compare head={['Prefix', 'Mask', 'Host per subnet', 'Subnet dalam /24']} rows={[24, 25, 26, 27, 28, 29, 30].map((p) => [`/${p}`, toIp(((0xffffffff << (32 - p)) >>> 0)), String(2 ** (32 - p) - 2), String(2 ** (p - 24))])} />
        </Card>
      )}
    </div>
  )
}

// Gambar SVG buatan sendiri untuk Lab, Simulasi, Materi, dan Kuis. Gaya garis sama dengan Netty: garis gelap, isi biru dan putih.
// Semua gambar bisa diskalakan, ringan untuk PWA offline, dan punya teks alternatif lewat `label`.
import type { ReactNode } from 'react'

const INK = '#0F1B2D', BLUE = '#2457F5', SOFT = '#E8EEFE', GREEN = '#0F7B55', ORANGE = '#F97316', RED = '#C0262D', GREY = '#CBD5E1'

/** Warna gambar mengikuti status: selesai hijau, terbuka biru, terkunci abu. */
export type Tone = 'done' | 'open' | 'lock'
const tone = (t: Tone) => (t === 'lock' ? { line: GREY, fill: '#F1F5F9', accent: GREY } : t === 'done' ? { line: INK, fill: '#DCFCE7', accent: GREEN } : { line: INK, fill: SOFT, accent: BLUE })

// ---------------------------------------------------------------- Topologi

/** Jenis simpul: s switch, h hub, p PC, l laptop, r router, a access point, c awan internet, f firewall, v server. */
type NodeT = 's' | 'h' | 'p' | 'l' | 'r' | 'a' | 'c' | 'f' | 'v'
/** Simpul [jenis, x, y, label opsional]; kabel [indeks a, indeks b, gaya]. Gaya: '' biasa, 'x' putus, 'c' kabel cross, 'w' nirkabel, 't' terowongan. */
export type Topo = { n: [NodeT, number, number, string?][]; e: [number, number, string?][] }

function Shape({ t, x, y, c }: { t: NodeT; x: number; y: number; c: ReturnType<typeof tone> }) {
  const sw = 2
  switch (t) {
    case 's': return <g><rect x={x - 11} y={y - 7} width="22" height="14" rx="4" fill={c.fill} stroke={c.accent} strokeWidth={sw} /><path d={`M${x - 6} ${y}h12`} stroke={c.accent} strokeWidth="1.6" strokeDasharray="2 2" /></g>
    case 'h': return <g><rect x={x - 11} y={y - 7} width="22" height="14" rx="4" fill="#fff" stroke={c.line} strokeWidth={sw} /><circle cx={x - 5} cy={y} r="1.6" fill={c.line} /><circle cx={x} cy={y} r="1.6" fill={c.line} /><circle cx={x + 5} cy={y} r="1.6" fill={c.line} /></g>
    case 'p': return <g><rect x={x - 8} y={y - 7} width="16" height="11" rx="2" fill="#fff" stroke={c.line} strokeWidth={sw} /><path d={`M${x - 4} ${y + 8}h8M${x} ${y + 4}v4`} stroke={c.line} strokeWidth={sw} strokeLinecap="round" /></g>
    case 'l': return <g><rect x={x - 7} y={y - 6} width="14" height="9" rx="2" fill="#fff" stroke={c.line} strokeWidth={sw} /><path d={`M${x - 10} ${y + 6}h20`} stroke={c.line} strokeWidth={sw} strokeLinecap="round" /></g>
    case 'r': return <g><circle cx={x} cy={y} r="9" fill={c.fill} stroke={c.accent} strokeWidth={sw} /><path d={`M${x - 5} ${y - 2}h10l-3-3M${x + 5} ${y + 2}h-10l3 3`} fill="none" stroke={c.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></g>
    case 'a': return <g><rect x={x - 8} y={y - 3} width="16" height="8" rx="3" fill={c.fill} stroke={c.accent} strokeWidth={sw} /><path d={`M${x - 6} ${y - 7}a8 8 0 0 1 12 0M${x - 3} ${y - 5}a4 4 0 0 1 6 0`} fill="none" stroke={c.accent} strokeWidth="1.6" strokeLinecap="round" /></g>
    case 'c': return <path d={`M${x - 12} ${y + 6}a6 6 0 0 1 1-11 8 8 0 0 1 15-2 6 6 0 0 1 8 7 5 5 0 0 1-2 6z`} fill="#fff" stroke={c.line} strokeWidth={sw} strokeLinejoin="round" />
    case 'f': return <g><rect x={x - 9} y={y - 10} width="18" height="20" rx="2" fill="#FFEDD5" stroke={ORANGE} strokeWidth={sw} /><path d={`M${x - 9} ${y - 3}h18M${x - 9} ${y + 4}h18M${x - 2} ${y - 10}v7M${x + 3} ${y - 3}v7M${x - 4} ${y + 4}v6`} stroke={ORANGE} strokeWidth="1.4" /></g>
    case 'v': return <g><rect x={x - 7} y={y - 10} width="14" height="20" rx="2" fill="#fff" stroke={c.line} strokeWidth={sw} /><path d={`M${x - 4} ${y - 5}h8M${x - 4} ${y}h8M${x - 4} ${y + 5}h8`} stroke={c.line} strokeWidth="1.4" /></g>
  }
}

/** Gambar topologi dari daftar simpul dan kabel. Kotak gambar 100 x 60. */
export function TopoArt({ topo, t = 'open', label, className = '' }: { topo: Topo; t?: Tone; label?: string; className?: string }) {
  const c = tone(t)
  return (
    <svg viewBox="-6 -6 112 76" className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {topo.e.map(([a, b, st = ''], i) => {
        const [, x1, y1] = topo.n[a], [, x2, y2] = topo.n[b]
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
        if (st === 'w') return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke={c.accent} strokeWidth="1.4" strokeDasharray="1.5 2.5" strokeLinecap="round" />
        if (st === 't') return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke={GREEN} strokeWidth="5" strokeOpacity=".35" strokeLinecap="round" />
        return (
          <g key={i}>
            <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={st === 'x' ? RED : st === 'c' ? ORANGE : c.line} strokeWidth="1.8" strokeDasharray={st === 'x' || st === 'c' ? '3 2' : undefined} />
            {st === 'x' && <path d={`M${mx - 3} ${my - 3}l6 6M${mx + 3} ${my - 3}l-6 6`} stroke={RED} strokeWidth="2" strokeLinecap="round" />}
          </g>
        )
      })}
      {topo.n.map(([k, x, y, l], i) => (
        <g key={i}><Shape t={k} x={x} y={y} c={c} />{l && <text x={l.startsWith('>') ? x + 11 : x} y={l.startsWith('>') ? y + 2 : y + (k === 'c' ? 2 : l.startsWith('^') ? -14 : 17)} textAnchor={l.startsWith('>') ? 'start' : 'middle'} fontSize="5.5" fontWeight="600" fill={c.line === GREY ? '#94A3B8' : '#33415A'} fontFamily="Inter, sans-serif">{l.replace(/^[\^>]/, '')}</text>}</g>
      ))}
    </svg>
  )
}

// Topologi siap pakai, dipakai kartu Lab dan diagram Materi.
const T: Record<string, Topo> = {
  bus: { n: [['s', 22, 22], ['s', 50, 22], ['s', 78, 22], ['p', 22, 46], ['p', 50, 46], ['p', 78, 46]], e: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5]] },
  star: { n: [['s', 50, 30], ['p', 18, 12], ['p', 82, 12], ['p', 18, 48], ['p', 82, 48]], e: [[0, 1], [0, 2], [0, 3], [0, 4]] },
  ring: { n: [['s', 32, 14], ['s', 68, 14], ['s', 68, 46], ['s', 32, 46]], e: [[0, 1], [1, 2], [2, 3], [3, 0]] },
  mesh: { n: [['s', 30, 14], ['s', 70, 14], ['s', 70, 46], ['s', 30, 46]], e: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]] },
  tree: { n: [['s', 50, 10], ['s', 30, 30], ['s', 70, 30], ['p', 18, 50], ['p', 42, 50], ['p', 58, 50], ['p', 82, 50]], e: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]] },
  hybrid: { n: [['s', 50, 10], ['s', 28, 32], ['s', 72, 32], ['p', 12, 52], ['p', 38, 52], ['p', 62, 52], ['p', 88, 52]], e: [[0, 1], [1, 2], [2, 0], [1, 3], [1, 4], [2, 5], [2, 6]] },
  kabel: { n: [['p', 18, 18, 'PC'], ['s', 50, 18, 'Switch'], ['p', 82, 18, 'PC'], ['p', 18, 46], ['p', 82, 46]], e: [[0, 1], [1, 2], [3, 4, 'c']] },
  hubsw: { n: [['h', 28, 22, 'Hub'], ['p', 12, 48], ['p', 44, 48], ['s', 72, 22, 'Switch'], ['p', 58, 48], ['p', 88, 48]], e: [[0, 1], [0, 2], [3, 4], [3, 5]] },
  ip: { n: [['s', 50, 18], ['p', 18, 40, '.10'], ['p', 50, 44, '.11'], ['p', 82, 40, '.12']], e: [[0, 1], [0, 2], [0, 3]] },
  router: { n: [['p', 8, 30], ['s', 28, 30], ['r', 50, 30, 'Router'], ['s', 72, 30], ['p', 92, 30]], e: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  rusak: { n: [['s', 50, 26], ['p', 16, 10], ['p', 84, 10], ['p', 16, 46], ['p', 84, 46]], e: [[0, 1], [0, 2, 'x'], [0, 3], [0, 4, 'x']] },
  kantor: { n: [['r', 50, 10], ['s', 26, 30], ['s', 74, 30], ['p', 12, 50], ['p', 38, 50], ['p', 62, 50], ['p', 88, 50]], e: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]] },
  nirkabel: { n: [['a', 50, 24], ['l', 16, 50], ['p', 50, 54], ['l', 84, 50], ['r', 50, 4]], e: [[0, 1, 'w'], [0, 2, 'w'], [0, 3, 'w'], [4, 0]] },
  natlan: { n: [['p', 18, 14, '^192.168.1.10'], ['p', 18, 46, '192.168.1.11'], ['r', 52, 30, 'Router'], ['c', 86, 30, 'Internet']], e: [[0, 2], [1, 2], [2, 3]] },
  routing: { n: [['p', 8, 14, '^LAN A'], ['r', 34, 34], ['r', 66, 34], ['p', 92, 46, 'LAN B'], ['r', 50, 10]], e: [[0, 1], [1, 2], [2, 3], [1, 4], [4, 2]] },
  vpn: { n: [['l', 12, 30, 'Rumah'], ['c', 50, 30, 'Internet'], ['v', 88, 30, 'Kantor']], e: [[0, 2, 't'], [0, 1], [1, 2]] },
  firewall: { n: [['c', 14, 30, 'Internet'], ['f', 46, 30], ['s', 70, 30], ['p', 90, 14], ['p', 90, 46]], e: [[0, 1], [1, 2], [2, 3], [2, 4]] },
  snmp: { n: [['v', 50, 12, '>Manager'], ['r', 18, 46, 'Agent'], ['s', 50, 46, 'Agent'], ['v', 82, 46, 'Agent']], e: [[0, 1, 'w'], [0, 2, 'w'], [0, 3, 'w']] },
  swvsr: { n: [['p', 6, 50], ['s', 30, 30, '^Switch'], ['p', 6, 10], ['r', 58, 30, '^Router'], ['c', 88, 30, 'LAN lain']], e: [[0, 1], [2, 1], [1, 3], [3, 4]] }
}
// Topologi tiap misi lab (urut misi 1 sampai 12).
const MISSION_TOPO = ['bus', 'star', 'ring', 'mesh', 'tree', 'hybrid', 'kabel', 'hubsw', 'ip', 'router', 'rusak', 'kantor']

/** Gambar kecil di kartu misi Lab: topologi yang akan dirakit. */
export function LabThumb({ n, t }: { n: number; t: Tone }) {
  return <TopoArt topo={T[MISSION_TOPO[n - 1]] ?? T.star} t={t} className="h-full w-full" />
}

// ---------------------------------------------------------------- Simulasi

const W568B = ['#F97316', '#F97316', '#16A34A', '#2563EB', '#2563EB', '#16A34A', '#92400E', '#92400E']
const W568A = ['#16A34A', '#16A34A', '#F97316', '#2563EB', '#2563EB', '#F97316', '#92400E', '#92400E']

/** Gambar sampul tiap kartu Simulasi. */
export function SimThumb({ slug }: { slug: string }) {
  const box = 'h-full w-full'
  if (slug === 'kabel') return (
    <svg viewBox="0 0 120 60" className={box} aria-hidden="true">
      <rect x="8" y="8" width="18" height="44" rx="4" fill="#fff" stroke={GREY} strokeWidth="1.5" /><rect x="94" y="8" width="18" height="44" rx="4" fill="#fff" stroke={GREY} strokeWidth="1.5" />
      {W568B.map((col, i) => { const y1 = 12 + i * 5, j = [2, 5, 0, 3, 4, 1, 6, 7][i], y2 = 12 + j * 5; return <path key={i} className="sim-wire" d={`M26 ${y1}C60 ${y1},60 ${y2},94 ${y2}`} fill="none" stroke={col} strokeWidth="2.4" strokeDasharray={i % 2 === 0 ? '4 2' : undefined} /> })}
    </svg>
  )
  if (slug === 'osi') {
    const osi = ['Application', 'Presentation', 'Session', 'Transport', 'Network', 'Data Link', 'Physical']
    const tcp: [string, number, number][] = [['Application', 0, 3], ['Transport', 3, 1], ['Internet', 4, 1], ['Network Access', 5, 2]]
    return (
      <svg viewBox="0 0 120 60" className={box} aria-hidden="true">
        {osi.map((l, i) => <g key={l} className="sim-stack" style={{ animationDelay: `${i * 60}ms` }}><rect x="14" y={4 + i * 7.5} width="40" height="6.5" rx="1.5" fill={i < 3 ? '#C7D4FB' : i < 4 ? '#93A9F5' : i < 5 ? '#6B8AF0' : BLUE} /><text x="34" y={8.8 + i * 7.5} textAnchor="middle" fontSize="3.8" fontWeight="600" fill={i < 4 ? INK : '#fff'} fontFamily="Inter, sans-serif">{l}</text></g>)}
        {tcp.map(([l, s, k]) => <g key={l}><rect x="66" y={4 + s * 7.5} width="40" height={k * 7.5 - 1} rx="1.5" fill="#fff" stroke={BLUE} strokeWidth="1.2" /><text x="86" y={4 + s * 7.5 + (k * 7.5) / 2 + 1.3} textAnchor="middle" fontSize="3.8" fontWeight="700" fill={INK} fontFamily="Inter, sans-serif">{l}</text></g>)}
      </svg>
    )
  }
  if (slug === 'perangkat') return (
    <svg viewBox="0 0 100 60" className={box} aria-hidden="true">
      <TopoInner topo={T.star} />
      <rect className="sim-packet" x="0" y="0" width="7" height="5" rx="1" fill={ORANGE} />
    </svg>
  )
  if (slug === 'ip-biner') return (
    <svg viewBox="0 0 120 60" className={box} aria-hidden="true">
      <text x="60" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill={INK} fontFamily="Space Grotesk, sans-serif">192.168.1.10</text>
      {'00001010'.split('').map((b, i) => <g key={i} className="sim-bit" style={{ animationDelay: `${i * 90}ms` }}><rect x={22 + i * 10} y="32" width="8.5" height="12" rx="2" fill={b === '1' ? GREEN : '#fff'} stroke={b === '1' ? GREEN : GREY} strokeWidth="1.2" /><text x={26.25 + i * 10} y="41" textAnchor="middle" fontSize="7" fontWeight="700" fill={b === '1' ? '#fff' : '#64748B'} fontFamily="ui-monospace, monospace">{b}</text></g>)}
      <text x="60" y="54" textAnchor="middle" fontSize="5" fill="#4A5568" fontFamily="Inter, sans-serif">oktet ke-4 = 10</text>
    </svg>
  )
  return (
    <svg viewBox="0 0 120 60" className={box} aria-hidden="true">
      <text x="60" y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK} fontFamily="Space Grotesk, sans-serif">/26</text>
      {[0, 1, 2, 3].map((i) => <rect key={i} className="sim-bit" style={{ animationDelay: `${i * 120}ms` }} x={14 + i * 23.5} y="28" width="22" height="14" rx="2.5" fill={i === 1 ? BLUE : '#DBE4FF'} />)}
      <text x="60" y="53" textAnchor="middle" fontSize="5" fill="#4A5568" fontFamily="Inter, sans-serif">4 subnet × 62 host</text>
    </svg>
  )
}
/** Isi topologi tanpa pembungkus svg (dipakai di dalam svg lain). */
function TopoInner({ topo }: { topo: Topo }) {
  const c = tone('open')
  return <>{topo.e.map(([a, b], i) => <path key={i} d={`M${topo.n[a][1]} ${topo.n[a][2]}L${topo.n[b][1]} ${topo.n[b][2]}`} stroke={INK} strokeWidth="1.8" />)}{topo.n.map(([k, x, y], i) => <Shape key={i} t={k} x={x} y={y} c={c} />)}</>
}

// ---------------------------------------------------------------- Diagram Materi dan Kuis

/** Batang bit: `net` bit jaringan (biru) dari `total` bit, dibagi per 8. */
function Bits({ net, total = 32, y = 20, label }: { net: number; total?: number; y?: number; label?: ReactNode }) {
  const w = 104 / total
  return (
    <g>
      {Array.from({ length: total }, (_, i) => <rect key={i} x={8 + i * w + (Math.floor(i / 8) * 1.2 * 32) / total} y={y} width={w - 0.5} height="10" rx="1" fill={i < net ? BLUE : '#DBE4FF'} />)}
      {label}
    </g>
  )
}
const Tx = ({ x, y, children, s = 5.5, w = 600, c = INK, a = 'middle' }: { x: number; y: number; children: ReactNode; s?: number; w?: number; c?: string; a?: 'middle' | 'start' | 'end' }) => (
  <text x={x} y={y} textAnchor={a} fontSize={s} fontWeight={w} fill={c} fontFamily="Inter, sans-serif">{children}</text>
)

/** Daftar diagram: kunci, keterangan untuk pembaca layar, keterangan di bawah gambar, dan gambarnya. */
type Dg = { alt: string; cap: string; sim?: string; art: ReactNode }
const box = (k: string) => <TopoArt topo={T[k]} className="mx-auto block h-auto w-full max-w-[380px]" />
const pair = (a: string, b: string, la: string, lb: string) => (
  <svg viewBox="0 0 220 72" className="h-full w-full" aria-hidden="true">
    <svg x="0" y="0" width="105" height="63" viewBox="0 0 100 60"><TopoInner topo={T[a]} /></svg>
    <svg x="115" y="0" width="105" height="63" viewBox="0 0 100 60"><TopoInner topo={T[b]} /></svg>
    <Tx x={52} y={70} s={7}>{la}</Tx><Tx x={167} y={70} s={7}>{lb}</Tx>
  </svg>
)
export const DIAGRAMS: Record<string, Dg> = {
  ip: {
    alt: 'Alamat 192.168.1.10 dibagi menjadi bagian network 192.168.1 dan bagian host 10', cap: 'Satu IP Address = bagian network (alamat jalan) + bagian host (nomor rumah).', sim: 'ip-biner',
    art: <svg viewBox="0 0 120 44" className="h-full w-full" aria-hidden="true"><rect x="8" y="8" width="72" height="16" rx="3" fill={SOFT} stroke={BLUE} strokeWidth="1.2" /><rect x="82" y="8" width="30" height="16" rx="3" fill="#DCFCE7" stroke={GREEN} strokeWidth="1.2" /><Tx x={44} y={19} s={8} w={700}>192.168.1</Tx><Tx x={97} y={19} s={8} w={700}>.10</Tx><Tx x={44} y={34} c={BLUE}>Network</Tx><Tx x={97} y={34} c={GREEN}>Host</Tx></svg>
  },
  ipv6: {
    alt: 'IPv4 panjangnya 32 bit, IPv6 panjangnya 128 bit, empat kali lebih panjang', cap: 'IPv4 32 bit (sekitar 4,3 miliar alamat); IPv6 128 bit, jauh lebih banyak.',
    art: <svg viewBox="0 0 120 44" className="h-full w-full" aria-hidden="true"><Tx x={8} y={12} a="start" w={700}>IPv4 · 32 bit</Tx><rect x="8" y="15" width="26" height="7" rx="2" fill={BLUE} /><Tx x={8} y={32} a="start" w={700}>IPv6 · 128 bit</Tx><rect x="8" y="35" width="104" height="7" rx="2" fill={GREEN} /></svg>
  },
  nat: { alt: 'Dua PC dengan IP privat 192.168.1.x terhubung ke router, router memakai satu IP publik ke internet', cap: 'IP privat dipakai di dalam LAN; router menukarnya dengan satu IP publik saat keluar ke internet.', art: box('natlan') },
  mask: {
    alt: 'Subnet mask /24: 24 bit pertama bernilai 1 untuk network, 8 bit terakhir 0 untuk host', cap: '/24 = 24 bit pertama network (255.255.255), 8 bit sisanya host (.0).', sim: 'subnet',
    art: <svg viewBox="0 0 120 44" className="h-full w-full" aria-hidden="true"><Bits net={24} y={14} /><Tx x={44} y={36} c={BLUE}>24 bit network</Tx><Tx x={100} y={36} c="#4A5568">8 bit host</Tx></svg>
  },
  busring: { alt: 'Topologi bus: switch berderet dalam satu jalur. Topologi ring: empat switch membentuk lingkaran', cap: 'Bus memakai satu jalur utama; ring membentuk lingkaran tertutup.', art: pair('bus', 'ring', 'Bus', 'Ring') },
  startree: { alt: 'Topologi star: semua PC ke satu switch pusat. Topologi tree: switch pusat bercabang ke switch lain', cap: 'Star punya satu pusat; tree adalah beberapa star yang bertingkat.', art: pair('star', 'tree', 'Star', 'Tree') },
  meshhybrid: { alt: 'Topologi mesh: setiap switch tersambung ke semua switch lain. Topologi hybrid: gabungan star dan ring', cap: 'Mesh paling tahan putus karena jalurnya banyak; hybrid menggabungkan beberapa topologi.', art: pair('mesh', 'hybrid', 'Mesh', 'Hybrid') },
  nirkabel: { alt: 'Access point memancarkan sinyal ke laptop dan PC tanpa kabel', cap: 'Topologi nirkabel: perangkat terhubung ke access point lewat sinyal radio.', art: box('nirkabel') },
  osi: {
    alt: 'Tujuh lapisan OSI dari Application di atas sampai Physical di bawah', cap: 'Data turun dari Application ke Physical saat dikirim, dan naik lagi saat diterima.', sim: 'osi',
    art: <svg viewBox="0 0 120 64" className="h-full w-full" aria-hidden="true">{['7 Application', '6 Presentation', '5 Session', '4 Transport', '3 Network', '2 Data Link', '1 Physical'].map((l, i) => <g key={l}><rect x="22" y={2 + i * 8.6} width="76" height="7.6" rx="2" fill={i < 3 ? '#C7D4FB' : i === 3 ? '#93A9F5' : i === 4 ? '#6B8AF0' : BLUE} /><Tx x={60} y={7.6 + i * 8.6} s={4.8} c={i < 4 ? INK : '#fff'}>{l}</Tx></g>)}<path d="M108 6v52" stroke={ORANGE} strokeWidth="1.6" markerEnd="" /><path d="M105 54l3 4 3-4" fill="none" stroke={ORANGE} strokeWidth="1.6" /></svg>
  },
  osivstcp: { alt: 'Tujuh lapisan OSI dipetakan ke empat lapisan TCP/IP', cap: 'Application, Presentation, dan Session OSI dilebur jadi satu Application di TCP/IP.', sim: 'osi', art: <SimThumb slug="osi" /> },
  kabelmedia: {
    alt: 'Tiga media kabel: twisted pair berisi empat pasang kabel, coaxial berinti tembaga, fiber optik berinti kaca', cap: 'Twisted pair untuk LAN, coaxial untuk TV kabel, fiber optik untuk jarak jauh dan cepat.',
    art: <svg viewBox="0 0 120 44" className="h-full w-full" aria-hidden="true"><circle cx="22" cy="18" r="12" fill="#fff" stroke={INK} strokeWidth="1.5" />{W568B.filter((_, i) => i % 2 === 0).map((c, i) => <circle key={i} cx={18 + (i % 2) * 8} cy={14 + Math.floor(i / 2) * 8} r="3" fill={c} />)}<circle cx="60" cy="18" r="12" fill="#fff" stroke={INK} strokeWidth="1.5" /><circle cx="60" cy="18" r="8" fill="#E2E8F0" /><circle cx="60" cy="18" r="3" fill="#B45309" /><circle cx="98" cy="18" r="12" fill="#fff" stroke={INK} strokeWidth="1.5" /><circle cx="98" cy="18" r="6" fill="#FEF3C7" /><circle cx="98" cy="18" r="2.4" fill="#FACC15" /><Tx x={22} y={40}>Twisted pair</Tx><Tx x={60} y={40}>Coaxial</Tx><Tx x={98} y={40}>Fiber optik</Tx></svg>
  },
  rj45: {
    alt: 'Urutan warna konektor RJ45 standar T568B: putih oranye, oranye, putih hijau, biru, putih biru, hijau, putih coklat, coklat', cap: 'Straight: kedua ujung T568B. Cross-over: satu ujung T568A, satu ujung T568B.', sim: 'kabel',
    art: <svg viewBox="0 0 120 44" className="h-full w-full" aria-hidden="true">{[W568B, W568A].map((w, k) => <g key={k}><Tx x={k ? 86 : 34} y={8} w={700}>{k ? 'T568A' : 'T568B'}</Tx><rect x={(k ? 62 : 10)} y="12" width="48" height="24" rx="3" fill="#fff" stroke={INK} strokeWidth="1.2" />{w.map((c, i) => <rect key={i} x={(k ? 65 : 13) + i * 5.4} y="15" width="4" height="18" rx="1" fill={i % 2 === 0 ? '#fff' : c} stroke={c} strokeWidth="1.2" />)}</g>)}</svg>
  },
  sinyal: {
    alt: 'Sinyal analog berbentuk gelombang halus, sinyal digital berbentuk kotak naik turun', cap: 'Analog berubah halus terus-menerus; digital hanya dua nilai, 0 dan 1.',
    art: <svg viewBox="0 0 120 44" className="h-full w-full" aria-hidden="true"><path d="M6 16 Q14 2 22 16 T38 16 T54 16" fill="none" stroke={BLUE} strokeWidth="2" /><path d="M66 22V8h10v14h10V8h10v14h8V8h8" fill="none" stroke={GREEN} strokeWidth="2" /><Tx x={30} y={38}>Analog</Tx><Tx x={90} y={38}>Digital</Tx></svg>
  },
  cidr: {
    alt: 'Network /24 dibagi menjadi empat subnet /26 dengan 62 host masing-masing', cap: 'Meminjam 2 bit host: /24 menjadi 4 subnet /26, tiap subnet 64 alamat (62 host).', sim: 'subnet',
    art: <svg viewBox="0 0 120 44" className="h-full w-full" aria-hidden="true"><rect x="8" y="4" width="104" height="11" rx="2.5" fill="#DBE4FF" /><Tx x={60} y={11.8}>/24 · 256 alamat</Tx><path d="M60 16v4" stroke={INK} strokeWidth="1.2" />{[0, 1, 2, 3].map((i) => <g key={i}><rect x={8 + i * 26.5} y="22" width="24.5" height="11" rx="2.5" fill={BLUE} /><Tx x={20.25 + i * 26.5} y={29.6} c="#fff" s={4.8}>/26</Tx></g>)}<Tx x={60} y={42} c="#4A5568" s={5}>.0 · .64 · .128 · .192</Tx></svg>
  },
  kelasc: {
    alt: 'Perbandingan /24 dengan 254 host, /25 dua subnet 126 host, /26 empat subnet 62 host', cap: 'Setiap tambahan 1 bit prefix membagi jaringan jadi dua kali lebih banyak subnet.', sim: 'subnet',
    art: <svg viewBox="0 0 120 50" className="h-full w-full" aria-hidden="true">{[[1, '/24', '254 host'], [2, '/25', '126 host'], [4, '/26', '62 host']].map(([k, p, h], r) => <g key={String(p)}><Tx x={6} y={9 + r * 15} a="start" w={700}>{p}</Tx>{Array.from({ length: Number(k) }, (_, i) => <rect key={i} x={22 + i * (72 / Number(k))} y={3 + r * 15} width={72 / Number(k) - 1.5} height="9" rx="2" fill={r === 0 ? '#DBE4FF' : r === 1 ? '#93A9F5' : BLUE} />)}<Tx x={100} y={9 + r * 15} a="start" s={4.8} c="#4A5568">{h}</Tx></g>)}</svg>
  },
  routing: { alt: 'LAN A dan LAN B terhubung lewat beberapa router; paket memilih jalur terbaik', cap: 'Router membaca alamat tujuan dan meneruskan paket lewat jalur terbaik ke jaringan lain.', art: box('routing') },
  swvsr: { alt: 'Switch menghubungkan PC dalam satu LAN, router menghubungkan LAN ke jaringan lain', cap: 'Switch bekerja di dalam satu jaringan (MAC); router antar jaringan (IP).', sim: 'perangkat', art: box('swvsr') },
  vpn: { alt: 'Laptop di rumah terhubung ke server kantor lewat terowongan terenkripsi melintasi internet', cap: 'VPN membuat terowongan terenkripsi di atas internet, seolah kamu ada di jaringan kantor.', art: box('vpn') },
  fcaps: {
    alt: 'Lima area FCAPS: Fault, Configuration, Accounting, Performance, Security', cap: 'FCAPS: lima area yang diurus admin jaringan.',
    art: <svg viewBox="0 0 140 40" className="h-full w-full" aria-hidden="true">{[['F', 'Fault'], ['C', 'Configuration'], ['A', 'Accounting'], ['P', 'Performance'], ['S', 'Security']].map(([k, l], i) => <g key={k}><rect x={8 + i * 26} y="4" width="20" height="20" rx="4" fill={[RED, BLUE, '#B45309', GREEN, '#7E22CE'][i]} /><Tx x={18 + i * 26} y={18} s={11} w={700} c="#fff">{k}</Tx><Tx x={18 + i * 26} y={32} s={3.8}>{l}</Tx></g>)}</svg>
  },
  snmp: { alt: 'Satu server manager memantau beberapa agent: router, switch, dan server', cap: 'SNMP: manager bertanya, agent di tiap perangkat menjawab status dan angka kinerjanya.', art: box('snmp') },
  enkripsi: {
    alt: 'Plaintext HALO diubah dengan kunci menjadi ciphertext acak, lalu dibuka lagi dengan kunci', cap: 'Enkripsi mengubah teks asli menjadi acak; hanya pemegang kunci yang bisa membukanya.',
    art: <svg viewBox="0 0 120 40" className="h-full w-full" aria-hidden="true"><rect x="4" y="10" width="28" height="14" rx="3" fill="#fff" stroke={INK} strokeWidth="1.2" /><Tx x={18} y={19.5} s={6.5} w={700}>HALO</Tx><path d="M34 17h14l-3-3M48 17l-3 3" fill="none" stroke={INK} strokeWidth="1.2" /><circle cx="56" cy="13" r="4" fill="none" stroke="#B45309" strokeWidth="1.6" /><path d="M56 17v8M56 21h3" stroke="#B45309" strokeWidth="1.6" /><path d="M64 17h14l-3-3M78 17l-3 3" fill="none" stroke={INK} strokeWidth="1.2" /><rect x="84" y="10" width="32" height="14" rx="3" fill={SOFT} stroke={BLUE} strokeWidth="1.2" /><Tx x={100} y={19.5} s={6.5} w={700} c={BLUE}>x7#Q</Tx><Tx x={18} y={34} s={4.8}>Plaintext</Tx><Tx x={56} y={34} s={4.8}>Kunci</Tx><Tx x={100} y={34} s={4.8}>Ciphertext</Tx></svg>
  },
  firewall: { alt: 'Firewall berdiri di antara internet dan jaringan lokal, menyaring lalu lintas yang masuk', cap: 'Firewall menyaring lalu lintas antara internet dan jaringan lokal sesuai aturan.', art: box('firewall') }
}

// Diagram untuk tiap sub-topik Materi, kunci "level-subtopik". Sub-topik yang bukan konsep visual sengaja tanpa diagram.
export const MATERI_DIAGRAM: Record<string, string> = {
  '2-1': 'ip', '2-2': 'ipv6', '2-3': 'nat', '2-5': 'mask',
  '3-1': 'busring', '3-2': 'startree', '3-3': 'meshhybrid', '3-4': 'nirkabel',
  '4-1': 'osi', '4-2': 'osivstcp', '4-3': 'osivstcp', '4-5': 'firewall',
  '5-2': 'kabelmedia', '5-3': 'rj45', '5-6': 'sinyal',
  '6-1': 'ip', '6-3': 'nat', '6-4': 'mask', '6-5': 'cidr',
  '7-1': 'cidr', '7-3': 'kelasc',
  '8-1': 'routing', '8-3': 'swvsr',
  '9-1': 'vpn', '10-2': 'fcaps', '10-3': 'snmp', '11-2': 'enkripsi', '11-5': 'firewall'
}

// Kata kunci di soal kuis yang memunculkan diagram di penjelasan (dicek berurutan).
const QUIZ_RULES: [RegExp, string][] = [
  [/\/2[5-9]|\/3[0-2]|jumlah host/i, 'kelasc'], [/subnetting|meminjam bit|subjaringan/i, 'cidr'], [/cidr|prefix|subnet mask|netmask|\/24|\/16|\/8/i, 'mask'],
  [/\bbus\b|\bring\b/i, 'busring'], [/\bstar\b|\btree\b/i, 'startree'], [/\bmesh\b|hybrid/i, 'meshhybrid'],
  [/osi|lapisan|layer/i, 'osi'], [/t568|straight|cross|rj-?45/i, 'rj45'], [/fiber|coaxial|twisted/i, 'kabelmedia'], [/analog|digital/i, 'sinyal'],
  [/ipv6/i, 'ipv6'], [/privat|publik|nat\b/i, 'nat'], [/vpn|tunnel|terowongan/i, 'vpn'], [/fcaps/i, 'fcaps'], [/snmp/i, 'snmp'],
  [/enkripsi|cipher|kunci publik/i, 'enkripsi'], [/firewall/i, 'firewall'], [/router|routing/i, 'routing'], [/switch/i, 'swvsr']
]
/** Diagram yang cocok untuk satu soal kuis, atau null bila soal itu bukan konsep visual. */
export const quizDiagram = (text: string): string | null => QUIZ_RULES.find(([re]) => re.test(text))?.[1] ?? null

/** Kartu diagram dengan keterangan; `sim` menampilkan tautan "Coba di Simulasi". */
export function Diagram({ k, compact = false, simLink }: { k: string; compact?: boolean; simLink?: (slug: string) => ReactNode }) {
  const d = DIAGRAMS[k]
  if (!d) return null
  return (
    <figure className={`flex flex-col gap-2 rounded-[18px] border-[1.5px] border-line bg-white ${compact ? 'p-3' : 'p-4'}`}>
      <div role="img" aria-label={d.alt} className={`mx-auto w-full ${compact ? 'max-w-[360px]' : 'max-w-[520px]'}`}>{d.art}</div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-[15px] leading-snug text-[#33415A]">
        <span className="min-w-0 flex-1">{d.cap}</span>
        {d.sim && simLink?.(d.sim)}
      </figcaption>
    </figure>
  )
}

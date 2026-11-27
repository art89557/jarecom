// Mesin Lab Topologi: perangkat, kabel, rute paket, dan enam misi (Bus sampai Hybrid).
// Semua fungsi murni (tanpa React), supaya mudah diuji di lab.test.ts.
// Misi 1-8 soal bentuk topologi, kabel, dan perangkat; misi 9-12 memakai alamat IP dan satu router.

// ---------------------------------------------------------------- Tipe data

/** Jenis perangkat. PC dan Laptop = end device (1 port); sisanya perangkat jaringan (24 port). */
export type DevType = 'pc' | 'laptop' | 'switch' | 'hub' | 'router'

/** Alamat satu port router. */
export interface PortIp { ip: string; mask: string }

/**
 * Satu perangkat di area kerja. `off` = port yang dimatikan (Port Status off).
 * PC/Laptop memakai `ip`, `mask`, `gw` (Default Gateway); router memakai `ips` per port.
 */
export interface Dev { id: string; type: DevType; name: string; x: number; y: number; on: boolean; off: Record<string, boolean>; ip?: string; mask?: string; gw?: string; ips?: Record<string, PortIp> }

/** Jenis kabel tembaga: lurus (straight-through) atau silang (cross-over). */
export type CableKind = 'straight' | 'cross'

/** Satu kabel. `pa`/`pb` = port di ujung a/b. `ready` false = lampu oranye. `manual` = jenis kabel dipilih sendiri (bukan Automatic). */
export interface Link { id: string; a: string; b: string; pa: string; pb: string; ready: boolean; kind?: CableKind; manual?: boolean }

/** Isi area kerja. */
export interface Net { devices: Dev[]; links: Link[] }

/** Hasil satu Simple PDU, ping, atau tracert. `via` = jenis perangkat yang dilewati; `sim` = dikirim di mode Simulation. */
export interface Pdu { n: number; src: string; dst: string; ok: boolean; why?: string; path: string[]; cmd?: 'pdu' | 'ping' | 'tracert'; dstIp?: string; sim?: boolean; via?: DevType[]; hops?: string[] }

// ---------------------------------------------------------------- Label gaya Packet Tracer

export const LABEL: Record<DevType, string> = { pc: 'PC', laptop: 'Laptop', switch: 'Switch', hub: 'Hub', router: 'Router' }
export const MODEL: Record<DevType, string> = { pc: 'PC-PT', laptop: 'Laptop-PT', switch: '2960-24TT', hub: 'Hub-PT', router: '1941' }
export const CABLE: Record<CableKind, string> = { straight: 'Copper Straight-Through', cross: 'Copper Cross-Over' }

/** PC, laptop, dan router satu kelompok; switch dan hub kelompok lain. Sama kelompok = cross-over, beda = straight-through. */
const groupA = (t: DevType) => t === 'pc' || t === 'laptop' || t === 'router'
export const needKind = (a: DevType, b: DevType): CableKind => (groupA(a) === groupA(b) ? 'cross' : 'straight')

// ---------------------------------------------------------------- Bantuan graf

export const isEnd = (d?: Dev) => !!d && (d.type === 'pc' || d.type === 'laptop')
export const isCore = (d?: Dev) => !!d && !isEnd(d)
export const isSwHub = (d?: Dev) => !!d && (d.type === 'switch' || d.type === 'hub')
export const byName = (n: Net, name: string) => n.devices.find((d) => d.name === name)
export const dev = (n: Net, id: string) => n.devices.find((d) => d.id === id)
export const linkOf = (n: Net, a: string, b: string) => n.links.find((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a))
export const portAt = (l: Link, id: string) => (l.a === id ? l.pa : l.pb)
export const other = (l: Link, id: string) => (l.a === id ? l.b : l.a)

/** Jenis kabel salah untuk pasangan perangkat ini (lampu merah). */
export function wrongCable(n: Net, l: Link): boolean {
  const a = dev(n, l.a), b = dev(n, l.b)
  return !!a && !!b && !!l.kind && l.kind !== needKind(a.type, b.type)
}
/** Kabel mati: ujung dimatikan, port off, perangkat hilang, atau jenis kabel salah. */
export function linkDown(n: Net, l: Link): boolean {
  const a = dev(n, l.a), b = dev(n, l.b)
  return !a || !b || !a.on || !b.on || !!a.off[l.pa] || !!b.off[l.pb] || wrongCable(n, l)
}
/** Kabel bisa dilewati paket: sudah hijau dan tidak mati. */
export const usable = (n: Net, l: Link) => l.ready && !linkDown(n, l)

/** Port kosong berikutnya, atau null kalau penuh. End device hanya punya FastEthernet0. */
export function freePort(n: Net, d: Dev): string | null {
  const used = n.links.filter((l) => l.a === d.id || l.b === d.id).map((l) => portAt(l, d.id))
  if (isEnd(d)) return used.length ? null : 'Fa0'
  if (d.type === 'router') return ['Gig0/0', 'Gig0/1'].find((p) => !used.includes(p)) ?? null
  for (let i = 1; i <= 24; i++) if (!used.includes(`Fa0/${i}`)) return `Fa0/${i}`
  return null
}

/** Tetangga yang tersambung dengan kabel yang bisa dipakai. */
const nbrs = (n: Net, id: string) => n.links.filter((l) => (l.a === id || l.b === id) && usable(n, l)).map((l) => other(l, id))

/** Rute terpendek (BFS) dari PC ke PC. End device lain tidak boleh jadi jalan lewat. */
export function route(n: Net, from: string, to: string): string[] | null {
  const prev: Record<string, string | null> = { [from]: null }
  const q = [from]
  while (q.length) {
    const c = q.shift()!
    if (c === to) break
    for (const x of nbrs(n, c)) {
      if (x in prev) continue
      if (x !== to && isEnd(dev(n, x))) continue
      prev[x] = c; q.push(x)
    }
  }
  if (!(to in prev)) return null
  const path: string[] = []
  for (let c: string | null = to; c !== null; c = prev[c]) path.unshift(c)
  return path
}

/** Jalankan satu Simple PDU dan jelaskan hasilnya. */
export function ping(n: Net, from: string, to: string, num: number): Pdu {
  const A = dev(n, from)?.name ?? '?', B = dev(n, to)?.name ?? '?'
  const path = route(n, from, to)
  if (path) return { n: num, src: A, dst: B, ok: true, path, cmd: 'pdu', via: viaOf(n, path) }
  const src = dev(n, from)
  const own = n.links.find((l) => l.a === from || l.b === from)
  let why = `Tidak ada jalur kabel aktif dari ${A} ke ${B}.`
  if (src && !src.on) why = `${A} sedang mati.`
  else if (!own) why = `${A} belum tersambung kabel.`
  else if (!own.ready) why = `Kabel ${A} masih oranye. Tunggu sampai hijau.`
  else if (wrongCable(n, own)) why = `Kabel ${A} salah jenis: perlu ${CABLE[needKind(src!.type, dev(n, other(own, from))!.type)]}.`
  else if (linkDown(n, own)) why = `Port ${A} mati atau perangkat di ujung kabelnya mati.`
  return { n: num, src: A, dst: B, ok: false, why, path: [], cmd: 'pdu' }
}

/** Jenis perangkat di tengah jalur (tanpa ujung). */
export const viaOf = (n: Net, path: string[]) => path.slice(1, -1).map((id) => dev(n, id)!.type)

// ---------------------------------------------------------------- Pengecekan bentuk topologi

const cores = (n: Net) => n.devices.filter(isSwHub)
const ends = (n: Net) => n.devices.filter(isEnd)
/** Kabel antar perangkat jaringan yang bisa dipakai. */
const coreLinks = (n: Net) => n.links.filter((l) => usable(n, l) && isSwHub(dev(n, l.a)) && isSwHub(dev(n, l.b)))
/** Jumlah PC aktif yang menggantung di perangkat jaringan `id`. */
export const pcsOn = (n: Net, id: string) => nbrs(n, id).filter((x) => isEnd(dev(n, x))).length
/** Setiap end device tersambung (kabel aktif) ke salah satu perangkat jaringan. */
const allEndsAttached = (n: Net) => ends(n).every((e) => nbrs(n, e.id).some((x) => isCore(dev(n, x))))
/** Derajat tiap perangkat jaringan di antara sesama perangkat jaringan. */
function coreDeg(n: Net): Record<string, number> {
  const deg: Record<string, number> = {}
  cores(n).forEach((c) => (deg[c.id] = 0))
  coreLinks(n).forEach((l) => { deg[l.a]++; deg[l.b]++ })
  return deg
}
/** Semua perangkat jaringan saling terhubung (satu komponen). */
function coresConnected(n: Net): boolean {
  const cs = cores(n); if (!cs.length) return false
  const seen = new Set([cs[0].id]); const q = [cs[0].id]
  while (q.length) {
    const c = q.shift()!
    coreLinks(n).forEach((l) => { if (l.a !== c && l.b !== c) return; const x = other(l, c); if (!seen.has(x)) { seen.add(x); q.push(x) } })
  }
  return seen.size === cs.length
}
/** Ada PC yang sudah tidak punya kabel aktif (terputus). */
const someEndCut = (n: Net) => ends(n).some((e) => nbrs(n, e.id).length === 0)


// ---------------------------------------------------------------- Alamat IP (misi 9-12)

/** Ubah "192.168.1.10" jadi angka 32 bit, atau null kalau formatnya salah. */
export function ipNum(s?: string): number | null {
  const m = s?.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return null
  const p = m.slice(1).map(Number)
  if (p.some((x) => x > 255)) return null
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]
}
/** Subnet mask sah: bit 1 berurutan dari kiri (255.255.255.0 sah, 255.0.255.0 tidak). */
export function validMask(s?: string): boolean {
  const n = ipNum(s); if (n === null || n === 0) return false
  const inv = (~n) >>> 0
  return ((inv + 1) & inv) === 0
}
/** Dua IP satu jaringan menurut mask. */
export function sameNet(a?: string, b?: string, mask?: string): boolean {
  const x = ipNum(a), y = ipNum(b), m = ipNum(mask)
  if (x === null || y === null || m === null) return false
  return ((x & m) >>> 0) === ((y & m) >>> 0)
}

/**
 * Ujung yang satu segmen (lewat switch/hub) dengan perangkat `devId` (atau port `port` router).
 * Hasil: id PC/Laptop, atau "routerId|port" untuk port router.
 */
export function segment(n: Net, devId: string, port?: string): Set<string> {
  const out = new Set<string>(), seen = new Set<string>([devId]), q: string[] = []
  const step = (l: Link, from: string) => {
    if (!usable(n, l)) return
    const o = other(l, from), d = dev(n, o); if (!d) return
    if (isEnd(d)) out.add(o)
    else if (d.type === 'router') out.add(`${o}|${portAt(l, o)}`)
    else if (!seen.has(o)) { seen.add(o); q.push(o) }
  }
  n.links.filter((l) => (l.a === devId && (!port || l.pa === port)) || (l.b === devId && (!port || l.pb === port))).forEach((l) => step(l, devId))
  while (q.length) { const c = q.shift()!; n.links.filter((l) => l.a === c || l.b === c).forEach((l) => step(l, c)) }
  return out
}

/** Hasil ping berbasis IP. `hops` = alamat tiap lompatan (untuk tracert). */
export interface IpResult { ok: boolean; why?: string; hops: string[]; dstId?: string }

/** Cari perangkat aktif ber-IP `ip` di antara ujung satu segmen. */
function findIp(n: Net, seg: Set<string>, ip: string): { id: string; port?: string } | null {
  for (const e of seg) {
    if (e.includes('|')) { const [r, p] = e.split('|'); const d = dev(n, r); if (d?.on && d.ips?.[p]?.ip === ip) return { id: r, port: p } }
    else { const d = dev(n, e); if (d?.on && d.ip === ip) return { id: e } }
  }
  return null
}

/** Ping berbasis IP seperti Command Prompt Packet Tracer: satu subnet langsung, beda subnet lewat Default Gateway (satu router). */
export function ipPing(n: Net, srcId: string, dstIp: string): IpResult {
  const s = dev(n, srcId)
  if (!s || !s.on) return { ok: false, why: `${s?.name ?? 'Perangkat'} sedang mati.`, hops: [] }
  if (ipNum(s.ip) === null || !validMask(s.mask)) return { ok: false, why: `${s.name} belum punya IP Address dan Subnet Mask yang benar.`, hops: [] }
  if (ipNum(dstIp) === null) return { ok: false, why: `${dstIp} bukan alamat IP yang benar.`, hops: [] }
  if (s.ip === dstIp) return { ok: true, hops: [dstIp], dstId: s.id }
  const seg = segment(n, s.id)
  if (sameNet(s.ip, dstIp, s.mask)) {
    const t = findIp(n, seg, dstIp)
    if (!t) return { ok: false, why: `Tidak ada perangkat ${dstIp} yang tersambung di jaringan ${s.name}.`, hops: [] }
    return { ok: true, hops: [dstIp], dstId: t.id }
  }
  if (!s.gw) return { ok: false, why: `${dstIp} ada di jaringan lain, tetapi Default Gateway ${s.name} masih kosong.`, hops: [] }
  if (!sameNet(s.gw, s.ip, s.mask)) return { ok: false, why: `Default Gateway ${s.name} (${s.gw}) tidak satu jaringan dengan IP-nya.`, hops: [] }
  const g = findIp(n, seg, s.gw)
  if (!g || !g.port) return { ok: false, why: `Default Gateway ${s.gw} tidak ditemukan. Cek IP port router yang tersambung ke jaringan ${s.name}.`, hops: [] }
  const r = dev(n, g.id)!
  const out = Object.entries(r.ips ?? {}).find(([p, v]) => p !== g.port && validMask(v.mask) && sameNet(v.ip, dstIp, v.mask))
  if (!out) return { ok: false, why: `${r.name} tidak punya jaringan untuk ${dstIp}.`, hops: [s.gw] }
  if (out[1].ip === dstIp) return { ok: true, hops: [dstIp], dstId: r.id }
  const t = findIp(n, segment(n, r.id, out[0]), dstIp)
  if (!t || t.port) return { ok: false, why: `Tidak ada perangkat ${dstIp} yang aktif di jaringan ${r.name} ${out[0]}.`, hops: [s.gw] }
  const d = dev(n, t.id)!
  if (d.gw !== out[1].ip) return { ok: false, why: `${d.name} tidak bisa membalas: Default Gateway-nya harus ${out[1].ip}.`, hops: [s.gw, dstIp] }
  return { ok: true, hops: [s.gw, dstIp], dstId: d.id }
}

/** Ping/tracert/Simple PDU berbasis IP, dibungkus jadi catatan PDU. */
export function ipPdu(n: Net, srcId: string, dstIp: string, num: number, cmd: 'pdu' | 'ping' | 'tracert'): Pdu {
  const r = ipPing(n, srcId, dstIp)
  const A = dev(n, srcId)?.name ?? '?'
  const B = r.dstId ? dev(n, r.dstId)!.name : dstIp
  const path = r.ok && r.dstId ? route(n, srcId, r.dstId) ?? [] : []
  return { n: num, src: A, dst: B, ok: r.ok, why: r.why, path, cmd, dstIp, hops: r.hops, via: viaOf(n, path) }
}

/** Semua pasangan PC/Laptop bisa saling ping lewat IP. */
export function allIpPairs(n: Net): boolean {
  const e = n.devices.filter(isEnd)
  return e.length >= 2 && e.every((a) => e.every((b) => a === b || (b.ip ? ipPing(n, a.id, b.ip).ok : false)))
}

// ---------------------------------------------------------------- Misi

/** Konteks pengecekan langkah: jaringan sekarang dan PDU yang dikirim sejak langkah ini aktif. */
export interface Ctx { net: Net; pdus: Pdu[] }

/** Satu langkah misi. `ok` true = langkah selesai. */
export interface Step { text: string; hint: string; ok: (c: Ctx) => boolean }

/** Satu misi lab. */
/** Kelompok misi; misi pertama tiap kelompok langsung terbuka. */
export type Group = 'topologi' | 'perangkat' | 'ip' | 'proyek'
export const GROUPS: [Group, string, string][] = [
  ['topologi', 'Topologi', 'Bentuk jaringan dari Bus sampai Hybrid.'],
  ['perangkat', 'Kabel dan perangkat', 'Jenis kabel tembaga, serta beda hub dan switch.'],
  ['ip', 'Alamat IP dan routing', 'IP Address, subnet, Default Gateway, dan router.'],
  ['proyek', 'Troubleshooting dan proyek', 'Perbaiki jaringan rusak, lalu rancang jaringan kantor.']
]

/** Satu baris Addressing Table. */
export interface Addr { dev: string; iface: string; ip: string; mask: string; gw: string }

/** Satu misi lab. `ip` = Simple PDU memakai aturan IP; `start` = jaringan awal (misi troubleshooting). */
export interface Mission { n: number; slug: string; group: Group; title: string; goal: string; lesson: string; steps: Step[]; ip?: boolean; table?: Addr[]; start?: () => Net }

const pinged = (c: Ctx) => c.pdus.some((p) => p.ok)
const pingFailed = (c: Ctx) => c.pdus.some((p) => !p.ok)

/** Langkah umum: taruh k perangkat jaringan. */
const placeCores = (k: number, what = 'Switch 2960'): Step => ({
  text: `Taruh ${k} ${what} di area kerja`,
  hint: 'Buka kategori Network Devices di bawah, pilih Switch 2960, lalu klik area kerja. Ulangi sesuai jumlahnya.',
  ok: (c) => cores(c.net).length >= k
})
/** Langkah umum: tiap switch punya minimal k PC. */
const pcsEach = (k: number): Step => ({
  text: k === 1 ? 'Pasang 1 PC di setiap switch' : `Pasang ${k} PC di setiap switch`,
  hint: 'Buka End Devices, pilih PC-PT, taruh di dekat switch. Lalu pakai kabel Automatic (petir): klik PC, lalu klik switch-nya.',
  ok: (c) => ends(c.net).length >= cores(c.net).length * k && allEndsAttached(c.net) && cores(c.net).every((s) => pcsOn(c.net, s.id) >= k)
})
/** Langkah umum: kirim Simple PDU yang berhasil. */
const pingOk = (text = 'Kirim Simple PDU antar dua PC', hint = 'Pilih Add Simple PDU (amplop), klik PC pengirim lalu PC tujuan. Hasilnya muncul di daftar PDU: Successful atau Failed.'): Step => ({ text, hint, ok: pinged })


// ---------------------------------------------------------------- Bantuan pengecekan misi 7-12

const M24 = '255.255.255.0'
/** Kabel aktif di antara dua perangkat (menurut nama). */
const linkNamed = (n: Net, a: string, b: string) => { const A = byName(n, a), B = byName(n, b); return A && B ? linkOf(n, A.id, B.id) : undefined }
const attached = (n: Net, a: string, b: string) => { const l = linkNamed(n, a, b); return !!l && usable(n, l) }
/** Kabel antara a dan b dipilih sendiri dengan jenis `k` dan sudah hijau. */
const cableIs = (n: Net, a: string, b: string, k: CableKind) => { const l = linkNamed(n, a, b); return !!l && !!l.manual && l.kind === k && usable(n, l) }
/** IP, mask, dan (kalau diberikan) gateway perangkat sesuai. */
const ipIs = (n: Net, name: string, ip: string, gw?: string) => { const d = byName(n, name); return !!d && d.ip === ip && d.mask === M24 && (gw === undefined || d.gw === gw) }
/** IP port router yang tersambung ke switch bernama `sw`. */
function routerIpTo(n: Net, sw: string): PortIp | undefined {
  const r = n.devices.find((d) => d.type === 'router'), S = byName(n, sw)
  if (!r || !S) return undefined
  const l = linkOf(n, r.id, S.id)
  return l && usable(n, l) ? r.ips?.[portAt(l, r.id)] : undefined
}
const pduHas = (c: Ctx, f: (p: Pdu) => boolean) => c.pdus.some(f)
/** Router tersambung (kabel hijau) ke minimal dua switch. */
const routerToTwo = (n: Net) => { const r = n.devices.find((d) => d.type === 'router'); return !!r && nbrs(n, r.id).filter((x) => dev(n, x)?.type === 'switch').length >= 2 }

/** Jaringan awal misi troubleshooting: sengaja dipasang dengan empat kesalahan. */
function brokenOffice(): Net {
  const D = (id: string, type: DevType, x: number, y: number, extra: Partial<Dev> = {}): Dev => ({ id, type, name: id, x, y, on: true, off: {}, ...extra })
  const L = (a: string, pa: string, b: string, pb: string, kind: CableKind): Link => ({ id: `t-${a}-${b}`, a, b, pa, pb, ready: true, kind, manual: true })
  const g1 = '192.168.1.1', g2 = '192.168.2.1'
  return {
    devices: [
      D('Router0', 'router', 400, 70, { ips: { 'Gig0/0': { ip: g1, mask: M24 }, 'Gig0/1': { ip: g2, mask: M24 } } }),
      D('Switch0', 'switch', 210, 210, { off: { 'Fa0/4': true } }),
      D('Switch1', 'switch', 590, 210),
      D('PC0', 'pc', 80, 400, { ip: '192.168.1.10', mask: M24, gw: g1 }),
      D('PC1', 'pc', 210, 430, { ip: '192.168.1.11', mask: M24, gw: g1 }),
      D('PC2', 'pc', 340, 400, { ip: '192.168.1.12', mask: M24, gw: g1 }),
      D('PC3', 'pc', 520, 420, { ip: '192.168.2.10', mask: M24, gw: '' }),
      D('PC4', 'pc', 690, 400, { ip: '192.168.1.13', mask: M24, gw: g1 })
    ],
    links: [
      L('Router0', 'Gig0/0', 'Switch0', 'Fa0/1', 'straight'), L('Router0', 'Gig0/1', 'Switch1', 'Fa0/1', 'straight'),
      L('PC0', 'Fa0', 'Switch0', 'Fa0/2', 'straight'), L('PC1', 'Fa0', 'Switch0', 'Fa0/3', 'cross'),
      L('PC2', 'Fa0', 'Switch0', 'Fa0/4', 'straight'), L('PC3', 'Fa0', 'Switch1', 'Fa0/2', 'straight'), L('PC4', 'Fa0', 'Switch1', 'Fa0/3', 'straight')
    ]
  }
}

/** Lantai (10 atau 20) sebuah PC menurut port router di segmennya; null kalau tidak jelas. */
function floorOf(n: Net, id: string): 10 | 20 | null {
  const r = n.devices.find((d) => d.type === 'router'); if (!r) return null
  const seg = segment(n, id)
  if (seg.has(`${r.id}|Gig0/0`)) return 10
  if (seg.has(`${r.id}|Gig0/1`)) return 20
  return null
}
/** Semua PC punya IP unik yang benar di subnet lantainya dan gateway yang benar. */
function officeIpsOk(n: Net): boolean {
  const e = n.devices.filter(isEnd); const seen = new Set<string>()
  return e.length >= 4 && e.every((d) => {
    const f = floorOf(n, d.id); if (!f) return false
    const host = ipNum(d.ip); if (host === null || seen.has(d.ip!)) return false
    seen.add(d.ip!)
    const last = host & 255
    return sameNet(d.ip, `192.168.${f}.0`, M24) && d.mask === M24 && d.gw === `192.168.${f}.1` && last > 1 && last < 255
  })
}

export const MISSIONS: Mission[] = [
  {
    n: 1, slug: 'bus', group: 'topologi', title: 'Topologi Bus',
    goal: 'Semua perangkat berbagi satu jalur utama (backbone).',
    lesson: 'Di topologi bus, semua data lewat satu jalur utama. Murah dan mudah dipasang, tapi kalau backbone putus, jaringan terbelah dua.',
    steps: [
      placeCores(3),
      { text: 'Sambung switch berderet jadi satu backbone', hint: 'Pakai kabel Automatic: Switch0 ke Switch1, lalu Switch1 ke Switch2. Jangan sambung ujung ke ujung (itu ring).', ok: (c) => { const d = coreDeg(c.net); const v = Object.values(d); return v.length >= 3 && coresConnected(c.net) && v.every((x) => x >= 1 && x <= 2) && v.filter((x) => x === 1).length === 2 } },
      pcsEach(1),
      pingOk('Kirim Simple PDU dari PC paling kiri ke PC paling kanan'),
      { text: 'Putuskan kabel backbone di tengah', hint: 'Pilih alat Delete lalu klik kabel antar switch. Bisa juga matikan port switch lewat Config.', ok: (c) => !coresConnected(c.net) },
      { text: 'Kirim Simple PDU lagi melewati bagian yang putus', hint: 'PDU akan Failed: inilah kelemahan bus.', ok: pingFailed }
    ]
  },
  {
    n: 2, slug: 'star', group: 'topologi', title: 'Topologi Star',
    goal: 'Setiap PC tersambung ke satu perangkat pusat.',
    lesson: 'Di topologi star, setiap PC tersambung ke satu perangkat pusat. Kalau satu PC terputus, PC lain tetap bisa saling ping. Tapi kalau switch-nya mati, seluruh jaringan ikut terputus.',
    steps: [
      placeCores(1),
      { text: 'Tambahkan 4 PC atau Laptop', hint: 'Buka End Devices, pilih PC-PT, lalu klik empat tempat di sekitar switch.', ok: (c) => ends(c.net).length >= 4 },
      { text: 'Sambungkan setiap PC ke switch', hint: 'Buka Connections, pilih kabel Automatic (petir), klik PC lalu switch. Tunggu lampu oranye jadi segitiga hijau.', ok: (c) => ends(c.net).length >= 4 && allEndsAttached(c.net) },
      pingOk(),
      { text: 'Putuskan satu PC dari jaringan', hint: 'Klik PC, buka Config, matikan Port Status FastEthernet0. Bisa juga hapus kabelnya dengan Delete.', ok: (c) => someEndCut(c.net) },
      { text: 'Kirim Simple PDU antar dua PC yang masih tersambung', hint: 'Buktikan: walau satu PC terputus, PC lain tetap bisa saling ping.', ok: (c) => someEndCut(c.net) && pinged(c) }
    ]
  },
  {
    n: 3, slug: 'ring', group: 'topologi', title: 'Topologi Ring',
    goal: 'Perangkat jaringan membentuk lingkaran tertutup.',
    lesson: 'Di topologi ring, data punya dua arah jalan. Kalau satu kabel ring putus, paket memutar lewat arah lain. Kalau dua kabel putus, ring terbelah.',
    steps: [
      placeCores(4),
      { text: 'Sambung keempat switch membentuk lingkaran', hint: 'Switch0–1, 1–2, 2–3, lalu 3–0. Setiap switch tersambung tepat ke dua switch lain.', ok: (c) => { const v = Object.values(coreDeg(c.net)); return v.length >= 4 && coresConnected(c.net) && v.every((x) => x === 2) } },
      pcsEach(1),
      pingOk(),
      { text: 'Putuskan satu kabel ring', hint: 'Pakai Delete pada satu kabel antar switch.', ok: (c) => { const v = Object.values(coreDeg(c.net)); return v.some((x) => x < 2) && coresConnected(c.net) } },
      pingOk('Kirim Simple PDU lagi: paket memutar lewat arah lain', 'Ping tetap Successful karena masih ada jalan di sisi lain lingkaran.')
    ]
  },
  {
    n: 4, slug: 'mesh', group: 'topologi', title: 'Topologi Mesh',
    goal: 'Setiap perangkat jaringan tersambung ke semua perangkat jaringan lain.',
    lesson: 'Full mesh punya jalur cadangan terbanyak, jadi paling tahan putus. Kekurangannya: kabel dan port yang dibutuhkan banyak sekali, n(n-1)/2 kabel.',
    steps: [
      placeCores(4),
      { text: 'Sambungkan setiap switch ke semua switch lain (6 kabel)', hint: '4 switch butuh 4×3/2 = 6 kabel antar switch.', ok: (c) => { const k = cores(c.net).length; const v = Object.values(coreDeg(c.net)); return k >= 4 && v.every((x) => x >= k - 1) } },
      pcsEach(1),
      pingOk(),
      { text: 'Putuskan dua kabel antar switch', hint: 'Pakai Delete pada dua kabel mana saja di antara switch.', ok: (c) => { const k = cores(c.net).length; return coreLinks(c.net).length <= (k * (k - 1)) / 2 - 2 && coresConnected(c.net) } },
      pingOk('Kirim Simple PDU lagi: jaringan tetap jalan', 'Masih ada jalur cadangan, jadi ping tetap Successful.')
    ]
  },
  {
    n: 5, slug: 'tree', group: 'topologi', title: 'Topologi Tree',
    goal: 'Switch pusat bercabang ke switch-switch di bawahnya.',
    lesson: 'Topologi tree (hierarki) mudah dikembangkan per cabang. Tapi kalau switch cabang mati, semua PC di bawahnya ikut terputus; kalau switch pusat mati, cabang-cabang terpisah.',
    steps: [
      placeCores(3),
      { text: 'Jadikan satu switch sebagai pusat, sambung ke dua switch cabang', hint: 'Switch pusat tersambung ke dua switch lain. Switch cabang tidak saling disambung.', ok: (c) => { const v = Object.values(coreDeg(c.net)); return v.length >= 3 && coresConnected(c.net) && v.filter((x) => x >= 2).length >= 1 && coreLinks(c.net).length === v.length - 1 } },
      { text: 'Pasang 2 PC di setiap switch cabang', hint: 'Switch pusat tidak perlu PC. Sambung tiap PC ke switch cabangnya.', ok: (c) => { const d = coreDeg(c.net); const leaves = cores(c.net).filter((s) => d[s.id] === 1); return leaves.length >= 2 && leaves.every((s) => pcsOn(c.net, s.id) >= 2) && allEndsAttached(c.net) } },
      pingOk('Kirim Simple PDU dari cabang kiri ke cabang kanan'),
      { text: 'Matikan satu switch cabang', hint: 'Klik switch cabang, tab Physical, tekan tombol Power.', ok: (c) => c.net.devices.some((d) => d.type === 'switch' && !d.on) },
      pingOk('Kirim Simple PDU antar PC di cabang yang masih hidup', 'PC di cabang yang mati terputus, tapi cabang lain tetap jalan.')
    ]
  },
  {
    n: 6, slug: 'hybrid', group: 'topologi', title: 'Topologi Hybrid',
    goal: 'Gabungan beberapa topologi: tiga star yang switch-nya membentuk ring.',
    lesson: 'Hybrid menggabungkan kelebihan beberapa topologi. Di sini tiap switch adalah pusat star, dan switch-switch membentuk ring sebagai jalur cadangan.',
    steps: [
      placeCores(3),
      { text: 'Sambung ketiga switch membentuk ring', hint: 'Switch0–1, 1–2, lalu 2–0.', ok: (c) => { const v = Object.values(coreDeg(c.net)); return v.length >= 3 && coresConnected(c.net) && v.every((x) => x === 2) } },
      pcsEach(2),
      pingOk('Kirim Simple PDU antar PC di dua star berbeda'),
      { text: 'Putuskan satu kabel ring', hint: 'Delete satu kabel antar switch.', ok: (c) => { const v = Object.values(coreDeg(c.net)); return v.some((x) => x < 2) && coresConnected(c.net) } },
      pingOk('Kirim Simple PDU lagi antar star', 'Ring masih punya jalan lain, jadi star-star tetap terhubung.')
    ]
  },
  {
    n: 7, slug: 'kabel', group: 'perangkat', title: 'Kabel Straight dan Cross-Over',
    goal: 'Pilih jenis kabel tembaga yang benar untuk tiap pasangan perangkat.',
    lesson: 'Perangkat beda kelompok (PC ke switch, router ke switch) memakai straight-through. Perangkat sekelompok (switch ke switch, PC ke PC, PC ke router) memakai cross-over. Kabel salah membuat port mati: lampunya merah. Pilihan Automatic di Packet Tracer memilihkan jenis yang benar.',
    steps: [
      { text: 'Taruh Switch0, Switch1, PC0, dan PC1', hint: 'Dua Switch 2960 dari Network Devices, dua PC-PT dari End Devices.', ok: (c) => byName(c.net, 'Switch0')?.type === 'switch' && byName(c.net, 'Switch1')?.type === 'switch' && !!byName(c.net, 'PC0') && !!byName(c.net, 'PC1') },
      { text: 'Sambung PC0 ke Switch0 dengan Copper Straight-Through', hint: 'Connections → Copper Straight-Through (garis lurus). Klik PC0 lalu Switch0.', ok: (c) => cableIs(c.net, 'PC0', 'Switch0', 'straight') },
      { text: 'Sambung Switch0 ke Switch1 dengan Copper Cross-Over', hint: 'Connections → Copper Cross-Over (garis putus-putus). Switch ke switch = sekelompok.', ok: (c) => cableIs(c.net, 'Switch0', 'Switch1', 'cross') },
      { text: 'Sambung PC1 ke Switch1 dengan Copper Straight-Through', hint: 'Sama seperti PC0: PC ke switch memakai straight-through.', ok: (c) => cableIs(c.net, 'PC1', 'Switch1', 'straight') },
      pingOk('Kirim Simple PDU dari PC0 ke PC1'),
      { text: 'Coba kabel salah: ganti kabel PC1 dengan Cross-Over', hint: 'Delete kabel PC1–Switch1, lalu sambung lagi dengan Copper Cross-Over. Lampunya jadi merah.', ok: (c) => { const l = linkNamed(c.net, 'PC1', 'Switch1'); return !!l && l.kind === 'cross' } }
    ]
  },
  {
    n: 8, slug: 'hub-switch', group: 'perangkat', title: 'Hub vs Switch',
    goal: 'Lihat beda cara hub dan switch meneruskan paket di mode Simulation.',
    lesson: 'Hub bekerja di Layer 1: setiap paket disalin ke SEMUA port, jadi semua PC ikut menerima dan rawan tabrakan. Switch bekerja di Layer 2: ia mencatat alamat MAC tiap port dan meneruskan paket hanya ke port tujuan. Karena itu jaringan modern memakai switch.',
    steps: [
      { text: 'Taruh 1 Hub-PT dan sambungkan 3 PC ke hub', hint: 'Network Devices → Hub-PT. Lalu 3 PC-PT, sambung dengan kabel Automatic.', ok: (c) => c.net.devices.some((d) => d.type === 'hub' && pcsOn(c.net, d.id) >= 3) },
      { text: 'Di Simulation, kirim Simple PDU antar dua PC di hub', hint: 'Klik Simulation, lalu Add Simple PDU. Perhatikan amplop abu-abu: hub mengirim ke semua PC.', ok: (c) => pduHas(c, (p) => p.ok && !!p.sim && !!p.via?.includes('hub')) },
      { text: 'Taruh 1 Switch 2960 dan sambungkan 3 PC lain ke switch', hint: 'Buat jaringan kedua di sebelahnya: 1 switch dan 3 PC.', ok: (c) => c.net.devices.some((d) => d.type === 'switch' && pcsOn(c.net, d.id) >= 3) },
      { text: 'Di Simulation, kirim Simple PDU antar dua PC di switch', hint: 'Bandingkan: amplop hanya menuju PC tujuan.', ok: (c) => pduHas(c, (p) => p.ok && !!p.sim && !!p.via?.includes('switch') && !p.via?.includes('hub')) }
    ]
  },
  {
    n: 9, slug: 'ip-subnet', group: 'ip', title: 'IP Address dan Subnet', ip: true,
    goal: 'Beri IP Address pada PC dan buktikan bahwa ping hanya jalan di subnet yang sama.',
    lesson: 'Dua PC di switch yang sama tetap tidak bisa saling ping kalau subnetnya beda. Dengan mask 255.255.255.0, tiga angka pertama IP (192.168.1) adalah alamat jaringan; angka terakhir adalah nomor perangkat. Untuk berkomunikasi antar subnet dibutuhkan router.',
    table: [
      { dev: 'PC0', iface: 'FastEthernet0', ip: '192.168.1.10', mask: M24, gw: '-' },
      { dev: 'PC1', iface: 'FastEthernet0', ip: '192.168.1.11', mask: M24, gw: '-' },
      { dev: 'PC2', iface: 'FastEthernet0', ip: '192.168.2.12 lalu 192.168.1.12', mask: M24, gw: '-' }
    ],
    steps: [
      { text: 'Rakit 1 switch dan 3 PC (PC0, PC1, PC2)', hint: 'Seperti misi Star: switch di tengah, tiap PC disambung ke switch.', ok: (c) => ['PC0', 'PC1', 'PC2'].every((p) => !!byName(c.net, p)) && allEndsAttached(c.net) },
      { text: 'Atur IP PC0 dan PC1 sesuai Addressing Table', hint: 'Klik PC → Desktop → IP Configuration. Isi IP Address dan Subnet Mask.', ok: (c) => ipIs(c.net, 'PC0', '192.168.1.10') && ipIs(c.net, 'PC1', '192.168.1.11') },
      { text: 'Dari Command Prompt PC0, ketik ping 192.168.1.11', hint: 'Klik PC0 → Desktop → Command Prompt. Balasan Reply berarti berhasil.', ok: (c) => pduHas(c, (p) => p.cmd === 'ping' && p.ok && p.dstIp === '192.168.1.11') },
      { text: 'Atur IP PC2: 192.168.2.12, mask 255.255.255.0', hint: 'Sengaja beda subnet (192.168.2).', ok: (c) => ipIs(c.net, 'PC2', '192.168.2.12') },
      { text: 'Ping 192.168.2.12 dari PC0: hasilnya gagal', hint: 'Walau satu switch, beda subnet tidak bisa langsung berkomunikasi.', ok: (c) => pduHas(c, (p) => !p.ok && p.dstIp === '192.168.2.12') },
      { text: 'Perbaiki IP PC2 jadi 192.168.1.12, lalu ping lagi', hint: 'Sekarang satu subnet, ping berhasil.', ok: (c) => ipIs(c.net, 'PC2', '192.168.1.12') && pduHas(c, (p) => p.ok && p.dstIp === '192.168.1.12') }
    ]
  },
  {
    n: 10, slug: 'routing', group: 'ip', title: 'Router dan Default Gateway', ip: true,
    goal: 'Hubungkan dua subnet lewat router supaya PC di jaringan berbeda bisa saling ping.',
    lesson: 'Router punya satu IP di tiap jaringan yang ia sambungkan. PC mengirim paket ke jaringan lain melalui Default Gateway, yaitu IP router di jaringannya sendiri. Kalau gateway kosong atau salah, ping antar subnet gagal. Tracert menunjukkan paket melewati router sebagai lompatan pertama.',
    table: [
      { dev: 'Router0', iface: 'port ke Switch0', ip: '192.168.1.1', mask: M24, gw: '-' },
      { dev: 'Router0', iface: 'port ke Switch1', ip: '192.168.2.1', mask: M24, gw: '-' },
      { dev: 'PC0', iface: 'FastEthernet0', ip: '192.168.1.10', mask: M24, gw: '192.168.1.1' },
      { dev: 'PC1', iface: 'FastEthernet0', ip: '192.168.1.11', mask: M24, gw: '192.168.1.1' },
      { dev: 'PC2', iface: 'FastEthernet0', ip: '192.168.2.10', mask: M24, gw: '192.168.2.1' },
      { dev: 'PC3', iface: 'FastEthernet0', ip: '192.168.2.11', mask: M24, gw: '192.168.2.1' }
    ],
    steps: [
      { text: 'Rakit Router0, Switch0 (PC0, PC1), dan Switch1 (PC2, PC3)', hint: 'Network Devices → Router 1941. PC0 dan PC1 ke Switch0, PC2 dan PC3 ke Switch1.', ok: (c) => !!byName(c.net, 'Router0') && attached(c.net, 'PC0', 'Switch0') && attached(c.net, 'PC1', 'Switch0') && attached(c.net, 'PC2', 'Switch1') && attached(c.net, 'PC3', 'Switch1') },
      { text: 'Sambungkan Router0 ke Switch0 dan ke Switch1', hint: 'Kabel Automatic. Router 1941 punya dua port: Gig0/0 dan Gig0/1.', ok: (c) => attached(c.net, 'Router0', 'Switch0') && attached(c.net, 'Router0', 'Switch1') },
      { text: 'Atur IP kedua port Router0 sesuai Addressing Table', hint: 'Klik Router0 → Config. Isi IP port yang ke Switch0 dan port yang ke Switch1.', ok: (c) => routerIpTo(c.net, 'Switch0')?.ip === '192.168.1.1' && routerIpTo(c.net, 'Switch0')?.mask === M24 && routerIpTo(c.net, 'Switch1')?.ip === '192.168.2.1' && routerIpTo(c.net, 'Switch1')?.mask === M24 },
      { text: 'Atur IP dan Default Gateway keempat PC', hint: 'Desktop → IP Configuration. Gateway = IP router di jaringan PC itu.', ok: (c) => ipIs(c.net, 'PC0', '192.168.1.10', '192.168.1.1') && ipIs(c.net, 'PC1', '192.168.1.11', '192.168.1.1') && ipIs(c.net, 'PC2', '192.168.2.10', '192.168.2.1') && ipIs(c.net, 'PC3', '192.168.2.11', '192.168.2.1') },
      { text: 'Dari PC0, ping 192.168.2.10 (PC2 di subnet lain)', hint: 'Command Prompt PC0: ping 192.168.2.10.', ok: (c) => pduHas(c, (p) => p.ok && p.dstIp === '192.168.2.10') },
      { text: 'Dari PC0, jalankan tracert 192.168.2.10', hint: 'Lompatan 1 adalah router (192.168.1.1), lompatan 2 adalah PC2.', ok: (c) => pduHas(c, (p) => p.cmd === 'tracert' && p.ok && (p.hops?.length ?? 0) >= 2) }
    ]
  },
  {
    n: 11, slug: 'troubleshoot', group: 'proyek', title: 'Troubleshooting Jaringan', ip: true, start: brokenOffice,
    goal: 'Jaringan kantor ini sudah dirakit tetapi ada empat kesalahan. Temukan dan perbaiki.',
    lesson: 'Troubleshooting dimulai dari lapisan bawah: kabel dan lampu port (Layer 1), lalu status port, lalu alamat IP dan Default Gateway (Layer 3). Bandingkan selalu dengan Addressing Table, dan uji tiap perbaikan dengan ping.',
    table: [
      { dev: 'Router0', iface: 'Gig0/0', ip: '192.168.1.1', mask: M24, gw: '-' },
      { dev: 'Router0', iface: 'Gig0/1', ip: '192.168.2.1', mask: M24, gw: '-' },
      { dev: 'PC0', iface: 'FastEthernet0', ip: '192.168.1.10', mask: M24, gw: '192.168.1.1' },
      { dev: 'PC1', iface: 'FastEthernet0', ip: '192.168.1.11', mask: M24, gw: '192.168.1.1' },
      { dev: 'PC2', iface: 'FastEthernet0', ip: '192.168.1.12', mask: M24, gw: '192.168.1.1' },
      { dev: 'PC3', iface: 'FastEthernet0', ip: '192.168.2.10', mask: M24, gw: '192.168.2.1' },
      { dev: 'PC4', iface: 'FastEthernet0', ip: '192.168.2.11', mask: M24, gw: '192.168.2.1' }
    ],
    steps: [
      { text: 'Uji dulu: kirim Simple PDU dari PC0 ke PC1', hint: 'Hasilnya Failed. Lihat lampu kabel PC1.', ok: pingFailed },
      { text: 'Perbaiki kabel PC1 yang salah jenis', hint: 'Lampunya merah karena PC ke switch tidak boleh cross-over. Hapus kabelnya, pasang Straight-Through atau Automatic.', ok: (c) => attached(c.net, 'PC1', 'Switch0') },
      { text: 'Nyalakan lagi port Switch0 yang ke PC2', hint: 'Klik Switch0 → Config → Port Status FastEthernet0/4.', ok: (c) => attached(c.net, 'PC2', 'Switch0') },
      { text: 'Lengkapi Default Gateway PC3', hint: 'Cocokkan dengan Addressing Table. Tanpa gateway, PC3 tidak bisa membalas ke subnet lain.', ok: (c) => byName(c.net, 'PC3')?.gw === '192.168.2.1' },
      { text: 'Perbaiki IP dan gateway PC4', hint: 'PC4 tersambung ke Switch1 (subnet 192.168.2), tetapi IP-nya masih 192.168.1.13.', ok: (c) => ipIs(c.net, 'PC4', '192.168.2.11', '192.168.2.1') },
      { text: 'Buktikan: dari PC0, ping 192.168.2.11 berhasil', hint: 'Command Prompt PC0 atau Add Simple PDU ke PC4.', ok: (c) => pduHas(c, (p) => p.ok && p.dstIp === '192.168.2.11') }
    ]
  },
  {
    n: 12, slug: 'kantor', group: 'proyek', title: 'Proyek Akhir: Jaringan Kantor', ip: true,
    goal: 'Rancang jaringan kantor dua lantai: tiap lantai satu subnet, disatukan oleh satu router.',
    lesson: 'Kamu baru saja merancang jaringan kantor kecil: topologi star per lantai, kabel yang benar, satu subnet per lantai, dan router sebagai gerbang antar lantai. Pola ini dipakai di banyak kantor dan sekolah.',
    table: [
      { dev: 'Router0', iface: 'Gig0/0 (Lantai 1)', ip: '192.168.10.1', mask: M24, gw: '-' },
      { dev: 'Router0', iface: 'Gig0/1 (Lantai 2)', ip: '192.168.20.1', mask: M24, gw: '-' },
      { dev: 'PC Lantai 1', iface: 'FastEthernet0', ip: '192.168.10.2 s.d. .254 (bebas, unik)', mask: M24, gw: '192.168.10.1' },
      { dev: 'PC Lantai 2', iface: 'FastEthernet0', ip: '192.168.20.2 s.d. .254 (bebas, unik)', mask: M24, gw: '192.168.20.1' }
    ],
    steps: [
      { text: 'Taruh 1 router dan 2 switch, sambung router ke kedua switch', hint: 'Port Gig0/0 untuk switch Lantai 1, Gig0/1 untuk switch Lantai 2 (port dipilih berurutan).', ok: (c) => routerToTwo(c.net) },
      { text: 'Pasang minimal 2 PC atau Laptop di tiap lantai', hint: 'Tiap switch minimal dua end device.', ok: (c) => { const r = c.net.devices.find((d) => d.type === 'router'); if (!r) return false; const sws = nbrs(c.net, r.id).filter((x) => dev(c.net, x)?.type === 'switch'); return sws.length >= 2 && sws.every((x) => pcsOn(c.net, x) >= 2) } },
      { text: 'Atur IP router: Gig0/0 192.168.10.1, Gig0/1 192.168.20.1', hint: 'Klik router → Config. Mask 255.255.255.0.', ok: (c) => { const r = c.net.devices.find((d) => d.type === 'router'); return r?.ips?.['Gig0/0']?.ip === '192.168.10.1' && r.ips['Gig0/0'].mask === M24 && r.ips?.['Gig0/1']?.ip === '192.168.20.1' && r.ips['Gig0/1'].mask === M24 } },
      { text: 'Beri setiap PC IP unik di subnet lantainya dan gateway yang benar', hint: 'Lantai 1: 192.168.10.x, gateway 192.168.10.1. Lantai 2: 192.168.20.x, gateway 192.168.20.1.', ok: (c) => officeIpsOk(c.net) },
      { text: 'Uji: kirim ping antar lantai sampai semua PC bisa saling terhubung', hint: 'Satu ping lintas lantai yang berhasil, dan semua PC saling terjangkau.', ok: (c) => allIpPairs(c.net) && pduHas(c, (p) => p.ok && !!p.via?.includes('router')) },
      { text: 'Jalankan tracert dari PC Lantai 1 ke PC Lantai 2', hint: 'Dua lompatan: router, lalu PC tujuan.', ok: (c) => pduHas(c, (p) => p.cmd === 'tracert' && p.ok && (p.hops?.length ?? 0) >= 2) }
    ]
  }
]

// ---------------------------------------------------------------- Kemajuan misi (per perangkat)

const key = (uid: string) => `jarecom:lab:${uid}`
/** Nomor misi yang sudah selesai. */
export function labDone(uid: string): number[] {
  try { return JSON.parse(localStorage.getItem(key(uid)) || '[]') } catch { return [] }
}
/** Tandai misi selesai. */
export function setLabDone(uid: string, n: number) {
  const s = new Set(labDone(uid)); s.add(n)
  try { localStorage.setItem(key(uid), JSON.stringify([...s].sort())) } catch { /* abaikan */ }
}
/** Misi n terbuka kalau n = 1 atau misi n-1 sudah selesai. */
export function labOpen(done: number[], n: number): boolean {
  const m = MISSIONS.find((x) => x.n === n); if (!m) return false
  const prev = MISSIONS.filter((x) => x.group === m.group && x.n < n).pop()
  return !prev || done.includes(prev.n)
}


/**
 * Alat yang ditampilkan untuk satu misi (progressive disclosure): alat baru muncul di misi yang mengajarkannya,
 * lalu tetap ada di misi sesudahnya. Kabel manual mulai misi 7, Hub dan mode Simulation mulai misi 8, Router mulai misi 10.
 * Tombol "Semua alat" di halaman misi tetap bisa membuka semuanya kapan saja.
 */
export function missionTools(n: number) {
  return { manualCables: n >= 7, hub: n >= 8, sim: n >= 8, router: n >= 10 }
}

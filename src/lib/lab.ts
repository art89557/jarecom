// Mesin Lab Topologi: perangkat, kabel, rute paket, dan enam misi (Bus sampai Hybrid).
// Semua fungsi murni (tanpa React), supaya mudah diuji di lab.test.ts.
// Lab hanya soal bentuk topologi; konfigurasi IP belum dipakai.

// ---------------------------------------------------------------- Tipe data

/** Jenis perangkat. PC dan Laptop = end device (1 port); sisanya perangkat jaringan (24 port). */
export type DevType = 'pc' | 'laptop' | 'switch' | 'hub'

/** Satu perangkat di area kerja. `off` = port yang dimatikan (Port Status off). */
export interface Dev { id: string; type: DevType; name: string; x: number; y: number; on: boolean; off: Record<string, boolean> }

/** Satu kabel. `pa`/`pb` = nama port di ujung a/b. `ready` false = lampu oranye (baru dipasang). */
export interface Link { id: string; a: string; b: string; pa: string; pb: string; ready: boolean }

/** Isi area kerja. */
export interface Net { devices: Dev[]; links: Link[] }

/** Hasil satu Simple PDU (ping). */
export interface Pdu { n: number; src: string; dst: string; ok: boolean; why?: string; path: string[] }

// ---------------------------------------------------------------- Label gaya Packet Tracer

export const LABEL: Record<DevType, string> = { pc: 'PC', laptop: 'Laptop', switch: 'Switch', hub: 'Hub' }
export const MODEL: Record<DevType, string> = { pc: 'PC-PT', laptop: 'Laptop-PT', switch: '2960-24TT', hub: 'Hub-PT' }

// ---------------------------------------------------------------- Bantuan graf

export const isEnd = (d?: Dev) => !!d && (d.type === 'pc' || d.type === 'laptop')
export const isCore = (d?: Dev) => !!d && !isEnd(d)
export const dev = (n: Net, id: string) => n.devices.find((d) => d.id === id)
export const linkOf = (n: Net, a: string, b: string) => n.links.find((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a))
export const portAt = (l: Link, id: string) => (l.a === id ? l.pa : l.pb)
export const other = (l: Link, id: string) => (l.a === id ? l.b : l.a)

/** Kabel mati: salah satu ujung dimatikan, port-nya off, atau perangkatnya hilang. */
export function linkDown(n: Net, l: Link): boolean {
  const a = dev(n, l.a), b = dev(n, l.b)
  return !a || !b || !a.on || !b.on || !!a.off[l.pa] || !!b.off[l.pb]
}
/** Kabel bisa dilewati paket: sudah hijau dan tidak mati. */
export const usable = (n: Net, l: Link) => l.ready && !linkDown(n, l)

/** Port kosong berikutnya, atau null kalau penuh. End device hanya punya FastEthernet0. */
export function freePort(n: Net, d: Dev): string | null {
  const used = n.links.filter((l) => l.a === d.id || l.b === d.id).map((l) => portAt(l, d.id))
  if (isEnd(d)) return used.length ? null : 'Fa0'
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
  if (path) return { n: num, src: A, dst: B, ok: true, path }
  const src = dev(n, from)
  const own = n.links.find((l) => l.a === from || l.b === from)
  let why = `Tidak ada jalur kabel aktif dari ${A} ke ${B}.`
  if (src && !src.on) why = `${A} sedang mati.`
  else if (!own) why = `${A} belum tersambung kabel.`
  else if (!own.ready) why = `Kabel ${A} masih oranye. Tunggu sampai hijau.`
  else if (linkDown(n, own)) why = `Port ${A} mati atau perangkat di ujung kabelnya mati.`
  return { n: num, src: A, dst: B, ok: false, why, path: [] }
}

// ---------------------------------------------------------------- Pengecekan bentuk topologi

const cores = (n: Net) => n.devices.filter((d) => d.type === 'switch' || d.type === 'hub')
const ends = (n: Net) => n.devices.filter(isEnd)
/** Kabel antar perangkat jaringan yang bisa dipakai. */
const coreLinks = (n: Net) => n.links.filter((l) => usable(n, l) && isCore(dev(n, l.a)) && isCore(dev(n, l.b)))
/** Jumlah PC aktif yang menggantung di perangkat jaringan `id`. */
const pcsOn = (n: Net, id: string) => nbrs(n, id).filter((x) => isEnd(dev(n, x))).length
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
/** Ada dua PC yang bisa saling ping saat ini. */
function anyPair(n: Net): boolean {
  const e = ends(n)
  for (let i = 0; i < e.length; i++) for (let j = i + 1; j < e.length; j++) if (route(n, e[i].id, e[j].id)) return true
  return false
}
/** Ada PC yang sudah tidak punya kabel aktif (terputus). */
const someEndCut = (n: Net) => ends(n).some((e) => nbrs(n, e.id).length === 0)

// ---------------------------------------------------------------- Misi

/** Konteks pengecekan langkah: jaringan sekarang dan PDU yang dikirim sejak langkah ini aktif. */
export interface Ctx { net: Net; pdus: Pdu[] }

/** Satu langkah misi. `ok` true = langkah selesai. */
export interface Step { text: string; hint: string; ok: (c: Ctx) => boolean }

/** Satu misi lab. */
export interface Mission { n: number; slug: string; title: string; goal: string; lesson: string; steps: Step[] }

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

export const MISSIONS: Mission[] = [
  {
    n: 1, slug: 'bus', title: 'Topologi Bus',
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
    n: 2, slug: 'star', title: 'Topologi Star',
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
    n: 3, slug: 'ring', title: 'Topologi Ring',
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
    n: 4, slug: 'mesh', title: 'Topologi Mesh',
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
    n: 5, slug: 'tree', title: 'Topologi Tree',
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
    n: 6, slug: 'hybrid', title: 'Topologi Hybrid',
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
export const labOpen = (done: number[], n: number) => n === 1 || done.includes(n - 1)

/** Langkah aktif: langkah pertama yang belum terpenuhi (`pdus` dihitung per langkah oleh pemanggil). */
export const anyPairOk = anyPair

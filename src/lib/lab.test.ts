// Uji mesin Lab Topologi: rute paket dan pengecekan langkah tiap misi.
import { describe, expect, it } from 'vitest'
import { MISSIONS, freePort, ipPing, labOpen, missionTools, ping, route, validMask, type Dev, type DevType, type Link, type Net } from './lab'

let k = 0
const d = (type: DevType, id: string): Dev => ({ id, type, name: id, x: 0, y: 0, on: true, off: {} })
/** Sambung a–b dengan port kosong berikutnya, kabel langsung hijau. */
function wire(n: Net, a: string, b: string) {
  const A = n.devices.find((x) => x.id === a)!, B = n.devices.find((x) => x.id === b)!
  const l: Link = { id: `l${k++}`, a, b, pa: freePort(n, A)!, pb: freePort(n, B)!, ready: true }
  n.links.push(l)
}
const step = (m: number, i: number, net: Net, pdus = [] as ReturnType<typeof ping>[]) => MISSIONS[m - 1].steps[i].ok({ net, pdus })

describe('lab: rute', () => {
  it('star: ping antar PC lewat switch', () => {
    const n: Net = { devices: [d('switch', 'S'), d('pc', 'A'), d('pc', 'B')], links: [] }
    wire(n, 'A', 'S'); wire(n, 'B', 'S')
    expect(route(n, 'A', 'B')).toEqual(['A', 'S', 'B'])
    n.devices[0].on = false
    expect(ping(n, 'A', 'B', 1).ok).toBe(false)
  })
  it('PC tidak boleh jadi jalan lewat', () => {
    const n: Net = { devices: [d('pc', 'A'), d('pc', 'B'), d('pc', 'C')], links: [] }
    n.links.push({ id: 'x', a: 'A', b: 'B', pa: 'Fa0', pb: 'Fa0', ready: true })
    expect(route(n, 'A', 'C')).toBeNull()
  })
  it('kabel oranye belum bisa dilewati', () => {
    const n: Net = { devices: [d('switch', 'S'), d('pc', 'A'), d('pc', 'B')], links: [] }
    wire(n, 'A', 'S'); wire(n, 'B', 'S'); n.links[1].ready = false
    expect(ping(n, 'A', 'B', 1).ok).toBe(false)
  })
})

describe('lab: misi', () => {
  it('ring: bentuk lingkaran, putus satu kabel tetap tersambung', () => {
    const n: Net = { devices: ['0', '1', '2', '3'].map((i) => d('switch', 'S' + i)), links: [] }
    wire(n, 'S0', 'S1'); wire(n, 'S1', 'S2'); wire(n, 'S2', 'S3')
    expect(step(3, 1, n)).toBe(false)
    wire(n, 'S3', 'S0')
    expect(step(3, 1, n)).toBe(true)
    n.links.pop()
    expect(step(3, 4, n)).toBe(true)
  })
  it('bus: deret switch, lingkaran bukan bus', () => {
    const n: Net = { devices: ['0', '1', '2'].map((i) => d('switch', 'S' + i)), links: [] }
    wire(n, 'S0', 'S1'); wire(n, 'S1', 'S2')
    expect(step(1, 1, n)).toBe(true)
    wire(n, 'S2', 'S0')
    expect(step(1, 1, n)).toBe(false)
  })
  it('mesh: butuh 6 kabel untuk 4 switch', () => {
    const n: Net = { devices: ['0', '1', '2', '3'].map((i) => d('switch', 'S' + i)), links: [] }
    const ids = ['S0', 'S1', 'S2', 'S3']
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) wire(n, ids[i], ids[j])
    expect(step(4, 1, n)).toBe(true)
    n.links.splice(0, 2)
    expect(step(4, 4, n)).toBe(true)
  })
  it('star: putus satu PC lalu ping berhasil antar PC lain', () => {
    const n: Net = { devices: [d('switch', 'S'), ...['A', 'B', 'C', 'D'].map((i) => d('pc', i))], links: [] }
    ;['A', 'B', 'C', 'D'].forEach((i) => wire(n, i, 'S'))
    expect(step(2, 2, n)).toBe(true)
    n.devices[1].off = { Fa0: true }
    expect(step(2, 4, n)).toBe(true)
    expect(step(2, 5, n, [ping(n, 'B', 'C', 1)])).toBe(true)
  })
})

describe('lab: IP dan routing', () => {
  const pc = (id: string, ip: string, gw = ''): Dev => ({ ...d('pc', id), ip, mask: '255.255.255.0', gw })
  function office(): Net {
    const n: Net = { devices: [{ ...d('router', 'R'), ips: { 'Gig0/0': { ip: '192.168.1.1', mask: '255.255.255.0' }, 'Gig0/1': { ip: '192.168.2.1', mask: '255.255.255.0' } } }, d('switch', 'S0'), d('switch', 'S1'), pc('A', '192.168.1.10', '192.168.1.1'), pc('B', '192.168.2.10', '192.168.2.1')], links: [] }
    wire(n, 'R', 'S0'); wire(n, 'R', 'S1'); wire(n, 'A', 'S0'); wire(n, 'B', 'S1')
    return n
  }
  it('satu subnet: ping berhasil; beda subnet tanpa router gagal', () => {
    const n: Net = { devices: [d('switch', 'S'), pc('A', '192.168.1.10'), pc('B', '192.168.1.11'), pc('C', '192.168.2.12')], links: [] }
    ;['A', 'B', 'C'].forEach((x) => wire(n, x, 'S'))
    expect(ipPing(n, 'A', '192.168.1.11').ok).toBe(true)
    expect(ipPing(n, 'A', '192.168.2.12').ok).toBe(false)
  })
  it('lewat router: butuh gateway di kedua sisi', () => {
    const n = office()
    expect(ipPing(n, 'A', '192.168.2.10')).toMatchObject({ ok: true, hops: ['192.168.1.1', '192.168.2.10'] })
    n.devices[4].gw = ''
    expect(ipPing(n, 'A', '192.168.2.10').why).toContain('tidak bisa membalas')
  })
  it('kabel salah jenis membuat port mati', () => {
    const n = office(); n.links[2].kind = 'cross'
    expect(ipPing(n, 'A', '192.168.2.10').ok).toBe(false)
    n.links[2].kind = 'straight'
    expect(ipPing(n, 'A', '192.168.2.10').ok).toBe(true)
  })
  it('mask harus berurutan', () => {
    expect(validMask('255.255.255.0')).toBe(true)
    expect(validMask('255.0.255.0')).toBe(false)
  })
  it('misi troubleshooting: jaringan awal gagal, setelah 4 perbaikan berhasil', () => {
    const m = MISSIONS.find((x) => x.slug === 'troubleshoot')!
    const n = m.start!()
    const pc0 = n.devices.find((x) => x.name === 'PC0')!
    expect(ipPing(n, pc0.id, '192.168.2.11').ok).toBe(false)
    n.links.find((l) => l.a === 'PC1')!.kind = 'straight'
    n.devices.find((x) => x.name === 'Switch0')!.off = {}
    n.devices.find((x) => x.name === 'PC3')!.gw = '192.168.2.1'
    Object.assign(n.devices.find((x) => x.name === 'PC4')!, { ip: '192.168.2.11', gw: '192.168.2.1' })
    expect(ipPing(n, pc0.id, '192.168.2.11').ok).toBe(true)
    expect(m.steps.slice(1, 5).every((s) => s.ok({ net: n, pdus: [] }))).toBe(true)
  })
  it('misi terbuka per kelompok', () => {
    expect(labOpen([], 7)).toBe(true)
    expect(labOpen([], 8)).toBe(false)
    expect(labOpen([7], 8)).toBe(true)
    expect(labOpen([], 11)).toBe(true)
  })
})

describe('lab: proyek kantor', () => {
  it('dua lantai, IP dan gateway benar: langkah 1-5 terpenuhi', () => {
    const m = MISSIONS.find((x) => x.slug === 'kantor')!
    const M = '255.255.255.0'
    const n: Net = { devices: [{ ...d('router', 'R'), ips: { 'Gig0/0': { ip: '192.168.10.1', mask: M }, 'Gig0/1': { ip: '192.168.20.1', mask: M } } }, d('switch', 'S0'), d('switch', 'S1')], links: [] }
    wire(n, 'R', 'S0'); wire(n, 'R', 'S1')
    ;[['A', 10, 11], ['B', 10, 12], ['C', 20, 11], ['D', 20, 12]].forEach(([id, f, h]) => {
      n.devices.push({ ...d('pc', id as string), ip: `192.168.${f}.${h}`, mask: M, gw: `192.168.${f}.1` })
      wire(n, id as string, f === 10 ? 'S0' : 'S1')
    })
    const ok = ping(n, 'A', 'C', 1)
    expect(m.steps.slice(0, 4).every((s) => s.ok({ net: n, pdus: [] }))).toBe(true)
    expect(m.steps[4].ok({ net: n, pdus: [{ ...ok, via: ['switch', 'router', 'switch'] }] })).toBe(true)
    n.devices[5].ip = '192.168.10.11' // IP kembar
    expect(m.steps[3].ok({ net: n, pdus: [] })).toBe(false)
  })
})

describe('missionTools (progressive disclosure)', () => {
  it('alat muncul di misi yang mengajarkannya lalu tetap ada', () => {
    expect(missionTools(1)).toEqual({ manualCables: false, hub: false, sim: false, router: false })
    expect(missionTools(7)).toEqual({ manualCables: true, hub: false, sim: false, router: false })
    expect(missionTools(8)).toEqual({ manualCables: true, hub: true, sim: true, router: false })
    expect(missionTools(12)).toEqual({ manualCables: true, hub: true, sim: true, router: true })
  })
})

// Uji mesin Lab Topologi: rute paket dan pengecekan langkah tiap misi.
import { describe, expect, it } from 'vitest'
import { MISSIONS, freePort, ping, route, type Dev, type DevType, type Link, type Net } from './lab'

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

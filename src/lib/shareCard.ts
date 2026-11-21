import { levelLabel, type Progress } from './engine'

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)

async function dataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(r.error)
    r.readAsDataURL(blob)
  })
}

/** Kartu pencapaian sebagai gambar PNG, dibuat di perangkat (tanpa server). */
export async function buildCard(name: string, p: Progress): Promise<Blob> {
  const W = 900, H = 520
  let netty = ''
  try { netty = await dataUrl('/netty/rayakan.svg') } catch { /* kartu tetap jadi tanpa Netty */ }
  const stats: [string, string][] = [[String(p.xp), 'XP'], [String(p.passed.length), 'Lencana'], [String(p.perfect.length), 'Emas'], [`${p.passed.length}/11`, 'Lulus']]
  const tiles = stats.map(([v, l], i) => `<rect x="${60 + i * 195}" y="330" width="180" height="104" rx="20" fill="#fff" fill-opacity=".16"/><text x="${150 + i * 195}" y="385" text-anchor="middle" font-size="44" font-weight="700" fill="#fff">${esc(v)}</text><text x="${150 + i * 195}" y="418" text-anchor="middle" font-size="22" fill="#fff">${l}</text>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Space Grotesk, Inter, Arial, sans-serif"><rect width="${W}" height="${H}" rx="40" fill="#2457F5"/>`
    + (netty ? `<image href="${netty}" x="60" y="40" width="220" height="200"/>` : '')
    + `<text x="310" y="110" font-size="24" font-weight="700" fill="#fff" fill-opacity=".9" letter-spacing="2">KARTU PENCAPAIAN</text><text x="310" y="180" font-size="58" font-weight="700" fill="#fff">${esc(name.slice(0, 18))}</text><text x="310" y="228" font-size="32" fill="#fff">Level ${levelLabel(p)} · Belajar Jaringan Komputer</text>`
    + tiles + `<text x="60" y="488" font-size="26" font-weight="700" fill="#fff">Jar’ecom</text></svg>`
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  await img.decode()
  const c = document.createElement('canvas')
  c.width = W * 2; c.height = H * 2
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Gagal membuat gambar'))), 'image/png'))
}

/** Bagikan lewat Web Share bila didukung; jika tidak, unduh gambarnya. Mengembalikan cara yang dipakai. */
export async function shareCard(name: string, p: Progress): Promise<'dibagikan' | 'diunduh' | 'batal'> {
  const blob = await buildCard(name, p)
  const file = new File([blob], 'kartu-jarecom.png', { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: 'Pencapaianku di Jar’ecom' }); return 'dibagikan' } catch (e) { if ((e as Error).name === 'AbortError') return 'batal' }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'kartu-jarecom.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  return 'diunduh'
}

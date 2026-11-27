// Penjaga terakhir: kalau ada error saat menampilkan halaman, tampilkan pesan dan jalan kembali, bukan layar putih.
import { Component, type ReactNode } from 'react'
import { Netty } from './Netty'

interface State { err: boolean }

/** Menangkap error render di bawahnya. Progres tidak hilang karena tersimpan di server atau perangkat. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { err: false }
  static getDerivedStateFromError(): State { return { err: true } }
  componentDidCatch(e: unknown) { console.error('Jar’ecom error:', e) }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <main role="alert" className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 p-8 text-center">
        <Netty pose="khawatir" size={140} />
        <h1 className="text-2xl font-bold">Ada yang tidak beres</h1>
        <p className="help text-[15px]">Progresmu aman. Muat ulang untuk melanjutkan; kalau terulang, coba buka dari Beranda.</p>
        <button type="button" className="btn" onClick={() => location.reload()}>Muat ulang</button>
        <a href="/beranda" className="link min-h-[44px] leading-[44px]">Ke Beranda</a>
      </main>
    )
  }
}

// Daftar rute aplikasi. Halaman publik (login, daftar) di atas; halaman yang butuh login di dalam <Protected />.
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import Shell from './components/Shell'
import { Netty } from './components/ui'
import { Forgot, Login, NewPassword, Register, Splash } from './pages/Auth'
import Help from './pages/Help'
import Credit from './pages/Credit'
import Home from './pages/Home'
import MapPage from './pages/MapPage'
import Material, { Done } from './pages/Material'
import Profile from './pages/Profile'
import ProgressPage from './pages/Progress'
import { QuizList, QuizPlay, QuizResultPage } from './pages/Quiz'
import { useApp } from './state'
import { useEffect, useState } from 'react'

/** Penjaga rute: tunggu sesi diperiksa, lalu tampilkan Shell (menu + halaman) atau arahkan ke /masuk. */
function Protected() {
  const { ready, user } = useApp()
  if (!ready) return <div className="p-10 text-center help">Memuat…</div>
  return user ? <Shell /> : <Navigate to="/masuk" replace />
}

/** Banner di atas layar saat perangkat offline. Hilang sendiri saat kembali online. */
function Offline() {
  // Awalnya ikut status jaringan; lalu mengikuti peristiwa offline/online dari browser.
  const [off, setOff] = useState(!navigator.onLine)
  useEffect(() => {
    const a = () => setOff(true), b = () => setOff(false)
    window.addEventListener('offline', a); window.addEventListener('online', b)
    return () => { window.removeEventListener('offline', a); window.removeEventListener('online', b) }
  }, [])
  if (!off) return null
  return <div role="status" className="fixed inset-x-0 top-0 z-40 flex items-center justify-center gap-2 bg-ink px-4 py-2 text-sm font-medium text-white"><Netty pose="offline" size={32} />Kamu sedang offline. Progres baru tersimpan saat online.</div>
}

/** Halaman untuk alamat yang tidak dikenal. */
function NotFound() {
  return <div className="mx-auto flex max-w-sm flex-col items-center gap-4 p-10 text-center"><Netty pose="sedih" size={140} label="Netty sedih" /><h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1><Link to="/" className="btn">Ke beranda</Link></div>
}

/** Susunan rute. Alamat dalam bahasa Indonesia: /materi, /kuis, /progres, dan seterusnya. */
export default function App() {
  return (
    <>
      <Offline />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/masuk" element={<Login />} />
        <Route path="/daftar" element={<Register />} />
        <Route path="/lupa" element={<Forgot />} />
        <Route path="/sandi-baru" element={<NewPassword />} />
        <Route element={<Protected />}>
          <Route path="/beranda" element={<Home />} />
          <Route path="/materi" element={<MapPage />} />
          <Route path="/materi/:n" element={<Material />} />
          <Route path="/materi/:n/selesai" element={<Done />} />
          <Route path="/kuis" element={<QuizList />} />
          <Route path="/kuis/:n" element={<QuizPlay />} />
          <Route path="/kuis/:n/hasil" element={<QuizResultPage />} />
          <Route path="/progres" element={<ProgressPage tab="ringkasan" />} />
          <Route path="/progres/lencana" element={<ProgressPage tab="lencana" />} />
          <Route path="/progres/riwayat" element={<ProgressPage tab="riwayat" />} />
          <Route path="/kredit" element={<Credit />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/bantuan" element={<Help />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

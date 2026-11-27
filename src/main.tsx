// Titik masuk aplikasi: memasang React ke #root dengan router dan penyedia state.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { AppProvider } from './state'
import './index.css'
import { applyReduce, applyTextSize, applyTheme, reduceOn, textSize, theme, watchSystemTheme } from './lib/prefs'

// Terapkan pilihan "kurangi animasi", ukuran teks, dan tema sebelum halaman tampil.
applyReduce(reduceOn())
applyTextSize(textSize())
applyTheme(theme())
watchSystemTheme()

// Daftarkan service worker (PWA): aset disimpan di perangkat dan diperbarui otomatis.
registerSW({ immediate: true })

// Urutan pembungkus: StrictMode > BrowserRouter (rute) > AppProvider (user dan progres) > App.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
)

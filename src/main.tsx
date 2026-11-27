// Titik masuk aplikasi: memasang React ke #root dengan router dan penyedia state.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
// Font di-host sendiri (bukan Google Fonts): tidak memblokir tampilan pertama, ikut tersimpan untuk offline, dan aman untuk CSP.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-700.css'
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

// Urutan pembungkus: StrictMode > BrowserRouter (rute) > AppProvider (user dan progres) > ErrorBoundary > App.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
)

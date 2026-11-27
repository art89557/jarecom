import { defineConfig } from 'vitest/config'
import { loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Saat memakai Supabase, kunci jawaban dan penjelasan soal KUIS dibuang dari isi level yang ikut ke aplikasi:
// skor dihitung server dari tabel quiz_questions, jadi klien tidak perlu (dan tidak boleh) tahu jawabannya.
// Soal cek pemahaman di materi tetap utuh karena hanya latihan tanpa XP. Mode lokal (tanpa Supabase) tidak diubah.
function stripQuizKeys(on: boolean): Plugin {
  return {
    name: 'jarecom-strip-quiz-keys',
    enforce: 'pre',
    transform(code, id) {
      if (!on || !/src[\\/]content[\\/]level-\d+\.json$/.test(id)) return null
      const lv = JSON.parse(code)
      lv.kuis = lv.kuis.map((q: { pertanyaan: string; opsi: string[] }) => ({ pertanyaan: q.pertanyaan, opsi: q.opsi, benar: -1, penjelasan: '' }))
      return { code: JSON.stringify(lv), map: null }
    }
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    stripQuizKeys(!!loadEnv(mode, '.', 'VITE_').VITE_SUPABASE_URL),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['netty/*.svg', 'logo.svg', 'sfx/*.wav'],
      manifest: {
        name: "Jar'ecom",
        short_name: "Jar'ecom",
        description: 'Belajar Jaringan Komputer level demi level',
        lang: 'id',
        theme_color: '#2457F5',
        background_color: '#F4F6FA',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: { navigateFallback: '/index.html', globPatterns: ['**/*.{js,css,html,svg,png,wav,mp3,woff2}'] }
    })
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
}))

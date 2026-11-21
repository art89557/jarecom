import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
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
      workbox: { navigateFallback: '/index.html', globPatterns: ['**/*.{js,css,html,svg,png,wav}'] }
    })
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
})

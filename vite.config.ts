import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,otf,ttf,woff,woff2,jpg,jpeg,json}'],
          maximumFileSizeToCacheInBytes: 30000000 // 30MB로 캐싱 한도 상향 (큰 이미지, 폰트용)
        },
        manifest: {
          name: '툰스쿨',
          short_name: 'ToonSchool',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#ff2778',
          icons: [
            {
              src: '/favicon.svg',
              type: 'image/svg+xml',
              sizes: 'any'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    }
  }
})

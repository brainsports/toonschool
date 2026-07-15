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
        // 수동 등록(src/app/pwa/registerAutoUpdate.ts)으로 전환:
        // 새 SW 활성화 후 자동 새로고침 + 무한 새로고침 방지를 직접 제어하기 위함.
        injectRegister: null,
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,otf,ttf,woff,woff2,jpg,jpeg,json}'],
          maximumFileSizeToCacheInBytes: 30000000, // 30MB로 캐싱 한도 상향 (큰 이미지, 폰트용)
          // 새 배포 즉시 반영: 대기 없이 새 SW 활성화 + 모든 탭 제어 + 구 프리캐시 삭제.
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
        },
        manifest: {
          name: '툰스쿨',
          short_name: 'ToonSchool',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#ff2778',
          icons: [
            {
              src: '/favicon.svg',
              type: 'image/svg+xml',
              sizes: 'any'
            },
            {
              src: '/icons/icon-192x192.png',
              type: 'image/png',
              sizes: '192x192',
              purpose: 'any maskable'
            },
            {
              src: '/icons/icon-512x512.png',
              type: 'image/png',
              sizes: '512x512',
              purpose: 'any maskable'
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

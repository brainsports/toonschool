import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/fonts.css'
import './styles/global.css'
import App from './app/App'
import { registerPwaAutoUpdate } from './app/pwa/registerAutoUpdate'

// 새 배포 감지 → 서비스워커 즉시 활성화 → 1회 자동 새로고침(구 버전 캐시 제거).
// 프로덕션에서만 동작(dev 서버는 미실행).
registerPwaAutoUpdate()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

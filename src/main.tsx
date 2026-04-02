import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 始终注销旧版 Service Worker 并清缓存，避免一直停留在「深色 + 手写输入」的旧界面
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister())
  })
}
if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((k) => caches.delete(k))
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

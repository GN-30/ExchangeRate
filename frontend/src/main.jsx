import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import App from './App.jsx'


// vite-plugin-pwa auto-generated SW registration with update handling
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    // New content available — could show a toast here if desired
    console.log('[PWA] New content available, will refresh on next load.');
  },
  onOfflineReady() {
    console.log('[PWA] App is ready to work offline.');
  },
  onRegistered(r) {
    console.log('[PWA] Service worker registered:', r);
  },
  onRegisterError(error) {
    console.error('[PWA] Service worker registration error:', error);
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

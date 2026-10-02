import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')!
const app = <StrictMode><App pathname={window.location.pathname} /></StrictMode>
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)

// Production only: avoid caching Vite development modules or hot updates.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .catch(error => console.warn('Asset caching unavailable:', error))
  }, { once: true })
}

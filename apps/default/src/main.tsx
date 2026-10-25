import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './utils/registerServiceWorker'

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  registerServiceWorker().then((registration) => {
    if (registration) {
      console.log('✅ PWA enabled - App can be installed');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

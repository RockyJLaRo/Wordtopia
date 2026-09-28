import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initGlobalHapticFeedback } from './utils/haptics';
import { registerSW } from 'virtual:pwa-register';

initGlobalHapticFeedback();

// Register service worker with automatic cache updates and offline readiness
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] New content available, updating service worker...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] Wordtopia is ready for offline play! All assets & vocabulary cached.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

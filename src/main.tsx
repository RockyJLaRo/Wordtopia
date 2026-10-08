import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initGlobalHapticFeedback } from './utils/haptics';
import { initServiceWorker } from './services/pwaUpdate';
import { logApplicationError } from './services/telemetry';
import { isChunkLoadError } from './utils/lazyWithRetry';

initGlobalHapticFeedback();

// Errors outside React's render tree (timers, promises, event handlers) are logged instead of
// silently disappearing. Chunk download failures are connectivity issues, not bugs.
window.addEventListener('unhandledrejection', (event) => {
  if (!isChunkLoadError(event.reason)) {
    logApplicationError(event.reason instanceof Error ? event.reason : String(event.reason), 'unhandledrejection');
  }
});
window.addEventListener('error', (event) => {
  if (event.error && !isChunkLoadError(event.error)) logApplicationError(event.error, 'window.onerror');
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Register the service worker after the first render so it never competes with startup work.
initServiceWorker();

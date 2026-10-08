import { registerSW } from 'virtual:pwa-register';

/**
 * Service-worker updates are applied only at a safe moment: when the player is on a menu
 * screen (otherwise the waiting worker simply activates on the next launch). Previously a new
 * deploy reloaded the page immediately, which could wipe out a game a child was in the middle of.
 */
let applyUpdate: ((reloadPage?: boolean) => Promise<void>) | null = null;
let updatePending = false;

const SAFE_PATHS = new Set(['/', '/games', '/study', '/progress', '/settings', '/shop', '/wordrobe']);

export function applyPendingUpdateIfSafe(pathname: string) {
  if (updatePending && applyUpdate && SAFE_PATHS.has(pathname)) {
    updatePending = false;
    applyUpdate(true).catch(() => {});
  }
}

export function initServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    applyUpdate = registerSW({
      onNeedRefresh() {
        updatePending = true;
        applyPendingUpdateIfSafe(window.location.pathname);
      },
      onOfflineReady() {
        console.log('[PWA] Wordtopia is ready for offline play!');
      },
      onRegisterError(error) {
        console.warn('[PWA] Service worker registration failed:', error);
      },
    });
  } catch (err) {
    console.warn('[PWA] Service worker unavailable:', err);
  }
}

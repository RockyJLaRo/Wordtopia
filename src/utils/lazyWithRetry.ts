const RELOAD_KEY = 'wordtopia_chunk_reload_at';

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '');
  return /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|Failed to fetch/i.test(
    message
  );
}

/**
 * Wraps a dynamic import used with React.lazy.
 *
 * A failed chunk download usually means either a flaky mobile connection or that a new
 * version was deployed and the old hashed file no longer exists. Browsers cache failed
 * module imports, so retrying the same import() can't succeed; when online we reload the
 * page once (rate-limited) to pick up the current build. When offline we let the error reach
 * the ErrorBoundary, which shows a friendly "reconnect and retry" screen instead of a blank page.
 */
export function lazyWithRetry<T>(factory: () => Promise<T>): () => Promise<T> {
  return () =>
    factory().catch((error: unknown) => {
      const online = typeof navigator === 'undefined' || navigator.onLine !== false;
      if (online && isChunkLoadError(error)) {
        let lastReload = 0;
        try {
          lastReload = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
        } catch {
          // Storage blocked: fall through to a single reload attempt.
        }
        if (Date.now() - lastReload > 30_000) {
          try {
            sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          } catch {
            // ignore
          }
          window.location.reload();
          // Keep Suspense showing its fallback while the page reloads.
          return new Promise<T>(() => {});
        }
      }
      throw error;
    });
}

import type { Options } from 'canvas-confetti';
import { useSettingsStore } from '../store/useSettingsStore';

type ConfettiFn = (options?: Options) => Promise<null> | null;

let loader: Promise<ConfettiFn | null> | null = null;

// Older/low-memory phones get fewer particles so celebrations don't drop frames.
const isLowEndDevice =
  typeof navigator !== 'undefined' &&
  ((navigator.hardwareConcurrency || 8) <= 4 || ((navigator as { deviceMemory?: number }).deviceMemory || 8) <= 2);

/**
 * Fire-and-forget confetti burst. The canvas-confetti library is only downloaded the
 * first time a celebration happens, so it never delays the initial page load.
 * Honors both the in-app "Reduce Motion" setting and the OS reduced-motion preference.
 */
export function confetti(options: Options = {}): void {
  if (typeof window === 'undefined') return;
  if (useSettingsStore.getState().reduceMotion) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  if (!loader) {
    loader = import('canvas-confetti')
      .then((m) => m.default as ConfettiFn)
      .catch(() => {
        // Offline or chunk missing: skip the celebration, retry next time.
        loader = null;
        return null;
      });
  }

  const particleCount = options.particleCount ?? 50;
  loader.then((fire) => {
    try {
      fire?.({
        ...options,
        particleCount: isLowEndDevice ? Math.ceil(particleCount / 2) : particleCount,
        disableForReducedMotion: true,
      });
    } catch {
      // Celebrations are cosmetic; never let them break gameplay.
    }
  });
}

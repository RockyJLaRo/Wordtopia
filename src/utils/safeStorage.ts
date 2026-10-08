import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * localStorage access that never throws. Storage can be unavailable (Safari private mode,
 * embedded iframes with blocked site data, quota exceeded); the game must keep working
 * in memory instead of crashing to a blank screen.
 */
const memoryFallback = new Map<string, string>();

function getLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const safeLocalStorage: StateStorage = {
  getItem(name) {
    try {
      const ls = getLocalStorage();
      const value = ls ? ls.getItem(name) : null;
      return value ?? memoryFallback.get(name) ?? null;
    } catch {
      return memoryFallback.get(name) ?? null;
    }
  },
  setItem(name, value) {
    memoryFallback.set(name, value);
    try {
      getLocalStorage()?.setItem(name, value);
    } catch (err) {
      // Quota exceeded or storage blocked: keep the in-memory copy for this session.
      console.warn(`[storage] Could not save "${name}"`, err);
    }
  },
  removeItem(name) {
    memoryFallback.delete(name);
    try {
      getLocalStorage()?.removeItem(name);
    } catch {
      // ignore
    }
  },
};

/**
 * JSON storage for zustand `persist`. If a saved value is not valid JSON (corrupted by a
 * crash mid-write, manual editing, an extension...), the raw text is copied to a backup key
 * before the store falls back to defaults, so a parent/teacher can still recover it.
 */
export const createSafeJSONStorage = <S>() =>
  createJSONStorage<S>(() => ({
    getItem(name) {
      const raw = safeLocalStorage.getItem(name) as string | null;
      if (raw === null) return null;
      try {
        JSON.parse(raw);
        return raw;
      } catch {
        console.warn(`[storage] Saved data for "${name}" was corrupted; backed up and reset.`);
        safeLocalStorage.setItem(`${name}__corrupt_backup`, raw);
        safeLocalStorage.removeItem(name);
        return null;
      }
    },
    setItem: safeLocalStorage.setItem,
    removeItem: safeLocalStorage.removeItem,
  }));

// --- Small validators shared by the store migrations/merges ---

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const finiteNumber = (v: unknown, fallback: number, min = -Infinity, max = Infinity): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

export const stringArray = (v: unknown, fallback: string[] = []): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : fallback;

export const stringRecord = (v: unknown): Record<string, string> => {
  if (!isPlainObject(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string') out[k] = val;
  }
  return out;
};

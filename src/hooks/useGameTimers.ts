import { useEffect, useMemo, useRef } from 'react';

/**
 * Returns a ref that always holds the latest value. Timers created in one render must call
 * the *current* handler: calling a captured one sees stale state (e.g. `gameState` still
 * 'playing'), which silently broke auto-advance in several games.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/**
 * setTimeout wrapper whose pending timers are all cancelled when the component unmounts,
 * so leaving a game mid-animation can't award rewards, play sounds or update dead state.
 */
export function useGameTimeouts() {
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach(clearTimeout);
      active.clear();
    };
  }, []);

  return useMemo(
    () => ({
      set(fn: () => void, ms: number) {
        const id = setTimeout(() => {
          timers.current.delete(id);
          fn();
        }, ms);
        timers.current.add(id);
        return id;
      },
      clearAll() {
        timers.current.forEach(clearTimeout);
        timers.current.clear();
      },
    }),
    []
  );
}

/** True while the page is hidden (app switched away / screen locked). Used to pause countdowns. */
export const isPageHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

/**
 * Synchronous one-shot lock for answer/continue handlers. React state guards such as
 * `if (gameState !== 'playing') return` only update after a re-render, so several taps that
 * arrive before it (rapid tapping on a slow phone) were each scored, awarding coins and
 * completing games multiple times. Acquire on answer; release when the next question loads.
 */
export function useActionLock() {
  const locked = useRef(false);
  return useMemo(
    () => ({
      acquire() {
        if (locked.current) return false;
        locked.current = true;
        return true;
      },
      release() {
        locked.current = false;
      },
    }),
    []
  );
}

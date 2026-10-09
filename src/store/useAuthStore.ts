import { create } from 'zustand';
import { useProgressStore } from './useProgressStore';
import { safeLocalStorage, finiteNumber, isPlainObject, stringArray, stringRecord } from '../utils/safeStorage';

const TOKEN_KEY = 'vocab_auth_token';
const readToken = () => safeLocalStorage.getItem(TOKEN_KEY) as string | null;
const writeToken = (token: string | null) =>
  token ? safeLocalStorage.setItem(TOKEN_KEY, token) : safeLocalStorage.removeItem(TOKEN_KEY);

/** Fields mirrored to the cloud account. */
export function getSyncableProgress() {
  const p = useProgressStore.getState();
  return {
    stars: p.stars,
    coins: p.coins,
    currentStreak: p.currentStreak,
    bestStreak: p.bestStreak,
    mascotName: p.mascotName,
    mascotBaseId: p.mascotBaseId,
    mascotHealth: p.mascotHealth,
    mascotHappiness: p.mascotHappiness,
    equipped: p.equipped,
    inventory: p.inventory,
  };
}

async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export type UserRole = 'user' | 'parent' | 'teacher' | 'moderator' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot_password' | 'admin_login';

  // Actions
  setAuthModal: (open: boolean, mode?: 'login' | 'register' | 'forgot_password' | 'admin_login') => void;
  checkAuth: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; resetToken?: string; message: string }>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  deleteAccount: () => Promise<{ success: boolean; message: string }>;
  syncProgressWithCloud: () => Promise<void>;
  pushProgressToCloud: (keepalive?: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: readToken(),
  isLoading: false,
  error: null,
  isAuthModalOpen: false,
  authModalMode: 'login',

  setAuthModal: (open, mode = 'login') =>
    set({ isAuthModalOpen: open, authModalMode: mode, error: null }),

  checkAuth: async () => {
    const token = get().token || readToken();
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          set({ user: data.user });
          // Fetch synced cloud progress
          await get().syncProgressWithCloud();
        }
      } else if (res.status === 401 || res.status === 403) {
        // Only an explicit rejection signs the player out; a 5xx or proxy hiccup keeps the session.
        writeToken(null);
        set({ user: null, token: null });
      }
    } catch {
      // Offline fallback: keep guest mode
    }
  },

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.token) {
        set({ isLoading: false, error: data.error || 'Login failed.' });
        return { success: false, error: data.error };
      }

      writeToken(data.token);
      set({ user: data.user, token: data.token, isLoading: false, isAuthModalOpen: false, error: null });

      // Sync progress
      await get().syncProgressWithCloud();
      return { success: true };
    } catch (e: any) {
      set({ isLoading: false, error: e.message || 'Network error.' });
      return { success: false, error: e.message };
    }
  },

  register: async (username, email, password, role = 'user') => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.token) {
        set({ isLoading: false, error: data.error || 'Registration failed.' });
        return { success: false, error: data.error };
      }

      writeToken(data.token);
      set({ user: data.user, token: data.token, isLoading: false, isAuthModalOpen: false, error: null });

      // Immediately sync current local progress to new account (best effort; the
      // background sync retries later if this request fails)
      await get().pushProgressToCloud();

      return { success: true };
    } catch (e: any) {
      set({ isLoading: false, error: e.message || 'Network error.' });
      return { success: false, error: e.message };
    }
  },

  logout: async () => {
    const token = get().token;
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    writeToken(null);
    set({ user: null, token: null });
  },

  requestPasswordReset: async (email) => {
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await readJson(res);
      return { success: res.ok, resetToken: data.resetToken, message: data.message || data.error };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  confirmPasswordReset: async (token, newPassword) => {
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await readJson(res);
      return { success: res.ok, message: data.message || data.error };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    const token = get().token;
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await readJson(res);
      return { success: res.ok, message: data.message || data.error };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  deleteAccount: async () => {
    const token = get().token;
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(res);
      if (res.ok) {
        writeToken(null);
        set({ user: null, token: null });
        useProgressStore.getState().resetProgress();
      }
      return { success: res.ok, message: data.message || data.error };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  syncProgressWithCloud: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch('/api/progress', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();

      const p = isPlainObject(data?.progress) ? data.progress : null;
      if (p) {
        // Merge with local progress, picking highest achievements/stars. Every cloud value is
        // validated: a missing number used to turn local coins/stars into NaN.
        const local = useProgressStore.getState();
        useProgressStore.setState({
          stars: Math.max(local.stars, finiteNumber(p.stars, 0, 0)),
          coins: Math.max(local.coins, finiteNumber(p.coins, 0, 0)),
          currentStreak: Math.max(local.currentStreak, finiteNumber(p.currentStreak, 0, 0)),
          bestStreak: Math.max(local.bestStreak, finiteNumber(p.bestStreak, 0, 0)),
          mascotName: typeof p.mascotName === 'string' && p.mascotName ? p.mascotName.slice(0, 40) : local.mascotName,
          mascotBaseId: typeof p.mascotBaseId === 'string' && p.mascotBaseId ? p.mascotBaseId : local.mascotBaseId,
          mascotHealth: finiteNumber(p.mascotHealth, local.mascotHealth, 0, 100),
          mascotHappiness: finiteNumber(p.mascotHappiness, local.mascotHappiness, 0, 100),
          equipped: { ...local.equipped, ...stringRecord(p.equipped) },
          inventory: [...new Set([...local.inventory, ...stringArray(p.inventory)])],
        });
      }
    } catch {}
  },

  pushProgressToCloud: async (keepalive = false) => {
    const token = get().token;
    if (!token || !get().user) return;
    try {
      await fetch('/api/progress/sync', {
        method: 'POST',
        keepalive,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(getSyncableProgress()),
      });
    } catch {
      // Offline: the next change or app resume will try again.
    }
  },
}));

/**
 * Keeps a signed-in player's cloud copy current. Previously progress was uploaded only once,
 * at registration, so signing in on another device restored stale coins/items.
 * Uploads are debounced (one request per burst of answers) and flushed when the app is hidden.
 */
export function startCloudProgressSync() {
  if (typeof window === 'undefined') return () => {};
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  let lastSnapshot = '';

  const flush = (keepalive = false) => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!dirty) return;
    dirty = false;
    useAuthStore.getState().pushProgressToCloud(keepalive);
  };

  const unsubscribe = useProgressStore.subscribe(() => {
    if (!useAuthStore.getState().user) return;
    const snapshot = JSON.stringify(getSyncableProgress());
    if (snapshot === lastSnapshot) return;
    lastSnapshot = snapshot;
    dirty = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => flush(), 5000);
  });

  const onHide = () => {
    if (document.visibilityState === 'hidden') flush(true);
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', onHide);

  return () => {
    unsubscribe();
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', onHide);
    if (timer) clearTimeout(timer);
  };
}

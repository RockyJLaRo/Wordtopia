import { create } from 'zustand';
import { useProgressStore } from './useProgressStore';

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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('vocab_auth_token'),
  isLoading: false,
  error: null,
  isAuthModalOpen: false,
  authModalMode: 'login',

  setAuthModal: (open, mode = 'login') =>
    set({ isAuthModalOpen: open, authModalMode: mode, error: null }),

  checkAuth: async () => {
    const token = get().token || localStorage.getItem('vocab_auth_token');
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
      } else {
        localStorage.removeItem('vocab_auth_token');
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
      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.error || 'Login failed.' });
        return { success: false, error: data.error };
      }

      localStorage.setItem('vocab_auth_token', data.token);
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
      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.error || 'Registration failed.' });
        return { success: false, error: data.error };
      }

      localStorage.setItem('vocab_auth_token', data.token);
      set({ user: data.user, token: data.token, isLoading: false, isAuthModalOpen: false, error: null });

      // Immediately sync current local progress to new account
      const currentProg = useProgressStore.getState();
      await fetch('/api/progress/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({
          stars: currentProg.stars,
          coins: currentProg.coins,
          currentStreak: currentProg.currentStreak,
          bestStreak: currentProg.bestStreak,
          mascotName: currentProg.mascotName,
          mascotBaseId: currentProg.mascotBaseId,
          mascotHealth: currentProg.mascotHealth,
          mascotHappiness: currentProg.mascotHappiness,
          equipped: currentProg.equipped,
          inventory: currentProg.inventory,
        }),
      });

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
    localStorage.removeItem('vocab_auth_token');
    set({ user: null, token: null });
  },

  requestPasswordReset: async (email) => {
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
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
      const data = await res.json();
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
      const data = await res.json();
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
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem('vocab_auth_token');
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

      if (data.progress) {
        // Merge with local progress, picking highest achievements/stars
        const local = useProgressStore.getState();
        const p = data.progress;

        useProgressStore.setState({
          stars: Math.max(local.stars, p.stars),
          coins: Math.max(local.coins, p.coins),
          currentStreak: Math.max(local.currentStreak, p.currentStreak),
          bestStreak: Math.max(local.bestStreak, p.bestStreak),
          mascotName: p.mascotName || local.mascotName,
          mascotBaseId: p.mascotBaseId || local.mascotBaseId,
          mascotHealth: p.mascotHealth ?? local.mascotHealth,
          mascotHappiness: p.mascotHappiness ?? local.mascotHappiness,
          equipped: { ...local.equipped, ...p.equipped },
          inventory: [...new Set([...local.inventory, ...(p.inventory || [])])],
        });
      }
    } catch {}
  },
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameSettings, GradeLevel } from '../types';

interface SettingsState extends GameSettings {
  isAdmin: boolean;
  setAdmin: (isAdmin: boolean) => void;
  setGradeLevel: (grade: GradeLevel) => void;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  toggleReduceMotion: () => void;
  toggleHaptics: () => void;
  completeOnboarding: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      gradeLevel: '3rd Grade',
      soundEnabled: true,
      soundVolume: 0.7,
      reduceMotion: false,
      hasSeenOnboarding: false,
      hapticsEnabled: true,
      isAdmin: false,
      setGradeLevel: (grade) => set({ gradeLevel: grade }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),
      toggleReduceMotion: () => set((state) => ({ reduceMotion: !state.reduceMotion })),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      setAdmin: (isAdmin) => set({ isAdmin }),
    }),
    {
      name: 'vocab-adventure-settings',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        const state = persistedState as Partial<SettingsState>;
        return {
          ...state,
          soundEnabled: state.soundEnabled ?? true,
          soundVolume: typeof state.soundVolume === 'number' ? state.soundVolume : 0.7,
          hapticsEnabled: state.hapticsEnabled ?? true,
        } as SettingsState;
      },
    }
  )
);

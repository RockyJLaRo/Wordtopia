import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameSettings, GradeLevel } from '../types';
import { createSafeJSONStorage, finiteNumber, isPlainObject } from '../utils/safeStorage';

const GRADE_LEVELS: GradeLevel[] = [
  'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade',
  '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade', 'Custom',
];

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
      storage: createSafeJSONStorage<SettingsState>(),
      merge: (persisted, current) => {
        if (!isPlainObject(persisted)) return current;
        const p = persisted as Partial<SettingsState>;
        const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
        return {
          ...current,
          gradeLevel: GRADE_LEVELS.includes(p.gradeLevel as GradeLevel) ? (p.gradeLevel as GradeLevel) : current.gradeLevel,
          soundEnabled: bool(p.soundEnabled, current.soundEnabled),
          soundVolume: finiteNumber(p.soundVolume, current.soundVolume, 0, 1),
          reduceMotion: bool(p.reduceMotion, current.reduceMotion),
          hasSeenOnboarding: bool(p.hasSeenOnboarding, current.hasSeenOnboarding),
          hapticsEnabled: bool(p.hapticsEnabled, current.hapticsEnabled),
          isAdmin: bool(p.isAdmin, current.isAdmin),
        };
      },
      migrate: (persistedState: any, _version: number) => {
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

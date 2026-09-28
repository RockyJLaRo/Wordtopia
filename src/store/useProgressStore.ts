import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerProgress } from '../types';
import { SPRITE_ITEMS } from '../data/avatarSprites';
import { soundManager } from '../utils/soundManager';

interface ProgressState extends PlayerProgress {
  
  addCoins: (amount: number, reason?: string) => void;
  spendCoins: (amount: number, reason?: string) => boolean;
  addStars: (amount: number) => void;
  claimDailyReward: () => void;
  setMascotBase: (id: string) => void;
  setMascotName: (name: string) => void;
  unlockAvatar: (id: string) => void;
  completeStarterSelection: (id: string) => void;
  recordAnswer: (isCorrect: boolean) => void;
  incrementGamesCompleted: () => void;
  unlockAchievement: (id: string) => void;
  unlockItem: (itemId: string) => void;
  equipItem: (category: string, itemId: string) => void;
  clearEquipped: () => void;
  equipCombo: (items: string[]) => void;
  setWardrobeStyle: (style: 'all' | 'neutral' | 'girl' | 'boy') => void;
  feedMascot: (amount: number) => void;
  playWithMascot: (amount: number) => void;
  setSpeedChallengePB: (score: number) => void;
  resetProgress: () => void;
}

const initialState: PlayerProgress = {
  coins: 150,
  transactions: [],
  stars: 5,
  currentStreak: 0,
  hasChosenStarter: false,
  mascotBaseId: 'black_cat',
  unlockedAvatars: [
    'black_cat',
    'red_panda',
    'capybara',
    'turtle',
    'axolotl',
    'frog',
    'dinosaur',
    'cow'
  ],
  wardrobeStyle: 'all',
  bestStreak: 0,
  gamesCompleted: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  achievements: [],
  inventory: ['pink_bow', 'witch_hat', 'crystal_horns', 'fairy_wings', 'baseball_cap', 'gamer_headset', 'dino_hoodie', 'ninja_headband', 'bubble_aura', 'star_sparkles'],
  equipped: {
    HEAD: 'pink_bow'
  },
  mascotName: 'Shadow',
  mascotHealth: 80,
  mascotHappiness: 85,
  dailyStreak: 1,
  lastPlayedDate: null,
  lastClaimDate: null,
  speedChallengePB: 0,
};

function processDailyPlay(state: any) {
  const today = new Date().toLocaleDateString('en-CA');
  if (state.lastPlayedDate === today) return state;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA');

  const newStreak = state.lastPlayedDate === yesterdayStr ? (state.dailyStreak || 0) + 1 : 1;

  return {
    ...state,
    dailyStreak: newStreak,
    lastPlayedDate: today,
  };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      ...initialState,
      setMascotBase: (id) => set({ mascotBaseId: id }),
      setMascotName: (name) => set({ mascotName: name.trim() || 'Aurora' }),
      unlockAvatar: (id) => set((state) => ({ 
        unlockedAvatars: [...(state.unlockedAvatars || []), id] 
      })),
      completeStarterSelection: (id) => set((state) => ({
        hasChosenStarter: true,
        mascotBaseId: id,
        unlockedAvatars: [...new Set([...(state.unlockedAvatars || []), id])]
      })),
      addCoins: (amount, reason = 'Gameplay') => {
        soundManager.play('coin');
        set((state) => ({ 
          coins: state.coins + amount,
          transactions: [
            { id: Math.random().toString(36).slice(2, 11), amount, reason, date: new Date().toISOString(), type: 'earn' as const },
            ...(state.transactions || [])
          ].slice(0, 50)
        }));
      },
      spendCoins: (amount, reason = 'Store Purchase') => {
        let success = false;
        set((state) => {
          if (state.coins >= amount) {
            success = true;
            return { 
              coins: state.coins - amount,
              transactions: [
                { id: Math.random().toString(36).slice(2, 11), amount, reason, date: new Date().toISOString(), type: 'spend' as const },
                ...(state.transactions || [])
              ].slice(0, 50)
            };
          }
          return state;
        });
        if (success) {
          soundManager.play('purchase');
        }
        return success;
      },
      addStars: (amount) => {
        soundManager.play('star');
        set((state) => ({ stars: state.stars + amount }));
      },
      claimDailyReward: () => set((state) => {
        const today = new Date().toLocaleDateString('en-CA');
        if (state.lastClaimDate === today) return state;

        const nextState = processDailyPlay(state);
        const currentStreak = Math.max(nextState.dailyStreak, 1);
        const bonusCoins = 50 + Math.min(currentStreak * 10, 150);
        
        soundManager.play('coin');
        setTimeout(() => soundManager.play('streak'), 150);

        return {
          ...nextState,
          coins: nextState.coins + bonusCoins,
          transactions: [
            { id: Math.random().toString(36).slice(2, 11), amount: bonusCoins, reason: 'Daily Reward', date: new Date().toISOString(), type: 'earn' as const },
            ...(nextState.transactions || [])
          ].slice(0, 50),
          lastClaimDate: today
        };
      }),
      recordAnswer: (isCorrect) => set((state) => {
        const nextState = processDailyPlay(state);
        const currentStreak = isCorrect ? nextState.currentStreak + 1 : 0;
        const bestStreak = Math.max(nextState.bestStreak, currentStreak);
        const totalCorrect = nextState.totalCorrect + (isCorrect ? 1 : 0);
        const totalIncorrect = nextState.totalIncorrect + (isCorrect ? 0 : 1);
        
        const newHappiness = Math.min(100, nextState.mascotHappiness + (isCorrect ? 2 : -1));
        const newHealth = Math.min(100, nextState.mascotHealth + (isCorrect ? 1 : 0));
        
        const achievements = [...nextState.achievements];
        if (currentStreak >= 5 && !achievements.includes('On Fire')) achievements.push('On Fire');
        if (totalCorrect >= 10 && !achievements.includes('Vocabulary Star')) achievements.push('Vocabulary Star');
        
        return { 
          ...nextState,
          currentStreak, 
          bestStreak, 
          totalCorrect, 
          totalIncorrect, 
          achievements,
          mascotHappiness: Math.max(0, newHappiness),
          mascotHealth: Math.max(0, newHealth)
        };
      }),
      incrementGamesCompleted: () => set((state) => {
        const nextState = processDailyPlay(state);
        const achievements = [...nextState.achievements];
        if (!achievements.includes('First Game')) achievements.push('First Game');
        
        const newHappiness = Math.min(100, nextState.mascotHappiness + 10);
        const newHealth = Math.min(100, nextState.mascotHealth + 5);

        return { 
          ...nextState,
          gamesCompleted: nextState.gamesCompleted + 1, 
          achievements,
          mascotHappiness: Math.max(0, newHappiness),
          mascotHealth: Math.max(0, newHealth)
        };
      }),
      unlockAchievement: (id) => set((state) => ({
        achievements: state.achievements.includes(id) ? state.achievements : [...state.achievements, id]
      })),
      unlockItem: (itemId) => set((state) => ({
        inventory: state.inventory.includes(itemId) ? state.inventory : [...state.inventory, itemId]
      })),
      setWardrobeStyle: (style) => set({ wardrobeStyle: style }),
      equipItem: (category, itemId) => set((state) => {
        const next = { ...state.equipped };
        if (!itemId || next[category] === itemId) {
          delete next[category];
          soundManager.play('unequip');
        } else {
          next[category] = itemId;
          soundManager.play('equip');
        }
        return { equipped: next };
      }),
      clearEquipped: () => {
        soundManager.play('unequip');
        set({ equipped: {} });
      },
      equipCombo: (items) => set((state) => {
        const next = { ...state.equipped };
        for (const itemId of items) {
          const item = SPRITE_ITEMS[itemId];
          if (item) {
            next[item.layer] = itemId;
          }
        }
        soundManager.play('equip');
        return { equipped: next };
      }),
      feedMascot: (amount) => {
        soundManager.play('mascot');
        return set((state) => {
          const nextState = processDailyPlay(state);
          return {
            ...nextState,
            mascotHealth: Math.min(100, nextState.mascotHealth + amount)
          };
        });
      },
      playWithMascot: (amount) => {
        soundManager.play('mascot');
        return set((state) => {
          const nextState = processDailyPlay(state);
          return {
            ...nextState,
            mascotHappiness: Math.min(100, nextState.mascotHappiness + amount)
          };
        });
      },
      setSpeedChallengePB: (score) => set((state) => ({
        speedChallengePB: Math.max(state.speedChallengePB || 0, score)
      })),
      resetProgress: () => set(initialState),
    }),
    {
      name: 'vocab-adventure-progress',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          if (persistedState.careStreak !== undefined) {
            persistedState.dailyStreak = persistedState.careStreak;
            delete persistedState.careStreak;
          }
          if (persistedState.lastCareDate !== undefined) {
            persistedState.lastPlayedDate = persistedState.lastCareDate;
            delete persistedState.lastCareDate;
          }
        }
        return persistedState as ProgressState;
      },
    }
  )
);

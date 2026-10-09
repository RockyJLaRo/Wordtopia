import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerProgress } from '../types';
import { SPRITE_ITEMS, SpriteLayer } from '../data/avatarSprites';
import { soundManager } from '../utils/soundManager';
import { normalizeLayerName } from '../utils/avatarRenderer';
import { localDateKey } from '../utils/dateKey';
import { createSafeJSONStorage, finiteNumber, isPlainObject, stringArray, stringRecord } from '../utils/safeStorage';

interface ProgressState extends PlayerProgress {
  isAvatarExportOpen?: boolean;
  setAvatarExportOpen: (open: boolean) => void;
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
  // Only items that exist in the sprite catalog. (Unknown IDs here were "refunded" by the
  // legacy-item cleanup in App.tsx, handing every brand-new player 2,000 free coins.)
  inventory: ['pink_bow', 'witch_hat', 'crystal_horns', 'fairy_wings', 'baseball_cap', 'bubble_aura'],
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

const nullableString = (v: unknown, fallback: string | null): string | null =>
  typeof v === 'string' ? v : v === null ? null : fallback;

/**
 * Validates progress loaded from localStorage. Corrupted or hand-edited values (NaN coins,
 * a non-array inventory, ...) previously crashed screens that call .includes()/.map() on them.
 * Bad fields fall back to safe defaults while every valid field is kept.
 */
function sanitizePersistedProgress(persisted: unknown, current: ProgressState): ProgressState {
  if (!isPlainObject(persisted)) return current;
  const p = persisted as Partial<PlayerProgress> & Record<string, unknown>;
  const transactions = Array.isArray(p.transactions)
    ? p.transactions
        .filter(
          (t): t is PlayerProgress['transactions'][number] =>
            isPlainObject(t) && typeof t.amount === 'number' && Number.isFinite(t.amount) && typeof t.reason === 'string'
        )
        .slice(0, 50)
    : current.transactions;

  return {
    ...current,
    coins: finiteNumber(p.coins, current.coins, 0),
    stars: finiteNumber(p.stars, current.stars, 0),
    transactions,
    currentStreak: finiteNumber(p.currentStreak, 0, 0),
    hasChosenStarter: typeof p.hasChosenStarter === 'boolean' ? p.hasChosenStarter : current.hasChosenStarter,
    mascotBaseId: typeof p.mascotBaseId === 'string' && p.mascotBaseId ? p.mascotBaseId : current.mascotBaseId,
    unlockedAvatars: stringArray(p.unlockedAvatars, current.unlockedAvatars),
    wardrobeStyle: ['all', 'neutral', 'girl', 'boy'].includes(p.wardrobeStyle as string)
      ? p.wardrobeStyle
      : current.wardrobeStyle,
    bestStreak: finiteNumber(p.bestStreak, 0, 0),
    gamesCompleted: finiteNumber(p.gamesCompleted, 0, 0),
    totalCorrect: finiteNumber(p.totalCorrect, 0, 0),
    totalIncorrect: finiteNumber(p.totalIncorrect, 0, 0),
    achievements: stringArray(p.achievements),
    inventory: stringArray(p.inventory, current.inventory),
    equipped: isPlainObject(p.equipped) ? stringRecord(p.equipped) : current.equipped,
    mascotName: typeof p.mascotName === 'string' ? p.mascotName.slice(0, 40) : current.mascotName,
    mascotHealth: finiteNumber(p.mascotHealth, current.mascotHealth, 0, 100),
    mascotHappiness: finiteNumber(p.mascotHappiness, current.mascotHappiness, 0, 100),
    dailyStreak: finiteNumber(p.dailyStreak, 1, 0),
    lastPlayedDate: nullableString(p.lastPlayedDate, null),
    lastClaimDate: nullableString(p.lastClaimDate, null),
    speedChallengePB: finiteNumber(p.speedChallengePB, 0, 0),
    // UI-only flag: never restore an open modal after a reload.
    isAvatarExportOpen: false,
  };
}

function processDailyPlay(state: any) {
  const today = localDateKey();
  if (state.lastPlayedDate === today) return state;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDateKey(yesterday);

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
        if (!Number.isFinite(amount) || amount <= 0) return;
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
        if (!Number.isFinite(amount) || amount < 0) return false;
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
        if (!Number.isFinite(amount) || amount <= 0) return;
        soundManager.play('star');
        set((state) => ({ stars: state.stars + amount }));
      },
      claimDailyReward: () => set((state) => {
        const today = localDateKey();
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
      isAvatarExportOpen: false,
      setAvatarExportOpen: (open) => set({ isAvatarExportOpen: open }),
      equipItem: (slotOrCategory, itemId) => set((state) => {
        const next = { ...state.equipped };

        // Determine canonical SpriteLayer
        let layer: SpriteLayer | string = slotOrCategory;
        if (itemId && SPRITE_ITEMS[itemId]) {
          layer = SPRITE_ITEMS[itemId].layer;
        } else {
          const normalized = normalizeLayerName(slotOrCategory);
          if (normalized) layer = normalized;
        }

        // All aliases for this layer so we unequip previous duplicates cleanly
        const aliases: Record<string, string[]> = {
          HEAD: ['HEAD', 'head', 'Headwear', 'headwear', 'hat', 'Hat', 'hats', 'Hats', 'horns', 'Horns', 'crown', 'Crown'],
          FACE: ['FACE', 'face', 'Glasses', 'glasses'],
          NECK: ['NECK', 'neck', 'Scarf', 'scarf', 'Collar', 'collar', 'Necklace', 'necklace'],
          BODY: ['BODY', 'body', 'Outfit', 'outfit', 'Outfits', 'clothing', 'Clothing', 'shirt', 'Shirt', 'dress', 'Dress'],
          BACK: ['BACK', 'back', 'Wings', 'wings', 'Cape', 'cape', 'Backpack', 'backpack', 'Wings & Back'],
          TAIL: ['TAIL', 'tail', 'Tails'],
          HAND: ['HAND', 'hand', 'Handheld', 'handheld'],
          TEXTURE: ['TEXTURE', 'texture', 'Aura', 'aura', 'Skin', 'skin', 'Textures & Auras'],
        };

        const keysToCheck = aliases[layer] || [layer, layer.toLowerCase(), slotOrCategory];
        const isCurrentlyEquipped = keysToCheck.some((k) => next[k] === itemId);

        // Remove all variations
        for (const k of keysToCheck) {
          delete next[k];
        }

        if (isCurrentlyEquipped || !itemId) {
          soundManager.play('unequip');
        } else {
          next[layer] = itemId;
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
            // Clean up any alias for this item's layer
            const aliases: Record<string, string[]> = {
              HEAD: ['HEAD', 'head', 'Headwear', 'headwear'],
              FACE: ['FACE', 'face', 'Glasses', 'glasses'],
              NECK: ['NECK', 'neck', 'Scarf', 'scarf', 'Collar', 'collar'],
              BODY: ['BODY', 'body', 'Outfit', 'outfit', 'Clothing', 'clothing'],
              BACK: ['BACK', 'back', 'Wings', 'wings'],
              TAIL: ['TAIL', 'tail'],
              HAND: ['HAND', 'hand'],
              TEXTURE: ['TEXTURE', 'texture', 'Aura', 'aura'],
            };
            const toClear = aliases[item.layer] || [item.layer, item.layer.toLowerCase()];
            for (const k of toClear) {
              delete next[k];
            }
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
      storage: createSafeJSONStorage<ProgressState>(),
      // Don't persist transient UI state.
      partialize: ({ isAvatarExportOpen: _ignored, ...rest }) => rest as ProgressState,
      merge: (persisted, current) => sanitizePersistedProgress(persisted, current),
      migrate: (persistedState: any, version: number) => {
        if (!isPlainObject(persistedState)) return persistedState as unknown as ProgressState;
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
        return persistedState as unknown as ProgressState;
      },
    }
  )
);

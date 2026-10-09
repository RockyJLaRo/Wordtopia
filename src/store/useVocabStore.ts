import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VocabWord, MasteryLevel, SkillDimension } from '../types';
import { createSafeJSONStorage, finiteNumber, isPlainObject, stringArray } from '../utils/safeStorage';

const uuidv4 = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // randomUUID requires a secure context; fall through
  }
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const REMOTE_VOCAB_URL = 'https://rockyjlaro.github.io/Vocab.txt';
const MASTERY_LEVELS: MasteryLevel[] = ['New', 'Introduced', 'Learning', 'Practicing', 'Strong', 'Mastered', 'Needs Review'];

// Cheap content fingerprint so an unchanged remote list is not re-merged on every launch.
const hashText = (text: string): string => {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${text.length}:${h >>> 0}`;
};

/**
 * Validates words restored from localStorage. Entries without a usable word/definition are
 * dropped (they would render blank answer buttons), numeric stats are repaired, and duplicate
 * IDs are re-issued so React keys and answer checks stay unique.
 */
export const sanitizeWords = (raw: unknown): VocabWord[] => {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const out: VocabWord[] = [];
  for (const item of raw) {
    if (!isPlainObject(item)) continue;
    const word = typeof item.word === 'string' ? item.word.trim() : '';
    const definition = typeof item.definition === 'string' ? item.definition.trim() : '';
    if (!word || !definition) continue;
    let id = typeof item.id === 'string' && item.id ? item.id : uuidv4();
    if (seenIds.has(id)) id = uuidv4();
    seenIds.add(id);
    const practicedCount = finiteNumber(item.practicedCount, 0, 0);
    const correctCount = finiteNumber(item.correctCount, 0, 0);
    out.push({
      ...(item as unknown as VocabWord),
      id,
      word,
      definition,
      lesson: typeof item.lesson === 'string' && item.lesson.trim() ? item.lesson : undefined,
      practicedCount,
      correctCount,
      incorrectCount: finiteNumber(item.incorrectCount, 0, 0),
      accuracy: practicedCount > 0 ? Math.min(1, correctCount / practicedCount) : 0,
      masteryLevel: MASTERY_LEVELS.includes(item.masteryLevel as MasteryLevel) ? (item.masteryLevel as MasteryLevel) : 'New',
      needsPractice: item.needsPractice === true,
      confusionWords: stringArray(item.confusionWords).slice(-5),
    });
  }
  return out;
};

// Shared in-flight request so rapid/duplicate triggers (StrictMode, online event, retries)
// don't start parallel downloads that race each other.
let inflightLoad: Promise<void> | null = null;

async function fetchText(url: string, timeoutMs: number, cache: RequestCache): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache, signal: controller.signal });
    if (!response.ok) throw new Error(`Vocab request failed with status ${response.status}`);
    const text = await response.text();
    // Captive portals / SPA fallbacks can answer 200 with an HTML page.
    if (/^\s*</.test(text)) throw new Error('Vocab response was HTML, not a word list');
    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface VocabState {
  allWords: VocabWord[];
  words: VocabWord[];
  selectedLesson: string; // 'all' or 'Week #1', 'Week #2', etc.
  availableLessons: string[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;
  lastSyncedHash?: string | null;

  // Actions
  setSelectedLesson: (lessonId: string) => void;
  loadVocabFromUrl: (force?: boolean) => Promise<void>;
  addWord: (word: string, definition: string, lesson?: string) => void;
  updateWord: (id: string, word: string, definition: string, lesson?: string) => void;
  removeWord: (id: string) => void;
  clearAll: (lessonOnly?: boolean) => void;
  resetMastery: (lessonOnly?: boolean) => void;
  importWords: (text: string, replaceExisting: boolean, defaultLesson?: string) => void;
  recordPractice: (id: string, isCorrect: boolean, dimension?: SkillDimension, confusedWithWord?: string) => void;
  toggleNeedsPractice: (id: string) => void;
}

export const sortLessons = (lessons: string[]): string[] => {
  return [...lessons].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
};

export const getLessonsFromWords = (wordsList: VocabWord[]): string[] => {
  const lessons = new Set<string>();
  for (const w of wordsList) {
    if (w.lesson && w.lesson.trim()) {
      lessons.add(w.lesson.trim());
    }
  }
  if (lessons.size === 0 && wordsList.length > 0) {
    lessons.add('Week #1');
  }
  return sortLessons(Array.from(lessons));
};

export const getFilteredWords = (allWords: VocabWord[], selectedLesson: string): VocabWord[] => {
  if (selectedLesson === 'all') return allWords;
  const filtered = allWords.filter(w => (w.lesson || 'Week #1') === selectedLesson);
  return filtered.length > 0 ? filtered : allWords;
};

export const parseVocabTextWithLessons = (
  text: string,
  fallbackLesson = 'Week #1'
): { word: string; definition: string; lesson: string }[] => {
  const lines = text.split(/\r?\n/);
  const parsed: { word: string; definition: string; lesson: string }[] = [];
  let currentLesson = fallbackLesson;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check if line looks like a lesson header e.g. "Week #1", "Week 2", "Lesson 1"
    const headerMatch = trimmed.match(/^(Week|Lesson|Unit)\s*#?\s*(\d+[^\-–—:]*)/i);
    const hasDash = trimmed.includes(' - ') || trimmed.includes(' — ') || trimmed.includes(' – ');
    
    if (headerMatch && !hasDash) {
      const type = headerMatch[1].charAt(0).toUpperCase() + headerMatch[1].slice(1).toLowerCase();
      const numPart = headerMatch[2].replace(/^#/, '').trim();
      currentLesson = `${type} #${numPart}`;
      continue;
    }

    // Also check for lines like "Week #1:" or "Week #2"
    if (/^(Week|Lesson)\s*#?\s*\d+/i.test(trimmed) && !hasDash && trimmed.length < 35) {
      currentLesson = trimmed.replace(/:$/, '').trim();
      continue;
    }

    // Match Word - Definition
    const match = trimmed.match(/^(.*?)\s+[-–—]\s+(.+)$/);
    if (match) {
      const word = match[1].trim();
      const definition = match[2].trim();
      if (word && definition) {
        parsed.push({
          word,
          definition,
          lesson: currentLesson,
        });
      }
    }
  }

  return parsed;
};

const calculateMastery = (
  correct: number,
  incorrect: number,
  practiced: number,
  streak: number,
  currentLevel: MasteryLevel = 'New',
  dimensionScores?: Record<string, number>
): MasteryLevel => {
  if (practiced === 0) return 'New';
  if (practiced === 1 && correct === 1) return 'Introduced';
  const accuracy = correct / practiced;

  // If a student had previously achieved Strong/Mastered but broke streak with multiple errors
  if ((currentLevel === 'Mastered' || currentLevel === 'Strong') && streak === 0 && incorrect >= 2) {
    return 'Needs Review';
  }

  // Multi-dimensional check if dimension scores available
  if (dimensionScores) {
    const avgDim = (
      (dimensionScores.recognition || 0) +
      (dimensionScores.definition || 0) +
      (dimensionScores.context || 0) +
      (dimensionScores.spelling || 0) +
      (dimensionScores.recall || 0)
    ) / 5;
    if (practiced >= 6 && accuracy >= 0.88 && streak >= 4 && avgDim >= 75) return 'Mastered';
    if (practiced >= 4 && accuracy >= 0.78 && streak >= 2) return 'Strong';
    if (practiced >= 2 && accuracy < 0.6) return 'Needs Review';
    if (practiced >= 1) return 'Learning';
  }

  if (practiced >= 5 && accuracy >= 0.9 && streak >= 3) return 'Mastered';
  if (practiced >= 3 && accuracy >= 0.75) return 'Strong';
  if (practiced >= 1 && accuracy < 0.6) return 'Needs Review';
  if (practiced >= 2) return 'Practicing';
  return 'Learning';
};

export const useVocabStore = create<VocabState>()(
  persist(
    (set, get) => ({
      allWords: [],
      words: [],
      selectedLesson: 'Week #1',
      availableLessons: ['Week #1', 'Week #2'],
      isLoading: false,
      error: null,
      lastSyncTime: null,
      lastSyncedHash: null,

      setSelectedLesson: (lessonId: string) => {
        const state = get();
        const words = getFilteredWords(state.allWords, lessonId);
        set({
          selectedLesson: lessonId,
          words,
        });
      },

      loadVocabFromUrl: (force = false) => {
        if (inflightLoad) return inflightLoad;
        inflightLoad = (async () => {
          const hasExistingWords = get().allWords.length > 0;

          // Only show full loading spinner if we don't already have persistent words cached
          if (!hasExistingWords) {
            set({ isLoading: true, error: null });
          }

          let text = '';
          try {
            // 1. Remote list (short timeout so slow networks fall back quickly)
            text = await fetchText(REMOTE_VOCAB_URL, 4000, force ? 'reload' : 'default');
          } catch {
            // 2. Bundled/precached copy. Only needed when we have nothing saved yet: for a
            // returning player a failed background refresh should change nothing.
            if (!hasExistingWords || force) {
              try {
                text = await fetchText('/Vocab.txt', 4000, 'default');
              } catch (localErr) {
                console.warn('[useVocabStore] Local /Vocab.txt fetch failed:', localErr);
              }
            }
          }

          if (text) {
            const textHash = hashText(text);
            if (hasExistingWords && textHash === get().lastSyncedHash) {
              // Same list as last time: keep the player's local edits untouched.
              set({ isLoading: false, error: null, lastSyncTime: Date.now() });
              return;
            }
            try {
              const parsed = parseVocabTextWithLessons(text);
              if (parsed.length > 0) {
                const state = get();
                const existingList = state.allWords.length > 0 ? state.allWords : state.words;
                const existingMap = new Map<string, VocabWord>();
                for (const w of existingList) {
                  existingMap.set(w.word.toLowerCase(), w);
                }

                // Merge parsed words, preserving progress if already practiced
                const parsedKeys = new Set<string>();
                const mergedAllWords: VocabWord[] = [];
                for (const p of parsed) {
                  const key = p.word.toLowerCase();
                  if (parsedKeys.has(key)) continue; // duplicate line in the list
                  parsedKeys.add(key);
                  const existing = existingMap.get(key);
                  mergedAllWords.push(
                    existing
                      ? { ...existing, definition: p.definition, lesson: p.lesson }
                      : {
                          id: uuidv4(),
                          word: p.word,
                          definition: p.definition,
                          lesson: p.lesson,
                          practicedCount: 0,
                          correctCount: 0,
                          incorrectCount: 0,
                          accuracy: 0,
                          masteryLevel: 'New' as MasteryLevel,
                          needsPractice: false,
                        }
                  );
                }

                // Keep any custom user-added words not in the text file
                for (const w of existingList) {
                  if (!parsedKeys.has(w.word.toLowerCase())) {
                    mergedAllWords.push(w);
                  }
                }

                const availableLessons = getLessonsFromWords(mergedAllWords);
                let currentSelected = state.selectedLesson;
                if (
                  !currentSelected ||
                  (currentSelected !== 'all' && !availableLessons.includes(currentSelected))
                ) {
                  currentSelected = availableLessons[0] || 'Week #1';
                }

                set({
                  allWords: mergedAllWords,
                  words: getFilteredWords(mergedAllWords, currentSelected),
                  availableLessons,
                  selectedLesson: currentSelected,
                  isLoading: false,
                  lastSyncTime: Date.now(),
                  lastSyncedHash: textHash,
                  error: null,
                });
                return;
              }
            } catch (parseErr) {
              console.error('[useVocabStore] Error parsing vocab text:', parseErr);
            }
          }

          // 3. Fallback to existing persisted words in state if offline
          const state = get();
          if (state.allWords.length > 0) {
            set({ isLoading: false, error: null });
          } else {
            set({
              isLoading: false,
              error: 'Unable to load vocabulary words while offline. Connect to the internet to initialize.',
            });
          }
        })().finally(() => {
          inflightLoad = null;
        });
        return inflightLoad;
      },

      addWord: (word, definition, lesson) =>
        set((state) => {
          const chosenLesson =
            lesson || (state.selectedLesson !== 'all' ? state.selectedLesson : 'Week #1');
          const newWord: VocabWord = {
            id: uuidv4(),
            word,
            definition,
            lesson: chosenLesson,
            practicedCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            accuracy: 0,
            masteryLevel: 'New',
            needsPractice: false,
          };
          const updatedAll = [...state.allWords, newWord];
          const availableLessons = getLessonsFromWords(updatedAll);
          const words = getFilteredWords(updatedAll, state.selectedLesson);
          return {
            allWords: updatedAll,
            availableLessons,
            words,
          };
        }),

      updateWord: (id, word, definition, lesson) =>
        set((state) => {
          const updatedAll = state.allWords.map((w) =>
            w.id === id
              ? {
                  ...w,
                  word,
                  definition,
                  lesson: lesson !== undefined ? lesson : w.lesson,
                }
              : w
          );
          const availableLessons = getLessonsFromWords(updatedAll);
          const words = getFilteredWords(updatedAll, state.selectedLesson);
          return {
            allWords: updatedAll,
            availableLessons,
            words,
          };
        }),

      removeWord: (id) =>
        set((state) => {
          const updatedAll = state.allWords.filter((w) => w.id !== id);
          const availableLessons = getLessonsFromWords(updatedAll);
          const words = getFilteredWords(updatedAll, state.selectedLesson);
          return {
            allWords: updatedAll,
            availableLessons,
            words,
          };
        }),

      clearAll: (lessonOnly = false) =>
        set((state) => {
          if (lessonOnly && state.selectedLesson !== 'all') {
            const updatedAll = state.allWords.filter(
              (w) => (w.lesson || 'Week #1') !== state.selectedLesson
            );
            const availableLessons = getLessonsFromWords(updatedAll);
            const words = getFilteredWords(updatedAll, 'all');
            return {
              allWords: updatedAll,
              availableLessons,
              selectedLesson: 'all',
              words,
            };
          }
          return {
            allWords: [],
            words: [],
            availableLessons: [],
          };
        }),

      resetMastery: (lessonOnly = false) =>
        set((state) => {
          const updatedAll = state.allWords.map((w) => {
            if (lessonOnly && state.selectedLesson !== 'all' && (w.lesson || 'Week #1') !== state.selectedLesson) {
              return w;
            }
            return {
              ...w,
              practicedCount: 0,
              correctCount: 0,
              incorrectCount: 0,
              accuracy: 0,
              masteryLevel: 'New' as MasteryLevel,
              // Clear derived stats too, otherwise old streaks/skill scores leak into the
              // "fresh" mastery calculation after a reset.
              streak: 0,
              dimensionScores: undefined,
              confusionWords: [],
              nextReviewDate: undefined,
              lastPracticed: undefined,
              needsPractice: false,
            };
          });
          const words = getFilteredWords(updatedAll, state.selectedLesson);
          return {
            allWords: updatedAll,
            words,
          };
        }),

      importWords: (text, replaceExisting, defaultLesson) =>
        set((state) => {
          const fallback =
            defaultLesson || (state.selectedLesson !== 'all' ? state.selectedLesson : 'Week #1');
          const parsed = parseVocabTextWithLessons(text, fallback);
          const newWords: VocabWord[] = parsed.map((p) => ({
            id: uuidv4(),
            word: p.word,
            definition: p.definition,
            lesson: p.lesson,
            practicedCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            accuracy: 0,
            masteryLevel: 'New' as MasteryLevel,
            needsPractice: false,
          }));

          let updatedAll: VocabWord[] = [];
          if (replaceExisting) {
            updatedAll = newWords;
          } else {
            const existingWordStrings = new Set(state.allWords.map((w) => w.word.toLowerCase()));
            const filteredNewWords = newWords.filter(
              (nw) => !existingWordStrings.has(nw.word.toLowerCase())
            );
            updatedAll = [...state.allWords, ...filteredNewWords];
          }

          const availableLessons = getLessonsFromWords(updatedAll);
          const words = getFilteredWords(updatedAll, state.selectedLesson);
          return {
            allWords: updatedAll,
            availableLessons,
            words,
          };
        }),

      recordPractice: (id, isCorrect, dimension = 'recognition', confusedWithWord) =>
        set((state) => {
          const updatedAll = state.allWords.map((w) => {
            if (w.id !== id) return w;
            const correctCount = w.correctCount + (isCorrect ? 1 : 0);
            const incorrectCount = w.incorrectCount + (isCorrect ? 0 : 1);
            const practicedCount = w.practicedCount + 1;
            const accuracy = correctCount / practicedCount;
            const newStreak = isCorrect ? (w.streak || 0) + 1 : 0;

            // Update dimension scores
            const currentDimensions = w.dimensionScores || {
              recognition: 50,
              definition: 50,
              context: 50,
              spelling: 50,
              recall: 50,
            };
            const dimDelta = isCorrect ? 15 : -20;
            const updatedDimScore = Math.max(0, Math.min(100, (currentDimensions[dimension] || 50) + dimDelta));
            const newDimensions = {
              ...currentDimensions,
              [dimension]: updatedDimScore,
            };

            // Spaced Repetition Next Review (Interval in days expands with streak: 1 -> 3 -> 7 -> 14)
            const intervalDays = isCorrect ? Math.min(21, Math.pow(2, Math.min(newStreak, 4))) : 1;
            const nextReviewDate = Date.now() + intervalDays * 24 * 60 * 60 * 1000;

            // Track confusion words
            const confusionWords = [...(w.confusionWords || [])];
            if (!isCorrect && confusedWithWord && !confusionWords.includes(confusedWithWord)) {
              confusionWords.push(confusedWithWord);
            }

            const masteryLevel = calculateMastery(
              correctCount,
              incorrectCount,
              practicedCount,
              newStreak,
              w.masteryLevel,
              newDimensions
            );

            return {
              ...w,
              correctCount,
              incorrectCount,
              practicedCount,
              accuracy,
              streak: newStreak,
              masteryLevel,
              lastPracticed: Date.now(),
              nextReviewDate,
              dimensionScores: newDimensions,
              confusionWords: confusionWords.slice(-5),
              needsPractice: masteryLevel === 'Needs Review' || masteryLevel === 'Learning' ? true : w.needsPractice,
            };
          });
          const words = getFilteredWords(updatedAll, state.selectedLesson);
          return {
            allWords: updatedAll,
            words,
          };
        }),

      toggleNeedsPractice: (id) =>
        set((state) => {
          const updatedAll = state.allWords.map((w) =>
            w.id === id ? { ...w, needsPractice: !w.needsPractice } : w
          );
          const words = getFilteredWords(updatedAll, state.selectedLesson);
          return {
            allWords: updatedAll,
            words,
          };
        }),
    }),
    {
      name: 'vocab-adventure-words',
      version: 3,
      storage: createSafeJSONStorage<VocabState>(),
      // `words` and `availableLessons` are derived from `allWords`; persisting them doubled
      // the save size and the cost of every write (one per answered question).
      partialize: (state) =>
        ({
          allWords: state.allWords,
          selectedLesson: state.selectedLesson,
          lastSyncTime: state.lastSyncTime,
          lastSyncedHash: state.lastSyncedHash,
        }) as VocabState,
      migrate: (persistedState: any, _version: number) => {
        if (!isPlainObject(persistedState)) return persistedState;
        const legacyWords = Array.isArray(persistedState.words) ? persistedState.words : [];
        const allWords =
          Array.isArray(persistedState.allWords) && persistedState.allWords.length > 0
            ? persistedState.allWords
            : legacyWords.map((w: any) => ({
                ...w,
                lesson: w?.lesson || 'Week #1',
              }));
        return { ...persistedState, allWords };
      },
      merge: (persisted, current) => {
        if (!isPlainObject(persisted)) return current;
        const p = persisted as Partial<VocabState>;
        const allWords = sanitizeWords(p.allWords);
        const availableLessons = allWords.length > 0 ? getLessonsFromWords(allWords) : current.availableLessons;
        let selectedLesson = typeof p.selectedLesson === 'string' && p.selectedLesson ? p.selectedLesson : current.selectedLesson;
        if (selectedLesson !== 'all' && allWords.length > 0 && !availableLessons.includes(selectedLesson)) {
          selectedLesson = availableLessons[0] || 'Week #1';
        }
        return {
          ...current,
          allWords,
          words: getFilteredWords(allWords, selectedLesson),
          availableLessons,
          selectedLesson,
          lastSyncTime: typeof p.lastSyncTime === 'number' ? p.lastSyncTime : null,
          lastSyncedHash: typeof p.lastSyncedHash === 'string' ? p.lastSyncedHash : null,
        };
      },
    }
  )
);

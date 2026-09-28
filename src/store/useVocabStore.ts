import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { VocabWord, MasteryLevel } from '../types';

export interface VocabState {
  allWords: VocabWord[];
  words: VocabWord[];
  selectedLesson: string; // 'all' or 'Week #1', 'Week #2', etc.
  availableLessons: string[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;

  // Actions
  setSelectedLesson: (lessonId: string) => void;
  loadVocabFromUrl: (force?: boolean) => Promise<void>;
  addWord: (word: string, definition: string, lesson?: string) => void;
  updateWord: (id: string, word: string, definition: string, lesson?: string) => void;
  removeWord: (id: string) => void;
  clearAll: (lessonOnly?: boolean) => void;
  resetMastery: (lessonOnly?: boolean) => void;
  importWords: (text: string, replaceExisting: boolean, defaultLesson?: string) => void;
  recordPractice: (id: string, isCorrect: boolean) => void;
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

const calculateMastery = (correct: number, incorrect: number, practiced: number): MasteryLevel => {
  if (practiced === 0) return 'New';
  const accuracy = correct / practiced;
  if (practiced >= 5 && accuracy >= 0.9) return 'Mastered';
  if (practiced >= 3 && accuracy >= 0.8) return 'Strong';
  if (practiced >= 1 && accuracy < 0.6) return 'Practicing';
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

      setSelectedLesson: (lessonId: string) => {
        const state = get();
        const words = getFilteredWords(state.allWords, lessonId);
        set({
          selectedLesson: lessonId,
          words,
        });
      },

      loadVocabFromUrl: async (_force = false) => {
        set({ isLoading: true, error: null });
        let text = '';
        try {
          // 1. Try remote fetch (service worker caches this via NetworkFirst)
          const response = await fetch('https://rockyjlaro.github.io/Vocab.txt', {
            cache: _force ? 'reload' : 'default',
          });
          if (response.ok) {
            text = await response.text();
          } else {
            throw new Error(`Remote responded with status ${response.status}`);
          }
        } catch (remoteErr) {
          console.warn('[useVocabStore] Remote vocab fetch failed or offline, falling back to cached / local Vocab.txt:', remoteErr);
          try {
            // 2. Fallback to local /Vocab.txt (precached and runtime-cached by service worker)
            const localResponse = await fetch('/Vocab.txt');
            if (localResponse.ok) {
              text = await localResponse.text();
            }
          } catch (localErr) {
            console.warn('[useVocabStore] Local /Vocab.txt fetch failed:', localErr);
          }
        }

        // If we got text from online, service worker cache, or local fallback
        if (text) {
          try {
            const parsed = parseVocabTextWithLessons(text);
            if (parsed.length > 0) {
              const state = get();
              const existingList = state.allWords && state.allWords.length > 0 ? state.allWords : state.words;
              const existingMap = new Map<string, VocabWord>();
              for (const w of existingList) {
                existingMap.set(w.word.toLowerCase(), w);
              }

              // Merge parsed words, preserving progress if already practiced
              const mergedAllWords: VocabWord[] = parsed.map(p => {
                const existing = existingMap.get(p.word.toLowerCase());
                if (existing) {
                  return {
                    ...existing,
                    definition: p.definition,
                    lesson: p.lesson, // update with correct lesson
                  };
                }
                return {
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
                };
              });

              // Keep any custom user-added words not in the text file
              for (const w of existingList) {
                if (!parsed.some(p => p.word.toLowerCase() === w.word.toLowerCase())) {
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

              const words = getFilteredWords(mergedAllWords, currentSelected);

              set({
                allWords: mergedAllWords,
                words,
                availableLessons,
                selectedLesson: currentSelected,
                isLoading: false,
                lastSyncTime: Date.now(),
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
        if (state.allWords && state.allWords.length > 0) {
          const availableLessons = getLessonsFromWords(state.allWords);
          const currentSelected = state.selectedLesson || availableLessons[0] || 'Week #1';
          const words = getFilteredWords(state.allWords, currentSelected);
          set({
            words,
            availableLessons,
            selectedLesson: currentSelected,
            isLoading: false,
            error: null,
          });
        } else {
          set({
            isLoading: false,
            error: 'Unable to load vocabulary words while offline. Connect to the internet to initialize.',
          });
        }
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
            const existingWordStrings = state.allWords.map((w) => w.word.toLowerCase());
            const filteredNewWords = newWords.filter(
              (nw) => !existingWordStrings.includes(nw.word.toLowerCase())
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

      recordPractice: (id, isCorrect) =>
        set((state) => {
          const updatedAll = state.allWords.map((w) => {
            if (w.id !== id) return w;
            const correctCount = w.correctCount + (isCorrect ? 1 : 0);
            const incorrectCount = w.incorrectCount + (isCorrect ? 0 : 1);
            const practicedCount = w.practicedCount + 1;
            const accuracy = correctCount / practicedCount;
            const masteryLevel = calculateMastery(correctCount, incorrectCount, practicedCount);
            return {
              ...w,
              correctCount,
              incorrectCount,
              practicedCount,
              accuracy,
              masteryLevel,
              lastPracticed: Date.now(),
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
      version: 2,
      migrate: (persistedState: any, _version: number) => {
        if (!persistedState) return persistedState;
        const words = persistedState.words || [];
        const allWords =
          persistedState.allWords && persistedState.allWords.length > 0
            ? persistedState.allWords
            : words.map((w: any) => ({
                ...w,
                lesson: w.lesson || 'Week #1',
              }));
        const availableLessons = getLessonsFromWords(allWords);
        const selectedLesson =
          persistedState.selectedLesson || (availableLessons[0] || 'Week #1');
        return {
          ...persistedState,
          allWords,
          availableLessons,
          selectedLesson,
          words: getFilteredWords(allWords, selectedLesson),
        };
      },
    }
  )
);

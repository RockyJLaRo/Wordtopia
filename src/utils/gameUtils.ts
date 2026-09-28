import { VocabWord } from '../types';

/**
 * Authentic Fisher-Yates unbiased shuffle algorithm
 */
export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getRandomWords(words: VocabWord[], count: number): VocabWord[] {
  if (!words || words.length === 0) return [];
  const shuffled = shuffleArray(words);
  return shuffled.slice(0, Math.min(count, words.length));
}

export function getWeightedRandomWords(words: VocabWord[], count: number): VocabWord[] {
  if (!words || words.length === 0) return [];
  // Give higher weight to 'Needs Practice', 'New', and 'Learning'
  const pool: VocabWord[] = [];
  words.forEach((w) => {
    pool.push(w);
    if (w.needsPractice) pool.push(w, w);
    if (w.masteryLevel === 'New') pool.push(w);
    if (w.masteryLevel === 'Learning') pool.push(w);
    if (w.masteryLevel === 'Practicing') pool.push(w);
  });

  const shuffled = shuffleArray(pool);
  const selected = new Set<VocabWord>();
  for (const w of shuffled) {
    selected.add(w);
    if (selected.size === count) break;
  }
  // Fallback if not enough unique words
  if (selected.size < count) {
    return getRandomWords(words, count);
  }
  return Array.from(selected);
}

export function getDistractors(words: VocabWord[], correctWord: VocabWord, count: number): VocabWord[] {
  if (!words || !correctWord) return [];
  const correctWordStr = (correctWord.word || '').trim().toLowerCase();
  const correctDefStr = (correctWord.definition || '').trim().toLowerCase();

  // Filter out the correct word, duplicate word names, and identical definitions
  const others = words.filter(
    (w) =>
      w.id !== correctWord.id &&
      (w.word || '').trim().toLowerCase() !== correctWordStr &&
      (w.definition || '').trim().toLowerCase() !== correctDefStr
  );
  return getRandomWords(others, count);
}


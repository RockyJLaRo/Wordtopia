export type GradeLevel =
  | 'Kindergarten'
  | '1st Grade'
  | '2nd Grade'
  | '3rd Grade'
  | '4th Grade'
  | '5th Grade'
  | '6th Grade'
  | '7th Grade'
  | '8th Grade'
  | '9th Grade'
  | '10th Grade'
  | '11th Grade'
  | '12th Grade'
  | 'Custom';

export type MasteryLevel =
  | 'New'
  | 'Introduced'
  | 'Learning'
  | 'Practicing'
  | 'Strong'
  | 'Mastered'
  | 'Needs Review';

export type SkillDimension = 'recognition' | 'definition' | 'context' | 'spelling' | 'recall';

export interface DimensionScores {
  recognition: number; // percentage 0 - 100
  definition: number;
  context: number;
  spelling: number;
  recall: number;
}

export interface VocabWord {
  id: string;
  word: string;
  definition: string;
  lesson?: string; // e.g. "Week #1", "Week #2"
  practicedCount: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  masteryLevel: MasteryLevel;
  lastPracticed?: number;
  needsPractice: boolean;
  streak?: number;
  dimensionScores?: DimensionScores;
  confusionWords?: string[];
  nextReviewDate?: number;
}

export interface VocabLessonInfo {
  id: string; // 'all' or 'Week #1', etc.
  name: string;
  wordCount: number;
  masteredCount: number;
}

export interface GameSettings {
  gradeLevel: GradeLevel;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  reduceMotion: boolean;
  hasSeenOnboarding: boolean;
  hapticsEnabled: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  category: string;
  collection: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  price: number;
  description: string;
  emoji: string;
  imageUrl?: string;
  color: string;
  style?: 'neutral' | 'girl' | 'boy';
  layer?: string;
  items?: string[];
}

export interface Transaction {
  id: string;
  amount: number;
  reason: string;
  date: string;
  type: 'earn' | 'spend';
}

export interface PlayerProgress {
  coins: number;
  stars: number;
  transactions: Transaction[];
  currentStreak: number;
  hasChosenStarter: boolean;
  mascotBaseId: string;
  unlockedAvatars: string[];
  wardrobeStyle?: 'all' | 'neutral' | 'girl' | 'boy';

  bestStreak: number;
  gamesCompleted: number;
  totalCorrect: number;
  totalIncorrect: number;
  achievements: string[];
  inventory: string[];
  equipped: Record<string, string>;
  mascotName: string;
  mascotHealth: number;
  mascotHappiness: number;
  dailyStreak: number;
  lastPlayedDate: string | null;
  lastClaimDate: string | null;
  speedChallengePB?: number;
}

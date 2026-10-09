import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, Sparkles, CheckCircle2, RotateCcw, ArrowRight, ShieldAlert, KeyRound } from 'lucide-react';
import { confetti } from '../utils/confetti';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { shuffleArray } from '../utils/gameUtils';
import { VocabWord } from '../types';
import { useActionLock } from '../hooks/useGameTimers';

// Only letters are spelled with tiles; spaces, hyphens and apostrophes are shown pre-filled.
const isLetter = (ch: string) => /\p{L}/u.test(ch);
const spellableLetters = (word: string) => Array.from(word.toUpperCase()).filter(isLetter);

export function SpellingQuest() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, reduceMotion } = useSettingsStore();

  const [gameState, setGameState] = useState<'playing' | 'wordComplete' | 'finished'>('playing');
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [spelledLetters, setSpelledLetters] = useState<string[]>([]);
  const [letterPool, setLetterPool] = useState<{ id: string; letter: string; used: boolean }[]>([]);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const TOTAL_WORDS = Math.min(4, words.length);
  // Each round picks its words once (shuffled); previously it always used the first 4 words.
  const roundWordsRef = useRef<VocabWord[]>([]);
  // Record at most one miss per word so a few slips don't tank its mastery score.
  const missedCurrentRef = useRef(false);
  // Synchronous mirrors so quick repeated taps (before React re-renders) can't place the same
  // tile twice or record the finished word more than once.
  const spelledRef = useRef<string[]>([]);
  const usedTileIdsRef = useRef<Set<string>>(new Set());
  const advanceLock = useActionLock();

  useEffect(() => {
    if (words.length >= 2 && !currentWord) {
      loadWord(0);
    }
  }, [words.length, currentWord]);

  // Stop any pronunciation still playing when leaving the game.
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    };
  }, []);

  const loadWord = (idx: number) => {
    if (idx >= TOTAL_WORDS) {
      setGameState('finished');
      incrementGamesCompleted();
      addCoins(75, 'Completed Spelling Quest');
      addStars(3);
      playWinSound(soundEnabled);
      haptic.win();
      if (!reduceMotion) {
        confetti({ particleCount: 160, spread: 80 });
      }
      return;
    }

    if (idx === 0 || roundWordsRef.current.length === 0) {
      roundWordsRef.current = shuffleArray(words).filter((w) => spellableLetters(w.word).length > 0);
    }
    const pool = roundWordsRef.current.length > 0 ? roundWordsRef.current : words;
    const target = pool[idx % pool.length];
    const cleanLetters = spellableLetters(target.word);
    missedCurrentRef.current = false;
    spelledRef.current = [];
    usedTileIdsRef.current = new Set();
    advanceLock.release();

    // Add 2 extra distractor letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const extra1 = alphabet[Math.floor(Math.random() * alphabet.length)];
    const extra2 = alphabet[Math.floor(Math.random() * alphabet.length)];

    const allLetters = [...cleanLetters, extra1, extra2].map((ch, i) => ({
      id: `${ch}-${i}-${Math.random()}`,
      letter: ch,
      used: false,
    }));

    setCurrentWord(target);
    setSpelledLetters([]);
    setLetterPool(shuffleArray(allLetters));
    setHintMessage(null);
    setGameState('playing');

    // Auto-pronounce if speech synthesis available
    speakWord(target.word);
  };

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  const handleSelectLetter = (item: { id: string; letter: string; used: boolean }) => {
    if (item.used || usedTileIdsRef.current.has(item.id) || gameState !== 'playing' || !currentWord) return;

    const targetLetters = spellableLetters(currentWord.word);
    if (spelledRef.current.length >= targetLetters.length) return; // word already complete
    const nextExpected = targetLetters[spelledRef.current.length];

    if (item.letter === nextExpected) {
      playCorrectSound(soundEnabled);
      haptic.success();
      const nextSpelled = [...spelledRef.current, item.letter];
      spelledRef.current = nextSpelled;
      usedTileIdsRef.current.add(item.id);
      setSpelledLetters(nextSpelled);
      setLetterPool((prev) =>
        prev.map((l) => (l.id === item.id ? { ...l, used: true } : l))
      );
      setHintMessage(null);

      // Check if word complete
      if (nextSpelled.length === targetLetters.length) {
        if (!missedCurrentRef.current) {
          recordPractice(currentWord.id, true, 'spelling');
        }
        recordAnswer(true);
        setScore((prev) => prev + 100);
        setGameState('wordComplete');
      }
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
      const vowels = ['A', 'E', 'I', 'O', 'U'];
      const isNextVowel = vowels.includes(nextExpected);
      setHintMessage(
        `Next letter needed is a ${isNextVowel ? 'vowel (A, E, I, O, U)' : 'consonant'}!`
      );
      if (!missedCurrentRef.current) {
        missedCurrentRef.current = true;
        recordPractice(currentWord.id, false, 'spelling');
        recordAnswer(false);
      }
    }
  };

  const handleBackspace = () => {
    if (spelledRef.current.length === 0 || gameState !== 'playing') return;

    const removedLetter = spelledRef.current[spelledRef.current.length - 1];
    spelledRef.current = spelledRef.current.slice(0, -1);
    setSpelledLetters(spelledRef.current);

    // Unmark one used tile with that letter
    const tile = letterPool.find((l) => usedTileIdsRef.current.has(l.id) && l.letter === removedLetter);
    if (tile) {
      usedTileIdsRef.current.delete(tile.id);
      setLetterPool((prev) => prev.map((l) => (l.id === tile.id ? { ...l, used: false } : l)));
    }
  };

  const handleNextWord = () => {
    if (gameState !== 'wordComplete' || !advanceLock.acquire()) return;
    const next = wordIndex + 1;
    setWordIndex(next);
    loadWord(next);
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">🔤</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Spelling Quest requires at least 2 vocabulary words to play.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/editor"
              className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all active:scale-95"
            >
              Add Words
            </Link>
            <Link
              to="/games"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
            >
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 max-w-lg mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-purple-300 text-center w-full">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mx-auto mb-4">
            <KeyRound size={36} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Crypt Unlocked!</h2>
          <p className="text-slate-600 text-sm font-bold mb-4">
            You successfully spelled all {TOTAL_WORDS} words with orthographic precision!
          </p>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-6">
            <span className="text-xs uppercase tracking-wider font-black text-purple-700 block mb-1">
              Final Score
            </span>
            <span className="text-3xl font-black text-purple-600">{score} pts</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setWordIndex(0);
                setScore(0);
                loadWord(0);
              }}
              className="flex-1 py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Spell More Words
            </button>
            <Link
              to="/games"
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-sm transition-all active:scale-95 text-center"
            >
              All Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center py-4 px-2 max-w-xl mx-auto w-full">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-4 bg-white/90 p-3 sm:p-4 rounded-2xl border-2 sm:border-4 border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
            <KeyRound size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-slate-800">Spelling Quest</h1>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">
              Word {wordIndex + 1} of {TOTAL_WORDS}
            </span>
          </div>
        </div>
        <span className="font-black text-purple-600 text-base sm:text-lg">{score} pts</span>
      </div>

      {currentWord && (
        <div className="w-full flex flex-col items-center gap-4">
          {/* Audio Pronunciation & Meaning Card */}
          <div className="w-full bg-gradient-to-r from-purple-700 to-indigo-800 rounded-3xl p-5 sm:p-6 text-white text-center shadow-lg">
            <button
              onClick={() => speakWord(currentWord.word)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-2xl text-xs sm:text-sm font-black mb-3 transition-transform active:scale-95 border border-white/20"
              title="Click to hear word pronounced aloud"
            >
              <Volume2 size={18} />
              <span>Hear Pronunciation</span>
            </button>
            <h3 className="text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-widest block mb-1">
              Definition Clue
            </h3>
            <p className="text-sm sm:text-base font-bold max-w-md mx-auto leading-snug">
              "{currentWord.definition}"
            </p>
          </div>

          {/* Letter Slots */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 my-2">
            {(() => {
              let letterIndex = 0;
              return Array.from(currentWord.word.toUpperCase()).map((ch, i) => {
                if (!isLetter(ch)) {
                  // Space / hyphen / apostrophe: shown as-is, no tile needed
                  return (
                    <div key={i} className="w-3 sm:w-4 h-12 sm:h-14 flex items-center justify-center font-black text-xl text-slate-500" aria-hidden="true">
                      {ch.trim()}
                    </div>
                  );
                }
                const filled = spelledLetters[letterIndex++];
                return (
                  <div
                    key={i}
                    className={`w-10 h-12 sm:w-12 sm:h-14 rounded-2xl border-3 flex items-center justify-center font-black text-xl sm:text-2xl shadow-inner ${
                      filled
                        ? 'bg-purple-100 border-purple-500 text-purple-900'
                        : 'bg-white border-dashed border-slate-300 text-transparent'
                    }`}
                  >
                    {filled || '_'}
                  </div>
                );
              });
            })()}
          </div>

          {/* Hint Message */}
          {hintMessage && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse text-center">
              💡 {hintMessage}
            </div>
          )}

          {/* Letter Bank to Tap */}
          {gameState === 'playing' && (
            <div className="w-full bg-white p-4 rounded-3xl border-2 sm:border-4 border-slate-200 shadow-sm flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select next letter in sequence:
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {letterPool.map((item) => (
                  <button
                    key={item.id}
                    disabled={item.used}
                    onClick={() => handleSelectLetter(item)}
                    className={`w-10 h-11 sm:w-12 sm:h-13 rounded-2xl font-black text-lg sm:text-xl border-2 transition-all active:scale-90 ${
                      item.used
                        ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-40'
                        : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800 shadow-xs'
                    }`}
                  >
                    {item.letter}
                  </button>
                ))}
              </div>
              <button
                onClick={handleBackspace}
                disabled={spelledLetters.length === 0}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline disabled:opacity-40"
              >
                ⌫ Undo Last Letter
              </button>
            </div>
          )}

          {/* Word Solved Panel */}
          {gameState === 'wordComplete' && (
            <div className="w-full bg-emerald-50 border-3 border-emerald-400 p-4 rounded-2xl text-center shadow-md">
              <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-base sm:text-lg mb-1">
                <CheckCircle2 size={22} className="text-emerald-600" />
                <span>Word Correctly Spelled!</span>
              </div>
              <p className="text-xs text-emerald-700 font-bold mb-3">
                {currentWord.word}: "{currentWord.definition}"
              </p>
              <button
                onClick={handleNextWord}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Continue to Next Word</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

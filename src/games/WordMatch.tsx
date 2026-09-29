import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Check, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { getRandomWords, shuffleArray } from '../utils/gameUtils';
import { getWordLinguisticProfile } from '../utils/linguisticEngine';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { getGradeConfig } from '../utils/gradeConfig';
import { VocabWord } from '../types';

type MatchMode = 'standard' | 'context' | 'synonyms' | 'mixed';

interface MatchCard {
  id: string; // word id
  text: string;
  sublabel?: string;
  type: 'word' | 'target';
}

export function WordMatch() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, gradeLevel, reduceMotion } = useSettingsStore();
  const config = getGradeConfig(gradeLevel);

  const [matchMode, setMatchMode] = useState<MatchMode>('standard');
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [wordCards, setWordCards] = useState<MatchCard[]>([]);
  const [targetCards, setTargetCards] = useState<MatchCard[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ w: string; t: string } | null>(null);

  const wrongTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);

  const PAIR_COUNT = Math.min(words.length, config.matchPairs || 4);

  useEffect(() => {
    if (words.length >= 2) {
      initGame();
    }
    return () => {
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, [words.length, matchMode]);

  const initGame = () => {
    if (words.length < 2) return;

    const pool = shuffleArray(words);
    const selected: VocabWord[] = [];
    const seenWords = new Set<string>();

    for (const w of pool) {
      const nw = (w.word || '').trim().toLowerCase();
      if (!seenWords.has(nw)) {
        seenWords.add(nw);
        selected.push(w);
        if (selected.length >= PAIR_COUNT) break;
      }
    }

    const wordsSlice = selected.length >= 2 ? selected : getRandomWords(words, Math.min(words.length, PAIR_COUNT));

    const leftCol: MatchCard[] = wordsSlice.map((w) => ({
      id: w.id,
      text: w.word,
      type: 'word',
    }));

    const rightCol: MatchCard[] = wordsSlice.map((w, idx) => {
      const profile = getWordLinguisticProfile(w);
      let text = w.definition;
      let sublabel = 'Definition';

      if (matchMode === 'context') {
        text = profile.clozeSentence.replace('_____', '_____');
        sublabel = 'In-Context Sentence';
      } else if (matchMode === 'synonyms') {
        text = profile.synonyms[0] || w.definition;
        sublabel = 'Synonym';
      } else if (matchMode === 'mixed') {
        if (idx % 2 === 0) {
          text = profile.clozeSentence;
          sublabel = 'Context';
        } else {
          text = w.definition;
          sublabel = 'Meaning';
        }
      }

      return {
        id: w.id,
        text,
        sublabel,
        type: 'target',
      };
    });

    setWordCards(shuffleArray(leftCol));
    setTargetCards(shuffleArray(rightCol));
    setMatchedPairs(new Set());
    setSelectedWord(null);
    setSelectedTarget(null);
    setWrongPair(null);
    setGameState('playing');
  };

  useEffect(() => {
    if (selectedWord && selectedTarget) {
      if (selectedWord === selectedTarget) {
        // Correct Match
        playCorrectSound(soundEnabled);
        haptic.success();
        recordPractice(selectedWord, true, matchMode === 'context' ? 'context' : 'definition');
        recordAnswer(true);

        setMatchedPairs((prev) => {
          const next = new Set(prev).add(selectedWord);
          if (next.size >= wordCards.length && wordCards.length > 0) {
            if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
            finishTimerRef.current = setTimeout(() => {
              setGameState('finished');
              incrementGamesCompleted();
              addCoins(50, 'Completed Word Match');
              addStars(2);
              playWinSound(soundEnabled);
              haptic.win();
              if (!reduceMotion) {
                confetti({ particleCount: 160, spread: 80 });
              }
            }, 500);
          }
          return next;
        });

        setSelectedWord(null);
        setSelectedTarget(null);
      } else {
        // Wrong Match
        playIncorrectSound(soundEnabled);
        haptic.error();
        setWrongPair({ w: selectedWord, t: selectedTarget });
        recordPractice(selectedWord, false);
        recordAnswer(false);

        if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
        wrongTimerRef.current = setTimeout(() => {
          setWrongPair(null);
          setSelectedWord(null);
          setSelectedTarget(null);
        }, 800);
      }
    }
  }, [selectedWord, selectedTarget, wordCards.length]);

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">🧩</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Word Match requires at least 2 vocabulary words to play.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/editor"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all active:scale-95"
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
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-indigo-300 text-center w-full">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <Layers size={36} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Perfect Match!</h2>
          <p className="text-slate-600 text-sm font-bold mb-6">
            All vocabulary pairs were connected with precision!
          </p>
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 mb-6">
            <span className="text-xs uppercase tracking-wider font-black text-indigo-700 block mb-1">
              Match Reward
            </span>
            <span className="text-2xl font-black text-indigo-600">+50 Coins & 2 Stars ⭐</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={initGame}
              className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Play Again
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
    <div className="flex-1 flex flex-col items-center py-4 px-2 max-w-3xl mx-auto w-full">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-3 bg-white/90 p-3 sm:p-4 rounded-2xl border-2 sm:border-4 border-slate-200 shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-slate-800">Word Match</h1>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">
              Matched {matchedPairs.size} of {wordCards.length}
            </span>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['standard', 'context', 'synonyms', 'mixed'] as MatchMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setMatchMode(mode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all capitalize ${
                matchMode === mode
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Matching Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: Vocabulary Words */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Words
          </span>
          {wordCards.map((card) => {
            const isMatched = matchedPairs.has(card.id);
            const isSelected = selectedWord === card.id;
            const isWrong = wrongPair?.w === card.id;

            return (
              <button
                key={card.id}
                disabled={isMatched}
                onClick={() => setSelectedWord(isSelected ? null : card.id)}
                className={`p-4 rounded-2xl font-black text-base sm:text-lg border-2 sm:border-3 text-left transition-all active:scale-[0.98] flex items-center justify-between ${
                  isMatched
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 opacity-60'
                    : isWrong
                    ? 'bg-rose-100 border-rose-400 text-rose-900 animate-shake'
                    : isSelected
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                <span>{card.text}</span>
                {isMatched && <Check size={18} className="text-emerald-600" />}
              </button>
            );
          })}
        </div>

        {/* Right: Targets (Definition / Context / Synonym) */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Matches ({matchMode})
          </span>
          {targetCards.map((card) => {
            const isMatched = matchedPairs.has(card.id);
            const isSelected = selectedTarget === card.id;
            const isWrong = wrongPair?.t === card.id;

            return (
              <button
                key={card.id}
                disabled={isMatched}
                onClick={() => setSelectedTarget(isSelected ? null : card.id)}
                className={`p-3.5 sm:p-4 rounded-2xl font-bold text-xs sm:text-sm border-2 sm:border-3 text-left transition-all active:scale-[0.98] flex flex-col gap-1 leading-snug ${
                  isMatched
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 opacity-60'
                    : isWrong
                    ? 'bg-rose-100 border-rose-400 text-rose-900 animate-shake'
                    : isSelected
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
                }`}
              >
                {card.sublabel && (
                  <span className="text-[10px] uppercase font-black tracking-wider text-indigo-500">
                    {card.sublabel}
                  </span>
                )}
                <span>"{card.text}"</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { getRandomWords, shuffleArray } from '../utils/gameUtils';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { useSettingsStore } from '../store/useSettingsStore';
import { getGradeConfig } from '../utils/gradeConfig';

export function WordMatch() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, gradeLevel, reduceMotion } = useSettingsStore();
  const config = getGradeConfig(gradeLevel);
  
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [wordCards, setWordCards] = useState<any[]>([]);
  const [defCards, setDefCards] = useState<any[]>([]);
  
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{w: string, d: string} | null>(null);
  const wrongTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [targetPairsCount, setTargetPairsCount] = useState(config.matchPairs);

  const initGame = () => {
    if (words.length < 2) return;
    const maxTarget = config.matchPairs || 4;
    const pool = shuffleArray(words);
    const seenWords = new Set<string>();
    const seenDefs = new Set<string>();
    const selected: typeof words = [];

    for (const w of pool) {
      const nw = (w.word || '').trim().toLowerCase();
      const nd = (w.definition || '').trim().toLowerCase();
      if (!nw || !nd) continue;
      if (!seenWords.has(nw) && !seenDefs.has(nd)) {
        seenWords.add(nw);
        seenDefs.add(nd);
        selected.push(w);
        if (selected.length >= maxTarget) break;
      }
    }

    const finalSelected = selected.length >= 2 ? selected : getRandomWords(words, Math.min(words.length, maxTarget));
    setTargetPairsCount(finalSelected.length);
    setWordCards(shuffleArray([...finalSelected]));
    setDefCards(shuffleArray([...finalSelected]));
    setMatchedPairs(new Set());
    setSelectedWord(null);
    setSelectedDef(null);
    setWrongPair(null);
    setGameState('playing');
  };

  useEffect(() => {
    if (words.length >= 2 && wordCards.length === 0) {
      initGame();
    }
    return () => {
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, [words.length, wordCards.length]);

  useEffect(() => {
    if (selectedWord && selectedDef) {
      if (selectedWord === selectedDef) {
        // Match!
        playCorrectSound(soundEnabled);
        haptic.success();
        setMatchedPairs(prev => {
          const next = new Set(prev).add(selectedWord);
          if (next.size >= targetPairsCount && targetPairsCount > 0) {
            if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
            finishTimerRef.current = setTimeout(() => {
              setGameState('finished');
              incrementGamesCompleted();
              addCoins(50);
              addStars(2);
              playWinSound(soundEnabled);
              haptic.win();
              if (!reduceMotion) {
                confetti({ particleCount: 200, spread: 100 });
              }
            }, 500);
          }
          return next;
        });
        recordPractice(selectedWord, true);
        recordAnswer(true);
        setSelectedWord(null);
        setSelectedDef(null);
      } else {
        // Wrong match
        playIncorrectSound(soundEnabled);
        haptic.error();
        setWrongPair({ w: selectedWord, d: selectedDef });
        recordPractice(selectedWord, false);
        recordAnswer(false);
        if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
        wrongTimerRef.current = setTimeout(() => {
          setWrongPair(null);
          setSelectedWord(null);
          setSelectedDef(null);
        }, 800);
      }
    }
  }, [selectedWord, selectedDef, targetPairsCount]);

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">🧩</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Connect the Blocks requires at least 2 vocabulary words to play.
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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-6 p-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-indigo-300 text-center max-w-md w-full">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">Perfect Match!</h2>
          <div className="flex flex-col gap-3 mt-6 sm:mt-8">
            <button
              onClick={() => {
                haptic.medium();
                initGame();
              }}
              className="bg-indigo-500 border-b-4 sm:border-b-8 border-indigo-700 text-white font-black p-3.5 sm:p-4 rounded-xl active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all text-sm sm:text-base"
            >
              Play Again
            </button>
            <Link
              to="/games"
              className="bg-slate-200 border-b-4 sm:border-b-8 border-slate-300 text-slate-600 font-black p-3.5 sm:p-4 rounded-xl active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all block text-sm sm:text-base text-center"
            >
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-2.5 sm:p-4 w-full max-w-4xl mx-auto h-full">
      <div className="text-center mb-3 sm:mb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight">
          Connect the Blocks
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-bold">
          Tap a word, then tap its meaning!
        </p>
      </div>

      <div className="w-full flex-1 flex flex-col gap-2.5 sm:gap-3.5 justify-center max-w-4xl mx-auto">
        {/* Column Headers */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full text-center px-1">
          <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Word
          </div>
          <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Definition
          </div>
        </div>

        {/* Aligned Rows */}
        {wordCards.map((w, index) => {
          const d = defCards[index];
          const isWordMatched = matchedPairs.has(w.id);
          const isWordSelected = selectedWord === w.id;
          const isWordWrong = wrongPair?.w === w.id;

          let wordClasses =
            'bg-white border-b-4 sm:border-b-8 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer';
          if (isWordMatched)
            wordClasses =
              'bg-emerald-100 border-emerald-300 text-emerald-700 opacity-50 scale-95 border-b-2 sm:border-b-4 pointer-events-none';
          else if (isWordWrong)
            wordClasses = 'bg-rose-100 border-rose-400 text-rose-700 animate-pulse';
          else if (isWordSelected)
            wordClasses =
              'bg-indigo-100 border-indigo-500 border-b-2 sm:border-b-4 translate-y-0.5 sm:translate-y-1 text-indigo-800 ring-2 sm:ring-4 ring-indigo-300';

          const isDefMatched = d ? matchedPairs.has(d.id) : false;
          const isDefSelected = d ? selectedDef === d.id : false;
          const isDefWrong = d ? wrongPair?.d === d.id : false;

          let defClasses =
            'bg-white border-b-4 sm:border-b-8 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer';
          if (isDefMatched)
            defClasses =
              'bg-emerald-100 border-emerald-300 text-emerald-700 opacity-50 scale-95 border-b-2 sm:border-b-4 pointer-events-none';
          else if (isDefWrong)
            defClasses = 'bg-rose-100 border-rose-400 text-rose-700 animate-pulse';
          else if (isDefSelected)
            defClasses =
              'bg-indigo-100 border-indigo-500 border-b-2 sm:border-b-4 translate-y-0.5 sm:translate-y-1 text-indigo-800 ring-2 sm:ring-4 ring-indigo-300';

          return (
            <div key={`pair-row-${w.id}-${d?.id || index}`} className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full items-stretch">
              {/* Word Box */}
              <button
                type="button"
                key={`w-${w.id}`}
                onClick={() => !wrongPair && !isWordMatched && setSelectedWord(w.id)}
                className={`w-full min-h-[68px] sm:min-h-[82px] p-3 sm:p-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-lg transition-all border-x-2 sm:border-x-4 border-t-2 sm:border-t-4 flex justify-between items-center break-words text-left shadow-xs ${wordClasses}`}
              >
                <span className="break-words line-clamp-2 mr-1">{w.word}</span>
                {isWordMatched && <Check size={18} className="shrink-0 text-emerald-600 sm:w-5 sm:h-5 ml-1" />}
              </button>

              {/* Definition Box */}
              {d && (
                <button
                  type="button"
                  key={`d-${d.id}`}
                  onClick={() => !wrongPair && !isDefMatched && setSelectedDef(d.id)}
                  className={`w-full min-h-[68px] sm:min-h-[82px] p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base transition-all border-x-2 sm:border-x-4 border-t-2 sm:border-t-4 text-left leading-tight sm:leading-snug break-words flex items-center shadow-xs ${defClasses}`}
                >
                  <span className="line-clamp-3">{d.definition}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

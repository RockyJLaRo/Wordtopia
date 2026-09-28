import { useState, useEffect, useRef } from 'react';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { getWeightedRandomWords, getDistractors, shuffleArray } from '../utils/gameUtils';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Blocks, Hammer } from 'lucide-react';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { useSettingsStore } from '../store/useSettingsStore';
import { getGradeConfig } from '../utils/gradeConfig';

export function VocabularyBuilder() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, gradeLevel, reduceMotion } = useSettingsStore();
  const config = getGradeConfig(gradeLevel);
  
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [buildLevel, setBuildLevel] = useState(0);
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [isWrong, setIsWrong] = useState(false);
  const [score, setScore] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const TOTAL_LEVELS = 5;

  useEffect(() => {
    if (words.length >= 2 && currentWord === null) {
      loadNextQuestion(0);
    }
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [words.length, currentWord]);

  const loadNextQuestion = (targetLevel?: number) => {
    const level = typeof targetLevel === 'number' ? targetLevel : buildLevel;
    if (level >= TOTAL_LEVELS) {
      setGameState('finished');
      incrementGamesCompleted();
      playWinSound(soundEnabled);
      haptic.win();
      if (!reduceMotion) {
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
      }
      return;
    }

    const nextWord = getWeightedRandomWords(words, 1)[0];
    const numOptions = Math.min(words.length - 1, config.answerChoices - 1);
    const distractors = getDistractors(words, nextWord, numOptions);
    
    const allOptions = shuffleArray([...distractors, nextWord]);
    
    setCurrentWord(nextWord);
    setOptions(allOptions);
    setIsWrong(false);
    setIsAdvancing(false);
  };

  const handleAnswer = (option: any) => {
    if (isAdvancing || gameState !== 'playing') return;
    const correct = option.id === currentWord.id;
    
    if (correct) {
      setIsAdvancing(true);
      playCorrectSound(soundEnabled);
      haptic.success();
      setIsWrong(false);
      const nextLevel = buildLevel + 1;
      setBuildLevel(nextLevel);
      setScore(s => s + 100);
      addCoins(20);
      addStars(1);
      recordPractice(currentWord.id, !isWrong);
      recordAnswer(!isWrong);
      
      if (nextLevel >= TOTAL_LEVELS) {
        setGameState('finished');
        incrementGamesCompleted();
        playWinSound(soundEnabled);
        haptic.win();
        if (!reduceMotion) {
          confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
        }
        setIsAdvancing(false);
        return;
      }

      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        loadNextQuestion(nextLevel);
      }, 700);
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
      setIsWrong(true);
      recordPractice(currentWord.id, false);
      recordAnswer(false);
    }
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">🧱</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Vocabulary Builder requires at least 2 vocabulary words to play.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/editor"
              className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all active:scale-95"
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
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-pink-300 text-center max-w-md w-full">
          <Blocks size={56} className="mx-auto text-pink-500 mb-3 sm:w-16 sm:h-16" />
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">Master Builder!</h2>
          <p className="text-lg sm:text-xl font-bold text-pink-500 mb-6">Score: {score}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                haptic.medium();
                setBuildLevel(0);
                setScore(0);
                setGameState('playing');
                loadNextQuestion();
              }}
              className="bg-pink-500 border-b-4 sm:border-b-8 border-pink-700 text-white font-black p-3.5 sm:p-4 rounded-xl active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all text-sm sm:text-base"
            >
              Build Again
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

  // Generate building blocks based on buildLevel
  const blocks = [];
  for (let i = 0; i < TOTAL_LEVELS; i++) {
    blocks.push(
      <div
        key={i}
        className={`w-full h-7 sm:h-9 md:h-10 rounded-lg border-2 sm:border-4 transition-all duration-500 flex items-center justify-center font-black text-[10px] sm:text-xs md:text-sm ${
          i < buildLevel
            ? 'bg-pink-500 border-pink-700 text-white scale-100 opacity-100'
            : 'bg-slate-100 border-slate-200 text-slate-300 scale-95 opacity-50'
        }`}
      >
        {i < buildLevel ? 'SOLID FOUNDATION' : 'NEEDS BLOCK'}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-2.5 sm:p-4 w-full max-w-2xl mx-auto h-full min-h-0">
      <div className="w-full flex justify-between items-center bg-white/90 p-3 sm:p-4 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 mb-3 sm:mb-4">
        <span className="font-black text-slate-600 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
          <Hammer size={18} className="sm:w-5 sm:h-5 text-pink-500" /> Level {buildLevel + 1}
        </span>
        <span className="font-black text-pink-500 text-base sm:text-xl">{score} pts</span>
      </div>

      <div className="w-full flex flex-col justify-end gap-1.5 sm:gap-2 mb-4 sm:mb-6 px-3 sm:px-8">
        {/* Render blocks in reverse so they stack upwards */}
        {[...blocks].reverse()}
      </div>

      <div className="bg-white w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-4 sm:border-8 border-pink-300 text-center mb-3 sm:mb-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 break-words">
          {currentWord?.word}
        </h2>
        {isWrong && (
          <p className="text-rose-500 font-bold mt-1 sm:mt-2 text-xs sm:text-sm animate-bounce">
            That block doesn't fit! Try another.
          </p>
        )}
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt)}
            className="bg-white border-b-4 sm:border-b-8 border-slate-300 text-slate-700 hover:bg-slate-50 border-t-2 sm:border-t-4 border-x-2 sm:border-x-4 p-3 sm:p-4 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all active:border-b-0 active:translate-y-1 sm:active:translate-y-2 text-left leading-snug break-words"
          >
            {opt.definition}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { getWeightedRandomWords, getDistractors, shuffleArray } from '../utils/gameUtils';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { Search, HelpCircle, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { useSettingsStore } from '../store/useSettingsStore';
import { getGradeConfig } from '../utils/gradeConfig';

export function WordDetective() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, gradeLevel, reduceMotion } = useSettingsStore();
  const config = getGradeConfig(gradeLevel);
  
  const [gameState, setGameState] = useState<'playing' | 'feedback' | 'finished'>('playing');
  const [questionCount, setQuestionCount] = useState(0);
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(config.hintsAllowed);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const TOTAL_QUESTIONS = 5;
  // Ensure we can actually generate enough options based on vocab size
  const currentOptionsCount = Math.min(words.length, config.answerChoices);

  useEffect(() => {
    if (words.length >= 2 && currentWord === null) {
      loadNextQuestion(0);
    }
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [words.length, currentWord]);

  const advanceToNextQuestion = () => {
    if (gameState !== 'feedback') return;
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    const nextCount = questionCount + 1;
    if (nextCount >= TOTAL_QUESTIONS) {
      setQuestionCount(TOTAL_QUESTIONS);
      setGameState('finished');
      incrementGamesCompleted();
      playWinSound(soundEnabled);
      haptic.win();
      if (!reduceMotion) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
      return;
    }
    setQuestionCount(nextCount);
    loadNextQuestion(nextCount);
  };

  const loadNextQuestion = (nextCountOverride?: number) => {
    const currentCount = typeof nextCountOverride === 'number' ? nextCountOverride : questionCount;
    if (currentCount >= TOTAL_QUESTIONS) {
      setQuestionCount(TOTAL_QUESTIONS);
      setGameState('finished');
      incrementGamesCompleted();
      playWinSound(soundEnabled);
      haptic.win();
      if (!reduceMotion) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
      return;
    }

    const nextWord = getWeightedRandomWords(words, 1)[0];
    const numOptions = Math.min(words.length - 1, config.answerChoices - 1);
    const distractors = getDistractors(words, nextWord, numOptions);
    
    const allOptions = shuffleArray([...distractors, nextWord]);
    
    setCurrentWord(nextWord);
    setOptions(allOptions.map(o => ({ ...o, disabled: false })));
    setAttempts(0);
    setHintsRemaining(config.hintsAllowed);
    setGameState('playing');
  };

  const useHint = () => {
    if (hintsRemaining <= 0 || gameState !== 'playing') return;
    haptic.medium();
    setHintsRemaining(prev => prev - 1);
    
    const wrongOptions = options.filter(o => o.id !== currentWord.id && !o.disabled);
    if (wrongOptions.length > 0) {
      const toDisable = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      setOptions(prev => prev.map(o => o.id === toDisable.id ? { ...o, disabled: true } : o));
    }
  };

  const handleAnswer = (option: any) => {
    if (gameState !== 'playing' || option.disabled) return;
    
    const correct = option.id === currentWord.id;
    
    if (correct) {
      playCorrectSound(soundEnabled);
      haptic.success();
      setIsCorrect(true);
      setGameState('feedback');
      recordPractice(currentWord.id, attempts === 0); 
      recordAnswer(attempts === 0);
      
      const points = attempts === 0 ? 100 : attempts === 1 ? 50 : 25;
      setScore(s => s + points);
      addCoins(points / 5);
      if (attempts === 0) addStars(1);

      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        advanceToNextQuestion();
      }, 2000);
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
      setAttempts(prev => prev + 1);
      setOptions(prev => prev.map(o => o.id === option.id ? { ...o, disabled: true } : o));
    }
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Word Detective requires at least 2 vocabulary words to play.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/editor"
              className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all active:scale-95"
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
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-teal-300 text-center max-w-md w-full">
          <Search size={44} className="mx-auto text-teal-500 mb-3 sm:w-12 sm:h-12" />
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">Case Closed!</h2>
          <p className="text-lg sm:text-xl font-bold text-teal-600 mb-6">Detective Score: {score}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setQuestionCount(0);
                setScore(0);
                loadNextQuestion(0);
              }}
              className="bg-teal-500 border-b-4 sm:border-b-8 border-teal-700 text-white font-black p-3.5 sm:p-4 rounded-xl active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all text-sm sm:text-base"
            >
              Solve Another Case
            </button>
            <Link
              to="/games"
              className="bg-slate-200 border-b-4 sm:border-b-8 border-slate-300 text-slate-600 font-black p-3.5 sm:p-4 rounded-xl active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all block text-center text-sm sm:text-base"
            >
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        if (gameState === 'feedback') {
          advanceToNextQuestion();
        }
      }}
      className={`flex-1 flex flex-col items-center p-2.5 sm:p-4 w-full max-w-2xl mx-auto ${
        gameState === 'feedback' ? 'cursor-pointer' : ''
      }`}
    >
      <div className="w-full flex justify-between items-center bg-white/90 p-3 sm:p-4 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 mb-3 sm:mb-6">
        <div className="flex items-center gap-2 text-teal-600 font-black text-xs sm:text-base">
          <Search size={20} className="sm:w-6 sm:h-6" /> CASE {Math.min(questionCount + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}
        </div>
        <span className="font-black text-slate-500 text-base sm:text-xl">{score} pts</span>
      </div>

      <div className="bg-teal-50 w-full p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-md border-4 sm:border-8 border-teal-300 text-center mb-4 sm:mb-8 relative overflow-hidden">
        {hintsRemaining > 0 && gameState === 'playing' && (
          <button
            onClick={useHint}
            className="absolute top-2 right-2 sm:-top-1 sm:-right-1 bg-yellow-400 text-yellow-900 border-b-2 sm:border-b-4 border-yellow-600 p-2 sm:p-3 rounded-full hover:bg-yellow-300 active:translate-y-1 active:border-b-0 transition-all shadow-lg z-20 group"
          >
            <Lightbulb size={20} className="group-hover:animate-pulse sm:w-6 sm:h-6" />
          </button>
        )}
        <div className="absolute -top-4 -left-4 text-teal-200 opacity-40 rotate-12 pointer-events-none">
          <Search size={80} className="sm:w-24 sm:h-24" />
        </div>
        <p className="text-teal-600 font-black uppercase tracking-widest mb-2 sm:mb-4 relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <HelpCircle size={18} /> CLUE
        </p>
        <p className="text-lg sm:text-2xl md:text-3xl font-black text-slate-800 relative z-10 leading-snug break-words">
          "{currentWord?.definition}"
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 w-full">
        {options.map((opt, i) => {
          if (opt.disabled) {
            return (
              <div
                key={i}
                className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-xl bg-slate-100 border-2 sm:border-4 border-slate-200 text-slate-400 opacity-50 flex justify-between items-center"
              >
                <span className="line-through truncate mr-2">{opt.word}</span>
                <XCircle size={20} className="shrink-0" />
              </div>
            );
          }

          let btnClass =
            'bg-white border-b-4 sm:border-b-8 border-slate-300 text-slate-700 hover:bg-slate-50 border-t-2 sm:border-t-4 border-x-2 sm:border-x-4';
          if (gameState === 'feedback' && opt.id === currentWord.id) {
            btnClass =
              'bg-emerald-100 border-emerald-400 text-emerald-800 border-b-2 sm:border-b-4 translate-y-0.5 sm:translate-y-1';
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (gameState === 'feedback') {
                  advanceToNextQuestion();
                } else if (gameState === 'playing') {
                  handleAnswer(opt);
                }
              }}
              className={`p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-xl transition-all active:border-b-0 active:translate-y-1 sm:active:translate-y-2 flex justify-between items-center ${btnClass}`}
            >
              <span className="truncate mr-2">{opt.word}</span>
              {gameState === 'feedback' && opt.id === currentWord.id && (
                <CheckCircle2 size={20} className="shrink-0 sm:w-6 sm:h-6" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback & Tap to Advance */}
      {gameState === 'feedback' && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-emerald-600 font-black text-base sm:text-lg animate-bounce">
            Case Solved! +Points Earned
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              advanceToNextQuestion();
            }}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-md animate-pulse flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
          >
            <span>Next Case ➔</span>
            <span className="text-[10px] opacity-80 font-normal">(Tap anywhere to advance)</span>
          </button>
        </div>
      )}

      {attempts > 0 && gameState === 'playing' && (
        <p className="mt-4 sm:mt-6 text-rose-500 font-bold text-xs sm:text-sm animate-pulse text-center">
          Not quite... try another clue!
        </p>
      )}
    </div>
  );
}

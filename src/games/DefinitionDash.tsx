import { useState, useEffect, useRef } from 'react';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { getWeightedRandomWords, getDistractors, shuffleArray } from '../utils/gameUtils';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { useSettingsStore } from '../store/useSettingsStore';
import { getGradeConfig } from '../utils/gradeConfig';
import { Lightbulb, Timer } from 'lucide-react';

export function DefinitionDash() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, gradeLevel, reduceMotion } = useSettingsStore();
  const config = getGradeConfig(gradeLevel);
  
  const [gameState, setGameState] = useState<'playing' | 'feedback' | 'finished'>('playing');
  const [questionCount, setQuestionCount] = useState(0);
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timerSeconds);
  const [hintsRemaining, setHintsRemaining] = useState(config.hintsAllowed);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const TOTAL_QUESTIONS = 5;

  useEffect(() => {
    if (words.length >= 2 && currentWord === null) {
      loadNextQuestion(0);
    }
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [words.length, currentWord]);

  useEffect(() => {
    if (gameState !== 'playing' || !config.hasTimer) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, currentWord]);

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
    setGameState('playing');
    setSelectedAnswer(null);
    setTimeLeft(config.timerSeconds);
    setHintsRemaining(config.hintsAllowed);
  };

  const handleTimeout = () => {
    if (gameState !== 'playing') return;
    setIsCorrect(false);
    setGameState('feedback');
    playIncorrectSound(soundEnabled);
    haptic.error();
    recordPractice(currentWord.id, false);
    recordAnswer(false);
    
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      advanceToNextQuestion();
    }, 2000);
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
    setIsCorrect(correct);
    setSelectedAnswer(option);
    setGameState('feedback');
    
    recordPractice(currentWord.id, correct);
    recordAnswer(correct);
    
    if (correct) {
      playCorrectSound(soundEnabled);
      haptic.success();
      setScore(s => s + 100 + (config.hasTimer ? timeLeft : 0));
      addCoins(10);
      addStars(1);
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
    }

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      advanceToNextQuestion();
    }, 2000);
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Definition Dash requires at least 2 vocabulary words to play.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/editor"
              className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all active:scale-95"
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
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-sky-300 text-center max-w-md w-full">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2">Level Complete!</h2>
          <p className="text-lg sm:text-xl font-bold text-sky-500 mb-6">Score: {score}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setQuestionCount(0);
                setScore(0);
                loadNextQuestion(0);
              }}
              className="bg-emerald-500 border-b-4 sm:border-b-8 border-emerald-700 text-white font-black p-3.5 sm:p-4 rounded-xl active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all text-sm sm:text-base"
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
    <div
      onClick={() => {
        if (gameState === 'feedback') {
          advanceToNextQuestion();
        }
      }}
      className={`flex-1 flex flex-col items-center justify-center p-2.5 sm:p-4 w-full max-w-2xl mx-auto ${
        gameState === 'feedback' ? 'cursor-pointer' : ''
      }`}
    >
      {/* HUD */}
      <div className="w-full flex justify-between items-center bg-white/90 p-3 sm:p-4 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 mb-3 sm:mb-4">
        <span className="font-black text-slate-500 text-xs sm:text-sm">
          Q: {Math.min(questionCount + 1, TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS}
        </span>
        {config.hasTimer && (
          <div className="flex items-center gap-1.5 sm:gap-2 font-black text-orange-500 text-xs sm:text-sm">
            <Timer size={18} className={timeLeft <= 5 ? 'animate-ping' : ''} /> {timeLeft}s
          </div>
        )}
        <span className="font-black text-sky-500 text-base sm:text-xl">{score} pts</span>
      </div>

      {config.hasTimer && (
        <div className="w-full h-3 sm:h-4 bg-slate-200 rounded-full mb-4 sm:mb-6 overflow-hidden">
          <div
            className="h-full bg-orange-400 transition-all duration-1000 linear"
            style={{ width: `${(timeLeft / config.timerSeconds) * 100}%` }}
          ></div>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white w-full p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-md border-4 sm:border-8 border-orange-300 text-center mb-4 sm:mb-6 relative">
        {hintsRemaining > 0 && gameState === 'playing' && (
          <button
            onClick={useHint}
            className="absolute top-2 right-2 sm:-top-4 sm:-right-4 bg-yellow-400 text-yellow-900 border-b-2 sm:border-b-4 border-yellow-600 p-2 sm:p-3 rounded-full hover:bg-yellow-300 active:translate-y-1 active:border-b-0 transition-all shadow-lg group"
          >
            <Lightbulb size={20} className="group-hover:animate-pulse sm:w-6 sm:h-6" />
          </button>
        )}
        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs sm:text-sm mb-1 sm:mb-2">
          What does this mean?
        </p>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-800 break-words">
          {currentWord?.word}
        </h2>
      </div>

      {/* Answers */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
        {options.map((opt, i) => {
          if (opt.disabled) {
            return (
              <div
                key={i}
                className="p-3 sm:p-5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base text-slate-300 bg-slate-100 border-2 sm:border-4 border-slate-200 text-left line-through"
              >
                {opt.definition}
              </div>
            );
          }

          let btnClass =
            'bg-white border-b-4 sm:border-b-8 border-slate-300 text-slate-700 hover:bg-slate-50';
          if (gameState === 'feedback') {
            if (opt.id === currentWord.id)
              btnClass =
                'bg-emerald-100 border-emerald-400 text-emerald-800 border-b-2 sm:border-b-4 translate-y-0.5 sm:translate-y-1';
            else if (opt.id === selectedAnswer?.id)
              btnClass =
                'bg-rose-100 border-rose-400 text-rose-800 border-b-2 sm:border-b-4 translate-y-0.5 sm:translate-y-1 opacity-80';
            else btnClass = 'bg-white border-slate-200 text-slate-400 opacity-50';
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
              className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base text-left transition-all active:border-b-0 active:translate-y-1 sm:active:translate-y-2 border-x-2 sm:border-x-4 border-t-2 sm:border-t-4 leading-snug break-words ${btnClass}`}
            >
              {opt.definition}
            </button>
          );
        })}
      </div>

      {/* Feedback Message & Tap to Advance */}
      <div
        className={`mt-4 sm:mt-6 flex flex-col items-center justify-center gap-2 transition-opacity ${
          gameState === 'feedback' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <span className="bg-emerald-500 text-white font-black px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-base sm:text-xl animate-bounce">
              + Awesome!
            </span>
          ) : (
            <span className="bg-rose-500 text-white font-black px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-sm sm:text-xl">
              Let's try again next time!
            </span>
          )}
        </div>
        {gameState === 'feedback' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              advanceToNextQuestion();
            }}
            className="mt-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-xl text-xs sm:text-sm shadow-md animate-pulse flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            <span>Next Question ➔</span>
            <span className="text-[10px] opacity-90 font-normal">(Tap anywhere to advance)</span>
          </button>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { getWeightedRandomWords, getDistractors, shuffleArray } from '../utils/gameUtils';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { getGradeConfig } from '../utils/gradeConfig';
import { Zap, Timer, Brain, Award, ArrowRight } from 'lucide-react';
import { GradeLevel } from '../types';

const getSpeedConfig = (grade: GradeLevel) => {
  switch (grade) {
    case 'Kindergarten':
    case '1st Grade':
      return { baseTimeMs: 20000, maxBonus: 100 };
    case '2nd Grade':
    case '3rd Grade':
      return { baseTimeMs: 15000, maxBonus: 250 };
    case '4th Grade':
    case '5th Grade':
      return { baseTimeMs: 10000, maxBonus: 500 };
    case '6th Grade':
    case '7th Grade':
    case '8th Grade':
      return { baseTimeMs: 7000, maxBonus: 750 };
    case '9th Grade':
    case '10th Grade':
    case '11th Grade':
    case '12th Grade':
    case 'Custom':
      return { baseTimeMs: 5000, maxBonus: 1000 };
    default:
      return { baseTimeMs: 10000, maxBonus: 500 };
  }
};

export function SpeedChallenge() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted, speedChallengePB, setSpeedChallengePB } = useProgressStore();
  const { soundEnabled, gradeLevel, reduceMotion } = useSettingsStore();
  
  const speedConfig = getSpeedConfig(gradeLevel);
  const gradeConfig = getGradeConfig(gradeLevel);
  // If timer is globally off, or reduceMotion is on, give tons of time and standard bonus
  const timeLimitMs = (gradeConfig.hasTimer === false || reduceMotion) ? 60000 : speedConfig.baseTimeMs;
  const maxBonus = speedConfig.maxBonus;

  const TOTAL_QUESTIONS = 10;
  const BASE_POINTS = 100;

  const [isZenMode, setIsZenMode] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'feedback' | 'finished'>('playing');
  const gameStateRef = useRef<'playing' | 'feedback' | 'finished'>('playing');
  gameStateRef.current = gameState;
  const [questionCount, setQuestionCount] = useState(0);
  
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [promptMode, setPromptMode] = useState<'wordToDef' | 'defToWord'>('wordToDef');
  const [options, setOptions] = useState<any[]>([]);
  
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [fastestAnswer, setFastestAnswer] = useState<number>(999999);
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const [totalSpeedBonus, setTotalSpeedBonus] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Current question tracking
  const [startTime, setStartTime] = useState<number>(0);
  const [timeRemainingPercent, setTimeRemainingPercent] = useState(100);
  
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    points: number;
    bonus: number;
    streakBonus: number;
    timeMs: number;
  } | null>(null);

  const animationRef = useRef<number>();
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (words.length >= 2 && currentWord === null) {
      loadNextQuestion(0);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
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
      finishGame();
      return;
    }
    setQuestionCount(nextCount);
    loadNextQuestion(nextCount);
  };

  const handleTimeout = () => {
    if (gameStateRef.current !== 'playing' || !currentWord) return;
    gameStateRef.current = 'feedback';
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (questionTimeoutRef.current) {
      clearTimeout(questionTimeoutRef.current);
      questionTimeoutRef.current = null;
    }

    recordPractice(currentWord.id, false);
    recordAnswer(false);
    playIncorrectSound(soundEnabled);
    haptic.error();
    setCurrentStreak(0);
    setTimeRemainingPercent(0);

    setFeedback({
      correct: false,
      points: 0,
      bonus: 0,
      streakBonus: 0,
      timeMs: timeLimitMs,
    });

    setGameState('feedback');

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      advanceToNextQuestion();
    }, 2500);
  };

  const loadNextQuestion = (nextCountOverride?: number) => {
    const currentCount = typeof nextCountOverride === 'number' ? nextCountOverride : questionCount;
    if (currentCount >= TOTAL_QUESTIONS) {
      setQuestionCount(TOTAL_QUESTIONS);
      finishGame();
      return;
    }

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);

    const nextWord = getWeightedRandomWords(words, 1)[0];
    const numOptions = Math.min(words.length - 1, gradeConfig.answerChoices - 1);
    const distractors = getDistractors(words, nextWord, numOptions);
    const allOptions = shuffleArray([...distractors, nextWord]);
    
    const chosenPromptMode = Math.random() > 0.5 ? 'defToWord' : 'wordToDef';
    setPromptMode(chosenPromptMode);
    setCurrentWord(nextWord);
    setOptions(allOptions);
    setGameState('playing');
    setFeedback(null);
    setStartTime(performance.now());
    setTimeRemainingPercent(100);

    // Timeout fallback only when not in Zen Mode
    if (!isZenMode) {
      questionTimeoutRef.current = setTimeout(() => {
        handleTimeout();
      }, timeLimitMs);
      
      // Smooth progress bar animation
      if (!reduceMotion) {
        const start = performance.now();
        const animate = (now: number) => {
          const elapsed = now - start;
          const remaining = Math.max(0, 100 - (elapsed / timeLimitMs) * 100);
          setTimeRemainingPercent(remaining);
          if (remaining <= 0) {
            handleTimeout();
          } else if (gameState === 'playing') {
            animationRef.current = requestAnimationFrame(animate);
          }
        };
        animationRef.current = requestAnimationFrame(animate);
      }
    }
  };

  const finishGame = () => {
    setGameState('finished');
    incrementGamesCompleted();
    
    // Add rewards
    addCoins(Math.floor(score / 50));
    addStars(Math.floor(score / 200));
    
    if (!speedChallengePB || score > speedChallengePB) {
      setSpeedChallengePB(score);
    }

    playWinSound(soundEnabled);
    haptic.win();
    if (!reduceMotion) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleAnswer = (selectedWord: any) => {
    if (gameStateRef.current !== 'playing') return;
    gameStateRef.current = 'feedback';
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (questionTimeoutRef.current) {
      clearTimeout(questionTimeoutRef.current);
      questionTimeoutRef.current = null;
    }

    const endTime = performance.now();
    const timeMs = endTime - startTime;
    const isCorrect = selectedWord.id === currentWord.id;

    recordPractice(currentWord.id, isCorrect, 'recognition');
    recordAnswer(isCorrect);

    if (isCorrect) {
      playCorrectSound(soundEnabled);
      const newStreak = currentStreak + 1;
      if (newStreak >= 3) {
        haptic.streak();
      } else {
        haptic.success();
      }
      setCurrentStreak(newStreak);
      setBestStreak(Math.max(bestStreak, newStreak));
      setTotalCorrect(prev => prev + 1);
      
      setFastestAnswer(prev => Math.min(prev, timeMs));
      setTotalResponseTime(prev => prev + timeMs);

      // Calculate speed & streak bonus
      const timeRatio = isZenMode ? 1 : Math.max(0, timeLimitMs - timeMs) / timeLimitMs;
      const speedBonus = isZenMode ? 20 : Math.floor(timeRatio * maxBonus);
      const streakBonus = newStreak > 2 ? (newStreak * 15) : 0;
      
      const totalPoints = BASE_POINTS + speedBonus + streakBonus;
      setScore(prev => prev + totalPoints);
      setTotalSpeedBonus(prev => prev + speedBonus);

      setFeedback({
        correct: true,
        points: BASE_POINTS,
        bonus: speedBonus,
        streakBonus,
        timeMs
      });
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
      setCurrentStreak(0);
      setFeedback({
        correct: false,
        points: 0,
        bonus: 0,
        streakBonus: 0,
        timeMs
      });
    }

    setGameState('feedback');
    
    // Auto-advance with tap-to-skip support
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      advanceToNextQuestion();
    }, isCorrect ? 1200 : 2500);
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Brain className="w-24 h-24 text-slate-300 mb-6" />
        <h2 className="text-3xl font-black text-slate-800 mb-4">Need More Words!</h2>
        <p className="text-xl text-slate-600 mb-8 max-w-md">
          You need at least 2 words in your vocabulary list to play Speed Challenge.
        </p>
        <Link to="/editor" className="bg-sky-500 text-white px-8 py-4 rounded-2xl font-bold text-xl hover:bg-sky-600 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1">
          Add Words
        </Link>
      </div>
    );
  }

  if (gameState === 'finished') {
    const isNewPB = !speedChallengePB || score > speedChallengePB;
    const avgTime = totalCorrect > 0 ? (totalResponseTime / totalCorrect / 1000).toFixed(2) : "0.00";
    const fastestStr = fastestAnswer < 999999 ? (fastestAnswer / 1000).toFixed(2) : "0.00";
    const accuracy = Math.round((totalCorrect / TOTAL_QUESTIONS) * 100);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-12 border-2 sm:border-4 border-slate-200 shadow-xl w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-sky-100 to-transparent"></div>

          <div className="relative z-10">
            <Zap className="w-16 h-16 sm:w-24 sm:h-24 text-amber-400 mx-auto mb-4 sm:mb-6 drop-shadow-md" />
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">
              Speed Challenge Complete!
            </h2>
            <p className="text-sm sm:text-lg md:text-xl text-slate-600 font-bold mb-6 sm:mb-8">
              Awesome! You answered {totalCorrect} out of {TOTAL_QUESTIONS} correctly!
            </p>

            {isNewPB && totalCorrect > 0 && (
              <div className="bg-yellow-100 border-2 sm:border-4 border-yellow-300 rounded-2xl p-3 sm:p-4 inline-block mb-6 sm:mb-8 animate-bounce">
                <div className="flex items-center gap-2 text-yellow-700 font-black text-lg sm:text-2xl">
                  <Award className="fill-yellow-500 w-5 h-5 sm:w-7 sm:h-7" />
                  New Personal Best!
                  <Award className="fill-yellow-500 w-5 h-5 sm:w-7 sm:h-7" />
                </div>
              </div>
            )}

            <div className="text-4xl sm:text-6xl font-black text-sky-500 mb-6 sm:mb-10 drop-shadow-sm">
              {score.toLocaleString()} <span className="text-xl sm:text-2xl text-slate-400">PTS</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-10">
              <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border-2 border-slate-200">
                <div className="text-slate-400 font-bold text-xs sm:text-sm mb-1 uppercase tracking-wider">
                  Accuracy
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-700">{accuracy}%</div>
              </div>
              <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border-2 border-slate-200">
                <div className="text-slate-400 font-bold text-xs sm:text-sm mb-1 uppercase tracking-wider">
                  Avg Time
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-700">{avgTime}s</div>
              </div>
              <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border-2 border-slate-200">
                <div className="text-slate-400 font-bold text-xs sm:text-sm mb-1 uppercase tracking-wider">
                  Fastest
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-700">{fastestStr}s</div>
              </div>
              <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border-2 border-slate-200">
                <div className="text-slate-400 font-bold text-xs sm:text-sm mb-1 uppercase tracking-wider">
                  Speed Bonus
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-500">+{totalSpeedBonus}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setQuestionCount(0);
                  setScore(0);
                  setTotalCorrect(0);
                  setFastestAnswer(999999);
                  setTotalResponseTime(0);
                  setTotalSpeedBonus(0);
                  setBestStreak(0);
                  setCurrentStreak(0);
                  loadNextQuestion(0);
                }}
                className="bg-sky-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-xl hover:bg-sky-600 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
              >
                <Zap size={22} /> Play Again
              </button>
              <Link
                to="/games"
                className="bg-slate-200 text-slate-700 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-xl hover:bg-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                More Games
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2.5 sm:p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Top HUD */}
      <div className="w-full flex justify-between items-center mb-3 sm:mb-6 bg-white p-3 sm:p-4 rounded-2xl border-2 sm:border-4 border-slate-200 shadow-sm flex-wrap gap-2">
        <div className="flex flex-col">
          <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Score</span>
          <span className="text-xl sm:text-3xl font-black text-sky-500 leading-none">
            {score.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsZenMode((prev) => !prev)}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
              isZenMode
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {isZenMode ? '🧘 Zen Mode (Untimed)' : '⚡ Sprint Mode'}
          </button>
          <span className="font-bold text-xs sm:text-sm text-slate-400">
            {Math.min(questionCount + 1, TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Streak</span>
          <span
            className={`text-xl sm:text-3xl font-black leading-none ${
              currentStreak >= 3 ? 'text-orange-500' : 'text-slate-700'
            }`}
          >
            {currentStreak}🔥
          </span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 border-2 sm:border-4 border-slate-200 shadow-xl w-full relative">
        {/* Speed Bar (only in Sprint Mode) */}
        {!isZenMode && (
          <div className="absolute top-0 left-0 w-full h-2 sm:h-2.5 bg-slate-100 rounded-t-2xl sm:rounded-t-3xl overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-100 ease-linear"
              style={{ width: `${timeRemainingPercent}%` }}
            />
          </div>
        )}

        <div className="text-center mt-2 sm:mt-4 mb-4 sm:mb-8">
          <h2 className="text-sm sm:text-xl font-bold text-slate-400 mb-1">
            {promptMode === 'wordToDef'
              ? 'What does this word mean?'
              : 'Which word matches this definition?'}
          </h2>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tight break-words">
            {promptMode === 'wordToDef' ? currentWord?.word : `"${currentWord?.definition}"`}
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          {options.map((option, idx) => (
            <button
              key={idx}
              disabled={gameState === 'feedback'}
              onClick={() => handleAnswer(option)}
              className={`
                p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl text-left font-bold text-xs sm:text-sm md:text-base border-2 sm:border-4 transition-all leading-snug break-words
                ${
                  gameState === 'playing'
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-400 hover:bg-sky-50 active:scale-95'
                    : gameState === 'feedback' && option.id === currentWord.id
                    ? 'bg-green-100 border-green-400 text-green-800 scale-102 sm:scale-105 shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                }
              `}
            >
              {promptMode === 'wordToDef' ? option.definition : option.word}
            </button>
          ))}
        </div>

        {/* Feedback Overlay */}
        {gameState === 'feedback' && feedback && (
          <div
            onClick={advanceToNextQuestion}
            className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
            ${feedback.correct ? 'bg-green-500' : 'bg-red-500'}
            text-white px-5 sm:px-8 py-4 sm:py-6 rounded-3xl font-black shadow-2xl z-50
            flex flex-col items-center gap-1.5 sm:gap-2 w-[90%] max-w-sm transition-transform duration-300 max-h-[85vh] overflow-y-auto cursor-pointer
          `}
          >
            {feedback.correct ? (
              <>
                <div className="text-2xl sm:text-4xl mb-1">Correct!</div>
                <div className="text-sm sm:text-base opacity-90">
                  {(feedback.timeMs / 1000).toFixed(2)}s
                </div>
                <div className="flex flex-col items-center mt-1 sm:mt-2 bg-white/20 p-3 sm:p-4 rounded-2xl w-full">
                  <div className="text-base sm:text-xl">+{feedback.points} Pts</div>
                  {feedback.bonus > 0 && (
                    <div className="text-amber-200 text-lg sm:text-2xl flex items-center gap-1 mt-1">
                      <Zap className="fill-amber-200" size={20} /> +{feedback.bonus} SPEED!
                    </div>
                  )}
                  {feedback.streakBonus > 0 && (
                    <div className="text-orange-200 text-base sm:text-xl mt-1">
                      +{feedback.streakBonus} Streak
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl sm:text-4xl mb-1">Not quite!</div>
                <div className="text-xs sm:text-base bg-white/20 p-3 sm:p-4 rounded-2xl mt-1 text-center w-full leading-relaxed break-words">
                  The correct answer was:
                  <br />
                  <span className="text-base sm:text-xl mt-1 block font-black">
                    {currentWord.definition}
                  </span>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                advanceToNextQuestion();
              }}
              className="mt-3 px-4 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-transform"
            >
              Next Question ➔ (Tap to skip)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

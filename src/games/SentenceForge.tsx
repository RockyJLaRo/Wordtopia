import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Hammer, Sparkles, Award, ArrowRight, RotateCcw, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { getWordLinguisticProfile } from '../utils/linguisticEngine';
import { shuffleArray } from '../utils/gameUtils';
import { VocabWord } from '../types';

interface ForgeOption {
  id: string;
  text: string;
  type: 'correct' | 'deceptive' | 'syntactic';
  explanation: string;
}

export function SentenceForge() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, reduceMotion } = useSettingsStore();

  const [gameState, setGameState] = useState<'playing' | 'feedback' | 'finished'>('playing');
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [starter, setStarter] = useState('');
  const [options, setOptions] = useState<ForgeOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ForgeOption | null>(null);
  const [score, setScore] = useState(0);
  const [accuracyStreak, setAccuracyStreak] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [anvilActive, setAnvilActive] = useState(false);

  const TOTAL_QUESTIONS = Math.min(5, Math.max(3, words.length));
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (words.length >= 2 && !currentWord) {
      loadNextQuestion(0);
    }
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [words.length, currentWord]);

  const loadNextQuestion = (count: number) => {
    if (count >= TOTAL_QUESTIONS) {
      setGameState('finished');
      incrementGamesCompleted();
      addCoins(60, 'Completed Sentence Forge');
      addStars(3);
      playWinSound(soundEnabled);
      haptic.win();
      if (!reduceMotion) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
      return;
    }

    const available = shuffleArray(words);
    const target = available[count % available.length];
    const profile = getWordLinguisticProfile(target);

    // Build 3 options: 1 correct, 1 deceptive/contradictory, 1 syntactic or alternative
    const pool: ForgeOption[] = [
      {
        id: 'opt-correct',
        text: profile.forge.correctEnding,
        type: 'correct',
        explanation: `Matches the true meaning of "${target.word}": ${target.definition}`,
      },
      {
        id: 'opt-deceptive',
        text: profile.forge.deceptiveEnding,
        type: 'deceptive',
        explanation: `Contradicts the actual meaning of "${target.word}". Notice how the action does not fit!`,
      },
      {
        id: 'opt-syntactic',
        text: profile.forge.syntacticEnding,
        type: 'syntactic',
        explanation: `Grammatically or contextually incomplete for how "${target.word}" is properly used.`,
      },
    ];

    setCurrentWord(target);
    setStarter(profile.forge.starter);
    setOptions(shuffleArray(pool));
    setSelectedOption(null);
    setGameState('playing');
    setAnvilActive(false);
  };

  const handleSelectOption = (opt: ForgeOption) => {
    if (gameState !== 'playing' || !currentWord) return;

    setSelectedOption(opt);
    setGameState('feedback');
    setAnvilActive(true);

    const isCorrect = opt.type === 'correct';
    recordPractice(currentWord.id, isCorrect, 'context');
    recordAnswer(isCorrect);

    if (isCorrect) {
      playCorrectSound(soundEnabled);
      haptic.success();
      setScore((prev) => prev + 120 + accuracyStreak * 25);
      setAccuracyStreak((prev) => prev + 1);
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
      setAccuracyStreak(0);
    }
  };

  const handleAdvance = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const nextCount = questionCount + 1;
    setQuestionCount(nextCount);
    loadNextQuestion(nextCount);
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">🛠️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Sentence Forge requires at least 2 vocabulary words to play.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/editor"
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all active:scale-95"
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
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-amber-300 text-center w-full">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
            <Hammer size={36} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Master Blacksmith!</h2>
          <p className="text-slate-600 text-sm font-bold mb-4">
            You forged all {TOTAL_QUESTIONS} sentences with context precision!
          </p>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
            <span className="text-xs uppercase tracking-wider font-black text-amber-700 block mb-1">
              Final Score
            </span>
            <span className="text-3xl font-black text-amber-600">{score} pts</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setQuestionCount(0);
                setScore(0);
                setAccuracyStreak(0);
                loadNextQuestion(0);
              }}
              className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Forge Again
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
    <div className="flex-1 flex flex-col items-center py-4 px-2 max-w-2xl mx-auto w-full">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-4 bg-white/90 p-3 sm:p-4 rounded-2xl border-2 sm:border-4 border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
            <Hammer size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-slate-800">Sentence Forge</h1>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">
              Question {questionCount + 1} of {TOTAL_QUESTIONS}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {accuracyStreak >= 2 && (
            <span className="bg-amber-100 border border-amber-300 text-amber-800 px-2 py-0.5 rounded-lg text-xs font-black animate-pulse">
              🔥 {accuracyStreak} Streak
            </span>
          )}
          <span className="font-black text-amber-600 text-base sm:text-lg">{score} pts</span>
        </div>
      </div>

      {/* Target Word Anvil Card */}
      {currentWord && (
        <div
          className={`w-full bg-gradient-to-br from-amber-600 to-amber-700 rounded-3xl p-5 sm:p-6 text-white shadow-lg mb-4 text-center transition-all ${
            anvilActive ? 'ring-4 ring-amber-300 scale-[0.99]' : ''
          }`}
        >
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-amber-200 block mb-1">
            Target Vocabulary Word
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            {currentWord.word}
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 font-medium max-w-md mx-auto bg-amber-800/40 py-1.5 px-3 rounded-xl border border-amber-500/30">
            Definition: {currentWord.definition}
          </p>
        </div>
      )}

      {/* The Sentence Under Construction */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border-2 sm:border-4 border-slate-200 shadow-sm mb-4">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Sentence Blueprint
        </span>
        <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
          <span>{starter}</span>{' '}
          {selectedOption ? (
            <span
              className={`underline font-black ${
                selectedOption.type === 'correct' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {selectedOption.text}
            </span>
          ) : (
            <span className="inline-block px-3 py-0.5 rounded-md bg-amber-100 text-amber-700 font-black border border-dashed border-amber-300 animate-pulse">
              [ Select completing phrase below... ]
            </span>
          )}
        </p>
      </div>

      {/* Options List */}
      <div className="w-full flex flex-col gap-3 mb-4">
        {options.map((opt, index) => {
          let btnStyle = 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-700';
          if (gameState === 'feedback') {
            if (opt.type === 'correct') {
              btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-200';
            } else if (selectedOption?.id === opt.id) {
              btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200';
            } else {
              btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={opt.id}
              disabled={gameState === 'feedback'}
              onClick={() => handleSelectOption(opt)}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 sm:border-4 font-bold text-left text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] flex items-start gap-3 ${btnStyle}`}
            >
              <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span className="flex-1 leading-snug">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Diagnostic Feedback Panel */}
      {gameState === 'feedback' && selectedOption && (
        <div
          className={`w-full p-4 rounded-2xl border-2 sm:border-4 mb-4 ${
            selectedOption.type === 'correct'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 font-black text-sm sm:text-base mb-1">
            {selectedOption.type === 'correct' ? (
              <>
                <CheckCircle2 size={20} className="text-emerald-600" />
                <span>Perfect Forge!</span>
              </>
            ) : (
              <>
                <AlertCircle size={20} className="text-rose-600" />
                <span>Why this choice did not fit:</span>
              </>
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold mb-3 leading-relaxed">
            {selectedOption.explanation}
          </p>
          <button
            onClick={handleAdvance}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

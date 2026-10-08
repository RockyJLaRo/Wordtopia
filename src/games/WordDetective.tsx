import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Lightbulb, CheckCircle2, RotateCcw, ArrowRight, Award, HelpCircle } from 'lucide-react';
import { confetti } from '../utils/confetti';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { getWordLinguisticProfile } from '../utils/linguisticEngine';
import { getDistractors, shuffleArray } from '../utils/gameUtils';
import { VocabWord } from '../types';
import { useActionLock } from '../hooks/useGameTimers';

export function WordDetective() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, reduceMotion } = useSettingsStore();

  const [gameState, setGameState] = useState<'playing' | 'feedback' | 'finished'>('playing');
  const [questionCount, setQuestionCount] = useState(0);
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [clueTier, setClueTier] = useState<number>(1);
  const [clues, setClues] = useState<string[]>([]);
  const [options, setOptions] = useState<VocabWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [casesSolvedWithFewestClues, setCasesSolvedWithFewestClues] = useState(0);

  const TOTAL_QUESTIONS = Math.min(5, words.length);
  const roundWordsRef = useRef<VocabWord[]>([]);
  const answerLock = useActionLock();
  const advanceLock = useActionLock();

  useEffect(() => {
    if (words.length >= 2 && !currentWord) {
      loadNextQuestion(0);
    }
  }, [words.length, currentWord]);

  const loadNextQuestion = (nextCount: number) => {
    if (nextCount >= TOTAL_QUESTIONS) {
      setGameState('finished');
      incrementGamesCompleted();
      addCoins(70, 'Completed Word Detective');
      addStars(3);
      playWinSound(soundEnabled);
      haptic.win();
      if (!reduceMotion) {
        confetti({ particleCount: 160, spread: 80 });
      }
      return;
    }

    answerLock.release();
    advanceLock.release();
    // Pick from a per-round shuffled list so one round doesn't repeat a word.
    if (nextCount === 0 || roundWordsRef.current.length === 0) roundWordsRef.current = shuffleArray(words);
    const available = roundWordsRef.current;
    const target = available[nextCount % available.length];
    const profile = getWordLinguisticProfile(target);

    const distractors = getDistractors(words, target, 3);
    const allOptions = shuffleArray([target, ...distractors]);

    setCurrentWord(target);
    setClueTier(1);
    setClues(profile.clueLadder);
    setOptions(allOptions);
    setSelectedWord(null);
    setIsCorrect(false);
    setGameState('playing');
  };

  const handleRevealNextClue = () => {
    if (clueTier < clues.length) {
      haptic.medium();
      setClueTier((prev) => prev + 1);
    }
  };

  const handleSelectOption = (opt: VocabWord) => {
    if (gameState !== 'playing' || !currentWord || !answerLock.acquire()) return;

    setSelectedWord(opt);
    const correct = opt.id === currentWord.id;
    setIsCorrect(correct);
    setGameState('feedback');

    recordPractice(currentWord.id, correct, 'recall');
    recordAnswer(correct);

    if (correct) {
      playCorrectSound(soundEnabled);
      haptic.success();
      // More points if solved at earlier clue tiers
      const tierPoints = clueTier === 1 ? 120 : clueTier === 2 ? 90 : clueTier === 3 ? 60 : 40;
      setScore((s) => s + tierPoints);
      addCoins(Math.round(tierPoints / 4));

      if (clueTier <= 2) {
        setCasesSolvedWithFewestClues((prev) => prev + 1);
        addStars(1);
      }
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
    }
  };

  const handleNextCase = () => {
    if (gameState !== 'feedback' || !advanceLock.acquire()) return; // ignore double taps
    const nextCount = questionCount + 1;
    setQuestionCount(nextCount);
    loadNextQuestion(nextCount);
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Word Detective requires at least 2 vocabulary words to investigate.
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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 max-w-lg mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-teal-300 text-center w-full">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mx-auto mb-4">
            <Search size={36} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">All Cases Closed!</h2>
          <p className="text-slate-600 text-sm font-bold mb-4">
            You reasoned through evidence ladders and solved all {TOTAL_QUESTIONS} mysteries!
          </p>
          <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-4 mb-6">
            <span className="text-xs uppercase tracking-wider font-black text-teal-700 block mb-1">
              Detective Rating
            </span>
            <span className="text-2xl font-black text-teal-600">
              {casesSolvedWithFewestClues >= 3 ? '🥇 Master Detective' : '🥈 Senior Sleuth'} ({score} pts)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setQuestionCount(0);
                setScore(0);
                setCasesSolvedWithFewestClues(0);
                loadNextQuestion(0);
              }}
              className="flex-1 py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Solve New Cases
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
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
            <Search size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-slate-800">Word Detective</h1>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">
              Case {questionCount + 1} of {TOTAL_QUESTIONS}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-lg text-xs font-black">
            Clue {clueTier}/4
          </span>
          <span className="font-black text-teal-600 text-base">{score} pts</span>
        </div>
      </div>

      {/* Progressive Clue Evidence Board */}
      <div className="w-full bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl mb-4 border-4 border-slate-800">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-black uppercase tracking-wider">
            <HelpCircle size={16} />
            <span>Detective Case Dossier</span>
          </div>
          {clueTier < clues.length && gameState === 'playing' && (
            <button
              onClick={handleRevealNextClue}
              className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black rounded-xl text-xs transition-transform active:scale-95 shadow-sm"
            >
              <Lightbulb size={14} />
              <span>Reveal Clue {clueTier + 1}</span>
            </button>
          )}
        </div>

        {/* Revealed Clues List */}
        <div className="flex flex-col gap-2.5">
          {clues.slice(0, clueTier).map((clue, idx) => (
            <div
              key={idx}
              className="bg-slate-800/90 border border-teal-500/30 p-3 rounded-2xl flex items-start gap-2.5 text-xs sm:text-sm text-teal-50"
            >
              <span className="w-5 h-5 rounded-md bg-teal-500 text-slate-900 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="font-semibold leading-relaxed">{clue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Suspect Word Cards */}
      <div className="w-full flex flex-col gap-2.5 mb-4">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Select the mystery vocabulary word:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {options.map((opt) => {
            let cardClass =
              'bg-white hover:bg-teal-50/50 border-slate-200 text-slate-800 hover:border-teal-300';
            if (gameState === 'feedback') {
              if (opt.id === currentWord?.id) {
                cardClass = 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-200';
              } else if (selectedWord?.id === opt.id) {
                cardClass = 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-200';
              } else {
                cardClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
              }
            }

            return (
              <button
                key={opt.id}
                disabled={gameState === 'feedback'}
                onClick={() => handleSelectOption(opt)}
                className={`p-4 rounded-2xl border-2 sm:border-3 font-black text-base sm:text-lg shadow-xs transition-all active:scale-95 text-left flex flex-col gap-0.5 ${cardClass}`}
              >
                <span>{opt.word}</span>
                <span className="text-xs text-slate-500 font-normal truncate">
                  {opt.definition}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Panel */}
      {gameState === 'feedback' && currentWord && (
        <div
          className={`w-full p-4 rounded-2xl border-2 sm:border-4 mb-4 ${
            isCorrect
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2 font-black text-sm sm:text-base mb-1">
            {isCorrect ? (
              <>
                <CheckCircle2 size={20} className="text-emerald-600" />
                <span>Mystery Solved!</span>
              </>
            ) : (
              <span>Case Deduction: The correct word was "{currentWord.word}".</span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold mb-3">
            "{currentWord.word}" means: {currentWord.definition}
          </p>
          <button
            onClick={handleNextCase}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Next Case</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

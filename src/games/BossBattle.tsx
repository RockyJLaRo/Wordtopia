import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Shield, Zap, Sparkles, Heart, Award, RotateCcw, ArrowRight, Skull } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { getWordLinguisticProfile } from '../utils/linguisticEngine';
import { shuffleArray, getDistractors } from '../utils/gameUtils';
import { VocabWord } from '../types';

interface CombatTurn {
  word: VocabWord;
  mode: 'definition' | 'context' | 'synonym' | 'spelling';
  prompt: string;
  questionText: string;
  correctAnswer: string;
  options: string[];
}

export function BossBattle() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, reduceMotion } = useSettingsStore();

  const [gameState, setGameState] = useState<'battle' | 'feedback' | 'won' | 'lost'>('battle');
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [currentTurn, setCurrentTurn] = useState<CombatTurn | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isHit, setIsHit] = useState(false);
  const [bossAttackAnim, setBossAttackAnim] = useState(false);

  const TOTAL_TURNS = 5;

  useEffect(() => {
    if (words.length >= 2) {
      initBattle();
    }
  }, [words.length]);

  const initBattle = () => {
    setBossHp(100);
    setPlayerHp(100);
    setTurnIndex(0);
    setGameState('battle');
    loadTurn(0);
  };

  const loadTurn = (idx: number) => {
    if (idx >= TOTAL_TURNS) {
      // Player victory
      setGameState('won');
      incrementGamesCompleted();
      addCoins(100, 'Defeated the Lexicon Titan');
      addStars(5);
      playWinSound(soundEnabled);
      haptic.win();
      if (!reduceMotion) {
        confetti({ particleCount: 200, spread: 100 });
      }
      return;
    }

    const available = shuffleArray(words);
    const target = available[idx % available.length];
    const profile = getWordLinguisticProfile(target);

    // Alternate modes: definition -> context -> synonym -> spelling
    const modes: CombatTurn['mode'][] = ['definition', 'context', 'synonym', 'spelling'];
    const chosenMode = modes[idx % modes.length];

    let prompt = '';
    let questionText = '';
    let correctAnswer = '';
    let options: string[] = [];

    if (chosenMode === 'definition') {
      prompt = '⚡ DEFINITION STRIKE: Choose the true meaning to break the armor!';
      questionText = `What does "${target.word}" mean?`;
      correctAnswer = target.definition;
      const distractors = getDistractors(words, target, 3).map((d) => d.definition);
      options = shuffleArray([correctAnswer, ...distractors]);
    } else if (chosenMode === 'context') {
      prompt = '🛡️ CONTEXT SHIELD: Complete the sentence to deflect the Titan attack!';
      questionText = profile.clozeSentence.replace('_____', `[ ? ]`);
      correctAnswer = target.word;
      const distractors = getDistractors(words, target, 3).map((d) => d.word);
      options = shuffleArray([correctAnswer, ...distractors]);
    } else if (chosenMode === 'synonym') {
      prompt = '⚔️ SYNONYM SLASH: Find the closest semantic ally!';
      questionText = `Which word is most similar in meaning to "${target.word}"?`;
      correctAnswer = profile.synonyms[0] || target.word;
      const otherSynonyms = getDistractors(words, target, 3).map((d) => d.word);
      options = shuffleArray([correctAnswer, ...otherSynonyms]);
    } else {
      prompt = '💥 SPELLING BLAST: Choose the exact orthographic spelling!';
      questionText = `Definition: "${target.definition}"`;
      correctAnswer = target.word;
      // create plausible spelling variations
      const misspelled1 = target.word.length > 5 ? target.word.slice(0, -2) + target.word.slice(-1) : target.word + 'e';
      const misspelled2 = target.word.replace(/e/i, 'a') || target.word + 's';
      const otherWord = getDistractors(words, target, 1)[0]?.word || 'custom';
      options = shuffleArray([correctAnswer, misspelled1, misspelled2, otherWord]);
    }

    setCurrentTurn({
      word: target,
      mode: chosenMode,
      prompt,
      questionText,
      correctAnswer,
      options,
    });
    setGameState('battle');
    setIsHit(false);
    setBossAttackAnim(false);
  };

  const handleSelectAnswer = (ans: string) => {
    if (gameState !== 'battle' || !currentTurn) return;

    const isCorrect = ans === currentTurn.correctAnswer;
    recordPractice(currentTurn.word.id, isCorrect, currentTurn.mode === 'spelling' ? 'spelling' : currentTurn.mode === 'context' ? 'context' : 'definition');
    recordAnswer(isCorrect);

    if (isCorrect) {
      playCorrectSound(soundEnabled);
      haptic.success();
      setIsHit(true);
      const newBossHp = Math.max(0, bossHp - 25);
      setBossHp(newBossHp);
      setFeedbackText(`CRITICAL HIT! Your command struck the Titan for 25 damage!`);

      if (newBossHp <= 0) {
        setTimeout(() => {
          setGameState('won');
          incrementGamesCompleted();
          addCoins(100, 'Defeated Lexicon Titan');
          addStars(5);
          playWinSound(soundEnabled);
          haptic.win();
          if (!reduceMotion) {
            confetti({ particleCount: 220, spread: 100 });
          }
        }, 800);
        return;
      }
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
      setBossAttackAnim(true);
      const newPlayerHp = Math.max(0, playerHp - 25);
      setPlayerHp(newPlayerHp);
      setFeedbackText(
        `PARRY FAILED! The Titan hits for 25 damage. The correct answer was "${currentTurn.correctAnswer}".`
      );

      if (newPlayerHp <= 0) {
        setTimeout(() => {
          setGameState('lost');
          haptic.error();
        }, 800);
        return;
      }
    }

    setGameState('feedback');
  };

  const handleNextTurn = () => {
    const nextIdx = turnIndex + 1;
    setTurnIndex(nextIdx);
    loadTurn(nextIdx);
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">⚔️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Boss Battle requires at least 2 vocabulary words to challenge the Lexicon Titan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/editor"
              className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all active:scale-95"
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

  if (gameState === 'won') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 max-w-lg mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-yellow-400 text-center w-full">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 mx-auto mb-4">
            <Award size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">TITAN DEFEATED!</h2>
          <p className="text-slate-600 text-sm font-bold mb-6">
            Your mastery across definitions, context, synonyms, and spelling brought down the mighty Lexicon Titan!
          </p>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
            <span className="text-xs uppercase tracking-wider font-black text-yellow-800 block mb-1">
              Battle Reward
            </span>
            <span className="text-2xl font-black text-yellow-600">+100 Coins & 5 Stars ⭐</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={initBattle}
              className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Battle Again
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

  if (gameState === 'lost') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 max-w-lg mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-rose-300 text-center w-full">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
            <Skull size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Defeated in Battle!</h2>
          <p className="text-slate-600 text-sm font-bold mb-6">
            The Titan was strong today. Review your vocabulary definitions and challenge it again!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={initBattle}
              className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Try Again
            </button>
            <Link
              to="/study"
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-sm transition-all active:scale-95 text-center"
            >
              Study Flashcards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center py-4 px-2 max-w-2xl mx-auto w-full">
      {/* Boss Health Bar Card */}
      <div
        className={`w-full bg-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-xl mb-4 border-4 border-slate-700 transition-all ${
          isHit ? 'ring-4 ring-rose-500 scale-[0.98]' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center font-black text-white text-base">
              👹
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg">The Lexicon Titan</h2>
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                Phase {turnIndex + 1} of {TOTAL_TURNS}
              </span>
            </div>
          </div>
          <span className="font-black text-rose-400 text-sm sm:text-base">{bossHp} / 100 HP</span>
        </div>
        <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className="bg-gradient-to-r from-rose-600 to-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${bossHp}%` }}
          />
        </div>
      </div>

      {/* Player Health Bar */}
      <div className="w-full flex items-center justify-between mb-4 bg-white/90 px-4 py-2.5 rounded-2xl border-2 border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-slate-700">
          <Heart size={18} className="text-rose-500 fill-rose-500" />
          <span>Player Health:</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 sm:w-36 bg-slate-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${playerHp}%` }}
            />
          </div>
          <span className="text-xs font-black text-slate-600">{playerHp} HP</span>
        </div>
      </div>

      {/* Turn Prompt & Question */}
      {currentTurn && (
        <div className="w-full bg-white rounded-3xl p-5 border-3 sm:border-4 border-slate-200 shadow-md mb-4 text-center">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-rose-600 block mb-1">
            {currentTurn.prompt}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-4 leading-tight">
            {currentTurn.questionText}
          </h3>

          {/* Attack Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentTurn.options.map((opt, i) => (
              <button
                key={i}
                disabled={gameState === 'feedback'}
                onClick={() => handleSelectAnswer(opt)}
                className="p-3.5 bg-slate-50 hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-400 rounded-2xl font-bold text-xs sm:text-sm text-slate-800 shadow-2xs transition-all active:scale-95 text-left"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Combat Feedback Banner */}
      {gameState === 'feedback' && (
        <div className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-lg border-2 border-slate-700 flex flex-col gap-3">
          <p className="text-xs sm:text-sm font-bold text-center leading-relaxed">
            {feedbackText}
          </p>
          <button
            onClick={handleNextTurn}
            className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Next Attack Turn</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, BookOpen, Sparkles, CheckCircle2, RotateCcw, ArrowRight, ShieldAlert, Award } from 'lucide-react';
import { confetti } from '../utils/confetti';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { getWordLinguisticProfile } from '../utils/linguisticEngine';
import { shuffleArray, getDistractors } from '../utils/gameUtils';
import { VocabWord } from '../types';
import { useActionLock } from '../hooks/useGameTimers';

interface QuestStep {
  word: VocabWord;
  setting: string;
  scenario: string;
  prompt: string;
  choices: VocabWord[];
  correctOutcome: string;
  incorrectOutcomes: Record<string, string>;
}

export function ContextQuest() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, reduceMotion } = useSettingsStore();

  const [gameState, setGameState] = useState<'story' | 'resolution' | 'finished'>('story');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [questSteps, setQuestSteps] = useState<QuestStep[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<VocabWord | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [score, setScore] = useState(0);

  const TOTAL_STEPS = Math.min(4, words.length);

  useEffect(() => {
    if (words.length >= 2) {
      initQuest();
    }
  }, [words.length]);

  const answerLock = useActionLock();
  const advanceLock = useActionLock();

  const initQuest = () => {
    answerLock.release();
    advanceLock.release();
    const shuffled = shuffleArray(words).slice(0, TOTAL_STEPS);
    const steps: QuestStep[] = shuffled.map((w) => {
      const profile = getWordLinguisticProfile(w);
      const distractors = getDistractors(words, w, 2);
      const choices = shuffleArray([w, ...distractors]);
      return {
        word: w,
        setting: profile.quest.setting,
        scenario: profile.quest.scenario,
        prompt: profile.quest.prompt,
        choices,
        correctOutcome: profile.quest.correctOutcome,
        incorrectOutcomes: profile.quest.incorrectOutcomes,
      };
    });

    setQuestSteps(steps);
    setCurrentStepIndex(0);
    setSelectedChoice(null);
    setGameState('story');
    setScore(0);
  };

  const handleChooseWord = (choice: VocabWord) => {
    if (gameState !== 'story' || !answerLock.acquire()) return;

    const currentStep = questSteps[currentStepIndex];
    if (!currentStep) return;

    setSelectedChoice(choice);
    const correct = choice.id === currentStep.word.id;
    setIsSuccess(correct);

    recordPractice(currentStep.word.id, correct, 'context');
    recordAnswer(correct);

    if (correct) {
      playCorrectSound(soundEnabled);
      haptic.success();
      setResolutionText(currentStep.correctOutcome);
      setScore((prev) => prev + 150);
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
      const customOutcome =
        currentStep.incorrectOutcomes[choice.word.toLowerCase()] ||
        `Using "${choice.word}" (${choice.definition}) did not make sense in this situation because it does not match what the scene requires!`;
      setResolutionText(customOutcome);
    }

    setGameState('resolution');
  };

  const handleNextStep = () => {
    if (gameState !== 'resolution' || !advanceLock.acquire()) return; // ignore double taps on "Continue"
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= questSteps.length) {
      setGameState('finished');
      incrementGamesCompleted();
      addCoins(75, 'Completed Context Quest');
      addStars(3);
      playWinSound(soundEnabled);
      haptic.win();
      if (!reduceMotion) {
        confetti({ particleCount: 180, spread: 90 });
      }
    } else {
      setCurrentStepIndex(nextIndex);
      answerLock.release();
      advanceLock.release();
      setSelectedChoice(null);
      setGameState('story');
    }
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">🧭</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Context Quest requires at least 2 vocabulary words to generate the adventure story.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/editor"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all active:scale-95"
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

  const currentStep = questSteps[currentStepIndex];

  if (gameState === 'finished') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 max-w-lg mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-emerald-300 text-center w-full">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
            <Compass size={36} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Quest Completed!</h2>
          <p className="text-slate-600 text-sm font-bold mb-4">
            You guided the realm through all narrative dilemmas using accurate contextual vocabulary!
          </p>
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 mb-6">
            <span className="text-xs uppercase tracking-wider font-black text-emerald-700 block mb-1">
              Quest Score
            </span>
            <span className="text-3xl font-black text-emerald-600">{score} pts</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={initQuest}
              className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> New Quest Story
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
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Compass size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-slate-800">Context Quest</h1>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">
              Chapter {currentStepIndex + 1} of {questSteps.length}
            </span>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-black text-emerald-700">
          {score} pts
        </div>
      </div>

      {currentStep && (
        <div className="w-full flex flex-col gap-4">
          {/* Story Setting Banner */}
          <div className="w-full bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-5 sm:p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <BookOpen size={16} />
              <span>{currentStep.setting}</span>
            </div>
            <p className="text-base sm:text-lg font-bold leading-relaxed mb-4 text-emerald-50">
              "{currentStep.scenario}"
            </p>
            <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-400/30">
              <span className="text-xs sm:text-sm font-black text-emerald-300 block mb-0.5">
                Story Dilemma:
              </span>
              <p className="text-xs sm:text-sm font-semibold text-emerald-100">
                {currentStep.prompt}
              </p>
            </div>
          </div>

          {/* Decision Choices */}
          {gameState === 'story' && (
            <div className="w-full flex flex-col gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
                Choose the word that makes sense in this scenario:
              </span>
              {currentStep.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChooseWord(choice)}
                  className="w-full p-4 bg-white hover:bg-emerald-50/50 border-2 sm:border-4 border-slate-200 hover:border-emerald-400 rounded-2xl shadow-xs transition-all active:scale-[0.98] text-left flex flex-col gap-1"
                >
                  <span className="text-lg font-black text-slate-800">{choice.word}</span>
                  <span className="text-xs text-slate-500 font-semibold">{choice.definition}</span>
                </button>
              ))}
            </div>
          )}

          {/* Outcome & Resolution Panel */}
          {gameState === 'resolution' && (
            <div
              className={`w-full p-5 rounded-3xl border-3 sm:border-4 shadow-md ${
                isSuccess
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                  : 'bg-rose-50 border-rose-400 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-base sm:text-lg mb-2">
                {isSuccess ? (
                  <>
                    <CheckCircle2 size={24} className="text-emerald-600" />
                    <span>Action Succeeded!</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={24} className="text-rose-600" />
                    <span>Story Complication!</span>
                  </>
                )}
              </div>
              <p className="text-sm sm:text-base font-semibold leading-relaxed mb-4">
                {resolutionText}
              </p>
              <button
                onClick={handleNextStep}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Continue Journey</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Sparkles, CheckCircle2, RotateCcw, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import { confetti } from '../utils/confetti';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { getWordLinguisticProfile } from '../utils/linguisticEngine';
import { shuffleArray } from '../utils/gameUtils';
import { VocabWord } from '../types';
import { useGameTimeouts } from '../hooks/useGameTimers';

interface SortBin {
  id: string;
  name: string;
  emoji: string;
  color: string;
  borderColor: string;
  bgLight: string;
  description: string;
  matcher: (word: VocabWord, profile: ReturnType<typeof getWordLinguisticProfile>) => boolean;
}

export function WordSortLab() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, reduceMotion } = useSettingsStore();

  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);
  const [unsortedWords, setUnsortedWords] = useState<VocabWord[]>([]);
  const [bins, setBins] = useState<SortBin[]>([]);
  const [binAssignments, setBinAssignments] = useState<Record<string, VocabWord[]>>({});
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const timeouts = useGameTimeouts();
  // Synchronous mirrors of the word queue: taps that arrive before React re-renders must see
  // the updated queue, or the last word can be scored (and the lab completed) twice.
  const selectedRef = useRef<VocabWord | null>(null);
  const unsortedRef = useRef<VocabWord[]>([]);

  useEffect(() => {
    if (words.length >= 2) {
      initLabRound();
    }
  }, [words.length]);

  const initLabRound = () => {
    timeouts.clearAll();
    // Determine the most pedagogically meaningful bins based on current words
    const sampleProfiles = words.map((w) => ({ word: w, profile: getWordLinguisticProfile(w) }));
    
    // Check if we have actions (verbs) vs descriptions (adjectives)
    const hasVerbs = sampleProfiles.some((p) => p.profile.partOfSpeech === 'verb');
    const hasAdjs = sampleProfiles.some((p) => p.profile.partOfSpeech === 'adjective' || p.profile.partOfSpeech === 'noun');

    let chosenBins: SortBin[] = [];
    if (hasVerbs && hasAdjs) {
      chosenBins = [
        {
          id: 'bin-actions',
          name: 'Actions & Verbs',
          emoji: '⚡',
          color: 'text-amber-700',
          borderColor: 'border-amber-400',
          bgLight: 'bg-amber-50',
          description: 'Words that express physical actions, movements, or vocal deeds.',
          matcher: (_w, p) => p.partOfSpeech === 'verb',
        },
        {
          id: 'bin-descriptions',
          name: 'Descriptions & Traits',
          emoji: '🎨',
          color: 'text-sky-700',
          borderColor: 'border-sky-400',
          bgLight: 'bg-sky-50',
          description: 'Words that describe how something looks, feels, sounds, or behaves.',
          matcher: (_w, p) => p.partOfSpeech !== 'verb',
        },
      ];
    } else {
      // Fallback: Connotation sort (Positive / Constructive vs Negative / Troublesome / Neutral)
      chosenBins = [
        {
          id: 'bin-helpful',
          name: 'Positive / Constructive',
          emoji: '🌟',
          color: 'text-emerald-700',
          borderColor: 'border-emerald-400',
          bgLight: 'bg-emerald-50',
          description: 'Words representing helpful, friendly, or pleasant situations.',
          matcher: (_w, p) => p.connotation === 'positive' || p.connotation === 'neutral',
        },
        {
          id: 'bin-troublesome',
          name: 'Troublesome / Irritating',
          emoji: '⚠️',
          color: 'text-rose-700',
          borderColor: 'border-rose-400',
          bgLight: 'bg-rose-50',
          description: 'Words describing clashes, annoyances, knots, or difficult feelings.',
          matcher: (_w, p) => p.connotation === 'negative',
        },
      ];
    }

    const shuffled = shuffleArray(words).slice(0, 6);
    setBins(chosenBins);
    setUnsortedWords(shuffled);
    setSelectedWord(shuffled[0] || null);
    selectedRef.current = shuffled[0] || null;
    unsortedRef.current = shuffled;
    setBinAssignments({ [chosenBins[0].id]: [], [chosenBins[1].id]: [] });
    setFeedback(null);
    setMistakeCount(0);
    setGameState('playing');
  };

  const handleRouteToBin = (bin: SortBin) => {
    const selectedWord = selectedRef.current;
    if (!selectedWord || gameState !== 'playing') return;

    const profile = getWordLinguisticProfile(selectedWord);
    const isMatch = bin.matcher(selectedWord, profile);

    recordPractice(selectedWord.id, isMatch, 'recognition');
    recordAnswer(isMatch);

    if (isMatch) {
      playCorrectSound(soundEnabled);
      haptic.success();
      setFeedback({
        isCorrect: true,
        message: `Great classification! "${selectedWord.word}" accurately belongs in ${bin.name}.`,
      });

      // Move word into the bin
      setBinAssignments((prev) => ({
        ...prev,
        [bin.id]: [...(prev[bin.id] || []), selectedWord],
      }));

      const remaining = unsortedRef.current.filter((w) => w.id !== selectedWord.id);
      unsortedRef.current = remaining;
      selectedRef.current = remaining[0] || null;
      setUnsortedWords(remaining);

      if (remaining.length === 0) {
        // Clear the selection so extra taps during the finish delay can't re-score the last
        // word (which awarded the completion bonus twice).
        setSelectedWord(null);
        timeouts.set(() => {
          setGameState('finished');
          incrementGamesCompleted();
          addCoins(60, 'Completed Word Sort Lab');
          addStars(3);
          playWinSound(soundEnabled);
          haptic.win();
          if (!reduceMotion) {
            confetti({ particleCount: 160, spread: 85 });
          }
        }, 800);
      } else {
        setSelectedWord(remaining[0]);
      }
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
      setMistakeCount((prev) => prev + 1);
      setFeedback({
        isCorrect: false,
        message: `Not quite! "${selectedWord.word}" means "${selectedWord.definition}". Notice why it does not fit ${bin.name}. Try the other chamber!`,
      });
    }
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border-4 border-slate-200 w-full text-center">
          <div className="text-4xl mb-3">⚗️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Need More Words!</h2>
          <p className="text-sm text-slate-600 mb-6 font-bold">
            Word Sort Lab requires at least 2 vocabulary words to categorize.
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
            <FlaskConical size={36} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Lab Test Complete!</h2>
          <p className="text-slate-600 text-sm font-bold mb-4">
            All vocabulary specimens have been sorted into their accurate semantic categories!
          </p>
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 mb-6">
            <span className="text-xs uppercase tracking-wider font-black text-indigo-700 block mb-1">
              Sorting Accuracy
            </span>
            <span className="text-2xl font-black text-indigo-600">
              {mistakeCount === 0 ? '100% Perfect Precision!' : `${mistakeCount} Corrections Made`}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={initLabRound}
              className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Sort New Batch
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
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <FlaskConical size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-slate-800">Word Sort Lab</h1>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">
              {unsortedWords.length} specimen{unsortedWords.length === 1 ? '' : 's'} remaining
            </span>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl text-xs font-black text-indigo-700">
          Semantic Sorter
        </div>
      </div>

      {/* Active Specimen on the Conveyor */}
      {selectedWord && (
        <div className="w-full bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg mb-4 text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-300 block mb-1">
            Current Specimen
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            {selectedWord.word}
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 font-medium max-w-md mx-auto bg-indigo-950/40 py-1.5 px-3 rounded-xl border border-indigo-500/30">
            "{selectedWord.definition}"
          </p>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`w-full p-3 sm:p-4 rounded-2xl border-2 sm:border-4 mb-4 flex items-start gap-2.5 text-xs sm:text-sm font-bold ${
            feedback.isCorrect
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          {feedback.isCorrect ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-snug">{feedback.message}</span>
        </div>
      )}

      {/* Sorting Chamber Bins */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {bins.map((bin) => {
          const assigned = binAssignments[bin.id] || [];
          return (
            <div
              key={bin.id}
              className={`p-4 rounded-3xl border-3 sm:border-4 ${bin.borderColor} ${bin.bgLight} flex flex-col justify-between shadow-sm min-h-[200px]`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{bin.emoji}</span>
                    <h3 className={`font-black text-sm sm:text-base ${bin.color}`}>{bin.name}</h3>
                  </div>
                  <span className="bg-white/80 border border-slate-300 text-slate-700 px-2 py-0.5 rounded-lg text-xs font-black">
                    {assigned.length}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 font-semibold mb-3 leading-tight">
                  {bin.description}
                </p>

                {/* Stored Words in this Bin */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {assigned.map((w) => (
                    <span
                      key={w.id}
                      className="bg-white border border-slate-300 text-slate-800 text-[11px] font-black px-2 py-0.5 rounded-lg shadow-2xs"
                    >
                      ✓ {w.word}
                    </span>
                  ))}
                  {assigned.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">Chamber empty...</span>
                  )}
                </div>
              </div>

              {/* Route Button */}
              <button
                disabled={!selectedWord}
                onClick={() => handleRouteToBin(bin)}
                className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-black rounded-xl text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Route "{selectedWord?.word || ''}" Here</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

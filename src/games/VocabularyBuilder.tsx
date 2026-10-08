import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Blocks, Hammer, CheckCircle2, RotateCcw, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { confetti } from '../utils/confetti';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playCorrectSound, playIncorrectSound, playWinSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import { getWordLinguisticProfile, chunkWordIntoSyllables } from '../utils/linguisticEngine';
import { shuffleArray, getRandomWords } from '../utils/gameUtils';
import { VocabWord } from '../types';
import { useActionLock } from '../hooks/useGameTimers';

interface ChunkBlock {
  id: string;
  chunk: string;
  isUsed: boolean;
}

export function VocabularyBuilder() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, reduceMotion } = useSettingsStore();

  const [gameState, setGameState] = useState<'building' | 'verifying' | 'finished'>('building');
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [level, setLevel] = useState(0);
  const [expectedChunks, setExpectedChunks] = useState<string[]>([]);
  const [placedChunks, setPlacedChunks] = useState<string[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<ChunkBlock[]>([]);
  const [score, setScore] = useState(0);
  const [mistakesThisWord, setMistakesThisWord] = useState(0);
  const [towerHeight, setTowerHeight] = useState(0);

  const TOTAL_LEVELS = Math.min(5, words.length);
  const roundWordsRef = useRef<VocabWord[]>([]);
  const advanceLock = useActionLock();

  useEffect(() => {
    if (words.length >= 2 && !currentWord) {
      loadLevel(0);
    }
  }, [words.length, currentWord]);

  const loadLevel = (lvl: number) => {
    if (lvl >= TOTAL_LEVELS) {
      setGameState('finished');
      incrementGamesCompleted();
      addCoins(80, 'Completed Vocabulary Builder');
      addStars(4);
      playWinSound(soundEnabled);
      haptic.win();
      if (!reduceMotion) {
        confetti({ particleCount: 200, spread: 90 });
      }
      return;
    }

    advanceLock.release();
    // Pick from a per-round shuffled list so one round doesn't repeat a word.
    if (lvl === 0 || roundWordsRef.current.length === 0) roundWordsRef.current = shuffleArray(words);
    const available = roundWordsRef.current;
    const target = available[lvl % available.length];
    const profile = getWordLinguisticProfile(target);

    // Chunks (syllables or morphemes)
    const chunks = profile.syllables && profile.syllables.length > 1
      ? profile.syllables
      : chunkWordIntoSyllables(target.word);

    // Create 1 or 2 distractor chunks from other words
    const otherWords = words.filter((w) => w.id !== target.id);
    const distractorChunkList: string[] = [];
    if (otherWords.length > 0) {
      const otherChunks = chunkWordIntoSyllables(otherWords[0].word);
      distractorChunkList.push(otherChunks[0]);
    }
    if (otherWords.length > 1) {
      const otherChunks2 = chunkWordIntoSyllables(otherWords[1].word);
      distractorChunkList.push(otherChunks2[otherChunks2.length - 1]);
    }

    const allChunkItems: ChunkBlock[] = [
      ...chunks.map((ch, i) => ({ id: `chunk-${ch}-${i}`, chunk: ch, isUsed: false })),
      ...distractorChunkList.map((ch, i) => ({ id: `distract-${ch}-${i}`, chunk: ch, isUsed: false })),
    ];

    setCurrentWord(target);
    setExpectedChunks(chunks);
    setPlacedChunks([]);
    setAvailableBlocks(shuffleArray(allChunkItems));
    setMistakesThisWord(0);
    setGameState('building');
  };

  const handlePlaceChunk = (block: ChunkBlock) => {
    if (block.isUsed || gameState !== 'building' || !currentWord) return;

    const nextIndex = placedChunks.length;
    const targetExpected = expectedChunks[nextIndex];

    if (block.chunk.toLowerCase() === targetExpected.toLowerCase()) {
      playCorrectSound(soundEnabled);
      haptic.success();
      const updatedPlaced = [...placedChunks, block.chunk];
      setPlacedChunks(updatedPlaced);
      setAvailableBlocks((prev) =>
        prev.map((b) => (b.id === block.id ? { ...b, isUsed: true } : b))
      );

      // Check if all chunks placed
      if (updatedPlaced.length === expectedChunks.length) {
        setTowerHeight((prev) => prev + 1);
        setGameState('verifying');
      }
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
      setMistakesThisWord((prev) => prev + 1);
    }
  };

  const handleVerifySuccess = () => {
    if (!currentWord || gameState !== 'verifying' || !advanceLock.acquire()) return; // ignore double taps

    const isFlawless = mistakesThisWord === 0;
    recordPractice(currentWord.id, isFlawless, 'spelling');
    recordAnswer(isFlawless);

    setScore((prev) => prev + (isFlawless ? 120 : 70));
    addCoins(15);

    const nextLvl = level + 1;
    setLevel(nextLvl);
    loadLevel(nextLvl);
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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 max-w-lg mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-pink-300 text-center w-full">
          <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 mx-auto mb-4">
            <Building2 size={36} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Master Architect!</h2>
          <p className="text-slate-600 text-sm font-bold mb-4">
            You successfully constructed and verified all {TOTAL_LEVELS} vocabulary towers!
          </p>
          <div className="bg-pink-50 border-2 border-pink-200 rounded-2xl p-4 mb-6">
            <span className="text-xs uppercase tracking-wider font-black text-pink-700 block mb-1">
              Architecture Score
            </span>
            <span className="text-3xl font-black text-pink-600">{score} pts</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setLevel(0);
                setScore(0);
                setTowerHeight(0);
                loadLevel(0);
              }}
              className="flex-1 py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Build New Towers
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
          <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
            <Blocks size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-slate-800">Vocabulary Builder</h1>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">
              Tower {level + 1} of {TOTAL_LEVELS}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-pink-50 border border-pink-200 text-pink-700 px-2 py-0.5 rounded-lg text-xs font-black">
            🏢 {towerHeight} Built
          </span>
          <span className="font-black text-pink-600 text-base">{score} pts</span>
        </div>
      </div>

      {currentWord && (
        <div className="w-full flex flex-col gap-4">
          {/* Blueprint Card */}
          <div className="w-full bg-gradient-to-r from-pink-600 to-rose-600 rounded-3xl p-5 text-white text-center shadow-lg">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-pink-200 block mb-1">
              Building Blueprint: Meaning
            </span>
            <h2 className="text-xl sm:text-2xl font-black mb-1">
              "{currentWord.definition}"
            </h2>
          </div>

          {/* Construction Foundation: Assembled Slots */}
          <div className="w-full bg-white p-5 rounded-3xl border-2 sm:border-4 border-slate-200 shadow-sm flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Assembled Word Structure:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {expectedChunks.map((_, i) => (
                <div
                  key={i}
                  className={`min-w-[64px] sm:min-w-[80px] h-12 sm:h-14 px-3 rounded-2xl border-3 flex items-center justify-center font-black text-base sm:text-lg shadow-inner ${
                    placedChunks[i]
                      ? 'bg-pink-100 border-pink-500 text-pink-800'
                      : 'bg-slate-50 border-dashed border-slate-300 text-slate-300'
                  }`}
                >
                  {placedChunks[i] || `Chunk ${i + 1}`}
                </div>
              ))}
            </div>
          </div>

          {/* Available Chunks to Tap */}
          {gameState === 'building' && (
            <div className="w-full bg-slate-50 p-4 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tap matching syllable or morpheme block:
              </span>
              <div className="flex flex-wrap justify-center gap-2.5">
                {availableBlocks.map((block) => (
                  <button
                    key={block.id}
                    disabled={block.isUsed}
                    onClick={() => handlePlaceChunk(block)}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-black text-base sm:text-lg border-2 sm:border-3 shadow-xs transition-all active:scale-95 ${
                      block.isUsed
                        ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-40'
                        : 'bg-white hover:bg-pink-50 border-pink-300 hover:border-pink-400 text-pink-700'
                    }`}
                  >
                    {block.chunk}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verification Stage */}
          {gameState === 'verifying' && (
            <div className="w-full bg-emerald-50 border-3 border-emerald-400 p-5 rounded-3xl text-center shadow-md">
              <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-lg mb-1">
                <CheckCircle2 size={24} className="text-emerald-600" />
                <span>Word Construction Complete: {currentWord.word}!</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-700 font-bold mb-4">
                Now verify understanding: "{currentWord.word}" means {currentWord.definition.toLowerCase()}
              </p>
              <button
                onClick={handleVerifySuccess}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Complete Tower & Next Word</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

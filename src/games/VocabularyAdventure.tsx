import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { getWeightedRandomWords, getDistractors, shuffleArray } from '../utils/gameUtils';
import { getGradeConfig } from '../utils/gradeConfig';
import {
  playCorrectSound,
  playIncorrectSound,
  playWinSound,
  playStepSound,
  playBumpSound,
} from '../utils/audio';
import { haptic } from '../utils/haptics';
import { confetti } from '../utils/confetti';
import { Link } from 'react-router-dom';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flag,
  HelpCircle,
  Map as MapIcon,
  X,
  Sparkles,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { VocabWord } from '../types';
import { SHOP_ITEMS } from '../data/shopItems';
import { GameGraphic } from '../components/GameGraphic';
import { useGameTimeouts, useLatest, useActionLock } from '../hooks/useGameTimers';

// Base 10x10 map (0: Open Path, 1: Wall, 3: Finish)
// Row 6 at x=1 is opened (0) so the player can explore both UP and RIGHT freely from start
const BASE_MAP_LAYOUT = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 0: Outer border
  [1, 0, 0, 0, 1, 0, 0, 0, 3, 1], // row 1: (8,1) is Finish
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 1], // row 2
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1], // row 3
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1], // row 4
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1], // row 5
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1], // row 6: (1,6) open corridor connecting start to upper maze!
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1], // row 7: (1,7) is START, broad bottom pathway
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1], // row 8: alcoves
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 9: Outer border
];

const START_POS = { x: 1, y: 7 };

export function VocabularyAdventure() {
  const { words, recordPractice } = useVocabStore();
  const { recordAnswer, addCoins, addStars, incrementGamesCompleted, mascotBaseId } = useProgressStore();
  const { soundEnabled, gradeLevel, reduceMotion } = useSettingsStore();
  const config = getGradeConfig(gradeLevel);

  // Determine player avatar from equipped mascot or default mascot emoji
  const activeAvatar = SHOP_ITEMS.find((item) => item.id === mascotBaseId);
  const playerAvatarEmoji = activeAvatar?.emoji || '🐱';

  // Generate map with placed challenges away from immediate starting tiles
  const generateMap = useCallback(() => {
    const newMap = BASE_MAP_LAYOUT.map((row) => [...row]);
    const validSpots: { x: number; y: number }[] = [];

    for (let y = 0; y < newMap.length; y++) {
      for (let x = 0; x < newMap[0].length; x++) {
        const isStart = x === START_POS.x && y === START_POS.y;
        const distToStart = Math.abs(x - START_POS.x) + Math.abs(y - START_POS.y);
        const isFinish = newMap[y][x] === 3;

        // Place challenges only on open grass at least 2 steps away from start
        if (newMap[y][x] === 0 && !isStart && distToStart > 1 && !isFinish) {
          validSpots.push({ x, y });
        }
      }
    }

    const shuffledSpots = shuffleArray(validSpots);
    // Place a balanced number of challenges (up to 7, or words.length)
    const numChallenges = Math.min(Math.max(2, Math.min(words.length, 6)), shuffledSpots.length);
    for (let i = 0; i < numChallenges; i++) {
      const spot = shuffledSpots[i];
      newMap[spot.y][spot.x] = 2; // Challenge block
    }
    return newMap;
  }, [words.length]);

  const [map, setMap] = useState<number[][]>(generateMap);
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>(START_POS);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [gameState, setGameState] = useState<'exploring' | 'challenge' | 'finished'>('exploring');
  const [score, setScore] = useState(0);
  const [bumpDir, setBumpDir] = useState<{ dx: number; dy: number } | null>(null);
  const [challengesSolved, setChallengesSolved] = useState(0);
  const [portalHint, setPortalHint] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  // Challenge modal state
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [options, setOptions] = useState<VocabWord[]>([]);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<{ isWrong: boolean; message: string } | null>(null);

  // Active press-and-hold interval ref for smooth button controls
  const repeatTimerRef = useRef<{ delay: NodeJS.Timeout | null; repeat: NodeJS.Timeout | null }>({
    delay: null,
    repeat: null,
  });

  const stopRepeatRef = useRef<() => void>(() => {});

  // Touch swipe gesture ref
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gameViewportRef = useRef<HTMLDivElement | null>(null);

  // Focus game viewport on mount so keyboard controls work immediately
  useEffect(() => {
    if (gameViewportRef.current) {
      gameViewportRef.current.focus();
    }
  }, []);

  const timeouts = useGameTimeouts();

  // Re-place gates when the word list changes size (e.g. words finished loading or the lesson
  // changed) but only before the player has started exploring. The old rule regenerated the map
  // whenever every gate was solved, which could drop a new gate right under the player and
  // made the "all gates cleared" state unreachable.
  const isFreshRun = challengesSolved === 0 && playerPos.x === START_POS.x && playerPos.y === START_POS.y;
  const isFreshRunRef = useLatest(isFreshRun);
  const isFirstMapRun = useRef(true);
  useEffect(() => {
    if (isFirstMapRun.current) {
      isFirstMapRun.current = false;
      return;
    }
    if (isFreshRunRef.current) setMap(generateMap());
  }, [generateMap]);

  // Start vocabulary challenge
  const answerLock = useActionLock();

  const startChallenge = useCallback(
    (pos: { x: number; y: number }) => {
      if (words.length < 2) return;
      const nextWord = getWeightedRandomWords(words, 1)[0];
      const numOptions = Math.min(words.length - 1, config.answerChoices - 1);
      const distractors = getDistractors(words, nextWord, numOptions);
      const allOptions = shuffleArray([...distractors, nextWord]);

      setCurrentWord(nextWord);
      setOptions(allOptions);
      setTargetPos(pos);
      setChallengeFeedback(null);
      setIsAnswering(false);
      answerLock.release();
      setGameState('challenge');
    },
    [words, config.answerChoices]
  );

  // Move player logic
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (gameState !== 'exploring') return;

      const nx = playerPos.x + dx;
      const ny = playerPos.y + dy;

      // Boundary check
      if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) {
        playBumpSound(soundEnabled);
        haptic.bump();
        return;
      }

      if (dx < 0) setFacing('left');
      if (dx > 0) setFacing('right');

      const cell = map[ny][nx];

      // Wall collision
      if (cell === 1) {
        playBumpSound(soundEnabled);
        haptic.bump();
        setBumpDir({ dx, dy });
        timeouts.set(() => setBumpDir(null), 180);
        return;
      }

      // Vocabulary challenge tile
      if (cell === 2) {
        stopRepeatRef.current();
        haptic.medium();
        startChallenge({ x: nx, y: ny });
        return;
      }

      // Finish line!
      if (cell === 3) {
        if (challengesSolved === 0) {
          playBumpSound(soundEnabled);
          haptic.bump();
          setPortalHint('⚡ Exit Portal Locked! Unlock at least one Vocabulary Gate to power the portal.');
          timeouts.set(() => setPortalHint(null), 3000);
          return;
        }

        stopRepeatRef.current();
        playWinSound(soundEnabled);
        haptic.win();
        setPlayerPos({ x: nx, y: ny });
        setGameState('finished');
        incrementGamesCompleted();
        addStars(5);
        addCoins(50);
        if (!reduceMotion) {
          confetti({ particleCount: 300, spread: 120, origin: { y: 0.5 } });
        }
        return;
      }

      // Regular open path step
      playStepSound(soundEnabled);
      haptic.step();
      setPlayerPos({ x: nx, y: ny });
    },
    [gameState, map, playerPos, soundEnabled, reduceMotion, startChallenge, challengesSolved, incrementGamesCompleted, addStars, addCoins]
  );

  // Press-and-hold repeat calls the *latest* movePlayer: the captured one kept stepping from
  // the original tile and still believed the game was 'exploring' after a gate or the finish
  // had been reached (re-rolling the gate question and re-awarding the trophy while held).
  const movePlayerRef = useLatest(movePlayer);

  // Stop button repeat interval
  const stopRepeat = useCallback(() => {
    if (repeatTimerRef.current.delay) clearTimeout(repeatTimerRef.current.delay);
    if (repeatTimerRef.current.repeat) clearInterval(repeatTimerRef.current.repeat);
    repeatTimerRef.current.delay = null;
    repeatTimerRef.current.repeat = null;
  }, []);

  // Trigger movement with press-and-hold repeat
  const handleControlAction = useCallback(
    (dx: number, dy: number, e?: React.SyntheticEvent | React.TouchEvent | React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      stopRepeat();
      movePlayerRef.current(dx, dy);

      // Press-and-hold repeat for continuous movement down hallways
      repeatTimerRef.current.delay = setTimeout(() => {
        repeatTimerRef.current.repeat = setInterval(() => {
          movePlayerRef.current(dx, dy);
        }, 180);
      }, 280);
    },
    [stopRepeat]
  );

  // Stop any held movement when a gate opens, the game ends, or the app is backgrounded
  useEffect(() => {
    if (gameState !== 'exploring') stopRepeat();
  }, [gameState, stopRepeat]);

  stopRepeatRef.current = stopRepeat;

  // Cleanup repeat timer on unmount or mouse/pointer release
  useEffect(() => {
    const handleGlobalRelease = () => stopRepeat();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') stopRepeat();
    };
    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('blur', handleGlobalRelease);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stopRepeat();
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('blur', handleGlobalRelease);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [stopRepeat]);

  // Keyboard navigation handler with preventDefault to stop browser scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'exploring') return;

      const key = e.key.toLowerCase();
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp' || key === 'w') {
        dy = -1;
      } else if (e.key === 'ArrowDown' || key === 's') {
        dy = 1;
      } else if (e.key === 'ArrowLeft' || key === 'a') {
        dx = -1;
      } else if (e.key === 'ArrowRight' || key === 'd') {
        dx = 1;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        e.stopPropagation();
        movePlayer(dx, dy);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePlayer]);

  // Touch Swipe Handlers for Maze Grid
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || gameState !== 'exploring') return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const minDistance = 24;

    if (Math.max(absDx, absDy) >= minDistance) {
      if (absDx > absDy) {
        movePlayer(dx > 0 ? 1 : -1, 0);
      } else {
        movePlayer(0, dy > 0 ? 1 : -1);
      }
    }
  };

  // Answer handler for challenge modal
  const handleAnswer = (option: VocabWord) => {
    if (!currentWord || isAnswering || !answerLock.acquire()) return;
    setIsAnswering(true);
    const correct = option.id === currentWord.id;
    recordPractice(currentWord.id, correct);
    recordAnswer(correct);

    if (correct) {
      playCorrectSound(soundEnabled);
      haptic.success();
      setScore((s) => s + 100);
      addCoins(25);
      setChallengesSolved((c) => c + 1);

      // Remove challenge block from map cleanly
      if (targetPos) {
        setMap((prev) => {
          const next = prev.map((row) => [...row]);
          next[targetPos.y][targetPos.x] = 0;
          return next;
        });
        setPlayerPos(targetPos);
      }

      setGameState('exploring');
      setChallengeFeedback(null);
      setIsAnswering(false);
    } else {
      playIncorrectSound(soundEnabled);
      haptic.error();
      setChallengeFeedback({
        isWrong: true,
        message: `Oops! "${currentWord.word}" means: ${currentWord.definition}`,
      });
      // Stays locked: the options are replaced by the explanation, and the next gate
      // (startChallenge) releases the lock.
      setIsAnswering(false);
    }
  };

  const restart = () => {
    haptic.medium();
    stopRepeat();
    timeouts.clearAll();
    setMap(generateMap());
    setPlayerPos(START_POS);
    setGameState('exploring');
    setScore(0);
    setChallengesSolved(0);
    setPortalHint(null);
    setIsAnswering(false);
    setChallengeFeedback(null);
  };

  if (words.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border-4 border-slate-200 text-center max-w-md">
          <p className="font-black text-slate-700 text-lg mb-2">Need More Words!</p>
          <p className="text-sm text-slate-500 mb-4">
            Adventure Mode requires at least 2 vocabulary words to play.
          </p>
          <Link
            to="/editor"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-all"
          >
            Add Words
          </Link>
        </div>
      </div>
    );
  }

  // Game Completed Screen
  if (gameState === 'finished') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-6 p-3 sm:p-4 w-full">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 sm:border-8 border-emerald-300 text-center max-w-md w-full">
          <GameGraphic type="trophy" size="xl" className="mx-auto mb-3 animate-bounce sm:w-24 sm:h-24" />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-1">Adventure Complete!</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-bold mb-4">You conquered the vocabulary realm!</p>
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 sm:p-4 mb-5">
            <p className="text-xl sm:text-2xl font-black text-emerald-600">{score} Points</p>
            <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 mt-2">
              <div className="flex items-center gap-1.5 font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full text-xs">
                <GameGraphic type="coin" size="xs" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>+50 Coins</span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full text-xs">
                <GameGraphic type="star" size="xs" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>+5 Stars</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <button
              onClick={restart}
              className="bg-emerald-500 border-b-4 border-emerald-700 hover:bg-emerald-400 text-white font-black p-3 sm:p-3.5 rounded-xl active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <RotateCcw size={18} />
              <span>Explore Again</span>
            </button>
            <Link
              to="/games"
              className="bg-slate-100 border-b-4 border-slate-300 hover:bg-slate-200 text-slate-700 font-black p-3 sm:p-3.5 rounded-xl active:border-b-0 active:translate-y-1 transition-all block text-center text-xs sm:text-sm"
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
      ref={gameViewportRef}
      tabIndex={0}
      className="flex-1 flex flex-col items-center p-2 sm:p-4 w-full max-w-4xl mx-auto overflow-hidden outline-none"
    >
      {/* Top Header */}
      <div className="w-full flex justify-between items-center bg-white/95 backdrop-blur-sm p-2.5 sm:p-3 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <MapIcon size={18} className="sm:w-5 sm:h-5" />
          </span>
          <div>
            <div className="font-black text-slate-800 text-xs sm:text-sm leading-tight">Adventure Mode</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-bold truncate max-w-[150px] sm:max-w-none">
              Reach the Golden Trophy 🏆
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="font-black text-emerald-600 text-sm sm:text-lg bg-emerald-50 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl border border-emerald-200">
            {score} pts
          </div>
          <button
            type="button"
            onClick={restart}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Reset Maze"
            aria-label="Reset maze"
          >
            <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>

      {/* Main Play Area: Adapts intelligently to portrait and landscape */}
      <div className="w-full flex flex-col landscape:flex-row items-center justify-center gap-3 sm:gap-6 flex-1 min-h-0">
        
        {/* Game Viewport Container */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative bg-gradient-to-b from-emerald-800 to-emerald-950 p-2 sm:p-3 rounded-2xl sm:rounded-3xl shadow-2xl border-4 sm:border-8 border-emerald-900 w-full aspect-square max-w-[min(90vw,440px)] landscape:max-w-[min(65vh,400px)] flex items-center justify-center overflow-hidden select-none touch-none shrink-0"
        >
          {/* Portal Locked Notification */}
          {portalHint && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xl animate-bounce text-center max-w-[92%] border-2 border-amber-300">
              {portalHint}
            </div>
          )}
          {/* Map Grid */}
          <div
            className="grid gap-1 sm:gap-1.5 transition-all w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${map[0].length}, minmax(0, 1fr))`,
            }}
          >
            {map.map((row, y) =>
              row.map((cell, x) => {
                const isPlayer = playerPos.x === x && playerPos.y === y;
                const isStartTile = x === START_POS.x && y === START_POS.y;

                // Tile Styling
                let cellClass = 'aspect-square rounded-lg transition-all relative flex items-center justify-center ';
                if (cell === 1) {
                  // Solid Stone Wall Block
                  cellClass +=
                    'bg-emerald-950/90 border-2 border-emerald-900/60 shadow-inner text-emerald-700/30';
                } else if (cell === 2) {
                  // Vocabulary Challenge
                  cellClass +=
                    'bg-amber-400 border-2 sm:border-3 border-amber-500 shadow-md animate-pulse text-amber-950';
                } else if (cell === 3) {
                  // Finish Portal
                  cellClass +=
                    'bg-gradient-to-br from-yellow-300 to-amber-500 border-2 sm:border-3 border-yellow-200 shadow-lg text-yellow-900 animate-bounce';
                } else {
                  // Open Pathway / Grass
                  cellClass += 'bg-emerald-600/50 border border-emerald-500/30';
                }

                return (
                  <div key={`${x}-${y}`} className={cellClass}>
                    {/* Wall Texture Detail */}
                    {cell === 1 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-900/40" />
                    )}

                    {/* Start Marker */}
                    {isStartTile && cell === 0 && !isPlayer && (
                      <span className="text-[10px] font-black text-emerald-300 opacity-60">S</span>
                    )}

                    {/* Challenge Tile Icon */}
                    {cell === 2 && (
                      <GameGraphic
                        type="gem"
                        size="sm"
                        className="w-[80%] h-[80%] animate-pulse pointer-events-none select-none"
                      />
                    )}

                    {/* Finish Goal Icon */}
                    {cell === 3 && (
                      <GameGraphic
                        type="portal"
                        size="sm"
                        className="w-[85%] h-[85%] animate-bounce pointer-events-none select-none"
                      />
                    )}

                    {/* Player Mascot Character */}
                    {isPlayer && (
                      <div
                        className={cn(
                          'absolute inset-0 z-20 flex items-center justify-center transition-transform duration-150',
                          bumpDir && 'animate-wiggle',
                          facing === 'left' ? '-scale-x-100' : 'scale-x-100'
                        )}
                      >
                        <GameGraphic
                          type="avatar"
                          emoji={playerAvatarEmoji}
                          size="sm"
                          className="w-[125%] h-[125%] pointer-events-none select-none text-2xl"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Challenge Modal Overlay */}
          {gameState === 'challenge' && currentWord && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 z-50 animate-in fade-in duration-200">
              <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-2xl border-4 border-sky-400 w-full max-w-sm flex flex-col gap-2.5 sm:gap-3 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-sky-600 uppercase tracking-wide">
                    <Sparkles size={15} />
                    <span>Vocabulary Gate</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGameState('exploring');
                      setChallengeFeedback(null);
                    }}
                    aria-label="Close vocabulary gate"
                    className="p-2 -m-1 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="text-center py-0.5 sm:py-1">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Define Word</span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 break-words mt-0.5">
                    {currentWord.word}
                  </h3>
                </div>

                {challengeFeedback?.isWrong ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl text-xs text-rose-800 font-bold leading-relaxed">
                      {challengeFeedback.message}
                    </div>
                    <button
                      onClick={() => {
                        setGameState('exploring');
                        setChallengeFeedback(null);
                      }}
                      className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 sm:gap-2 max-h-52 overflow-y-auto pr-1">
                    {options.map((opt, i) => (
                      <button
                        key={opt.id}
                        disabled={isAnswering}
                        onClick={() => handleAnswer(opt)}
                        className={`bg-slate-50 border-2 border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-700 font-bold text-xs p-2.5 sm:p-3 rounded-xl text-left transition-all active:scale-98 shadow-sm flex items-start gap-2 ${
                          isAnswering ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="leading-snug">{opt.definition}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Universal Arrow Controls (D-Pad) - Adapts side-by-side in landscape */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white/95 rounded-2xl sm:rounded-3xl shadow-md border-2 sm:border-4 border-slate-200 select-none touch-none">
            {/* Row 1: UP Arrow */}
            <div />
            <button
              type="button"
              onPointerDown={(e) => handleControlAction(0, -1, e)}
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-b from-sky-400 to-sky-500 border-b-4 border-sky-700 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white active:border-b-0 active:translate-y-1 shadow-md hover:brightness-105 transition-all cursor-pointer touch-manipulation select-none"
              aria-label="Move Up"
            >
              <ArrowUp size={24} className="stroke-[2.5] sm:w-7 sm:h-7" />
              <span className="text-[8px] sm:text-[9px] font-black opacity-80 -mt-1 hidden sm:inline">W / ↑</span>
            </button>
            <div />

            {/* Row 2: LEFT, DOWN, RIGHT Arrows */}
            <button
              type="button"
              onPointerDown={(e) => handleControlAction(-1, 0, e)}
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-b from-sky-400 to-sky-500 border-b-4 border-sky-700 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white active:border-b-0 active:translate-y-1 shadow-md hover:brightness-105 transition-all cursor-pointer touch-manipulation select-none"
              aria-label="Move Left"
            >
              <ArrowLeft size={24} className="stroke-[2.5] sm:w-7 sm:h-7" />
              <span className="text-[8px] sm:text-[9px] font-black opacity-80 -mt-1 hidden sm:inline">A / ←</span>
            </button>

            <button
              type="button"
              onPointerDown={(e) => handleControlAction(0, 1, e)}
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-b from-sky-400 to-sky-500 border-b-4 border-sky-700 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white active:border-b-0 active:translate-y-1 shadow-md hover:brightness-105 transition-all cursor-pointer touch-manipulation select-none"
              aria-label="Move Down"
            >
              <ArrowDown size={24} className="stroke-[2.5] sm:w-7 sm:h-7" />
              <span className="text-[8px] sm:text-[9px] font-black opacity-80 -mt-1 hidden sm:inline">S / ↓</span>
            </button>

            <button
              type="button"
              onPointerDown={(e) => handleControlAction(1, 0, e)}
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-b from-sky-400 to-sky-500 border-b-4 border-sky-700 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white active:border-b-0 active:translate-y-1 shadow-md hover:brightness-105 transition-all cursor-pointer touch-manipulation select-none"
              aria-label="Move Right"
            >
              <ArrowRight size={24} className="stroke-[2.5] sm:w-7 sm:h-7" />
              <span className="text-[8px] sm:text-[9px] font-black opacity-80 -mt-1 hidden sm:inline">D / →</span>
            </button>
          </div>

          {/* Helpful Controls Note */}
          <p className="text-[11px] sm:text-xs text-slate-500 font-bold text-center max-w-[280px]">
            Tap arrows, swipe on map, or use <span className="text-sky-600 font-black">WASD / Arrow Keys</span>
          </p>
        </div>
      </div>
    </div>
  );
}

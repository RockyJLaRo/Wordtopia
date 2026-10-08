import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Gamepad2, Map, Trophy, BookMarked, Store, Flame, Pencil, Check, X, Sparkles, FileCheck, Camera } from 'lucide-react';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useAuthStore } from '../store/useAuthStore';
import { SHOP_ITEMS } from '../data/shopItems';
import { MascotAvatar } from '../components/MascotAvatar';
import { LessonSelector } from '../components/LessonSelector';
import { playMascotSound, playClickSound } from '../utils/audio';
import { notify } from '../components/NotificationToast';

function MascotDisplay() {
  const {
    mascotName,
    setMascotName,
    mascotHealth,
    mascotHappiness,
    equipped,
    dailyStreak,
    spendCoins,
    feedMascot,
    playWithMascot,
    setAvatarExportOpen,
  } = useProgressStore();
  const { token } = useAuthStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(mascotName || 'Aurora');

  const handleSaveName = async () => {
    const finalName = editedName.trim() || 'Aurora';
    setMascotName(finalName);
    setIsEditingName(false);

    // Sync to cloud if user is authenticated
    if (token) {
      try {
        await fetch('/api/progress/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mascotName: finalName }),
        });
      } catch {}
    }
  };

  const NAME_SUGGESTIONS = ['Aurora', 'Mochi', 'Pixel', 'Luna', 'Cosmo', 'Barnaby', 'Bubbles', 'Sparky'];

  const handleFeed = () => {
    if (mascotHealth >= 100) return;
    if (spendCoins(10)) {
      feedMascot(15);
    } else {
      notify.warning('Not enough coins to buy food! Play games to earn more coins.');
    }
  };

  const handlePlay = () => {
    if (mascotHappiness >= 100) return;
    if (spendCoins(10)) {
      playWithMascot(15);
    } else {
      notify.warning('Not enough coins to buy toys! Play games to earn more coins.');
    }
  };

  return (
    <div className="relative bg-white rounded-3xl p-5 sm:p-6 md:p-8 border-4 border-slate-200 shadow-xl max-w-sm w-full mx-auto text-center flex flex-col items-center group overflow-hidden">
      {dailyStreak > 0 && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-orange-100 border-2 border-orange-300 text-orange-700 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1 z-20">
          <Flame size={14} className="fill-orange-500 text-orange-500 sm:w-4 sm:h-4" />
          {dailyStreak} Day Streak
        </div>
      )}

      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-100 via-white to-white opacity-50"></div>

      <div 
        onClick={() => {
          playMascotSound();
          setAvatarExportOpen(true);
        }}
        className="relative z-10 mb-2 mt-4 sm:mt-2 flex flex-col items-center justify-center max-w-full cursor-pointer transition-transform hover:scale-105 active:scale-95 group/avatar"
        title="Click to view & save avatar as PNG (2x - 10x scale)!"
      >
        <MascotAvatar equipped={equipped} size={140} />
        <div className="mt-1.5 opacity-90 group-hover/avatar:opacity-100 transition-opacity bg-amber-500/90 hover:bg-amber-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-amber-300">
          <Camera size={13} />
          <span>Save Avatar PNG (2x - 10x)</span>
        </div>
      </div>

      {/* Mascot Name and Interactive Rename */}
      {isEditingName ? (
        <div className="relative z-10 w-full mb-3 flex flex-col items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveName();
            }}
            className="flex items-center justify-center gap-1.5 w-full max-w-[260px]"
          >
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              maxLength={20}
              autoFocus
              placeholder="Mascot Name"
              className="flex-1 px-3 py-1.5 text-sm font-black border-2 border-sky-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300 text-center bg-white shadow-xs text-slate-800"
            />
            <button
              type="submit"
              className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-xs transition-colors shrink-0"
              title="Save Name"
              aria-label="Save mascot name"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditedName(mascotName || 'Aurora');
                setIsEditingName(false);
              }}
              className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl transition-colors shrink-0"
              title="Cancel"
              aria-label="Cancel editing"
            >
              <X size={16} />
            </button>
          </form>
          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-1 mt-2 max-w-xs">
            <span className="text-[10px] text-slate-400 font-bold mr-1">Ideas:</span>
            {NAME_SUGGESTIONS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setEditedName(name)}
                className="text-[10px] px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-md border border-sky-200 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex items-center justify-center gap-1.5 group/name">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 break-words max-w-full">
            {mascotName || 'Aurora'}
          </h2>
          <button
            type="button"
            onClick={() => {
              setEditedName(mascotName || 'Aurora');
              setIsEditingName(true);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors opacity-70 hover:opacity-100"
            title="Change Mascot Name"
            aria-label="Change mascot name"
          >
            <Pencil size={15} />
          </button>
        </div>
      )}

      <p className="text-slate-500 font-bold text-xs sm:text-sm mb-4 relative z-10">
        Keep {mascotName || 'Aurora'} happy and healthy by studying!
      </p>

      <div className="w-full space-y-3 relative z-10 mb-4">
        <div>
          <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-600 mb-1">
            <span>Health</span>
            <span>{mascotHealth ?? 50}%</span>
          </div>
          <div className="h-3.5 sm:h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200">
            <div
              className="h-full bg-red-400 rounded-full transition-all duration-1000"
              style={{ width: `${mascotHealth ?? 50}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-600 mb-1">
            <span>Happiness</span>
            <span>{mascotHappiness ?? 50}%</span>
          </div>
          <div className="h-3.5 sm:h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-1000"
              style={{ width: `${mascotHappiness ?? 50}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 w-full relative z-10 mb-2">
        <button
          onClick={handleFeed}
          disabled={mascotHealth >= 100}
          title="Feed Mascot (10 Coins)"
          className="flex-1 bg-red-100 text-red-600 font-black py-2 px-2 rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-200 text-xs sm:text-sm"
        >
          🍎 Feed (10)
        </button>
        <button
          onClick={handlePlay}
          disabled={mascotHappiness >= 100}
          title="Play With Mascot (10 Coins)"
          className="flex-1 bg-green-100 text-green-600 font-black py-2 px-2 rounded-xl hover:bg-green-200 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-200 text-xs sm:text-sm"
        >
          🎾 Play (10)
        </button>
      </div>

      <Link
        to="/wordrobe"
        title="Open The Wordrobe"
        className="w-full relative z-10 bg-slate-100 text-slate-600 font-black py-2 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 border-2 border-slate-200 text-xs sm:text-sm"
      >
        <span>👕</span> The Wordrobe
      </Link>
    </div>
  );
}

function DailyStreakBanner() {
  const { dailyStreak, lastClaimDate, claimDailyReward } = useProgressStore();
  const today = new Date().toLocaleDateString('en-CA');
  const canClaim = lastClaimDate !== today;

  if (!canClaim && dailyStreak === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl p-4 sm:p-6 text-white shadow-lg border-4 border-orange-300 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
        <div className="bg-white/20 p-2.5 sm:p-3 rounded-full shrink-0">
          <Flame size={28} className="fill-orange-200 text-orange-200 sm:w-8 sm:h-8" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black">
            {Math.max(dailyStreak, canClaim ? 1 : 0)} Day Streak!
          </h3>
          <p className="text-orange-100 font-bold text-xs sm:text-sm leading-tight mt-0.5">
            {canClaim
              ? 'Claim your daily login reward to build your streak!'
              : 'Awesome! Come back tomorrow for more rewards.'}
          </p>
        </div>
      </div>

      {canClaim && (
        <button
          onClick={claimDailyReward}
          title="Claim Daily Login Reward"
          className="w-full sm:w-auto bg-white text-orange-600 font-black py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl hover:bg-orange-50 transition-colors shadow-sm active:scale-95 whitespace-nowrap text-center text-sm sm:text-base shrink-0"
        >
          Claim Reward
        </button>
      )}
    </div>
  );
}

export function Home() {
  const { words, allWords, selectedLesson, isLoading, error } = useVocabStore();

  return (
    <div className="flex-1 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6 lg:gap-8 xl:gap-12 py-2 sm:py-4 max-w-7xl mx-auto w-full">
      {/* Left Column: Mascot Status */}
      <div className="w-full xl:w-1/3 flex flex-col items-center xl:items-start space-y-4 sm:space-y-6">
        <div className="text-center xl:text-left space-y-1 w-full">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-800"
            style={{ WebkitTextStroke: '1px rgba(0,0,0,0.05)' }}
          >
            Wordtopia
          </h1>
          <p className="text-sky-600 font-bold text-sm sm:text-base md:text-lg">
            Learn words. Raise your friend.
          </p>
        </div>

        <MascotDisplay />

        <div className="bg-white/90 p-3.5 sm:p-4 rounded-2xl shadow-sm border-2 border-slate-200 text-center w-full max-w-sm">
          {isLoading ? (
            <p className="text-slate-500 font-bold animate-pulse text-xs sm:text-sm">
              Checking vocabularies...
            </p>
          ) : error && words.length === 0 ? (
            <div className="space-y-2">
              <p className="text-rose-500 font-bold text-xs sm:text-sm">
                Oops! Couldn't load words.
              </p>
              <Link
                to="/editor"
                className="text-xs sm:text-sm bg-slate-100 px-4 py-2 rounded-lg font-bold block hover:bg-slate-200"
              >
                Enter Words Manually
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-sky-600 truncate">
                Current Lesson: {selectedLesson === 'all' ? 'All Lessons' : selectedLesson}
              </div>
              <p className="text-slate-600 font-bold text-xs sm:text-sm">
                <span className="text-sky-600 text-lg sm:text-xl">{words.length}</span> Words in
                Lesson
                {selectedLesson !== 'all' && (
                  <span className="text-[11px] text-slate-400 block font-medium">
                    ({allWords.length} total in course)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Menu Grid */}
      <div className="w-full xl:w-2/3 max-w-2xl flex flex-col">
        <DailyStreakBanner />
        <LessonSelector variant="banner" className="mb-4" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
          <MenuButton
            to="/game/vocab-adventure"
            icon={<Map size={28} className="sm:w-8 sm:h-8" />}
            title="ADVENTURE"
            subtitle="Explore & Learn"
            color="bg-emerald-500"
            hoverColor="hover:bg-emerald-400"
            borderColor="border-emerald-600"
            featured
          />

          <MenuButton
            to="/games"
            icon={<Gamepad2 size={28} className="sm:w-8 sm:h-8" />}
            title="MINI-GAMES"
            subtitle="Play to Practice"
            color="bg-purple-500"
            hoverColor="hover:bg-purple-400"
            borderColor="border-purple-600"
          />

          <MenuButton
            to="/shop"
            icon={<Store size={28} className="sm:w-8 sm:h-8" />}
            title="MARKETPLACE"
            subtitle="Buy Mascot Gear"
            color="bg-amber-500"
            hoverColor="hover:bg-amber-400"
            borderColor="border-amber-600"
          />

          <MenuButton
            to="/study"
            icon={<BookOpen size={28} className="sm:w-8 sm:h-8" />}
            title="STUDY WORDS"
            subtitle="Review Definitions"
            color="bg-sky-500"
            hoverColor="hover:bg-sky-400"
            borderColor="border-sky-600"
          />

          <MenuButton
            to="/test"
            icon={<FileCheck size={28} className="sm:w-8 sm:h-8" />}
            title="PRACTICE TEST"
            subtitle="Worksheet & Test"
            color="bg-indigo-500"
            hoverColor="hover:bg-indigo-400"
            borderColor="border-indigo-600"
          />
        </div>

        {/* Footer Links */}
        <div className="mt-6 sm:mt-8 flex justify-center xl:justify-start">
          <Link
            to="/editor"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold bg-white/70 hover:bg-white px-4 py-2 rounded-full border-2 border-slate-200 text-xs sm:text-sm transition-colors shadow-sm"
          >
            <BookMarked size={16} />
            Manage Vocabulary
          </Link>
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  to,
  icon,
  title,
  subtitle,
  color,
  hoverColor,
  borderColor,
  featured,
}: any) {
  return (
    <Link
      to={to}
      className={`
        relative group overflow-hidden rounded-2xl border-b-6 sm:border-b-8 ${borderColor} ${color} ${hoverColor} 
        transition-all active:translate-y-1 active:border-b-0 p-4 sm:p-6 flex flex-col items-center justify-center text-white
        ${featured ? 'sm:col-span-2 py-6 sm:py-8' : ''}
      `}
    >
      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
      <div className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-2 text-center">
        <div className="bg-white/20 p-3 sm:p-4 rounded-xl backdrop-blur-sm">{icon}</div>
        <h2 className="text-xl sm:text-2xl font-black tracking-wide">{title}</h2>
        <p className="text-white/80 font-bold text-xs uppercase tracking-widest">{subtitle}</p>
      </div>
    </Link>
  );
}

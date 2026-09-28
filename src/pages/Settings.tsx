import { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { SHOP_ITEMS } from '../data/shopItems';
import { useProgressStore } from '../store/useProgressStore';
import { useVocabStore } from '../store/useVocabStore';
import { useAuthStore } from '../store/useAuthStore';
import { GradeLevel } from '../types';
import { Lock, Unlock, MessageSquare, User, Shield, ShieldAlert, Sparkles, LogOut, RefreshCw, KeyRound, Palette, Check, Smile } from 'lucide-react';
import { FeedbackModal } from '../components/FeedbackModal';
import { GameGraphic } from '../components/GameGraphic';
import { SoundTestPad } from '../components/SoundControls';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { Link } from 'react-router-dom';

const GRADES: GradeLevel[] = [
  'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', 
  '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', 
  '10th Grade', '11th Grade', '12th Grade', 'Custom'
];

export function Settings() {
  const { gradeLevel, setGradeLevel, soundEnabled, toggleSound, reduceMotion, toggleReduceMotion, isAdmin, setAdmin } = useSettingsStore();
  const { resetProgress, addCoins, unlockItem, mascotName, setMascotName, ...progress } = useProgressStore();
  const { words, resetMastery } = useVocabStore();
  const { user, token, setAuthModal, logout, syncProgressWithCloud, deleteAccount } = useAuthStore();

  const [mascotInput, setMascotInput] = useState(mascotName || 'Aurora');
  const [mascotSavedNotice, setMascotSavedNotice] = useState(false);
  const [teacherPin, setTeacherPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setMascotInput(mascotName || 'Aurora');
  }, [mascotName]);

  const handleSaveMascotName = async () => {
    const finalName = mascotInput.trim() || 'Aurora';
    setMascotName(finalName);
    setMascotSavedNotice(true);
    setTimeout(() => setMascotSavedNotice(false), 2500);

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

  useEffect(() => {
    generateProblem();
  }, []);

  const generateProblem = () => {
    setNum1(Math.floor(Math.random() * 8) + 2); // 2 to 9
    setNum2(Math.floor(Math.random() * 8) + 2); // 2 to 9
  };

  const handleReset = () => {
    if (window.confirm('Are you sure? This will erase your points, achievements, streaks, and mastery progress.')) {
      resetProgress();
      resetMastery();
      alert('Progress has been reset.');
    }
  };

  const attemptUnlock = () => {
    if (parseInt(teacherPin) === num1 * num2) {
      setUnlocked(true);
    } else {
      alert('Incorrect answer.');
      setTeacherPin('');
      generateProblem();
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    await syncProgressWithCloud();
    setTimeout(() => setSyncing(false), 500);
  };

  const handleDeleteMyAccount = async () => {
    if (confirm('Are you sure you want to permanently delete your account and all associated cloud data? This cannot be undone.')) {
      const res = await deleteAccount();
      alert(res.message);
    }
  };

  const masteredCount = words.filter(w => w.masteryLevel === 'Mastered').length;

  return (
    <div className="flex-1 flex flex-col items-center py-3 sm:py-6 gap-3 sm:gap-6 w-full max-w-2xl mx-auto px-1 sm:px-4">
      {/* Title */}
      <div className="bg-white/90 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border-2 sm:border-4 border-slate-200 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-wide">
          Game Settings
        </h1>
        <p className="text-xs text-slate-500 font-bold mt-1">
          Manage accounts, preferences, feedback, and controls
        </p>
      </div>

      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border-2 sm:border-4 border-slate-200 w-full flex flex-col gap-4 sm:gap-6">
        {/* 1. USER ACCOUNT & PROGRESS SYNC */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-slate-800 font-black text-base sm:text-lg flex items-center gap-2">
              <User className="text-sky-500" size={20} />
              Player Account & Cloud Save
            </h2>
            {user && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-300">
                Connected
              </span>
            )}
          </div>

          {user ? (
            <div className="p-3 sm:p-4 bg-sky-50/80 border-2 border-sky-200 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-black text-slate-800 text-base">{user.username}</div>
                  <div className="text-xs text-slate-500 font-medium">
                    {user.email} • Role: {user.role}
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto min-h-[44px]"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-sky-200 text-xs">
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 min-h-[44px]"
                >
                  <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                  <span>{syncing ? 'Syncing...' : 'Sync Cloud Progress'}</span>
                </button>
                <button
                  onClick={handleDeleteMyAccount}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl border border-rose-200 transition-colors min-h-[44px]"
                >
                  Delete Account
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-black text-slate-800 text-sm">Playing as Guest</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Create a free account to save your vocabulary stars and outfits across multiple
                  devices!
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setAuthModal(true, 'login')}
                  className="px-4 py-2 bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-800 font-black rounded-xl text-xs transition-all shadow-sm min-h-[44px] flex items-center justify-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthModal(true, 'register')}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl text-xs transition-all shadow-md active:scale-95 min-h-[44px] flex items-center justify-center"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </div>

        <hr className="border-slate-200 border-2 rounded-full" />

        {/* 2. MASCOT CUSTOMIZATION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-slate-800 font-black text-base sm:text-lg flex items-center gap-2">
              <Smile className="text-amber-500" size={20} />
              Mascot Profile & Name
            </h2>
            <Link
              to="/wordrobe"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Open Wordrobe →
            </Link>
          </div>

          <div className="p-4 sm:p-5 bg-amber-50/70 border-2 border-amber-200 rounded-2xl flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label htmlFor="mascotNameInput" className="font-black text-slate-800 text-sm block">
                  Mascot Name
                </label>
                <p className="text-xs text-slate-500 font-medium">
                  Give your learning companion their own personalized identity!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="mascotNameInput"
                  type="text"
                  value={mascotInput}
                  onChange={(e) => setMascotInput(e.target.value)}
                  maxLength={20}
                  placeholder="Mascot Name"
                  className="px-3 py-2 text-sm font-bold border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-800 w-44"
                />
                <button
                  type="button"
                  onClick={handleSaveMascotName}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1 min-h-[38px]"
                >
                  <Check size={14} />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {mascotSavedNotice && (
              <div className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Check size={14} className="text-emerald-600" />
                <span>Mascot name updated to "{mascotName}"!</span>
              </div>
            )}

            {/* Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-500">
              <span className="font-bold text-[11px] text-slate-400">Quick ideas:</span>
              {['Aurora', 'Mochi', 'Pixel', 'Luna', 'Barnaby', 'Bubbles', 'Cosmo', 'Sparky'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setMascotInput(s);
                  }}
                  className="px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:bg-amber-100 font-bold text-[11px] text-amber-800 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-slate-200 border-2 rounded-full" />

        {/* 3. IN-GAME FEEDBACK & BUG REPORTING */}
        <div className="space-y-3">
          <h2 className="text-slate-800 font-black text-base sm:text-lg flex items-center gap-2">
            <MessageSquare className="text-purple-500" size={20} />
            Feedback & Report Problem
          </h2>
          <div className="p-4 sm:p-5 bg-purple-50/60 border-2 border-purple-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GameGraphic
                type="avatar"
                emoji="🐱"
                size="md"
                className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-transparent border-0 shadow-none text-2xl sm:text-3xl"
              />
              <div>
                <p className="font-black text-slate-800 text-xs sm:text-sm">
                  «Something went wrong? Tell us what happened!»
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Submit a bug report, gameplay idea, audio or graphics note.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition-all active:scale-95 whitespace-nowrap min-h-[44px] flex items-center justify-center"
            >
              Open Feedback Form
            </button>
          </div>
        </div>

        <hr className="border-slate-200 border-2 rounded-full" />

        {/* 3. GRADE LEVEL */}
        <div>
          <label className="block text-slate-700 font-black mb-1 sm:mb-2 text-base sm:text-lg">
            Grade Level
          </label>
          <p className="text-xs sm:text-sm text-slate-500 font-bold mb-3">
            Adjusts question difficulty, hints, and timers.
          </p>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
            className="w-full bg-slate-100 border-2 sm:border-4 border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-sky-400 text-sm min-h-[44px]"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-slate-200 border-2 rounded-full" />

        {/* 4. PREFERENCES & SOUND EFFECT MANAGER */}
        <div>
          <h2 className="text-slate-700 font-black mb-3 sm:mb-4 text-base sm:text-lg">Audio & Accessibility</h2>
          <div className="flex flex-col gap-4">
            <SoundTestPad />

            <button
              onClick={toggleReduceMotion}
              className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 sm:border-4 font-bold transition-colors min-h-[48px] text-sm sm:text-base ${
                reduceMotion
                  ? 'border-purple-400 bg-purple-50 text-purple-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              <span>✨ Reduce Motion</span>
              <span>{reduceMotion ? 'ON' : 'OFF'}</span>
            </button>

            <PWAInstallButton variant="banner" />
          </div>
        </div>

        <hr className="border-slate-200 border-2 rounded-full" />

        {/* 5. TEACHER / PARENT DASHBOARD */}
        <div>
          <h2 className="text-slate-700 font-black mb-3 sm:mb-4 text-base sm:text-lg flex items-center gap-2">
            Teacher / Parent Area
          </h2>

          {!unlocked ? (
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border-2 sm:border-4 border-slate-200 flex flex-col items-center gap-3 sm:gap-4 text-center">
              <Lock className="text-slate-400" size={28} />
              <p className="font-bold text-slate-600 text-xs sm:text-sm">
                Adult Verification: What is {num1} × {num2}?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <input
                  type="text"
                  value={teacherPin}
                  onChange={(e) => setTeacherPin(e.target.value)}
                  className="w-24 bg-white border-2 sm:border-4 border-slate-200 p-2 rounded-xl font-bold text-center outline-none focus:border-sky-400 min-h-[44px]"
                  placeholder="?"
                />
                <button
                  onClick={attemptUnlock}
                  className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-4 py-2 rounded-xl min-h-[44px] flex items-center justify-center text-sm"
                >
                  Unlock
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-sky-50 p-4 sm:p-6 rounded-2xl border-2 sm:border-4 border-sky-200 flex flex-col gap-3 sm:gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sky-800 flex items-center gap-2 text-sm sm:text-base">
                  <Unlock size={18} /> Dashboard Unlocked
                </h3>
                <button
                  onClick={() => setUnlocked(false)}
                  className="text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-800 min-h-[36px] flex items-center px-2"
                >
                  Lock
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 text-xs sm:text-sm font-bold text-sky-900 mt-1 sm:mt-2">
                <div className="bg-white p-2.5 sm:p-3 rounded-xl border-2 border-sky-100">
                  <p className="text-sky-600 text-[10px] sm:text-xs uppercase">Overall Accuracy</p>
                  <p className="text-base sm:text-lg">
                    {progress.totalCorrect + progress.totalIncorrect > 0
                      ? Math.round(
                          (progress.totalCorrect /
                            (progress.totalCorrect + progress.totalIncorrect)) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="bg-white p-2.5 sm:p-3 rounded-xl border-2 border-sky-100">
                  <p className="text-sky-600 text-[10px] sm:text-xs uppercase">Words Mastered</p>
                  <p className="text-base sm:text-lg">
                    {masteredCount} / {words.length}
                  </p>
                </div>
                <div className="bg-white p-2.5 sm:p-3 rounded-xl border-2 border-sky-100">
                  <p className="text-sky-600 text-[10px] sm:text-xs uppercase">Total Questions</p>
                  <p className="text-base sm:text-lg">
                    {progress.totalCorrect + progress.totalIncorrect}
                  </p>
                </div>
                <div className="bg-white p-2.5 sm:p-3 rounded-xl border-2 border-sky-100">
                  <p className="text-sky-600 text-[10px] sm:text-xs uppercase">Games Won</p>
                  <p className="text-base sm:text-lg">{progress.gamesCompleted}</p>
                </div>
              </div>

              <div className="mt-2 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-sky-200">
                <h2 className="text-rose-600 font-black mb-2 text-sm sm:text-base">Danger Zone</h2>
                <button
                  onClick={handleReset}
                  className="w-full p-3 sm:p-4 rounded-xl border-2 sm:border-4 border-rose-200 bg-white text-rose-600 font-bold hover:bg-rose-50 transition-colors min-h-[48px] text-xs sm:text-sm"
                >
                  Reset All Student Progress
                </button>
              </div>
            </div>
          )}
        </div>

        <hr className="border-slate-200 border-2 rounded-full" />

        {/* 6. ADMIN SUITE & SYSTEM LINKS */}
        <div className="space-y-3">
          <h2 className="text-slate-800 font-black text-base sm:text-lg flex items-center gap-2">
            <Shield className="text-indigo-600" size={20} />
            System Portals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Link
              to="/admin"
              className="p-3.5 sm:p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-between font-bold min-h-[48px]"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="text-indigo-400" size={18} />
                <span>Admin Management Panel</span>
              </div>
              <span className="text-slate-400">→</span>
            </Link>

            <Link
              to="/styleguide"
              className="p-3.5 sm:p-4 bg-indigo-50 text-indigo-900 border-2 border-indigo-200 rounded-2xl hover:bg-indigo-100 transition-all flex items-center justify-between font-bold min-h-[48px]"
            >
              <div className="flex items-center gap-2.5">
                <Palette className="text-indigo-600" size={18} />
                <span>Visual Style Guide</span>
              </div>
              <span className="text-indigo-400">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Embedded Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        currentGame="Settings"
      />
    </div>
  );
}

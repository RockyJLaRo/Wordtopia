import { useProgressStore } from '../store/useProgressStore';
import { useVocabStore } from '../store/useVocabStore';
import { Trophy, Star, Coins, Flame, TargetIcon, BrainCircuit, Medal } from 'lucide-react';
import { LessonSelector } from '../components/LessonSelector';

export function Progress() {
  const progress = useProgressStore();
  const { words, selectedLesson } = useVocabStore();

  const masteredCount = words.filter(w => w.masteryLevel === 'Mastered').length;
  const practicingCount = words.filter(w => w.masteryLevel === 'Practicing' || w.masteryLevel === 'Learning').length;

  const getMasteryStars = (level: string) => {
    switch (level) {
      case 'Mastered': return '★★★★★ Mastered';
      case 'Strong': return '★★★★☆ Strong';
      case 'Practicing': return '★★★☆☆ Practicing';
      case 'Learning': return '★★☆☆☆ Learning';
      default: return '★☆☆☆☆ New';
    }
  };

  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'Mastered': return 'text-amber-500';
      case 'Strong': return 'text-emerald-500';
      case 'Practicing': return 'text-sky-500';
      case 'Learning': return 'text-orange-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex-1 flex flex-col py-3 sm:py-6 gap-3 sm:gap-6 w-full max-w-4xl mx-auto px-1">
      <div className="bg-white/90 p-4 sm:p-6 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-wide">
          Your Progress
        </h1>
      </div>

      <LessonSelector variant="tabs" className="justify-center" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          icon={<Star className="text-yellow-500 fill-yellow-500 w-6 h-6 sm:w-8 sm:h-8" />}
          label="Total Stars"
          value={progress.stars}
          color="bg-yellow-50 border-yellow-200 text-yellow-700"
          title="Total Stars Earned"
        />
        <StatCard
          icon={<Coins className="text-amber-500 fill-amber-500 w-6 h-6 sm:w-8 sm:h-8" />}
          label="Total Coins"
          value={progress.coins}
          color="bg-amber-50 border-amber-200 text-amber-700"
          title="Total Coins Available"
        />
        <StatCard
          icon={<Flame className="text-orange-500 fill-orange-500 w-6 h-6 sm:w-8 sm:h-8" />}
          label="Best Streak"
          value={progress.bestStreak}
          color="bg-orange-50 border-orange-200 text-orange-700"
          title="Best Daily Streak"
        />
        <StatCard
          icon={<Trophy className="text-emerald-500 w-6 h-6 sm:w-8 sm:h-8" />}
          label="Games Won"
          value={progress.gamesCompleted}
          color="bg-emerald-50 border-emerald-200 text-emerald-700"
          title="Vocabulary Games Won"
        />
      </div>

      {/* Achievements Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200">
        <h2 className="font-black text-slate-700 text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
          <Medal className="text-purple-500 w-5 h-5 sm:w-6 sm:h-6" /> Achievements
        </h2>
        {progress.achievements.length === 0 ? (
          <p className="text-slate-500 font-bold p-3 sm:p-4 bg-slate-50 rounded-xl text-center border-2 border-slate-200 border-dashed text-xs sm:text-sm">
            Play games to unlock achievements!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {progress.achievements.map((ach) => (
              <div
                key={ach}
                className="bg-purple-100 border-2 border-purple-300 text-purple-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black flex items-center gap-2 shadow-sm text-xs sm:text-sm"
              >
                <Trophy size={16} className="text-purple-500" /> {ach}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 flex flex-col">
          <h2 className="font-black text-slate-700 text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
            <TargetIcon className="text-sky-500 w-5 h-5 sm:w-6 sm:h-6" /> Accuracy
          </h2>
          <div className="flex justify-between mb-2 font-bold text-slate-600 text-xs sm:text-sm">
            <span>
              Correct: <span className="text-emerald-500">{progress.totalCorrect}</span>
            </span>
            <span>
              Incorrect: <span className="text-rose-500">{progress.totalIncorrect}</span>
            </span>
          </div>
          <div className="w-full bg-rose-100 h-5 sm:h-6 rounded-full overflow-hidden flex mb-4 sm:mb-6">
            <div
              className="bg-emerald-500 h-full"
              style={{
                width: `${
                  progress.totalCorrect + progress.totalIncorrect > 0
                    ? (progress.totalCorrect / (progress.totalCorrect + progress.totalIncorrect)) *
                      100
                    : 0
                }%`,
              }}
            ></div>
          </div>

          <h2 className="font-black text-slate-700 text-lg sm:text-xl mb-3 sm:mb-4 mt-auto flex items-center gap-2">
            <BrainCircuit className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6" /> Mastery Overview
          </h2>
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <div className="flex items-center justify-between font-bold text-xs sm:text-sm">
              <span className="text-amber-600">Mastered</span>
              <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                {masteredCount}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 sm:h-3 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full"
                style={{ width: `${words.length > 0 ? (masteredCount / words.length) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between font-bold text-xs sm:text-sm mt-1 sm:mt-2">
              <span className="text-sky-600">Still Practicing</span>
              <span className="bg-sky-100 text-sky-700 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                {practicingCount}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 sm:h-3 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full"
                style={{
                  width: `${words.length > 0 ? (practicingCount / words.length) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Individual Word Progress */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 flex flex-col max-h-[400px] sm:h-[500px]">
          <h2 className="font-black text-slate-700 text-lg sm:text-xl mb-3 sm:mb-4">
            Vocabulary List
          </h2>
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 flex flex-col gap-2">
            {words.length === 0 ? (
              <p className="text-slate-500 font-bold p-4 text-center text-xs sm:text-sm">
                No words loaded.
              </p>
            ) : (
              words.map((w) => (
                <div
                  key={w.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center p-2.5 sm:p-3 bg-slate-50 rounded-xl border-2 border-slate-200 hover:border-sky-300 transition-colors gap-1 sm:gap-2"
                >
                  <span
                    className="font-black text-slate-700 truncate text-xs sm:text-base"
                    title={w.word ? w.word.charAt(0).toUpperCase() + w.word.slice(1) : ''}
                  >
                    {w.word}
                  </span>
                  <span
                    className={`font-black text-xs sm:text-sm tracking-wide sm:tracking-widest ${getMasteryColor(
                      w.masteryLevel
                    )}`}
                  >
                    {getMasteryStars(w.masteryLevel)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, title }: any) {
  return (
    <div
      title={title || label}
      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 flex flex-col items-center text-center gap-1 sm:gap-2 ${color}`}
    >
      {icon}
      <span className="text-xl sm:text-3xl font-black">{value}</span>
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-80">
        {label}
      </span>
    </div>
  );
}

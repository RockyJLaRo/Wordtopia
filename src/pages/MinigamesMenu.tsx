import { Link } from 'react-router-dom';
import { Gamepad2, Layers, Search, Blocks, Route, Zap, FileText } from 'lucide-react';
import { useVocabStore } from '../store/useVocabStore';
import { LessonSelector } from '../components/LessonSelector';
import { playClickSound } from '../utils/audio';

export function MinigamesMenu() {
  const { words, selectedLesson } = useVocabStore();

  const isReady = words.length >= 2;

  return (
    <div className="flex-1 flex flex-col items-center py-3 sm:py-6 gap-3 sm:gap-6 px-1">
      <div className="bg-white/90 p-4 sm:p-6 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 text-center w-full max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-wide">
          Mini-Games
        </h1>
        <p className="text-slate-500 font-bold text-xs sm:text-base mt-1 sm:mt-2">
          Practice words and earn rewards!
        </p>
      </div>

      <LessonSelector variant="banner" className="w-full max-w-2xl" />

      {!isReady && (
        <div className="bg-rose-100 border-2 sm:border-4 border-rose-200 p-3 sm:p-4 rounded-xl text-center max-w-2xl w-full text-xs sm:text-sm">
          <p className="text-rose-700 font-bold">
            The selected lesson ({selectedLesson === 'all' ? 'All' : selectedLesson}) needs at least
            2 vocabulary words to play games.
          </p>
          <Link
            to="/editor"
            className="mt-2 inline-block bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-rose-600 hover:bg-rose-50"
          >
            Add Words or Switch Lesson
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl opacity-100">
        <GameCard
          to={words.length >= 1 ? '/test' : '#'}
          icon={<FileText size={24} className="sm:w-7 sm:h-7" />}
          title="Practice Test"
          desc="Worksheet-style vocabulary test with live Word Bank and scoring."
          color="bg-sky-600"
          disabled={words.length < 1}
        />
        <GameCard
          to={isReady ? '/game/speed-challenge' : '#'}
          icon={<Zap size={24} className="sm:w-7 sm:h-7" />}
          title="Speed Challenge"
          desc="Think fast! Accuracy comes first, but speed earns the biggest bonuses."
          color="bg-amber-500"
          disabled={!isReady}
        />
        <GameCard
          to={isReady ? '/game/definition-dash' : '#'}
          icon={<Gamepad2 size={24} className="sm:w-7 sm:h-7" />}
          title="Definition Dash"
          desc="Quick fire quiz! Choose the right definition before time runs out."
          color="bg-orange-500"
          disabled={!isReady}
        />
        <GameCard
          to={isReady ? '/game/word-match' : '#'}
          icon={<Layers size={24} className="sm:w-7 sm:h-7" />}
          title="Word Match"
          desc="Connect the blocks! Match words to their definitions."
          color="bg-indigo-500"
          disabled={!isReady}
        />
        <GameCard
          to={isReady ? '/game/word-detective' : '#'}
          icon={<Search size={24} className="sm:w-7 sm:h-7" />}
          title="Word Detective"
          desc="Solve the mystery by finding the word that matches the clues."
          color="bg-teal-500"
          disabled={!isReady}
        />
        <GameCard
          to={isReady ? '/game/vocab-builder' : '#'}
          icon={<Blocks size={24} className="sm:w-7 sm:h-7" />}
          title="Vocabulary Builder"
          desc="Choose the right building blocks of meaning to construct the word."
          color="bg-pink-500"
          disabled={!isReady}
        />
        <GameCard
          to={isReady ? '/game/vocab-adventure' : '#'}
          icon={<Route size={24} className="sm:w-7 sm:h-7" />}
          title="Adventure Mode"
          desc="Explore the block world and overcome vocabulary challenges!"
          color="bg-emerald-500"
          disabled={!isReady}
          featured
        />
      </div>
    </div>
  );
}

function GameCard({ to, icon, title, desc, color, disabled, featured }: any) {
  if (disabled) {
    return (
      <div
        className={`p-4 sm:p-6 rounded-2xl border-2 sm:border-4 border-slate-200 bg-slate-100 opacity-60 grayscale flex flex-col gap-2 ${
          featured ? 'sm:col-span-2' : ''
        }`}
      >
        <div className="bg-slate-200 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-slate-400">
          {icon}
        </div>
        <h2 className="text-lg sm:text-xl font-black text-slate-500">{title}</h2>
        <p className="text-xs sm:text-sm font-bold text-slate-400">{desc}</p>
      </div>
    );
  }

  return (
    <Link
      to={to}
      onClick={() => playClickSound()}
      className={`
        p-4 sm:p-6 rounded-2xl border-b-4 sm:border-b-8 border-r-2 sm:border-r-4 border-slate-300 bg-white hover:-translate-y-1 hover:border-b-2 sm:hover:border-b-4 hover:border-r-1 sm:hover:border-r-2
        active:translate-y-1 sm:active:translate-y-2 active:border-b-0 active:border-r-0 transition-all flex flex-col gap-2.5 sm:gap-3 group
        ${featured ? 'sm:col-span-2' : ''}
      `}
    >
      <div
        className={`${color} w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-800 group-hover:text-sky-600 transition-colors">
          {title}
        </h2>
        <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5 sm:mt-1">{desc}</p>
      </div>
    </Link>
  );
}

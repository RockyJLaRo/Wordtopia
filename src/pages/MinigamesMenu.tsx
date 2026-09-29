import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gamepad2,
  Layers,
  Search,
  Blocks,
  Route,
  Zap,
  FileText,
  Hammer,
  FlaskConical,
  Compass,
  Swords,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useVocabStore } from '../store/useVocabStore';
import { LessonSelector } from '../components/LessonSelector';
import { playClickSound } from '../utils/audio';

type CategoryFilter = 'all' | 'story' | 'construction' | 'deduction' | 'fluency';

export function MinigamesMenu() {
  const { words, selectedLesson } = useVocabStore();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const isReady = words.length >= 2;

  const games = [
    // Story & Core
    {
      id: 'adventure',
      category: 'story',
      to: isReady ? '/game/vocab-adventure' : '#',
      icon: <Route size={24} className="sm:w-7 sm:h-7" />,
      title: 'Adventure Mode',
      desc: 'Explore the 2D block dungeon, solve vocabulary gates, and unlock treasure!',
      color: 'bg-emerald-600',
      skillBadge: 'Exploration & Transfer',
      disabled: !isReady,
      featured: true,
    },
    {
      id: 'context-quest',
      category: 'story',
      to: isReady ? '/game/context-quest' : '#',
      icon: <Compass size={24} className="sm:w-7 sm:h-7" />,
      title: 'Context Quest',
      desc: 'Interactive visual novel where vocabulary decisions shape the story outcome.',
      color: 'bg-teal-600',
      skillBadge: 'Inference & Context',
      disabled: !isReady,
    },

    // Construction & Syntax
    {
      id: 'sentence-forge',
      category: 'construction',
      to: isReady ? '/game/sentence-forge' : '#',
      icon: <Hammer size={24} className="sm:w-7 sm:h-7" />,
      title: 'Sentence Forge',
      desc: 'Syntactic anvil! Forge complete sentences using target words in authentic contexts.',
      color: 'bg-amber-600',
      skillBadge: 'Generative Syntax',
      disabled: !isReady,
    },
    {
      id: 'word-sort-lab',
      category: 'construction',
      to: isReady ? '/game/word-sort-lab' : '#',
      icon: <FlaskConical size={24} className="sm:w-7 sm:h-7" />,
      title: 'Word Sort Lab',
      desc: 'Sort words into chemistry chambers based on connotation, part of speech, or intensity.',
      color: 'bg-indigo-600',
      skillBadge: 'Semantic Schemas',
      disabled: !isReady,
    },
    {
      id: 'vocab-builder',
      category: 'construction',
      to: isReady ? '/game/vocab-builder' : '#',
      icon: <Blocks size={24} className="sm:w-7 sm:h-7" />,
      title: 'Vocabulary Builder',
      desc: 'Construct words by assembling syllable and morpheme blocks on the build grid.',
      color: 'bg-pink-600',
      skillBadge: 'Morphological Awareness',
      disabled: !isReady,
    },

    // Deduction & Matching
    {
      id: 'word-detective',
      category: 'deduction',
      to: isReady ? '/game/word-detective' : '#',
      icon: <Search size={24} className="sm:w-7 sm:h-7" />,
      title: 'Word Detective',
      desc: '4-tier clue ladder mystery: solve with fewer clues to earn master detective rating.',
      color: 'bg-teal-500',
      skillBadge: 'Context Clues & Logic',
      disabled: !isReady,
    },
    {
      id: 'word-match',
      category: 'deduction',
      to: isReady ? '/game/word-match' : '#',
      icon: <Layers size={24} className="sm:w-7 sm:h-7" />,
      title: 'Word Match',
      desc: 'Multi-mode matching: Standard, In-Context Cloze, and Synonyms & Antonyms.',
      color: 'bg-indigo-500',
      skillBadge: 'Relational Networks',
      disabled: !isReady,
    },
    {
      id: 'definition-dash',
      category: 'deduction',
      to: isReady ? '/game/definition-dash' : '#',
      icon: <Gamepad2 size={24} className="sm:w-7 sm:h-7" />,
      title: 'Definition Dash',
      desc: 'Diagnostic elimination quiz with plausible distractors and learning feedback.',
      color: 'bg-orange-500',
      skillBadge: 'Definition Verification',
      disabled: !isReady,
    },

    // Fluency & Evaluation
    {
      id: 'boss-battle',
      category: 'fluency',
      to: isReady ? '/game/boss-battle' : '#',
      icon: <Swords size={24} className="sm:w-7 sm:h-7" />,
      title: 'Boss Battle',
      desc: 'Turn-based RPG combat against the Lexicon Titan using mixed retrieval attacks!',
      color: 'bg-rose-600',
      skillBadge: 'Multi-Modal Retrieval',
      disabled: !isReady,
      featured: true,
    },
    {
      id: 'spelling-quest',
      category: 'fluency',
      to: isReady ? '/game/spelling-quest' : '#',
      icon: <KeyRound size={24} className="sm:w-7 sm:h-7" />,
      title: 'Spelling Quest',
      desc: 'Audio pronunciation, definition clues, and rune letter crypt platforming.',
      color: 'bg-purple-600',
      skillBadge: 'Orthographic Recall',
      disabled: !isReady,
    },
    {
      id: 'speed-challenge',
      category: 'fluency',
      to: isReady ? '/game/speed-challenge' : '#',
      icon: <Zap size={24} className="sm:w-7 sm:h-7" />,
      title: 'Speed Challenge',
      desc: 'Timed rush or untimed practice mode. Accuracy streaks rewarded alongside speed.',
      color: 'bg-amber-500',
      skillBadge: 'Automaticity Sprint',
      disabled: !isReady,
    },
    {
      id: 'practice-test',
      category: 'fluency',
      to: words.length >= 1 ? '/test' : '#',
      icon: <FileText size={24} className="sm:w-7 sm:h-7" />,
      title: 'Practice Test',
      desc: 'Formative assessment with live word bank, autograding, and printable PDF worksheet.',
      color: 'bg-sky-600',
      skillBadge: 'Formative Assessment',
      disabled: words.length < 1,
    },
  ];

  const filteredGames =
    activeCategory === 'all' ? games : games.filter((g) => g.category === activeCategory);

  return (
    <div className="flex-1 flex flex-col items-center py-3 sm:py-6 gap-3 sm:gap-6 px-1 w-full max-w-4xl mx-auto">
      <div className="bg-white/90 p-4 sm:p-6 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-wide">
          Educational Mini-Games
        </h1>
        <p className="text-slate-500 font-bold text-xs sm:text-base mt-1 sm:mt-2">
          Evidence-based vocabulary challenges: practice definitions, context, syntax, and spelling!
        </p>
      </div>

      <LessonSelector variant="banner" className="w-full" />

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-white/80 p-1.5 rounded-2xl border-2 border-slate-200 w-full max-w-2xl">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
            activeCategory === 'all'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Games ({games.length})
        </button>
        <button
          onClick={() => setActiveCategory('story')}
          className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
            activeCategory === 'story'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Story & Core
        </button>
        <button
          onClick={() => setActiveCategory('construction')}
          className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
            activeCategory === 'construction'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Syntax & Construct
        </button>
        <button
          onClick={() => setActiveCategory('deduction')}
          className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
            activeCategory === 'deduction'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Deduction & Logic
        </button>
        <button
          onClick={() => setActiveCategory('fluency')}
          className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
            activeCategory === 'fluency'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Fluency & Assessment
        </button>
      </div>

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

      {/* Grid of Games */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
        {filteredGames.map((game) => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>
    </div>
  );
}

function GameCard({ to, icon, title, desc, color, skillBadge, disabled, featured }: any) {
  if (disabled) {
    return (
      <div
        className={`p-4 sm:p-5 rounded-2xl border-2 sm:border-4 border-slate-200 bg-slate-100 opacity-60 grayscale flex flex-col gap-2 ${
          featured ? 'sm:col-span-2' : ''
        }`}
      >
        <div className="bg-slate-200 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-slate-400">
          {icon}
        </div>
        <h2 className="text-base sm:text-lg font-black text-slate-500">{title}</h2>
        <p className="text-xs font-bold text-slate-400 leading-snug">{desc}</p>
      </div>
    );
  }

  return (
    <Link
      to={to}
      onClick={() => playClickSound()}
      className={`
        p-4 sm:p-5 rounded-2xl border-b-4 sm:border-b-8 border-r-2 sm:border-r-4 border-slate-300 bg-white hover:-translate-y-1 hover:border-b-2 sm:hover:border-b-4 hover:border-r-1 sm:hover:border-r-2
        active:translate-y-1 sm:active:translate-y-2 active:border-b-0 active:border-r-0 transition-all flex flex-col justify-between gap-3 group shadow-xs
        ${featured ? 'sm:col-span-2' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`${color} w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform shrink-0`}
        >
          {icon}
        </div>
        {skillBadge && (
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {skillBadge}
          </span>
        )}
      </div>
      <div>
        <h2 className="text-base sm:text-lg font-black text-slate-800 group-hover:text-sky-600 transition-colors">
          {title}
        </h2>
        <p className="text-xs font-bold text-slate-500 mt-1 leading-snug">{desc}</p>
      </div>
    </Link>
  );
}

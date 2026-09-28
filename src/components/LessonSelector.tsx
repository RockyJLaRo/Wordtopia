import React, { useState } from 'react';
import { useVocabStore } from '../store/useVocabStore';
import { BookOpen, RefreshCw, Check, Sparkles, ChevronDown } from 'lucide-react';

interface LessonSelectorProps {
  variant?: 'compact' | 'banner' | 'tabs';
  className?: string;
  showSyncButton?: boolean;
}

export function LessonSelector({
  variant = 'compact',
  className = '',
  showSyncButton = true,
}: LessonSelectorProps) {
  const {
    allWords,
    selectedLesson,
    availableLessons,
    setSelectedLesson,
    loadVocabFromUrl,
    isLoading,
  } = useVocabStore();

  const [isOpen, setIsOpen] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const handleSync = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await loadVocabFromUrl(true);
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 2500);
  };

  // Calculate word counts per lesson
  const getWordCount = (lesson: string) => {
    if (lesson === 'all') return allWords.length;
    return allWords.filter((w) => (w.lesson || 'Week #1') === lesson).length;
  };

  const getMasteredCount = (lesson: string) => {
    const list =
      lesson === 'all'
        ? allWords
        : allWords.filter((w) => (w.lesson || 'Week #1') === lesson);
    return list.filter((w) => w.masteryLevel === 'Mastered').length;
  };

  const currentCount = getWordCount(selectedLesson);
  const displayName = selectedLesson === 'all' ? 'All Lessons' : selectedLesson;

  // COMPACT VARIANT: Perfect for Top HUD in Layout
  if (variant === 'compact') {
    return (
      <div className={`relative inline-block ${className}`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="h-8 sm:h-9 flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 px-2.5 sm:px-3 rounded-xl font-black text-xs sm:text-sm border-2 border-sky-300 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Switch Current Vocabulary Lesson"
          >
            <BookOpen size={14} className="text-sky-600 shrink-0" />
            <span className="truncate max-w-[80px] sm:max-w-[110px]">{displayName}</span>
            <span className="bg-sky-200/80 text-sky-800 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold tabular-nums">
              {currentCount}w
            </span>
            <ChevronDown
              size={12}
              className={`text-sky-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {showSyncButton && (
            <button
              onClick={handleSync}
              disabled={isLoading}
              className={`h-8 sm:h-9 w-8 sm:w-9 flex items-center justify-center rounded-xl border-2 transition-all shrink-0 ${
                justSynced
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-white hover:bg-sky-50 border-sky-200 text-sky-600'
              } active:scale-90`}
              title="Sync Latest Words From Online Vocab.txt"
            >
              {justSynced ? (
                <Check size={14} className="text-emerald-600 animate-bounce" />
              ) : (
                <RefreshCw
                  size={14}
                  className={`${isLoading ? 'animate-spin text-sky-500' : ''}`}
                />
              )}
            </button>
          )}
        </div>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 bg-white rounded-2xl shadow-xl border-4 border-sky-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b-2 border-slate-100 mb-1 flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Select Lesson
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {allWords.length} total words
                </span>
              </div>

              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                {/* All Lessons Option */}
                <button
                  onClick={() => {
                    setSelectedLesson('all');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left font-bold text-sm transition-colors ${
                    selectedLesson === 'all'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'hover:bg-sky-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={16}
                      className={selectedLesson === 'all' ? 'text-amber-200' : 'text-amber-500'}
                    />
                    <span>All Lessons</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      selectedLesson === 'all'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {allWords.length} words
                  </span>
                </button>

                {/* Individual Lessons */}
                {availableLessons.map((lesson) => {
                  const count = getWordCount(lesson);
                  const isSelected = selectedLesson === lesson;
                  return (
                    <button
                      key={lesson}
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left font-bold text-sm transition-colors ${
                        isSelected
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'hover:bg-sky-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen
                          size={16}
                          className={isSelected ? 'text-white' : 'text-sky-500'}
                        />
                        <span>{lesson}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          isSelected
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count} words
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t-2 border-slate-100 flex items-center justify-between px-2">
                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="text-xs text-sky-600 font-bold hover:text-sky-700 flex items-center gap-1.5 py-1"
                >
                  <RefreshCw
                    size={12}
                    className={isLoading ? 'animate-spin' : ''}
                  />
                  <span>Sync from online file</span>
                </button>
                {justSynced && (
                  <span className="text-[11px] font-bold text-emerald-600">Updated!</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // TABS VARIANT: Clean horizontal pills
  if (variant === 'tabs') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <button
          onClick={() => setSelectedLesson('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm border-2 transition-all ${
            selectedLesson === 'all'
              ? 'bg-sky-500 border-sky-600 text-white shadow-md scale-105'
              : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300'
          }`}
        >
          <Sparkles size={14} className={selectedLesson === 'all' ? 'text-amber-200' : 'text-amber-500'} />
          <span>All Lessons</span>
          <span
            className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
              selectedLesson === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {allWords.length}
          </span>
        </button>

        {availableLessons.map((lesson) => {
          const isSelected = selectedLesson === lesson;
          const count = getWordCount(lesson);
          return (
            <button
              key={lesson}
              onClick={() => setSelectedLesson(lesson)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm border-2 transition-all ${
                isSelected
                  ? 'bg-sky-500 border-sky-600 text-white shadow-md scale-105'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300'
              }`}
            >
              <BookOpen size={14} className={isSelected ? 'text-white' : 'text-sky-500'} />
              <span>{lesson}</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {showSyncButton && (
          <button
            onClick={handleSync}
            disabled={isLoading}
            className={`p-2 rounded-xl border-2 transition-all ml-auto ${
              justSynced
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-white hover:bg-sky-50 border-slate-200 text-sky-600'
            }`}
            title="Sync With Online Vocab.txt"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    );
  }

  // BANNER VARIANT: Detailed showcase with progress and quick switchers (Home / Minigames)
  return (
    <div
      className={`bg-white/95 rounded-2xl shadow-sm border-4 border-sky-200 p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-inner shrink-0">
          <BookOpen size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600">
              Active Vocabulary Lesson
            </span>
            {justSynced && (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                Synced Fresh!
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            {displayName}
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {currentCount} words
            </span>
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500">
            {getMasteredCount(selectedLesson)} of {currentCount} words mastered in this lesson
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Lesson Switchers */}
        <button
          onClick={() => setSelectedLesson('all')}
          className={`px-3 py-2 rounded-xl font-black text-xs sm:text-sm border-2 transition-all flex items-center gap-1.5 ${
            selectedLesson === 'all'
              ? 'bg-sky-500 border-sky-600 text-white shadow-sm scale-105'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <Sparkles size={14} className={selectedLesson === 'all' ? 'text-amber-200' : 'text-amber-500'} />
          All ({allWords.length})
        </button>

        {availableLessons.map((lesson) => {
          const isSelected = selectedLesson === lesson;
          const count = getWordCount(lesson);
          return (
            <button
              key={lesson}
              onClick={() => setSelectedLesson(lesson)}
              className={`px-3 py-2 rounded-xl font-black text-xs sm:text-sm border-2 transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-sky-500 border-sky-600 text-white shadow-sm scale-105'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <BookOpen size={14} className={isSelected ? 'text-white' : 'text-sky-500'} />
              {lesson} ({count})
            </button>
          );
        })}

        {showSyncButton && (
          <button
            onClick={handleSync}
            disabled={isLoading}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 transition-all ${
              justSynced
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white hover:bg-sky-50 border-slate-200 text-sky-600'
            }`}
            title="Refresh Words From Online Vocab.txt"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Sync Online</span>
          </button>
        )}
      </div>
    </div>
  );
}

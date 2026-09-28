import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useVocabStore } from '../store/useVocabStore';
import { ChevronLeft, ChevronRight, Shuffle, Eye, EyeOff, CheckCircle, FileText } from 'lucide-react';
import { LessonSelector } from '../components/LessonSelector';
import { haptic } from '../utils/haptics';

export function Study() {
  const { words, selectedLesson, toggleNeedsPractice } = useVocabStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDef, setShowDef] = useState(false);

  // Reset index when words or selected lesson changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowDef(false);
  }, [selectedLesson, words.length]);
  
  if (words.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
        <LessonSelector variant="tabs" className="mb-4" />
        <div className="bg-white p-8 rounded-2xl shadow-sm border-4 border-slate-200 text-center font-bold text-slate-500">
          No words in this lesson yet. Choose another lesson or add words in the editor!
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, words.length - 1);
  const word = words[safeIndex];

  const handleNext = () => {
    haptic.light();
    setShowDef(false);
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const handlePrev = () => {
    haptic.light();
    setShowDef(false);
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  const handleShuffle = () => {
    haptic.medium();
    setShowDef(false);
    setCurrentIndex(Math.floor(Math.random() * words.length));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-6 py-3 sm:py-6 w-full max-w-2xl mx-auto px-1">
      {/* Mode Switcher: Flashcards vs Practice Test */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border-2 border-slate-200 shadow-xs">
        <button
          type="button"
          className="px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm bg-sky-500 text-white shadow-xs"
        >
          📇 Flashcards
        </button>
        <Link
          to="/test"
          className="flex items-center gap-1 px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
        >
          <FileText size={15} />
          <span>Practice Test</span>
        </Link>
      </div>

      <LessonSelector variant="tabs" className="w-full justify-center" />

      <div className="flex justify-between items-center w-full bg-white/80 p-3 sm:p-4 rounded-xl shadow-sm border-2 border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 text-xs sm:text-sm">
            Word {safeIndex + 1} of {words.length}
          </span>
          {word.lesson && (
            <span className="bg-sky-100 text-sky-700 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-black">
              {word.lesson}
            </span>
          )}
        </div>
        <button
          onClick={handleShuffle}
          className="flex items-center gap-1.5 sm:gap-2 text-sky-600 font-bold hover:bg-sky-50 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm"
        >
          <Shuffle size={16} /> Shuffle
        </button>
      </div>

      <div className="w-full min-h-[220px] aspect-[4/3] sm:aspect-[16/9] md:aspect-[2/1] relative perspective-1000">
        <div
          onClick={() => {
            haptic.medium();
            setShowDef(!showDef);
          }}
          className="absolute inset-0 w-full h-full cursor-pointer group"
        >
          <div
            className={`w-full h-full transition-all duration-500 transform-style-preserve-3d ${
              showDef ? 'rotate-y-180' : ''
            }`}
          >
            {/* Front (Word) */}
            <div className="absolute inset-0 backface-hidden bg-white border-4 sm:border-8 border-sky-300 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col items-center justify-center p-4 sm:p-8 text-center group-hover:border-sky-400">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-800 break-words max-w-full uppercase tracking-wider">
                {word.word}
              </h2>
              <p className="mt-4 sm:mt-8 text-sky-500 font-bold flex items-center gap-1.5 sm:gap-2 bg-sky-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
                <Eye size={18} /> Tap to see definition
              </p>
            </div>

            {/* Back (Definition) */}
            <div className="absolute inset-0 backface-hidden bg-sky-50 border-4 sm:border-8 border-sky-400 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col items-center justify-center p-4 sm:p-8 text-center rotate-y-180 overflow-y-auto">
              <p className="text-base sm:text-2xl md:text-3xl font-black text-slate-700 leading-snug break-words">
                {word.definition}
              </p>

              <div className="mt-4 sm:absolute sm:bottom-4 sm:left-0 sm:right-0 flex justify-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic.selection();
                    toggleNeedsPractice(word.id);
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border-2 sm:border-4 transition-colors ${
                    word.needsPractice
                      ? 'bg-amber-100 border-amber-300 text-amber-700'
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle size={16} /> Needs Practice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 sm:gap-4 w-full">
        <button
          onClick={handlePrev}
          className="flex-1 bg-white border-b-4 sm:border-b-8 border-slate-300 text-slate-600 font-black p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-slate-50 active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all text-xs sm:text-base"
        >
          <ChevronLeft size={20} /> Previous
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-sky-500 border-b-4 sm:border-b-8 border-sky-700 text-white font-black p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-sky-400 active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all text-xs sm:text-base"
        >
          Next <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

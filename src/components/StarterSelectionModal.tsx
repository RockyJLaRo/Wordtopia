import { useState } from 'react';
import { useProgressStore } from '../store/useProgressStore';
import { AVATARS } from '../data/avatarSprites';
import { Sparkles, Check } from 'lucide-react';
import { PixelAvatar } from './PixelAvatar';
import { playMascotSound, playWinSound } from '../utils/audio';

export function StarterSelectionModal() {
  const { hasChosenStarter, completeStarterSelection } = useProgressStore();
  const [selectedId, setSelectedId] = useState<string>('black_cat');

  if (hasChosenStarter) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-4xl w-full shadow-2xl flex flex-col max-h-[94vh] my-auto border-4 border-amber-300">
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black mb-2">
            <Sparkles size={16} className="text-amber-600 animate-spin-slow" />
            Welcome to Wordtopia!
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">
            Choose Your Starter Avatar!
          </h2>
          <p className="text-slate-600 font-bold text-xs sm:text-base mt-1">
            Pick your favorite companion mascot. All 8 are authentic pixel-art pets ready for your adventures!
          </p>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mb-4 sm:mb-6 pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-1">
            {AVATARS.map((avatar) => {
              const isSelected = selectedId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => {
                    playMascotSound();
                    setSelectedId(avatar.id);
                  }}
                  className={`
                    relative p-3 sm:p-4 rounded-2xl border-3 sm:border-4 transition-all flex flex-col items-center gap-2 active:scale-95 text-center
                    ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 shadow-lg scale-105 ring-4 ring-amber-300/40'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute -top-2.5 -right-2.5 bg-amber-500 text-white p-1 rounded-full border-2 border-white shadow-md z-10">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  )}

                  {/* 64x64 Pixel Art Preview */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/80 rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center p-1">
                    <PixelAvatar
                      avatarId={avatar.id}
                      size={80}
                      animated={isSelected}
                    />
                  </div>

                  <div>
                    <h4 className="font-black text-slate-800 text-sm sm:text-base leading-tight">
                      {avatar.name}
                    </h4>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-1">
                      {avatar.personality}
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-1 px-1">
                      {avatar.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t-2 border-slate-100 pt-4 gap-3">
          <div className="text-xs text-slate-500 font-bold text-center sm:text-left">
            You can customize clothing, hats, and accessories anytime in The Wordrobe!
          </div>
          <button
            onClick={() => {
              playWinSound();
              completeStarterSelection(selectedId);
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white px-8 sm:px-12 py-3.5 rounded-2xl font-black text-base sm:text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-1 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            Start Adventure with {AVATARS.find((a) => a.id === selectedId)?.name}
          </button>
        </div>
      </div>
    </div>
  );
}

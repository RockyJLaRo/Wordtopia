import { useSettingsStore } from '../store/useSettingsStore';
import { Play } from 'lucide-react';

export function Onboarding() {
  const { hasSeenOnboarding, completeOnboarding } = useSettingsStore();

  if (hasSeenOnboarding) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-sky-900/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border-4 sm:border-8 border-sky-400 max-w-lg w-full text-center animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-800 mb-2 sm:mb-4 uppercase tracking-wide">
          Welcome, Explorer!
        </h1>
        <div className="bg-sky-50 p-4 sm:p-6 rounded-2xl border-2 sm:border-4 border-sky-100 mb-4 sm:mb-8">
          <p className="text-base sm:text-xl font-bold text-sky-700 leading-relaxed">
            Learn words, complete challenges, and explore your world!
          </p>
        </div>

        <button
          onClick={completeOnboarding}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg sm:text-2xl py-3.5 sm:py-4 rounded-2xl border-b-4 sm:border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-2 sm:gap-3 min-h-[50px]"
        >
          <Play size={24} className="sm:w-7 sm:h-7" />
          <span>Let's Go!</span>
        </button>
      </div>
    </div>
  );
}

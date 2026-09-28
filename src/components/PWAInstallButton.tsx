import React, { useState } from 'react';
import { Download, Share2, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playClickSound } from '../utils/audio';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    playClickSound();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // Only show if installable or on iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl text-xs sm:text-sm font-black border-2 flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-xs cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-emerald-600 ${className}`}
          title="Install Wordtopia for offline play"
          aria-label="Install Wordtopia"
        >
          <Download size={15} className="shrink-0 animate-bounce" />
          <span className="hidden sm:inline">Install</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 sm:border-4 font-bold transition-all min-h-[48px] text-sm sm:text-base border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 ${className}`}
        >
          <span className="flex items-center gap-2">
            <Smartphone size={18} className="text-emerald-600" />
            <span>Install Wordtopia App (Offline Ready)</span>
          </span>
          <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded-lg font-black">
            INSTALL
          </span>
        </button>
      )}

      {/* iOS Safari Guided Install Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-4 border-emerald-300 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Share2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Install on iPhone / iPad</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                1. Tap the <strong className="text-slate-800">Share button</strong> (square with arrow) in your Safari toolbar.<br />
                2. Scroll down and tap <strong className="text-slate-800">Add to Home Screen</strong>.<br />
                3. Open Wordtopia anytime — even without internet!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs sm:text-sm font-black text-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

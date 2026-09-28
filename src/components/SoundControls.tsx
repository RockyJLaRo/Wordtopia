import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Volume1, VolumeX, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { soundManager, SoundEffectType } from '../utils/soundManager';

interface SoundQuickControlProps {
  className?: string;
}

export const SoundQuickControl: React.FC<SoundQuickControlProps> = ({ className = '' }) => {
  const { soundEnabled, soundVolume, toggleSound, setSoundVolume } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const volumePercent = Math.round((soundVolume ?? 0.7) * 100);

  const getVolumeIcon = () => {
    if (!soundEnabled || (soundVolume ?? 0.7) === 0) {
      return <VolumeX size={16} className="text-rose-500 shrink-0" />;
    }
    if ((soundVolume ?? 0.7) < 0.5) {
      return <Volume1 size={16} className="text-sky-600 shrink-0" />;
    }
    return <Volume2 size={16} className="text-sky-600 shrink-0" />;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setSoundVolume(newVol);
    soundManager.setVolume(newVol);
  };

  const handleTestChime = () => {
    soundManager.play('coin', true);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={soundEnabled ? `Sound Effects (${volumePercent}%) - Click To Adjust` : 'Sound Effects (Muted) - Click To Unmute'}
        className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl text-xs sm:text-sm font-black border-2 flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-xs cursor-pointer ${
          !soundEnabled || soundVolume === 0
            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
            : 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
        }`}
      >
        {getVolumeIcon()}
        <span className="tabular-nums font-mono text-[11px] sm:text-xs">
          {soundEnabled && soundVolume > 0 ? `${volumePercent}%` : 'Muted'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 p-3.5 bg-white rounded-2xl shadow-xl border-2 border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>🔊</span> Sound Effect Volume
            </span>
            <button
              type="button"
              onClick={() => {
                toggleSound();
                soundManager.toggleMute();
                if (!soundEnabled) {
                  soundManager.play('click', true);
                }
              }}
              className={`text-[10px] font-black px-2 py-0.5 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              {soundEnabled ? 'MUTE' : 'UNMUTE'}
            </button>
          </div>

          {/* Slider */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>Level</span>
              <span className="font-mono text-sky-600 font-black">{volumePercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundEnabled ? soundVolume : 0}
              onChange={handleVolumeChange}
              disabled={!soundEnabled}
              className="w-full accent-sky-500 cursor-pointer disabled:opacity-40 h-2 bg-slate-200 rounded-lg appearance-none"
            />
          </div>

          {/* Quick presets */}
          <div className="flex gap-1.5 mb-3">
            {[
              { label: 'Off', val: 0, mute: true },
              { label: '30%', val: 0.3, mute: false },
              { label: '70%', val: 0.7, mute: false },
              { label: '100%', val: 1.0, mute: false },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  if (p.mute) {
                    useSettingsStore.getState().setSoundEnabled(false);
                    soundManager.setEnabled(false);
                  } else {
                    useSettingsStore.getState().setSoundEnabled(true);
                    useSettingsStore.getState().setSoundVolume(p.val);
                    soundManager.setEnabled(true);
                    soundManager.setVolume(p.val);
                    soundManager.play('click', true);
                  }
                }}
                className="flex-1 py-1 rounded-lg text-[10px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Test Sound button */}
          <button
            type="button"
            onClick={handleTestChime}
            className="w-full py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={13} className="text-amber-200" />
            <span>Test Sound Effect</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const SoundTestPad: React.FC = () => {
  const { soundEnabled, soundVolume, toggleSound, setSoundVolume } = useSettingsStore();

  const volumePercent = Math.round((soundVolume ?? 0.7) * 100);

  const soundCues: { type: SoundEffectType; name: string; icon: string; desc: string }[] = [
    { type: 'click', name: 'UI Click', icon: '🔘', desc: 'Tactile bubble pop' },
    { type: 'coin', name: 'Coin Chime', icon: '🪙', desc: 'Retro gold shimmer' },
    { type: 'purchase', name: 'Shop Purchase', icon: '🛍️', desc: 'Cash register bell' },
    { type: 'star', name: 'Star Twinkle', icon: '⭐', desc: 'Sparkly crystal notes' },
    { type: 'gameWin', name: 'Victory Fanfare', icon: '🏆', desc: 'Celebratory fanfare' },
    { type: 'correct', name: 'Correct Chime', icon: '✅', desc: 'Uplifting major third' },
    { type: 'incorrect', name: 'Gentle Boop', icon: '💡', desc: 'Friendly reminder' },
    { type: 'mascot', name: 'Mascot Chirp', icon: '🐱', desc: 'Playful pet purr' },
    { type: 'equip', name: 'Wardrobe Equip', icon: '👕', desc: 'Snappy gear swoosh' },
    { type: 'streak', name: 'Daily Streak', icon: '🔥', desc: 'Ascending momentum' },
  ];

  const handlePlaySample = (type: SoundEffectType) => {
    soundManager.play(type, true);
  };

  return (
    <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 sm:border-4 border-slate-200 flex flex-col gap-4">
      {/* Master Toggle and Volume Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
        <div>
          <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <span>🔊</span> Sound Effect Audio Manager
          </h3>
          <p className="text-xs text-slate-500 font-bold">
            Child-friendly synthesized audio cues for navigation, rewards, and minigames.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            toggleSound();
            soundManager.toggleMute();
            if (!soundEnabled) {
              soundManager.play('click', true);
            }
          }}
          className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm border-2 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer ${
            soundEnabled
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
              : 'bg-slate-200 text-slate-600 border-slate-300'
          }`}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>{soundEnabled ? 'AUDIO ON' : 'AUDIO MUTED'}</span>
        </button>
      </div>

      {/* Volume Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Volume2 size={15} className="text-sky-600" />
            <span>Master Volume</span>
          </span>
          <span className="font-mono text-sky-700 font-black">{volumePercent}%</span>
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={soundEnabled ? soundVolume : 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setSoundVolume(val);
            soundManager.setVolume(val);
          }}
          disabled={!soundEnabled}
          className="w-full accent-sky-500 cursor-pointer disabled:opacity-40 h-2.5 bg-slate-200 rounded-lg appearance-none"
        />

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-0.5">
          <span>0% (Silent)</span>
          <span>50%</span>
          <span>100% (Full)</span>
        </div>
      </div>

      {/* Soundboard Test Buttons */}
      <div>
        <p className="text-xs font-bold text-slate-600 mb-2">Test Audio Cues:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {soundCues.map((cue) => (
            <button
              key={cue.type}
              type="button"
              onClick={() => handlePlaySample(cue.type)}
              title={`Test ${cue.name} (${cue.desc})`}
              className="p-2 sm:p-2.5 bg-white hover:bg-sky-50 border-2 border-slate-200 hover:border-sky-300 rounded-xl flex flex-col items-center gap-1 text-center transition-all active:scale-95 group shadow-2xs cursor-pointer"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{cue.icon}</span>
              <span className="text-[11px] font-black text-slate-700 group-hover:text-sky-700 leading-tight">
                {cue.name}
              </span>
              <span className="text-[9px] text-slate-400 font-medium leading-tight">
                {cue.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

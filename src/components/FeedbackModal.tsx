import React, { useState } from 'react';
import { X, Send, Sparkles, CheckCircle2, MessageSquare, AlertCircle, Camera } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useVocabStore } from '../store/useVocabStore';
import confetti from 'canvas-confetti';
import { GameGraphic } from './GameGraphic';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGame?: string;
}

const CATEGORIES = [
  { id: 'Bug', label: 'Bug / Broken', emoji: '🐛', color: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' },
  { id: 'Gameplay', label: 'Gameplay', emoji: '🎮', color: 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' },
  { id: 'Suggestion', label: 'Cool Idea', emoji: '💡', color: 'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100' },
  { id: 'Graphics', label: 'Graphics', emoji: '🎨', color: 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100' },
  { id: 'Audio', label: 'Sound / Audio', emoji: '🔊', color: 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100' },
  { id: 'Mobile/Touch', label: 'Touch / Mobile', emoji: '📱', color: 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' },
  { id: 'Accessibility', label: 'Accessibility', emoji: '♿', color: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' },
  { id: 'Vocabulary', label: 'Word Problem', emoji: '📚', color: 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100' },
  { id: 'Other', label: 'Other', emoji: '💬', color: 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100' },
];

export function FeedbackModal({ isOpen, onClose, currentGame }: FeedbackModalProps) {
  const location = useLocation();
  const { selectedLesson, words } = useVocabStore();

  const [category, setCategory] = useState<string>('Bug');
  const [message, setMessage] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Non-sensitive technical context detection
  const detectedGame = currentGame || (location.pathname === '/' ? 'Lobby' : location.pathname.replace('/', ''));
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const deviceType = window.innerWidth < 640 ? 'Mobile' : window.innerWidth < 1024 ? 'Tablet' : 'Desktop';
  const browser = navigator.userAgent.includes('Chrome')
    ? 'Chrome'
    : navigator.userAgent.includes('Safari')
    ? 'Safari'
    : navigator.userAgent.includes('Firefox')
    ? 'Firefox'
    : 'Browser';
  const os = navigator.platform.includes('Mac')
    ? 'macOS'
    : navigator.platform.includes('Win')
    ? 'Windows'
    : navigator.platform.includes('iPhone') || navigator.platform.includes('iPad')
    ? 'iOS'
    : navigator.platform.includes('Android')
    ? 'Android'
    : 'OS';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Screenshot image must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotData(reader.result as string);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('Please type a few words about what happened!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        category,
        message: message.trim(),
        screenshot: screenshotData,
        context: {
          game: detectedGame,
          version: '1.2.0-aurora',
          deviceType,
          browser,
          os,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          touchSupported: isTouch,
          activeLesson: selectedLesson,
          wordsCount: words.length,
        },
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit feedback.');
      }

      setSubmitted(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#34d399', '#f472b6', '#fbbf24'],
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setMessage('');
    setScreenshotData(null);
    setSubmitted(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-sky-400 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 p-3 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <MessageSquare className="text-white w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight">Feedback & Help</h2>
              <p className="text-[11px] sm:text-xs text-sky-100 font-medium">Tell us what's on your mind!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1">
          {submitted ? (
            <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={36} className="sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800">You're Awesome!</h3>
              <p className="text-slate-600 font-medium max-w-md mx-auto text-xs sm:text-base">
                Your note has flown to our team! Thank you for helping make <span className="font-bold text-sky-600">Wordtopia</span> even more magical for all explorers.
              </p>
              <button
                onClick={handleReset}
                className="mt-3 sm:mt-4 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-black rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all text-xs sm:text-base"
              >
                Back to the Game
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
              {/* Friendly Title for Children */}
              <div className="bg-sky-50 rounded-2xl p-2.5 sm:p-3 border border-sky-200 flex items-center gap-2.5 sm:gap-3">
                <GameGraphic
                  type="avatar"
                  emoji="🐱"
                  size="md"
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-transparent border-0 shadow-none text-2xl sm:text-3xl shrink-0"
                />
                <p className="text-xs sm:text-sm font-bold text-sky-900">
                  «Something feel tricky or broke? Pick a topic and tell Aurora!»
                </p>
              </div>

              {/* Category Picker */}
              <div>
                <label className="block text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">
                  What is this about?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2 sm:p-2.5 rounded-xl border-2 text-[11px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        category === cat.id
                          ? 'border-sky-500 bg-sky-500 text-white shadow-md scale-[1.02]'
                          : cat.color
                      }`}
                    >
                      <span className="text-base sm:text-lg">{cat.emoji}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Box */}
              <div>
                <label className="block text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">
                  Your Message
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what happened or your awesome suggestion..."
                  className="w-full p-2.5 sm:p-3 rounded-2xl border-2 border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-slate-800 font-medium text-xs sm:text-sm transition-all"
                />
              </div>

              {/* Optional Screenshot */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500">
                    Optional Screenshot
                  </label>
                  {screenshotData && (
                    <button
                      type="button"
                      onClick={() => setScreenshotData(null)}
                      className="text-xs text-rose-500 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {screenshotData ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 max-h-32">
                    <img src={screenshotData} alt="Screenshot preview" className="w-full h-32 object-cover" />
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-2.5 sm:p-3 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 text-slate-500 text-xs font-bold transition-colors">
                    <Camera size={16} />
                    <span>Attach Screenshot (Optional)</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Auto Technical Context Badge (COPPA Safe - No PII) */}
              <div className="bg-slate-100 rounded-xl p-2 sm:p-2.5 text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="font-bold text-slate-700">Auto Context:</span>
                <span>🎮 {detectedGame}</span>
                <span>📱 {deviceType}</span>
                <span>🌐 {browser} ({os})</span>
                <span>📖 {selectedLesson || 'Week #1'}</span>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 sm:gap-3 pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-xs sm:text-sm"
                >
                  {isSubmitting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Send Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

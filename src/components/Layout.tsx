import { Outlet, Link, useLocation } from 'react-router-dom';
import { StarterSelectionModal } from './StarterSelectionModal';
import { useState } from 'react';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Settings,
  Home,
  Star,
  Coins,
  Flame,
  Store,
  Heart,
  Smile,
  User,
  MessageSquare,
  Gamepad2,
  BookOpen,
  Shirt,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Onboarding } from './Onboarding';
import { TransactionHistoryModal } from './TransactionHistoryModal';
import { LessonSelector } from './LessonSelector';
import { FeedbackModal } from './FeedbackModal';
import { GameGraphic } from './GameGraphic';
import { SoundQuickControl } from './SoundControls';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';
import { playClickSound, playCoinSound } from '../utils/audio';

export function Layout() {
  const { stars, coins, currentStreak, mascotHealth, mascotHappiness } = useProgressStore();
  const { user, setAuthModal } = useAuthStore();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Home', icon: Home, active: location.pathname === '/' },
    {
      to: '/games',
      label: 'Games',
      icon: Gamepad2,
      active: location.pathname.startsWith('/game'),
    },
    {
      to: '/study',
      label: 'Study',
      icon: BookOpen,
      active: location.pathname === '/study',
    },
    {
      to: '/shop',
      label: 'Shop',
      icon: Store,
      active: location.pathname === '/shop',
    },
    {
      to: '/wordrobe',
      label: 'Wardrobe',
      icon: Shirt,
      active: location.pathname === '/wordrobe',
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      active: location.pathname === '/settings',
    },
  ];

  return (
    <>
      <StarterSelectionModal />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <div className="min-h-screen bg-sky-100 flex flex-col font-sans text-slate-800">
        <Onboarding />
        <TransactionHistoryModal
          isOpen={isTransactionsOpen}
          onClose={() => setIsTransactionsOpen(false)}
        />

        {/* Responsive Top HUD: Spaced evenly, centered, and cleanly centered when wrapped */}
        <header className="bg-white/95 backdrop-blur-md border-b-4 border-sky-200 sticky top-0 z-50 shadow-sm transition-all">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3">
            
            {/* 1. Home Link */}
            <Link
              to="/"
              className={cn(
                "h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs border-2 shrink-0",
                isHome ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-sky-500 hover:bg-sky-400 text-white border-sky-600"
              )}
              title="Home"
              aria-label="Home"
            >
              <Home size={16} className="shrink-0" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            {/* 2. Mascot Health */}
            <div
              className="h-8 sm:h-9 px-2 sm:px-2.5 bg-red-50 text-red-700 rounded-xl text-xs sm:text-sm font-black border-2 border-red-200 flex items-center gap-1.5 shrink-0 shadow-xs"
              title="Mascot Health"
            >
              <GameGraphic type="heart" size="xs" title="Mascot Health" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="tabular-nums">{mascotHealth ?? 50}%</span>
            </div>

            {/* 3. Mascot Happiness */}
            <div
              className="h-8 sm:h-9 px-2 sm:px-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs sm:text-sm font-black border-2 border-emerald-200 flex items-center gap-1.5 shrink-0 shadow-xs"
              title="Mascot Happiness"
            >
              <Smile size={16} className="text-emerald-500 shrink-0" />
              <span className="tabular-nums">{mascotHappiness ?? 50}%</span>
            </div>

            {/* 4. Stars */}
            <div
              className="h-8 sm:h-9 px-2 sm:px-2.5 bg-amber-50 text-amber-700 rounded-xl text-xs sm:text-sm font-black border-2 border-amber-200 flex items-center gap-1.5 shrink-0 shadow-xs"
              title="Stars"
            >
              <GameGraphic type="star" size="xs" title="Stars" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="tabular-nums">{stars}</span>
            </div>

            {/* 5. Coins (Clickable for History) */}
            <button
              type="button"
              onClick={() => {
                playCoinSound();
                setIsTransactionsOpen(true);
              }}
              className="h-8 sm:h-9 px-2.5 sm:px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs sm:text-sm font-black border-2 border-amber-300 flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
              title="Coins (Click For History)"
            >
              <GameGraphic type="coin" size="xs" title="Coins (Click For History)" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="tabular-nums">{coins}</span>
            </button>

            {/* 6. Daily Streak (if > 0) */}
            {currentStreak > 0 && (
              <div
                className="h-8 sm:h-9 px-2.5 sm:px-3 bg-orange-100 text-orange-700 rounded-xl text-xs sm:text-sm font-black border-2 border-orange-300 flex items-center gap-1.5 shrink-0 animate-pulse shadow-xs"
                title="Daily Streak"
              >
                <GameGraphic type="streak" size="xs" title="Daily Streak" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="tabular-nums">{currentStreak}</span>
              </div>
            )}

            {/* 7. Lesson Selector */}
            <div className="shrink-0 flex items-center">
              <LessonSelector variant="compact" />
            </div>

            {/* 8. User Account / Sign In */}
            <div className="shrink-0 flex items-center">
              {user ? (
                <Link
                  to="/settings"
                  onClick={() => playClickSound()}
                  className="h-8 sm:h-9 px-2.5 sm:px-3 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-indigo-700 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                  title={`Logged In As ${user.username}`}
                >
                  <User size={15} className="text-indigo-600 shrink-0" />
                  <span className="max-w-[70px] sm:max-w-[100px] truncate">{user.username}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setAuthModal(true, 'login');
                  }}
                  className="h-8 sm:h-9 px-2.5 sm:px-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shrink-0 transition-all shadow-xs active:scale-95 whitespace-nowrap"
                  title="Sign In"
                >
                  <User size={15} className="shrink-0" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* 9. Feedback Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsFeedbackOpen(true);
              }}
              className="h-8 sm:h-9 px-2.5 sm:px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-purple-200 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shrink-0 transition-colors shadow-xs active:scale-95"
              title="Feedback & Report Problem"
              aria-label="Feedback"
            >
              <MessageSquare size={16} className="text-purple-600 shrink-0" />
              <span className="hidden sm:inline">Feedback</span>
            </button>

            {/* 10. Practice Test Shortcut */}
            <Link
              to="/test"
              onClick={() => playClickSound()}
              className={cn(
                "h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shrink-0 transition-colors shadow-xs active:scale-95 border-2",
                location.pathname === '/test' || location.pathname === '/practice-test'
                  ? "bg-sky-500 text-white border-sky-600"
                  : "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
              )}
              title="Practice Vocabulary Test"
              aria-label="Practice Test"
            >
              <FileText size={16} className={location.pathname === '/test' ? 'text-white shrink-0' : 'text-sky-600 shrink-0'} />
              <span className="hidden sm:inline">Test</span>
            </Link>

            {/* 11. Marketplace Shortcut */}
            <Link
              to="/shop"
              onClick={() => playClickSound()}
              className="h-8 sm:h-9 px-2.5 sm:px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border-2 border-amber-200 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shrink-0 transition-colors shadow-xs active:scale-95"
              title="Marketplace"
              aria-label="Shop"
            >
              <Store size={16} className="text-amber-600 shrink-0" />
              <span className="hidden sm:inline">Shop</span>
            </Link>

            {/* 12. PWA Install App (for Offline play) */}
            <PWAInstallButton variant="header" />

            {/* 13. Sound Quick Control (Mute & Volume Slider) */}
            <SoundQuickControl />

            {/* 14. Settings Shortcut */}
            <Link
              to="/settings"
              onClick={() => playClickSound()}
              className="h-8 sm:h-9 px-2.5 sm:px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border-2 border-slate-200 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shrink-0 transition-colors shadow-xs active:scale-95"
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={16} className="text-slate-600 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

          </div>
        </header>

        {/* Main Content Area - Responsive padding and fluid max-width */}
        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-2.5 py-3 sm:px-4 sm:py-5 md:px-6 md:py-6 pb-20 md:pb-8 overflow-x-hidden min-h-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar - Only visible on small/medium screens (< md) */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-sky-200 px-2 py-1 shadow-lg flex items-center justify-around"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => playClickSound()}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all min-w-[52px] min-h-[46px]',
                  item.active
                    ? 'text-sky-600 bg-sky-50 font-black'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <Icon size={19} className={item.active ? 'text-sky-600 stroke-[2.5]' : ''} />
                <span className="mt-0.5 leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Global Offline Mode Indicator */}
        <OfflineIndicator />
      </div>
    </>
  );
}

import { lazy as reactLazy, Suspense, useEffect, type ComponentType } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationToastContainer } from './components/NotificationToast';
import { useVocabStore } from './store/useVocabStore';
import { useProgressStore } from './store/useProgressStore';
import { useAuthStore, startCloudProgressSync } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';
import { SHOP_ITEMS } from './data/shopItems';
import { initInteractionDiagnostics } from './services/telemetry';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { Sparkles } from 'lucide-react';

// React.lazy with automatic recovery from stale/failed chunk downloads.
const lazy = <T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) =>
  reactLazy(lazyWithRetry(factory));

const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));

// Code-split all route pages and games for fast initial page load (< 200kB initial chunk)
const Study = lazy(() => import('./pages/Study').then((m) => ({ default: m.Study })));
const MinigamesMenu = lazy(() => import('./pages/MinigamesMenu').then((m) => ({ default: m.MinigamesMenu })));
const Progress = lazy(() => import('./pages/Progress').then((m) => ({ default: m.Progress })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Shop = lazy(() => import('./pages/Shop').then((m) => ({ default: m.Shop })));
const Wordrobe = lazy(() => import('./pages/Wordrobe').then((m) => ({ default: m.Wordrobe })));
const VocabularyEditor = lazy(() => import('./pages/VocabularyEditor').then((m) => ({ default: m.VocabularyEditor })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const StyleGuide = lazy(() => import('./pages/StyleGuide').then((m) => ({ default: m.StyleGuide })));
const PracticeTest = lazy(() => import('./pages/PracticeTest').then((m) => ({ default: m.PracticeTest })));

// Minigames
const DefinitionDash = lazy(() => import('./games/DefinitionDash').then((m) => ({ default: m.DefinitionDash })));
const WordMatch = lazy(() => import('./games/WordMatch').then((m) => ({ default: m.WordMatch })));
const WordDetective = lazy(() => import('./games/WordDetective').then((m) => ({ default: m.WordDetective })));
const VocabularyBuilder = lazy(() => import('./games/VocabularyBuilder').then((m) => ({ default: m.VocabularyBuilder })));
const VocabularyAdventure = lazy(() => import('./games/VocabularyAdventure').then((m) => ({ default: m.VocabularyAdventure })));
const SpeedChallenge = lazy(() => import('./games/SpeedChallenge').then((m) => ({ default: m.SpeedChallenge })));
const SentenceForge = lazy(() => import('./games/SentenceForge').then((m) => ({ default: m.SentenceForge })));
const WordSortLab = lazy(() => import('./games/WordSortLab').then((m) => ({ default: m.WordSortLab })));
const ContextQuest = lazy(() => import('./games/ContextQuest').then((m) => ({ default: m.ContextQuest })));
const BossBattle = lazy(() => import('./games/BossBattle').then((m) => ({ default: m.BossBattle })));
const SpellingQuest = lazy(() => import('./games/SpellingQuest').then((m) => ({ default: m.SpellingQuest })));

// Pre-computed set of valid store item IDs to prevent repeated recalculation
const VALID_SHOP_ITEM_IDS = new Set(SHOP_ITEMS.map((i) => i.id));

function PageLoadingFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[360px] animate-in fade-in duration-200">
      <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-600 animate-bounce">
        <Sparkles size={24} />
      </div>
      <p className="mt-3 text-sm font-black text-slate-600 tracking-wide">Loading adventure...</p>
    </div>
  );
}

// Runs work when the browser is idle so it never competes with the first render.
function whenIdle(cb: () => void, timeout = 3000) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout });
  else setTimeout(cb, 1200);
}

export default function App() {
  const isAuthModalOpen = useAuthStore((s) => s.isAuthModalOpen);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);

  // The in-game "Reduce Motion" setting tones down every CSS animation, not just confetti.
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    // Check session on load (deferred: guest play never waits on the network)
    whenIdle(() => useAuthStore.getState().checkAuth());

    // Keep signed-in players' cloud save up to date
    const stopCloudSync = startCloudProgressSync();

    // Start interaction usability telemetry
    initInteractionDiagnostics();

    // One-time legacy item validation and refund on startup
    const currentInventory = useProgressStore.getState().inventory;
    let refund = 0;
    const newInventory = currentInventory.filter((id) => {
      if (!VALID_SHOP_ITEM_IDS.has(id)) {
        refund += 500;
        return false;
      }
      return true;
    });
    if (refund > 0) {
      useProgressStore.setState({ inventory: newInventory });
      useProgressStore.getState().addCoins(refund, 'Refund for Legacy Items');
    }
    return stopCloudSync;
  }, []);

  useEffect(() => {
    const vocab = useVocabStore.getState();
    if (!vocab.allWords || vocab.allWords.length === 0) {
      // First launch (or wiped data): fetch immediately so games have words.
      vocab.loadVocabFromUrl(true);
    } else {
      // Returning player: play instantly from saved words, then quietly check for
      // newly published lessons in the background.
      whenIdle(() => useVocabStore.getState().loadVocabFromUrl(false));
    }

    // If the first load failed while offline, retry automatically once a connection returns.
    const handleOnline = () => {
      const state = useVocabStore.getState();
      if (state.error || state.allWords.length === 0) state.loadVocabFromUrl(true);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <NotificationToastContainer />
        {isAuthModalOpen && (
          <Suspense fallback={null}>
            <AuthModal />
          </Suspense>
        )}
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Admin Dashboard: Separate Standalone Suite */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/styleguide" element={<StyleGuide />} />

            {/* Game Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="study" element={<Study />} />
              <Route path="test" element={<PracticeTest />} />
              <Route path="practice-test" element={<PracticeTest />} />
              <Route path="games" element={<MinigamesMenu />} />
              <Route path="progress" element={<Progress />} />
              <Route path="shop" element={<Shop />} />
              <Route path="wordrobe" element={<Wordrobe />} />
              <Route path="settings" element={<Settings />} />
              <Route path="editor" element={<VocabularyEditor />} />
              <Route path="edit" element={<VocabularyEditor />} />
              <Route path="game/definition-dash" element={<DefinitionDash />} />
              <Route path="game/word-match" element={<WordMatch />} />
              <Route path="game/word-detective" element={<WordDetective />} />
              <Route path="game/vocab-builder" element={<VocabularyBuilder />} />
              <Route path="game/vocab-adventure" element={<VocabularyAdventure />} />
              <Route path="game/speed-challenge" element={<SpeedChallenge />} />
              <Route path="game/sentence-forge" element={<SentenceForge />} />
              <Route path="game/word-sort-lab" element={<WordSortLab />} />
              <Route path="game/context-quest" element={<ContextQuest />} />
              <Route path="game/boss-battle" element={<BossBattle />} />
              <Route path="game/spelling-quest" element={<SpellingQuest />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

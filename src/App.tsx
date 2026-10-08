import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationToastContainer } from './components/NotificationToast';
import { useVocabStore } from './store/useVocabStore';
import { useProgressStore } from './store/useProgressStore';
import { useAuthStore } from './store/useAuthStore';
import { AuthModal } from './components/AuthModal';
import { SHOP_ITEMS } from './data/shopItems';
import { initInteractionDiagnostics } from './services/telemetry';
import { Sparkles } from 'lucide-react';

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

export default function App() {
  const { loadVocabFromUrl, allWords, availableLessons } = useVocabStore();
  const { addCoins } = useProgressStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check session on load
    checkAuth();

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
      addCoins(refund, 'Refund for Legacy Items');
    }
  }, []);

  useEffect(() => {
    // Load vocab on startup if not yet loaded or if Week #2 hasn't been fetched yet
    const hasWeek2 = availableLessons?.includes('Week #2') || allWords?.some((w) => w.lesson === 'Week #2');
    if (!allWords || allWords.length === 0 || !hasWeek2) {
      loadVocabFromUrl(true);
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <NotificationToastContainer />
        <AuthModal />
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

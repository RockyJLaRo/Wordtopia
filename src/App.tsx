import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Study } from './pages/Study';
import { MinigamesMenu } from './pages/MinigamesMenu';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { Shop } from './pages/Shop';
import { Wordrobe } from './pages/Wordrobe';
import { VocabularyEditor } from './pages/VocabularyEditor';
import { AdminDashboard } from './pages/AdminDashboard';
import { StyleGuide } from './pages/StyleGuide';
import { DefinitionDash } from './games/DefinitionDash';
import { WordMatch } from './games/WordMatch';
import { WordDetective } from './games/WordDetective';
import { VocabularyBuilder } from './games/VocabularyBuilder';
import { VocabularyAdventure } from './games/VocabularyAdventure';
import { SpeedChallenge } from './games/SpeedChallenge';
import { SentenceForge } from './games/SentenceForge';
import { WordSortLab } from './games/WordSortLab';
import { ContextQuest } from './games/ContextQuest';
import { BossBattle } from './games/BossBattle';
import { SpellingQuest } from './games/SpellingQuest';
import { PracticeTest } from './pages/PracticeTest';
import { useVocabStore } from './store/useVocabStore';
import { useEffect } from 'react';
import { useProgressStore } from './store/useProgressStore';
import { useAuthStore } from './store/useAuthStore';
import { AuthModal } from './components/AuthModal';
import { SHOP_ITEMS } from './data/shopItems';
import { initInteractionDiagnostics } from './services/telemetry';

export default function App() {
  const { loadVocabFromUrl, allWords, availableLessons } = useVocabStore();
  const { inventory, addCoins } = useProgressStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check session on load
    checkAuth();

    // Start child-friendly interaction usability telemetry (rage clicks, missed touch targets)
    initInteractionDiagnostics();
  }, []);

  useEffect(() => {
    const validIds = new Set(SHOP_ITEMS.map((i) => i.id));
    let refund = 0;
    const newInventory = inventory.filter((id) => {
      if (!validIds.has(id)) {
        refund += 500;
        return false;
      }
      return true;
    });
    if (refund > 0) {
      useProgressStore.setState({ inventory: newInventory });
      addCoins(refund, 'Refund for Legacy Items');
    }
  }, [inventory, addCoins]);

  useEffect(() => {
    // Load vocab on startup if not yet loaded or if Week #2 hasn't been fetched yet
    const hasWeek2 = availableLessons?.includes('Week #2') || allWords?.some((w) => w.lesson === 'Week #2');
    if (!allWords || allWords.length === 0 || !hasWeek2) {
      loadVocabFromUrl(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthModal />
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
    </BrowserRouter>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVocabStore } from '../store/useVocabStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playCorrectSound, playWinSound, playIncorrectSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import {
  Printer,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  Trophy,
  ArrowRight,
  Shuffle,
  BookOpen,
  Download,
  FileText,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { VocabWord } from '../types';

/**
 * Capitalizes the first alphabetical character of a string,
 * preserving all subsequent characters and any leading whitespace.
 * Example: "happy" -> "Happy", "beautiful" -> "Beautiful"
 */
export const autoCapitalizeFirstLetter = (val: string): string => {
  if (!val) return '';
  const match = val.match(/^(\s*)([a-zA-Z])(.*)$/);
  if (match) {
    return match[1] + match[2].toUpperCase() + match[3];
  }
  return val;
};

/**
 * Capitalizes a standard word for Word Bank display
 */
const capitalizeWord = (word: string): string => {
  const trimmed = (word || '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export function PracticeTest() {
  const { words, allWords, selectedLesson, availableLessons, setSelectedLesson, recordPractice } =
    useVocabStore();
  const { addCoins, addStars, recordAnswer, incrementGamesCompleted } = useProgressStore();
  const { soundEnabled, reduceMotion } = useSettingsStore();

  // Test State
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('vocab_student_name') || '';
  });
  const [shuffledQuestions, setShuffledQuestions] = useState<VocabWord[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showWordBank, setShowWordBank] = useState(true);
  const [isGraded, setIsGraded] = useState(false);
  const [hasAwardedRewards, setHasAwardedRewards] = useState(false);
  const [scoreData, setScoreData] = useState<{
    correctCount: number;
    totalCount: number;
    percentage: number;
  } | null>(null);

  // Print & PDF Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printIncludeAnswers, setPrintIncludeAnswers] = useState(false);
  const [printIncludeWordBank, setPrintIncludeWordBank] = useState(true);
  const [previewZoom, setPreviewZoom] = useState<number>(85);
  const [isFitPage, setIsFitPage] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Extract week number or fallback name for the title
  // e.g. "Week #1" -> "1", "Week 2" -> "2", "all" -> "All Lessons"
  const weekNumber = useMemo(() => {
    const match = selectedLesson.match(/\d+/);
    return match ? match[0] : null;
  }, [selectedLesson]);

  const testTitle = useMemo(() => {
    if (weekNumber !== null) {
      return `Vocabulary Test for Week ${weekNumber}`;
    }
    if (selectedLesson.toLowerCase() === 'all') {
      return 'Vocabulary Test for All Lessons';
    }
    return `Vocabulary Test for ${selectedLesson}`;
  }, [weekNumber, selectedLesson]);

  // Current lesson words list
  const currentWords = useMemo(() => {
    if (selectedLesson === 'all') return allWords;
    const filtered = allWords.filter((w) => (w.lesson || 'Week #1') === selectedLesson);
    return filtered.length > 0 ? filtered : words;
  }, [selectedLesson, allWords, words]);

  // Generate / Reset Test when currentWords or selectedLesson changes
  useEffect(() => {
    initNewTest();
  }, [selectedLesson, currentWords.length]);

  const initNewTest = () => {
    if (currentWords.length === 0) {
      setShuffledQuestions([]);
      setAnswers({});
      setIsGraded(false);
      setScoreData(null);
      return;
    }

    // Ensure unique definitions and shuffle order
    // Fisher-Yates shuffle
    const uniqueDefs = new Map<string, VocabWord>();
    for (const w of currentWords) {
      const def = (w.definition || '').trim();
      const wd = (w.word || '').trim();
      if (def && wd && !uniqueDefs.has(def)) {
        uniqueDefs.set(def, w);
      }
    }
    const questionsArray = Array.from(uniqueDefs.values());
    for (let i = questionsArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questionsArray[i], questionsArray[j]] = [questionsArray[j], questionsArray[i]];
    }

    setShuffledQuestions(questionsArray);
    setAnswers({});
    setIsGraded(false);
    setHasAwardedRewards(false);
    setScoreData(null);
  };

  // Word Bank words: unique, sorted alphabetically, first letter capitalized
  const wordBankList = useMemo(() => {
    const unique = new Set<string>();
    currentWords.forEach((item) => {
      const trimmed = (item.word || '').trim();
      if (trimmed) {
        unique.add(capitalizeWord(trimmed));
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [currentWords]);

  // Answer tracking: count how many times each normalized word has been typed across questions
  const answerCounts = useMemo(() => {
    const counts = new Map<string, number>();
    Object.values(answers).forEach((val) => {
      const trimmed = (typeof val === 'string' ? val : '').trim().toLowerCase();
      if (trimmed) {
        counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
      }
    });
    return counts;
  }, [answers]);

  // Handle student name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStudentName(val);
    try {
      localStorage.setItem('vocab_student_name', val);
    } catch {}
  };

  // Handle student typing in answer field with automatic first-letter capitalization
  const handleAnswerChange = (questionId: string, rawValue: string) => {
    const formatted = autoCapitalizeFirstLetter(rawValue);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: formatted,
    }));
    // If user modifies an answer after grading, reset grading state so they can re-check
    if (isGraded) {
      setIsGraded(false);
      setScoreData(null);
    }
  };

  // Check / Grade Test
  const handleGradeTest = () => {
    if (shuffledQuestions.length === 0) return;

    let correct = 0;
    shuffledQuestions.forEach((q) => {
      const studentAns = (answers[q.id] || '').trim().toLowerCase();
      const expectedAns = (q.word || '').trim().toLowerCase();
      const isWordCorrect = studentAns === expectedAns;
      if (isWordCorrect) {
        correct++;
      }
      recordPractice(q.id, isWordCorrect);
      recordAnswer(isWordCorrect);
    });

    const total = shuffledQuestions.length;
    const percentage = Math.round((correct / total) * 100);

    setScoreData({
      correctCount: correct,
      totalCount: total,
      percentage,
    });
    setIsGraded(true);

    // Reward player with coins & stars only once per test session (prevents infinite coin farming exploit)
    if (!hasAwardedRewards) {
      incrementGamesCompleted();
      const coinsEarned = correct * 10 + (percentage === 100 ? 50 : 0);
      const starsEarned = percentage >= 80 ? 2 : percentage >= 50 ? 1 : 0;
      if (coinsEarned > 0) addCoins(coinsEarned, 'Practice Test Completion');
      if (starsEarned > 0) addStars(starsEarned);
      setHasAwardedRewards(true);
    }

    // Audio / Haptic / Confetti celebration
    if (percentage === 100) {
      playWinSound(soundEnabled);
      haptic.win();
      if (!reduceMotion) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } else if (percentage >= 70) {
      playCorrectSound(soundEnabled);
      haptic.success();
    } else {
      playIncorrectSound(soundEnabled);
      haptic.medium();
    }

    // Smooth scroll up to score summary
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Clear all entered answers
  const handleClearAnswers = () => {
    haptic.selection();
    setAnswers({});
    setIsGraded(false);
    setHasAwardedRewards(false);
    setScoreData(null);
  };

  // Open Print / PDF Modal
  const handlePrint = () => {
    haptic.selection();
    setShowPrintModal(true);
  };

  const [printStatus, setPrintStatus] = useState<string | null>(null);

  // Generate authentic single-page PDF assessment
  const generateSinglePagePDF = async (includeAnswers = printIncludeAnswers, includeWordBank = printIncludeWordBank) => {
    try {
      setPrintStatus('Generating single-page PDF...');
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter', // 612 x 792 pt
      });

      const pageWidth = 612;
      const pageHeight = 792;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;
      const count = shuffledQuestions.length;

      // Dynamic scaling parameters based on question count
      let titleSize = 16;
      let headerGap = 16;
      let studentLineY = 74;
      let baseFontSize = 10;
      let defFontSize = 9.5;
      let qHeight = 24;

      if (count >= 16) {
        titleSize = 13;
        headerGap = 12;
        studentLineY = 62;
        baseFontSize = 8;
        defFontSize = 7.5;
        qHeight = 15;
      } else if (count >= 12) {
        titleSize = 14;
        headerGap = 14;
        studentLineY = 68;
        baseFontSize = 8.5;
        defFontSize = 8;
        qHeight = 18;
      } else if (count >= 8) {
        titleSize = 15;
        baseFontSize = 9;
        defFontSize = 8.5;
        qHeight = 21;
      }

      // Header Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(titleSize);
      doc.setTextColor(30, 41, 59);
      doc.text(testTitle, pageWidth / 2, 38, { align: 'center' });

      // Subtitle
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Wordtopia • Single-Page Vocabulary Assessment', pageWidth / 2, 50, { align: 'center' });

      // Student info lines
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(1);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      let y = studentLineY;
      doc.text('Name:', margin, y);
      doc.line(margin + 35, y + 2, margin + 210, y + 2);
      if (studentName) {
        doc.setFont('helvetica', 'normal');
        doc.text(studentName, margin + 40, y);
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Date:', margin + 225, y);
      doc.line(margin + 255, y + 2, margin + 360, y + 2);

      doc.text('Score:', margin + 375, y);
      doc.line(margin + 415, y + 2, margin + 475, y + 2);
      doc.text(`/ ${count}`, margin + 480, y);

      y += headerGap;

      // Word Bank box
      if (includeWordBank && wordBankList.length > 0) {
        const bankWords = wordBankList.join('   •   ');
        const splitBank = doc.splitTextToSize(bankWords, contentWidth - 80);
        const bankBoxHeight = Math.max(26, splitBank.length * (count > 14 ? 10 : 12) + 10);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(margin, y, contentWidth, bankBoxHeight, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('WORD BANK:', margin + 8, y + (bankBoxHeight > 30 ? 12 : 16));

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(count > 14 ? 8 : 8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(splitBank, margin + 78, y + 12);

        y += bankBoxHeight + (count > 14 ? 6 : 8);
      } else {
        y += 6;
      }

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y - 2, margin + contentWidth, y - 2);

      // Directions
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Directions: Read each definition carefully. Write the correct vocabulary word on the blank line provided.',
        margin,
        y + 8
      );

      y += count > 14 ? 16 : 20;

      const blankLineWidth = count > 14 ? 115 : 135;

      shuffledQuestions.forEach((q, idx) => {
        const defLines = doc.splitTextToSize(q.definition || '', contentWidth - blankLineWidth - 40);
        const currentQHeight = Math.max(qHeight, defLines.length * (count > 14 ? 9 : 11) + 4);

        const qNum = `${idx + 1}.`;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(baseFontSize);
        doc.setTextColor(30, 41, 59);
        doc.text(qNum, margin, y);

        // Fill line
        doc.setDrawColor(100, 116, 139);
        doc.setLineWidth(1);
        doc.line(margin + 16, y + 2, margin + 16 + blankLineWidth, y + 2);

        // If showing answers or student answer
        const ansText = includeAnswers ? q.word : (answers[q.id] || '');
        if (ansText) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(baseFontSize);
          doc.setTextColor(14, 116, 144);
          doc.text(ansText, margin + 20, y);
        }

        // Definition prompt
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(defFontSize);
        doc.setTextColor(51, 65, 85);
        doc.text(defLines, margin + 24 + blankLineWidth, y);

        y += currentQHeight;
      });

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Wordtopia • Single-Page Printable Assessment', pageWidth / 2, pageHeight - 12, { align: 'center' });

      // Save PDF
      const filename = `${testTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      doc.save(filename);
      setPrintStatus('PDF generated successfully!');
      haptic.success();
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setPrintStatus('Error generating PDF. Please try again.');
    }
  };

  const handleTriggerPrint = () => {
    haptic.selection();
    try {
      window.print();
    } catch (e) {
      console.warn('Direct print blocked in iframe, downloading PDF:', e);
      setPrintStatus('Browser blocked iframe print. Generating and downloading single-page PDF instead!');
      generateSinglePagePDF(printIncludeAnswers, printIncludeWordBank);
    }
  };

  // Quick fill from clicking a word in word bank if input is empty
  const handleBankWordClick = (word: string) => {
    haptic.light();
    // Find first empty question and fill it
    const emptyQuestion = shuffledQuestions.find((q) => !(answers[q.id] || '').trim());
    if (emptyQuestion) {
      handleAnswerChange(emptyQuestion.id, word);
    }
  };

  // If no words available in current lesson
  if (currentWords.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="bg-white p-8 rounded-3xl shadow-sm border-4 border-slate-200 w-full space-y-4">
          <BookOpen size={48} className="text-sky-500 mx-auto" />
          <h2 className="text-2xl font-black text-slate-800">No Words in This Week</h2>
          <p className="text-slate-600 font-bold text-sm">
            Please switch to another lesson or add vocabulary words to get started!
          </p>
          <div className="pt-2 flex flex-wrap gap-2 justify-center">
            {availableLessons.map((lesson) => (
              <button
                key={lesson}
                onClick={() => setSelectedLesson(lesson)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-xl text-sm transition-all"
              >
                {lesson}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-2 sm:py-6 px-1 sm:px-4" ref={containerRef}>
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="no-print bg-white/90 backdrop-blur-md rounded-2xl p-3 sm:p-4 mb-4 border-2 border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Lesson Switcher Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Lesson:</span>
          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="bg-sky-50 hover:bg-sky-100 text-sky-800 border-2 border-sky-300 font-black text-xs sm:text-sm rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer transition-colors"
          >
            {availableLessons.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
            <option value="all">All Lessons</option>
          </select>
        </div>

        {/* Word Bank Visibility Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Show / Hide Word Bank Toggle (Requirement 8) */}
          <button
            type="button"
            onClick={() => setShowWordBank(!showWordBank)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm border-2 transition-all active:scale-95 ${
              showWordBank
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title="Toggle Word Bank (Easier / Harder)"
          >
            {showWordBank ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>☑ Show Word Bank</span>
                <span className="hidden md:inline-block text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                  Easier
                </span>
              </>
            ) : (
              <>
                <EyeOff size={16} className="text-slate-500" />
                <span>☐ Hide Word Bank</span>
                <span className="hidden md:inline-block text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
                  Challenge
                </span>
              </>
            )}
          </button>

          {/* New Test / Reshuffle */}
          <button
            type="button"
            onClick={initNewTest}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border-2 border-slate-300 text-xs sm:text-sm transition-all active:scale-95"
            title="Shuffle Questions And Create A New Test"
          >
            <Shuffle size={15} />
            <span className="hidden sm:inline">New Shuffle</span>
          </button>

          {/* Clear Answers */}
          <button
            type="button"
            onClick={handleClearAnswers}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border-2 border-slate-300 text-xs sm:text-sm transition-all active:scale-95"
            title="Clear All Answer Fields"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Print Worksheet */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl border-2 border-sky-700 text-xs sm:text-sm transition-all shadow-xs active:scale-95"
            title="Print Printable Worksheet"
          >
            <Printer size={15} />
            <span>Print Test</span>
          </button>
        </div>
      </div>

      {/* Main Worksheet Card */}
      <div className="worksheet-container bg-white rounded-3xl p-5 sm:p-8 md:p-10 border-4 border-slate-200 shadow-xl relative overflow-hidden">
        {/* Subtle lined worksheet accent bar */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-400 no-print" />

        {/* 1. TEST HEADER (Requirement 1) */}
        <header className="mb-6 border-b-2 border-slate-200 pb-5">
          {/* Centered Title */}
          <h1 className="text-center font-black text-2xl sm:text-3xl md:text-4xl text-slate-800 tracking-tight">
            {testTitle}
          </h1>

          {/* Name Field and Date row */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 max-w-full">
              <label
                htmlFor="student-name-input"
                className="font-black text-slate-800 text-base sm:text-lg whitespace-nowrap"
              >
                Name:
              </label>
              <input
                id="student-name-input"
                type="text"
                value={studentName}
                onChange={handleNameChange}
                placeholder="Write your name"
                className="px-3 py-1.5 text-base sm:text-lg font-bold text-slate-800 bg-sky-50/60 focus:bg-white border-b-2 border-slate-400 focus:border-sky-600 focus:outline-none rounded-t transition-colors w-52 sm:w-64 max-w-[calc(100%-60px)]"
              />
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm font-bold">
              <span>Date:</span>
              <span className="border-b-2 border-slate-300 w-28 sm:w-36 px-1 inline-block text-slate-700">
                {new Date().toLocaleDateString(undefined, {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Exact instructions under Name (Requirement 1) */}
          <p className="mt-3.5 text-sm sm:text-base font-bold text-slate-600 italic">
            Write the vocabulary word that matches the definition.
          </p>
        </header>

        {/* Graded Score Banner (Shown when user submits/grades test) */}
        {isGraded && scoreData && (
          <div
            className={`no-print mb-6 p-4 sm:p-5 rounded-2xl border-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${
              scoreData.percentage === 100
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : scoreData.percentage >= 70
                ? 'bg-sky-50 border-sky-300 text-sky-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  scoreData.percentage >= 70 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                <Trophy size={28} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black">
                  Score: {scoreData.correctCount} / {scoreData.totalCount} ({scoreData.percentage}%)
                </h3>
                <p className="font-bold text-xs sm:text-sm opacity-90">
                  {scoreData.percentage === 100
                    ? '🎉 Perfect Score! Outstanding work!'
                    : scoreData.percentage >= 70
                    ? '⭐ Great job! Review the ones you missed below.'
                    : '💪 Keep practicing! You can do it!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={initNewTest}
                className="px-4 py-2 bg-white font-black text-xs sm:text-sm rounded-xl border-2 border-current shadow-xs hover:bg-slate-50 transition-all active:scale-95"
              >
                Retry Test
              </button>
            </div>
          </div>
        )}

        {/* 2. VOCABULARY QUESTIONS (Requirement 2 & 3) */}
        <section aria-label="Vocabulary Questions" className="space-y-4 sm:space-y-5">
          {shuffledQuestions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 font-bold flex flex-col items-center gap-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6">
              <BookOpen size={36} className="text-slate-300" />
              <p className="text-base text-slate-700 font-black">No questions available for this lesson.</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose a different lesson from the selector above or add new vocabulary words in the editor.
              </p>
              <Link
                to="/editor"
                className="mt-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95"
              >
                Open Vocabulary Editor
              </Link>
            </div>
          ) : (
            shuffledQuestions.map((item, index) => {
              const currentAns = answers[item.id] || '';
              const normalizedStudent = currentAns.trim().toLowerCase();
              const normalizedExpected = (item.word || '').trim().toLowerCase();
              const isCorrect = normalizedStudent === normalizedExpected;

              return (
                <div
                  key={item.id}
                  className="worksheet-question-row flex flex-col md:flex-row items-start md:items-center gap-2.5 sm:gap-4 p-2 sm:p-3 rounded-2xl transition-colors hover:bg-slate-50/80 border-b border-slate-100 last:border-b-0"
                >
                  {/* Number & Input container */}
                  <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto shrink-0">
                    {/* Sequential Number */}
                    <span className="font-black text-slate-800 text-base sm:text-lg w-6 sm:w-8 text-right shrink-0 select-none">
                      {index + 1}.
                    </span>

                    {/* Answer Input Field */}
                    <div className="relative flex-1 md:flex-initial">
                      <input
                        type="text"
                        value={currentAns}
                        onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                        placeholder="Type word..."
                        autoCapitalize="words"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        className={`w-full md:w-48 lg:w-56 px-3.5 py-2 text-base sm:text-lg font-bold rounded-xl border-2 transition-all shadow-inner focus:outline-none ${
                          isGraded
                            ? isCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-200'
                              : 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200'
                            : 'bg-slate-50 border-slate-300 hover:border-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-200'
                        }`}
                        aria-label={`Answer for question ${index + 1}`}
                      />

                      {/* Feedback Icon when Graded */}
                      {isGraded && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {isCorrect ? (
                            <CheckCircle2 size={20} className="text-emerald-600" />
                          ) : (
                            <XCircle size={20} className="text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Definition Text (Vocabulary Word NOT displayed beside definition) */}
                  <div className="flex-1 pl-8 md:pl-0">
                    <p className="text-sm sm:text-base font-semibold text-slate-700 leading-snug">
                      {item.definition}
                    </p>

                    {/* Expected word revealed only when test has been graded and answer was wrong */}
                    {isGraded && !isCorrect && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-rose-600">
                        <span>Correct answer:</span>
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-black">
                          {capitalizeWord(item.word || '')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* 4. WORD BANK & 5. AUTOMATIC STRIKETHROUGH (Requirement 4, 5, 6, 7, 8) */}
        {showWordBank && (
          <div className="mt-8 pt-6 border-t-4 border-dashed border-slate-200">
            <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-6 border-2 border-slate-200">
              {/* Word Bank Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-sky-600 no-print" />
                  <h2 className="font-black text-lg sm:text-xl text-slate-800 tracking-wide">
                    Word Bank
                  </h2>
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-400 no-print">
                  {wordBankList.length} words
                </span>
              </div>

              {/* Word Bank Items with Dot Separator */}
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5 text-center py-1">
                {wordBankList.map((word, idx) => {
                  const normalizedBankWord = word.trim().toLowerCase();
                  const useCount = answerCounts.get(normalizedBankWord) || 0;
                  const isUsed = useCount > 0;

                  return (
                    <React.Fragment key={word}>
                      <button
                        type="button"
                        onClick={() => handleBankWordClick(word)}
                        className={`group relative text-sm sm:text-base md:text-lg transition-all rounded-lg px-2 py-0.5 select-none ${
                          isUsed
                            ? 'line-through text-slate-400 font-semibold decoration-2 decoration-sky-500 opacity-60'
                            : 'font-black text-slate-800 hover:text-sky-600 hover:bg-white active:scale-95 cursor-pointer'
                        }`}
                        title={
                          isUsed
                            ? useCount > 1
                              ? `Used In ${useCount} Questions`
                              : 'Already Used In An Answer'
                            : 'Click To Place In Next Empty Answer Field'
                        }
                      >
                        <span>{word}</span>

                        {/* If word was used multiple times in answers, show count badge (Requirement 7) */}
                        {useCount > 1 && (
                          <span className="ml-1 text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-300 rounded px-1 py-0.2 no-underline inline-block align-middle">
                            {useCount}x
                          </span>
                        )}
                      </button>

                      {/* Middle dot separator between words */}
                      {idx < wordBankList.length - 1 && (
                        <span className="text-slate-300 font-black select-none text-base">·</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Action Button at Bottom: Grade Test (Hidden in Print) */}
        <div className="no-print mt-8 pt-6 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm font-bold text-slate-500">
            {Object.values(answers).filter((a) => (typeof a === 'string' ? a.trim() : '').length > 0).length} of{' '}
            {shuffledQuestions.length} answered
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl border-2 border-sky-700 text-xs sm:text-sm transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
              title="Print Worksheet Or Save As Single-Page PDF"
            >
              <Printer size={16} />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleClearAnswers}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl border-2 border-slate-300 text-xs sm:text-sm transition-all active:scale-95"
            >
              Clear Answers
            </button>

            <button
              type="button"
              onClick={handleGradeTest}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl text-sm sm:text-base shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>{isGraded ? 'Re-Grade Test' : 'Grade Test'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINT & SINGLE-PAGE PDF MODAL POPUP */}
      {showPrintModal && (
        <div className="no-print fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-4 border-sky-300 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs">
                  <Printer size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black leading-tight">
                    Print or Save Vocabulary Test
                  </h3>
                  <p className="text-xs text-sky-100 font-medium">
                    Clean, authentic single-page assessment for paper or PDF
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintStatus(null);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Print Status Feedback */}
            {printStatus && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs font-bold text-amber-900 flex items-center justify-between">
                <span>{printStatus}</span>
                <button
                  type="button"
                  onClick={() => setPrintStatus(null)}
                  className="text-amber-700 hover:text-amber-950 font-black ml-2 px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Modal Controls Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printIncludeWordBank}
                    onChange={(e) => setPrintIncludeWordBank(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>Include Word Bank</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printIncludeAnswers}
                    onChange={(e) => setPrintIncludeAnswers(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>Include Answers (Key)</span>
                </label>

                {/* View Scaling & Zoom Controls */}
                <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                  <span className="text-[11px] text-slate-500 font-black pl-1 hidden sm:inline">Scale:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFitPage(true);
                      setPreviewZoom(shuffledQuestions.length > 14 ? 75 : shuffledQuestions.length > 9 ? 85 : 92);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      isFitPage
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                    }`}
                  >
                    Fit Sheet
                  </button>

                  {[
                    { label: '75%', value: 75 },
                    { label: '100%', value: 100 },
                    { label: '125%', value: 125 },
                  ].map((z) => (
                    <button
                      key={z.value}
                      type="button"
                      onClick={() => {
                        setIsFitPage(false);
                        setPreviewZoom(z.value);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-black transition-all ${
                        !isFitPage && previewZoom === z.value
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                      }`}
                    >
                      {z.label}
                    </button>
                  ))}

                  <div className="flex items-center border-l border-slate-300 pl-1.5 ml-0.5 gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFitPage(false);
                        setPreviewZoom((z) => Math.max(50, z - 10));
                      }}
                      className="p-1 hover:bg-slate-300/60 rounded text-slate-600"
                      title="Zoom Out"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <span className="text-[10px] font-black text-slate-600 w-8 text-center">
                      {isFitPage ? 'Auto' : `${previewZoom}%`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFitPage(false);
                        setPreviewZoom((z) => Math.min(150, z + 10));
                      }}
                      className="p-1 hover:bg-slate-300/60 rounded text-slate-600"
                      title="Zoom In"
                    >
                      <ZoomIn size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateSinglePagePDF(printIncludeAnswers, printIncludeWordBank)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Download size={15} />
                  <span>Save Single-Page PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Print Document</span>
                </button>
              </div>
            </div>

            {/* Live Paper Document Preview */}
            <div className="p-4 sm:p-6 overflow-auto flex-1 bg-slate-200/90 flex justify-center items-start">
              <div
                style={{
                  transform: isFitPage
                    ? shuffledQuestions.length > 14
                      ? 'scale(0.80)'
                      : shuffledQuestions.length > 9
                      ? 'scale(0.86)'
                      : 'scale(0.92)'
                    : `scale(${previewZoom / 100})`,
                  transformOrigin: 'top center',
                  width: '8.5in',
                  maxWidth: '100%',
                  minHeight: '11in',
                  boxShadow: '0 10px 30px -5px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.1)',
                }}
                className={`bg-white rounded-md font-serif text-slate-900 transition-transform duration-150 flex flex-col justify-between ${
                  shuffledQuestions.length > 18
                    ? 'p-4 sm:p-5'
                    : shuffledQuestions.length > 12
                    ? 'p-5 sm:p-7'
                    : 'p-6 sm:p-9'
                }`}
              >
                <div>
                  <div className="text-center border-b-2 border-slate-800 pb-2.5 mb-3">
                    <h2 className="text-base sm:text-lg font-black tracking-tight">{testTitle}</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold">
                      Wordtopia Assessment • Single Page
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-xs font-sans font-bold border-b border-slate-200 pb-2 mb-3 gap-2">
                    <div>Name: <span className="underline decoration-slate-400 font-normal">{studentName || '______________________'}</span></div>
                    <div>Date: <span className="underline decoration-slate-400 font-normal">______________</span></div>
                    <div>Score: <span className="underline decoration-slate-400 font-normal">______ / {shuffledQuestions.length}</span></div>
                  </div>

                  {printIncludeWordBank && wordBankList.length > 0 && (
                    <div className="bg-slate-50 border border-slate-300 rounded-lg p-2 mb-3 text-center font-sans text-xs">
                      <span className="font-bold text-slate-600 mr-2">WORD BANK:</span>
                      <span className="text-slate-800 font-semibold">{wordBankList.join('   •   ')}</span>
                    </div>
                  )}

                  <p className="italic text-[10px] sm:text-[11px] text-slate-500 mb-3 font-sans">
                    Directions: Read each definition carefully. Write the correct vocabulary word on the blank line provided.
                  </p>

                  <div
                    className={`font-sans ${
                      shuffledQuestions.length > 18
                        ? 'space-y-1 text-[10.5px]'
                        : shuffledQuestions.length > 12
                        ? 'space-y-2 text-xs'
                        : shuffledQuestions.length > 7
                        ? 'space-y-3 text-xs sm:text-sm'
                        : 'space-y-4 text-sm'
                    }`}
                  >
                    {shuffledQuestions.map((q, idx) => (
                      <div key={q.id} className="flex items-baseline gap-2">
                        <span className="font-bold w-4 sm:w-5 shrink-0">{idx + 1}.</span>
                        <span
                          className={`inline-block border-b-2 border-slate-800 ${
                            shuffledQuestions.length > 14 ? 'min-w-[110px]' : 'min-w-[130px]'
                          } text-sky-800 font-bold px-1 text-center shrink-0`}
                        >
                          {printIncludeAnswers ? q.word : (answers[q.id] || '\u00A0')}
                        </span>
                        <span className="text-slate-700 leading-snug">{q.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 text-center font-sans text-[10px] text-slate-400">
                  Wordtopia Vocabulary Learning Platform • Page 1 of 1
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED PRINTABLE WORKSHEET (Active when Ctrl+P or window.print is triggered) */}
      <div id="printable-worksheet" className="print-only font-serif text-black p-4">
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <h1 className="text-xl font-bold uppercase tracking-wide">{testTitle}</h1>
          <p className="text-xs text-slate-700 uppercase font-sans font-bold">Wordtopia Assessment</p>
        </div>
        <div className="flex justify-between items-center text-xs font-sans font-bold border-b border-black pb-1.5 mb-3">
          <div>Name: <span className="underline font-normal">{studentName || '______________________'}</span></div>
          <div>Date: <span className="underline font-normal">______________</span></div>
          <div>Score: <span className="underline font-normal">______ / {shuffledQuestions.length}</span></div>
        </div>
        {printIncludeWordBank && wordBankList.length > 0 && (
          <div className="border border-black rounded p-2 mb-3 text-center font-sans text-xs">
            <span className="font-bold mr-2">WORD BANK:</span>
            <span>{wordBankList.join('   •   ')}</span>
          </div>
        )}
        <p className="italic text-[11px] text-slate-700 mb-3 font-sans">
          Directions: Read each definition carefully. Write the correct vocabulary word on the blank line provided.
        </p>
        <div
          className={`font-sans text-xs ${
            shuffledQuestions.length > 14
              ? 'space-y-1.5'
              : shuffledQuestions.length > 9
              ? 'space-y-2.5'
              : 'space-y-3.5'
          }`}
        >
          {shuffledQuestions.map((q, idx) => (
            <div key={q.id} className="flex items-baseline gap-2">
              <span className="font-bold w-5">{idx + 1}.</span>
              <span
                className={`inline-block border-b-2 border-black ${
                  shuffledQuestions.length > 14 ? 'min-w-[110px]' : 'min-w-[130px]'
                } font-bold text-center`}
              >
                {printIncludeAnswers ? q.word : '\u00A0'}
              </span>
              <span className="leading-snug">{q.definition}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default PracticeTest;

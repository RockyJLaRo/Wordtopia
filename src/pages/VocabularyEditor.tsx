import React, { useState } from 'react';
import { useVocabStore } from '../store/useVocabStore';
import { Plus, Trash2, Download, Upload, AlertCircle, RefreshCw, BookOpen, Sparkles, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export function VocabularyEditor() {
  const {
    allWords,
    words,
    selectedLesson,
    availableLessons,
    setSelectedLesson,
    addWord,
    updateWord,
    removeWord,
    clearAll,
    importWords,
    loadVocabFromUrl,
    isLoading,
  } = useVocabStore();

  const [newWord, setNewWord] = useState('');
  const [newDef, setNewDef] = useState('');
  const [newWordLesson, setNewWordLesson] = useState(
    selectedLesson !== 'all' ? selectedLesson : availableLessons[0] || 'Week #1'
  );
  const [customLessonInput, setCustomLessonInput] = useState('');
  const [isCustomLesson, setIsCustomLesson] = useState(false);

  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [justSynced, setJustSynced] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWord.trim() && newDef.trim()) {
      const targetLesson = isCustomLesson && customLessonInput.trim()
        ? customLessonInput.trim()
        : newWordLesson;
      addWord(newWord.trim(), newDef.trim(), targetLesson);
      setNewWord('');
      setNewDef('');
      if (isCustomLesson) {
        setIsCustomLesson(false);
        setCustomLessonInput('');
      }
    }
  };

  const handleImport = () => {
    if (importText.trim()) {
      importWords(
        importText,
        importMode === 'replace',
        selectedLesson !== 'all' ? selectedLesson : 'Week #1'
      );
      setImportText('');
      setIsImporting(false);
    }
  };

  const handleSyncFromWeb = async () => {
    await loadVocabFromUrl(true);
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 2500);
  };

  const handleExport = () => {
    // Group words by lesson
    const lessons = availableLessons.length > 0 ? availableLessons : ['Week #1'];
    let text = '';

    for (const l of lessons) {
      const lWords = allWords.filter((w) => (w.lesson || 'Week #1') === l);
      if (lWords.length > 0) {
        text += `${l}\n`;
        text += lWords.map((w) => `${w.word} - ${w.definition}`).join('\n');
        text += '\n\n';
      }
    }

    const blob = new Blob([text.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Vocab.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeLessonWords =
    selectedLesson === 'all'
      ? allWords
      : allWords.filter((w) => (w.lesson || 'Week #1') === selectedLesson);

  return (
    <div className="flex-1 flex flex-col py-3 sm:py-6 gap-3 sm:gap-6 w-full max-w-5xl mx-auto px-1">
      {/* Header Banner */}
      <div className="bg-white/90 p-4 sm:p-6 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <span>Vocabulary & Lessons</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs sm:text-sm mt-1">
            Total Course Words: <span className="text-sky-600">{allWords.length}</span> across{' '}
            <span className="text-sky-600">{availableLessons.length} lessons</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSyncFromWeb}
            disabled={isLoading}
            className={`px-3 sm:px-4 py-2 rounded-xl font-bold border-2 transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm text-xs sm:text-sm flex-1 sm:flex-initial justify-center ${
              justSynced
                ? 'bg-emerald-500 border-emerald-600 text-white'
                : 'bg-white hover:bg-sky-50 border-sky-300 text-sky-700'
            }`}
          >
            {justSynced ? (
              <>
                <Check size={16} />
                <span>Synced Fresh!</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                <span>Sync with Vocab.txt</span>
              </>
            )}
          </button>

          {words.length > 0 && (
            <Link
              to="/study"
              className="bg-sky-500 text-white font-bold px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 hover:bg-sky-400 shadow-sm text-xs sm:text-sm flex-1 sm:flex-initial justify-center"
            >
              <BookOpen size={16} />
              <span>Start Studying</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Col - Add Word & Bulk Tools */}
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Add Word Form */}
          <form
            onSubmit={handleAdd}
            className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border-2 sm:border-4 border-slate-200 flex flex-col gap-3 sm:gap-4"
          >
            <h2 className="font-black text-slate-700 text-base sm:text-lg flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" />
              <span>Add New Word</span>
            </h2>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                Assign to Lesson
              </label>
              {!isCustomLesson ? (
                <div className="flex gap-2">
                  <select
                    value={newWordLesson}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomLesson(true);
                      } else {
                        setNewWordLesson(e.target.value);
                      }
                    }}
                    className="flex-1 bg-slate-100 border-2 border-slate-200 p-2.5 rounded-xl font-bold text-slate-700 outline-none focus:border-sky-400 text-sm"
                  >
                    {availableLessons.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                    <option value="__NEW__">+ New Lesson...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Week #3"
                    value={customLessonInput}
                    onChange={(e) => setCustomLessonInput(e.target.value)}
                    className="flex-1 bg-slate-100 border-2 border-slate-200 p-2.5 rounded-xl font-bold text-slate-700 outline-none focus:border-sky-400 text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomLesson(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                Word
              </label>
              <input
                type="text"
                placeholder="e.g. Clash"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                className="w-full bg-slate-100 border-2 border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                Definition
              </label>
              <textarea
                placeholder="e.g. Colors or patterns that look ugly together."
                value={newDef}
                onChange={(e) => setNewDef(e.target.value)}
                className="w-full bg-slate-100 border-2 border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-sky-400 resize-none h-24"
              />
            </div>

            <button
              type="submit"
              disabled={!newWord.trim() || !newDef.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-black p-3 rounded-xl flex items-center justify-center gap-2 transition-colors border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-sm"
            >
              <Plus size={20} /> Add to {isCustomLesson && customLessonInput ? customLessonInput : newWordLesson}
            </button>
          </form>

          {/* Bulk Tools */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border-4 border-slate-200 flex flex-col gap-4">
            <h2 className="font-black text-slate-700 text-lg">Bulk Tools</h2>
            {isImporting ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-500 font-bold">
                  Tip: Include <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-600">Week #1</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-600">Week #2</code> headers to automatically organize into lessons!
                </p>
                <textarea
                  placeholder="Week #1&#10;Word - Definition&#10;&#10;Week #2&#10;Word - Definition"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="bg-slate-100 border-4 border-slate-200 p-3 rounded-xl font-bold text-sm h-36 outline-none focus:border-sky-400 font-mono"
                />
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-sky-500 w-4 h-4 cursor-pointer"
                    />{' '}
                    Append
                  </label>
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-sky-500 w-4 h-4 cursor-pointer"
                    />{' '}
                    Replace all
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleImport}
                    className="flex-1 bg-sky-500 text-white font-bold py-2 rounded-lg hover:bg-sky-400"
                  >
                    Import
                  </button>
                  <button
                    onClick={() => setIsImporting(false)}
                    className="flex-1 bg-slate-200 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setIsImporting(true)}
                  className="flex items-center justify-center gap-2 bg-slate-100 border-2 border-slate-200 text-slate-700 font-bold p-3 rounded-xl hover:bg-slate-200"
                >
                  <Upload size={18} /> Bulk Import (Text)
                </button>
                <button
                  onClick={handleExport}
                  disabled={allWords.length === 0}
                  className="flex items-center justify-center gap-2 bg-slate-100 border-2 border-slate-200 text-slate-700 font-bold p-3 rounded-xl hover:bg-slate-200 disabled:opacity-50"
                >
                  <Download size={18} /> Export Vocab.txt
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        selectedLesson === 'all'
                          ? 'Are you sure you want to clear ALL words from all lessons?'
                          : `Are you sure you want to clear words from ${selectedLesson}?`
                      )
                    ) {
                      clearAll(selectedLesson !== 'all');
                    }
                  }}
                  disabled={allWords.length === 0}
                  className="flex items-center justify-center gap-2 bg-rose-50 border-2 border-rose-200 text-rose-600 font-bold p-3 rounded-xl hover:bg-rose-100 disabled:opacity-50 mt-2"
                >
                  <Trash2 size={18} />{' '}
                  {selectedLesson === 'all'
                    ? 'Clear All Words'
                    : `Clear ${selectedLesson} Words`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col - Word List & Lesson Filter */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border-4 border-slate-200 overflow-hidden flex flex-col max-h-[78vh]">
          {/* Lesson Filter Tabs */}
          <div className="p-3 border-b-4 border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedLesson('all')}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                  selectedLesson === 'all'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-sky-300'
                }`}
              >
                <Sparkles size={12} />
                <span>All ({allWords.length})</span>
              </button>

              {availableLessons.map((lesson) => {
                const count = allWords.filter(
                  (w) => (w.lesson || 'Week #1') === lesson
                ).length;
                const isSelected = selectedLesson === lesson;
                return (
                  <button
                    key={lesson}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-sky-300'
                    }`}
                  >
                    <BookOpen size={12} />
                    <span>
                      {lesson} ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200">
              Showing {activeLessonWords.length} words
            </span>
          </div>

          {/* List of Words */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {activeLessonWords.length === 0 ? (
              <div className="text-center p-12 text-slate-400 font-bold flex flex-col items-center gap-3">
                <AlertCircle size={36} className="opacity-40" />
                <p>No words in {selectedLesson === 'all' ? 'any lesson' : selectedLesson}.</p>
                <button
                  onClick={handleSyncFromWeb}
                  className="bg-sky-100 hover:bg-sky-200 text-sky-700 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Fetch from Online Vocab.txt
                </button>
              </div>
            ) : (
              activeLessonWords.map((w) => (
                <div
                  key={w.id}
                  className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl hover:border-sky-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sky-600 font-black text-lg">{w.word}</span>
                      
                      {/* Lesson Badge with Quick Reassign */}
                      <select
                        value={w.lesson || 'Week #1'}
                        onChange={(e) => updateWord(w.id, w.word, w.definition, e.target.value)}
                        className="text-xs bg-sky-100 hover:bg-sky-200 text-sky-800 font-black px-2 py-0.5 rounded-full border border-sky-300 outline-none cursor-pointer"
                        title="Reassign Word To A Different Lesson"
                      >
                        {availableLessons.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>

                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          w.masteryLevel === 'Mastered'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {w.masteryLevel}
                      </span>
                    </div>
                    <p className="text-slate-600 font-bold text-sm mt-1">{w.definition}</p>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <button
                      onClick={() => removeWord(w.id)}
                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Word"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

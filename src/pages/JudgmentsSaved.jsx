import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { judgmentService } from '../services/library/judgmentService';
import { notesService } from '../services/library/notesService';

const COURT_FILTERS = [
  { label: 'All Courts', value: 'All' },
  { label: 'Supreme Court', value: 'Supreme Court' },
  { label: 'High Court', value: 'High Court' },
  { label: 'NCLT', value: 'NCLT' },
  { label: 'NCLAT', value: 'NCLAT' },
  { label: 'Tribunal', value: 'Tribunal' },
  { label: 'Consumer Forum', value: 'Consumer Forum' },
];

const SORT_OPTIONS = [
  { label: 'Recently Saved', value: 'recent' },
  { label: 'Newest (Judgment Date)', value: 'newest' },
  { label: 'Oldest (Judgment Date)', value: 'oldest' },
  { label: 'A–Z', value: 'a-z' },
];

const courtColors = {
  'Supreme Court': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  'High Court': 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  'NCLAT': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  'NCDRC': 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  'NCLT': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  'Tribunal': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  'Consumer Forum': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
};

const JudgmentCard = ({ judgment, onRemove, onSaveNote, onShare, onDownload }) => {
  const [showMoreActions, setShowMoreActions] = useState(false);

  return (
    <div className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${courtColors[judgment.court] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
            {judgment.court}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {judgment.category}
          </span>
        </div>
      </div>

      <Link to={`/dashboard/judgments/${judgment.id}`} className="font-bold text-slate-900 dark:text-white text-base leading-snug hover:text-primary transition-colors mb-1 line-clamp-2">
        {judgment.title}
      </Link>

      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">{judgment.citation}</p>

      <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
        <span>📅 Judgment: {judgment.date || judgment.year}</span>
        <span>⭐ Saved: {new Date(judgment.savedAt).toLocaleDateString()}</span>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
        {judgment.ratiodecidendi || judgment.summary}
      </p>

      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Link
          to={`/dashboard/judgments/${judgment.id}`}
          className="flex-1 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          Open
        </Link>

        <button
          onClick={onRemove}
          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
          title="Remove Bookmark"
        >
          <span className="material-symbols-outlined text-[16px]">bookmark_remove</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
            title="More Actions"
          >
            <span className="material-symbols-outlined text-[16px]">more_horiz</span>
          </button>
          {showMoreActions && (
            <>
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg z-20">
                <button
                  onClick={() => { setShowMoreActions(false); onSaveNote(); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  Add Note
                </button>
                <button
                  onClick={() => { setShowMoreActions(false); onShare(); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Share
                </button>
                <button
                  onClick={() => { setShowMoreActions(false); onDownload(); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setShowMoreActions(false);
                    navigator.clipboard.writeText(judgment.citation);
                    toast.success('Citation copied to clipboard');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  Copy Citation
                </button>
              </div>
              <div className="fixed inset-0 z-10" onClick={() => setShowMoreActions(false)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ onBrowse }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl">bookmark_border</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Saved Judgments Yet</h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
        Start exploring judgments and save important ones for quick access later!
      </p>
      <Link
        to="/dashboard/judgments"
        onClick={onBrowse || (() => { })}
        className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
      >
        Browse Judgments
      </Link>
    </div>
  );
};

const JudgmentsSaved = () => {
  const [savedJudgments, setSavedJudgments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

  const loadSaved = async () => {
    setIsLoading(true);
    try {
      const data = await judgmentService.getSavedJudgments();
      setSavedJudgments(data);
    } catch {
      toast.error('Failed to load saved judgments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let results = [...savedJudgments];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(j =>
        j.title.toLowerCase().includes(lowerQuery) ||
        j.citation.toLowerCase().includes(lowerQuery) ||
        j.court.toLowerCase().includes(lowerQuery) ||
        (j.judges || []).some(judge => judge.toLowerCase().includes(lowerQuery)) ||
        (j.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        j.parties?.petitioner?.toLowerCase().includes(lowerQuery) ||
        j.parties?.respondent?.toLowerCase().includes(lowerQuery)
      );
    }

    if (selectedCourt !== 'All') {
      results = results.filter(j => j.court === selectedCourt);
    }

    switch (sortBy) {
      case 'recent':
        results.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.date || b.year) - new Date(a.date || a.year));
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.date || a.year) - new Date(b.date || b.year));
        break;
      case 'a-z':
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return results;
  }, [savedJudgments, searchQuery, selectedCourt, sortBy]);

  const handleRemove = async (id) => {
    try {
      await judgmentService.removeJudgment(id);
      setSavedJudgments(prev => prev.filter(j => j.id !== id));
      toast.success('Judgment removed from saved');
    } catch {
      toast.error('Failed to remove judgment');
    }
  };

  const handleSaveNote = async (judgment) => {
    try {
      await notesService.createNote({
        title: judgment.title,
        content: [
          `Citation: ${judgment.citation}`,
          `Court: ${judgment.court} (${judgment.year})`,
          '',
          `SUMMARY\n${judgment.summary}`,
        ].join('\n'),
        tags: [judgment.category, judgment.court, ...(judgment.tags || []).slice(0, 3)],
      });
      toast.success('Saved to My Notes');
    } catch {
      toast.error('Failed to save note');
    }
  };

  const handleShare = async (judgment) => {
    const shareData = {
      title: judgment.title,
      text: `${judgment.citation} - ${judgment.court}, ${judgment.year}`,
      url: `${window.location.origin}/dashboard/judgments/${judgment.id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleDownload = () => {
    toast.success('PDF download feature coming soon!');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="animate-spin text-4xl text-primary">
          <span className="material-symbols-outlined">progress_activity</span>
        </div>
      </div>
    );
  }

  if (savedJudgments.length === 0) {
    return <EmptyState />;
  }

  const recentlySaved = filteredAndSorted.slice(0, 4);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151f2e] flex-shrink-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Saved Judgments</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {filteredAndSorted.length} saved judgment{filteredAndSorted.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search by party, citation, court, judge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            >
              {COURT_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Recently Saved */}
          {recentlySaved.length > 0 && sortBy === 'recent' && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recently Saved</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {recentlySaved.map(judgment => (
                  <JudgmentCard
                    key={judgment.id}
                    judgment={judgment}
                    onRemove={() => handleRemove(judgment.id)}
                    onSaveNote={() => handleSaveNote(judgment)}
                    onShare={() => handleShare(judgment)}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Saved Judgments */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">All Saved Judgments</h2>
            {filteredAndSorted.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredAndSorted.map(judgment => (
                  <JudgmentCard
                    key={judgment.id}
                    judgment={judgment}
                    onRemove={() => handleRemove(judgment.id)}
                    onSaveNote={() => handleSaveNote(judgment)}
                    onShare={() => handleShare(judgment)}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl">search_off</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No matching saved judgments</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </section>

          {/* Collections (Future Ready) */}
          <section className="bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-900/10 dark:to-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">folder</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Collections (Coming Soon)</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Organize your saved judgments into custom collections</p>
              </div>
            </div>
          </section>

          {/* Recent Activity (Future Ready) */}
          <section className="bg-gradient-to-br from-amber-50 to-slate-50 dark:from-amber-900/10 dark:to-slate-800 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">history</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity (Coming Soon)</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">See your interaction history with saved judgments</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default JudgmentsSaved;

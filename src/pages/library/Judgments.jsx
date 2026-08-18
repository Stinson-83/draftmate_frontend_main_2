import React, { useState, useEffect, useMemo } from 'react';
import JudgmentCard from '../../components/library/JudgmentCard';
import { judgmentCategories, judgmentCourts } from '../../data/mockJudgments';
import { searchJudgments } from '../../services/library/judgmentApi';
import { judgmentService } from '../../services/library/judgmentService';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Judgments = () => {
  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCourt, setSelectedCourt]     = useState('All');
  const [activeTab, setActiveTab]             = useState('all'); // 'all' | 'saved'
  const [savedRefresh, setSavedRefresh]       = useState(0);
  const [judgments, setJudgments]             = useState([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [apiError, setApiError]               = useState(null);

  // 100% Real-time Indian Kanoon API fetch on mount, search term change, or category change
  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      setIsLoading(true);
      setApiError(null);

      // Determine real-time search query for Indian Kanoon API
      const query = searchTerm.trim() 
        ? searchTerm.trim() 
        : (selectedCategory !== 'All' ? `${selectedCategory} Supreme Court` : 'Supreme Court 2024');

      try {
        const results = await searchJudgments(query);
        if (isSubscribed) {
          setJudgments(results || []);
        }
      } catch (e) {
        console.error('Real-time Kanoon API search error:', e);
        if (isSubscribed) {
          setApiError('Failed to fetch real-time judgments from Indian Kanoon.');
          setJudgments([]);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => { isSubscribed = false; };
  }, [searchTerm, selectedCategory, selectedCourt]);

  // 100% Real-time Indian Kanoon API results
  const filteredJudgments = useMemo(() => {
    let filtered = judgments;
    if (selectedCategory !== 'All') {
      const matchCat = filtered.filter(j => j.category === selectedCategory || (j.tags && j.tags.includes(selectedCategory)));
      if (matchCat.length > 0) filtered = matchCat;
    }
    if (selectedCourt !== 'All') {
      const matchCourt = filtered.filter(j => j.court && j.court.toLowerCase().includes(selectedCourt.toLowerCase()));
      if (matchCourt.length > 0) filtered = matchCourt;
    }
    return filtered;
  }, [judgments, selectedCategory, selectedCourt]);

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto flex flex-col">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex-1">

        {/* ── Header ── */}
        <Link to="/dashboard/library" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2563EB] mb-2 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Judgment Library</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Search and save landmark Indian court decisions.
            </p>
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            {[['all', 'All Judgments'], ['saved', 'Saved']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === key
                    ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Category & Court Filter Row ── */}
        {activeTab === 'all' && (
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category pills */}
            <div className="flex overflow-x-auto pb-1 scrollbar-none gap-2 flex-1">
              {judgmentCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Court dropdown */}
            <select
              value={selectedCourt}
              onChange={e => setSelectedCourt(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            >
              {judgmentCourts.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Courts' : c}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Full-Width Search Bar Below Filters ── */}
        {activeTab === 'all' && (
          <div className="w-full relative z-10 shadow-sm rounded-2xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl z-20">
              search
            </span>
            <input
              type="text"
              placeholder="Search by party, citation, court, or keyword..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-20"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
        )}

        {/* ── Judgment Grid ── */}
        {activeTab === 'all' ? (
          isLoading ? (
            <div className="flex justify-center p-12">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
          ) : apiError ? (
            <EmptyState 
              message="Failed to load judgments." 
              sub="Please try again or check your connection." 
              action={{ label: 'Retry', onClick: () => setSearchTerm(s => s) }} 
            />
          ) : filteredJudgments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredJudgments.map(j => (
                <JudgmentCard key={j.id} judgment={j} onSaveToggle={() => setSavedRefresh(p => p + 1)} />
              ))}
            </div>
          ) : (
            <EmptyState 
              message={searchTerm.trim() ? "No judgments match your search." : "No judgments found for selected filters."} 
              sub="Try a different keyword, court, or category." 
            />
          )
        ) : (
          <SavedJudgments key={savedRefresh} onBrowse={() => setActiveTab('all')} />
        )}
      </div>
    </div>
  );
};

// ── Saved Tab ──────────────────────────────────────────────────────────────

const SavedJudgments = ({ onBrowse }) => {
  const [savedList, setSavedList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    judgmentService.getSavedJudgments().then(d => { setSavedList(d); setIsLoading(false); });
  }, []);

  const handleRemove = async (id) => {
    await judgmentService.removeJudgment(id);
    setSavedList(prev => prev.filter(j => j.id !== id));
  };

  if (isLoading) return <div className="flex justify-center p-12"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

  if (savedList.length === 0) return (
    <EmptyState
      message="No saved judgments yet."
      sub="Browse the library and click the bookmark icon to save important cases here."
      action={{ label: 'Browse Judgments', onClick: onBrowse }}
    />
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {savedList.map(j => (
        <div key={j.id} className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start gap-3 mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">{j.court}</span>
            <button onClick={() => handleRemove(j.id)} title="Remove" className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100">
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
          <Link to={`/dashboard/judgments/${j.id}`} state={{ judgment: j }} className="font-bold text-slate-900 dark:text-white text-base leading-snug hover:text-primary transition-colors mb-1 line-clamp-2">{j.title}</Link>
          <p className="text-xs font-mono text-slate-500 mb-2">{j.citation}</p>
          <p className="text-xs text-slate-400">Saved {new Date(j.savedAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};

// ── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ message, sub, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
      <span className="material-symbols-outlined text-slate-400 text-3xl">gavel</span>
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{message}</h3>
    <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{sub}</p>
    {action && (
      <button 
        onClick={action.onClick} 
        className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default Judgments;

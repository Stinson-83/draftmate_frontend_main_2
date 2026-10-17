import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import JudgmentCard from '../../components/library/JudgmentCard';
import { getJudgmentFilters, searchLegalJudgments } from '../../services/library/judgmentApi';
import { judgmentService } from '../../services/library/judgmentService';
import { emptyFilters, filtersFromParams, hasActiveFilters, shouldSearch } from '../../services/library/judgmentSearch';
import { getRecentJudgments } from '../../services/library/judgmentApi';

const PAGE_SIZE = 9;

const Judgments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftQuery, setDraftQuery] = useState(searchParams.get('q') || '');
  const [draftFilters, setDraftFilters] = useState(() => filtersFromParams(searchParams));
  const [activeTab, setActiveTab] = useState('all');
  const [savedRefresh, setSavedRefresh] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0, hasNext: false, hasPrevious: false });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ courts: [], years: [], sources: ['Indian Kanoon'] });

  const searchKey = searchParams.toString();
  const appliedQuery = searchParams.get('q') || '';
  const appliedFilters = filtersFromParams(searchParams);
  const appliedPage = Math.max(1, Number(searchParams.get('page') || 1));
  const searchRequested = shouldSearch({ q: appliedQuery, filters: appliedFilters });

  useEffect(() => {
    setDraftQuery(appliedQuery);
    setDraftFilters(appliedFilters);
  }, [searchKey]);

  useEffect(() => {
    const controller = new AbortController();
    getJudgmentFilters({ signal: controller.signal })
      .then((options) => setFilterOptions(options))
      .catch(() => {});

    try {
      const stored = localStorage.getItem('draftmate_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!searchRequested) {
      const controller = new AbortController();
      setIsLoading(true);
      setApiError(null);
      getRecentJudgments(appliedPage, { signal: controller.signal })
        .then((data) => {
          setResults(data.results);
          setMeta({
            total: data.total,
            page: data.page,
            totalPages: data.totalPages,
            hasNext: data.hasNext,
            hasPrevious: data.hasPrevious,
          });
        })
        .catch((error) => {
          if (error.name === 'AbortError') return;
          setResults([]);
          setMeta({ total: 0, page: 1, totalPages: 0, hasNext: false, hasPrevious: false });
          setApiError(error.message || 'Failed to load recent judgments.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
      return () => controller.abort();
    }

    const controller = new AbortController();
    setIsLoading(true);
    setApiError(null);
    searchLegalJudgments(
      { q: appliedQuery, page: appliedPage, pageSize: PAGE_SIZE, filters: appliedFilters },
      { signal: controller.signal }
    )
      .then((data) => {
        setResults(data.results);
        setMeta({
          total: data.total,
          page: data.page,
          totalPages: data.totalPages,
          hasNext: data.hasNext,
          hasPrevious: data.hasPrevious,
        });
        sessionStorage.setItem('draftmate_judgment_library_search', `?${searchParams.toString()}`);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResults([]);
        setMeta({ total: 0, page: appliedPage, totalPages: 0, hasNext: false, hasPrevious: false });
        setApiError(error.message || 'Judgment search failed.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [searchKey]);

  const commitSearch = (next) => {
    const params = new URLSearchParams();
    const query = (next.q ?? draftQuery).trim();
    const filters = next.filters || draftFilters;
    const page = next.page || 1;
    if (query) params.set('q', query);
    Object.entries(filters).forEach(([key, value]) => {
      if (String(value || '').trim()) params.set(key, String(value).trim());
    });
    if (page > 1) params.set('page', String(page));
    if (query || Object.values(filters).some(Boolean)) {
      try {
        const entry = { q: query, filters, timestamp: Date.now() };
        setRecentSearches((prev) => {
          const updated = [entry, ...prev.filter(item => item.q !== query || JSON.stringify(item.filters) !== JSON.stringify(filters))].slice(0, 10);
          localStorage.setItem('draftmate_recent_searches', JSON.stringify(updated));
          return updated;
        });
      } catch {}
    }
    setSearchParams(params);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('draftmate_recent_searches');
  };

  const onSubmit = (event) => {
    event.preventDefault();
    commitSearch({ q: draftQuery, filters: draftFilters, page: 1 });
  };

  const clearFilters = () => {
    const cleared = emptyFilters();
    setDraftFilters(cleared);
    commitSearch({ q: draftQuery, filters: cleared, page: 1 });
  };

  const clearSearch = () => {
    setDraftQuery('');
    const cleared = emptyFilters();
    setDraftFilters(cleared);
    setSearchParams(new URLSearchParams());
  };

  const contextLabel = [
    appliedQuery ? `“${appliedQuery}”` : '',
    appliedFilters.court ? appliedFilters.court : '',
    appliedFilters.year_from || appliedFilters.year_to
      ? `${appliedFilters.year_from || '…'}–${appliedFilters.year_to || '…'}`
      : '',
    appliedFilters.section ? `Section ${appliedFilters.section}` : '',
    appliedFilters.act ? appliedFilters.act : '',
  ].filter(Boolean).join(' · ');

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto flex flex-col">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex-1">
        <Link to="/dashboard/library" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2563EB] mb-2 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Judgment Library</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Search Indian judgments by party, citation, court, Act, section, or legal issue.
            </p>
          </div>
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

        {activeTab === 'all' && (
          <>
            <form onSubmit={onSubmit} className="w-full relative z-10 shadow-sm rounded-2xl">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl z-20">
                search
              </span>
              <input
                type="text"
                placeholder="Search by party, citation, court, section, or keyword"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-base"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
              >
                Search
              </button>
            </form>

              <div className="mt-3 flex flex-wrap gap-2 px-2 items-center">
                <span className="text-sm text-slate-500 font-medium">Popular Searches:</span>
                {['Section 138', '"Negotiable Instruments Act"', 'cheque dishonour', 'bail', 'Article 21'].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setDraftQuery(ex);
                      commitSearch({ q: ex, filters: draftFilters, page: 1 });
                    }}
                    className="text-sm text-primary hover:underline bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {!searchRequested && recentSearches.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">Recent searches</span>
                    <button onClick={clearRecentSearches} className="text-xs text-slate-500 hover:text-red-500">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((entry, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setDraftQuery(entry.q);
                          setDraftFilters(entry.filters);
                          commitSearch({ q: entry.q, filters: entry.filters, page: 1 });
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-400">history</span>
                        {entry.q || 'Filtered search'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
              <select
                value={draftFilters.court}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, court: event.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
              >
                <option value="">All courts</option>
                {filterOptions.courts.map((court) => (
                  <option key={court} value={court}>{court}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Year from"
                value={draftFilters.year_from}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, year_from: event.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
              />
              <input
                type="number"
                placeholder="Year to"
                value={draftFilters.year_to}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, year_to: event.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
              />
              <input
                placeholder="Jurisdiction"
                value={draftFilters.jurisdiction}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, jurisdiction: event.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
              />
              <input
                placeholder="Citation"
                value={draftFilters.citation}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, citation: event.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
              />
              <input
                placeholder="Act"
                value={draftFilters.act}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, act: event.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
              />
              <input
                placeholder="Section"
                value={draftFilters.section}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, section: event.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
              />
              <select
                value={draftFilters.source}
                onChange={(event) => setDraftFilters((prev) => ({ ...prev, source: event.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
              >
                <option value="">All sources</option>
                {filterOptions.sources.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button type="button" onClick={onSubmit} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">
                Apply filters
              </button>
              {hasActiveFilters(draftFilters) && (
                <button type="button" onClick={clearFilters} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
                  Clear filters
                </button>
              )}
              {(appliedQuery || hasActiveFilters(appliedFilters)) && (
                <button type="button" onClick={clearSearch} className="px-4 py-2 rounded-xl text-sm text-slate-500">
                  Clear search
                </button>
              )}
              {searchRequested && !isLoading && !apiError && (
                <div className="flex items-center gap-4 ml-auto">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {meta.total.toLocaleString()} judgment{meta.total === 1 ? '' : 's'} found
                    {appliedQuery ? ` for: "${appliedQuery}"` : ''}
                  </p>
                  <select
                    value={draftFilters.sort || 'relevance'}
                    onChange={(e) => {
                      const newFilters = { ...draftFilters, sort: e.target.value };
                      setDraftFilters(newFilters);
                      commitSearch({ q: draftQuery, filters: newFilters, page: 1 });
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm font-medium"
                  >
                    <option value="relevance">Sort: Relevance</option>
                    <option value="newest">Sort: Newest</option>
                    <option value="oldest">Sort: Oldest</option>
                  </select>
                </div>
              )}
            </div>
            {!searchRequested && results.length > 0 && !isLoading && !apiError && (
              <div className="mt-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Judgments</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live updates
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'all' ? (
          isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-52 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] animate-pulse" />
              ))}
            </div>
          ) : apiError ? (
            <EmptyState
              message="Judgment search is unavailable."
              sub={apiError}
              action={{ label: 'Retry', onClick: () => searchRequested ? commitSearch({ q: appliedQuery, filters: appliedFilters, page: appliedPage }) : window.location.reload() }}
            />
          ) : results.length > 0 ? (
            <>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map((judgment) => (
                  <JudgmentCard key={judgment.id} judgment={judgment} query={appliedQuery} onSaveToggle={() => setSavedRefresh((value) => value + 1)} />
                ))}
              </div>
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={!meta.hasPrevious}
                    onClick={() => commitSearch({ q: appliedQuery, filters: appliedFilters, page: meta.page - 1 })}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-500">Page {meta.page} of {meta.totalPages}</span>
                  <button
                    type="button"
                    disabled={!meta.hasNext}
                    onClick={() => commitSearch({ q: appliedQuery, filters: appliedFilters, page: meta.page + 1 })}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              message="No judgments found."
              sub={contextLabel ? `Nothing matched ${contextLabel}.` : 'Nothing matched the current filters.'}
              action={hasActiveFilters(appliedFilters) ? { label: 'Clear filters', onClick: clearFilters } : { label: 'Clear search', onClick: clearSearch }}
            />
          )
        ) : (
          <SavedJudgments key={savedRefresh} onBrowse={() => setActiveTab('all')} />
        )}
      </div>
    </div>
  );
};

const SavedJudgments = ({ onBrowse }) => {
  const [savedList, setSavedList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    judgmentService.getSavedJudgments().then((data) => {
      setSavedList(data);
      setIsLoading(false);
    });
  }, []);

  const handleRemove = async (id) => {
    await judgmentService.removeJudgment(id);
    setSavedList((prev) => prev.filter((item) => item.id !== id));
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
  }

  if (savedList.length === 0) {
    return (
      <EmptyState
        message="No saved judgments yet."
        sub="Save a judgment from the search results to keep it here."
        action={{ label: 'Browse Judgments', onClick: onBrowse }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {savedList.map((judgment) => (
        <div key={judgment.id} className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start gap-3 mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{judgment.court}</span>
            <button onClick={() => handleRemove(judgment.id)} className="text-red-500 text-sm">Remove</button>
          </div>
          <Link to={`/dashboard/judgments/${judgment.id}`} state={{ judgment }} className="font-bold text-slate-900 dark:text-white line-clamp-2">{judgment.title}</Link>
          {judgment.citation ? <p className="text-xs font-mono text-slate-500 mt-2">{judgment.citation}</p> : null}
        </div>
      ))}
    </div>
  );
};

const EmptyState = ({ message, sub, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
      <span className="material-symbols-outlined text-slate-400 text-3xl">gavel</span>
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{message}</h3>
    <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md">{sub}</p>
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


import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ActCard from '../../components/library/ActCard';
import { bareActsApi } from '../../services/library/bareActsApi';

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const BareActs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [allActs, setAllActs] = useState([]);
  const [displayActs, setDisplayActs] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [acts, cats] = await Promise.all([
          bareActsApi.getActs(),
          bareActsApi.getCategories()
        ]);
        setAllActs(acts);
        setDisplayActs(acts);
        setCategories(cats);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message || 'Failed to load bare acts');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setDisplayActs(allActs);
        setSearching(false);
        return;
      }

      try {
        setSearching(true);
        const searchResults = await bareActsApi.searchActs(query);
        console.log("ACTS", searchResults); // STEP 3 - React state after normalization
        setDisplayActs(searchResults || []);
      } catch (err) {
        console.error("Error searching acts:", err);
        setDisplayActs(allActs);
      } finally {
        setSearching(false);
      }
    }, 300),
    [allActs]
  );

  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm, performSearch]);

  const filteredActs = useMemo(() => {
    if (selectedCategory === 'All') {
      const result = displayActs;
      console.log("FILTERED", result); // STEP 3 - Filtered acts
      return result;
    }
    const result = displayActs.filter(act => act.category === selectedCategory);
    console.log("FILTERED", result); // STEP 3 - Filtered acts
    return result;
  }, [displayActs, selectedCategory]);

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto flex flex-col">
      <div className="max-w-6xl mx-auto w-full space-y-8 flex-1">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bare Acts Library</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Browse, search, and understand Indian laws.</p>
          </div>
          
          <div className="w-full md:w-96 relative z-10">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-20">search</span>
            {searching && (
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 z-20 animate-spin">refresh</span>
            )}
            <input 
              type="text" 
              placeholder="Search by Act Name, Short Name, or Section..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Categories */}
        {!loading && !error && categories.length > 1 && (
          <div className="flex overflow-x-auto pb-2 scrollbar-none gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 animate-pulse">
              <span className="material-symbols-outlined text-slate-400 text-3xl">refresh</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Loading Bare Acts...</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Please wait while we load the library.</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-90/20 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">error</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{error}</p>
          </div>
        )}

        {/* Searching State */}
        {searching && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 animate-spin">
              <span className="material-symbols-outlined text-slate-400 text-3xl">refresh</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Searching...</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Finding relevant Bare Acts for you.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !searching && !error && filteredActs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredActs.map(act => (
              <ActCard key={act.id} act={act} />
            ))}
          </div>
        ) : !loading && !searching && !error && filteredActs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-slate-400 text-3xl">search_off</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No acts found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">We couldn't find any Bare Acts matching your search criteria. Try a different keyword or category.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BareActs;

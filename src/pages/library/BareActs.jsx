import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, BookOpen, AlertCircle, RefreshCcw, ArrowLeft } from 'lucide-react';
import ActCard from '../../components/library/ActCard';
import Pagination from '../../components/ui/Pagination';
import BareActsSkeleton from '../../components/library/BareActsSkeleton';
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 12;

  // Static premium categories as requested
  const PREMIUM_FILTERS = ['All', 'Central Acts', 'State Acts', 'Repealed Acts', 'Spent Acts', 'Recent Acts'];

  const fetchActs = useCallback(async (page, category, search) => {
    try {
      if (search) {
        setSearching(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let response;
      if (search && search.trim()) {
        response = await bareActsApi.searchActs(search.trim(), page, itemsPerPage);
      } else {
        let jurisdiction = null;
        let status = null;
        let cat = null;

        if (category === 'Central Acts') {
          jurisdiction = 'central';
        } else if (category === 'State Acts') {
          jurisdiction = 'state';
        } else if (category === 'Repealed Acts') {
          status = 'repealed';
        } else if (category === 'Spent Acts') {
          status = 'spent';
        } else if (category !== 'All' && category !== 'Recent Acts') {
          cat = category;
        }

        response = await bareActsApi.getActs(page, itemsPerPage, null, cat, jurisdiction, status);
      }

      const items = response?.items || (Array.isArray(response) ? response : []);
      const total = typeof response?.total === 'number' ? response.total : items.length;

      setDisplayActs(items);
      setTotalCount(total);
    } catch (err) {
      console.error("Error loading bare acts:", err);
      setError(err.message || 'Failed to load bare acts');
      setDisplayActs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    fetchActs(currentPage, selectedCategory, searchTerm);
  }, [currentPage, selectedCategory, fetchActs]);

  // Debounced search trigger
  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setCurrentPage(1);
        fetchActs(1, selectedCategory, val);
      }, 350),
    [fetchActs, selectedCategory]
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSearch(val);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0F172A] min-h-full h-full overflow-y-auto flex flex-col">
      {/* Hero Section */}
      <div className="bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 pt-10 pb-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link to="/dashboard/library" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2563EB] mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Link>
            <div className="block">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4 border border-blue-100 dark:border-blue-800/50">
                <BookOpen className="w-4 h-4" />
                Bare Acts Library
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
              Search Bare Acts
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Browse and search Central Acts, State Acts, Repealed Acts and Spent Acts across India.
            </p>
          </div>

          {/* Premium Search Bar */}
          <div className="relative z-10 max-w-4xl animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
            <div className="flex items-center bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-[0_8px_32px_rgba(37,99,235,0.08)] overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:border-transparent transition-all">
              <div className="pl-6 text-slate-400 flex-shrink-0">
                {searching ? <RefreshCcw className="w-6 h-6 animate-spin text-[#2563EB]" /> : <Search className="w-6 h-6" />}
              </div>
              <input
                type="text"
                placeholder="Search by title, act number, year, ministry, department or state..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1 w-full py-5 px-4 bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 text-lg"
              />
              <div className="flex items-center pr-2 gap-2">
                <button className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition-colors">
                  <Filter className="w-5 h-5" />
                  <span className="text-sm">Filters</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    fetchActs(1, selectedCategory, searchTerm);
                  }}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-blue-500/20 transition-all hover:shadow-blue-500/40 active:scale-95 m-1 flex-shrink-0"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto w-full space-y-8">

          {/* Top Toolbar & Filter Chips */}
          <div className="flex flex-col gap-6">
            <div className="flex overflow-x-auto pb-2 scrollbar-none gap-3">
              {PREMIUM_FILTERS.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-[#2563EB] text-white shadow-[0_4px_14px_rgba(37,99,235,0.39)]'
                      : 'bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#3B82F6] hover:text-[#2563EB] dark:hover:text-[#3B82F6]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white text-lg mr-1">{totalCount.toLocaleString()}</strong>
                Results Found
              </div>
              <div className="flex items-center gap-4">
                 <button className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#2563EB] transition-colors">
                   Sort by <span className="text-slate-900 dark:text-white">Relevance</span>
                   <SlidersHorizontal className="w-4 h-4 ml-1" />
                 </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && <BareActsSkeleton />}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6 shadow-sm border border-red-100 dark:border-red-900/50">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Failed to Load Library</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">{error}</p>
              <button
                onClick={() => {
                  setCurrentPage(1);
                  fetchActs(1, selectedCategory, searchTerm);
                }}
                className="px-6 py-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && displayActs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
               <div className="relative mb-8">
                 <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 blur-2xl rounded-full scale-150 opacity-50"></div>
                 <img src="/empty-search.svg" alt="No results" className="w-48 h-48 relative z-10 opacity-80" onError={(e) => { e.target.style.display='none'; }}/>
                 {/* Fallback icon if illustration is missing */}
                 <Search className="w-24 h-24 text-slate-300 dark:text-slate-700 relative z-10" />
               </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Bare Acts Found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                We couldn't find any documents matching your current search or filters. Try adjusting your query.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setCurrentPage(1);
                  fetchActs(1, 'All', '');
                }}
                className="px-6 py-3 bg-[#2563EB] text-white rounded-xl font-semibold hover:bg-[#1D4ED8] shadow-md transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && displayActs.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {displayActs.map(act => (
                    <ActCard key={act.id} act={act} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BareActs;

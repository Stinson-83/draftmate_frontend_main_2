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
  const itemsPerPage = 12;

  // Static premium categories as requested
  const PREMIUM_FILTERS = ['All', 'Central Acts', 'State Acts', 'Repealed Acts', 'Spent Acts', 'Recent Acts'];

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
        
        // Merge dynamic categories with premium filters if needed, 
        // but for UI consistency, we will primarily show the premium ones first.
        const uniqueCats = new Set(['All', ...PREMIUM_FILTERS, ...cats]);
        setCategories(Array.from(uniqueCats));
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
        setCurrentPage(1);
        return;
      }

      try {
        setSearching(true);
        const searchResults = await bareActsApi.searchActs(query);
        setDisplayActs(searchResults || []);
        setCurrentPage(1); // Reset to first page on new search
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
      return displayActs;
    }
    // Handle the specific premium filters mapping
    if (selectedCategory === 'Central Acts') {
        return displayActs.filter(act => act.state === null || act.state?.toLowerCase() === 'central');
    }
    if (selectedCategory === 'State Acts') {
        return displayActs.filter(act => act.state !== null && act.state?.toLowerCase() !== 'central');
    }
    if (selectedCategory === 'Repealed Acts' || selectedCategory === 'Spent Acts') {
        // Mock filtering for these states assuming 'status' field might contain it
        return displayActs.filter(act => act.status?.toLowerCase().includes(selectedCategory.toLowerCase().split(' ')[0]));
    }
    if (selectedCategory === 'Recent Acts') {
        // Mock recent by sorting year if available
        return [...displayActs].sort((a, b) => (b.year || 0) - (a.year || 0));
    }
    
    // Default fallback to category match
    return displayActs.filter(act => act.category === selectedCategory);
  }, [displayActs, selectedCategory]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredActs.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredActs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredActs, currentPage, itemsPerPage]);

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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 w-full py-5 px-4 bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 text-lg"
              />
              <div className="flex items-center pr-2 gap-2">
                <button className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition-colors">
                  <Filter className="w-5 h-5" />
                  <span className="text-sm">Filters</span>
                </button>
                <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-blue-500/20 transition-all hover:shadow-blue-500/40 active:scale-95 m-1 flex-shrink-0">
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
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                  }}
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
                <strong className="text-slate-900 dark:text-white text-lg mr-1">{filteredActs.length}</strong> 
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
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredActs.length === 0 && (
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
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                className="px-6 py-3 bg-[#2563EB] text-white rounded-xl font-semibold hover:bg-[#1D4ED8] shadow-md transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && filteredActs.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {currentItems.map(act => (
                    <ActCard key={act.id} act={act} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BareActs;

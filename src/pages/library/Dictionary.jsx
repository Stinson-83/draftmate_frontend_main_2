import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dictionaryService } from "../../services/library/dictionaryService";
import DictionaryCard from "../../components/library/DictionaryCard";
import { toast } from "sonner";

const Dictionary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [terms, setTerms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      try {
        const [termsData, categoriesData] = await Promise.all([
          dictionaryService.getTerms(),
          dictionaryService.getCategories()
        ]);
        setTerms(termsData);
        setCategories(categoriesData);
      } catch (error) {
        toast.error("Failed to load dictionary");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const filterTerms = async () => {
      try {
        const filtered = await dictionaryService.searchTerms(searchQuery, selectedCategory);
        setTerms(filtered);
      } catch (error) {
        toast.error("Failed to search terms");
      }
    };
    const timeoutId = setTimeout(filterTerms, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard/library" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Legal Dictionary
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Your comprehensive guide to legal terms and Latin maxims
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative z-10">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-20">search</span>
              <input 
                type="text" 
                placeholder="Search legal terms, Latin maxims, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
              />
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse">
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : terms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {terms.map(term => (
              <DictionaryCard key={term.id} term={term} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">search_off</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              No terms found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search or category
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dictionary;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, Download, Bookmark, Share2 } from 'lucide-react';

const ActCard = ({ act }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      className={`flex flex-col p-6 rounded-2xl bg-white dark:bg-[#1e293b] border ${isExpanded ? 'border-blue-200 dark:border-blue-900 shadow-[0_8px_32px_rgba(37,99,235,0.12)]' : 'border-slate-200 dark:border-slate-800 hover:shadow-[0_8px_32px_rgba(37,99,235,0.08)]'} hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative`}
    >
      {/* Top Badges */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
          {act.state || 'CENTRAL'}
        </span>
        {act.year && (
          <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {act.year}
          </span>
        )}
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors leading-tight mb-2">
            {act.title || act.name}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {act.description || act.short_title || act.shortName || 'No description available for this act.'}
          </p>
          {act.department && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 font-medium">
              {act.department}
            </p>
          )}
        </div>
        
        {/* Right Action Circle */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isExpanded ? 'bg-[#2563EB] text-white rotate-180' : 'bg-blue-50 dark:bg-blue-900/20 text-[#2563EB] hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#3B82F6] dark:hover:text-white'}`}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
      
      {/* Base Metadata (Always Visible) */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap gap-x-6 gap-y-2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">Act Number</span>
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{act.act_number || act.actNumber || 'N/A'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">Status</span>
          <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {act.status || 'Active'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">Language</span>
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{act.language || 'English'}</span>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/50">
              
              <div className="grid grid-cols-2 gap-4 mb-5">
                {act.effective_date && (
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Effective Date</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{act.effective_date}</span>
                  </div>
                )}
                {act.category && (
                   <div>
                    <span className="block text-xs text-slate-500 mb-1">Category</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{act.category}</span>
                  </div>
                )}
              </div>

              {act.description && (
                <div className="mb-5">
                  <span className="block text-xs text-slate-500 mb-1">Full Description</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              )}

              <div className="mb-5">
                 <span className="block text-xs text-slate-500 mb-2">Available Formats</span>
                 <div className="flex gap-2">
                   <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">English PDF</span>
                   {/* Mocking other formats as requested by 'Available Formats' UI prompt */}
                   <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 border-dashed cursor-not-allowed">Hindi</span>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link 
                  to={`/dashboard/library/acts/${act.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2563EB] text-white font-medium text-sm hover:bg-[#1D4ED8] transition-colors shadow-md shadow-blue-500/20"
                >
                  <BookOpen className="w-4 h-4" /> Open Act
                </Link>
                <div className="flex gap-2 justify-center">
                  <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActCard;

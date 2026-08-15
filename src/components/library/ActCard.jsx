import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ActCard = ({ act }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <div className="relative flex flex-col h-full p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">
              {act.category}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {act.name}
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              {act.shortName}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-2">
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>Sections: <strong className="text-slate-700 dark:text-slate-300">{act.totalSections}</strong></span>
            <span>Updated: <strong className="text-slate-700 dark:text-slate-300">{new Date(act.lastUpdated).toLocaleDateString()}</strong></span>
          </div>
          <Link 
            to={`/dashboard/library/acts/${act.id}`}
            className="mt-2 w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold text-sm text-center hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-xs"
          >
            Open Act
          </Link>
        </div>

        {/* Bottom Blue Accent Line on Hover */}
        <span className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-blue-600 dark:bg-blue-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
      </div>
    </motion.div>
  );
};

export default ActCard;

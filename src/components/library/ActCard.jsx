import React from 'react';
import { Link } from 'react-router-dom';

const ActCard = ({ act }) => {
  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">
            {act.category}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2">
            {act.name}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {act.shortName}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
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
          className="mt-2 w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium text-sm text-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors"
        >
          Open Act
        </Link>
      </div>
    </div>
  );
};

export default ActCard;

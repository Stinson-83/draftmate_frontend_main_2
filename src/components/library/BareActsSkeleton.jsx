import React from 'react';
import { motion } from 'framer-motion';

const BareActsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="flex flex-col p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-[0_8px_32px_rgba(37,99,235,0.02)] h-full min-h-[220px]"
        >
          {/* Top section */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 mr-4">
              {/* Badge skeleton */}
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full mb-3 animate-pulse"></div>
              {/* Title skeleton */}
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md mb-2 animate-pulse"></div>
              <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-md mb-2 animate-pulse"></div>
            </div>
            {/* Icon skeleton */}
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 animate-pulse"></div>
          </div>
          
          {/* Metadata section skeleton */}
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-3">
             <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
             <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BareActsSkeleton;

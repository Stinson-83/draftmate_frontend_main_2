import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const FormCard = ({ form }) => {
  const getCategoryColor = (category) => {
    switch(category) {
      case "Criminal Law":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Civil Law":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Corporate Law":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "Property Law":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Consumer Law":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "Administrative Law":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link to={`/dashboard/library/forms/${form.id}`} className="block group">
        <div className="relative bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/50 dark:hover:border-blue-400/50 overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {form.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                {form.description}
              </p>
              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(form.category)}`}>
                  {form.category}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Updated: {form.lastUpdated}
                </span>
              </div>
            </div>
            <div className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 group-hover:translate-x-1.5">
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </div>

          {/* Bottom Blue Accent Line on Hover */}
          <span className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-blue-600 dark:bg-blue-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
        </div>
      </Link>
    </motion.div>
  );
};

export default FormCard;

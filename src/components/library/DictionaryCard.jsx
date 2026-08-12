import React from "react";
import { Link } from "react-router-dom";

const DictionaryCard = ({ term }) => {
  const getCategoryColor = (category) => {
    switch(category) {
      case "Constitutional Law":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Criminal Law":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Civil Law":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Corporate Law":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "General Legal Terms":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "Latin Maxims":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <Link to={`/dashboard/library/dictionary/${term.id}`} className="block">
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 transition-all hover:shadow-md hover:border-primary/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {term.term}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
              {term.shortMeaning}
            </p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(term.category)}`}>
              {term.category}
            </span>
          </div>
          <div className="text-primary">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DictionaryCard;

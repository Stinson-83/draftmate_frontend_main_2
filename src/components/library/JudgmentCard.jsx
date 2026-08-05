import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { judgmentService } from '../../services/library/judgmentService';

const courtColors = {
  'Supreme Court': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  'High Court':    'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  'NCLAT':         'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  'NCDRC':         'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
};

const JudgmentCard = ({ judgment, onSaveToggle }) => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    judgmentService.isSaved(judgment.id).then(setSaved);
  }, [judgment.id]);

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (saved) {
        await judgmentService.removeJudgment(judgment.id);
        setSaved(false);
        toast.success('Removed from saved judgments');
      } else {
        await judgmentService.saveJudgment(judgment);
        setSaved(true);
        toast.success('Judgment saved');
      }
      onSaveToggle?.();
    } catch {
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      to={`/dashboard/judgments/${judgment.id}`}
      state={{ judgment }}
      className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group"
    >
      {/* Top row */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${courtColors[judgment.court] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
            {judgment.court}
          </span>
          {judgment.category && !judgment.category.toLowerCase().includes('kanoon') && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {judgment.category}
            </span>
          )}
        </div>
        <button
          onClick={handleSaveToggle}
          disabled={loading}
          title={saved ? 'Remove from saved' : 'Save judgment'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
            saved
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500 dark:bg-slate-800 dark:hover:bg-amber-900/20'
          }`}
        >
          <span className={`material-symbols-outlined text-[18px] ${saved ? 'icon-fill' : ''}`}>bookmark</span>
        </button>
      </div>

      {/* Title */}
      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
        {judgment.title}
      </h3>

      {/* Citation + Year */}
      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-3">{judgment.citation} • {judgment.year}</p>

      {/* Summary snippet */}
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 flex-1 leading-relaxed">
        {judgment.ratiodecidendi}
      </p>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="flex flex-wrap gap-1">
          {judgment.tags.filter(tag => !tag.toLowerCase().includes('kanoon')).slice(0, 2).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
              {tag}
            </span>
          ))}
          {judgment.tags.length > 2 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-medium">
              +{judgment.tags.length - 2}
            </span>
          )}
        </div>
        <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Read <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </span>
      </div>
    </Link>
  );
};

export default JudgmentCard;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { judgmentService } from '../../services/library/judgmentService';

const JudgmentCard = ({ judgment, query = '', onSaveToggle }) => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    judgmentService.isSaved(judgment.id).then((value) => {
      if (active) setSaved(value);
    });
    return () => { active = false; };
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

  const dateLabel = judgment.judgment_date || (judgment.year ? String(judgment.year) : '');

  const HighlightedText = ({ text, highlight }) => {
    if (!highlight || !text) return <>{text}</>;
    const terms = highlight.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return <>{text}</>;
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-100 text-amber-900 font-medium px-0.5 rounded">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <Link
      to={`/dashboard/judgments/${judgment.id}`}
      state={{ judgment }}
      className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          {judgment.court ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {judgment.court}
            </span>
          ) : null}
          {dateLabel ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {dateLabel}
            </span>
          ) : null}
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

      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-primary transition-colors line-clamp-3 mb-2">
        <HighlightedText text={judgment.title} highlight={query} />
      </h3>

      {judgment.citation ? (
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-3">
          <HighlightedText text={judgment.citation} highlight={query} />
        </p>
      ) : null}

      {judgment.excerpt ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-4 flex-1 leading-relaxed">
          <HighlightedText text={judgment.excerpt} highlight={query} />
        </p>
      ) : <div className="flex-1" />}

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-3">
        <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all flex-shrink-0">
          Read <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </span>
      </div>
    </Link>
  );
};

export default JudgmentCard;

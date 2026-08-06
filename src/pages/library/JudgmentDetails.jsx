import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { mockJudgments } from '../../data/mockJudgments';
import { judgmentService } from '../../services/library/judgmentService';
import { notesService } from '../../services/library/notesService';
import ExplainDrawer from '../../components/library/ExplainDrawer';
import NoteDrawer from '../../components/library/NoteDrawer';
import { getMetadata, getJudgment, downloadDocument } from '../../services/library/judgmentApi';

const DetailSection = ({ icon, title, children, accent = 'blue' }) => {
  const accentMap = {
    blue:    'border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10',
    amber:   'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10',
    red:     'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10',
    purple:  'border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-900/10',
    emerald: 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10',
    slate:   'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30',
  };
  return (
    <div className={`rounded-2xl border p-6 ${accentMap[accent]}`}>
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white mb-3">
        <span className="text-xl">{icon}</span>
        {title}
      </h3>
      <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{children}</div>
    </div>
  );
};

const JudgmentDetails = () => {
  const { judgmentId } = useParams();
  const location = useLocation();
  const [judgment, setJudgment] = useState(null);
  const [fullText, setFullText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Load judgment from API or fall back to mock
  useEffect(() => {
    const loadJudgment = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        // First check for judgment in router state
        const stateJudgment = location.state?.judgment;
        if (stateJudgment && stateJudgment.id === judgmentId) {
          setJudgment(stateJudgment);
          const textData = await getJudgment(judgmentId);
          if (textData?.data?.text) {
            setFullText(textData.data.text);
          }
        } else {
          // Then check if it's a mock judgment
          const mock = mockJudgments.find(j => j.id === judgmentId);
          if (mock) {
            setJudgment(mock);
          } else {
            // Try API
            const metadata = await getMetadata(judgmentId);
            if (metadata) {
              setJudgment(metadata);
              const textData = await getJudgment(judgmentId);
              if (textData?.data?.text) {
                setFullText(textData.data.text);
              }
            } else {
              setApiError('Judgment not found');
            }
          }
        }
      } catch (e) {
        console.error(e);
        // Fallback to mock if exists
        const mock = mockJudgments.find(j => j.id === judgmentId);
        if (mock) {
          setJudgment(mock);
        } else {
          setApiError('Failed to load judgment');
        }
      } finally {
        setIsLoading(false);
      }
    };
    if (judgmentId) loadJudgment();
  }, [judgmentId, location.state]);

  useEffect(() => {
    if (judgment) judgmentService.isSaved(judgment.id).then(setIsSaved);
  }, [judgment?.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151f2e]">
          <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse"></div>
            <div className="flex-1">
              <div className="w-32 h-4 bg-slate-100 rounded-full mb-2 animate-pulse"></div>
              <div className="w-full h-8 bg-slate-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 md:p-8 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="p-8 text-center h-full flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{apiError}</h2>
        <Link to="/dashboard/judgments" className="mt-4 text-primary hover:underline">Return to Judgments</Link>
      </div>
    );
  }

  if (!judgment) {
    return (
      <div className="p-8 text-center h-full flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Judgment Not Found</h2>
        <Link to="/dashboard/judgments" className="mt-4 text-primary hover:underline">Return to Judgments</Link>
      </div>
    );
  }

  const handleSaveToggle = async () => {
    if (isSaved) {
      await judgmentService.removeJudgment(judgment.id);
      setIsSaved(false);
      toast.success('Removed from saved judgments');
    } else {
      await judgmentService.saveJudgment(judgment);
      setIsSaved(true);
      toast.success('Judgment saved');
    }
  };

  const handleCopy = () => {
    const text = [
      judgment.title,
      judgment.citation,
      '',
      `RATIO DECIDENDI\n${judgment.ratiodecidendi}`,
      '',
      `SUMMARY\n${judgment.summary}`,
      '',
      `KEY PRINCIPLES\n${judgment.keyPrinciples.map((p,i) => `${i+1}. ${p}`).join('\n')}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Judgment copied to clipboard');
  };

  const handleSaveToNotes = async () => {
    setIsSavingNote(true);
    try {
      await notesService.createNote({
        title: judgment.title,
        content: [
          `Citation: ${judgment.citation}`,
          `Court: ${judgment.court} (${judgment.year})`,
          `Bench: ${judgment.bench}`,
          '',
          `LEGAL ISSUE\n${judgment.legalIssue}`,
          '',
          `RATIO DECIDENDI\n${judgment.ratiodecidendi}`,
          '',
          `SUMMARY\n${judgment.summary}`,
          '',
          `KEY PRINCIPLES\n${(judgment.keyPrinciples || []).map((p,i) => `${i+1}. ${p}`).join('\n')}`,
        ].join('\n'),
        tags: [judgment.category, judgment.court, ...(judgment.tags || []).slice(0, 3)],
        linkedActId: null,
        linkedActName: null,
      });
      toast.success('Saved to My Notes');
    } catch {
      toast.error('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: judgment.title,
      text: `${judgment.citation} - ${judgment.court}, ${judgment.year}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 py-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151f2e] flex-shrink-0 z-10">
        <div className="flex items-start gap-4 max-w-5xl mx-auto">
          <Link to="/dashboard/judgments" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors flex-shrink-0 mt-1">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {judgment.court && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">{judgment.court}</span>
              )}
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Indian Kanoon</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{judgment.citation}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{judgment.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{judgment.bench || (judgment.judges?.length > 0 ? `Bench: ${judgment.judges.join(', ')}` : 'Court Judgment')} • {judgment.year || judgment.date}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleSaveToggle} title={isSaved ? 'Remove' : 'Save'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${isSaved ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/40' : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <span className={`material-symbols-outlined text-[18px] ${isSaved ? 'icon-fill' : ''}`}>bookmark</span>
              <span className="hidden md:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button onClick={handleCopy} title="Copy" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              <span className="hidden md:inline">Copy</span>
            </button>
            <button onClick={() => downloadDocument(judgment.id, judgment, fullText)} title="Download" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="hidden md:inline">Download</span>
            </button>
            <button onClick={handleShare} title="Share" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span className="hidden md:inline">Share</span>
            </button>
            <button onClick={() => setIsExplainOpen(true)} title="AI Summary" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              <span className="hidden md:inline">AI Summary</span>
            </button>
            <button onClick={handleSaveToNotes} disabled={isSavingNote} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span className="hidden md:inline">{isSavingNote ? 'Saving...' : 'Save to Notes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Parties & Judges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {judgment.parties && (judgment.parties.petitioner || judgment.parties.respondent) && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider mb-2">Parties</p>
                <p className="text-sm text-slate-800"><span className="font-semibold">Petitioner:</span> {judgment.parties?.petitioner || 'N/A'}</p>
                <p className="text-sm text-slate-800 mt-1"><span className="font-semibold">Respondent:</span> {judgment.parties?.respondent || 'N/A'}</p>
              </div>
            )}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider mb-2">Judges</p>
              {judgment.judges?.length > 0 ? (
                <ul className="space-y-0.5">
                  {judgment.judges.map((j, i) => (
                    <li key={i} className="text-sm text-slate-800">{j}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No judges listed</p>
              )}
            </div>
          </div>

          {/* Summary */}
          {judgment.summary && (
            <DetailSection icon="📖" title="Summary" accent="amber">
              {judgment.summary}
            </DetailSection>
          )}

          {/* Ratio Decidendi */}
          {judgment.ratiodecidendi && (
            <DetailSection icon="🏛" title="Ratio Decidendi (Binding Principle)" accent="purple">
              <p className="font-medium italic">{judgment.ratiodecidendi}</p>
            </DetailSection>
          )}

          {/* Full Text if available */}
          {fullText && (
            <DetailSection icon="📄" title="Full Judgment Text" accent="slate">
              <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {fullText}
              </div>
            </DetailSection>
          )}

          {/* Key Principles (only if available) */}
          {judgment.keyPrinciples && judgment.keyPrinciples.length > 0 && (
            <DetailSection icon="📋" title="Key Principles" accent="emerald">
              <ul className="space-y-2">
                {judgment.keyPrinciples.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-slate-700">{p}</span>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {/* Tags */}
          {judgment.tags && judgment.tags.filter(t => !t.toLowerCase().includes('kanoon')).length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {judgment.tags.filter(tag => !tag.toLowerCase().includes('kanoon')).map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium">{tag}</span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      <ExplainDrawer isOpen={isExplainOpen} onClose={() => setIsExplainOpen(false)} content={judgment} type="judgment" fullText={fullText} />
      <NoteDrawer isOpen={isNoteOpen} onClose={() => setIsNoteOpen(false)} />
    </div>
  );
};

export default JudgmentDetails;

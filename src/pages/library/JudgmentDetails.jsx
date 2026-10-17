import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getLegalJudgment } from '../../services/library/judgmentApi';
import { judgmentService } from '../../services/library/judgmentService';
import { notesService } from '../../services/library/notesService';
import { API_CONFIG } from '../../services/endpoints';

const JudgmentDetails = () => {
  const { judgmentId } = useParams();
  const [judgment, setJudgment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [apiError, setApiError] = useState(null);
  const backSearch = sessionStorage.getItem('draftmate_judgment_library_search') || '';

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setApiError(null);
    getLegalJudgment(judgmentId, { signal: controller.signal })
      .then((data) => setJudgment(data))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setJudgment(null);
        setApiError(error.message || 'Failed to load judgment');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [judgmentId]);

  useEffect(() => {
    if (judgment) judgmentService.isSaved(judgment.id).then(setIsSaved);
  }, [judgment]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 max-w-5xl mx-auto">
        <div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (apiError || !judgment) {
    return (
      <div className="p-8 text-center h-full flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{apiError || 'Judgment not found'}</h2>
        <Link to={`/dashboard/judgments${backSearch}`} className="mt-4 text-primary hover:underline">Back to Search</Link>
      </div>
    );
  }

  const dateLabel = judgment.judgment_date || (judgment.year ? String(judgment.year) : '');
  const hasContent = Boolean(judgment.text && judgment.text.trim().length > 0);

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
    const text = [judgment.title, judgment.citation, judgment.court, dateLabel, '', judgment.text].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Judgment copied');
  };

  const handleSaveToNotes = async () => {
    setIsSavingNote(true);
    try {
      await notesService.createNote({
        title: judgment.title,
        content: [
          judgment.citation ? `Citation: ${judgment.citation}` : '',
          judgment.court ? `Court: ${judgment.court}` : '',
          dateLabel ? `Date: ${dateLabel}` : '',
          judgment.case_id ? `Case ID: ${judgment.case_id}` : '',
          '',
          judgment.text || '',
        ].filter((line) => line !== undefined).join('\n'),
        tags: [judgment.court, judgment.source].filter(Boolean),
      });
      toast.success('Saved to My Notes');
    } catch {
      toast.error('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info('Generating PDF...', { id: 'pdf-toast' });
      const url = `${API_CONFIG.LIBRARY.BASE_URL}/api/v1/legal/judgments/${encodeURIComponent(judgment.id)}/pdf`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('PDF generation failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Judgment_${judgment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 100);
      toast.success('Downloaded PDF', { id: 'pdf-toast' });
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151f2e] flex-shrink-0">
        <div className="flex items-start gap-4 max-w-5xl mx-auto">
          <Link to={`/dashboard/judgments${backSearch}`} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex-shrink-0 mt-1">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {judgment.court ? <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{judgment.court}</span> : null}
              {judgment.citation ? <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{judgment.citation}</span> : null}
              {dateLabel ? <span className="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{dateLabel}</span> : null}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{judgment.title}</h1>
            <p className="text-sm text-slate-500 mt-1">Case ID: {judgment.case_id}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <button onClick={handleSaveToggle} className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{isSaved ? 'Saved' : 'Save'}</button>
            <button onClick={handleCopy} className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Copy</button>
            <button onClick={handleDownloadPDF} className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> PDF
            </button>
            <button onClick={handleSaveToNotes} disabled={isSavingNote} className="px-3 py-2 rounded-xl text-sm bg-emerald-600 text-white disabled:opacity-60 hover:bg-emerald-700 transition-colors">{isSavingNote ? 'Saving...' : 'Save to Notes'}</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-10 bg-white dark:bg-[#0f172a] shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">Judgment Text</h2>
            {hasContent ? (
              <div
                className="judgment-content text-[17px] leading-[1.85] text-slate-800 dark:text-slate-300
                  [&>p]:mb-6 [&>p]:text-justify
                  [&>blockquote]:my-6 [&>blockquote]:border-l-4 [&>blockquote]:border-primary/60 [&>blockquote]:pl-5 [&>blockquote]:py-2 [&>blockquote]:italic [&>blockquote]:bg-slate-50 dark:[&>blockquote]:bg-slate-800/30
                  [&>pre]:my-6 [&>pre]:whitespace-pre-wrap [&>pre]:font-mono [&>pre]:text-sm [&>pre]:bg-slate-100 dark:[&>pre]:bg-slate-800/50 [&>pre]:p-4 [&>pre]:rounded-lg
                  [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mt-8 [&>h1]:mb-4 [&>h1]:text-slate-900 dark:[&>h1]:text-white
                  [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:text-slate-900 dark:[&>h2]:text-white
                  [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-slate-900 dark:[&>h3]:text-white
                  [&>a]:text-primary [&>a]:underline [&>a]:underline-offset-4
                  [&>ul]:list-disc [&>ul]:pl-8 [&>ul]:mb-6
                  [&>ol]:list-decimal [&>ol]:pl-8 [&>ol]:mb-6"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                dangerouslySetInnerHTML={{ __html: judgment.text }}
              />
            ) : (
              <p className="text-sm text-slate-500">No judgment text is stored for this record.</p>
            )}
          </div>

          {Array.isArray(judgment.excerpts) && judgment.excerpts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Recorded passages ({judgment.excerpts.length})</h2>
              <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {judgment.excerpts.map((excerpt) => (
                  <li key={excerpt.chunk_index} className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-slate-400">{excerpt.chunk_index}</span>
                    <p className="line-clamp-2">{excerpt.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JudgmentDetails;

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { aiExplainService } from '../../services/library/aiExplainService';
import { notesService } from '../../services/library/notesService';
import { getJudgment } from '../../services/library/judgmentApi';

// ─── Skeleton Loader ────────────────────────────────────────────────────────
const SkeletonBlock = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 animate-pulse ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-4 rounded-md bg-slate-200 dark:bg-slate-700"
        style={{ width: i === lines - 1 ? '65%' : '100%' }}
      />
    ))}
  </div>
);

const SkeletonDrawer = () => (
  <div className="p-6 space-y-6 animate-pulse">
    {/* Header mock */}
    <div className="space-y-2">
      <div className="h-5 w-3/4 rounded-md bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-1/2 rounded-md bg-slate-200 dark:bg-slate-700" />
    </div>
    {/* Sections mock */}
    {[...Array(5)].map((_, i) => (
      <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
        <SkeletonBlock lines={3} />
      </div>
    ))}
  </div>
);

// ─── Collapsible Section ────────────────────────────────────────────────────
const ExplainSection = ({ icon, title, children, defaultOpen = false, accentColor = 'blue' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/40',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-900/40',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
    slate: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${colorMap[accentColor]}`}>
      <button
        onClick={() => setIsOpen(p => !p)}
        className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm gap-3"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          {title}
        </span>
        <span className={`material-symbols-outlined text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 border-t border-current/10">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
};

// ─── Main ExplainDrawer Component ──────────────────────────────────────────
const ExplainDrawer = ({ isOpen, onClose, act, chapter, section, content, type, fullText }) => {
  const [explanation, setExplanation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [judgmentFullText, setJudgmentFullText] = useState(fullText || '');

  useEffect(() => {
    if (isOpen) {
      if (type === 'judgment' && content) {
        fetchJudgmentSummary();
      } else if (act && section) {
        fetchExplanation();
      }
    }
    // Reset on close
    if (!isOpen) {
      setExplanation(null);
    }
  }, [isOpen, act?.id, section?.number, type, content?.id]);

  const fetchExplanation = async () => {
    setIsLoading(true);
    setExplanation(null);
    try {
      const result = await aiExplainService.explainSection(act, section);
      setExplanation(result);
    } catch (err) {
      toast.error('AI Explain failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJudgmentSummary = async () => {
    setIsLoading(true);
    setExplanation(null);
    try {
      // Fetch full text if we don't have it already
      let text = judgmentFullText;
      if (!text.trim()) {
        const judgmentData = await getJudgment(content.id);
        if (judgmentData?.data?.text) {
          text = judgmentData.data.text;
          setJudgmentFullText(text);
        }
      }
      const result = await aiExplainService.summarizeJudgment(content, text);
      setExplanation(result);
    } catch (err) {
      console.error('Failed to get judgment summary:', err);
      toast.error('Failed to generate AI Summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setExplanation(null);
    try {
      if (type === 'judgment') {
        // Fetch full text if needed for regeneration
        let text = judgmentFullText;
        if (!text.trim()) {
          const judgmentData = await getJudgment(content.id);
          if (judgmentData?.data?.text) {
            text = judgmentData.data.text;
            setJudgmentFullText(text);
          }
        }
        const result = await aiExplainService.regenerateJudgmentSummary(content, text);
        setExplanation(result);
        toast.success('Summary regenerated');
      } else {
        const result = await aiExplainService.regenerateExplanation(act, section);
        setExplanation(result);
        toast.success('Explanation regenerated');
      }
    } catch (err) {
      toast.error('Failed to regenerate. Try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyExplanation = () => {
    if (!explanation) return;
    let text = '';
    if (type === 'judgment') {
      text = [
        `AI Summary — ${content.title}`,
        `Citation: ${content.citation}`,
        `Court: ${content.court} (${content.year})`,
        '',
        `📖 Case Facts\n${explanation.caseFacts}`,
        '',
        `⚖️ Legal Issues\n${explanation.legalIssues}`,
        '',
        `🏛 Court Reasoning\n${explanation.courtReasoning}`,
        '',
        `✅ Final Decision\n${explanation.finalDecision}`,
        '',
        `📚 Legal Principles\n${explanation.legalPrinciples}`,
        '',
        `💡 Practical Impact\n${explanation.practicalImpact}`,
        '',
        `📌 Key Takeaways\n${explanation.keyTakeaways?.map((k, i) => `${i + 1}. ${k}`).join('\n') || 'No key takeaways available'}`,
        '',
        `Generated by: ${explanation.model}`,
      ].join('\n');
    } else {
      text = [
        `AI Explanation — Section ${section.number}: ${section.title}`,
        `Act: ${act.name} (${act.shortName})`,
        '',
        `📖 Simple Meaning\n${explanation.simpleMeaning}`,
        '',
        `⚖️ Legal Applicability\n${explanation.legalApplicability}`,
        '',
        `🚨 Punishment / Consequences\n${explanation.punishment}`,
        '',
        `🏛 Judicial Interpretation\n${explanation.judicialInterpretation}`,
        '',
        `💡 Practical Example\n${explanation.practicalExample}`,
        '',
        `📋 Key Takeaways\n${explanation.keyTakeaways.map((k, i) => `${i + 1}. ${k}`).join('\n')}`,
        '',
        `Generated by: ${explanation.model}`,
      ].join('\n');
    }

    navigator.clipboard.writeText(text);
    toast.success('Summary copied to clipboard');
  };

  const handleSaveToNotes = async () => {
    if (!explanation) return;
    setIsSavingNote(true);
    try {
      if (type === 'judgment') {
        await notesService.createNote({
          title: `AI Summary: ${content.title}`,
          content: [
            `📖 CASE FACTS\n${explanation.caseFacts}`,
            `⚖️ LEGAL ISSUES\n${explanation.legalIssues}`,
            `🏛 COURT REASONING\n${explanation.courtReasoning}`,
            `✅ FINAL DECISION\n${explanation.finalDecision}`,
            `📚 LEGAL PRINCIPLES\n${explanation.legalPrinciples}`,
            `💡 PRACTICAL IMPACT\n${explanation.practicalImpact}`,
            `📌 KEY TAKEAWAYS\n${explanation.keyTakeaways?.map((k, i) => `${i + 1}. ${k}`).join('\n') || 'No key takeaways available'}`,
          ].join('\n\n'),
          tags: ['AI Summary', 'Judgment', content.category, content.court],
          linkedActId: null,
          linkedActName: null,
        });
      } else {
        await notesService.createNote({
          title: `AI Explain: Section ${section.number} — ${section.title}`,
          content: [
            `📖 SIMPLE MEANING\n${explanation.simpleMeaning}`,
            `⚖️ LEGAL APPLICABILITY\n${explanation.legalApplicability}`,
            `🚨 PUNISHMENT\n${explanation.punishment}`,
            `🏛 JUDICIAL INTERPRETATION\n${explanation.judicialInterpretation}`,
            `💡 PRACTICAL EXAMPLE\n${explanation.practicalExample}`,
            `📋 KEY TAKEAWAYS\n${(explanation.keyTakeaways || []).map((k, i) => `${i + 1}. ${k}`).join('\n')}`,
          ].join('\n\n'),
          tags: ['AI Explain', act.shortName, `Section ${section.number}`],
          linkedActId: act.id,
          linkedActName: act.name,
          linkedChapterId: chapter?.id,
          linkedSectionNumber: section.number,
          linkedSectionTitle: section.title,
        });
      }
      toast.success('Saved to My Notes');
    } catch (err) {
      toast.error('Failed to save to notes');
    } finally {
      setIsSavingNote(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{type === 'judgment' ? 'AI Summary' : 'AI Explain'}</h2>
            </div>
            {type === 'judgment' && content && (
              <div className="ml-10">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                  {content.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{content.citation} • {content.court}</p>
              </div>
            )}
            {type !== 'judgment' && section && (
              <div className="ml-10">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                  Section {section.number} — {section.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{act?.name} ({act?.shortName})</p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 ml-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── AI Model Badge ── */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isLoading || isRegenerating ? 'Generating summary...' : explanation ? `Generated by ${explanation.model}` : 'DraftMate AI Ready'}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading || isRegenerating ? (
            <SkeletonDrawer />
          ) : explanation ? (
            <div className="p-5 space-y-3">
              {type === 'judgment' ? (
                <>
                  <ExplainSection icon="📖" title="Case Facts" defaultOpen accentColor="blue">
                    <p>{explanation.caseFacts}</p>
                  </ExplainSection>

                  <ExplainSection icon="⚖️" title="Legal Issues" accentColor="amber">
                    <p>{explanation.legalIssues}</p>
                  </ExplainSection>

                  <ExplainSection icon="🏛" title="Court Reasoning" accentColor="purple">
                    <p>{explanation.courtReasoning}</p>
                  </ExplainSection>

                  <ExplainSection icon="✅" title="Final Decision" accentColor="emerald">
                    <p>{explanation.finalDecision}</p>
                  </ExplainSection>

                  {explanation.legalPrinciples && (
                    <ExplainSection icon="📚" title="Legal Principles" accentColor="indigo">
                      <p>{explanation.legalPrinciples}</p>
                    </ExplainSection>
                  )}

                  <ExplainSection icon="💡" title="Practical Impact" accentColor="slate">
                    <p>{explanation.practicalImpact}</p>
                  </ExplainSection>

                  {explanation.keyTakeaways?.length > 0 && (
                    <ExplainSection icon="📌" title="Key Takeaways" accentColor="teal">
                      <ul className="space-y-2">
                        {explanation.keyTakeaways.map((takeaway, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1 w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </ExplainSection>
                  )}
                </>
              ) : (
                <>
                  <ExplainSection icon="📖" title="Simple Meaning" defaultOpen accentColor="blue">
                    <p>{explanation.simpleMeaning}</p>
                  </ExplainSection>

                  <ExplainSection icon="⚖️" title="Legal Applicability" accentColor="amber">
                    <p>{explanation.legalApplicability}</p>
                  </ExplainSection>

                  <ExplainSection icon="🚨" title="Punishment / Legal Consequences" accentColor="red">
                    <p>{explanation.punishment}</p>
                  </ExplainSection>

                  <ExplainSection icon="🏛" title="Important Judicial Interpretation" accentColor="purple">
                    <p>{explanation.judicialInterpretation}</p>
                  </ExplainSection>

                  <ExplainSection icon="💡" title="Practical Example" accentColor="emerald">
                    <p>{explanation.practicalExample}</p>
                  </ExplainSection>

                  <ExplainSection icon="📋" title="Key Takeaways" accentColor="slate">
                    <ul className="space-y-2">
                      {explanation.keyTakeaways.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </ExplainSection>
                </>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-slate-400 dark:text-slate-600 text-center pt-2">
                ⚠️ AI summaries are for reference only. Consult a qualified lawyer for legal advice.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-white text-3xl">auto_awesome</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">No summary loaded</h3>
              <p className="text-sm text-slate-500 mt-1">Something went wrong. Try closing and reopening.</p>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        {!isLoading && !isRegenerating && explanation && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-wrap gap-2 justify-between">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Regenerate
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleCopyExplanation}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
                title="Copy summary"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                Copy
              </button>
              <button
                onClick={handleSaveToNotes}
                disabled={isSavingNote}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isSavingNote ? 'Saving...' : 'Save to Notes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ExplainDrawer;

import React, { useEffect, useRef, useState } from 'react';
import { Check, FileText, Lock, Loader2, PenTool, Square, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_CONFIG } from '../services/endpoints';
import PromptQualityBar from './PromptQualityBar';
import './DraftingModal.css';

const INITIAL_SUMMARY = {
    basis: {
        documentType: '',
        jurisdiction: '',
        representationPosition: '',
        keyLegalPositions: [],
    },
    assumptions: [],
};

const DraftingModal = ({ onClose, initialPrompt, initialEntryMode = 'legacy', onDraftCreated }) => {
    const navigate = useNavigate();
    const isDashboardEntryMode = initialEntryMode === 'dashboard';
    const [intakeStep, setIntakeStep] = useState(isDashboardEntryMode ? 'selection' : 'prompt_input');
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [draftSummary, setDraftSummary] = useState(INITIAL_SUMMARY);
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading...');
    const [allQuestions, setAllQuestions] = useState({});
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (initialEntryMode === 'dashboard') {
            setIntakeStep('selection');
        }
    }, [initialEntryMode]);

    useEffect(() => {
        setPrompt(initialPrompt || '');
    }, [initialPrompt]);

    const sessionToken = localStorage.getItem('session_id') || '';
    const DRAFTER_API_URL = API_CONFIG.DRAFTER.BASE_URL;

    const persistWorkspaceDraft = (record) => {
        const nextRecord = {
            ...record,
            id: record.id || record.documentKey || Date.now().toString(),
            name: record.name || record.filename || record.title || 'Untitled Draft',
            filename: record.filename || record.title || record.name || 'Untitled Draft.docx',
            documentKey: record.documentKey || record.id || '',
            lastModified: record.lastModified || new Date().toISOString(),
            status: record.status || 'In progress',
            trackingParams: record.trackingParams || {
                source: record.source || 'drafting_modal',
                documentKey: record.documentKey || record.id || '',
                filename: record.filename || record.title || record.name || 'Untitled Draft.docx',
                updatedAt: record.lastModified || new Date().toISOString(),
            },
        };

        if (typeof onDraftCreated === 'function') {
            onDraftCreated(nextRecord);
            return;
        }

        try {
            const savedDrafts = JSON.parse(localStorage.getItem('my_drafts') || '[]');
            const updatedDrafts = [
                ...savedDrafts.filter((draft) => String(draft.id) !== String(nextRecord.id)),
                nextRecord,
            ];
            localStorage.setItem('my_drafts', JSON.stringify(updatedDrafts));
            window.dispatchEvent(new Event('my_drafts_updated'));
        } catch (error) {
            console.error('Failed to persist draft metadata:', error);
        }
    };

    const slugifyFileName = (value) => {
        const raw = String(value || 'AI_Draft')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
        return `${raw || 'ai_draft'}.docx`;
    };

    const toStringList = (value) => {
        if (Array.isArray(value)) {
            return value
                .flatMap((item) => (typeof item === 'string' ? [item] : Object.values(item || {})))
                .map((item) => String(item || '').trim())
                .filter(Boolean);
        }

        if (typeof value === 'string') {
            return value
                .split(/\n|•|;/)
                .map((item) => item.replace(/^[\s-]+/, '').trim())
                .filter(Boolean);
        }

        return [];
    };

    const normalizeOption = (option, index) => {
        if (typeof option === 'string') {
            return { value: option, label: option, id: `${option}-${index}` };
        }

        if (option && typeof option === 'object') {
            const value = option.value ?? option.id ?? option.key ?? option.label ?? option.text ?? `option-${index}`;
            const label = option.label ?? option.text ?? option.value ?? option.id ?? `Option ${index + 1}`;
            return { ...option, value, label, id: option.id ?? String(value ?? `option-${index}`) };
        }

        return { value: `option-${index}`, label: `Option ${index + 1}`, id: `option-${index}` };
    };

    const normalizeQuestion = (question, index) => {
        const raw = question && typeof question === 'object' ? question : { question };
        const id = raw.id ?? raw.key ?? raw.question_id ?? raw.slug ?? `question_${index}`;
        const promptText = raw.prompt ?? raw.question ?? raw.text ?? raw.label ?? `Question ${index + 1}`;
        const options = Array.isArray(raw.options)
            ? raw.options.map(normalizeOption)
            : Array.isArray(raw.choices)
                ? raw.choices.map(normalizeOption)
                : [];

        return {
            ...raw,
            id,
            prompt: promptText,
            options,
            multiple: Boolean(raw.multiple || raw.allow_multiple || raw.type === 'checkbox'),
            required: raw.required !== false,
            helperText: raw.helper_text ?? raw.helpText ?? raw.description ?? '',
        };
    };

    const normalizeSummary = (payload = {}) => {
        const source = payload.draft_summary || payload.summary || payload.result?.draft_summary || {};
        const basis = source.basis || payload.basis || {};

        return {
            basis: {
                documentType: basis.documentType || basis.document_type || payload.document_type || payload.documentType || 'Legal Document',
                jurisdiction: basis.jurisdiction || payload.jurisdiction || 'Not specified',
                representationPosition: basis.representationPosition || basis.representation_position || basis.position || 'Not specified',
                keyLegalPositions: toStringList(basis.keyLegalPositions || basis.key_legal_positions || basis.legal_positions || payload.key_legal_positions),
            },
            assumptions: toStringList(source.assumptions || payload.assumptions || payload.market_standard_provisions),
        };
    };

    const extractIntakePayload = (payload = {}) => {
        const summary = normalizeSummary(payload);
        const questionsPayload =
            payload.questions ||
            payload.round_questions ||
            payload.clarifying_questions ||
            payload.next_round_questions ||
            payload.result?.questions ||
            [];
        const normalizedQuestions = Array.isArray(questionsPayload) ? questionsPayload : [];

        return {
            sufficiencyMet: Boolean(payload.sufficiency_met ?? payload.sufficiencyMet ?? false),
            questions: normalizedQuestions.slice(0, 5).map(normalizeQuestion),
            summary,
            raw: payload,
        };
    };

    const buildAnswerContext = (currentAnswers = answers) => {
        const answerLines = Object.entries(currentAnswers).map(([key, value]) => {
            const questionText = allQuestions[key] || key;
            const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
            return `Question: ${questionText}\n  Answer: ${displayValue}`;
        });

        return [
            `Matter: ${prompt.trim()}`,
            answerLines.length > 0 ? `Clarifications:\n${answerLines.map((line) => `- ${line}`).join('\n\n')}` : 'Clarifications: none',
        ].join('\n\n');
    };

    const upsertLoading = (message) => {
        setLoadingMessage(message);
        setIsLoading(true);
        setIntakeStep('loading');
    };

    const safeCloseLoading = (fallbackStep) => {
        setIsLoading(false);
        setLoadingMessage('Loading...');
        if (fallbackStep) setIntakeStep(fallbackStep);
    };

    const navigateToWorkspace = (data, recordMeta = {}) => {
        const fileName = data?.filename || data?.document?.title || recordMeta.filename || slugifyFileName(prompt || 'AI Draft');
        const documentKey = data?.documentKey || data?.document?.key || recordMeta.documentKey || '';
        const onlyofficeConfig = data?.onlyofficeConfig || data;

        persistWorkspaceDraft({
            id: documentKey,
            name: fileName,
            filename: fileName,
            documentKey,
            onlyofficeConfig,
            variablesDetected: data?.variablesDetected || [],
            status: 'In progress',
            source: recordMeta.source || 'drafting_modal',
            trackingParams: {
                source: recordMeta.source || 'drafting_modal',
                documentKey,
                filename: fileName,
                createdAt: new Date().toISOString(),
                ...(recordMeta.trackingParams || {}),
            },
        });

        navigate('/dashboard/workspace', {
            state: {
                documentKey,
                filename: fileName,
                onlyofficeConfig,
                variablesDetected: data?.variablesDetected || [],
                trackingParams: {
                    source: recordMeta.source || 'drafting_modal',
                    documentKey,
                    filename: fileName,
                    ...(recordMeta.trackingParams || {}),
                },
            },
        });
    };

    const createWorkspaceEmptyDocument = async () => {
        if (!sessionToken) {
            toast.error('Please sign in again before creating a document.');
            return;
        }

        upsertLoading('Creating empty document...');

        try {
            const response = await fetch(`${DRAFTER_API_URL}/v2/draft/create`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${sessionToken}`,
                },
            });

            if (!response.ok) {
                let detail = 'Failed to create empty document.';
                try {
                    const errorData = await response.json();
                    detail = errorData?.detail || detail;
                } catch {
                    detail = response.statusText || detail;
                }
                throw new Error(detail);
            }

            const data = await response.json();
            navigateToWorkspace(data, { source: 'empty_document' });
            toast.success('Empty document created successfully!');
        } catch (error) {
            console.error('Failed to create empty document:', error);
            toast.error(error.message || 'Failed to initialize empty document.');
        } finally {
            safeCloseLoading(isDashboardEntryMode ? 'selection' : 'prompt_input');
        }
    };

    const fallbackDirectCompile = async ({ caseContext, reason = 'Draft generation' }) => {
        if (!sessionToken) {
            toast.error('Please sign in again before generating a draft.');
            return;
        }

        upsertLoading('Generating draft...');

        try {
            const response = await fetch(`${DRAFTER_API_URL}/v2/draft/compile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({
                    case_context: caseContext || prompt,
                    document_type: draftSummary?.basis?.documentType || 'Legal Document',
                    file_target_name: slugifyFileName(prompt || draftSummary?.basis?.documentType || 'AI Draft'),
                }),
            });

            if (!response.ok) {
                let detail = 'Failed to generate draft.';
                try {
                    const errorData = await response.json();
                    detail = errorData?.detail || detail;
                } catch {
                    detail = response.statusText || detail;
                }
                throw new Error(detail);
            }

            const data = await response.json();
            navigateToWorkspace(data, { source: 'fallback_compile' });
            toast.success(reason || 'Draft generated successfully!');
        } catch (error) {
            console.error('Fallback compile failed:', error);
            toast.error(error.message || 'Failed to generate draft.');
        } finally {
            safeCloseLoading('prompt_input');
        }
    };

    const analyzeIntake = async ({ currentAnswers = answers, roundHint = null, allowFallback = true } = {}) => {
        if (!sessionToken) {
            toast.error('Please sign in again before continuing intake.');
            return null;
        }

        upsertLoading('Analyzing your draft intake...');

        try {
            const answerCtx = buildAnswerContext(currentAnswers);
            const formattedAnswers = {};
            Object.entries(currentAnswers).forEach(([key, val]) => {
                const questionText = allQuestions[key] || key;
                formattedAnswers[questionText] = val;
            });

            const response = await fetch(`${DRAFTER_API_URL}/v2/draft/intake/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({
                    case_context: answerCtx,
                    prompt: answerCtx,
                    prompt_input: answerCtx,
                    initial_prompt: answerCtx,
                    answers: formattedAnswers,
                    questions,
                    round_hint: roundHint,
                    current_round_index: currentRoundIndex,
                }),
            });

            if (!response.ok) {
                let detail = 'Intake analysis failed.';
                try {
                    const errorData = await response.json();
                    detail = errorData?.detail || detail;
                } catch {
                    detail = response.statusText || detail;
                }
                throw new Error(detail);
            }

            const payload = await response.json();
            const parsed = extractIntakePayload(payload);

            if (!parsed.sufficiencyMet) {
                if (parsed.questions.length > 0) {
                    setQuestions(parsed.questions);
                    setAllQuestions((prev) => {
                        const next = { ...prev };
                        parsed.questions.forEach((q) => {
                            next[q.id] = q.prompt || q.question || '';
                        });
                        return next;
                    });
                    if (parsed.raw && parsed.raw.next_round_index !== undefined) {
                        setCurrentRoundIndex(parsed.raw.next_round_index);
                    } else {
                        setCurrentRoundIndex((prev) => prev + 1);
                    }
                    setDraftSummary((prev) => ({
                        basis: { ...prev.basis, ...parsed.summary.basis },
                        assumptions: parsed.summary.assumptions.length > 0 ? parsed.summary.assumptions : prev.assumptions,
                    }));
                    setIntakeStep('clarifying');
                    setIsLoading(false);
                    setLoadingMessage('Loading...');
                    return parsed;
                }

                if (allowFallback) {
                    await fallbackDirectCompile({
                        caseContext: buildAnswerContext(currentAnswers),
                        reason: 'Intake service unavailable, using direct draft generation.',
                    });
                    return parsed;
                }
            }

            setDraftSummary((prev) => ({
                basis: {
                    documentType: parsed.summary.basis.documentType || prev.basis.documentType,
                    jurisdiction: parsed.summary.basis.jurisdiction || prev.basis.jurisdiction,
                    representationPosition: parsed.summary.basis.representationPosition || prev.basis.representationPosition,
                    keyLegalPositions: parsed.summary.basis.keyLegalPositions.length > 0
                        ? parsed.summary.basis.keyLegalPositions
                        : prev.basis.keyLegalPositions,
                },
                assumptions: parsed.summary.assumptions.length > 0 ? parsed.summary.assumptions : prev.assumptions,
            }));
            setQuestions([]);
            setIntakeStep('summary');
            return parsed;
        } catch (error) {
            console.error('Intake analysis error:', error);
            toast.error(error.message || 'Intake analysis failed. Falling back to direct generation.');
            if (allowFallback) {
                await fallbackDirectCompile({
                    caseContext: buildAnswerContext(currentAnswers),
                    reason: 'Intake service failed, using direct draft generation.',
                });
            } else {
                safeCloseLoading('prompt_input');
            }
            return null;
        } finally {
            setIsLoading(false);
            setLoadingMessage('Loading...');
        }
    };

    const handleSelectionChoice = (choice) => {
        if (choice === 'ai') {
            setQuestions([]);
            setAnswers({});
            setAllQuestions({});
            setCurrentRoundIndex(0);
            setDraftSummary(INITIAL_SUMMARY);
            setIntakeStep('prompt_input');
            return;
        }

        if (choice === 'empty') {
            createWorkspaceEmptyDocument();
        }
    };

    const handlePromptSubmit = async () => {
        if (!prompt.trim()) {
            toast.error('Please enter details about what you want to draft');
            return;
        }

        setQuestions([]);
        setAnswers({});
        setAllQuestions({});
        setCurrentRoundIndex(0);
        setDraftSummary(INITIAL_SUMMARY);
        await analyzeIntake({ currentAnswers: {}, roundHint: 'initial' });
    };

    const handleAnswerChange = (questionId, optionValue, question) => {
        setAnswers((prev) => {
            if (question?.multiple) {
                const existing = Array.isArray(prev[questionId]) ? prev[questionId] : [];
                const nextValues = existing.includes(optionValue)
                    ? existing.filter((value) => value !== optionValue)
                    : [...existing, optionValue];
                return { ...prev, [questionId]: nextValues };
            }

            return { ...prev, [questionId]: optionValue };
        });
    };

    const handleQuestionNext = async () => {
        if (questions.length === 0) {
            toast.error('No clarifying questions are available yet.');
            return;
        }

        await analyzeIntake({ currentAnswers: answers, roundHint: 'clarification' });
    };

    const handleGenerateAndOpen = async () => {
        if (!sessionToken) {
            toast.error('Please sign in again before generating a draft.');
            return;
        }

        upsertLoading('Generating your draft...');

        try {
            const caseContext = buildAnswerContext(answers);
            const response = await fetch(`${DRAFTER_API_URL}/v2/draft/compile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({
                    case_context: caseContext,
                    case_metadata_context: [
                        { prompt },
                        { answers },
                        { draft_summary: draftSummary },
                    ],
                    document_type: draftSummary?.basis?.documentType || 'Legal Document',
                    file_target_name: slugifyFileName(prompt || draftSummary?.basis?.documentType || 'AI Draft'),
                }),
            });

            if (!response.ok) {
                let detail = 'Failed to generate draft.';
                try {
                    const errorData = await response.json();
                    detail = errorData?.detail || detail;
                } catch {
                    detail = response.statusText || detail;
                }
                throw new Error(detail);
            }

            const data = await response.json();
            navigateToWorkspace(data, { source: 'intake_compile' });
            toast.success('Draft generated successfully!');
        } catch (error) {
            console.error('Final compile error:', error);
            toast.error(error.message || 'Failed to generate draft.');
        } finally {
            safeCloseLoading('summary');
        }
    };

    const renderSelectionView = () => (
        <div className="step-content fade-in">
            <h2 className="modal-title">Create New Draft</h2>
            <p className="modal-subtitle">Choose how you would like to begin.</p>
            <div className="options-grid">
                <button className="option-card" onClick={() => handleSelectionChoice('ai')}>
                    <div className="icon-box type">
                        <PenTool size={24} />
                    </div>
                    <div className="text-content">
                        <h3>Generate with AI</h3>
                        <p>Start the guided intake workflow and shape the draft through clarifying questions.</p>
                    </div>
                </button>

                <button className="option-card" onClick={() => handleSelectionChoice('empty')}>
                    <div className="icon-box upload">
                        <FileText size={24} />
                    </div>
                    <div className="text-content">
                        <h3>Start Empty Document</h3>
                        <p>Create an empty workspace immediately and begin editing without intake.</p>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderPromptInputView = () => (
        <div className="step-content fade-in">
            <div className="modal-header">
                <div className="icon-badge">
                    <PenTool size={20} />
                </div>
                <h2 className="modal-title">Tell us about the matter</h2>
            </div>

            <p className="modal-subtitle">
                Share the facts, desired outcome, and anything else that will help the intake engine reason about the draft.
            </p>

            <div className="input-area">
                <textarea
                    placeholder="e.g. My client needs a lease notice for a commercial property dispute..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                />
                <PromptQualityBar prompt={prompt} />
            </div>

            <div className="modal-controls">
                <div className="premium-feature">
                    <input type="checkbox" disabled />
                    <div className="feature-info">
                        <span className="feature-title">Deep thinking (more accurate draft generation but takes longer)</span>
                        <span className="feature-sub">Available with a paid plan.</span>
                    </div>
                    <span className="lock-icon">
                        <Lock size={16} />
                    </span>
                </div>
            </div>

            <div className="modal-actions">
                <button className="btn btn-primary" onClick={handlePromptSubmit}>
                    Submit
                </button>
            </div>
        </div>
    );

    const renderClarifyingView = () => (
        <div className="step-content fade-in">
            <div className="modal-header">
                <div className="icon-badge">
                    <FileText size={20} />
                </div>
                <h2 className="modal-title">A few clarifications will help</h2>
            </div>

            <p className="modal-subtitle">
                Answer the current round of questions. We will re-run the intake engine if another round is needed.
            </p>

            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 mb-6">
                {questions.map((question, idx) => {
                    const currentValue = answers[question.id];
                    const hasOptions = question.options.length > 0;
                    const groupName = `question_${question.id}`;

                    return (
                        <fieldset key={question.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#121a27] p-4">
                            <legend className="px-1 text-sm font-semibold text-slate-900 dark:text-white">
                                {idx + 1}. {question.prompt}
                            </legend>
                            {question.helperText ? (
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{question.helperText}</p>
                            ) : null}

                            {hasOptions ? (
                                <div className="mt-4 grid gap-2">
                                    {question.options.map((option) => {
                                        const optionKey = String(option.value);
                                        const checked = question.multiple
                                            ? Array.isArray(currentValue) && currentValue.includes(optionKey)
                                            : String(currentValue ?? '') === optionKey;

                                        const InputIcon = question.multiple ? Square : Check;

                                        return (
                                            <label
                                                key={option.id || optionKey}
                                                className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${checked
                                                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <input
                                                    type={question.multiple ? 'checkbox' : 'radio'}
                                                    name={groupName}
                                                    checked={checked}
                                                    onChange={() => handleAnswerChange(question.id, optionKey, question)}
                                                    className="mt-1 h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <InputIcon size={14} className="text-slate-400" />
                                                        <span className="text-sm font-medium text-slate-900 dark:text-white">{option.label}</span>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <textarea
                                    className="mt-4 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1724] p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    rows={3}
                                    value={Array.isArray(currentValue) ? currentValue.join(', ') : currentValue || ''}
                                    placeholder="Type your answer..."
                                    onChange={(e) => handleAnswerChange(question.id, e.target.value, question)}
                                />
                            )}
                        </fieldset>
                    );
                })}
            </div>

            <div className="modal-actions">
                <button
                    className="btn btn-ghost"
                    onClick={() => {
                        setIntakeStep('prompt_input');
                    }}
                >
                    Back
                </button>
                <button className="btn btn-primary" onClick={handleQuestionNext}>
                    Next
                </button>
            </div>
        </div>
    );

    const renderSummaryView = () => (
        <div className="step-content fade-in">
            <div className="modal-header">
                <div className="icon-badge">
                    <Check size={20} />
                </div>
                <h2 className="modal-title">Draft summary</h2>
            </div>

            <p className="modal-subtitle">
                Review the generated basis and assumptions before we compile the final document.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121a27] p-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Draft Basis</h3>
                    <div className="mt-3 space-y-3 text-sm">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Document Type</div>
                            <div className="mt-1 text-slate-900 dark:text-white">{draftSummary.basis.documentType || 'Legal Document'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Jurisdiction</div>
                            <div className="mt-1 text-slate-900 dark:text-white">{draftSummary.basis.jurisdiction || 'Not specified'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Representation Position</div>
                            <div className="mt-1 text-slate-900 dark:text-white">{draftSummary.basis.representationPosition || 'Not specified'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Key Legal Positions</div>
                            <ul className="mt-2 space-y-2">
                                {toStringList(draftSummary.basis.keyLegalPositions).length > 0 ? (
                                    toStringList(draftSummary.basis.keyLegalPositions).map((item) => (
                                        <li key={item} className="flex gap-2 text-slate-700 dark:text-slate-300">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-slate-500 dark:text-slate-400">No key positions identified yet.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121a27] p-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Assumptions Used</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                        {toStringList(draftSummary.assumptions).length > 0 ? (
                            toStringList(draftSummary.assumptions).map((item) => (
                                <li key={item} className="flex gap-2 text-slate-700 dark:text-slate-300">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))
                        ) : (
                            <li className="text-slate-500 dark:text-slate-400">
                                Market-standard assumptions will be applied by the draft engine.
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Captured context</div>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {prompt.trim()}
                </p>
            </div>

            <div className="modal-actions">
                <button
                    className="btn btn-ghost"
                    onClick={() => setIntakeStep('clarifying')}
                >
                    Review Questions
                </button>
                <button className="btn btn-primary" onClick={handleGenerateAndOpen}>
                    Generate & Open in Workspace
                </button>
            </div>
        </div>
    );

    const renderLoadingView = () => (
        <div className="step-content fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <Loader2 size={48} className="spinner" style={{ marginBottom: '16px', color: '#4f46e5' }} />
            <h2 className="modal-title">{loadingMessage}</h2>
            <p className="modal-subtitle">Please wait while DraftMate prepares your workspace.</p>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                {intakeStep === 'loading' || isLoading ? renderLoadingView() : null}
                {!isLoading && intakeStep === 'selection' ? renderSelectionView() : null}
                {!isLoading && intakeStep === 'prompt_input' ? renderPromptInputView() : null}
                {!isLoading && intakeStep === 'clarifying' ? renderClarifyingView() : null}
                {!isLoading && intakeStep === 'summary' ? renderSummaryView() : null}
            </div>
        </div>
    );
};

export default DraftingModal;

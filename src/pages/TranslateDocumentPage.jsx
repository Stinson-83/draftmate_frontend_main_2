import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock3, Download, Eye, FileSearch, FileText, Languages, Loader2, Sparkles, Upload, Split } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { caseService } from '../services/library/caseService';

const SOURCE_LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'gu-IN', label: 'Gujarati' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'mr-IN', label: 'Marathi' },
  { value: 'od-IN', label: 'Odia' },
  { value: 'pa-IN', label: 'Punjabi' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'as-IN', label: 'Assamese' },
  { value: 'brx-IN', label: 'Bodo' },
  { value: 'doi-IN', label: 'Dogri' },
  { value: 'kok-IN', label: 'Konkani' },
  { value: 'ks-IN', label: 'Kashmiri' },
  { value: 'mai-IN', label: 'Maithili' },
  { value: 'mni-IN', label: 'Manipuri' },
  { value: 'ne-IN', label: 'Nepali' },
  { value: 'sa-IN', label: 'Sanskrit' },
  { value: 'sat-IN', label: 'Santali' },
  { value: 'sd-IN', label: 'Sindhi' },
  { value: 'ur-IN', label: 'Urdu' },
];

const SARVAM_TARGET_OPTIONS = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'gu-IN', label: 'Gujarati' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'mr-IN', label: 'Marathi' },
  { value: 'od-IN', label: 'Odia' },
  { value: 'pa-IN', label: 'Punjabi' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'as-IN', label: 'Assamese' },
  { value: 'brx-IN', label: 'Bodo' },
  { value: 'doi-IN', label: 'Dogri' },
  { value: 'kok-IN', label: 'Konkani' },
  { value: 'ks-IN', label: 'Kashmiri' },
  { value: 'mai-IN', label: 'Maithili' },
  { value: 'mni-IN', label: 'Manipuri' },
  { value: 'ne-IN', label: 'Nepali' },
  { value: 'sa-IN', label: 'Sanskrit' },
  { value: 'sat-IN', label: 'Santali' },
  { value: 'sd-IN', label: 'Sindhi' },
  { value: 'ur-IN', label: 'Urdu' },
];

const MAYURA_TARGET_OPTIONS = SARVAM_TARGET_OPTIONS.filter((option) => {
  return ['en-IN', 'hi-IN', 'bn-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN'].includes(option.value);
});

const getLanguageLabel = (value) => {
  const option = [...SOURCE_LANGUAGE_OPTIONS, ...SARVAM_TARGET_OPTIONS].find((item) => item.value === value);
  return option?.label || value;
};

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.html', '.htm'];

const getCurrentUserId = () => {
  try {
    const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    return userProfile.id || userProfile.email || localStorage.getItem('user_id') || null;
  } catch {
    return localStorage.getItem('user_id');
  }
};

const formatJobDate = (value) => {
  if (!value) return 'Unknown';

  let isoStr = String(value).trim();
  if (isoStr.includes(' ') && !isoStr.includes('T')) {
    isoStr = isoStr.replace(' ', 'T');
  }
  if (!isoStr.endsWith('Z') && !isoStr.includes('+') && !isoStr.includes('-')) {
    isoStr += 'Z';
  }

  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const TranslateDocumentPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sourceLanguage, setSourceLanguage] = useState('en-IN');
  const [targetLanguage, setTargetLanguage] = useState('hi-IN');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeJobId, setActiveJobId] = useState(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Choose a document to start translation.');
  const userId = useMemo(() => getCurrentUserId(), []);

  const targetLanguageOptions = useMemo(
    () => (sourceLanguage === 'auto' ? MAYURA_TARGET_OPTIONS : SARVAM_TARGET_OPTIONS),
    [sourceLanguage],
  );

  const uploadMutation = useMutation({
    mutationFn: ({ file, sourceLanguageValue, targetLanguageValue }) => api.submitTranslationJob({
      file,
      sourceLanguage: sourceLanguageValue,
      targetLanguage: targetLanguageValue,
      userId,
      onUploadProgress: (event) => {
        if (!event.total) return;
        const progress = Math.round((event.loaded * 100) / event.total);
        setUploadProgress(progress);
        setStatusMessage(`Uploading document... ${progress}%`);
      },
    }),
    onMutate: () => {
      setUploadProgress(0);
      setActiveJobId(null);
      setIsCreatingJob(true);
      setStatusMessage('Uploading document...');
    },
    onSuccess: (data) => {
      setActiveJobId(data.job_id);
      setUploadProgress(100);
      setStatusMessage(`Job #${data.job_id} queued. Translation will begin shortly.`);
      setIsCreatingJob(false);
      toast.success('Translation job created');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error?.message || 'Failed to submit translation job');
      setStatusMessage('Upload failed. Please try again.');
      setIsCreatingJob(false);
    },
  });

  const translationHistoryQuery = useQuery({
    queryKey: ['translation-job-history', userId],
    queryFn: () => api.listTranslationJobs({ userId, limit: 12 }),
    enabled: Boolean(userId),
    refetchInterval: 6000,
    refetchOnWindowFocus: false,
  });

  const historyJobs = translationHistoryQuery.data?.jobs ?? [];
  const selectedJobId = activeJobId ?? ((!selectedFile && !isCreatingJob) ? historyJobs[0]?.job_id ?? null : null);

  const translationJobQuery = useQuery({
    queryKey: ['translation-job', selectedJobId],
    queryFn: () => api.getTranslationJob(selectedJobId, userId),
    enabled: Boolean(selectedJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
    refetchOnWindowFocus: false,
  });

  const job = translationJobQuery.data;
  const isCompleted = job?.status === 'completed';
  const isFailed = job?.status === 'failed';
  const displayProgress = selectedJobId ? Math.max(uploadProgress, job?.progress ?? 0) : uploadProgress;

  const savedJobsRef = React.useRef(new Set());

  // Helper to format clean, short document names without long UUIDs
  const cleanDocName = (rawName, targetLang = 'HI') => {
    if (!rawName) return 'Translated_Document.pdf';
    let cleaned = rawName
      .replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}[_-]?/, '')
      .replace(/^[0-9a-fA-F]{32}[_-]?/, '')
      .replace(/^Translated_[A-Z_a-z-]+_/i, '')
      .replace(/^Translated_/i, '');

    const langCode = targetLang.split('-')[0].toUpperCase();
    return `Translated_${langCode}_${cleaned}`;
  };

  // Auto-save active completed job to Document Management ("Translated Documents" folder)
  React.useEffect(() => {
    if (job && job.status === 'completed') {
      const jobId = job.job_id || job.id || selectedJobId;
      if (jobId && !savedJobsRef.current.has(jobId)) {
        savedJobsRef.current.add(jobId);
        const baseName = job.file_name || 'Document.pdf';
        const docName = cleanDocName(baseName, job.target_language || 'HI');

        caseService.addCaseDocument(null, {
          name: docName,
          filename: docName,
          source: 'translate',
          url: api.getTranslationDownloadUrl(jobId) + '?raw=1',
          type: baseName.split('.').pop() || 'pdf'
        }).then(() => {
          console.log('[TranslateDocumentPage] Auto-saved translated document to Document Management');
        }).catch((err) => {
          console.warn('[TranslateDocumentPage] Auto-save error:', err);
        });
      }
    }
  }, [job, selectedJobId]);

  // 20-second auto-reset timer upon job completion to reset buttons, form and progressbar
  React.useEffect(() => {
    if (job?.status === 'completed') {
      const timer = setTimeout(() => {
        setSelectedFile(null);
        setActiveJobId(null);
        setUploadProgress(0);
        setStatusMessage('Choose a document to start translation.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 20000);

      return () => clearTimeout(timer);
    }
  }, [job?.status, job?.id]);

  // Auto-save history completed jobs to Document Management
  React.useEffect(() => {
    if (historyJobs && historyJobs.length > 0) {
      historyJobs.forEach(async (hJob) => {
        const jobId = hJob.job_id || hJob.id;
        if (hJob.status === 'completed' && jobId && !savedJobsRef.current.has(jobId)) {
          savedJobsRef.current.add(jobId);
          const baseName = hJob.file_name || 'Document.pdf';
          const docName = cleanDocName(baseName, hJob.target_language || 'HI');
          try {
            await caseService.addCaseDocument(null, {
              name: docName,
              filename: docName,
              source: 'translate',
              url: api.getTranslationDownloadUrl(jobId) + '?raw=1',
              type: baseName.split('.').pop() || 'pdf'
            });
          } catch (err) {
            console.warn('[TranslateDocumentPage] Auto-save history error:', err);
          }
        }
      });
    }
  }, [historyJobs]);

  const liveStatusMessage = useMemo(() => {
    if (!job) return statusMessage;
    if (job.status === 'processing') {
      return `Processing • ${job.stage || 'working'} • ${job.progress ?? 0}%`;
    }
    if (job.status === 'completed') {
      return 'Translation complete. Download your file below.';
    }
    if (job.status === 'failed') {
      return 'Translation failed. Please try another file.';
    }
    return statusMessage;
  }, [job, statusMessage]);

  const downloadUrl = useMemo(() => {
    if (!selectedJobId) return null;
    return api.getTranslationDownloadUrl(selectedJobId);
  }, [selectedJobId]);

  const sourceUrl = useMemo(() => {
    if (!selectedJobId) return null;
    return api.getTranslationSourceUrl(selectedJobId);
  }, [selectedJobId]);

  const previewAllowed = useMemo(() => {
    const name = (job?.file_name || selectedFile?.name || '').toLowerCase();
    if (!name) return false;
    return name.endsWith('.pdf') || name.endsWith('.html') || name.endsWith('.htm');
  }, [job?.file_name, selectedFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '';
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      toast.error('Please upload a PDF, DOCX, or HTML document.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setActiveJobId(null);
    setUploadProgress(0);
    setStatusMessage(`Selected ${file.name}`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedFile) {
      toast.error('Please choose a document first.');
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      sourceLanguageValue: sourceLanguage,
      targetLanguageValue: targetLanguage,
    });
  };

  const handleSourceLanguageChange = (nextSourceLanguage) => {
    setSourceLanguage(nextSourceLanguage);
    const nextTargetOptions = nextSourceLanguage === 'auto' ? MAYURA_TARGET_OPTIONS : SARVAM_TARGET_OPTIONS;
    if (!nextTargetOptions.some((option) => option.value === targetLanguage)) {
      setTargetLanguage(nextTargetOptions[0]?.value || 'hi-IN');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-indigo-50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="absolute top-24 -left-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-500/20 dark:bg-slate-900/60 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              Document Translation
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-5xl">
              Translate a legal document with progress you can follow.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
              Upload a PDF, DOCX, or HTML document, choose a target language, and track the job as it moves through upload, processing, translation, and rebuild stages.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-10 lg:grid-cols-2 lg:px-12 min-w-0 overflow-hidden">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 min-w-0 overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6 min-w-0 overflow-hidden">
            <div className="grid gap-4 min-w-0 overflow-hidden">
              <label className="space-y-2 block min-w-0 overflow-hidden">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Source document
                </span>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70 overflow-hidden min-w-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.html,.htm"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </button>
                    <span
                      className="truncate min-w-0 flex-1 text-sm font-medium text-slate-600 dark:text-slate-300"
                      title={selectedFile ? selectedFile.name : 'No file chosen'}
                    >
                      {selectedFile ? selectedFile.name : 'No file chosen'}
                    </span>
                  </div>
                  {selectedFile && (
                    <p
                      className="mt-2.5 truncate text-xs font-semibold text-indigo-600 dark:text-indigo-400 min-w-0 block w-full overflow-hidden"
                      title={selectedFile.name}
                    >
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Languages className="h-4 w-4 text-indigo-600" />
                    Source language
                  </span>
                  <select
                    value={sourceLanguage}
                    onChange={(e) => handleSourceLanguageChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {SOURCE_LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Languages className="h-4 w-4 text-indigo-600" />
                    Target language
                  </span>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {targetLanguageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300 min-w-0 overflow-hidden">
                <span className="truncate min-w-0 flex-1" title={liveStatusMessage}>{liveStatusMessage}</span>
                <span className="shrink-0 font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedJobId ? `Job #${selectedJobId}` : uploadMutation.isPending ? 'Submitting…' : 'Ready'}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500"
                  style={{ width: `${Math.max(4, displayProgress)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Upload and processing progress</span>
                <span>{Math.round(displayProgress)}%</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={uploadMutation.isPending || !selectedFile}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Submit translation job
              </button>

              {downloadUrl && isCompleted && (
                <>
                  <a
                    href={downloadUrl + '?raw=1'}
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  >
                    <Download className="h-4 w-4" />
                    Download translated file
                  </a>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/translate/compare/${selectedJobId}`)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300"
                  >
                    <Split className="h-4 w-4" />
                    Full Screen View
                  </button>
                </>
              )}
            </div>
          </form>
        </section>

        <aside className="space-y-6 min-w-0 overflow-hidden">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
              <FileSearch className="h-5 w-5 text-indigo-600" />
              Job Status
            </h2>

            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <StatusRow label="File" value={job?.file_name || selectedFile?.name || 'Waiting for a document'} />
              <StatusRow label="Source" value={getLanguageLabel(job?.source_language || sourceLanguage)} />
              <StatusRow label="Status" value={job?.status ? `${job.status} (${job?.progress ?? Math.round(uploadProgress)}%)` : (uploadMutation.isPending ? 'uploading' : 'idle')} />
              <StatusRow label="Stage" value={job?.stage || 'waiting'} />
              <StatusRow label="Progress" value={`${job?.progress ?? Math.round(uploadProgress)}%`} />
              <StatusRow label="Target" value={getLanguageLabel(job?.target_language || targetLanguage)} />
              <StatusRow label="Created" value={formatJobDate(job?.created_at)} />
            </div>

            {(job || uploadMutation.isPending) && (
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-sky-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>DOCUMENT COMPLETION</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                    {job?.progress ?? Math.round(displayProgress)}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.max(4, job?.progress ?? Math.round(displayProgress))}%` }}
                  />
                </div>
              </div>
            )}

            {translationJobQuery.isError && (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                {translationJobQuery.error?.message || 'Unable to fetch job status.'}
              </p>
            )}

            {isCompleted && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">Translation finished</p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  Your rebuilt document is ready for download.
                </p>
              </div>
            )}

            {isFailed && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10">
                <p className="font-semibold text-rose-800 dark:text-rose-200">Translation failed</p>
                <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                  Try a different document or submit the same file again.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
                <Clock3 className="h-5 w-5 text-indigo-600" />
                History
              </h2>
              {historyJobs.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {historyJobs.length}
                </span>
              )}
            </div>

            {!userId ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                Sign in to see your previous translation jobs.
              </div>
            ) : translationHistoryQuery.isError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                {translationHistoryQuery.error?.message || 'Unable to load translation history.'}
              </div>
            ) : historyJobs.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                Your previous translation jobs will appear here.
              </div>
            ) : (
              <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {historyJobs.map((historyJob) => {
                  const isActive = historyJob.job_id === activeJobId;
                  return (
                    <div
                      key={historyJob.job_id}
                      className={`rounded-2xl border p-4 transition ${isActive
                        ? 'border-indigo-200 bg-indigo-50 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10'
                        : 'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate block w-full text-sm font-semibold text-slate-950 dark:text-white" title={historyJob.file_name}>
                            {historyJob.file_name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>{getLanguageLabel(historyJob.source_language || 'auto')}</span>
                            <span>→</span>
                            <span>{historyJob.target_language?.toUpperCase()}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 shrink-0">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatJobDate(historyJob.created_at)}
                            </span>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${historyJob.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : historyJob.status === 'failed'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                          }`}
                        >
                          {historyJob.status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={historyJob.status !== 'completed' && !historyJob.download_available}
                          onClick={() => {
                            if (historyJob.status !== 'completed' && !historyJob.download_available) return;
                            window.open(api.getTranslationDownloadUrl(historyJob.job_id), '_blank', 'noopener,noreferrer');
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>

                        <button
                          type="button"
                          disabled={historyJob.status !== 'completed' && !historyJob.download_available}
                          onClick={() => {
                            if (historyJob.status !== 'completed' && !historyJob.download_available) return;
                            window.open(api.getTranslationDownloadUrl(historyJob.job_id) + '?raw=1', '_blank', 'noopener,noreferrer');
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {historyJob.status === 'completed' || historyJob.download_available ? 'Download' : 'Pending'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {translationHistoryQuery.isFetching && historyJobs.length > 0 && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Refreshing history...
              </p>
            )}
          </div>
        </aside>
      </div>

      {isCompleted && downloadUrl && (
        <div className="mx-auto max-w-6xl px-4 pb-12 md:px-10 lg:px-12">
          <div id="preview-section" className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Side-by-Side Document Preview</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Comparing original source and target translation</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/translate/compare/${selectedJobId}`)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300"
              >
                <Split className="h-3.5 w-3.5" />
                Full Screen View
              </button>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {/* Left Column: Original */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="bg-slate-100 px-3.5 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  Original ({getLanguageLabel(job?.source_language || sourceLanguage)})
                </div>
                <iframe
                  src={sourceUrl}
                  className="h-[460px] w-full border-0 bg-white"
                  title="Original document preview"
                />
              </div>

              {/* Right Column: Translated */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="bg-slate-100 px-3.5 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-800">
                  Translation ({getLanguageLabel(job?.target_language || targetLanguage)})
                </div>
                <iframe
                  src={downloadUrl}
                  className="h-[460px] w-full border-0 bg-white"
                  title="Translated document preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70 overflow-hidden min-w-0">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate min-w-0 max-w-[200px] sm:max-w-[260px] text-right" title={typeof value === 'string' ? value : undefined}>{value}</span>
  </div>
);

export default TranslateDocumentPage;
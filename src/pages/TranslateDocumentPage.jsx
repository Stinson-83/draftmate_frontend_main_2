import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Download, FileSearch, FileText, Languages, Loader2, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

const LANGUAGE_OPTIONS = [
  { value: 'hi', label: 'Hindi' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
];

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.html', '.htm'];

const TranslateDocumentPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Choose a document to start translation.');

  const uploadMutation = useMutation({
    mutationFn: ({ file, targetLanguageValue }) => api.submitTranslationJob({
      file,
      targetLanguage: targetLanguageValue,
      onUploadProgress: (event) => {
        if (!event.total) return;
        const progress = Math.round((event.loaded * 100) / event.total);
        setUploadProgress(progress);
        setStatusMessage(`Uploading document... ${progress}%`);
      },
    }),
    onMutate: () => {
      setUploadProgress(0);
      setJobId(null);
      setStatusMessage('Uploading document...');
    },
    onSuccess: (data) => {
      setJobId(data.job_id);
      setUploadProgress(100);
      setStatusMessage(`Job #${data.job_id} queued. Translation will begin shortly.`);
      toast.success('Translation job created');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error?.message || 'Failed to submit translation job');
      setStatusMessage('Upload failed. Please try again.');
    },
  });

  const translationJobQuery = useQuery({
    queryKey: ['translation-job', jobId],
    queryFn: () => api.getTranslationJob(jobId),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
    refetchOnWindowFocus: false,
  });

  const job = translationJobQuery.data;
  const isCompleted = job?.status === 'completed';
  const isFailed = job?.status === 'failed';
  const displayProgress = jobId ? Math.max(uploadProgress, job?.progress ?? 0) : uploadProgress;

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
    if (!jobId) return null;
    return api.getTranslationDownloadUrl(jobId);
  }, [jobId]);

  const previewAllowed = useMemo(() => {
    if (!selectedFile) return false;
    const name = selectedFile.name.toLowerCase();
    return name.endsWith('.pdf') || name.endsWith('.html') || name.endsWith('.htm');
  }, [selectedFile]);

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
    setJobId(null);
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
      targetLanguageValue: targetLanguage,
    });
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

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Source document
                </span>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                  <input
                    type="file"
                    accept=".pdf,.docx,.html,.htm"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700 dark:text-slate-300"
                  />
                  {selectedFile && (
                    <p className="mt-3 truncate text-xs text-slate-500 dark:text-slate-400">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
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
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span>{liveStatusMessage}</span>
                <span className="shrink-0 font-semibold text-indigo-600 dark:text-indigo-400">
                  {jobId ? `Job #${jobId}` : uploadMutation.isPending ? 'Submitting…' : 'Ready'}
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
                <a
                  href={downloadUrl}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                >
                  <Download className="h-4 w-4" />
                  Download translated file
                </a>
              )}
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
              <FileSearch className="h-5 w-5 text-indigo-600" />
              Job Status
            </h2>

            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <StatusRow label="Status" value={job?.status || (uploadMutation.isPending ? 'uploading' : 'idle')} />
              <StatusRow label="Stage" value={job?.stage || 'waiting'} />
              <StatusRow label="Progress" value={`${job?.progress ?? Math.round(uploadProgress)}%`} />
              <StatusRow label="Target" value={targetLanguage.toUpperCase()} />
            </div>

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

          {isCompleted && downloadUrl && (
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Preview</h3>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
              {previewAllowed ? (
                <iframe
                  src={downloadUrl}
                  className="mt-4 h-[420px] w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-800"
                  title="Translated document preview"
                />
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                  Browser preview is unavailable for this file type. Use the download button to open the translated document.
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

const StatusRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/70">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
  </div>
);

export default TranslateDocumentPage;
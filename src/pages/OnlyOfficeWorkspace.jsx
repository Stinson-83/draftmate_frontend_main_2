import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ONLYOFFICE_API_SRC = 'http://localhost/onlyoffice/web-apps/apps/api/documents/api.js';

const OnlyOfficeWorkspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editorInstanceRef = useRef(null);
  const [docsApiReady, setDocsApiReady] = useState(false);

  const { documentKey, filename, onlyofficeConfig, variablesDetected } = useMemo(() => {
    const state = location?.state || {};
    return {
      documentKey: state.documentKey,
      filename: state.filename,
      onlyofficeConfig: state.onlyofficeConfig,
      variablesDetected: Array.isArray(state.variablesDetected) ? state.variablesDetected : [],
    };
  }, [location]);

  useEffect(() => {
    const missing = [];
    if (!documentKey) missing.push('documentKey');
    if (!filename) missing.push('filename');
    if (!onlyofficeConfig) missing.push('onlyofficeConfig');

    if (missing.length > 0) {
      toast.error(`ONLYOFFICE workspace is missing required state: ${missing.join(', ')}`);
      navigate('/dashboard', { replace: true });
    }
  }, [documentKey, filename, onlyofficeConfig, navigate]);

  useEffect(() => {
    const existingApi = window?.DocsAPI?.DocEditor;
    if (existingApi) {
      setDocsApiReady(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${ONLYOFFICE_API_SRC}"]`);
    if (existingScript) {
      const onLoad = () => setDocsApiReady(true);
      existingScript.addEventListener('load', onLoad);
      return () => existingScript.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.src = ONLYOFFICE_API_SRC;
    script.async = true;
    script.onload = () => setDocsApiReady(true);
    script.onerror = () => {
      toast.error('Failed to load ONLYOFFICE DocsAPI script.');
      navigate('/dashboard', { replace: true });
    };
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [navigate]);

  useEffect(() => {
    if (!docsApiReady) return;
    if (!onlyofficeConfig) return;

    const mount = document.getElementById('onlyoffice-canvas-target-node');
    if (!mount) return;

    mount.innerHTML = '';

    if (!window?.DocsAPI?.DocEditor) {
      toast.error('ONLYOFFICE DocsAPI is not available after script load.');
      navigate('/dashboard', { replace: true });
      return;
    }

    editorInstanceRef.current = new window.DocsAPI.DocEditor('onlyoffice-canvas-target-node', {
      ...onlyofficeConfig,
      width: '100%',
      height: '100%',
    });
  }, [docsApiReady, onlyofficeConfig, navigate]);

  const handleSynchronize = async () => {
    if (!documentKey) {
      toast.error('Missing documentKey for force-save request.');
      return;
    }

    const sessionId = localStorage.getItem('session_id');
    const headers = { 'Content-Type': 'application/json' };
    if (sessionId) headers.Authorization = `Bearer ${sessionId}`;

    const promise = fetch('http://localhost/api/v2/draft/forcesave', {
      method: 'POST',
      headers,
      body: JSON.stringify({ document_key: documentKey }),
    }).then(async (res) => {
      if (!res.ok) {
        let detail = '';
        try {
          const data = await res.json();
          detail = data?.detail ? `: ${data.detail}` : '';
        } catch {
          detail = '';
        }
        throw new Error(`Force-save request failed (${res.status})${detail}`);
      }
      return res.json().catch(() => ({}));
    });

    toast.promise(promise, {
      loading: 'Synchronizing changes with ONLYOFFICE...',
      success: 'Synchronization triggered (force-save requested).',
      error: (e) => e?.message || 'Failed to synchronize changes.',
    });

    await promise;
  };

  return (
    <div className="relative h-[calc(100vh-0px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="h-full md:pr-80">
        <div className="h-full flex flex-col">
          <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-slate-500 dark:text-slate-400">ONLYOFFICE Workspace</div>
                <div className="font-semibold truncate">{filename || 'Untitled'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSynchronize}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                >
                  Synchronize Matrix Changes
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <div className="h-full w-full">
              <div id="onlyoffice-canvas-target-node" className="h-full w-full bg-white dark:bg-slate-900" />
            </div>
          </div>
        </div>
      </div>

      <aside className="w-full md:w-80 md:fixed md:right-0 md:top-0 md:h-screen border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100">
        <div className="h-full flex flex-col">
          <div className="shrink-0 px-5 py-4 border-b border-slate-800">
            <div className="text-sm font-semibold tracking-wide">Content Controls</div>
            <div className="text-xs text-slate-300 mt-1">
              Variables detected from the drafting matrix
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {variablesDetected.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold">No variables detected</div>
                <div className="text-xs text-slate-300 mt-1">
                  This panel will populate after the drafting engine identifies placeholders.
                </div>
              </div>
            ) : (
              variablesDetected.map((variable, idx) => {
                const name = String(variable || '');
                return (
                  <div key={`${name}-${idx}`} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{name}</div>
                        <div className="text-xs text-slate-300 mt-1">
                          This tag maps to an active content control inside the editor.
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                        Replacement Tag
                      </div>
                      <div className="select-all font-mono text-xs rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2">
                        {name}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default OnlyOfficeWorkspace;


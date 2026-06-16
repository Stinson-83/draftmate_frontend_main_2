import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_CONFIG } from '../services/endpoints';
import { api } from '../services/api';

const ONLYOFFICE_API_SRC = `${window.location.protocol}//${window.location.hostname}/onlyoffice/web-apps/apps/api/documents/api.js`;

const OnlyOfficeWorkspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editorInstanceRef = useRef(null);
  const pluginWindowRef = useRef(null);
  const [docsApiReady, setDocsApiReady] = useState(false);
  const [isCanvasLoading, setIsCanvasLoading] = useState(true);

  // Tab State: 'chat' or 'variables'
  const [activeTab, setActiveTab] = useState('chat');

  // AI Assistant Chat State
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Legal Assistant. You can ask me to research clauses, tenancy laws, explain selected text, or generate content to insert into your document.',
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const chatEndRef = useRef(null);

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

    setIsCanvasLoading(true);
    mount.innerHTML = '';

    if (!window?.DocsAPI?.DocEditor) {
      toast.error('ONLYOFFICE DocsAPI is not available after script load.');
      navigate('/dashboard', { replace: true });
      return;
    }

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const pluginUrl = isLocalhost
      ? 'http://host.docker.internal:5173/plugins/assistant/config.json'
      : `${window.location.protocol}//${window.location.host}/plugins/assistant/config.json`;

    const nextConfig = {
      ...onlyofficeConfig,
      editorConfig: {
        ...(onlyofficeConfig?.editorConfig || {}),
        plugins: {
          autostart: [
            "asc.{43d1a84f-e274-4b53-a55e-3363f8db1f34}"
          ],
          pluginsData: [
            pluginUrl
          ]
        }
      },
      events: {
        ...(onlyofficeConfig?.events || {}),
        onDocumentReady: (...args) => {
          try {
            const existing = onlyofficeConfig?.events?.onDocumentReady;
            if (typeof existing === 'function') existing(...args);
          } finally {
            setIsCanvasLoading(false);
          }
        },
      },
      width: '100%',
      height: '100%',
    };

    editorInstanceRef.current = new window.DocsAPI.DocEditor('onlyoffice-canvas-target-node', {
      ...nextConfig,
    });
  }, [docsApiReady, onlyofficeConfig, navigate]);

  // Handle postMessage selection from macro / plugin
  useEffect(() => {
    const handleMessage = (e) => {
      if (!e.data) return;

      if (e.data.type === 'ONLYOFFICE_PLUGIN_READY') {
        console.log("ONLYOFFICE plugin is ready!", e.source);
        pluginWindowRef.current = e.source;
      } else if (e.data.type === 'ONLYOFFICE_SELECTION') {
        const selectedText = e.data.text;
        if (!selectedText || !selectedText.trim()) {
          toast.error("Please select some text inside the ONLYOFFICE document first.");
          return;
        }
        handleSendMessage(`Explain this selection: "${selectedText.trim()}"`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [documentKey, messages]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSynchronize = async () => {
    if (!documentKey) {
      toast.error('Missing documentKey for force-save request.');
      return;
    }

    const sessionId = localStorage.getItem('session_id');
    const headers = { 'Content-Type': 'application/json' };
    if (sessionId) headers.Authorization = `Bearer ${sessionId}`;

    const promise = fetch(`${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/forcesave`, {
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

  // Chat message submission
  const handleSendMessage = async (customQuery = null) => {
    const queryText = customQuery || inputMessage;
    if (!queryText.trim()) return;

    if (!customQuery) setInputMessage('');

    // Add user message
    const userMsg = { role: 'user', content: queryText };
    setMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);
    setStatusMessage('Assistant is thinking...');

    // Add empty assistant response to stream into
    const assistantMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);

    try {
      const activeSessionId = documentKey || 'workspace-chat-session';
      let accumulatedResponse = '';

      await api.chatStream(queryText, activeSessionId, {
        onStatus: (msg) => {
          setStatusMessage(msg || 'Processing legal research...');
        },
        onToken: (chunk, accumulated) => {
          accumulatedResponse = accumulated;
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: accumulated } : m
          ));
        },
        onAnswer: (content) => {
          accumulatedResponse = content;
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: content, isStreaming: false } : m
          ));
        },
        onDone: () => {
          setIsChatLoading(false);
          setStatusMessage('');
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          ));
        },
        onError: (err) => {
          console.error('Workspace assistant stream error:', err);
          setIsChatLoading(false);
          setStatusMessage('');
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: accumulatedResponse || 'Sorry, I encountered an error answering your request.', isStreaming: false }
              : m
          ));
        }
      });
    } catch (err) {
      console.error('Workspace assistant error:', err);
      setIsChatLoading(false);
      setStatusMessage('');
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: 'Failed to connect to AI Assistant service.', isStreaming: false }
          : m
      ));
    }
  };

  // Request selection from ONLYOFFICE via plugin postMessage
  const handleExplainSelection = () => {
    if (!pluginWindowRef.current) {
      toast.error('AI Assistant plugin is not ready. Please make sure the ONLYOFFICE document is fully loaded.');
      return;
    }

    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_GET_SELECTION' }, '*');
  };

  // Request insert text into ONLYOFFICE via plugin postMessage
  const handleInsertText = (textToInsert) => {
    if (!pluginWindowRef.current) {
      toast.error('AI Assistant plugin is not ready. Please make sure the ONLYOFFICE document is fully loaded.');
      return;
    }

    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_INSERT_TEXT', text: textToInsert }, '*');
    toast.success('Inserted content into ONLYOFFICE document!');
  };

  return (
    <div className="flex h-[calc(100vh-0px)] w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden relative">
      {/* Left 70% Area: Header and ONLYOFFICE Iframe */}
      <div className="flex-1 flex flex-col min-w-0 h-full border-r border-slate-200 dark:border-slate-800">
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
              <button
                type="button"
                onClick={() => {
                  window.open(`${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/serve/${filename || documentKey + '.docx'}`, '_blank');
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors"
              >
                Force Emergency Backup Download
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <div id="onlyoffice-canvas-target-node" className="h-full w-full bg-white dark:bg-slate-900" />
          {isCanvasLoading ? (
            <div className="absolute inset-0 bg-slate-950/90 z-20">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[min(680px,90%)] space-y-4">
                  <div className="h-6 rounded-lg bg-slate-800/70" />
                  <div className="h-4 rounded-lg bg-slate-800/60 w-5/6" />
                  <div className="h-4 rounded-lg bg-slate-800/60 w-4/6" />
                  <div className="h-4 rounded-lg bg-slate-800/60 w-3/6" />
                  <div className="h-64 rounded-2xl bg-slate-900/70 border border-slate-800" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right 30% Panel: Tabbed Navigation with AI Assistant / Variables */}
      <aside className="w-96 lg:w-[420px] xl:w-[480px] shrink-0 h-full bg-slate-900 text-slate-100 flex flex-col shadow-2xl z-10 border-l border-slate-800">
        {/* Tabs Headers */}
        <div className="shrink-0 flex border-b border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-4 text-center text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined align-middle mr-1.5 text-lg">smart_toy</span>
            AI Assistant
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variables')}
            className={`flex-1 py-4 text-center text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === 'variables'
                ? 'border-blue-500 text-blue-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined align-middle mr-1.5 text-lg">schema</span>
            Variables ({variablesDetected.length})
          </button>
        </div>

        {/* Tab Panel: Variables */}
        {activeTab === 'variables' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="px-1 py-2">
              <div className="text-xs text-slate-400">
                Variables detected from the drafting matrix. Mapping content controls directly to active placeholders.
              </div>
            </div>
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
        )}

        {/* Tab Panel: AI Assistant Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] rounded-xl p-3.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-slate-800/70 border border-slate-700/50 text-slate-100 mr-auto'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content || '...'}</div>
                  
                  {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-700/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleInsertText(msg.content)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                      >
                        <span className="material-symbols-outlined text-sm">input</span>
                        Insert into Document
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Streaming Status Indicator */}
              {isChatLoading && statusMessage && (
                <div className="flex items-center gap-2 text-xs text-slate-400 px-2 py-1 italic animate-pulse">
                  <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                  {statusMessage}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Action Controls & Text Input Box */}
            <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-950/40">
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleExplainSelection}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  title="Select text in ONLYOFFICE and click here to explain it"
                >
                  <span className="material-symbols-outlined text-sm">school</span>
                  Explain Selection
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-blue-500 transition-colors"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask the AI Assistant..."
                  disabled={isChatLoading}
                  className="flex-1 bg-transparent border-0 outline-none p-1 text-sm text-slate-100 placeholder-slate-400 focus:ring-0 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !inputMessage.trim()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default OnlyOfficeWorkspace;

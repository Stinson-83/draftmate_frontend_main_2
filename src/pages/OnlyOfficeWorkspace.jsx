import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Download, FileText, Gavel, Loader2, Plus, Mic, Quote, Send, Sparkles, X } from 'lucide-react';
import { API_CONFIG } from '../services/endpoints';
import { api } from '../services/api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { processCitations, CitationLink } from '../utils/citationUtils';
import convertMarkdownToDocHtml from '../utils/markdownToDocHtml';

const SmoothVlcProgressBar = ({ statusMessage, isLoading }) => {
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }
    setProgress(10);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) {
          const inc = Math.max(0.4, (95 - prev) * 0.08);
          return Math.min(95, prev + inc);
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="my-2 bg-white border border-blue-100 rounded-xl p-3 shadow-[0_4px_15px_rgba(37,99,235,0.06)] text-slate-800">
      <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
        <span className="truncate text-slate-700 flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
          {statusMessage || 'Processing legal query...'}
        </span>
        <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">{Math.round(progress)}%</span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full w-full overflow-hidden border border-slate-200 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-2 border-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.4)] pointer-events-none transition-all duration-300 ease-out z-10"
          style={{ left: `calc(${progress}% - 7px)` }}
        />
      </div>
    </div>
  );
};

const ONLYOFFICE_API_SRC = `${window.location.origin}/onlyoffice/web-apps/apps/api/documents/api.js`;
const ONLYOFFICE_ORIGIN = new URL(ONLYOFFICE_API_SRC).origin;

const OnlyOfficeWorkspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editorInstanceRef = useRef(null);
  const pluginWindowRef = useRef(null);
  const pendingSelectionActionRef = useRef(null);
  const activeCaseRequestIdRef = useRef(0);
  const activeCaseGenerationIdRef = useRef(0);
  const caseFetchAbortRef = useRef(null);
  const caseGenerationAbortRef = useRef(null);
  const caseParagraphTextRef = useRef('');
  const chatEndRef = useRef(null);
  const composerTextareaRef = useRef(null);
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [composerHasValue, setComposerHasValue] = useState(false);
  const selectionPollRef = useRef(null);
  const selectionPollPausedUntilRef = useRef(0);
  const dismissedSelectionTextRef = useRef('');

  const canvasTargetRef = useRef(null);
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
  const [selectionPreview, setSelectionPreview] = useState('');
  const [showAutoFormatPopup, setShowAutoFormatPopup] = useState(false);
  const [isAutoFormatting, setIsAutoFormatting] = useState(false);
  const [enhanceSelectionText, setEnhanceSelectionText] = useState('');
  const [inlineCustomPrompt, setInlineCustomPrompt] = useState('');
  const [inlineAiResponse, setInlineAiResponse] = useState('');
  const [isInlineAiLoading, setIsInlineAiLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState('');
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [activeAction, setActiveAction] = useState('');

  // Case Law Assistant State
  const [caseCards, setCaseCards] = useState([]);
  const [caseCardsLoading, setCaseCardsLoading] = useState(false);
  const [caseCardsError, setCaseCardsError] = useState('');
  const [caseGeneratingCardId, setCaseGeneratingCardId] = useState(null);
  const [caseGeneratingText, setCaseGeneratingText] = useState('');
  const [activeSelectionText, setActiveSelectionText] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('In progress');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarInput, setSidebarInput] = useState('');

  // Dynamic config and sharing states
  const [dynamicConfig, setDynamicConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareAccess, setShareAccess] = useState('edit');
  const [isSharing, setIsSharing] = useState(false);

  const startResize = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 260 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const el = composerTextareaRef.current;
    if (!el) return;

    const minHeight = 24;
    const maxHeight = 160;
    el.style.height = '0px';
    const nextHeight = Math.min(el.scrollHeight || minHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    setComposerExpanded(nextHeight > 42);
    setComposerHasValue(Boolean(inputMessage.trim()));
  }, [inputMessage]);

  const { documentKey, filename, onlyofficeConfig, initialVars } = useMemo(() => {
    const state = location?.state || {};
    return {
      documentKey: state.documentKey,
      filename: state.filename,
      onlyofficeConfig: state.onlyofficeConfig,
      initialVars: Array.isArray(state.variablesDetected) ? state.variablesDetected : [],
    };
  }, [location]);

  const [variablesDetected, setVariablesDetected] = useState(initialVars);

  useEffect(() => {
    if (initialVars.length > 0) {
      setVariablesDetected((prev) => Array.from(new Set([...prev, ...initialVars])));
    }
  }, [initialVars]);

  const draftId = useMemo(() => {
    return location?.state?.draftId || location?.state?.id;
  }, [location]);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!draftId) {
        console.warn("fetchConfig called but draftId is null");
        return;
      }
      setConfigLoading(true);
      try {
        const token = localStorage.getItem('session_id');
        console.log("[OnlyOfficeWorkspace] Fetching config for draftId:", draftId);
        const resp = await fetch(`${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/config/${draftId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        console.log("[OnlyOfficeWorkspace] Fetch config response status:", resp.status);
        if (resp.ok) {
          const config = await resp.json();
          console.log("[OnlyOfficeWorkspace] Fetched config successfully:", config);
          setDynamicConfig(config);
          if (config.status) {
            setCurrentStatus(config.status);
          }
        } else {
          console.error("[OnlyOfficeWorkspace] Failed to load dynamic draft config. Status:", resp.status);
          const errorText = await resp.text().catch(() => "");
          console.error("[OnlyOfficeWorkspace] Response error details:", errorText);
        }
      } catch (err) {
        console.error("[OnlyOfficeWorkspace] Error fetching draft config:", err);
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, [draftId]);

  useEffect(() => {
    if (!draftId && (!documentKey || !filename || !onlyofficeConfig)) {
      toast.error("ONLYOFFICE workspace is missing required state.");
      navigate('/dashboard', { replace: true });
    }
  }, [draftId, documentKey, filename, onlyofficeConfig, navigate]);

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

  const activeConfig = dynamicConfig || onlyofficeConfig;

  useEffect(() => {
    console.log("[OnlyOfficeWorkspace] Editor init useEffect triggered. docsApiReady =", docsApiReady, "activeConfig =", activeConfig);
    if (!docsApiReady) {
      console.log("[OnlyOfficeWorkspace] docsApiReady is false, skipping editor init.");
      return;
    }
    if (!activeConfig) {
      console.log("[OnlyOfficeWorkspace] activeConfig is null/falsy, skipping editor init.");
      return;
    }

    const mount = canvasTargetRef.current;
    if (!mount) {
      console.error("[OnlyOfficeWorkspace] onlyoffice-canvas-target-node ref is not set");
      return;
    }

    setIsCanvasLoading(true);
    mount.innerHTML = '';

    if (!window?.DocsAPI?.DocEditor) {
      toast.error('ONLYOFFICE DocsAPI is not available after script load.');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Safely garbage collect previous instance if remounting
    if (editorInstanceRef.current && typeof editorInstanceRef.current.destroy === 'function') {
      try {
        editorInstanceRef.current.destroy();
        console.log('Previous ONLYOFFICE instance garbage collected safely.');
      } catch (err) {
        console.error('Error destroying active editor instance:', err);
      }
    }

    const pluginConfigUrl = `${window.location.origin}/plugins/assistant/config.json`;

    const nextConfig = {
      ...activeConfig,
      editorConfig: {
        ...(activeConfig?.editorConfig || {}),
        plugins: {
          autostart: ['asc.{43d1a84f-e274-4b53-a55e-3363f8db1f34}'],
          pluginsData: [pluginConfigUrl],
        },
      },
      events: {
        ...(activeConfig?.events || {}),
        onDocumentReady: (...args) => {
          try {
            const existing = activeConfig?.events?.onDocumentReady;
            if (typeof existing === 'function') existing(...args);
          } finally {
            setIsCanvasLoading(false);
          }
        },
        onError: (event) => {
          console.error("ONLYOFFICE Error:", event);
          setIsCanvasLoading(false); // Hide skeleton so user can see the error
        },
        onAppReady: () => {
          console.log("ONLYOFFICE App is ready.");
          setIsCanvasLoading(false);
        }
      },
      width: '100%',
      height: '100%',
    };

    // Fallback to hide skeleton after 15 seconds if DocEditor hangs silently
    const loadingTimeout = setTimeout(() => {
      setIsCanvasLoading(false);
      console.warn("ONLYOFFICE initialization timed out. Hidden skeleton loader.");
    }, 15000);

    try {
      console.log("[OnlyOfficeWorkspace] Instantiating DocsAPI.DocEditor...");
      editorInstanceRef.current = new window.DocsAPI.DocEditor('onlyoffice-canvas-target-node', {
        ...nextConfig,
      });
      window.docEditor = editorInstanceRef.current;
      console.log("[OnlyOfficeWorkspace] DocsAPI.DocEditor instantiated successfully:", editorInstanceRef.current);
    } catch (editorError) {
      console.error("[OnlyOfficeWorkspace] Critical error during DocsAPI.DocEditor instantiation:", editorError);
      toast.error("Failed to initialize ONLYOFFICE editor: " + (editorError.message || editorError));
      setIsCanvasLoading(false);
    }

    // Clean up instance on component unmount
    return () => {
      clearTimeout(loadingTimeout);
      if (editorInstanceRef.current && typeof editorInstanceRef.current.destroy === 'function') {
        try {
          editorInstanceRef.current.destroy();
          editorInstanceRef.current = null;
          console.log('ONLYOFFICE editor instance cleanly destroyed.');
        } catch (e) {
          console.warn('Deferred clean phase warning:', e);
        }
      }
    };
  }, [docsApiReady, activeConfig, navigate]);

  const clearCaseState = () => {
    pendingSelectionActionRef.current = null;
    activeCaseRequestIdRef.current += 1;
    activeCaseGenerationIdRef.current += 1;
    caseParagraphTextRef.current = '';
    setCaseCards([]);
    setCaseCardsError('');
    setCaseCardsLoading(false);
    setCaseGeneratingCardId(null);
    setCaseGeneratingText('');
    if (caseFetchAbortRef.current) {
      caseFetchAbortRef.current.abort();
      caseFetchAbortRef.current = null;
    }
    if (caseGenerationAbortRef.current) {
      caseGenerationAbortRef.current.abort();
      caseGenerationAbortRef.current = null;
    }
  };

  const sendToPlugin = (payload) => {
    let sent = false;
    if (pluginWindowRef.current) {
      try {
        pluginWindowRef.current.postMessage(payload, '*');
        sent = true;
      } catch (err) {
        console.warn('[OnlyOfficeWorkspace] pluginWindowRef postMessage failed:', err);
      }
    }
    try {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(payload, '*');
            sent = true;
          }
        } catch (e) {}
      });
    } catch (e) {}
    return sent;
  };

  const startSelectionPolling = () => {
    if (selectionPollRef.current) return;

    selectionPollRef.current = window.setInterval(() => {
      if (Date.now() < selectionPollPausedUntilRef.current) return;
      sendToPlugin({ type: 'ONLYOFFICE_POLL_SELECTION' });
    }, 500);
  };

  const stopSelectionPolling = () => {
    if (selectionPollRef.current) {
      window.clearInterval(selectionPollRef.current);
      selectionPollRef.current = null;
    }
  };

  useEffect(() => {
    startSelectionPolling();
    return () => stopSelectionPolling();
  }, []);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== window.location.origin && e.origin !== ONLYOFFICE_ORIGIN) return;
      if (!e.data) return;

      if (e.data.type && typeof e.data.type === 'string' && e.data.type.startsWith('ONLYOFFICE_')) {
        if (e.source && e.source !== window) {
          pluginWindowRef.current = e.source;
        }
      }

      if (e.data.type === 'ONLYOFFICE_PLUGIN_READY') {
        console.log('ONLYOFFICE plugin is ready!', e.source);
        pluginWindowRef.current = e.source;
        startSelectionPolling();
        return;
      }

      if (e.data.type === 'ONLYOFFICE_SELECTION_STATE' || e.data.type === 'ONLYOFFICE_SELECTION_CHANGED') {
        const selectedText = String(e.data.text || '').trim();
        setSelectionPreview(selectedText);
        
        if (!selectedText) {
          dismissedSelectionTextRef.current = '';
          setShowAutoFormatPopup(false);
          setIsAutoFormatting(false);
          return;
        }

        if (dismissedSelectionTextRef.current && selectedText !== dismissedSelectionTextRef.current) {
          dismissedSelectionTextRef.current = '';
        }

        if (selectedText !== dismissedSelectionTextRef.current) {
          setShowAutoFormatPopup(true);
          setActiveSelectionText(selectedText);
        } else {
          setShowAutoFormatPopup(false);
        }
        return;
      }

      if (e.data.type === 'ONLYOFFICE_AUTOFORMAT_DONE') {
        setIsAutoFormatting(false);
        selectionPollPausedUntilRef.current = Date.now() + 900;
        setShowAutoFormatPopup(false);
        if (e.data.applied) {
          toast.success('Selection auto-formatted.');
        } else {
          toast.info('Select text first to auto-format it.');
        }
        return;
      }

      if (e.data.type === 'ONLYOFFICE_AUTOFORMAT_ERROR') {
        setIsAutoFormatting(false);
        selectionPollPausedUntilRef.current = Date.now() + 900;
        toast.error(e.data.message || 'Auto-format failed.');
        return;
      }

      if (e.data.type === 'ONLYOFFICE_ENHANCE_SELECTION') {
        const selectedText = String(e.data.text || '').trim();
        if (!selectedText) {
          toast.info('Select text in ONLYOFFICE first.');
          return;
        }
        setEnhanceSelectionText(selectedText);
        setInputMessage('');
        setActiveTab('chat');
        setShowAutoFormatPopup(false);
        return;
      }

      if (e.data.type === 'ONLYOFFICE_SELECTION') {
        const selectedText = String(e.data.text || '').trim();
        if (!selectedText) {
          toast.error('Please select some text inside the ONLYOFFICE document first.');
          return;
        }
        setActiveSelectionText(selectedText);

        const pendingAction = pendingSelectionActionRef.current || 'explain';
        pendingSelectionActionRef.current = null;

        if (pendingAction === 'cases') {
          fetchRelevantCases(selectedText);
        } else {
          handleSendMessage(`Explain this selection: "${selectedText}"`);
        }
      }

      if (e.data.type === 'ONLYOFFICE_VARIABLES_DETECTED') {
        const vars = Array.isArray(e.data.variables) ? e.data.variables : [];
        if (vars.length > 0) {
          setVariablesDetected((prev) => Array.from(new Set([...prev, ...vars])));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [documentKey, messages]);

  useEffect(() => {
    if (activeTab !== 'chat') {
      clearCaseState();
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (documentKey) {
        const sessionId = localStorage.getItem('session_id');
        const headers = { 'Content-Type': 'application/json' };
        if (sessionId) headers.Authorization = `Bearer ${sessionId}`;
        
        fetch(`${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/forcesave`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ document_key: documentKey }),
        }).catch((err) => console.warn("Background forcesave on unmount failed:", err));
      }
      clearCaseState();
      stopSelectionPolling();
    };
  }, [documentKey]);

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

  const buildEnhancementPrompt = (selectedText, instruction) => {
    return [
      'You are editing a legal document.',
      'Revise the selected text according to the user instruction.',
      'Preserve the legal meaning unless the user explicitly requests a change.',
      'Return only the revised text. Do not explain the changes unless asked.',
      `Selected text:\n${selectedText}`,
      `User instruction:\n${instruction}`,
    ].join('\n\n');
  };

  // Chat message submission
  const handleSendMessage = async (customQuery = null) => {
    const queryText = customQuery || inputMessage;
    if (!queryText.trim()) return;

    const isEnhancementMode = !customQuery && Boolean(enhanceSelectionText.trim());
    const promptText = isEnhancementMode
      ? buildEnhancementPrompt(enhanceSelectionText.trim(), queryText.trim())
      : queryText;

    if (!customQuery) setInputMessage('');

    const userMsg = {
      role: 'user',
      content: isEnhancementMode ? `Enhance selected text: ${queryText}` : queryText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);
    setStatusMessage(isEnhancementMode ? 'Enhancing selected text...' : 'Assistant is thinking...');

    const assistantMsgId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);

    try {
      const activeSessionId = documentKey || 'workspace-chat-session';
      let accumulatedResponse = '';

      await api.chatStream(promptText, activeSessionId, {
        onStatus: (msg) => {
          setStatusMessage(msg || 'Processing legal research...');
        },
        onNodeUpdate: (evt) => {
          const nodeNames = {
            memory_recall: 'Checking session history...',
            router: 'Analyzing document structure & legal query...',
            research_agent: 'Searching Indian Bare Acts & precedents...',
            law_agent: 'Analyzing statutory provisions & legal framework...',
            case_agent: 'Finding relevant High Court & Supreme Court judgments...',
            explainer_agent: 'Formulating legal explanation...',
            manager_aggregate: 'Finalizing response...',
          };
          if (evt.status === 'running' && nodeNames[evt.node]) {
            setStatusMessage(nodeNames[evt.node]);
          }
        },
        onToken: (chunk, accumulated) => {
          accumulatedResponse = accumulated;
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulated } : m
          ));
        },
        onAnswer: (content) => {
          accumulatedResponse = content;
          setIsChatLoading(false);
          setStatusMessage('');
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: content, isStreaming: false } : m
          ));
        },
        onSources: (sources) => {
          setIsChatLoading(false);
          setStatusMessage('');
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId ? { ...m, sources: sources, isStreaming: false } : m
          ));
        },
        onDone: () => {
          setIsChatLoading(false);
          setStatusMessage('');
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          ));
        },
        onError: (err) => {
          console.error('Workspace assistant stream error:', err);
          setIsChatLoading(false);
          setStatusMessage('');
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: accumulatedResponse || 'Sorry, I encountered an error answering your request.', isStreaming: false }
              : m
          ));
        },
      });
    } catch (err) {
      console.error('Workspace assistant error:', err);
      setIsChatLoading(false);
      setStatusMessage('');
      setMessages((prev) => prev.map((m) =>
        m.id === assistantMsgId
          ? { ...m, content: 'Failed to connect to AI Assistant service.', isStreaming: false }
          : m
      ));
    }
  };
  const normalizeCaseItem = (item, idx, requestId) => {
    const rawCitation = item.citation || item.suggested_citation || item.reporter_citation || '';
    const isPureNumber = /^\d+$/.test(String(rawCitation).trim());
    const docid = item.docid || item.doc_id || item.id || item.raw?.docid;

    let caseUrl = item.source_url || item.url || item.raw?.source_url || item.raw?.url || '';
    if (docid) {
      caseUrl = `https://indiankanoon.org/doc/${docid}/?type=pdf`;
    } else if (caseUrl && caseUrl.includes('indiankanoon.org/doc/')) {
      const docMatch = caseUrl.match(/indiankanoon\.org\/doc\/(\d+)/);
      if (docMatch) {
        caseUrl = `https://indiankanoon.org/doc/${docMatch[1]}/?type=pdf`;
      }
    }

    return {
      id: item.id || item.case_id || item.doc_id || `${requestId}-${idx}`,
      name: item.name || item.case_name || item.title || 'Untitled Case',
      court: item.court || item.court_hierarchy || item.court_name || item.hierarchy || 'Court metadata unavailable',
      citation: isPureNumber ? '' : rawCitation,
      whyRelevant: item.whyRelevant || item.why_relevant || item.relevance_justification || item.relevance || item.snippet || item.context || '',
      holding: item.holding || item.holding_summary || item.ratio || item.ratio_decidendi || item.summary || '',
      generatedParagraph: item.generatedParagraph || '',
      url: caseUrl,
      raw: item,
    };
  };

  const fetchRelevantCases = async (selectedText) => {
    const requestId = ++activeCaseRequestIdRef.current;
    setCaseCardsLoading(true);
    setCaseCardsError('');
    setCaseCards([]);
    setCaseGeneratingCardId(null);
    setCaseGeneratingText('');
    caseParagraphTextRef.current = '';

    if (caseFetchAbortRef.current) {
      caseFetchAbortRef.current.abort();
    }

    const abortController = new AbortController();
    caseFetchAbortRef.current = abortController;

    try {
      const token = localStorage.getItem('session_id') || localStorage.getItem('token') || localStorage.getItem('access_token') || 'dev_session';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      };

      const response = await fetch(`${API_CONFIG.DRAFTER.BASE_URL}/v2/research/cases`, {
        method: 'POST',
        headers,
        signal: abortController.signal,
        body: JSON.stringify({
          query: selectedText,
          selection: selectedText,
          document_key: documentKey,
          filename,
        }),
      });

      if (requestId !== activeCaseRequestIdRef.current || abortController.signal.aborted) return;

      if (!response.ok) {
        let detail = 'Failed to retrieve relevant cases.';
        try {
          const data = await response.json();
          detail = data?.detail || detail;
        } catch {
          detail = response.statusText || detail;
        }
        throw new Error(detail);
      }

      const data = await response.json();
      const rawCases = Array.isArray(data.cases)
        ? data.cases
        : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.items)
            ? data.items
            : [];
      const normalized = rawCases.slice(0, 10).map((item, idx) => normalizeCaseItem(item, idx, requestId));

      setCaseCards(normalized);
      if (!normalized.length) {
        setCaseCardsError('No relevant cases were returned for this selection.');
      }
    } catch (error) {
      if (abortController.signal.aborted || requestId !== activeCaseRequestIdRef.current) return;
      console.error('Case retrieval failed:', error);
      setCaseCardsError(error.message || 'Case retrieval failed.');
      toast.error(error.message || 'Unable to fetch relevant cases.');
    } finally {
      if (requestId === activeCaseRequestIdRef.current) {
        setCaseCardsLoading(false);
      }
      if (caseFetchAbortRef.current === abortController) {
        caseFetchAbortRef.current = null;
      }
    }
  };

  const handleExplainSelection = () => {
    const selectedText = selectionPreview.trim() || activeSelectionText.trim();
    if (selectedText) {
      handleSendMessage(`Explain this selection: "${selectedText}"`);
      return;
    }

    pendingSelectionActionRef.current = 'explain';
    sendToPlugin({ type: 'ONLYOFFICE_GET_SELECTION' });

    setTimeout(() => {
      if (pendingSelectionActionRef.current === 'explain') {
        pendingSelectionActionRef.current = null;
        toast.info('Please select text inside the document first.');
      }
    }, 1500);
  };

  const handleFindRelevantCases = () => {
    const selectedText = selectionPreview.trim() || activeSelectionText.trim();
    if (selectedText) {
      fetchRelevantCases(selectedText);
      return;
    }

    pendingSelectionActionRef.current = 'cases';
    sendToPlugin({ type: 'ONLYOFFICE_GET_SELECTION' });

    setTimeout(() => {
      if (pendingSelectionActionRef.current === 'cases') {
        pendingSelectionActionRef.current = null;
        toast.info('Please select text inside the document first.');
      }
    }, 1500);
  };

  const handleNavigateToVariable = (varName) => {
    if (!varName) return;
    sendToPlugin({ type: 'ONLYOFFICE_NAVIGATE_TO_VARIABLE', tag: varName });
    toast.info(`Redirecting cursor to "${varName}" inside editor...`);
  };

  const handleInsertText = (textToInsert, sources = []) => {
    if (!textToInsert) return;
    console.log('[OnlyOfficeWorkspace] Original AI response:', textToInsert);
    console.log('[OnlyOfficeWorkspace] Sources passed:', sources);
    const formattedHtml = convertMarkdownToDocHtml(textToInsert, sources);
    console.log('[OnlyOfficeWorkspace] Transformed HTML with clickable citations:', formattedHtml);
    const sent = sendToPlugin({ type: 'ONLYOFFICE_INSERT_HTML', html: formattedHtml });
    console.log('[OnlyOfficeWorkspace] ONLYOFFICE_INSERT_HTML sent to plugin status:', sent);
    toast.success('Inserted formatted content with clickable citations into ONLYOFFICE!');
  };

  const handleAutoFormatSelection = () => {
    if (!selectionPreview.trim() && !activeSelectionText.trim()) {
      toast.info('Select text in ONLYOFFICE first.');
      return;
    }

    selectionPollPausedUntilRef.current = Date.now() + 1200;
    setIsAutoFormatting(true);
    setShowAutoFormatPopup(false);
    sendToPlugin({ type: 'ONLYOFFICE_AUTO_FORMAT_SELECTION' });
  };

  const handleEnhanceWithAISelection = () => {
    const selectedText = selectionPreview.trim() || activeSelectionText.trim();
    if (!selectedText) {
      toast.info('Select text in ONLYOFFICE first.');
      return;
    }

    selectionPollPausedUntilRef.current = Date.now() + 1200;
    setEnhanceSelectionText(selectedText);
    setInputMessage('');
    setActiveTab('chat');
    setShowAutoFormatPopup(false);
    sendToPlugin({ type: 'ONLYOFFICE_ENHANCE_WITH_AI' });
  };

  const handleInlineQuickAction = async (actionType) => {
    const rawText = selectionPreview.trim() || activeSelectionText.trim();
    if (!rawText) {
      toast.info('Select text in ONLYOFFICE first.');
      return;
    }
    const textToProcess = rawText.length > 3500 ? rawText.slice(0, 3500) + '...' : rawText;

    if (actionType === 'format') {
      handleAutoFormatSelection();
      return;
    }

    let prompt = '';
    if (actionType === 'enhance') {
      prompt = `[DIRECT EDIT MODE - NO SEARCH OR RETRIEVAL NEEDED]\nEnhance, refine, and polish the following legal text to improve clarity, precision, grammatical accuracy, and legal forcefulness while preserving all core facts and citations. Output ONLY the enhanced legal text without commentary:\n\n"${textToProcess}"`;
    } else if (actionType === 'rephrase') {
      const TONE_INSTRUCTIONS = {
        'Humanize': 'Rewrite the text in a warm, natural, and human tone — approachable yet professional, removing cold legal jargon while preserving all legal facts and citations.',
        'Formal':   'Rewrite the text in strict, authoritative, and formal legal language — precise terminology, structured sentences, suitable for court filings and official legal notices.',
        'Academic': 'Rewrite the text in a scholarly, citation-rich, and objective academic tone — suitable for legal research memos, opinions, and journal-style analysis.',
        'Simple':   'Rewrite the text in clear, plain, and simple language — easy for a non-lawyer to understand, while preserving all key legal facts and citations.',
      };
      const toneInstruction = selectedTone && TONE_INSTRUCTIONS[selectedTone]
        ? TONE_INSTRUCTIONS[selectedTone]
        : 'Rewrite the following text into formal, authoritative, and elegant legal terminology.';
      prompt = `[DIRECT EDIT MODE - NO SEARCH OR RETRIEVAL NEEDED]\n${toneInstruction} Output ONLY the rephrased legal text without intro or outro commentary:\n\n"${textToProcess}"`;
    } else if (actionType === 'summarize') {
      prompt = `[DIRECT EDIT MODE - NO SEARCH OR RETRIEVAL NEEDED]\nProvide a clear, structured executive legal summary of the following text. Output ONLY the summary without intro or outro commentary:\n\n"${textToProcess}"`;
    }

    if (!prompt) return;

    setIsInlineAiLoading(true);
    setInlineAiResponse('');

    try {
      await api.chatStream(prompt, documentKey || 'inline-ai-workspace', {
        onToken: (chunk, accumulated) => {
          setInlineAiResponse(accumulated);
        },
        onAnswer: (content) => {
          setInlineAiResponse(content || '');
          setIsInlineAiLoading(false);
        },
        onDone: () => {
          setIsInlineAiLoading(false);
        },
        onError: (err) => {
          console.error('Inline AI action failed:', err);
          const msg = String(err?.message || '').toLowerCase();
          if (msg.includes('fetch') || msg.includes('network') || msg.includes('502')) {
            toast.error('AI Service is connecting. Please try Rephrase again in a moment.');
          } else {
            toast.error(err?.message || 'Inline AI action failed.');
          }
          setIsInlineAiLoading(false);
        },
      });
    } catch (err) {
      console.error('Inline AI error:', err);
      toast.error('AI Service is connecting. Please try again in a moment.');
      setIsInlineAiLoading(false);
    }
  };

  const handleInlineCustomPromptSubmit = async () => {
    const rawText = selectionPreview.trim() || activeSelectionText.trim();
    const promptText = inlineCustomPrompt.trim();
    if (!rawText) {
      toast.info('Select text in ONLYOFFICE first.');
      return;
    }
    if (!promptText) return;

    const textToProcess = rawText.length > 3500 ? rawText.slice(0, 3500) + '...' : rawText;

    const TONE_STYLE = {
      'Humanize': 'in a warm, natural, and human tone — approachable yet professional',
      'Formal':   'in strict, authoritative, and formal legal language',
      'Academic': 'in a scholarly, citation-rich, and objective academic tone',
      'Simple':   'in clear, plain, and simple language easy for a non-lawyer to understand',
    };
    const toneClause = selectedTone && TONE_STYLE[selectedTone]
      ? ` Write the output ${TONE_STYLE[selectedTone]}.`
      : '';

    const fullPrompt = `[DIRECT EDIT MODE - NO SEARCH OR RETRIEVAL NEEDED]\nPerform this instruction on the text: "${promptText}".${toneClause} Output ONLY the transformed legal text without intro or outro commentary:\n\n"${textToProcess}"`;
    setIsInlineAiLoading(true);
    setInlineAiResponse('');

    try {
      await api.chatStream(fullPrompt, documentKey || 'inline-ai-workspace', {
        onToken: (chunk, accumulated) => {
          setInlineAiResponse(accumulated);
        },
        onAnswer: (content) => {
          setInlineAiResponse(content || '');
          setIsInlineAiLoading(false);
        },
        onDone: () => {
          setIsInlineAiLoading(false);
        },
        onError: (err) => {
          console.error('Inline AI custom prompt failed:', err);
          const msg = String(err?.message || '').toLowerCase();
          if (msg.includes('fetch') || msg.includes('network') || msg.includes('502')) {
            toast.error('AI Service is connecting. Please try again in a moment.');
          } else {
            toast.error(err?.message || 'Inline AI request failed.');
          }
          setIsInlineAiLoading(false);
        },
      });
    } catch (err) {
      console.error('Inline AI error:', err);
      toast.error('AI Service is connecting. Please try again in a moment.');
      setIsInlineAiLoading(false);
    }
  };

  const handleApplyInlineAiToDocument = () => {
    if (!inlineAiResponse.trim()) return;
    selectionPollPausedUntilRef.current = Date.now() + 1500;
    const formattedHtml = convertMarkdownToDocHtml(inlineAiResponse.trim());
    sendToPlugin({ type: 'ONLYOFFICE_INSERT_HTML', html: formattedHtml });
    setShowAutoFormatPopup(false);
    setInlineAiResponse('');
    setInlineCustomPrompt('');
    toast.success('Document updated with AI enhancement.');
  };

  const handleGenerateCaseParagraph = async (caseItem) => {
    if (!caseItem) return;

    if (caseGenerationAbortRef.current) {
      caseGenerationAbortRef.current.abort();
    }

    const abortController = new AbortController();
    caseGenerationAbortRef.current = abortController;
    const generationId = ++activeCaseGenerationIdRef.current;

    setCaseGeneratingCardId(caseItem.id);
    setCaseGeneratingText('');
    caseParagraphTextRef.current = '';

    const prompt = [
      "Write a professional paragraph applying the following case to the user's highlighted argument.",
      `User's Highlighted Argument: "${activeSelectionText}"`,
      `Case Name: ${caseItem.name}`,
      `Court: ${caseItem.court}`,
      caseItem.citation ? `Citation: ${caseItem.citation}` : null,
      caseItem.holding ? `Holding: ${caseItem.holding}` : null,
      caseItem.whyRelevant ? `Why Relevant: ${caseItem.whyRelevant}` : null,
      "If the user's highlighted argument is a document header, name, title, or lacks a specific legal point, write a professional summary of this case's core legal principles, holding, and general application instead. Under no circumstances should you ask follow-up questions or request more information.",
      'Keep the paragraph concise, formal, and legally grounded. Do not invent facts. Focus on the legal principle and its application.',
    ].filter(Boolean).join('\n');

    try {
      await api.chatStream(prompt, documentKey || 'workspace-case-assistant', {
        onToken: (chunk, accumulated) => {
          if (abortController.signal.aborted || generationId !== activeCaseGenerationIdRef.current) return;
          caseParagraphTextRef.current = accumulated;
          setCaseGeneratingText(accumulated);
          setCaseCards((prev) => prev.map((card) => (
            card.id === caseItem.id ? { ...card, generatedParagraph: accumulated, generating: true } : card
          )));
        },
        onAnswer: (content) => {
          if (abortController.signal.aborted || generationId !== activeCaseGenerationIdRef.current) return;
          caseParagraphTextRef.current = content || '';
          setCaseGeneratingText(content || '');
          setCaseCards((prev) => prev.map((card) => (
            card.id === caseItem.id ? { ...card, generatedParagraph: content || '', generating: false } : card
          )));
        },
        onDone: () => {
          if (abortController.signal.aborted || generationId !== activeCaseGenerationIdRef.current) return;
          setCaseGeneratingCardId(null);
          setCaseGeneratingText('');
        },
        onError: (err) => {
          if (abortController.signal.aborted || generationId !== activeCaseGenerationIdRef.current) return;
          console.error('Case paragraph generation failed:', err);
          toast.error(err?.message || 'Failed to generate paragraph for this case.');
          setCaseGeneratingCardId(null);
          setCaseGeneratingText('');
        },
      });
    } catch (error) {
      if (abortController.signal.aborted) return;
      console.error('Case paragraph generation error:', error);
      toast.error(error.message || 'Failed to generate paragraph for this case.');
      setCaseGeneratingCardId(null);
      setCaseGeneratingText('');
    } finally {
      if (caseGenerationAbortRef.current === abortController) {
        caseGenerationAbortRef.current = null;
      }
    }
  };

  const renderCaseCards = () => {
    if (caseCardsLoading) {
      return (
        <div className="rounded-xl border border-[#B9D9EB] bg-white p-4 flex items-center gap-2 text-sm text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finding relevant cases...
        </div>
      );
    }

    if (caseCardsError) {
      return (
        <div className="rounded-xl border border-[#B9D9EB] bg-white p-4 text-sm text-slate-700">
          {caseCardsError}
        </div>
      );
    }

    if (!caseCards.length) return null;

    return (
      <div className="space-y-3">
        {caseCards.map((caseItem) => {
          const targetUrl = caseItem.url || (caseItem.raw?.docid ? `https://indiankanoon.org/doc/${caseItem.raw.docid}/?type=pdf` : null);
          return (
            <div key={caseItem.id} className="rounded-2xl border border-[#B9D9EB] bg-white overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#B9D9EB]/50 bg-slate-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Relevant Case</span>
                    </div>
                    <h4 className="mt-2 text-sm font-semibold text-slate-800 leading-snug">{caseItem.name}</h4>
                    <p className="mt-1 text-[11px] text-slate-500">{caseItem.court}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {targetUrl && (
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold px-3 py-2 rounded-lg bg-[#E3F0F7] hover:bg-[#D0E6F2] border border-[#B9D9EB] text-slate-700 transition-colors inline-block whitespace-nowrap"
                      >
                        View Case
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleInsertText(caseItem.citation || caseItem.name)}
                      className="text-[11px] font-semibold px-3 py-2 rounded-lg bg-[#E3F0F7] hover:bg-[#D0E6F2] border border-[#B9D9EB] text-slate-700 transition-colors whitespace-nowrap"
                    >
                      Insert Citation
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Why Relevant</div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {caseItem.whyRelevant && !caseItem.whyRelevant.toLowerCase().includes('not found')
                      ? caseItem.whyRelevant
                      : 'Identified as a matching judicial precedent for the highlighted text and legal proposition.'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleUpdateStatus = async (newStatus) => {
    setIsStatusDropdownOpen(false);
    if (!draftId) return;

    try {
      const token = localStorage.getItem('session_id');
      const response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: draftId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setCurrentStatus(newStatus);
        toast.success(`Draft status updated to ${newStatus === 'Review' ? 'Work under Review' : newStatus === 'Completed' ? 'Draft Completed' : 'In Progress'}`);
      } else {
        toast.error('Failed to update draft status.');
      }
    } catch (error) {
      console.error('Error updating draft status:', error);
      toast.error('Failed to update draft status.');
    }
  };

  const handleShareDraft = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    setIsSharing(true);
    try {
      const token = localStorage.getItem('session_id');
      const response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          draft_id: draftId,
          email: shareEmail.trim(),
          access_level: shareAccess,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`Draft shared successfully with ${shareEmail}`);
        setIsShareModalOpen(false);
        setShareEmail('');
      } else {
        toast.error(data.detail || 'Failed to share draft.');
      }
    } catch (error) {
      console.error('Error sharing draft:', error);
      toast.error('Failed to share draft.');
    } finally {
      setIsSharing(false);
    }
  };

  const downloadUrl = draftId 
    ? `${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/serve/${draftId}/${filename || 'document.docx'}` 
    : `${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/serve/${filename || 'document.docx'}`;

  return (
    <div className="flex h-[calc(100vh-0px)] w-full bg-[#E3F0F7] text-slate-800 overflow-hidden relative">
      {/* Left 70% Area: Header and ONLYOFFICE Iframe */}
      <div className="flex-1 flex flex-col min-w-0 h-full border-r border-[#B9D9EB]">
        <div className="shrink-0 border-b border-[#B9D9EB] bg-[#E3F0F7]/95 backdrop-blur">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0 flex items-center gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DRAFTMATE WORKSPACE</div>
                <div className="font-bold text-slate-800 truncate max-w-[200px] sm:max-w-[300px]">{filename || 'Untitled'}</div>
              </div>

              {/* Work Status Dropdown Selector */}
              {draftId && (
                <div className="relative inline-block text-left ml-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-[#B9D9EB] text-xs font-semibold text-slate-700 shadow-sm transition-colors"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      currentStatus === 'In progress' ? 'bg-yellow-400' :
                      currentStatus === 'Review' ? 'bg-red-500' :
                      currentStatus === 'Completed' ? 'bg-green-500' : 'bg-yellow-400'
                    }`} />
                    <span>
                      {currentStatus === 'In progress' ? 'In Progress' :
                       currentStatus === 'Review' ? 'Work under Review' :
                       currentStatus === 'Completed' ? 'Draft Completed' : 'In Progress'}
                    </span>
                    <span className="material-symbols-outlined text-xs text-slate-400">arrow_drop_down</span>
                  </button>

                  {isStatusDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 flex items-center gap-1.5 bg-white border border-[#B9D9EB] shadow-xl z-50 rounded-xl px-2 py-1.5 whitespace-nowrap transition-all">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('In progress')}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-[#E3F0F7] transition-colors font-medium"
                        >
                          <span className="w-2 h-2 rounded-full bg-yellow-400" />
                          <span>In Progress</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('Review')}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-[#E3F0F7] transition-colors font-medium"
                        >
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Work under Review</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('Completed')}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-[#E3F0F7] transition-colors font-medium"
                        >
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Draft Completed</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {draftId && (
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  title="Share Document / Collaborate"
                >
                  <span className="material-symbols-outlined text-base">share</span>
                  <span>Share</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  window.open(downloadUrl, '_blank');
                }}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
              {isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center"
                  title="Expand Sidebar"
                >
                  <span className="material-symbols-outlined text-lg">last_page</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <div ref={canvasTargetRef} id="onlyoffice-canvas-target-node" className="h-full w-full bg-white" />
          {showAutoFormatPopup && selectionPreview ? (
            <div className="absolute top-3 right-3 z-30 w-80 rounded-xl bg-white border border-gray-200 shadow-xl">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">AI Assistant</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    dismissedSelectionTextRef.current = selectionPreview;
                    setShowAutoFormatPopup(false);
                    setIsAutoFormatting(false);
                    setInlineAiResponse('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Selected Text */}
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Selected Text</p>
                <p className="text-xs text-gray-600 line-clamp-2 italic">"{selectionPreview}"</p>
              </div>

              {/* Actions Row */}
              <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-gray-100">

                {/* Enhance with AI — standalone */}
                <button
                  type="button"
                  onClick={() => { setActiveAction('enhance'); handleInlineQuickAction('enhance'); }}
                  disabled={isAutoFormatting || isInlineAiLoading}
                  className={`flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${activeAction === 'enhance' ? 'ring-2 ring-blue-300' : ''}`}
                >
                  {isInlineAiLoading && activeAction === 'enhance' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Enhance with AI
                </button>

                {/* Rephrase + Tone split button */}
                <div className="relative">
                  <div className="flex rounded-lg overflow-hidden border border-gray-300">
                    <button
                      type="button"
                      onClick={() => { setActiveAction('rephrase'); handleInlineQuickAction('rephrase'); }}
                      disabled={isAutoFormatting || isInlineAiLoading}
                      className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Quote className="h-3 w-3" />
                      Rephrase
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsToneDropdownOpen((v) => !v)}
                      disabled={isAutoFormatting || isInlineAiLoading}
                      className="flex items-center gap-1 bg-white hover:bg-gray-50 border-l border-gray-200 text-gray-500 px-2 py-1.5 text-xs transition-colors disabled:opacity-50"
                    >
                      <span className="max-w-[44px] truncate">{selectedTone || 'Tone'}</span>
                      <svg className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>

                  {/* Tone Dropdown */}
                  {isToneDropdownOpen && (
                    <div className="absolute bottom-full left-0 z-50 mb-1 w-32 rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-xs">
                      {['Humanize', 'Formal', 'Academic', 'Simple'].map((tone) => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => { setSelectedTone(tone); setIsToneDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors hover:bg-gray-50 ${selectedTone === tone ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
                        >
                          {tone}
                          {selectedTone === tone && <Check className="h-3 w-3 text-blue-600" />}
                        </button>
                      ))}
                      {selectedTone && (
                        <button
                          type="button"
                          onClick={() => { setSelectedTone(''); setIsToneDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 text-gray-400 hover:bg-gray-50 border-t border-gray-100 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { setActiveAction('format'); handleInlineQuickAction('format'); }}
                  disabled={isAutoFormatting || isInlineAiLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isAutoFormatting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Auto Format
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveAction('summarize'); handleInlineQuickAction('summarize'); }}
                  disabled={isAutoFormatting || isInlineAiLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <FileText className="h-3 w-3" />
                  Summarize
                </button>
              </div>

              {/* Action hint */}
              {activeAction && (
                <div className="px-4 pb-2">
                  <p className="text-[10px] text-blue-600 bg-blue-50 rounded-md px-2.5 py-1.5 leading-relaxed">
                    {activeAction === 'enhance'  && '✦ Enhancing selected text for clarity, legal precision, and grammatical accuracy.'}
                    {activeAction === 'rephrase' && `↺ Rephrasing selected text${selectedTone ? ` in ${selectedTone} tone` : ' in formal legal tone'}. Use the Tone dropdown to change style.`}
                    {activeAction === 'format'   && '⊞ Auto-formatting document structure — applying legal typography, headings, and spacing.'}
                    {activeAction === 'summarize'&& '≡ Summarizing selected text into a concise executive legal summary.'}
                    {activeAction === 'custom'   && (selectedTone
                      ? `✎ Applying your custom instruction in ${selectedTone} tone — both will be combined.`
                      : '✎ Applying your custom instruction to the selected text.'
                    )}
                  </p>
                </div>
              )}

              {/* Custom Instruction */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inlineCustomPrompt}
                    onChange={(e) => setInlineCustomPrompt(e.target.value)}
                    onFocus={() => setActiveAction('custom')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inlineCustomPrompt.trim()) {
                        e.preventDefault();
                        handleInlineCustomPromptSubmit();
                      }
                    }}
                    placeholder={
                      activeAction === 'enhance'  ? 'e.g. Make it more concise and assertive...' :
                      activeAction === 'rephrase' ? 'e.g. Use simpler words for client communication...' :
                      activeAction === 'summarize'? 'e.g. Focus only on financial clauses...' :
                      activeAction === 'format'   ? 'e.g. Add numbered headings and sub-clauses...' :
                      'Type a custom instruction for the selected text...'
                    }
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleInlineCustomPromptSubmit}
                    disabled={!inlineCustomPrompt.trim() || isInlineAiLoading}
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-white disabled:opacity-40 transition-colors shrink-0"
                  >
                    {isInlineAiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* AI Response */}
              {inlineAiResponse ? (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Result</span>
                    {isInlineAiLoading && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                  </div>
                  <div className="max-h-32 overflow-y-auto rounded-lg bg-white border border-gray-200 px-3 py-2.5 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {inlineAiResponse}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setInlineAiResponse('')}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyInlineAiToDocument}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Insert into Document
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {isCanvasLoading ? (
            <div className="absolute inset-0 bg-[#E3F0F7]/90 z-20">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#E3F0F7] via-[#B9D9EB] to-[#E3F0F7]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[min(680px,90%)] space-y-4">
                  <div className="h-6 rounded-lg bg-[#B9D9EB]/50" />
                  <div className="h-4 rounded-lg bg-[#B9D9EB]/40 w-5/6" />
                  <div className="h-4 rounded-lg bg-[#B9D9EB]/40 w-4/6" />
                  <div className="h-4 rounded-lg bg-[#B9D9EB]/40 w-3/6" />
                  <div className="h-64 rounded-2xl bg-white/70 border border-[#B9D9EB]" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Resizable Sash Divider */}
      {!isSidebarCollapsed && (
        <div
          onMouseDown={startResize}
          className="w-1.5 hover:w-2 shrink-0 cursor-col-resize transition-all select-none h-full bg-[#B9D9EB] hover:bg-blue-400 active:bg-blue-500 z-30"
        />
      )}

      {/* Right Resizable Panel: Tabbed Navigation with AI Assistant / Variables */}
      {!isSidebarCollapsed && (
        <aside
          style={{ width: `${sidebarWidth}px` }}
          className="shrink-0 h-full bg-[#E3F0F7] text-slate-800 flex flex-col shadow-2xl z-10 border-l border-[#B9D9EB]"
        >
          {/* Tabs Headers */}
          <div className="shrink-0 flex border-b border-[#B9D9EB] bg-[#CDE3F0]">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              className="px-3 hover:bg-[#B9D9EB]/50 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center border-r border-[#B9D9EB]"
              title="Collapse Sidebar"
            >
              <span className="material-symbols-outlined text-base">first_page</span>
            </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-4 text-center text-xs font-semibold border-b-2 transition-all duration-200 ${
              activeTab === 'chat'
                ? 'border-blue-600 text-blue-800 bg-[#E3F0F7]'
                : 'border-transparent text-slate-500 hover:text-slate-805 hover:bg-[#CDE3F0]/55'
            }`}
          >
            <span className="material-symbols-outlined align-middle mr-1.5 text-base">smart_toy</span>
            AI Assistant
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('case')}
            className={`flex-1 py-4 text-center text-xs font-semibold border-b-2 transition-all duration-200 ${
              activeTab === 'case'
                ? 'border-blue-600 text-blue-800 bg-[#E3F0F7]'
                : 'border-transparent text-slate-500 hover:text-slate-805 hover:bg-[#CDE3F0]/55'
            }`}
          >
            <span className="material-symbols-outlined align-middle mr-1.5 text-base">gavel</span>
            Case Assistant
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variables')}
            className={`flex-1 py-4 text-center text-xs font-semibold border-b-2 transition-all duration-200 ${
              activeTab === 'variables'
                ? 'border-blue-600 text-blue-800 bg-[#E3F0F7]'
                : 'border-transparent text-slate-500 hover:text-slate-805 hover:bg-[#CDE3F0]/55'
            }`}
          >
            <span className="material-symbols-outlined align-middle mr-1.5 text-base">schema</span>
            Variables ({variablesDetected.length})
          </button>
        </div>

        {/* Tab Panel: Variables */}
        {activeTab === 'variables' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#E3F0F7]">
            <div className="px-1 py-2">
              <div className="text-xs text-slate-650">
                Variables automatically detected from document placeholders. Click any variable tag to redirect cursor directly to its location.
              </div>
            </div>
            {variablesDetected.length === 0 ? (
              <div className="rounded-xl border border-[#B9D9EB] bg-white p-4 shadow-sm text-center text-slate-600 text-xs">
                No variables detected in this document.
              </div>
            ) : (
              variablesDetected.map((variable, idx) => {
                const name = String(variable || '');
                return (
                  <div
                    key={`${name}-${idx}`}
                    onClick={() => handleNavigateToVariable(name)}
                    className="rounded-xl border border-[#B9D9EB] bg-white p-4 shadow-sm cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base text-blue-500">location_on</span>
                          {name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Click to jump cursor to this variable in editor.
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                        Replacement Tag
                      </div>
                      <div className="select-all font-mono text-xs rounded-lg bg-slate-50 border border-[#B9D9EB] px-3 py-2 text-slate-700">
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
          <div className="flex-1 flex flex-col min-h-0 bg-[#E3F0F7]">
            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] rounded-xl p-3.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white ml-auto shadow-sm'
                      : 'bg-white border border-[#B9D9EB] text-slate-800 mr-auto shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content || '...'}</div>
                  ) : (
                    <div className="prose dark:prose-invert prose-sm max-w-none text-slate-800 leading-relaxed space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => (
                            <CitationLink href={href} sources={msg.sources} compact={true}>
                              {children}
                            </CitationLink>
                          )
                        }}
                      >
                        {processCitations(msg.content, msg.sources)}
                      </ReactMarkdown>
                    </div>
                  )}

                  {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                    <div className="mt-3.5 pt-2.5 border-t border-[#E3F0F7] flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleInsertText(msg.content, msg.sources)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                      >
                        <span className="material-symbols-outlined text-sm">input</span>
                        Insert into Document
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* VLC / Spotify Style Continuous Progress Bar */}
              <SmoothVlcProgressBar statusMessage={statusMessage} isLoading={isChatLoading} />

              <div ref={chatEndRef} />
            </div>

            {/* Bottom Controls Bar for AI Assistant */}
            <div className="shrink-0 p-4 border-t border-[#B9D9EB] bg-[#CDE3F0]/60 flex flex-col gap-2">
              {/* Secondary Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (sidebarInput.trim()) {
                    handleSendMessage(sidebarInput.trim());
                    setSidebarInput('');
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#B9D9EB] shadow-sm w-full"
              >
                <input
                  type="text"
                  value={sidebarInput}
                  onChange={(e) => setSidebarInput(e.target.value)}
                  placeholder="your legal research..."
                  disabled={isChatLoading}
                  className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm text-slate-800 placeholder:text-slate-455"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !sidebarInput.trim()}
                  className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                    sidebarInput.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </form>

              <button
                type="button"
                onClick={handleExplainSelection}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-[#B9D9EB] text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                title="Select text in ONLYOFFICE and click here to explain it"
              >
                <span className="material-symbols-outlined text-base mr-1.5">school</span>
                Explain Selection
              </button>
            </div>
          </div>
        )}

        {/* Tab Panel: Case Assistant */}
        {activeTab === 'case' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#E3F0F7]">
            {/* Case Cards Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-2">
                    <span>Case Law Assistant</span>
                    {caseCards.length > 0 && (
                      <span className="text-[11px] text-slate-500 font-normal lowercase">({caseCards.length} result{caseCards.length === 1 ? '' : 's'})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {caseCardsLoading ? (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Searching
                      </div>
                    ) : null}
                    {caseCards.length > 0 ? (
                      <button
                        type="button"
                        onClick={clearCaseState}
                        className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>

                {renderCaseCards()}

                {!caseCards.length && !caseCardsLoading && (
                  <div className="rounded-xl border border-[#B9D9EB] bg-white p-4 shadow-sm text-center text-slate-600 text-xs">
                    <span className="material-symbols-outlined text-3xl text-slate-400 block mb-2">find_in_page</span>
                    Highlight text in the editor and click <strong>Find Relevant Cases</strong> below to perform legal research.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls Bar for Case Assistant */}
            <div className="shrink-0 p-4 border-t border-[#B9D9EB] bg-[#CDE3F0]/60 flex">
              <button
                type="button"
                onClick={handleFindRelevantCases}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                title="Find case law relevant to the selected text"
              >
                <Gavel size={16} />
                Find Relevant Cases
              </button>
            </div>
          </div>
        )}
      </aside>
      )}

      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent" />
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 text-xl">share</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite Collaborator</h3>
              </div>
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setShareEmail('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleShareDraft} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Collaborator Email
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
                  placeholder="e.g. colleague@firm.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Permission Level
                </label>
                <select
                  value={shareAccess}
                  onChange={(e) => setShareAccess(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
                >
                  <option value="edit">Can Edit (Co-author)</option>
                  <option value="read">Can Read (View only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsShareModalOpen(false);
                    setShareEmail('');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSharing || !shareEmail.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isSharing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Sharing...</span>
                    </>
                  ) : (
                    <span>Invite</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlyOfficeWorkspace;

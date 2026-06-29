import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Gavel, Loader2, Plus, Mic, Quote, Send, Sparkles } from 'lucide-react';
import { API_CONFIG } from '../services/endpoints';
import { api } from '../services/api';

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

  const { documentKey, filename, onlyofficeConfig, variablesDetected } = useMemo(() => {
    const state = location?.state || {};
    return {
      documentKey: state.documentKey,
      filename: state.filename,
      onlyofficeConfig: state.onlyofficeConfig,
      variablesDetected: Array.isArray(state.variablesDetected) ? state.variablesDetected : [],
    };
  }, [location]);

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

    const nextConfig = {
      ...activeConfig,
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

  const startSelectionPolling = () => {
    if (selectionPollRef.current) return;

    selectionPollRef.current = window.setInterval(() => {
      const plugin = pluginWindowRef.current;
      if (!plugin) return;
      if (Date.now() < selectionPollPausedUntilRef.current) return;
      plugin.postMessage({ type: 'ONLYOFFICE_POLL_SELECTION' }, ONLYOFFICE_ORIGIN);
    }, 500);
  };

  const stopSelectionPolling = () => {
    if (selectionPollRef.current) {
      window.clearInterval(selectionPollRef.current);
      selectionPollRef.current = null;
    }
  };

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== window.location.origin && e.origin !== ONLYOFFICE_ORIGIN) return;
      if (!e.data) return;

      if (e.data.type === 'ONLYOFFICE_PLUGIN_READY') {
        console.log('ONLYOFFICE plugin is ready!', e.source);
        pluginWindowRef.current = e.source;
        startSelectionPolling();
        return;
      }

      if (e.data.type === 'ONLYOFFICE_SELECTION_STATE' || e.data.type === 'ONLYOFFICE_SELECTION_CHANGED') {
        const selectedText = String(e.data.text || '').trim();
        setSelectionPreview(selectedText);
        setShowAutoFormatPopup(Boolean(selectedText));
        if (!selectedText) {
          setIsAutoFormatting(false);
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
        onToken: (chunk, accumulated) => {
          accumulatedResponse = accumulated;
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulated } : m
          ));
        },
        onAnswer: (content) => {
          accumulatedResponse = content;
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: content, isStreaming: false } : m
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
    return {
      id: item.id || item.case_id || item.doc_id || `${requestId}-${idx}`,
      name: item.name || item.case_name || item.title || 'Untitled Case',
      court: item.court || item.court_hierarchy || item.court_name || item.hierarchy || 'Court metadata unavailable',
      citation: isPureNumber ? '' : rawCitation,
      whyRelevant: item.whyRelevant || item.why_relevant || item.relevance || item.snippet || item.context || '',
      holding: item.holding || item.ratio || item.ratio_decidendi || item.summary || '',
      generatedParagraph: item.generatedParagraph || '',
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
      const sessionId = localStorage.getItem('session_id');
      const headers = { 'Content-Type': 'application/json' };
      if (sessionId) headers.Authorization = `Bearer ${sessionId}`;

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
    if (!pluginWindowRef.current) {
      toast.error('AI Assistant plugin is not ready. Please make sure the ONLYOFFICE document is fully loaded.');
      return;
    }

    pendingSelectionActionRef.current = 'explain';
    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_GET_SELECTION' }, ONLYOFFICE_ORIGIN);
  };

  const handleFindRelevantCases = () => {
    if (!pluginWindowRef.current) {
      toast.error('The canvas connection is warming up. Please wait a moment and try again.');
      return;
    }

    pendingSelectionActionRef.current = 'cases';
    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_GET_SELECTION' }, ONLYOFFICE_ORIGIN);
  };

  const handleInsertText = (textToInsert) => {
    if (!pluginWindowRef.current) {
      toast.error('AI Assistant plugin is not ready. Please make sure the ONLYOFFICE document is fully loaded.');
      return;
    }

    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_INSERT_TEXT', text: textToInsert }, ONLYOFFICE_ORIGIN);
    toast.success('Inserted content into ONLYOFFICE document!');
  };

  const handleAutoFormatSelection = () => {
    if (!pluginWindowRef.current) {
      toast.error('AI Assistant plugin is not ready. Please make sure the ONLYOFFICE document is fully loaded.');
      return;
    }

    if (!selectionPreview.trim()) {
      toast.info('Select text in ONLYOFFICE first.');
      return;
    }

    selectionPollPausedUntilRef.current = Date.now() + 1200;
    setIsAutoFormatting(true);
    setShowAutoFormatPopup(false);
    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_AUTO_FORMAT_SELECTION' }, ONLYOFFICE_ORIGIN);
  };

  const handleEnhanceWithAISelection = () => {
    if (!pluginWindowRef.current) {
      toast.error('AI Assistant plugin is not ready. Please make sure the ONLYOFFICE document is fully loaded.');
      return;
    }

    if (!selectionPreview.trim()) {
      toast.info('Select text in ONLYOFFICE first.');
      return;
    }

    selectionPollPausedUntilRef.current = Date.now() + 1200;
    setEnhanceSelectionText(selectionPreview.trim());
    setInputMessage('');
    setActiveTab('chat');
    setShowAutoFormatPopup(false);
    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_ENHANCE_WITH_AI' }, ONLYOFFICE_ORIGIN);
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
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Case Law Assistant</div>
          <div className="text-[11px] text-slate-500">{caseCards.length} result{caseCards.length === 1 ? '' : 's'}</div>
        </div>

        {caseCards.map((caseItem) => {
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
                    {caseItem.raw?.source_url && (
                      <a
                        href={caseItem.raw.source_url}
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
                    {caseItem.whyRelevant || 'A matching legal proposition was identified for the highlighted text.'}
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
            <div className="absolute top-4 right-4 z-30 w-[min(360px,calc(100%-2rem))] rounded-xl border border-[#B9D9EB] bg-white shadow-2xl overflow-hidden">
              <div className="border-b border-[#B9D9EB]/70 bg-[#F7FBFD] px-3 py-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Auto format</div>
                <div className="mt-1 text-xs text-slate-600" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {selectionPreview}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAutoFormatPopup(false);
                    setIsAutoFormatting(false);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Dismiss
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFormatSelection}
                    disabled={isAutoFormatting}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70 transition-colors"
                  >
                    {isAutoFormatting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Auto format
                  </button>
                  <button
                    type="button"
                    onClick={handleEnhanceWithAISelection}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900 transition-colors"
                  >
                    <Quote className="h-3.5 w-3.5" />
                    Enhance with AI
                  </button>
                </div>
              </div>
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
                Variables detected from the drafting matrix. Mapping content controls directly to active placeholders.
              </div>
            </div>
            {variablesDetected.length === 0 ? (
              <div className="rounded-xl border border-[#B9D9EB] bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold">No variables detected</div>
                <div className="text-xs text-slate-500 mt-1">
                  This panel will populate after the drafting engine identifies placeholders.
                </div>
              </div>
            ) : (
              variablesDetected.map((variable, idx) => {
                const name = String(variable || '');
                return (
                  <div key={`${name}-${idx}`} className="rounded-xl border border-[#B9D9EB] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate text-slate-800">{name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          This tag maps to an active content control inside the editor.
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
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content || '...'}</div>

                  {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                    <div className="mt-3.5 pt-2.5 border-t border-[#E3F0F7] flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleInsertText(msg.content)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
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
                <div className="flex items-center gap-2 text-xs text-slate-500 px-2 py-1 italic animate-pulse">
                  <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                  {statusMessage}
                </div>
              )}

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
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Case Law Assistant</div>
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

      {/* Floating expanding chat input bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center gap-3 pointer-events-none select-none" style={{ width: 'min(760px, calc(100vw - 2rem))' }}>
        {enhanceSelectionText ? (
          <div className="pointer-events-auto w-full rounded-2xl border border-[#B9D9EB] bg-white shadow-xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <Quote className="h-3.5 w-3.5" />
                  Selected text
                </div>
                <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap break-words max-h-20 overflow-hidden">
                  {enhanceSelectionText}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnhanceSelectionText('')}
                className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (composerHasValue) {
              handleSendMessage();
              setActiveTab('chat');
            }
          }}
          className={`pointer-events-auto w-full flex items-end gap-3 bg-[#f0f4f9] border border-[#d8e1ea] shadow-[0_12px_30px_rgba(15,23,42,0.08)] px-4 py-3.5 transition-all duration-300 ${
            composerExpanded ? 'rounded-[20px]' : 'rounded-full'
          }`}
        >
          {/* Left Column (fixed height side column, bottom anchored) */}
          <div className="flex h-10 items-center justify-center shrink-0">
            <button
              type="button"
              disabled
              title="Attachments coming soon"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e1ea] bg-white/80 text-slate-500 opacity-70"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <textarea
            ref={composerTextareaRef}
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (composerHasValue) {
                  handleSendMessage();
                  setActiveTab('chat');
                }
              }
            }}
            placeholder={enhanceSelectionText ? 'Write enhancement instructions...' : 'Ask your AI...'}
            disabled={isChatLoading}
            style={{
              height: '24px',
              minHeight: '24px',
              maxHeight: '160px',
            }}
            className="flex-1 resize-none overflow-y-auto bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-[15px] leading-6 text-slate-800 placeholder:text-slate-400 font-sans"
          />

          {/* Right Column (fixed height side column, bottom anchored) */}
          <div className="flex h-10 items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              disabled
              title="Voice input coming soon"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e1ea] bg-white/80 text-slate-500 opacity-70"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={isChatLoading || !inputMessage.trim()}
              className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition-all duration-200 ${
                inputMessage.trim()
                  ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 opacity-100'
                  : 'bg-slate-900/10 text-slate-500 opacity-50 cursor-not-allowed'
              } ${isChatLoading ? 'cursor-wait opacity-70' : ''}`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
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

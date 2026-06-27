import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Gavel, Loader2, Plus, Mic, Quote, Send, Sparkles } from 'lucide-react';
import { API_CONFIG } from '../services/endpoints';
import { api } from '../services/api';

const ONLYOFFICE_API_SRC = `${window.location.protocol}//${window.location.hostname}/onlyoffice/web-apps/apps/api/documents/api.js`;

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
        customization: {
          ...(onlyofficeConfig?.editorConfig?.customization || {}),
          forcesave: true,
          chat: false,
          uiTheme: 'theme-light',
          logo: {
            image: '',
            imageDark: '',
            url: '',
          },
        },
        plugins: {
          autostart: [
            'asc.{43d1a84f-e274-4b53-a55e-3363f8db1f34}',
          ],
          pluginsData: [
            pluginUrl,
          ],
        },
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
      plugin.postMessage({ type: 'ONLYOFFICE_POLL_SELECTION' }, '*');
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
      clearCaseState();
      stopSelectionPolling();
    };
  }, []);

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
    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_GET_SELECTION' }, '*');
  };

  const handleFindRelevantCases = () => {
    if (!pluginWindowRef.current) {
      toast.error('The canvas connection is warming up. Please wait a moment and try again.');
      return;
    }

    pendingSelectionActionRef.current = 'cases';
    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_GET_SELECTION' }, '*');
  };

  const handleInsertText = (textToInsert) => {
    if (!pluginWindowRef.current) {
      toast.error('AI Assistant plugin is not ready. Please make sure the ONLYOFFICE document is fully loaded.');
      return;
    }

    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_INSERT_TEXT', text: textToInsert }, '*');
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
    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_AUTO_FORMAT_SELECTION' }, '*');
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
    pluginWindowRef.current.postMessage({ type: 'ONLYOFFICE_ENHANCE_WITH_AI' }, '*');
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

  return (
    <div className="flex h-[calc(100vh-0px)] w-full bg-[#E3F0F7] text-slate-800 overflow-hidden relative">
      {/* Left 70% Area: Header and ONLYOFFICE Iframe */}
      <div className="flex-1 flex flex-col min-w-0 h-full border-r border-[#B9D9EB]">
        <div className="shrink-0 border-b border-[#B9D9EB] bg-[#E3F0F7]/95 backdrop-blur">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DRAFTMATE WORKSPACE</div>
              <div className="font-bold text-slate-800 truncate">{filename || 'Untitled'}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.open(`${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/serve/${filename || documentKey + '.docx'}`, '_blank');
                }}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <div id="onlyoffice-canvas-target-node" className="h-full w-full bg-white" />
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
      <div
        onMouseDown={startResize}
        className="w-1.5 hover:w-2 shrink-0 cursor-col-resize transition-all select-none h-full bg-[#B9D9EB] hover:bg-blue-400 active:bg-blue-500 z-30"
      />

      {/* Right Resizable Panel: Tabbed Navigation with AI Assistant / Variables */}
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className="shrink-0 h-full bg-[#E3F0F7] text-slate-800 flex flex-col shadow-2xl z-10 border-l border-[#B9D9EB]"
      >
        {/* Tabs Headers */}
        <div className="shrink-0 flex border-b border-[#B9D9EB] bg-[#CDE3F0]">
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
            <div className="shrink-0 p-4 border-t border-[#B9D9EB] bg-[#CDE3F0]/60 flex">
              <button
                type="button"
                onClick={handleExplainSelection}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-[#B9D9EB] text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
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
    </div>
  );
};

export default OnlyOfficeWorkspace;

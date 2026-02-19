import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
// Markdown enhancements
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
// Using specific imports if needed, but switching to Material Symbols for UI icons
// keeping logo just in case, though mostly using icons now
import lawJuristLogo from '../assets/draftmate_logo.png';
import DraftingModal from '../components/DraftingModal';
// Shared citation utilities
import { processCitations, CitationLink } from '../utils/citationUtils';

// LLM options for dropdown
const LLM_OPTIONS = [
    { value: 'gemini-2.5-flash', label: 'Fast', description: 'High speed responses' },
    { value: 'gemini-2.5-pro', label: 'Advanced', description: 'Deep reasoning & analysis' },
    { value: 'gpt-4o', label: 'Reasoning', description: 'Complex problem solving' },
    { value: 'gpt-4o-mini', label: 'Fast & Efficient', description: 'Balanced performance' },
];

const ResearchChat = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [statusMessage, setStatusMessage] = useState(''); // Streaming status
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [sessionId, setSessionId] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Sidebar & Session State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    // Deep Think and LLM state
    const [deepThinkEnabled, setDeepThinkEnabled] = useState(false);
    const [selectedLLM, setSelectedLLM] = useState('gemini-2.5-flash');
    const [isLLMDropdownOpen, setIsLLMDropdownOpen] = useState(false);
    const [messages, setMessages] = useState([]);

    // Drafting Modal State
    const [isDraftingOpen, setIsDraftingOpen] = useState(false);
    const [draftingPrompt, setDraftingPrompt] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Set page title
    useEffect(() => {
        document.title = 'AI Research | DraftMate';
    }, []);

    // Fetch Sessions
    const fetchSessions = async () => {
        try {
            setIsLoadingSessions(true);
            const data = await api.getSessions();
            setSessions(data.sessions || []);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            toast.error("Failed to load chat history");
        } finally {
            setIsLoadingSessions(false);
        }
    };

    // Initialize
    useEffect(() => {
        // Fetch current LLM config on mount
        const fetchLLMConfig = async () => {
            try {
                const config = await api.getLLMConfig();
                if (config.current_model) {
                    setSelectedLLM(config.current_model);
                }
            } catch (error) {
                console.warn('Failed to fetch LLM config:', error);
            }
        };
        fetchLLMConfig();
        fetchSessions();

        // Check for existing session in URL or localStorage
        // For now, let's start fresh or load if ID is present
        const storedSessionId = localStorage.getItem('last_chat_session_id');
        if (storedSessionId) {
            loadSession(storedSessionId);
        } else {
            startNewChat();
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Group Sessions by Date
    const groupSessions = (sessions) => {
        const groups = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Older': []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        sessions.forEach(session => {
            const date = new Date(session.created_at);
            if (date >= today) {
                groups['Today'].push(session);
            } else if (date >= yesterday) {
                groups['Yesterday'].push(session);
            } else if (date >= lastWeek) {
                groups['Previous 7 Days'].push(session);
            } else {
                groups['Older'].push(session);
            }
        });

        return groups;
    };

    const sessionGroups = groupSessions(sessions);

    const startNewChat = () => {
        const newId = crypto.randomUUID();
        setSessionId(newId);
        setMessages([
            {
                id: 1,
                role: 'ai',
                content: 'Hello! I am your advanced AI Legal Research Assistant. I can help you find relevant case laws, explain complex legal concepts, or draft research memos.\n\nHow can I assist you today?'
            }
        ]);
        localStorage.setItem('last_chat_session_id', newId);
        // Optionally clear URL param
        window.history.replaceState({}, '', '/research');
    };

    const loadSession = async (id) => {
        try {
            setSessionId(id);
            localStorage.setItem('last_chat_session_id', id);
            // Update URL without reload
            // window.history.replaceState({}, '', `/research?session_id=${id}`);

            const data = await api.getSessionHistory(id);
            if (data.messages && data.messages.length > 0) {
                // Map backend messages to frontend format
                const formattedMessages = data.messages.map((msg, idx) => ({
                    id: msg.id || idx,
                    role: msg.role === 'assistant' ? 'ai' : msg.role,
                    content: msg.content,
                    sources: msg.metadata?.sources, // Assuming backend stores sources in metadata
                    // Add other fields if needed
                }));
                setMessages(formattedMessages);
            } else {
                // If empty session, show welcome
                setMessages([
                    {
                        id: 1,
                        role: 'ai',
                        content: 'Hello! I am your advanced AI Legal Research Assistant. I can help you find relevant case laws, explain complex legal concepts, or draft research memos.\n\nHow can I assist you today?'
                    }
                ]);
            }
        } catch (error) {
            console.error("Failed to load session:", error);
            toast.error("Failed to load chat");
            startNewChat();
        }
    };

    const handleSend = async () => {
        if (!input.trim() && selectedFiles.length === 0) return;

        const currentInput = input;
        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: currentInput,
            file: selectedFiles
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedFiles([]);
        setIsTyping(true);
        setStatusMessage('');

        // Create placeholder for AI response
        const aiMsgId = Date.now() + 1;
        let aiContent = '';
        let aiFollowups = [];

        try {
            if (deepThinkEnabled) {
                // Deep Think mode: Use non-streaming /chat/reasoning for chain-of-thought
                setStatusMessage('Deep thinking...');
                const response = await api.chat(currentInput, sessionId, true);
                aiContent = response.answer || response.content || '';
                setMessages(prev => [...prev, {
                    id: aiMsgId,
                    role: 'ai',
                    content: aiContent,
                    isDeepThink: true
                }]);
                // Refresh sessions list to show new chat title if it was new
                fetchSessions();
            } else {
                // Normal mode: Use streaming /chat/stream
                await api.chatStream(currentInput, sessionId, {
                    onStatus: (message) => {
                        setStatusMessage(message);
                    },
                    onToken: (chunk, accumulated) => {
                        // Update message progressively with each token chunk
                        setStatusMessage('');
                        setMessages(prev => {
                            const existing = prev.find(m => m.id === aiMsgId);
                            if (existing) {
                                return prev.map(m => m.id === aiMsgId ? { ...m, content: accumulated } : m);
                            } else {
                                return [...prev, { id: aiMsgId, role: 'ai', content: accumulated }];
                            }
                        });
                        aiContent = accumulated;
                    },
                    onAnswer: (content) => {
                        aiContent = content;
                        setStatusMessage('');
                        // Final update with complete message
                        setMessages(prev => {
                            const existing = prev.find(m => m.id === aiMsgId);
                            if (existing) {
                                return prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m);
                            } else {
                                return [...prev, { id: aiMsgId, role: 'ai', content: aiContent }];
                            }
                        });
                        // Refresh sessions list
                        fetchSessions();
                    },
                    onFollowups: (questions) => {
                        console.log("Received followups:", questions);
                        aiFollowups = questions;
                        // Update message with followups
                        setMessages(prev => prev.map(m =>
                            m.id === aiMsgId ? { ...m, followups: aiFollowups } : m
                        ));
                    },
                    onSources: (sources) => {
                        console.log("Received sources:", sources);
                        // Store sources for clickable citations
                        setMessages(prev => prev.map(m =>
                            m.id === aiMsgId ? { ...m, sources: sources } : m
                        ));
                    },
                    onDone: (event) => {
                        console.log("Stream done:", event);
                        // Update with final metadata
                        setMessages(prev => prev.map(m =>
                            m.id === aiMsgId ? {
                                ...m,
                                complexity: event.complexity,
                                agents: event.agents_used
                            } : m
                        ));
                    },
                    onError: (error) => {
                        console.error("Stream error:", error);
                        setMessages(prev => [...prev, {
                            id: aiMsgId,
                            role: 'ai',
                            content: error.message || "I apologize, but I encountered an error. Please try again."
                        }]);
                    }
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            if (!aiContent) {
                setMessages(prev => [...prev, {
                    id: aiMsgId,
                    role: 'ai',
                    content: "I apologize, but I encountered an error connecting to the server. Please ensure the backend is running."
                }]);
            }
        } finally {
            setIsTyping(false);
            setStatusMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const MAX_DOC_FILES = 5;

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (!sessionId) {
            toast.error("Session not initialized. Please try again.");
            return;
        }

        // Filter only PDF files
        const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (pdfFiles.length < files.length) {
            toast.error('Only PDF files are allowed.');
        }
        if (!pdfFiles.length) return;

        // Enforce max 5 total
        const remaining = MAX_DOC_FILES - selectedFiles.length;
        if (remaining <= 0) {
            toast.error(`You can upload a maximum of ${MAX_DOC_FILES} documents per session.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        const filesToUpload = pdfFiles.slice(0, remaining);
        if (pdfFiles.length > remaining) {
            toast.warning(`Only ${remaining} more file(s) can be added. Extra files were skipped.`);
        }

        setIsUploading(true);
        const newlyUploaded = [];
        try {
            for (const file of filesToUpload) {
                await api.uploadFile(file, sessionId);
                newlyUploaded.push(file);
            }
            setSelectedFiles(prev => [...prev, ...newlyUploaded]);
            toast.success(`${newlyUploaded.length} file(s) uploaded successfully!`);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(`Failed to upload file: ${error.message}`);
            if (newlyUploaded.length > 0) {
                setSelectedFiles(prev => [...prev, ...newlyUploaded]);
            }
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Handle LLM change
    const handleLLMChange = async (model) => {
        setSelectedLLM(model);
        setIsLLMDropdownOpen(false);
        try {
            await api.setLLMConfig(model);
            toast.success(`Switched to ${LLM_OPTIONS.find(o => o.value === model)?.label || model}`);
        } catch (error) {
            console.error('Failed to switch LLM:', error);
            toast.error('Failed to switch model');
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans overflow-hidden text-slate-900 dark:text-slate-100">

            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-none bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex flex-col transition-all duration-300 overflow-hidden border-r border-slate-200 dark:border-slate-800`}>
                <div className="p-4 flex-none">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg transition-colors border border-transparent shadow-sm"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        <span className="text-sm font-medium">New Chat</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-6">
                    {isLoadingSessions ? (
                        <div className="flex justify-center py-4">
                            <span className="material-symbols-outlined animate-spin text-slate-400">progress_activity</span>
                        </div>
                    ) : (
                        Object.entries(sessionGroups).map(([group, groupSessions]) => (
                            groupSessions.length > 0 && (
                                <div key={group}>
                                    <h3 className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{group}</h3>
                                    <div className="space-y-1">
                                        {groupSessions.map(session => (
                                            <button
                                                key={session.session_id}
                                                onClick={() => loadSession(session.session_id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${sessionId === session.session_id
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                                    }`}
                                                title={session.title}
                                            >
                                                {session.title || "New Chat"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))
                    )}
                </div>

                {/* User Profile / Bottom Actions - REMOVED as per request */}
                {/* <div className="p-4 border-t border-slate-800 flex-none">
                    <button className="flex items-center gap-3 w-full px-2 py-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-medium text-xs">
                            U
                        </div>
                        <div className="text-sm font-medium text-slate-200">User</div>
                    </button>
                </div> */}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative">

                {/* Header */}
                <header className="flex-none bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-white text-lg">auto_awesome</span>
                            </div>
                            <h1 className="text-base font-semibold text-slate-900 dark:text-white hidden sm:block">Lex Bot</h1>
                        </div>
                    </div>

                    {/* LLM Switcher Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsLLMDropdownOpen(!isLLMDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                        >
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                {LLM_OPTIONS.find(o => o.value === selectedLLM)?.label || 'Select Model'}
                            </span>
                            <span className={`material-symbols-outlined text-sm text-slate-400 transition-transform duration-200 ${isLLMDropdownOpen ? 'rotate-180' : ''}`}>
                                expand_more
                            </span>
                        </button>

                        {isLLMDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up">
                                <div className="p-2">
                                    {LLM_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleLLMChange(option.value)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${selectedLLM === option.value
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                                                }`}
                                        >
                                            <span className={`material-symbols-outlined text-lg ${selectedLLM === option.value ? 'text-blue-600' : 'text-slate-400'
                                                }`}>
                                                {selectedLLM === option.value ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                            <div>
                                                <div className="text-sm font-medium">{option.label}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{option.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Messages Area */}
                <main className="flex-1 overflow-y-auto relative flex flex-col bg-slate-50 dark:bg-slate-900">
                    {/* Dot Pattern Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-50"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                            backgroundSize: '24px 24px'
                        }}
                    ></div>

                    <div className="relative z-0 flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
                        {/* Messages */}
                        {messages.map((msg, index) => (
                            <div key={msg.id} className={`flex gap-4 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
                                {/* Avatar */}
                                <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center shadow-sm overflow-hidden
                                    ${msg.role === 'ai' ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700' : 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'}`}
                                >
                                    {msg.role === 'ai' ? (
                                        <span className="material-symbols-outlined text-blue-600 text-base">gavel</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-base">person</span>
                                    )}
                                </div>

                                {/* Bubble */}
                                <div className={`flex-1 max-w-[90%] p-4 rounded-2xl shadow-sm border leading-relaxed text-sm
                                    ${msg.role === 'ai'
                                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-tl-none text-slate-900 dark:text-slate-100'
                                        : 'bg-blue-600 text-white border-blue-600 rounded-tr-none'
                                    }`}
                                >
                                    <div className={`markdown-content ${msg.role === 'user' ? 'text-white' : ''}`}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkMath, remarkGfm]}
                                            rehypePlugins={[rehypeKatex]}
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-3" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-3" {...props} />,
                                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1" {...props} />,
                                                // Syntax highlighted code blocks
                                                code: ({ node, inline, className, children, ...props }) => {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return !inline && match ? (
                                                        <SyntaxHighlighter
                                                            style={oneDark}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            className="rounded-lg my-3 text-xs"
                                                            {...props}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    ) : inline ? (
                                                        <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                                            {children}
                                                        </code>
                                                    ) : (
                                                        <pre className="bg-slate-800 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-3">
                                                            <code {...props}>{children}</code>
                                                        </pre>
                                                    );
                                                },
                                                strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                                // Blockquote styling
                                                blockquote: ({ node, ...props }) => (
                                                    <blockquote
                                                        className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 my-3 bg-blue-50 dark:bg-blue-900/20 italic text-slate-700 dark:text-slate-300 rounded-r"
                                                        {...props}
                                                    />
                                                ),
                                                // Horizontal rule styling
                                                hr: ({ node, ...props }) => (
                                                    <hr className="my-4 border-t-2 border-slate-200 dark:border-slate-700" {...props} />
                                                ),
                                                // Table styling (GFM)
                                                table: ({ node, ...props }) => (
                                                    <div className="overflow-x-auto my-3">
                                                        <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-600 text-sm" {...props} />
                                                    </div>
                                                ),
                                                thead: ({ node, ...props }) => (
                                                    <thead className="bg-slate-100 dark:bg-slate-700" {...props} />
                                                ),
                                                th: ({ node, ...props }) => (
                                                    <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold" {...props} />
                                                ),
                                                td: ({ node, ...props }) => (
                                                    <td className="border border-slate-300 dark:border-slate-600 px-3 py-2" {...props} />
                                                ),
                                                // Strikethrough (GFM)
                                                del: ({ node, ...props }) => (
                                                    <del className="text-slate-500 line-through" {...props} />
                                                ),
                                                a: ({ node, href, children, ...props }) => (
                                                    <CitationLink href={href} sources={msg.sources}>
                                                        {children}
                                                    </CitationLink>
                                                )
                                            }}
                                        >
                                            {processCitations(msg.content, msg.sources)}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Follow-up Suggestions */}
                                    {msg.followups && msg.followups.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {msg.followups.map((question, qIdx) => (
                                                <button
                                                    key={qIdx}
                                                    onClick={() => setInput(question)}
                                                    className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors border border-blue-200 dark:border-blue-700"
                                                >
                                                    {question}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Sources Reference */}
                                    {/* Convert to Draft Button */}
                                    {msg.role === 'ai' && !msg.isDeepThink && (
                                        <button
                                            onClick={() => {
                                                setDraftingPrompt(`Draft the legal document required for: ${messages[index - 1]?.content || 'this query'}. Focus on drafting the actual legal papers.`);
                                                setIsDraftingOpen(true);
                                            }}
                                            className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/50 transition-colors border border-purple-200 dark:border-purple-700 text-xs font-medium"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit_document</span>
                                            Draft a document related to this query
                                        </button>
                                    )}

                                    {msg.sources && msg.sources.length > 0 && (
                                        <details className="mt-4 group">
                                            <summary className="cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">menu_book</span>
                                                {msg.sources.length} Source{msg.sources.length > 1 ? 's' : ''} Referenced
                                                <span className="material-symbols-outlined text-sm transition-transform group-open:rotate-180">expand_more</span>
                                            </summary>
                                            <div className="mt-2 space-y-1 pl-1 border-l-2 border-blue-200 dark:border-blue-800">
                                                {msg.sources.map((source, sIdx) => (
                                                    <a
                                                        key={sIdx}
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block text-xs py-1 px-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                    >
                                                        <span className="font-medium text-blue-600 dark:text-blue-400">[{source.index}]</span>
                                                        <span className="text-slate-600 dark:text-slate-300 ml-1">{source.title}</span>
                                                        <span className="text-slate-400 dark:text-slate-500 ml-1 text-[10px]">({source.type})</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </details>
                                    )}

                                    {msg.file && (
                                        <div className="flex items-center gap-2 mt-2 bg-white/20 p-2 rounded-lg text-xs">
                                            <span className="material-symbols-outlined text-sm">description</span>
                                            {msg.file.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex gap-4 items-start animate-fade-in-up">
                                <div className="flex-none w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-blue-600 text-base">gavel</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 dark:border-slate-700">
                                    {statusMessage ? (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined animate-spin text-blue-500 text-sm">progress_activity</span>
                                            <span className="text-sm font-medium">{statusMessage}</span>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Suggested Prompts */}
                        {messages.length === 1 && !isTyping && (
                            <div className="mt-auto pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in-up">
                                <button
                                    onClick={() => setInput("What are the latest Supreme Court judgments on Section 138 of NI Act?")}
                                    className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm group"
                                >
                                    <div className="font-medium text-slate-900 dark:text-white text-sm mb-1 group-hover:text-blue-600 transition-colors">Section 138 of NI Act</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">Latest Supreme Court judgments summary</div>
                                </button>
                                <button
                                    onClick={() => setInput("Draft a Legal Notice for breach of contract under Indian Contract Act")}
                                    className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm group"
                                >
                                    <div className="font-medium text-slate-900 dark:text-white text-sm mb-1 group-hover:text-blue-600 transition-colors">Draft a Legal Notice</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">For breach of contract under Indian Contract Act</div>
                                </button>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* Footer / Input */}
                <footer className="flex-none bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 pb-6 pt-4 px-4 z-20">
                    <div className="max-w-3xl mx-auto w-full space-y-3">
                        {/* File Preview */}
                        {selectedFiles.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {selectedFiles.map((file, idx) => (
                                    <div key={`${file.name}-${idx}`} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 shadow-sm animate-slide-up">
                                        <span className="material-symbols-outlined text-red-500 text-base">picture_as_pdf</span>
                                        <span className="text-sm text-slate-700 dark:text-slate-200 max-w-[150px] truncate" title={file.name}>{file.name}</span>
                                        <button onClick={() => removeFile(idx)} className="hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full p-1 text-slate-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-base">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative flex items-end gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all p-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,application/pdf"
                                multiple
                                className="hidden"
                            />
                            <button
                                onClick={triggerFileSelect}
                                className="flex-none p-3 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Add attachment"
                                disabled={isUploading}
                            >
                                <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a legal question..."
                                rows={1}
                                className="flex-1 bg-transparent border-0 focus:ring-0 p-3 text-slate-900 dark:text-white placeholder-slate-400 resize-none max-h-48 overflow-y-auto outline-none shadow-none text-sm"
                                style={{ minHeight: '44px' }}
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                            />
                            {/* Deep Think Toggle Button */}
                            <button
                                onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
                                className={`flex-none flex items-center gap-1.5 px-3 py-2 mb-1 rounded-full text-xs font-medium transition-all duration-300 ${deepThinkEnabled
                                    ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                    }`}
                                title={deepThinkEnabled ? 'Deep Think enabled' : 'Enable Deep Think'}
                            >
                                <span className={`material-symbols-outlined text-sm transition-all duration-300 ${deepThinkEnabled ? 'animate-pulse' : ''
                                    }`}>
                                    psychology
                                </span>
                                <span className="hidden sm:inline">Deep Think</span>
                            </button>

                            <button
                                onClick={handleSend}
                                disabled={!input.trim() && selectedFiles.length === 0}
                                className={`flex-none p-3 rounded-full transition-all duration-200 ${input.trim() || selectedFiles.length > 0
                                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">send</span>
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                AI can make mistakes. Check important info.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Drafting Modal */}
            {isDraftingOpen && (
                <DraftingModal
                    isOpen={isDraftingOpen}
                    onClose={() => setIsDraftingOpen(false)}
                    initialPrompt={draftingPrompt}
                />
            )}
        </div>
    );
};

export default ResearchChat;

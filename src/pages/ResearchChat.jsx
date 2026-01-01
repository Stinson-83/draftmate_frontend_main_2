import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
// Using specific imports if needed, but switching to Material Symbols for UI icons
// keeping logo just in case, though mostly using icons now
import lawJuristLogo from '../assets/draftmate_logo.png';

// LLM options for dropdown
const LLM_OPTIONS = [
    { value: 'gemini-2.5-flash', label: 'Gemini Flash', description: 'Fast responses' },
    { value: 'gemini-2.5-pro', label: 'Gemini Pro', description: 'Advanced reasoning' },
    { value: 'gpt-4o', label: 'GPT-4o', description: 'OpenAI flagship' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & efficient' },
];

// Helper function to make [1], [2] and [Strategy, Section 2] citations clickable
const processCitations = (content, sources) => {
    if (!sources || sources.length === 0) return content;

    // 1. Handle numeric citations: [1], [2], etc.
    let processed = content;
    sources.forEach(source => {
        const pattern = new RegExp(`\\[${source.index}\\]`, 'g');
        const link = `[\\[${source.index}\\]](${source.url})`;
        processed = processed.replace(pattern, link);
    });

    // 2. Handle text-based citations: [Strategy, Section 2], [Case Law, Section 5, point 6]
    // Regex matches [Something, Something else] but avoids [1] or [1, 2] strictly numeric lists if possible
    // We look for at least one non-digit character to distinguish from numeric lists or simple refs.
    // Captures: [ (Source Name) , (Section/Details) ]
    const textCitationPattern = /\[([a-zA-Z\s]+),\s*([^\]]+)\]/g;

    processed = processed.replace(textCitationPattern, (match, sourceName, details) => {
        // Construct a special link format that CitationLink can parse
        // We use a custom protocol/format to pass the identifiers safely
        return `[${match}](citation://text?source=${encodeURIComponent(sourceName.trim())}&details=${encodeURIComponent(details.trim())})`;
    });

    return processed;
};

// Citation Link with professional hover tooltip
const CitationLink = ({ href, children, sources }) => {
    // 1. Check for Numeric Citation [1]
    const numericMatch = children?.toString().match(/^\[(\d+)\]$/);

    // 2. Check for Text Citation (via our custom protocol or just parsing text)
    // The href from processCitations will be "citation://text?..."
    const isTextCitation = href && href.startsWith('citation://');
    let source = null;
    let displayText = children;
    let citationDetails = '';

    if (numericMatch) {
        const citationIndex = parseInt(numericMatch[1]);
        source = sources?.find(s => s.index === citationIndex);
    } else if (isTextCitation) {
        try {
            const url = new URL(href);
            const sourceName = url.searchParams.get('source');
            citationDetails = url.searchParams.get('details');

            // ROBUST MATCHING LOGIC
            // 1. Try exact type match
            source = sources?.find(s => s.type?.toLowerCase() === sourceName?.toLowerCase());

            // 2. Fallback: Try if title contains the source name (e.g. "Strategy" in "Legal Strategy 2024.pdf")
            if (!source) {
                source = sources?.find(s => s.title?.toLowerCase().includes(sourceName?.toLowerCase()));
            }

            // 3. Fallback: Fuzzy type match (e.g. "Strategy Doc" vs "Strategy")
            if (!source) {
                source = sources?.find(s => s.type?.toLowerCase().includes(sourceName?.toLowerCase()));
            }

            // If we found a source, we use its URL. If not, we still render the nice badge but with no link or a safe fallback.
        } catch (e) {
            console.warn("Failed to parse citation URL", href);
        }
    }

    // Interactive element classes
    const baseClasses = "relative inline-block group/citation cursor-pointer";
    const linkClasses = "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold no-underline bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-all duration-200 border border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600";

    // If it's a known source, we link to it. If it's a just a text citation without a resolved source,
    // we just show the tooltip but correct visual style.
    const targetUrl = source ? source.url : undefined;

    return (
        <span className={baseClasses}>
            <a
                href={targetUrl}
                target={targetUrl ? "_blank" : undefined}
                rel={targetUrl ? "noopener noreferrer" : undefined}
                className={linkClasses}
                onClick={(e) => {
                    if (!targetUrl) e.preventDefault(); // Don't navigate if no URL
                }}
            >
                {displayText}
            </a>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover/citation:opacity-100 group-hover/citation:visible transition-all duration-200 z-50 pointer-events-none group-hover/citation:pointer-events-auto">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 min-w-[280px] max-w-[350px] backdrop-blur-sm">
                    {/* Header with type badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${(source?.type || 'Reference') === 'Case'
                                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                                : (source?.type || 'Reference') === 'Law'
                                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                            {source?.type || 'Source'}
                        </span>
                        {source?.index && <span className="text-blue-500 dark:text-blue-400 text-xs font-mono">[{source.index}]</span>}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-1 line-clamp-2">
                        {source ? source.title : "Citation Reference"}
                    </h4>

                    {/* Citation Details from Text (e.g. Section 2) */}
                    {citationDetails && (
                        <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded mt-1 mb-2 border border-yellow-100 dark:border-yellow-800/30">
                            📍 Refers to: <strong>{decodeURIComponent(citationDetails)}</strong>
                        </div>
                    )}

                    {/* Source Metadata Citation if available */}
                    {source?.citation && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
                            {source.citation}
                        </p>
                    )}

                    {/* Footer */}
                    {source ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                            Click to view full source
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <span className="material-symbols-outlined text-xs">link_off</span>
                            Source document not directly linked
                        </div>
                    )}
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                    <div className="border-8 border-transparent border-t-white dark:border-t-slate-800"></div>
                </div>
            </div>
        </span>
    );
};

const ResearchChat = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [statusMessage, setStatusMessage] = useState(''); // Streaming status
    const [selectedFile, setSelectedFile] = useState(null);
    const [sessionId, setSessionId] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Deep Think and LLM state
    const [deepThinkEnabled, setDeepThinkEnabled] = useState(false);
    const [selectedLLM, setSelectedLLM] = useState('gemini-2.5-flash');
    const [isLLMDropdownOpen, setIsLLMDropdownOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'ai',
            content: 'Hello! I am your advanced AI Legal Research Assistant. I can help you find relevant case laws, explain complex legal concepts, or draft research memos.\n\nHow can I assist you today?'
        }
    ]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Set page title
    useEffect(() => {
        document.title = 'AI Research | DraftMate';
    }, []);

    useEffect(() => {
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);

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
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() && !selectedFile) return;

        const currentInput = input;
        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: currentInput,
            file: selectedFile
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedFile(null);
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
                    },
                    onFollowups: (questions) => {
                        aiFollowups = questions;
                        // Update message with followups
                        setMessages(prev => prev.map(m =>
                            m.id === aiMsgId ? { ...m, followups: aiFollowups } : m
                        ));
                    },
                    onSources: (sources) => {
                        // Store sources for clickable citations
                        setMessages(prev => prev.map(m =>
                            m.id === aiMsgId ? { ...m, sources: sources } : m
                        ));
                    },
                    onDone: (event) => {
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
                            content: "I apologize, but I encountered an error. Please try again."
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

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!sessionId) {
                toast.error("Session not initialized. Please try again.");
                return;
            }
            setSelectedFile(file);
            setIsUploading(true);
            try {
                await api.uploadFile(file, sessionId);
                toast.success("File uploaded successfully!");
            } catch (error) {
                console.error("Upload error:", error);
                toast.error(`Failed to upload file: ${error.message}`);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } finally {
                setIsUploading(false);
            }
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Header */}
            <header className="flex-none bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/')}
                        aria-label="Go back"
                        className="mr-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">AI Legal Research</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Ask anything about Indian Law</p>
                        </div>
                    </div>
                </div>

                {/* LLM Switcher Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsLLMDropdownOpen(!isLLMDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md group"
                    >
                        <span className="material-symbols-outlined text-lg text-blue-600 dark:text-blue-400">smart_toy</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
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

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative flex flex-col bg-slate-50 dark:bg-slate-900">
                {/* Dot Pattern Background */}
                <div className="absolute inset-0 pointer-events-none opacity-50"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                ></div>

                <div className="relative z-0 flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
                    {/* Messages */}
                    {messages.map((msg, index) => (
                        <div key={msg.id} className={`flex gap-4 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
                            {/* Avatar */}
                            <div className={`flex-none w-10 h-10 rounded-full flex items-center justify-center shadow-sm overflow-hidden
                                ${msg.role === 'ai' ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700' : 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'}`}
                            >
                                {msg.role === 'ai' ? (
                                    <span className="material-symbols-outlined text-blue-600 text-xl">gavel</span>
                                ) : (
                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">person</span>
                                )}
                            </div>

                            {/* Bubble */}
                            <div className={`flex-1 max-w-[85%] p-6 rounded-2xl shadow-sm border leading-relaxed text-base
                                ${msg.role === 'ai'
                                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-tl-none text-slate-900 dark:text-slate-100'
                                    : 'bg-blue-600 text-white border-blue-600 rounded-tr-none'
                                }`}
                            >
                                <div className={`markdown-content ${msg.role === 'user' ? 'text-white' : ''}`}>
                                    <ReactMarkdown
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                            // Ensure lists and other elements are styled correctly within markdown
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-3" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-3" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1" {...props} />,
                                            code: ({ node, inline, ...props }) => (
                                                inline
                                                    ? <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                                                    : <pre className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg overflow-x-auto text-sm font-mono my-3"><code {...props} /></pre>
                                            ),
                                            strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                            // Style citation links with hover tooltip
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
                                {msg.role === 'ai' && index > 0 && messages[index - 1].role === 'user' && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                            onClick={() => navigate('/', {
                                                state: {
                                                    openDrafting: true,
                                                    prompt: `Draft the legal document required for: ${messages[index - 1].content || (messages[index - 1].file ? `the uploaded document ${messages[index - 1].file.name}` : 'this query')}. Focus on drafting the actual legal papers.`
                                                }
                                            })}
                                        >
                                            <span className="material-symbols-outlined text-sm">edit_document</span>
                                            Draft
                                        </button>
                                    </div>
                                )}
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
                                    <div className="flex items-center gap-2 mt-2 bg-white/20 p-2 rounded-lg text-sm">
                                        <span className="material-symbols-outlined text-sm">description</span>
                                        {msg.file.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator with Status Message */}
                    {isTyping && (
                        <div className="flex gap-4 items-start animate-fade-in-up">
                            <div className="flex-none w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-blue-600 text-xl">gavel</span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 dark:border-slate-700">
                                {statusMessage ? (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <span className="material-symbols-outlined animate-spin text-blue-500">progress_activity</span>
                                        <span className="text-sm font-medium">{statusMessage}</span>
                                    </div>
                                ) : (
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Suggested Prompts (Only show when only welcome message exists) */}
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
                <div className="max-w-4xl mx-auto w-full space-y-3">
                    {/* File Preview */}
                    {selectedFile && (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 w-fit shadow-sm animate-slide-up">
                            <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                            <span className="text-sm text-slate-700 dark:text-slate-200">{selectedFile.name}</span>
                            <button onClick={removeFile} className="hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full p-1 text-slate-400 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                    )}

                    <div className="relative flex items-end gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all p-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".pdf,application/pdf"
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
                            placeholder="Ask a legal question... (e.g., 'What are the latest Supreme Court judgments on Section 138 of NI Act?')"
                            rows={1}
                            className="flex-1 bg-transparent border-0 focus:ring-0 p-3 text-slate-900 dark:text-white placeholder-slate-400 resize-none max-h-48 overflow-y-auto outline-none shadow-none"
                            style={{ minHeight: '48px' }}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                        />
                        {/* Deep Think Toggle Button */}
                        <button
                            onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
                            className={`flex-none flex items-center gap-1.5 px-3 py-2 mb-1 rounded-full text-sm font-medium transition-all duration-300 ${deepThinkEnabled
                                ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                }`}
                            title={deepThinkEnabled ? 'Deep Think enabled - Advanced reasoning mode' : 'Enable Deep Think for detailed analysis'}
                        >
                            <span className={`material-symbols-outlined text-base transition-all duration-300 ${deepThinkEnabled ? 'animate-pulse' : ''
                                }`}>
                                psychology
                            </span>
                            <span className="hidden sm:inline">Deep Think</span>
                            {deepThinkEnabled && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            )}
                        </button>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={(!input.trim() && !selectedFile) || isUploading || isTyping}
                            className="flex-none p-2 mb-1 mr-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <span className="material-symbols-outlined text-xl group-hover:translate-x-0.5 transition-transform">send</span>
                        </button>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            AI can make mistakes. Please verify important information.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ResearchChat;

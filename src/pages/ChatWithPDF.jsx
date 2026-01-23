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

import DraftingModal from '../components/DraftingModal';

// LLM options for dropdown
const LLM_OPTIONS = [
    { value: 'gemini-2.5-flash', label: 'Fast', description: 'High speed responses' },
    { value: 'gemini-2.5-pro', label: 'Advanced', description: 'Deep reasoning & analysis' },
    { value: 'gpt-4o', label: 'Reasoning', description: 'Complex problem solving' },
    { value: 'gpt-4o-mini', label: 'Fast & Efficient', description: 'Balanced performance' },
];

const ChatWithPDF = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [statusMessage, setStatusMessage] = useState(''); // Streaming status
    const [selectedFile, setSelectedFile] = useState(null);
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
        document.title = 'Chat with PDF | DraftMate';
    }, []);

    // Fetch Sessions
    const fetchSessions = async () => {
        try {
            setIsLoadingSessions(true);
            const data = await api.getSessions();
            // Filter sessions if needed, or just show all. 
            // For now, showing all sessions is fine, but we might want to tag them as "PDF Chat" later.
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

        const storedSessionId = localStorage.getItem('last_pdf_chat_session_id');
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
                content: 'Hello! I am your PDF Assistant. Please upload a PDF document to get started. I can answer questions, summarize content, and help you analyze the document.'
            }
        ]);
        localStorage.setItem('last_pdf_chat_session_id', newId);
        setSelectedFile(null);
        window.history.replaceState({}, '', '/dashboard/chat-pdf');
    };

    const loadSession = async (id) => {
        try {
            setSessionId(id);
            localStorage.setItem('last_pdf_chat_session_id', id);

            const data = await api.getSessionHistory(id);
            if (data.messages && data.messages.length > 0) {
                const formattedMessages = data.messages.map((msg, idx) => ({
                    id: msg.id || idx,
                    role: msg.role === 'assistant' ? 'ai' : msg.role,
                    content: msg.content,
                    sources: msg.metadata?.sources,
                }));
                setMessages(formattedMessages);
            } else {
                setMessages([
                    {
                        id: 1,
                        role: 'ai',
                        content: 'Hello! I am your PDF Assistant. Please upload a PDF document to get started.'
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
        // Enforce file upload for the first message if not already present in session
        // Note: The backend checks session cache for file. 
        // Ideally we should track if a file is associated with this session.
        // For now, we'll rely on the user having uploaded a file or the session having one.

        if (!input.trim()) return;

        const currentInput = input;
        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: currentInput,
            file: selectedFile
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        // Don't clear selectedFile here, as we might want to keep showing it as "active context"
        // But for the chat message logic, we pass it once.
        // Actually, let's keep it selected in UI to show what we are chatting about.

        setIsTyping(true);
        setStatusMessage('');

        const aiMsgId = Date.now() + 1;
        let aiContent = '';

        try {
            // Normal mode: Use streaming /chat/stream
            await api.chatStream(currentInput, sessionId, {
                onStatus: (message) => {
                    setStatusMessage(message);
                },
                onToken: (chunk, accumulated) => {
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
                    setMessages(prev => {
                        const existing = prev.find(m => m.id === aiMsgId);
                        if (existing) {
                            return prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m);
                        } else {
                            return [...prev, { id: aiMsgId, role: 'ai', content: aiContent }];
                        }
                    });
                    fetchSessions();
                },
                onDone: (event) => {
                    console.log("Stream done:", event);
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
        } catch (error) {
            console.error("Chat error:", error);
            if (!aiContent) {
                setMessages(prev => [...prev, {
                    id: aiMsgId,
                    role: 'ai',
                    content: "I apologize, but I encountered an error connecting to the server."
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
                // Add system message
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'system',
                    content: `File uploaded: ${file.name}`
                }]);
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
            <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-none bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 overflow-hidden border-r border-slate-800`}>
                <div className="p-4 flex-none">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        <span className="text-sm font-medium">New PDF Chat</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-6">
                    {isLoadingSessions ? (
                        <div className="flex justify-center py-4">
                            <span className="material-symbols-outlined animate-spin text-slate-500">progress_activity</span>
                        </div>
                    ) : (
                        Object.entries(sessionGroups).map(([group, groupSessions]) => (
                            groupSessions.length > 0 && (
                                <div key={group}>
                                    <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{group}</h3>
                                    <div className="space-y-1">
                                        {groupSessions.map(session => (
                                            <button
                                                key={session.session_id}
                                                onClick={() => loadSession(session.session_id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${sessionId === session.session_id
                                                    ? 'bg-slate-800 text-white'
                                                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
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
                            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-white text-lg">picture_as_pdf</span>
                            </div>
                            <h1 className="text-base font-semibold text-slate-900 dark:text-white hidden sm:block">Chat with PDF</h1>
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
                                    ${msg.role === 'ai' ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700' :
                                        msg.role === 'system' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100' :
                                            'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'}`}
                                >
                                    {msg.role === 'ai' ? (
                                        <span className="material-symbols-outlined text-red-600 text-base">picture_as_pdf</span>
                                    ) : msg.role === 'system' ? (
                                        <span className="material-symbols-outlined text-yellow-600 text-base">info</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-base">person</span>
                                    )}
                                </div>

                                {/* Bubble */}
                                <div className={`flex-1 max-w-[90%] p-4 rounded-2xl shadow-sm border leading-relaxed text-sm
                                    ${msg.role === 'ai'
                                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-tl-none text-slate-900 dark:text-slate-100'
                                        : msg.role === 'system'
                                            ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
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
                                                    ) : (
                                                        <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                }
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex gap-4 items-start animate-fade-in-up">
                                <div className="flex-none w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-red-600 text-base">picture_as_pdf</span>
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

                        {/* Empty State / Upload Prompt */}
                        {messages.length === 1 && !isTyping && !selectedFile && (
                            <div className="mt-8 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-blue-600 text-3xl">upload_file</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Upload a PDF to Chat</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                                    Upload a legal document, contract, or case file to ask questions, summarize, or analyze its content.
                                </p>
                                <button
                                    onClick={triggerFileSelect}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    Select PDF File
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
                        {selectedFile && (
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 w-fit shadow-sm animate-slide-up">
                                <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                                <span className="text-sm text-slate-700 dark:text-slate-200">{selectedFile.name}</span>
                                <button onClick={() => setSelectedFile(null)} className="hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full p-1 text-slate-400 hover:text-red-500 transition-colors">
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
                                placeholder={selectedFile ? "Ask questions about this document..." : "Upload a file to start chatting..."}
                                rows={1}
                                className="flex-1 bg-transparent border-0 focus:ring-0 p-3 text-slate-900 dark:text-white placeholder-slate-400 resize-none max-h-48 overflow-y-auto outline-none shadow-none text-sm"
                                style={{ minHeight: '44px' }}
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                disabled={!selectedFile && messages.length <= 1} // Disable input until file is uploaded (unless continuing session)
                            />

                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || (!selectedFile && messages.length <= 1)}
                                className={`flex-none p-3 rounded-full transition-all duration-200 ${input.trim() && (selectedFile || messages.length > 1)
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

export default ChatWithPDF;

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
// Using specific imports if needed, but switching to Material Symbols for UI icons
// keeping logo just in case, though mostly using icons now
import lawJuristLogo from '../assets/draftmate_logo.png';

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

    useEffect(() => {
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
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

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Header */}
            <header className="flex-none bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center shadow-sm z-10">
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
                                            strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />
                                        }}
                                    >
                                        {msg.content}
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

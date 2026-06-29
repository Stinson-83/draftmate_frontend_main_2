import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

const LLM_OPTIONS = [
    { value: 'gemini-2.5-flash', label: 'Fast', description: 'High speed responses' },
    { value: 'gemini-2.5-pro', label: 'Advanced', description: 'Deep reasoning & analysis' },
    { value: 'gpt-4o', label: 'Reasoning', description: 'Complex problem solving' },
    { value: 'gpt-4o-mini', label: 'Fast & Efficient', description: 'Balanced performance' },
];

const NODE_LABELS = {
    'memory_recall': 'Reviewing your past instructions',
    'router': 'Understanding your query',
    'research_agent': 'Gathering preliminary legal facts',
    'document_agent': 'Scanning your uploaded documents',
    'law_agent': 'Identifying relevant statutory provisions',
    'case_agent': 'Searching Supreme & High Court precedents',
    'citation_agent': 'Verifying case citations',
    'strategy_agent': 'Formulating legal strategy',
    'explainer_agent': 'Breaking down complex legal terms',
    'manager_aggregate': 'Synthesizing the final answer',
    'memory_store': 'Committing insights to memory'
};

const ResearchProgressTimeline = ({ activeNodes }) => {
    const stages = [
        { id: 'router', label: 'Analyzing Query' },
        { id: 'research_agent', label: 'Gathering Facts' },
        { id: 'citation_agent', label: 'Verifying Citations' },
        { id: 'manager_aggregate', label: 'Compiling Research' }
    ];

    return (
        <div className="bg-white border border-blue-100 rounded-2xl p-6 mb-6 shadow-[0_4px_20px_rgba(37,99,235,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    Autonomous Research Pipeline
                </h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">LIVE</span>
            </div>
            <div className="flex items-center justify-between w-full overflow-x-auto pb-2 scrollbar-hide">
                {stages.map((stage, idx) => {
                    const isCompleted = activeNodes.some(n => n.node === stage.id && n.status === 'completed');
                    const isRunning = activeNodes.some(n => n.node === stage.id && n.status === 'running');

                    return (
                        <React.Fragment key={stage.id}>
                            <div className="flex flex-col items-center gap-2 min-w-[90px] shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                                    isRunning ? 'border-blue-500 text-blue-500 animate-pulse' : 'border-slate-200 text-slate-300'
                                    }`}>
                                    {isCompleted ? <span className="material-symbols-outlined text-sm">check</span> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                                </div>
                                <span className={`text-[10px] font-bold text-center whitespace-nowrap ${isRunning ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {stage.label}
                                </span>
                            </div>
                            {idx < stages.length - 1 && <div className={`h-[2px] flex-1 min-w-[30px] mx-2 transition-colors duration-500 ${isCompleted ? 'bg-blue-600' : 'bg-slate-100'}`} />}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

/* ── Enhancement 2: Simulated Sub-Queries ── */
const SubQueryTasks = ({ isTyping, input }) => {
    if (!isTyping || !input) return null;
    const mockTasks = [
        `Analyzing primary legal issues in: "${input.substring(0, 30)}..."`,
        "Fetching relevant Section-wise statutory interpretations",
        "Cross-referencing High Court vs Supreme Court precedents",
        "Identifying procedural requirements and limitation periods"
    ];

    return (
        <div className="space-y-2 mb-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase ml-1">Research Tasks Identified</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mockTasks.map((task, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                        key={i} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3 shadow-sm"
                    >
                        <div className="w-5 h-5 bg-blue-50 text-blue-600 rounded flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xs">search</span>
                        </div>
                        <span className="text-xs text-slate-600 font-medium truncate">{task}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const ResearchChat = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const hasInitializedRef = useRef(false); // Prevents StrictMode double-init
    const isStreamingRef = useRef(false);    // True while bot is responding
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [statusMessage, setStatusMessage] = useState(''); // Streaming status
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [activeNodes, setActiveNodes] = useState([]); // Execution steps tracking
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
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Set page title
    useEffect(() => {
        document.title = 'AI Research | DraftMate';
    }, []);

    // Original Fetch Sessions
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

    // Mock Fetch Sessions
    // const fetchSessions = async () => {
    //     setIsLoadingSessions(true);
    //     setTimeout(() => {
    //         setSessions([
    //             { session_id: 'mock-1', title: 'Supreme Court Guidelines on Bail', created_at: new Date().toISOString() },
    //             { session_id: 'mock-2', title: 'Section 138 NI Act Dispute', created_at: new Date(Date.now() - 86400000).toISOString() }, // Yesterday
    //             { session_id: 'mock-3', title: 'Corporate Merger Due Diligence', created_at: new Date(Date.now() - 86400000 * 3).toISOString() } // 3 days ago
    //         ]);
    //         setIsLoadingSessions(false);
    //     }, 800);
    // };

    // Initialize
    useEffect(() => {
        // hasInitializedRef prevents React StrictMode's double-invocation from
        // calling loadSession after startNewChat already ran — which would race
        // with the user's first message and wipe it from state.
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

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

    // const startNewChat = () => {
    //     const newId = crypto.randomUUID();
    //     setSessionId(newId);
    //     setMessages([
    //         {
    //             id: 1,
    //             role: 'ai',
    //             content: 'Hello! I am your advanced AI Legal Research Assistant. I can help you find relevant case laws, explain complex legal concepts, or draft research memos.\n\nHow can I assist you today?'
    //         }
    //     ]);
    //     localStorage.setItem('last_chat_session_id', newId);
    //     // Optionally clear URL param
    //     window.history.replaceState({}, '', '/research');
    // };

    const startNewChat = () => {
        const newId = crypto.randomUUID();
        setSessionId(newId);
        setMessages([{
            id: 1,
            role: 'ai',
            content: 'Hello! I am your advanced AI Legal Research Assistant. I can help you find relevant case laws, explain complex legal concepts, or draft research memos.\n\nHow can I assist you today?',
            isIntro: true,
            followups: [
                "What are the latest Supreme Court judgments on Section 138 of NI Act?",
                "Draft a Legal Notice for breach of contract.",
                "Summarize the key provisions of the Digital Personal Data Protection Act, 2023."
            ]
        }]);

        localStorage.setItem('last_chat_session_id', newId);
        // Optionally clear URL param
        window.history.replaceState({}, '', '/research');
    };

    const loadSession = async (id) => {
        try {
            setSessionId(id);
            localStorage.setItem('last_chat_session_id', id);

            const data = await api.getSessionHistory(id);

            // Don't overwrite messages if the user has already sent a message
            // and the bot is currently responding — that would wipe their message.
            if (isStreamingRef.current) return;

            if (data.messages && data.messages.length > 0) {
                // Map backend messages to frontend format
                const formattedMessages = data.messages.map((msg, idx) => ({
                    id: msg.id || idx,
                    role: msg.role === 'assistant' ? 'ai' : msg.role,
                    content: msg.content,
                    sources: msg.metadata?.sources,
                }));
                setMessages(formattedMessages);
            } else {
                setMessages([{
                    id: 1,
                    role: 'ai',
                    content: 'Hello! I am your advanced AI Legal Research Assistant. I can help you find relevant case laws, explain complex legal concepts, or draft research memos.\n\nHow can I assist you today?',
                    isIntro: true,
                    followups: [
                        "What are the latest Supreme Court judgments on Section 138 of NI Act?",
                        "Draft a Legal Notice for breach of contract.",
                        "Summarize the key provisions of the Digital Personal Data Protection Act, 2023."
                    ]
                }]);
            }
        } catch (error) {
            console.error("Failed to load session:", error);
            toast.error("Failed to load chat");
            if (!isStreamingRef.current) startNewChat();
        }
    };

    // Original Handle send
    const handleSend = async () => {
        if (!input.trim() && selectedFiles.length === 0) return;
        if (isStreamingRef.current) return; // Prevent concurrent sends

        isStreamingRef.current = true;
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
        setActiveNodes([]);

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
                    onNodeUpdate: (event) => {
                        const { node, status } = event;
                        setActiveNodes(prev => {
                            const existingIdx = prev.findIndex(n => n.node === node);
                            if (existingIdx !== -1) {
                                const newNodes = [...prev];
                                newNodes[existingIdx] = { ...newNodes[existingIdx], status };
                                return newNodes;
                            }
                            return [...prev, { node, label: NODE_LABELS[node] || node, status, content: '' }];
                        });
                    },
                    onNodeStream: (event) => {
                        const { node, chunk } = event;
                        setActiveNodes(prev => {
                            const existingIdx = prev.findIndex(n => n.node === node);
                            if (existingIdx !== -1) {
                                const newNodes = [...prev];
                                const currentContent = newNodes[existingIdx].content || '';
                                newNodes[existingIdx] = {
                                    ...newNodes[existingIdx],
                                    content: currentContent + chunk
                                };
                                return newNodes;
                            }
                            return prev;
                        });
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
            isStreamingRef.current = false;
            setIsTyping(false);
            setStatusMessage('');
        }
    };

    // // Mock Handle send
    // const handleSend = async () => {
    //     if (!input.trim() && selectedFiles.length === 0) return;
    //     if (isStreamingRef.current) return;

    //     isStreamingRef.current = true;
    //     const currentInput = input;
    //     const userMsg = {
    //         id: Date.now(),
    //         role: 'user',
    //         content: currentInput,
    //         file: selectedFiles
    //     };

    //     setMessages(prev => [...prev, userMsg]);
    //     setInput('');
    //     setSelectedFiles([]);
    //     setIsTyping(true);
    //     setActiveNodes([]);

    //     const aiMsgId = Date.now() + 1;
    //     let aiContent = '';

    //     // Add an empty AI message block to the UI
    //     setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: '' }]);

    //     // Helper to simulate network delay
    //     const delay = (ms) => new Promise(res => setTimeout(res, ms));

    //     try {
    //         // --- SIMULATE AUTONOMOUS PIPELINE ---

    //         // 1. Analyzing Query
    //         // --- SIMULATE AUTONOMOUS PIPELINE (Sequential) ---

    //        // 1. Analyzing Query
    //         setActiveNodes([{ node: 'router', label: 'Analyzing Query', status: 'running' }]);
    //         await delay(800);

    //         // 2. Gathering Facts
    //         setActiveNodes([
    //             { node: 'router', label: 'Analyzing Query', status: 'completed' },
    //             { node: 'research_agent', label: 'Gathering Facts', status: 'running' }
    //         ]);
    //         await delay(800);

    //         // 3. Verifying Citations
    //         setActiveNodes([
    //             { node: 'router', label: 'Analyzing Query', status: 'completed' },
    //             { node: 'research_agent', label: 'Gathering Facts', status: 'completed' },
    //             { node: 'citation_agent', label: 'Verifying Citations', status: 'running' }
    //         ]);
    //         await delay(800);

    //         // --- SIMULATE TEXT STREAMING --- 
    //         const dummyResponse = "Based on the recent Supreme Court jurisprudence, the right to privacy is recognized as a fundamental right under Article 21 of the Constitution.\n\nFurthermore, regarding your query, the court has consistently held that procedural delays can be condoned if sufficient cause is shown by the applicant.\n\n### Key Takeaways:\n* The limitation period is strictly construed.\n* Condonation of delay requires documented proof.";

    //         const chunks = dummyResponse.split(' ');
    //         for (let i = 0; i < chunks.length; i++) {
    //             aiContent += chunks[i] + ' ';
    //             setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m));
    //             await delay(40); // 40ms per word simulates fast streaming
    //         }

    //         // 4. Compiling Research (Final Stage)
    //         setActiveNodes(prev => prev.map(n => n.node === 'citation_agent' ? { ...n, status: 'completed' } : n));
    //         setActiveNodes(prev => [...prev, { node: 'manager_aggregate', label: 'Compiling Research', status: 'running' }]);
    //         await delay(1000);

    //         // --- INJECT CITATIONS & FOLLOW-UPS (Enhancements 5 & 7) ---
    //         setMessages(prev => prev.map(m => m.id === aiMsgId ? {
    //             ...m,
    //             sources: [
    //                 { index: 1, title: 'K.S. Puttaswamy v. Union of India (2017)', type: 'Supreme Court', url: '#' },
    //                 { index: 2, title: 'Limitation Act, 1963 (Section 5)', type: 'Statute', url: '#' }
    //             ],
    //             followups: [
    //                 "What constitutes 'sufficient cause' for condonation of delay?",
    //                 "Are there recent High Court judgments conflicting with this?",
    //                 "Draft an application for condonation of delay."
    //             ]
    //         } : m));

    //     } catch (error) {
    //         console.error("Mock Chat error:", error);
    //     } finally {
    //         // Clean up states
    //         isStreamingRef.current = false;
    //         setIsTyping(false);
    //         setActiveNodes([]);
    //     }
    // };

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
        <div className="flex w-full h-full min-h-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans overflow-hidden text-slate-900 dark:text-slate-100">

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
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm truncate transition-all flex items-center gap-3 border ${sessionId === session.session_id
                                                    ? 'bg-blue-50 border-blue-100 text-blue-700 shadow-sm font-bold'
                                                    : 'hover:bg-slate-100 border-transparent text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                <span className={`material-symbols-outlined text-lg ${sessionId === session.session_id ? 'text-blue-600' : 'text-slate-400'}`}>
                                                    {sessionId === session.session_id ? 'chat_bubble' : 'history'}
                                                </span>
                                                {session.title || "New Research Chat"}
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
            <div className="flex-1 flex flex-col h-full min-h-0 relative">

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
                    {/* <div className="relative">
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
                    </div> */}
                </header>

                {/* Messages Area */}
                <main className="flex-1 overflow-y-auto relative flex flex-col min-h-0 bg-[#F8FAFF]">
                    <div className="relative z-0 flex-1 w-full max-w-4xl mx-auto px-4 pt-6 pb-24 flex flex-col gap-6 min-h-0">

                        {/* Messages */}
                        {messages.map((msg) => {
                            return (
                                <div key={msg.id} className={`flex gap-6 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up w-full`}>

                                    {/* Avatar */}
                                    <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 overflow-hidden ${msg.role === 'ai' ? 'bg-blue-50 border border-blue-100' : 'bg-[#0F1C2E] text-white'}`}>
                                        {msg.role === 'ai' ? (
                                            <img src="/logo.png" alt="DraftMate" className="w-5 h-5 object-contain" />
                                        ) : (
                                            <span className="material-symbols-outlined text-[18px]">person</span>
                                        )}
                                    </div>

                                    {/* Bubble / Content */}
                                    {msg.role === 'user' ? (
                                        <div className="max-w-[80%] px-6 py-4 rounded-[24px] bg-[#0F1C2E] text-white rounded-tr-sm shadow-md text-[15px] leading-relaxed whitespace-pre-wrap">
                                            {msg.content}
                                        </div>
                                    ) : (
                                        <div className="flex-1 min-w-0 text-[15px] leading-relaxed text-[#0F1C2E] pt-1.5">

                                            {/* Citation Confidence Pills */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100">
                                                        <span className="material-symbols-outlined text-xs">verified</span>
                                                        {msg.sources.length} Verified Citations
                                                    </span>
                                                </div>
                                            )}

                                            {/* Markdown Content */}
                                            <div className="markdown-content">
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

                                            {/* Completion Actions */}
                                            {!isTyping && msg.content && !msg.isIntro && (
                                                <div className="mt-5 flex items-center gap-4 pt-2">
                                                    <button className="flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors text-[11px] font-bold uppercase">
                                                        <span className="material-symbols-outlined text-sm">thumb_up</span>
                                                    </button>
                                                    <button className="flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors text-[11px] font-bold uppercase">
                                                        <span className="material-symbols-outlined text-sm">thumb_down</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied to clipboard") }}
                                                        className="flex items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors text-[11px] font-bold uppercase"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">content_copy</span> Copy
                                                    </button>
                                                </div>
                                            )}

                                            {/* Follow-up Suggestions */}
                                            {msg.followups && msg.followups.length > 0 && (
                                                <div className="mt-5 space-y-2 pt-4 border-t border-slate-100/60 w-full max-w-2xl">
                                                    {msg.followups.map((question, qIdx) => (
                                                        <button
                                                            key={qIdx}
                                                            onClick={() => setInput(question)}
                                                            className="w-full text-left px-4 py-2.5 text-[13px] text-slate-600 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center justify-between group shadow-sm leading-snug"
                                                        >
                                                            {question}
                                                            <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">send</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        

                        {/* Typing / Pipeline Status */}
                        {isTyping && activeNodes.length === 0 && (
                            <div className="flex gap-4 items-start animate-fade-in-up w-full">
                                <div className="flex-none w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                </div>
                                <div className="pt-1.5 flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* Footer / Input */}
                <footer className="flex-none bg-gradient-to-t from-[#F8FAFF] via-[#F8FAFF] to-transparent pb-6 pt-8 px-4 z-20 relative">
                    <div className="max-w-4xl mx-auto w-full">

                        {/* Progress Timeline & Tasks UI */}
                        {isTyping && <ResearchProgressTimeline activeNodes={activeNodes} />}
                        {isTyping && <SubQueryTasks isTyping={isTyping} input={input} />}

                        {/* File Preview */}
                        {selectedFiles.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {selectedFiles.map((file, idx) => (
                                    <div key={`${file.name}-${idx}`} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm animate-slide-up">
                                        <span className="material-symbols-outlined text-red-500 text-base">picture_as_pdf</span>
                                        <span className="text-sm text-slate-700 max-w-[150px] truncate">{file.name}</span>
                                        <button onClick={() => removeFile(idx)} className="hover:bg-slate-100 rounded-full p-1 text-slate-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-base">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative flex items-end gap-2 bg-white border border-slate-200 rounded-[28px] shadow-lg shadow-slate-200/40 focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-300 transition-all p-2 pl-3">

                            {/* Plus Menu (Dropdown logic) */}
                            <div className="relative mb-1">
                                <button
                                    onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                                    className={`flex-none p-2 rounded-full transition-colors ${isPlusMenuOpen ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                >
                                    <span className={`material-symbols-outlined text-2xl transition-transform duration-200 ${isPlusMenuOpen ? 'rotate-45' : ''}`}>
                                        add_circle
                                    </span>
                                </button>

                                {isPlusMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsPlusMenuOpen(false)} />
                                        <div className="absolute bottom-full left-0 mb-3 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in-up">
                                            <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors">
                                                <span className="material-symbols-outlined text-lg">manage_search</span> Add Research
                                            </button>
                                            <button onClick={() => { setIsPlusMenuOpen(false); setIsDraftingOpen(true); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors">
                                                <span className="material-symbols-outlined text-lg">edit_document</span> Add Drafting
                                            </button>
                                            <button onClick={() => { setIsPlusMenuOpen(false); triggerFileSelect(); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors">
                                                <span className="material-symbols-outlined text-lg">upload_file</span> Add Document
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a legal question..."
                                rows={1}
                                className="flex-1 bg-transparent border-0 focus:ring-0 p-3 text-[#0F1C2E] placeholder-slate-400 resize-none max-h-48 overflow-y-auto outline-none text-base font-medium"
                                style={{ minHeight: '48px' }}
                            />

                            {/* Dynamic Model & Thinking Selector */}
                            <div className="relative mb-1.5 flex items-center">
                                <button
                                    onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold transition-colors mr-2 whitespace-nowrap"
                                >
                                    {LLM_OPTIONS.find(o => o.value === selectedLLM)?.label || 'Fast'} • {deepThinkEnabled ? 'Extended' : 'Standard'}
                                    <span className={`material-symbols-outlined text-[14px] transition-transform ${isModelSelectorOpen ? 'rotate-180' : ''}`}>expand_less</span>
                                </button>

                                {isModelSelectorOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsModelSelectorOpen(false)} />
                                        <div className="absolute bottom-full right-0 mb-3 w-64 bg-[#1E1E1E] text-white rounded-2xl shadow-2xl p-2 z-50 animate-fade-in-up border border-[#333]">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Models</div>
                                            {LLM_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => { handleLLMChange(opt.value); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#333] transition-colors"
                                                >
                                                    <span className={`material-symbols-outlined text-[18px] ${selectedLLM === opt.value ? 'text-blue-400' : 'text-transparent'}`}>check</span>
                                                    <div>
                                                        <div className="text-sm font-semibold">{opt.label}</div>
                                                        <div className="text-xs text-slate-400">{opt.description}</div>
                                                    </div>
                                                </button>
                                            ))}

                                            <div className="h-px bg-[#333] my-2" />

                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Thinking Level</div>
                                            <button
                                                onClick={() => { setDeepThinkEnabled(false); setIsModelSelectorOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#333] transition-colors"
                                            >
                                                <span className={`material-symbols-outlined text-[18px] ${!deepThinkEnabled ? 'text-blue-400' : 'text-transparent'}`}>check</span>
                                                <div>
                                                    <div className="text-sm font-semibold">Standard</div>
                                                    <div className="text-xs text-slate-400">Best for most questions</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => { setDeepThinkEnabled(true); setIsModelSelectorOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#333] transition-colors"
                                            >
                                                <span className={`material-symbols-outlined text-[18px] ${deepThinkEnabled ? 'text-blue-400' : 'text-transparent'}`}>check</span>
                                                <div>
                                                    <div className="text-sm font-semibold">Extended</div>
                                                    <div className="text-xs text-slate-400">Complex problem solving</div>
                                                </div>
                                            </button>
                                        </div>
                                    </>
                                )}

                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() && selectedFiles.length === 0}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shrink-0 ${input.trim() || selectedFiles.length > 0 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 text-slate-300'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">{isTyping ? 'hourglass_top' : 'arrow_upward'}</span>
                                </button>
                            </div>

                            {/* Hidden file input for triggers */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,application/pdf"
                                multiple
                                className="hidden"
                            />
                        </div>
                        <div className="text-center mt-3">
                            <p className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1.5">
                                <span className="material-symbols-outlined text-[12px]">info</span> AI can make mistakes. Always verify outputs before relying on them.
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

import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, User, Bot, Plus, X, FileText } from 'lucide-react';
import lawJuristLogo from '../assets/law_jurist_logo.png';

const ResearchChat = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [sessionId, setSessionId] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'ai',
            content: 'Hello! I am your advanced AI Legal Research Assistant. I can help you find relevant case laws, explain complex legal concepts, or draft research memos. How can I assist you today?'
        }
    ]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Generate a simplified session ID or use a UUID library if available.
        // Using crypto.randomUUID() which is supported in modern browsers.
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() && !selectedFile) return;

        const currentInput = input; // Capture input before clearing

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

        // Real API Call
        try {
            const response = await api.chat(currentInput, sessionId);

            const aiMsg = {
                id: Date.now() + 1,
                role: 'ai',
                content: response.answer,
                complexity: response.complexity,
                agents: response.agents_used
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg = {
                id: Date.now() + 1,
                role: 'ai',
                content: "I apologize, but I encountered an error connecting to the server. Please ensure the backend is running."
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
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
            // Optimistically set selected file
            setSelectedFile(file); // Keep the file object for preview

            setIsUploading(true);
            try {
                await api.uploadFile(file, sessionId);
                // toast.success("File context added!"); // Optional: Add toast notification
            } catch (error) {
                console.error("Upload error:", error);
                alert("Failed to upload file to the knowledge base.");
                setSelectedFile(null); // Revert selection on error
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
        <div className="research-chat-container">
            {/* Header */}
            <div className="chat-header-main glass-panel">
                <button
                    className="back-btn"
                    onClick={() => navigate('/')}
                    title="Back to Dashboard"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="header-info">
                    <div className="icon-badge">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h1>AI Legal Research</h1>
                        <p>Ask anything about Indian Law</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-viewport">
                <div className="messages-list">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message-row ${msg.role}`}>
                            <div className="avatar">
                                {msg.role === 'ai' ? (
                                    <img src={lawJuristLogo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                            <div className="message-bubble glass-panel">
                                <p>{msg.content}</p>
                                {msg.file && (
                                    <div className="message-file-attachment">
                                        <FileText size={16} />
                                        <span>{msg.file.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="message-row ai">
                            <div className="avatar">
                                <img src={lawJuristLogo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div className="message-bubble glass-panel typing">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="input-section glass-panel">
                {selectedFile && (
                    <div className="file-preview-container">
                        <div className="file-preview">
                            <FileText size={16} className="file-icon" />
                            <span className="file-name">{selectedFile.name} {isUploading && "(Uploading...)"}</span>
                            <button
                                className="remove-file-btn"
                                onClick={removeFile}
                                disabled={isUploading}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}
                <div className="input-container">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                    />
                    <button
                        className="attach-btn"
                        onClick={triggerFileSelect}
                        title="Upload PDF"
                        disabled={isUploading}
                    >
                        <Plus size={20} />
                    </button>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a legal question... (e.g., 'What are the latest Supreme Court judgments on Section 138 of NI Act?')"
                        rows={1}
                        disabled={isUploading || isTyping}
                    />
                    <button
                        className="send-btn-main"
                        onClick={handleSend}
                        disabled={(!input.trim() && !selectedFile) || isUploading || isTyping}
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div className="disclaimer">
                    AI can make mistakes. Please verify important information.
                </div>
            </div>

            {/* Styles for this page */}
            <style>{`
                .research-chat-container {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #f8fafc; /* Light background */
                    position: relative;
                }

                .glass-panel {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                /* Header */
                .chat-header-main {
                    padding: 16px 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    z-index: 10;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }

                .back-btn {
                    padding: 8px;
                    border-radius: 50%;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .back-btn:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                }

                .header-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .header-info .icon-badge {
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    color: white;
                    padding: 10px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .header-info h1 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #0f172a;
                    margin: 0;
                }

                .header-info p {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin: 0;
                }

                /* Chat Port */
                .chat-viewport {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    /* Background Pattern for premium feel */
                    background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
                    background-size: 24px 24px;
                }

                .messages-list {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding-bottom: 24px;
                }

                .message-row {
                    display: flex;
                    gap: 16px;
                    max-width: 85%;
                }

                .message-row.user {
                    align-self: flex-end;
                    flex-direction: row-reverse;
                }

                .message-row.ai {
                    align-self: flex-start;
                }

                .avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .message-row.ai .avatar {
                    background: transparent;
                    color: #4f46e5;
                    overflow: hidden;
                }

                .message-row.user .avatar {
                    background: #f0fdf4;
                    color: #16a34a;
                }

                .message-bubble {
                    padding: 16px 20px;
                    border-radius: 20px;
                    font-size: 1rem;
                    line-height: 1.6;
                    color: #334155;
                }

                .message-file-attachment {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 0.875rem;
                }

                .message-row.user .message-bubble {
                    background: #4f46e5;
                    color: white;
                    border-radius: 20px 20px 4px 20px;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
                }

                .message-row.ai .message-bubble {
                    background: white;
                    border-radius: 20px 20px 20px 4px;
                }

                /* Input Section */
                .input-section {
                    padding: 24px;
                    border-top: 1px solid rgba(0,0,0,0.05);
                    z-index: 10;
                }

                .input-container {
                    max-width: 900px;
                    margin: 0 auto;
                    position: relative;
                    background: white;
                    border-radius: 24px;
                    padding: 8px 12px 8px 12px;
                    display: flex;
                    align-items: center;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    transition: all 0.2s;
                }

                .input-container:focus-within {
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
                }

                .input-container textarea {
                    flex: 1;
                    border: none !important;
                    background: transparent !important;
                    font-size: 1rem;
                    padding: 8px 12px;
                    resize: none;
                    max-height: 120px;
                    outline: none !important;
                    box-shadow: none !important;
                    font-family: inherit;
                    -webkit-appearance: none;
                }

                .send-btn-main {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #4f46e5;
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-left: 12px;
                }

                .send-btn-main:hover:not(:disabled) {
                    transform: scale(1.05);
                    background: #4338ca;
                }

                .send-btn-main:disabled {
                    background: #cbd5e1;
                    cursor: not-allowed;
                }

                .attach-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: transparent;
                    color: #64748b;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .attach-btn:hover {
                    background: #f1f5f9;
                    color: #4f46e5;
                }

                .file-preview-container {
                    max-width: 900px;
                    margin: 0 auto 12px;
                    animation: slideUp 0.2s ease-out;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .file-preview {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: white;
                    padding: 8px 12px;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    color: #334155;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }

                .file-icon {
                    color: #ef4444; /* PDF color usually red-ish */
                }

                .remove-file-btn {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    margin-left: 4px;
                }

                .remove-file-btn:hover {
                    background: #f1f5f9;
                    color: #ef4444;
                }

                .disclaimer {
                    text-align: center;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-top: 12px;
                }

                /* Dots animation */
                .typing {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 16px !important;
                    width: fit-content;
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    background: #cbd5e1;
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }

                .dot:nth-child(1) { animation-delay: -0.32s; }
                .dot:nth-child(2) { animation-delay: -0.16s; }

                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }

            `}</style>
        </div>
    );
};

export default ResearchChat;

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, User, Bot } from 'lucide-react';
import lawJuristLogo from '../assets/law_jurist_logo.png';

const ResearchChat = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
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
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: input
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const aiMsg = {
                id: Date.now() + 1,
                role: 'ai',
                content: "I am researching that for you. As this is a demo, I can tell you that in Indian Law, the principles of natural justice are paramount. (This is a placeholder response)"
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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

            {/* Input Area */}
            <div className="input-section glass-panel">
                <div className="input-container">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a legal question... (e.g., 'What are the latest Supreme Court judgments on Section 138 of NI Act?')"
                        rows={1}
                    />
                    <button
                        className="send-btn-main"
                        onClick={handleSend}
                        disabled={!input.trim()}
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
                    padding: 8px 8px 8px 24px; /* Room for button */
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
                    padding: 8px 0;
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

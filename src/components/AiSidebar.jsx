import React, { useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Send, Sparkles, StickyNote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { processCitations, CitationLink } from '../utils/citationUtils';

const AiSidebar = ({
    isOpen,
    toggle,
    activeTab,
    setActiveTab,
    chatMessages,
    chatInput,
    setChatInput,
    handleSendMessage,
    notes,
    setNotes,
    isTyping = false
}) => {
    const messagesEndRef = useRef(null);

    // Auto scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isTyping]);

    return (
        <>
            {/* Global styles injected once */}
            <style>{`
                @keyframes sidebarSlideIn {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes messageSlideInUser {
                    from { transform: translateX(20px) scale(0.95); opacity: 0; }
                    to { transform: translateX(0) scale(1); opacity: 1; }
                }
                @keyframes messageSlideInAI {
                    from { transform: translateX(-20px) scale(0.95); opacity: 0; }
                    to { transform: translateX(0) scale(1); opacity: 1; }
                }
                @keyframes typingBounce {
                    0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.4; }
                    40% { transform: scale(1) translateY(-4px); opacity: 1; }
                }
                @keyframes sparkleRotate {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(15deg) scale(1.15); }
                }
                @keyframes shimmerBg {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes sendPulse {
                    0%, 100% { box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3); }
                    50% { box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5); }
                }
                @keyframes tabGlow {
                    from { box-shadow: 0 -2px 8px rgba(59, 130, 246, 0); }
                    to { box-shadow: 0 -2px 12px rgba(59, 130, 246, 0.15); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes toggleBtnPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }

                .ai-sidebar-msg-user {
                    animation: messageSlideInUser 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                .ai-sidebar-msg-ai {
                    animation: messageSlideInAI 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                .ai-sidebar-tab {
                    position: relative;
                    overflow: hidden;
                }
                .ai-sidebar-tab::before {
                    content: '';
                    position: absolute;
                    bottom: 0; left: 50%;
                    width: 0; height: 2px;
                    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    transform: translateX(-50%);
                    border-radius: 2px;
                }
                .ai-sidebar-tab.active::before {
                    width: 60%;
                }
                .ai-sidebar-tab:hover:not(.active) {
                    background: rgba(59, 130, 246, 0.06) !important;
                    color: #3b82f6 !important;
                }
                .ai-sidebar-toggle-btn:hover {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
                    border-color: transparent !important;
                    transform: scale(1.1);
                }
                .ai-sidebar-toggle-btn:hover svg {
                    stroke: white !important;
                }
                .ai-sidebar-send-btn:not(:disabled):hover {
                    transform: translateY(-2px) scale(1.05);
                    animation: sendPulse 1.2s ease-in-out infinite;
                }
                .ai-sidebar-send-btn:not(:disabled):active {
                    transform: translateY(0) scale(0.98);
                }
                .ai-sidebar-msg-bubble {
                    transition: all 0.2s ease;
                }
                .ai-sidebar-msg-bubble:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
                }
                .ai-sidebar-messages::-webkit-scrollbar {
                    width: 5px;
                }
                .ai-sidebar-messages::-webkit-scrollbar-track {
                    background: transparent;
                }
                .ai-sidebar-messages::-webkit-scrollbar-thumb {
                    background: rgba(59, 130, 246, 0.2);
                    border-radius: 99px;
                    transition: background 0.2s;
                }
                .ai-sidebar-messages::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.4);
                }
                .ai-sparkle-icon {
                    animation: sparkleRotate 2.5s ease-in-out infinite;
                    display: inline-flex;
                }
                .ai-sidebar-sources-badge {
                    animation: fadeInUp 0.4s ease-out 0.2s both;
                    transition: all 0.2s ease;
                    cursor: default;
                }
                .ai-sidebar-sources-badge:hover {
                    color: #3b82f6 !important;
                    transform: translateX(2px);
                }
                .ai-notes-textarea {
                    transition: background 0.3s ease;
                }
                .ai-notes-textarea:focus {
                    background: linear-gradient(180deg, rgba(59,130,246,0.02), transparent) !important;
                }
                .ai-empty-state {
                    animation: fadeInUp 0.5s ease-out;
                }
            `}</style>

            <div
                className={`editor-sidebar right ${!isOpen ? 'collapsed' : ''}`}
                style={{
                    background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.98) 100%)',
                    borderLeft: '1px solid rgba(203, 213, 225, 0.5)',
                    boxShadow: isOpen ? '-4px 0 24px rgba(15, 23, 42, 0.05)' : 'none',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with tabs */}
                <div className="chat-header" style={{
                    background: 'transparent',
                    borderBottom: '1px solid rgba(203, 213, 225, 0.4)',
                    padding: '12px 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}>
                    {isOpen && (
                        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                            <button
                                className={`ai-sidebar-tab tab ${activeTab === 'ai' ? 'active' : ''}`}
                                onClick={() => setActiveTab('ai')}
                                style={{
                                    padding: '9px 14px',
                                    borderRadius: '10px 10px 0 0',
                                    border: 'none',
                                    background: activeTab === 'ai' ? 'white' : 'transparent',
                                    color: activeTab === 'ai' ? '#3b82f6' : '#64748b',
                                    fontWeight: activeTab === 'ai' ? '600' : '500',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: activeTab === 'ai' ? '0 -2px 12px rgba(59, 130, 246, 0.12)' : 'none',
                                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                            >
                                <span className={activeTab === 'ai' ? 'ai-sparkle-icon' : ''}>
                                    <Sparkles size={14} />
                                </span>
                                AI Assistant
                            </button>
                            <button
                                className={`ai-sidebar-tab tab ${activeTab === 'notes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notes')}
                                style={{
                                    padding: '9px 14px',
                                    borderRadius: '10px 10px 0 0',
                                    border: 'none',
                                    background: activeTab === 'notes' ? 'white' : 'transparent',
                                    color: activeTab === 'notes' ? '#3b82f6' : '#64748b',
                                    fontWeight: activeTab === 'notes' ? '600' : '500',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                            >
                                <StickyNote size={14} />
                                Notes
                            </button>
                        </div>
                    )}
                    <button
                        className="ai-sidebar-toggle-btn toggle-btn"
                        onClick={toggle}
                        style={{
                            background: 'white',
                            border: '1px solid rgba(203, 213, 225, 0.5)',
                            borderRadius: '8px',
                            padding: '7px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {isOpen ? <ChevronRight size={14} color="#64748b" /> : <ChevronLeft size={14} color="#64748b" />}
                    </button>
                </div>

                {isOpen && (
                    <>
                        {activeTab === 'ai' ? (
                            <div className="chat-content-wrapper" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                minHeight: 0,
                                overflow: 'hidden',
                                background: 'white',
                                borderRadius: '0 0 0 12px',
                                animation: 'sidebarSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}>
                                {/* Messages area */}
                                <div className="ai-sidebar-messages chat-messages" style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '14px',
                                }}>
                                    {chatMessages.length === 0 && !isTyping && (
                                        <div className="ai-empty-state" style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '40px 20px',
                                            textAlign: 'center',
                                            color: '#94a3b8',
                                            gap: '12px',
                                        }}>
                                            <div style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '16px',
                                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                animation: 'sparkleRotate 3s ease-in-out infinite',
                                            }}>
                                                <Sparkles size={26} color="#3b82f6" />
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                                                AI Assistant Ready
                                            </div>
                                            <div style={{ fontSize: '12px', maxWidth: '220px', lineHeight: '1.5' }}>
                                                Ask questions about your draft, request edits, or explore legal insights.
                                            </div>
                                        </div>
                                    )}

                                    {chatMessages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`message ${msg.role} ${msg.role === 'user' ? 'ai-sidebar-msg-user' : 'ai-sidebar-msg-ai'}`}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            }}
                                        >
                                            <div
                                                className="ai-sidebar-msg-bubble message-bubble"
                                                style={{
                                                    maxWidth: '92%',
                                                    padding: msg.role === 'user' ? '9px 13px' : '11px 13px',
                                                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                                    background: msg.role === 'user'
                                                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                                        : '#f8fafc',
                                                    color: msg.role === 'user' ? 'white' : '#1e293b',
                                                    boxShadow: msg.role === 'user'
                                                        ? '0 3px 10px rgba(59, 130, 246, 0.25)'
                                                        : '0 1px 3px rgba(0, 0, 0, 0.04)',
                                                    border: msg.role === 'user' ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
                                                    userSelect: 'text',
                                                    cursor: 'text',
                                                }}
                                            >
                                                {msg.role === 'ai' ? (
                                                    <div className="markdown-content" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({ node, ...props }) => <p style={{ margin: '0 0 8px 0' }} {...props} />,
                                                                ul: ({ node, ...props }) => <ul style={{ margin: '6px 0', paddingLeft: '14px' }} {...props} />,
                                                                ol: ({ node, ...props }) => <ol style={{ margin: '6px 0', paddingLeft: '14px' }} {...props} />,
                                                                li: ({ node, ...props }) => <li style={{ marginBottom: '3px' }} {...props} />,
                                                                code: ({ node, inline, ...props }) =>
                                                                    inline
                                                                        ? <code style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '1px 5px', borderRadius: '4px', fontSize: '12px', color: '#3b82f6', fontWeight: 500 }} {...props} />
                                                                        : <code style={{ display: 'block', backgroundColor: 'rgba(15, 23, 42, 0.04)', padding: '10px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', border: '1px solid rgba(226,232,240,0.6)' }} {...props} />,
                                                                strong: ({ node, ...props }) => <strong style={{ fontWeight: 600, color: '#0f172a' }} {...props} />,
                                                                a: ({ node, href, children, ...props }) => (
                                                                    <CitationLink href={href} sources={msg.sources} compact={true}>
                                                                        {children}
                                                                    </CitationLink>
                                                                ),
                                                                h1: ({ node, ...props }) => <h1 style={{ fontSize: '16px', fontWeight: 700, margin: '12px 0 6px' }} {...props} />,
                                                                h2: ({ node, ...props }) => <h2 style={{ fontSize: '15px', fontWeight: 600, margin: '10px 0 5px' }} {...props} />,
                                                                h3: ({ node, ...props }) => <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '8px 0 4px' }} {...props} />,
                                                                blockquote: ({ node, ...props }) => (
                                                                    <blockquote style={{
                                                                        borderLeft: '3px solid #3b82f6',
                                                                        marginLeft: 0,
                                                                        paddingLeft: '10px',
                                                                        color: '#475569',
                                                                        fontStyle: 'italic',
                                                                        background: 'rgba(59, 130, 246, 0.03)',
                                                                        padding: '6px 10px',
                                                                        borderRadius: '0 6px 6px 0',
                                                                    }} {...props} />
                                                                ),
                                                            }}
                                                        >
                                                            {processCitations(msg.content, msg.sources)}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '13px', lineHeight: '1.5' }}>{msg.content}</span>
                                                )}
                                            </div>

                                            {/* Sources indicator */}
                                            {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                                                <div className="ai-sidebar-sources-badge" style={{
                                                    marginTop: '5px',
                                                    fontSize: '10.5px',
                                                    color: '#94a3b8',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontWeight: 500,
                                                    padding: '2px 8px',
                                                    borderRadius: '99px',
                                                    background: 'rgba(59, 130, 246, 0.05)',
                                                }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>link</span>
                                                    {msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''} referenced
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Typing Indicator */}
                                    {isTyping && (
                                        <div className="message ai ai-sidebar-msg-ai" style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <div className="message-bubble" style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                padding: '12px 14px',
                                                background: '#f8fafc',
                                                borderRadius: '14px 14px 14px 4px',
                                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                                            }}>
                                                {[0, 0.15, 0.3].map((delay, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            width: '7px',
                                                            height: '7px',
                                                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                                            borderRadius: '50%',
                                                            animation: `typingBounce 1.3s infinite ease-in-out`,
                                                            animationDelay: `${delay}s`,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input area */}
                                <div className="chat-input-area" style={{
                                    padding: '12px',
                                    borderTop: '1px solid rgba(226, 232, 240, 0.6)',
                                    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                                }}>
                                    <div className="input-wrapper" style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'flex-end',
                                    }}>
                                        <textarea
                                            placeholder="Ask about your draft..."
                                            value={chatInput}
                                            onChange={(e) => {
                                                setChatInput(e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (!isTyping) handleSendMessage();
                                                }
                                            }}
                                            disabled={isTyping}
                                            rows={1}
                                            style={{
                                                flex: 1,
                                                padding: '11px 14px',
                                                border: '1.5px solid rgba(203, 213, 225, 0.6)',
                                                borderRadius: '12px',
                                                fontSize: '13px',
                                                outline: 'none',
                                                background: 'white',
                                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                                                resize: 'none',
                                                minHeight: '44px',
                                                maxHeight: '120px',
                                                overflowY: 'auto',
                                                fontFamily: 'inherit',
                                                lineHeight: '1.5',
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#3b82f6';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.12), 0 4px 12px rgba(59, 130, 246, 0.08)';
                                                e.target.style.transform = 'translateY(-1px)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'rgba(203, 213, 225, 0.6)';
                                                e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02)';
                                                e.target.style.transform = 'translateY(0)';
                                            }}
                                        />
                                        <button
                                            className="ai-sidebar-send-btn send-btn"
                                            onClick={handleSendMessage}
                                            disabled={isTyping || !chatInput.trim()}
                                            style={{
                                                padding: '11px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: isTyping || !chatInput.trim()
                                                    ? '#e2e8f0'
                                                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                cursor: isTyping || !chatInput.trim() ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: isTyping || !chatInput.trim()
                                                    ? 'none'
                                                    : '0 2px 8px rgba(59, 130, 246, 0.3)',
                                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                                minWidth: '44px',
                                                minHeight: '44px',
                                            }}
                                        >
                                            <Send size={15} color={isTyping || !chatInput.trim() ? '#94a3b8' : 'white'} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="notes-area" style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'white',
                                borderRadius: '0 0 0 12px',
                                animation: 'sidebarSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}>
                                <h4 style={{
                                    padding: '14px 16px 10px',
                                    margin: 0,
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#475569',
                                    borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <StickyNote size={14} color="#3b82f6" />
                                    Research Notes
                                </h4>
                                <textarea
                                    placeholder="Jot down your research notes here..."
                                    value={notes}
                                    onChange={(e) => setNotes && setNotes(e.target.value)}
                                    className="ai-notes-textarea notes-input"
                                    style={{
                                        flex: 1,
                                        width: '100%',
                                        border: 'none',
                                        resize: 'none',
                                        padding: '14px 16px',
                                        backgroundColor: 'transparent',
                                        fontFamily: 'inherit',
                                        fontSize: '13px',
                                        lineHeight: '1.7',
                                        outline: 'none',
                                        color: '#334155',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default AiSidebar;
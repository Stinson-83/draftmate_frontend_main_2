import React from 'react';
import { ChevronRight, ChevronLeft, Send, Sparkles } from 'lucide-react';
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
    return (
        <div className={`editor-sidebar right ${!isOpen ? 'collapsed' : ''}`}
            style={{
                background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.98) 100%)',
                borderLeft: '1px solid rgba(203, 213, 225, 0.5)',
                boxShadow: isOpen ? '-4px 0 20px rgba(0, 0, 0, 0.03)' : 'none',
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
            }}>
                {isOpen && (
                    <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                        <button
                            className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ai')}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px 8px 0 0',
                                border: 'none',
                                background: activeTab === 'ai' ? 'white' : 'transparent',
                                color: activeTab === 'ai' ? '#3b82f6' : '#64748b',
                                fontWeight: activeTab === 'ai' ? '600' : '500',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: activeTab === 'ai' ? '0 -2px 8px rgba(59, 130, 246, 0.1)' : 'none',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Sparkles size={14} />
                            AI Assistant
                        </button>
                        <button
                            className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('notes')}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px 8px 0 0',
                                border: 'none',
                                background: activeTab === 'notes' ? 'white' : 'transparent',
                                color: activeTab === 'notes' ? '#3b82f6' : '#64748b',
                                fontWeight: activeTab === 'notes' ? '600' : '500',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Notes
                        </button>
                    </div>
                )}
                <button
                    className="toggle-btn"
                    onClick={toggle}
                    style={{
                        background: 'white',
                        border: '1px solid rgba(203, 213, 225, 0.5)',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease',
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
                        }}>
                            {/* Messages area */}
                            <div className="chat-messages" style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}>
                                {chatMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`message ${msg.role}`}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        }}
                                    >
                                        <div
                                            className="message-bubble"
                                            style={{
                                                maxWidth: '92%',
                                                padding: msg.role === 'user' ? '8px 12px' : '10px 12px',
                                                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                                background: msg.role === 'user'
                                                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                                    : '#f8fafc',
                                                color: msg.role === 'user' ? 'white' : '#1e293b',
                                                boxShadow: msg.role === 'user'
                                                    ? '0 2px 8px rgba(59, 130, 246, 0.25)'
                                                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
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
                                                                    ? <code style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '1px 4px', borderRadius: '3px', fontSize: '12px', color: '#3b82f6' }} {...props} />
                                                                    : <code style={{ display: 'block', backgroundColor: 'rgba(15, 23, 42, 0.04)', padding: '8px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto' }} {...props} />,
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
                                                                }} {...props} />
                                                            ),
                                                        }}
                                                    >
                                                        {processCitations(msg.content, msg.sources)}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '13px' }}>{msg.content}</span>
                                            )}
                                        </div>

                                        {/* Sources indicator for AI messages */}
                                        {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                                            <div style={{
                                                marginTop: '4px',
                                                fontSize: '10px',
                                                color: '#94a3b8',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>link</span>
                                                {msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''} referenced
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="message ai" style={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <div className="message-bubble" style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '10px 14px',
                                            background: '#f8fafc',
                                            borderRadius: '12px 12px 12px 4px',
                                            border: '1px solid rgba(226, 232, 240, 0.8)',
                                        }}>
                                            <div style={{
                                                width: '6px',
                                                height: '6px',
                                                backgroundColor: '#3b82f6',
                                                borderRadius: '50%',
                                                animation: 'typingBounce 1.4s infinite ease-in-out',
                                                animationDelay: '0s'
                                            }} />
                                            <div style={{
                                                width: '6px',
                                                height: '6px',
                                                backgroundColor: '#3b82f6',
                                                borderRadius: '50%',
                                                animation: 'typingBounce 1.4s infinite ease-in-out',
                                                animationDelay: '0.2s'
                                            }} />
                                            <div style={{
                                                width: '6px',
                                                height: '6px',
                                                backgroundColor: '#3b82f6',
                                                borderRadius: '50%',
                                                animation: 'typingBounce 1.4s infinite ease-in-out',
                                                animationDelay: '0.4s'
                                            }} />
                                            <style>{`
                                                @keyframes typingBounce {
                                                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                                                    40% { transform: scale(1); opacity: 1; }
                                                }
                                            `}</style>
                                        </div>
                                    </div>
                                )}
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
                                    alignItems: 'center',
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
                                            padding: '10px 14px',
                                            border: '1px solid rgba(203, 213, 225, 0.6)',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            outline: 'none',
                                            background: 'white',
                                            transition: 'all 0.2s ease',
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
                                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(203, 213, 225, 0.6)';
                                            e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02)';
                                        }}
                                    />
                                    <button
                                        className="send-btn"
                                        onClick={handleSendMessage}
                                        disabled={isTyping || !chatInput.trim()}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '10px',
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
                                                : '0 2px 6px rgba(59, 130, 246, 0.3)',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <Send size={14} color={isTyping || !chatInput.trim() ? '#94a3b8' : 'white'} />
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
                        }}>
                            <h4 style={{
                                padding: '12px 14px 8px',
                                margin: 0,
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#475569',
                                borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
                            }}>
                                Research Notes
                            </h4>
                            <textarea
                                placeholder="Jot down your research notes here..."
                                value={notes}
                                onChange={(e) => setNotes && setNotes(e.target.value)}
                                className="notes-input"
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    border: 'none',
                                    resize: 'none',
                                    padding: '12px 14px',
                                    backgroundColor: 'transparent',
                                    fontFamily: 'inherit',
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    outline: 'none',
                                    color: '#334155',
                                }}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AiSidebar;

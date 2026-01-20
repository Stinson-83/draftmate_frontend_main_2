import React from 'react';
import { ChevronRight, ChevronLeft, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
        <div className={`editor-sidebar right glass-panel ${!isOpen ? 'collapsed' : ''}`}>
            <div className="chat-header">
                {isOpen && (
                    <>
                        <div
                            className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ai')}
                        >
                            AI Research
                        </div>
                        <div
                            className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('notes')}
                        >
                            Notes
                        </div>
                    </>
                )}
                <button className="toggle-btn" onClick={toggle}>
                    {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {isOpen && (
                <>
                    {activeTab === 'ai' ? (
                        <div className="chat-content-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <div className="chat-messages">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`message ${msg.role}`}>
                                        <div className="message-bubble">
                                            {msg.role === 'ai' ? (
                                                <div className="markdown-content" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ node, ...props }) => <p style={{ margin: '0 0 8px 0' }} {...props} />,
                                                            ul: ({ node, ...props }) => <ul style={{ margin: '8px 0', paddingLeft: '16px' }} {...props} />,
                                                            ol: ({ node, ...props }) => <ol style={{ margin: '8px 0', paddingLeft: '16px' }} {...props} />,
                                                            li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                                                            code: ({ node, inline, ...props }) =>
                                                                inline
                                                                    ? <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '1px 4px', borderRadius: '3px', fontSize: '12px' }} {...props} />
                                                                    : <code style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '4px', fontSize: '12px', overflowX: 'auto' }} {...props} />,
                                                            strong: ({ node, ...props }) => <strong style={{ fontWeight: 600 }} {...props} />,
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="message ai">
                                        <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '12px 16px' }}>
                                            <div className="typing-dot" style={{
                                                width: '8px',
                                                height: '8px',
                                                backgroundColor: '#6366f1',
                                                borderRadius: '50%',
                                                animation: 'typingBounce 1.4s infinite ease-in-out',
                                                animationDelay: '0s'
                                            }} />
                                            <div className="typing-dot" style={{
                                                width: '8px',
                                                height: '8px',
                                                backgroundColor: '#6366f1',
                                                borderRadius: '50%',
                                                animation: 'typingBounce 1.4s infinite ease-in-out',
                                                animationDelay: '0.2s'
                                            }} />
                                            <div className="typing-dot" style={{
                                                width: '8px',
                                                height: '8px',
                                                backgroundColor: '#6366f1',
                                                borderRadius: '50%',
                                                animation: 'typingBounce 1.4s infinite ease-in-out',
                                                animationDelay: '0.4s'
                                            }} />
                                            <style>{`
                                                @keyframes typingBounce {
                                                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                                                    40% { transform: scale(1); opacity: 1; }
                                                }
                                            `}</style>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="chat-input-area">
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Ask AI legal assistant..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                                        disabled={isTyping}
                                    />
                                    <button
                                        className="send-btn"
                                        onClick={handleSendMessage}
                                        disabled={isTyping}
                                        style={{ opacity: isTyping ? 0.5 : 1 }}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="notes-area">
                            <h4 style={{ padding: '0 16px 8px', margin: 0 }}>Research Notes</h4>
                            <textarea
                                placeholder="Type your research notes here..."
                                value={notes}
                                onChange={(e) => setNotes && setNotes(e.target.value)}
                                className="notes-input"
                                style={{
                                    width: '100%',
                                    height: 'calc(100vh - 150px)',
                                    border: 'none',
                                    resize: 'none',
                                    padding: '16px',
                                    backgroundColor: 'transparent',
                                    fontFamily: 'inherit',
                                    fontSize: '14px',
                                    outline: 'none'
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


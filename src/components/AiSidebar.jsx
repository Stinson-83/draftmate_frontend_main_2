import React from 'react';
import { ChevronRight, ChevronLeft, Send } from 'lucide-react';

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
    setNotes
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
                        <>
                            <div className="chat-messages">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`message ${msg.role}`}>
                                        <div className="message-bubble">
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="chat-input-area">
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Ask AI legal assistant..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button className="send-btn" onClick={handleSendMessage}>
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
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

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Upload, Loader2, Bot, Download, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_CONFIG } from '../services/endpoints';
import './LegalWorkflow.css';

const LegalWorkflow = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // The user's ID for the session (normally from auth, mocked here)
    const userId = localStorage.getItem('user_id') || 'local_user_' + Math.random().toString(36).substr(2, 9);
    const API_URL = "http://localhost:8010"; // Local fallback if config fails
    const TURN_ENDPOINT = API_CONFIG.LEGAL_WORKFLOW?.BASE_URL ? `${API_CONFIG.LEGAL_WORKFLOW.BASE_URL}/api/workflow/turn` : `${API_URL}/api/workflow/turn`;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Initial greeting
    useEffect(() => {
        const startSession = async () => {
            setIsTyping(true);
            try {
                // Send an empty message to trigger the intake greeting
                const res = await fetch(TURN_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        message: "hi",
                        message_type: "text"
                    })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    appendBotMessages(data.messages);
                }
            } catch (err) {
                console.error("Failed to connect to workflow engine:", err);
                toast.error("Could not connect to the Legal AI assistant.");
            } finally {
                setIsTyping(false);
            }
        };
        
        startSession();
    }, []);

    const appendBotMessages = (newMessages) => {
        const formattedMsgs = newMessages.map(msg => {
            if (msg.type === "delay") return null;
            return {
                role: 'bot',
                ...msg
            };
        }).filter(Boolean);
        
        setMessages(prev => [...prev, ...formattedMsgs]);
    };

    const handleSendMessage = async (text, attachment = null, buttonId = null) => {
        if (!text.trim() && !attachment && !buttonId) return;

        const messageText = buttonId || text; // If button pressed, send button id/title
        
        // Add user message to UI
        const userMsg = {
            role: 'user',
            type: 'text',
            body: text || (attachment ? `Attached: ${attachment.name}` : ''),
            attachment: attachment
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setSelectedFile(null);
        setIsTyping(true);

        try {
            // Prepare payload
            const payload = {
                user_id: userId,
                message: messageText,
                message_type: attachment ? (attachment.type.startsWith('image/') ? 'image' : 'document') : 'text'
            };

            // If there's an attachment, read it as base64
            if (attachment) {
                const base64 = await fileToBase64(attachment);
                const b64Data = base64.split(',')[1];
                
                if (attachment.type.startsWith('image/')) {
                    payload.image_base64 = b64Data;
                    payload.image_mime_type = attachment.type;
                } else {
                    payload.document_base64 = b64Data;
                    payload.document_filename = attachment.name;
                    payload.document_mime_type = attachment.type;
                }
            }

            const res = await fetch(TURN_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("API Error");

            const data = await res.json();
            
            // Handle simulated delays if any
            let currentDelay = 0;
            for (const msg of data.messages) {
                if (msg.type === 'delay') {
                    currentDelay += msg.seconds * 1000;
                } else {
                    setTimeout(() => {
                        setMessages(prev => [...prev, { role: 'bot', ...msg }]);
                    }, currentDelay);
                }
            }
            
            setTimeout(() => setIsTyping(false), currentDelay + 500);

        } catch (err) {
            console.error("Turn failed:", err);
            toast.error("Failed to send message.");
            setIsTyping(false);
        }
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File is too large. Maximum size is 5MB.");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleButtonTap = (btnId, btnTitle) => {
        handleSendMessage(btnTitle, null, btnId);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue, selectedFile);
        }
    };

    const renderMessage = (msg, index) => {
        if (msg.role === 'user') {
            return (
                <div key={index} className="wf-message user-message">
                    <div className="wf-message-bubble">
                        {msg.body}
                        {msg.attachment && (
                            <div className="wf-attachment-badge">
                                <Paperclip size={12} /> {msg.attachment.name}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Bot messages
        return (
            <div key={index} className="wf-message bot-message">
                <div className="wf-bot-avatar">
                    <Bot size={20} />
                </div>
                <div className="wf-message-content">
                    {msg.type === 'text' && (
                        <div className="wf-message-bubble bot">{msg.body}</div>
                    )}

                    {msg.type === 'cta' && (
                        <div className="wf-interactive">
                            <div className="wf-message-bubble bot">{msg.body}</div>
                            <div className="wf-buttons">
                                {msg.buttons.map((btn, i) => (
                                    <button 
                                        key={i} 
                                        className="wf-btn"
                                        onClick={() => handleButtonTap(btn.id, btn.title)}
                                    >
                                        {btn.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {msg.type === 'cta_url' && (
                        <div className="wf-interactive">
                            <div className="wf-message-bubble bot">{msg.body}</div>
                            <div className="wf-buttons">
                                <a 
                                    href={msg.url} 
                                    target={msg.url.startsWith('http') ? "_blank" : "_self"} 
                                    rel="noreferrer"
                                    className="wf-btn primary"
                                >
                                    {msg.display_text} <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    )}

                    {msg.type === 'document' && (
                        <div className="wf-document-card">
                            <div className="wf-doc-icon">
                                <FileText size={24} />
                            </div>
                            <div className="wf-doc-info">
                                <h4>{msg.filename}</h4>
                                <p>{msg.caption}</p>
                            </div>
                            <a href={msg.url} download className="wf-doc-download">
                                <Download size={18} />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="legal-workflow-container">
            <div className="wf-header">
                <div className="wf-title-area">
                    <Bot size={28} className="wf-title-icon" />
                    <div>
                        <h2>Legal Drafting Assistant</h2>
                        <p>Donna-powered intelligent drafting and risk analysis</p>
                    </div>
                </div>
                <div className="wf-actions">
                    <button className="wf-reset-btn" onClick={() => handleSendMessage("restart")}>
                        Start Over
                    </button>
                </div>
            </div>

            <div className="wf-chat-area">
                <div className="wf-messages-list">
                    {messages.map((msg, idx) => renderMessage(msg, idx))}
                    
                    {isTyping && (
                        <div className="wf-message bot-message typing-indicator-container">
                            <div className="wf-bot-avatar"><Bot size={20} /></div>
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="wf-input-area">
                {selectedFile && (
                    <div className="wf-selected-file">
                        <FileText size={16} />
                        <span>{selectedFile.name}</span>
                        <button onClick={() => setSelectedFile(null)}><X size={14} /></button>
                    </div>
                )}
                <div className="wf-input-box">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    />
                    <button 
                        className="wf-attach-btn" 
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach Document or Image"
                    >
                        <Paperclip size={20} />
                    </button>
                    <textarea 
                        className="wf-textarea"
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                    <button 
                        className={`wf-send-btn ${(inputValue.trim() || selectedFile) ? 'active' : ''}`}
                        onClick={() => handleSendMessage(inputValue, selectedFile)}
                        disabled={!inputValue.trim() && !selectedFile}
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="wf-input-hint">
                    Press Enter to send, Shift + Enter for new line. You can upload PDFs, Word docs, or images.
                </div>
            </div>
        </div>
    );
};

export default LegalWorkflow;

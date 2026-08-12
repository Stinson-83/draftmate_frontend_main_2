import React from 'react';
import { X, Check, RotateCcw, Wand2, ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * EnhancementPreviewModal - Shows a preview of AI-enhanced content with Accept/Reject options
 */
const EnhancementPreviewModal = ({
    isOpen,
    isLoading = false,
    originalContent = '',
    enhancedContent = '',
    onAccept,
    onReject,
    onClose
}) => {
    if (!isOpen) return null;

    // Strip HTML tags for preview text comparison - preserve line breaks
    const stripHtml = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        // Replace block elements with newlines
        tmp.querySelectorAll('p, div, br, li').forEach(el => {
            el.insertAdjacentText('afterend', '\n');
        });
        return tmp.textContent || tmp.innerText || '';
    };

    const originalText = stripHtml(originalContent);
    const enhancedText = stripHtml(enhancedContent);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#1e1e2e',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                maxWidth: '95vw',
                width: '1100px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#fff', fontSize: '18px' }}>
                        <Wand2 size={22} style={{ color: '#a78bfa' }} />
                        Enhancement Preview
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'flex'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '80px 20px',
                        gap: '20px'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid rgba(167, 139, 250, 0.2)',
                            borderTop: '4px solid #a78bfa',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ color: '#a1a1aa', margin: 0, fontSize: '16px' }}>AI is enhancing your draft...</p>
                    </div>
                ) : (
                    <>
                        {/* Content Comparison */}
                        <div style={{
                            flex: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            gap: '20px',
                            padding: '20px 24px',
                            minHeight: '300px',
                            maxHeight: '55vh'
                        }}>
                            {/* Original Content */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                border: '2px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                backgroundColor: 'rgba(239, 68, 68, 0.05)'
                            }}>
                                <div style={{
                                    padding: '14px 18px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <ArrowLeft size={18} style={{ color: '#f87171' }} />
                                    <span style={{ fontWeight: 600, color: '#fca5a5', fontSize: '15px' }}>Original</span>
                                </div>
                                <div style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    padding: '18px',
                                    fontSize: '14px',
                                    lineHeight: '1.7',
                                    color: '#e4e4e7',
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'Georgia, serif'
                                }}>
                                    {originalText || 'No content'}
                                </div>
                            </div>

                            {/* Enhanced Content */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                border: '2px solid rgba(34, 197, 94, 0.4)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                backgroundColor: 'rgba(34, 197, 94, 0.05)'
                            }}>
                                <div style={{
                                    padding: '14px 18px',
                                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                    borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <ArrowRight size={18} style={{ color: '#4ade80' }} />
                                    <span style={{ fontWeight: 600, color: '#86efac', fontSize: '15px' }}>Enhanced</span>
                                </div>
                                <div style={{
                                    flex: 1,
                                    overflow: 'auto',
                                    padding: '18px',
                                    fontSize: '14px',
                                    lineHeight: '1.7',
                                    color: '#e4e4e7',
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'Georgia, serif'
                                }}>
                                    {enhancedText || 'No enhanced content'}
                                </div>
                            </div>
                        </div>

                        {/* Footer with Actions */}
                        <div style={{
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            padding: '20px 24px',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '14px'
                        }}>
                            <button
                                onClick={onReject}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#fca5a5',
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500
                                }}
                            >
                                <RotateCcw size={18} />
                                Reject & Keep Original
                            </button>
                            <button
                                onClick={onAccept}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: '#22c55e',
                                    border: 'none',
                                    color: 'white',
                                    padding: '12px 28px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)'
                                }}
                            >
                                <Check size={18} />
                                Accept Enhancement
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Spinner animation */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default EnhancementPreviewModal;

import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Wand2, X, Highlighter, ChevronDown, Link as LinkIcon, Trash2, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const FloatingToolbar = ({ position, onFormat, onEnhance, visible, isTableContext }) => {
    const toolbarRef = useRef(null);
    const [showInput, setShowInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    useEffect(() => {
        if (!visible) {
            setShowInput(false);
            setInputValue('');
            setShowHighlightMenu(false);
            setShowLinkInput(false);
            setLinkUrl('');
        }
    }, [visible]);

    if (!visible) return null;

    // Prevent toolbar from going off-screen (basic bounds checking)
    const style = {
        top: `${position.y}px`,
        left: `${position.x}px`,
        position: 'fixed',
        zIndex: 1000,
        transform: 'translate(-50%, -100%) translateY(-10px)', // Center horizontally, place above
    };

    const handleEnhanceClick = () => {
        if (!showInput) {
            setShowInput(true);
        } else {
            // If input is already shown, clicking icon again could either submit or close.
            // Let's assume we want to submit if there is text, or close if empty?
            // Actually, let's keep it simple: clicking button opens input.
            // We'll have a separate 'Enhance' button to submit.
        }
    };

    const handleSubmitEnhance = () => {
        onEnhance(inputValue);
        setShowInput(false);
        setInputValue('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmitEnhance();
        } else if (e.key === 'Escape') {
            setShowInput(false);
        }
    };

    return (
        <div
            ref={toolbarRef}
            className="floating-toolbar glass-panel"
            style={style}
            onMouseDown={(e) => {
                // Prevent losing focus from editor ONLY if not interacting with input
                if (e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                }
            }}
        >
            {!showInput ? (
                <>
                    {isTableContext && (
                        <>
                            <div className="toolbar-group">
                                <button className="tool-btn" onClick={() => onFormat('modifyTable', { action: 'addRowAbove' })} title="Add Row Above"><ArrowUp size={14} /><Plus size={10} style={{ marginLeft: -4 }} /></button>
                                <button className="tool-btn" onClick={() => onFormat('modifyTable', { action: 'addRowBelow' })} title="Add Row Below"><ArrowDown size={14} /><Plus size={10} style={{ marginLeft: -4 }} /></button>
                                <button className="tool-btn" onClick={() => onFormat('modifyTable', { action: 'addColLeft' })} title="Add Col Left"><ArrowLeft size={14} /><Plus size={10} style={{ marginLeft: -4 }} /></button>
                                <button className="tool-btn" onClick={() => onFormat('modifyTable', { action: 'addColRight' })} title="Add Col Right"><ArrowRight size={14} /><Plus size={10} style={{ marginLeft: -4 }} /></button>
                                <button className="tool-btn" onClick={() => onFormat('modifyTable', { action: 'deleteRow' })} title="Delete Row"><Trash2 size={14} /><span style={{ fontSize: 10 }}>R</span></button>
                                <button className="tool-btn" onClick={() => onFormat('modifyTable', { action: 'deleteCol' })} title="Delete Col"><Trash2 size={14} /><span style={{ fontSize: 10 }}>C</span></button>
                            </div>
                            <div className="toolbar-divider"></div>
                        </>
                    )}
                    <div className="toolbar-group">
                        <button className="tool-btn" onClick={() => onFormat('bold')} title="Bold"><Bold size={16} /></button>
                        <button className="tool-btn" onClick={() => onFormat('italic')} title="Italic"><Italic size={16} /></button>
                        <button className="tool-btn" onClick={() => onFormat('underline')} title="Underline"><Underline size={16} /></button>
                        <button className="tool-btn" onClick={() => onFormat('underline')} title="Underline"><Underline size={16} /></button>
                        <button
                            className={`tool-btn ${showLinkInput ? 'active' : ''}`}
                            onClick={() => {
                                setShowLinkInput(true);
                                setShowInput(true);
                            }}
                            title="Insert Link"
                        >
                            <LinkIcon size={16} />
                        </button>

                        {/* Highlight Dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className="tool-btn"
                                onClick={() => setShowHighlightMenu(!showHighlightMenu)}
                                title="Highlight Color"
                                style={{ display: 'flex', alignItems: 'center', width: 'auto', padding: '0 4px' }}
                            >
                                <Highlighter size={16} />
                                <ChevronDown size={10} style={{ marginLeft: 2, opacity: 0.7 }} />
                            </button>
                            {showHighlightMenu && (
                                <div className="highlight-menu glass-panel" style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' }}>
                                    <button className="highlight-swatch" onClick={() => { onFormat('highlight', 'yellow'); setShowHighlightMenu(false); }} title="Yellow" style={{ background: '#fef08a' }} />
                                    <button className="highlight-swatch" onClick={() => { onFormat('highlight', 'green'); setShowHighlightMenu(false); }} title="Green" style={{ background: '#bbf7d0' }} />
                                    <button className="highlight-swatch" onClick={() => { onFormat('highlight', 'cyan'); setShowHighlightMenu(false); }} title="Cyan" style={{ background: '#a5f3fc' }} />
                                    <button className="highlight-swatch" onClick={() => { onFormat('highlight', 'magenta'); setShowHighlightMenu(false); }} title="Magenta" style={{ background: '#f5d0fe' }} />
                                    <button className="highlight-swatch" onClick={() => { onFormat('highlight', 'gray'); setShowHighlightMenu(false); }} title="Gray" style={{ background: '#e2e8f0' }} />
                                    <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 2px' }}></div>
                                    <button className="highlight-swatch" onClick={() => { onFormat('highlight', 'none'); setShowHighlightMenu(false); }} title="No Color" style={{ background: 'transparent', color: '#64748b' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="toolbar-divider"></div>

                    <div className="toolbar-group">
                        <button className="tool-btn" onClick={() => onFormat('justifyLeft')} title="Align Left"><AlignLeft size={16} /></button>
                        <button className="tool-btn" onClick={() => onFormat('justifyCenter')} title="Align Center"><AlignCenter size={16} /></button>
                        <button className="tool-btn" onClick={() => onFormat('justifyRight')} title="Align Right"><AlignRight size={16} /></button>
                    </div>

                    <div className="toolbar-divider"></div>

                    <button
                        className="btn-enhance"
                        onClick={handleEnhanceClick}
                        title="Enhance with AI"
                    >
                        <Wand2 size={14} style={{ marginRight: 6 }} />
                        Enhance
                    </button>
                </>
            ) : (
                <>
                    {/* Link Input Mode */}
                    {showLinkInput ? (
                        <div className="flex items-center gap-2 p-1">
                            <input
                                type="text"
                                className="text-sm bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 w-48"
                                placeholder="Paste link URL..."
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onFormat('insertLink', linkUrl);
                                        setShowLinkInput(false);
                                        setLinkUrl('');
                                    } else if (e.key === 'Escape') {
                                        setShowLinkInput(false);
                                    }
                                }}
                                autoFocus
                            />
                            <button
                                className="btn-enhance px-3 py-1 text-xs"
                                onClick={() => {
                                    onFormat('insertLink', linkUrl);
                                    setShowLinkInput(false);
                                    setLinkUrl('');
                                }}
                            >
                                Link
                            </button>
                            <button
                                onClick={() => setShowLinkInput(false)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        /* AI Assist Mode */
                        <div className="flex items-center gap-2 p-1">
                            <input
                                type="text"
                                className="text-sm bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 w-80"
                                placeholder="How should I change this?"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <button
                                className="btn-enhance px-3 py-1 text-xs"
                                onClick={handleSubmitEnhance}
                            >
                                Enhance
                            </button>
                            <button
                                onClick={() => setShowInput(false)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </>
            )
            }
        </div >
    );
};

export default FloatingToolbar;

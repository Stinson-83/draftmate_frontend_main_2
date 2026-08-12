import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Wand2, X, Highlighter, ChevronDown, Link as LinkIcon, Trash2, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Type, Hash } from 'lucide-react';

const FloatingToolbar = ({ position, onFormat, onEnhance, visible, isTableContext }) => {
    const toolbarRef = useRef(null);
    const [showInput, setShowInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [showFontMenu, setShowFontMenu] = useState(false);
    const [showSizeMenu, setShowSizeMenu] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    useEffect(() => {
        if (!visible) {
            setShowInput(false);
            setInputValue('');
            setShowHighlightMenu(false);
            setShowFontMenu(false);
            setShowSizeMenu(false);
            setShowLinkInput(false);
            setLinkUrl('');
        }
    }, [visible]);

    if (!visible) return null;

    const style = {
        top: `${position.y}px`,
        left: `${position.x}px`,
        position: 'fixed',
        zIndex: 1000,
        transform: 'translate(-50%, -100%) translateY(-10px)',
    };

    const handleEnhanceClick = () => {
        if (!showInput) {
            setShowInput(true);
        }
    };

    const handleSubmitEnhance = () => {
        onEnhance(inputValue);
        setShowInput(false);
        setInputValue('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitEnhance();
        } else if (e.key === 'Escape') {
            setShowInput(false);
        }
    };

    return (
        <>
            {/* ===== PREMIUM ANIMATIONS ===== */}
            <style>{`
                @keyframes toolbarPopIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -100%) translateY(0px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -100%) translateY(-10px) scale(1);
                    }
                }
                @keyframes dropdownSlideDown {
                    from { opacity: 0; transform: translateY(-8px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes highlightMenuIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.9); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
                @keyframes swatchPop {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes inputSlideIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes wandFloat {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(-8deg) scale(1.15); }
                }
                @keyframes enhanceBtnGlow {
                    0%, 100% { box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25); }
                    50% { box-shadow: 0 4px 16px rgba(139, 92, 246, 0.35), 0 0 0 3px rgba(59, 130, 246, 0.1); }
                }
                @keyframes menuItemSlide {
                    from { opacity: 0; transform: translateX(-6px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes shimmerEnhance {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }

                .floating-toolbar-anim {
                    animation: toolbarPopIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                }

                .toolbar-dropdown-anim {
                    animation: dropdownSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
                    transform-origin: top left;
                }

                .highlight-menu-anim {
                    animation: highlightMenuIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                    transform-origin: top center;
                }

                .swatch-anim {
                    animation: swatchPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .swatch-anim:nth-child(1) { animation-delay: 0.02s; }
                .swatch-anim:nth-child(2) { animation-delay: 0.05s; }
                .swatch-anim:nth-child(3) { animation-delay: 0.08s; }
                .swatch-anim:nth-child(4) { animation-delay: 0.11s; }
                .swatch-anim:nth-child(5) { animation-delay: 0.14s; }
                .swatch-anim:nth-child(7) { animation-delay: 0.17s; }
                .swatch-anim:hover {
                    transform: scale(1.2) translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 2;
                }
                .swatch-anim:active { transform: scale(0.95); }

                .tool-btn-anim {
                    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                }
                .tool-btn-anim:hover {
                    transform: translateY(-1px);
                    background: rgba(59, 130, 246, 0.08) !important;
                    color: #3b82f6 !important;
                }
                .tool-btn-anim:active {
                    transform: translateY(0) scale(0.94);
                }
                .tool-btn-anim.active {
                    background: rgba(59, 130, 246, 0.12) !important;
                    color: #3b82f6 !important;
                }

                .enhance-btn-anim {
                    background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%);
                    background-size: 200% 100%;
                    animation: shimmerEnhance 3s linear infinite;
                    color: white !important;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .enhance-btn-anim:hover {
                    transform: translateY(-2px) scale(1.03);
                    animation: shimmerEnhance 1.5s linear infinite, enhanceBtnGlow 1.5s ease-in-out infinite;
                }
                .enhance-btn-anim:active {
                    transform: translateY(0) scale(0.97);
                }

                .wand-float-anim {
                    animation: wandFloat 2.5s ease-in-out infinite;
                    display: inline-flex;
                }

                .input-anim {
                    animation: inputSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .menu-item-anim {
                    animation: menuItemSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
                    transition: all 0.15s ease;
                    border-radius: 6px;
                    margin: 1px 0;
                }
                .menu-item-anim:hover {
                    background: rgba(59, 130, 246, 0.08) !important;
                    color: #3b82f6 !important;
                    transform: translateX(3px);
                    padding-left: 15px !important;
                }
                .menu-item-anim:nth-child(1) { animation-delay: 0.02s; }
                .menu-item-anim:nth-child(2) { animation-delay: 0.04s; }
                .menu-item-anim:nth-child(3) { animation-delay: 0.06s; }
                .menu-item-anim:nth-child(4) { animation-delay: 0.08s; }
                .menu-item-anim:nth-child(5) { animation-delay: 0.10s; }
                .menu-item-anim:nth-child(6) { animation-delay: 0.12s; }
                .menu-item-anim:nth-child(7) { animation-delay: 0.14s; }
                .menu-item-anim:nth-child(8) { animation-delay: 0.16s; }

                .divider-anim {
                    transition: background 0.3s ease;
                }
                .floating-toolbar-anim:hover .divider-anim {
                    background: linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.3), transparent) !important;
                }

                .close-btn-anim {
                    transition: all 0.2s ease;
                }
                .close-btn-anim:hover {
                    transform: rotate(90deg) scale(1.1);
                    color: #ef4444 !important;
                    background: rgba(239, 68, 68, 0.1) !important;
                }

                .input-container-anim {
                    animation: dropdownSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
                }

                .textarea-focus-anim {
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .textarea-focus-anim:focus {
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
                    border-radius: 6px;
                }

                /* Custom scrollbar for dropdowns */
                .toolbar-dropdown-anim::-webkit-scrollbar,
                .highlight-menu-anim::-webkit-scrollbar {
                    width: 5px;
                }
                .toolbar-dropdown-anim::-webkit-scrollbar-track,
                .highlight-menu-anim::-webkit-scrollbar-track {
                    background: transparent;
                }
                .toolbar-dropdown-anim::-webkit-scrollbar-thumb,
                .highlight-menu-anim::-webkit-scrollbar-thumb {
                    background: rgba(59, 130, 246, 0.25);
                    border-radius: 99px;
                }
                .toolbar-dropdown-anim::-webkit-scrollbar-thumb:hover,
                .highlight-menu-anim::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.5);
                }

                /* Table button special hover */
                .table-btn-anim {
                    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .table-btn-anim:hover {
                    background: rgba(139, 92, 246, 0.08) !important;
                    color: #8b5cf6 !important;
                    transform: translateY(-1px);
                }
            `}</style>

            <div
                ref={toolbarRef}
                className="floating-toolbar glass-panel floating-toolbar-anim"
                style={style}
                onMouseDown={(e) => {
                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                    }
                }}
            >
                {!showInput ? (
                    <>
                        {isTableContext && (
                            <>
                                <div className="toolbar-group">
                                    <button className="tool-btn tool-btn-anim table-btn-anim" onClick={() => onFormat('modifyTable', { action: 'addRowAbove' })} title="Add Row Above"><ArrowUp size={14} /><Plus size={10} style={{ marginLeft: -4 }} /></button>
                                    <button className="tool-btn tool-btn-anim table-btn-anim" onClick={() => onFormat('modifyTable', { action: 'addRowBelow' })} title="Add Row Below"><ArrowDown size={14} /><Plus size={10} style={{ marginLeft: -4 }} /></button>
                                    <button className="tool-btn tool-btn-anim table-btn-anim" onClick={() => onFormat('modifyTable', { action: 'addColLeft' })} title="Add Col Left"><ArrowLeft size={14} /><Plus size={10} style={{ marginLeft: -4 }} /></button>
                                    <button className="tool-btn tool-btn-anim table-btn-anim" onClick={() => onFormat('modifyTable', { action: 'addColRight' })} title="Add Col Right"><ArrowRight size={14} /><Plus size={10} style={{ marginLeft: -4 }} /></button>
                                    <button className="tool-btn tool-btn-anim table-btn-anim" onClick={() => onFormat('modifyTable', { action: 'deleteRow' })} title="Delete Row"><Trash2 size={14} /><span style={{ fontSize: 10 }}>R</span></button>
                                    <button className="tool-btn tool-btn-anim table-btn-anim" onClick={() => onFormat('modifyTable', { action: 'deleteCol' })} title="Delete Col"><Trash2 size={14} /><span style={{ fontSize: 10 }}>C</span></button>
                                </div>
                                <div className="toolbar-divider divider-anim"></div>
                            </>
                        )}
                        <div className="toolbar-group">
                            {/* Font Family */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    className={`tool-btn tool-btn-anim ${showFontMenu ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowFontMenu(!showFontMenu);
                                        setShowSizeMenu(false);
                                        setShowHighlightMenu(false);
                                    }}
                                    title="Font Family"
                                    style={{ display: 'flex', alignItems: 'center' }}
                                >
                                    <Type size={16} />
                                    <ChevronDown size={10} style={{ marginLeft: 2, opacity: 0.7, transform: showFontMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                                </button>
                                {showFontMenu && (
                                    <div className="glass-panel toolbar-dropdown-anim" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, padding: 4, zIndex: 60, minWidth: 140, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                        {['Inter', 'Times New Roman', 'Arial', 'Calisto MT', 'Book Antiqua', 'Bookman Old Style', 'Angsana New', 'Calibri', 'Californian FB', 'Roboto', 'Open Sans', 'Lato', 'Georgia'].map(font => (
                                            <button
                                                key={font}
                                                onClick={() => { onFormat('fontName', font); setShowFontMenu(false); }}
                                                style={{ padding: '6px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: font }}
                                                className="menu-item-anim hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm"
                                            >
                                                {font}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Font Size */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    className={`tool-btn tool-btn-anim ${showSizeMenu ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowSizeMenu(!showSizeMenu);
                                        setShowFontMenu(false);
                                        setShowHighlightMenu(false);
                                    }}
                                    title="Font Size"
                                    style={{ display: 'flex', alignItems: 'center' }}
                                >
                                    <Hash size={16} />
                                    <ChevronDown size={10} style={{ marginLeft: 2, opacity: 0.7, transform: showSizeMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                                </button>
                                {showSizeMenu && (
                                    <div className="glass-panel toolbar-dropdown-anim" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, padding: 4, zIndex: 60, minWidth: 60, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                        {[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72].map(size => (
                                            <button
                                                key={size}
                                                onClick={() => { onFormat('customFontSize', size); setShowSizeMenu(false); }}
                                                style={{ padding: '6px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                                                className="menu-item-anim hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm"
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="toolbar-divider divider-anim"></div>

                            <button className="tool-btn tool-btn-anim" onClick={() => onFormat('bold')} title="Bold"><Bold size={16} /></button>
                            <button className="tool-btn tool-btn-anim" onClick={() => onFormat('italic')} title="Italic"><Italic size={16} /></button>
                            <button className="tool-btn tool-btn-anim" onClick={() => onFormat('underline')} title="Underline"><Underline size={16} /></button>
                            <button
                                className={`tool-btn tool-btn-anim ${showLinkInput ? 'active' : ''}`}
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
                                    className={`tool-btn tool-btn-anim ${showHighlightMenu ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowHighlightMenu(!showHighlightMenu);
                                        setShowFontMenu(false);
                                        setShowSizeMenu(false);
                                    }}
                                    title="Highlight Color"
                                    style={{ display: 'flex', alignItems: 'center', width: 'auto', padding: '0 4px' }}
                                >
                                    <Highlighter size={16} />
                                    <ChevronDown size={10} style={{ marginLeft: 2, opacity: 0.7, transform: showHighlightMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                                </button>
                                {showHighlightMenu && (
                                    <div className="highlight-menu glass-panel highlight-menu-anim" style={{ top: '100%', left: '50%', marginTop: '8px' }}>
                                        <button className="highlight-swatch swatch-anim" onClick={() => { onFormat('highlight', 'yellow'); setShowHighlightMenu(false); }} title="Yellow" style={{ background: '#fef08a' }} />
                                        <button className="highlight-swatch swatch-anim" onClick={() => { onFormat('highlight', 'green'); setShowHighlightMenu(false); }} title="Green" style={{ background: '#bbf7d0' }} />
                                        <button className="highlight-swatch swatch-anim" onClick={() => { onFormat('highlight', 'cyan'); setShowHighlightMenu(false); }} title="Cyan" style={{ background: '#a5f3fc' }} />
                                        <button className="highlight-swatch swatch-anim" onClick={() => { onFormat('highlight', 'magenta'); setShowHighlightMenu(false); }} title="Magenta" style={{ background: '#f5d0fe' }} />
                                        <button className="highlight-swatch swatch-anim" onClick={() => { onFormat('highlight', 'gray'); setShowHighlightMenu(false); }} title="Gray" style={{ background: '#e2e8f0' }} />
                                        <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 2px' }}></div>
                                        <button className="highlight-swatch swatch-anim" onClick={() => { onFormat('highlight', 'none'); setShowHighlightMenu(false); }} title="No Color" style={{ background: 'transparent', color: '#64748b' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="toolbar-divider divider-anim"></div>

                        <div className="toolbar-group">
                            <button className="tool-btn tool-btn-anim" onClick={() => onFormat('justifyLeft')} title="Align Left"><AlignLeft size={16} /></button>
                            <button className="tool-btn tool-btn-anim" onClick={() => onFormat('justifyCenter')} title="Align Center"><AlignCenter size={16} /></button>
                            <button className="tool-btn tool-btn-anim" onClick={() => onFormat('justifyRight')} title="Align Right"><AlignRight size={16} /></button>
                        </div>

                        <div className="toolbar-divider divider-anim"></div>

                        <button
                            className="btn-enhance enhance-btn-anim"
                            onClick={handleEnhanceClick}
                            title="Enhance with AI"
                        >
                            <span className="wand-float-anim" style={{ marginRight: 6 }}>
                                <Wand2 size={14} />
                            </span>
                            Enhance
                        </button>
                    </>
                ) : (
                    <>
                        {/* Link Input Mode */}
                        {showLinkInput ? (
                            <div className="flex items-center gap-2 p-1 input-container-anim">
                                <div className="input-anim" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <LinkIcon size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        className="text-sm bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 w-48 textarea-focus-anim"
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
                                </div>
                                <button
                                    className="btn-enhance enhance-btn-anim px-3 py-1 text-xs"
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
                                    className="close-btn-anim p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            /* AI Assist Mode */
                            <div className="flex items-center gap-2 p-1 input-container-anim">
                                <div className="input-anim" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flex: 1 }}>
                                    <span className="wand-float-anim" style={{ marginTop: '6px' }}>
                                        <Wand2 size={14} style={{ color: '#8b5cf6' }} />
                                    </span>
                                    <textarea
                                        className="text-sm bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 w-[500px] resize-none textarea-focus-anim"
                                        placeholder="How should I change this?"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        autoFocus
                                        rows={3}
                                    />
                                </div>
                                <button
                                    className="btn-enhance enhance-btn-anim px-3 py-1 text-xs"
                                    onClick={handleSubmitEnhance}
                                >
                                    Enhance
                                </button>
                                <button
                                    onClick={() => setShowInput(false)}
                                    className="close-btn-anim p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default FloatingToolbar;
import React, { useState } from 'react';
import {
    Save, Wand2, Download, Undo, Redo,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    Subscript, Superscript, List, ListOrdered, FileDown, FileText, ChevronDown, Highlighter
} from 'lucide-react';

const EditorToolbar = ({
    execCommand,
    onExportPDF,
    onExportWord,
    onSave,
    draftName,
    setDraftName,
    showHeader,
    setShowHeader,
    showFooter,
    setShowFooter,
    onModify
}) => {
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);

    return (
        <div className="editor-toolbar glass-panel">
            <div className="toolbar-group">
                <select className="font-select" onChange={(e) => execCommand('fontName', e.target.value)}>
                    <option value="Inter">Inter</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Calisto MT">Calisto MT</option>
                    <option value="Book Antiqua">Book Antiqua</option>
                    <option value="Bookman Old Style">Bookman Old Style</option>
                    <option value="Angsana New">Angsana New</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Californian FB">Californian FB</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Georgia">Georgia</option>
                </select>
                <select className="size-select" onChange={(e) => execCommand('customFontSize', e.target.value)}>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                    <option value="14">14</option>
                    <option value="16">16</option>
                    <option value="18">18</option>
                    <option value="20">20</option>
                    <option value="22">22</option>
                    <option value="24">24</option>
                    <option value="26">26</option>
                    <option value="28">28</option>
                    <option value="36">36</option>
                    <option value="48">48</option>
                    <option value="72">72</option>
                </select>
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-group">
                {/* Change Case Dropdown */}
                {/* Change Case Dropdown - Custom UI */}
                <div style={{ position: 'relative' }}>
                    <button
                        className="tool-btn"
                        onClick={() => setShowExportMenu(prev => prev === 'case' ? false : 'case')}
                        title="Change Case"
                        style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <span style={{ fontSize: '15px', fontWeight: 600 }}>Aa</span>
                        <ChevronDown size={12} style={{ marginLeft: 2, opacity: 0.7 }} />
                    </button>
                    {showExportMenu === 'case' && (
                        <div className="export-menu glass-panel" style={{ minWidth: '180px', left: 0 }}>
                            <button onClick={() => { execCommand('changeCase', 'sentence'); setShowExportMenu(false); }} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                                Sentence case.
                            </button>
                            <button onClick={() => { execCommand('changeCase', 'lower'); setShowExportMenu(false); }} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                                lowercase
                            </button>
                            <button onClick={() => { execCommand('changeCase', 'upper'); setShowExportMenu(false); }} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                                UPPERCASE
                            </button>
                            <button onClick={() => { execCommand('changeCase', 'capitalize'); setShowExportMenu(false); }} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                                Capitalize Each Word
                            </button>
                            {/* <button onClick={() => { execCommand('changeCase', 'toggle'); setShowExportMenu(false); }}>
                                tOGGLE cASE
                            </button> */}
                        </div>
                    )}
                </div>
                <div className="toolbar-divider"></div>
                <button className="tool-btn" onClick={() => execCommand('undo')} title="Undo"><Undo size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('redo')} title="Redo"><Redo size={18} /></button>
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-group">
                <button className="tool-btn" onClick={() => execCommand('bold')} title="Bold"><Bold size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('italic')} title="Italic"><Italic size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('underline')} title="Underline"><Underline size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('subscript')} title="Subscript"><Subscript size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('superscript')} title="Superscript"><Superscript size={18} /></button>

                {/* Highlight Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        className="tool-btn"
                        onClick={() => setShowHighlightMenu(!showHighlightMenu)}
                        title="Highlight Color"
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <Highlighter size={18} />
                        <ChevronDown size={12} style={{ marginLeft: 2, opacity: 0.7 }} />
                    </button>
                    {showHighlightMenu && (
                        <div className="highlight-menu glass-panel">
                            <button className="highlight-swatch" onClick={() => { execCommand('highlight', 'yellow'); setShowHighlightMenu(false); }} title="Yellow" style={{ background: '#fef08a' }} />
                            <button className="highlight-swatch" onClick={() => { execCommand('highlight', 'green'); setShowHighlightMenu(false); }} title="Green" style={{ background: '#bbf7d0' }} />
                            <button className="highlight-swatch" onClick={() => { execCommand('highlight', 'cyan'); setShowHighlightMenu(false); }} title="Cyan" style={{ background: '#a5f3fc' }} />
                            <button className="highlight-swatch" onClick={() => { execCommand('highlight', 'magenta'); setShowHighlightMenu(false); }} title="Magenta" style={{ background: '#f5d0fe' }} />
                            <button className="highlight-swatch" onClick={() => { execCommand('highlight', 'gray'); setShowHighlightMenu(false); }} title="Gray" style={{ background: '#e2e8f0' }} />
                            <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 2px' }}></div>
                            <button className="highlight-swatch" onClick={() => { execCommand('highlight', 'none'); setShowHighlightMenu(false); }} title="No Color" style={{ background: 'transparent', color: '#64748b' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-group">
                <button className="tool-btn" onClick={() => execCommand('justifyLeft')} title="Align Left"><AlignLeft size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('justifyCenter')} title="Align Center"><AlignCenter size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('justifyRight')} title="Align Right"><AlignRight size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('insertUnorderedList')} title="Bullet List"><List size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('insertOrderedList')} title="Numbered List"><ListOrdered size={18} /></button>
            </div>
            <div className="toolbar-divider"></div>

            {/* Header/Footer Toggles */}
            <div className="toolbar-group">
                <button
                    className={`tool-btn ${showHeader ? 'active' : ''}`}
                    onClick={() => setShowHeader(!showHeader)}
                    title="Toggle Header"
                    style={{ color: showHeader ? 'var(--primary)' : 'inherit', background: showHeader ? '#f1f5f9' : 'transparent' }}
                >
                    Header
                </button>
                <button
                    className={`tool-btn ${showFooter ? 'active' : ''}`}
                    onClick={() => setShowFooter(!showFooter)}
                    title="Toggle Footer"
                    style={{ color: showFooter ? 'var(--primary)' : 'inherit', background: showFooter ? '#f1f5f9' : 'transparent' }}
                >
                    Footer
                </button>
            </div>
            <div className="toolbar-divider"></div>

            <div className="toolbar-group" style={{ flex: 2, padding: '0 16px', minWidth: '150px' }}>
                <input
                    type="text"
                    value={draftName || ''}
                    onChange={(e) => setDraftName && setDraftName(e.target.value)}
                    placeholder="Untitled Draft"
                    className="draft-name-input"
                    style={{
                        width: '100%',
                        padding: '6px 12px',
                        border: '1px solid transparent',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#1e293b',
                        background: 'transparent',
                        transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                        e.target.style.background = '#f1f5f9';
                        e.target.style.borderColor = '#cbd5e1';
                    }}
                    onBlur={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderColor = 'transparent';
                    }}
                />
            </div>
            <div className="spacer"></div>
            <div className="toolbar-actions">
                <button className="btn btn-primary btn-sm" onClick={onModify}>
                    <Wand2 size={16} style={{ marginRight: 8 }} />
                    Modify Draft
                </button>
                <button className="btn btn-ghost btn-sm" onClick={onSave}>
                    <Save size={16} style={{ marginRight: 8 }} />
                    Save
                </button>
                <div style={{ position: 'relative' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowExportMenu(!showExportMenu)}>
                        <Download size={16} />
                    </button>
                    {showExportMenu && (
                        <div className="export-menu glass-panel">
                            <button onClick={() => { onExportPDF(); setShowExportMenu(false); }}>
                                <FileDown size={16} /> Export as PDF
                            </button>
                            <button onClick={() => { onExportWord(); setShowExportMenu(false); }}>
                                <FileText size={16} /> Export as Word
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorToolbar;

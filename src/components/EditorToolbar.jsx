import React, { useState } from 'react';
import {
    Save, Wand2, Download, Undo, Redo,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    Subscript, Superscript, List, ListOrdered, FileDown, FileText
} from 'lucide-react';

const EditorToolbar = ({ execCommand, onExportPDF, onExportWord, onSave }) => {
    const [showExportMenu, setShowExportMenu] = useState(false);

    return (
        <div className="editor-toolbar glass-panel">
            <div className="toolbar-group">
                <select className="font-select" onChange={(e) => execCommand('fontName', e.target.value)}>
                    <option value="Inter">Inter</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Georgia">Georgia</option>
                </select>
                <select className="size-select" onChange={(e) => execCommand('fontSize', e.target.value)}>
                    <option value="3">12</option>
                    <option value="4">14</option>
                    <option value="5">18</option>
                    <option value="6">24</option>
                    <option value="7">30</option>
                </select>
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-group">
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
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-group">
                <button className="tool-btn" onClick={() => execCommand('justifyLeft')} title="Align Left"><AlignLeft size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('justifyCenter')} title="Align Center"><AlignCenter size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('justifyRight')} title="Align Right"><AlignRight size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('insertUnorderedList')} title="Bullet List"><List size={18} /></button>
                <button className="tool-btn" onClick={() => execCommand('insertOrderedList')} title="Numbered List"><ListOrdered size={18} /></button>
            </div>
            <div className="spacer"></div>
            <div className="toolbar-actions">
                <button className="btn btn-primary btn-sm">
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

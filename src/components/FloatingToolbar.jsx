import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Wand2 } from 'lucide-react';

const FloatingToolbar = ({ position, onFormat, onEnhance, visible }) => {
    const toolbarRef = useRef(null);

    if (!visible) return null;

    // Prevent toolbar from going off-screen (basic bounds checking)
    const style = {
        top: `${position.y}px`,
        left: `${position.x}px`,
        position: 'fixed',
        zIndex: 1000,
        transform: 'translate(-50%, -100%) translateY(-10px)', // Center horizontally, place above
    };

    return (
        <div
            ref={toolbarRef}
            className="floating-toolbar glass-panel"
            style={style}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing focus from editor
        >
            <div className="toolbar-group">
                <button className="tool-btn" onClick={() => onFormat('bold')} title="Bold"><Bold size={16} /></button>
                <button className="tool-btn" onClick={() => onFormat('italic')} title="Italic"><Italic size={16} /></button>
                <button className="tool-btn" onClick={() => onFormat('underline')} title="Underline"><Underline size={16} /></button>
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
                onClick={onEnhance}
                title="Enhance with AI"
            >
                <Wand2 size={14} style={{ marginRight: 6 }} />
                Enhance
            </button>
        </div>
    );
};

export default FloatingToolbar;

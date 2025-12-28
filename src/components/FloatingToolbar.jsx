import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Wand2, X } from 'lucide-react';

const FloatingToolbar = ({ position, onFormat, onEnhance, visible }) => {
    const toolbarRef = useRef(null);
    const [showInput, setShowInput] = useState(false);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (!visible) {
            setShowInput(false);
            setInputValue('');
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
                        onClick={handleEnhanceClick}
                        title="Enhance with AI"
                    >
                        <Wand2 size={14} style={{ marginRight: 6 }} />
                        Enhance
                    </button>
                </>
            ) : (
                <div className="flex items-center gap-2 p-1">
                    <input
                        type="text"
                        className="text-sm bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 w-48"
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
        </div>
    );
};

export default FloatingToolbar;

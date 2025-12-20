import React, { useRef, useEffect } from 'react';
import {
    Bold, Italic, Underline,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered
} from 'lucide-react';

const MiniEditor = ({ value, onChange, placeholder, style }) => {
    const editorRef = useRef(null);

    // Initial value setup
    useEffect(() => {
        if (editorRef.current && value && editorRef.current.innerHTML !== value) {
            if (!editorRef.current.innerHTML.trim()) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const exec = (command, val = null) => {
        document.execCommand(command, false, val);
        triggerChange();
    };

    const triggerChange = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            onChange(html);
        }
    };

    // Toolbar button helper
    const Btn = ({ icon: Icon, cmd, arg, title }) => (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                exec(cmd, arg);
            }}
            className="mini-tool-btn"
            title={title}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Icon size={16} />
        </button>
    );

    return (
        <div className="mini-editor" style={{
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--surface)',
            overflow: 'hidden',
            ...style
        }}>
            {/* Toolbar */}
            <div className="mini-toolbar" style={{
                display: 'flex',
                gap: '4px',
                padding: '8px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-hover)'
            }}>
                <Btn icon={Bold} cmd="bold" title="Bold" />
                <Btn icon={Italic} cmd="italic" title="Italic" />
                <Btn icon={Underline} cmd="underline" title="Underline" />

                <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />

                {/* Font Family Selector */}
                <select
                    onChange={(e) => exec('fontName', e.target.value)}
                    style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        background: 'transparent',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                    defaultValue="Inter"
                >
                    <option value="Inter">Inter</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier</option>
                </select>

                {/* Font Size Selector */}
                <select
                    onChange={(e) => exec('fontSize', e.target.value)}
                    style={{
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        background: 'transparent',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                    defaultValue="3"
                >
                    <option value="1">Small</option>
                    <option value="3">Normal</option>
                    <option value="5">Large</option>
                    <option value="7">Extra Large</option>
                </select>

                <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />

                <Btn icon={AlignLeft} cmd="justifyLeft" title="Align Left" />
                <Btn icon={AlignCenter} cmd="justifyCenter" title="Align Center" />
                <Btn icon={AlignRight} cmd="justifyRight" title="Align Right" />

                <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />

                <Btn icon={List} cmd="insertUnorderedList" title="Bullet List" />
                <Btn icon={ListOrdered} cmd="insertOrderedList" title="Numbered List" />
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                className="mini-content"
                onInput={triggerChange}
                onBlur={triggerChange}
                style={{
                    minHeight: '100px',
                    padding: '12px',
                    outline: 'none',
                    fontSize: '14px',
                    lineHeight: '1.5'
                }}
                suppressContentEditableWarning
            />

            {!value && (
                <div style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    padding: '12px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    display: 'none'
                }}>
                    {placeholder}
                </div>
            )}
        </div>
    );
};

export default MiniEditor;

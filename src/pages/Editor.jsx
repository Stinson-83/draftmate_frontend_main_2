import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import EditorToolbar from '../components/EditorToolbar';
import VariablesSidebar from '../components/VariablesSidebar';
import AiSidebar from '../components/AiSidebar';
import './Editor.css';

const Editor = () => {
    const location = useLocation();
    const [prompt, setPrompt] = useState(location.state?.prompt || '');
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('ai');
    const [notes, setNotes] = useState('');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [variablesBold, setVariablesBold] = useState(true);

    const documentRef = useRef(null);
    const mainContainerRef = useRef(null);

    const [placeholders, setPlaceholders] = useState([]);
    const [deletedPlaceholders, setDeletedPlaceholders] = useState([]);

    const [chatMessages, setChatMessages] = useState([
        { role: 'ai', content: 'Hello! I am your AI legal assistant. I can help you research case laws, draft clauses, or answer legal queries based on Indian Law.' }
    ]);
    const [chatInput, setChatInput] = useState('');

    // Helper: Convert PDF fixed layout HTML to flowable content
    const cleanPdfHtml = (htmlContent) => {
        // If content doesn't look like our PDF output (no absolute positioning or specific classes), return as-is
        if (!htmlContent.includes('content-element') && !htmlContent.includes('absolute')) {
            return htmlContent;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const elements = Array.from(doc.querySelectorAll('.content-element, .text-span, span[style*="absolute"]'));

        if (elements.length === 0) return htmlContent;

        // Group by approximate Y (top) position to form lines
        const rows = new Map();
        const TOLERANCE = 5; // px

        elements.forEach(el => {
            let top = parseFloat(el.style.top || '0');
            // Find existing row within tolerance
            let rowKey = Array.from(rows.keys()).find(k => Math.abs(parseFloat(k) - top) < TOLERANCE);

            if (!rowKey) {
                rowKey = top.toString();
                rows.set(rowKey, []);
            }
            rows.get(rowKey).push(el);
        });

        // Sort rows by Y position
        const sortedRowKeys = Array.from(rows.keys()).sort((a, b) => parseFloat(a) - parseFloat(b));

        // Build new HTML
        let cleanHtml = '';

        sortedRowKeys.forEach(key => {
            const rowElements = rows.get(key);
            // Sort elements in row by X (left) position
            rowElements.sort((a, b) => {
                const leftA = parseFloat(a.style.left || '0');
                const leftB = parseFloat(b.style.left || '0');
                return leftA - leftB;
            });

            // Create a paragraph for this line
            cleanHtml += '<p>';

            rowElements.forEach(el => {
                // Extract style metadata we want to preserve
                const styles = el.style;
                const relevantStyles = [];

                if (styles.fontWeight && styles.fontWeight !== 'normal') relevantStyles.push(`font-weight:${styles.fontWeight}`);
                if (styles.fontStyle && styles.fontStyle !== 'normal') relevantStyles.push(`font-style:${styles.fontStyle}`);
                if (styles.textDecoration && styles.textDecoration !== 'none') relevantStyles.push(`text-decoration:${styles.textDecoration}`);
                // if (styles.color && styles.color !== 'rgb(0, 0, 0)' && styles.color !== '#000000') relevantStyles.push(`color:${styles.color}`);
                // if (styles.fontSize) relevantStyles.push(`font-size:${styles.fontSize}`);

                const styleString = relevantStyles.length > 0 ? `style="${relevantStyles.join(';')}"` : '';
                cleanHtml += `<span ${styleString}>${el.innerHTML} </span>`;
            });

            cleanHtml += '</p>';
        });

        return cleanHtml;
    };

    // Handle uploaded content and details - enhanced variable detection
    useEffect(() => {
        if (location.state?.htmlContent) {
            // Clean content first
            let content = cleanPdfHtml(location.state.htmlContent);
            const detectedPlaceholders = [];

            // Helper to add placeholder if not exists
            const addPlaceholder = (key, label) => {
                // Use last few words for the key if label is long
                let keyBase = key;
                const words = key.split(/\s+/);
                if (words.length > 5) {
                    keyBase = words.slice(-5).join(' ');
                }

                const cleanKey = keyBase.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

                if (cleanKey && cleanKey.length > 1 && !detectedPlaceholders.find(p => p.key === cleanKey)) {
                    detectedPlaceholders.push({
                        key: cleanKey,
                        label: label.trim(), // Keep full label for the sidebar
                        value: ''
                    });
                }
                return cleanKey;
            };

            // Regex Pattern: Text inside square brackets, e.g., [Name] or [Client Name]
            const bracketPattern = /\[([^\]]+)\]/g;

            content = content.replace(bracketPattern, (match, label) => {
                // Label is the text inside tags. Clean it up for the key.
                const cleanLabel = label.trim();

                // Ignore very short or effectively empty brackets
                if (cleanLabel.length < 1) return match;

                const key = addPlaceholder(cleanLabel, cleanLabel);

                // Wrap in variable span but display normally with brackets
                return `<span class="variable" data-key="${key}" data-original-content="${label}" contenteditable="false">[${cleanLabel}]</span>`;
            });

            // Update document content
            setTimeout(() => {
                if (documentRef.current) {
                    documentRef.current.innerHTML = content;
                }
            }, 100);

            // Update placeholders - replace defaults with detected ones
            if (detectedPlaceholders.length > 0) {
                setPlaceholders(detectedPlaceholders);
            }
        } else if (location.state?.isEmpty) {
            setPlaceholders([]);
        }

        if (location.state?.uploadDetails) {
            setNotes(prev => prev + (prev ? '\n\n' : '') + `Upload Details:\n${location.state.uploadDetails}`);
            setActiveTab('notes');
        }
    }, [location.state]);

    // Update variable styles when settings change
    useEffect(() => {
        if (!documentRef.current) return;
        const variables = documentRef.current.querySelectorAll('.variable');
        variables.forEach(v => {
            v.style.fontWeight = variablesBold ? 'bold' : 'normal';
        });
    }, [variablesBold]);

    // Update DOM when placeholders change
    React.useEffect(() => {
        if (!documentRef.current) return;

        placeholders.forEach(p => {
            const elements = documentRef.current.querySelectorAll(`.variable[data-key="${p.key}"]`);
            elements.forEach(el => {
                // If value exists, show value (without brackets?), or user wants [value]?
                // User said: "remove that they should look like a normal text on the editor placed between [] square brackets"
                // AND "The text displayed over the boxex in the left panel should be the the text inside the placeholder"

                // If the user inputs a value, usually we replace the placeholder [Name] with "John Doe". 
                // BUT the instructions say: "look like a normal text... placed between [] square brackets".
                // This implies even the VALUE might be shown in brackets? 
                // OR likely, the placeholder STATE is [Name], and when filled, it becomes the value.

                // Let's assume standard behavior: [Name] -> Value.
                // UNLESS the user implies the *unfilled* state is [Name] (which we did above).

                if (p.value) {
                    el.innerText = p.value;
                    // Optional: remove brackets when filled? Or keep them? 
                    // Standard doc automation removes brackets.
                    // If user wants brackets around value: `[${p.value}]`
                } else {
                    // Empty state -> show label in brackets
                    el.innerText = `[${p.label}]`;
                }
            });
        });
    }, [placeholders]);

    const handlePlaceholderChange = (key, newValue) => {
        setPlaceholders(prev => prev.map(p => p.key === key ? { ...p, value: newValue } : p));
    };

    const handleRemovePlaceholder = (key) => {
        const placeholder = placeholders.find(p => p.key === key);
        if (!placeholder) return;

        // Move to deleted
        setDeletedPlaceholders(prev => [...prev, placeholder]);
        setPlaceholders(prev => prev.filter(p => p.key !== key));

        // Update DOM - change to "deleted" state (just text)
        if (documentRef.current) {
            const elements = documentRef.current.querySelectorAll(`.variable[data-key="${key}"]`);
            elements.forEach(el => {
                el.classList.remove('variable');
                el.classList.add('variable-deleted');
                // Revert to original content or current text?
                // contentEditable true to allow manual edit
                el.contentEditable = 'true';
            });
        }
    };

    const handleRestorePlaceholder = (key) => {
        const placeholder = deletedPlaceholders.find(p => p.key === key);
        if (!placeholder) return;

        // Move back to active
        setPlaceholders(prev => [...prev, placeholder]);
        setDeletedPlaceholders(prev => prev.filter(p => p.key !== key));

        // Update DOM - restore "variable" state
        if (documentRef.current) {
            const elements = documentRef.current.querySelectorAll(`.variable-deleted[data-key="${key}"]`);
            elements.forEach(el => {
                el.classList.remove('variable-deleted');
                el.classList.add('variable');
                el.contentEditable = 'false';
            });
        }
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        setChatMessages([...chatMessages, { role: 'user', content: chatInput }]);
        setChatInput('');
        setTimeout(() => {
            setChatMessages(prev => [...prev, { role: 'ai', content: 'I am processing your request. This is a demo response.' }]);
        }, 1000);
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
    };

    const handleExportPDF = () => {
        const element = documentRef.current;
        // Clone the element to remove contentEditable and ensure clean styles
        const clone = element.cloneNode(true);
        clone.removeAttribute('contentEditable');
        clone.style.boxShadow = 'none';
        clone.style.margin = '0';

        // Clean up variables for export (remove highlights)
        const variables = clone.querySelectorAll('.variable');
        variables.forEach(v => {
            v.style.backgroundColor = 'transparent';
            v.style.color = 'inherit';
            v.style.border = 'none';
            v.style.padding = '0';
            v.style.borderRadius = '0';
            v.removeAttribute('contenteditable');
            v.removeAttribute('data-key');
        });

        const opt = {
            margin: [10, 10, 10, 10], // top, left, bottom, right
            filename: 'legal_draft.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(clone).save();
    };

    const handleExportWord = () => {
        // Clone and clean up for Word export
        const clone = documentRef.current.cloneNode(true);
        const variables = clone.querySelectorAll('.variable');
        variables.forEach(v => {
            v.style.backgroundColor = 'transparent';
            v.style.color = 'inherit';
            v.style.border = 'none';
            v.style.padding = '0';
            v.style.borderRadius = '0';
            v.removeAttribute('contenteditable');
            v.removeAttribute('data-key');
        });

        const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Legal Draft</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
          p { margin-bottom: 1em; }
          h1 { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; }
        </style>
      </head>
      <body>`;
        const footer = "</body></html>";
        const content = clone.innerHTML;
        const sourceHTML = header + content + footer;

        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = 'legal_draft.doc';
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 10, 200));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 10, 50));
    };

    const handleFitWidth = () => {
        if (mainContainerRef.current) {
            const containerWidth = mainContainerRef.current.clientWidth;
            // A4 width in px (approx) + padding
            const documentWidth = 816 + 100;
            const newZoom = Math.floor((containerWidth / documentWidth) * 100);
            setZoomLevel(Math.min(Math.max(newZoom - 5, 50), 150));
        }
    };

    // Pagination constants (A4 at 96 DPI)
    const PAGE_HEIGHT = 1056;
    const PAGE_PADDING = 72; // Matches CSS padding (3/4 inch)
    const MAX_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING * 2; // 912px available content area

    // Ref to track pages container
    const pagesContainerRef = useRef(null);

    // State for page count (for zoom-wrapper sizing)
    const [pageCount, setPageCount] = useState(1);

    // State for document stats
    const [wordCount, setWordCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    // Helper: ensure editor-root exists in page
    const initEmptyEditor = (pageEl) => {
        let ed = pageEl.querySelector('.editor-root');
        if (!ed) {
            ed = document.createElement('div');
            ed.setAttribute('contenteditable', 'true');
            ed.className = 'editor-root';
            ed.style.outline = 'none';
            ed.style.whiteSpace = 'normal';
            ed.style.lineHeight = '1.6';
            ed.style.wordBreak = 'break-word';
            ed.style.overflowWrap = 'anywhere';
            ed.style.width = '100%';
            ed.style.maxWidth = '100%';
            pageEl.appendChild(ed);
        }
        return ed;
    };

    // Helper: create or get next page
    const ensureNextPage = (currentPage) => {
        let next = currentPage.nextElementSibling;
        if (!next || !next.classList.contains('document-page')) {
            next = document.createElement('div');
            next.className = 'document-page';
            initEmptyEditor(next);
            currentPage.parentElement?.insertBefore(next, currentPage.nextSibling);
        }
        return next;
    };

    // Pagination function - exactly like DocumentPreview.tsx
    const paginateAll = useCallback(() => {
        const container = pagesContainerRef.current;
        if (!container) return;

        let safety = 0;
        let changed = true;
        let movedToNextPage = null; // Track if content was moved to next page

        while (changed && safety < 20) {
            changed = false;
            safety++;
            const pages = Array.from(container.querySelectorAll('.document-page'));

            // Forward pass: push overflow to next page
            for (let i = 0; i < pages.length; i++) {
                const pageEl = pages[i];
                const editor = initEmptyEditor(pageEl);

                while (editor.scrollHeight > MAX_CONTENT_HEIGHT && editor.lastChild) {
                    const next = ensureNextPage(pageEl);
                    const nextEditor = initEmptyEditor(next);

                    // Check if cursor is in the element being moved
                    const selection = window.getSelection();
                    const movingEl = editor.lastChild;
                    const cursorInMovingEl = selection && selection.rangeCount > 0 &&
                        movingEl.contains(selection.getRangeAt(0).startContainer);

                    nextEditor.insertBefore(movingEl, nextEditor.firstChild);
                    changed = true;

                    // Mark that we need to move cursor to next page
                    if (cursorInMovingEl) {
                        movedToNextPage = nextEditor;
                    }
                }
            }

            // Backward pass: pull content up if there's room
            for (let i = pages.length - 2; i >= 0; i--) {
                const pageEl = pages[i];
                const nextEl = pages[i + 1];
                const editor = initEmptyEditor(pageEl);
                const nextEditor = initEmptyEditor(nextEl);

                while (editor.scrollHeight < MAX_CONTENT_HEIGHT && nextEditor.firstChild) {
                    editor.appendChild(nextEditor.firstChild);
                    changed = true;
                }

                // Remove empty trailing page
                if (i === pages.length - 2 && !nextEditor.firstChild) {
                    nextEl.remove();
                    changed = true;
                }
            }
        }

        // If content was moved to next page, place cursor there
        if (movedToNextPage && movedToNextPage.firstChild) {
            const selection = window.getSelection();
            const range = document.createRange();

            // Place cursor at end of first element in new page
            const firstEl = movedToNextPage.firstChild;
            if (firstEl.nodeType === Node.TEXT_NODE) {
                range.setStart(firstEl, firstEl.textContent.length);
            } else if (firstEl.lastChild) {
                range.setStartAfter(firstEl.lastChild);
            } else {
                range.setStart(firstEl, 0);
            }
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);

            // Scroll the new page into view
            movedToNextPage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Update page count for zoom-wrapper
        const finalCount = container.querySelectorAll('.document-page').length;
        if (finalCount !== pageCount) {
            setPageCount(finalCount);
        }

        // Update word count
        const allText = container.textContent || '';
        const words = allText.trim().split(/\s+/).filter(w => w.length > 0).length;
        setWordCount(words);

        // Move cursor to next page if content was pushed there
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const cursorNode = range.startContainer;

            // Find which page the cursor is in now
            const pages = Array.from(container.querySelectorAll('.document-page'));
            for (let i = 0; i < pages.length; i++) {
                if (pages[i].contains(cursorNode)) {
                    setCurrentPage(i + 1);
                    break;
                }
            }
        }
    }, [pageCount]);



    // Listen for content changes
    useEffect(() => {
        const container = pagesContainerRef.current;
        if (!container) return;

        const schedule = () => requestAnimationFrame(paginateAll);

        container.addEventListener('input', schedule, true);
        container.addEventListener('paste', schedule, true);
        container.addEventListener('keyup', schedule, true);

        // Initial pagination
        setTimeout(paginateAll, 100);

        return () => {
            container.removeEventListener('input', schedule, true);
            container.removeEventListener('paste', schedule, true);
            container.removeEventListener('keyup', schedule, true);
        };
    }, [paginateAll]);

    // Auto-fit when sidebars change
    useEffect(() => {
        const timer = setTimeout(() => {
            handleFitWidth();
        }, 350);
        return () => clearTimeout(timer);
    }, [leftSidebarOpen, rightSidebarOpen]);

    return (
        <div className="editor-container">
            <EditorToolbar
                execCommand={execCommand}
                onExportPDF={handleExportPDF}
                onExportWord={handleExportWord}
            />

            <div className="editor-layout">
                <VariablesSidebar
                    isOpen={leftSidebarOpen}
                    toggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
                    placeholders={placeholders}
                    deletedPlaceholders={deletedPlaceholders}
                    variablesBold={variablesBold}
                    setVariablesBold={setVariablesBold}
                    onPlaceholderChange={handlePlaceholderChange}
                    onRemovePlaceholder={handleRemovePlaceholder}
                    onRestorePlaceholder={handleRestorePlaceholder}
                />

                {/* Center: Document */}
                <div className="editor-main" ref={mainContainerRef}>
                    <div
                        className="zoom-wrapper"
                        style={{
                            width: `${816 * zoomLevel / 100 + 48}px`,
                            minHeight: `${(PAGE_HEIGHT * pageCount + 24 * (pageCount - 1)) * zoomLevel / 100 + 48}px`,
                        }}
                    >
                        <div
                            className="pages-wrapper"
                            ref={pagesContainerRef}
                            style={{
                                transform: `scale(${zoomLevel / 100})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            {/* First page with content */}
                            <div className="document-page">
                                <div
                                    className="editor-root"
                                    contentEditable
                                    suppressContentEditableWarning
                                    ref={documentRef}
                                >
                                    {!location.state?.htmlContent && !location.state?.isEmpty && (
                                        <p><br /></p>
                                    )}
                                    {location.state?.isEmpty && (
                                        <p><br /></p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Zoom Controls and Stats - Fixed at bottom right */}
                <div className="zoom-controls-container">
                    <div className="document-stats">
                        <span>Page {currentPage} of {pageCount}</span>
                        <span className="divider">|</span>
                        <span>{wordCount} words</span>
                    </div>
                    <div className="zoom-controls glass-panel">
                        <button onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={16} /></button>
                        <span className="zoom-level">{zoomLevel}%</span>
                        <button onClick={handleZoomIn} title="Zoom In"><ZoomIn size={16} /></button>
                        <div className="divider"></div>
                        <button onClick={handleFitWidth} title="Fit to Width"><Maximize size={16} /></button>
                    </div>
                </div>

                <AiSidebar
                    isOpen={rightSidebarOpen}
                    toggle={() => setRightSidebarOpen(!rightSidebarOpen)}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    chatMessages={chatMessages}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    handleSendMessage={handleSendMessage}
                    notes={notes}
                    setNotes={setNotes}
                />
            </div>
        </div >
    );
};

export default Editor;

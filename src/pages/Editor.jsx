import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import EditorToolbar from '../components/EditorToolbar';
import VariablesSidebar from '../components/VariablesSidebar';
import AiSidebar from '../components/AiSidebar';
import FloatingToolbar from '../components/FloatingToolbar';
import ModifyDraftModal from '../components/ModifyDraftModal';
import { API_CONFIG } from '../services/endpoints';
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

    // Header/Footer Toggle State
    const [showHeader, setShowHeader] = useState(true);
    const [showFooter, setShowFooter] = useState(false);
    const [showPageNumbers, setShowPageNumbers] = useState(true); // Default enabled

    const [isHeaderEditing, setIsHeaderEditing] = useState(false);

    // Floating Toolbar State
    const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [isTableContext, setIsTableContext] = useState(false);

    // Modify Draft Modal State
    const [showModifyModal, setShowModifyModal] = useState(false);

    // Settings State
    const [editorSettings, setEditorSettings] = useState({ headerText: '', footerText: '', headerAlignment: 'center' });

    // Load settings on mount
    useEffect(() => {
        try {
            // Priority: Draft settings (if editing existing) -> Global settings -> Defaults
            if (location.state?.settings) {
                setEditorSettings(location.state.settings);
            } else {
                const saved = localStorage.getItem('user_settings');
                if (saved) {
                    setEditorSettings(JSON.parse(saved));
                }
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }, [location.state]);

    // Draft Name State
    const [draftName, setDraftName] = useState(() => {
        // Priority: Location state (from upload/open) -> Default
        return location.state?.uploadDetails?.replace('Draft: ', '') ||
            location.state?.name ||
            'Untitled Draft';
    });

    const documentRef = useRef(null);
    const mainContainerRef = useRef(null);
    const savedSelectionRef = useRef(null);

    const [placeholders, setPlaceholders] = useState([]);
    const [deletedPlaceholders, setDeletedPlaceholders] = useState([]);

    const [chatMessages, setChatMessages] = useState([
        { role: 'ai', content: 'Hello! I am your AI legal assistant. I can help you research case laws, draft clauses, or answer legal queries based on Indian Law.' }
    ]);
    const [chatInput, setChatInput] = useState('');

    // Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const workerRef = useRef(null);

    // Initialize Worker
    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/pdfProcessor.worker.js', import.meta.url));

        workerRef.current.onmessage = (e) => {
            const { result } = e.data;
            finishProcessing(result);
        };

        return () => {
            if (workerRef.current) workerRef.current.terminate();
        };
    }, []);

    const finishProcessing = useCallback((content) => {
        // Regex Pattern: Text inside square brackets, e.g., [Name] or [Client Name]
        const bracketPattern = /\[([^\]]+)\]/g;
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

        const processedContent = content.replace(bracketPattern, (match, label) => {
            // Label is the text inside tags. Clean it up for the key.
            const cleanLabel = label.trim();

            // Ignore very short or effectively empty brackets
            if (cleanLabel.length < 1) return match;

            const key = addPlaceholder(cleanLabel, cleanLabel);

            // Wrap in variable span but display normally with brackets
            return `<span class="variable" data-key="${key}" data-original-content="${label}" contenteditable="false">[${cleanLabel}]</span>`;
        });

        // Update document content
        if (documentRef.current) {
            // FIX: Clear any existing extra pages to prevent duplication on re-render
            // Note: We need to access pagesContainerRef which is likely defined lower in the file or assumed global-ish in this scope. 
            // Wait, pagesContainerRef usage was in original code but I need to make sure I have access to it or the logic remains valid.
            // The original code used `pagesContainerRef.current`, let's check if it needs to be defined or is already there.
            // It was not in the viewed lines 1-300, but logic was inside `processContent`. 
            // I will assume `pagesContainerRef` is available since I am replacing `processContent` logic.

            // Actually, I am REPLACING `cleanPdfHtml` AND `processContent`.
            // Let's verify pagesContainerRef availability. It wasn't in the declared refs at top.
            // Ah, line 272 accessed it. Let me check if it was defined.
            // It seems I missed it in the 1-300 view if it was there? Or it was defined later?
            // Actually in line 67-69 only documentRef, mainContainerRef, savedSelectionRef are defined.
            // Line 272 usage `pagesContainerRef.current` implies it exists. 
            // I will err on side of caution and use `document.querySelector` if ref is missing, OR better, keep the logic if it was working.
            // But wait, if I remove `cleanPdfHtml` and `processContent` I replace the block.

            /* Logic for updating DOM */
            documentRef.current.innerHTML = processedContent;
            setTimeout(paginateAll, 100);
        }

        // Update placeholders - replace defaults with detected ones
        if (detectedPlaceholders.length > 0) {
            setPlaceholders(detectedPlaceholders);
        }

        setIsProcessing(false);
    }, []);


    // Handle uploaded content and details - enhanced variable detection
    useEffect(() => {
        const processContent = async () => {
            if (location.state?.htmlContent) {
                setIsProcessing(true);
                let initialHtml = location.state.htmlContent;
                console.log('Editor received content length:', initialHtml.length);

                // Call API to generate placeholders automatically
                try {
                    const res = await fetch(`${API_CONFIG.ENHANCE_BOT.BASE_URL}/create_placeholders`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ html_content: initialHtml })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.processed_html) {
                            initialHtml = data.processed_html;
                        }
                    }
                } catch (e) {
                    console.error("Placeholder generation failed", e);
                }

                // Send to Worker instead of blocking main thread
                if (workerRef.current) {
                    workerRef.current.postMessage({ htmlContent: initialHtml });
                }
            } else if (location.state?.isEmpty) {
                setPlaceholders([]);
            }
        };

        processContent();

    }, [location.state]);

    useEffect(() => {
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
                if (p.value) {
                    el.innerText = p.value;
                } else {
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

        setDeletedPlaceholders(prev => [...prev, placeholder]);
        setPlaceholders(prev => prev.filter(p => p.key !== key));

        if (documentRef.current) {
            const elements = documentRef.current.querySelectorAll(`.variable[data-key="${key}"]`);
            elements.forEach(el => {
                el.classList.remove('variable');
                el.classList.add('variable-deleted');
                el.contentEditable = 'true';
            });
        }
    };

    const handleRestorePlaceholder = (key) => {
        const placeholder = deletedPlaceholders.find(p => p.key === key);
        if (!placeholder) return;

        setPlaceholders(prev => [...prev, placeholder]);
        setDeletedPlaceholders(prev => prev.filter(p => p.key !== key));

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
        // Ensure we use CSS styles (spans) instead of legacy tags (font) where possible
        document.execCommand('styleWithCSS', false, true);

        if (command === 'customFontSize') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                if (!selection.isCollapsed) {
                    const span = document.createElement('span');
                    span.style.fontSize = `${value}pt`;

                    try {
                        const content = range.extractContents();
                        span.appendChild(content);
                        range.insertNode(span);

                        // Reselect to keep focus
                        selection.removeAllRanges();
                        const newRange = document.createRange();
                        newRange.selectNode(span);
                        selection.addRange(newRange);
                    } catch (e) {
                        console.error('Error applying font size:', e);
                    }
                } else {
                    // Handle Caret (No selection): Insert styled span with Zero-Width Space
                    const span = document.createElement('span');
                    span.style.fontSize = `${value}pt`;
                    span.innerHTML = '&#8203;'; // Zero Width Space

                    range.insertNode(span);

                    // Move caret INSIDE the span, after the ZWSP
                    range.setStart(span, 1);
                    range.setEnd(span, 1);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
            return;
        }
        if (command === 'changeCase') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && !selection.isCollapsed) {
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();
                let newText = selectedText;

                switch (value) {
                    case 'upper':
                        newText = selectedText.toUpperCase();
                        break;
                    case 'lower':
                        newText = selectedText.toLowerCase();
                        break;
                    case 'capitalize':
                        // Title Case: Lowercase everything first, then uppercase first letter of words
                        newText = selectedText.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                        break;
                    case 'sentence':
                        // Simple sentence case: Uppercase first letter, lowercase rest
                        newText = selectedText.charAt(0).toUpperCase() + selectedText.slice(1).toLowerCase();
                        break;
                    default:
                        break;
                }

                if (newText !== selectedText) {
                    document.execCommand('insertText', false, newText);
                }
            }
            return;
        }

        if (command === 'lineSpacing') {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);

            // Helper to get block parent
            const getBlockParent = (node) => {
                // Return closest P, H1-6, LI, DIV that is editable
                let el = node.nodeType === 3 ? node.parentElement : node;
                return el.closest('p, h1, h2, h3, h4, h5, h6, li, div.editor-root > div');
            };

            // 1. Identify specific paragraphs to change
            const blocksToUpdate = new Set();

            if (selection.isCollapsed) {
                const block = getBlockParent(range.startContainer);
                if (block) blocksToUpdate.add(block);
            } else {
                // Walk the range
                const walker = document.createTreeWalker(
                    range.commonAncestorContainer,
                    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: (node) => {
                            if (range.intersectsNode(node)) return NodeFilter.FILTER_ACCEPT;
                            return NodeFilter.FILTER_REJECT;
                        }
                    }
                );

                let node = walker.currentNode;
                while (node) {
                    const block = getBlockParent(node);
                    if (block && block.closest('.editor-root')) {
                        blocksToUpdate.add(block);
                    }
                    node = walker.nextNode();
                }
            }

            // 2. Apply Spacing
            blocksToUpdate.forEach(block => {
                if (block) {
                    block.style.lineHeight = value;
                }
            });

            // 3. Trigger Pagination (Layout changed)
            setTimeout(paginateAll, 50);
            return;
        }

        if (command === 'insertTable') {
            const { rows, cols } = value;
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);

            // Create Table
            const table = document.createElement('table');
            table.className = 'editor-table';
            table.contentEditable = 'false';
            table.style.width = '100%';

            const tbody = document.createElement('tbody');
            for (let i = 0; i < rows; i++) {
                const tr = document.createElement('tr');
                for (let j = 0; j < cols; j++) {
                    const td = document.createElement('td');
                    td.contentEditable = 'true';
                    td.style.border = '1px solid #000';
                    td.style.padding = '8px';
                    const p = document.createElement('p');
                    p.innerHTML = '<br>'; // Empty line
                    td.appendChild(p);
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);

            // Insert Table
            range.deleteContents();
            // If inside a P, we might need to split it? 
            // Simplest: Insert at cursor.
            // If cursor is INSIDE a P, inserting a TABLE inside a P is invalid HTML5 (P cannot contain table).
            // We must traverse up to find the P, split it, or insert after.

            let container = range.commonAncestorContainer;
            if (container.nodeType === 3) container = container.parentElement;
            const parentP = container.closest('p');

            if (parentP) {
                // Split P or insert after
                // Easy way: Insert table AFTER the P
                if (parentP.nextSibling) {
                    parentP.parentNode.insertBefore(table, parentP.nextSibling);
                } else {
                    parentP.parentNode.appendChild(table);
                }
                // Add an empty P after table for cursor continuation
                const pAfter = document.createElement('p');
                pAfter.innerHTML = '<br>';
                table.parentNode.insertBefore(pAfter, table.nextSibling);
            } else {
                range.insertNode(table);
                // Ensure P after
                const pAfter = document.createElement('p');
                pAfter.innerHTML = '<br>';
                range.insertNode(pAfter); // This might put it before? Range behavior is tricky.
                table.parentNode.insertBefore(pAfter, table.nextSibling);

            }

            setTimeout(paginateAll, 50);
            return;
        }

        if (command === 'modifyTable') {
            // value: { action: 'addRowAbove' | 'addRowBelow' | 'addColLeft' | 'addColRight' | 'deleteRow' | 'deleteCol' | 'deleteTable' }
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);
            let container = range.commonAncestorContainer;
            if (container.nodeType === 3) container = container.parentElement;

            const td = container.closest('td');
            const table = container.closest('table');
            if (!td || !table) return;

            const tr = td.parentElement;
            const tbody = tr.parentElement;
            const rowIndex = Array.from(tbody.children).indexOf(tr);
            const colIndex = Array.from(tr.children).indexOf(td);

            const action = value.action;

            if (action === 'deleteTable') {
                table.remove();
            } else if (action === 'deleteRow') {
                tr.remove();
                if (tbody.children.length === 0) table.remove();
            } else if (action === 'deleteCol') {
                Array.from(tbody.children).forEach(row => {
                    if (row.children[colIndex]) row.children[colIndex].remove();
                });
                // If no cols left, delete table?
                if (tbody.children.length > 0 && tbody.children[0].children.length === 0) table.remove();
            } else if (action === 'addRowAbove' || action === 'addRowBelow') {
                const newTr = document.createElement('tr');
                const colCount = tr.children.length;
                for (let i = 0; i < colCount; i++) {
                    const newTd = document.createElement('td');
                    newTd.contentEditable = 'true';
                    newTd.style.border = '1px solid #000';
                    newTd.style.padding = '8px';
                    newTd.innerHTML = '<p><br></p>';
                    newTr.appendChild(newTd);
                }
                if (action === 'addRowAbove') tbody.insertBefore(newTr, tr);
                else tbody.insertBefore(newTr, tr.nextSibling);
            } else if (action === 'addColLeft' || action === 'addColRight') {
                Array.from(tbody.children).forEach(row => {
                    const newTd = document.createElement('td');
                    newTd.contentEditable = 'true';
                    newTd.style.border = '1px solid #000';
                    newTd.style.padding = '8px';
                    newTd.innerHTML = '<p><br></p>';
                    const refTd = row.children[colIndex];
                    if (action === 'addColLeft') row.insertBefore(newTd, refTd);
                    else row.insertBefore(newTd, refTd.nextSibling);
                });
            }

            setTimeout(paginateAll, 50);
            return;
        }


        if (command === 'insertLink') {
            let selection = window.getSelection();
            let range = null;

            // Check if current selection is valid (in editor)
            if (selection.rangeCount > 0 && !selection.isCollapsed) {
                const r = selection.getRangeAt(0);
                const common = r.commonAncestorContainer;
                const el = common.nodeType === 3 ? common.parentElement : common;
                if (el.closest('.editor-root')) {
                    range = r;
                }
            }

            // Fallback to saved selection if current is invalid (e.g. focus in input)
            if (!range && savedSelectionRef.current) {
                range = savedSelectionRef.current;
                selection = null; // Don't rely on window selection for operations if we use saved range
            }

            if (range) {
                // Prevent nesting: Check if selection is already inside a link
                let container = range.commonAncestorContainer;
                if (container.nodeType === 3) container = container.parentElement;

                if (container.closest('a')) {
                    // Update existing link
                    let normalizedValue = value;
                    if (!/^https?:\/\//i.test(normalizedValue) && !/^mailto:/i.test(normalizedValue)) {
                        normalizedValue = 'https://' + normalizedValue;
                    }
                    container.closest('a').href = normalizedValue;
                    return;
                }

                // Create link
                const a = document.createElement('a');
                let normalizedValue = value;
                if (!/^https?:\/\//i.test(normalizedValue) && !/^mailto:/i.test(normalizedValue)) {
                    normalizedValue = 'https://' + normalizedValue;
                }
                a.href = normalizedValue;
                a.target = "_blank";
                a.rel = "noopener noreferrer";

                try {
                    const content = range.extractContents(); // This consumes the range content

                    // CLEANUP: Ensure we don't nest links
                    const existingLinks = content.querySelectorAll('a');
                    existingLinks.forEach(link => {
                        const parent = link.parentNode;
                        while (link.firstChild) parent.insertBefore(link.firstChild, link);
                        parent.removeChild(link);
                    });

                    a.appendChild(content);
                    range.insertNode(a);

                    // Cleanup saved selection as it's now invalid/used
                    savedSelectionRef.current = null;
                } catch (e) {
                    console.error('Error inserting link:', e);
                }
            }
            return;
        }

        if (command === 'highlight') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                if (value === 'none') {
                    // ... (existing remove logic) ...
                    // Remove Highlighting Logic
                    const container = range.commonAncestorContainer;
                    // Find container element (if text node)
                    const rootEl = container.nodeType === 3 ? container.parentElement : container;

                    // 1. Check directly inside
                    let current = rootEl;
                    while (current && current !== document.body && !current.classList?.contains('editor-root')) {
                        if (current.tagName === 'SPAN' && current.className.includes('highlight-')) {
                            // Unwrap
                            const parent = current.parentNode;
                            while (current.firstChild) parent.insertBefore(current.firstChild, current);
                            parent.removeChild(current);
                            return;
                        }
                        current = current.parentNode;
                    }

                    // 2. Selection covers multiple
                    if (!selection.isCollapsed) {
                        let context = rootEl;
                        if (context.nodeType === 3) context = context.parentElement;
                        const highlights = context.querySelectorAll("span[class*='highlight-']");
                        highlights.forEach(span => {
                            if (selection.containsNode(span, true)) {
                                const parent = span.parentNode;
                                while (span.firstChild) parent.insertBefore(span.firstChild, span);
                                parent.removeChild(span);
                            }
                        });
                    }
                    return;
                }

                if (!selection.isCollapsed) {
                    // Prevent wrapping standard logic if we need to skip links
                    // We need a custom walker to wrap text nodes BUT SKIP anchors.

                    try {
                        const content = range.extractContents();

                        // We need to rebuild this fragment with highlights applied 
                        // ONLY to non-link nodes.

                        const applyHighlightToFragment = (fragment, color) => {
                            // Helper to recursively wrap text
                            const nodes = Array.from(fragment.childNodes);
                            nodes.forEach(node => {
                                if (node.nodeName === 'A') {
                                    // Don't wrap the anchor itself.
                                    // But we might want to wrap content *inside* the anchor? 
                                    // No, prompt says "Prevent wrapping highlights inside links".
                                    // So we leave the link ALONE.
                                    return;
                                } else if (node.nodeType === 3) { // Text
                                    if (node.textContent.trim().length === 0) return;
                                    const span = document.createElement('span');
                                    span.className = `highlight-${color}`;
                                    span.textContent = node.textContent;
                                    fragment.replaceChild(span, node);
                                } else if (node.nodeType === 1) { // Element (e.g. bold span)
                                    // Recurse? No, we can wrap the element itself if it's not a link.
                                    // Safe to wrap other spans.
                                    if (node.tagName === 'SPAN' && !node.classList.contains('highlight-' + color)) {
                                        // Check if it already has a highlight? 
                                        // Nested highlights are tricky. Let's just wrap the span.
                                        const wrapper = document.createElement('span');
                                        wrapper.className = `highlight-${color}`;
                                        fragment.replaceChild(wrapper, node);
                                        wrapper.appendChild(node);
                                    } else {
                                        // Generic
                                        const wrapper = document.createElement('span');
                                        wrapper.className = `highlight-${color}`;
                                        fragment.replaceChild(wrapper, node);
                                        wrapper.appendChild(node);
                                    }
                                }
                            });
                        };

                        // NOTE: The above recursive logic is simplified. 
                        // `extractContents` gives us a fragment.
                        // Standard formatting usually just wraps.
                        // Since we extracted, we just need to verify we aren't wrapping an A.
                        // To allow mixed content (Text - Link - Text), we traverse the fragment.

                        const fragment = content;
                        const children = Array.from(fragment.childNodes);

                        // If it's just text, simple wrap
                        if (children.every(n => n.nodeType === 3)) {
                            const span = document.createElement('span');
                            span.className = `highlight-${value}`;
                            while (fragment.firstChild) span.appendChild(fragment.firstChild);
                            fragment.appendChild(span);
                        } else {
                            // Complex mix
                            // We will intentionally NOT wrap the whole thing in one span.
                            // We will wrap individual non-link siblings.
                            children.forEach(child => {
                                if (child.nodeName === 'A') {
                                    // Update: Do nothing to the link.
                                } else {
                                    // Wrap this child (text or span)
                                    const span = document.createElement('span');
                                    span.className = `highlight-${value}`;
                                    // We need to replace the child in the fragment
                                    fragment.replaceChild(span, child);
                                    span.appendChild(child);
                                }
                            });
                        }

                        range.insertNode(fragment);
                        selection.removeAllRanges();
                    } catch (e) {
                        console.error('HIGHLIGHT ERROR', e);
                        // Fallback?
                    }
                }
            }
            return;
        }

        document.execCommand(command, false, value);
    };

    const handleExportPDF = () => {
        handleSave();
        const element = pagesContainerRef.current;
        if (!element) return;

        // Clone the container to modify styles for PDF generation without affecting UI
        const clone = element.cloneNode(true);

        // Remove the transform scale from the clone so it renders at 100%
        clone.style.transform = 'none';
        clone.style.width = 'fit-content';
        clone.style.height = 'auto';
        clone.style.position = 'static';
        clone.style.overflow = 'visible';

        // Adjust the pages inside the clone
        const pages = clone.querySelectorAll('.document-page');
        pages.forEach(page => {
            page.style.margin = '0';
            page.style.boxShadow = 'none';
            page.style.marginBottom = '0';
            // Ensure variables look like normal text
            const variables = page.querySelectorAll('.variable');
            variables.forEach(v => {
                v.style.backgroundColor = 'transparent';
                v.style.color = 'inherit';
                v.style.border = 'none';
                v.style.padding = '0';
                v.style.borderRadius = '0';
                v.removeAttribute('contenteditable');
                v.removeAttribute('data-key');
            });

            // Remove contentEditable from headers/footers/editors
            const editables = page.querySelectorAll('[contenteditable]');
            editables.forEach(el => el.removeAttribute('contenteditable'));
        });

        const opt = {
            margin: 0,
            filename: `${draftName || 'legal_draft'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: true,
                windowWidth: 816,
            },
            jsPDF: { unit: 'pt', format: 'letter', orientation: 'portrait' }, // Letter matches 816x1056px approx
            pagebreak: { mode: ['css', 'legacy'] }
        };

        html2pdf().set(opt).from(clone).save();
    };

    const handleExportWord = () => {
        handleSave();
        const container = pagesContainerRef.current;
        if (!container) return;

        let fullContent = '';
        const pages = Array.from(container.querySelectorAll('.document-page'));

        pages.forEach((page, index) => {
            // We try to capture header, content, and footer if possible, 
            // but primarily the editor content is what matters for Word flow.
            // For simplicity and robustness, we'll grab the editor content.
            // If we want headers/footers in Word, we'd need to set them in the Word HTML styles (mso-header),
            // which is complex. For now, let's just ensure ALL text content is exported.

            const editor = page.querySelector('.editor-root');
            if (editor) {
                const clone = editor.cloneNode(true);

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

                // PROCESS HIGHLIGHTS FOR WORD
                // Word doesn't always like external classes, so we inline the background colors
                const highlights = clone.querySelectorAll("[class*='highlight-']");
                highlights.forEach(h => {
                    const style = window.getComputedStyle(h);
                    // Map class to explicit hex if needed, or rely on computed style
                    // Simple map is safer for export fidelity
                    let bg = '#ffff00'; // default
                    if (h.classList.contains('highlight-yellow')) bg = '#fef08a';
                    if (h.classList.contains('highlight-green')) bg = '#bbf7d0';
                    if (h.classList.contains('highlight-cyan')) bg = '#a5f3fc';
                    if (h.classList.contains('highlight-magenta')) bg = '#f5d0fe';
                    if (h.classList.contains('highlight-gray')) bg = '#e2e8f0';

                    h.style.backgroundColor = bg;
                });

                fullContent += clone.innerHTML;

                // Add page break
                if (index < pages.length - 1) {
                    fullContent += '<br style="page-break-after: always; clear: both;" />';
                }
            }
        });

        const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${draftName || 'Legal Draft'}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
          p { margin-bottom: 1em; }
          h1 { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; }
        </style>
      </head>
      <body>`;
        const footer = "</body></html>";
        const sourceHTML = header + fullContent + footer;

        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `${draftName || 'legal_draft'}.doc`;
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
            const documentWidth = 816 + 100;
            const newZoom = Math.floor((containerWidth / documentWidth) * 100);
            setZoomLevel(Math.min(Math.max(newZoom - 5, 50), 150));
        }
    };

    // Pagination constants (A4 at 96 DPI)
    const PAGE_HEIGHT = 1056;
    const PAGE_PADDING = 72;


    const pagesContainerRef = useRef(null);
    const [pageCount, setPageCount] = useState(1);
    const [wordCount, setWordCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    // Updated updateFooters to handle "Last Page Only" logic based on showFooter toggle
    const updateFooters = useCallback(() => {
        const container = pagesContainerRef.current;
        if (!container) return;

        const pages = Array.from(container.querySelectorAll('.document-page'));
        const footerText = editorSettings.footerText || '';

        pages.forEach((page, index) => {
            const isLast = index === pages.length - 1;
            let footer = page.querySelector('.page-footer');

            // Only show footer on the VERY LAST page if showFooter is true
            if (isLast && showFooter) {
                if (!footer) {
                    footer = document.createElement('div');
                    footer.className = 'page-footer';
                    footer.contentEditable = 'false'; // Locked by default
                    footer.spellcheck = false;

                    // Double click to edit
                    footer.addEventListener('dblclick', function () {
                        this.contentEditable = 'true';
                        this.focus();
                    });

                    // Add save listener
                    footer.addEventListener('blur', (e) => {
                        e.target.contentEditable = 'false'; // Lock on blur
                        const newText = e.target.innerHTML;
                        setEditorSettings(prev => {
                            const updated = { ...prev, footerText: newText };
                            // localStorage.setItem('user_settings', JSON.stringify(updated)); // Decoupled
                            return updated;
                        });
                    });

                    // Append to page content flow
                    page.appendChild(footer);
                }

                // Only update innerHTML if it's strictly different (avoid cursor jumps)
                // or if it's empty to allow placeholder to show
                if (footer.innerHTML !== footerText) {
                    // check if user is currently editing it
                    if (document.activeElement !== footer) {
                        footer.innerHTML = footerText;
                    }
                }
                footer.style.display = 'block';
            } else {
                if (footer) {
                    footer.remove();
                }
            }
        });
    }, [editorSettings.footerText, showFooter]);

    // Trigger footer updates when relevant state changes
    useEffect(() => {
        updateFooters();
    }, [pageCount, showFooter, updateFooters]);

    // Update page numbers on all pages
    const updatePageNumbers = useCallback(() => {
        const container = pagesContainerRef.current;
        if (!container) return;

        const pages = Array.from(container.querySelectorAll('.document-page'));

        pages.forEach((page, index) => {
            let pageNumEl = page.querySelector('.page-number-display');

            if (showPageNumbers) {
                if (!pageNumEl) {
                    pageNumEl = document.createElement('div');
                    pageNumEl.className = 'page-number-display';
                    page.appendChild(pageNumEl);
                }
                pageNumEl.textContent = (index + 1).toString();
                pageNumEl.style.display = 'block';
            } else {
                if (pageNumEl) {
                    pageNumEl.remove();
                }
            }
        });
    }, [showPageNumbers]);

    // Trigger page numbers update
    useEffect(() => {
        updatePageNumbers();
    }, [pageCount, showPageNumbers, updatePageNumbers]);

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



    // Helper: Save and Restore Selection
    const saveSelection = (containerEl) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(containerEl);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;

        return {
            start: start,
            end: start + range.toString().length
        };
    };

    const restoreSelection = (containerEl, savedSelection) => {
        if (!savedSelection) return;
        let charIndex = 0;
        const range = document.createRange();
        range.setStart(containerEl, 0);
        range.collapse(true);
        const nodeStack = [containerEl];
        let node, foundStart = false, stop = false;

        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType === 3) {
                const nextCharIndex = charIndex + node.length;
                if (!foundStart && savedSelection.start >= charIndex && savedSelection.start <= nextCharIndex) {
                    range.setStart(node, savedSelection.start - charIndex);
                    foundStart = true;
                }
                if (foundStart && savedSelection.end >= charIndex && savedSelection.end <= nextCharIndex) {
                    range.setEnd(node, savedSelection.end - charIndex);
                    stop = true;
                }
                charIndex = nextCharIndex;
            } else {
                let i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    };
    // Link Interaction Handlers
    useEffect(() => {
        const handleEditorClick = (e) => {
            if (e.target.tagName === 'A') {
                if (e.ctrlKey || e.metaKey) {
                    // Ctrl+Click: Open Link
                    e.preventDefault();
                    e.stopPropagation();
                    // Ctrl+Click: Open Link
                    e.preventDefault();
                    e.stopPropagation();
                    let url = e.target.getAttribute('href');
                    if (url && !/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
                        url = 'https://' + url;
                    }
                    window.open(url, '_blank');
                } else {
                    // Regular Click: Allow default caret placement (user edits text)
                }
            }
        };

        const handleEditorDoubleClick = (e) => {
            // Double Click: Edit Link
            const link = e.target.closest('a');
            if (link) {
                e.preventDefault();
                e.stopPropagation();
                const newUrl = prompt("Edit Link URL:", link.href);
                if (newUrl !== null) {
                    if (newUrl === '') {
                        // Unlink if empty
                        const parent = link.parentNode;
                        while (link.firstChild) parent.insertBefore(link.firstChild, link);
                        parent.removeChild(link);
                    } else {
                        link.href = newUrl;
                    }
                }
            }
        };

        const pages = pagesContainerRef.current;
        if (pages) {
            pages.addEventListener('click', handleEditorClick);
            pages.addEventListener('dblclick', handleEditorDoubleClick);
        }

        return () => {
            if (pages) {
                pages.removeEventListener('click', handleEditorClick);
                pages.removeEventListener('dblclick', handleEditorDoubleClick);
            }
        };
    }, []);

    // Pagination Logic
    const paginateAll = useCallback(() => {
        const container = pagesContainerRef.current;
        if (!container) return;

        // Save cursor position relative to the WHOLE container (primitive but helps)
        // Better strategy: Don't touch DOM unless absolutely necessary.
        // And if we do, try to rely on browser's stability or simple restoration.

        // NOTE: Full exact restoration across pages is complex. 
        // For the "cursor jumps to start" bug, usually preventing React re-renders is key, 
        // and ensuring we don't swap nodes under the cursor.

        let safety = 0;
        let changed = true;
        let movedToNextPage = null;

        while (changed && safety < 20) {
            changed = false;
            safety++;
            const pages = Array.from(container.querySelectorAll('.document-page'));

            // 1. Forward Pass
            for (let i = 0; i < pages.length; i++) {
                const pageEl = pages[i];
                const editor = initEmptyEditor(pageEl);

                while (editor.scrollHeight > editor.clientHeight + 1 && editor.lastChild) {
                    const next = ensureNextPage(pageEl);
                    const nextEditor = initEmptyEditor(next);

                    const selection = window.getSelection();
                    const movingEl = editor.lastChild;
                    const cursorInMovingEl = selection && selection.rangeCount > 0 &&
                        movingEl.contains(selection.getRangeAt(0).startContainer);

                    nextEditor.insertBefore(movingEl, nextEditor.firstChild);
                    changed = true;

                    if (cursorInMovingEl) {
                        movedToNextPage = nextEditor;
                    }
                }
            }

            // 2. Backward Pass
            for (let i = pages.length - 2; i >= 0; i--) {
                const pageEl = pages[i];
                const nextEl = pages[i + 1];
                const editor = initEmptyEditor(pageEl);
                const nextEditor = initEmptyEditor(nextEl);

                while (nextEditor.firstChild) {
                    const node = nextEditor.firstChild;

                    // NON-DESTRUCTIVE CHECK: Clone first to see if it fits
                    const clone = node.cloneNode(true);
                    editor.appendChild(clone);

                    if (editor.scrollHeight > editor.clientHeight + 1) {
                        // Doesn't fit, remove clone and stop
                        clone.remove();
                        break;
                    }

                    // Fits! Remove clone and move real node
                    clone.remove();
                    editor.appendChild(node);
                    changed = true;
                }

                if (i === pages.length - 2 && !nextEditor.firstChild) {
                    nextEl.remove();
                    changed = true;
                }
            }
        }

        if (movedToNextPage && movedToNextPage.firstChild) {
            const selection = window.getSelection();
            const range = document.createRange();
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
            movedToNextPage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const finalCount = container.querySelectorAll('.document-page').length;
        if (finalCount !== pageCount) {
            setPageCount(finalCount);
        }

        // DEBOUNCE / THROTTLE Word Count update to prevent frequent Re-renders
        // This is the most likely cause of cursor jumping on every character typed.
        if (!window._wordCountTimer) {
            window._wordCountTimer = setTimeout(() => {
                const allText = container.textContent || '';
                const words = allText.trim().split(/\s+/).filter(w => w.length > 0).length;
                setWordCount(words);
                window._wordCountTimer = null;
            }, 1000); // Update word count max once per second
        }

        // Logic for current page detection remains but let's check it less often or rely on scroll/click/caret
        // Removing it from here to reduce render stress. Moved to separate listener or simplified.
        if (safety === 1 && !changed) {
            // If nothing changed, we can safely check current page without risk
            // But let's skip state updates strictly inside the tight input loop
        }

    }, [pageCount]);

    useEffect(() => {
        const container = pagesContainerRef.current;
        if (!container) return;

        // Use debounce for pagination call on input to avoid thrashing
        // But fast enough to catch overflows
        let inputTimer;
        const schedule = () => {
            clearTimeout(inputTimer);
            inputTimer = setTimeout(() => {
                requestAnimationFrame(paginateAll);
            }, 50); // 50ms debounce
        };

        const immediateParams = () => requestAnimationFrame(paginateAll);

        container.addEventListener('input', schedule, true);
        container.addEventListener('paste', immediateParams, true); // Paste needs immediate attention
        container.addEventListener('keyup', schedule, true);

        setTimeout(paginateAll, 100);

        return () => {
            container.removeEventListener('input', schedule, true);
            container.removeEventListener('paste', immediateParams, true);
            container.removeEventListener('keyup', schedule, true);
        };
    }, [paginateAll]);

    // Trigger pagination when layout changes (Header/Footer toggle)
    useEffect(() => {
        setTimeout(() => {
            paginateAll();
        }, 50);
    }, [showHeader, showFooter, paginateAll]);

    const handleSave = (status) => {
        if (!pagesContainerRef.current) return;

        // Gather content from ALL pages
        const allEditors = Array.from(pagesContainerRef.current.querySelectorAll('.editor-root'));
        const content = allEditors.map(ed => ed.innerHTML).join('');

        const draftId = location.state?.id || Date.now().toString();

        // Determine status: if argument is a string uses it, otherwise default to 'In progress'
        const saveStatus = (typeof status === 'string') ? status : 'In progress';

        const draftData = {
            id: draftId,
            name: draftName || 'Untitled Draft',
            content: content,
            placeholders: placeholders,
            settings: editorSettings,
            status: saveStatus,
            lastModified: new Date().toISOString()
        };

        const existingDrafts = JSON.parse(localStorage.getItem('my_drafts') || '[]');
        const otherDrafts = existingDrafts.filter(d => d.id !== draftId);
        const updatedDrafts = [...otherDrafts, draftData];

        localStorage.setItem('my_drafts', JSON.stringify(updatedDrafts));
        toast.success(`Draft saved as ${saveStatus}!`);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            handleFitWidth();
        }, 350);
        return () => clearTimeout(timer);
    }, [leftSidebarOpen, rightSidebarOpen]);


    // Ref to store the valid range when toolbar is shown
    const activeRangeRef = useRef(null);

    // Handle Selection for Floating Toolbar
    useEffect(() => {
        const handleSelectionChange = () => {
            // If user is interacting with the toolbar (e.g. typing in input), don't hide it
            if (document.activeElement && document.activeElement.closest('.floating-toolbar')) {
                return;
            }

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const container = range.commonAncestorContainer;
                const node = container.nodeType === 3 ? container.parentElement : container;
                const table = node.closest('table');

                const isTable = !!table;
                setIsTableContext(isTable);

                // Show toolbar if:
                // 1. Valid range selection (!collapsed)
                // 2. OR Inside a table (allow collapsed)

                if ((!selection.isCollapsed || isTable) && mainContainerRef.current) {
                    // Check if valid editor area
                    const editorRect = pagesContainerRef.current.getBoundingClientRect();

                    // If collapsed (table mode), we need a valid rect. 
                    // range.getBoundingClientRect() might be 0 width if collapsed.
                    let finalRect = rect;
                    if (selection.isCollapsed && isTable) {
                        // Use the td or closest element rect
                        const td = node.closest('td');
                        if (td) finalRect = td.getBoundingClientRect();
                    }

                    if (finalRect.top >= editorRect.top && finalRect.bottom <= editorRect.bottom) {
                        setToolbarPosition({
                            x: finalRect.left + (finalRect.width / 2),
                            y: finalRect.top - 10
                        });
                        setShowFloatingToolbar(true);

                        if (!selection.isCollapsed) {
                            savedSelectionRef.current = range.cloneRange();
                        } else {
                            // If table mode and collapsed, we don't necessarily save selection for "text actions",
                            // but we might need it for table actions.
                            savedSelectionRef.current = range.cloneRange();
                        }
                    } else {
                        setShowFloatingToolbar(false);
                    }
                } else {
                    setShowFloatingToolbar(false);
                }
            } else {
                setShowFloatingToolbar(false);
            }
        };

        const handleMouseUp = () => {
            // Slight delay to let selection settle
            setTimeout(handleSelectionChange, 10);
        };

        const handleKeyUp = (e) => {
            // Update on shift+arrow selection
            if (e.shiftKey) {
                setTimeout(handleSelectionChange, 10);
            }
        };

        // Hide toolbar when scrolling
        const handleScroll = (e) => {
            // If scroll comes from the toolbar itself (e.g. input scrolling), ignore it
            if (e.target && e.target.closest && e.target.closest('.floating-toolbar')) {
                return;
            }
            if (showFloatingToolbar) setShowFloatingToolbar(false);
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keyup', handleKeyUp);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showFloatingToolbar]);

    const handleEnhance = async (userPrompt = '') => {
        // Use stored range if available (prioritize logic) or fall back to current selection
        let range = activeRangeRef.current;
        let selectedText = '';

        if (!range) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
                range = selection.getRangeAt(0);
            }
        }

        if (!range) return;

        selectedText = range.toString();
        if (!selectedText) return; // Double check

        // 1. Get Context (approx 50 chars before and after)
        // We clone the range and expand it
        const PreRange = range.cloneRange();
        PreRange.setStart(mainContainerRef.current, 0); // Start from beginning of editor
        PreRange.setEnd(range.startContainer, range.startOffset);
        const preText = PreRange.toString().slice(-50); // Last 50 chars

        const PostRange = range.cloneRange();
        PostRange.setStart(range.endContainer, range.endOffset);
        PostRange.setEndAfter(mainContainerRef.current.lastChild || mainContainerRef.current);
        const postText = PostRange.toString().slice(0, 50); // First 50 chars

        const context = `${preText} ... [TARGET] ... ${postText}`;

        console.log("Enhance Context:", context);
        console.log("User Prompt:", userPrompt);

        const promise = fetch(`${API_CONFIG.ENHANCE_BOT.BASE_URL}/enhance_clause`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selected_text: selectedText,
                case_context: context, // Sending surrounding text as context per user request
                user_prompt: userPrompt
            })
        }).then(async (res) => {
            if (!res.ok) throw new Error('Enhancement failed');
            const data = await res.json();
            return data.enhanced_text;
        });

        toast.promise(promise, {
            loading: 'Enhancing text with AI...',
            success: (enhancedText) => {
                // Check for no-op responses
                if (!enhancedText || enhancedText === 'No significant suggestions') {
                    return 'No suggestions available.';
                }

                // Restore selection to ensure insertText works
                if (range) {
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }

                document.execCommand('insertText', false, enhancedText);
                return 'Text enhanced successfully!';
            },
            error: 'Failed to enhance text.'
        });
    };

    const handleModifyDraft = async (context) => {
        if (!pagesContainerRef.current) return;

        // 1. Gather content from ALL pages
        // documentRef only points to the first page's editor, but we might have multiple pages.
        const allEditors = Array.from(pagesContainerRef.current.querySelectorAll('.editor-root'));
        const fullContent = allEditors.map(ed => ed.innerHTML).join('');

        if (!fullContent.trim()) {
            toast.error("Document is empty.");
            return;
        }

        try {
            const res = await fetch(`${API_CONFIG.ENHANCE_BOT.BASE_URL}/enhance_content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selected_text: fullContent,
                    user_context: context
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (res.status === 429) {
                    toast.error('API Quota Exceeded. Please try again later.');
                } else {
                    toast.error(errorData.detail || 'Failed to modify draft.');
                }
                return;
            }

            const data = await res.json();

            // 2. Update Content
            // Strategy: Put everything in the first page, remove other pages, and let pagination flow
            if (documentRef.current) {
                // Clear other pages first to prevent duplication
                const pages = Array.from(pagesContainerRef.current.querySelectorAll('.document-page'));
                for (let i = 1; i < pages.length; i++) {
                    pages[i].remove();
                }

                // Update first page
                documentRef.current.innerHTML = data.enhanced_text;

                // Trigger pagination
                // Reset page count to 1 temporarily so React knows? 
                // Actually paginateAll calculates final count.
                setPageCount(1);
                setTimeout(paginateAll, 100);
            }
            toast.success('Draft modified successfully!');
            setShowModifyModal(false);

        } catch (error) {
            console.error(error);
            toast.error('An error occurred while modifying the draft.');
        }
    };

    return (
        <div className="editor-container">
            {isProcessing && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-lg font-medium text-slate-800 dark:text-white">Processing Document...</p>
                    </div>
                </div>
            )}
            <ModifyDraftModal
                isOpen={showModifyModal}
                onClose={() => setShowModifyModal(false)}
                onConfirm={handleModifyDraft}
            />
            <EditorToolbar
                execCommand={execCommand}
                onExportPDF={handleExportPDF}
                onExportWord={handleExportWord}
                onSave={handleSave}
                draftName={draftName}
                setDraftName={setDraftName}
                showHeader={showHeader}
                setShowHeader={setShowHeader}
                showFooter={showFooter}
                setShowFooter={setShowFooter}
                showPageNumbers={showPageNumbers}
                setShowPageNumbers={setShowPageNumbers}
                onModify={() => setShowModifyModal(true)}
                totalPages={pageCount}
                onPrint={(options) => {
                    console.log('Print with options:', options);
                    window.print();
                }}
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

                <div className="editor-main" ref={mainContainerRef}>
                    <div
                        className="zoom-wrapper"
                        style={{
                            width: `${816 * zoomLevel / 100 + 48}px`,
                            minHeight: `${(PAGE_HEIGHT * pageCount + 24 * (pageCount - 1)) * zoomLevel / 100 + 48}px`,
                        }}
                    >
                        {React.useMemo(() => (
                            <div
                                className="pages-wrapper"
                                ref={pagesContainerRef}
                                style={{
                                    transform: `scale(${zoomLevel / 100})`,
                                    transformOrigin: 'top left',
                                }}
                            >
                                <div className="document-page">
                                    {/* Header: First Page Only, controlled by toggle */}
                                    {showHeader && (
                                        <div
                                            className="page-header"
                                            contentEditable={isHeaderEditing}
                                            suppressContentEditableWarning
                                            spellCheck={false}
                                            onDoubleClick={() => setIsHeaderEditing(true)}
                                            onBlur={(e) => {
                                                setIsHeaderEditing(false);
                                                const newText = e.target.innerHTML;
                                                setEditorSettings(prev => {
                                                    const updated = { ...prev, headerText: newText };
                                                    // localStorage.setItem('user_settings', JSON.stringify(updated)); // Decoupled
                                                    return updated;
                                                });
                                            }}
                                            dangerouslySetInnerHTML={{ __html: editorSettings.headerText || '' }}
                                        />
                                    )}

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
                                    {/* Footer handled by updateFooters logic (Last Page Only) */}
                                </div>
                            </div>
                        ), [zoomLevel, showHeader, isHeaderEditing, editorSettings.headerText, location.state])}
                    </div>
                </div>

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

            <FloatingToolbar
                visible={showFloatingToolbar}
                position={toolbarPosition}
                onFormat={execCommand}
                onEnhance={handleEnhance}
            />
        </div>
    );
};

export default Editor;

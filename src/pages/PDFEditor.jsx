import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
    FileText,
    Settings,
    Trash2,
    Upload,
    MoreVertical,
    Move,
    RotateCw,
    Scissors,
    Check,
    Download,
    Minimize2,
    Stamp, // for watermark
    Layers // for merge
} from 'lucide-react';
import './PDFEditor.css';

const API_URL = "http://localhost:8003";

// Tool Modes
const MODES = {
    SIMPLE: 'simple',
    BUILDER: 'builder',
    SPLITTER: 'splitter'
};

const TOOLS = [
    { id: 'merge', name: 'Merge & Organize', icon: Layers, desc: 'Combine multiple PDFs, reorder, and rotate pages.', mode: MODES.BUILDER },
    { id: 'split', name: 'Split PDF', icon: Scissors, desc: 'Separate one page or a whole set for easy conversion.', mode: MODES.SPLITTER },
    { id: 'compress', name: 'Compress PDF', icon: Minimize2, desc: 'Reduce file size while optimizing for maximal quality.', mode: MODES.SIMPLE },
    { id: 'pdf-to-word', name: 'PDF to Word', icon: FileText, desc: 'Convert your PDF to editable Word documents.', mode: MODES.SIMPLE },
    { id: 'word-to-pdf', name: 'Word to PDF', icon: FileText, desc: 'Make DOC and DOCX files easy to read by converting them to PDF.', mode: MODES.SIMPLE },
    { id: 'watermark', name: 'Watermark PDF', icon: Stamp, desc: 'Stamp text over your PDF pages.', mode: MODES.BUILDER }
];

const PDFEditor = () => {
    const [activeTool, setActiveTool] = useState(TOOLS[0]);

    // Core Data
    const [rawFiles, setRawFiles] = useState([]); // Array of File objects
    const [pages, setPages] = useState([]); // [{ id, fileIndex, pageIndex, imageSrc, rotation }]

    // UI State
    const [selectedPageIndex, setSelectedPageIndex] = useState(0);
    const [splitPoints, setSplitPoints] = useState([]); // Array of indices (after page X)
    const [isProcessing, setIsProcessing] = useState(false);
    const [outputName, setOutputName] = useState("document");
    const [compressLevel, setCompressLevel] = useState("medium");
    const [zoomLevel, setZoomLevel] = useState(1.0); // 1.0 = 100%

    // Watermark State
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
    const [watermarkRotation, setWatermarkRotation] = useState(45);

    const fileInputRef = useRef(null);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);
    const mainScrollRef = useRef(null);
    const isScrollingRef = useRef(false);

    // Sync Scroll: When selectedPageIndex changes (e.g. via thumbnail click), scroll to it
    useEffect(() => {
        if (isScrollingRef.current) return; // Don't auto-scroll if user is naturally scrolling

        const el = document.getElementById(`page-view-${selectedPageIndex}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selectedPageIndex]);

    // Sync Scroll: Update selectedPageIndex when user scrolls main view
    useEffect(() => {
        const container = document.getElementById('main-scroll-container');
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // Find the most visible entry
                const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible.length > 0) {
                    const index = parseInt(visible[0].target.id.split('-')[2]);
                    if (!isNaN(index)) {
                        isScrollingRef.current = true;
                        setSelectedPageIndex(index);
                        // Reset scrolling flag after delay
                        setTimeout(() => isScrollingRef.current = false, 500);
                    }
                }
            },
            { root: container, threshold: [0.1, 0.5, 0.9] }
        );

        pages.forEach((_, idx) => {
            const el = document.getElementById(`page-view-${idx}`);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [pages]);

    // --- File Handling ---

    const handleFileChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        // Validation
        const isDocxTool = activeTool.id === 'word-to-pdf';
        const valid = selectedFiles.every(f => f.name.toLowerCase().endsWith(isDocxTool ? '.docx' : '.pdf'));

        if (!valid) {
            toast.error(`Please upload only ${isDocxTool ? '.docx' : '.pdf'} files.`);
            return;
        }

        // Always store raw files for processing
        // Append if in builder mode? 
        // For simplicity, let's just append.
        setRawFiles(prev => [...prev, ...selectedFiles]);
        // Note: This might duplicate if we don't clear. But 'reset' clears it.

        if (activeTool.mode === MODES.SIMPLE) {
            // In simple mode, we usually only want one file or we handle the list differently.
            // The previous logic setRawFiles(selectedFiles) (replace).
            // Let's stick to replace for Simple, Append for Builder.
            if (activeTool.id !== 'merge') { // Heuristic
                setRawFiles(selectedFiles);
            }
        }

        // For Builder/Splitter (and now Watermark which uses Builder layout), fetch pages
        if (activeTool.mode !== MODES.SIMPLE || activeTool.id === 'watermark') {
            // Note: 'watermark' is now MODE.BUILDER, so the check above covers it.
            // But just to be sure logic holds.
            const startIdx = pages.length > 0 ? pages[pages.length - 1].fileIndex + 1 : 0;

            selectedFiles.forEach((file, i) => {
                fetchPagesForFile(file, startIdx + i);
            });
        }
    };

    const fetchPagesForFile = async (file, fileIndex) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('limit', 0); // Get ALL pages

        try {
            const res = await fetch(`${API_URL}/preview`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                const newPages = data.pages.map((img, idx) => ({
                    id: `${fileIndex}-${idx}-${Date.now()}`,
                    fileIndex: fileIndex,
                    pageIndex: idx,
                    imageSrc: img,
                    rotation: 0,
                    fileName: file.name
                }));
                // functional update to avoid stale closure state
                setPages(prev => [...prev, ...newPages]);
                if (pages.length === 0 && newPages.length > 0) setSelectedPageIndex(0);
            }
        } catch (e) {
            console.error("Fetch pages error:", e);
            toast.error(`Failed to load ${file.name}`);
        }
    };

    // --- Drag and Drop (Native) ---

    const handleDragStart = (e, index) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = "move";
        // e.target.classList.add('dragging'); // Optional styling hook
    };

    const handleDragEnter = (e, index) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const copyPages = [...pages];
            const itemToMove = copyPages[dragItem.current];
            copyPages.splice(dragItem.current, 1);
            copyPages.splice(dragOverItem.current, 0, itemToMove);
            setPages(copyPages);
            setSelectedPageIndex(dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    // --- Actions ---

    const rotatePage = (angle) => {
        if (pages.length === 0) return;
        const newPages = [...pages];
        const page = newPages[selectedPageIndex];
        page.rotation = (page.rotation + angle) % 360;
        setPages(newPages);
    };

    const deletePage = (e, index) => {
        e.stopPropagation();
        const newPages = pages.filter((_, i) => i !== index);
        setPages(newPages);
        if (selectedPageIndex >= newPages.length) setSelectedPageIndex(Math.max(0, newPages.length - 1));
    };

    const toggleSplit = (index) => {
        // Toggle split point AFTER page index
        if (splitPoints.includes(index)) {
            setSplitPoints(splitPoints.filter(i => i !== index));
        } else {
            setSplitPoints([...splitPoints, index]);
        }
    };

    const handleProcess = async () => {
        setIsProcessing(true);
        const formData = new FormData();
        const baseFilename = outputName || activeTool.id;

        try {
            let endpoint = '';

            if (activeTool.id === 'watermark') {
                endpoint = '/watermark';
                // For watermark, we need the raw file. 
                if (rawFiles.length === 0) throw new Error("No file loaded");
                formData.append('file', rawFiles[0]);
                formData.append('text', watermarkText);
                formData.append('opacity', watermarkOpacity.toString());
                formData.append('rotation', watermarkRotation.toString());

            } else if (activeTool.mode === MODES.BUILDER) {
                endpoint = '/assemble';
                // Upload ALL raw files
                if (rawFiles.length === 0) throw new Error("No files loaded");
                rawFiles.forEach(f => formData.append('files', f));

                const manifest = pages.map(p => ({
                    file_index: p.fileIndex,
                    page_index: p.pageIndex,
                    rotation: p.rotation
                }));
                formData.append('manifest', JSON.stringify(manifest));

            } else if (activeTool.mode === MODES.SPLITTER) {
                // Splitter Logic
                endpoint = '/split';
                if (rawFiles.length === 0) throw new Error("No file loaded");

                // For basic usage (1 file), we use /split. 
                // If the user has uploaded mutiple files, we warn or precise.
                // Assuming single file usage for Split tool as typical.
                formData.append('file', rawFiles[0]);

                // Calculate ranges from split points
                const sortedSplits = [...splitPoints].sort((a, b) => a - b);
                const ranges = [];
                let currentStart = 1; // 1-based indexing for standard usage

                sortedSplits.forEach(idx => {
                    // split point is AFTER index 'idx'.
                    // idx 0 = standard Page 1.
                    // If split at 0 (after p1): Range 1-1. Next starts 2.
                    const end = idx + 1;
                    ranges.push(`${currentStart}-${end}`);
                    currentStart = end + 1;
                });
                // Add final chunk
                ranges.push(`${currentStart}-${pages.length}`);

                formData.append('ranges', ranges.join(','));

            } else {
                // Simple Tools (Compress, Convert)
                endpoint = `/${activeTool.id}`;
                if (rawFiles.length === 0) throw new Error("No file loaded");
                formData.append('file', rawFiles[0]);

                if (activeTool.id === 'compress') {
                    formData.append('level', compressLevel);
                }
            }

            if (endpoint) {
                const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', body: formData });
                await handleDownload(res, baseFilename);
            }

        } catch (error) {
            console.error(error);
            toast.error("Processing failed: " + error.message);
        } finally {

            setIsProcessing(false);
        }
    };

    const handleDownload = async (res, defaultName) => {
        if (!res.ok) {
            const errorText = await res.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.detail || "Backend error");
            } catch (e) {
                throw new Error(errorText || "Backend error");
            }
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        let filename = `${outputName}.${activeTool.id === 'pdf-to-word' ? 'docx' : 'pdf'}`;
        const disposition = res.headers.get('Content-Disposition');
        if (disposition && disposition.includes('filename=')) {
            filename = disposition.split('filename=')[1].replace(/['"]/g, '').trim();
        }

        // If zip
        if (activeTool.id === 'split' && activeTool.mode === MODES.SPLITTER) filename = `${outputName}.zip`;

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Done!");
    };

    const reset = () => {
        setRawFiles([]);
        setPages([]);
        setSplitPoints([]);
        setSelectedPageIndex(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const activeMode = activeTool.mode;

    return (
        <div className="pdf-editor-container">
            {/* 1. Leftmost Tool Bar */}
            <div className="tool-sidebar">
                {TOOLS.map(tool => (
                    <div
                        key={tool.id}
                        className={`tool-icon-btn ${activeTool.id === tool.id ? 'active' : ''}`}
                        onClick={() => { setActiveTool(tool); reset(); }}
                        title={tool.name}
                    >
                        <tool.icon size={20} />
                    </div>
                ))}
            </div>

            {/* 2. Builder Interface (Thumbnails + Preview) */}
            {(activeMode === MODES.BUILDER || activeMode === MODES.SPLITTER) ? (
                <div className="builder-container">
                    {/* Thumbnails Sidebar */}
                    <div className="thumbnails-sidebar">
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-sm btn-outline w-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={14} style={{ marginRight: 4 }} /> Add Files
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                multiple
                                accept=".pdf"
                                hidden
                                onChange={handleFileChange}
                            />
                        </div>

                        {pages.map((page, idx) => (
                            <div key={page.id}>
                                <div
                                    className={`thumbnail-card ${selectedPageIndex === idx ? 'selected' : ''}`}
                                    onClick={() => setSelectedPageIndex(idx)}
                                    draggable={activeMode === MODES.BUILDER}
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragEnter={(e) => handleDragEnter(e, idx)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="thumbnail-image-container">
                                        <img
                                            src={page.imageSrc}
                                            style={{ transform: `rotate(${page.rotation}deg)` }}
                                            alt=""
                                        />
                                        <div className="page-number">{idx + 1}</div>
                                        {activeMode === MODES.BUILDER && (
                                            <div className="thumb-actions">
                                                <div className="action-mini-btn" onClick={(e) => deletePage(e, idx)}>
                                                    <Trash2 size={12} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="file-label" title={page.fileName}>{page.fileName}</div>
                                </div>

                                {/* Splitter Gap click zone */}
                                {activeMode === MODES.SPLITTER && idx < pages.length - 1 && (
                                    <div
                                        className={`split-gap ${splitPoints.includes(idx) ? 'active' : ''}`}
                                        onClick={() => toggleSplit(idx)}
                                    >
                                        <div className="scissor-line">
                                            {splitPoints.includes(idx) && (
                                                <div className="scissor-icon">
                                                    <Scissors size={14} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {pages.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
                                Add files to start
                            </div>
                        )}
                    </div>

                    {/* Main Preview (Scrollable List) */}
                    <div className="main-preview-area">
                        {/* Top Toolbar */}
                        <div className="preview-toolbar-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h3>{activeTool.name}</h3>
                                {pages.length > 0 && (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Page {selectedPageIndex + 1} / {pages.length}
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {/* Zoom Controls */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                                        title="Zoom Out"
                                    >
                                        -
                                    </button>
                                    <span style={{ fontSize: '0.8rem', minWidth: '3rem', textAlign: 'center' }}>
                                        {Math.round(zoomLevel * 100)}%
                                    </span>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.1))}
                                        title="Zoom In"
                                    >
                                        +
                                    </button>
                                </div>

                                {activeMode === MODES.BUILDER && (
                                    <>
                                        <button className="btn btn-ghost btn-icon" onClick={() => rotatePage(-90)} title="Rotate Left">
                                            <RotateCw size={18} style={{ transform: 'scaleX(-1)' }} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon" onClick={() => rotatePage(90)} title="Rotate Right">
                                            <RotateCw size={18} />
                                        </button>
                                    </>
                                )}

                                <input
                                    type="text"
                                    className="filename-input"
                                    value={outputName}
                                    onChange={(e) => setOutputName(e.target.value)}
                                    placeholder="Output Filename"
                                />

                                <button className="btn-process" onClick={handleProcess} disabled={isProcessing || pages.length === 0}>
                                    {isProcessing ? '...' : (activeTool.id === 'watermark' ? 'Apply' : (activeMode === MODES.SPLITTER ? 'Split' : 'Download'))}
                                </button>
                            </div>
                        </div>

                        {/* Watermark Tools Panel */}
                        {activeTool.id === 'watermark' && (
                            <div className="watermark-toolbar">
                                <div className="tool-group">
                                    <label>Text</label>
                                    <input
                                        type="text"
                                        value={watermarkText}
                                        onChange={(e) => setWatermarkText(e.target.value)}
                                        className="tool-input-text"
                                    />
                                </div>
                                <div className="tool-divider"></div>
                                <div className="tool-group">
                                    <label>Opacity ({watermarkOpacity})</label>
                                    <input
                                        type="range" min="0.1" max="1.0" step="0.1"
                                        value={watermarkOpacity}
                                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                                        className="tool-slider"
                                    />
                                </div>
                                <div className="tool-divider"></div>
                                <div className="tool-group">
                                    <label>Rotation ({watermarkRotation}°)</label>
                                    <input
                                        type="range" min="0" max="360" step="45"
                                        value={watermarkRotation}
                                        onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
                                        className="tool-slider"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Visual Canvas (Scrollable) */}
                        <div className="preview-canvas" id="main-scroll-container">
                            {pages.length > 0 ? (
                                <div className="pages-flow-container">
                                    {pages.map((page, idx) => (
                                        <div
                                            key={page.id}
                                            id={`page-view-${idx}`}
                                            className={`page-view-wrapper ${selectedPageIndex === idx ? 'focused' : ''}`}
                                            onClick={() => setSelectedPageIndex(idx)}
                                        >
                                            <img
                                                className="big-preview-img"
                                                src={page.imageSrc}
                                                style={{
                                                    transform: `rotate(${page.rotation}deg)`,
                                                    width: `${800 * zoomLevel}px` // Dynamic Width
                                                }}
                                                alt={`Page ${idx + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#666' }}>
                                    <Upload size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <h2>No pages selected</h2>
                                    <p>Select files from the sidebar to begin</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // 3. Simple Mode Interface (Center Card)
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '3rem', textAlign: 'center' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <activeTool.icon size={48} style={{ color: '#818cf8' }} />
                            <h1 style={{ marginTop: '1rem' }}>{activeTool.name}</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>{activeTool.desc}</p>
                        </div>

                        {rawFiles.length === 0 ? (
                            <div
                                className="pdf-uploader"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                        handleFileChange({ target: { files: e.dataTransfer.files } });
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept={activeTool.id === 'word-to-pdf' ? ".docx" : ".pdf"}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <div className="upload-icon-wrapper">
                                    <Upload strokeWidth={1.5} size={32} />
                                </div>
                                <h3 style={{ marginTop: '1rem' }}>Upload File</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                    Drag & drop or click to browse
                                </p>
                                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                                    Choose File
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="file-item" style={{ marginBottom: '2rem' }}>
                                    <FileText size={20} />
                                    <span>{rawFiles[0].name}</span>
                                    <button className="btn btn-ghost btn-sm" onClick={reset}><Trash2 size={16} /></button>
                                </div>

                                {activeTool.id === 'compress' && (
                                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                                        <label>Compression Level</label>
                                        <select
                                            className="control-input"
                                            value={compressLevel}
                                            onChange={(e) => setCompressLevel(e.target.value)}
                                        >
                                            <option value="medium">Medium (Standard)</option>
                                            <option value="high">High (Smallest Size)</option>
                                            <option value="low">Low (Highest Quality)</option>
                                        </select>
                                    </div>
                                )}

                                {activeTool.id === 'watermark' && (
                                    <div style={{ marginBottom: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div>
                                            <label>Watermark Text</label>
                                            <input
                                                type="text"
                                                className="control-input"
                                                value={watermarkText}
                                                onChange={(e) => setWatermarkText(e.target.value)}
                                                placeholder="e.g. CONFIDENTIAL"
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label>Opacity ({watermarkOpacity})</label>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="1.0"
                                                    step="0.1"
                                                    value={watermarkOpacity}
                                                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label>Rotation ({watermarkRotation}°)</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="360"
                                                    step="15"
                                                    value={watermarkRotation}
                                                    onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button className="btn-process" onClick={handleProcess} disabled={isProcessing}>
                                    {isProcessing ? 'Processing...' : (activeTool.id === 'watermark' ? 'Apply Watermark' : 'Start Conversion')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
};

export default PDFEditor;



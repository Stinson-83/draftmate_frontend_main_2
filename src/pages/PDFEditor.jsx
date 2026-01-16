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
    Layers, // for merge
    Hash, // for page numbers
    GripVertical, // for drag handle
    Printer, // for print
    FileOutput, // for PDF to Word
    FilePlus2, // for Word to PDF
    Image, // for image watermark
    Save, // for save watermark
    FolderOpen, // for load watermark
    X // for close/delete
} from 'lucide-react';
import './PDFEditor.css';
import { API_CONFIG } from '../services/endpoints';
import PrintModal from '../components/PrintModal';
import { useWatermarkStorage } from '../hooks/useWatermarkStorage';

const API_URL = API_CONFIG.PDF_EDITOR_API.BASE_URL;

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
    { id: 'pdf-to-word', name: 'PDF to Word', icon: FileOutput, desc: 'Convert your PDF to editable Word documents.', mode: MODES.SIMPLE },
    { id: 'word-to-pdf', name: 'Word to PDF', icon: FilePlus2, desc: 'Make DOC and DOCX files easy to read by converting them to PDF.', mode: MODES.SIMPLE },
    { id: 'watermark', name: 'Watermark PDF', icon: Stamp, desc: 'Stamp text over your PDF pages.', mode: MODES.BUILDER },
    { id: 'page-numbers', name: 'Page Numbers', icon: Hash, desc: 'Add customizable page numbers to your PDF.', mode: MODES.BUILDER }
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
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [outputName, setOutputName] = useState("document");
    const [compressLevel, setCompressLevel] = useState("medium");
    const [zoomLevel, setZoomLevel] = useState(1.0); // 1.0 = 100%

    // Watermark State
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
    const [watermarkRotation, setWatermarkRotation] = useState(45);
    const [watermarkScale, setWatermarkScale] = useState(1.0);

    // Enhanced Watermark State
    const [watermarkType, setWatermarkType] = useState('text'); // 'text', 'image', 'both'
    const [watermarkImage, setWatermarkImage] = useState(null); // File object
    const [watermarkImagePreview, setWatermarkImagePreview] = useState(null); // Data URL for preview
    const [watermarkColorMode, setWatermarkColorMode] = useState('grayscale'); // 'original', 'grayscale', 'bw'
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveWatermarkName, setSaveWatermarkName] = useState('');
    const [showSavedDropdown, setShowSavedDropdown] = useState(false);

    // Watermark Storage Hook
    const { savedWatermarks, saveWatermark, deleteWatermark, getWatermark } = useWatermarkStorage();

    // Page Numbering State
    const [pageNumFormat, setPageNumFormat] = useState('number'); // 'number', 'page-of', 'roman'
    const [pageNumPosition, setPageNumPosition] = useState('bottom-center'); // 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'
    const [pageNumStartFrom, setPageNumStartFrom] = useState(1);
    const [pageNumFontSize, setPageNumFontSize] = useState(12);
    const [pageNumColor, setPageNumColor] = useState('#000000');
    const [pageNumMargin, setPageNumMargin] = useState(36);

    // Print Modal State
    const [showPrintModal, setShowPrintModal] = useState(false);

    const fileInputRef = useRef(null);
    const watermarkImageInputRef = useRef(null);
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

    // --- Watermark Image Handling ---

    const handleWatermarkImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (PNG, JPG, etc.)');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setWatermarkImage(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
            setWatermarkImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Auto-switch to image type if currently on text
        if (watermarkType === 'text') {
            setWatermarkType('image');
        }
    };

    const clearWatermarkImage = () => {
        setWatermarkImage(null);
        setWatermarkImagePreview(null);
        if (watermarkImageInputRef.current) {
            watermarkImageInputRef.current.value = '';
        }
        if (watermarkType === 'image') {
            setWatermarkType('text');
        }
    };

    const handleSaveWatermark = () => {
        if (!saveWatermarkName.trim()) {
            toast.error('Please enter a name for the watermark');
            return;
        }

        saveWatermark({
            name: saveWatermarkName.trim(),
            type: watermarkType,
            text: watermarkText,
            imageDataUrl: watermarkImagePreview,
            colorMode: watermarkColorMode,
            opacity: watermarkOpacity,
            rotation: watermarkRotation,
            scale: watermarkScale,
        });

        toast.success('Watermark saved!');
        setShowSaveDialog(false);
        setSaveWatermarkName('');
    };

    const handleLoadWatermark = (wm) => {
        setWatermarkType(wm.type);
        setWatermarkText(wm.text || 'CONFIDENTIAL');
        setWatermarkImagePreview(wm.imageDataUrl);
        setWatermarkColorMode(wm.colorMode || 'grayscale');
        setWatermarkOpacity(wm.opacity ?? 0.3);
        setWatermarkRotation(wm.rotation ?? 45);
        setWatermarkScale(wm.scale ?? 1.0);

        // If there's an image, we need to convert dataURL back to File for upload
        if (wm.imageDataUrl) {
            fetch(wm.imageDataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'watermark.png', { type: 'image/png' });
                    setWatermarkImage(file);
                });
        } else {
            setWatermarkImage(null);
        }

        setShowSavedDropdown(false);
        toast.success(`Loaded: ${wm.name}`);
    };

    // Get CSS filter for color mode preview
    const getColorModeFilter = () => {
        switch (watermarkColorMode) {
            case 'grayscale':
                return 'grayscale(100%)';
            case 'bw':
                return 'grayscale(100%) contrast(200%)';
            default:
                return 'none';
        }
    };

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
            setIsLoadingFiles(true);
            const startIdx = pages.length > 0 ? pages[pages.length - 1].fileIndex + 1 : 0;

            try {
                const uploadPromises = selectedFiles.map((file, i) => fetchPagesForFile(file, startIdx + i));
                await Promise.all(uploadPromises);
            } catch (err) {
                console.error("Error loading files:", err);
            } finally {
                setIsLoadingFiles(false);
            }
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

    // Helper: Format page number text
    const getPageNumberText = (pageIndex, totalPages) => {
        const num = pageIndex + pageNumStartFrom;
        switch (pageNumFormat) {
            case 'page-of':
                return `Page ${num} of ${totalPages + pageNumStartFrom - 1}`;
            case 'roman':
                // Simple roman numeral conversion for common numbers
                const romanNumerals = [
                    ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'],
                    ['', 'x', 'xx', 'xxx', 'xl', 'l', 'lx', 'lxx', 'lxxx', 'xc'],
                    ['', 'c', 'cc', 'ccc', 'cd', 'd', 'dc', 'dcc', 'dccc', 'cm']
                ];
                if (num <= 0 || num > 999) return num.toString();
                const hundreds = Math.floor(num / 100);
                const tens = Math.floor((num % 100) / 10);
                const ones = num % 10;
                return (romanNumerals[2][hundreds] || '') + (romanNumerals[1][tens] || '') + (romanNumerals[0][ones] || '');
            default:
                return num.toString();
        }
    };

    // Helper: Get position styles for page number overlay
    const getPageNumPositionStyle = () => {
        const baseStyle = {
            position: 'absolute',
            pointerEvents: 'none',
            fontSize: `${pageNumFontSize * zoomLevel}px`,
            color: pageNumColor,
            zIndex: 10,
            fontFamily: 'Arial, sans-serif',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '4px'
        };
        // Use percentage-based margins (approx 7% = 50pt on 700pt page)
        const edgeMargin = '7%';

        switch (pageNumPosition) {
            case 'top-left': return { ...baseStyle, top: edgeMargin, left: edgeMargin };
            case 'top-center': return { ...baseStyle, top: edgeMargin, left: '50%', transform: 'translateX(-50%)' };
            case 'top-right': return { ...baseStyle, top: edgeMargin, right: edgeMargin };
            case 'bottom-left': return { ...baseStyle, bottom: edgeMargin, left: edgeMargin };
            case 'bottom-center': return { ...baseStyle, bottom: edgeMargin, left: '50%', transform: 'translateX(-50%)' };
            case 'bottom-right': return { ...baseStyle, bottom: edgeMargin, right: edgeMargin };
            default: return { ...baseStyle, bottom: edgeMargin, left: '50%', transform: 'translateX(-50%)' };
        }
    };

    const handleProcess = async () => {
        setIsProcessing(true);
        const formData = new FormData();
        const baseFilename = outputName || activeTool.id;

        try {
            let endpoint = '';

            if (activeTool.id === 'page-numbers') {
                endpoint = '/add_page_numbers';
                if (rawFiles.length === 0) throw new Error("No file loaded");
                formData.append('file', rawFiles[0]);
                formData.append('format', pageNumFormat);
                formData.append('position', pageNumPosition);
                formData.append('start_from', pageNumStartFrom.toString());
                formData.append('font_size', pageNumFontSize.toString());
                formData.append('color', pageNumColor);
                formData.append('margin', pageNumMargin.toString());
                formData.append('total_pages', pages.length.toString());

            } else if (activeTool.id === 'watermark') {
                endpoint = '/watermark';
                // For watermark, we need the raw file. 
                if (rawFiles.length === 0) throw new Error("No file loaded");
                formData.append('file', rawFiles[0]);
                formData.append('watermark_type', watermarkType);
                formData.append('opacity', watermarkOpacity.toString());
                formData.append('rotation', watermarkRotation.toString());
                formData.append('scale', watermarkScale.toString());
                formData.append('color_mode', watermarkColorMode);

                // Add text if type is 'text' or 'both'
                if (watermarkType === 'text' || watermarkType === 'both') {
                    formData.append('text', watermarkText);
                }

                // Add image if type is 'image' or 'both'
                if ((watermarkType === 'image' || watermarkType === 'both') && watermarkImage) {
                    formData.append('image', watermarkImage);
                }

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
                        onClick={() => setActiveTool(tool)}
                        title={tool.name}
                    >
                        <tool.icon size={20} />
                    </div>
                ))}
            </div>

            {/* Loading Overlay */}
            {isLoadingFiles && (
                <div className="loading-overlay">
                    <div className="pdf-spinner"></div>
                    <p>Processing files...</p>
                </div>
            )}

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
                                        {activeMode === MODES.BUILDER && (
                                            <div className="drag-handle" title="Drag to reorder">
                                                <GripVertical size={14} />
                                            </div>
                                        )}
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
                                        <button className="btn btn-ghost btn-icon" onClick={() => setShowPrintModal(true)} title="Print Options">
                                            <Printer size={18} />
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
                                    {isProcessing ? (
                                        <div className="processing-dots">
                                            <span></span><span></span><span></span>
                                        </div>
                                    ) : (activeTool.id === 'watermark' || activeTool.id === 'page-numbers' ? 'Apply' : (activeMode === MODES.SPLITTER ? 'Split' : 'Download'))}
                                </button>
                            </div>
                        </div>

                        {/* Enhanced Watermark Tools Panel */}
                        {activeTool.id === 'watermark' && (
                            <div className="watermark-toolbar enhanced">
                                {/* Type Selector Tabs */}
                                <div className="watermark-type-tabs">
                                    {['text', 'image', 'both'].map(type => (
                                        <button
                                            key={type}
                                            className={`type-tab ${watermarkType === type ? 'active' : ''}`}
                                            onClick={() => setWatermarkType(type)}
                                        >
                                            {type === 'text' && <><Stamp size={14} /> Text</>}
                                            {type === 'image' && <><Image size={14} /> Image</>}
                                            {type === 'both' && <><Layers size={14} /> Both</>}
                                        </button>
                                    ))}
                                </div>

                                <div className="watermark-controls-row">
                                    {/* Left: Text/Image Input Area */}
                                    <div className="watermark-input-area">
                                        {(watermarkType === 'text' || watermarkType === 'both') && (
                                            <div className="tool-group">
                                                <label>Watermark Text</label>
                                                <input
                                                    type="text"
                                                    value={watermarkText}
                                                    onChange={(e) => setWatermarkText(e.target.value)}
                                                    className="tool-input-text"
                                                    placeholder="e.g. CONFIDENTIAL"
                                                />
                                            </div>
                                        )}

                                        {(watermarkType === 'image' || watermarkType === 'both') && (
                                            <div className="tool-group image-upload-group">
                                                <label>Logo / Image</label>
                                                <div
                                                    className={`image-upload-zone ${watermarkImagePreview ? 'has-image' : ''}`}
                                                    onClick={() => watermarkImageInputRef.current?.click()}
                                                >
                                                    {watermarkImagePreview ? (
                                                        <div className="image-preview-container">
                                                            <img
                                                                src={watermarkImagePreview}
                                                                alt="Watermark preview"
                                                                style={{ filter: getColorModeFilter() }}
                                                            />
                                                            <button
                                                                className="clear-image-btn"
                                                                onClick={(e) => { e.stopPropagation(); clearWatermarkImage(); }}
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="upload-placeholder">
                                                            <Upload size={20} />
                                                            <span>Click to upload logo</span>
                                                            <span className="hint">PNG, JPG (max 5MB)</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={watermarkImageInputRef}
                                                    accept="image/*"
                                                    hidden
                                                    onChange={handleWatermarkImageChange}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle: Color Mode & Settings */}
                                    <div className="watermark-settings-area">
                                        {(watermarkType === 'image' || watermarkType === 'both') && (
                                            <div className="tool-group">
                                                <label>Color Mode</label>
                                                <select
                                                    value={watermarkColorMode}
                                                    onChange={(e) => setWatermarkColorMode(e.target.value)}
                                                    className="tool-select"
                                                >
                                                    <option value="original">Original Color</option>
                                                    <option value="grayscale">Grayscale</option>
                                                    <option value="bw">Black & White</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="tool-group">
                                            <label>Opacity ({Math.round(watermarkOpacity * 100)}%)</label>
                                            <input
                                                type="range" min="0.1" max="1.0" step="0.1"
                                                value={watermarkOpacity}
                                                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                                                className="tool-slider"
                                            />
                                        </div>

                                        <div className="tool-group">
                                            <label>Rotation ({watermarkRotation}°)</label>
                                            <input
                                                type="range" min="0" max="360" step="15"
                                                value={watermarkRotation}
                                                onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
                                                className="tool-slider"
                                            />
                                        </div>

                                        <div className="tool-group">
                                            <label>Scale ({Math.round(watermarkScale * 100)}%)</label>
                                            <input
                                                type="range" min="0.1" max="2.0" step="0.1"
                                                value={watermarkScale}
                                                onChange={(e) => setWatermarkScale(parseFloat(e.target.value))}
                                                className="tool-slider"
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Save/Load Actions */}
                                    <div className="watermark-actions-area">
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn save-btn"
                                                onClick={() => setShowSaveDialog(true)}
                                                title="Save for later"
                                            >
                                                <Save size={16} />
                                                Save
                                            </button>

                                            <div className="saved-dropdown-container">
                                                <button
                                                    className="action-btn load-btn"
                                                    onClick={() => setShowSavedDropdown(!showSavedDropdown)}
                                                    disabled={savedWatermarks.length === 0}
                                                    title="Load saved watermark"
                                                >
                                                    <FolderOpen size={16} />
                                                    Saved ({savedWatermarks.length})
                                                </button>

                                                {showSavedDropdown && savedWatermarks.length > 0 && (
                                                    <div className="saved-dropdown">
                                                        {savedWatermarks.map(wm => (
                                                            <div key={wm.id} className="saved-item">
                                                                <button
                                                                    className="saved-item-btn"
                                                                    onClick={() => handleLoadWatermark(wm)}
                                                                >
                                                                    {wm.type === 'image' && <Image size={12} />}
                                                                    {wm.type === 'text' && <Stamp size={12} />}
                                                                    {wm.type === 'both' && <Layers size={12} />}
                                                                    <span>{wm.name}</span>
                                                                </button>
                                                                <button
                                                                    className="delete-saved-btn"
                                                                    onClick={() => deleteWatermark(wm.id)}
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Dialog Modal */}
                                {showSaveDialog && (
                                    <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
                                        <div className="save-dialog" onClick={e => e.stopPropagation()}>
                                            <h4>Save Watermark</h4>
                                            <input
                                                type="text"
                                                placeholder="Enter a name..."
                                                value={saveWatermarkName}
                                                onChange={(e) => setSaveWatermarkName(e.target.value)}
                                                className="save-input"
                                                autoFocus
                                            />
                                            <div className="save-dialog-actions">
                                                <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
                                                <button className="primary" onClick={handleSaveWatermark}>Save</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Page Numbers Tools Panel */}
                        {activeTool.id === 'page-numbers' && (
                            <div className="page-number-toolbar">
                                <div className="tool-group">
                                    <label>Format</label>
                                    <select
                                        value={pageNumFormat}
                                        onChange={(e) => setPageNumFormat(e.target.value)}
                                        className="tool-select"
                                    >
                                        <option value="number">1, 2, 3...</option>
                                        <option value="page-of">Page 1 of N</option>
                                        <option value="roman">i, ii, iii...</option>
                                    </select>
                                </div>
                                <div className="tool-divider"></div>
                                <div className="tool-group">
                                    <label>Position</label>
                                    <div className="position-grid-wrapper">
                                        <div className="position-page-preview">
                                            {['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                                <button
                                                    key={pos}
                                                    className={`position-dot ${pos} ${pageNumPosition === pos ? 'active' : ''}`}
                                                    onClick={() => setPageNumPosition(pos)}
                                                    title={pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="tool-divider"></div>
                                <div className="tool-group">
                                    <label>Start From</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={pageNumStartFrom}
                                        onChange={(e) => setPageNumStartFrom(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="tool-input-number"
                                    />
                                </div>
                                <div className="tool-divider"></div>
                                <div className="tool-group">
                                    <label>Size ({pageNumFontSize}pt)</label>
                                    <input
                                        type="range"
                                        min="8"
                                        max="24"
                                        value={pageNumFontSize}
                                        onChange={(e) => setPageNumFontSize(parseInt(e.target.value))}
                                        className="tool-slider"
                                    />
                                </div>
                                <div className="tool-divider"></div>
                                <div className="tool-group">
                                    <label>Color</label>
                                    <input
                                        type="color"
                                        value={pageNumColor}
                                        onChange={(e) => setPageNumColor(e.target.value)}
                                        className="tool-color"
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

                                            {/* Watermark Preview Overlay */}
                                            {activeTool.id === 'watermark' && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: `translate(-50%, -50%) rotate(${watermarkRotation}deg)`,
                                                        opacity: watermarkOpacity,
                                                        pointerEvents: 'none',
                                                        zIndex: 10,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '10px'
                                                    }}
                                                >
                                                    {/* Image Watermark */}
                                                    {(watermarkType === 'image' || watermarkType === 'both') && watermarkImagePreview && (
                                                        <img
                                                            src={watermarkImagePreview}
                                                            alt="Watermark"
                                                            style={{
                                                                maxWidth: `${300 * zoomLevel * watermarkScale}px`,
                                                                maxHeight: `${200 * zoomLevel * watermarkScale}px`,
                                                                objectFit: 'contain',
                                                                filter: getColorModeFilter()
                                                            }}
                                                        />
                                                    )}

                                                    {/* Text Watermark */}
                                                    {(watermarkType === 'text' || watermarkType === 'both') && watermarkText && (
                                                        <div
                                                            style={{
                                                                color: `rgba(60, 60, 60, ${watermarkOpacity})`,
                                                                fontSize: `${(800 * zoomLevel) * watermarkScale * 0.15}px`,
                                                                fontWeight: 'bold',
                                                                whiteSpace: 'nowrap',
                                                                textAlign: 'center',
                                                                textShadow: '0 0 2px rgba(255,255,255,0.3)'
                                                            }}
                                                        >
                                                            {watermarkText}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Page Number Preview Overlay */}
                                            {activeTool.id === 'page-numbers' && (
                                                <div style={getPageNumPositionStyle()}>
                                                    {getPageNumberText(idx, pages.length)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#666' }}>

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
                            <activeTool.icon size={48} style={{ color: '#3b82f6' }} />
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

            <PrintModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                onPrint={(options) => {
                    console.log('Print with options:', options);
                    window.print();
                }}
                onDownloadPDF={handleProcess}
                totalPages={pages.length}
            />
        </div >
    );
};

export default PDFEditor;



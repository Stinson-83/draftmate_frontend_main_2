import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Settings, Trash2, Upload, MoreVertical, Move, RotateCw,
    Scissors, Check, Download, Minimize2, Stamp, Layers, Hash,
    GripVertical, Printer, FileOutput, FilePlus2, Image, Save,
    FolderOpen, X
} from 'lucide-react';
import { API_CONFIG } from '../services/endpoints';
import PrintModal from '../components/PrintModal';
import { useWatermarkStorage } from '../hooks/useWatermarkStorage';
import { caseService } from '../services/library/caseService';

const API_URL = API_CONFIG.PDF_EDITOR_API.BASE_URL;

const MODES = {
    SIMPLE: 'simple',
    BUILDER: 'builder',
    SPLITTER: 'splitter'
};

const TOOLS = [
    { id: 'merge', name: 'Merge & Organize', icon: Layers, desc: 'Combine multiple PDFs, reorder, and rotate pages.', mode: MODES.BUILDER, color: 'from-blue-500 to-indigo-600' },
    { id: 'split', name: 'Split PDF', icon: Scissors, desc: 'Separate one page or a whole set for easy conversion.', mode: MODES.SPLITTER, color: 'from-purple-500 to-pink-600' },
    { id: 'compress', name: 'Compress PDF', icon: Minimize2, desc: 'Reduce file size while optimizing for maximal quality.', mode: MODES.SIMPLE, color: 'from-emerald-500 to-teal-600' },
    { id: 'pdf-to-word', name: 'PDF to Word', icon: FileOutput, desc: 'Convert your PDF to editable Word documents.', mode: MODES.SIMPLE, color: 'from-sky-500 to-blue-600' },
    { id: 'word-to-pdf', name: 'Word to PDF', icon: FilePlus2, desc: 'Make DOC and DOCX files easy to read by converting them to PDF.', mode: MODES.SIMPLE, color: 'from-amber-500 to-orange-600' },
    { id: 'watermark', name: 'Watermark PDF', icon: Stamp, desc: 'Stamp text over your PDF pages.', mode: MODES.BUILDER, color: 'from-rose-500 to-red-600' },
    { id: 'page-numbers', name: 'Page Numbers', icon: Hash, desc: 'Add customizable page numbers to your PDF.', mode: MODES.BUILDER, color: 'from-violet-500 to-purple-600' }
];

const PDFEditor = () => {
    const [activeTool, setActiveTool] = useState(TOOLS[0]);
    const [rawFiles, setRawFiles] = useState([]);
    const [pages, setPages] = useState([]);
    const [selectedPageIndex, setSelectedPageIndex] = useState(0);
    const [splitPoints, setSplitPoints] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [outputName, setOutputName] = useState("document");
    const [compressLevel, setCompressLevel] = useState("medium");
    const [zoomLevel, setZoomLevel] = useState(1.0);

    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
    const [watermarkRotation, setWatermarkRotation] = useState(45);
    const [watermarkScale, setWatermarkScale] = useState(1.0);
    const [watermarkType, setWatermarkType] = useState('text');
    const [watermarkImage, setWatermarkImage] = useState(null);
    const [watermarkImagePreview, setWatermarkImagePreview] = useState(null);
    const [watermarkColorMode, setWatermarkColorMode] = useState('grayscale');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveWatermarkName, setSaveWatermarkName] = useState('');
    const [showSavedDropdown, setShowSavedDropdown] = useState(false);

    const { savedWatermarks, saveWatermark, deleteWatermark, getWatermark } = useWatermarkStorage();

    const [pageNumFormat, setPageNumFormat] = useState('number');
    const [pageNumPosition, setPageNumPosition] = useState('bottom-center');
    const [pageNumStartFrom, setPageNumStartFrom] = useState(1);
    const [pageNumFontSize, setPageNumFontSize] = useState(12);
    const [pageNumColor, setPageNumColor] = useState('#000000');
    const [pageNumMargin, setPageNumMargin] = useState(36);

    const [showPrintModal, setShowPrintModal] = useState(false);

    const fileInputRef = useRef(null);
    const watermarkImageInputRef = useRef(null);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);
    const mainScrollRef = useRef(null);
    const isScrollingRef = useRef(false);

    useEffect(() => {
        if (isScrollingRef.current) return;
        const el = document.getElementById(`page-view-${selectedPageIndex}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [selectedPageIndex]);

    useEffect(() => {
        const container = document.getElementById('main-scroll-container');
        if (!container) return;
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            if (visible.length > 0) {
                const index = parseInt(visible[0].target.id.split('-')[2]);
                if (!isNaN(index)) {
                    isScrollingRef.current = true;
                    setSelectedPageIndex(index);
                    setTimeout(() => isScrollingRef.current = false, 500);
                }
            }
        }, { root: container, threshold: [0.1, 0.5, 0.9] });

        pages.forEach((_, idx) => {
            const el = document.getElementById(`page-view-${idx}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [pages]);

    // [keep all your existing handlers exactly as they are]
    const handleWatermarkImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Please upload an image file (PNG, JPG, etc.)'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('Image size should be less than 5MB'); return; }
        setWatermarkImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setWatermarkImagePreview(reader.result);
        reader.readAsDataURL(file);
        if (watermarkType === 'text') setWatermarkType('image');
    };

    const clearWatermarkImage = () => {
        setWatermarkImage(null);
        setWatermarkImagePreview(null);
        if (watermarkImageInputRef.current) watermarkImageInputRef.current.value = '';
        if (watermarkType === 'image') setWatermarkType('text');
    };

    const handleSaveWatermark = () => {
        if (!saveWatermarkName.trim()) { toast.error('Please enter a name for the watermark'); return; }
        saveWatermark({
            name: saveWatermarkName.trim(), type: watermarkType, text: watermarkText,
            imageDataUrl: watermarkImagePreview, colorMode: watermarkColorMode,
            opacity: watermarkOpacity, rotation: watermarkRotation, scale: watermarkScale,
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
        if (wm.imageDataUrl) {
            fetch(wm.imageDataUrl).then(res => res.blob()).then(blob => {
                const file = new File([blob], 'watermark.png', { type: 'image/png' });
                setWatermarkImage(file);
            });
        } else setWatermarkImage(null);
        setShowSavedDropdown(false);
        toast.success(`Loaded: ${wm.name}`);
    };

    const getColorModeFilter = () => {
        switch (watermarkColorMode) {
            case 'grayscale': return 'grayscale(100%)';
            case 'bw': return 'grayscale(100%) contrast(200%)';
            default: return 'none';
        }
    };

    const handleFileChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;
        const isDocxTool = activeTool.id === 'word-to-pdf';
        const valid = selectedFiles.every(f => f.name.toLowerCase().endsWith(isDocxTool ? '.docx' : '.pdf'));
        if (!valid) { toast.error(`Please upload only ${isDocxTool ? '.docx' : '.pdf'} files.`); return; }
        setRawFiles(prev => [...prev, ...selectedFiles]);
        if (activeTool.mode === MODES.SIMPLE) {
            if (activeTool.id !== 'merge') setRawFiles(selectedFiles);
        }
        if (activeTool.mode !== MODES.SIMPLE || activeTool.id === 'watermark') {
            setIsLoadingFiles(true);
            const startIdx = pages.length > 0 ? pages[pages.length - 1].fileIndex + 1 : 0;
            try {
                const uploadPromises = selectedFiles.map((file, i) => fetchPagesForFile(file, startIdx + i));
                await Promise.all(uploadPromises);
            } catch (err) { console.error("Error loading files:", err); }
            finally { setIsLoadingFiles(false); }
        }
    };

    const fetchPagesForFile = async (file, fileIndex) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('limit', 0);
        try {
            const res = await fetch(`${API_URL}/preview`, { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                const newPages = data.pages.map((img, idx) => ({
                    id: `${fileIndex}-${idx}-${Date.now()}`,
                    fileIndex, pageIndex: idx, imageSrc: img, rotation: 0, fileName: file.name
                }));
                setPages(prev => [...prev, ...newPages]);
                if (pages.length === 0 && newPages.length > 0) setSelectedPageIndex(0);
            }
        } catch (e) { console.error("Fetch pages error:", e); toast.error(`Failed to load ${file.name}`); }
    };

    const handleDragStart = (e, index) => { dragItem.current = index; e.dataTransfer.effectAllowed = "move"; };
    const handleDragEnter = (e, index) => { dragOverItem.current = index; };
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

    const rotatePage = (angle) => {
        if (pages.length === 0) return;
        const newPages = [...pages];
        newPages[selectedPageIndex].rotation = (newPages[selectedPageIndex].rotation + angle) % 360;
        setPages(newPages);
    };

    const deletePage = (e, index) => {
        e.stopPropagation();
        const newPages = pages.filter((_, i) => i !== index);
        setPages(newPages);
        if (selectedPageIndex >= newPages.length) setSelectedPageIndex(Math.max(0, newPages.length - 1));
    };

    const toggleSplit = (index) => {
        if (splitPoints.includes(index)) setSplitPoints(splitPoints.filter(i => i !== index));
        else setSplitPoints([...splitPoints, index]);
    };

    const getPageNumberText = (pageIndex, totalPages) => {
        const num = pageIndex + pageNumStartFrom;
        switch (pageNumFormat) {
            case 'page-of': return `Page ${num} of ${totalPages + pageNumStartFrom - 1}`;
            case 'roman':
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
            default: return num.toString();
        }
    };

    const getPageNumPositionStyle = () => {
        const baseStyle = {
            position: 'absolute', pointerEvents: 'none', fontSize: `${pageNumFontSize * zoomLevel}px`,
            color: pageNumColor, zIndex: 10, fontFamily: 'Arial, sans-serif', padding: '4px 8px',
            background: 'rgba(255,255,255,0.7)', borderRadius: '4px'
        };
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
                if (rawFiles.length === 0) throw new Error("No file loaded");
                formData.append('file', rawFiles[0]);
                formData.append('watermark_type', watermarkType);
                formData.append('opacity', watermarkOpacity.toString());
                formData.append('rotation', watermarkRotation.toString());
                formData.append('scale', watermarkScale.toString());
                formData.append('color_mode', watermarkColorMode);
                if (watermarkType === 'text' || watermarkType === 'both') formData.append('text', watermarkText);
                if ((watermarkType === 'image' || watermarkType === 'both') && watermarkImage) formData.append('image', watermarkImage);
            } else if (activeTool.mode === MODES.BUILDER) {
                endpoint = '/assemble';
                if (rawFiles.length === 0) throw new Error("No files loaded");
                rawFiles.forEach(f => formData.append('files', f));
                const manifest = pages.map(p => ({ file_index: p.fileIndex, page_index: p.pageIndex, rotation: p.rotation }));
                formData.append('manifest', JSON.stringify(manifest));
            } else if (activeTool.mode === MODES.SPLITTER) {
                endpoint = '/split';
                if (rawFiles.length === 0) throw new Error("No file loaded");
                formData.append('file', rawFiles[0]);
                const sortedSplits = [...splitPoints].sort((a, b) => a - b);
                const ranges = [];
                let currentStart = 1;
                sortedSplits.forEach(idx => {
                    const end = idx + 1;
                    ranges.push(`${currentStart}-${end}`);
                    currentStart = end + 1;
                });
                ranges.push(`${currentStart}-${pages.length}`);
                formData.append('ranges', ranges.join(','));
            } else {
                endpoint = `/${activeTool.id}`;
                if (rawFiles.length === 0) throw new Error("No file loaded");
                formData.append('file', rawFiles[0]);
                if (activeTool.id === 'compress') formData.append('level', compressLevel);
            }
            if (endpoint) {
                const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', body: formData });
                await handleDownload(res, baseFilename);
            }
        } catch (error) {
            console.error(error);
            toast.error("Processing failed: " + error.message);
        } finally { setIsProcessing(false); }
    };

    const handleDownload = async (res, defaultName) => {
        if (!res.ok) {
            const errorText = await res.text();
            try { const errorJson = JSON.parse(errorText); throw new Error(errorJson.detail || "Backend error"); }
            catch (e) { throw new Error(errorText || "Backend error"); }
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
        if (activeTool.id === 'split' && activeTool.mode === MODES.SPLITTER) filename = `${outputName}.zip`;
        a.download = filename;
        document.body.appendChild(a);
        a.remove();
        toast.success("Done!");
    };

    const reset = () => {
        setRawFiles([]); setPages([]); setSplitPoints([]); setSelectedPageIndex(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const activeMode = activeTool.mode;

    return (
        <div className="relative flex h-full w-full overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [0, 80, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-10 -left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ x: [0, -60, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-10 -right-20 w-[28rem] h-[28rem] bg-indigo-200/30 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-1/2 left-1/3 w-72 h-72 bg-sky-200/20 rounded-full blur-3xl"
                />
            </div>

            {/* ════════ TOOL SIDEBAR ════════ */}
            <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 flex flex-col items-center gap-2 py-4 px-2 bg-white/70 backdrop-blur-xl border-r border-blue-100 shadow-sm"
            >
                {TOOLS.map((tool, i) => (
                    <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.2 }}
                        whileHover={{ scale: 1.1, x: 4 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setActiveTool(tool)}
                        title={tool.name}
                        className={`relative w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 group
                            ${activeTool.id === tool.id
                                ? `bg-gradient-to-br ${tool.color} text-white shadow-lg shadow-blue-500/30`
                                : 'bg-white/60 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-blue-100'
                            }`}
                    >
                        {activeTool.id === tool.id && (
                            <motion.div
                                layoutId="activeToolIndicator"
                                className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            />
                        )}
                        <tool.icon size={20} />

                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-800 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                            {tool.name}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ════════ LOADING OVERLAY ════════ */}
            <AnimatePresence>
                {isLoadingFiles && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="flex flex-col items-center gap-4 p-8 bg-white/90 rounded-2xl shadow-2xl border border-blue-100"
                        >
                            <div className="relative w-14 h-14">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-full"
                                />
                                <FileText size={20} className="absolute inset-0 m-auto text-blue-600" />
                            </div>
                            <p className="text-slate-700 font-medium">Processing files...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ════════ BUILDER / SPLITTER MODE ════════ */}
            {(activeMode === MODES.BUILDER || activeMode === MODES.SPLITTER) ? (
                <div className="relative z-10 flex flex-1 overflow-hidden">
                    {/* Thumbnails Sidebar */}
                    <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="w-64 flex flex-col bg-white/60 backdrop-blur-xl border-r border-blue-100 overflow-y-auto p-4 shadow-sm"
                    >
                        <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all"
                        >
                            <Upload size={16} />
                            Add Files
                        </motion.button>
                        <input type="file" ref={fileInputRef} multiple accept=".pdf" hidden onChange={handleFileChange} />

                        <AnimatePresence>
                            {pages.map((page, idx) => (
                                <motion.div
                                    key={page.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: -50 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setSelectedPageIndex(idx)}
                                        draggable={activeMode === MODES.BUILDER}
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragEnter={(e) => handleDragEnter(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        className={`group relative mb-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                                            ${selectedPageIndex === idx
                                                ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/30 bg-white'
                                                : 'bg-white/80 hover:bg-white hover:shadow-md border border-blue-100'
                                            }`}
                                    >
                                        <div className="relative aspect-[3/4] p-2">
                                            {activeMode === MODES.BUILDER && (
                                                <div className="absolute top-2 left-2 z-10 p-1 rounded bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                                    <GripVertical size={12} className="text-slate-500" />
                                                </div>
                                            )}
                                            <img
                                                src={page.imageSrc}
                                                style={{ transform: `rotate(${page.rotation}deg)` }}
                                                className="w-full h-full object-contain transition-transform duration-300"
                                                alt=""
                                            />
                                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-sm">
                                                {idx + 1}
                                            </div>
                                            {activeMode === MODES.BUILDER && (
                                                <motion.button
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => deletePage(e, idx)}
                                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={12} />
                                                </motion.button>
                                            )}
                                        </div>
                                        <div className="px-2 pb-2 text-[10px] text-slate-500 truncate" title={page.fileName}>
                                            {page.fileName}
                                        </div>
                                    </motion.div>

                                    {activeMode === MODES.SPLITTER && idx < pages.length - 1 && (
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => toggleSplit(idx)}
                                            className="my-2 cursor-pointer group"
                                        >
                                            <div className={`relative h-1 rounded-full transition-all duration-300 ${splitPoints.includes(idx)
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 h-1.5'
                                                : 'bg-blue-100 group-hover:bg-blue-200'
                                                }`}>
                                                {splitPoints.includes(idx) && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg"
                                                    >
                                                        <Scissors size={14} />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {pages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-slate-400 mt-8 text-sm"
                            >
                                <Upload size={32} className="mx-auto mb-2 opacity-40" />
                                Add files to start
                            </motion.div>
                        )}
                    </motion.div>

                    {/* ════════ MAIN PREVIEW AREA ════════ */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Top Toolbar */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center justify-between px-6 py-3 bg-white/70 backdrop-blur-xl border-b border-blue-100 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <motion.div
                                    key={activeTool.id}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${activeTool.color} flex items-center justify-center shadow-md`}
                                >
                                    <activeTool.icon size={18} className="text-white" />
                                </motion.div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">{activeTool.name}</h3>
                                    {pages.length > 0 && (
                                        <p className="text-xs text-slate-500">
                                            Page {selectedPageIndex + 1} of {pages.length}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Zoom */}
                                <div className="flex items-center gap-1 bg-blue-50 rounded-lg p-1">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                                        className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:text-blue-600 transition-colors font-bold"
                                    >−</motion.button>
                                    <span className="text-xs font-semibold text-slate-700 min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.1))}
                                        className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:text-blue-600 transition-colors font-bold"
                                    >+</motion.button>
                                </div>

                                {activeMode === MODES.BUILDER && (
                                    <div className="flex items-center gap-1">
                                        {[
                                            { icon: RotateCw, action: () => rotatePage(-90), flip: true, title: "Rotate Left" },
                                            { icon: RotateCw, action: () => rotatePage(90), title: "Rotate Right" },
                                            { icon: Printer, action: () => setShowPrintModal(true), title: "Print" },
                                        ].map((btn, i) => (
                                            <motion.button
                                                key={i}
                                                whileHover={{ scale: 1.1, y: -1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={btn.action}
                                                title={btn.title}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                            >
                                                <btn.icon size={16} style={btn.flip ? { transform: 'scaleX(-1)' } : {}} />
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                                <input
                                    type="text"
                                    value={outputName}
                                    onChange={(e) => setOutputName(e.target.value)}
                                    placeholder="Filename"
                                    className="px-3 py-2 text-sm rounded-lg bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all w-40"
                                />

                                <motion.button
                                    whileHover={{ scale: 1.03, y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleProcess}
                                    disabled={isProcessing || pages.length === 0}
                                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(i => (
                                                <motion.span
                                                    key={i}
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                    className="w-1.5 h-1.5 bg-white rounded-full"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <Download size={14} />
                                            {activeTool.id === 'watermark' || activeTool.id === 'page-numbers' ? 'Apply' : (activeMode === MODES.SPLITTER ? 'Split' : 'Download')}
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Watermark Toolbar */}
                        <AnimatePresence>
                            {activeTool.id === 'watermark' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-white/60 backdrop-blur-xl border-b border-blue-100"
                                >
                                    <div className="p-4">
                                        {/* Type tabs */}
                                        <div className="flex gap-2 mb-4">
                                            {['text', 'image', 'both'].map(type => (
                                                <motion.button
                                                    key={type}
                                                    whileHover={{ scale: 1.05, y: -1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setWatermarkType(type)}
                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${watermarkType === type
                                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                                                        : 'bg-blue-50 text-slate-600 hover:bg-blue-100'
                                                        }`}
                                                >
                                                    {type === 'text' && <><Stamp size={14} /> Text</>}
                                                    {type === 'image' && <><Image size={14} /> Image</>}
                                                    {type === 'both' && <><Layers size={14} /> Both</>}
                                                </motion.button>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Input area */}
                                            <div className="space-y-3">
                                                {(watermarkType === 'text' || watermarkType === 'both') && (
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">Watermark Text</label>
                                                        <input
                                                            type="text"
                                                            value={watermarkText}
                                                            onChange={(e) => setWatermarkText(e.target.value)}
                                                            className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                                            placeholder="e.g. CONFIDENTIAL"
                                                        />
                                                    </div>
                                                )}
                                                {(watermarkType === 'image' || watermarkType === 'both') && (
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">Logo / Image</label>
                                                        <motion.div
                                                            whileHover={{ scale: 1.02 }}
                                                            onClick={() => watermarkImageInputRef.current?.click()}
                                                            className={`p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all ${watermarkImagePreview ? 'border-blue-400 bg-blue-50' : 'border-blue-200 hover:border-blue-400 bg-white'}`}
                                                        >
                                                            {watermarkImagePreview ? (
                                                                <div className="relative">
                                                                    <img src={watermarkImagePreview} alt="" className="w-full h-20 object-contain" style={{ filter: getColorModeFilter() }} />
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); clearWatermarkImage(); }}
                                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-1 text-slate-500">
                                                                    <Upload size={18} />
                                                                    <span className="text-xs font-medium">Click to upload</span>
                                                                    <span className="text-[10px] text-slate-400">PNG, JPG · max 5MB</span>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                        <input type="file" ref={watermarkImageInputRef} accept="image/*" hidden onChange={handleWatermarkImageChange} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Settings */}
                                            <div className="space-y-3">
                                                {(watermarkType === 'image' || watermarkType === 'both') && (
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">Color Mode</label>
                                                        <select
                                                            value={watermarkColorMode}
                                                            onChange={(e) => setWatermarkColorMode(e.target.value)}
                                                            className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                        >
                                                            <option value="original">Original Color</option>
                                                            <option value="grayscale">Grayscale</option>
                                                            <option value="bw">Black & White</option>
                                                        </select>
                                                    </div>
                                                )}
                                                {[
                                                    { label: `Opacity (${Math.round(watermarkOpacity * 100)}%)`, value: watermarkOpacity, min: 0.1, max: 1, step: 0.1, setter: (v) => setWatermarkOpacity(parseFloat(v)) },
                                                    { label: `Rotation (${watermarkRotation}°)`, value: watermarkRotation, min: 0, max: 360, step: 15, setter: (v) => setWatermarkRotation(parseInt(v)) },
                                                    { label: `Scale (${Math.round(watermarkScale * 100)}%)`, value: watermarkScale, min: 0.1, max: 2, step: 0.1, setter: (v) => setWatermarkScale(parseFloat(v)) },
                                                ].map((s, i) => (
                                                    <div key={i}>
                                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">{s.label}</label>
                                                        <input
                                                            type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                                                            onChange={(e) => s.setter(e.target.value)}
                                                            className="w-full accent-blue-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Save/Load */}
                                            <div className="flex flex-col gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setShowSaveDialog(true)}
                                                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                                                >
                                                    <Save size={14} /> Save Watermark
                                                </motion.button>

                                                <div className="relative">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setShowSavedDropdown(!showSavedDropdown)}
                                                        disabled={savedWatermarks.length === 0}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-blue-200 text-sm font-semibold text-slate-700 hover:bg-blue-50 transition-all disabled:opacity-50"
                                                    >
                                                        <FolderOpen size={14} /> Saved ({savedWatermarks.length})
                                                    </motion.button>

                                                    <AnimatePresence>
                                                        {showSavedDropdown && savedWatermarks.length > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-xl border border-blue-100 max-h-48 overflow-y-auto z-20"
                                                            >
                                                                {savedWatermarks.map(wm => (
                                                                    <div key={wm.id} className="flex items-center justify-between p-2 hover:bg-blue-50 border-b border-blue-50 last:border-0">
                                                                        <button onClick={() => handleLoadWatermark(wm)} className="flex items-center gap-2 text-xs text-slate-700 flex-1 text-left">
                                                                            {wm.type === 'image' && <Image size={12} />}
                                                                            {wm.type === 'text' && <Stamp size={12} />}
                                                                            {wm.type === 'both' && <Layers size={12} />}
                                                                            {wm.name}
                                                                        </button>
                                                                        <button onClick={() => deleteWatermark(wm.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Save Dialog */}
                                    <AnimatePresence>
                                        {showSaveDialog && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setShowSaveDialog(false)}
                                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                                            >
                                                <motion.div
                                                    initial={{ scale: 0.8, y: 20 }}
                                                    animate={{ scale: 1, y: 0 }}
                                                    exit={{ scale: 0.8, y: 20 }}
                                                    onClick={e => e.stopPropagation()}
                                                    className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm border border-blue-100"
                                                >
                                                    <h4 className="text-lg font-bold text-slate-800 mb-4">Save Watermark</h4>
                                                    <input
                                                        type="text" placeholder="Enter a name..." value={saveWatermarkName}
                                                        onChange={(e) => setSaveWatermarkName(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setShowSaveDialog(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                                        <button onClick={handleSaveWatermark} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md">Save</button>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Page Numbers Toolbar */}
                        <AnimatePresence>
                            {activeTool.id === 'page-numbers' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-white/60 backdrop-blur-xl border-b border-blue-100"
                                >
                                    <div className="p-4 flex flex-wrap items-end gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">Format</label>
                                            <select value={pageNumFormat} onChange={(e) => setPageNumFormat(e.target.value)}
                                                className="px-3 py-2 text-sm rounded-lg bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
                                                <option value="number">1, 2, 3...</option>
                                                <option value="page-of">Page 1 of N</option>
                                                <option value="roman">i, ii, iii...</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">Position</label>
                                            <div className="grid grid-cols-3 gap-1 p-2 bg-blue-50 rounded-lg">
                                                {['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                                    <motion.button
                                                        whileHover={{ scale: 1.2 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        key={pos}
                                                        onClick={() => setPageNumPosition(pos)}
                                                        className={`w-4 h-4 rounded-full transition-all ${pageNumPosition === pos ? 'bg-blue-600 scale-110 shadow' : 'bg-blue-200 hover:bg-blue-300'}`}
                                                        title={pos}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">Start From</label>
                                            <input type="number" min="1" value={pageNumStartFrom}
                                                onChange={(e) => setPageNumStartFrom(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-20 px-3 py-2 text-sm rounded-lg bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">Size ({pageNumFontSize}pt)</label>
                                            <input type="range" min="8" max="24" value={pageNumFontSize}
                                                onChange={(e) => setPageNumFontSize(parseInt(e.target.value))}
                                                className="w-32 accent-blue-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">Color</label>
                                            <input type="color" value={pageNumColor}
                                                onChange={(e) => setPageNumColor(e.target.value)}
                                                className="w-12 h-10 rounded-lg cursor-pointer border border-blue-200" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Canvas */}
                        <div id="main-scroll-container" className="flex-1 overflow-y-auto p-8">
                            {pages.length > 0 ? (
                                <div className="flex flex-col items-center gap-8">
                                    {pages.map((page, idx) => (
                                        <motion.div
                                            key={page.id}
                                            id={`page-view-${idx}`}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => setSelectedPageIndex(idx)}
                                            className={`relative bg-white rounded-xl overflow-hidden transition-all duration-300 ${selectedPageIndex === idx
                                                ? 'shadow-2xl shadow-blue-500/20 ring-2 ring-blue-400'
                                                : 'shadow-md hover:shadow-xl'
                                                }`}
                                        >
                                            <img
                                                className="block"
                                                src={page.imageSrc}
                                                style={{ transform: `rotate(${page.rotation}deg)`, width: `${800 * zoomLevel}px` }}
                                                alt={`Page ${idx + 1}`}
                                            />

                                            {/* Watermark Preview */}
                                            {activeTool.id === 'watermark' && (
                                                <div style={{
                                                    position: 'absolute', top: '50%', left: '50%',
                                                    transform: `translate(-50%, -50%) rotate(${watermarkRotation}deg)`,
                                                    opacity: watermarkOpacity, pointerEvents: 'none', zIndex: 10,
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                                                }}>
                                                    {(watermarkType === 'image' || watermarkType === 'both') && watermarkImagePreview && (
                                                        <img src={watermarkImagePreview} alt=""
                                                            style={{
                                                                maxWidth: `${300 * zoomLevel * watermarkScale}px`,
                                                                maxHeight: `${200 * zoomLevel * watermarkScale}px`,
                                                                objectFit: 'contain', filter: getColorModeFilter()
                                                            }} />
                                                    )}
                                                    {(watermarkType === 'text' || watermarkType === 'both') && watermarkText && (
                                                        <div style={{
                                                            color: `rgba(60, 60, 60, ${watermarkOpacity})`,
                                                            fontSize: `${(800 * zoomLevel) * watermarkScale * 0.15}px`,
                                                            fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center',
                                                            textShadow: '0 0 2px rgba(255,255,255,0.3)'
                                                        }}>{watermarkText}</div>
                                                    )}
                                                </div>
                                            )}

                                            {activeTool.id === 'page-numbers' && (
                                                <div style={getPageNumPositionStyle()}>
                                                    {getPageNumberText(idx, pages.length)}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center"
                                >
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                        className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg"
                                    >
                                        <FileText size={36} className="text-blue-500" />
                                    </motion.div>
                                    <h2 className="text-xl font-bold text-slate-700 mb-2">No pages loaded</h2>
                                    <p className="text-sm text-slate-500">Click "Add Files" in the sidebar to begin</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // ════════ SIMPLE MODE ════════
                <div className="relative z-10 flex-1 flex items-center justify-center p-8">
                    <motion.div
                        key={activeTool.id}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="w-full max-w-xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 border border-white/60 p-10 text-center relative overflow-hidden"
                    >
                        {/* Decorative gradient */}
                        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${activeTool.color}`} />

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                            className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${activeTool.color} flex items-center justify-center shadow-xl shadow-blue-500/30 mb-4`}
                        >
                            <activeTool.icon size={36} className="text-white" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">{activeTool.name}</h1>
                        <p className="text-slate-500 mb-6">{activeTool.desc}</p>

                        {rawFiles.length === 0 ? (
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files?.length > 0) handleFileChange({ target: { files: e.dataTransfer.files } });
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-10 cursor-pointer transition-all bg-blue-50/50 hover:bg-blue-50"
                            >
                                <input type="file" ref={fileInputRef} accept={activeTool.id === 'word-to-pdf' ? ".docx" : ".pdf"} onChange={handleFileChange} hidden />
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                                >
                                    <Upload size={28} className="text-white" />
                                </motion.div>
                                <h3 className="text-lg font-bold text-slate-700 mb-1">Upload File</h3>
                                <p className="text-sm text-slate-500 mb-4">Drag & drop or click to browse</p>
                                <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">
                                    Choose File
                                </button>
                            </motion.div>
                        ) : (
                            <div>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 p-3 mb-5 rounded-xl bg-blue-50 border border-blue-100"
                                >
                                    <FileText size={20} className="text-blue-600" />
                                    <span className="flex-1 text-left text-sm font-medium text-slate-700 truncate">{rawFiles[0].name}</span>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        onClick={reset}
                                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                        <Trash2 size={16} />
                                    </motion.button>
                                </motion.div>

                                {activeTool.id === 'compress' && (
                                    <div className="mb-5 text-left">
                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">Compression Level</label>
                                        <select value={compressLevel} onChange={(e) => setCompressLevel(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
                                            <option value="medium">Medium (Standard)</option>
                                            <option value="high">High (Smallest Size)</option>
                                            <option value="low">Low (Highest Quality)</option>
                                        </select>
                                    </div>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleProcess}
                                    disabled={isProcessing}
                                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(i => (
                                                <motion.span key={i}
                                                    animate={{ y: [0, -6, 0] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                    className="w-2 h-2 bg-white rounded-full" />
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            Start Conversion
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            <PrintModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                onPrint={(options) => { console.log('Print:', options); window.print(); }}
                onDownloadPDF={handleProcess}
                totalPages={pages.length}
            />
        </div>
    );
};

export default PDFEditor;
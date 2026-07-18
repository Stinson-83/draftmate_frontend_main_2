import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DraftingModal from '../components/DraftingModal';
import UploadModal from '../components/UploadModal';
import CourtFeeModal from '../components/CourtFeeModal';
import InvoiceModal from '../components/InvoiceModal';
import DictationModal from '../components/DictationModal';
import axios from 'axios';
import { API_CONFIG } from '../services/endpoints';

const ensureDocxFilename = (filename, fallback = 'Untitled Draft') => {
    const raw = String(filename || fallback).trim() || fallback;
    if (raw.toLowerCase().endsWith('.docx') || raw.toLowerCase().endsWith('.pdf')) {
        return raw;
    }
    return `${raw}.docx`;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { type: 'spring', stiffness: 260, damping: 22 }
    }
};

const Tools = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isCourtFeeModalOpen, setIsCourtFeeModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isDictationModalOpen, setIsDictationModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [initialDraftingPrompt, setInitialDraftingPrompt] = useState('');
    const fileInputRef = useRef(null);

    const saveDeskDraftRecord = (record) => {
        const savedDrafts = JSON.parse(localStorage.getItem('my_drafts') || '[]');
        const nextRecord = {
            ...record,
            id: record.id || record.documentKey || Date.now().toString(),
            name: record.name || record.filename || record.title || 'Untitled Draft',
            filename: ensureDocxFilename(record.filename || record.name || record.title || 'Untitled Draft'),
            documentKey: record.documentKey || record.id || '',
            lastModified: record.lastModified || new Date().toISOString(),
            status: record.status || 'In progress',
            trackingParams: record.trackingParams || {
                source: record.source || 'tools_upload',
                documentKey: record.documentKey || record.id || '',
                filename: ensureDocxFilename(record.filename || record.name || record.title || 'Untitled Draft'),
                updatedAt: record.lastModified || new Date().toISOString(),
                folderId: record.folderId ?? null,
            },
        };

        const updatedDrafts = [
            ...savedDrafts.filter((draft) => String(draft.id) !== String(nextRecord.id)),
            nextRecord,
        ];

        localStorage.setItem('my_drafts', JSON.stringify(updatedDrafts));
        window.dispatchEvent(new Event('my_drafts_updated'));
    };

    useEffect(() => {
        if (location.state?.openDrafting) {
            setInitialDraftingPrompt(location.state.prompt || '');
            setIsModalOpen(true);
            window.history.replaceState({}, document.title)
        }
    }, [location]);

    const handleDraftingClick = () => {
        setInitialDraftingPrompt('');
        setIsModalOpen(true);
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const sessionId = localStorage.getItem('session_id');
        if (!sessionId) {
            alert('Please sign in again before uploading a document.');
            e.target.value = '';
            return;
        }

        setUploadedFileName(file.name);
        setIsUploading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('session_id', sessionId);

        try {
            const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/upload`;
            const response = await axios.post(url, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${sessionId}`
                },
            });
            const data = response.data;
            
            saveDeskDraftRecord({
                id: data.documentKey,
                name: data.filename,
                filename: data.filename,
                documentKey: data.documentKey,
                onlyofficeConfig: data,
                variablesDetected: data.variablesDetected || [],
                status: 'In progress',
                source: 'tools_upload',
                trackingParams: {
                    source: 'tools_upload',
                    documentKey: data.documentKey,
                    filename: data.filename,
                    uploadedAt: new Date().toISOString(),
                },
            });

            navigate('/dashboard/workspace', {
                state: {
                    documentKey: data.documentKey,
                    filename: data.filename,
                    onlyofficeConfig: data,
                    variablesDetected: data.variablesDetected || [],
                    trackingParams: {
                        source: 'tools_upload',
                        documentKey: data.documentKey,
                        filename: data.filename,
                    }
                }
            });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload and open document. Please try again.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleEmptyDocumentClick = async () => {
        setIsUploading(true);
        try {
            const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/create`;
            const response = await axios.post(url, {}, {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('session_id')}`
                },
            });
            const data = response.data;
            navigate('/dashboard/workspace', {
                state: {
                    documentKey: data.documentKey,
                    filename: data.filename,
                    onlyofficeConfig: data,
                    variablesDetected: []
                }
            });
        } catch (error) {
            console.error('Failed to create empty document:', error);
            alert('Failed to initialize empty document. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadSubmit = ({ details, supportingDocs }) => {
        navigate('/dashboard/editor', {
            state: { htmlContent, uploadDetails: details, supportingDocs }
        });
    };

    const handleUploadSkip = () => navigate('/dashboard/editor', { state: { htmlContent } });

    // Reusable Card Component with interactive radial glow and animation
    const ToolCard = ({ icon, title, description, onClick, accentColor = "#136dec", badge, children }) => {
        const cardRef = useRef(null);
        const [isHovered, setIsHovered] = useState(false);
        const [localMouse, setLocalMouse] = useState({ x: 0, y: 0 });

        const handleMouseMove = (e) => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            setLocalMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        };

        return (
            <motion.div
                ref={cardRef}
                variants={cardVariants}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                className="group relative flex flex-col gap-4 p-6 rounded-2xl border cursor-pointer h-full overflow-hidden
                    bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800
                    hover:border-primary/30 dark:hover:border-primary/40
                    hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
            >
                {isHovered && (
                    <div
                        className="absolute pointer-events-none transition-opacity duration-300 opacity-100"
                        style={{
                            background: `radial-gradient(500px circle at ${localMouse.x}px ${localMouse.y}px, ${accentColor}08, transparent 50%)`,
                            top: 0, left: 0, right: 0, bottom: 0
                        }}
                    />
                )}

                <div className="relative z-10 flex items-start justify-between gap-3">
                    <motion.div
                        whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{
                            backgroundColor: `${accentColor}15`,
                            color: accentColor
                        }}
                    >
                        <span className="material-symbols-outlined text-2xl">{icon}</span>
                    </motion.div>

                    {badge && (
                        <motion.span
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                        >
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            {badge}
                        </motion.span>
                    )}
                </div>

                <div className="relative z-10 flex flex-col flex-1">
                    <h4 className="text-lg font-bold mb-2 text-[#0d131b] dark:text-white transition-colors duration-300">
                        {title}
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 transition-colors duration-300">
                        {description}
                    </p>
                    {children && <div className="flex-1 flex flex-col justify-center pt-4">{children}</div>}
                </div>
            </motion.div>
        );
    };


    const FilterButton = ({ icon, label, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-all border
            ${isActive
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 group'
                }`}
        >
            <span className={`material-symbols-outlined text-[20px] ${!isActive && 'text-slate-500 group-hover:text-primary'}`}>
                {icon}
            </span>
            <p className={`text-sm ${isActive ? 'font-bold' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                {label}
            </p>
        </button>
    );

    const [activeCategory, setActiveCategory] = useState('All features');

    const categories = [
        { id: 'All features', icon: 'grid_view', label: 'All features' },
        { id: 'Drafting', icon: 'edit_document', label: 'Drafting' },
        { id: 'PDF Tools', icon: 'picture_as_pdf', label: 'PDF Tools' },
        { id: 'Research', icon: 'search', label: 'Research' },
        { id: 'Utilities', icon: 'construction', label: 'Utilities' },
        { id: 'How to use ?', icon: 'help', label: 'How to use ?' }
    ];

    const TUTORIAL_VIDEOS = [
        { id: 1, url: 'https://www.youtube.com/embed/TDkH3EbWTYc', title: 'Tutorial 1' },
        { id: 2, url: 'https://www.youtube.com/watch?v=tdIUMkXxtHg', title: 'Tutorial 2' },
        { id: 3, url: 'https://www.youtube.com/embed/TDkH3EbWTYc', title: 'Tutorial 3' },
        { id: 4, url: 'https://www.youtube.com/embed/TDkH3EbWTYc', title: 'Tutorial 4' }
    ];

    // Helper to convert watch URL to embed URL
    const getEmbedUrl = (url) => {
        if (!url) return '';
        if (url.includes('embed')) return url;
        const videoId = url.split('v=')[1]?.split('&')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    };

    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    const nextVideo = () => {
        setCurrentVideoIndex((prev) => (prev + 1) % TUTORIAL_VIDEOS.length);
    };

    const prevVideo = () => {
        setCurrentVideoIndex((prev) => (prev - 1 + TUTORIAL_VIDEOS.length) % TUTORIAL_VIDEOS.length);
    };

    return (
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-background-light dark:bg-background-dark font-display relative">
            {isUploading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-lg font-medium text-slate-800 dark:text-white">Uploading & Converting...</p>
                    </div>
                </div>
            )}
            {/* Sticky Filter Bar */}
            <div className="sticky top-0 z-20 w-full bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10 lg:px-40 py-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {categories.map(cat => (
                            <FilterButton
                                key={cat.id}
                                icon={cat.icon}
                                label={cat.label}
                                isActive={activeCategory === cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={activeCategory}
                className={`flex-1 ${activeCategory === 'How to use ?' ? 'overflow-hidden flex flex-col justify-center' : 'overflow-y-auto pb-20'}`}
            >
                <div className={`w-full max-w-[1200px] mx-auto px-4 md:px-10 lg:px-40 ${activeCategory === 'How to use ?' ? '' : 'pt-6 pb-12 flex flex-col gap-16'}`}>

                    {/* Drafting Section */}
                    {(activeCategory === 'All features' || activeCategory === 'Drafting') && (
                        <section className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-2xl font-bold text-[#0d131b] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">edit_document</span>
                                    Drafting
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <ToolCard
                                    icon="edit_document"
                                    title="Create New Draft"
                                    description="Start a new document with AI guidance or an empty workspace."
                                    onClick={handleDraftingClick}
                                    accentColor="#3b82f6"
                                />
                                <ToolCard
                                    icon="upload_file"
                                    title="Work on Existing Document"
                                    description="Upload a `.docx` or `.pdf` file and continue in the workspace."
                                    onClick={handleUploadClick}
                                    accentColor="#6366f1"
                                />
                                <ToolCard
                                    icon="description"
                                    title="Review Your Draft"
                                    description="Review your previously created drafts."
                                    onClick={() => navigate('/dashboard/drafts')}
                                    accentColor="#f59e0b"
                                />
                            </div>
                        </section>
                    )}

                    <div className={`grid grid-cols-1 ${activeCategory === 'All features' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-8 pt-8 ${activeCategory === 'All features' ? 'border-t border-slate-200 dark:border-slate-800' : ''}`}>
                        {/* PDF Tools Section */}
                        {(activeCategory === 'All features' || activeCategory === 'PDF Tools') && (
                            <section className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-2xl font-bold text-[#0d131b] dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                                        PDF Tools
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 gap-6 h-full">
                                    <ToolCard
                                        icon="book"
                                        title="PDF Tool kit"
                                        description="Merge PDFs, Rearrange pages and Convert to DOCX format."
                                        onClick={() => navigate('/dashboard/pdf-editor')}
                                        accentColor="#3b82f6"
                                        badge="5-in-1"
                                    >
                                        <div className="flex flex-col gap-4 mt-4 transition-opacity">
                                            <div className="flex justify-between items-center px-4">
                                                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-500">layers</span>
                                                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-500">content_cut</span>
                                                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-500">compress</span>
                                                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-500">description</span>
                                                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-500">approval</span>
                                            </div>
                                        </div>
                                    </ToolCard>
                                    <ToolCard
                                        icon="translate"
                                        title="Document Translator"
                                        description="Upload a PDF, DOCX, or HTML document, translate it, and download the rebuilt file."
                                        onClick={() => navigate('/dashboard/translate-document')}
                                        accentColor="#06b6d4"
                                        badge="NEW"
                                    />
                                </div>
                            </section>
                        )}
 
                        {/* Research Section */}
                        {(activeCategory === 'All features' || activeCategory === 'Research') && (
                            <section className={`flex flex-col gap-6 ${activeCategory === 'All features' ? 'lg:border-l lg:pl-8 lg:border-slate-200 lg:dark:border-slate-800 border-t lg:border-t-0 pt-8 lg:pt-0 border-slate-200 dark:border-slate-800' : ''}`}>
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-2xl font-bold text-[#0d131b] dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">search</span>
                                        Research
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <ToolCard
                                        icon="balance"
                                        title="Lex Bot"
                                        description="Do accurate legal research by talking to our AI."
                                        onClick={() => navigate('/dashboard/research')}
                                        accentColor="#8b5cf6"
                                    />
                                    <ToolCard
                                        icon="gavel"
                                        title="Case Search"
                                        description="Search Indian Kanoon database for legal cases and precedence."
                                        onClick={() => navigate('/dashboard/case-search')}
                                        accentColor="#ef4444"
                                    />
                                    <ToolCard
                                        icon="picture_as_pdf"
                                        title="Chat with PDF"
                                        description="Upload a PDF and ask questions, summarize, or analyze it."
                                        onClick={() => navigate('/dashboard/chat-pdf')}
                                        accentColor="#ec4899"
                                    />
                                    <ToolCard
                                        icon="calculate"
                                        title="Court Fee Calculator"
                                        description="Calculate Ad-Valorem Court Fees for your jurisdiction."
                                        onClick={() => setIsCourtFeeModalOpen(true)}
                                        accentColor="#f59e0b"
                                    />
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Utilities Section */}
                    {(activeCategory === 'All features' || activeCategory === 'Utilities') && (
                        <section className="flex flex-col gap-6 border-t border-slate-200 dark:border-slate-800 pt-8">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-2xl font-bold text-[#0d131b] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">construction</span>
                                    Utility Tools
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ToolCard
                                    icon="receipt_long"
                                    title="Invoice Generator"
                                    description="Create professional legal invoices for your clients and download as PDF."
                                    onClick={() => setIsInvoiceModalOpen(true)}
                                    accentColor="#10b981"
                                    badge="NEW"
                                />
                                <ToolCard
                                    icon="mic"
                                    title="Voice Dictation"
                                    description="Dictate your legal notes using voice-to-text. Supports Hindi & English."
                                    onClick={() => setIsDictationModalOpen(true)}
                                    accentColor="#f43f5e"
                                    badge="NEW"
                                />
                            </div>
                        </section>
                    )}

                    {/* How to use? Section */}
                    {activeCategory === 'How to use ?' && (
                        <section className="flex flex-col gap-6">
                            <h3 className="text-2xl font-bold text-[#0d131b] dark:text-white text-center">
                                {TUTORIAL_VIDEOS[currentVideoIndex].title}
                            </h3>
                            <div className="w-full flex items-center justify-center gap-4 py-2">
                                {/* Prev Button */}
                                <button
                                    onClick={prevVideo}
                                    className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all"
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>

                                {/* Video Player */}
                                <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative group">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={getEmbedUrl(TUTORIAL_VIDEOS[currentVideoIndex].url)}
                                        title={TUTORIAL_VIDEOS[currentVideoIndex].title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>

                                    {/* Video Counter/Indicator */}
                                    <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                        {currentVideoIndex + 1} / {TUTORIAL_VIDEOS.length}
                                    </div>
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={nextVideo}
                                    className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all"
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>

                            {/* Dot Indicators */}
                            <div className="flex justify-center gap-2">
                                {TUTORIAL_VIDEOS.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentVideoIndex(idx)}
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentVideoIndex
                                            ? 'bg-primary w-6'
                                            : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                                            }`}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </motion.div>

            {/* Hidden Input for File Upload */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept=".pdf,.docx,.doc,.rtf,.txt"
            />

            {/* Modals */}
            {isModalOpen && (
                <DraftingModal
                    onClose={() => setIsModalOpen(false)}
                    initialPrompt={initialDraftingPrompt}
                    initialEntryMode="dashboard"
                    onDraftCreated={saveDeskDraftRecord}
                />
            )}
            {isCourtFeeModalOpen && <CourtFeeModal onClose={() => setIsCourtFeeModalOpen(false)} />}
            {isInvoiceModalOpen && <InvoiceModal onClose={() => setIsInvoiceModalOpen(false)} />}
            {isDictationModalOpen && <DictationModal onClose={() => setIsDictationModalOpen(false)} />}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSkip={handleUploadSkip}
                onSubmit={handleUploadSubmit}
                fileName={uploadedFileName}
            />
        </div>
    );
};

export default Tools;

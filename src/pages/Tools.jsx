import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DraftingModal from '../components/DraftingModal';
import UploadModal from '../components/UploadModal';
import CourtFeeModal from '../components/CourtFeeModal';
import axios from 'axios';
import { API_CONFIG } from '../services/endpoints';

const ensureDocxFilename = (filename, fallback = 'Untitled Draft') => {
    const raw = String(filename || fallback).trim() || fallback;
    if (raw.toLowerCase().endsWith('.docx') || raw.toLowerCase().endsWith('.pdf')) {
        return raw;
    }
    return `${raw}.docx`;
};

const Tools = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isCourtFeeModalOpen, setIsCourtFeeModalOpen] = useState(false);
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

    // Reusable Card Component matching the new design
    const ToolCard = ({ icon, title, description, onClick, children }) => (
        <div
            onClick={onClick}
            className={`group flex flex-col gap-4 p-6 rounded-xl border shadow-sm transition-all duration-300 cursor-pointer h-full relative overflow-hidden
            bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 
            hover:bg-primary hover:border-primary hover:shadow-lg hover:shadow-blue-500/20`}
        >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors shrink-0
                bg-primary/10 text-primary 
                group-hover:bg-white/20 group-hover:text-white`}
            >
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div className="flex flex-col flex-1">
                <h4 className={`text-lg font-bold mb-2 text-[#0d131b] dark:text-white group-hover:text-white transition-colors`}>
                    {title}
                </h4>
                <p className={`text-sm leading-relaxed text-slate-600 dark:text-slate-400 group-hover:text-blue-100 transition-colors`}>
                    {description}
                </p>
                {children && <div className="flex-1 flex flex-col justify-center pt-4">{children}</div>}
            </div>
        </div>
    );

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
            <div className={`flex-1 ${activeCategory === 'How to use ?' ? 'overflow-hidden flex flex-col justify-center' : 'overflow-y-auto pb-20'}`}>
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
                                />
                                <ToolCard
                                    icon="upload_file"
                                    title="Work on Existing Document"
                                    description="Upload a `.docx` or `.pdf` file and continue in the workspace."
                                    onClick={handleUploadClick}
                                />
                                <ToolCard
                                    icon="description"
                                    title="Review Your Draft"
                                    description="Review your previously created drafts."
                                    onClick={() => navigate('/dashboard/drafts')}
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
                                    >
                                        <div className="flex flex-col gap-4 mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <div className="flex justify-between items-center px-4">
                                                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-100">layers</span>
                                                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-100">content_cut</span>
                                                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-100">compress</span>
                                                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-100">description</span>
                                                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-blue-100">approval</span>
                                            </div>
                                        </div>
                                    </ToolCard>
                                    <ToolCard
                                        icon="translate"
                                        title="Document Translator"
                                        description="Upload a PDF, DOCX, or HTML document, translate it, and download the rebuilt file."
                                        onClick={() => navigate('/dashboard/translate-document')}
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
                                    />
                                    <ToolCard
                                        icon="gavel"
                                        title="Case Search"
                                        description="Search Indian Kanoon database for legal cases and precedence."
                                        onClick={() => navigate('/dashboard/case-search')}
                                    />
                                    <ToolCard
                                        icon="picture_as_pdf"
                                        title="Chat with PDF"
                                        description="Upload a PDF and ask questions, summarize, or analyze it."
                                        onClick={() => navigate('/dashboard/chat-pdf')}
                                    />
                                    <ToolCard
                                        icon="calculate"
                                        title="Court Fee Calculator"
                                        description="Calculate Ad-Valorem Court Fees for your jurisdiction."
                                        onClick={() => setIsCourtFeeModalOpen(true)}
                                    />
                                </div>
                            </section>
                        )}
                    </div>

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
            </div>

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

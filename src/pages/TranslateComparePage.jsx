import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const getCurrentUserId = () => {
    try {
        const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        return userProfile.id || userProfile.email || localStorage.getItem('user_id') || null;
    } catch {
        return localStorage.getItem('user_id');
    }
};

// Placeholder for API call to fetch job details
// In a real app, this would be in a services file or a dedicated API hook
const fetchTranslationJobDetails = async (jobId) => {
    if (jobId === 'mock') {
        return {
            job_id: 'MOCK_123',
            id: '123',
            source_language: 'English',
            target_language: 'Hindi',
            source_file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            translated_file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        };
    }
    const userId = getCurrentUserId();
    return api.getTranslationJob(jobId, userId);
};

const TranslateComparePage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    // Split-view and UI state
    const [leftWidth, setLeftWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [synchronizedScrolling, setSynchronizedScrolling] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    // DOM Refs for panels and sync control
    const leftPanelRef = useRef(null);
    const rightPanelRef = useRef(null);
    const isSyncing = useRef(false);

    const { data: jobDetails, isLoading, isError } = useQuery({
        queryKey: ['translationJob', jobId],
        queryFn: () => fetchTranslationJobDetails(jobId),
        enabled: !!jobId,
        refetchOnWindowFocus: false
    });

    // Handlers
    const handleBack = () => navigate(-1);
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
    const handleResetZoom = () => setZoomLevel(100);

    // Draggable Divider Handlers
    const startResizing = () => setIsDragging(true);
    const stopResizing = () => setIsDragging(false);

    useEffect(() => {
        const onResize = (e) => {
            if (!isDragging) return;
            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const newLeftWidth = (clientX / window.innerWidth) * 100;
            // Constrain width between 20% and 80% for usability
            if (newLeftWidth > 20 && newLeftWidth < 80) {
                setLeftWidth(newLeftWidth);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', onResize);
            window.addEventListener('mouseup', stopResizing);
            window.addEventListener('touchmove', onResize);
            window.addEventListener('touchend', stopResizing);
            document.body.classList.add('cursor-col-resize', 'select-none');
        } else {
            window.removeEventListener('mousemove', onResize);
            window.removeEventListener('mouseup', stopResizing);
            window.removeEventListener('touchmove', onResize);
            window.removeEventListener('touchend', stopResizing);
            document.body.classList.remove('cursor-col-resize', 'select-none');
        }
        return () => {
            window.removeEventListener('mousemove', onResize);
            window.removeEventListener('mouseup', stopResizing);
            window.removeEventListener('touchmove', onResize);
            window.removeEventListener('touchend', stopResizing);
            document.body.classList.remove('cursor-col-resize', 'select-none');
        };
    }, [isDragging]);

    // Implementation of Synchronized Scrolling
    useEffect(() => {
        if (!synchronizedScrolling) return;

        const left = leftPanelRef.current;
        const right = rightPanelRef.current;
        if (!left || !right) return;

        const handleScroll = (source, target) => {
            if (isSyncing.current) {
                isSyncing.current = false;
                return;
            }
            isSyncing.current = true;
            
            const maxSource = source.scrollHeight - source.clientHeight;
            const maxTarget = target.scrollHeight - target.clientHeight;
            
            if (maxSource <= 0 || maxTarget <= 0) return;
            
            const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
            target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
        };

        const onLeftScroll = () => handleScroll(left, right);
        const onRightScroll = () => handleScroll(right, left);

        left.addEventListener('scroll', onLeftScroll);
        right.addEventListener('scroll', onRightScroll);

        return () => {
            left.removeEventListener('scroll', onLeftScroll);
            right.removeEventListener('scroll', onRightScroll);
        };
    }, [synchronizedScrolling, isLoading]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-900 text-slate-200">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-xl font-semibold tracking-wide animate-pulse">
                    Preparing comparison workspace...
                </p>
            </div>
        );
    }

    if (isError || !jobDetails) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-slate-900 text-red-400 p-6">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-3xl font-black">Retrieval Error</h1>
                    <p className="text-slate-400">The translation job data could not be loaded. It may still be processing or has been deleted.</p>
                    <button onClick={handleBack} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-900 text-slate-200">
            {/* Sticky Top Header Bar */}
            <header className="flex-shrink-0 bg-slate-800 p-4 shadow-lg flex items-center justify-between z-10">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-slate-700 transition-colors duration-200"
                        title="Back to Translations"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-semibold">Document Comparison</h1>
                    <span className="text-sm text-slate-400">Job ID: {jobDetails.job_id}</span>
                    <span className="text-sm text-slate-400">Source: {jobDetails.source_language}</span>
                    <span className="text-sm text-slate-400">Target: {jobDetails.target_language}</span>
                </div>

                <div className="flex items-center space-x-6">
                    {/* Synchronized Scrolling Toggle */}
                    <label className="flex items-center cursor-pointer">
                        <span className="mr-2 text-sm">Synchronized Scrolling</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={synchronizedScrolling}
                                onChange={() => setSynchronizedScrolling(!synchronizedScrolling)}
                            />
                            <div className="block bg-slate-600 w-10 h-6 rounded-full"></div>
                            <div
                                className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                                    synchronizedScrolling ? 'translate-x-full bg-blue-500' : ''
                                }`}
                            ></div>
                        </div>
                    </label>

                    {/* Zoom Controls */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 rounded-full hover:bg-slate-700 transition-colors duration-200"
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="text-sm">{zoomLevel}%</span>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 rounded-full hover:bg-slate-700 transition-colors duration-200"
                            title="Zoom In"
                        >
                            <ZoomIn size={16} />
                        </button>
                        <button
                            onClick={handleResetZoom}
                            className="p-2 rounded-full hover:bg-slate-700 transition-colors duration-200"
                            title="Reset Zoom"
                        >
                            <Maximize size={16} /> {/* Using Maximize for reset/fit */}
                        </button>
                    </div>
                </div>
            </header>

            {/* Dual-Pane Split Container */}
            <div className="flex-grow flex overflow-hidden relative">
                {/* Left Panel (Source Document) */}
                <div 
                    style={{ width: `${leftWidth}%` }}
                    className="h-full flex flex-col border-r border-slate-800"
                >
                    <div className="flex-shrink-0 bg-slate-800/50 p-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Original ({jobDetails.source_language})
                    </div>
                    <div ref={leftPanelRef} className="flex-grow overflow-auto p-4 bg-slate-900 scroll-smooth">
                        <iframe 
                            src={jobDetails.source_file_url} 
                            title="Source Document" 
                            className="w-full h-full border-none bg-white shadow-2xl transition-transform duration-300"
                            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                        ></iframe>
                    </div>
                </div>

                {/* Vertical Drag Bar Divider */}
                <div 
                    onMouseDown={startResizing}
                    className={`w-1.5 h-full cursor-col-resize z-20 transition-colors ${isDragging ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800 hover:bg-slate-700'}`}
                />

                {/* Right Panel (Translated Document) */}
                <div 
                    style={{ width: `${100 - leftWidth}%` }}
                    className="h-full flex flex-col"
                >
                    <div className="flex-shrink-0 bg-slate-800/50 p-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Translation ({jobDetails.target_language})
                    </div>
                    <div ref={rightPanelRef} className="flex-grow overflow-auto p-4 bg-slate-900 scroll-smooth">
                        <iframe 
                            src={jobDetails.translated_file_url} 
                            title="Translated Document" 
                            className="w-full h-full border-none bg-white shadow-2xl transition-transform duration-300"
                            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranslateComparePage;
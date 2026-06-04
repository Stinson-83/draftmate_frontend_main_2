import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // Assuming React Query is set up
import { ArrowLeft, ZoomIn, ZoomOut, Maximize } from 'lucide-react'; // Assuming lucide-react for icons

// Placeholder for API call to fetch job details
// In a real app, this would be in a services file or a dedicated API hook
const fetchTranslationJobDetails = async (jobId) => {
    // This URL should match the backend endpoint for fetching job details
    const response = await fetch(`/api/translation-jobs/${jobId}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

const TranslateComparePage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [synchronizedScrolling, setSynchronizedScrolling] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100); // Placeholder for zoom state

    const { data: jobDetails, isLoading, isError } = useQuery({
        queryKey: ['translationJob', jobId],
        queryFn: () => fetchTranslationJobDetails(jobId),
        enabled: !!jobId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-slate-900 text-slate-200">
                Loading translation job details...
            </div>
        );
    }

    if (isError || !jobDetails) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-slate-900 text-red-400">
                Error loading translation job details or job not found.
            </div>
        );
    }

    const handleBack = () => {
        navigate(-1); // Go back to the previous page
    };

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
    const handleResetZoom = () => setZoomLevel(100);

    // Implementation of Synchronized Scrolling
    React.useEffect(() => {
        if (!synchronizedScrolling) return;

        const left = leftPanelRef.current;
        const right = rightPanelRef.current;
        if (!left || !right) return;

        let isSyncing = false;

        const handleScroll = (source, target) => {
            if (isSyncing) {
                isSyncing = false;
                return;
            }
            isSyncing = true;
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
            <div className="flex-grow flex overflow-hidden">
                {/* Left Panel (Source Document) */}
                <div className="w-1/2 h-full border-r border-slate-700 flex flex-col">
                    <div className="flex-shrink-0 bg-slate-700 p-2 text-center text-sm font-medium">Source Document ({jobDetails.source_language})</div>
                    <div className="flex-grow overflow-auto p-4 bg-slate-900">
                        <iframe src={jobDetails.source_file_url} title="Source Document" className="w-full h-full border-none bg-white"></iframe>
                    </div>
                </div>

                {/* Right Panel (Translated Document) */}
                <div className="w-1/2 h-full flex flex-col">
                    <div className="flex-shrink-0 bg-slate-700 p-2 text-center text-sm font-medium">Translated Document ({jobDetails.target_language})</div>
                    <div className="flex-grow overflow-auto p-4 bg-slate-900">
                        <iframe src={jobDetails.translated_file_url} title="Translated Document" className="w-full h-full border-none bg-white"></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranslateComparePage;
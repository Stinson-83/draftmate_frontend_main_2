import React, { useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../services/endpoints';
import { toast } from 'sonner';

const CaseSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // New states for document viewing
    const [docHistory, setDocHistory] = useState([]);
    const selectedDoc = docHistory.length > 0 ? docHistory[docHistory.length - 1] : null;
    const [isDocLoading, setIsDocLoading] = useState(false);

    const handleViewDoc = async (docId, title, isNewChain = false) => {
        setIsDocLoading(true);
        if (isNewChain) {
            setDocHistory([]);
        }
        try {
            const url = `${API_CONFIG.CASE_SEARCH.BASE_URL}${API_CONFIG.CASE_SEARCH.ENDPOINTS.DOC(docId)}`;
            const response = await axios.get(url);
            setDocHistory(prev => isNewChain ? [{ ...response.data, originalTitle: title, docId }] : [...prev, { ...response.data, originalTitle: title, docId }]);
        } catch (error) {
            console.error('Failed to fetch document:', error);
            toast.error("Failed to load the full document.");
        } finally {
            setIsDocLoading(false);
        }
    };

    const handleBack = () => {
        setDocHistory(prev => prev.slice(0, -1));
    };

    const handleCloseModal = () => {
        setDocHistory([]);
        setIsDocLoading(false);
    };

    const handleDocumentClick = (e) => {
        // Find if an anchor was clicked
        const anchor = e.target.closest('a');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href) return;

        // If it's a Kanoon relative link like /doc/123/
        if (href.startsWith('/doc/')) {
            e.preventDefault();
            // Extract doc ID
            const match = href.match(/\/doc\/(\d+)\//);
            if (match && match[1]) {
                const docId = match[1];
                handleViewDoc(docId, anchor.innerText || "Citation", false);
            } else {
                window.open(`https://indiankanoon.org${href}`, '_blank');
            }
        }
        // If it's an internal anchor like #p_1, handle scroll
        else if (href.startsWith('#')) {
            e.preventDefault();
            // Find within the modal wrapper class to avoid scrolling the main page
            const target = document.querySelector(`.document-content [name="${href.substring(1)}"]`) ||
                document.querySelector(`.document-content [id="${href.substring(1)}"]`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        // Force external links to open in a new tab smoothly
        else {
            e.preventDefault();
            window.open(anchor.href, '_blank', 'noopener,noreferrer');
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setResults(null);

        try {
            const url = `${API_CONFIG.CASE_SEARCH.BASE_URL}${API_CONFIG.CASE_SEARCH.ENDPOINTS.SEARCH}`;
            const response = await axios.get(url, {
                params: {
                    q: query,
                    pagenum: 0,
                    maxpages: 1
                }
            });

            if (response.data && response.data.docs) {
                setResults(response.data);
            } else {
                toast.error("No results found or an error occurred.");
            }
        } catch (error) {
            console.error('Case search failed:', error);
            toast.error("Failed to connect to the Kanoon API. Ensure the backend service is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-slate-100 font-display">
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-3xl">gavel</span>
                            Case Search
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Search for legal cases and precedence.
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-10 flex gap-3">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-primary text-xl">search</span>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg transition-shadow shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
                            placeholder="Enter case name, topic, or keywords..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="px-8 py-4 bg-primary text-white font-semibold rounded-xl shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <span className="material-symbols-outlined">search</span>
                        )}
                        Search
                    </button>
                </form>

                {/* Results Section */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center p-16">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Searching legal database...</p>
                    </div>
                )}

                {!isLoading && results && results.docs && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                            Found {results.docs.length} Results
                            {results.found && <span className="text-sm font-normal text-slate-500 ml-2">(Total {results.found} matches)</span>}
                        </h3>

                        {results.docs.map((doc, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-xl font-bold text-primary dark:text-blue-400">
                                        <button onClick={(e) => { e.preventDefault(); handleViewDoc(doc.tid, doc.title, true); }} className="hover:underline text-left">
                                            {doc.title}
                                        </button>
                                    </h4>
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full shrink-0">
                                        Cites: {doc.numcites} | Cited By: {doc.numcitedby}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">account_balance</span>
                                        {doc.docsource || 'Unknown Court'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                        {doc.publishdate || 'Unknown Date'}
                                    </span>
                                </div>

                                <p
                                    className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-3"
                                    dangerouslySetInnerHTML={{ __html: doc.headline }}
                                />

                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                    <button
                                        onClick={() => handleViewDoc(doc.tid, doc.title, true)}
                                        className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                    >
                                        Read Full Document
                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Document Viewer Modal */}
            {(isDocLoading || selectedDoc) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-12">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-full flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden relative overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {docHistory.length > 1 && (
                                    <button
                                        onClick={handleBack}
                                        className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300 shrink-0 flex items-center justify-center"
                                        title="Go Back"
                                    >
                                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                                    </button>
                                )}
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate pr-4">
                                    {isDocLoading ? "Loading Document..." : (selectedDoc?.originalTitle || "Document Viewer")}
                                </h3>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300 shrink-0"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 document-content bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                            {isDocLoading ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Fetching document from database...</p>
                                </div>
                            ) : selectedDoc ? (
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    {/* Inline styling to ensure the raw HTML renders reasonably nicely */}
                                    <style>{`
                                        .document-content blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #4b5563; font-style: italic; }
                                        .dark .document-content blockquote { color: #9ca3af; }
                                        .document-content a { color: #2563eb; text-decoration: none; }
                                        .document-content a:hover { text-decoration: underline; }
                                        .document-content .hidden_text { display: none; }
                                    `}</style>
                                    <div onClick={handleDocumentClick} dangerouslySetInnerHTML={{ __html: selectedDoc.doc }} />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseSearch;

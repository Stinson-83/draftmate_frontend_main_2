import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MyDrafts = () => {
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('date'); // 'date' | 'alpha'

    useEffect(() => {
        // Load drafts from localStorage
        const savedDrafts = JSON.parse(localStorage.getItem('my_drafts') || '[]');
        setDrafts(savedDrafts);
    }, []);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this draft?')) {
            const updatedDrafts = drafts.filter(draft => draft.id !== id);
            setDrafts(updatedDrafts);
            localStorage.setItem('my_drafts', JSON.stringify(updatedDrafts));
        }
    };

    const handleOpenDraft = (draft) => {
        navigate('/dashboard/editor', {
            state: {
                htmlContent: draft.content,
                placeholders: draft.placeholders || [],
                uploadDetails: `Draft: ${draft.name}`,
                isEmpty: false,
                isSavedDraft: true,
                id: draft.id
            }
        });
    };

    const filteredDrafts = drafts.filter(draft =>
        (draft.name || 'Untitled Draft').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedDrafts = [...filteredDrafts].sort((a, b) => {
        if (sortOrder === 'date') {
            return new Date(b.lastModified) - new Date(a.lastModified);
        } else {
            return (a.name || 'Untitled Draft').localeCompare(b.name || 'Untitled Draft');
        }
    });

    // Helper to get random progress for visualization (consistent based on ID char code)
    const getProgress = (id) => {
        if (!id) return 20;
        const charCode = id.toString().charCodeAt(0) || 0;
        return (charCode % 8) * 10 + 20; // Random-ish between 20 and 90
    };

    const getStatusText = (progress) => {
        if (progress < 30) return "Drafting started";
        if (progress < 60) return "In progress";
        if (progress < 90) return "Review pending";
        return "Almost complete";
    };

    const getProgressColor = (progress) => {
        if (progress < 30) return "bg-gray-300 dark:bg-gray-500";
        if (progress < 60) return "bg-yellow-400";
        if (progress < 90) return "bg-blue-400";
        return "bg-green-500";
    };


    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-slate-100 font-display">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Drafts</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and edit your ongoing legal documents.</p>
                    </div>
                    <div className="relative w-full md:w-80 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-primary text-xl">search</span>
                        </div>
                        <input
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
                            placeholder="Search drafts..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                    <button className="shrink-0 px-4 py-2 bg-primary text-white text-sm font-medium rounded-full shadow-sm hover:bg-primary/90 transition-colors">All Drafts</button>
                    <button className="shrink-0 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Recent</button>
                    <div className="flex-grow"></div>
                    <button
                        onClick={() => setSortOrder(prev => prev === 'date' ? 'alpha' : 'date')}
                        className="hidden sm:flex items-center space-x-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">sort</span>
                        <span>{sortOrder === 'date' ? 'Sort by Date' : 'Sort A-Z'}</span>
                    </button>
                </div>

                {/* Empty State */}
                {sortedDrafts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-full mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500">description</span>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No drafts found</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                            {searchTerm ? `No drafts matching "${searchTerm}"` : "Documents you save while drafting will appear here."}
                        </p>
                    </div>
                ) : (
                    /* Grid Layout */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sortedDrafts.map((draft) => {
                            const progress = getProgress(draft.id);
                            return (
                                <div
                                    key={draft.id}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
                                >
                                    {/* Accent Bar */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    {/* Card Content */}
                                    <div className="p-5 flex-1 cursor-pointer" onClick={() => handleOpenDraft(draft)}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">article</span>
                                            </div>
                                            <div className="relative z-10">
                                                <button
                                                    onClick={(e) => handleDelete(draft.id, e)}
                                                    className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Delete Draft"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete_outline</span>
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors truncate">
                                            {draft.name || 'Untitled Draft'}
                                        </h3>

                                        <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 mb-4">
                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                            Last edited: {new Date(draft.lastModified).toLocaleDateString()}
                                        </p>

                                        {/* Fake Progress */}
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-2">
                                            <div
                                                className={`h-1.5 rounded-full ${getProgressColor(progress)}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{getStatusText(progress)}</p>
                                    </div>

                                    {/* Footer Button */}
                                    <div className="p-5 pt-0 mt-auto">
                                        <button
                                            onClick={() => handleOpenDraft(draft)}
                                            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                        >
                                            <span className="material-symbols-outlined text-base">edit_note</span>
                                            <span>Open Editor</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyDrafts;

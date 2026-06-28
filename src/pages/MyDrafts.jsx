import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_CONFIG } from '../services/endpoints';
import DateTimelineModal from '../components/DateTimelineModal';

const MyDrafts = () => {
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null); // null means root
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('date'); // 'date' | 'alpha'
    const [showTimeline, setShowTimeline] = useState(false);

    // Folder modal state
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [editingFolderId, setEditingFolderId] = useState(null);
    const [folderNameInput, setFolderNameInput] = useState('');
    const [isDraggingOverId, setIsDraggingOverId] = useState(null);

    const fetchDraftsAndFolders = async () => {
        try {
            const token = localStorage.getItem('session_id');
            const response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/list`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (response.ok) {
                const data = await response.json();
                setDrafts(data.drafts || []);
                setFolders(data.folders || []);
            } else {
                toast.error("Failed to load drafts from database.");
            }
        } catch (error) {
            console.error("Error fetching drafts:", error);
            toast.error("Error connecting to drafts service.");
        }
    };

    useEffect(() => {
        fetchDraftsAndFolders();
    }, []);

    const handleDeleteDraft = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this draft?')) {
            try {
                const token = localStorage.getItem('session_id');
                const response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ id }),
                });
                if (response.ok) {
                    setDrafts(prev => prev.filter(draft => draft.id !== id));
                    toast.success("Draft deleted successfully.");
                } else {
                    toast.error("Failed to delete draft.");
                }
            } catch (error) {
                console.error("Error deleting draft:", error);
                toast.error("Failed to delete draft.");
            }
        }
    };

    const handleOpenDraft = (draft) => {
        navigate('/dashboard/workspace', {
            state: {
                draftId: draft.id,
                id: draft.id,
                filename: draft.filename || draft.name,
                documentKey: draft.documentKey || draft.id,
                variablesDetected: draft.variablesDetected || [],
                onlyofficeConfig: draft.onlyofficeConfig || null,
            }
        });
    };

    // --- Folder Actions ---
    const openFolderModal = (folder = null) => {
        if (folder) {
            setEditingFolderId(folder.id);
            setFolderNameInput(folder.name);
        } else {
            setEditingFolderId(null);
            setFolderNameInput('');
        }
        setIsFolderModalOpen(true);
    };

    const handleSaveFolder = async () => {
        if (!folderNameInput.trim()) return;

        const token = localStorage.getItem('session_id');
        try {
            if (editingFolderId) {
                const response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/folder/rename`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ id: editingFolderId, name: folderNameInput.trim() }),
                });
                if (response.ok) {
                    setFolders(prev => prev.map(f => f.id === editingFolderId ? { ...f, name: folderNameInput.trim() } : f));
                    toast.success("Folder renamed successfully.");
                } else {
                    toast.error("Failed to rename folder.");
                }
            } else {
                const newFolderId = 'folder_' + Date.now();
                const response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/folder/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ id: newFolderId, name: folderNameInput.trim() }),
                });
                if (response.ok) {
                    setFolders(prev => [...prev, { id: newFolderId, name: folderNameInput.trim(), createdAt: new Date().toISOString() }]);
                    toast.success("Folder created successfully.");
                } else {
                    toast.error("Failed to create folder.");
                }
            }
        } catch (error) {
            console.error("Error saving folder:", error);
            toast.error("Error saving folder.");
        }
        setIsFolderModalOpen(false);
        setFolderNameInput('');
    };

    const handleDeleteFolder = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this folder? All drafts inside will be moved to root.')) {
            try {
                const token = localStorage.getItem('session_id');
                const response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/folder/delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ id }),
                });
                if (response.ok) {
                    setFolders(prev => prev.filter(f => f.id !== id));
                    setDrafts(prev => prev.map(d => d.folderId === id ? { ...d, folderId: null } : d));
                    if (currentFolder === id) {
                        setCurrentFolder(null);
                    }
                    toast.success("Folder deleted successfully.");
                } else {
                    toast.error("Failed to delete folder.");
                }
            } catch (error) {
                console.error("Error deleting folder:", error);
                toast.error("Failed to delete folder.");
            }
        }
    };

    // --- Drag and Drop ---
    const handleDragStart = (e, draftId) => {
        e.dataTransfer.setData('draftId', draftId);
    };

    const handleDragOver = (e, targetFolderId) => {
        e.preventDefault(); // allow drop
        setIsDraggingOverId(targetFolderId);
    };

    const handleDragLeave = (e) => {
        setIsDraggingOverId(null);
    };

    const handleDrop = async (e, targetFolderId) => {
        e.preventDefault();
        setIsDraggingOverId(null);

        const draftId = e.dataTransfer.getData('draftId');
        if (!draftId) return;

        const existingDraft = drafts.find(d => String(d.id) === String(draftId));
        if (existingDraft && existingDraft.folderId === targetFolderId) return;

        try {
            const token = localStorage.getItem('session_id');
            const response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id: draftId, folder_id: targetFolderId || "null" }),
            });
            if (response.ok) {
                setDrafts(prev => prev.map(d => String(d.id) === String(draftId) ? { ...d, folderId: targetFolderId } : d));
                toast.success("Draft moved successfully.");
            } else {
                toast.error("Failed to move draft.");
            }
        } catch (error) {
            console.error("Error moving draft:", error);
            toast.error("Failed to move draft.");
        }
    };

    // --- Rendering Helpers ---
    const currentFolderName = currentFolder
        ? folders.find(f => f.id === currentFolder)?.name
        : null;

    const displayedDrafts = drafts.filter(draft =>
        (draft.name || 'Untitled Draft').toLowerCase().includes(searchTerm.toLowerCase()) &&
        draft.folderId === currentFolder
    );

    const displayedFolders = currentFolder === null
        ? folders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    const sortedDrafts = [...displayedDrafts].sort((a, b) => {
        if (sortOrder === 'date') {
            return new Date(b.lastModified) - new Date(a.lastModified);
        } else {
            return (a.name || 'Untitled Draft').localeCompare(b.name || 'Untitled Draft');
        }
    });

    const getStatusColor = (s) => {
        if (s === 'Started') return 'bg-gray-400';
        if (s === 'In progress') return 'bg-yellow-400';
        if (s === 'Review') return 'bg-red-500';
        if (s === 'Completed') return 'bg-green-500';
        return 'bg-yellow-400';
    };

    const getStatusLabel = (s) => {
        if (s === 'In progress') return 'In Progress';
        if (s === 'Review') return 'Work under Review';
        if (s === 'Completed') return 'Draft Completed';
        return s || 'In Progress';
    };

    const getProgress = (status) => {
        if (status === 'Started') return 10;
        if (status === 'In progress') return 45;
        if (status === 'Review') return 80;
        if (status === 'Completed') return 100;
        return 45;
    };


    return (
        <>
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-slate-100 font-display">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Drafts</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and edit your ongoing legal documents.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-80 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-primary text-xl">search</span>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
                                placeholder="Search drafts or folders..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => openFolderModal()}
                            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">create_new_folder</span>
                            <span className="hidden sm:inline">New Folder</span>
                        </button>
                    </div>
                </div>

                {/* Filters & Breadcrumb */}
                <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                    {currentFolder ? (
                        <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${isDraggingOverId === null
                                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                                : 'bg-primary/20 border border-primary border-dashed'
                                }`}
                            onClick={() => setCurrentFolder(null)}
                            onDragOver={(e) => handleDragOver(e, null)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, null)}
                        >
                            <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">arrow_back</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">Back to My Drafts</span>
                        </div>
                    ) : (
                        <button className="shrink-0 px-4 py-2 bg-primary text-white text-sm font-medium rounded-full shadow-sm hover:bg-primary/90 transition-colors">
                            All Items
                        </button>
                    )}

                    <div className="flex-grow">
                        {currentFolder && (
                            <div className="px-4 text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">folder</span>
                                <span className="text-slate-900 dark:text-white">{currentFolderName}</span>
                            </div>
                        )}
                    </div>

                    {currentFolder && (
                        <button
                            onClick={() => setShowTimeline(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 rounded-lg transition-colors"
                            title="View date timeline for all drafts in this folder"
                        >
                            <span className="material-symbols-outlined text-base">timeline</span>
                            <span>Date Timeline</span>
                        </button>
                    )}
                    <button
                        onClick={() => setSortOrder(prev => prev === 'date' ? 'alpha' : 'date')}
                        className="hidden sm:flex items-center space-x-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">sort</span>
                        <span>{sortOrder === 'date' ? 'Sort by Date' : 'Sort A-Z'}</span>
                    </button>
                </div>

                {/* Empty State */}
                {sortedDrafts.length === 0 && displayedFolders.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center transition-colors"
                    >
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-full mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500">
                                {currentFolder ? "folder_open" : "description"}
                            </span>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                            {currentFolder ? "This folder is empty" : "No drafts or folders found"}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                            {searchTerm
                                ? `No items matching "${searchTerm}"`
                                : currentFolder
                                    ? "Drag and drop drafts here, or create a new one."
                                    : "Documents you save while drafting will appear here."}
                        </p>
                    </div>
                ) : (
                    /* Grid Layout */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                        {/* Folders List */}
                        {displayedFolders.map((folder) => (
                            <div
                                key={folder.id}
                                onClick={() => setCurrentFolder(folder.id)}
                                onDragOver={(e) => handleDragOver(e, folder.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, folder.id)}
                                className={`bg-white dark:bg-slate-800 rounded-xl border-2 transition-all duration-300 group flex flex-col h-full cursor-pointer relative overflow-hidden ${isDraggingOverId === folder.id
                                    ? 'border-primary border-dashed bg-primary/5 dark:bg-primary/10 scale-[1.02]'
                                    : 'border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className="p-5 flex-1 flex flex-col justify-center items-center text-center">
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openFolderModal(folder); }}
                                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            title="Rename Folder"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Delete Folder"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>

                                    <div className={`p-4 rounded-full mb-3 ${isDraggingOverId === folder.id ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-4xl">folder</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate w-full">
                                        {folder.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {drafts.filter(d => d.folderId === folder.id).length} drafts
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Drafts List */}
                        {sortedDrafts.map((draft) => {
                            const status = draft.status || 'In progress';
                            const progress = getProgress(status);

                            return (
                                <div
                                    key={draft.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, draft.id)}
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group flex flex-col h-full relative overflow-hidden cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-600"
                                >
                                    {/* Accent Bar */}
                                    <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(status).replace('bg-', 'bg-')} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                    {/* Card Content */}
                                    <div className="p-5 flex-1" onClick={() => handleOpenDraft(draft)}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">article</span>
                                            </div>
                                            <div className="relative z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="text-slate-400 cursor-grab active:cursor-grabbing" title="Drag to move">
                                                    <span className="material-symbols-outlined text-lg">drag_indicator</span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteDraft(draft.id, e)}
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

                                        {/* Status Bar */}
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-2">
                                            <div
                                                className={`h-1.5 rounded-full ${getStatusColor(status)}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                         <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{getStatusLabel(status)}</p>
                                    </div>
                                    {/* Footer Button */}
                                    <div className="p-5 pt-0 mt-auto">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenDraft(draft); }}
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

            {/* Folder Modal */}
            {isFolderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingFolderId ? 'Rename Folder' : 'Create New Folder'}
                            </h3>
                            <button
                                onClick={() => setIsFolderModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Folder Name
                            </label>
                            <input
                                type="text"
                                autoFocus
                                value={folderNameInput}
                                onChange={(e) => setFolderNameInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFolder(); }}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="e.g. Smith vs. Jones Case"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsFolderModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveFolder}
                                disabled={!folderNameInput.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                            >
                                {editingFolderId ? 'Save Changes' : 'Create Folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

            {/* Date Timeline Modal */}
            {showTimeline && currentFolder && (
                <DateTimelineModal
                    folderId={currentFolder}
                    folderName={currentFolderName || 'Folder'}
                    drafts={drafts.filter(d => d.folderId === currentFolder)}
                    onClose={() => setShowTimeline(false)}
                />
            )}
        </>
    );
};

export default MyDrafts;

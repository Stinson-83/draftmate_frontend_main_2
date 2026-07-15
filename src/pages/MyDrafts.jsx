import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_CONFIG } from '../services/endpoints';
import DateTimelineModal from '../components/DateTimelineModal';

const MyDrafts = () => {
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('date');
    const [showTimeline, setShowTimeline] = useState(false);

    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [editingFolderId, setEditingFolderId] = useState(null);
    const [folderNameInput, setFolderNameInput] = useState('');
    const [isDraggingOverId, setIsDraggingOverId] = useState(null);

    const fetchDraftsAndFolders = async () => {
        try {
            const token = localStorage.getItem('session_id');
            const response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/list`, {
                headers: { Authorization: `Bearer ${token}` }
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
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ id }),
                });
                if (response.ok) {
                    setFolders(prev => prev.filter(f => f.id !== id));
                    setDrafts(prev => prev.map(d => d.folderId === id ? { ...d, folderId: null } : d));
                    if (currentFolder === id) setCurrentFolder(null);
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

    const handleDragStart = (e, draftId) => {
        e.dataTransfer.setData('draftId', draftId);
    };

    const handleDragOver = (e, targetFolderId) => {
        e.preventDefault();
        setIsDraggingOverId(targetFolderId);
    };

    const handleDragLeave = () => {
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
            {/* ===== PREMIUM ANIMATIONS ===== */}
            <style>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes cardEntrance {
                    from {
                        opacity: 0;
                        transform: translateY(24px) scale(0.94);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes folderWiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-3deg); }
                    75% { transform: rotate(3deg); }
                }
                @keyframes progressFill {
                    from { width: 0%; }
                    to { width: var(--target-width); }
                }
                @keyframes progressShine {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes iconBounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
                @keyframes emptyStatePulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                @keyframes modalPopIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.94); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes overlayFade {
                    from { opacity: 0; backdrop-filter: blur(0px); }
                    to { opacity: 1; backdrop-filter: blur(6px); }
                }
                @keyframes searchGlow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
                    50% { box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
                }
                @keyframes shimmerLoad {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes dragPulse {
                    0%, 100% { transform: scale(1.02); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
                    50% { transform: scale(1.04); box-shadow: 0 0 0 8px rgba(79, 70, 229, 0); }
                }
                @keyframes checkmarkDraw {
                    from { stroke-dashoffset: 100; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes floatUp {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }

                /* Page entrance */
                .header-anim { animation: fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .filters-anim { animation: fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }

                /* Cards - staggered */
                .card-anim {
                    animation: cardEntrance 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .card-anim:nth-child(1) { animation-delay: 0.05s; }
                .card-anim:nth-child(2) { animation-delay: 0.10s; }
                .card-anim:nth-child(3) { animation-delay: 0.15s; }
                .card-anim:nth-child(4) { animation-delay: 0.20s; }
                .card-anim:nth-child(5) { animation-delay: 0.25s; }
                .card-anim:nth-child(6) { animation-delay: 0.30s; }
                .card-anim:nth-child(7) { animation-delay: 0.35s; }
                .card-anim:nth-child(8) { animation-delay: 0.40s; }
                .card-anim:nth-child(9) { animation-delay: 0.45s; }
                .card-anim:nth-child(10) { animation-delay: 0.50s; }
                .card-anim:nth-child(n+11) { animation-delay: 0.55s; }

                .card-lift {
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .card-lift:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1), 0 4px 8px rgba(15, 23, 42, 0.04);
                }

                /* Folder card hover animation */
                .folder-card:hover .folder-icon-wrap {
                    animation: folderWiggle 0.5s ease-in-out;
                }
                .folder-icon-wrap {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    display: inline-flex;
                }
                .folder-card:hover .folder-icon-wrap {
                    transform: scale(1.1);
                }

                /* Draft card icon float */
                .card-lift:hover .draft-icon-wrap {
                    animation: floatUp 1.5s ease-in-out infinite;
                }
                .draft-icon-wrap {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                /* Progress bar shimmer */
                .progress-bar-anim {
                    background: linear-gradient(90deg,
                        currentColor 0%,
                        rgba(255,255,255,0.4) 50%,
                        currentColor 100%);
                    background-size: 200% 100%;
                    animation: progressShine 2.5s ease-in-out infinite;
                    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                /* Button interactions */
                .btn-lift {
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .btn-lift:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);
                }
                .btn-lift:active:not(:disabled) {
                    transform: translateY(0) scale(0.97);
                }

                .btn-scale {
                    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .btn-scale:hover:not(:disabled) { transform: scale(1.08); }
                .btn-scale:active:not(:disabled) { transform: scale(0.94); }

                /* Icon button spin on hover */
                .icon-spin-hover {
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .icon-spin-hover:hover {
                    transform: rotate(90deg);
                }

                /* Search bar focus glow */
                .search-input:focus-within {
                    animation: searchGlow 2s ease-in-out infinite;
                }
                .search-input {
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .search-input:focus-within {
                    transform: translateY(-1px);
                }

                /* Empty state */
                .empty-state-anim {
                    animation: cardEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                .empty-icon-pulse {
                    animation: emptyStatePulse 3s ease-in-out infinite;
                }

                /* Modal */
                .modal-overlay-anim { animation: overlayFade 0.25s ease-out both; }
                .modal-anim { animation: modalPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

                /* Drag over state */
                .drag-over-anim {
                    animation: dragPulse 1.2s ease-in-out infinite;
                }

                /* Delete button - red pulse on hover */
                .delete-btn-anim {
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .delete-btn-anim:hover {
                    transform: scale(1.15);
                    background: rgba(239, 68, 68, 0.12) !important;
                }

                /* Edit button */
                .edit-btn-anim {
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .edit-btn-anim:hover {
                    transform: scale(1.15) rotate(-8deg);
                    background: rgba(59, 130, 246, 0.12) !important;
                }

                /* Timeline button glow */
                .timeline-btn-anim {
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    overflow: hidden;
                }
                .timeline-btn-anim::before {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%;
                    width: 100%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent);
                    transition: left 0.6s ease;
                }
                .timeline-btn-anim:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
                }
                .timeline-btn-anim:hover::before {
                    left: 100%;
                }

                /* Sort button rotate */
                .sort-btn-anim {
                    transition: all 0.2s ease;
                }
                .sort-btn-anim:hover .sort-icon {
                    transform: rotate(180deg);
                }
                .sort-icon {
                    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    display: inline-block;
                }

                /* Breadcrumb back button */
                .back-btn-anim {
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .back-btn-anim:hover .back-icon {
                    transform: translateX(-3px);
                }
                .back-icon {
                    transition: transform 0.2s ease;
                    display: inline-block;
                }

                /* Open Editor button reveal */
                .open-editor-btn {
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    overflow: hidden;
                }
                .open-editor-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.08), transparent);
                    transform: translateX(-100%);
                    transition: transform 0.5s ease;
                }
                .open-editor-btn:hover::after {
                    transform: translateX(100%);
                }
                .open-editor-btn:hover {
                    border-color: #4f46e5 !important;
                    color: #4f46e5 !important;
                }

                /* Status dot pulse */
                .status-dot-live {
                    position: relative;
                }
                .status-dot-live::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: inherit;
                    animation: emptyStatePulse 1.8s ease-in-out infinite;
                    opacity: 0.5;
                }

                /* All items pill glow */
                .pill-glow {
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .pill-glow:hover {
                    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
                    transform: translateY(-2px);
                }

                /* Hide scrollbar helper */
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                /* Draggable card - grabbing state */
                .draggable-card:active {
                    cursor: grabbing !important;
                    transform: scale(0.98) rotate(-1deg);
                    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15) !important;
                }
            `}</style>

            <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-slate-100 font-display">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Section */}
                    <div className="header-anim flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Drafts</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and edit your ongoing legal documents.</p>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="search-input relative w-full md:w-80 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-primary text-xl transition-colors">search</span>
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
                                    placeholder="Search drafts or folders..."
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => openFolderModal()}
                                className="btn-lift shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">create_new_folder</span>
                                <span className="hidden sm:inline">New Folder</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters & Breadcrumb */}
                    <div className="filters-anim flex items-center space-x-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                        {currentFolder ? (
                            <div
                                className={`back-btn-anim flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${isDraggingOverId === null
                                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    : 'drag-over-anim bg-primary/20 border border-primary border-dashed'
                                    }`}
                                onClick={() => setCurrentFolder(null)}
                                onDragOver={(e) => handleDragOver(e, null)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, null)}
                            >
                                <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300 back-icon">arrow_back</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">Back to My Drafts</span>
                            </div>
                        ) : (
                            <button className="pill-glow shrink-0 px-4 py-2 bg-primary text-white text-sm font-medium rounded-full">
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
                                className="timeline-btn-anim flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 rounded-lg"
                                title="View date timeline for all drafts in this folder"
                            >
                                <span className="material-symbols-outlined text-base">timeline</span>
                                <span>Date Timeline</span>
                            </button>
                        )}
                        <button
                            onClick={() => setSortOrder(prev => prev === 'date' ? 'alpha' : 'date')}
                            className="sort-btn-anim hidden sm:flex items-center space-x-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-lg sort-icon">sort</span>
                            <span>{sortOrder === 'date' ? 'Sort by Date' : 'Sort A-Z'}</span>
                        </button>
                    </div>

                    {/* Empty State */}
                    {sortedDrafts.length === 0 && displayedFolders.length === 0 ? (
                        <div className="empty-state-anim flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                            <div className="empty-icon-pulse p-4 bg-slate-50 dark:bg-slate-700/50 rounded-full mb-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                            {/* Folders List */}
                            {displayedFolders.map((folder) => (
                                <div
                                    key={folder.id}
                                    onClick={() => setCurrentFolder(folder.id)}
                                    onDragOver={(e) => handleDragOver(e, folder.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, folder.id)}
                                    className={`card-anim card-lift folder-card bg-white dark:bg-slate-800 rounded-xl border-2 group flex flex-col h-full cursor-pointer relative overflow-hidden ${isDraggingOverId === folder.id
                                        ? 'drag-over-anim border-primary border-dashed bg-primary/5 dark:bg-primary/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <div className="p-5 flex-1 flex flex-col justify-center items-center text-center">
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openFolderModal(folder); }}
                                                className="edit-btn-anim text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                title="Rename Folder"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteFolder(folder.id, e)}
                                                className="delete-btn-anim text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title="Delete Folder"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>

                                        <div className={`folder-icon-wrap p-4 rounded-full mb-3 ${isDraggingOverId === folder.id ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
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
                                        className="card-anim card-lift draggable-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group flex flex-col h-full relative overflow-hidden cursor-grab hover:border-slate-300 dark:hover:border-slate-600"
                                    >
                                        {/* Accent Bar */}
                                        <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(status)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                                        {/* Card Content */}
                                        <div className="p-5 flex-1" onClick={() => handleOpenDraft(draft)}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="draft-icon-wrap p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">article</span>
                                                </div>
                                                <div className="relative z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div className="text-slate-400 cursor-grab active:cursor-grabbing" title="Drag to move">
                                                        <span className="material-symbols-outlined text-lg">drag_indicator</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                                                        className="delete-btn-anim text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
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
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-2 overflow-hidden">
                                                <div
                                                    className={`h-1.5 rounded-full progress-bar-anim ${getStatusColor(status)}`}
                                                    style={{
                                                        width: `${progress}%`,
                                                        '--target-width': `${progress}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`status-dot-live inline-block w-2 h-2 rounded-full ${getStatusColor(status)}`}></span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{getStatusLabel(status)}</p>
                                            </div>
                                        </div>
                                        {/* Footer Button */}
                                        <div className="p-5 pt-0 mt-auto">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenDraft(draft); }}
                                                className="open-editor-btn w-full flex items-center justify-center space-x-2 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900"
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
                    <div className="modal-overlay-anim fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="modal-anim bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {editingFolderId ? 'Rename Folder' : 'Create New Folder'}
                                </h3>
                                <button
                                    onClick={() => setIsFolderModalOpen(false)}
                                    className="icon-spin-hover text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    placeholder="e.g. Smith vs. Jones Case"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsFolderModalOpen(false)}
                                    className="btn-lift px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveFolder}
                                    disabled={!folderNameInput.trim()}
                                    className="btn-lift px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm"
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
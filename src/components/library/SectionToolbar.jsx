import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { bookmarkService } from '../../services/library/bookmarkService';

const SectionToolbar = ({ act, chapter, section, onAddNote, onAIExplain }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    checkBookmarkStatus();
  }, [act.id, section.number]);

  const checkBookmarkStatus = async () => {
    const existing = await bookmarkService.isBookmarked(act.id, section.number);
    if (existing) {
      setIsBookmarked(true);
      setBookmarkId(existing.id);
    } else {
      setIsBookmarked(false);
      setBookmarkId(null);
    }
  };

  const fetchFolders = async () => {
    const f = await bookmarkService.getFolders();
    setFolders(f);
    if (f.length > 0) setSelectedFolder(f[0].id);
  };

  const handleBookmarkClick = async () => {
    if (isBookmarked) {
      // Remove bookmark
      await bookmarkService.removeBookmark(bookmarkId);
      setIsBookmarked(false);
      setBookmarkId(null);
      toast.success('Bookmark removed');
    } else {
      // Show save modal
      await fetchFolders();
      setShowFolderModal(true);
    }
  };

  const handleSaveBookmark = async () => {
    try {
      const b = await bookmarkService.addBookmark({
        actId: act.id,
        actName: act.name,
        actShortName: act.shortName,
        chapterId: chapter?.id,
        chapterTitle: chapter?.title,
        sectionNumber: section.number,
        sectionTitle: section.title,
        folderId: selectedFolder
      });
      setIsBookmarked(true);
      setBookmarkId(b.id);
      setShowFolderModal(false);
      toast.success('Section bookmarked successfully');
    } catch (error) {
      toast.error('Failed to save bookmark');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const newFolder = await bookmarkService.addFolder(newFolderName.trim());
      await fetchFolders();
      setSelectedFolder(newFolder.id);
      setIsCreatingFolder(false);
      setNewFolderName('');
      toast.success('Folder created');
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const handleCopy = () => {
    const textToCopy = `Section ${section.number} - ${section.title}\n\n${section.content}\n\n(Source: ${act.name})`;
    navigator.clipboard.writeText(textToCopy);
    toast.success('Section copied to clipboard');
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={handleBookmarkClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isBookmarked ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
        >
          <span className={`material-symbols-outlined text-[18px] ${isBookmarked ? 'icon-fill' : ''}`}>bookmark</span>
          {isBookmarked ? 'Saved' : 'Bookmark'}
        </button>
        <button 
          onClick={onAddNote}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
          Add Note
        </button>
        <button 
          onClick={onAIExplain}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors ml-auto"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          AI Explain
        </button>
        <button 
          onClick={handleCopy}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          title="Copy Section"
        >
          <span className="material-symbols-outlined text-[18px]">content_copy</span>
        </button>
        <button 
          onClick={handleShare}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          title="Share Link"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
        </button>
      </div>

      {/* Save Bookmark Modal (Portaled to document.body for clean full-screen overlay) */}
      {showFolderModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFolderModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-2xl text-left space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">bookmark</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bookmark Section</h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">Section {section.number}: {section.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFolderModal(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Select Folder
                </label>
                <select 
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all cursor-pointer"
                >
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {!isCreatingFolder ? (
                <button 
                  onClick={() => setIsCreatingFolder(true)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1.5 transition-colors pt-1"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span> Create new folder
                </button>
              ) : (
                <div className="flex gap-2 items-center pt-1">
                  <input 
                    type="text"
                    placeholder="e.g. Evidence Cases"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
                  />
                  <button 
                    onClick={handleCreateFolder}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    Create
                  </button>
                  <button 
                    onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setShowFolderModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBookmark}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md shadow-blue-500/20"
              >
                Save Bookmark
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SectionToolbar;

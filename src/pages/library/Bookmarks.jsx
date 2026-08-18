import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { bookmarkService } from '../../services/library/bookmarkService';
import { toast } from 'sonner';

const Bookmarks = () => {
  const [folders, setFolders] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const f = await bookmarkService.getFolders();
      const b = await bookmarkService.getBookmarks();
      setFolders(f);
      setBookmarks(b);
    } catch (e) {
      toast.error('Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await bookmarkService.removeBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
      toast.success('Bookmark removed');
    } catch (e) {
      toast.error('Failed to remove bookmark');
    }
  };

  const filteredBookmarks = activeFolderId === 'all' 
    ? bookmarks 
    : bookmarks.filter(b => b.folderId === activeFolderId);

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto flex flex-col bg-background-light dark:bg-background-dark">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar / Folders */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold text-slate-900 dark:text-white">Folders</h2>
          </div>
          <div className="space-y-1">
             <button
                onClick={() => setActiveFolderId('all')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                  activeFolderId === 'all'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Bookmarks</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeFolderId === 'all' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                   {bookmarks.length}
                </span>
              </button>
            {folders.map(folder => {
              const count = bookmarks.filter(b => b.folderId === folder.id).length;
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                    activeFolderId === folder.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate pr-2">{folder.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeFolderId === folder.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Link to="/dashboard/library" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2563EB] mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Saved Provisions</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Quick access to your bookmarked sections.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
               <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
               <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-full flex items-center justify-center mb-4">
                 <span className="material-symbols-outlined text-3xl">bookmark_border</span>
               </div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">No bookmarks yet</h3>
               <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">You haven't saved any sections in this folder. Browse the Bare Acts library and click the bookmark icon to save sections here.</p>
               <Link to="/dashboard/library/bare-acts" className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                 Browse Library
               </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookmarks.map(bookmark => (
                <div key={bookmark.id} className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link to={`/dashboard/library/acts/${bookmark.actId}`} className="inline-block mb-2 text-xs font-semibold text-primary hover:underline">
                          {bookmark.actName} {bookmark.chapterTitle ? `• ${bookmark.chapterTitle}` : ''}
                        </Link>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           Section {bookmark.sectionNumber} - {bookmark.sectionTitle}
                        </h4>
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">folder</span>
                            {folders.find(f => f.id === bookmark.folderId)?.name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {new Date(bookmark.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                           to={`/dashboard/library/acts/${bookmark.actId}`}
                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                           title="Read in Act"
                        >
                           <span className="material-symbols-outlined text-[18px]">menu_book</span>
                        </Link>
                        <button 
                           onClick={() => handleRemove(bookmark.id)}
                           className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                           title="Remove Bookmark"
                        >
                           <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;

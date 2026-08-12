import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notesService } from '../../services/library/notesService';
import { toast } from 'sonner';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const n = await notesService.getNotes();
      // Sort newest first
      setNotes(n.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    } catch (e) {
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await notesService.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success('Note deleted');
    } catch (e) {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto flex flex-col bg-background-light dark:bg-background-dark">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Notes</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your personalized legal annotations and case thoughts.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
             <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
             <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
               <span className="material-symbols-outlined text-3xl">edit_note</span>
             </div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white">No notes yet</h3>
             <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">You haven't written any notes yet. Browse the Bare Acts library and use the "Add Note" tool to capture your thoughts.</p>
             <Link to="/dashboard/library/bare-acts" className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
               Browse Library
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notes.map(note => (
              <div key={note.id} className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all flex flex-col group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{note.title}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDelete(note.id)}
                      className="w-7 h-7 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete Note"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap mb-4 flex-1 line-clamp-4">
                  {note.content}
                </p>

                <div className="mt-auto space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Context Link */}
                  {note.linkedActId && (
                    <div className="flex items-center justify-between text-xs">
                       <Link to={`/dashboard/library/acts/${note.linkedActId}`} className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                          <span className="material-symbols-outlined text-[14px]">link</span>
                          {note.linkedActName} {note.linkedSectionNumber ? `(Sec ${note.linkedSectionNumber})` : ''}
                       </Link>
                       <span className="text-slate-400">{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;

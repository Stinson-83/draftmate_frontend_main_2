import React, { useState, useEffect } from 'react';
import { notesService } from '../../services/library/notesService';
import { toast } from 'sonner';

const NoteDrawer = ({ isOpen, onClose, act, chapter, section }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setTags('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsSaving(true);
    try {
      await notesService.createNote({
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        linkedActId: act?.id,
        linkedActName: act?.name,
        linkedChapterId: chapter?.id,
        linkedSectionNumber: section?.number,
        linkedSectionTitle: section?.title
      });
      toast.success('Note saved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-40 animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white dark:bg-[#151f2e] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">edit_note</span>
            Add Note
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Linked Context Info */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Linked To</div>
          <div className="text-sm text-slate-900 dark:text-slate-200 font-medium line-clamp-1">{act?.name}</div>
          {section && (
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Section {section.number} - {section.title}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Note Title <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="E.g., Key takeaway on limitation period"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Content <span className="text-red-500">*</span></label>
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your analysis, case references, or thoughts here..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tags (comma separated)</label>
            <input 
              type="text" 
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="E.g., Limitation, Property, Urgent"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151f2e] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
          >
            {isSaving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </>
  );
};

export default NoteDrawer;

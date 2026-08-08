import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bareActsApi } from '../../services/library/bareActsApi';
import SectionToolbar from '../../components/library/SectionToolbar';
import NoteDrawer from '../../components/library/NoteDrawer';
import ExplainDrawer from '../../components/library/ExplainDrawer';

const ActDetails = () => {
  const { actId } = useParams();
  const [act, setAct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeChapter, setActiveChapter] = useState(null);
  
  // Drawer State
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);
  const [activeSectionForNote, setActiveSectionForNote] = useState(null);

  const [isExplainDrawerOpen, setIsExplainDrawerOpen] = useState(false);
  const [activeSectionForExplain, setActiveSectionForExplain] = useState(null);

  useEffect(() => {
    const loadAct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bareActsApi.getActById(actId);
        setAct(data);
        setActiveChapter(data?.chapters?.[0]?.id || null);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load act');
      } finally {
        setLoading(false);
      }
    };
    loadAct();
  }, [actId]);

  const handleOpenNote = (section) => {
    setActiveSectionForNote(section);
    setIsNoteDrawerOpen(true);
  };

  const handleAIExplain = (section) => {
    setActiveSectionForExplain(section);
    setIsExplainDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 text-center h-full flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Loading Act...</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Please wait</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center h-full flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Failed to Load</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{error}</p>
        <Link to="/dashboard/library/bare-acts" className="mt-4 text-primary hover:underline">Return to Library</Link>
      </div>
    );
  }

  if (!act) {
    return (
      <div className="p-8 text-center h-full flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Act Not Found</h2>
        <Link to="/dashboard/library/bare-acts" className="mt-4 text-primary hover:underline">Return to Library</Link>
      </div>
    );
  }

  const currentChapter = act.chapters?.find(c => c.id === activeChapter);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
      {/* Header */}
      <div className="px-6 py-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151f2e] flex-shrink-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/library/bare-acts" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white line-clamp-1">{act.name} ({act.shortName})</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium">{act.category}</span>
              <span>{act.totalSections} Sections</span>
              <span className="hidden md:inline">• Updated {new Date(act.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-64">
           <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search in Act..." 
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chapter Sidebar */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#1e293b]/50 overflow-y-auto hidden md:block flex-shrink-0">
          <div className="p-4 font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            Chapters
          </div>
          <div className="p-2 space-y-1">
            {act.chapters?.length > 0 ? act.chapters.map(chapter => (
              <button
                key={chapter.id}
                onClick={() => setActiveChapter(chapter.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeChapter === chapter.id
                    ? 'bg-primary/10 text-primary font-semibold dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="font-medium">{chapter.title}</div>
                <div className="text-xs opacity-75 truncate mt-0.5">{chapter.subtitle}</div>
              </button>
            )) : (
               <div className="p-4 text-sm text-slate-500 text-center">No chapters available yet.</div>
            )}
          </div>
        </div>

        {/* Section List */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Act Description if no chapter selected or overview needed */}
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">About this Act</h2>
               <p className="text-slate-600 dark:text-slate-300">{act.description}</p>
            </div>

            {currentChapter && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentChapter.title}</h2>
                <h3 className="text-lg text-slate-600 dark:text-slate-400">{currentChapter.subtitle}</h3>
              </div>
            )}

            <div className="space-y-4">
              {currentChapter?.sections?.map(section => (
                <div key={section.number} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all hover:shadow-md group">
                  <div className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-primary">Section {section.number}</span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">{section.title}</h4>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mt-2">
                          {section.content}
                        </p>
                        
                        <SectionToolbar 
                          act={act} 
                          chapter={currentChapter} 
                          section={section} 
                          onAddNote={() => handleOpenNote(section)}
                          onAIExplain={() => handleAIExplain(section)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Note Drawer */}
      <NoteDrawer 
        isOpen={isNoteDrawerOpen} 
        onClose={() => setIsNoteDrawerOpen(false)} 
        act={act}
        chapter={currentChapter}
        section={activeSectionForNote}
      />

      {/* AI Explain Drawer */}
      <ExplainDrawer
        isOpen={isExplainDrawerOpen}
        onClose={() => setIsExplainDrawerOpen(false)}
        act={act}
        chapter={currentChapter}
        section={activeSectionForExplain}
      />
    </div>
  );
};

export default ActDetails;

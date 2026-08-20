import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { dictionaryService } from "../../services/library/dictionaryService";
import { notesService } from "../../services/library/notesService";
import { bookmarkService } from "../../services/library/bookmarkService";
import ExplainDrawer from "../../components/library/ExplainDrawer";
import NoteDrawer from "../../components/library/NoteDrawer";
import { mockLegalDictionary } from "../../data/mockLegalDictionary";
import { toast } from "sonner";

const TermDetails = () => {
  const { termId } = useParams();
  const [term, setTerm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isExplainDrawerOpen, setIsExplainDrawerOpen] = useState(false);
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);

  useEffect(() => {
    const loadTerm = async () => {
      try {
        const termData = await dictionaryService.getTermById(termId);
        setTerm(termData);
        const bookmarked = await bookmarkService.isBookmarked(termId);
        setIsBookmarked(!!bookmarked);
      } catch (error) {
        toast.error("Failed to load term");
      } finally {
        setLoading(false);
      }
    };
    if (termId) loadTerm();
  }, [termId]);

  const getCategoryColor = (category) => {
    switch(category) {
      case "Constitutional Law":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Criminal Law":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Civil Law":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Corporate Law":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "General Legal Terms":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "Latin Maxims":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const handleBookmarkToggle = async () => {
    if (!term) return;
    try {
      if (isBookmarked) {
        const existing = await bookmarkService.isBookmarked(term.id);
        if (existing) {
          await bookmarkService.removeBookmark(existing.id);
        }
        setIsBookmarked(false);
        toast.success("Removed from bookmarks");
      } else {
        await bookmarkService.addBookmark({
          actId: term.id,
          actName: term.term,
          actShortName: term.term,
          chapterId: null,
          chapterTitle: null,
          sectionNumber: null,
          sectionTitle: term.shortMeaning,
          folderId: null
        });
        setIsBookmarked(true);
        toast.success("Added to bookmarks");
      }
    } catch (error) {
      toast.error("Failed to update bookmark");
    }
  };

  const handleSaveToNotes = () => {
    setIsNoteDrawerOpen(true);
  };

  const handleCopy = () => {
    if (!term) return;
    const text = `${term.term}\n\nDefinition: ${term.definition}\n\nExplanation: ${term.explanation}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!term) {
    return (
      <div className="p-6 md:p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">error</span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Term not found</h2>
          <Link to="/dashboard/library/dictionary" className="text-primary hover:underline">
            Back to Dictionary
          </Link>
        </div>
      </div>
    );
  }

  let bookmarkButtonClass = "flex items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors";
  if (isBookmarked) {
    bookmarkButtonClass = "flex items-center gap-2 px-4 py-2 rounded-lg border bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400 transition-colors";
  }

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/dashboard/library/dictionary" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          </div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                {term.term}
              </h1>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${getCategoryColor(term.category)}`}>
                {term.category}
              </span>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {term.shortMeaning}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <button 
              onClick={handleBookmarkToggle} 
              className={bookmarkButtonClass}
            >
              <span className={`material-symbols-outlined ${isBookmarked ? "icon-fill" : ""}`}>{isBookmarked ? "bookmark" : "bookmark_add"}</span>
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </button>
            <button 
              onClick={handleSaveToNotes} 
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined">edit_note</span>
              Save to Notes
            </button>
            <button 
              onClick={() => setIsExplainDrawerOpen(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              AI Explain
            </button>
            <button 
              onClick={handleCopy} 
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined">content_copy</span>
              Copy
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              Definition
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {term.definition}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              Explanation
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {term.explanation}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">notes</span>
              Example
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {term.example}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">gavel</span>
              Usage in Indian Law
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {term.usageInIndianLaw}
            </p>
          </div>

          {term.relatedTerms.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">link</span>
                Related Terms
              </h2>
              <div className="flex flex-wrap gap-2">
                {term.relatedTerms.map(relatedTerm => {
                  const relatedTermData = mockLegalDictionary.find(t => t.term === relatedTerm);
                  if (relatedTermData) {
                    return (
                      <Link key={relatedTermData.id} to={`/dashboard/library/dictionary/${relatedTermData.id}`} className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                        {relatedTermData.term}
                      </Link>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <NoteDrawer 
        isOpen={isNoteDrawerOpen} 
        onClose={() => setIsNoteDrawerOpen(false)} 
        act={{ id: term.id, name: term.term, shortName: term.term }}
        chapter={null}
        section={{ number: null, title: term.shortMeaning }}
      />

      <ExplainDrawer 
        isOpen={isExplainDrawerOpen}
        onClose={() => setIsExplainDrawerOpen(false)}
        act={{ id: term.id, name: term.term, shortName: term.term }}
        chapter={null}
        section={{ number: null, title: term.shortMeaning }}
      />
    </div>
  );
};

export default TermDetails;

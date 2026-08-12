import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { formsService } from "../../services/library/formsService";
import { bookmarkService } from "../../services/library/bookmarkService";
import ExplainDrawer from "../../components/library/ExplainDrawer";
import NoteDrawer from "../../components/library/NoteDrawer";
import { toast } from "sonner";

const FormDetails = () => {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isExplainDrawerOpen, setIsExplainDrawerOpen] = useState(false);
  const [isNoteDrawerOpen, setIsNoteDrawerOpen] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const formData = await formsService.getFormById(formId);
        setForm(formData);
        const bookmarked = await bookmarkService.isBookmarked(formId);
        setIsBookmarked(!!bookmarked);
      } catch (error) {
        toast.error("Failed to load form");
      } finally {
        setLoading(false);
      }
    };
    if (formId) loadForm();
  }, [formId]);

  const getCategoryColor = (category) => {
    switch(category) {
      case "Criminal Law":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Civil Law":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Corporate Law":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "Property Law":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Consumer Law":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "Administrative Law":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const handleBookmarkToggle = async () => {
    if (!form) return;
    try {
      if (isBookmarked) {
        const existing = await bookmarkService.isBookmarked(form.id);
        if (existing) {
          await bookmarkService.removeBookmark(existing.id);
        }
        setIsBookmarked(false);
        toast.success("Removed from bookmarks");
      } else {
        await bookmarkService.addBookmark({
          actId: form.id,
          actName: form.name,
          actShortName: form.name,
          chapterId: null,
          chapterTitle: null,
          sectionNumber: null,
          sectionTitle: form.description,
          folderId: null
        });
        setIsBookmarked(true);
        toast.success("Added to bookmarks");
      }
    } catch (error) {
      toast.error("Failed to update bookmark");
    }
  };

  const handleCopy = () => {
    if (!form) return;
    navigator.clipboard.writeText(form.preview);
    toast.success("Template copied to clipboard");
  };

  const handleDownload = () => {
    if (!form) return;
    
    // Convert newlines to <br> for Word HTML
    const formattedContent = form.preview.replace(/\n/g, '<br>');
    
    // Create Word HTML with proper formatting
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${form.name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
          pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 12pt; }
        </style>
      </head>
      <body>`;
    const footer = "</body></html>";
    const sourceHTML = header + formattedContent + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${form.name.replace(/\s+/g, '_')}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    
    toast.success("Download started!");
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6 md:p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">error</span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Form not found</h2>
          <Link to="/dashboard/library/forms" className="text-primary hover:underline">
            Back to Forms Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/dashboard/library/forms" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          </div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {form.name}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(form.category)}`}>
                  {form.category}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Updated: {form.lastUpdated}
                </span>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                {form.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleBookmarkToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isBookmarked ? "bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <span className={`material-symbols-outlined ${isBookmarked ? "icon-fill" : ""}`}>{isBookmarked ? "bookmark" : "bookmark_add"}</span>
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </button>
            <button
              onClick={() => setIsNoteDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined">edit_note</span>
              Save Notes
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
              Copy Template
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined">download</span>
              Download
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              Required Information
            </h2>
            <ul className="space-y-2">
              {form.requiredInfo.map((item) => (
                <li key={item} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              Preview Template
            </h2>
            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto">
              {form.preview}
            </pre>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Instructions
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              {form.instructions.split("\n").map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <NoteDrawer
        isOpen={isNoteDrawerOpen}
        onClose={() => setIsNoteDrawerOpen(false)}
        act={{ id: form.id, name: form.name, shortName: form.name }}
        chapter={null}
        section={{ number: null, title: form.description }}
      />

      <ExplainDrawer
        isOpen={isExplainDrawerOpen}
        onClose={() => setIsExplainDrawerOpen(false)}
        act={{ id: form.id, name: form.name, shortName: form.name }}
        chapter={null}
        section={{ number: null, title: form.description }}
      />
    </div>
  );
};

export default FormDetails;

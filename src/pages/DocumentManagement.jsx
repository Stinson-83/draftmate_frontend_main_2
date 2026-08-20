import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { caseService } from '../services/library/caseService';
import DraftingModal from '../components/DraftingModal';
import { API_CONFIG } from '../services/endpoints';
import './DocumentManagement.css';

const DocumentManagement = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [loading, setLoading] = useState(true);

  // DMS States
  const [isDraftingModalOpen, setIsDraftingModalOpen] = useState(false);
  const [isLinkDraftModalOpen, setIsLinkDraftModalOpen] = useState(false);
  const [availableDrafts, setAvailableDrafts] = useState([]);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [activeFilterPill, setActiveFilterPill] = useState('All'); // 'All', 'Drafts', 'Pleadings'
  
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [isDraggingOverId, setIsDraggingOverId] = useState(null);

  // Share Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingDoc, setSharingDoc] = useState(null);
  const [shareEmailInput, setShareEmailInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const loadCases = useCallback(async () => {
    try {
      const casesData = await caseService.getCases();
      const deletedIds = new Set(JSON.parse(localStorage.getItem('draftmate_deleted_doc_ids') || '[]'));
      
      // Deduplicate documents in existing cases by ID and by filename/name
      casesData.forEach(c => {
        if (c.documents && c.documents.length > 0) {
          const seenIds = new Set();
          const seenNames = new Set();
          c.documents = c.documents.filter(d => {
            const idKey = String(d.id);
            const nameKey = (d.name || d.filename || '').toLowerCase().trim();
            
            if (deletedIds.has(idKey) || (nameKey && deletedIds.has(nameKey))) return false;
            if (seenIds.has(idKey)) return false;
            if (nameKey && seenNames.has(nameKey)) return false;
            
            seenIds.add(idKey);
            if (nameKey) seenNames.add(nameKey);
            return true;
          });
        }
      });

      setCases(casesData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Event listener to reload case data when background sync changes occur
  useEffect(() => {
    const handleSyncUpdate = () => {
      loadCases();
    };
    window.addEventListener('case_documents_updated', handleSyncUpdate);
    return () => window.removeEventListener('case_documents_updated', handleSyncUpdate);
  }, [loadCases]);

  // DMS Handlers
  const handleAddFolder = async () => {
    if (!folderNameInput.trim()) return;
    try {
      if (selectedCaseId) {
        if (editingFolderId) {
          await caseService.renameCaseFolder(selectedCaseId, editingFolderId, folderNameInput.trim());
          toast.success("Folder renamed successfully");
        } else {
          await caseService.addCaseFolder(selectedCaseId, folderNameInput.trim());
          toast.success("Folder created successfully");
        }
      } else {
        if (editingFolderId) {
          await caseService.updateCase(editingFolderId, { caseTitle: folderNameInput.trim() });
          toast.success("Folder renamed successfully");
        } else {
          await caseService.createCase({
            caseTitle: folderNameInput.trim(),
            caseNumber: `DIR-${Math.floor(1000 + Math.random() * 9000)}`,
            court: 'General Files',
            client: 'Self',
            filingDate: new Date().toISOString().split('T')[0],
            status: 'Open',
            priority: 'Medium'
          });
          toast.success("New folder created successfully");
        }
      }
      loadCases();
      setIsFolderModalOpen(false);
      setFolderNameInput('');
      setEditingFolderId(null);
    } catch (err) {
      toast.error("Failed to save folder");
    }
  };

  const handleDeleteCase = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this folder? All inner files will be deleted.')) {
      try {
        await caseService.deleteCase(id);
        toast.success('Folder deleted');
        loadCases();
      } catch {
        toast.error('Failed to delete folder');
      }
    }
  };

  const handleStartRenameCase = (caseId, title, e) => {
    e.stopPropagation();
    setEditingFolderId(caseId);
    setFolderNameInput(title);
    setIsFolderModalOpen(true);
  };

  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this folder? All documents inside will be moved to root.")) {
      try {
        await caseService.deleteCaseFolder(selectedCaseId, folderId);
        toast.success("Folder deleted");
        if (currentFolderId === folderId) setCurrentFolderId(null);
        loadCases();
      } catch (err) {
        toast.error("Failed to delete folder");
      }
    }
  };

  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to remove this document?")) {
      try {
        await caseService.deleteCaseDocument(selectedCaseId, docId);

        // Record deleted document ID to prevent auto-sync resurrection
        try {
          const deletedIds = JSON.parse(localStorage.getItem('draftmate_deleted_doc_ids') || '[]');
          if (!deletedIds.includes(String(docId))) {
            deletedIds.push(String(docId));
            localStorage.setItem('draftmate_deleted_doc_ids', JSON.stringify(deletedIds));
          }
        } catch (e) {}

        // Instantly update state without reloading
        setCases(prevCases => {
          return prevCases.map(c => {
            if (c.documents) {
              return {
                ...c,
                documents: c.documents.filter(d => String(d.id) !== String(docId))
              };
            }
            return c;
          });
        });

        toast.success("Document removed");
      } catch (err) {
        toast.error("Failed to remove document");
      }
    }
  };

  const handleDragStart = (e, docId) => {
    e.dataTransfer.setData('docId', docId);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    setIsDraggingOverId(targetId);
  };

  const handleDragLeave = () => {
    setIsDraggingOverId(null);
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    setIsDraggingOverId(null);
    const docId = e.dataTransfer.getData('docId');
    if (!docId || !selectedCaseId) return;

    try {
      await caseService.moveCaseDocument(selectedCaseId, docId, targetFolderId);
      toast.success("Document moved successfully");
      loadCases();
    } catch (err) {
      toast.error("Failed to move document");
    }
  };

  const handleOpenLinkDraftModal = async () => {
    setIsLinkDraftModalOpen(true);
    try {
      const token = localStorage.getItem('session_id');
      let response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableDrafts(data.drafts || []);
      } else {
        const saved = JSON.parse(localStorage.getItem('my_drafts') || '[]');
        setAvailableDrafts(saved);
      }
    } catch (err) {
      const saved = JSON.parse(localStorage.getItem('my_drafts') || '[]');
      setAvailableDrafts(saved);
    }
  };

  const handleLinkDraft = async (draft) => {
    if (!selectedCaseId) return;
    try {
      await caseService.addCaseDocument(selectedCaseId, {
        id: draft.id || draft.documentKey,
        name: draft.name || draft.filename,
        filename: draft.filename,
        documentType: draft.variablesDetected ? 'Writ Petition' : 'Lease Agreement',
        size: '15 KB',
        syncStatus: 'synced',
        folderId: currentFolderId
      });
      toast.success("Draft linked to case");
      setIsLinkDraftModalOpen(false);
      loadCases();
    } catch (err) {
      toast.error("Failed to link draft");
    }
  };

  const handleFileUploadClick = () => {
    if (!selectedCaseId) {
      toast.error("Please navigate inside a case folder to upload a document.");
      return;
    }
    document.getElementById('file-uploader').click();
  };

  const handleRealFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading "${file.name}"...`);
    try {
      const fileBlobUrl = URL.createObjectURL(file);
      await caseService.addCaseDocument(selectedCaseId, {
        file: file,
        name: file.name,
        filename: file.name,
        url: fileBlobUrl,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        syncStatus: 'synced',
        source: 'upload',
        folderId: currentFolderId
      });
      toast.success(`"${file.name}" uploaded successfully!`, { id: toastId });
      loadCases();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload file.", { id: toastId });
    }
    e.target.value = '';
  };

  const handleShareDocument = (doc, e) => {
    if (e) e.stopPropagation();
    setSharingDoc(doc);
    setShareEmailInput('');
    setCopiedLink(false);
    setIsShareModalOpen(true);
  };

  const getDocShareUrl = (doc) => {
    if (!doc) return 'https://www.draftmate.in/dashboard/documents';
    
    // Dynamically use live production origin when deployed, or fallback to production domain on localhost
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const domain = (!isLocal && typeof window !== 'undefined' && window.location.origin)
      ? window.location.origin 
      : (import.meta.env.VITE_PUBLIC_APP_URL || 'https://www.draftmate.in');
      
    const cleanDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
    const docName = doc.filename || doc.name || 'document';
    const docId = doc.id || 'doc-001';
    
    return `${cleanDomain}/dashboard/workspace?documentKey=${encodeURIComponent(docId)}&filename=${encodeURIComponent(docName)}&autodownload=true`;
  };

  const handleCopyShareLink = () => {
    const url = getDocShareUrl(sharingDoc);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendShareEmail = (e) => {
    e.preventDefault();
    if (!shareEmailInput || !shareEmailInput.includes('@')) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success(`Document "${sharingDoc?.name}" shared with ${shareEmailInput}!`);
    setIsShareModalOpen(false);
    setShareEmailInput('');
  };

  const handleNativeShare = () => {
    if (navigator.share && sharingDoc) {
      navigator.share({
        title: sharingDoc.name,
        text: `Check out "${sharingDoc.name}" on DraftMate Legal Platform`,
        url: getDocShareUrl(sharingDoc),
      }).catch(() => {});
    } else {
      handleCopyShareLink();
    }
  };

  const handleDocumentClick = async (doc) => {
    if (doc.type === 'docx') {
      const toastId = toast.loading("Opening document...");
      try {
        const token = localStorage.getItem('session_id') || localStorage.getItem('token');
        const response = await fetch(`${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/config/${doc.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const config = await response.json();
          toast.dismiss(toastId);
          navigate('/dashboard/workspace', { 
            state: { 
              documentKey: doc.id, 
              filename: doc.filename || doc.name, 
              draftId: doc.id,
              onlyofficeConfig: config 
            } 
          });
          return;
        }
      } catch (err) {
        console.warn("OnlyOffice draft config fallback:", err);
      }
      toast.dismiss(toastId);
    }

    if (doc.url) {
      let targetUrl = doc.url;
      if (doc.url.startsWith('data:')) {
        try {
          const parts = doc.url.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          let blob;
          if (mime.includes('text') || (doc.name || '').toLowerCase().endsWith('.txt')) {
            const textDecoder = new TextDecoder('utf-8');
            const textContent = textDecoder.decode(u8arr);
            blob = new Blob(['\uFEFF' + textContent], { type: 'text/plain;charset=utf-8' });
          } else {
            blob = new Blob([u8arr], { type: mime });
          }
          targetUrl = URL.createObjectURL(blob);
        } catch (e) {
          targetUrl = doc.url;
        }
      } else if (!doc.url.startsWith('http') && !doc.url.startsWith('blob:')) {
        targetUrl = `${window.location.origin}${doc.url}`;
      }
      
      const link = document.createElement('a');
      link.href = targetUrl;
      link.target = '_blank';
      if (doc.type === 'pdf' || (doc.name || '').toLowerCase().endsWith('.pdf')) {
        link.download = doc.filename || doc.name || 'document.pdf';
      }
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try { document.body.removeChild(link); } catch(e){}
      }, 500);
    } else {
      window.open(`${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/serve/${doc.id}/${doc.filename || doc.name}`, '_blank');
    }
  };

  // Navigations: If selectedCaseId is null, default to General Documents case matter
  const activeCaseId = selectedCaseId || (cases.find(c => c.id === 'general-docs') ? 'general-docs' : cases[0]?.id);
  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0];
  const foldersList = activeCase?.folders || [];
  const documentsList = activeCase?.documents || [];

  // Filtering Folders & Files
  const displayedFolders = docSearchQuery
    ? foldersList.filter(f => f.name.toLowerCase().includes(docSearchQuery.toLowerCase()))
    : currentFolderId === null 
      ? foldersList 
      : [];

  const displayedDocs = documentsList.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(docSearchQuery.toLowerCase());
    const matchesPill = activeFilterPill === 'All'
      || (activeFilterPill === 'Drafts' && doc.source === 'drafter')
      || (activeFilterPill === 'Pleadings' && (doc.documentType || '').toLowerCase().includes('petition') || (doc.name || '').toLowerCase().includes('petition') || (doc.name || '').toLowerCase().includes('plaint'));
    
    if (docSearchQuery) {
      return matchesSearch && matchesPill;
    }
    return doc.folderId === currentFolderId && matchesPill;
  });

  const getFileIcon = (ext) => {
    switch (ext) {
      case 'pdf': 
        return (
          <div className="size-8 bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-500 text-xl">picture_as_pdf</span>
          </div>
        );
      case 'png':
      case 'jpg':
      case 'jpeg': 
        return (
          <div className="size-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-emerald-500 text-xl">image</span>
          </div>
        );
      default: 
        return (
          <div className="size-8 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-500 text-xl font-bold">description</span>
          </div>
        );
    }
  };

  const getFileTypeLabel = (ext) => {
    switch (ext) {
      case 'pdf': return 'PDF File';
      case 'docx':
      case 'doc': return 'Word Document';
      case 'png':
      case 'jpg':
      case 'jpeg': return 'Image File';
      default: return 'Word Document';
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 h-full flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-[#f8fafc] dark:bg-[#0f172a]" style={{ textAlign: 'left' }}>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Breadcrumb & User Header */}
        <div className="flex justify-between items-center pb-2">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
            <span 
              onClick={() => { setSelectedCaseId(null); setCurrentFolderId(null); }} 
              className="cursor-pointer hover:text-primary transition-colors"
            >
              Documents
            </span>
            {selectedCaseId && (
              <>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span 
                  onClick={() => setCurrentFolderId(null)}
                  className="cursor-pointer hover:text-primary transition-colors text-slate-700 dark:text-slate-300"
                >
                  {activeCase?.caseTitle}
                </span>
              </>
            )}
            {currentFolderId && (
              <>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary font-semibold underline">
                  {foldersList.find(f => f.id === currentFolderId)?.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Context Title & Action Buttons */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {selectedCaseId 
                ? `Case #${activeCase?.caseNumber}: ${activeCase?.caseTitle}` 
                : "Documents"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {selectedCaseId 
                ? "Organize, upload, and draft files scoped to this case matter." 
                : "Select a case folder below to manage documents."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setEditingFolderId(null);
                setFolderNameInput('');
                setIsFolderModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-lg">create_new_folder</span>
              + New Folder
            </button>
            <input 
              type="file" 
              id="file-uploader" 
              style={{ display: 'none' }} 
              onChange={handleRealFileUpload} 
            />
            <button
              onClick={handleFileUploadClick}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Upload File
            </button>
          </div>
        </div>

        {/* Search, Filter Pills & Dropdowns */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
            <input
              type="text"
              placeholder={selectedCaseId ? `Search in documents...` : "Search cases by name..."}
              value={docSearchQuery}
              onChange={(e) => setDocSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveFilterPill('All')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg pill-filter border ${activeFilterPill === 'All' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
            >
              All Files
            </button>
            <button
              onClick={() => setActiveFilterPill('Drafts')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg pill-filter border ${activeFilterPill === 'Drafts' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
            >
              Drafts
            </button>
            <button
              onClick={() => setActiveFilterPill('Pleadings')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg pill-filter border ${activeFilterPill === 'Pleadings' ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
            >
              Pleadings
            </button>
          </div>
        </div>

        {/* Explorer Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse dms-table table-fixed min-w-[700px]">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Name</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '15%' }}>Date Modified</th>
                <th style={{ width: '13%' }}>Type</th>
                <th style={{ width: '10%' }}>Size</th>
                <th style={{ width: '12%' }} className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* If at Root level: list cases as folders */}
              {selectedCaseId === null ? (
                cases.filter(c => c.caseTitle.toLowerCase().includes(docSearchQuery.toLowerCase())).map(c => (
                  <tr 
                    key={c.id}
                    onClick={() => { setSelectedCaseId(c.id); setCurrentFolderId(null); }}
                    className="cursor-pointer group"
                  >
                    <td>
                      <div className="flex items-center gap-3 font-semibold text-slate-900 dark:text-slate-100">
                        <span className="material-symbols-outlined text-amber-500 text-3xl shrink-0">folder</span>
                        <span className="truncate">{c.caseTitle} ({c.caseNumber})</span>
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded text-xs font-bold">
                        Folder
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(c.filingDate || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">Case Folder</span>
                    </td>
                    <td>
                      <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {(c.documents || []).length} items
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleStartRenameCase(c.id, c.caseTitle, e)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteCase(c.id, e)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {/* Back to Parent Directory row if inside a subfolder */}
                  {currentFolderId !== null && (
                    <tr 
                      onClick={() => setCurrentFolderId(null)}
                      className="cursor-pointer hover:bg-slate-50/50"
                    >
                      <td colSpan="6">
                        <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-wider">
                          <span className="material-symbols-outlined text-sm">arrow_upward</span>
                          .. Parent Directory
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Folders */}
                  {displayedFolders.map(folder => (
                    <tr 
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      onDragOver={(e) => handleDragOver(e, folder.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, folder.id)}
                      className={`cursor-pointer group ${isDraggingOverId === folder.id ? 'bg-primary/10 dark:bg-primary/20 font-bold' : ''}`}
                    >
                      <td>
                        <div className="flex items-center gap-3 font-semibold text-slate-900 dark:text-slate-100">
                          <span className="material-symbols-outlined text-amber-500 text-3xl shrink-0">folder</span>
                          <span className="truncate">{folder.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded text-xs font-bold">
                          Folder
                        </span>
                      </td>
                      <td>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">
                          {new Date(folder.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">File Folder</span>
                      </td>
                      <td>
                        <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                          {(activeCase?.documents || []).filter(d => d.folderId === folder.id).length} items
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 justify-end pr-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolderId(folder.id);
                              setFolderNameInput(folder.name);
                              setIsFolderModalOpen(true);
                            }}
                            title="Rename Folder"
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button 
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                            title="Delete Folder"
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Documents */}
                  {displayedDocs.map(doc => (
                    <tr 
                      key={doc.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, doc.id)}
                      onClick={() => handleDocumentClick(doc)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 group"
                    >
                      <td className="min-w-0">
                        <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200 min-w-0 pr-2">
                          {getFileIcon(doc.type)}
                          <span className="font-semibold truncate block min-w-0" title={doc.name}>{doc.name}</span>
                        </div>
                      </td>
                      <td>
                        {/* Live OneDrive status look from user's image */}
                        {doc.syncStatus === 'syncing' ? (
                          <div className="flex items-center gap-1.5 text-blue-500 font-bold text-xs">
                            <span className="material-symbols-outlined text-lg sync-spin">sync</span>
                            Syncing
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#10b981] font-bold text-xs">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            Sync
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">
                          {new Date(doc.lastModified || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">{getFileTypeLabel(doc.type)}</span>
                      </td>
                      <td>
                        <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">{doc.size || '15 KB'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 justify-end pr-2">
                          <button 
                            onClick={(e) => handleShareDocument(doc, e)}
                            title="Share File"
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">share</span>
                          </button>
                          <button 
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            title="Delete File"
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Empty case message */}
                  {displayedFolders.length === 0 && displayedDocs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 dark:text-slate-600">
                        <span className="material-symbols-outlined text-4xl mb-2">folder_open</span>
                        <p className="text-xs font-medium">This case directory is empty.</p>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Folder CRUD Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsFolderModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 shadow-xl text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingFolderId ? 'Rename Folder' : 'Create New Folder'}
              </h3>
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Discovery Materials"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddFolder(); }}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFolder}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/95"
                >
                  {editingFolderId ? 'Rename' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Document Modal */}
      {isShareModalOpen && sharingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-2xl text-left space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">share</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Share Document</h3>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{sharingDoc.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Direct Link Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Shareable Link
              </label>
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={getDocShareUrl(sharingDoc)}
                  className="flex-1 px-3 py-1.5 bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none truncate font-mono"
                />
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">
                    {copiedLink ? 'check' : 'content_copy'}
                  </span>
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Email Share Section */}
            <form onSubmit={handleSendShareEmail} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Share via Email
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="colleague@lawfirm.com"
                  value={shareEmailInput}
                  onChange={(e) => setShareEmailInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  Send
                </button>
              </div>
            </form>

            {/* Native Mobile / System Share Option */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">share_windows</span>
                  More Share Options...
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentManagement;

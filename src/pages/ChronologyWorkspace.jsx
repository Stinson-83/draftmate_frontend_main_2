import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  FolderPlus, Upload, Trash2, Calendar, FileText, ChevronRight,
  AlertTriangle, Check, X, Edit3, Save, Download, Sparkles, RefreshCw
} from 'lucide-react';
import { API_CONFIG } from '../services/endpoints';
import './ChronologyWorkspace.css';

const ChronologyWorkspace = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [caseNameInput, setCaseNameInput] = useState('');
  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline', 'upload'
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEventId, setEditEventId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);
  const [newCaseLoading, setNewCaseLoading] = useState(false);
  const [sidebarText, setSidebarText] = useState('');
  const [sidebarTitle, setSidebarTitle] = useState('');
  
  const fileInputRef = useRef(null);

  const sessionId = localStorage.getItem('session_id');

  const headers = {
    Authorization: `Bearer ${sessionId}`
  };

  // Fetch all cases
  const fetchCases = async () => {
    try {
      const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/cases`;
      const resp = await axios.get(url, { headers });
      setCases(resp.data.cases || []);
      if (resp.data.cases?.length > 0 && !selectedCaseId) {
        setSelectedCaseId(resp.data.cases[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load cases.');
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Fetch documents and events when selectedCaseId changes
  const fetchCaseDetails = async () => {
    if (!selectedCaseId) return;
    try {
      // 1. Fetch documents processing status
      const statusUrl = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/case/${selectedCaseId}/status`;
      const statusResp = await axios.get(statusUrl, { headers });
      setDocuments(statusResp.data.documents || []);
      setProgress(statusResp.data.progress || 0);
      setIsProcessing(statusResp.data.status === 'processing');

      // 2. Fetch events
      const eventsUrl = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/case/${selectedCaseId}/events`;
      const eventsResp = await axios.get(eventsUrl, { headers });
      setEvents(eventsResp.data.events || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
    setSidebarText('');
    setSidebarTitle('');
    setSelectedEvent(null);
  }, [selectedCaseId]);

  // Polling for document extraction progress
  useEffect(() => {
    let interval;
    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const statusUrl = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/case/${selectedCaseId}/status`;
          const statusResp = await axios.get(statusUrl, { headers });
          setDocuments(statusResp.data.documents || []);
          setProgress(statusResp.data.progress || 0);
          if (statusResp.data.status !== 'processing') {
            setIsProcessing(false);
            toast.success('All documents compiled and ready for chronology extraction!');
            fetchCaseDetails();
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isProcessing, selectedCaseId]);

  // Handle create new case
  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!caseNameInput.trim()) return;
    setNewCaseLoading(true);
    try {
      const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/case`;
      const resp = await axios.post(url, { name: caseNameInput }, { headers });
      toast.success('Case matter created successfully!');
      setCaseNameInput('');
      setCases(prev => [resp.data, ...prev]);
      setSelectedCaseId(resp.data.id);
      setActiveTab('upload');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create case.');
    } finally {
      setNewCaseLoading(false);
    }
  };

  // Upload case documents
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const formData = new FormData();
    formData.append('case_id', selectedCaseId);
    files.forEach(f => formData.append('files', f));

    const loadingToast = toast.loading('Uploading files & running ingestion pipeline...');
    setIsProcessing(true);

    try {
      const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/upload`;
      await axios.post(url, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Files uploaded! Starting text extraction and OCR...', { id: loadingToast });
      fetchCaseDetails();
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Check file types or sizes.', { id: loadingToast });
      setIsProcessing(false);
    } finally {
      e.target.value = '';
    }
  };

  // Trigger Timeline Synthesis
  const handleGenerateChronology = async () => {
    const loadingToast = toast.loading('Running AI timeline extraction, deduplication, and conflict checking...');
    try {
      const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/generate`;
      await axios.post(url, { case_id: selectedCaseId }, { headers });
      toast.success('AI Case Chronology ready!', { id: loadingToast });
      fetchCaseDetails();
    } catch (err) {
      console.error(err);
      toast.error('Synthesis failed. Please verify documents are processed.', { id: loadingToast });
    }
  };

  // Update verification status (Accept, Reject, Disputed)
  const handleUpdateStatus = async (eventId, newStatus) => {
    try {
      const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/events/${eventId}`;
      await axios.put(url, { status: newStatus }, { headers });
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: newStatus } : ev));
      toast.success(`Event status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update event status.');
    }
  };

  // Start editing inline
  const startEditEvent = (ev) => {
    setEditEventId(ev.id);
    setEditFormData({
      event_date: ev.event_date,
      date_type: ev.date_type,
      event_description: ev.event_description,
      actors: ev.actors.join(', ')
    });
  };

  // Save inline edit edits
  const saveEventEdit = async (eventId) => {
    try {
      const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/events/${eventId}`;
      const payload = {
        event_date: editFormData.event_date,
        date_type: editFormData.date_type,
        event_description: editFormData.event_description,
        actors: editFormData.actors.split(',').map(s => s.trim()).filter(Boolean)
      };
      await axios.put(url, payload, { headers });
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, ...payload, user_modified: true } : ev));
      setEditEventId(null);
      toast.success('Changes saved!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes.');
    }
  };

  // View citation snippet
  const handleViewCitation = (citation, sourceDocName) => {
    setSidebarTitle(`${sourceDocName} — Page ${citation.source_page || 1}`);
    setSidebarText(citation.source_text || 'No snippet text available for this citation.');
  };

  // Export approved timeline to PDF
  // Generate Docx table and open in OnlyOffice editor
  const handleOpenInOnlyOffice = async () => {
    setPdfLoading(true);
    try {
      const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/export_docx`;
      const response = await axios.post(url, { 
        case_id: selectedCaseId,
        sort_order: sortOrder
      }, { headers });
      
      const draft = response.data;
      toast.success('Chronology document created! Redirecting to ONLYOFFICE...');
      
      navigate('/dashboard/workspace', {
        state: {
          draftId: draft.id,
          id: draft.id,
          filename: draft.filename,
          documentKey: draft.documentKey,
          variablesDetected: [],
          onlyofficeConfig: null
        }
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate chronology document.');
    } finally {
      setPdfLoading(false);
    }
  };

  const activeCase = cases.find(c => c.id === selectedCaseId);

  const sortedEventsInUI = [...events].sort((a, b) => {
    const keyA = a.timestamp || a.date_normalized || a.event_date || "";
    const keyB = b.timestamp || b.date_normalized || b.event_date || "";
    return sortOrder === 'asc' 
      ? String(keyA).localeCompare(String(keyB)) 
      : String(keyB).localeCompare(String(keyA));
  });

  return (
    <div className="chronology-workspace-container">
      {/* 🧭 Top Action Bar */}
      <header className="workspace-header">
        <div className="header-meta">
          <span className="workspace-label">Legal Chronology Workspace</span>
          <h1 className="workspace-title">AI Case Chronology Builder</h1>
        </div>

        {/* Case selector / creator */}
        <div className="case-actions">
          <form onSubmit={handleCreateCase} className="new-case-form">
            <input 
              type="text" 
              placeholder="New Case Name..."
              value={caseNameInput}
              onChange={e => setCaseNameInput(e.target.value)}
              className="new-case-input"
            />
            <button type="submit" className="new-case-btn" disabled={newCaseLoading}>
              <FolderPlus className="h-4 w-4" />
            </button>
          </form>

          {cases.length > 0 && (
            <select 
              value={selectedCaseId} 
              onChange={e => setSelectedCaseId(e.target.value)}
              className="case-selector"
            >
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {activeCase ? (
        <div className="workspace-grid">
          {/* Main workspace area */}
          <main className="workspace-main">
            {/* Tab controls */}
            <div className="tab-bar">
              <button 
                className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span>Chronology Timeline</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span>Document Vault ({documents.length})</span>
              </button>

              {activeTab === 'timeline' && events.length > 0 && (
                <div className="timeline-controls ml-auto flex items-center gap-3">
                  <div className="sort-selector flex items-center gap-1.5 bg-white border border-[#B9D9EB] rounded-lg px-2.5 py-1 text-xs">
                    <span className="text-slate-500 font-medium">Order:</span>
                    <select 
                      value={sortOrder} 
                      onChange={e => setSortOrder(e.target.value)}
                      className="bg-transparent border-0 outline-none font-semibold text-slate-700 cursor-pointer"
                    >
                      <option value="asc">Earliest to Latest</option>
                      <option value="desc">Latest to Earliest</option>
                    </select>
                  </div>
                  <button 
                    className="export-pdf-btn" 
                    onClick={handleOpenInOnlyOffice}
                    disabled={pdfLoading}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span>{pdfLoading ? 'Opening Workspace...' : 'Open in ONLYOFFICE'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* TAB: TIMELINE VIEW */}
            {activeTab === 'timeline' && (
              <div className="tab-pane">
                {events.length === 0 ? (
                  <div className="empty-state-panel">
                    <Sparkles className="empty-state-icon text-indigo-400" />
                    <h3>No Chronology Generated Yet</h3>
                    <p>
                      Ensure you have uploaded relevant pleadings, affidavits, or contracts under the **Document Vault**, then trigger synthesis.
                    </p>
                    <button 
                      className="generate-timeline-btn mt-4" 
                      onClick={handleGenerateChronology}
                      disabled={isProcessing || documents.length === 0}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      <span>Extract Timeline Chronology</span>
                    </button>
                  </div>
                ) : (
                  <div className="timeline-scroller">
                    <table className="chronology-table">
                      <thead>
                        <tr>
                          <th>SL.no</th>
                          <th>Date</th>
                          <th>Particulars</th>
                          <th>Page no</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedEventsInUI.map((ev, index) => {
                          const pageNo = ev.source_page || ev.citations?.[0]?.source_page || 1;
                          const docName = ev.source_document || ev.citations?.[0]?.source_document || 'Doc';

                          return (
                            <tr key={ev.id} className={ev.status === 'rejected' ? 'rejected-row' : ''}>
                              <td>{index + 1}</td>
                              <td className="date-cell">
                                <div className="date-display">
                                  <span>{ev.event_date || 'No Date'}</span>
                                  {ev.user_modified && <span className="modified-indicator">Edited</span>}
                                </div>
                              </td>
                              <td className="particulars-cell">
                                <div className="particulars-display">
                                  <p>{ev.event_description}</p>
                                  <div className="row-actions">
                                    <button 
                                      onClick={() => handleUpdateStatus(ev.id, 'accepted')} 
                                      className={`row-action check ${ev.status === 'accepted' ? 'active' : ''}`}
                                    >
                                      Verify
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateStatus(ev.id, 'rejected')} 
                                      className={`row-action reject ${ev.status === 'rejected' ? 'active' : ''}`}
                                    >
                                      Reject
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const newDesc = prompt("Edit Particulars:", ev.event_description);
                                        if (newDesc !== null && newDesc.trim() !== '') {
                                          axios.put(`${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/events/${ev.id}`, {
                                            ...ev,
                                            event_description: newDesc.trim()
                                          }, { headers }).then(() => {
                                            setEvents(prev => prev.map(item => item.id === ev.id ? { ...item, event_description: newDesc.trim(), user_modified: true } : item));
                                            toast.success('Particulars updated!');
                                          }).catch(err => {
                                            console.error(err);
                                            toast.error('Failed to save edit.');
                                          });
                                        }
                                      }} 
                                      className="row-action edit"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="page-cell">
                                <span 
                                  className="page-pill" 
                                  onClick={() => handleViewCitation(ev.citations?.[0] || { source_page: pageNo, source_text: ev.event_description }, docName)}
                                  title="View original citation snippet"
                                >
                                  {docName} (p.{pageNo})
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: UPLOAD VIEW */}
            {activeTab === 'upload' && (
              <div className="tab-pane">
                {/* File Dropzone */}
                <div 
                  className="file-dropzone-panel"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.txt"
                    style={{ display: 'none' }}
                  />
                  <Upload className="upload-icon text-indigo-400" />
                  <h4>Upload Case Pleadings & Evidences</h4>
                  <p>Supports Text & Scanned PDF, Word (.docx), and plain text (.txt) files.</p>
                  <button className="browse-files-btn">Browse Files</button>
                </div>

                {/* Progress bar */}
                {isProcessing && (
                  <div className="global-progress-bar">
                    <div className="progress-label-row">
                      <span>Analyzing Document Schema (OCR Pipeline)...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}

                {/* File Listing */}
                <div className="vault-file-list mt-8">
                  <h4 className="list-title">Vault Document Index</h4>
                  {documents.length === 0 ? (
                    <p className="no-docs-text">No files uploaded. Use the dropzone above to ingest case records.</p>
                  ) : (
                    <div className="docs-grid">
                      {documents.map(doc => (
                        <div key={doc.id} className="doc-item-row">
                          <FileText className="h-5 w-5 text-indigo-500 mr-3" />
                          <div className="doc-meta-info">
                            <span className="doc-name-text">{doc.file_name}</span>
                            <span className="doc-size-text">
                              {(doc.file_size / 1024).toFixed(1)} KB | Pages: {doc.pages_processed}/{doc.total_pages}
                            </span>
                          </div>
                          <span className={`doc-status-badge ${doc.status}`}>{doc.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar audit viewer */}
          <aside className="workspace-sidebar">
            <h3 className="sidebar-heading">Evidence Source Audit Trail</h3>
            {sidebarTitle ? (
              <div className="sidebar-citation-card">
                <h4 className="citation-title">{sidebarTitle}</h4>
                <blockquote className="citation-text">
                  “{sidebarText}”
                </blockquote>
                <div className="audit-guardrails-row">
                  <span className="guardrail-indicator secure">Verified Fact</span>
                  <span className="guardrail-indicator text-xs text-slate-400">Strict attribution fallback active.</span>
                </div>
              </div>
            ) : (
              <div className="sidebar-empty">
                <ChevronRight className="h-8 w-8 text-slate-500 mb-2 rotate-90" />
                <p>Click any document citation inside a timeline event to audit the source text passage.</p>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="no-workspace-state">
          <FolderPlus className="h-12 w-12 text-slate-500 mb-4" />
          <h2>Create a Case to Begin</h2>
          <p>Name a case matter reference above to start uploading and extracting legal timelines.</p>
        </div>
      )}
    </div>
  );
};

export default ChronologyWorkspace;

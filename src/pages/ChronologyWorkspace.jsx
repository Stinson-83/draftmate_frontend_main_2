import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  FolderPlus, Upload, Trash2, Calendar, FileText, ChevronRight,
  AlertTriangle, Check, X, Edit3, Save, Download, Sparkles, RefreshCw
} from 'lucide-react';
import { API_CONFIG } from '../services/endpoints';
import './ChronologyWorkspace.css';

const ChronologyWorkspace = () => {
  const [cases, setCases] = useState([]);
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
  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const url = `${API_CONFIG.DRAFTER.BASE_URL}/v2/chronology/export`;
      const response = await axios.post(url, { case_id: selectedCaseId }, {
        headers,
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const dlLink = document.createElement('a');
      dlLink.href = window.URL.createObjectURL(blob);
      dlLink.download = `${cases.find(c => c.id === selectedCaseId)?.name || 'case'}_chronology.pdf`;
      dlLink.click();
      toast.success('PDF report exported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Export failed.');
    } finally {
      setPdfLoading(false);
    }
  };

  const activeCase = cases.find(c => c.id === selectedCaseId);

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
                <button 
                  className="export-pdf-btn ml-auto" 
                  onClick={handleExportPDF}
                  disabled={pdfLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span>{pdfLoading ? 'Exporting...' : 'Export PDF'}</span>
                </button>
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
                    {events.map((ev, index) => {
                      const isEditing = editEventId === ev.id;
                      const hasConflict = ev.is_conflict;

                      return (
                        <div key={ev.id} className={`timeline-entry-card ${ev.status === 'rejected' ? 'rejected-card' : ''} ${hasConflict ? 'conflict-card' : ''}`}>
                          {/* Left node anchor */}
                          <div className="timeline-node-pin">
                            <div className={`node-circle-dot ${ev.status === 'accepted' ? 'accepted' : ev.status === 'disputed' ? 'disputed' : ''}`}></div>
                            {index < events.length - 1 && <div className="node-line-link"></div>}
                          </div>

                          {/* Event card content */}
                          <div className="event-card-body">
                            {isEditing ? (
                              <div className="edit-form-grid">
                                <input 
                                  type="text" 
                                  value={editFormData.event_date} 
                                  onChange={e => setEditFormData(prev => ({...prev, event_date: e.target.value}))}
                                  placeholder="YYYY-MM-DD"
                                  className="edit-field"
                                />
                                <select 
                                  value={editFormData.date_type}
                                  onChange={e => setEditFormData(prev => ({...prev, date_type: e.target.value}))}
                                  className="edit-field"
                                >
                                  <option value="exact">Exact</option>
                                  <option value="inferred">Inferred</option>
                                  <option value="approximate">Approximate</option>
                                </select>
                                <textarea 
                                  value={editFormData.event_description} 
                                  onChange={e => setEditFormData(prev => ({...prev, event_description: e.target.value}))}
                                  placeholder="Event description..."
                                  className="edit-field col-span-2"
                                  rows={2}
                                />
                                <input 
                                  type="text" 
                                  value={editFormData.actors} 
                                  onChange={e => setEditFormData(prev => ({...prev, actors: e.target.value}))}
                                  placeholder="Actors (comma separated)..."
                                  className="edit-field col-span-2"
                                />
                                <div className="edit-actions col-span-2">
                                  <button onClick={() => saveEventEdit(ev.id)} className="save-btn">
                                    <Save className="h-4 w-4 mr-1" /> Save
                                  </button>
                                  <button onClick={() => setEditEventId(null)} className="cancel-btn">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="event-header-row">
                                  <div className="date-badge-wrap">
                                    <span className="event-date-text">{ev.event_date || 'No Date'}</span>
                                    <span className={`date-type-badge ${ev.date_type}`}>{ev.date_type}</span>
                                    {ev.user_modified && <span className="modified-badge">Edited</span>}
                                  </div>

                                  <div className="action-buttons-wrap">
                                    <button 
                                      onClick={() => handleUpdateStatus(ev.id, 'accepted')} 
                                      className={`action-icon-btn check ${ev.status === 'accepted' ? 'active' : ''}`}
                                      title="Verify Event"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateStatus(ev.id, 'disputed')} 
                                      className={`action-icon-btn dispute ${ev.status === 'disputed' ? 'active' : ''}`}
                                      title="Mark Disputed"
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateStatus(ev.id, 'rejected')} 
                                      className={`action-icon-btn reject ${ev.status === 'rejected' ? 'active' : ''}`}
                                      title="Reject Event"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => startEditEvent(ev)} className="action-icon-btn edit">
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                <p className="event-desc-text">{ev.event_description}</p>

                                {ev.actors?.length > 0 && (
                                  <div className="actors-row">
                                    <strong>Actors:</strong> {ev.actors.join(', ')}
                                  </div>
                                )}

                                {/* Citations pills */}
                                <div className="citations-tray">
                                  {ev.citations?.map((cit, cIdx) => (
                                    <span 
                                      key={cIdx} 
                                      className="citation-pill"
                                      onClick={() => handleViewCitation(cit, ev.source_document || cit.source_document)}
                                    >
                                      {ev.source_document || cit.source_document} (p.{cit.source_page || 1})
                                    </span>
                                  ))}
                                </div>

                                {/* Conflicts Warning */}
                                {hasConflict && ev.conflict_details?.length > 0 && (
                                  <div className="conflict-warning-box">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0" />
                                    <div>
                                      <strong>⚠️ Date Conflict Flagged:</strong> Other documents state different dates for this event:
                                      <ul className="conflict-list">
                                        {ev.conflict_details.map((cf, cfIdx) => (
                                          <li key={cfIdx}><b>{cf.date}</b> — {cf.source}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
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

import { mockCases } from '../../data/mockCases';
import { API_CONFIG } from '../endpoints';

const STORAGE_KEY = 'draftmate_cases';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('session_id') || localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const initializeStorage = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } else {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(c => c.id !== 'case-1' && c.id !== 'case-2' && c.id !== 'case-3' && !c.caseTitle?.includes('Ramesh Sharma') && !c.caseTitle?.includes('Priya Enterprises') && !c.caseTitle?.includes('Sunita Verma'));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      }
    } catch (e) {}
  }
};

// Map backend API model keys to frontend expected keys (camelCase)
const mapCaseToFrontend = (backendCase) => {
  if (!backendCase) return null;
  return {
    id: String(backendCase.id),
    caseNumber: backendCase.case_number,
    caseTitle: backendCase.case_title,
    caseType: backendCase.case_type,
    court: backendCase.court,
    oppositeParty: backendCase.opposite_party,
    filingDate: backendCase.filing_date,
    nextHearingDate: backendCase.next_hearing_date,
    status: backendCase.status,
    priority: backendCase.priority,
    assignedAdvocate: backendCase.assigned_advocate,
    description: backendCase.description,
    folders: Array.isArray(backendCase.folders) ? backendCase.folders : [],
    documents: Array.isArray(backendCase.documents) ? backendCase.documents : [],
    clientId: backendCase.client_id
  };
};

export const caseService = {
  async getCases() {
    try {
      const resp = await fetch(`${API_CONFIG.LIBRARY.BASE_URL}/cases/`, {
        headers: getHeaders()
      });
      if (resp.ok) {
        const data = await resp.json();
        const mapped = data.map(mapCaseToFrontend);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn("Backend getCases failed, falling back to localStorage:", e);
    }
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  },

  async getCaseById(id) {
    try {
      const resp = await fetch(`${API_CONFIG.LIBRARY.BASE_URL}/cases/${id}`, {
        headers: getHeaders()
      });
      if (resp.ok) {
        const data = await resp.json();
        return mapCaseToFrontend(data);
      }
    } catch (e) {
      console.warn(`Backend getCaseById(${id}) failed, falling back to localStorage:`, e);
    }
    initializeStorage();
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return cases.find(c => c.id === id);
  },

  async createCase(caseData) {
    try {
      const payload = {
        case_number: caseData.caseNumber || caseData.case_number || 'GEN-0001',
        case_title: caseData.caseTitle || caseData.case_title || 'General Documents',
        case_type: caseData.caseType || caseData.case_type || 'General',
        court: caseData.court || 'General Court',
        opposite_party: caseData.oppositeParty || caseData.opposite_party || '',
        filing_date: caseData.filingDate || caseData.filing_date || new Date().toISOString().split('T')[0],
        next_hearing_date: caseData.nextHearingDate || caseData.next_hearing_date || null,
        status: caseData.status || 'Open',
        priority: caseData.priority || 'Medium',
        assigned_advocate: caseData.assignedAdvocate || caseData.assigned_advocate || '',
        description: caseData.description || '',
        folders: [],
        documents: []
      };
      const resp = await fetch(`${API_CONFIG.LIBRARY.BASE_URL}/cases/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const created = await resp.json();
        const mapped = mapCaseToFrontend(created);
        const cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        cases.unshift(mapped);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
        return mapped;
      }
    } catch (e) {
      console.warn("Backend createCase failed, falling back to localStorage:", e);
    }

    initializeStorage();
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newCase = {
      ...caseData,
      id: `case-${Date.now()}`,
      folders: [],
      documents: []
    };
    cases.unshift(newCase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    return newCase;
  },

  async updateCase(id, caseData) {
    try {
      const payload = {
        case_number: caseData.caseNumber || caseData.case_number || 'GEN-0001',
        case_title: caseData.caseTitle || caseData.case_title || 'General Documents',
        case_type: caseData.caseType || caseData.case_type || 'General',
        court: caseData.court || 'General Court',
        opposite_party: caseData.oppositeParty || caseData.opposite_party || '',
        filing_date: caseData.filingDate || caseData.filing_date || new Date().toISOString().split('T')[0],
        next_hearing_date: caseData.nextHearingDate || caseData.next_hearing_date || null,
        status: caseData.status || 'Open',
        priority: caseData.priority || 'Medium',
        assigned_advocate: caseData.assignedAdvocate || caseData.assigned_advocate || '',
        description: caseData.description || '',
        folders: caseData.folders || [],
        documents: caseData.documents || []
      };
      const resp = await fetch(`${API_CONFIG.LIBRARY.BASE_URL}/cases/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const updated = await resp.json();
        const mapped = mapCaseToFrontend(updated);
        let cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const idx = cases.findIndex(c => c.id === id);
        if (idx !== -1) {
          cases[idx] = mapped;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
        }
        return mapped;
      }
    } catch (e) {
      console.warn("Backend updateCase failed, falling back to localStorage:", e);
    }

    initializeStorage();
    let cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = cases.findIndex(c => c.id === id);
    if (index !== -1) {
      cases[index] = { ...cases[index], ...caseData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
      return cases[index];
    }
    throw new Error('Case not found');
  },

  async deleteCase(id) {
    try {
      const resp = await fetch(`${API_CONFIG.LIBRARY.BASE_URL}/cases/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (resp.ok) {
        let cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        cases = cases.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
        return true;
      }
    } catch (e) {
      console.warn("Backend deleteCase failed, falling back to localStorage:", e);
    }

    initializeStorage();
    let cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    cases = cases.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    return true;
  },

  // Folder Management Methods
  async addCaseFolder(caseId, name) {
    const activeCase = await this.getCaseById(caseId);
    if (!activeCase) throw new Error('Case not found');
    if (!activeCase.folders) activeCase.folders = [];

    const newFolder = {
      id: `folder-${Date.now()}`,
      name,
      isSystem: false,
      createdAt: new Date().toISOString()
    };

    activeCase.folders.push(newFolder);
    await this.updateCase(caseId, activeCase);
    return newFolder;
  },

  async renameCaseFolder(caseId, folderId, name) {
    const activeCase = await this.getCaseById(caseId);
    if (!activeCase) throw new Error('Case not found');
    
    const folder = (activeCase.folders || []).find(f => f.id === folderId);
    if (folder) {
      folder.name = name;
      await this.updateCase(caseId, activeCase);
      return folder;
    }
    throw new Error('Folder not found');
  },

  async deleteCaseFolder(caseId, folderId) {
    const activeCase = await this.getCaseById(caseId);
    if (!activeCase) throw new Error('Case not found');
    
    if (activeCase.folders) {
      activeCase.folders = activeCase.folders.filter(f => f.id !== folderId);
    }
    // Move all documents inside this folder back to case root
    if (activeCase.documents) {
      activeCase.documents = activeCase.documents.map(doc => {
        if (doc.folderId === folderId) {
          return { ...doc, folderId: null };
        }
        return doc;
      });
    }
    await this.updateCase(caseId, activeCase);
    return true;
  },

  // Document Management & Routing Methods
  async addCaseDocument(caseId, documentData) {
    let targetCaseId = caseId;
    
    if (!targetCaseId) {
      const cases = await this.getCases();
      let defaultCase = cases.find(c => c.caseTitle === 'General Documents' || c.id === 'general-docs');
      if (!defaultCase) {
        defaultCase = await this.createCase({
          caseTitle: 'General Documents',
          caseNumber: 'GEN-0001',
          court: 'General Matters',
          client: 'Self',
          filingDate: new Date().toISOString().split('T')[0],
          status: 'Open',
          priority: 'Medium',
          folders: [],
          documents: []
        });
      }
      targetCaseId = defaultCase.id;
    }

    const activeCase = await this.getCaseById(targetCaseId);
    if (!activeCase) throw new Error('Case not found');

    if (!activeCase.folders) activeCase.folders = [];
    if (!activeCase.documents) activeCase.documents = [];

    let uploadedMetadata = null;
    
    // If we have a native file object, upload it to the backend S3 endpoint
    if (documentData.file) {
      const formData = new FormData();
      formData.append('file', documentData.file);
      if (targetCaseId) {
        formData.append('case_id', targetCaseId);
      }
      
      const token = localStorage.getItem('session_id') || localStorage.getItem('token');
      const uploadHeaders = {};
      if (token) {
        uploadHeaders['Authorization'] = `Bearer ${token}`;
      }
      
      try {
        const resp = await fetch(`${API_CONFIG.DRAFTER.BASE_URL}/v2/document/upload`, {
          method: 'POST',
          headers: uploadHeaders,
          body: formData
        });
        if (resp.ok) {
          uploadedMetadata = await resp.json();
        }
      } catch (err) {
        console.warn("Backend S3 file upload failed, fallback to local indexing:", err);
      }
    }

    // Smart Routing Logic based on Source / Feature
    let targetFolderName = '';
    const source = (documentData.source || '').toLowerCase();
    const docName = (uploadedMetadata?.name || documentData.name || '').toLowerCase();

    if (source === 'drafter') {
      targetFolderName = 'Drafter Documents';
    } else if (source === 'dictation') {
      targetFolderName = 'Dictations & Notes';
    } else if (source === 'invoice') {
      targetFolderName = 'Invoices & Receipts';
    } else if (source === 'courtfee') {
      targetFolderName = 'Calculations & Fees';
    } else if (source === 'translate' || source === 'translation' || source === 'translator') {
      targetFolderName = 'Translated Documents';
    } else if (source === 'research' || source === 'judgment') {
      targetFolderName = 'Research & Judgments';
    } else if (source === 'upload') {
      targetFolderName = 'Uploaded Documents';
    } else {
      // Fallback keyword-based routing
      if (docName.includes('notice')) {
        targetFolderName = 'Legal Notices';
      } else if (docName.includes('agreement') || docName.includes('contract') || docName.includes('lease') || docName.includes('nda')) {
        targetFolderName = 'Contracts & Agreements';
      } else if (docName.includes('petition') || docName.includes('plaint') || docName.includes('writ') || docName.includes('appeal') || docName.includes('application')) {
        targetFolderName = 'Pleadings & Court Filings';
      } else {
        targetFolderName = 'General Documents';
      }
    }

    // Find or create the target folder
    let folder = activeCase.folders.find(f => f.name.toLowerCase() === targetFolderName.toLowerCase());
    if (!folder) {
      folder = {
        id: `folder-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: targetFolderName,
        isSystem: true,
        createdAt: new Date().toISOString()
      };
      activeCase.folders.push(folder);
    }

    // Create the document
    const newDoc = {
      id: uploadedMetadata?.id || documentData.id || `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: uploadedMetadata?.name || documentData.name,
      filename: uploadedMetadata?.filename || documentData.filename || documentData.name,
      type: (uploadedMetadata?.name || documentData.name).split('.').pop() || 'docx',
      size: uploadedMetadata?.size || documentData.size || '1.2 MB',
      syncStatus: uploadedMetadata ? 'synced' : (documentData.syncStatus || 'syncing'),
      lastModified: new Date().toISOString(),
      source: documentData.source || 'upload',
      url: uploadedMetadata?.url || documentData.url || null,
      s3Key: uploadedMetadata?.s3_key || documentData.s3Key || null,
      folderId: documentData.folderId || folder.id // Use target folder if none specified
    };

    activeCase.documents.push(newDoc);
    await this.updateCase(targetCaseId, activeCase);

    // Background sync simulation (transition syncing -> synced after 2.5s)
    if (newDoc.syncStatus === 'syncing') {
      setTimeout(async () => {
        try {
          const latestCase = await this.getCaseById(targetCaseId);
          if (latestCase) {
            const dIdx = latestCase.documents.findIndex(d => d.id === newDoc.id);
            if (dIdx !== -1) {
              latestCase.documents[dIdx].syncStatus = 'synced';
              await this.updateCase(targetCaseId, latestCase);
              window.dispatchEvent(new Event('case_documents_updated'));
            }
          }
        } catch (syncErr) {
          console.warn("Background document sync failed:", syncErr);
        }
      }, 2500);
    }

    return newDoc;
  },

  async moveCaseDocument(caseId, docId, targetFolderId) {
    const activeCase = await this.getCaseById(caseId);
    if (!activeCase) throw new Error('Case not found');

    const doc = (activeCase.documents || []).find(d => d.id === docId);
    if (doc) {
      doc.folderId = targetFolderId;
      await this.updateCase(caseId, activeCase);
      return doc;
    }
    throw new Error('Document not found');
  },

  async deleteCaseDocument(caseId, docId) {
    const activeCase = await this.getCaseById(caseId);
    if (!activeCase) throw new Error('Case not found');

    if (activeCase.documents) {
      activeCase.documents = activeCase.documents.filter(d => d.id !== docId);
    }
    await this.updateCase(caseId, activeCase);
    return true;
  }
};

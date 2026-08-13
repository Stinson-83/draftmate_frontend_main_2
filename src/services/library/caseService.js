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
    } catch (e) {
      console.warn('[caseService] Seed storage cleanup notice:', e);
    }
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
  };
};

export const caseService = {
  async getCases() {
    const deletedIds = new Set(JSON.parse(localStorage.getItem('draftmate_deleted_doc_ids') || '[]'));

    const cleanDocNameStr = (raw) => {
      if (!raw) return raw;
      return raw
        .replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}[_-]?/, '')
        .replace(/^[0-9a-fA-F]{32}[_-]?/, '')
        .replace(/^Translated_([A-Z]{2})-[A-Z]{2}_/i, 'Translated_$1_');
    };

    const filterDeletedDocs = (c) => {
      if (!c) return c;
      if (c.documents && c.documents.length > 0) {
        const seenIds = new Set();
        const seenNames = new Set();
        c.documents = c.documents.filter(d => {
          if (d.name) d.name = cleanDocNameStr(d.name);
          if (d.filename) d.filename = cleanDocNameStr(d.filename);
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
      return c;
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const resp = await fetch(`${API_CONFIG.LIBRARY.BASE_URL}/cases/`, {
        headers: getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data = await resp.json();
        const mapped = data.map(mapCaseToFrontend).map(filterDeletedDocs);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn("Backend getCases failed/timed out, falling back to localStorage:", e);
    }
    initializeStorage();
    const localCases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return localCases.map(filterDeletedDocs);
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
        window.dispatchEvent(new Event('cases_updated'));
        window.dispatchEvent(new Event('case_documents_updated'));
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
    window.dispatchEvent(new Event('cases_updated'));
    window.dispatchEvent(new Event('case_documents_updated'));
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
          if (caseData.documents && mapped.documents) {
            mapped.documents = mapped.documents.map(mDoc => {
              const localDoc = caseData.documents.find(d => String(d.id) === String(mDoc.id) || (d.name && d.name.toLowerCase() === (mDoc.name || '').toLowerCase()));
              if (localDoc && localDoc.url && !mDoc.url) {
                return { ...mDoc, url: localDoc.url };
              }
              return mDoc;
            });
          }
          cases[idx] = mapped;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
        }
        window.dispatchEvent(new Event('cases_updated'));
        window.dispatchEvent(new Event('case_documents_updated'));
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
      window.dispatchEvent(new Event('cases_updated'));
      window.dispatchEvent(new Event('case_documents_updated'));
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
        window.dispatchEvent(new Event('cases_updated'));
        window.dispatchEvent(new Event('case_documents_updated'));
        return true;
      }
    } catch (e) {
      console.warn("Backend deleteCase failed, falling back to localStorage:", e);
    }

    initializeStorage();
    let cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    cases = cases.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    window.dispatchEvent(new Event('cases_updated'));
    window.dispatchEvent(new Event('case_documents_updated'));
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
    
    // Auto-create File object if text/content is provided without binary File payload
    let targetFile = documentData.file;
    if (!targetFile && (documentData.content || documentData.text)) {
      const rawText = documentData.content || documentData.text || '';
      const textContent = rawText.startsWith('data:') ? atob(rawText.split(',')[1] || '') : rawText;
      const fileName = documentData.filename || documentData.name || 'document.txt';
      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      const mimeType = isPdf ? 'application/pdf' : 'text/plain;charset=utf-8';
      const fileBuffer = isPdf ? textContent : ('\uFEFF' + textContent);
      targetFile = new File([fileBuffer], fileName, { type: mimeType });
    }

    // Upload binary file directly to AWS S3 backend storage endpoint
    if (targetFile) {
      const formData = new FormData();
      formData.append('file', targetFile);
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
        console.warn("Backend S3 file upload warning, fallback to local indexing:", err);
      }
    }

    // Determine folder placement: Use explicit folderId if provided, otherwise apply smart folder routing
    let targetFolderId = documentData.folderId;

    if (targetFolderId === undefined) {
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
      } else if (source === 'pdfeditor' || source === 'pdf' || source === 'converter') {
        targetFolderName = 'PDF & Converted Files';
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
      targetFolderId = folder.id;
    }

    // Check if document already exists by ID or filename to prevent duplicate rows
    const targetName = (uploadedMetadata?.name || documentData.name || documentData.filename || '').toLowerCase();
    const targetId = String(uploadedMetadata?.id || documentData.id || '');

    const existingIdx = activeCase.documents.findIndex(d => 
      (targetId && String(d.id) === targetId) || 
      (targetName && (d.name || '').toLowerCase() === targetName) ||
      (targetName && (d.filename || '').toLowerCase() === targetName)
    );

    if (existingIdx !== -1) {
      activeCase.documents[existingIdx] = {
        ...activeCase.documents[existingIdx],
        name: uploadedMetadata?.name || documentData.name || activeCase.documents[existingIdx].name,
        filename: uploadedMetadata?.filename || documentData.filename || activeCase.documents[existingIdx].filename,
        url: uploadedMetadata?.url || documentData.url || activeCase.documents[existingIdx].url,
        syncStatus: 'synced',
        folderId: targetFolderId !== undefined ? targetFolderId : activeCase.documents[existingIdx].folderId,
        lastModified: new Date().toISOString()
      };
      await this.updateCase(targetCaseId, activeCase);
      return activeCase.documents[existingIdx];
    }

    const localBlobUrl = (targetFile && typeof URL !== 'undefined' && URL.createObjectURL) 
      ? URL.createObjectURL(targetFile) 
      : null;

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
      url: uploadedMetadata?.url || documentData.url || localBlobUrl || null,
      s3Key: uploadedMetadata?.s3_key || documentData.s3Key || null,
      folderId: targetFolderId !== undefined ? targetFolderId : null
    };

    activeCase.documents.push(newDoc);
    await this.updateCase(targetCaseId, activeCase);

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
    const deletedIds = new Set(JSON.parse(localStorage.getItem('draftmate_deleted_doc_ids') || '[]'));
    deletedIds.add(String(docId));

    const cases = await this.getCases();
    let targetCase = null;

    if (caseId) {
      targetCase = cases.find(c => c.id === caseId);
    }
    if (!targetCase) {
      targetCase = cases.find(c => (c.documents || []).some(d => String(d.id) === String(docId)));
    }
    if (!targetCase) {
      targetCase = cases.find(c => c.caseTitle === 'General Documents' || c.id === 'general-docs');
    }

    if (targetCase && targetCase.documents) {
      const targetDoc = targetCase.documents.find(d => String(d.id) === String(docId));
      if (targetDoc) {
        if (targetDoc.name) deletedIds.add(targetDoc.name.toLowerCase().trim());
        if (targetDoc.filename) deletedIds.add(targetDoc.filename.toLowerCase().trim());
      }
      targetCase.documents = targetCase.documents.filter(d => {
        if (String(d.id) === String(docId)) return false;
        if (targetDoc?.name && (d.name || '').toLowerCase().trim() === targetDoc.name.toLowerCase().trim()) return false;
        if (targetDoc?.filename && (d.filename || '').toLowerCase().trim() === targetDoc.filename.toLowerCase().trim()) return false;
        return true;
      });
      await this.updateCase(targetCase.id, targetCase);
    }

    localStorage.setItem('draftmate_deleted_doc_ids', JSON.stringify(Array.from(deletedIds)));

    // Purge from all cases in localStorage
    const localCases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updatedLocalCases = localCases.map(c => ({
      ...c,
      documents: (c.documents || []).filter(d => {
        if (String(d.id) === String(docId)) return false;
        const nameKey = (d.name || d.filename || '').toLowerCase().trim();
        if (nameKey && deletedIds.has(nameKey)) return false;
        return true;
      })
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocalCases));

    window.dispatchEvent(new Event('cases_updated'));
    window.dispatchEvent(new Event('case_documents_updated'));

    return true;
  }
};

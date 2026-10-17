import { API_CONFIG } from '../endpoints';

const BASE_URL = `${API_CONFIG.LIBRARY.BASE_URL}/api/v1/library/notes`;

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('session_id') || localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const mapNoteToFrontend = (n) => ({
  id: String(n.id),
  title: n.title,
  content: n.content,
  tags: Array.isArray(n.tags) ? n.tags : [],
  caseId: n.case_id ? String(n.case_id) : null,
  linkedActId: n.linked_act_id,
  linkedChapterId: n.linked_chapter_id,
  linkedSectionNumber: n.linked_section_number,
  createdAt: n.created_at,
  updatedAt: n.updated_at,
});

export const notesService = {
  getNotes: async (search = null, tag = null) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tag) params.append('tag', tag);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${BASE_URL}/${queryStr}`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data.map(mapNoteToFrontend) : [];
      }
    } catch (e) {
      console.error('[notesService] Failed to load notes from API:', e);
    }
    return [];
  },

  getNoteById: async (noteId) => {
    const response = await fetch(`${BASE_URL}/${noteId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get note: ${response.statusText}`);
    }
    const data = await response.json();
    return mapNoteToFrontend(data);
  },

  createNote: async (noteData) => {
    const payload = {
      title: noteData.title,
      content: noteData.content,
      tags: noteData.tags || [],
      case_id: noteData.caseId || null,
      linked_act_id: noteData.linkedActId || null,
      linked_chapter_id: noteData.linkedChapterId || null,
      linked_section_number: noteData.linkedSectionNumber || null,
    };
    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to create note: ${response.statusText}`);
    }
    const data = await response.json();
    return mapNoteToFrontend(data);
  },

  updateNote: async (noteId, updates) => {
    const payload = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.caseId !== undefined) payload.case_id = updates.caseId;
    if (updates.linkedActId !== undefined) payload.linked_act_id = updates.linkedActId;
    if (updates.linkedChapterId !== undefined) payload.linked_chapter_id = updates.linkedChapterId;
    if (updates.linkedSectionNumber !== undefined) payload.linked_section_number = updates.linkedSectionNumber;

    const response = await fetch(`${BASE_URL}/${noteId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to update note: ${response.statusText}`);
    }
    const data = await response.json();
    return mapNoteToFrontend(data);
  },

  deleteNote: async (noteId) => {
    const response = await fetch(`${BASE_URL}/${noteId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete note: ${response.statusText}`);
    }
    return true;
  }
};

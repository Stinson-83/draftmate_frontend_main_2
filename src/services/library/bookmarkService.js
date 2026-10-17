import { API_CONFIG } from '../endpoints';

const BASE_URL = `${API_CONFIG.LIBRARY.BASE_URL}/api/v1/library/bookmarks`;

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('session_id') || localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const bookmarkService = {
  getFolders: async () => {
    try {
      const response = await fetch(`${BASE_URL}/folders`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.error('[bookmarkService] Failed to load folders from API:', e);
    }
    return [];
  },

  addFolder: async (name) => {
    const response = await fetch(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }
    return await response.json();
  },

  getBookmarks: async (folderId = null) => {
    try {
      const url = folderId && folderId !== 'all'
        ? `${BASE_URL}/?folder_id=${encodeURIComponent(folderId)}`
        : `${BASE_URL}/`;
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data.map(b => ({
          id: String(b.id),
          folderId: b.folder_id ? String(b.folder_id) : null,
          actId: b.act_id,
          actName: b.act_name,
          chapterId: b.chapter_id,
          sectionNumber: b.section_number,
          sectionTitle: b.section_title,
          createdAt: b.created_at,
        })) : [];
      }
    } catch (e) {
      console.error('[bookmarkService] Failed to load bookmarks from API:', e);
    }
    return [];
  },

  addBookmark: async (bookmarkData) => {
    const payload = {
      folder_id: bookmarkData.folderId || null,
      act_id: bookmarkData.actId || null,
      act_name: bookmarkData.actName || null,
      chapter_id: bookmarkData.chapterId || null,
      section_number: bookmarkData.sectionNumber || null,
      section_title: bookmarkData.sectionTitle || null,
    };
    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to save bookmark: ${response.statusText}`);
    }
    const b = await response.json();
    return {
      id: String(b.id),
      folderId: b.folder_id ? String(b.folder_id) : null,
      actId: b.act_id,
      actName: b.act_name,
      chapterId: b.chapter_id,
      sectionNumber: b.section_number,
      sectionTitle: b.section_title,
      createdAt: b.created_at,
    };
  },

  removeBookmark: async (bookmarkId) => {
    const response = await fetch(`${BASE_URL}/${bookmarkId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to remove bookmark: ${response.statusText}`);
    }
    return true;
  },

  isBookmarked: async (actId, sectionNumber) => {
    try {
      const bookmarks = await bookmarkService.getBookmarks();
      if (sectionNumber !== undefined && sectionNumber !== null) {
        return bookmarks.find(b => b.actId === actId && b.sectionNumber === sectionNumber);
      }
      return bookmarks.find(b => b.actId === actId);
    } catch {
      return null;
    }
  }
};

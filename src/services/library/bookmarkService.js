// bookmarkService.js
// Mock service using localStorage to act as a backend for the Library_Service

const BOOKMARKS_KEY = 'draftmate_library_bookmarks';
const FOLDERS_KEY = 'draftmate_library_bookmark_folders';

const defaultFolders = [
  { id: 'criminal', name: 'Criminal Law' },
  { id: 'civil', name: 'Civil Law' },
  { id: 'corporate', name: 'Corporate Law' },
  { id: 'constitutional', name: 'Constitutional Law' }
];

export const bookmarkService = {
  getFolders: async () => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 100));
    const folders = localStorage.getItem(FOLDERS_KEY);
    if (!folders) {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(defaultFolders));
      return defaultFolders;
    }
    return JSON.parse(folders);
  },

  addFolder: async (name) => {
    await new Promise(r => setTimeout(r, 100));
    const folders = await bookmarkService.getFolders();
    const newFolder = { id: Date.now().toString(), name };
    folders.push(newFolder);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    return newFolder;
  },

  getBookmarks: async () => {
    await new Promise(r => setTimeout(r, 100));
    const bookmarks = localStorage.getItem(BOOKMARKS_KEY);
    return bookmarks ? JSON.parse(bookmarks) : [];
  },

  addBookmark: async (bookmarkData) => {
    await new Promise(r => setTimeout(r, 100));
    const bookmarks = await bookmarkService.getBookmarks();
    // bookmarkData structure: { actId, actName, chapterId, sectionNumber, sectionTitle, folderId }
    const newBookmark = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...bookmarkData
    };
    bookmarks.push(newBookmark);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return newBookmark;
  },

  removeBookmark: async (bookmarkId) => {
    await new Promise(r => setTimeout(r, 100));
    let bookmarks = await bookmarkService.getBookmarks();
    bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return true;
  },
  
  isBookmarked: async (actId, sectionNumber) => {
      const bookmarks = await bookmarkService.getBookmarks();
      if (sectionNumber !== undefined && sectionNumber !== null) {
        return bookmarks.find(b => b.actId === actId && b.sectionNumber === sectionNumber);
      }
      return bookmarks.find(b => b.actId === actId);
  }
};

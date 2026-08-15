// notesService.js
// Mock service using localStorage to act as a backend for the Library_Service

const NOTES_KEY = 'draftmate_library_notes';

export const notesService = {
  getNotes: async () => {
    await new Promise(r => setTimeout(r, 100));
    const notes = localStorage.getItem(NOTES_KEY);
    return notes ? JSON.parse(notes) : [];
  },

  createNote: async (noteData) => {
    await new Promise(r => setTimeout(r, 100));
    const notes = await notesService.getNotes();
    // noteData structure: { title, content, tags, linkedActId, linkedChapterId, linkedSectionNumber }
    const newNote = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...noteData
    };
    notes.push(newNote);
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return newNote;
  },

  updateNote: async (noteId, updates) => {
    await new Promise(r => setTimeout(r, 100));
    let notes = await notesService.getNotes();
    const index = notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      return notes[index];
    }
    throw new Error('Note not found');
  },

  deleteNote: async (noteId) => {
    await new Promise(r => setTimeout(r, 100));
    let notes = await notesService.getNotes();
    notes = notes.filter(n => n.id !== noteId);
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return true;
  }
};

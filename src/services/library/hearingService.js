import { mockHearings } from '../../data/mockHearings';

const STORAGE_KEY = 'draftmate_hearings';

const initializeStorage = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } else {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(h => h.id !== 'h1' && h.id !== 'h2' && h.id !== 'h3' && !h.caseTitle?.includes('Ramesh Sharma') && !h.caseTitle?.includes('Priya Enterprises') && !h.caseTitle?.includes('Sunita Verma'));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      }
    } catch (e) {}
  }
};

export const hearingService = {
  async getHearings() {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  },

  async getHearingById(id) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    const hearings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return hearings.find(h => h.id === id);
  },

  async createHearing(hearingData) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    const hearings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newHearing = {
      ...hearingData,
      id: `h${Date.now()}`,
      timeline: [],
    };
    hearings.unshift(newHearing);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hearings));
    window.dispatchEvent(new Event('hearings_updated'));
    window.dispatchEvent(new Event('cases_updated'));
    return newHearing;
  },

  async updateHearing(id, hearingData) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    let hearings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = hearings.findIndex(h => h.id === id);
    if (index !== -1) {
      hearings[index] = { ...hearings[index], ...hearingData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hearings));
      window.dispatchEvent(new Event('hearings_updated'));
      window.dispatchEvent(new Event('cases_updated'));
      return hearings[index];
    }
    throw new Error('Hearing not found');
  },

  async deleteHearing(id) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    let hearings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    hearings = hearings.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hearings));
    window.dispatchEvent(new Event('hearings_updated'));
    window.dispatchEvent(new Event('cases_updated'));
    return true;
  },
};

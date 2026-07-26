import { mockTrackingCases } from '../../data/mockTrackingCases';

const STORAGE_KEY = 'draftmate_tracked_cases';

const initializeStorage = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } else {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(c => c.id !== 'tracking-1' && c.id !== 'tracking-2' && !c.caseTitle?.includes('Ramesh Sharma') && !c.caseTitle?.includes('Priya Enterprises'));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      }
    } catch (e) {
      console.warn('[trackingService] Storage init notice:', e);
    }
  }
};

export const trackingService = {
  async getTrackedCases() {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  },

  async getTrackedCaseById(id) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return cases.find(c => c.id === id);
  },

  async createTrackedCase(caseData) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newCase = {
      ...caseData,
      id: `tracking-${Date.now()}`
    };
    cases.unshift(newCase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    return newCase;
  },

  async updateTrackedCase(id, caseData) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    let cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = cases.findIndex(c => c.id === id);
    if (index !== -1) {
      cases[index] = { ...cases[index], ...caseData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
      return cases[index];
    }
    throw new Error('Tracked case not found');
  },

  async deleteTrackedCase(id) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    let cases = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    cases = cases.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    return true;
  }
};

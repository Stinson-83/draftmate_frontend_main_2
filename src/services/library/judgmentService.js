// judgmentService.js
// localStorage-based service — swap body with Library_Service API calls when ready.

import { mockJudgments, judgmentCategories, judgmentCourts } from '../../data/mockJudgments';

const SAVED_JUDGMENTS_KEY = 'draftmate_saved_judgments';

export const judgmentService = {
  getJudgments: async () => {
    await new Promise(r => setTimeout(r, 200));
    return mockJudgments;
  },

  getJudgmentById: async (judgmentId) => {
    await new Promise(r => setTimeout(r, 200));
    return mockJudgments.find(j => j.id === judgmentId);
  },

  searchJudgments: async (query, court = 'All') => {
    await new Promise(r => setTimeout(r, 200));
    let results = [...mockJudgments];

    if (court !== 'All') {
      results = results.filter(j => j.court === court);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(j => 
        j.title.toLowerCase().includes(lowerQuery) ||
        j.citation.toLowerCase().includes(lowerQuery) ||
        j.court.toLowerCase().includes(lowerQuery) ||
        j.judges.some(judge => judge.toLowerCase().includes(lowerQuery)) ||
        j.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        j.parties.petitioner.toLowerCase().includes(lowerQuery) ||
        j.parties.respondent.toLowerCase().includes(lowerQuery)
      );
    }

    return results;
  },

  getCategories: async () => {
    await new Promise(r => setTimeout(r, 100));
    return judgmentCategories;
  },

  getCourts: async () => {
    await new Promise(r => setTimeout(r, 100));
    return judgmentCourts;
  },

  getSavedJudgments: async () => {
    await new Promise(r => setTimeout(r, 100));
    return JSON.parse(localStorage.getItem(SAVED_JUDGMENTS_KEY) || '[]');
  },

  saveJudgment: async (judgment) => {
    await new Promise(r => setTimeout(r, 100));
    const saved = await judgmentService.getSavedJudgments();
    const exists = saved.find(j => j.id === judgment.id);
    if (!exists) {
      saved.unshift({ ...judgment, savedAt: new Date().toISOString() });
      localStorage.setItem(SAVED_JUDGMENTS_KEY, JSON.stringify(saved));
    }
    return true;
  },

  removeJudgment: async (judgmentId) => {
    await new Promise(r => setTimeout(r, 100));
    let saved = await judgmentService.getSavedJudgments();
    saved = saved.filter(j => j.id !== judgmentId);
    localStorage.setItem(SAVED_JUDGMENTS_KEY, JSON.stringify(saved));
    return true;
  },

  isSaved: async (judgmentId) => {
    const saved = await judgmentService.getSavedJudgments();
    return !!saved.find(j => j.id === judgmentId);
  },
};

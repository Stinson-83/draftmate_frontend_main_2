// Saved judgments stay in the browser. Search and detail use the legal API.

import { getLegalJudgment } from './judgmentApi';

const SAVED_JUDGMENTS_KEY = 'draftmate_saved_judgments';

export const judgmentService = {
  getJudgmentById: async (judgmentId) => getLegalJudgment(judgmentId),

  getSavedJudgments: async () => {
    return JSON.parse(localStorage.getItem(SAVED_JUDGMENTS_KEY) || '[]');
  },

  saveJudgment: async (judgment) => {
    const saved = await judgmentService.getSavedJudgments();
    const exists = saved.find((item) => item.id === judgment.id);
    if (!exists) {
      saved.unshift({ ...judgment, savedAt: new Date().toISOString() });
      localStorage.setItem(SAVED_JUDGMENTS_KEY, JSON.stringify(saved));
    }
    return true;
  },

  removeJudgment: async (judgmentId) => {
    const saved = (await judgmentService.getSavedJudgments()).filter((item) => item.id !== judgmentId);
    localStorage.setItem(SAVED_JUDGMENTS_KEY, JSON.stringify(saved));
    return true;
  },

  isSaved: async (judgmentId) => {
    const saved = await judgmentService.getSavedJudgments();
    return !!saved.find((item) => item.id === judgmentId);
  },
};

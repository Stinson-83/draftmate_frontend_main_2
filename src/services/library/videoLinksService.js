import { mockVideoLinks } from '../../data/mockVideoLinks';

const STORAGE_KEY = 'draftmate_video_links';

const initializeStorage = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } else {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(l => !l.caseTitle?.includes('Ramesh Sharma') && !l.caseTitle?.includes('Priya Enterprises'));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      }
    } catch (e) {
      console.warn('[videoLinksService] Storage init notice:', e);
    }
  }
};

export const videoLinksService = {
  async getLinks() {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  },

  async getLinkById(id) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    const links = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return links.find(link => link.id === id);
  },

  async createLink(linkData) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    const links = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newLink = {
      ...linkData,
      id: `vl${Date.now()}`
    };
    links.unshift(newLink);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    return newLink;
  },

  async updateLink(id, linkData) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    let links = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = links.findIndex(link => link.id === id);
    if (index !== -1) {
      links[index] = { ...links[index], ...linkData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
      return links[index];
    }
    throw new Error('Link not found');
  },

  async deleteLink(id) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    let links = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    links = links.filter(link => link.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    return true;
  }
};

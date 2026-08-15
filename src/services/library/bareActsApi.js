import { API_CONFIG } from '../../services/endpoints';
import * as localBareActsService from './localBareActsService';

// 5-minute cache
const CACHE_TTL = 5 * 60 * 1000; 
const cache = new Map();

const getCacheKey = (key) => `bareacts:${key}`;

const getCached = (key) => {
  const cached = cache.get(getCacheKey(key));
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCached = (key, data) => {
  cache.set(getCacheKey(key), { data, timestamp: Date.now() });
};

const clearCache = () => {
  cache.clear();
};

const fetchBareActsEndpoint = async (endpoint) => {
  const url = `${API_CONFIG.LIBRARY.BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const json = await response.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.warn("Backend Bare Acts API unavailable, using local registry fallback:", err);
    return null;
  }
};

export const bareActsApi = {
  async getActs() {
    const cached = getCached('acts');
    if (cached) return cached;
    let data = await fetchBareActsEndpoint(API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.GET_ACTS);
    if (!data || data.length === 0) {
      data = localBareActsService.getActs();
    }
    setCached('acts', data);
    return data;
  },

  async getActById(actId) {
    const cached = getCached(`act:${actId}`);
    if (cached) return cached;
    let data = await fetchBareActsEndpoint(API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.GET_ACT(actId));
    if (!data) {
      data = localBareActsService.getActById(actId);
    }
    setCached(`act:${actId}`, data);
    return data;
  },

  async getSections(actId, chapterId = null) {
    const cached = getCached(`sections:${actId}:${chapterId}`);
    if (cached) return cached;
    let url = API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.GET_SECTIONS(actId);
    if (chapterId) {
      url += `?chapter_id=${chapterId}`;
    }
    let data = await fetchBareActsEndpoint(url);
    if (!data || data.length === 0) {
      data = localBareActsService.getSections(actId, chapterId);
    }
    setCached(`sections:${actId}:${chapterId}`, data);
    return data;
  },

  async searchActs(query) {
    const cached = getCached(`search:acts:${query}`);
    if (cached) return cached;
    const url = `${API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.SEARCH_ACTS}?query=${encodeURIComponent(query)}`;
    let data = await fetchBareActsEndpoint(url);
    if (!data || data.length === 0) {
      data = localBareActsService.searchActs(query);
    }
    setCached(`search:acts:${query}`, data);
    return data;
  },

  async searchSections(query) {
    const cached = getCached(`search:sections:${query}`);
    if (cached) return cached;
    const url = `${API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.SEARCH_SECTIONS}?query=${encodeURIComponent(query)}`;
    let data = await fetchBareActsEndpoint(url);
    if (!data || data.length === 0) {
      data = localBareActsService.searchSections(query);
    }
    setCached(`search:sections:${query}`, data);
    return data;
  },

  async getCategories() {
    const cached = getCached('categories');
    if (cached) return cached;
    let data = await fetchBareActsEndpoint(API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.GET_CATEGORIES);
    if (!data || data.length === 0) {
      data = localBareActsService.getCategories();
    }
    setCached('categories', data);
    return data;
  },

  async clearCache() {
    clearCache();
  }
};

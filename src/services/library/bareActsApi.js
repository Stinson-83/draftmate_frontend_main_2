import { API_CONFIG } from '../../services/endpoints';

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
    if (!json.success) {
      throw new Error("Backend API error: " + JSON.stringify(json));
    }
    return json.data;
  } catch (err) {
    console.error("Backend Bare Acts API unavailable:", err);
    throw err;
  }
};

export const bareActsApi = {
  async getActs(page = 1, pageSize = 20, state = null, category = null, jurisdiction = null, status = null) {
    const queryParams = new URLSearchParams({ page, pageSize });
    if (state) queryParams.append('state', state);
    if (category) queryParams.append('category', category);
    if (jurisdiction) queryParams.append('jurisdiction', jurisdiction);
    if (status) queryParams.append('status', status);

    const url = `${API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.GET_ACTS}?${queryParams.toString()}`;
    const data = await fetchBareActsEndpoint(url);
    return data;
  },

  async getActById(actId) {
    const cached = getCached(`act:${actId}`);
    if (cached) return cached;
    const data = await fetchBareActsEndpoint(API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.GET_ACT(actId));
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
    const data = await fetchBareActsEndpoint(url);
    setCached(`sections:${actId}:${chapterId}`, data);
    return data;
  },

  async searchActs(query, page = 1, pageSize = 20) {
    const url = `${API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.SEARCH_ACTS}?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`;
    const data = await fetchBareActsEndpoint(url);
    return data;
  },

  async searchSections(query) {
    const cached = getCached(`search:sections:${query}`);
    if (cached) return cached;
    const url = `${API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.SEARCH_SECTIONS}?query=${encodeURIComponent(query)}`;
    const data = await fetchBareActsEndpoint(url);
    setCached(`search:sections:${query}`, data);
    return data;
  },

  async getCategories() {
    const cached = getCached('categories');
    if (cached) return cached;
    const data = await fetchBareActsEndpoint(API_CONFIG.LIBRARY.ENDPOINTS.BARE_ACTS.GET_CATEGORIES);
    setCached('categories', data);
    return data;
  },

  async clearCache() {
    clearCache();
  }
};

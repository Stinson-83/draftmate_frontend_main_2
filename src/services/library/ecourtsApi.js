import { API_CONFIG } from '../../services/endpoints';

// 5-minute cache
const CACHE_TTL = 5 * 60 * 1000; 
const cache = new Map();

const getCacheKey = (key) => `ecourts:${key}`;

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

const fetchECourtsEndpoint = async (endpoint) => {
  const url = `${API_CONFIG.LIBRARY.BASE_URL}${endpoint}`;
  console.log("Fetching e-Courts:", url);
  const response = await fetch(url);
  console.log("e-Courts response status:", response.status);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  const json = await response.json();
  console.log("ECOURTS RESPONSE", json);
  return json.success ? json.data : null;
};

export const ecourtsApi = {
  async health() {
    console.log("Calling ecourts health check...");
    const data = await fetchECourtsEndpoint('/api/v1/library/ecourts/health');
    return data;
  },

  async searchByCNR(cnr) {
    console.log("Calling searchByCNR with cnr:", cnr);
    const cached = getCached(`search:cnr:${cnr}`);
    if (cached) return cached;
    const url = `/api/v1/library/ecourts/search?cnr=${encodeURIComponent(cnr)}`;
    const data = await fetchECourtsEndpoint(url);
    setCached(`search:cnr:${cnr}`, data);
    return data;
  },

  async getCaseStatus(cnr) {
    console.log("Calling getCaseStatus with cnr:", cnr);
    const cached = getCached(`status:${cnr}`);
    if (cached) return cached;
    const url = `/api/v1/library/ecourts/status?cnr=${encodeURIComponent(cnr)}`;
    const data = await fetchECourtsEndpoint(url);
    setCached(`status:${cnr}`, data);
    return data;
  },

  async getOrders(cnr) {
    console.log("Calling getOrders with cnr:", cnr);
    const cached = getCached(`orders:${cnr}`);
    if (cached) return cached;
    const url = `/api/v1/library/ecourts/orders?cnr=${encodeURIComponent(cnr)}`;
    const data = await fetchECourtsEndpoint(url);
    setCached(`orders:${cnr}`, data);
    return data;
  },

  async getJudgments(cnr) {
    console.log("Calling getJudgments with cnr:", cnr);
    const cached = getCached(`judgments:${cnr}`);
    if (cached) return cached;
    const url = `/api/v1/library/ecourts/judgments?cnr=${encodeURIComponent(cnr)}`;
    const data = await fetchECourtsEndpoint(url);
    setCached(`judgments:${cnr}`, data);
    return data;
  },

  async getCauseList(court, date) {
    console.log("Calling getCauseList with court:", court, "date:", date);
    const cached = getCached(`causelist:${court}:${date}`);
    if (cached) return cached;
    const url = `/api/v1/library/ecourts/causelist?court=${encodeURIComponent(court)}&date=${encodeURIComponent(date)}`;
    const data = await fetchECourtsEndpoint(url);
    setCached(`causelist:${court}:${date}`, data);
    return data;
  },

  async clearCache() {
    clearCache();
  }
};

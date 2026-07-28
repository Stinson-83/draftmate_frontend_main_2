/**
 * Judgment API Service
 * 
 * This service connects the frontend to the Library Service backend,
 * which in turn communicates with Indian Kanoon.
 * 
 * Features:
 * - Debounced search (300ms)
 * - In-memory caching (5-minute TTL)
 * - Proper error handling
 * - Normalized responses to match existing data structure
 */
import { API_CONFIG } from '../endpoints';
import { stripHtmlTags } from '../../utils/htmlSanitizer';

const LIBRARY_BASE_URL = API_CONFIG.LIBRARY.BASE_URL;
const SEARCH_DEBOUNCE_MS = 300;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache
const cache = {
    data: new Map(),
    timestamps: new Map()
};

// Debounce function
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        return new Promise((resolve) => {
            timeout = setTimeout(async () => {
                resolve(await func(...args));
            }, wait);
        });
    };
};

// Cache helpers
const getCached = (key) => {
    if (!cache.timestamps.has(key)) return null;
    if (Date.now() - cache.timestamps.get(key) > CACHE_TTL_MS) {
        cache.data.delete(key);
        cache.timestamps.delete(key);
        return null;
    }
    return cache.data.get(key);
};

const setCached = (key, value) => {
    cache.data.set(key, value);
    cache.timestamps.set(key, Date.now());
};

// Normalization: convert Indian Kanoon API response to existing mock structure
const normalizeJudgment = (apiJudgment) => ({
  id: apiJudgment.id,
  title: stripHtmlTags(apiJudgment.title),
  court: stripHtmlTags(apiJudgment.court),
  citation: stripHtmlTags(apiJudgment.citation),
  date: apiJudgment.date,
  year: apiJudgment.date ? new Date(apiJudgment.date).getFullYear() : '',
  judges: apiJudgment.judges || [],
  summary: stripHtmlTags(apiJudgment.summary),
  ratiodecidendi: stripHtmlTags(apiJudgment.summary),
  pdfUrl: apiJudgment.pdf_url,
  source: apiJudgment.source || 'Indian Kanoon',
  // Add mock-compatible fields for existing components to work
  category: 'Indian Kanoon',
  tags: ['Indian Kanoon'],
  parties: { petitioner: '', respondent: '' },
  isSaved: false
});

const normalizeJudgmentList = (apiResults) => {
    if (!apiResults) return [];
    const results = apiResults?.data?.results || apiResults?.results || (Array.isArray(apiResults) ? apiResults : []);
    return results.map(normalizeJudgment);
};

/**
 * Search judgments using Indian Kanoon API via Library Service (100% Real-Time)
 */
export const searchJudgments = debounce(async (query, page = 1) => {
    if (!query || !query.trim()) return [];
    const cleanQuery = query.trim();
    const cacheKey = `search:${cleanQuery}:${page}`;
    
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const params = new URLSearchParams({ query: cleanQuery, page: page.toString() });
        const response = await fetch(`${LIBRARY_BASE_URL}${API_CONFIG.LIBRARY.ENDPOINTS.INDIAN_KANOON.SEARCH}?${params}`);
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);

        const data = await response.json();
        const normalized = normalizeJudgmentList(data);
        setCached(cacheKey, normalized);
        return normalized;
    } catch (error) {
        console.error('Real-time Kanoon API search failed:', error);
        return [];
    }
}, SEARCH_DEBOUNCE_MS);

/**
 * Get a single judgment's full content
 */
export const getJudgment = async (docId) => {
  const cacheKey = `judgment:${docId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${LIBRARY_BASE_URL}${API_CONFIG.LIBRARY.ENDPOINTS.INDIAN_KANOON.DOCUMENT(docId)}`);
    if (!response.ok) throw new Error(`Failed to get judgment: ${response.status}`);

    let data = await response.json();
    // Sanitize the full text content
    if (data?.data?.text) {
      data.data.text = stripHtmlTags(data.data.text);
    }
    setCached(cacheKey, data);
    return data;
  } catch (error) {
    console.warn('Failed to get judgment:', error);
    return null;
  }
};

/**
 * Get judgment metadata (without full text)
 */
export const getMetadata = async (docId) => {
    const cacheKey = `metadata:${docId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`${LIBRARY_BASE_URL}${API_CONFIG.LIBRARY.ENDPOINTS.INDIAN_KANOON.DOCUMENT_METADATA(docId)}`);
        if (!response.ok) throw new Error(`Failed to get metadata: ${response.status}`);

        const data = await response.json();
        const normalized = data?.data ? normalizeJudgment(data.data) : null;
        if (normalized) setCached(cacheKey, normalized);
        return normalized;
    } catch (error) {
        console.warn('Failed to get metadata:', error);
        return null;
    }
};

/**
 * Download judgment (opens in new tab)
 */
export const downloadDocument = (docId, pdfUrl) => {
    if (pdfUrl) {
        window.open(pdfUrl, '_blank');
    } else {
        window.open(`https://indiankanoon.org/doc/${docId}/`, '_blank');
    }
};

export default {
    searchJudgments,
    getJudgment,
    getMetadata,
    downloadDocument
};

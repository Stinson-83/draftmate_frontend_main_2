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

// Normalization: convert API response to clean structure without vendor branding
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
  source: apiJudgment.court || 'Court Judgment',
  category: apiJudgment.court || 'Court Judgment',
  tags: [apiJudgment.court || 'Judgment'],
  parties: { petitioner: '', respondent: '' },
  isSaved: false
});

const normalizeJudgmentList = (apiResults) => {
    if (!apiResults) return [];
    const results = apiResults?.data?.results || apiResults?.results || (Array.isArray(apiResults) ? apiResults : []);
    return results.map(normalizeJudgment);
};

/**
 * Search judgments using Library Service (100% Real-Time)
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
        console.error('Real-time API search failed:', error);
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
 * Direct file download (fetches official PDF or fallback formatted .doc)
 */
export const downloadDocument = async (docId, judgmentObj = {}, fullText = '') => {
  const title = judgmentObj.title || `Judgment_${docId}`;
  const safeFilename = title.replace(/[^a-zA-Z0-9 _-]/g, '_').substring(0, 80);

  // 1. Fetch official PDF from backend API (programmatic "Get in PDF" fetch)
  try {
    const pdfUrl = `${LIBRARY_BASE_URL}${API_CONFIG.LIBRARY.ENDPOINTS.INDIAN_KANOON.DOCUMENT(docId)}/pdf`;
    const response = await fetch(pdfUrl);
    if (response.ok) {
      const blob = await response.blob();
      if (blob && (blob.type.includes('pdf') || blob.size > 1000)) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeFilename}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
    }
  } catch (err) {
    console.warn('Official PDF stream failed, falling back to formatted document generation:', err);
  }

  // 2. Fallback to formatted .doc Word file generation if PDF stream fails
  const citation = judgmentObj.citation || '';
  const court = judgmentObj.court || '';
  const bench = judgmentObj.bench || (judgmentObj.judges?.length > 0 ? judgmentObj.judges.join(', ') : '');
  const summary = judgmentObj.summary || judgmentObj.ratiodecidendi || '';
  const text = fullText || '';

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.6; }
      h1 { color: #0f172a; font-size: 18pt; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 15px; }
      .meta { font-size: 11pt; color: #475569; text-align: center; margin-bottom: 25px; }
      .section-title { font-size: 12pt; font-weight: bold; color: #1e40af; background: #eff6ff; padding: 8px 12px; border-left: 4px solid #2563eb; margin-top: 20px; margin-bottom: 10px; }
      .content { font-size: 11pt; white-space: pre-wrap; margin-top: 10px; text-align: justify; }
    </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">
        <strong>Court:</strong> ${court || 'Supreme Court of India'} | <strong>Citation:</strong> ${citation || 'N/A'}<br/>
        <strong>Bench:</strong> ${bench || 'Honourable Court'}
      </div>
      
      ${summary ? `<div class="section-title">SUMMARY / RATIO DECIDENDI</div><div class="content">${summary}</div>` : ''}
      
      <div class="section-title">FULL JUDGMENT TEXT</div>
      <div class="content">${text || 'Full text provided by DraftMate Library.'}</div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFilename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default {
    searchJudgments,
    getJudgment,
    getMetadata,
    downloadDocument
};

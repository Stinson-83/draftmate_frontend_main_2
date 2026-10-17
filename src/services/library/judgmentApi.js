/**
 * Judgment library API.
 * Search and detail go to DraftMate Library Service, which reads the
 * Open India Law corpus from PostgreSQL and Qdrant.
 * Indian Kanoon helpers remain for other surfaces and are not used
 * by the Judgment Library page.
 */
import { API_CONFIG } from '../endpoints';
import { stripHtmlTags, sanitizeJudgmentHtml } from '../../utils/htmlSanitizer';
import {
  buildJudgmentSearchParams,
  friendlySearchError,
  mapSearchResponse,
} from './judgmentSearch';

const LIBRARY_BASE_URL = API_CONFIG.LIBRARY.BASE_URL;

async function readDetail(response) {
  try {
    const body = await response.json();
    return body?.detail;
  } catch {
    return '';
  }
}

export async function searchLegalJudgments(params, { signal } = {}) {
  const search = buildJudgmentSearchParams(params);
  const response = await fetch(
    `${LIBRARY_BASE_URL}/api/v1/legal/judgments/search?${search}`,
    { signal }
  );
  if (!response.ok) {
    const detail = await readDetail(response);
    const error = new Error(friendlySearchError(response.status, detail));
    error.status = response.status;
    throw error;
  }
  return mapSearchResponse(await response.json());
}

export async function getRecentJudgments(page = 1, { signal } = {}) {
  const response = await fetch(
    `${LIBRARY_BASE_URL}/api/v1/legal/judgments/recent?page=${page}&page_size=9`,
    { signal }
  );
  if (!response.ok) {
    const detail = await readDetail(response);
    const error = new Error(friendlySearchError(response.status, detail));
    error.status = response.status;
    throw error;
  }
  return mapSearchResponse(await response.json());
}

export async function getLegalJudgment(judgmentId, { signal } = {}) {
  const response = await fetch(
    `${LIBRARY_BASE_URL}/api/v1/legal/judgments/${encodeURIComponent(judgmentId)}`,
    { signal }
  );
  if (!response.ok) {
    const detail = await readDetail(response);
    const error = new Error(friendlySearchError(response.status, detail));
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  return {
    ...data,
    excerpt: data.excerpt || '',
    source: data.source || 'Open India Law',
  };
}

export async function getJudgmentFilters({ signal } = {}) {
  const response = await fetch(`${LIBRARY_BASE_URL}/api/v1/legal/judgments/filters`, { signal });
  if (!response.ok) {
    const detail = await readDetail(response);
    throw new Error(friendlySearchError(response.status, detail));
  }
  const data = await response.json();
  return {
    courts: Array.isArray(data.courts) ? data.courts : [],
    years: Array.isArray(data.years) ? data.years : [],
    sources: Array.isArray(data.sources) ? data.sources : [],
    corpusCount: data.corpus_count || 0,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getJudgment(docId) {
  if (UUID_RE.test(String(docId || ''))) {
    const data = await getLegalJudgment(docId);
    return { data: { text: data.text || '' }, text: data.text || '' };
  }
  const response = await fetch(`${LIBRARY_BASE_URL}${API_CONFIG.LIBRARY.ENDPOINTS.INDIAN_KANOON.DOCUMENT(docId)}`);
  if (!response.ok) throw new Error(`Failed to get judgment: ${response.status}`);
  const data = await response.json();
  if (data?.data?.text) data.data.text = sanitizeJudgmentHtml(data.data.text);
  return data;
}

export const searchJudgments = searchLegalJudgments;

export default {
  searchLegalJudgments,
  getLegalJudgment,
  getJudgmentFilters,
  getJudgment,
  searchJudgments,
};

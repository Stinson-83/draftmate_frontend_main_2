const FILTER_KEYS = ['court', 'year_from', 'year_to', 'jurisdiction', 'citation', 'act', 'section', 'source', 'sort'];

export function emptyFilters() {
  return {
    court: '',
    year_from: '',
    year_to: '',
    jurisdiction: '',
    citation: '',
    act: '',
    section: '',
    source: '',
    sort: 'relevance',
  };
}

export function filtersFromParams(params) {
  const filters = emptyFilters();
  FILTER_KEYS.forEach((key) => {
    filters[key] = params.get(key) || '';
  });
  return filters;
}

export function hasActiveFilters(filters) {
  return FILTER_KEYS.some((key) => String(filters?.[key] || '').trim());
}

export function shouldSearch({ q, filters }) {
  if ((q || '').trim()) return true;
  return hasActiveFilters(filters || {});
}

export function buildJudgmentSearchParams({ q, page = 1, pageSize = 9, filters = {} }) {
  const params = new URLSearchParams();
  const query = (q || '').trim();
  if (query) params.set('q', query);
  params.set('page', String(page || 1));
  params.set('page_size', String(pageSize || 9));
  FILTER_KEYS.forEach((key) => {
    const value = String(filters[key] || '').trim();
    if (value) params.set(key, value);
  });
  return params;
}

export function mapSearchResponse(data) {
  const results = Array.isArray(data?.results) ? data.results : [];
  return {
    results: results.map((item) => ({
      id: item.id,
      case_id: item.case_id || '',
      title: item.title || '',
      court: item.court || '',
      citation: item.citation || '',
      judgment_date: item.judgment_date || '',
      year: item.year || null,
      excerpt: item.excerpt || '',
      source: item.source || 'Open India Law',
      source_url: item.source_url || '',
      source_publisher: item.source_publisher || '',
      relevance: item.relevance ?? null,
      metadata: item.metadata || {},
    })),
    page: data?.page || 1,
    pageSize: data?.page_size || 9,
    total: data?.total || 0,
    totalPages: data?.total_pages || 0,
    hasNext: Boolean(data?.has_next),
    hasPrevious: Boolean(data?.has_previous),
    query: data?.query || '',
  };
}

export function friendlySearchError(status, detail) {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (status === 503) return 'Judgment search is temporarily unavailable. Please try again shortly.';
  if (status === 404) return 'Judgment not found.';
  if (status === 400 || status === 422) return 'That search could not be run. Check the query and filters.';
  return 'Judgment search failed. Please try again.';
}

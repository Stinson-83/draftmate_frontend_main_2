import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildJudgmentSearchParams,
  friendlySearchError,
  hasActiveFilters,
  mapSearchResponse,
  shouldSearch,
} from './judgmentSearch.js';

test('does not build a query param for an empty search', () => {
  const params = buildJudgmentSearchParams({ q: '   ', page: 1, pageSize: 9, filters: {} });
  assert.equal(params.get('q'), null);
  assert.equal(shouldSearch({ q: '  ', filters: {} }), false);
});

test('builds filter and pagination params', () => {
  const params = buildJudgmentSearchParams({
    q: 'bail',
    page: 2,
    pageSize: 9,
    filters: { court: 'Supreme Court of India', year_from: '2015', section: '', citation: '', act: '', year_to: '', jurisdiction: '', source: '' },
  });
  assert.equal(params.get('q'), 'bail');
  assert.equal(params.get('court'), 'Supreme Court of India');
  assert.equal(params.get('year_from'), '2015');
  assert.equal(params.get('page'), '2');
  assert.equal(params.has('section'), false);
});

test('maps a real search payload without inventing fields', () => {
  const mapped = mapSearchResponse({
    results: [{
      id: 'abc',
      case_id: '2016_INSC_1151',
      title: 'SITA RAM versus BALBIR',
      court: 'Supreme Court of India',
      citation: '[2016] 8 S.C.R. 984',
      judgment_date: '2016-12-15',
      year: 2016,
      excerpt: 'bail was considered',
      source: 'Open India Law',
      source_url: null,
      relevance: 0.2,
      metadata: { chunk_index: '2016_INSC_1151_000' },
    }],
    page: 1,
    page_size: 9,
    total: 1,
    total_pages: 1,
    has_next: false,
    has_previous: false,
    query: 'bail',
  });
  assert.equal(mapped.results.length, 1);
  assert.equal(mapped.results[0].citation, '[2016] 8 S.C.R. 984');
  assert.equal(mapped.results[0].year, 2016);
  assert.equal(mapped.total, 1);
  assert.equal(hasActiveFilters({ court: 'Supreme Court of India' }), true);
});

test('error copy does not include a stack trace', () => {
  const message = friendlySearchError(503, 'Judgment search is temporarily unavailable because the search index cannot be reached.');
  assert.match(message, /unavailable/i);
  assert.equal(message.includes('Traceback'), false);
  assert.match(friendlySearchError(500, ''), /failed/i);
});

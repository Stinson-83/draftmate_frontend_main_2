import { API_CONFIG } from '../endpoints';

const BASE_URL = `${API_CONFIG.LIBRARY.BASE_URL}/api/v1/library/case-tracking`;

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('session_id') || localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const mapTrackedCaseToFrontend = (tc) => ({
  id: String(tc.id),
  caseId: tc.case_id ? String(tc.case_id) : null,
  cnrNumber: tc.cnr_number || '',
  caseNumber: tc.case_number || '',
  caseTitle: tc.case_title || '',
  courtEstablishment: tc.court_establishment || '',
  caseStage: tc.case_stage || '',
  lastUpdated: tc.last_updated,
  nextHearingDate: tc.next_hearing_date,
  nextHearingTime: tc.next_hearing_time ? tc.next_hearing_time.slice(0, 5) : '',
  latestOrder: tc.latest_order,
  latestProceeding: tc.latest_proceeding,
  createdAt: tc.created_at,
  updatedAt: tc.updated_at,
});

export const trackingService = {
  async getTrackedCases(search = null) {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${BASE_URL}/${queryStr}`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data.map(mapTrackedCaseToFrontend) : [];
      }
    } catch (e) {
      console.error('[trackingService] Failed to load tracked cases from API:', e);
    }
    return [];
  },

  async getTrackedCaseById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Tracked case not found: ${response.statusText}`);
    }
    const data = await response.json();
    return mapTrackedCaseToFrontend(data);
  },

  async createTrackedCase(caseData) {
    const payload = {
      case_id: caseData.caseId || null,
      cnr_number: caseData.cnrNumber || null,
      case_number: caseData.caseNumber || null,
      case_title: caseData.caseTitle || null,
      court_establishment: caseData.courtEstablishment || null,
      case_stage: caseData.caseStage || null,
      last_updated: caseData.lastUpdated || new Date().toISOString().split('T')[0],
      next_hearing_date: caseData.nextHearingDate || null,
      next_hearing_time: caseData.nextHearingTime ? (caseData.nextHearingTime.length === 5 ? `${caseData.nextHearingTime}:00` : caseData.nextHearingTime) : null,
      latest_order: caseData.latestOrder || null,
      latest_proceeding: caseData.latestProceeding || null,
    };

    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to track case: ${response.statusText}`);
    }
    const data = await response.json();
    return mapTrackedCaseToFrontend(data);
  },

  async updateTrackedCase(id, caseData) {
    const payload = {};
    if (caseData.caseId !== undefined) payload.case_id = caseData.caseId;
    if (caseData.cnrNumber !== undefined) payload.cnr_number = caseData.cnrNumber;
    if (caseData.caseNumber !== undefined) payload.case_number = caseData.caseNumber;
    if (caseData.caseTitle !== undefined) payload.case_title = caseData.caseTitle;
    if (caseData.courtEstablishment !== undefined) payload.court_establishment = caseData.courtEstablishment;
    if (caseData.caseStage !== undefined) payload.case_stage = caseData.caseStage;
    if (caseData.lastUpdated !== undefined) payload.last_updated = caseData.lastUpdated;
    if (caseData.nextHearingDate !== undefined) payload.next_hearing_date = caseData.nextHearingDate;
    if (caseData.nextHearingTime !== undefined) {
      payload.next_hearing_time = caseData.nextHearingTime && caseData.nextHearingTime.length === 5 ? `${caseData.nextHearingTime}:00` : caseData.nextHearingTime;
    }
    if (caseData.latestOrder !== undefined) payload.latest_order = caseData.latestOrder;
    if (caseData.latestProceeding !== undefined) payload.latest_proceeding = caseData.latestProceeding;

    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to update tracked case: ${response.statusText}`);
    }
    const data = await response.json();
    return mapTrackedCaseToFrontend(data);
  },

  async deleteTrackedCase(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete tracked case: ${response.statusText}`);
    }
    return true;
  }
};

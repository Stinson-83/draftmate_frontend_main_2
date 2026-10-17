import { API_CONFIG } from '../endpoints';

const BASE_URL = `${API_CONFIG.LIBRARY.BASE_URL}/api/v1/library/hearings`;

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('session_id') || localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const mapHearingToFrontend = (h) => ({
  id: String(h.id),
  caseId: h.case_id ? String(h.case_id) : null,
  clientId: h.client_id ? String(h.client_id) : null,
  caseNumber: h.case_number || '',
  caseTitle: h.case_title || '',
  court: h.court || '',
  judge: h.judge || '',
  oppositeParty: h.opposite_party || '',
  hearingDate: h.hearing_date,
  nextHearingDate: h.next_hearing_date,
  status: h.status || 'Scheduled',
  remarks: h.remarks || '',
  timeline: Array.isArray(h.timeline) ? h.timeline : [],
  createdAt: h.created_at,
  updatedAt: h.updated_at,
});

export const hearingService = {
  async getHearings(status = null, caseId = null, startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (caseId) params.append('case_id', caseId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${BASE_URL}/${queryStr}`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data.map(mapHearingToFrontend) : [];
      }
    } catch (e) {
      console.error('[hearingService] Failed to load hearings from API:', e);
    }
    return [];
  },

  async getHearingById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Hearing not found: ${response.statusText}`);
    }
    const data = await response.json();
    return mapHearingToFrontend(data);
  },

  async createHearing(hearingData) {
    const payload = {
      case_id: hearingData.caseId || null,
      client_id: hearingData.clientId || null,
      case_number: hearingData.caseNumber || null,
      case_title: hearingData.caseTitle || null,
      court: hearingData.court || null,
      judge: hearingData.judge || null,
      opposite_party: hearingData.oppositeParty || null,
      hearing_date: hearingData.hearingDate,
      next_hearing_date: hearingData.nextHearingDate || null,
      status: hearingData.status || 'Scheduled',
      remarks: hearingData.remarks || null,
      timeline: hearingData.timeline || [],
    };

    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to create hearing: ${response.statusText}`);
    }
    const data = await response.json();
    window.dispatchEvent(new Event('hearings_updated'));
    window.dispatchEvent(new Event('cases_updated'));
    return mapHearingToFrontend(data);
  },

  async updateHearing(id, hearingData) {
    const payload = {};
    if (hearingData.caseId !== undefined) payload.case_id = hearingData.caseId;
    if (hearingData.clientId !== undefined) payload.client_id = hearingData.clientId;
    if (hearingData.caseNumber !== undefined) payload.case_number = hearingData.caseNumber;
    if (hearingData.caseTitle !== undefined) payload.case_title = hearingData.caseTitle;
    if (hearingData.court !== undefined) payload.court = hearingData.court;
    if (hearingData.judge !== undefined) payload.judge = hearingData.judge;
    if (hearingData.oppositeParty !== undefined) payload.opposite_party = hearingData.oppositeParty;
    if (hearingData.hearingDate !== undefined) payload.hearing_date = hearingData.hearingDate;
    if (hearingData.nextHearingDate !== undefined) payload.next_hearing_date = hearingData.nextHearingDate;
    if (hearingData.status !== undefined) payload.status = hearingData.status;
    if (hearingData.remarks !== undefined) payload.remarks = hearingData.remarks;
    if (hearingData.timeline !== undefined) payload.timeline = hearingData.timeline;

    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to update hearing: ${response.statusText}`);
    }
    const data = await response.json();
    window.dispatchEvent(new Event('hearings_updated'));
    window.dispatchEvent(new Event('cases_updated'));
    return mapHearingToFrontend(data);
  },

  async deleteHearing(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete hearing: ${response.statusText}`);
    }
    window.dispatchEvent(new Event('hearings_updated'));
    window.dispatchEvent(new Event('cases_updated'));
    return true;
  },
};

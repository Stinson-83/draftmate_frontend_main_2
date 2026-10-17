import { API_CONFIG } from '../endpoints';

const BASE_URL = `${API_CONFIG.LIBRARY.BASE_URL}/api/v1/library/video-links`;

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('session_id') || localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const mapLinkToFrontend = (vl) => ({
  id: String(vl.id),
  caseId: vl.case_id ? String(vl.case_id) : null,
  hearingId: vl.hearing_id ? String(vl.hearing_id) : null,
  caseNumber: vl.case_number || '',
  caseTitle: vl.case_title || '',
  court: vl.court || '',
  platform: vl.platform || 'Custom',
  meetingLink: vl.meeting_link || '',
  meetingId: vl.meeting_id || '',
  passcode: vl.passcode || '',
  hearingDate: vl.hearing_date || '',
  startTime: vl.start_time ? vl.start_time.slice(0, 5) : '',
  notes: vl.notes || '',
  createdAt: vl.created_at,
  updatedAt: vl.updated_at,
});

export const videoLinksService = {
  async getLinks(platform = null, caseId = null) {
    try {
      const params = new URLSearchParams();
      if (platform) params.append('platform', platform);
      if (caseId) params.append('case_id', caseId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${BASE_URL}/${queryStr}`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data.map(mapLinkToFrontend) : [];
      }
    } catch (e) {
      console.error('[videoLinksService] Failed to load links from API:', e);
    }
    return [];
  },

  async getLinkById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Video link not found: ${response.statusText}`);
    }
    const data = await response.json();
    return mapLinkToFrontend(data);
  },

  async createLink(linkData) {
    const payload = {
      case_id: linkData.caseId || null,
      hearing_id: linkData.hearingId || null,
      case_number: linkData.caseNumber || null,
      case_title: linkData.caseTitle || null,
      court: linkData.court || null,
      platform: linkData.platform || 'Custom',
      meeting_link: linkData.meetingLink || null,
      meeting_id: linkData.meetingId || null,
      passcode: linkData.passcode || null,
      hearing_date: linkData.hearingDate || null,
      start_time: linkData.startTime ? (linkData.startTime.length === 5 ? `${linkData.startTime}:00` : linkData.startTime) : null,
      notes: linkData.notes || null,
    };

    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to create video link: ${response.statusText}`);
    }
    const data = await response.json();
    return mapLinkToFrontend(data);
  },

  async updateLink(id, linkData) {
    const payload = {};
    if (linkData.caseId !== undefined) payload.case_id = linkData.caseId;
    if (linkData.hearingId !== undefined) payload.hearing_id = linkData.hearingId;
    if (linkData.caseNumber !== undefined) payload.case_number = linkData.caseNumber;
    if (linkData.caseTitle !== undefined) payload.case_title = linkData.caseTitle;
    if (linkData.court !== undefined) payload.court = linkData.court;
    if (linkData.platform !== undefined) payload.platform = linkData.platform;
    if (linkData.meetingLink !== undefined) payload.meeting_link = linkData.meetingLink;
    if (linkData.meetingId !== undefined) payload.meeting_id = linkData.meetingId;
    if (linkData.passcode !== undefined) payload.passcode = linkData.passcode;
    if (linkData.hearingDate !== undefined) payload.hearing_date = linkData.hearingDate;
    if (linkData.startTime !== undefined) {
      payload.start_time = linkData.startTime && linkData.startTime.length === 5 ? `${linkData.startTime}:00` : linkData.startTime;
    }
    if (linkData.notes !== undefined) payload.notes = linkData.notes;

    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to update video link: ${response.statusText}`);
    }
    const data = await response.json();
    return mapLinkToFrontend(data);
  },

  async deleteLink(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete video link: ${response.statusText}`);
    }
    return true;
  }
};

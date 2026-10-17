import { API_CONFIG } from '../endpoints';

const BASE_URL = `${API_CONFIG.LIBRARY.BASE_URL}/api/v1/library/calendar`;

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('session_id') || localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const mapEventToFrontend = (e) => ({
  id: String(e.id),
  title: e.title,
  type: e.type,
  date: e.date,
  time: e.time ? e.time.slice(0, 5) : '10:00',
  notes: e.notes || '',
  caseId: e.case_id ? String(e.case_id) : null,
  hearingId: e.hearing_id ? String(e.hearing_id) : null,
  diaryEntryId: e.diary_entry_id,
  isDiaryEvent: Boolean(e.is_diary_event),
  createdAt: e.created_at,
  updatedAt: e.updated_at,
});

export const calendarService = {
  async getEvents(type = null, startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${BASE_URL}/${queryStr}`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data.map(mapEventToFrontend) : [];
      }
    } catch (e) {
      console.error('[calendarService] Failed to load events from API:', e);
    }
    return [];
  },

  async getEventById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Event not found: ${response.statusText}`);
    }
    const data = await response.json();
    return mapEventToFrontend(data);
  },

  async createEvent(eventData) {
    const payload = {
      title: eventData.title,
      type: eventData.type || 'hearing',
      date: eventData.date,
      time: eventData.time || '10:00:00',
      notes: eventData.notes || null,
      case_id: eventData.caseId || null,
      hearing_id: eventData.hearingId || null,
      diary_entry_id: eventData.diaryEntryId || null,
      is_diary_event: Boolean(eventData.isDiaryEvent),
    };

    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to create calendar event: ${response.statusText}`);
    }
    const data = await response.json();
    return mapEventToFrontend(data);
  },

  async updateEvent(id, eventData) {
    const payload = {};
    if (eventData.title !== undefined) payload.title = eventData.title;
    if (eventData.type !== undefined) payload.type = eventData.type;
    if (eventData.date !== undefined) payload.date = eventData.date;
    if (eventData.time !== undefined) payload.time = eventData.time;
    if (eventData.notes !== undefined) payload.notes = eventData.notes;
    if (eventData.caseId !== undefined) payload.case_id = eventData.caseId;
    if (eventData.hearingId !== undefined) payload.hearing_id = eventData.hearingId;
    if (eventData.diaryEntryId !== undefined) payload.diary_entry_id = eventData.diaryEntryId;
    if (eventData.isDiaryEvent !== undefined) payload.is_diary_event = eventData.isDiaryEvent;

    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to update calendar event: ${response.statusText}`);
    }
    const data = await response.json();
    return mapEventToFrontend(data);
  },

  async deleteEvent(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete calendar event: ${response.statusText}`);
    }
    return true;
  },
};

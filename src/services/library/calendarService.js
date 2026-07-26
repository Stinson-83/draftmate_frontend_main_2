import { mockCalendarEvents } from '../../data/mockCalendar';
import { diaryService } from './diaryService';

const STORAGE_KEY = 'draftmate_calendar_events';

const initializeStorage = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } else {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(e => e.id !== 'cal-1' && e.id !== 'cal-2' && e.id !== 'cal-3' && !e.title?.includes('Ramesh Sharma') && !e.title?.includes('Priya Enterprises') && !e.title?.includes('Sunita Verma'));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      }
    } catch (e) {
      console.warn('[calendarService] Storage init notice:', e);
    }
  }
};

export const calendarService = {
  async getEvents() {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    
    // Get diary entries and convert them to calendar events
    let diaryEvents = [];
    try {
      const diaryEntries = await diaryService.getEntries();
      diaryEvents = diaryEntries.map(entry => ({
        id: `diary-${entry.id}`,
        title: entry.caseTitle,
        type: 'hearing',
        date: entry.hearingDate,
        time: '10:00',
        notes: entry.remarks,
        isDiaryEvent: true,
        diaryEntryId: entry.id,
      }));
    } catch (e) {
      console.error('Error loading diary events:', e);
    }

    const storedEvents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return [...storedEvents, ...diaryEvents];
  },

  async getEventById(id) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    const events = await this.getEvents();
    return events.find(e => e.id === id);
  },

  async createEvent(eventData) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newEvent = {
      ...eventData,
      id: `cal-${Date.now()}`,
    };
    events.unshift(newEvent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return newEvent;
  },

  async updateEvent(id, eventData) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    let events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...eventData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      return events[index];
    }
    throw new Error('Event not found');
  },

  async deleteEvent(id) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    let events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    events = events.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return true;
  },
};

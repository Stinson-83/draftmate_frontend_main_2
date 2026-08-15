import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { calendarService } from '../../services/library/calendarService';
import { eventTypes } from '../../data/mockCalendar';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const data = await calendarService.getEventById(eventId);
      if (data) {
        setEvent(data);
      } else {
        toast.error('Event not found');
        navigate('/dashboard/library/calendar');
      }
    } catch (err) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (event?.isDiaryEvent) {
      toast.error('Diary events must be deleted from Lawyer Diary');
      return;
    }
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await calendarService.deleteEvent(eventId);
        toast.success('Event deleted');
        navigate('/dashboard/library/calendar');
      } catch (err) {
        toast.error('Failed to delete event');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!event) return null;

  const type = eventTypes.find(t => t.id === event.type);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 md:px-8 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/library/calendar"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                {event.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${type?.color || 'bg-slate-100 text-slate-700'}`}>
                  {type?.name || event.type}
                </span>
                {event.isDiaryEvent && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    From Lawyer Diary
                  </span>
                )}
              </div>
            </div>
          </div>
          {!event.isDiaryEvent && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span className="hidden md:inline">Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span className="hidden md:inline">Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Event Info */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Event Details</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Date</span>
                <span className="text-slate-900 dark:text-white">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {event.time && (
                <div>
                  <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Time</span>
                  <span className="text-slate-900 dark:text-white">{event.time}</span>
                </div>
              )}
              {event.notes && (
                <div>
                  <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Notes</span>
                  <p className="text-slate-700 dark:text-slate-300">{event.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Event Modal */}
      {isModalOpen && !event.isDiaryEvent && (
        <EventModal
          event={event}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            loadEvent();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const EventModal = ({ event, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    event || {
      title: '',
      type: 'hearing',
      date: new Date().toISOString().split('T')[0],
      time: '',
      notes: '',
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (event) {
        await calendarService.updateEvent(event.id, formData);
        toast.success('Event updated');
      } else {
        await calendarService.createEvent(formData);
        toast.success('Event added');
      }
      onSave();
    } catch (err) {
      toast.error('Failed to save event');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {event ? 'Edit Event' : 'Add Event'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              required
            >
              {eventTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
            >
              {event ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventDetails;

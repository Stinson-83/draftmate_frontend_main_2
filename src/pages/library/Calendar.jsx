import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { calendarService } from '../../services/library/calendarService';
import { eventTypes } from '../../data/mockCalendar';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await calendarService.getEvents();
      setEvents(data);
    } catch (err) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const todayEvents = events.filter(e => e.date === today).length;
    const thisWeekEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    }).length;
    const upcomingDeadlines = events.filter(e => e.type === 'deadline' && e.date >= today).length;

    return { todayEvents, thisWeekEvents, upcomingDeadlines };
  };

  const stats = getStats();

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const days = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const dateEvents = getEventsForDate(date);

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedDate(date.toISOString().split('T')[0]);
                  setIsModalOpen(true);
                }}
                className={`min-h-24 p-2 rounded-lg border transition-all cursor-pointer ${
                  isCurrentMonth
                    ? 'border-slate-200 dark:border-slate-700'
                    : 'border-transparent bg-slate-50/50 dark:bg-slate-700/30'
                } ${isToday ? 'bg-primary/10 dark:bg-primary/20 border-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dateEvents.slice(0, 2).map(event => {
                    const type = eventTypes.find(t => t.id === event.type);
                    return (
                      <Link
                        key={event.id}
                        to={`/dashboard/library/calendar/${event.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`block text-xs px-2 py-1 rounded truncate ${type?.color || 'bg-slate-100 text-slate-700'}`}
                      >
                        {event.title}
                      </Link>
                    );
                  })}
                  {dateEvents.length > 2 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      +{dateEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-7 gap-4">
          {days.map((date, idx) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const dateEvents = getEventsForDate(date);

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedDate(date.toISOString().split('T')[0]);
                  setIsModalOpen(true);
                }}
                className={`min-h-64 p-3 rounded-lg border cursor-pointer transition-all ${
                  isToday ? 'bg-primary/10 dark:bg-primary/20 border-primary' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className={`text-sm font-semibold mb-3 ${isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="space-y-2">
                  {dateEvents.map(event => {
                    const type = eventTypes.find(t => t.id === event.type);
                    return (
                      <Link
                        key={event.id}
                        to={`/dashboard/library/calendar/${event.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-2 py-2 rounded-lg ${type?.color}`}
                      >
                        <div className="text-xs font-semibold truncate">{event.title}</div>
                        {event.time && (
                          <div className="text-xs mt-1 opacity-80">{event.time}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>
        {dayEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <div className="text-4xl mb-4">📅</div>
            <div>No events for today</div>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map(event => {
              const type = eventTypes.find(t => t.id === event.type);
              return (
                <Link
                  key={event.id}
                  to={`/dashboard/library/calendar/${event.id}`}
                  className={`block p-4 rounded-xl border ${type?.color} hover:shadow-sm transition-all`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 dark:text-white">{event.title}</div>
                      {event.time && (
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.time}</div>
                      )}
                      {event.notes && (
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">{event.notes}</div>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Link to="/dashboard/library" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2563EB] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendar</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your hearings, deadlines, and legal events
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0]);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">add</span>
            Add Event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Today's Events</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.todayEvents}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">This Week</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.thisWeekEvents}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming Deadlines</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.upcomingDeadlines}</p>
          </div>
        </div>

        {/* View Switcher & Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
                else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
                else newDate.setDate(newDate.getDate() - 1);
                setCurrentDate(newDate);
              }}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
                else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
                else newDate.setDate(newDate.getDate() + 1);
                setCurrentDate(newDate);
              }}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
            >
              Today
            </button>
            <div className="px-4 py-2 text-slate-700 dark:text-slate-300 font-semibold">
              {view === 'month' ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
               view === 'week' ? `${new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay())).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(currentDate.setDate(currentDate.getDate() + 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` :
               currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
            {['month', 'week', 'day'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                  view === v
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar View */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : view === 'month' ? renderMonthView() :
          view === 'week' ? renderWeekView() :
          renderDayView()}
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <EventModal
          date={selectedDate}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            loadEvents();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const EventModal = ({ date, event, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    event || {
      title: '',
      type: 'hearing',
      date: date || new Date().toISOString().split('T')[0],
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

export default Calendar;

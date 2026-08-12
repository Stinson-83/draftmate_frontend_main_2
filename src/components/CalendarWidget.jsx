import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const CalendarWidget = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    // Get User Email for Unique Storage Key
    const getUserKey = () => {
        try {
            const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
            return userProfile.email ? `${userProfile.email}_calendar_events` : 'guest_calendar_events';
        } catch {
            return 'guest_calendar_events';
        }
    };

    // Initialize events from localStorage (Lazy initialization to prevent overwrite)
    const [events, setEvents] = useState(() => {
        try {
            const key = getUserKey();
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error("Failed to load calendar events:", error);
            return {};
        }
    });
    const [showEventModal, setShowEventModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        type: 'work',
        time: '',
        reminder: false
    });
    const [editingEventId, setEditingEventId] = useState(null);

    // Save events to localStorage whenever they change
    useEffect(() => {
        const key = getUserKey();
        localStorage.setItem(key, JSON.stringify(events));
    }, [events]);

    // Polling for notifications (every 60s)
    useEffect(() => {
        const checkReminders = async () => {
            const now = new Date();
            const upcomingThreshold = 5 * 60 * 1000; // 5 minutes

            // Flatten events and check
            Object.values(events).flat().forEach(async event => {
                if (!event.reminder || !event.time) return;

                // Check if already notified
                const notifiedKey = `notified_${event.id}`;
                if (localStorage.getItem(notifiedKey)) return;

                // Parse event time
                const [hours, minutes] = event.time.split(':').map(Number);
                const eventDateKey = Object.keys(events).find(key => events[key].some(e => e.id === event.id));
                if (!eventDateKey) return;

                const eventDate = new Date(eventDateKey);
                eventDate.setHours(hours, minutes, 0, 0);

                const diff = eventDate.getTime() - now.getTime();

                // If event is within next 5 mins (and not passed)
                if (diff > 0 && diff <= upcomingThreshold) {
                    try {
                        // Get user email from profile
                        const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                        const userEmail = userProfile.email;

                        if (userEmail) {
                            // Import api (dynamic due to scoping, or assume global import available)
                            // Ideally, we import 'api' at the top. I will use window.api or just standard fetch if import is tricky, 
                            // but here I will assume 'api' needs to be imported. 
                            // Wait, I can't easily add import at top with this tool without overwriting.
                            // I will use the imported 'api' if I can ensure it is imported.
                            // Let's assume I need to add the import to the top of the file separately.

                            // Using direct fetch for simplicity if import is not present, BUT I should add the import.
                            // Investigating file content... I see no 'api' import. I must add it.

                            // Marking as notified immediately to avoid double firing
                            localStorage.setItem(notifiedKey, 'true');

                            // Send Notification
                            const { api } = await import('../services/api');
                            await api.sendEmailNotification(
                                userEmail,
                                `Reminder: ${event.title}`,
                                `This is your Reminder from DraftMate: Your event "${event.title}" is starting at ${event.time}, reminder type- "${event.type}"`
                            );

                            toast.success(`Reminder sent for: ${event.title}`);
                        }
                    } catch (error) {
                        console.error("Failed to send reminder:", error);
                    }
                }
            });
        };

        const interval = setInterval(checkReminders, 60000); // Check every minute
        checkReminders(); // Initial check

        return () => clearInterval(interval);
    }, [events]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const handleDateClick = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const dateKey = selectedDate.toDateString();
    const dayEvents = events[dateKey] || [];

    const handleAddEvent = () => {
        if (!newEvent.title.trim()) {
            toast.error("Event title is required");
            return;
        }

        const event = {
            id: editingEventId || Date.now(),
            ...newEvent
        };

        setEvents(prev => {
            const currentDayEvents = prev[dateKey] || [];
            if (editingEventId) {
                return {
                    ...prev,
                    [dateKey]: currentDayEvents.map(e => e.id === editingEventId ? event : e)
                };
            } else {
                return {
                    ...prev,
                    [dateKey]: [...currentDayEvents, event]
                };
            }
        });

        setShowEventModal(false);
        setNewEvent({ title: '', type: 'work', time: '', reminder: false });
        setEditingEventId(null);
        toast.success(editingEventId ? "Event updated" : "Event added");
    };

    const handleDeleteEvent = (eventId) => {
        setEvents(prev => ({
            ...prev,
            [dateKey]: prev[dateKey].filter(e => e.id !== eventId)
        }));
        toast.success("Event deleted");
    };

    const handleEditEvent = (event) => {
        setNewEvent(event);
        setEditingEventId(event.id);
        setShowEventModal(true);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'work': return 'blue';
            case 'personal': return 'green';
            case 'important': return 'red';
            default: return 'gray';
        }
    };

    return (
        <div className="space-y-6">
            {/* Calendar View */}
            <div className="bg-white dark:bg-[#151f2e] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500">
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <button onClick={handleToday} className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            Today
                        </button>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500">
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                        <span key={day} className="text-slate-400 text-xs font-medium py-1">{day}</span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {/* Empty cells for prev month */}
                    {[...Array(firstDay)].map((_, i) => (
                        <span key={`empty-${i}`} className="py-2"></span>
                    ))}

                    {/* Days */}
                    {[...Array(days)].map((_, i) => {
                        const day = i + 1;
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const hasEvents = events[date.toDateString()] && events[date.toDateString()].length > 0;
                        const dayEventCount = hasEvents ? events[date.toDateString()].length : 0;
                        const firstEventType = hasEvents ? events[date.toDateString()][0].type : 'gray';

                        return (
                            <button
                                key={day}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    relative py-2 rounded-lg transition-colors flex flex-col items-center justify-center min-h-[40px]
                                    ${isSelected ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                    ${isToday ? 'ring-1 ring-primary ring-inset' : ''}
                                `}
                            >
                                <span className={isToday ? 'text-primary font-bold' : ''}>{day}</span>
                                {hasEvents && (
                                    <div className="flex gap-0.5 mt-1">
                                        <span className={`w-1 h-1 rounded-full bg-${getTypeColor(firstEventType)}-500`}></span>
                                        {dayEventCount > 1 && <span className="text-[8px] text-slate-400 leading-none">+{dayEventCount - 1}</span>}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Agenda View */}
            <div className="bg-white dark:bg-[#151f2e] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-fit">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Agenda</h3>
                        <p className="text-xs text-slate-500">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="p-2 min-h-[150px] max-h-[300px] overflow-y-auto">
                    {dayEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400">
                            <span className="material-symbols-outlined text-3xl mb-2 opacity-50">event_busy</span>
                            <p className="text-sm">No events scheduled</p>
                        </div>
                    ) : (
                        dayEvents.map((event) => (
                            <div key={event.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group relative">
                                <div className={`w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-lg bg-${getTypeColor(event.type)}-500`}></div>
                                <div className="pl-2 flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{event.title}</p>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditEvent(event)} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                            <button onClick={() => handleDeleteEvent(event.id)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {event.time && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                <span>{event.time}</span>
                                            </div>
                                        )}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize bg-${getTypeColor(event.type)}-100 dark:bg-${getTypeColor(event.type)}-900/30 text-${getTypeColor(event.type)}-700 dark:text-${getTypeColor(event.type)}-300`}>
                                            {event.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => {
                            setNewEvent({ title: '', type: 'work', time: '', reminder: false });
                            setEditingEventId(null);
                            setShowEventModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Event
                    </button>
                </div>
            </div>

            {/* Event Modal */}
            {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-up">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">{editingEventId ? 'Edit Event' : 'Add New Event'}</h3>
                            <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Meeting with client..."
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                                    <select
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="work">Work</option>
                                        <option value="personal">Personal</option>
                                        <option value="important">Important</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time (Optional)</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newEvent.reminder}
                                    onChange={(e) => setNewEvent({ ...newEvent, reminder: e.target.checked })}
                                    className="rounded border-slate-300 text-primary focus:ring-primary"
                                    id="reminder"
                                />
                                <label htmlFor="reminder" className="text-sm text-slate-700 dark:text-slate-300">Set Reminder</label>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
                            <button onClick={() => setShowEventModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleAddEvent} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg shadow transition-colors">Save Event</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarWidget;

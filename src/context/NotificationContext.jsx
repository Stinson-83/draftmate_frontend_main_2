import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

/**
 * Get current user ID from localStorage
 */
const getUserId = () => {
    try {
        const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        return userProfile.email || userProfile.id || 'guest';
    } catch {
        return 'guest';
    }
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch notifications from backend
     */
    const fetchNotifications = useCallback(async (options = {}) => {
        const userId = getUserId();
        if (userId === 'guest') return;

        setLoading(true);
        setError(null);

        try {
            const data = await api.getNotifications(userId, options);
            setNotifications(data);

            // Calculate unread count
            const unread = data.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Sync calendar events to notifications (on mount)
     */
    const syncCalendarEvents = useCallback(async () => {
        const userId = getUserId();
        if (userId === 'guest') return;

        try {
            const calendarKey = `${userId}_calendar_events`;
            const calendarData = localStorage.getItem(calendarKey);
            if (!calendarData) return;

            const events = JSON.parse(calendarData);
            const now = new Date();

            // Get events from next 7 days
            Object.entries(events).forEach(([dateKey, dayEvents]) => {
                const eventDate = new Date(dateKey);
                const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 7) {
                    dayEvents.forEach(async (event) => {
                        const syncKey = `synced_notification_${event.id}`;
                        if (localStorage.getItem(syncKey)) return;

                        try {
                            await api.createNotification({
                                user_id: userId,
                                type: 'calendar',
                                title: event.title,
                                message: `Scheduled for ${eventDate.toLocaleDateString()} ${event.time ? `at ${event.time}` : ''}`,
                                metadata: { event_id: event.id, event_type: event.type }
                            });
                            localStorage.setItem(syncKey, 'true');
                        } catch (err) {
                            console.error('Failed to sync calendar event:', err);
                        }
                    });
                }
            });
        } catch (err) {
            console.error('Failed to sync calendar events:', err);
        }
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        fetchNotifications();
        syncCalendarEvents();

        // Poll every 30 seconds
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchNotifications, syncCalendarEvents]);

    /**
     * Mark a notification as read
     */
    const markAsRead = async (notificationId) => {
        try {
            await api.markNotificationRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    /**
     * Mark all as read
     */
    const markAllAsRead = async () => {
        const userId = getUserId();
        try {
            await api.markAllNotificationsRead(userId);
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    /**
     * Delete a notification
     */
    const deleteNotification = async (notificationId) => {
        try {
            await api.deleteNotification(notificationId);
            setNotifications(prev => {
                const notif = prev.find(n => n.id === notificationId);
                if (notif && !notif.read) {
                    setUnreadCount(c => Math.max(0, c - 1));
                }
                return prev.filter(n => n.id !== notificationId);
            });
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    /**
     * Clear all notifications
     */
    const clearAll = async () => {
        const userId = getUserId();
        try {
            await api.deleteAllNotifications(userId);
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to clear all:', err);
        }
    };

    /**
     * Add a new notification
     */
    const addNotification = async (notification) => {
        const userId = getUserId();
        try {
            const created = await api.createNotification({
                user_id: userId,
                ...notification
            });
            setNotifications(prev => [created, ...prev]);
            setUnreadCount(prev => prev + 1);
            return created;
        } catch (err) {
            console.error('Failed to create notification:', err);
            throw err;
        }
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        refresh: fetchNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;

import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    // Mock notification data - will be replaced with API calls later
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'calendar',
            title: 'Upcoming Hearing',
            message: 'Hearing for Case #2024-001 scheduled for tomorrow at 10:00 AM',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: false,
        },
        {
            id: 2,
            type: 'document',
            title: 'Draft Updated',
            message: 'Your petition draft has been auto-saved',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            read: false,
        },
        {
            id: 3,
            type: 'ai',
            title: 'AI Suggestion',
            message: 'New legal precedent found for your research query',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            read: false,
        },
    ]);

    const [unreadCount, setUnreadCount] = useState(0);

    // Calculate unread count whenever notifications change
    useEffect(() => {
        const count = notifications.filter(n => !n.read).length;
        setUnreadCount(count);
    }, [notifications]);

    // Mark a notification as read
    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            )
        );
    };

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    // Clear all notifications
    const clearAll = () => {
        setNotifications([]);
    };

    // Add a new notification (for future use)
    const addNotification = (notification) => {
        setNotifications(prev => [
            {
                id: Date.now(),
                read: false,
                timestamp: new Date(),
                ...notification,
            },
            ...prev,
        ]);
    };

    const value = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        addNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;

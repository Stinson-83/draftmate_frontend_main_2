import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import fullLogo from '../assets/FULL_LOGO.svg';

const Notifications = () => {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refresh
    } = useNotifications();

    const [activeTab, setActiveTab] = useState('all');
    const [hoveredId, setHoveredId] = useState(null);

    useEffect(() => {
        document.title = 'Notifications - DraftMate';
        window.scrollTo(0, 0);
        refresh();
    }, [refresh]);

    // Filter notifications based on active tab
    const filteredNotifications = useMemo(() => {
        switch (activeTab) {
            case 'unread':
                return notifications.filter(n => !n.read);
            case 'calendar':
                return notifications.filter(n => n.type === 'calendar');
            case 'document':
                return notifications.filter(n => n.type === 'document');
            case 'ai':
                return notifications.filter(n => n.type === 'ai' || n.type === 'system');
            default:
                return notifications;
        }
    }, [notifications, activeTab]);

    const tabs = [
        { id: 'all', label: 'All', icon: 'inbox', count: notifications.length },
        { id: 'unread', label: 'Unread', icon: 'mark_email_unread', count: unreadCount },
        { id: 'calendar', label: 'Calendar', icon: 'calendar_month', count: notifications.filter(n => n.type === 'calendar').length },
        { id: 'document', label: 'Documents', icon: 'description', count: notifications.filter(n => n.type === 'document').length },
        { id: 'ai', label: 'AI & System', icon: 'smart_toy', count: notifications.filter(n => n.type === 'ai' || n.type === 'system').length },
    ];

    const getTypeIcon = (type) => {
        switch (type) {
            case 'calendar': return 'calendar_month';
            case 'document': return 'description';
            case 'ai': return 'smart_toy';
            case 'system': return 'settings';
            case 'reminder': return 'alarm';
            default: return 'notifications';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'calendar': return 'from-blue-500 to-cyan-500';
            case 'document': return 'from-emerald-500 to-teal-500';
            case 'ai': return 'from-purple-500 to-pink-500';
            case 'system': return 'from-slate-500 to-gray-500';
            case 'reminder': return 'from-amber-500 to-orange-500';
            default: return 'from-primary to-blue-500';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const upcomingFeatures = [
        { icon: 'phone_android', label: 'Push Notifications', description: 'Get instant alerts on mobile' },
        { icon: 'gavel', label: 'Case Updates', description: 'Track case status changes' },
        { icon: 'group', label: 'Team Collaboration', description: 'Shared document alerts' },
        { icon: 'lightbulb', label: 'AI Insights', description: 'Smart recommendations' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <header className="relative z-50 flex items-center justify-between px-6 py-4 lg:px-20 border-b border-white/10 backdrop-blur-sm">
                <Link to="/" className="flex items-center gap-4">
                    <div className="h-8 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1 shadow-sm hover:bg-white transition-colors">
                        <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    <button
                        onClick={refresh}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="Refresh"
                    >
                        <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                    <Link to="/dashboard/home" className="text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Dashboard
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 lg:py-12">
                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/20">
                            <span className="material-symbols-outlined text-3xl text-white">notifications</span>
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white">Notifications</h1>
                            <p className="text-slate-400 text-sm">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">done_all</span>
                                Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">delete_sweep</span>
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all
                                ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/30'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                                }
                            `}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`
                                    px-2 py-0.5 rounded-full text-xs font-bold
                                    ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'}
                                `}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Notification List */}
                <div className="space-y-3">
                    {loading && filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <span className="material-symbols-outlined text-5xl animate-spin mb-4">progress_activity</span>
                            <p>Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-4xl text-slate-600">inbox</span>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-300 mb-1">No notifications</h3>
                            <p className="text-slate-500 text-sm">
                                {activeTab === 'unread' ? "You're all caught up!" : "Nothing to show here yet."}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                onMouseEnter={() => setHoveredId(notification.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => !notification.read && markAsRead(notification.id)}
                                className={`
                                    group relative p-4 lg:p-5 rounded-2xl border backdrop-blur-sm cursor-pointer transition-all duration-300
                                    ${notification.read
                                        ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                                        : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08] shadow-lg shadow-black/20'
                                    }
                                `}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`
                                        relative size-12 rounded-xl flex items-center justify-center shrink-0
                                        bg-gradient-to-br ${getTypeColor(notification.type)} shadow-lg
                                    `}>
                                        <span className="material-symbols-outlined text-xl text-white">
                                            {getTypeIcon(notification.type)}
                                        </span>
                                        {/* Unread indicator */}
                                        {!notification.read && (
                                            <div className="absolute -top-1 -right-1 size-3 bg-blue-500 rounded-full border-2 border-slate-900 animate-pulse" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`font-semibold line-clamp-1 ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-slate-500 whitespace-nowrap">
                                                {formatTimestamp(notification.timestamp)}
                                            </span>
                                        </div>
                                        <p className={`text-sm line-clamp-2 ${notification.read ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {notification.message}
                                        </p>

                                        {/* Type badge */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`
                                                px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                                                bg-white/5 text-slate-400
                                            `}>
                                                {notification.type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className={`
                                        flex items-center gap-1 transition-opacity duration-200
                                        ${hoveredId === notification.id ? 'opacity-100' : 'opacity-0'}
                                    `}>
                                        {!notification.read && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-green-400"
                                                title="Mark as read"
                                            >
                                                <span className="material-symbols-outlined text-lg">check</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Coming Soon Section */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="text-center mb-8">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium mb-4">
                            <span className="material-symbols-outlined text-lg">rocket_launch</span>
                            Coming Soon
                        </span>
                        <h2 className="text-xl lg:text-2xl font-bold text-white">Advanced Notification Features</h2>
                        <p className="text-slate-400 mt-2 max-w-lg mx-auto">
                            We're working on exciting new ways to keep you informed
                        </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {upcomingFeatures.map((feature, idx) => (
                            <div
                                key={idx}
                                className="p-5 bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all group text-center"
                            >
                                <div className="size-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-amber-400/10 to-orange-500/10 flex items-center justify-center group-hover:from-amber-400/20 group-hover:to-orange-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-xl text-amber-400">{feature.icon}</span>
                                </div>
                                <h3 className="font-semibold text-white text-sm mb-1">{feature.label}</h3>
                                <p className="text-xs text-slate-500">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Notifications;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarWidget from '../components/CalendarWidget';
import ProfileCompletionCard from '../components/ProfileCompletionCard';

const ActionButton = ({ onClick }) => (
    <button onClick={onClick} className="text-slate-400 hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-lg">edit</span>
    </button>
);

const Dashboard = () => {
    const navigate = useNavigate();

    // Dynamic User Data
    const [userProfile, setUserProfile] = useState(() => {
        const saved = localStorage.getItem('user_profile');
        return saved ? JSON.parse(saved) : { name: "Attorney Davis" };
    });

    const [currentDate, setCurrentDate] = useState(new Date());

    React.useEffect(() => {
        document.title = 'Dashboard | DraftMate';

        const handleProfileUpdate = () => {
            const saved = localStorage.getItem('user_profile');
            if (saved) setUserProfile(JSON.parse(saved));
        };
        window.addEventListener('user_profile_updated', handleProfileUpdate);

        // Update date every minute to ensure correctness
        const interval = setInterval(() => setCurrentDate(new Date()), 60000);

        return () => {
            window.removeEventListener('user_profile_updated', handleProfileUpdate);
            clearInterval(interval);
        };
    }, []);

    const dateStr = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });


    const [allDrafts, setAllDrafts] = useState([]);
    const [showAll, setShowAll] = useState(false);

    React.useEffect(() => {
        const loadDrafts = () => {
            try {
                const savedDrafts = JSON.parse(localStorage.getItem('my_drafts') || '[]');

                // Sort by lastModified (newest first)
                const sortedDrafts = savedDrafts.sort((a, b) =>
                    new Date(b.lastModified) - new Date(a.lastModified)
                );

                // Process all drafts
                const processedDrafts = sortedDrafts.map(draft => {
                    const status = draft.status || 'In progress';
                    let statusColor = 'yellow';

                    if (status === 'Started') statusColor = 'gray';
                    else if (status === 'In progress') statusColor = 'yellow';
                    else if (status === 'Review') statusColor = 'blue';
                    else if (status === 'Completed') statusColor = 'green';
                    else if (status === 'Overdue') statusColor = 'red';

                    return {
                        id: draft.id,
                        title: draft.name || "Untitled Draft",
                        modified: new Date(draft.lastModified).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        status: status,
                        statusColor: statusColor,
                        // Data needed for editor
                        content: draft.content,
                        placeholders: draft.placeholders,
                        rawName: draft.name
                    };
                });

                setAllDrafts(processedDrafts);
            } catch (error) {
                console.error("Failed to load drafts for dashboard", error);
                setAllDrafts([]);
            }
        };

        loadDrafts();

        // Listen for updates
        window.addEventListener('storage', loadDrafts);
        return () => window.removeEventListener('storage', loadDrafts);
    }, []);

    const visibleDrafts = showAll ? allDrafts : allDrafts.slice(0, 5);

    const renderStatusBadge = (status, color) => {
        const colorClasses = {
            yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500",
            blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            gray: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color] || colorClasses.blue}`}>
                {status}
            </span>
        );
    };

    const handleEditDraft = (draft) => {
        navigate('/dashboard/editor', {
            state: {
                htmlContent: draft.content,
                placeholders: draft.placeholders || [],
                uploadDetails: `Draft: ${draft.rawName}`,
                isEmpty: false,
                isSavedDraft: true,
                id: draft.id
            }
        });
    };

    return (
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-background-light dark:bg-background-dark font-display">
            {/* Header is handled in MainLayout, but structure here assumes full page content area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
                <div className="max-w-[1400px] mx-auto space-y-8">

                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Hello, {userProfile.name} !</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Here is your daily overview for <span className="font-medium text-slate-700 dark:text-slate-300">{dateStr}</span>.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-white dark:bg-[#151f2e] rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Online Status</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Active Descriptions Table */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Profile Completion Card */}
                            <ProfileCompletionCard />

                            <div className="bg-white dark:bg-[#151f2e] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Descriptions</h3>
                                    <button
                                        onClick={() => setShowAll(!showAll)}
                                        className="text-sm font-medium text-primary hover:underline"
                                    >
                                        {showAll ? 'Show Less' : 'View All'}
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                                            <tr>
                                                <th className="px-6 py-3 font-medium" scope="col">Document Title</th>
                                                <th className="px-6 py-3 font-medium" scope="col">Last Modified</th>
                                                <th className="px-6 py-3 font-medium" scope="col">Status</th>
                                                <th className="px-6 py-3 font-medium text-right" scope="col">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {visibleDrafts.map((item, index) => (
                                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.title}</td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.modified}</td>
                                                    <td className="px-6 py-4">
                                                        {renderStatusBadge(item.status, item.statusColor)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <ActionButton onClick={() => handleEditDraft(item)} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Calendar & Agenda */}
                        <div className="xl:col-span-1 space-y-6">
                            <CalendarWidget />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

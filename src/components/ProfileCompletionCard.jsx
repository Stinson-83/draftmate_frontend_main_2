import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../services/endpoints';

/**
 * Calculate profile completion percentage based on filled fields
 */
const calculateProfileCompletion = (profile) => {
    if (!profile) return { percentage: 0, missingFields: ['firstName', 'lastName', 'role', 'workplace', 'bio'] };

    const fields = [
        { key: 'firstName', label: 'First Name', icon: 'person' },
        { key: 'lastName', label: 'Last Name', icon: 'badge' },
        { key: 'role', label: 'Role / Designation', icon: 'work' },
        { key: 'workplace', label: 'Workplace', icon: 'business' },
        { key: 'bio', label: 'Bio', icon: 'description' }
    ];

    const filledFields = fields.filter(f => profile[f.key] && profile[f.key].trim() !== '');
    const missingFields = fields.filter(f => !profile[f.key] || profile[f.key].trim() === '');
    const percentage = Math.round((filledFields.length / fields.length) * 100);

    return { percentage, missingFields, filledFields };
};

const ProfileCompletionCard = () => {
    const navigate = useNavigate();

    // Get user profile from localStorage
    const [profile, setProfile] = React.useState(() => {
        const saved = localStorage.getItem('user_profile');
        return saved ? JSON.parse(saved) : null;
    });

    // Listen for profile updates
    // Listen for profile updates and load from API
    React.useEffect(() => {
        const loadProfile = async () => {
            const userId = localStorage.getItem('user_id');
            if (userId) {
                try {
                    const res = await fetch(`${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.GET_PROFILE(userId)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && Object.keys(data).length > 0) {
                            setProfile(prev => {
                                // Prevent update if data is identical
                                if (JSON.stringify(prev) === JSON.stringify({ ...prev, ...data })) {
                                    return prev;
                                }
                                return { ...prev, ...data };
                            });
                        }
                    }
                } catch (e) {
                    console.error("Profile fetch error", e);
                }
            }
        };
        loadProfile();

        const handleUpdate = () => {
            const saved = localStorage.getItem('user_profile');
            if (saved) setProfile(JSON.parse(saved));
        };
        window.addEventListener('user_profile_updated', handleUpdate);
        return () => window.removeEventListener('user_profile_updated', handleUpdate);
    }, []);

    const { percentage, missingFields } = calculateProfileCompletion(profile);

    // Hide card if profile is complete
    if (percentage === 100) return null;

    const isComplete = percentage === 100;

    // Circular progress variables
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative bg-white dark:bg-[#151f2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
            {/* Gradient accent at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            {/* Ambient glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="p-6 relative">
                <div className="flex items-center gap-5">
                    {/* User Avatar with Progress Ring */}
                    <div className="relative flex-shrink-0">
                        {/* SVG Progress Ring */}
                        <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="none"
                                className="text-slate-200 dark:text-slate-700"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                stroke="url(#progressGradient)"
                                strokeWidth="6"
                                fill="none"
                                strokeLinecap="round"
                                style={{
                                    strokeDasharray: circumference,
                                    strokeDashoffset: strokeDashoffset,
                                    transition: 'stroke-dashoffset 0.8s ease-out'
                                }}
                            />
                            {/* Gradient definition */}
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* User Image */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                className="w-16 h-16 rounded-full bg-cover bg-center ring-2 ring-white dark:ring-slate-800 shadow-md"
                                style={{
                                    backgroundImage: `url('${profile?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCf79wuBAV_uurpxIHNj8aieGbEhEXhNnnRbN4i6y6PB0cDQAIRL9j87KI1_P114LVgr1D83UM0cCNfd5rdo7Lgoukm2J7UpdQlshSXI1k296RyvODHng12-_Tgx2DvQBf07mko3b0GUnUqoofVCNHdDorsXylCZ2ZYcheYqOrU1fK68F4Io3yKaBeUc1s9moLHx_8V9HmPO4qleggBYJCVjxMsWblqTXMqk29SbcNjAAARdb2_y7Y7m6e7d39-tfL7WBs3YUvm84U"}')`
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {isComplete ? 'Profile Complete!' : 'Complete Your Profile'}
                            </h3>
                            <span className={`text-2xl font-bold ${isComplete ? 'text-green-500' : 'text-blue-600'}`}>
                                {percentage}%
                            </span>
                        </div>

                        {isComplete ? (
                            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                All profile details are filled
                            </p>
                        ) : (
                            <>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                    Complete your profile to unlock all features
                                </p>

                                {/* Missing fields */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {missingFields.slice(0, 3).map((field) => (
                                        <span
                                            key={field.key}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full"
                                        >
                                            <span className="material-symbols-outlined text-sm">{field.icon}</span>
                                            {field.label}
                                        </span>
                                    ))}
                                    {missingFields.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full">
                                            +{missingFields.length - 3} more
                                        </span>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => navigate('/dashboard/settings')}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg shadow-md hover:shadow-lg shadow-blue-500/25 transition-all duration-200 group/btn"
                                >
                                    Complete Profile
                                    <span className="material-symbols-outlined text-lg group-hover/btn:translate-x-0.5 transition-transform">arrow_forward</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionCard;

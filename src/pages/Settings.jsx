import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import MiniEditor from '../components/MiniEditor';
import { API_CONFIG } from '../services/endpoints';

const PersonalSettings = () => {
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        role: '',
        workplace: '',
        email: '',
        bio: '',
        image: ''
    });

    useEffect(() => {
        // Load from API if user is logged in
        const userId = localStorage.getItem('user_id');
        if (userId) {
            fetch(`${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.GET_PROFILE(userId)}`)
                .then(res => res.json())
                .then(data => {
                    if (data && Object.keys(data).length > 0) {
                        setProfile(prev => ({
                            ...prev,
                            firstName: data.firstName || prev.firstName,
                            lastName: data.lastName || prev.lastName,
                            role: data.role || prev.role,
                            workplace: data.workplace || prev.workplace,
                            email: prev.email, // Email usually comes from auth, not editable here directly easily without more logic
                            bio: data.bio || prev.bio,
                            image: data.image || prev.image
                        }));
                        // Sync to local storage for other components
                        const currentLocal = JSON.parse(localStorage.getItem('user_profile') || '{}');
                        localStorage.setItem('user_profile', JSON.stringify({ ...currentLocal, ...data }));
                    }
                })
                .catch(err => console.error("Failed to load profile", err));
        }

        const saved = localStorage.getItem('user_profile');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Split name if needed or use fields if existing
            const nameParts = (parsed.name || '').split(' ');
            setProfile(prev => ({
                ...prev,
                firstName: parsed.firstName || nameParts[0] || prev.firstName,
                lastName: parsed.lastName || nameParts.slice(1).join(' ') || prev.lastName,
                role: parsed.role || prev.role,
                workplace: parsed.workplace || prev.workplace,
                email: parsed.email || prev.email,
                bio: parsed.bio || prev.bio,
                image: parsed.image || prev.image
            }));
        }
    }, []);

    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("Image size should be less than 5MB");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteImage = () => {
        setProfile(prev => ({
            ...prev,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCf79wuBAV_uurpxIHNj8aieGbEhEXhNnnRbN4i6y6PB0cDQAIRL9j87KI1_P114LVgr1D83UM0cCNfd5rdo7Lgoukm2J7UpdQlshSXI1k296RyvODHng12-_Tgx2DvQBf07mko3b0GUnUqoofVCNHdDorsXylCZ2ZYcheYqOrU1fK68F4Io3yKaBeUc1s9moLHx_8V9HmPO4qleggBYJCVjxMsWblqTXMqk29SbcNjAAARdb2_y7Y7m6e7d39-tfL7WBs3YUvm84U"
        }));
    };

    const handleSave = async () => {
        const fullName = `${profile.firstName} ${profile.lastName}`.trim();
        const updatedProfile = {
            ...profile,
            name: fullName
        };

        // Save to Database
        const userId = localStorage.getItem('user_id');
        if (userId) {
            try {
                await fetch(`${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.UPDATE_PROFILE}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        role: profile.role,
                        workplace: profile.workplace,
                        bio: profile.bio,
                        image: profile.image
                    })
                });
            } catch (err) {
                console.error("Failed to save profile to DB", err);
                toast.error("Failed to save to database, but saved locally.");
            }
        }

        localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
        window.dispatchEvent(new Event('user_profile_updated'));
        toast.success('Personal profile updated successfully!');
    };
    // Calculate completion percentage
    const calculateCompletion = () => {
        const fields = ['firstName', 'lastName', 'role', 'workplace', 'bio'];
        const filled = fields.filter(f => profile[f] && profile[f].trim() !== '').length;
        return Math.round((filled / fields.length) * 100);
    };

    const completionPercentage = calculateCompletion();
    const isComplete = completionPercentage === 100;

    return (
        <div className="flex flex-col gap-6">
            {/* Header with Progress */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-[#0d131b] dark:text-white tracking-tight text-[32px] font-bold leading-tight">Personal Profile</h1>
                        <p className="text-[#4c6c9a] text-base font-normal leading-normal">Manage your personal information and public profile visible to clients and colleagues.</p>
                    </div>
                    {/* Completion Badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isComplete ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                        <span className={`material-symbols-outlined text-lg ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                            {isComplete ? 'check_circle' : 'pending'}
                        </span>
                        <span className={`text-sm font-semibold ${isComplete ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}`}>
                            {completionPercentage}% Complete
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'}`}
                        style={{ width: `${completionPercentage}%` }}
                    ></div>
                </div>

                {/* Incomplete Fields Hint */}
                {!isComplete && (
                    <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span>Missing:</span>
                        {!profile.firstName && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">First Name</span>}
                        {!profile.lastName && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">Last Name</span>}
                        {!profile.role && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">Role</span>}
                        {!profile.workplace && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">Workplace</span>}
                        {!profile.bio && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">Bio</span>}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Profile Picture Section */}
                <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-24 sm:size-32 shadow-inner ring-4 ring-white dark:ring-slate-800"
                            style={{ backgroundImage: `url('${profile.image}')` }}></div>
                        <div className="flex flex-col gap-3 text-center sm:text-left pt-2">
                            <div>
                                <h3 className="text-[#0d131b] dark:text-white text-xl font-bold leading-tight">Profile Picture</h3>
                                <p className="text-[#4c6c9a] text-sm mt-1 max-w-sm">We recommend an image of at least 400x400px. JPG or PNG allowed.</p>
                            </div>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="flex items-center justify-center rounded-lg h-9 px-4 bg-white dark:bg-slate-700 border border-[#cfd9e7] dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-[#0d131b] dark:text-white text-sm font-medium transition-colors shadow-sm"
                                >
                                    Upload New
                                </button>
                                <button
                                    onClick={handleDeleteImage}
                                    className="flex items-center justify-center rounded-lg h-9 px-4 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-sm font-medium transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-6 sm:p-8 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                        <label className="flex flex-col flex-1">
                            <span className="text-[#0d131b] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">First Name</span>
                            <input
                                name="firstName"
                                value={profile.firstName}
                                onChange={handleChange}
                                className="form-input flex w-full rounded-lg text-[#0d131b] dark:text-white border border-[#cfd9e7] dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 px-4 text-base placeholder:text-[#94a3b8] transition-all"
                                placeholder="e.g. Jane"
                            />
                        </label>
                        <label className="flex flex-col flex-1">
                            <span className="text-[#0d131b] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">Last Name</span>
                            <input
                                name="lastName"
                                value={profile.lastName}
                                onChange={handleChange}
                                className="form-input flex w-full rounded-lg text-[#0d131b] dark:text-white border border-[#cfd9e7] dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 px-4 text-base placeholder:text-[#94a3b8] transition-all"
                                placeholder="e.g. Doe"
                            />
                        </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6">
                        <label className="flex flex-col flex-1">
                            <span className="text-[#0d131b] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">Role / Designation</span>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-[#94a3b8]" style={{ fontSize: '20px' }}>badge</span>
                                </div>
                                <input
                                    name="role"
                                    value={profile.role}
                                    onChange={handleChange}
                                    className="form-input flex w-full rounded-lg text-[#0d131b] dark:text-white border border-[#cfd9e7] dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 pl-10 pr-4 text-base placeholder:text-[#94a3b8] transition-all"
                                    placeholder="e.g. Senior Associate"
                                />
                            </div>
                        </label>
                        <label className="flex flex-col flex-1">
                            <span className="text-[#0d131b] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">Current Workplace</span>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-[#94a3b8]" style={{ fontSize: '20px' }}>business</span>
                                </div>
                                <input
                                    name="workplace"
                                    value={profile.workplace}
                                    onChange={handleChange}
                                    className="form-input flex w-full rounded-lg text-[#0d131b] dark:text-white border border-[#cfd9e7] dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 pl-10 pr-4 text-base placeholder:text-[#94a3b8] transition-all"
                                    placeholder="e.g. Law Firm LLC"
                                />
                            </div>
                        </label>
                    </div>

                    <div className="flex flex-col">
                        <label className="flex flex-col w-full sm:w-1/2 pr-0 sm:pr-3">
                            <span className="text-[#0d131b] dark:text-slate-200 text-sm font-semibold leading-normal pb-2">Email Address</span>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-[#94a3b8]" style={{ fontSize: '20px' }}>mail</span>
                                </div>
                                <input
                                    name="email"
                                    value={profile.email}
                                    readOnly
                                    className="form-input flex w-full rounded-lg text-[#64748b] bg-slate-50 dark:bg-slate-900 border border-[#cfd9e7] dark:border-slate-700 h-11 pl-10 pr-4 text-base cursor-not-allowed select-none"
                                />
                            </div>
                            <span className="text-xs text-[#4c6c9a] mt-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">lock</span>
                                Contact your administrator to change your email.
                            </span>
                        </label>
                    </div>

                    <div className="flex flex-col">
                        <label className="flex flex-col w-full">
                            <div className="flex justify-between items-end pb-2">
                                <span className="text-[#0d131b] dark:text-slate-200 text-sm font-semibold leading-normal">Bio / About</span>
                                <span className="text-xs text-[#4c6c9a]">Max 500 characters</span>
                            </div>
                            <textarea
                                name="bio"
                                value={profile.bio}
                                onChange={handleChange}
                                className="form-textarea flex w-full rounded-lg text-[#0d131b] dark:text-white border border-[#cfd9e7] dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[120px] p-4 text-base placeholder:text-[#94a3b8] resize-y transition-all"
                                placeholder="Brief description of your practice areas and experience..."
                            />
                        </label>
                    </div>
                </div>

                <div className="p-6 sm:p-8 bg-[#f8fafc] dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex flex-col-reverse sm:flex-row justify-end gap-4">
                    <button className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-white dark:bg-transparent border border-[#cfd9e7] dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0d131b] dark:text-white text-sm font-bold shadow-sm transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-primary hover:bg-blue-600 text-slate-50 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const HEADER_TEMPLATES = [
    {
        label: "Standard Firm (Centered)",
        content: `<div style="text-align: center;">
    <p style="font-size: 18pt; font-weight: bold; margin-bottom: 0;">EXAMPLE USER & COMPANY</p>
    <p style="font-size: 12pt; font-weight: bold; margin-top: 0; margin-bottom: 5px;">CHARTERED ACCOUNTANT</p>
    <p style="font-size: 10pt; margin: 0;">211, example building, example road,</p>
    <p style="font-size: 10pt; margin: 0;">example city – 110xxx (India)</p>
    <p style="font-size: 10pt; margin: 0;">Phone: 011- 2345xxxx</p>
    <p style="font-size: 10pt; margin: 0;"><strong>Email Id.:</strong> info@example.com</p>
    <hr style="border-top: 2px solid black; margin-top: 10px;" />
</div>`
    },
    {
        label: "Corporate Modern (Flex)",
        content: `<div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #334155; padding-bottom: 10px;">
    <div>
        <span style="font-size: 24px; font-weight: bold; color: #1e293b;">EXAMPLE USER & COMPANY</span>
        <span style="color: #64748b; margin-left: 10px;">Legal Consultants</span>
    </div>
    <div style="text-align: right; font-size: 12px; color: #64748b;">
        123 Legal Avenue, example city 400001<br>
        +91 98765 43210
    </div>
</div>`
    },
    {
        label: "Classic Serif",
        content: `<div style="text-align: center; font-family: 'Times New Roman', serif;">
    <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">EXAMPLE USER & COMPANY</h1>
    <p style="font-style: italic; margin: 5px 0;">Supreme Court of India</p>
    <p style="font-size: 12px; margin-top: 10px;">Chamber No. 45, Lawyers Block, example city</p>
    <div style="border-bottom: 1px double #000; margin-top: 10px;"></div>
</div>`
    }
];

const FOOTER_TEMPLATES = [
    {
        label: "Authorized Signatory",
        content: `<div style="margin-top: 20px;">
    <p style="font-weight: bold; margin: 0;">Authorized Representative</p>
    <p style="font-weight: bold; margin: 0;">Mahesh Kumar & Co.</p>
</div>`
    },
    {
        label: "Confidentiality Notice",
        content: `<div style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: center;">
    <p>This document contains confidential information intended only for the use of the individual or entity named above. If you are not the intended recipient, you are hereby notified that any dissemination, distribution, or copying of this communication is strictly prohibited.</p>
</div>`
    },
    {
        label: "Simple Contact",
        content: `<div style="display: flex; justify-content: space-between; border-top: 3px solid #0f172a; padding-top: 10px; font-size: 11px;">
    <span>www.example.com</span>
    <span>contact@example.com</span>
</div>`
    }
];

const TemplateDropdown = ({ label, templates, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-100"
            >
                <span>{label}</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-20 py-1 overflow-hidden animate-fade-in">
                        <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            Select a template
                        </div>
                        {templates.map((t, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    onSelect(t.content);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary transition-colors flex items-center gap-2 group"
                            >
                                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary">description</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const SaveTemplateModal = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Save Template</h3>
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Template Name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., My Custom Letterhead"
                            className="form-input rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-primary"
                            autoFocus
                        />
                    </label>
                    <div className="flex justify-end gap-3 mt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (name.trim()) onSave(name);
                                setName('');
                            }}
                            disabled={!name.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SavedDropdown = ({ templates, onSelect, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800"
            >
                <span>Saved</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-20 py-1 overflow-hidden animate-fade-in">
                        <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            Your Templates
                        </div>
                        {templates.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center italic">
                                No saved templates yet
                            </div>
                        ) : (
                            templates.map((t) => (
                                <div key={t.id} className="group flex items-center justify-between w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <button
                                        onClick={() => {
                                            onSelect(t);
                                            setIsOpen(false);
                                        }}
                                        className="flex-1 text-left text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary truncate"
                                    >
                                        {t.name}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(t.id);
                                        }}
                                        className="text-slate-400 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete template"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const DocumentSettings = () => {
    const [settings, setSettings] = useState({
        headerText: '',
        footerText: ''
    });
    const [savedTemplates, setSavedTemplates] = useState([]);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('user_settings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }

        const templates = localStorage.getItem('user_document_templates');
        if (templates) {
            setSavedTemplates(JSON.parse(templates));
        }
    }, []);

    const handleEditorChange = (field, htmlContent) => {
        setSettings(prev => ({ ...prev, [field]: htmlContent }));
    };

    const handleSave = () => {
        localStorage.setItem('user_settings', JSON.stringify(settings));
        toast.success('Document settings saved successfully!');
    };

    const handleSaveTemplate = (name) => {
        const newTemplate = {
            id: Date.now(),
            name,
            header: settings.headerText,
            footer: settings.footerText
        };
        const updatedTemplates = [...savedTemplates, newTemplate];
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('user_document_templates', JSON.stringify(updatedTemplates));
        setIsSaveModalOpen(false);
        toast.success(`Template "${name}" saved!`);
    };

    const handleLoadTemplate = (template) => {
        setSettings({
            headerText: template.header,
            footerText: template.footer
        });
        toast.success(`Loaded template "${template.name}"`);
    };

    const handleDeleteTemplate = (id) => {
        const updated = savedTemplates.filter(t => t.id !== id);
        setSavedTemplates(updated);
        localStorage.setItem('user_document_templates', JSON.stringify(updated));
        toast.success('Template deleted');
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col gap-2 max-w-2xl">
                    <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">Document Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Configure the standard layout for your generated legal documents and correspondence.</p>
                </div>
            </div>

            <div className="flex flex-col gap-8 max-w-4xl">
                <section className="flex flex-col gap-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center">
                        <div>
                            <h2 className="text-slate-900 dark:text-white text-lg font-bold">Header / Letterhead Content</h2>
                            <p className="text-xs text-slate-500 mt-1">This content will appear at the top of every page.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <SavedDropdown
                                templates={savedTemplates}
                                onSelect={handleLoadTemplate}
                                onDelete={handleDeleteTemplate}
                            />
                            <TemplateDropdown
                                label="Examples"
                                templates={HEADER_TEMPLATES}
                                onSelect={(html) => handleEditorChange('headerText', html)}
                            />
                        </div>
                    </div>
                    <div className="p-6">
                        <MiniEditor
                            value={settings.headerText}
                            onChange={(html) => handleEditorChange('headerText', html)}
                            placeholder="Enter company name, address..."
                            style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        />
                    </div>
                </section>

                <section className="flex flex-col gap-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center">
                        <div>
                            <h2 className="text-slate-900 dark:text-white text-lg font-bold">Footer Content</h2>
                            <p className="text-xs text-slate-500 mt-1">This content will appear at the bottom of every page.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <SavedDropdown
                                templates={savedTemplates}
                                onSelect={handleLoadTemplate}
                                onDelete={handleDeleteTemplate}
                            />
                            <TemplateDropdown
                                label="Examples"
                                templates={FOOTER_TEMPLATES}
                                onSelect={(html) => handleEditorChange('footerText', html)}
                            />
                        </div>
                    </div>
                    <div className="p-6">
                        <MiniEditor
                            value={settings.footerText}
                            onChange={(html) => handleEditorChange('footerText', html)}
                            placeholder="Confidentiality notice, etc..."
                            style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        />
                        <div className="min-h-[60px] w-full p-4 mt-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-center">
                            <p className="text-xs text-slate-400">Page <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">1</span> of <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">N</span></p>
                        </div>
                    </div>
                </section>

                <div className="flex items-center justify-end gap-4 pt-6 mt-4 border-t border-slate-200 dark:border-slate-800">
                    <button className="px-6 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => setIsSaveModalOpen(true)}
                        className="px-6 py-2.5 rounded-lg text-primary font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                        Save as Template
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">save</span>
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="mt-auto pt-10 text-center text-slate-400 text-xs">
                <p>© 2024 DraftMate Inc. All rights reserved.</p>
            </div>

            <SaveTemplateModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveTemplate}
            />
        </div>
    );
};


const BillingSettings = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 pb-6 border-b border-slate-200 dark:border-slate-800">
                <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">Billing & Plans</h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">Manage your subscription and billing details.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
                {/* PRO Plan */}
                <div className="flex flex-col p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-slate-100 dark:text-slate-800">rocket_launch</span>
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-4">
                            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary text-xs font-bold uppercase tracking-wider">Most Popular</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-white text-2xl font-bold mb-2">PRO</h2>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">₹599</span>
                            <span className="text-slate-500 font-medium">/month</span>
                        </div>
                        <ul className="flex flex-col gap-4 mb-8 flex-1">
                            {[
                                "AI-Powered Drafting (Basic)",
                                "Access to Case Law Database",
                                "Standard Support",
                                "5GB Document Storage",
                                "PDF Tools (Basic)"
                            ].map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                                    <span className="text-sm font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-primary text-primary font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            Upgrade to Pro
                        </button>
                    </div>
                </div>

                {/* ULTRA Plan */}
                <div className="flex flex-col p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-60 transition-opacity z-0">
                        <span className="material-symbols-outlined text-6xl text-amber-500">diamond</span>
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-4">
                            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/20">Best Value</span>
                        </div>
                        <h2 className="text-white text-2xl font-bold mb-2">ULTRA</h2>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-black text-white">₹899</span>
                            <span className="text-slate-400 font-medium">/month</span>
                        </div>
                        <ul className="flex flex-col gap-4 mb-8 flex-1">
                            {[
                                "Advanced AI Drafting & Analysis",
                                "National & International Laws",
                                "Priority 24/7 Support",
                                "Unlimited Document Storage",
                                "Advanced PDF & OCR Tools",
                                "Custom Templates"
                            ].map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-slate-300">
                                    <span className="material-symbols-outlined text-amber-400 text-[20px]">check_circle</span>
                                    <span className="text-sm font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all border border-transparent">
                            Upgrade to Ultra
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 max-w-4xl">
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-slate-400">help</span>
                    <div>
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg">Need a Custom Enterprise Plan?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">For large law firms requiring multi-user access and API integrations.</p>
                    </div>
                    <button className="ml-auto px-6 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    );
};


const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('personal');
    const [userProfile, setUserProfile] = useState({});

    useEffect(() => {
        const saved = localStorage.getItem('user_profile');
        if (saved) setUserProfile(JSON.parse(saved));

        const handleUpdate = () => {
            const updated = localStorage.getItem('user_profile');
            if (updated) setUserProfile(JSON.parse(updated));
        };
        window.addEventListener('user_profile_updated', handleUpdate);
        return () => window.removeEventListener('user_profile_updated', handleUpdate);
    }, []);

    const NavButton = ({ id, icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors group ${activeTab === id
                ? 'bg-[#e7ecf3] dark:bg-slate-700/50'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
        >
            <span
                className={`material-symbols-outlined ${activeTab === id ? 'text-[#0d131b] dark:text-white group-hover:text-primary' : 'text-[#4c6c9a] group-hover:text-[#0d131b] dark:group-hover:text-white'}`}
                style={{ fontSize: '22px' }}
            >
                {icon}
            </span>
            <p className={`${activeTab === id ? 'text-[#0d131b] dark:text-white' : 'text-[#4c6c9a] group-hover:text-[#0d131b] dark:group-hover:text-white'} text-sm font-medium leading-normal`}>
                {label}
            </p>
        </button>
    );

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Settings Sidebar */}
            <aside className="w-72 flex-shrink-0 h-full overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151f2e] hidden lg:block">
                <div className="p-6 flex flex-col gap-6">


                    {/* Navigation */}
                    <nav className="flex flex-col gap-1">
                        <div className="px-3 py-2 text-xs font-semibold text-[#4c6c9a] uppercase tracking-wider">Settings</div>
                        <NavButton id="personal" icon="person" label="Personal Settings" />
                        <NavButton id="document" icon="description" label="Document Settings" />
                        <NavButton id="billing" icon="credit_card" label="Billing & Plans" />
                        <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>
                        <button
                            onClick={async () => {
                                const sessionId = localStorage.getItem('session_id');
                                try {
                                    if (sessionId) {
                                        const logoutUrl = `${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.LOGOUT}`;
                                        await fetch(logoutUrl, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ session_id: sessionId })
                                        });
                                    }
                                } catch (error) {
                                    console.error('Logout failed:', error);
                                } finally {
                                    // User requested to NOT clear local storage on logout
                                    // localStorage.removeItem('session_id');
                                    // localStorage.removeItem('user_id');
                                    // localStorage.removeItem('user_profile');

                                    toast.success('Logged out successfully');
                                    navigate('/login');
                                }
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group w-full text-left"
                        >
                            <span className="material-symbols-outlined text-[#4c6c9a] group-hover:text-red-600" style={{ fontSize: '22px' }}>logout</span>
                            <p className="text-[#4c6c9a] group-hover:text-red-600 text-sm font-medium leading-normal">Sign Out</p>
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto min-w-0">
                <div className="p-8 max-w-[1200px] mx-auto w-full">
                    {/* Mobile Back Button */}


                    {activeTab === 'personal' && <PersonalSettings />}
                    {activeTab === 'document' && <DocumentSettings />}
                    {activeTab === 'billing' && <BillingSettings />}
                </div>
            </main>
        </div>
    );
};

export default Settings;

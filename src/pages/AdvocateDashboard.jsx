/**
 * AdvocateDashboard — Full fixes applied:
 * - Logout button with token clearing
 * - Token expiry handled — redirects to login with message
 * - Profile image upload UI
 * - Missing fields: bio, years_experience, languages, court_affiliation, practice_areas, office_address
 * - Experience, Education, Certifications sections
 * - Analytics tab with real DB data
 * - Profile completion score from server
 */

import React, { useState, useEffect } from 'react';
import {
    Save, User, Calendar, MessageCircle, ShieldCheck, Clock,
    XCircle, CheckCircle2, LogOut, BarChart2, Eye, Share2,
    TrendingUp, Upload, Trash2, AlertCircle, Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
    advocateAuth, advocateProfile, advocateConsultations,
    advocateMessages, advocateVerification, advocateAnalytics,
    tokens,
} from '../services/advocateApi';

const LANGUAGE_OPTIONS = [
    'English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada',
    'Gujarati', 'Bengali', 'Punjabi', 'Malayalam', 'Urdu', 'Odia',
];

const PRACTICE_AREA_OPTIONS = [
    'Criminal Law', 'Corporate Law', 'Family Law', 'Cyber Law', 'Tax Law',
    'Property Law', 'Immigration Law', 'Consumer Rights Law', 'Civil Law',
    'Startup & Business Law', 'Constitutional Law', 'Intellectual Property',
    'Labour Law', 'Environmental Law', 'Arbitration & Mediation',
    'Real Estate', 'Banking & Finance', 'Matrimonial Law',
];

export default function AdvocateDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submittingVerification, setSubmittingVerification] = useState(false);
    const [verificationDoc, setVerificationDoc] = useState(null);
    const [practiceAreas, setPracticeAreas] = useState([]);

    useEffect(() => {
        if (!tokens.getAccess()) {
            navigate('/advocate/login?session_expired=1');
            return;
        }
        fetchAll();
    }, []);

    async function fetchAll() {
        setLoading(true);
        setLoadError(null);
        try {
            const [profRes, consRes, msgRes, analyticsRes] = await Promise.allSettled([
                advocateProfile.getMe(),
                advocateConsultations.getMyConsultations(),
                advocateMessages.getMyMessages(),
                advocateAnalytics.getDashboard(),
            ]);

            if (profRes.status === 'fulfilled') {
                const p = profRes.value.data || {};
                // Ensure we have all arrays
                p.experience = Array.isArray(p.experience) ? p.experience : [];
                p.education = Array.isArray(p.education) ? p.education : [];
                p.certifications = Array.isArray(p.certifications) ? p.certifications : [];
                p.languages = Array.isArray(p.languages) ? p.languages : [];
                setProfile(p);
                setPracticeAreas(Array.isArray(p.practice_areas) ? p.practice_areas : []);
                if (p.profile_image_url) setImagePreview(p.profile_image_url);
            } else {
                throw new Error(profRes.reason?.message || 'Failed to load profile.');
            }

            if (consRes.status === 'fulfilled') setConsultations(consRes.value.data || []);
            if (msgRes.status === 'fulfilled') setMessages(msgRes.value.data || []);
            if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data || null);

        } catch (err) {
            setLoadError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const toggleLanguage = (lang) => {
        const current = Array.isArray(profile?.languages) ? profile.languages : [];
        setProfile(prev => ({
            ...prev,
            languages: current.includes(lang)
                ? current.filter(l => l !== lang)
                : [...current, lang],
        }));
    };

    const togglePracticeArea = (pa) => {
        setPracticeAreas(prev =>
            prev.includes(pa) ? prev.filter(p => p !== pa) : [...prev, pa]
        );
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB.'); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleListChange = (listName, index, field, value) => {
        setProfile(prev => ({
            ...prev,
            [listName]: prev[listName].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const addListItem = (listName, defaultItem) => {
        setProfile(prev => ({
            ...prev,
            [listName]: [...prev[listName], defaultItem]
        }));
    };

    const removeListItem = (listName, index) => {
        setProfile(prev => ({
            ...prev,
            [listName]: prev[listName].filter((_, i) => i !== index)
        }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Upload image if changed
            if (imageFile) {
                const imgRes = await advocateProfile.uploadImage(imageFile);
                setProfile(prev => ({ ...prev, profile_image_url: imgRes.url }));
                setImageFile(null);
            }

            // Save profile fields (exclude computed fields)
            const { id, user_id, slug, created_at, updated_at, is_verified,
                    profile_completion_score, practice_areas: _pa, experience, education, certifications, ...updateable } = profile;
            await advocateProfile.updateMe(updateable);

            // Sync practice areas
            await advocateProfile.updatePracticeAreas(practiceAreas);

            // Sync details
            await advocateProfile.updateDetails({
                experience,
                education,
                certifications
            });

            // Refresh profile to get new score
            const fresh = await advocateProfile.getMe();
            setProfile(fresh.data || profile);

            toast.success('Profile saved successfully.');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const [updatingStatus, setUpdatingStatus] = useState(null);
    
    const handleUpdateConsultationStatus = async (id, status) => {
        if (updatingStatus === id) return;
        setUpdatingStatus(id);
        try {
            const response = await advocateConsultations.updateStatus(id, status);
            setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: response.data.status } : c));
            toast.success(`Consultation marked as ${status.toLowerCase()}.`);
        } catch (err) {
            toast.error(err.message || 'Failed to update status.');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleMarkMessageRead = async (id) => {
        try {
            await advocateMessages.updateStatus(id, 'READ');
            setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'READ' } : m));
        } catch { /* non-critical */ }
    };

    const handleSubmitVerification = async (e) => {
        e.preventDefault();
        if (!verificationDoc) { toast.error('Please select a file.'); return; }
        setSubmittingVerification(true);
        try {
            await advocateVerification.submit(verificationDoc);
            toast.success('Verification documents submitted. We will review within 2 business days.');
            setVerificationDoc(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmittingVerification(false);
        }
    };

    const handleLogout = async () => {
        await advocateAuth.logout();
        toast.success('Logged out successfully.');
        navigate('/advocate/login');
    };

    // ── Loading & Error states ─────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center text-slate-500 animate-pulse">Loading Dashboard...</div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-800 mb-2">Failed to load dashboard</h3>
                    <p className="text-red-600 text-sm mb-6">{loadError}</p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={fetchAll} className="bg-red-600 hover:bg-red-700 text-white">
                            Retry
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/advocate/login')}>
                            Login Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const completionScore = profile?.profile_completion_score ?? 0;
    const languages = Array.isArray(profile?.languages) ? profile.languages : [];
    const pendingConsultations = consultations.filter(c => c.status === 'PENDING').length;
    const unreadMessages = messages.filter(m => m.status === 'UNREAD').length;

    // Ensure we have arrays for the dynamic sections
    const experience = Array.isArray(profile?.experience) ? profile.experience : [];
    const education = Array.isArray(profile?.education) ? profile.education : [];
    const certifications = Array.isArray(profile?.certifications) ? profile.certifications : [];

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 mt-16 pb-20 flex flex-col md:flex-row gap-8">

            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-1">
                <h2 className="text-xl font-bold mb-6 px-4">Dashboard</h2>
                {[
                    { id: 'profile', icon: User, label: 'Edit Profile' },
                    { id: 'consultations', icon: Calendar, label: 'Consultations', badge: pendingConsultations },
                    { id: 'messages', icon: MessageCircle, label: 'Messages', badge: unreadMessages },
                    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
                    { id: 'verification', icon: ShieldCheck, label: 'Verification' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                        <div className="flex items-center gap-3">
                            <tab.icon className="w-5 h-5" /> {tab.label}
                        </div>
                        {tab.badge > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{tab.badge}</span>
                        )}
                    </button>
                ))}

                <div className="pt-4 mt-4 border-t border-slate-200">
                    <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-5 h-5" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">

                {/* ── PROFILE TAB ── */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
                            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>

                        {/* Completion Score */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="text-sm font-bold text-slate-700">Profile Completion</h3>
                                <span className="font-bold text-blue-600">{completionScore}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3 overflow-hidden">
                                <div className={`h-2.5 rounded-full transition-all duration-500 ${completionScore === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                                    style={{ width: `${completionScore}%` }} />
                            </div>
                            <p className="text-xs text-slate-500">
                                {completionScore < 100
                                    ? 'Complete all sections to reach 100% and maximize marketplace visibility.'
                                    : 'Your profile is fully complete. Great work!'}
                            </p>
                        </div>

                        {/* Profile Image */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold border-b pb-4 mb-4">Profile Photo</h3>
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Profile"
                                            className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-200 shadow" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl font-bold ring-2 ring-slate-200">
                                            {(profile?.title || 'A')[0]}
                                        </div>
                                    )}
                                    {imagePreview && (
                                        <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <label className="cursor-pointer">
                                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                                            onChange={handleImageChange} />
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:border-blue-400 hover:text-blue-600 transition-all cursor-pointer">
                                            <Upload className="w-4 h-4" />
                                            {imagePreview ? 'Change Photo' : 'Upload Photo'}
                                        </div>
                                    </label>
                                    <p className="text-xs text-slate-400 mt-1.5">PNG, JPEG · Max 10 MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold border-b pb-4 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Full Name / Title</Label>
                                    <Input name="title" value={profile?.title || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Bar Council Number</Label>
                                    <Input name="bar_council_number" value={profile?.bar_council_number || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Years of Experience</Label>
                                    <Input type="number" name="years_experience" min="0"
                                        value={profile?.years_experience || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Consultation Fee (₹)</Label>
                                    <Input type="number" name="consultation_fee" min="0"
                                        value={profile?.consultation_fee || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Location (City, State)</Label>
                                    <Input name="location" value={profile?.location || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <Label>Court Affiliation</Label>
                                    <Input name="court_affiliation" value={profile?.court_affiliation || ''} onChange={handleChange} />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Office Address</Label>
                                    <Textarea name="office_address"
                                        value={profile?.office_address || ''} onChange={handleChange}
                                        placeholder="Enter your office address"
                                        className="resize-none" />
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold border-b pb-4 mb-4">Professional Bio</h3>
                            <Textarea name="bio" rows={5}
                                value={profile?.bio || ''} onChange={handleChange}
                                placeholder="Describe your expertise, experience, and what makes you unique..."
                                className="resize-none" />
                        </div>

                        {/* Languages */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold border-b pb-4 mb-4">Languages Spoken</h3>
                            <div className="flex flex-wrap gap-2">
                                {LANGUAGE_OPTIONS.map(lang => (
                                    <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                                            ${languages.includes(lang)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Practice Areas */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold border-b pb-4 mb-4">Practice Areas</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {PRACTICE_AREA_OPTIONS.map(pa => (
                                    <label key={pa}
                                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium
                                            ${practiceAreas.includes(pa)
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                        <input type="checkbox" className="hidden"
                                            checked={practiceAreas.includes(pa)}
                                            onChange={() => togglePracticeArea(pa)} />
                                        <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
                                            ${practiceAreas.includes(pa) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                            {practiceAreas.includes(pa) && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </span>
                                        {pa}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold border-b pb-4 mb-0">Experience</h3>
                                <Button type="button" size="sm" onClick={() => addListItem('experience', {
                                    company: '', role: '', start_date: '', end_date: '', is_current: false, description: ''
                                })}>
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {experience.map((exp, index) => (
                                    <div key={index} className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-slate-700">Experience #{index + 1}</span>
                                            {experience.length > 1 && (
                                                <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('experience', index)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Company/Firm</Label>
                                                <Input value={exp.company} onChange={(e) => handleListChange('experience', index, 'company', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Role</Label>
                                                <Input value={exp.role} onChange={(e) => handleListChange('experience', index, 'role', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Start Date</Label>
                                                <Input type="date" value={exp.start_date} onChange={(e) => handleListChange('experience', index, 'start_date', e.target.value)} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label>End Date</Label>
                                                {exp.is_current ? (
                                                    <Input disabled placeholder="Present" />
                                                ) : (
                                                    <Input type="date" value={exp.end_date} onChange={(e) => handleListChange('experience', index, 'end_date', e.target.value)} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3">
                                            <input type="checkbox" id={`is-current-${index}`} checked={exp.is_current}
                                                onChange={(e) => handleListChange('experience', index, 'is_current', e.target.checked)} />
                                            <Label htmlFor={`is-current-${index}`} className="text-sm">I currently work here</Label>
                                        </div>
                                        <div className="mt-3">
                                            <Label>Description</Label>
                                            <Textarea value={exp.description} onChange={(e) => handleListChange('experience', index, 'description', e.target.value)}
                                                placeholder="Describe your responsibilities and achievements"
                                                className="resize-none" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold border-b pb-4 mb-0">Education</h3>
                                <Button type="button" size="sm" onClick={() => addListItem('education', {
                                    institution: '', degree: '', field_of_study: '', start_year: '', end_year: ''
                                })}>
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {education.map((edu, index) => (
                                    <div key={index} className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-slate-700">Education #{index + 1}</span>
                                            {education.length > 1 && (
                                                <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('education', index)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Institution</Label>
                                                <Input value={edu.institution} onChange={(e) => handleListChange('education', index, 'institution', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Degree</Label>
                                                <Input value={edu.degree} onChange={(e) => handleListChange('education', index, 'degree', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Field of Study</Label>
                                                <Input value={edu.field_of_study} onChange={(e) => handleListChange('education', index, 'field_of_study', e.target.value)} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Start Year</Label>
                                                    <Input type="number" value={edu.start_year} onChange={(e) => handleListChange('education', index, 'start_year', e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label>End Year</Label>
                                                    <Input type="number" value={edu.end_year} onChange={(e) => handleListChange('education', index, 'end_year', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Certifications */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold border-b pb-4 mb-0">Certifications</h3>
                                <Button type="button" size="sm" onClick={() => addListItem('certifications', {
                                    title: '', type: '', date_achieved: ''
                                })}>
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {certifications.map((cert, index) => (
                                    <div key={index} className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-slate-700">Certification #{index + 1}</span>
                                            {certifications.length > 1 && (
                                                <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('certifications', index)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Title</Label>
                                                <Input value={cert.title} onChange={(e) => handleListChange('certifications', index, 'title', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Type</Label>
                                                <Input value={cert.type} onChange={(e) => handleListChange('certifications', index, 'type', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label>Date Achieved</Label>
                                                <Input type="date" value={cert.date_achieved} onChange={(e) => handleListChange('certifications', index, 'date_achieved', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                )}

                {/* ── CONSULTATIONS TAB ── */}
                {activeTab === 'consultations' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900">Consultation Requests</h2>
                        {consultations.length === 0 ? (
                            <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
                                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No consultation requests yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {consultations.map(c => (
                                    <div key={c.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="font-bold text-lg">{c.client_name}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    c.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                    c.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                                                    c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>{c.status}</span>
                                            </div>
                                            <div className="text-sm text-slate-600 grid grid-cols-2 gap-x-8 gap-y-1">
                                                <p><strong>Email:</strong> {c.client_email}</p>
                                                <p><strong>Phone:</strong> {c.client_phone || 'Not provided'}</p>
                                                <p><strong>Type:</strong> {c.preferred_type || 'Any'}</p>
                                                <p><strong>Date:</strong> {c.preferred_date ? new Date(c.preferred_date).toLocaleString() : 'Not specified'}</p>
                                            </div>
                                            <div className="mt-3 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                                                <span className="font-semibold block mb-1">Case Summary:</span>
                                                {c.case_summary}
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                Received: {new Date(c.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-row md:flex-col gap-2 min-w-[130px]">
                                            {c.status === 'PENDING' && (<>
                                                <Button onClick={() => handleUpdateConsultationStatus(c.id, 'ACCEPTED')}
                                                    disabled={updatingStatus === c.id}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                                                    {updatingStatus === c.id ? 'Updating...' : (
                                                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Accept</>
                                                    )}
                                                </Button>
                                                <Button onClick={() => handleUpdateConsultationStatus(c.id, 'REJECTED')}
                                                    disabled={updatingStatus === c.id}
                                                    variant="outline" className="w-full text-red-600 hover:text-red-700 border-red-200">
                                                    {updatingStatus === c.id ? 'Updating...' : (
                                                        <><XCircle className="w-4 h-4 mr-2" /> Reject</>
                                                    )}
                                                </Button>
                                            </>)}
                                            {c.status === 'ACCEPTED' && (
                                                <Button onClick={() => handleUpdateConsultationStatus(c.id, 'COMPLETED')}
                                                    disabled={updatingStatus === c.id}
                                                    className="bg-green-600 hover:bg-green-700 text-white w-full">
                                                    {updatingStatus === c.id ? 'Updating...' : 'Mark Complete'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── MESSAGES TAB ── */}
                {activeTab === 'messages' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900">Messages</h2>
                        {messages.length === 0 ? (
                            <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
                                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No messages received yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map(m => (
                                    <div key={m.id}
                                        className={`bg-white rounded-2xl p-6 border shadow-sm transition-all ${m.status === 'UNREAD' ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}
                                        onClick={() => m.status === 'UNREAD' && handleMarkMessageRead(m.id)}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900">{m.client_name}</h4>
                                                    {m.status === 'UNREAD' && (
                                                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">NEW</span>
                                                    )}
                                                </div>
                                                <a href={`mailto:${m.client_email}`}
                                                    className="text-sm text-blue-600 hover:underline">{m.client_email}</a>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {new Date(m.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 text-sm whitespace-pre-wrap">{m.message}</p>
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                                            <Button variant="outline" size="sm"
                                                onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${m.client_email}`; }}>
                                                Reply via Email
                                            </Button>
                                            {m.status === 'UNREAD' && (
                                                <Button variant="ghost" size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleMarkMessageRead(m.id); }}
                                                    className="text-slate-500">
                                                    Mark as Read
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── ANALYTICS TAB ── */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
                        {!analytics ? (
                            <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
                                <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Analytics data is loading or unavailable.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Profile Views', value: analytics.total_views ?? 0, icon: Eye, color: 'text-blue-600 bg-blue-50' },
                                        { label: 'Profile Shares', value: analytics.total_shares ?? 0, icon: Share2, color: 'text-purple-600 bg-purple-50' },
                                        { label: 'Consultations', value: analytics.total_consultations ?? 0, icon: Calendar, color: 'text-green-600 bg-green-50' },
                                        { label: 'Messages', value: analytics.total_messages ?? 0, icon: MessageCircle, color: 'text-amber-600 bg-amber-50' },
                                        { label: 'Conversion Rate', value: `${analytics.conversion_rate ?? 0}%`, icon: TrendingUp, color: 'text-rose-600 bg-rose-50' },
                                    ].map(stat => (
                                        <div key={stat.label} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                                                <stat.icon className="w-5 h-5" />
                                            </div>
                                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                            <p className="text-sm text-slate-500 font-medium mt-1">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {analytics.views_trend?.length > 0 && (
                                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                        <h3 className="text-lg font-bold mb-4">Views — Last 7 Days</h3>
                                        <div className="flex items-end gap-2 h-24">
                                            {analytics.views_trend.map((d, i) => {
                                                const max = Math.max(...analytics.views_trend.map(x => x.views), 1);
                                                return (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                        <span className="text-xs text-slate-500">{d.views}</span>
                                                        <div className="w-full bg-blue-600 rounded-t"
                                                            style={{ height: `${(d.views / max) * 72}px`, minHeight: 4 }} />
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(d.day).toLocaleDateString('en', { weekday: 'short' })}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── VERIFICATION TAB ── */}
                {activeTab === 'verification' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900">Identity Verification</h2>
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-4 rounded-full ${profile?.is_verified ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {profile?.is_verified ? <ShieldCheck className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">
                                        {profile?.is_verified ? 'Verified Advocate' : 'Not Yet Verified'}
                                    </h3>
                                    <p className="text-slate-500 text-sm">
                                        {profile?.is_verified
                                            ? 'Your profile has the verified badge. You receive priority placement in search results.'
                                            : 'Verified advocates receive 3× more consultation requests. Submit your Bar Council ID to get the verified badge.'}
                                    </p>
                                </div>
                            </div>

                            {!profile?.is_verified && (
                                <form onSubmit={handleSubmitVerification} className="border-t border-slate-100 pt-6 mt-6">
                                    <h4 className="font-bold mb-4">Submit Verification Documents</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Upload Bar Council ID (PDF / JPG / PNG)</Label>
                                            <Input type="file" accept="application/pdf,image/png,image/jpeg"
                                                className="mt-1"
                                                onChange={(e) => setVerificationDoc(e.target.files?.[0] || null)}
                                                required />
                                            <p className="text-xs text-slate-500 mt-1.5">
                                                Max file size: 10 MB. Files are securely stored and only used for identity verification.
                                            </p>
                                        </div>
                                        <Button type="submit" disabled={submittingVerification || !verificationDoc}
                                            className="bg-slate-900 text-white">
                                            {submittingVerification ? 'Submitting...' : 'Submit for Review'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

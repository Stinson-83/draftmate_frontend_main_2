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
    TrendingUp, Upload, Trash2, AlertCircle, Plus, ExternalLink, Copy, Gavel, Users, Link,
    BadgeCheck, Award, GraduationCap, BriefcaseBusiness, Languages as LanguagesIcon, Sparkles, CalendarDays, Globe, Scale, Check, Edit2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateProfileCompletion } from '../utils/profileHelpers';
import ShareProfileModal from '../components/Advocate/ShareProfileModal';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    advocateAuth, advocateProfile, advocateConsultations,
    advocateMessages, advocateVerification, advocateAnalytics,
    tokens,
} from '../services/advocateApi';

const LANGUAGE_OPTIONS = [
    'English', 'Hindi', 'Marathi', 'Kannada', 'Tamil', 'Telugu', 
    'Urdu', 'Punjabi', 'Bengali', 'Odia', 'Assamese', 'Gujarati', 
    'Malayalam', 'Manipuri', 'Konkani', 'Sanskrit'
];

const PRACTICE_AREA_OPTIONS = [
    'Criminal Law', 'Civil Law', 'Constitutional Law', 'Corporate Law', 'Family Law', 
    'Property Law', 'Intellectual Property Law', 'Labor and Employment Law', 'Tax Law', 
    'Banking and Finance Law', 'Environmental Law', 'Immigration Law', 'Consumer Protection Law', 
    'Cyber Law', 'Maritime Law', 'Alternative Dispute Resolution', 'Human Rights Law', 
    'Administrative Law', 'Insurance Law', 'Medical Law', 'Real Estate Law', 
    'Competition Law', 'Bankruptcy Law', 'International Law', 'Education Law', 
    'Motor Vehicle Law', 'Public Interest Litigation', 'Service Law', 'Election Law', 
    'Rent Control Law', 'Cooperative Society Law', 'Land Acquisition Law', 'Arbitration Law', 
    'Customs and Excise Law', 'Trademark Law', 'Patent Law', 'Copyright Law', 
    'Agricultural Law', 'Tribal Law', 'Religious Law'
];

export default function AdvocateDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [activeTab, setActiveTab] = useState(() => {
        const path = location.pathname;
        if (path.includes('/dashboard/consultations')) return 'consultations';
        if (path.includes('/dashboard/messages')) return 'messages';
        if (path.includes('/dashboard/analytics')) return 'analytics';
        if (path.includes('/dashboard/verification')) return 'verification';
        if (path.includes('/dashboard/settings')) return 'settings';
        return 'profile';
    });

    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/dashboard/consultations')) setActiveTab('consultations');
        else if (path.includes('/dashboard/messages')) setActiveTab('messages');
        else if (path.includes('/dashboard/analytics')) setActiveTab('analytics');
        else if (path.includes('/dashboard/verification')) setActiveTab('verification');
        else if (path.includes('/dashboard/settings')) setActiveTab('settings');
        else setActiveTab('profile');
    }, [location.pathname]);

    const [profile, setProfile] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [analytics, setAnalytics] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submittingVerification, setSubmittingVerification] = useState(false);
    const [verificationDoc, setVerificationDoc] = useState(null);
    const [practiceAreas, setPracticeAreas] = useState([]);
    const [authUser, setAuthUser] = useState({});

    const [editingExperience, setEditingExperience] = useState(null);
    const [editingEducation, setEditingEducation] = useState(null);
    const [editingCertification, setEditingCertification] = useState(null);

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user_profile');
            if (userStr) setAuthUser(JSON.parse(userStr));
        } catch (e) { console.warn("Failed to parse user", e); }
    }, []);    const DEFAULT_PROFILE = {
        title: '',
        bar_council_number: '',
        years_experience: '',
        consultation_fee: '',
        location: '',
        court_affiliation: '',
        office_address: '',
        bio: '',
        languages: [],
        practice_areas: [],
        experience: [],
        education: [],
        certifications: [],
        profile_completion_score: 0,
        phone: '',
        cases_won: '',
        total_clients: '',
        success_rate: '',
        is_public: false,
        social_links: { linkedin: '', twitter: '', facebook: '', instagram: '', website: '' },
        availability_settings: '',
    };

    useEffect(() => {
        async function loadProfileData() {
            setLoading(true);
            setLoadError(null);

            try {
                // 1. Check local storage first
                const savedLocal = localStorage.getItem('lawyer_profile');
                let initialProf = DEFAULT_PROFILE;

                if (savedLocal) {
                    try {
                        const parsed = JSON.parse(savedLocal);
                        // If local storage has the old mock default name, reset it to blank
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.title !== 'Adv. Preet Kakdiya') {
                            initialProf = { ...DEFAULT_PROFILE, ...parsed };
                        } else {
                            localStorage.removeItem('lawyer_profile');
                        }
                    } catch {
                        localStorage.removeItem('lawyer_profile');
                    }
                }
                
                // Ensure array fields exist
                initialProf.experience = Array.isArray(initialProf.experience) ? initialProf.experience : [];
                initialProf.education = Array.isArray(initialProf.education) ? initialProf.education : [];
                initialProf.certifications = Array.isArray(initialProf.certifications) ? initialProf.certifications : [];
                initialProf.languages = Array.isArray(initialProf.languages) ? initialProf.languages : [];
                initialProf.social_links = initialProf.social_links || { linkedin: '', twitter: '', facebook: '', instagram: '', website: '' };
                
                setProfile(initialProf);
                setPracticeAreas(Array.isArray(initialProf.practice_areas) ? initialProf.practice_areas : []);
                if (initialProf.profile_image_url) setImagePreview(initialProf.profile_image_url);

                // 2. Optional background sync with backend if token exists
                if (tokens.getAccess()) {
                    try {
                        const profRes = await advocateProfile.getMe();
                        if (profRes && profRes.data) {
                            const p = profRes.data;
                            p.experience = Array.isArray(p.experience) ? p.experience : initialProf.experience;
                            p.education = Array.isArray(p.education) ? p.education : initialProf.education;
                            p.certifications = Array.isArray(p.certifications) ? p.certifications : initialProf.certifications;
                            p.languages = Array.isArray(p.languages) ? p.languages : initialProf.languages;
                            setProfile(p);
                            setPracticeAreas(Array.isArray(p.practice_areas) ? p.practice_areas : initialProf.practice_areas);
                            if (p.profile_image_url) setImagePreview(p.profile_image_url);
                            localStorage.setItem('lawyer_profile', JSON.stringify(p));
                        }
                        
                        // Fetch Consultations
                        const consultRes = await advocateConsultations.getMyConsultations();
                        if (consultRes && consultRes.data) {
                            setConsultations(Array.isArray(consultRes.data) ? consultRes.data : []);
                        }
                        
                        // Fetch Messages
                        const msgRes = await advocateMessages.getConversations();
                        if (msgRes && msgRes.data) {
                            setMessages(Array.isArray(msgRes.data) ? msgRes.data : []);
                        }

                        // Fetch Analytics
                        try {
                            const analyticsRes = await advocateAnalytics.getDashboard();
                            if (analyticsRes && analyticsRes.status === 'success') {
                                setAnalytics(analyticsRes);
                            }
                        } catch (e) {
                            console.info('Analytics sync failed:', e);
                        }
                    } catch (e) {
                        console.info('Backend dashboard sync skipped/failed:', e);
                    }
                }
            } catch (err) {
                console.error("Dashboard render protection caught error:", err);
                setProfile(DEFAULT_PROFILE);
                setPracticeAreas([]);
            } finally {
                setLoading(false);
            }
        }

        loadProfileData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSocialLinkChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            social_links: {
                ...(prev.social_links || {}),
                [name]: value
            }
        }));
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

    const handleAddExperience = () => {
        addListItem('experience', {
            company: '', role: '', location: '', start_date: '', end_date: '', is_current: false, description: ''
        });
        setEditingExperience(profile?.experience?.length || 0);
    };

    const handleAddEducation = () => {
        addListItem('education', {
            institution: '', degree: '', field_of_study: '', start_year: '', end_year: '', description: ''
        });
        setEditingEducation(profile?.education?.length || 0);
    };

    const handleAddCertification = () => {
        addListItem('certifications', {
            title: '', type: '', issuing_organization: '', date_achieved: '', expiry_date: '', credential_id: '', credential_url: ''
        });
        setEditingCertification(profile?.certifications?.length || 0);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updatedProfile = {
                ...profile,
                practice_areas: practiceAreas,
            };

            // 1. Save to local storage for immediate persistence
            localStorage.setItem('lawyer_profile', JSON.stringify(updatedProfile));
            setProfile(updatedProfile);

            // 2. Try background API update if backend advocate service is available
            if (tokens.getAccess()) {
                try {
                    let finalImageUrl = updatedProfile.profile_image_url;
                    
                    // Upload image if a new one was selected
                    if (imageFile) {
                        try {
                            const uploadRes = await advocateProfile.uploadImage(imageFile);
                            // Assuming backend returns { url: '...' } or { data: { url: '...' } }
                            const newUrl = uploadRes.url || (uploadRes.data && uploadRes.data.url);
                            if (newUrl) {
                                finalImageUrl = newUrl;
                                updatedProfile.profile_image_url = finalImageUrl;
                                // clear imageFile state so we don't re-upload on next save
                                setImageFile(null);
                            }
                        } catch (imgErr) {
                            console.error('Image upload failed:', imgErr);
                            toast.error('Profile image failed to upload.');
                        }
                    }

                    const { id, user_id, slug, created_at, updated_at, is_verified,
                            profile_completion_score, ...updateable } = updatedProfile;
                    
                    const payload = {
                        ...updateable,
                        profile_image_url: finalImageUrl,
                        practice_areas: practiceAreas,
                        experience: updatedProfile.experience,
                        education: updatedProfile.education,
                        certifications: updatedProfile.certifications
                    };

                    if (payload.years_experience === '') payload.years_experience = null;
                    if (payload.consultation_fee === '') payload.consultation_fee = null;
                    
                    await advocateProfile.updateMe(payload);

                    // FETCH LATEST PROFILE FROM SERVER TO AVOID STALE STATE BUG
                    const profRes = await advocateProfile.getMe();
                    if (profRes && profRes.data) {
                        const p = profRes.data;
                        p.experience = Array.isArray(p.experience) ? p.experience : updatedProfile.experience;
                        p.education = Array.isArray(p.education) ? p.education : updatedProfile.education;
                        p.certifications = Array.isArray(p.certifications) ? p.certifications : updatedProfile.certifications;
                        p.languages = Array.isArray(p.languages) ? p.languages : updatedProfile.languages;
                        setProfile(p);
                        setPracticeAreas(Array.isArray(p.practice_areas) ? p.practice_areas : updatedProfile.practice_areas);
                        localStorage.setItem('lawyer_profile', JSON.stringify(p));
                    }
                } catch (backendErr) {
                    console.info('Backend sync info:', backendErr);
                }
            }

            toast.success('Lawyer Profile saved successfully.');
            setEditingExperience(null);
            setEditingEducation(null);
            setEditingCertification(null);
        } catch (err) {
            toast.error(err.message || 'Failed to save profile');
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
            setProfile(prev => ({ ...prev, verification_status: 'PENDING' }));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmittingVerification(false);
        }
    };

    const handleLogout = async () => {
        await advocateAuth.logout();
        toast.success('Logged out successfully.');
        setProfile(null);
        setLoadError('Logged out. Please sign in or register to access advocate profile.');
    };

    // ── Loading state ─────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center text-slate-500 animate-pulse">Loading Dashboard...</div>
            </div>
        );
    }

    const { percentage: completionScore, missingFields = [] } = calculateProfileCompletion(profile);
    const languages = Array.isArray(profile?.languages) ? profile.languages : [];
    const pendingConsultations = consultations.filter(c => c.status === 'PENDING').length;
    const unreadMessages = messages.filter(m => m.status === 'UNREAD').length;

    // Ensure we have arrays for the dynamic sections
    const experience = Array.isArray(profile?.experience) ? profile.experience : [];
    const education = Array.isArray(profile?.education) ? profile.education : [];
    const certifications = Array.isArray(profile?.certifications) ? profile.certifications : [];

    return (
        <div className="relative min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #F8FAFF 0%, #F4F8FF 45%, #EEF5FF 100%)' }}>
            {/* Subtle premium background textures */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none z-0" />
            
            <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 pt-24 flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-2 bg-white/60 backdrop-blur-xl border border-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-max md:sticky md:top-24">
                <h2 className="text-xl font-bold mb-6 px-4">Dashboard</h2>
                {[
                    { id: 'profile', icon: User, label: 'Lawyer Profile' },
                    { id: 'consultations', icon: Calendar, label: 'Consultations', badge: pendingConsultations },
                    { id: 'messages', icon: MessageCircle, label: 'Messages', badge: unreadMessages },
                    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
                    { id: 'verification', icon: ShieldCheck, label: 'Verification' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); navigate('/dashboard/' + tab.id); }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold transition-all duration-300 group ${activeTab === tab.id ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)] -translate-y-0.5' : 'hover:bg-blue-50/50 hover:text-blue-700 text-slate-600 hover:translate-x-1'}`}>
                        <div className="flex items-center gap-3">
                            <tab.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === tab.id ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'group-hover:scale-110'}`} /> {tab.label}
                        </div>
                        {tab.badge > 0 && (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white shadow-sm'}`}>{tab.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">

                {/* ── PROFILE TAB ── */}
                {activeTab === 'profile' && (
                    <motion.form 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        onSubmit={handleSaveProfile} 
                        className="space-y-8 pb-10"
                    >
                        {/* Profile Hero Section (Glassmorphism) */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="relative overflow-hidden rounded-3xl border border-slate-200/60 shadow-sm"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-xl z-0" />
                            {/* Decorative background blobs */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0 animate-blob" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0 animate-blob animation-delay-2000" />
                            
                            <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
                                <div className="relative flex-shrink-0 group">
                                    {imagePreview ? (
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br from-blue-400 to-sky-400 shadow-md">
                                            <img src={imagePreview} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-white" />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br from-slate-200 to-slate-300 shadow-md">
                                            <div className="w-full h-full rounded-full border-4 border-white bg-slate-50 flex items-center justify-center text-slate-400 text-4xl md:text-5xl font-bold">
                                                {(profile?.title || 'A')[0]}
                                            </div>
                                        </div>
                                    )}
                                    <label className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-white rounded-full p-2 shadow-lg border border-slate-100 cursor-pointer hover:scale-110 hover:shadow-blue-500/20 transition-all duration-200 group-hover:bg-blue-50">
                                        <Upload className="w-4 h-4 md:w-5 md:h-5 text-blue-600 group-hover:text-blue-700" />
                                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} />
                                    </label>
                                </div>
                                
                                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{profile?.title || 'Your Name'}</h2>
                                        {profile?.is_verified && (
                                            <span className="flex items-center text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                                                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> VERIFIED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 font-medium mb-1">{profile?.court_affiliation || 'Court Affiliation'} • {profile?.location || 'Location'}</p>
                                    
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                                        <span className={`flex items-center text-xs font-bold px-3 py-1.5 uppercase rounded-full border ${profile?.is_public ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'bg-slate-100 text-slate-600 border-slate-200 shadow-sm'}`}>
                                            {profile?.is_public ? (
                                                <><span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" /> LIVE / PUBLIC</>
                                            ) : (
                                                <><span className="w-2 h-2 rounded-full bg-slate-400 mr-2" /> DRAFT / PRIVATE</>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Circular Progress Completion */}
                                <div className="flex-shrink-0 flex flex-col items-center bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                                            <motion.circle 
                                                cx="50" cy="50" r="40" 
                                                fill="transparent" 
                                                stroke={completionScore === 100 ? '#10B981' : '#2563EB'} 
                                                strokeWidth="8" 
                                                strokeLinecap="round"
                                                strokeDasharray="251.2"
                                                initial={{ strokeDashoffset: 251.2 }}
                                                animate={{ strokeDashoffset: 251.2 - (251.2 * completionScore) / 100 }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center text-center">
                                            <span className="text-xl md:text-2xl font-bold text-slate-900">{completionScore}%</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-2 uppercase tracking-wide">
                                        {completionScore === 100 ? <span className="text-green-600">Profile Complete</span> : completionScore >= 80 ? 'Strong Profile' : 'Needs Update'}
                                    </p>
                                    {completionScore === 100 ? (
                                        <div className="mt-3 flex flex-col items-center gap-1.5 max-w-[140px] text-center">
                                            <Sparkles className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                            <p className="text-[10px] text-slate-500 leading-tight">
                                                {profile?.is_public 
                                                    ? 'Your lawyer profile is complete and ready for discovery.' 
                                                    : 'Your profile is complete. Make it public to appear in Lawyer Search.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-3 flex flex-col items-center gap-1.5 max-w-[160px]">
                                            <div className="flex items-start gap-1.5 w-full">
                                                <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-[10px] text-slate-500 leading-tight">Complete your profile to increase discovery.</p>
                                            </div>
                                            {missingFields.length > 0 && (
                                                <div className="w-full bg-slate-50/80 rounded p-2 mt-1 border border-slate-100/50">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Missing:</p>
                                                    <ul className="text-[10px] text-slate-600 space-y-0.5">
                                                        {missingFields.slice(0, 3).map((field, idx) => (
                                                            <li key={idx} className="truncate">• {field}</li>
                                                        ))}
                                                        {missingFields.length > 3 && (
                                                            <li className="text-slate-400 italic">+{missingFields.length - 3} more</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Account Details */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200/60 p-6 flex flex-col"
                            >
                                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><User className="w-4 h-4" /></div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Account Details</h3>
                                        <p className="text-xs text-slate-500">Your account and authentication information</p>
                                    </div>
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <p className="text-xs font-medium text-slate-400 mb-1">Full Name</p>
                                        <p className="text-sm font-semibold text-slate-900">{authUser.name || authUser.firstName || profile?.title || 'Not available'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-400 mb-1">Email Address</p>
                                        <p className="text-sm font-semibold text-slate-900">{authUser.email || 'Not available'}</p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100 text-xs font-semibold text-green-700">
                                        <ShieldCheck className="w-4 h-4" />
                                        {authUser.googleId ? 'Google Verified' : 'Email Verified'}
                                    </span>
                                </div>
                            </motion.div>

                                                        {/* Profile Visibility */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
                                className={`bg-white rounded-2xl shadow-sm transition-shadow border p-6 flex flex-col ${profile?.is_public ? 'border-teal-200 shadow-[0_0_15px_rgba(20,184,166,0.05)]' : 'border-slate-200/60 hover:shadow-md'}`}
                            >
                                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                                    <div className={`p-2 rounded-lg ${profile?.is_public ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {profile?.is_public ? <Globe className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Profile Visibility</h3>
                                        <p className="text-xs text-slate-500">Manage public access to your profile</p>
                                    </div>
                                    {/* Premium Toggle Switch */}
                                    <button type="button" disabled={isPublishing} onClick={async () => {
                                        try {
                                            setIsPublishing(true);
                                            const newStatus = !profile.is_public;
                                            const { id, user_id, slug, created_at, updated_at, is_verified, profile_completion_score, practice_areas: _pa, experience, education, certifications, ...updateable } = profile;
                                            const payload = { ...updateable, is_public: newStatus };
                                            if (payload.years_experience === '') payload.years_experience = null;
                                            if (payload.consultation_fee === '') payload.consultation_fee = null;
                                            await advocateProfile.updateMe(payload);
                                            setProfile(prev => ({ ...prev, is_public: newStatus }));
                                        } catch (err) {
                                            toast.error(err.message || 'Profile visibility could not be updated.');
                                        } finally {
                                            setIsPublishing(false);
                                        }
                                    }} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${profile?.is_public ? 'bg-teal-500' : 'bg-slate-300'} ${isPublishing ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}>
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${profile?.is_public ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <AnimatePresence mode="wait">
                                        {isPublishing ? (
                                            <motion.div key="publishing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-800 flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <svg className="animate-spin h-6 w-6 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    <span className="font-bold text-slate-600 text-xs tracking-wide uppercase">Updating status...</span>
                                                </div>
                                            </motion.div>
                                        ) : profile?.is_public ? (
                                            <motion.div key="live" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="bg-white border border-teal-100 shadow-sm rounded-xl p-5 text-sm h-full flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="relative flex h-3 w-3">
                                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                                                        </span>
                                                        <strong className="text-teal-700 text-sm font-extrabold tracking-wide">LIVE &bull; Profile is public</strong>
                                                    </div>
                                                    <p className="text-slate-600 mb-5 text-sm font-medium">Your profile is visible to clients in Lawyer Search.</p>
                                                </div>
                                                
                                                {profile?.slug && (
                                                    <div className="mt-auto">
                                                        <div className="flex items-center gap-3">
                                                            <a href={`/advocate/${profile.slug}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm shadow-teal-500/20">
                                                                <Globe className="w-4 h-4" /> View Public Profile
                                                            </a>
                                                            <button type="button" onClick={() => {
                                                                navigator.clipboard.writeText(`${window.location.origin}/advocate/${profile.slug}`);
                                                                toast.success('Profile link copied to clipboard!');
                                                            }} className="flex items-center justify-center gap-2 h-10 px-4 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-colors focus:outline-none">
                                                                <Share2 className="w-4 h-4" /> Share Profile
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.div key="hidden" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-5 text-sm flex flex-col justify-between h-full">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                                                        <strong className="text-slate-700 text-sm font-extrabold tracking-wide">DRAFT &bull; Profile is private</strong>
                                                    </div>
                                                    <p className="text-slate-600 text-sm font-medium mb-3">Your profile is not currently visible in Lawyer Search.</p>
                                                    {completionScore < 100 && (
                                                        <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200/50 mb-4">
                                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                            <p className="text-xs font-semibold">Complete your profile before making it live.</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-auto">
                                                    <button type="button" disabled={isPublishing} onClick={async () => {
                                                        try {
                                                            setIsPublishing(true);
                                                            const { id, user_id, slug, created_at, updated_at, is_verified, profile_completion_score, practice_areas: _pa, experience, education, certifications, ...updateable } = profile;
                                                            const payload = { ...updateable, is_public: true };
                                                            if (payload.years_experience === '') payload.years_experience = null;
                                                            if (payload.consultation_fee === '') payload.consultation_fee = null;
                                                            await advocateProfile.updateMe(payload);
                                                            setProfile(prev => ({ ...prev, is_public: true }));
                                                        } catch (err) {
                                                            toast.error(err.message || 'Profile could not be published.');
                                                        } finally {
                                                            setIsPublishing(false);
                                                        }
                                                    }} className="w-full flex items-center justify-center gap-2 h-10 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors">
                                                        Make Profile Live
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                        </div>

                        {/* Share Your Lawyer Profile */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.25 }}
                            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700/50 p-6 md:p-8 text-white relative overflow-hidden mt-6"
                        >
                            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-stretch">
                                <div className="flex-1 flex flex-col justify-center text-center md:text-left w-full">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-teal-300 border border-white/10 w-fit mb-4 mx-auto md:mx-0">
                                        <Sparkles className="w-3.5 h-3.5" /> Core Feature
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold mb-2">Share Your Lawyer Profile</h3>
                                    <p className="text-slate-300 text-sm mb-6 max-w-md mx-auto md:mx-0">
                                        {profile?.is_public 
                                            ? (completionScore === 100 ? "Your profile is complete and ready to share." : "Complete your profile to create your strongest professional presence.")
                                            : "Publish your profile to generate a public shareable link."
                                        }
                                    </p>
                                    
                                    {profile?.is_public && profile?.slug ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 overflow-hidden">
                                                <Link className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="text-sm font-medium text-slate-300 truncate select-all flex-1">
                                                    {window.location.origin}/advocate/{profile.slug}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                                                <button type="button" onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/advocate/${profile.slug}`)
                                                        .then(() => toast.success('✓ Link copied'))
                                                        .catch(() => toast.error('Failed to copy link'));
                                                }} className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 h-11 text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors focus:outline-none">
                                                    <Copy className="w-4 h-4" /> Copy Profile Link
                                                </button>
                                                
                                                <div className="flex w-full sm:w-auto gap-3 flex-1">
                                                    <a href={`/advocate/${profile.slug}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 h-11 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors">
                                                        View Profile
                                                    </a>
                                                    <button type="button" onClick={() => setIsShareModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 h-11 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors focus:outline-none shadow-lg shadow-teal-500/20">
                                                        <Share2 className="w-4 h-4" /> Share
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-start gap-3">
                                            <Globe className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                            <p className="text-sm text-slate-300 text-left">Your profile must be LIVE to share it with clients. Use the Profile Visibility control above to publish your profile.</p>
                                        </div>
                                    )}
                                </div>
                                
                                {profile?.is_public && (
                                    <div className="w-full md:w-72 shrink-0">
                                        <div className="bg-white rounded-xl shadow-2xl p-5 border border-slate-200 h-full flex flex-col relative overflow-hidden transform md:rotate-2 md:hover:rotate-0 transition-transform duration-300">
                                            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-blue-600 to-teal-500 opacity-10"></div>
                                            
                                            <div className="flex items-start gap-4 relative z-10 mb-4 text-left">
                                                {profile?.profile_image_url ? (
                                                    <img src={profile.profile_image_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm shrink-0 bg-slate-100" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm shrink-0 flex items-center justify-center text-slate-400">
                                                        <User className="w-8 h-8" />
                                                    </div>
                                                )}
                                                <div className="pt-1">
                                                    <h4 className="text-slate-900 font-bold text-sm leading-tight line-clamp-1">{authUser?.name || authUser?.firstName || profile?.title || 'Advocate'}</h4>
                                                    <p className="text-teal-600 font-semibold text-[11px] uppercase tracking-wider mb-1 line-clamp-1">{profile?.title || 'Legal Professional'}</p>
                                                    {authUser?.googleId || authUser?.is_verified ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                                            <ShieldCheck className="w-3 h-3" /> Verified
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 mb-4 flex-1 text-left">
                                                {profile?.court_affiliation && (
                                                    <div className="flex items-start gap-2 text-slate-600 text-[11px]">
                                                        <Gavel className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                        <span className="line-clamp-2">{profile.court_affiliation}</span>
                                                    </div>
                                                )}
                                                {profile?.office_address && (
                                                    <div className="flex items-start gap-2 text-slate-600 text-[11px]">
                                                        <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                        <span className="line-clamp-2">{profile.office_address}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {profile?.practice_areas && profile.practice_areas.length > 0 && (
                                                <div className="border-t border-slate-100 pt-3 mt-auto text-left">
                                                    <div className="flex flex-wrap gap-1">
                                                        {profile.practice_areas.slice(0, 3).map((pa, idx) => (
                                                            <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-600 text-[9px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                                                {pa}
                                                            </span>
                                                        ))}
                                                        {profile.practice_areas.length > 3 && (
                                                            <span className="bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                                                                +{profile.practice_areas.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Professional Information */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8"
                        >
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><BriefcaseBusiness className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Professional Information</h3>
                                    <p className="text-sm text-slate-500">Your professional identity, legal credentials and practice details.</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Full Name / Title</Label>
                                    <Input name="title" value={profile?.title || ''} onChange={handleChange} placeholder="e.g. Adv. Rajesh Sharma" className="bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all" />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Phone Number</Label>
                                    <Input name="phone" value={profile?.phone || ''} onChange={handleChange} placeholder="e.g. +91 9876543210" className="bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all" />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Bar Council Number</Label>
                                    <Input name="bar_council_number" value={profile?.bar_council_number || ''} onChange={handleChange} placeholder="e.g. MAH/12345/2020" className="bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all" />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Years of Experience</Label>
                                    <Input type="number" name="years_experience" min="0" value={profile?.years_experience || ''} onChange={handleChange} placeholder="e.g. 5" className="bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all" />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Court Affiliation</Label>
                                    <Input name="court_affiliation" value={profile?.court_affiliation || ''} onChange={handleChange} placeholder="e.g. High Court of Bombay" className="bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all" />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Location (City, State)</Label>
                                    <Input name="location" value={profile?.location || ''} onChange={handleChange} placeholder="e.g. Mumbai, Maharashtra" className="bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all" />
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Office Address</Label>
                                    <Textarea name="office_address" value={profile?.office_address || ''} onChange={handleChange} placeholder="e.g. Suite 402, Nariman Point, Mumbai, Maharashtra 400021" className="bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all resize-none min-h-[80px]" />
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                    <div className="flex justify-between items-end mb-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide block m-0">Professional Bio</Label>
                                        <span className="text-xs text-slate-400">Tell clients about your experience, expertise and approach.</span>
                                    </div>
                                    <Textarea name="bio" value={profile?.bio || ''} onChange={handleChange} maxLength={500} placeholder="Describe your expertise, experience, and what makes you unique..." className="bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all resize-none min-h-[120px]" />
                                    <div className="text-right text-xs text-slate-400 mt-1">{(profile?.bio || '').length} / 500 characters</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Professional Metrics */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-4 px-2">Professional Metrics</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Gavel className="w-5 h-5" />
                                    </div>
                                    <Input type="number" name="cases_won" min="0" value={profile?.cases_won || 0} disabled className="h-8 text-2xl font-bold text-slate-900 border-none shadow-none bg-transparent px-0 opacity-100 mb-1" />
                                    <Label className="text-xs font-medium text-slate-500">Cases Won</Label>
                                </div>
                                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <Input type="number" name="total_clients" min="0" value={profile?.total_clients || 0} disabled className="h-8 text-2xl font-bold text-slate-900 border-none shadow-none bg-transparent px-0 opacity-100 mb-1" />
                                    <Label className="text-xs font-medium text-slate-500">Total Clients</Label>
                                </div>
                                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-end gap-1">
                                        <Input type="number" name="success_rate" min="0" max="100" step="0.1" value={profile?.success_rate || 0} disabled className="h-8 text-2xl font-bold text-slate-900 border-none shadow-none bg-transparent px-0 opacity-100 mb-1 w-20" />
                                        <span className="text-lg font-bold text-slate-900 mb-1.5">%</span>
                                    </div>
                                    <Label className="text-xs font-medium text-slate-500">Success Rate</Label>
                                </div>
                                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <CalendarDays className="w-5 h-5" />
                                    </div>
                                    <Input type="number" name="total_consultations_fake" value={analytics?.total_consultations || 0} disabled className="h-8 text-2xl font-bold text-slate-900 border-none shadow-none bg-transparent px-0 opacity-100 mb-1" />
                                    <Label className="text-xs font-medium text-slate-500">Consultations (Auto)</Label>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Consultation Settings */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8"
                            >
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Clock className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Consultation Settings</h3>
                                        <p className="text-sm text-slate-500">Configure how clients can consult with you.</p>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Consultation Fee (₹)</Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                            <Input type="number" name="consultation_fee" min="0" value={profile?.consultation_fee || ''} onChange={handleChange} placeholder="1500" className="pl-9 bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Availability Settings</Label>
                                        <Input name="availability_settings" value={profile?.availability_settings || ''} onChange={handleChange} placeholder="e.g. Mon-Fri, 10 AM to 6 PM" className="bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all" />
                                        {profile?.availability_settings && (
                                            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-600">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Available for consultation
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Social Links */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8"
                            >
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Globe className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Social Links</h3>
                                        <p className="text-sm text-slate-500">Connect your professional profiles.</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { id: 'linkedin', label: 'LinkedIn', icon: Link, placeholder: 'https://linkedin.com/in/...' },
                                        { id: 'website', label: 'Website', icon: Globe, placeholder: 'https://...' },
                                        { id: 'twitter', label: 'Twitter / X', icon: Link, placeholder: 'https://twitter.com/...' }
                                    ].map(social => {
                                        const val = profile?.social_links?.[social.id] || '';
                                        const isValid = val.startsWith('http://') || val.startsWith('https://');
                                        return (
                                            <div key={social.id}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <social.icon className="w-3.5 h-3.5 text-slate-400" />
                                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide m-0">{social.label}</Label>
                                                </div>
                                                <div className="relative group">
                                                    <Input name={social.id} value={val} onChange={handleSocialLinkChange} placeholder={social.placeholder} className={`bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all pr-10 ${isValid ? 'border-green-200' : ''}`} />
                                                    {isValid && <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        </div>

                        {/* Languages */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.7 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8"
                        >
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><LanguagesIcon className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Languages</h3>
                                    <p className="text-sm text-slate-500">Languages you speak fluently.</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {LANGUAGE_OPTIONS.map(lang => (
                                    <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                                            ${languages.includes(lang)
                                                ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'}`}>
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Practice Areas */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.8 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8"
                        >
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Scale className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Practice Areas</h3>
                                    <p className="text-sm text-slate-500">Select the legal domains you specialize in.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {PRACTICE_AREA_OPTIONS.map(pa => (
                                    <label key={pa}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 group
                                            ${practiceAreas.includes(pa)
                                                ? 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-400 shadow-sm -translate-y-0.5'
                                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm hover:-translate-y-0.5'}`}>
                                        <input type="checkbox" className="hidden" checked={practiceAreas.includes(pa)} onChange={() => togglePracticeArea(pa)} />
                                        <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors
                                            ${practiceAreas.includes(pa) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                                            {practiceAreas.includes(pa) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className={`text-sm font-semibold ${practiceAreas.includes(pa) ? 'text-blue-900' : 'text-slate-700'}`}>{pa}</span>
                                    </label>
                                ))}
                            </div>
                        </motion.div>

                                                {/* Experience */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8"
                        >
                            <div className="flex flex-wrap items-center justify-between mb-6 border-b border-slate-100 pb-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><BriefcaseBusiness className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Experience</h3>
                                        <p className="text-sm text-slate-500">Your professional timeline.</p>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl" onClick={handleAddExperience}>
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Experience
                                </Button>
                            </div>
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:ml-6 md:before:translate-x-0 before:h-full before:w-0.5 before:bg-blue-100">
                                {experience.length === 0 && <p className="text-slate-500 text-sm ml-8 md:ml-12">No experience added yet.</p>}
                                <AnimatePresence>
                                    {experience.map((exp, index) => (
                                        <motion.div 
                                            key={index} 
                                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                                            className="relative flex items-start group"
                                        >
                                            {/* Timeline marker */}
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-blue-500 absolute left-0 md:left-2 shadow-sm shrink-0 md:group-hover:scale-110 transition-transform mt-2 z-10" />
                                            
                                            {/* Card */}
                                            <div className="w-[calc(100%-2.5rem)] md:w-[calc(100%-4rem)] p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all ml-10 md:ml-16">
                                                {editingExperience === index ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="col-span-1 md:col-span-2 flex justify-between items-center mb-2">
                                                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Editing Experience</span>
                                                            <div className="flex gap-2">
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('experience', index)} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button type="button" size="sm" variant="outline" onClick={() => setEditingExperience(null)} className="h-8 px-3 text-slate-600">
                                                                    Done
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Job Title / Position</Label>
                                                            <Input value={exp.role} onChange={(e) => handleListChange('experience', index, 'role', e.target.value)} placeholder="e.g. Senior Advocate" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Organization</Label>
                                                            <Input value={exp.company} onChange={(e) => handleListChange('experience', index, 'company', e.target.value)} placeholder="e.g. Supreme Court of India" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Location</Label>
                                                            <Input value={exp.location} onChange={(e) => handleListChange('experience', index, 'location', e.target.value)} placeholder="e.g. New Delhi" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Start Date</Label>
                                                                <Input type="date" value={exp.start_date} onChange={(e) => handleListChange('experience', index, 'start_date', e.target.value)} className="bg-slate-50/50 rounded-lg text-sm" />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">End Date</Label>
                                                                {exp.is_current ? (
                                                                    <Input disabled value="Present" className="bg-slate-100 text-slate-400 rounded-lg text-sm" />
                                                                ) : (
                                                                    <Input type="date" value={exp.end_date} onChange={(e) => handleListChange('experience', index, 'end_date', e.target.value)} className="bg-slate-50/50 rounded-lg text-sm" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-1">
                                                            <input type="checkbox" id={`is-current-exp-${index}`} checked={exp.is_current}
                                                                onChange={(e) => handleListChange('experience', index, 'is_current', e.target.checked)}
                                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                            <Label htmlFor={`is-current-exp-${index}`} className="text-xs font-semibold text-slate-600 cursor-pointer">I currently work here</Label>
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 mt-2">
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Description</Label>
                                                            <Textarea value={exp.description} onChange={(e) => handleListChange('experience', index, 'description', e.target.value)}
                                                                placeholder="Describe your responsibilities and achievements..."
                                                                className="resize-none bg-slate-50/50 h-24 rounded-lg text-sm" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="text-base font-bold text-slate-800">{exp.role || 'Position Title'}</h4>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingExperience(index)} className="h-7 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-medium text-slate-700 mb-2">
                                                            {exp.company || 'Organization Name'} 
                                                            {exp.location && <span className="text-slate-400 font-normal"> • {exp.location}</span>}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium bg-slate-100/80 w-fit px-2.5 py-1 rounded-md mb-4">
                                                            {exp.start_date || 'Start'} — {exp.is_current ? 'Present' : (exp.end_date || 'End')}
                                                        </div>
                                                        {exp.description && (
                                                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                                                {exp.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Education */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8"
                        >
                            <div className="flex flex-wrap items-center justify-between mb-6 border-b border-slate-100 pb-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><GraduationCap className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Education</h3>
                                        <p className="text-sm text-slate-500">Your academic background.</p>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl" onClick={handleAddEducation}>
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Education
                                </Button>
                            </div>
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:ml-6 md:before:translate-x-0 before:h-full before:w-0.5 before:bg-blue-100">
                                {education.length === 0 && <p className="text-slate-500 text-sm ml-8 md:ml-12">No education added yet.</p>}
                                <AnimatePresence>
                                    {education.map((edu, index) => (
                                        <motion.div 
                                            key={index} 
                                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                                            className="relative flex items-start group"
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-slate-400 absolute left-0 md:left-2 shadow-sm shrink-0 md:group-hover:scale-110 transition-transform mt-2 z-10" />
                                            <div className="w-[calc(100%-2.5rem)] md:w-[calc(100%-4rem)] p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all ml-10 md:ml-16">
                                                {editingEducation === index ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="col-span-1 md:col-span-2 flex justify-between items-center mb-2">
                                                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Editing Education</span>
                                                            <div className="flex gap-2">
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('education', index)} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button type="button" size="sm" variant="outline" onClick={() => setEditingEducation(null)} className="h-8 px-3 text-slate-600">
                                                                    Done
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2">
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Institution</Label>
                                                            <Input value={edu.institution} onChange={(e) => handleListChange('education', index, 'institution', e.target.value)} placeholder="e.g. National Law School" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Degree</Label>
                                                            <Input value={edu.degree} onChange={(e) => handleListChange('education', index, 'degree', e.target.value)} placeholder="e.g. LL.B." className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Field / Specialization</Label>
                                                            <Input value={edu.field_of_study} onChange={(e) => handleListChange('education', index, 'field_of_study', e.target.value)} placeholder="e.g. Corporate Law" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Start Year/Date</Label>
                                                            <Input value={edu.start_year} onChange={(e) => handleListChange('education', index, 'start_year', e.target.value)} placeholder="YYYY" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">End Year/Date</Label>
                                                            <Input value={edu.end_year} onChange={(e) => handleListChange('education', index, 'end_year', e.target.value)} placeholder="YYYY" className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 mt-2">
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Description</Label>
                                                            <Textarea value={edu.description} onChange={(e) => handleListChange('education', index, 'description', e.target.value)}
                                                                placeholder="Extracurriculars, societies, achievements..."
                                                                className="resize-none bg-slate-50/50 h-20 rounded-lg text-sm" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="text-base font-bold text-slate-800">{edu.degree || 'Degree'} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}</h4>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingEducation(index)} className="h-7 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-medium text-slate-700 mb-2">
                                                            {edu.institution || 'Institution Name'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium bg-slate-100/80 w-fit px-2.5 py-1 rounded-md mb-4">
                                                            {edu.start_year || 'Start'} — {edu.end_year || 'End'}
                                                        </div>
                                                        {edu.description && (
                                                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                                                {edu.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Certifications */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8 mb-10"
                        >
                            <div className="flex flex-wrap items-center justify-between mb-6 border-b border-slate-100 pb-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Award className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Certifications</h3>
                                        <p className="text-sm text-slate-500">Your professional credentials.</p>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl" onClick={handleAddCertification}>
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Certification
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {certifications.length === 0 && <p className="text-slate-500 text-sm col-span-full">No certifications added yet.</p>}
                                <AnimatePresence>
                                    {certifications.map((cert, index) => (
                                        <motion.div 
                                            key={index} 
                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
                                            className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                                        >
                                            {editingCertification === index ? (
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Editing Certification</span>
                                                        <div className="flex gap-2">
                                                            <Button type="button" size="sm" variant="ghost" onClick={() => removeListItem('certifications', index)} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button type="button" size="sm" variant="outline" onClick={() => setEditingCertification(null)} className="h-8 px-3 text-slate-600">
                                                                Done
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Certification Name</Label>
                                                        <Input value={cert.title} onChange={(e) => handleListChange('certifications', index, 'title', e.target.value)} placeholder="e.g. Certified Mediator" className="bg-slate-50/50 rounded-lg text-sm" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Issuing Organization</Label>
                                                        <Input value={cert.issuing_organization} onChange={(e) => handleListChange('certifications', index, 'issuing_organization', e.target.value)} placeholder="e.g. Indian Institute of Arbitration" className="bg-slate-50/50 rounded-lg text-sm" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Issue Date</Label>
                                                            <Input type="date" value={cert.date_achieved} onChange={(e) => handleListChange('certifications', index, 'date_achieved', e.target.value)} className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Expiry Date</Label>
                                                            <Input type="date" value={cert.expiry_date} onChange={(e) => handleListChange('certifications', index, 'expiry_date', e.target.value)} className="bg-slate-50/50 rounded-lg text-sm" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Credential ID</Label>
                                                        <Input value={cert.credential_id} onChange={(e) => handleListChange('certifications', index, 'credential_id', e.target.value)} placeholder="e.g. 1234ABCD" className="bg-slate-50/50 rounded-lg text-sm" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Credential URL</Label>
                                                        <Input value={cert.credential_url} onChange={(e) => handleListChange('certifications', index, 'credential_url', e.target.value)} placeholder="https://..." className="bg-slate-50/50 rounded-lg text-sm" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col h-full justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                                                <BadgeCheck className="w-4 h-4 text-sky-500" />
                                                                <span className="font-bold uppercase tracking-wider text-[10px]">Credential</span>
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingCertification(index)} className="h-7 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-base font-bold text-slate-800 mb-1">{cert.title || 'Certification Name'}</h4>
                                                        <p className="text-sm font-medium text-slate-600 mb-3">{cert.issuing_organization || 'Issuing Organization'}</p>
                                                        <div className="text-xs text-slate-500 mb-4 flex flex-col gap-1">
                                                            {cert.date_achieved && <span>Issued {cert.date_achieved}</span>}
                                                            {cert.expiry_date && <span>Expires {cert.expiry_date}</span>}
                                                        </div>
                                                    </div>
                                                    {(cert.credential_id || cert.credential_url) && (
                                                        <div className="pt-4 border-t border-slate-100">
                                                            {cert.credential_id && (
                                                                <p className="text-xs text-slate-500 mb-1 font-mono">ID: {cert.credential_id}</p>
                                                            )}
                                                            {cert.credential_url && (
                                                                <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 w-fit">
                                                                    Show Credential <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>

{/* Sticky Save Action */}
                        <div className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 z-50 pointer-events-none">
                            <motion.div 
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-2xl p-4 flex items-center justify-between pointer-events-auto max-w-4xl mx-auto"
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-800">Unsaved changes</span>
                                    <span className="text-xs text-slate-500">Your profile has unpublished updates.</span>
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" className="hidden sm:inline-flex rounded-xl border-slate-200">Cancel</Button>
                                    <Button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white shadow-md shadow-blue-500/20 rounded-xl px-6 transition-all active:scale-95 min-w-[140px]">
                                        {saving ? (
                                            <span className="flex items-center"><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" /> Saving...</span>
                                        ) : (
                                            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.form>
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
                                <div className={`p-4 rounded-full ${profile?.is_verified ? 'bg-green-100 text-green-600' : profile?.verification_status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {profile?.is_verified ? <ShieldCheck className="w-8 h-8" /> : profile?.verification_status === 'REJECTED' ? <XCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">
                                        {profile?.is_verified ? 'Verified Advocate' : profile?.verification_status === 'REJECTED' ? 'Verification Rejected' : 'Not Yet Verified'}
                                    </h3>
                                    <p className="text-slate-500 text-sm">
                                        {profile?.is_verified
                                            ? 'Your profile has the verified badge. You receive priority placement in search results.'
                                            : profile?.verification_status === 'REJECTED'
                                            ? 'Your verification was rejected by an admin. Please upload a valid document to resubmit.'
                                            : 'Verified advocates receive 3× more consultation requests. Submit your Bar Council ID to get the verified badge.'}
                                    </p>
                                </div>
                            </div>

                            {profile?.verification_status === 'PENDING' && (
                                <div className="border-t border-slate-100 pt-6 mt-6">
                                    <div className="flex flex-col items-center justify-center p-8 bg-blue-50 border border-blue-100 rounded-2xl text-center">
                                        <Clock className="w-12 h-12 text-blue-400 mb-4" />
                                        <h4 className="text-lg font-bold text-blue-900 mb-2">Verification in Progress</h4>
                                        <p className="text-blue-700 text-sm max-w-md mx-auto">
                                            We have received your documents and are currently reviewing them. This process usually takes up to 2 business days.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!profile?.is_verified && profile?.verification_status !== 'PENDING' && (
                                <form onSubmit={handleSubmitVerification} className="border-t border-slate-100 pt-6 mt-6">
                                    <h4 className="font-bold mb-4">
                                        {profile?.verification_status === 'REJECTED' ? 'Resubmit Verification Documents' : 'Submit Verification Documents'}
                                    </h4>
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

            <ShareProfileModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                advocate={profile} 
            />
        </div>
    );
}

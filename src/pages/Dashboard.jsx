import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
    Briefcase, Calendar as CalendarIcon, FileText, Zap, MapPin, Scale, ChevronRight,
    Plus, Search, ArrowUpRight, CheckCircle2, AlertCircle, Languages,
    ShieldCheck, Share2, ChevronLeft, CalendarDays, Gavel, X, Filter,
    Folder, FolderPlus, Library, Layers, PlayCircle
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Premium Glow Styles & Component
───────────────────────────────────────────────────────────── */
const GLOW_PANEL_STYLE = {
    background: "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(248,251,255,1) 65%, rgba(227,238,255,0.9) 100%)"
};

const RightGlow = () => (
    <div 
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10" 
        style={{ background: "radial-gradient(circle at right center, rgba(37,99,235,0.12), transparent 70%)" }} 
    />
);

/* ─────────────────────────────────────────────────────────────
   One-time Typing Subtitle Component
───────────────────────────────────────────────────────────── */
const TypingSubtitle = ({ text }) => {
    const [displayedText, setDisplayedText] = useState("");
    
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.substring(0, i + 1));
            i++;
            if (i === text.length) clearInterval(interval);
        }, 40); // Fast, smooth professional typing
        return () => clearInterval(interval);
    }, [text]);

    return (
        <p className="text-[#2563EB] mt-4 text-sm font-bold min-h-[20px]">
            {displayedText}
        </p>
    );
};

/* ─────────────────────────────────────────────────────────────
   Typing Greeting Component
───────────────────────────────────────────────────────────── */
const MULTILINGUAL_GREETINGS = [
    "नमस्ते,", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ,", "வணக்கம்,", "కెమోన్ అచో,", "કેમ છો,",
    "নমস্কার,", "ನಮಸ್ಕಾರ,", "നമസ്കാരം,", "ନମସ୍କାର,", "নমস্কাৰ,"
];

const RegionalTypingGreeting = ({ name = "Devendra", typingSpeed = 300, deletingSpeed = 100, pauseTime = 2000 }) => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingDelay, setTypingDelay] = useState(typingSpeed);

    useEffect(() => {
        let ticker = setTimeout(() => handleTyping(), typingDelay);
        return () => clearTimeout(ticker);
    }, [text, isDeleting, loopNum, typingDelay]);

    const handleTyping = () => {
        const i = loopNum % MULTILINGUAL_GREETINGS.length;
        const fullText = MULTILINGUAL_GREETINGS[i];
        if (isDeleting) {
            setText(fullText.substring(0, text.length - 1));
            setTypingDelay(deletingSpeed);
        } else {
            setText(fullText.substring(0, text.length + 1));
            setTypingDelay(typingSpeed);
        }
        if (!isDeleting && text === fullText) {
            setTypingDelay(pauseTime);
            setIsDeleting(true);
        } else if (isDeleting && text === '') {
            setIsDeleting(false);
            setLoopNum(loopNum + 1);
            setTypingDelay(500);
        }
    };

    return (
        <div className="flex flex-col leading-none">
            <div className="text-[#2563EB] text-6xl md:text-5xl font-bold h-12 md:h-14">
                {text} <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="font-light text-[#1D4ED8]">|</motion.span>
            </div>
            <br></br>
            <div className="text-[#0F1C2E] text-7xl md:text-6xl font-extrabold mt-1">{name}</div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Dashboard Data
───────────────────────────────────────────────────────────── */
const KPIS = [
    { label: "Active Cases", value: "48", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Hearings", value: "12", icon: CalendarIcon, color: "text-rose-600", bg: "bg-rose-50", suffix: "Week" },
    { label: "Drafts", value: "138", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Researches Done", value: "80", icon: Zap, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Doc Translated", value: "43", icon: Languages, color: "text-yellow-600", bg: "bg-yellow-50" },
];

const HEARINGS = [
    { time: "10:00 AM", court: "Delhi High Court", case: "Sharma vs. Gupta Builders", judge: "Justice Sharma", status: "Upcoming" },
    { time: "02:30 PM", court: "Tis Hazari Court", case: "State vs. R.K. Associates", judge: "Justice Verma", status: "Preparation Needed" },
];

const RECENT_WORK = [
    { title: "Property Dispute Draft", type: "Legal Draft", time: "2 hours ago", progress: 85 },
    { title: "Bail Application Analysis", type: "Matter Research", time: "5 hours ago", progress: 100 },
    { title: "Employment Contract NDA", type: "Document", time: "Yesterday", progress: 40 },
];

const FOLDERS = [
    { name: "Corporate Law", count: 12, color: "text-blue-500", fill: "fill-blue-500/20" },
    { name: "Intellectual Property", count: "08", color: "text-emerald-500", fill: "fill-emerald-500/20" },
    { name: "Litigation Docs", count: 34, color: "text-amber-500", fill: "fill-amber-500/20" },
];

export default function Dashboard() {
    const navigate = useNavigate();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('Month');

    const [userName, setUserName] = useState("Devendra");

    useEffect(() => {
        const loadProfile = () => {
            const saved = localStorage.getItem('user_profile');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Combine first and last name, or fallback to "Devendra"
                const fullName = [parsed.firstName, parsed.lastName].filter(Boolean).join(" ");
                if (fullName) setUserName(fullName);
            }
        };

        const handleDraftUpdate = async () => {
            try {
                const token = localStorage.getItem('session_id');
                const response = await fetch(`${API_CONFIG.AUTH.BASE_URL}/v2/draft/list`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
                if (!response.ok) {
                    throw new Error("Failed to load drafts from database.");
                }
                const data = await response.json();
                const savedDrafts = data.drafts || [];
                const processedDrafts = savedDrafts.map((draft) => {
                    const status = draft.status || 'In progress';
                    const trackingParams = draft.trackingParams || {
                        documentKey: draft.documentKey || draft.id || '',
                        filename: ensureDocxFilename(draft.filename || draft.name || 'Untitled Draft'),
                        source: draft.source || 'db_draft',
                        folderId: draft.folderId ?? null,
                    };

                    return {
                        id: draft.id,
                        title: draft.name || trackingParams.filename || 'Untitled Draft',
                        filename: ensureDocxFilename(draft.filename || draft.name || trackingParams.filename || 'Untitled Draft'),
                        documentKey: draft.documentKey || draft.id || trackingParams.documentKey || '',
                        modified: new Date(draft.lastModified || Date.now()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                        status,
                        statusColor: buildStatusColor(status),
                        content: draft.content,
                        placeholders: draft.placeholders,
                        rawName: draft.name,
                        onlyofficeConfig: draft.onlyofficeConfig || null,
                        variablesDetected: draft.variablesDetected || [],
                        trackingParams,
                    };
                });

                setAllDrafts(processedDrafts);
            } catch (error) {
                console.error('Failed to load drafts for dashboard', error);
                setAllDrafts([]);
            }
        };
        loadProfile(); // Initial load
        window.addEventListener('user_profile_updated', loadProfile);
        return () => window.removeEventListener('user_profile_updated', loadProfile);
    }, []);

    const [events, setEvents] = useState([
        {
            id: 1,
            title: "Sharma vs Gupta Builders",
            date: "2026-06-14",
            time: "10:00",
            type: "hearing",
            color: "bg-blue-500"
        }
    ]);

    const handleNavigate = (direction) => {
        const newDate = new Date(currentDate);
        if (view === 'Month') newDate.setMonth(currentDate.getMonth() + direction);
        else if (view === 'Day') newDate.setDate(currentDate.getDate() + direction);
        else if (view === 'Year') newDate.setFullYear(currentDate.getFullYear() + direction);
        else newDate.setDate(currentDate.getDate() + (direction * 7));
        setCurrentDate(newDate);
    };

    const saveDeskDraftRecord = (record) => {
        // Trigger page refresh to reload drafts from backend PostgreSQL DB
        window.dispatchEvent(new Event('my_drafts_updated'));
    };

    const handleEditDraft = (draft) => {
        handleWorkspaceDraftOpen(draft);
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 px-2">

            {/* ── ROW 1: HERO GREETING ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-[24px] border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] overflow-hidden p-6 md:p-8"
                style={GLOW_PANEL_STYLE}
            >
                <RightGlow />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <RegionalTypingGreeting name={userName} />
                        <TypingSubtitle text="Your Intelligent AI Legal Workspace is ready." />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={() => navigate('/dashboard/editor')} className="bg-[#2563EB] text-xl text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-[#1D4ED8] transition-all text-sm">
                            <Plus className="w-5 h-5" /> Create Draft
                        </button>
                        <button onClick={() => navigate('/dashboard/research')} className="bg-white text-[#2563EB] text-xl border border-blue-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors text-sm shadow-sm">
                            <ArrowUpRight className="w-5 h-5" /> Start Research
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* ── ROW 2: SUMMARY KPI ── */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-[0_8px_30px_rgb(37,99,235,0.04)] flex flex-wrap md:flex-nowrap items-center justify-between gap-6 overflow-x-auto scrollbar-hide">
                {KPIS.map((kpi, i) => (
                    <div key={i} className="flex items-center gap-4 min-w-[140px] shrink-0">
                        <div className={`w-10 h-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center shrink-0`}>
                            <kpi.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-[#0F1C2E]">{kpi.value}</div>
                            <div className="text-xs font-bold text-slate-600 uppercase tracking-tight">{kpi.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── ROW 3: CALENDAR (Left 2/3) + UPCOMING HEARINGS (Right 1/3) ── */}
            <div className="grid lg:grid-cols-3 gap-6">

                {/* CALENDAR */}
                <div className="lg:col-span-2">
                    <section
                        className="relative rounded-[24px] border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] overflow-hidden flex flex-col h-full z-0"
                        style={GLOW_PANEL_STYLE}
                    >
                        <RightGlow />
                        <div className="px-6 py-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm"><CalendarIcon className="w-5 h-5" /></div>
                                <h2 className="text-xl font-black text-[#0F1C2E]">Calendar</h2>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-blue-400 transition-all w-full md:w-64 shadow-sm">
                                    <Search className="w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="Search events..." className="bg-transparent border-none outline-none text-sm text-[#0F1C2E] w-full" />
                                </div>
                                <CreateEventModalTrigger
                                    onAdd={(event) => setEvents((prev) => [...prev, event])}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row flex-1">
                            <div className="w-full md:w-64 p-6 bg-slate-50/50 border-r border-slate-100 space-y-8 z-10">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-[#0F1C2E]">Today's Events</h3>
                                        <Filter className="w-4 h-4 text-slate-400 cursor-pointer hover:text-blue-600" />
                                    </div>
                                    <div className="space-y-3 overflow-y-auto max-h-[300px] draftmate-scroll pr-2">
                                        {events
                                            .filter(
                                                event =>
                                                    event.date ===
                                                    new Date().toISOString().split("T")[0]
                                            )
                                            .map(event => (
                                                <div
                                                    key={event.id}
                                                    className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm"
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div
                                                            className={`w-2 h-2 rounded-full ${event.color}`}
                                                        />
                                                        <span className="text-xs font-bold text-slate-600">
                                                            {event.time}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-semibold text-[#0F1C2E]">
                                                        {event.title}
                                                    </h4>
                                                </div>
                                            ))}

                                        {events.filter(
                                            event =>
                                                event.date ===
                                                new Date().toISOString().split("T")[0]
                                        ).length === 0 && (
                                                <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-8 text-center shadow-sm">
                                                    <CalendarDays className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                                    <p className="text-xs font-semibold text-slate-400">
                                                        No Events for Today
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-6 flex flex-col z-10">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-bold text-[#0F1C2E] bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-all">Today</button>
                                        <div className="flex items-center gap-1 bg-white/50 p-1 rounded-xl shadow-sm border border-slate-200/50 backdrop-blur">
                                            <button onClick={() => handleNavigate(-1)} className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                                            <span className="text-sm font-bold text-[#0F1C2E] min-w-[120px] text-center">{view === 'Year' ? year : `${monthName} ${year}`}</span>
                                            <button onClick={() => handleNavigate(1)} className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-all"><ChevronRight className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-white/50 p-1 rounded-xl border border-slate-200/50 shadow-sm backdrop-blur">
                                        {['Day', 'Week', 'Month', 'Year'].map((v) => (
                                            <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${view === v ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}>{v}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    {view === 'Month' && <MonthGridView currentDate={currentDate} events={events} />}
                                    {view !== 'Month' && (
                                        <div className="h-full min-h-[300px] border border-slate-100 rounded-2xl flex items-center justify-center bg-white/50 shadow-sm backdrop-blur">
                                            <p className="text-slate-400 font-medium italic">{view} view active for {currentDate.toDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* UPCOMING HEARINGS */}
                <div className="lg:col-span-1">
                    <section
                        className="relative rounded-[24px] border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] overflow-hidden h-full flex flex-col z-0"
                        style={GLOW_PANEL_STYLE}
                    >
                        <RightGlow />
                        <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <h2 className="text-sm font-bold text-[#0F1C2E]">Upcoming Hearings</h2>
                        </div>
                        <div className="p-2 flex-1 flex flex-col gap-2 z-10 max-h-[420px] overflow-y-auto draftmate-scroll">
                            {HEARINGS.map((hearing, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-white/80 hover:bg-white rounded-xl transition-all cursor-pointer group border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-black text-[#0F1C2E]">{hearing.time.split(' ')[0]}</span>
                                            <span className="text-[10px] font-bold text-slate-500">{hearing.time.split(' ')[1]}</span>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold ${hearing.status === 'Upcoming' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {hearing.status === 'Upcoming' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} {hearing.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-[#0F1C2E] text-sm group-hover:text-blue-600 transition-colors">{hearing.case}</h3>
                                    <div className="flex flex-col gap-1 text-[11px] font-medium text-slate-500 mt-1">
                                        <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {hearing.court}</span>
                                        <span className="flex items-center gap-1.5"><Scale className="w-3 h-3" /> {hearing.judge}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* ── ROW 4: FOLDER MANAGEMENT (Left 2/3) + QUICK ACTIONS (Right 1/3) ── */}
            <div className="grid lg:grid-cols-3 gap-6">

                {/* FOLDER MANAGEMENT */}
                <div className="lg:col-span-2">
                    <section
                        className="relative overflow-hidden rounded-[24px] border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] p-6 flex flex-col h-full z-0"
                        style={GLOW_PANEL_STYLE}
                    >
                        <RightGlow />
                        <div className="relative z-10 flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-[#0F1C2E]">Folder Management</h2>
                            <button className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors bg-blue-50 p-2 rounded-xl hover:bg-blue-100 shadow-sm"><FolderPlus className="w-5 h-5" /></button>
                        </div>
                        <div className="relative z-10 flex gap-4 flex-1 overflow-x-auto draftmate-scroll pb-4 snap-x snap-mandatory">
                            {FOLDERS.map((folder, idx) => (
                                <div key={idx} className="bg-white/80 rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between backdrop-blur-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <Folder className={`w-10 h-10 ${folder.color} group-hover:scale-110 transition-transform duration-300 ${folder.fill}`} />
                                        <span className="bg-white px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 shadow-sm border border-slate-100">{folder.count}</span>
                                    </div>
                                    <h3 className="font-bold text-[#0F1C2E] text-sm group-hover:text-blue-700 transition-colors">{folder.name}</h3>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* QUICK ACTIONS */}
                <div className="lg:col-span-1">
                    <div
                        className="relative overflow-hidden rounded-[24px] border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] p-6 h-full flex flex-col justify-between z-0"
                        style={GLOW_PANEL_STYLE}
                    >
                        <RightGlow />
                        <h3 className="text-lg font-bold text-[#0F1C2E] mb-4 flex items-center gap-2 relative z-10">
                            <Zap className="w-5 h-5 text-blue-600 fill-blue-600/10" /> Quick Actions
                        </h3>
                        <div className="space-y-3 relative z-10 flex-1 flex flex-col justify-center">
                            <button onClick={() => navigate('/dashboard/pdf-tools')} className="w-full flex items-center justify-between bg-white hover:bg-blue-50 shadow-sm border border-slate-200 hover:border-blue-300 px-5 py-4 rounded-xl transition-all font-medium text-sm text-[#0F1C2E] group">
                                <span className="group-hover:text-blue-700 transition-colors">PDF Tool Kit</span>
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                                    <Layers className="w-4 h-4" />
                                </span>
                            </button>
                            <button onClick={() => navigate('/dashboard/translate')} className="w-full flex items-center justify-between bg-white hover:bg-blue-50 shadow-sm border border-slate-200 hover:border-blue-300 px-5 py-4 rounded-xl transition-all font-medium text-sm text-[#0F1C2E] group">
                                <span className="group-hover:text-blue-700 transition-colors">Document Translate</span>
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                                    <Languages className="w-4 h-4" />
                                </span>
                            </button>
                            <button onClick={() => navigate('/dashboard/library')} className="w-full flex items-center justify-between bg-white hover:bg-blue-50 shadow-sm border border-slate-200 hover:border-blue-300 px-5 py-4 rounded-xl transition-all font-medium text-sm text-[#0F1C2E] group">
                                <span className="group-hover:text-blue-700 transition-colors">Legal Library</span>
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                                    <Library className="w-4 h-4" />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* ── ROW 5: RECENT MATTER WORKSPACES ── */}
            <section
                className="relative overflow-hidden rounded-[24px] border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] p-6 z-0"
                style={GLOW_PANEL_STYLE}
            >
                <RightGlow />
                <div className="relative z-10 flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-[#0F1C2E]">Recent Matter Workspaces</h2>
                    <button className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">View All</button>
                </div>
                <div className="relative z-10 flex gap-4 overflow-x-auto draftmate-scroll pb-4 snap-x snap-mandatory">
                    {RECENT_WORK.map((work, i) => (
                        <motion.div key={i} whileHover={{ y: -4 }} className="min-w-[300px] md:min-w-[340px] shrink-0 snap-start bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#F8FAFF] border border-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-[#2563EB] group-hover:text-white transition-colors shadow-sm">
                                        {work.type === 'Legal Draft' ? <FileText className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">{work.time}</span>
                                </div>
                                <h3 className="font-bold text-[#0F1C2E] text-[15px] mb-1 line-clamp-1">{work.title}</h3>
                                <p className="text-xs font-medium text-slate-500 mb-6">{work.type}</p>
                            </div>
                            <div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                    <div className="bg-gradient-to-r from-[#2563EB] to-cyan-500 h-1.5 rounded-full" style={{ width: `${work.progress}%` }} />
                                </div>
                                <div className="text-[10px] font-bold text-slate-600 text-right">{work.progress}% Complete</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── ROW 6: EXPANDED LAWYER PROFILE CARD ── */}
            <motion.div
                whileHover={{ y: -2 }}
                className="relative rounded-[24px] border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] overflow-hidden group z-0"
                style={GLOW_PANEL_STYLE}
            >
                <RightGlow />
                <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8 flex-1">
                        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-white">
                            <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
                            <div className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                        </div>
                        <div className="flex-1 max-w-3xl">
                            <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-1.5">
                                <h2 className="text-2xl md:text-3xl font-bold text-[#0F1C2E]">Julian Vance</h2>
                                <span className="text-[10px] md:text-[11px] text-slate-500 font-bold uppercase tracking-widest">Partner • Senior Counsel</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-5 leading-relaxed max-w-2xl font-medium">
                                Specializing in Corporate Arbitration and IP Litigation. Active member of the Bar Association for 12 years.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 bg-white text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Tier 1 Practitioner
                                </span>
                                <span className="inline-flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                    <Gavel className="w-4 h-4 text-slate-500" /> 142 Cases Won
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-center gap-4 shrink-0 mt-2 md:mt-0 pr-4 md:pr-12 relative z-10">
                        <button onClick={() => navigate('/dashboard/settings')} className="text-slate-600 hover:text-blue-600 text-xs font-bold transition-colors px-2">Edit Profile</button>
                        <button onClick={() => navigate('/dashboard/settings')} className="bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-[#0F1C2E] px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">Settings</button>
                    </div>
                </div>

                <button className="absolute bottom-0 right-0 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-tl-[24px] flex items-center justify-center shadow-lg transition-colors z-20">
                    <Plus className="w-6 h-6" />
                </button>
            </motion.div>

            {/* ── ROW 7: DRAFTMATE TUTORIALS ── */}
            <section
                className="relative overflow-hidden rounded-[24px] border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] p-6 z-0"
                style={GLOW_PANEL_STYLE}
            >
                <RightGlow />
                <div className="relative z-10 flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-[#0F1C2E]">DraftMate Tutorials</h2>
                    <button className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">View All</button>
                </div>
                <div className="relative z-10 flex gap-4 overflow-x-auto draftmate-scroll pb-4 snap-x snap-mandatory">
                    {[
                        { title: "Getting Started with DraftMate", duration: "3:45" },
                        { title: "AI Legal Research Guide", duration: "5:20" },
                        { title: "Drafting Legal Documents", duration: "4:15" },
                        { title: "Managing Cases Efficiently", duration: "2:50" }
                    ].map((tut, i) => (
                        <motion.div key={i} whileHover={{ y: -4 }} className="w-[260px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group overflow-hidden flex flex-col">
                            <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden flex items-center justify-center">
                                {/* Simulated thumbnail background */}
                                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-colors" />
                                <div className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-blue-600 shadow-lg group-hover:scale-110 transition-transform z-10">
                                    <PlayCircle className="w-5 h-5 ml-0.5" />
                                </div>
                                <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur z-10">
                                    {tut.duration}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-[#0F1C2E] text-sm group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">{tut.title}</h3>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

        </div>
    );
}

function MonthGridView({ currentDate, events }) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    const calendarGrid = [];

    for (let i = firstDay - 1; i >= 0; i--) calendarGrid.push({ day: prevMonthTotalDays - i, current: false });
    for (let i = 1; i <= totalDays; i++) calendarGrid.push({ day: i, current: true });

    const remainingCells = 42 - calendarGrid.length;
    for (let i = 1; i <= remainingCells; i++) calendarGrid.push({ day: i, current: false });

    const today = new Date();
    const isToday = (d) => today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

    return (
        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden text-center shadow-sm h-full">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="bg-white/80 text-[10px] font-black text-slate-500 py-3 uppercase tracking-widest">{d}</div>
            ))}
            {calendarGrid.map((cell, idx) => {

                const cellDate =
                    `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;

                const dayEvents = events.filter(
                    event => event.date === cellDate
                );

                return (
                    <div
                        key={idx}
                        className={`bg-white p-2 min-h-[100px] text-right font-bold text-xs hover:bg-blue-50/50 relative border-t border-slate-50 transition-colors ${!cell.current
                            ? "text-slate-300"
                            : "text-slate-700"
                            }`}
                    >
                        <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${isToday(cell.day) && cell.current
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                : ""
                                }`}
                        >
                            {cell.day}
                        </span>

                        <div className="mt-2 space-y-1 text-left">
                            {dayEvents.slice(0, 2).map(event => (
                                <div
                                    key={event.id}
                                    className={`${event.color} text-white text-[10px] px-2 py-1 rounded-md truncate`}
                                >
                                    {event.title}
                                </div>
                            ))}

                            {dayEvents.length > 2 && (
                                <div className="text-[10px] text-blue-600 font-semibold">
                                    +{dayEvents.length - 2} more
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function CreateEventModalTrigger({ onAdd }) {
    const [open, setOpen] = useState(false);

    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!title || !date || !time) return;

        onAdd({
            id: Date.now(),
            title,
            date,
            time,
            type: "event",
            color: "bg-blue-500",
        });

        setTitle("");
        setDate("");
        setTime("");

        setOpen(false);
    };

    const handleWorkspaceDraftOpen = (draft) => {
        const filename = ensureDocxFilename(draft.filename || draft.title || draft.rawName || 'Untitled Draft');
        const documentKey = draft.documentKey || draft.id || filename;
        const onlyofficeConfig = buildWorkspaceConfig({
            ...draft,
            filename,
            documentKey,
        });

        navigate('/dashboard/workspace', {
            state: {
                draftId: draft.id,
                id: draft.id,
                documentKey,
                filename,
                onlyofficeConfig,
                variablesDetected: draft.variablesDetected || [],
                trackingParams: draft.trackingParams || {
                    documentKey,
                    filename,
                    source: draft.trackingParams?.source || 'my_desk',
                    folderId: draft.trackingParams?.folderId ?? null,
                },
            },
        });
    };

    const handleCreateNewDraft = () => {
        setIsDraftingModalOpen(true);
    };

    const handleExistingDocumentClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const ext = `.${(file.name.split('.').pop() || '').toLowerCase()}`;
        if (!['.docx', '.pdf'].includes(ext)) {
            toast.error('Only .docx and .pdf files are supported.');
            event.target.value = '';
            return;
        }

        const sessionId = localStorage.getItem('session_id');
        if (!sessionId) {
            toast.error('Please sign in again before uploading a document.');
            event.target.value = '';
            return;
        }

        setIsUploadingDocument(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('session_id', sessionId);

            const response = await fetch(`${API_CONFIG.DRAFTER.BASE_URL}/v2/draft/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${sessionId}`,
                },
                body: formData,
            });

            if (!response.ok) {
                let detail = 'Failed to upload document.';
                try {
                    const errorData = await response.json();
                    detail = errorData?.detail || detail;
                } catch {
                    detail = response.statusText || detail;
                }
                throw new Error(detail);
            }

            const data = await response.json();

            saveDeskDraftRecord({
                id: data.documentKey,
                name: data.filename,
                filename: data.filename,
                documentKey: data.documentKey,
                onlyofficeConfig: data,
                variablesDetected: data.variablesDetected || [],
                status: 'In progress',
                source: 'dashboard_upload',
                trackingParams: {
                    source: 'dashboard_upload',
                    documentKey: data.documentKey,
                    filename: data.filename,
                    uploadedAt: new Date().toISOString(),
                },
            });

            navigate('/dashboard/workspace', {
                state: {
                    documentKey: data.documentKey,
                    filename: data.filename,
                    onlyofficeConfig: data,
                    variablesDetected: data.variablesDetected || [],
                    trackingParams: {
                        source: 'dashboard_upload',
                        documentKey: data.documentKey,
                        filename: data.filename,
                    },
                },
            });
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(error.message || 'Failed to upload and open document.');
        } finally {
            setIsUploadingDocument(false);
            event.target.value = '';
        }
    };

    const visibleDeskDrafts = allDrafts;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-[#0F1C2E] hover:bg-blue-900 text-white text-sm font-bold transition-all duration-300 shadow-lg shadow-slate-900/10 flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> Create Event
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[28px] w-full max-w-md p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-[#0F1C2E]">
                                Create New Event
                            </h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                    Event Title*
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Client Meeting"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-medium"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                <button type="button" className="bg-white text-blue-600 font-bold text-xs py-2.5 rounded-lg shadow-sm border border-slate-200">Court Hearing</button>
                                <button type="button" className="text-slate-400 font-bold text-xs py-2.5 rounded-lg hover:text-slate-600">Non-Court Event</button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 text-sm font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Time</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 text-sm font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                                <textarea className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 text-sm font-medium min-h-[100px]" placeholder="Add preparation notes..." />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-full bg-[#0F1C2E] text-white font-bold py-3.5 rounded-xl hover:bg-blue-900 shadow-lg shadow-blue-900/10 transition-colors"
                                >
                                    Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
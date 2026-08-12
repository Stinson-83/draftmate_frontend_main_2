import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../services/endpoints';

// ─── Cache helpers ─────────────────────────────────────────────────────────────
const CACHE_PREFIX = 'timeline_cache_';

function buildFingerprint(drafts) {
    return drafts
        .map(d => `${d.id}:${d.lastModified || ''}`)
        .sort()
        .join('|');
}

function readCache(folderId) {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + folderId);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function writeCache(folderId, payload) {
    try {
        localStorage.setItem(CACHE_PREFIX + folderId, JSON.stringify(payload));
    } catch (e) {
        console.warn('Timeline cache write failed:', e);
    }
}

// ─── Date Regex Patterns ──────────────────────────────────────────────────────
const DATE_PATTERNS = [
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/gi,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g,
    /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
];

const MONTH_MAP = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
    aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
    nov: 11, november: 11, dec: 12, december: 12,
};

function parseToDate(rawMatch, patternIndex) {
    try {
        if (patternIndex === 0) { const [, d, m, y] = rawMatch; return new Date(parseInt(y), (MONTH_MAP[m.toLowerCase()] || 1) - 1, parseInt(d)); }
        if (patternIndex === 1) { const [, m, d, y] = rawMatch; return new Date(parseInt(y), (MONTH_MAP[m.toLowerCase()] || 1) - 1, parseInt(d)); }
        if (patternIndex === 2 || patternIndex === 4) { const [, d, m, y] = rawMatch; return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)); }
        if (patternIndex === 3) { const [, y, m, d] = rawMatch; return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)); }
    } catch { /* ignore */ }
    return null;
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function extractDatesFromText(plainText, draftName, draftId) {
    const words = plainText.split(/\s+/);
    const results = [];
    const seenDates = new Set();

    DATE_PATTERNS.forEach((pattern, patternIndex) => {
        let match;
        const re = new RegExp(pattern.source, pattern.flags);
        while ((match = re.exec(plainText)) !== null) {
            const rawDateStr = match[0];
            const dateObj = parseToDate(match, patternIndex);
            if (!dateObj || isNaN(dateObj.getTime())) continue;

            const dateKey = dateObj.toISOString().split('T')[0];
            if (seenDates.has(`${draftId}::${dateKey}::${rawDateStr}`)) continue;
            seenDates.add(`${draftId}::${dateKey}::${rawDateStr}`);

            const wordIndex = plainText.substring(0, match.index).split(/\s+/).length;
            const contextWords = words.slice(Math.max(0, wordIndex - 50), Math.min(words.length, wordIndex + rawDateStr.split(/\s+/).length + 50));

            results.push({
                rawDate: rawDateStr,
                dateKey,
                sortMs: dateObj.getTime(),
                context: contextWords.join(' '),
                draftName,
                draftId,
            });
        }
    });

    return results;
}

// ─── Main Component ────────────────────────────────────────────────────────────
const DateTimelineModal = ({ folderId, folderName, drafts, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateEntries, setDateEntries] = useState([]);
    const [summaries, setSummaries] = useState({});
    const [activeEntry, setActiveEntry] = useState(0); // Default to first item
    const timelineRef = useRef(null);
    const [sidebarWidth, setSidebarWidth] = useState(384);
    const sidebarRef = useRef(null);
    const isResizingRef = useRef(false);

    const onMouseDown = (e) => {
        isResizingRef.current = true;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.userSelect = 'none';
    };

    const onMouseMove = (e) => {
        if (!isResizingRef.current) return;
        if (!sidebarRef.current) return;
        const rect = sidebarRef.current.getBoundingClientRect();
        const newWidth = rect.right - e.clientX;
        if (newWidth > 250 && newWidth < 600) {
            setSidebarWidth(newWidth);
        }
    };

    const onMouseUp = () => {
        isResizingRef.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.userSelect = 'auto';
    };

    // ── On mount: check cache or rebuild ──────────────────────────────────────
    useEffect(() => {
        const fingerprint = buildFingerprint(drafts);
        const cached = readCache(folderId);

        if (cached) {
            setDateEntries(cached.dateEntries);
            setSummaries(cached.summaries || {});
            
            if (cached.fingerprint === fingerprint) {
                setIsLoading(false);
                return;
            }
        }

        const rebuild = async () => {
            try {
                // 1. Extract dates
                const allEntries = [];
                drafts.forEach(draft => {
                    const plain = stripHtml(draft.content || '');
                    allEntries.push(...extractDatesFromText(plain, draft.name || 'Untitled Draft', draft.id));
                });
                allEntries.sort((a, b) => a.sortMs - b.sortMs);

                // 2. Fetch summaries
                const newSummaries = {};
                if (allEntries.length > 0) {
                    const fetches = allEntries.map(async (entry, i) => {
                        try {
                            const res = await fetch(
                                `${API_CONFIG.ENHANCE_BOT.BASE_URL}${API_CONFIG.ENHANCE_BOT.ENDPOINTS.SUMMARISE_CONTEXT}`,
                                {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ date: entry.rawDate, context: entry.context }),
                                }
                            );
                            if (!res.ok) throw new Error(`${res.status}`);
                            const data = await res.json();
                            newSummaries[i] = { text: data.summary, loading: false, error: '' };
                        } catch (err) {
                            const fallback = entry.context.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
                            newSummaries[i] = { text: fallback, loading: false, error: 'LLM unavailable.' };
                        }
                    });
                    await Promise.all(fetches);
                }

                // 3. Persist
                writeCache(folderId, { fingerprint, dateEntries: allEntries, summaries: newSummaries });

                setDateEntries(allEntries);
                setSummaries(newSummaries);
                setIsLoading(false);
            } catch (err) {
                console.error('Timeline rebuild error:', err);
                setError('Failed to build timeline.');
                setIsLoading(false);
            }
        };

        rebuild();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [folderId]);

    const handleSummaryChange = (index, newText) => {
        const updatedSummaries = {
            ...summaries,
            [index]: { ...summaries[index], text: newText }
        };
        setSummaries(updatedSummaries);
        
        // Update cache too!
        const fingerprint = buildFingerprint(drafts);
        writeCache(folderId, { fingerprint, dateEntries, summaries: updatedSummaries });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div
                className="relative bg-[#faf9fa] text-[#1b1c1d] rounded-2xl shadow-2xl border border-[#e3e2e3] w-full mx-4 flex flex-col overflow-hidden"
                style={{ maxWidth: '95vw', maxHeight: '95vh' }}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#e3e2e3] bg-blue-600">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{folderName}</h2>
                            <p className="text-blue-100 text-xs">
                                {isLoading ? '…' : `${dateEntries.length} date${dateEntries.length !== 1 ? 's' : ''} extracted`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex flex-1 overflow-hidden" style={{ minHeight: '600px' }}>
                    
                    {/* Left: Horizontal Timeline */}
                    <div className="flex-grow flex flex-col p-8 overflow-hidden bg-[#faf9fa]">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-blue-600 mb-1">Evidence Timeline</h1>
                            <p className="text-[#434653] text-sm">Chronological visualization of key case milestones extracted from discovery documents.</p>
                        </div>

                        {error ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <div className="text-4xl">⚠️</div>
                                <p className="text-red-500 font-medium">{error}</p>
                            </div>
                        ) : dateEntries.length === 0 && !isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <div className="text-5xl">📭</div>
                                <p className="text-[#1b1c1d] font-semibold text-lg">No dates found</p>
                                <p className="text-[#434653] text-sm text-center max-w-sm">
                                    No recognisable date patterns were detected in the drafts inside this folder.
                                </p>
                            </div>
                        ) : (
                            <div className="relative w-full flex-grow flex items-center overflow-x-auto" ref={timelineRef}>
                                {/* Content Container (Scrollable) */}
                                <div className="relative flex items-center min-w-max gap-32 px-16 h-full">
                                    {/* Horizontal connecting line (inside to stretch) */}
                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#c3c6d5] -translate-y-1/2 z-0" />

                                    {dateEntries.map((entry, i) => {
                                        const isEven = i % 2 === 0;
                                        const isActive = activeEntry === i;
                                        return (
                                            <div 
                                                key={i} 
                                                className="relative flex flex-col items-center cursor-pointer"
                                                onClick={() => setActiveEntry(i)}
                                            >
                                                {/* Dot */}
                                                <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-blue-600 ring-4 ring-blue-600/20' : 'bg-[#c3c6d5]'} z-10 transition-colors`}></div>
                                                
                                                {/* Stem and Box */}
                                                <div className={`absolute ${isEven ? 'bottom-full mb-2' : 'top-full mt-2'} flex flex-col items-center w-[180px]`}>
                                                    {isEven ? (
                                                        <>
                                                            <div className={`bg-white border ${isActive ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-[#c3c6d5]'} p-4 rounded-xl shadow-sm w-full text-center transition-all`}>
                                                                <span className={`block text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-[#434653]'} uppercase mb-1`}>
                                                                    {entry.rawDate}
                                                                </span>
                                                                <span className="block text-sm text-[#1b1c1d] truncate">
                                                                    {entry.draftName}
                                                                </span>
                                                            </div>
                                                            <div className={`w-[2px] h-12 ${isActive ? 'bg-blue-600' : 'bg-[#c3c6d5]'} mt-2`}></div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className={`w-[2px] h-12 ${isActive ? 'bg-blue-600' : 'bg-[#c3c6d5]'} mb-2`}></div>
                                                            <div className={`bg-white border ${isActive ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-[#c3c6d5]'} p-4 rounded-xl shadow-sm w-full text-center transition-all`}>
                                                                <span className={`block text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-[#434653]'} uppercase mb-1`}>
                                                                    {entry.rawDate}
                                                                </span>
                                                                <span className="block text-sm text-[#1b1c1d] truncate">
                                                                    {entry.draftName}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resize Handle */}
                    <div className="w-1 cursor-col-resize bg-slate-200 hover:bg-blue-600 transition-colors z-20" onMouseDown={onMouseDown} />

                    {/* Right Side: Extracted Dates List */}
                    <div ref={sidebarRef} style={{ width: `${sidebarWidth}px` }} className="bg-white overflow-y-auto flex flex-col p-6 gap-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-[#1b1c1d]">Extracted Dates</h3>
                                <span className="px-3 py-1 bg-[#d9e2ff] text-[#001946] text-xs font-semibold rounded-full">
                                    {dateEntries.length} Dates
                                </span>
                            </div>

                        </div>

                        <div className="flex flex-col gap-4 relative">
                            {/* Connecting Vertical Line */}
                            {dateEntries.length > 0 && (
                                <div className="absolute left-4 top-4 bottom-4 w-px bg-[#c3c6d5]"></div>
                            )}

                            {dateEntries.map((entry, i) => {
                                const isActive = activeEntry === i;
                                const summary = summaries[i];
                                return (
                                    <div key={i} className="relative z-10 flex gap-4">
                                        {/* Dot Container */}
                                        <div 
                                            className={`mt-1 w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                                                isActive 
                                                    ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-600/10' 
                                                    : 'bg-[#efedee] border-[#c3c6d5]'
                                            }`}
                                            onClick={() => setActiveEntry(i)}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-[#c3c6d5]'}`}></div>
                                        </div>

                                        {/* Content Card */}
                                        <div className="flex-grow flex flex-col gap-3">
                                            <div 
                                                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                                    isActive 
                                                        ? 'border-blue-600 bg-white shadow-sm' 
                                                        : 'border-[#c3c6d5] bg-[#f5f3f4] hover:bg-[#efedee]'
                                                }`}
                                                onClick={() => setActiveEntry(i)}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-semibold uppercase ${isActive ? 'text-blue-600' : 'text-[#1b1c1d]'}`}>
                                                        {entry.rawDate}
                                                    </span>
                                                    <span className="text-[#434653] font-mono text-xs">#{i + 1}</span>
                                                </div>
                                                <span className="text-sm text-[#434653] flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">description</span> 
                                                    {entry.draftName}
                                                </span>
                                            </div>

                                            {/* AI Summary Panel (Only for active item) */}
                                            {isActive && (
                                                <div className="p-4 rounded-xl bg-blue-600/5 border border-blue-600/20 relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>

                                                    
                                                    {summary?.loading ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                                            <p className="text-xs text-blue-600">Summarising…</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <textarea
                                                                className="w-full text-sm text-[#434653] leading-relaxed bg-transparent border-0 focus:ring-0 resize-none p-0 outline-none overflow-hidden"
                                                                value={summary?.text || ''}
                                                                onChange={(e) => {
                                                                    handleSummaryChange(i, e.target.value);
                                                                    e.target.style.height = 'auto';
                                                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                                                }}
                                                                rows={1}
                                                                placeholder="Type to edit summary..."
                                                                ref={(el) => {
                                                                    if (el) {
                                                                        el.style.height = 'auto';
                                                                        el.style.height = `${el.scrollHeight}px`;
                                                                    }
                                                                }}
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-3 border-t border-[#e3e2e3] flex items-center justify-end bg-white">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm font-medium text-[#434653] bg-[#efedee] hover:bg-[#e3e2e3] rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateTimelineModal;

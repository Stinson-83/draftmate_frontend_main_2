import React from 'react';

/**
 * Process citations in content and convert them to clickable markdown links.
 * Handles: [1], [2], [1, 3, 4, 6], [7, 8], [Case Law], [Strategy, Section 2], etc.
 */
export const processCitations = (content, sources) => {
    if (!sources || sources.length === 0) return content;

    let processed = content;

    // Create a map for quick source lookup
    const sourceByIndex = {};
    sources.forEach(source => {
        if (source.index !== undefined && source.index !== null) {
            sourceByIndex[source.index] = source;
        }
    });

    // 1. Handle MULTI-number citations FIRST: [1, 3, 4, 6], [7, 8], [1,2]
    const multiNumPattern = /\[(\d+(?:\s*,\s*\d+)+)\](?!\()/g;
    processed = processed.replace(multiNumPattern, (match, nums) => {
        const indices = nums.split(',').map(n => parseInt(n.trim()));
        const firstSource = indices.find(idx => sourceByIndex[idx]);
        if (firstSource !== undefined) {
            return `[${match}](citation://multi?nums=${encodeURIComponent(nums)})`;
        }
        return match;
    });

    // 2. Handle SINGLE numeric citations: [1], [2], etc.
    processed = processed.replace(/\[(\d+)\](?!\()/g, (match, num) => {
        const index = parseInt(num);
        const source = sourceByIndex[index];
        if (source) {
            const url = source.url || `citation://numeric?index=${index}`;
            return `[\\[${index}\\]](${url})`;
        }
        return match;
    });

    // 3. Handle text-based citations WITH comma: [Strategy, Section 2]
    const textWithCommaPattern = /\[([a-zA-Z][a-zA-Z\s]*),\s*([^\]]+)\](?!\()/g;
    processed = processed.replace(textWithCommaPattern, (match, sourceName, details) => {
        return `[${match}](citation://text?source=${encodeURIComponent(sourceName.trim())}&details=${encodeURIComponent(details.trim())})`;
    });

    // 4. Handle simple text citations WITHOUT comma: [Case Law], [Strategy]
    const simpleTextPattern = /\[([A-Za-z][A-Za-z0-9\s.-]*)\](?!\()/g;
    processed = processed.replace(simpleTextPattern, (match, text) => {
        const t = text.trim();
        if (/^\d+$/.test(t)) return match;
        if (t.includes('\\')) return match;
        return `[${match}](citation://simple?text=${encodeURIComponent(t)})`;
    });

    return processed;
};

/**
 * Format source type for display
 */
const formatSourceType = (type) => {
    if (!type) return 'Reference';
    const t = type.toLowerCase();
    if (t.includes('tavily') || t.includes('duck') || t.includes('google') || t.includes('bing') || t.includes('search')) return 'Web Source';
    if (t === 'case') return 'Legal Precedent';
    if (t === 'law' || t === 'act' || t === 'section') return 'Statute/Act';
    if (t === 'youtube') return 'Video Source';
    if (t === 'pdf' || t === 'doc') return 'Document';
    return type;
};

/**
 * Citation Link component with hover tooltip
 * Handles all citation types: numeric, multi, simple text, text with comma
 */
export const CitationLink = ({ href, children, sources, compact = false }) => {
    let source = null;
    let matchedSources = [];
    let displayText = children;
    let citationDetails = '';
    let citationType = 'unknown';

    // Parse the href to determine citation type
    const isCustomCitation = href && href.startsWith('citation://');
    const isDirectUrl = href && (href.startsWith('http://') || href.startsWith('https://'));

    if (isCustomCitation) {
        try {
            const url = new URL(href);
            citationType = url.hostname;

            if (citationType === 'numeric') {
                const index = parseInt(url.searchParams.get('index'));
                source = sources?.find(s => s.index === index);
            } else if (citationType === 'multi') {
                const nums = url.searchParams.get('nums');
                const indices = nums.split(',').map(n => parseInt(n.trim()));
                matchedSources = sources?.filter(s => indices.includes(s.index)) || [];
                if (matchedSources.length > 0) {
                    source = matchedSources[0];
                }
            } else if (citationType === 'text') {
                const sourceName = url.searchParams.get('source');
                citationDetails = url.searchParams.get('details');
                source = sources?.find(s => s.type?.toLowerCase() === sourceName?.toLowerCase());
                if (!source) source = sources?.find(s => s.title?.toLowerCase().includes(sourceName?.toLowerCase()));
                if (!source) source = sources?.find(s => s.type?.toLowerCase().includes(sourceName?.toLowerCase()));
            } else if (citationType === 'simple') {
                const text = url.searchParams.get('text');
                source = sources?.find(s => s.type?.toLowerCase() === text?.toLowerCase());
                if (!source) source = sources?.find(s => s.title?.toLowerCase().includes(text?.toLowerCase()));
                if (!source) source = sources?.find(s => s.type?.toLowerCase().includes(text?.toLowerCase()));
                if (!source) source = sources?.find(s => s.citation?.toLowerCase()?.includes(text?.toLowerCase()));
            }
        } catch (e) {
            console.warn("Failed to parse citation URL", href, e);
        }
    } else if (isDirectUrl) {
        const numericMatch = children?.toString().match(/\\\[(\d+)\\\]|\[(\d+)\]/);
        if (numericMatch) {
            const citationIndex = parseInt(numericMatch[1] || numericMatch[2]);
            source = sources?.find(s => s.index === citationIndex);
        }
        if (!source) source = sources?.find(s => s.url === href);
    } else {
        const numericMatch = children?.toString().match(/\\\[(\d+)\\\]|\[(\d+)\]/);
        if (numericMatch) {
            const citationIndex = parseInt(numericMatch[1] || numericMatch[2]);
            source = sources?.find(s => s.index === citationIndex);
        }
    }

    const hasValidUrl = source?.url || matchedSources.some(s => s.url);
    const targetUrl = source?.url || (isDirectUrl ? href : undefined);
    const hasMultipleSources = matchedSources.length > 1;

    // Compact mode for sidebar (smaller, less intrusive)
    const baseClasses = "relative inline-block group/citation cursor-pointer";
    const linkClasses = compact
        ? hasValidUrl
            ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium no-underline bg-blue-50/80 dark:bg-blue-900/40 px-1 py-0.5 rounded text-xs hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-all duration-200"
            : "text-amber-600 dark:text-amber-400 font-medium no-underline bg-amber-50/80 dark:bg-amber-900/40 px-1 py-0.5 rounded text-xs transition-all duration-200"
        : hasValidUrl
            ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold no-underline bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-all duration-200 border border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600"
            : "text-amber-600 dark:text-amber-400 font-semibold no-underline bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded transition-all duration-200 border border-amber-200/50 dark:border-amber-700/50";

    return (
        <span className={baseClasses}>
            <a
                href={targetUrl}
                target={targetUrl ? "_blank" : undefined}
                rel={targetUrl ? "noopener noreferrer" : undefined}
                className={linkClasses}
                onClick={(e) => {
                    if (!targetUrl) e.preventDefault();
                }}
            >
                {displayText}
            </a>

            {/* Tooltip */}
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover/citation:opacity-100 group-hover/citation:visible transition-all duration-200 z-50 pointer-events-none group-hover/citation:pointer-events-auto ${compact ? 'min-w-[220px] max-w-[280px]' : 'min-w-[280px] max-w-[350px]'}`}>
                <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 ${compact ? 'p-2' : 'p-3'} backdrop-blur-sm`}>

                    {/* Multiple Sources Display */}
                    {hasMultipleSources ? (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                    {matchedSources.length} Sources
                                </span>
                            </div>
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                                {matchedSources.map((s, idx) => (
                                    <a
                                        key={idx}
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-1.5 rounded bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-500 dark:text-blue-400 text-xs font-mono">[{s.index}]</span>
                                            <span className={`text-[9px] px-1 py-0.5 rounded-full ${s.type === 'Case' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                                                s.type === 'Law' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                                                    'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                                                }`}>{formatSourceType(s.type)}</span>
                                        </div>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1 mt-0.5">{s.title}</p>
                                    </a>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Single Source Display */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${(source?.type || 'Reference') === 'Case'
                                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                                    : (source?.type || 'Reference') === 'Law'
                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}>
                                    {formatSourceType(source?.type || 'Source')}
                                </span>
                                {source?.index && <span className="text-blue-500 dark:text-blue-400 text-xs font-mono">[{source.index}]</span>}
                            </div>

                            <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-1 line-clamp-2`}>
                                {source ? source.title : "Citation Reference"}
                            </h4>

                            {citationDetails && (
                                <div className="text-[10px] bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded mt-1 mb-1">
                                    📍 {decodeURIComponent(citationDetails)}
                                </div>
                            )}

                            {source?.citation && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-mono line-clamp-1">
                                    {source.citation}
                                </p>
                            )}
                        </>
                    )}

                    {/* Footer */}
                    {targetUrl ? (
                        <div className="flex items-center gap-1 text-[9px] text-blue-600 dark:text-blue-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                            <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>open_in_new</span>
                            Click to view source
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-[9px] text-amber-500 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                            <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>info</span>
                            Reference only
                        </div>
                    )}
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                    <div className="border-6 border-transparent border-t-white dark:border-t-slate-800"></div>
                </div>
            </div>
        </span>
    );
};

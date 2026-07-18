import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DictationModal = ({ onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [language, setLanguage] = useState('en-IN');
    const [wordCount, setWordCount] = useState(0);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const recognitionRef = useRef(null);
    const textareaRef = useRef(null);

    const languages = [
        { code: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
        { code: 'hi-IN', label: 'Hindi (हिन्दी)', flag: '🇮🇳' },
        { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
        { code: 'mr-IN', label: 'Marathi (मराठी)', flag: '🇮🇳' },
        { code: 'ta-IN', label: 'Tamil (தமிழ்)', flag: '🇮🇳' },
        { code: 'te-IN', label: 'Telugu (తెలుగు)', flag: '🇮🇳' },
        { code: 'bn-IN', label: 'Bengali (বাংলা)', flag: '🇮🇳' },
        { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
        { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳' },
        { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳' },
    ];

    useEffect(() => {
        const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
        setWordCount(words.length);
    }, [transcript]);

    const initRecognition = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Speech Recognition is not supported in this browser. Please use Chrome.');
            return null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript + ' ';
                } else {
                    interim += result[0].transcript;
                }
            }

            if (final) {
                setTranscript(prev => prev + final);
            }
            setInterimTranscript(interim);
        };

        recognition.onerror = (event) => {
            console.error('Speech error:', event.error);
            if (event.error === 'not-allowed') {
                setError('Microphone access denied. Please allow microphone permission.');
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            // Auto-restart if still listening
            if (recognitionRef.current && isListening) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    // ignore
                }
            }
        };

        return recognition;
    }, [language, isListening]);

    const startListening = () => {
        setError('');
        const recognition = initRecognition();
        if (!recognition) return;

        recognitionRef.current = recognition;
        setIsListening(true);
        setInterimTranscript('');

        try {
            recognition.start();
        } catch (e) {
            console.error(e);
        }
    };

    const stopListening = () => {
        setIsListening(false);
        setInterimTranscript('');
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(transcript);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const textarea = document.createElement('textarea');
            textarea.value = transcript;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dictation-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        stopListening();
        setTranscript('');
        setInterimTranscript('');
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Restart recognition when language changes
    useEffect(() => {
        if (isListening) {
            stopListening();
            setTimeout(() => startListening(), 200);
        }
    }, [language]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isListening ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'}`}>
                            <span className={`material-symbols-outlined ${isListening ? 'text-red-500' : 'text-primary'}`}>mic</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Voice Dictation</h2>
                            <p className="text-xs text-slate-500">
                                {isListening ? (
                                    <span className="text-red-500 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        Listening...
                                    </span>
                                ) : 'Click mic to start dictating'}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => { stopListening(); onClose(); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Language Select */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                            Language
                        </label>
                        <select
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            disabled={isListening}
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                        >
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.flag} {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Mic Button */}
                    <div className="flex justify-center py-4">
                        <motion.button
                            onClick={toggleListening}
                            whileTap={{ scale: 0.9 }}
                            className="relative"
                        >
                            {/* Pulse rings when active */}
                            {isListening && (
                                <>
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-red-400"
                                        animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-red-400"
                                        animate={{ scale: [1, 2.2], opacity: [0.3, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                    />
                                </>
                            )}
                            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${isListening
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                                    : 'bg-primary hover:bg-primary/90 shadow-blue-500/30'
                                }`}>
                                <span className="material-symbols-outlined text-white text-3xl">
                                    {isListening ? 'stop' : 'mic'}
                                </span>
                            </div>
                        </motion.button>
                    </div>

                    {/* Transcript Area */}
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={transcript + interimTranscript}
                            onChange={e => {
                                setTranscript(e.target.value);
                                setInterimTranscript('');
                            }}
                            placeholder={isListening ? "Speak now... your words will appear here" : "Click the mic button and start speaking..."}
                            className="w-full h-48 p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all leading-relaxed"
                        />

                        {/* Interim highlight */}
                        {interimTranscript && (
                            <div className="absolute bottom-3 left-4 right-4">
                                <span className="text-xs text-primary/60 italic">
                                    Hearing: {interimTranscript}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                        <span>{wordCount} words · {transcript.length} characters</span>
                        <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                            {isListening ? 'Recording' : 'Idle'}
                        </span>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={handleClear}
                        disabled={!transcript}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Clear
                    </button>

                    <div className="flex gap-2">
                        <motion.button
                            onClick={handleCopy}
                            disabled={!transcript}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-lg">
                                {copied ? 'check' : 'content_copy'}
                            </span>
                            {copied ? 'Copied!' : 'Copy'}
                        </motion.button>

                        <button
                            onClick={handleDownload}
                            disabled={!transcript}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Download .txt
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DictationModal;
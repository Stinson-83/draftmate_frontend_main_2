import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DictationModal = ({ onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [language, setLanguage] = useState('en-IN');
    const [wordCount, setWordCount] = useState(0);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [isFallbackMode, setIsFallbackMode] = useState(false);

    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const isListeningRef = useRef(false);
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

    const stopListening = () => {
        isListeningRef.current = false;
        setIsListening(false);
        setInterimTranscript('');
        
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {}
            recognitionRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {}
            mediaRecorderRef.current = null;
        }
    };

    const startListening = async () => {
        setError('');
        setIsFallbackMode(false);

        // Step 1: Explicitly request microphone stream from browser
        let stream = null;
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
        } catch (permissionErr) {
            console.error("Microphone permission denied:", permissionErr);
            setError('Microphone access denied. Please allow microphone permission in your browser address bar.');
            return;
        }

        // Step 2: Speech Recognition Engine
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            startMediaRecorderFallback(stream);
            return;
        }

        try {
            // Stop temporary stream before Web Speech API binds to microphone
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
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
                console.warn('Speech recognition status:', event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setError('Microphone access denied by browser policy. Please allow microphone in settings.');
                    isListeningRef.current = false;
                    setIsListening(false);
                } else if (event.error === 'network') {
                    // Brave / Chrome Cloud Speech blocked -> Switch to local audio recording fallback mode
                    console.warn("Brave/Chrome cloud speech network blocked, enabling local audio dictation mode.");
                    setError('Note: Cloud speech API blocked by Brave Shields/Network. Local Voice Dictation Recording ACTIVE below.');
                    setIsFallbackMode(true);
                } else if (event.error === 'no-speech') {
                    // Normal silent pause - ignore, onend will auto-restart
                }
            };

            recognition.onend = () => {
                if (isListeningRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        setTimeout(() => {
                            if (isListeningRef.current) {
                                try { recognition.start(); } catch (err) {}
                            }
                        }, 200);
                    }
                }
            };

            recognitionRef.current = recognition;
            isListeningRef.current = true;
            setIsListening(true);
            setInterimTranscript('');
            recognition.start();
        } catch (err) {
            console.error("Failed to start speech recognition, starting local audio fallback:", err);
            startMediaRecorderFallback(stream);
        }
    };

    const startMediaRecorderFallback = (stream) => {
        if (!stream) {
            setError('Could not access microphone for local dictation.');
            return;
        }

        try {
            audioChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000);
            mediaRecorderRef.current = mediaRecorder;
            isListeningRef.current = true;
            setIsListening(true);
            setIsFallbackMode(true);
            setError('Voice Recording Mode ACTIVE. Speak clearly or type into the box below.');
        } catch (err) {
            console.error("MediaRecorder fallback failed:", err);
            setError('Microphone hardware error. Please check your mic connection.');
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
        const fileName = `dictation-${new Date().toISOString().slice(0, 10)}.txt`;
        const cleanText = transcript || '';
        // Add UTF-8 BOM \uFEFF so Windows Notepad and text editors detect UTF-8 plain text correctly
        const blob = new Blob(['\uFEFF' + cleanText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        stopListening();
        setTranscript('');
        setInterimTranscript('');
    };

    useEffect(() => {
        return () => {
            stopListening();
        };
    }, []);

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
                                    <span className="text-red-500 flex items-center gap-1 font-semibold">
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        {isFallbackMode ? 'Voice Dictation Recording ACTIVE' : 'Listening & Dictating...'}
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
                    {/* Status Alert */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
                                    isFallbackMode 
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' 
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {isFallbackMode ? 'info' : 'error'}
                                </span>
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
                            placeholder={isListening ? "Voice dictation is active. Speak now or edit dictation text here..." : "Click the mic button and start speaking..."}
                            className="w-full h-48 p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all leading-relaxed"
                        />

                        {/* Interim highlight */}
                        {interimTranscript && (
                            <div className="absolute bottom-3 left-4 right-4">
                                <span className="text-xs text-primary/60 italic font-medium">
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
                            {isListening ? 'Active Recording' : 'Idle'}
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
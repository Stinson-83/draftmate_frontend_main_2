// src/pages/StudentDetails.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_CONFIG } from '../services/endpoints';
import './StudentDetails.css';

const years = [
    { id: '1st', label: '1st Year' },
    { id: '2nd', label: '2nd Year' },
    { id: '3rd', label: '3rd Year' },
    { id: '4th', label: '4th Year' },
    { id: '5th', label: '5th Year' },
];

const StudentDetails = () => {
    const navigate = useNavigate();
    const [college, setCollege] = useState('');
    const [selectedYear, setSelectedYear] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [isEntering, setIsEntering] = useState(true);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const t = setTimeout(() => setIsEntering(false), 100);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const triggerExitAndNavigate = (path) => {
        setIsExiting(true);
        setTimeout(() => navigate(path), 700);
    };

    const handleSubmit = async () => {
        if (!college.trim()) {
            toast.error("Please enter your college name.");
            return;
        }
        if (!selectedYear) {
            toast.error("Please select your year.");
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading("Saving your details...");

        try {
            // Γ£à Save to localStorage only
            const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
            userProfile.college_name = college.trim();
            userProfile.study_year = selectedYear;
            localStorage.setItem('user_profile', JSON.stringify(userProfile));

            await new Promise(resolve => setTimeout(resolve, 600));

            toast.dismiss(loadingToast);
            toast.success("Welcome aboard, future lawyer! 🎓");
            triggerExitAndNavigate('/dashboard/home');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.message || "Something went wrong");
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        triggerExitAndNavigate('/dashboard/home');
    };

    return (
        <div className={`student-details-container ${isExiting ? 'exiting' : ''} ${isEntering ? 'entering' : ''}`}>
            {/* Decorative Background */}
            <div className="sd-bg-decor" aria-hidden="true">
                <svg
                    className="sd-bg-decor sd-decor-scales"
                    viewBox="0 0 200 200"
                    style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
                >
                    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="100" y1="30" x2="100" y2="170" />
                        <line x1="70" y1="170" x2="130" y2="170" />
                        <line x1="40" y1="60" x2="160" y2="60" />
                        <path d="M 20 60 Q 40 110 60 60 Z" />
                        <path d="M 140 60 Q 160 110 180 60 Z" />
                        <circle cx="100" cy="30" r="5" fill="currentColor" />
                    </g>
                </svg>

                <svg
                    className="sd-bg-decor sd-decor-book"
                    viewBox="0 0 200 200"
                    style={{ transform: `translate(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px)` }}
                >
                    <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M30 40 L100 60 L170 40 L170 170 L100 190 L30 170 Z" />
                        <line x1="100" y1="60" x2="100" y2="190" />
                        <line x1="50" y1="80" x2="85" y2="90" />
                        <line x1="50" y1="100" x2="85" y2="110" />
                        <line x1="50" y1="120" x2="85" y2="130" />
                        <line x1="115" y1="90" x2="150" y2="80" />
                        <line x1="115" y1="110" x2="150" y2="100" />
                        <line x1="115" y1="130" x2="150" y2="120" />
                    </g>
                </svg>

                <svg
                    className="sd-bg-decor sd-decor-cap"
                    viewBox="0 0 200 200"
                    style={{ transform: `translate(${mousePos.x * 0.7}px, ${mousePos.y * 0.7}px)` }}
                >
                    <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 90 L100 60 L180 90 L100 120 Z" />
                        <path d="M50 105 L50 140 Q100 170 150 140 L150 105" />
                        <line x1="180" y1="90" x2="180" y2="140" />
                        <circle cx="180" cy="148" r="6" />
                    </g>
                </svg>

                <svg
                    className="sd-bg-decor sd-decor-pen"
                    viewBox="0 0 200 200"
                    style={{ transform: `translate(${mousePos.x * -0.4}px, ${mousePos.y * -0.4}px) rotate(-35deg)` }}
                >
                    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M40 160 L60 140 L160 40 L180 60 L80 160 L60 180 Z" />
                        <line x1="140" y1="60" x2="160" y2="80" />
                        <path d="M40 160 L30 180 L50 170" />
                    </g>
                </svg>

                <div className="sd-particles">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <span
                            key={i}
                            className="sd-particle"
                            style={{
                                left: `${(i * 47) % 100}%`,
                                animationDelay: `${(i * 0.5) % 8}s`,
                                animationDuration: `${10 + (i % 6)}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Card */}
            <div className="sd-card">
                {/* Header */}
                <div className="sd-card-header anim-slide-down">
                    <span className="sd-emoji">😎</span>
                    <h1 className="sd-title">Hey future lawyer!</h1>
                </div>

                <p className="sd-description anim-fade-in" style={{ animationDelay: '0.15s' }}>
                    Could you help us by telling us the name of your{' '}
                    <span className="sd-highlight">college</span> and which{' '}
                    <span className="sd-highlight">year</span> you are in?
                </p>

                {/* College input */}
                <div className="sd-field anim-fade-up" style={{ animationDelay: '0.3s' }}>
                    <label className="sd-label">I am in</label>
                    <div className="sd-input-wrap">
                        <input
                            type="text"
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            placeholder="Please type the name of your college here"
                            className="sd-input"
                            disabled={isLoading}
                        />
                        <span className="sd-input-glow" />
                    </div>
                </div>

                {/* Year selection */}
                <div className="sd-field anim-fade-up" style={{ animationDelay: '0.45s' }}>
                    <label className="sd-label">And I'm in the year</label>
                    <div className="sd-year-list">
                        {years.map((year, idx) => (
                            <div
                                key={year.id}
                                className={`sd-year-option ${selectedYear === year.id ? 'selected' : ''}`}
                                onClick={() => setSelectedYear(year.id)}
                                style={{ animationDelay: `${0.5 + idx * 0.07}s` }}
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && setSelectedYear(year.id)}
                            >
                                <span className="sd-radio">
                                    <span className="sd-radio-dot" />
                                </span>
                                <span className="sd-year-label">{year.label}</span>
                                <span className="sd-year-ripple" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="sd-card-footer anim-fade-up" style={{ animationDelay: '0.85s' }}>
                    <button
                        onClick={handleSkip}
                        className="sd-skip-btn"
                        disabled={isLoading}
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!college.trim() || !selectedYear || isLoading}
                        className="sd-submit-btn"
                    >
                        {isLoading ? (
                            <>
                                <svg className="sd-spinner" viewBox="0 0 50 50">
                                    <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            'Submit'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentDetails;

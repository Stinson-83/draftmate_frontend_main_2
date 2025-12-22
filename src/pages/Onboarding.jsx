import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    ChevronLeft,
    User,
    Briefcase,
    Building2,
    Search,
    FileText,
    FileSearch,
    Sparkles,
    Scale,
    GraduationCap,
    AlertCircle
} from 'lucide-react';
import './Onboarding.css'; // Keep for resets
import JudgeCharacter from '../components/JudgeCharacter';

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isJudgeAngry, setIsJudgeAngry] = useState(false);
    const [shake, setShake] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        jobRole: '',
        workplace: '',
        usage: []
    });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const totalSteps = 4;

    const handleNext = () => {
        const error = validateStep();
        if (error) {
            triggerError(error);
            return;
        }

        setDirection(1);
        setErrorMsg('');
        if (step === totalSteps) {
            handleComplete();
        } else {
            setStep(prev => prev + 1);
        }
    };

    const triggerError = (msg) => {
        setIsJudgeAngry(true);
        setShake(true);
        setErrorMsg(msg);
        setTimeout(() => {
            setIsJudgeAngry(false);
            setShake(false);
        }, 600);
    };

    const handleBack = () => {
        setDirection(-1);
        setStep(prev => prev - 1);
        setErrorMsg('');
        if (isJudgeAngry) setIsJudgeAngry(false);
    };

    const handleComplete = () => {
        const profile = {
            name: formData.name,
            role: formData.jobRole,
            workplace: formData.workplace,
            usage: formData.usage.join(', '),
            image: null
        };
        localStorage.setItem('user_profile', JSON.stringify(profile));
        navigate('/');
    };

    const validateStep = () => {
        switch (step) {
            case 1:
                return formData.name.trim().length > 0 ? null : "Please enter your name.";
            case 2:
                return formData.jobRole.trim().length > 0 ? null : "Please select your profession.";
            case 3:
                return formData.workplace.trim().length > 0 ? null : "Please enter your workplace.";
            case 4:
                return formData.usage.length > 0 ? null : "Please select at least one objective.";
            default: return "Unknown error";
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (isJudgeAngry) setIsJudgeAngry(false);
        if (errorMsg) setErrorMsg('');
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 20 : -20,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 20 : -20,
            opacity: 0,
        })
    };

    // INLINE STYLES TO FORCE DESIGN CHANGES
    const pageStyle = {
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(at 0% 0%, #ec4899 0, transparent 50%), radial-gradient(at 100% 0%, #6366f1 0, transparent 50%), radial-gradient(at 100% 100%, #3b82f6 0, transparent 50%), #4338ca',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        padding: '2rem',
        position: 'relative'
    };

    const containerStyle = {
        display: 'flex',
        width: '100%',
        maxWidth: '1100px',
        height: '650px',
        background: '#FFFFFF',
        borderRadius: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
    };

    return (
        <div style={pageStyle}>
            <motion.div
                style={containerStyle}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >

                {/* LEFT SIDE: The Judge */}
                <div className="judge-section" style={{ flex: 0.9, background: '#fff', position: 'relative', borderRight: '1px solid #f1f5f9' }}>
                    <JudgeCharacter
                        mousePos={mousePos}
                        isAngry={isJudgeAngry}
                    />
                </div>

                {/* RIGHT SIDE: Form - DIRECT LAYOUT NO CARDS */}
                <div className="login-section" style={{ flex: 1.1, padding: '3rem 4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fff', position: 'relative' }}>

                    {/* Decorative Top Line */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)' }} />

                    {/* Progress Bar */}
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>

                    <motion.div
                        style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}
                        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                        <AnimatePresence initial={false} custom={direction} mode='wait'>
                            {/* STEP 1: NAME */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="step-title">Welcome to DraftMate</h2>
                                    <p className="step-subtitle">Let's verify your identity for the record.</p>

                                    <div className="field-group">
                                        <User size={20} className="field-icon" />
                                        <input
                                            type="text"
                                            className={`clean-input ${errorMsg ? 'input-error' : ''}`}
                                            placeholder="Full Name"
                                            value={formData.name}
                                            onChange={e => updateField('name', e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleNext()}
                                            autoFocus
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: ROLE */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="step-title">Your Profession</h2>
                                    <p className="step-subtitle">State your current occupation.</p>

                                    <div className="options-list grid-2">
                                        {[
                                            { id: 'Lawyer', icon: Scale },
                                            { id: 'Student', icon: GraduationCap },
                                            { id: 'Paralegal', icon: FileText },
                                            { id: 'Other', icon: User }
                                        ].map(({ id, icon: Icon }) => (
                                            <div
                                                key={id}
                                                className={`option-card ${formData.jobRole === id ? 'selected' : ''}`}
                                                onClick={() => updateField('jobRole', id)}
                                            >
                                                <Icon size={24} className={formData.jobRole === id ? 'text-primary' : 'text-secondary'} />
                                                <span className="option-label">{id}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: WORKPLACE */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="step-title">Affiliation</h2>
                                    <p className="step-subtitle">
                                        {formData.jobRole === 'Student'
                                            ? 'Name of your educational institution?'
                                            : 'Name of your firm or organization?'}
                                    </p>

                                    <div className="field-group">
                                        {formData.jobRole === 'Student' ? (
                                            <Building2 size={20} className="field-icon" />
                                        ) : (
                                            <Briefcase size={20} className="field-icon" />
                                        )}
                                        <input
                                            type="text"
                                            className={`clean-input ${errorMsg ? 'input-error' : ''}`}
                                            placeholder={formData.jobRole === 'Student' ? "University / College" : "Firm / Company Name"}
                                            value={formData.workplace}
                                            onChange={e => updateField('workplace', e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleNext()}
                                            autoFocus
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: GOALS */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="step-title">Objectives</h2>
                                    <p className="step-subtitle">Select your intended usage goals.</p>

                                    <div className="options-list grid-2">
                                        {[
                                            { id: 'Legal Research', icon: Search },
                                            { id: 'Drafting', icon: FileText },
                                            { id: 'Draft Review', icon: FileSearch },
                                            { id: 'Enhancing Drafts', icon: Sparkles }
                                        ].map(({ id, icon: Icon }) => {
                                            const isSelected = formData.usage.includes(id);
                                            return (
                                                <div
                                                    key={id}
                                                    className={`option-card ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        const current = formData.usage;
                                                        const next = current.includes(id)
                                                            ? current.filter(i => i !== id)
                                                            : [...current, id];
                                                        updateField('usage', next);
                                                    }}
                                                >
                                                    <Icon size={24} className={isSelected ? 'text-primary' : 'text-secondary'} />
                                                    <span className="option-label">{id}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="error-message"
                                style={{
                                    color: '#EF4444',
                                    marginTop: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.9rem',
                                    fontWeight: '500'
                                }}
                            >
                                <AlertCircle size={16} />
                                {errorMsg}
                            </motion.div>
                        )}

                        <div className="nav-footer">
                            <button
                                className="back-btn"
                                onClick={handleBack}
                                style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
                            >
                                <ChevronLeft size={16} /> Back
                            </button>

                            <button className="next-btn" onClick={handleNext}>
                                {step === totalSteps ? 'Complete Profile' : 'Continue'} <ChevronRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Onboarding;

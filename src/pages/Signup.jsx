import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import logo from '../assets/draftmate_logo.png';
import { API_CONFIG } from '../services/endpoints';

const readJsonSafely = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const text = await response.text();
        return text ? { detail: text } : {};
    }

    const text = await response.text();
    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return { detail: text };
    }
};

const Signup = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validation states
    const [emailValid, setEmailValid] = useState(null);
    const [passwordValid, setPasswordValid] = useState(null);
    const [confirmValid, setConfirmValid] = useState(null);

    // Typing states
    const [emailTyping, setEmailTyping] = useState(false);
    const [passwordTyping, setPasswordTyping] = useState(false);
    const [confirmTyping, setConfirmTyping] = useState(false);

    // Focus states
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmFocused, setConfirmFocused] = useState(false);

    // Animation states
    const [shake, setShake] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [ripples, setRipples] = useState([]);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [cursorVisible, setCursorVisible] = useState(false);
    const rightPanelRef = useRef(null);
    const textRef = useRef(null);

    // Typing timers
    const emailTimer = useRef(null);
    const passwordTimer = useRef(null);
    const confirmTimer = useRef(null);

    useEffect(() => {
        setTimeout(() => setMounted(true), 80);
    }, []);

    // Mouse tracking for right panel spotlight
    useEffect(() => {
        const panel = rightPanelRef.current;
        if (!panel) return;
        const handleMove = (e) => {
            const rect = panel.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            setCursorVisible(true);
        };
        const handleLeave = () => setCursorVisible(false);
        panel.addEventListener('mousemove', handleMove);
        panel.addEventListener('mouseleave', handleLeave);
        return () => {
            panel.removeEventListener('mousemove', handleMove);
            panel.removeEventListener('mouseleave', handleLeave);
        };
    }, []);

    const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    const handleEmailChange = (e) => {
        const v = e.target.value;
        setEmail(v);
        setEmailTyping(true);
        setEmailValid(null);
        clearTimeout(emailTimer.current);
        emailTimer.current = setTimeout(() => {
            setEmailTyping(false);
            if (v.length > 0) setEmailValid(validateEmail(v));
        }, 600);
    };

    const handlePasswordChange = (e) => {
        const v = e.target.value;
        setPassword(v);
        setPasswordTyping(true);
        setPasswordValid(null);
        clearTimeout(passwordTimer.current);
        passwordTimer.current = setTimeout(() => {
            setPasswordTyping(false);
            if (v.length > 0) setPasswordValid(v.length >= 6);
        }, 600);
        // Re-check confirm
        if (confirmPassword.length > 0) setConfirmValid(v === confirmPassword);
    };

    const handleConfirmChange = (e) => {
        const v = e.target.value;
        setConfirmPassword(v);
        setConfirmTyping(true);
        setConfirmValid(null);
        clearTimeout(confirmTimer.current);
        confirmTimer.current = setTimeout(() => {
            setConfirmTyping(false);
            if (v.length > 0) setConfirmValid(v === password);
        }, 600);
    };

    const addRipple = (e) => {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const id = Date.now();
        setRipples(prev => [...prev, {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            id
        }]);
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 900);
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 600);
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setEmailValid(false); triggerShake();
            toast.error("Please enter a valid email address");
            return;
        }
        if (password.length < 6) {
            setPasswordValid(false); triggerShake();
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (password !== confirmPassword) {
            setConfirmValid(false); triggerShake();
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading("Creating your account...");
        try {
            const registerUrl = `${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.REGISTER}`;
            const response = await fetch(registerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Registration failed');

            const loginUrl = `${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.LOGIN}`;
            const loginResponse = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const loginData = await loginResponse.json();
            if (loginResponse.ok) {
                localStorage.setItem('session_id', loginData.session_id);
                localStorage.setItem('user_id', loginData.user_id);
                localStorage.setItem('user_profile', JSON.stringify({
                    email, id: loginData.user_id, isNewUser: true
                }));
            }
            toast.dismiss(loadingToast);
            toast.success("Account created! Let's complete your profile.");
            navigate('/onboarding');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.message);
            triggerShake();
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            const loadingToast = toast.loading("Signing up with Google...");
            try {
                const googleLoginUrl = `${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.GOOGLE_LOGIN}`;
                const response = await fetch(googleLoginUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenResponse.credential || tokenResponse.access_token }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail || 'Google Signup failed');
                localStorage.setItem('session_id', data.session_id);
                localStorage.setItem('user_id', data.user_id);
                
                let profileData = {};
                if (data.profile && Object.keys(data.profile).length > 0) {
                    profileData = {
                        ...data.profile,
                        id: data.user_id,
                        email: data.email,
                        google: true
                    };
                } else {
                    profileData = {
                        id: data.user_id,
                        email: data.email,
                        name: data.name,
                        image: data.picture,
                        firstName: data.name ? data.name.split(' ')[0] : '',
                        lastName: data.name ? data.name.split(' ').slice(1).join(' ') : '',
                        google: true
                    };
                }
                localStorage.setItem('user_profile', JSON.stringify(profileData));
                toast.dismiss(loadingToast);
                toast.success("Welcome to DraftMate!");
                navigate('/onboarding');
            } catch (error) {
                toast.dismiss(loadingToast);
                toast.error(error.message || "Google Signup failed");
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => toast.error("Google Sign In Failed"),
    });

    // Password strength
    const getStrength = (p) => {
        if (p.length === 0) return 0;
        if (p.length < 6) return 1;
        if (p.length < 10) return 2;
        if (p.length < 12) return 3;
        return 4;
    };
    const strengthLabels = ['', '≡ƒö┤ Too short', '≡ƒƒá Fair', '≡ƒƒí Good', '≡ƒƒó Strong'];
    const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#10b981'];

    const getInputClasses = (valid, focused, typing) => {
        if (typing) return 'border-blue-400 ring-2 ring-blue-300/30 bg-blue-50/20 dark:bg-blue-900/10';
        if (valid === true) return 'border-emerald-500 ring-2 ring-emerald-400/20 bg-emerald-50/20 dark:bg-emerald-900/10';
        if (valid === false) return 'border-red-500 ring-2 ring-red-400/20 bg-red-50/20 dark:bg-red-900/10';
        if (focused) return 'border-blue-500 ring-2 ring-blue-400/20';
        return 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800';
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 font-sans antialiased text-slate-900 dark:text-white h-screen overflow-hidden flex">
            <style>{`
                /* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ KEYFRAMES ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */
                @keyframes fadeSlideLeft {
                    from { opacity: 0; transform: translateX(-36px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.86); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes shake {
                    0%,100% { transform: translateX(0); }
                    15%  { transform: translateX(-8px) rotate(-0.8deg); }
                    30%  { transform: translateX(8px)  rotate(0.8deg); }
                    45%  { transform: translateX(-5px); }
                    60%  { transform: translateX(5px); }
                    75%  { transform: translateX(-3px); }
                    90%  { transform: translateX(3px); }
                }
                @keyframes successPop {
                    0%   { transform: scale(0) rotate(-25deg); opacity: 0; }
                    65%  { transform: scale(1.3)  rotate(6deg);  opacity: 1; }
                    100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
                }
                @keyframes errorWiggle {
                    0%,100% { transform: rotate(0)   scale(1); }
                    20%  { transform: rotate(-18deg) scale(1.25); }
                    40%  { transform: rotate(18deg)  scale(1.25); }
                    60%  { transform: rotate(-10deg); }
                    80%  { transform: rotate(10deg); }
                }
                @keyframes checkDraw {
                    from { stroke-dashoffset: 50; }
                    to   { stroke-dashoffset: 0; }
                }
                @keyframes crossDraw {
                    from { stroke-dashoffset: 30; }
                    to   { stroke-dashoffset: 0; }
                }
                @keyframes typingPulse {
                    0%,100% { box-shadow: 0 0 0 0   rgba(59,130,246,0.35); }
                    50%     { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
                }
                @keyframes validPulse {
                    0%,100% { box-shadow: 0 0 0 0   rgba(16,185,129,0.4); }
                    50%     { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
                }
                @keyframes invalidPulse {
                    0%,100% { box-shadow: 0 0 0 0   rgba(239,68,68,0.4); }
                    50%     { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
                }
                @keyframes shimmerSlide {
                    0%   { transform: translateX(-120%); }
                    100% { transform: translateX(220%); }
                }
                @keyframes strengthGrow {
                    from { width: 0%; }
                }
                @keyframes rippleOut {
                    from { transform: scale(0); opacity: 0.55; }
                    to   { transform: scale(4.5); opacity: 0; }
                }
                @keyframes kenBurns {
                    0%   { transform: scale(1)    translateX(0)    translateY(0); }
                    33%  { transform: scale(1.07) translateX(-1%)  translateY(-1.5%); }
                    66%  { transform: scale(1.04) translateX(1.5%) translateY(0.5%); }
                    100% { transform: scale(1)    translateX(0)    translateY(0); }
                }
                @keyframes scanLine {
                    0%   { top: -3px; }
                    100% { top: 102%; }
                }
                @keyframes overlayPulse {
                    0%,100% { opacity: 0.82; }
                    50%     { opacity: 0.68; }
                }
                @keyframes floatLogo {
                    0%,100% { transform: translateY(0px)   rotate(0deg); }
                    30%     { transform: translateY(-14px)  rotate(3deg); }
                    70%     { transform: translateY(-7px)  rotate(-2deg); }
                }
                @keyframes glowOrb {
                    0%,100% { opacity: 0.45; transform: scale(1); }
                    50%     { opacity: 0.85; transform: scale(1.1); }
                }
                @keyframes particleRise {
                    0%   { transform: translateY(110vh) rotate(0deg) scale(0.4); opacity: 0; }
                    8%   { opacity: 0.7; }
                    92%  { opacity: 0.7; }
                    100% { transform: translateY(-10vh)  rotate(720deg) scale(1.3); opacity: 0; }
                }
                @keyframes gradientShift {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes textReveal {
                    from { opacity: 0; transform: translateY(16px); filter: blur(4px); }
                    to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
                }
                @keyframes cursorBlink {
                    0%,100% { opacity: 1; }
                    50%     { opacity: 0; }
                }
                @keyframes underlineGrow {
                    from { width: 0%; }
                    to   { width: 100%; }
                }
                @keyframes logoSpin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes countIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes spotlightMove {
                    0%   { opacity: 0; }
                    100% { opacity: 1; }
                }
                @keyframes wordPop {
                    0%   { opacity: 0; transform: translateY(12px) scale(0.9); }
                    100% { opacity: 1; transform: translateY(0)    scale(1); }
                }

                /* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ UTILITY ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */
                .anim-fade-left  { animation: fadeSlideLeft 0.65s ease-out forwards; opacity: 0; }
                .anim-fade-up    { animation: fadeUp        0.65s ease-out forwards; opacity: 0; }
                .anim-scale-in   { animation: scaleIn       0.55s ease-out forwards; opacity: 0; }
                .anim-shake      { animation: shake         0.6s  ease-in-out; }

                /* Input states */
                .state-typing  { animation: typingPulse  1s ease-in-out infinite; }
                .state-valid   { animation: validPulse   1.4s ease-in-out 1; }
                .state-invalid { animation: invalidPulse 0.8s ease-in-out 2; }

                /* Input base */
                .inp {
                    transition: border-color 0.3s ease, box-shadow 0.3s ease,
                                background-color 0.3s ease, transform 0.2s ease;
                }
                .inp:focus { transform: translateY(-1px); }

                /* Shimmer on focused inputs */
                .inp-shimmer { position: relative; overflow: hidden; }
                .inp-shimmer::after {
                    content: '';
                    position: absolute; inset: 0;
                    background: linear-gradient(90deg,
                        transparent 0%, rgba(255,255,255,0.09) 50%, transparent 100%);
                    animation: shimmerSlide 2.2s ease-in-out infinite;
                    pointer-events: none;
                    border-radius: inherit;
                }

                /* Ripple */
                .ripple {
                    position: absolute; border-radius: 50%;
                    background: rgba(255,255,255,0.38);
                    width: 70px; height: 70px;
                    margin-left: -35px; margin-top: -35px;
                    animation: rippleOut 0.9s linear forwards;
                    pointer-events: none;
                }

                /* Buttons */
                .btn-primary {
                    position: relative; overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
                }
                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 14px 30px rgba(37,99,235,0.38), 0 4px 10px rgba(37,99,235,0.22);
                }
                .btn-primary:active:not(:disabled) { transform: translateY(0) scale(0.98); }
                .btn-primary::after {
                    content: '';
                    position: absolute; inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
                    transform: translateX(-120%);
                    transition: transform 0.55s ease;
                }
                .btn-primary:hover::after { transform: translateX(120%); }

                .btn-google {
                    position: relative; overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
                }
                .btn-google:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 22px rgba(0,0,0,0.13);
                }
                .btn-google::after {
                    content: '';
                    position: absolute; inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transform: translateX(-120%);
                    transition: transform 0.55s ease;
                }
                .btn-google:hover::after { transform: translateX(120%); }

                /* Icon badge */
                .icon-float { animation: floatLogo 5s ease-in-out infinite; }
                .icon-float:hover { animation: logoSpin 0.8s ease-in-out, floatLogo 5s ease-in-out infinite 0.8s; }

                /* Right panel */
                .img-ken    { animation: kenBurns 20s ease-in-out infinite; }
                .scan-line  { animation: scanLine 4.5s linear infinite; }
                .overlay-p  { animation: overlayPulse 9s ease-in-out infinite; }
                .particle   { animation: particleRise linear infinite; }
                .glow-orb   { animation: glowOrb 4s ease-in-out infinite; }
                .gradient-a {
                    background: linear-gradient(135deg, #1d4ed8, #4f46e5, #7c3aed, #be185d, #1d4ed8);
                    background-size: 400% 400%;
                    animation: gradientShift 11s ease infinite;
                }
                .hover-lift {
                    transition: all 0.3s ease;
                }
                .hover-lift:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                /* Word-by-word text animation */
                .word-pop {
                    display: inline-block;
                    opacity: 0;
                    animation: wordPop 0.5s ease-out forwards;
                }
                /* Cursor blink */
                .cursor-blink {
                    display: inline-block;
                    width: 2px; height: 1em;
                    background: currentColor;
                    animation: cursorBlink 1s step-end infinite;
                    vertical-align: middle; margin-left: 2px;
                }
                /* Underline pointer animation on text */
                .fancy-underline {
                    position: relative; display: inline-block;
                }
                .fancy-underline::after {
                    content: '';
                    position: absolute; bottom: -3px; left: 0;
                    height: 2px; width: 0%;
                    background: linear-gradient(90deg, #60a5fa, #a78bfa);
                    border-radius: 2px;
                    transition: width 0.5s ease;
                }
                .fancy-underline:hover::after { width: 100%; }

                /* Count-in */
                .count-in { animation: countIn 0.25s ease-out forwards; }
                
                /* Strength bar */
                .str-bar { animation: strengthGrow 0.4s ease-out forwards; }

                /* Logo glow blob */
                .glow-blob {
                    position: absolute; border-radius: 50%;
                    filter: blur(60px); pointer-events: none;
                }
            `}</style>

            {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ LEFT PANEL ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
            <div className="w-full lg:w-1/2 h-full flex flex-col bg-white dark:bg-slate-900 relative overflow-y-auto z-10 transition-colors duration-300">

                {/* Background glow blobs */}
                <div className="glow-blob w-72 h-72 bg-blue-400/10 glow-orb"
                    style={{ top: '-80px', left: '-80px', animationDelay: '0s' }} />
                <div className="glow-blob w-56 h-56 bg-purple-400/10 glow-orb"
                    style={{ bottom: '-60px', right: '-60px', animationDelay: '2s' }} />
                <div className="glow-blob w-40 h-40 bg-pink-400/8 glow-orb"
                    style={{ top: '40%', right: '10%', animationDelay: '1s' }} />

                            {/* Main Content - Logo + Form */}
            <div className="flex-1 flex flex-col justify-center px-8 lg:px-24 xl:px-32 py-12">
                <div className="max-w-md w-full mx-auto space-y-8">
                    
                    {/* Logo at top of form block */}
                    <div className="anim-fade-left" style={{ animationDelay: '0s' }}>
                        <Link to="/" className="flex items-center gap-3 w-fit group">
                            <div className="relative">
                                <img
                                    src={logo}
                                    alt="DraftMate"
                                    className="w-9 h-9 object-contain relative z-10 drop-shadow-lg"
                                />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">
                                DraftMate
                            </span>
                        </Link>
                    </div>

                    {/* Heading */}
                    <div className="space-y-2">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight anim-fade-left" style={{ animationDelay: '0.1s' }}>
                            Create an Account
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm anim-fade-left" style={{ animationDelay: '0.18s' }}>
                            Start your 14-day free trial. No credit card required.
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-5" onSubmit={handleSignup}></form>

                        <form className="space-y-5" onSubmit={handleSignup}>

                            {/* ΓöÇΓöÇ EMAIL ΓöÇΓöÇ */}
                            <div
                                className="flex flex-col gap-1.5 anim-fade-up"
                                style={{ animationDelay: '0.22s' }}
                            >
                                <label className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-2">
                                    Email
                                    {emailTyping && <SpinIcon />}
                                    {!emailTyping && emailValid === true && <SuccessIcon />}
                                    {!emailTyping && emailValid === false && <ErrorIcon />}
                                </label>
                                <div className={`relative ${emailFocused ? 'inp-shimmer' : ''}`}>
                                    <input
                                        className={`inp w-full rounded-xl border h-14 px-4 pr-12
                                            text-slate-900 dark:text-white text-base
                                            placeholder:text-slate-400 dark:placeholder:text-slate-500
                                            focus:outline-none
                                            ${getInputClasses(emailValid, emailFocused, emailTyping)}
                                            ${emailTyping ? 'state-typing' : ''}
                                            ${!emailTyping && emailValid === true ? 'state-valid' : ''}
                                            ${!emailTyping && emailValid === false ? 'state-invalid' : ''}
                                        `}
                                        placeholder="attorney@lawfirm.com"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={handleEmailChange}
                                        onFocus={() => setEmailFocused(true)}
                                        onBlur={() => {
                                            setEmailFocused(false);
                                            if (email.length > 0) setEmailValid(validateEmail(email));
                                        }}
                                    />
                                    {/* Mail icon */}
                                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300
                                        ${emailFocused ? 'text-blue-500 scale-110' : 'text-slate-300'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                    </div>
                                    {/* Focus accent line */}
                                    <AccentLine show={emailFocused} valid={emailValid} />
                                </div>
                                <SlideMessage show={emailValid === false} color="red">
                                    Please enter a valid email address
                                </SlideMessage>
                            </div>

                            {/* ΓöÇΓöÇ PASSWORD ΓöÇΓöÇ */}
                            <div
                                className="flex flex-col gap-1.5 anim-fade-up"
                                style={{ animationDelay: '0.3s' }}
                            >
                                <label className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-2">
                                    Password
                                    {passwordTyping && <SpinIcon />}
                                    {!passwordTyping && passwordValid === true && <SuccessIcon />}
                                    {!passwordTyping && passwordValid === false && <ErrorIcon />}
                                </label>
                                <div className={`relative ${passwordFocused ? 'inp-shimmer' : ''}`}>
                                    <input
                                        className={`inp w-full rounded-xl border h-14 pl-4 pr-14
                                            text-slate-900 dark:text-white text-base
                                            placeholder:text-slate-400 dark:placeholder:text-slate-500
                                            focus:outline-none
                                            ${getInputClasses(passwordValid, passwordFocused, passwordTyping)}
                                            ${passwordTyping ? 'state-typing' : ''}
                                            ${!passwordTyping && passwordValid === true ? 'state-valid' : ''}
                                            ${!passwordTyping && passwordValid === false ? 'state-invalid' : ''}
                                        `}
                                        placeholder="ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={handlePasswordChange}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => {
                                            setPasswordFocused(false);
                                            if (password.length > 0) setPasswordValid(password.length >= 6);
                                        }}
                                    />
                                    <AccentLine show={passwordFocused} valid={passwordValid} />
                                    <button type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-0 bottom-0 pr-4 flex items-center justify-center
                                            text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                                            transition-all duration-300 hover:scale-110 z-10">
                                        <span className="material-symbols-outlined text-[22px]">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>

                                {/* Strength meter */}
                                {password.length > 0 && (
                                    <div className="space-y-1 count-in">
                                        <div className="flex gap-1 h-1.5">
                                            {[1, 2, 3, 4].map(lvl => {
                                                const s = getStrength(password);
                                                return (
                                                    <div key={lvl}
                                                        className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                        {lvl <= s && (
                                                            <div className="h-full rounded-full str-bar"
                                                                style={{
                                                                    background: strengthColors[s],
                                                                    animationDuration: `${0.3 + lvl * 0.08}s`
                                                                }} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs count-in"
                                            style={{ color: strengthColors[getStrength(password)] }}>
                                            {strengthLabels[getStrength(password)]}
                                        </p>
                                    </div>
                                )}
                                <SlideMessage show={passwordValid === false} color="red">
                                    Password must be at least 6 characters
                                </SlideMessage>
                            </div>

                            {/* ΓöÇΓöÇ CONFIRM PASSWORD ΓöÇΓöÇ */}
                            <div
                                className="flex flex-col gap-1.5 anim-fade-up"
                                style={{ animationDelay: '0.38s' }}
                            >
                                <label className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-2">
                                    Confirm Password
                                    {confirmTyping && <SpinIcon />}
                                    {!confirmTyping && confirmValid === true && <SuccessIcon />}
                                    {!confirmTyping && confirmValid === false && <ErrorIcon />}
                                </label>
                                <div className={`relative ${confirmFocused ? 'inp-shimmer' : ''}`}>
                                    <input
                                        className={`inp w-full rounded-xl border h-14 pl-4 pr-14
                                            text-slate-900 dark:text-white text-base
                                            placeholder:text-slate-400 dark:placeholder:text-slate-500
                                            focus:outline-none
                                            ${getInputClasses(confirmValid, confirmFocused, confirmTyping)}
                                            ${confirmTyping ? 'state-typing' : ''}
                                            ${!confirmTyping && confirmValid === true ? 'state-valid' : ''}
                                            ${!confirmTyping && confirmValid === false ? 'state-invalid' : ''}
                                        `}
                                        placeholder="ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={handleConfirmChange}
                                        onFocus={() => setConfirmFocused(true)}
                                        onBlur={() => {
                                            setConfirmFocused(false);
                                            if (confirmPassword.length > 0) setConfirmValid(confirmPassword === password);
                                        }}
                                    />
                                    <AccentLine show={confirmFocused} valid={confirmValid} />
                                    <button type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-0 top-0 bottom-0 pr-4 flex items-center justify-center
                                            text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                                            transition-all duration-300 hover:scale-110 z-10">
                                        <span className="material-symbols-outlined text-[22px]">
                                            {showConfirmPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                                <SlideMessage show={confirmValid === false} color="red">
                                    Passwords do not match
                                </SlideMessage>
                                <SlideMessage show={confirmValid === true && confirmPassword.length > 0} color="green">
                                    Γ£ô Passwords match
                                </SlideMessage>
                            </div>

                            {/* Sign Up Button */}
                            <button
                                disabled={isLoading}
                                onMouseDown={addRipple}
                                className="btn-primary w-full bg-blue-600 hover:bg-blue-700 text-white
                                    h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2
                                    disabled:opacity-70 disabled:cursor-not-allowed anim-scale-in"
                                style={{ animationDelay: '0.46s' }}
                            >
                                {ripples.map(r => (
                                    <span key={r.id} className="ripple"
                                        style={{ left: r.x, top: r.y }} />
                                ))}
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10"
                                                stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Sign Up
                                        <span className="material-symbols-outlined text-[20px]
                                            group-hover:translate-x-1 transition-transform">
                                            arrow_forward
                                        </span>
                                    </>
                                )}
                            </button>

                            {/* Login link */}
                            <div
                                className="text-center pt-1 anim-fade-up"
                                style={{ animationDelay: '0.52s' }}
                            >
                                <span className="text-slate-500 dark:text-slate-400 text-sm">
                                    Already have an account?{' '}
                                </span>
                                <Link to="/login"
                                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold
                                        hover:underline transition-all">
                                    Log In
                                </Link>
                            </div>

                            {/* Divider */}
                            <div
                                className="relative flex py-1 items-center anim-fade-up"
                                style={{ animationDelay: '0.58s' }}
                            >
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium tracking-wide">
                                    Or continue with
                                </span>
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                            </div>

                            {/* Google Button */}
                            <button
                                onClick={() => googleLogin()}
                                type="button"
                                className="btn-google w-full bg-white dark:bg-slate-800
                                    hover:bg-slate-50 dark:hover:bg-slate-700
                                    border border-slate-200 dark:border-slate-700
                                    text-slate-700 dark:text-slate-200
                                    h-12 rounded-xl font-medium text-sm
                                    flex items-center justify-center gap-3 anim-scale-in"
                                style={{ animationDelay: '0.64s' }}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign up with Google
                            </button>
                        </form>

                        {/* Terms */}
                        <p
                            className="text-slate-400 text-xs text-center leading-relaxed anim-fade-up"
                            style={{ animationDelay: '0.7s' }}
                        >
                            By signing up, you agree to our{' '}
                            <a href="#" className="fancy-underline text-slate-500 hover:text-blue-600 transition-colors">
                                Terms of Service
                            </a>{' '}and{' '}
                            <a href="#" className="fancy-underline text-slate-500 hover:text-blue-600 transition-colors">
                                Privacy Policy
                            </a>.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 text-center">
                    <p className="text-slate-400 text-xs">┬⌐ 2024 DraftMate Inc. All rights reserved.</p>
                </div>
            </div>

            {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ RIGHT PANEL ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
            <div
                ref={rightPanelRef}
                className="hidden lg:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden"
            >
                {/* Scan line */}
                <div className="scan-line absolute left-0 right-0 h-0.5 z-30 pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)'
                    }} />

                {/* Gradient overlay */}
                <div className="absolute inset-0 gradient-a overlay-p mix-blend-multiply z-10" />

                {/* Vignette */}
                <div className="absolute inset-0 z-10 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)' }} />

                {/* Mouse spotlight */}
                {cursorVisible && (
                    <div className="absolute z-20 pointer-events-none rounded-full"
                        style={{
                            width: 280, height: 280,
                            left: mousePos.x - 140, top: mousePos.y - 140,
                            background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
                            transition: 'left 0.05s, top 0.05s',
                        }} />
                )}

                {/* Particles */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {[...Array(14)].map((_, i) => (
                        <div key={i} className="particle absolute rounded-full"
                            style={{
                                width: [6, 8, 10, 5, 12, 7, 9, 6, 11, 8, 6, 10, 7, 9][i],
                                height: [6, 8, 10, 5, 12, 7, 9, 6, 11, 8, 6, 10, 7, 9][i],
                                left: `${(i * 7.3) % 100}%`,
                                background: i % 3 === 0 ? 'rgba(255,255,255,0.55)'
                                    : i % 3 === 1 ? 'rgba(147,197,253,0.65)'
                                        : 'rgba(216,180,254,0.55)',
                                animationDelay: `${i * 1.1}s`,
                                animationDuration: `${13 + (i % 5) * 2.5}s`,
                                filter: 'blur(0.5px)',
                            }} />
                    ))}
                </div>

                {/* Ken Burns image */}
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        alt="Scales of justice"
                        className="img-ken absolute inset-0 w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9BpzvAdYdc52R7f6E07Ent3l2jeoEDSlU6cQyA0TAyaHwLFI_CQC_ugiIgFJ6CbZrcMHDN2838yW1UMRGpkoniNSyXmL6459xXyfmNMIIK4Z4Fjsimn-x0-9pnXHoXqU7EhrrQ9bE4ytXJzvi3LBnyMGSeKvPgTCQZZ9Z27lKQpM4HPUJFkG85ahT4msOI5kh7rWfkQBvLW6E53uxRJMyykPBDFOmgjdyO42vgPPzpdIEaIxbKIyxlW2Crckkax8WVftnuOzmT-8"
                    />
                </div>

                {/* Content */}
                <div className="relative z-30 max-w-lg px-12 text-center text-white" ref={textRef}>

                    {/* Floating logo */}
                    <Link to="/"
                        className="mb-8 inline-flex p-4 rounded-full bg-white/10 backdrop-blur-md
                            border border-white/20 shadow-2xl hover:bg-white/20 transition-colors
                            icon-float"
                    >
                        <img src={logo} alt="DraftMate" className="w-16 h-16 object-contain" />
                    </Link>

                    {/* Animated headline ΓÇö word by word */}
                    <h3 className="text-4xl font-bold mb-6 tracking-tight leading-tight">
                        {['Streamline', 'your', 'legal', 'practice'].map((word, i) => (
                            <span key={i} className="word-pop"
                                style={{ animationDelay: `${0.4 + i * 0.12}s`, marginRight: '0.28em' }}>
                                {word}
                            </span>
                        ))}
                    </h3>

                    {/* Animated paragraph ΓÇö word by word with pointer cursor effect */}
                    <p
                        className="text-slate-100 text-base leading-relaxed font-light mb-10 cursor-default select-none"
                        style={{ lineHeight: '1.75' }}
                    >
                        {`Join over 10,000 legal professionals who trust DraftMate for secure case management, research, and client collaboration.`
                            .split(' ')
                            .map((word, i) => (
                                <span
                                    key={i}
                                    className="word-pop fancy-underline inline-block mr-1
                                        hover:text-blue-200 transition-colors duration-200 cursor-pointer"
                                    style={{ animationDelay: `${0.85 + i * 0.045}s` }}
                                >
                                    {word}
                                </span>
                            ))}
                    </p>

                    {/* Trust indicators */}
                    <div className="flex items-center justify-center gap-6"
                        style={{ animation: 'fadeUp 0.7s ease-out 1.8s forwards', opacity: 0 }}>
                        <div className="flex flex-col items-center gap-2 hover-lift
                            p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10
                            cursor-pointer group">
                            <span className="material-symbols-outlined text-[28px] text-blue-300
                                group-hover:scale-110 transition-transform duration-300">
                                verified_user
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                                Bank-grade Security
                            </span>
                        </div>
                        <div className="w-px h-12 bg-white/20 rounded-full" />
                        <div className="flex flex-col items-center gap-2 hover-lift
                            p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10
                            cursor-pointer group">
                            <span className="material-symbols-outlined text-[28px] text-emerald-300
                                group-hover:scale-110 transition-transform duration-300">
                                cloud_done
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                                99.9% Uptime
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ΓöÇΓöÇ Small reusable animated components ΓöÇΓöÇ */

const SpinIcon = () => (
    <span className="inline-flex items-center justify-center w-5 h-5">
        <svg className="animate-spin w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    </span>
);

const SuccessIcon = () => (
    <span className="inline-flex items-center justify-center w-5 h-5"
        style={{ animation: 'successPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <circle cx="12" cy="12" r="11" fill="#10b981" />
            <path d="M6.5 12l4 4 7-7" stroke="white" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none"
                style={{
                    strokeDasharray: 50, strokeDashoffset: 50,
                    animation: 'checkDraw 0.4s ease-out 0.1s forwards'
                }} />
        </svg>
    </span>
);

const ErrorIcon = () => (
    <span className="inline-flex items-center justify-center w-5 h-5"
        style={{ animation: 'errorWiggle 0.5s ease-in-out forwards' }}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <circle cx="12" cy="12" r="11" fill="#ef4444" />
            <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"
                style={{
                    strokeDasharray: 30, strokeDashoffset: 30,
                    animation: 'crossDraw 0.3s ease-out forwards'
                }} />
        </svg>
    </span>
);

const AccentLine = ({ show, valid }) => (
    <div className="absolute bottom-0 h-0.5 rounded-full transition-all duration-500 ease-out"
        style={{
            width: show ? '100%' : '0%',
            left: 0,
            background: valid === false ? '#ef4444'
                : valid === true ? '#10b981'
                    : '#3b82f6',
        }} />
);

const SlideMessage = ({ show, color, children }) => (
    <div className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: show ? '28px' : '0px', opacity: show ? 1 : 0 }}>
        <p className={`text-xs flex items-center gap-1 ${color === 'red' ? 'text-red-500' : 'text-emerald-600'}`}
            style={{ animation: show ? 'countIn 0.25s ease-out forwards' : 'none' }}>
            {color === 'red' ? (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd" />
                </svg>
            ) : (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd" />
                </svg>
            )}
            {children}
        </p>
    </div>
);

export default Signup;

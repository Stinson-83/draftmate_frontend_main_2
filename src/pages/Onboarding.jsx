import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/draftmate_logo.png';

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        role: 'professional',
        firstName: '',
        lastName: '',
        workplace: '',
        designation: '',
        usage: []
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleSelect = (role) => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleUsageToggle = (option) => {
        setFormData(prev => {
            const usage = prev.usage.includes(option)
                ? prev.usage.filter(item => item !== option)
                : [...prev.usage, option];
            return { ...prev, usage };
        });
    };

    const handleContinue = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            // Finish onboarding - Save to localStorage for Dashboard/Settings
            const userProfile = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                role: formData.designation || (formData.role === 'professional' ? 'Legal Professional' : 'Law Student'),
                workplace: formData.workplace,
                usage: formData.usage,
                email: 'user@example.com', // Mock email
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCf79wuBAV_uurpxIHNj8aieGbEhEXhNnnRbN4i6y6PB0cDQAIRL9j87KI1_P114LVgr1D83UM0cCNfd5rdo7Lgoukm2J7UpdQlshSXI1k296RyvODHng12-_Tgx2DvQBf07mko3b0GUnUqoofVCNHdDorsXylCZ2ZYcheYqOrU1fK68F4Io3yKaBeUc1s9moLHx_8V9HmPO4qleggBYJCVjxMsWblqTXMqk29SbcNjAAARdb2_y7Y7m6e7d39-tfL7WBs3YUvm84U"
            };
            localStorage.setItem('user_profile', JSON.stringify(userProfile));
            window.dispatchEvent(new Event('user_profile_updated')); // Notify other components
            navigate('/dashboard/home');
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            navigate('/login');
        }
    };

    const usageOptions = [
        { id: 'drafting', icon: 'edit_document', label: 'Legal Drafting', desc: 'Contracts, notices, agreements' },
        { id: 'research', icon: 'library_books', label: 'Legal Research', desc: 'Case laws, statutes, precedents' },
        { id: 'analysis', icon: 'analytics', label: 'Document Analysis', desc: 'Review and summarize documents' },
        { id: 'management', icon: 'folder_open', label: 'Case Management', desc: 'Organize files and clients' },
        { id: 'compliance', icon: 'gavel', label: 'Compliance', desc: 'Regulatory checks and audits' }
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex h-screen overflow-hidden antialiased transition-colors duration-200">
            {/* Left Panel: Branding & Context */}
            <aside className="hidden lg:flex w-5/12 relative flex-col justify-between bg-slate-900 text-white overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-blue-600/80 z-10 mix-blend-multiply"></div>
                    <div className="w-full h-full bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDb2CRzdwCjgYV-YgFxXs0c9EyHTaII2XLWdFig24IWoNTtUrvlJ8iEZPqC5MEdXQotRvXZMKk358BJ7g6_RtCV-mkRVf1MD66Jlup6o-zNdQihZj_YDV0uECvP3RgluhQS0B0Tm1gbsPn8GwOIM326M9bqBX4qz8V3lfzA37oq39Z_mSSxqk-MPck87U2WhNLevJgNN5GhwQ_d9BXDjzlRj350e1cxoasNQPKTW-Nf1R_jKxQqhE8q9oNM9oWvLpDwfdit3t3DBvc")' }}></div>
                </div>

                {/* Content */}
                <div className="relative z-20 flex flex-col h-full justify-between p-12 lg:p-16">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-white border border-white/20">
                            <img src={logo} alt="DraftMate" className="w-full h-full object-contain p-1" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">DraftMate</h1>
                    </div>

                    {/* Quote */}
                    <div className="max-w-md">
                        <span className="material-symbols-outlined text-4xl text-blue-400/80 mb-4">format_quote</span>
                        <p className="text-xl md:text-2xl font-medium leading-relaxed mb-6 text-slate-100">
                            "Streamlining our practice management has never been easier. DraftMate allows us to focus on what matters most—our clients."
                        </p>
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-full bg-slate-700 bg-cover bg-center border-2 border-blue-600"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1wh3__wbJ26Y-fW35aiho512Jc600fmj4966iQj3xpZ1OKGejXqiP4smdQpqRHOaibwb-E-7oIXaRK3gg3TRz9X6V4sOzbLpFnsYqIw_gEKZRjQDPEYxVOlVW8vQEMHi6Ho7IAF_7EA0Ocyi17fkyXgNRU2mHx6QBMnCVsJB2Sb-pFmAfA9Au5M0P37vbXq8ZGQf4_tyDrnHvnGkSeYmtwaZJHprvCNMgYKVFLm5-_-C1R8iLE4bKr9wYWH5qIbPIoq-WlumkXw")' }}
                            ></div>
                            <div>
                                <p className="font-bold text-white">Sarah Jenkins</p>
                                <p className="text-sm text-slate-400">Senior Partner, Jenkins & Co.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-sm text-slate-400">
                        © 2024 DraftMate Inc.
                    </div>
                </div>
            </aside>

            {/* Right Panel: Onboarding Form */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
                {/* Top Navigation */}
                <nav className="flex justify-end items-center px-8 py-6 w-full absolute top-0 z-10">
                    <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Already have an account?
                        <a href="#" className="text-blue-600 hover:text-blue-700 ml-1 transition-colors" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign in</a>
                    </div>
                </nav>

                {/* Main Content Container */}
                <div className="flex-1 flex flex-col justify-center w-full max-w-2xl mx-auto px-6 py-20 lg:px-12">
                    {/* Progress Indicator */}
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Step {step} of 3</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{Math.round((step / 3) * 100)}% Completed</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-300"
                                style={{ width: `${(step / 3) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Page Header */}
                    <div className="mb-10">
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                            {step === 1 && "Welcome to DraftMate"}
                            {step === 2 && "Professional Details"}
                            {step === 3 && "Tailor Your Experience"}
                        </h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                            {step === 1 && "Tell us a bit about yourself so we can tailor your experience."}
                            {step === 2 && "Help us customize your workspace with your professional details."}
                            {step === 3 && "What do you plan to use this website for? Select all that apply."}
                        </p>
                    </div>

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="flex flex-col gap-8 animate-fade-in-up">
                            {/* Role Selection */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">I am a...</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="relative group cursor-pointer" onClick={() => handleRoleSelect('professional')}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="professional"
                                            className="peer sr-only"
                                            checked={formData.role === 'professional'}
                                            onChange={() => { }}
                                        />
                                        <div className="p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 peer-checked:border-blue-600 peer-checked:bg-blue-600/5 dark:peer-checked:bg-blue-600/10 transition-all duration-200 h-full flex flex-col gap-4 shadow-sm hover:shadow-md">
                                            <div className="flex justify-between items-start">
                                                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <span className="material-symbols-outlined text-2xl">gavel</span>
                                                </div>
                                                <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white text-sm opacity-0 peer-checked:opacity-100 font-bold">check</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-slate-900 dark:text-white mb-1">Working Professional</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">I practice law at a firm, agency, or independently.</p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="relative group cursor-pointer" onClick={() => handleRoleSelect('student')}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="student"
                                            className="peer sr-only"
                                            checked={formData.role === 'student'}
                                            onChange={() => { }}
                                        />
                                        <div className="p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 peer-checked:border-blue-600 peer-checked:bg-blue-600/5 dark:peer-checked:bg-blue-600/10 transition-all duration-200 h-full flex flex-col gap-4 shadow-sm hover:shadow-md">
                                            <div className="flex justify-between items-start">
                                                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <span className="material-symbols-outlined text-2xl">school</span>
                                                </div>
                                                <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white text-sm opacity-0 peer-checked:opacity-100 font-bold">check</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-slate-900 dark:text-white mb-1">Law Student</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">I am currently studying at a law school or university.</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Text Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-white" htmlFor="firstName">First Name</label>
                                    <input
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-12 px-4 shadow-sm placeholder:text-slate-400 transition-colors"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="e.g. Jonathan"
                                        type="text"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-white" htmlFor="lastName">Last Name</label>
                                    <input
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-12 px-4 shadow-sm placeholder:text-slate-400 transition-colors"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="e.g. Suits"
                                        type="text"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Professional Details */}
                    {step === 2 && (
                        <div className="flex flex-col gap-8 animate-fade-in-up">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-white" htmlFor="workplace">
                                        {formData.role === 'student' ? 'University / Law School Name' : 'Firm / Organization Name'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">domain</span>
                                        <input
                                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-12 pl-12 pr-4 shadow-sm placeholder:text-slate-400 transition-colors"
                                            id="workplace"
                                            name="workplace"
                                            value={formData.workplace}
                                            onChange={handleChange}
                                            placeholder={formData.role === 'student' ? "e.g. Harvard Law School" : "e.g. Pearson Hardman"}
                                            type="text"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-white" htmlFor="designation">
                                        {formData.role === 'student' ? 'Year of Study' : 'Role / Designation'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">badge</span>
                                        <input
                                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-12 pl-12 pr-4 shadow-sm placeholder:text-slate-400 transition-colors"
                                            id="designation"
                                            name="designation"
                                            value={formData.designation}
                                            onChange={handleChange}
                                            placeholder={formData.role === 'student' ? "e.g. 2nd Year" : "e.g. Senior Associate"}
                                            type="text"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Usage Intent */}
                    {step === 3 && (
                        <div className="flex flex-col gap-4 animate-fade-in-up">
                            <div className="grid grid-cols-1 gap-4">
                                {usageOptions.map((option) => (
                                    <label key={option.id} className="relative group cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={formData.usage.includes(option.id)}
                                            onChange={() => handleUsageToggle(option.id)}
                                        />
                                        <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 peer-checked:border-blue-600 peer-checked:bg-blue-600/5 dark:peer-checked:bg-blue-600/10 transition-all duration-200 shadow-sm hover:shadow-md">
                                            <div className="flex-none size-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined">{option.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white">{option.label}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{option.desc}</p>
                                            </div>
                                            <div className="size-6 rounded-full border-2 border-slate-300 dark:border-slate-600 peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-sm opacity-0 peer-checked:opacity-100 font-bold">check</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100 dark:border-slate-800">
                        <button
                            className="px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            type="button"
                            onClick={handleBack}
                        >
                            Back
                        </button>
                        <button
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                            type="button"
                            onClick={handleContinue}
                        >
                            <span>{step === 3 ? "Finish & Go to Dashboard" : "Continue"}</span>
                            <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                        </button>
                    </div>

                    {/* Trust Signals */}
                    <div className="flex justify-center gap-6 mt-4 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-sm">lock</span>
                            <span>256-bit Encryption</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-sm">verified_user</span>
                            <span>ISO 27001 Certified</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Onboarding;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import fullLogo from '../assets/FULL_LOGO.svg';

const HowItWorks = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        document.title = 'How It Works - DraftMate';
        window.scrollTo(0, 0);
    }, []);

    const handleStepChange = (index) => {
        if (index !== activeStep) {
            setIsAnimating(true);
            setTimeout(() => {
                setActiveStep(index);
                setIsAnimating(false);
            }, 150);
        }
    };

    const steps = [
        {
            id: 1,
            title: 'Sign Up & Get Started',
            icon: 'person_add',
            color: '#3B82F6',
            description: 'Create your DraftMate account in under a minute',
            content: {
                heading: 'Quick & Easy Registration',
                text: 'Getting started with DraftMate is simple. Sign up with your email or Google account, verify your credentials, and you\'re ready to go. No complex setup required.',
                features: [
                    { icon: 'email', text: 'Sign up with Email or Google' },
                    { icon: 'verified_user', text: 'Verify your advocate credentials' },
                    { icon: 'tune', text: 'Customize your profile settings' },
                    { icon: 'security', text: 'Set up secure 2FA (optional)' }
                ],
                mockup: 'signup'
            }
        },
        {
            id: 2,
            title: 'Explore the Dashboard',
            icon: 'dashboard',
            color: '#8B5CF6',
            description: 'Your command center for legal productivity',
            content: {
                heading: 'Your Legal Command Center',
                text: 'The dashboard gives you a complete overview of your work. Access recent drafts, research history, pending tasks, and quick actions all from one place.',
                features: [
                    { icon: 'history', text: 'View recent drafts and research' },
                    { icon: 'add_circle', text: 'Quick access to start new documents' },
                    { icon: 'insights', text: 'Track your productivity stats' },
                    { icon: 'notifications', text: 'Get updates on saved searches' }
                ],
                mockup: 'dashboard'
            }
        },
        {
            id: 3,
            title: 'Draft with AI',
            icon: 'edit_document',
            color: '#10B981',
            description: 'Generate court-ready documents in minutes',
            content: {
                heading: 'AI-Powered Document Generation',
                text: 'Enter your case facts in plain language, and watch as DraftMate transforms them into professionally formatted legal documents. Choose from 50+ templates for different courts and document types.',
                features: [
                    { icon: 'format_list_bulleted', text: 'Select document type (Petition, Agreement, etc.)' },
                    { icon: 'input', text: 'Enter case facts in plain language' },
                    { icon: 'auto_awesome', text: 'AI generates formatted draft with citations' },
                    { icon: 'edit', text: 'Edit and customize to your needs' }
                ],
                mockup: 'drafting'
            }
        },
        {
            id: 4,
            title: 'Research with Lex Bot',
            icon: 'smart_toy',
            color: '#F59E0B',
            description: 'Get instant answers with verified citations',
            content: {
                heading: 'Your AI Research Assistant',
                text: 'Ask Lex Bot any legal question in natural language. Get comprehensive answers backed by verified citations from Supreme Court, High Courts, and authentic legal sources.',
                features: [
                    { icon: 'chat', text: 'Ask questions in plain English or Hindi' },
                    { icon: 'library_books', text: 'Get verified case law citations' },
                    { icon: 'bookmark', text: 'Save important findings for later' },
                    { icon: 'share', text: 'Export research with proper citations' }
                ],
                mockup: 'research'
            }
        },
        {
            id: 5,
            title: 'Analyze Documents',
            icon: 'picture_as_pdf',
            color: '#EC4899',
            description: 'Upload and chat with any legal document',
            content: {
                heading: 'Smart Document Analysis',
                text: 'Upload lengthy judgments, contracts, or case files and let AI analyze them for you. Ask questions, extract summaries, identify key arguments, and find relevant precedents.',
                features: [
                    { icon: 'upload_file', text: 'Upload PDF, DOCX, or image files' },
                    { icon: 'summarize', text: 'Get instant document summaries' },
                    { icon: 'question_answer', text: 'Chat and ask questions about content' },
                    { icon: 'format_quote', text: 'Extract key quotes and arguments' }
                ],
                mockup: 'pdf'
            }
        },
        {
            id: 6,
            title: 'Export & Share',
            icon: 'file_download',
            color: '#06B6D4',
            description: 'Download in any format and file with confidence',
            content: {
                heading: 'Seamless Export Options',
                text: 'When your document is ready, export it in the format you need. Download as Word for further editing, PDF for filing, or share directly with clients and colleagues.',
                features: [
                    { icon: 'description', text: 'Export to Microsoft Word (.docx)' },
                    { icon: 'picture_as_pdf', text: 'Download as PDF with proper formatting' },
                    { icon: 'print', text: 'Print with court-ready layout' },
                    { icon: 'share', text: 'Share via email or link' }
                ],
                mockup: 'export'
            }
        }
    ];

    const renderMockup = (type) => {
        switch (type) {
            case 'signup':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-center mb-6">
                            <img src={fullLogo} alt="DraftMate" className="h-10 object-contain" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-12 bg-slate-100 rounded-lg flex items-center px-4 gap-3">
                                <span className="material-symbols-outlined text-slate-400">email</span>
                                <span className="text-slate-400 text-sm">Enter your email</span>
                            </div>
                            <div className="h-12 bg-slate-100 rounded-lg flex items-center px-4 gap-3">
                                <span className="material-symbols-outlined text-slate-400">lock</span>
                                <span className="text-slate-400 text-sm">Create password</span>
                            </div>
                            <button className="w-full h-12 bg-primary text-white font-bold rounded-lg">
                                Create Account
                            </button>
                            <div className="flex items-center gap-4 my-4">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-slate-400 text-xs">or</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>
                            <button className="w-full h-12 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg flex items-center justify-center gap-3">
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                Continue with Google
                            </button>
                        </div>
                    </div>
                );
            case 'dashboard':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="h-3 w-32 bg-slate-800 rounded mb-1" />
                                <div className="h-2 w-24 bg-slate-300 rounded" />
                            </div>
                            <div className="size-10 bg-primary/20 rounded-full" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg text-center">
                                <span className="material-symbols-outlined text-primary text-lg">edit_document</span>
                                <p className="text-[10px] mt-1 font-medium">New Draft</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                                <span className="material-symbols-outlined text-purple-600 text-lg">smart_toy</span>
                                <p className="text-[10px] mt-1 font-medium">Research</p>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg text-center">
                                <span className="material-symbols-outlined text-amber-600 text-lg">folder</span>
                                <p className="text-[10px] mt-1 font-medium">My Drafts</p>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs font-medium mb-2">Recent Documents</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 bg-white rounded border border-slate-100">
                                    <span className="material-symbols-outlined text-slate-400 text-sm">description</span>
                                    <div className="h-2 w-24 bg-slate-200 rounded" />
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white rounded border border-slate-100">
                                    <span className="material-symbols-outlined text-slate-400 text-sm">description</span>
                                    <div className="h-2 w-20 bg-slate-200 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'drafting':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">edit_document</span>
                            <span className="font-bold text-sm">AI Drafter</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                            <p className="text-xs text-slate-500 mb-2">Case Facts:</p>
                            <p className="text-xs text-slate-700">"My client was wrongfully terminated from XYZ Corp on 15th Jan without proper notice..."</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 h-8 bg-slate-100 rounded flex items-center justify-center text-xs">
                                <span className="material-symbols-outlined text-xs mr-1">gavel</span>
                                Writ Petition
                            </div>
                            <div className="flex-1 h-8 bg-primary/10 border border-primary rounded flex items-center justify-center text-xs text-primary font-medium">
                                <span className="material-symbols-outlined text-xs mr-1">check</span>
                                Labour Court
                            </div>
                        </div>
                        <button className="w-full h-10 bg-primary text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-base">auto_awesome</span>
                            Generate Draft
                        </button>
                    </div>
                );
            case 'research':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-purple-600">smart_toy</span>
                            <span className="font-bold text-sm">Lex Bot</span>
                        </div>
                        <div className="p-2 bg-slate-100 rounded-lg text-xs">
                            "What is the limitation period for filing a civil suit for recovery of money?"
                        </div>
                        <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
                            <p className="text-xs mb-2">Under Article 55 of the Limitation Act, 1963, the limitation period is <strong>3 years</strong> from the date when the debt becomes payable...</p>
                            <div className="flex items-center gap-2 mt-2 text-purple-600">
                                <span className="material-symbols-outlined text-sm">menu_book</span>
                                <span className="text-[10px] font-medium">Limitation Act, 1963</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 h-8 bg-white border border-slate-200 rounded text-xs flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">bookmark</span>
                                Save
                            </button>
                            <button className="flex-1 h-8 bg-white border border-slate-200 rounded text-xs flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                                Copy
                            </button>
                        </div>
                    </div>
                );
            case 'pdf':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-pink-600">picture_as_pdf</span>
                            <span className="font-bold text-sm">Document Analysis</span>
                        </div>
                        <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center">
                            <span className="material-symbols-outlined text-3xl text-slate-300">upload_file</span>
                            <p className="text-xs text-slate-400 mt-2">judgment_xyz_vs_state.pdf</p>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                                <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-emerald-50 rounded text-center">
                                <span className="material-symbols-outlined text-emerald-600 text-lg">summarize</span>
                                <p className="text-[10px] mt-1">Summary</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded text-center">
                                <span className="material-symbols-outlined text-blue-600 text-lg">chat</span>
                                <p className="text-[10px] mt-1">Chat</p>
                            </div>
                        </div>
                    </div>
                );
            case 'export':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-cyan-600">file_download</span>
                            <span className="font-bold text-sm">Export Options</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                            <span className="material-symbols-outlined text-slate-400">description</span>
                            <div className="flex-1">
                                <div className="h-2.5 w-32 bg-slate-700 rounded" />
                                <div className="h-2 w-20 bg-slate-300 rounded mt-1" />
                            </div>
                            <span className="material-symbols-outlined text-green-500">check_circle</span>
                        </div>
                        <div className="space-y-2">
                            <button className="w-full h-10 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-base">description</span>
                                Download as Word
                            </button>
                            <button className="w-full h-10 bg-red-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                                Download as PDF
                            </button>
                            <button className="w-full h-10 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-base">print</span>
                                Print Document
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-slate-50 text-slate-900 font-sans overflow-x-hidden min-h-screen">
            {/* Navigation */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-3 lg:px-20">
                <Link to="/" className="flex items-center gap-4">
                    <div className="h-12 flex items-center justify-center hover:opacity-80 transition-opacity">
                        <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-slate-600 hover:text-primary transition-colors font-medium">← Back to Home</Link>
                    <Link to="/login" className="hidden sm:flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-16 lg:py-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50" />
                <div className="absolute top-20 left-1/4 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700 uppercase tracking-wide mb-8">
                        <span className="material-symbols-outlined text-base">school</span>
                        Step-by-Step Guide
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-6">
                        How to Use <span className="text-primary">DraftMate</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        A complete walkthrough to help you master every feature
                        and become a power user in minutes
                    </p>
                </div>
            </section>

            {/* Interactive Steps Section */}
            <section className="py-12 lg:py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Step Navigation - Horizontal Timeline */}
                    <div className="mb-12 lg:mb-16">
                        <div className="relative">
                            {/* Progress Line */}
                            <div className="hidden lg:block absolute top-6 left-0 right-0 h-1 bg-slate-200" />
                            <div
                                className="hidden lg:block absolute top-6 left-0 h-1 bg-gradient-to-r from-primary to-cyan-500 transition-all duration-500"
                                style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                            />

                            {/* Steps */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-2">
                                {steps.map((step, index) => (
                                    <button
                                        key={step.id}
                                        onClick={() => handleStepChange(index)}
                                        className={`relative flex flex-col items-center text-center p-4 rounded-xl transition-all duration-300 ${activeStep === index
                                            ? 'bg-white shadow-lg border-2 border-primary'
                                            : index < activeStep
                                                ? 'bg-primary/5 hover:bg-primary/10'
                                                : 'bg-white border border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div
                                            className={`relative z-10 size-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${activeStep === index
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : index < activeStep
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-slate-100 text-slate-400'
                                                }`}
                                        >
                                            {index < activeStep ? (
                                                <span className="material-symbols-outlined">check</span>
                                            ) : (
                                                <span className="material-symbols-outlined">{step.icon}</span>
                                            )}
                                        </div>
                                        <span className={`text-sm font-bold ${activeStep === index ? 'text-primary' : 'text-slate-700'}`}>
                                            Step {step.id}
                                        </span>
                                        <span className={`text-xs mt-1 ${activeStep === index ? 'text-slate-600' : 'text-slate-400'}`}>
                                            {step.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Active Step Content */}
                    <div className={`transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                            <div className="grid lg:grid-cols-2">
                                {/* Text Content */}
                                <div className="p-8 lg:p-12">
                                    <div
                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-6"
                                        style={{
                                            backgroundColor: `${steps[activeStep].color}15`,
                                            color: steps[activeStep].color
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-base">{steps[activeStep].icon}</span>
                                        Step {steps[activeStep].id} of {steps.length}
                                    </div>

                                    <h2 className="text-2xl md:text-3xl font-black mb-4">
                                        {steps[activeStep].content.heading}
                                    </h2>
                                    <p className="text-lg text-slate-600 mb-8">
                                        {steps[activeStep].content.text}
                                    </p>

                                    <div className="space-y-4">
                                        {steps[activeStep].content.features.map((feature, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                            >
                                                <div
                                                    className="size-10 rounded-lg flex items-center justify-center shrink-0"
                                                    style={{ backgroundColor: `${steps[activeStep].color}15` }}
                                                >
                                                    <span
                                                        className="material-symbols-outlined"
                                                        style={{ color: steps[activeStep].color }}
                                                    >
                                                        {feature.icon}
                                                    </span>
                                                </div>
                                                <span className="text-slate-700 font-medium pt-2">{feature.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex gap-4 mt-8">
                                        <button
                                            onClick={() => handleStepChange(Math.max(0, activeStep - 1))}
                                            disabled={activeStep === 0}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeStep === 0
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined">arrow_back</span>
                                            Previous
                                        </button>
                                        {activeStep < steps.length - 1 ? (
                                            <button
                                                onClick={() => handleStepChange(activeStep + 1)}
                                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                                            >
                                                Next Step
                                                <span className="material-symbols-outlined">arrow_forward</span>
                                            </button>
                                        ) : (
                                            <Link
                                                to="/login"
                                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-all shadow-lg shadow-green-500/25"
                                            >
                                                Start Now
                                                <span className="material-symbols-outlined">rocket_launch</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Visual Mockup */}
                                <div className="bg-gradient-to-br from-slate-100 to-slate-50 p-8 lg:p-12 flex items-center justify-center">
                                    <div className="relative w-full max-w-sm">
                                        {/* Phone Frame */}
                                        <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
                                            <div className="bg-white rounded-[2rem] overflow-hidden">
                                                {/* Status Bar */}
                                                <div className="bg-slate-900 h-8 flex items-center justify-center">
                                                    <div className="w-20 h-5 bg-black rounded-full" />
                                                </div>
                                                {/* Content */}
                                                <div className="p-4 min-h-[350px]">
                                                    {renderMockup(steps[activeStep].content.mockup)}
                                                </div>
                                                {/* Home Indicator */}
                                                <div className="flex justify-center pb-2">
                                                    <div className="w-32 h-1 bg-slate-200 rounded-full" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Decorative Elements */}
                                        <div
                                            className="absolute -top-4 -right-4 size-24 rounded-full blur-2xl opacity-50"
                                            style={{ backgroundColor: steps[activeStep].color }}
                                        />
                                        <div
                                            className="absolute -bottom-4 -left-4 size-32 rounded-full blur-2xl opacity-30"
                                            style={{ backgroundColor: steps[activeStep].color }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Tips Section */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-4">Pro Tips for Power Users</h2>
                        <p className="text-lg text-slate-600">Get the most out of DraftMate with these expert tips</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: 'keyboard',
                                title: 'Keyboard Shortcuts',
                                description: 'Use Ctrl+D to open drafting, Ctrl+R for research, and Ctrl+S to save anytime.',
                                color: '#3B82F6'
                            },
                            {
                                icon: 'bookmark',
                                title: 'Save Templates',
                                description: 'Create and save your own templates for frequently used document types.',
                                color: '#8B5CF6'
                            },
                            {
                                icon: 'history',
                                title: 'Version History',
                                description: 'Access previous versions of your drafts anytime from the document menu.',
                                color: '#10B981'
                            }
                        ].map((tip, idx) => (
                            <div key={idx} className="p-6 bg-slate-50 rounded-2xl hover:shadow-lg transition-shadow">
                                <div
                                    className="size-12 rounded-xl flex items-center justify-center mb-4"
                                    style={{ backgroundColor: `${tip.color}15` }}
                                >
                                    <span className="material-symbols-outlined text-2xl" style={{ color: tip.color }}>
                                        {tip.icon}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold mb-2">{tip.title}</h3>
                                <p className="text-slate-600 text-sm">{tip.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-primary via-blue-600 to-cyan-500">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">
                        Join thousands of advocates already using DraftMate to
                        transform their legal practice.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link to="/login" className="flex items-center gap-2 rounded-xl h-14 px-8 bg-white text-primary text-lg font-bold hover:bg-blue-50 transition-colors shadow-xl">
                            <span className="material-symbols-outlined">rocket_launch</span>
                            Start Free Trial
                        </Link>
                        <Link to="/features" className="flex items-center gap-2 rounded-xl h-14 px-8 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-lg font-bold hover:bg-white/20 transition-colors">
                            <span className="material-symbols-outlined">apps</span>
                            View All Features
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="h-8 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1 shadow-sm">
                            <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                        </div>
                    </Link>
                    <div className="flex gap-6">
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
                        <Link to="/features" className="text-slate-400 hover:text-white transition-colors">Features</Link>
                        <Link to="/login" className="text-slate-400 hover:text-white transition-colors">Login</Link>
                    </div>
                    <p className="text-slate-500 text-sm">© 2024 DraftMate. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default HowItWorks;

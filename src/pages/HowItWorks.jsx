import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import fullLogo from '../assets/FULL_LOGO.svg';

const HowItWorks = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [visibleSections, setVisibleSections] = useState(new Set());
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const sectionRefs = useRef([]);

    useEffect(() => {
        document.title = 'How It Works - DraftMate';
        window.scrollTo(0, 0);
    }, []);

    // Auto-advance steps (optional - subtle hint animation)
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisibleSections((prev) => new Set(prev).add(entry.target.dataset.section));
                    }
                });
            },
            { threshold: 0.15 }
        );

        sectionRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    const handleStepChange = (index) => {
        if (index !== activeStep) {
            setIsAnimating(true);
            setTimeout(() => {
                setActiveStep(index);
                setIsAnimating(false);
            }, 200);
        }
    };

    const isVisible = (section) => visibleSections.has(section);

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
                        <div className="flex justify-center mb-6 animate-fadeInDown">
                            <img src={fullLogo} alt="DraftMate" className="h-10 object-contain" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-12 bg-slate-100 rounded-lg flex items-center px-4 gap-3 animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
                                <span className="material-symbols-outlined text-slate-400">email</span>
                                <span className="text-slate-400 text-sm">Enter your email</span>
                                <span className="ml-auto w-0.5 h-4 bg-primary animate-blink" />
                            </div>
                            <div className="h-12 bg-slate-100 rounded-lg flex items-center px-4 gap-3 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                                <span className="material-symbols-outlined text-slate-400">lock</span>
                                <span className="text-slate-400 text-sm">Create password</span>
                            </div>
                            <button className="w-full h-12 bg-primary text-white font-bold rounded-lg hover:scale-105 hover:shadow-lg hover:shadow-primary/40 transition-all duration-300 animate-pulse-soft">
                                Create Account
                            </button>
                            <div className="flex items-center gap-4 my-4 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-slate-400 text-xs">or</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>
                            <button className="w-full h-12 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg flex items-center justify-center gap-3 hover:scale-105 hover:border-primary hover:shadow-md transition-all duration-300 animate-slideInUp" style={{ animationDelay: '0.5s' }}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                Continue with Google
                            </button>
                        </div>
                    </div>
                );
            case 'dashboard':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4 animate-fadeInDown">
                            <div>
                                <div className="h-3 w-32 bg-slate-800 rounded mb-1 animate-shimmer" />
                                <div className="h-2 w-24 bg-slate-300 rounded" />
                            </div>
                            <div className="size-10 bg-primary/20 rounded-full animate-pulse-soft" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: 'edit_document', label: 'New Draft', bg: 'bg-blue-50', color: 'text-primary' },
                                { icon: 'smart_toy', label: 'Research', bg: 'bg-purple-50', color: 'text-purple-600' },
                                { icon: 'folder', label: 'My Drafts', bg: 'bg-amber-50', color: 'text-amber-600' }
                            ].map((item, i) => (
                                <div key={i} className={`p-3 ${item.bg} rounded-lg text-center hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-slideInUp`} style={{ animationDelay: `${i * 0.1}s` }}>
                                    <span className={`material-symbols-outlined ${item.color} text-lg animate-bounce-soft`}>{item.icon}</span>
                                    <p className="text-[10px] mt-1 font-medium">{item.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                            <p className="text-xs font-medium mb-2">Recent Documents</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 bg-white rounded border border-slate-100 hover:translate-x-1 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-slate-400 text-sm">description</span>
                                    <div className="h-2 w-24 bg-slate-200 rounded animate-shimmer" />
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white rounded border border-slate-100 hover:translate-x-1 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-slate-400 text-sm">description</span>
                                    <div className="h-2 w-20 bg-slate-200 rounded animate-shimmer" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'drafting':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4 animate-fadeInDown">
                            <span className="material-symbols-outlined text-primary animate-bounce-soft">edit_document</span>
                            <span className="font-bold text-sm">AI Drafter</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 animate-slideInLeft hover:border-primary transition-colors duration-300">
                            <p className="text-xs text-slate-500 mb-2">Case Facts:</p>
                            <p className="text-xs text-slate-700 animate-typing overflow-hidden whitespace-nowrap">"My client was wrongfully terminated..."</p>
                        </div>
                        <div className="flex gap-2 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                            <div className="flex-1 h-8 bg-slate-100 rounded flex items-center justify-center text-xs hover:bg-slate-200 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-xs mr-1">gavel</span>
                                Writ Petition
                            </div>
                            <div className="flex-1 h-8 bg-primary/10 border border-primary rounded flex items-center justify-center text-xs text-primary font-medium animate-pulse-soft">
                                <span className="material-symbols-outlined text-xs mr-1">check</span>
                                Labour Court
                            </div>
                        </div>
                        <button className="w-full h-10 bg-primary text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-primary/40 transition-all duration-300 animate-slideInUp" style={{ animationDelay: '0.3s' }}>
                            <span className="material-symbols-outlined text-base animate-spin-slow">auto_awesome</span>
                            Generate Draft
                        </button>
                    </div>
                );
            case 'research':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4 animate-fadeInDown">
                            <span className="material-symbols-outlined text-purple-600 animate-bounce-soft">smart_toy</span>
                            <span className="font-bold text-sm">Lex Bot</span>
                        </div>
                        <div className="p-2 bg-slate-100 rounded-lg text-xs animate-slideInRight">
                            "What is the limitation period for filing a civil suit for recovery of money?"
                        </div>
                        <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
                            <p className="text-xs mb-2">Under Article 55 of the Limitation Act, 1963, the limitation period is <strong className="text-purple-700 animate-pulse-soft">3 years</strong> from the date when the debt becomes payable...</p>
                            <div className="flex items-center gap-2 mt-2 text-purple-600">
                                <span className="material-symbols-outlined text-sm">menu_book</span>
                                <span className="text-[10px] font-medium">Limitation Act, 1963</span>
                            </div>
                        </div>
                        <div className="flex gap-2 animate-slideInUp" style={{ animationDelay: '0.5s' }}>
                            <button className="flex-1 h-8 bg-white border border-slate-200 rounded text-xs flex items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300 hover:scale-105 transition-all duration-300">
                                <span className="material-symbols-outlined text-sm">bookmark</span>
                                Save
                            </button>
                            <button className="flex-1 h-8 bg-white border border-slate-200 rounded text-xs flex items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300 hover:scale-105 transition-all duration-300">
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                                Copy
                            </button>
                        </div>
                    </div>
                );
            case 'pdf':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4 animate-fadeInDown">
                            <span className="material-symbols-outlined text-pink-600 animate-bounce-soft">picture_as_pdf</span>
                            <span className="font-bold text-sm">Document Analysis</span>
                        </div>
                        <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center animate-slideInUp hover:border-pink-400 transition-colors duration-300">
                            <span className="material-symbols-outlined text-3xl text-slate-300 animate-bounce-soft">upload_file</span>
                            <p className="text-xs text-slate-400 mt-2">judgment_xyz_vs_state.pdf</p>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div className="bg-green-500 h-1.5 rounded-full animate-progressBar"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-emerald-50 rounded text-center hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
                                <span className="material-symbols-outlined text-emerald-600 text-lg">summarize</span>
                                <p className="text-[10px] mt-1">Summary</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded text-center hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-slideInRight" style={{ animationDelay: '0.3s' }}>
                                <span className="material-symbols-outlined text-blue-600 text-lg">chat</span>
                                <p className="text-[10px] mt-1">Chat</p>
                            </div>
                        </div>
                    </div>
                );
            case 'export':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4 animate-fadeInDown">
                            <span className="material-symbols-outlined text-cyan-600 animate-bounce-soft">file_download</span>
                            <span className="font-bold text-sm">Export Options</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3 animate-slideInLeft">
                            <span className="material-symbols-outlined text-slate-400">description</span>
                            <div className="flex-1">
                                <div className="h-2.5 w-32 bg-slate-700 rounded animate-shimmer" />
                                <div className="h-2 w-20 bg-slate-300 rounded mt-1" />
                            </div>
                            <span className="material-symbols-outlined text-green-500 animate-bounce-soft">check_circle</span>
                        </div>
                        <div className="space-y-2">
                            {[
                                { bg: 'bg-blue-600', icon: 'description', label: 'Download as Word' },
                                { bg: 'bg-red-600', icon: 'picture_as_pdf', label: 'Download as PDF' },
                            ].map((btn, i) => (
                                <button key={i} className={`w-full h-10 ${btn.bg} text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:scale-105 hover:shadow-lg transition-all duration-300 animate-slideInUp`} style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                                    <span className="material-symbols-outlined text-base">{btn.icon}</span>
                                    {btn.label}
                                </button>
                            ))}
                            <button className="w-full h-10 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center justify-center gap-2 hover:scale-105 hover:border-cyan-400 transition-all duration-300 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
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
            {/* Custom Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }
                @keyframes floatReverse {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(15px); }
                }
                @keyframes pulse-soft {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                @keyframes bounce-soft {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes progressBar {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes rotateIn {
                    from { opacity: 0; transform: rotate(-180deg) scale(0.5); }
                    to { opacity: 1; transform: rotate(0deg) scale(1); }
                }
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -30px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
                .animate-fadeInUp { animation: fadeInUp 0.7s ease-out forwards; }
                .animate-fadeInDown { animation: fadeInDown 0.5s ease-out forwards; }
                .animate-slideInLeft { animation: slideInLeft 0.6s ease-out forwards; opacity: 0; }
                .animate-slideInRight { animation: slideInRight 0.6s ease-out forwards; opacity: 0; }
                .animate-slideInUp { animation: slideInUp 0.5s ease-out forwards; opacity: 0; }
                .animate-float { animation: float 4s ease-in-out infinite; }
                .animate-floatReverse { animation: floatReverse 5s ease-in-out infinite; }
                .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
                .animate-bounce-soft { animation: bounce-soft 2s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 3s linear infinite; }
                .animate-blink { animation: blink 1s ease-in-out infinite; }
                .animate-progressBar { animation: progressBar 2s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.5s ease-out forwards; }
                .animate-rotateIn { animation: rotateIn 0.8s ease-out forwards; }
                .animate-blob { animation: blob 8s ease-in-out infinite; }
                .animate-shimmer {
                    background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
                    background-size: 200% 100%;
                    animation: shimmer 2s linear infinite;
                }
                .animate-gradient-shift {
                    background-size: 200% 200%;
                    animation: gradient-shift 8s ease infinite;
                }
                .shine-effect {
                    position: relative;
                    overflow: hidden;
                }
                .shine-effect::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: shine 3s ease-in-out infinite;
                }
                .hover-lift {
                    transition: all 0.3s ease;
                }
                .hover-lift:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }
                .stagger-1 { animation-delay: 0.1s; }
                .stagger-2 { animation-delay: 0.2s; }
                .stagger-3 { animation-delay: 0.3s; }
                .stagger-4 { animation-delay: 0.4s; }
                .stagger-5 { animation-delay: 0.5s; }
            `}</style>

            {/* Navigation */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-3 lg:px-20 animate-fadeInDown">
                <Link to="/" className="flex items-center gap-4">
                    <div className="h-12 flex items-center justify-center hover:opacity-80 transition-opacity">
                        <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-slate-600 hover:text-primary transition-all duration-300 font-medium hover:-translate-x-1 inline-block">← Back to Home</Link>
                    <Link to="/login" className="hidden sm:flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-white font-bold hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/25 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 shine-effect">
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-16 lg:py-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50 animate-gradient-shift" />
                <div className="absolute top-20 left-1/4 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700 uppercase tracking-wide mb-8 animate-fadeInDown hover:scale-110 transition-transform duration-300 cursor-default">
                        <span className="material-symbols-outlined text-base animate-bounce-soft">school</span>
                        Step-by-Step Guide
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-6 animate-fadeInUp">
                        How to Use{' '}
                        <span className="text-primary inline-block hover:scale-110 transition-transform duration-300 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent animate-gradient-shift" style={{ backgroundSize: '200% auto' }}>
                            DraftMate
                        </span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
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
                            <div className="hidden lg:block absolute top-6 left-0 right-0 h-1 bg-slate-200 rounded-full" />
                            <div
                                className="hidden lg:block absolute top-6 left-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 transition-all duration-700 ease-out rounded-full shadow-lg shadow-primary/50"
                                style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                            />

                            {/* Steps */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-2">
                                {steps.map((step, index) => (
                                    <button
                                        key={step.id}
                                        onClick={() => handleStepChange(index)}
                                        className={`relative flex flex-col items-center text-center p-4 rounded-xl transition-all duration-500 animate-slideInUp ${activeStep === index
                                            ? 'bg-white shadow-xl border-2 border-primary scale-105 -translate-y-2'
                                            : index < activeStep
                                                ? 'bg-primary/5 hover:bg-primary/10 hover:scale-105'
                                                : 'bg-white border border-slate-200 hover:border-slate-300 hover:scale-105 hover:-translate-y-1'
                                            }`}
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div
                                            className={`relative z-10 size-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-500 ${activeStep === index
                                                ? 'bg-primary text-white shadow-lg shadow-primary/40 scale-110 rotate-6'
                                                : index < activeStep
                                                    ? 'bg-green-500 text-white animate-pulse-soft'
                                                    : 'bg-slate-100 text-slate-400'
                                                }`}
                                        >
                                            {index < activeStep ? (
                                                <span className="material-symbols-outlined animate-scaleIn">check</span>
                                            ) : (
                                                <span className={`material-symbols-outlined ${activeStep === index ? 'animate-bounce-soft' : ''}`}>{step.icon}</span>
                                            )}
                                            {activeStep === index && (
                                                <div className="absolute inset-0 rounded-xl bg-primary animate-ping opacity-30" />
                                            )}
                                        </div>
                                        <span className={`text-sm font-bold transition-colors duration-300 ${activeStep === index ? 'text-primary' : 'text-slate-700'}`}>
                                            Step {step.id}
                                        </span>
                                        <span className={`text-xs mt-1 transition-colors duration-300 ${activeStep === index ? 'text-slate-600' : 'text-slate-400'}`}>
                                            {step.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Active Step Content */}
                    <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
                        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden hover:shadow-3xl transition-shadow duration-500">
                            <div className="grid lg:grid-cols-2">
                                {/* Text Content */}
                                <div className="p-8 lg:p-12">
                                    <div
                                        key={`badge-${activeStep}`}
                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-6 animate-slideInLeft hover:scale-110 transition-transform duration-300 cursor-default"
                                        style={{
                                            backgroundColor: `${steps[activeStep].color}15`,
                                            color: steps[activeStep].color
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-base animate-bounce-soft">{steps[activeStep].icon}</span>
                                        Step {steps[activeStep].id} of {steps.length}
                                    </div>

                                    <h2 key={`heading-${activeStep}`} className="text-2xl md:text-3xl font-black mb-4 animate-fadeInUp">
                                        {steps[activeStep].content.heading}
                                    </h2>
                                    <p key={`text-${activeStep}`} className="text-lg text-slate-600 mb-8 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                                        {steps[activeStep].content.text}
                                    </p>

                                    <div className="space-y-4">
                                        {steps[activeStep].content.features.map((feature, idx) => (
                                            <div
                                                key={`${activeStep}-${idx}`}
                                                className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 hover:translate-x-2 hover:shadow-md transition-all duration-300 cursor-pointer animate-slideInLeft group"
                                                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                                            >
                                                <div
                                                    className="size-10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"
                                                    style={{ backgroundColor: `${steps[activeStep].color}15` }}
                                                >
                                                    <span
                                                        className="material-symbols-outlined"
                                                        style={{ color: steps[activeStep].color }}
                                                    >
                                                        {feature.icon}
                                                    </span>
                                                </div>
                                                <span className="text-slate-700 font-medium pt-2 group-hover:text-slate-900 transition-colors">{feature.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex gap-4 mt-8 animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
                                        <button
                                            onClick={() => handleStepChange(Math.max(0, activeStep - 1))}
                                            disabled={activeStep === 0}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${activeStep === 0
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:-translate-x-1 hover:shadow-md'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined">arrow_back</span>
                                            Previous
                                        </button>
                                        {activeStep < steps.length - 1 ? (
                                            <button
                                                onClick={() => handleStepChange(activeStep + 1)}
                                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/25 hover:translate-x-1 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 shine-effect"
                                            >
                                                Next Step
                                                <span className="material-symbols-outlined animate-bounce-soft">arrow_forward</span>
                                            </button>
                                        ) : (
                                            <Link
                                                to="/login"
                                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-all duration-300 shadow-lg shadow-green-500/25 hover:scale-105 hover:shadow-xl hover:shadow-green-500/40 shine-effect"
                                            >
                                                Start Now
                                                <span className="material-symbols-outlined animate-bounce-soft">rocket_launch</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Visual Mockup */}
                                <div className="bg-gradient-to-br from-slate-100 to-slate-50 p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
                                    {/* Animated background circles */}
                                    <div className="absolute top-10 left-10 w-32 h-32 rounded-full opacity-10 animate-blob" style={{ backgroundColor: steps[activeStep].color }} />
                                    <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full opacity-10 animate-blob" style={{ backgroundColor: steps[activeStep].color, animationDelay: '2s' }} />

                                    <div className="relative w-full max-w-sm animate-float">
                                        {/* Phone Frame */}
                                        <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl hover:shadow-3xl transition-shadow duration-500 hover:scale-105 transition-transform">
                                            <div className="bg-white rounded-[2rem] overflow-hidden">
                                                {/* Status Bar */}
                                                <div className="bg-slate-900 h-8 flex items-center justify-center">
                                                    <div className="w-20 h-5 bg-black rounded-full" />
                                                </div>
                                                {/* Content */}
                                                <div key={`mockup-${activeStep}`} className="p-4 min-h-[350px]">
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
                                            className="absolute -top-4 -right-4 size-24 rounded-full blur-2xl opacity-50 animate-pulse-soft"
                                            style={{ backgroundColor: steps[activeStep].color }}
                                        />
                                        <div
                                            className="absolute -bottom-4 -left-4 size-32 rounded-full blur-2xl opacity-30 animate-pulse-soft"
                                            style={{ backgroundColor: steps[activeStep].color, animationDelay: '1s' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Tips Section */}
            <section 
                ref={(el) => (sectionRefs.current[0] = el)} 
                data-section="tips"
                className="py-16 px-4 bg-white"
            >
                <div className="max-w-6xl mx-auto">
                    <div className={`text-center mb-12 transition-all duration-700 ${isVisible('tips') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <h2 className="text-3xl font-black mb-4">
                            Pro Tips for{' '}
                            <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Power Users</span>
                        </h2>
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
                            <div 
                                key={idx} 
                                className={`p-6 bg-slate-50 rounded-2xl hover-lift cursor-pointer group transition-all duration-700 ${isVisible('tips') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                                style={{ transitionDelay: `${idx * 0.15}s` }}
                            >
                                <div
                                    className="size-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"
                                    style={{ backgroundColor: `${tip.color}15` }}
                                >
                                    <span className="material-symbols-outlined text-2xl group-hover:animate-bounce-soft" style={{ color: tip.color }}>
                                        {tip.icon}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300">{tip.title}</h3>
                                <p className="text-slate-600 text-sm">{tip.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section 
                ref={(el) => (sectionRefs.current[1] = el)} 
                data-section="cta"
                className="py-20 px-4 bg-gradient-to-br from-primary via-blue-600 to-cyan-500 relative overflow-hidden"
            >
                {/* Animated background elements */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '3s' }} />

                <div className={`max-w-4xl mx-auto text-center relative z-10 transition-all duration-1000 ${isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6 animate-fadeInUp">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                        Join thousands of advocates already using DraftMate to
                        transform their legal practice.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                        <Link to="/login" className="flex items-center gap-2 rounded-xl h-14 px-8 bg-white text-primary text-lg font-bold hover:bg-blue-50 transition-all duration-300 shadow-xl hover:scale-110 hover:shadow-2xl shine-effect">
                            <span className="material-symbols-outlined animate-bounce-soft">rocket_launch</span>
                            Start Free Trial
                        </Link>
                        <Link to="/features" className="flex items-center gap-2 rounded-xl h-14 px-8 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-lg font-bold hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:border-white/60">
                            <span className="material-symbols-outlined">apps</span>
                            View All Features
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer 
                ref={(el) => (sectionRefs.current[2] = el)} 
                data-section="footer"
                className="bg-slate-900 text-white py-12 px-4"
            >
                <div className={`max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-700 ${isVisible('footer') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                    <Link to="/" className="flex items-center gap-3">
                        <div className="h-8 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1 shadow-sm">
                            <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                        </div>
                    </Link>
                    <div className="flex gap-6">
                        <Link to="/" className="text-slate-400 hover:text-white transition-all duration-300 hover:-translate-y-1 inline-block">Home</Link>
                        <Link to="/features" className="text-slate-400 hover:text-white transition-all duration-300 hover:-translate-y-1 inline-block">Features</Link>
                        <Link to="/login" className="text-slate-400 hover:text-white transition-all duration-300 hover:-translate-y-1 inline-block">Login</Link>
                    </div>
                    <p className="text-slate-500 text-sm">© 2024 DraftMate. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default HowItWorks;
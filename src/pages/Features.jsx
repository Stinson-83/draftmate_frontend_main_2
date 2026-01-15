import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import fullLogo from '../assets/FULL_LOGO.svg';

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [isVisible, end, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// Feature card with hover animation
const FeatureCard = ({ icon, title, description, color, delay }) => (
    <div
        className="feature-card group relative bg-white rounded-2xl p-8 border border-slate-100 hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
            style={{ background: `linear-gradient(135deg, ${color}08, ${color}15)` }} />
        <div
            className="size-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
            style={{ background: `linear-gradient(135deg, ${color}15, ${color}25)` }}
        >
            <span className="material-symbols-outlined text-3xl" style={{ color }}>{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
);

// Infographic stat card
const StatCard = ({ icon, value, suffix, label, color }) => (
    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="absolute -top-4 -right-4 size-20 rounded-full opacity-20" style={{ background: color }} />
        <span className="material-symbols-outlined text-4xl mb-4" style={{ color }}>{icon}</span>
        <div className="text-4xl font-black text-slate-900 mb-1">
            <AnimatedCounter end={value} suffix={suffix} />
        </div>
        <p className="text-slate-600 font-medium">{label}</p>
    </div>
);

const Features = () => {
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        document.title = 'Features - DraftMate';
        window.scrollTo(0, 0);
    }, []);

    const mainFeatures = [
        {
            icon: 'edit_document',
            title: 'AI-Powered Legal Drafting',
            description: 'Generate court-ready petitions, agreements, affidavits, and legal notices in seconds. Our AI understands Indian legal context and formats documents according to specific court requirements.',
            color: '#3B82F6'
        },
        {
            icon: 'library_books',
            title: 'Lex Bot Research Assistant',
            description: 'Your personal legal research companion. Ask complex queries about Indian law and get precise answers with verified citations from Supreme Court & High Court judgments.',
            color: '#8B5CF6'
        },
        {
            icon: 'verified',
            title: 'Verified Case Citations',
            description: 'Every citation is real and verified. Our AI is trained to only reference actual judgments from authentic sources, eliminating the risk of hallucinated case laws.',
            color: '#10B981'
        },
        {
            icon: 'picture_as_pdf',
            title: 'Smart PDF Editor',
            description: 'Upload case files, contracts, or judgments and chat with them. Extract summaries, key arguments, and relevant sections instantly with AI-powered document analysis.',
            color: '#F59E0B'
        },
        {
            icon: 'psychology',
            title: 'Personalized Writing Style',
            description: 'The AI learns your unique drafting tone, vocabulary, and preferences over time. Every document sounds like you wrote it, maintaining your professional voice.',
            color: '#EC4899'
        },
        {
            icon: 'calculate',
            title: 'Legal Calculators & Tools',
            description: 'Built-in calculators for Court Fees, Limitation Periods, Interest calculations, and more. All based on current Indian acts and regularly updated.',
            color: '#06B6D4'
        }
    ];

    const detailedFeatures = [
        {
            title: 'Smart AI Drafting',
            icon: 'edit_document',
            description: 'Transform raw case facts into professionally formatted legal documents',
            features: [
                'Support for 50+ document types (Petitions, Plaints, Applications, Agreements)',
                'Auto-formatting for Supreme Court, High Courts & District Courts',
                'Intelligent clause suggestions based on case context',
                'Built-in legal terminology and proper formatting',
                'Voice-to-draft capability for quick input'
            ],
            visual: 'drafting'
        },
        {
            title: 'Lex Bot Research',
            icon: 'smart_toy',
            description: 'Get instant answers with verified citations from Indian case law',
            features: [
                'Natural language legal queries in English or Hindi',
                'Real-time access to SCC, AIR, and other reporters',
                'Contextual understanding of IPC, CrPC, CPC & Constitution',
                'Export research with proper citation format',
                'Deep dive into specific acts and sections'
            ],
            visual: 'research'
        },
        {
            title: 'Document Intelligence',
            icon: 'description',
            description: 'Upload any legal document and extract insights instantly',
            features: [
                'PDF chat - ask questions about uploaded documents',
                'Automatic summarization of lengthy judgments',
                'Key argument and ratio extraction',
                'Cross-reference with relevant case laws',
                'Annotation and highlight capabilities'
            ],
            visual: 'document'
        }
    ];

    return (
        <div className="bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
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
            <section className="relative py-20 lg:py-32 px-4 overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary uppercase tracking-wide mb-8">
                        <span className="material-symbols-outlined text-base">auto_awesome</span>
                        Powerful Features for Modern Advocates
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-6">
                        Everything You Need to<br />
                        <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Modernize Your Practice
                        </span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
                        From AI-powered drafting to verified case research, DraftMate provides
                        a complete toolkit designed specifically for Indian legal professionals.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link to="/login" className="flex items-center gap-2 rounded-xl h-14 px-8 bg-primary text-white text-lg font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5">
                            <span className="material-symbols-outlined">rocket_launch</span>
                            Start Free Trial
                        </Link>
                        <Link to="/how-it-works" className="flex items-center gap-2 rounded-xl h-14 px-8 bg-white border-2 border-slate-200 text-slate-700 text-lg font-bold hover:border-primary hover:text-primary transition-all">
                            <span className="material-symbols-outlined">play_circle</span>
                            See How It Works
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative py-16 px-4">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-purple-600" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0tNC00aC0ydi0yaDJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
                <div className="relative z-10 max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center text-white">
                            <div className="text-4xl md:text-5xl font-black mb-2">
                                <AnimatedCounter end={50} suffix="+" />
                            </div>
                            <p className="text-blue-100 font-medium">Document Types</p>
                        </div>
                        <div className="text-center text-white">
                            <div className="text-4xl md:text-5xl font-black mb-2">
                                <AnimatedCounter end={10000} suffix="+" />
                            </div>
                            <p className="text-blue-100 font-medium">Case Citations</p>
                        </div>
                        <div className="text-center text-white">
                            <div className="text-4xl md:text-5xl font-black mb-2">
                                <AnimatedCounter end={60} suffix="%" />
                            </div>
                            <p className="text-blue-100 font-medium">Time Saved</p>
                        </div>
                        <div className="text-center text-white">
                            <div className="text-4xl md:text-5xl font-black mb-2">
                                <AnimatedCounter end={100} suffix="%" />
                            </div>
                            <p className="text-blue-100 font-medium">Verified Sources</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Features Grid */}
            <section className="py-20 lg:py-28 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black mb-4">Core Features</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Six powerful tools designed to transform how you practice law
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mainFeatures.map((feature, idx) => (
                            <FeatureCard key={idx} {...feature} delay={idx * 100} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Detailed Feature Tabs */}
            <section className="py-20 lg:py-28 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black mb-4">Deep Dive Into Features</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Explore how each feature helps you work smarter
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {detailedFeatures.map((feature, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveTab(idx)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === idx
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <span className="material-symbols-outlined">{feature.icon}</span>
                                {feature.title}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1">
                            <h3 className="text-2xl md:text-3xl font-bold mb-4">
                                {detailedFeatures[activeTab].title}
                            </h3>
                            <p className="text-lg text-slate-600 mb-8">
                                {detailedFeatures[activeTab].description}
                            </p>
                            <ul className="space-y-4">
                                {detailedFeatures[activeTab].features.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
                                        <span className="text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/login" className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                                Try {detailedFeatures[activeTab].title}
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </Link>
                        </div>

                        {/* Visual Mock */}
                        <div className="order-1 lg:order-2">
                            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                    <div className="ml-4 flex-1 h-6 bg-slate-700 rounded text-xs flex items-center px-3 text-slate-400">
                                        draftmate.ai/{detailedFeatures[activeTab].visual}
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg p-6 min-h-[300px]">
                                    {activeTab === 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className="material-symbols-outlined text-primary text-3xl">edit_document</span>
                                                <span className="font-bold text-lg">AI Draft Generator</span>
                                            </div>
                                            <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                                            <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
                                            <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse" />
                                            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                                <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2">
                                                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                                                    AI Suggestion
                                                </div>
                                                <div className="h-3 bg-primary/10 rounded w-full mb-1" />
                                                <div className="h-3 bg-primary/10 rounded w-4/5" />
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 1 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className="material-symbols-outlined text-purple-600 text-3xl">smart_toy</span>
                                                <span className="font-bold text-lg">Lex Bot</span>
                                            </div>
                                            <div className="p-3 bg-slate-100 rounded-lg text-sm text-slate-600">
                                                "What are the grounds for anticipatory bail under CrPC?"
                                            </div>
                                            <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
                                                <p className="text-sm text-slate-700 mb-2">Under Section 438 of CrPC...</p>
                                                <div className="text-xs text-purple-600 font-medium">
                                                    📚 Gurbaksh Singh Sibbia v. State of Punjab (1980)
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 2 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className="material-symbols-outlined text-amber-600 text-3xl">description</span>
                                                <span className="font-bold text-lg">Document Analysis</span>
                                            </div>
                                            <div className="flex items-center justify-center h-20 border-2 border-dashed border-slate-300 rounded-lg text-slate-400">
                                                <span className="material-symbols-outlined mr-2">upload_file</span>
                                                Upload PDF to analyze
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-emerald-50 rounded-lg text-center">
                                                    <span className="material-symbols-outlined text-emerald-600">summarize</span>
                                                    <p className="text-xs font-medium mt-1">Summary</p>
                                                </div>
                                                <div className="p-3 bg-blue-50 rounded-lg text-center">
                                                    <span className="material-symbols-outlined text-blue-600">format_quote</span>
                                                    <p className="text-xs font-medium mt-1">Key Points</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Workflow Infographic */}
            <section className="py-20 lg:py-28 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black mb-4">How It All Works Together</h2>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                            A seamless workflow from facts to filing
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connection line */}
                        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 -translate-y-1/2" />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { step: 1, icon: 'input', title: 'Input Facts', desc: 'Enter case details via text, voice, or file upload', color: '#3B82F6' },
                                { step: 2, icon: 'psychology', title: 'AI Analysis', desc: 'AI identifies relevant laws, sections & precedents', color: '#8B5CF6' },
                                { step: 3, icon: 'edit_document', title: 'Generate Draft', desc: 'Receive formatted document with citations', color: '#F59E0B' },
                                { step: 4, icon: 'download', title: 'Export & File', desc: 'Edit, export to Word/PDF and file in court', color: '#10B981' }
                            ].map((item) => (
                                <div key={item.step} className="relative">
                                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-slate-500 transition-colors">
                                        <div
                                            className="size-16 rounded-2xl flex items-center justify-center mb-4 mx-auto lg:mx-0"
                                            style={{ background: `linear-gradient(135deg, ${item.color}40, ${item.color}20)` }}
                                        >
                                            <span className="material-symbols-outlined text-3xl" style={{ color: item.color }}>{item.icon}</span>
                                        </div>
                                        <div className="absolute -top-3 -left-3 lg:left-auto lg:-top-4 lg:right-4 size-8 rounded-full bg-white text-slate-900 font-black text-sm flex items-center justify-center shadow-lg">
                                            {item.step}
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                        <p className="text-slate-400 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Indian Legal Context */}
            <section className="py-20 lg:py-28 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm mb-4">
                                <span className="w-8 h-0.5 bg-primary" />
                                Made for India
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black mb-6">
                                Built Specifically for<br />Indian Legal Practice
                            </h2>
                            <p className="text-lg text-slate-600 mb-8">
                                Unlike generic AI tools, DraftMate is trained on Indian statutes,
                                case laws, and court procedures. Every feature is designed with
                                the Indian advocate in mind.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { icon: 'account_balance', text: 'IPC, CrPC, CPC & 200+ Indian Acts' },
                                    { icon: 'gavel', text: 'Supreme Court & High Court formatting' },
                                    { icon: 'translate', text: 'Hindi & regional language support' },
                                    { icon: 'verified', text: 'SCC, AIR & authentic reporters' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                                        <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
                                        <span className="font-medium">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl blur-2xl" />
                            <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-3xl">balance</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Indian Legal Database</h4>
                                        <p className="text-slate-500 text-sm">Updated in real-time</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Case Laws Indexed', value: '500K+' },
                                        { label: 'Acts & Amendments', value: '200+' },
                                        { label: 'Court Templates', value: '50+' },
                                        { label: 'Citation Accuracy', value: '100%' }
                                    ].map((stat, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <span className="text-slate-600">{stat.label}</span>
                                            <span className="font-bold text-primary">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Future Roadmap / Coming Soon */}
            <section className="py-24 px-4 bg-slate-900 overflow-hidden relative">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>
                </div>

                <div className="layout-content-container flex flex-col max-w-[1200px] mx-auto gap-16 relative z-10">
                    <div className="flex flex-col gap-4 text-center items-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-blue-300 uppercase tracking-wide backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                            Future Roadmap
                        </div>
                        <h2 className="text-white text-3xl font-black leading-tight lg:text-5xl max-w-[800px]">
                            The Future of Legal Tech <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Is Being Built Here</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-[600px]">
                            We are constantly innovating. Here's what's coming next to DraftMate to make your practice even more powerful.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Feature 1: Advocate Profile */}
                        <div className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-primary/50 hover:to-purple-600/50 transition-all duration-300">
                            <div className="absolute inset-0 bg-slate-900 rounded-2xl m-[1px] z-0"></div>
                            <div className="relative z-10 p-6 flex flex-col h-full gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-2xl">badge</span>
                                    </div>
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-gray-300 uppercase tracking-wider border border-white/5">Coming Soon</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Advocate Profile & Digital Presence</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Premium subscribers get a personalized SEO-optimized profile page. Showcase your expertise, areas of practice, and contact details like a digital visiting card.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2: Real-Time Sharing */}
                        <div className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-primary/50 hover:to-purple-600/50 transition-all duration-300">
                            <div className="absolute inset-0 bg-slate-900 rounded-2xl m-[1px] z-0"></div>
                            <div className="relative z-10 p-6 flex flex-col h-full gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="size-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-2xl">share</span>
                                    </div>
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-gray-300 uppercase tracking-wider border border-white/5">Coming Soon</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Real-Time Document Sharing</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Securely share live drafts with colleagues or clients for review. Collaborate vertically with ease and maintain version control automatically.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3: AI Voice Agent */}
                        <div className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-primary/50 hover:to-purple-600/50 transition-all duration-300">
                            <div className="absolute inset-0 bg-slate-900 rounded-2xl m-[1px] z-0"></div>
                            <div className="relative z-10 p-6 flex flex-col h-full gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="size-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-2xl">record_voice_over</span>
                                    </div>
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-gray-300 uppercase tracking-wider border border-white/5">Coming Soon</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">AI Voice Agent (Judge Mode)</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Practice your arguments with an AI that simulates a Judge. It listens to your voice arguments and counters with legal queries to help you prepare.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 4: E-Courts & Case Tracker */}
                        <div className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-primary/50 hover:to-purple-600/50 transition-all duration-300">
                            <div className="absolute inset-0 bg-slate-900 rounded-2xl m-[1px] z-0"></div>
                            <div className="relative z-10 p-6 flex flex-col h-full gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-2xl">gavel</span>
                                    </div>
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-gray-300 uppercase tracking-wider border border-white/5">Coming Soon</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">E-Courts Integration</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Direct access to E-Courts services. Track case status, next hearing dates, and orders for all your running cases in one dashboard.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 5: Multi-Language */}
                        <div className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-primary/50 hover:to-purple-600/50 transition-all duration-300">
                            <div className="absolute inset-0 bg-slate-900 rounded-2xl m-[1px] z-0"></div>
                            <div className="relative z-10 p-6 flex flex-col h-full gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="size-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-2xl">translate</span>
                                    </div>
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-gray-300 uppercase tracking-wider border border-white/5">Coming Soon</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Multi-Language Translations</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Draft in English and instantly translate to Hindi, Marathi, Tamil, and other regional languages for district court filings.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Feature 6: Built-in Library */}
                        <div className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 hover:from-primary/50 hover:to-purple-600/50 transition-all duration-300">
                            <div className="absolute inset-0 bg-slate-900 rounded-2xl m-[1px] z-0"></div>
                            <div className="relative z-10 p-6 flex flex-col h-full gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="size-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-2xl">library_books</span>
                                    </div>
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-gray-300 uppercase tracking-wider border border-white/5">Coming Soon</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Smart Legal Library</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        A centralized repository of verified court templates, bare acts, and legal maxims available at your fingertips while drafting.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 bg-gradient-to-br from-primary via-blue-600 to-purple-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0tNC00aC0ydi0yaDJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6">
                        Ready to Transform Your Practice?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        Join thousands of advocates who are drafting faster, researching smarter,
                        and delivering better results for their clients.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link to="/login" className="flex items-center gap-2 rounded-xl h-14 px-8 bg-white text-primary text-lg font-bold hover:bg-blue-50 transition-colors shadow-xl">
                            <span className="material-symbols-outlined">rocket_launch</span>
                            Start Free Trial
                        </Link>
                        <Link to="/how-it-works" className="flex items-center gap-2 rounded-xl h-14 px-8 bg-white/10 backdrop-blur-sm border border-white/30 text-white text-lg font-bold hover:bg-white/20 transition-colors">
                            <span className="material-symbols-outlined">play_circle</span>
                            Watch Demo
                        </Link>
                    </div>
                    <p className="text-blue-200 text-sm mt-6">
                        No credit card required • 7-day free trial • Cancel anytime
                    </p>
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
                        <Link to="/how-it-works" className="text-slate-400 hover:text-white transition-colors">How It Works</Link>
                        <Link to="/login" className="text-slate-400 hover:text-white transition-colors">Login</Link>
                    </div>
                    <p className="text-slate-500 text-sm">© 2024 DraftMate. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Features;

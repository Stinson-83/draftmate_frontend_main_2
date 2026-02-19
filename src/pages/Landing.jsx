import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import fullLogo from '../assets/FULL_LOGO.svg';
import draftMateIcon from '../assets/draftmate_logo.png';
import startupIndiaLogo from '../assets/startup_india_logo.png';

import inshortsLogo from '../assets/india_shorts.png';
import Business_UpurnLogo from '../assets/Business_Upurn.png';
import Karo_StraupLogo from '../assets/Karo_Straup.webp';
import Vie_SoriesLogo from '../assets/Vie_Sories.webp';
import Karnataka_News_NetworkLogo from '../assets/Karnataka_News_Network.png';
import India_Wire_NewsLogo from '../assets/India_Wire_News.png';
import Business_News_Logo from '../assets/businessnewsthisweek.png';
import SecurityDraftmate from '../components/SecurityDraftmate';

// Partner Logos
import LawJuristLogo from '../assets/partner_logos/LAW_JURIST.webp';
import ChristUniversityLogo from '../assets/partner_logos/christ_university.png';
import ImsUnisonLogo from '../assets/partner_logos/ims_unison.png';
import KesjpLawCollegeLogo from '../assets/partner_logos/kesjplaw_college.png';
import LegalVidyaLogo from '../assets/partner_logos/legal_vidya.webp';
import SxccalLogo from '../assets/partner_logos/sxccal.png';

import Abhiniti_Vats from '../assets/avatars/Abhiniti_Vats.png';
import Prathana_Prakash from '../assets/avatars/Prathana_Prakash.png';
import Nidhi_Sharma from '../assets/avatars/Nidhi_Sharma.png';
import Palak_Roy from '../assets/avatars/Palak_Roy.png';
import Jaineesh_V_Maharajwala from '../assets/avatars/Jaineesh_V_Maharajwala.png';
import Ananya_Sharma from '../assets/avatars/Ananya_Sharma.png';
import Yashaswi_Agrawal from '../assets/avatars/Yashaswi_Agrawal.png';
import Aastha_Verma from '../assets/avatars/Aastha_Verma.png';
import Pratyush_Sharma from '../assets/avatars/Pratyush_Sharma.png';
import Abhinav_Jain from '../assets/avatars/Abhinav_Jain.png';
import Kumar_Abhishek from '../assets/avatars/Kumar_Abhishek.png';
import Rohil_Rai from '../assets/avatars/Rohil_Rai.png';
import Subhradeep_Das from '../assets/avatars/Subhradeep_Das.png';
import Manvi_Priya from '../assets/avatars/Manvi_Priya.png';
import Shubham_Ranjan_Sharma from '../assets/avatars/Shubham_Ranjan_Sharma.png';
import Pavan_Kumar from '../assets/avatars/Pavan_Kumar.png';
import Kushagra_Sahi from '../assets/avatars/Kushagra_Sahi.png';
import P_Mahima from '../assets/avatars/P_Mahima.png';

const Landing = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        document.title = 'DraftMate';
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setMobileMenuOpen(false);
    };

    const testimonials = [
        {
            text: "\"I’ve been using Draftmate.in as my go-to legal drafting assistant, and it has genuinely changed how I work. It isn’t just another generic AI tool. It understands Indian law context, legal formats, citation norms, and courtroom standards, and delivers clear, structured, court-ready drafts that are actually workable in practice. It significantly cuts down drafting time and allows me to focus more on arguments and strategy rather than repetitive paperwork. A very practical tool for everyday legal practice..\"",
            name: "Abhiniti Vats",
            role: "Advocate, Patna High Court",
            image: Abhiniti_Vats
        },
        {
            text: "\"DraftMate offers a well-structured and practical legal-tech solution tailored for advocates and legal professionals. The AI-powered drafting and Lex Bot research assistant are particularly useful, providing relevant content with authentic case law references. Features like personalised drafting style, Chat with PDF, built-in PDF editing tools, and legal calculators enhance efficiency in day-to-day legal work.\"",
            name: "Prathana Prakash",
            role: "Associate at Deepak kohli & associates",
            image: Prathana_Prakash
        },
        {
            text: "\"I have been using DraftMate for the past few weeks, and it has significantly improved my drafting and research workflow. The AI-powered drafting feature and case law summarisation are extremely helpful and save a lot of time. Lex Bot provides quick and relevant legal research support, making day-to-day legal work much more efficient. Overall, DraftMate is a reliable and well-designed tool for legal professionals.\"",
            name: "Nidhi Sharma",
            role: "Advocate,  District court Hapur",
            image: Nidhi_Sharma
        },
        {
            text: "\"This app is a highly useful and time-saving app, especially for law students, fresh advocates, and legal professionals. The app offers well-structured legal drafts that help simplify complex legal work and make drafting more efficient. What stands out most is its user-friendly interface and clear formatting, which makes it easy to understand and customize drafts as per individual requirements. Whether you’re preparing notices, applications, or basic pleadings, Draftmade acts as a reliable guide and boosts confidence in legal drafting.\"",
            name: "Palak Roy",
            role: "Advocate,  Patna High Court",
            image: Palak_Roy
        },
        {
            text: "\"DraftMate makes legal research and drafting much easier. It pulls up relevant case laws quickly and helps with clean, usable drafts, which saves a lot of time in day-to-day legal work. The platform is simple to use and feels genuinely helpful for practical legal work.\"",
            name: "Jaineesh V Maharajwala",
            role: "Advocate,  Surat District Court   ",
            image: Jaineesh_V_Maharajwala
        },
        {
            text: "\"As a fresh law graduate now practicing independently before the Punjab and Haryana High Court with a senior Advocate, DraftMate.in has been my secret weapon for creating professional legal drafts. Its AI-powered templates, tailored to Indian laws, especially the new criminal laws let me produce  pleadings quickly and confidently. This platform is perfect for building client base on a tight budget, with an intuitive interface that feels like having a senior mentor.\"",
            name: "Ananya Sharma",
            role: "Advocate,  Punjab & Haryana High Court",
            image: Ananya_Sharma
        },
        {
            text: "\"Draftmate is a very helpful tool. Have used the legal calculator, drafting and pdf editor feature. Till Now, I am highly impressed with the results it provides and am going to use it further for my aid. It's a reliable tool.\"",
            name: "Yashaswi Agrawal",
            role: "Advocate,  Supreme Court",
            image: Yashaswi_Agrawal
        },
        {
            text: "\"As an Advocate, I have found DraftMate to be really helpful for legal research and reference work. It provides relevant case laws with correct citations and is also very effective in giving clear case summaries. It can also help with drafting by offering clean templates and a basic framework, which makes things easier. Overall, it’s a handy tool to have in the legal field.\"",
            name: "Aastha Verma",
            role: "Advocate, Delhi High Court",
            image: Aastha_Verma
        },
        {
            text: "\"Draft mate is an impressive AI-powered platform that significantly enhances efficiency in legal work. It assists in drafting, reviewing, and structuring legal documents with remarkable accuracy and clarity, saving valuable time for legal professionals. The platform understands legal language and context well, making it a reliable support tool for research, pleadings, agreements, and routine drafting tasks. Draftmade is especially useful for advocates, law firms, and law students who want to streamline their workflow without compromising on quality. Overall, it is a smart, practical, and time-saving AI solution for the modern legal ecosystem. \"",
            name: "Pratyush Sharma",
            role: "Advocate,    Patna High Court",
            image: Pratyush_Sharma
        },
        {
            text: "\"I have been using Draftmate for some time now and found it insightfully helpfull.\"",
            name: "Abhinav Jain",
            role: "Advocate,  Supreme Court of India",
            image: Abhinav_Jain
        },
        {
            text: "\"I have been using Draftmate consistently for the past five weeks, and I find it efficient, reliable, easy to use, and highly recommended.\"",
            name: "Kumar Abhishek",
            role: "Advocate,   Delhi High Court",
            image: Kumar_Abhishek
        },
        {
            text: "\"What stands out is how the software recognizes jurisdictional nuances. It doesn't just suggest standard clauses; it flags when a provision might be unenforceable under specific state or regional laws, which feels less like a 'search tool' and more like a seasoned peer review.\"",
            name: "Rohil Rai",
            role: "Advocate, Delhi High Court",
            image: Rohil_Rai
        },
        {
            text: "\"DraftMate is an extremely useful tool, especially when working with limited time and resources. The drafts it generates are high quality, well-structured, and supported by real legal precedents. It also provides accurate and practical responses to queries related to legal procedures and laws. Overall, it is a reliable time-saver that significantly improves efficiency.\"",
            name: "Subhradeep Das",
            role: "Associate, Alphastream ai",
            image: Subhradeep_Das
        },
        {
            text: "\"I’ve been using this for over a month now, and I’m genuinely impressed by how effectively it handles summarisation along with its seamless automatic drafting capabilities.\"",
            name: "Manvi Priya",
            role: "Advocate,  Delhi High Court",
            image: Manvi_Priya
        },
        {
            text: "\"Draftmate is proving to be a quintessential tool in my legal endeavours, genuinely a life saver.\"",
            name: "Shubham Ranjan Sharma",
            role: "Advocate, Delhi High Court",
            image: Shubham_Ranjan_Sharma
        },
        {
            text: "\"The website is very helpful for daily work and keeps a tab on events. Overall great experience and hope to see many new features being added in\"",
            name: "Pavan Kumar",
            role: "Advocate,  Delhi High Court ",
            image: Pavan_Kumar
        },
        {
            text: "\"DraftMate is a practical and dependable platform for legal research and drafting. It provides streamlined access to relevant legal judgments, enabling quick and effective case law analysis. The drafting features are thoughtfully structured and aligned with real-world legal practice, making document preparation efficient and accurate. Overall, DraftMate is a well-designed tool that meaningfully supports the day-to-day needs of legal professionals and students.\"",
            name: "Kushagra Sahi",
            role: "Advocate Patna High Court",
            image: Kushagra_Sahi
        },
        {
            text: "\"DraftMate has been really helpful in my day-to-day legal work and studies. The drafting is quick and accurate, case law citations are reliable, and Lex Bot makes research much easier. Features like chat with PDF and personalised formats save a lot of time. Overall, it’s a practical tool for busy advocates as well as law students.\"",
            name: "P Mahima",
            role: " Advocate, High Court of Karnataka",
            image: P_Mahima
        }
    ];

    return (
        <div className="bg-slate-50 dark:bg-[#101622] text-[#111318] font-sans overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] bg-white/95 backdrop-blur-sm px-6 py-3 lg:px-40">
                <Link to="/" className="flex items-center gap-4 text-[#111318]">
                    <div className="h-12 flex items-center justify-center hover:opacity-80 transition-opacity">
                        <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                    </div>
                </Link>
                <div className="hidden lg:flex flex-1 justify-end gap-8">
                    <div className="flex items-center gap-9">
                        <a href="https://lawjurist.com/" target="_blank" rel="noopener noreferrer" className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer">Law Jurist</a>
                        <Link to="/features" className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors">Features</Link>
                        <Link to="/blogs" className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors">Blogs</Link>
                        <button onClick={() => scrollToSection('testimonials')} className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer">About</button>
                        <a className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer">Pricing</a>
                        <Link to="/faqs" className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors">FAQs</Link>
                        <Link to="/how-it-works" className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors">How it Works</Link>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/login" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                            <span className="truncate">Start Drafting</span>
                        </Link>
                        <Link to="/login" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#f0f2f4] text-[#111318] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#e0e2e4] transition-colors">
                            <span className="truncate">Login</span>
                        </Link>
                    </div>
                </div>
                <button
                    className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
                </button>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
                    <div
                        className="absolute top-0 right-0 w-80 h-full bg-white shadow-2xl transform transition-transform duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                                    <img src={fullLogo} alt="DraftMate" className="h-10 object-contain" />
                                </Link>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <nav className="flex flex-col gap-4">
                                <a
                                    href="https://lawjurist.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 text-[#111318] font-medium hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined">gavel</span>
                                    Law Jurist
                                    <span className="material-symbols-outlined text-sm ml-auto">open_in_new</span>
                                </a>
                                <Link
                                    to="/features"
                                    className="flex items-center gap-3 p-3 text-[#111318] font-medium hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    Features
                                </Link>
                                <Link
                                    to="/blogs"
                                    className="flex items-center gap-3 p-3 text-[#111318] font-medium hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="material-symbols-outlined">article</span>
                                    Blogs
                                </Link>
                                <button
                                    onClick={() => scrollToSection('testimonials')}
                                    className="flex items-center gap-3 p-3 text-[#111318] font-medium hover:bg-primary/5 hover:text-primary rounded-lg transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined">info</span>
                                    About
                                </button>
                                <a className="flex items-center gap-3 p-3 text-[#111318] font-medium hover:bg-primary/5 hover:text-primary rounded-lg transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined">sell</span>
                                    Pricing
                                </a>
                                <Link
                                    to="/how-it-works"
                                    className="flex items-center gap-3 p-3 text-[#111318] font-medium hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="material-symbols-outlined">school</span>
                                    How it Works
                                </Link>
                            </nav>
                            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col gap-3">
                                <Link
                                    to="/login"
                                    className="flex items-center justify-center h-12 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Start Drafting
                                </Link>
                                <Link
                                    to="/login"
                                    className="flex items-center justify-center h-12 px-6 bg-slate-100 text-[#111318] font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center py-16 lg:py-24 px-4 bg-white overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#135bec 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                <div className="layout-content-container flex flex-col max-w-[960px] w-full gap-12 z-10">
                    <div className="flex flex-col gap-6 text-center items-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wide">
                            <span className="material-symbols-outlined text-sm">rocket_launch</span>
                            New: Supreme Court Style Formatting
                        </div>
                        <h1 className="text-[#111318] text-4xl font-black leading-tight tracking-[-0.033em] lg:text-6xl max-w-[800px]">
                            Draft Court-Ready Legal Documents in <span className="text-primary">Minutes with AI</span>
                        </h1>
                        <h2 className="text-[#616f89] text-lg font-normal leading-relaxed lg:text-xl max-w-[700px]">
                            India’s Smart Legal Drafting & Research Assistant for Advocates. Save hours on research and formatting with verified citations.
                        </h2>
                        <div className="flex flex-wrap gap-3 justify-center pt-4">
                            <Link to="/login" className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-all shadow-lg shadow-primary/30">
                                Start Drafting
                            </Link>
                            <button className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-white border border-[#dbdfe6] text-[#111318] text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#f8faff] transition-colors">
                                Book a Demo
                            </button>
                        </div>
                    </div>

                    {/* Hero Image/Preview */}
                    <div className="relative w-full aspect-[16/9] lg:aspect-[2/1] rounded-xl overflow-hidden shadow-2xl border border-[#f0f2f4] bg-white group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                        <div className="w-full h-full bg-[#f8faff] flex flex-col">
                            <div className="h-10 border-b flex items-center px-4 gap-2 bg-white">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <div className="ml-4 h-6 w-64 bg-slate-100 rounded text-xs flex items-center px-2 text-slate-400">draftmate.in/editor/</div>
                            </div>
                            <div className="flex-1 flex overflow-hidden bg-white">
                                <video
                                    src="/video.mp4"
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured In */}
            <section className="bg-white pb-12 pt-6 px-4 lg:px-40">
                <div className="flex flex-col items-center gap-8 max-w-[960px] mx-auto">
                    <h3 className="text-[#616f89] text-xl font-serif text-center">We've been featured in</h3>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 w-full opacity-70">
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <img src={inshortsLogo} alt="Inshorts" className="h-full object-contain" />
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <img src={Business_UpurnLogo} alt="Business Uppurn" className="h-full object-contain" />
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <img src={Karo_StraupLogo} alt="Karo Startup" className="h-full object-contain" />
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <img src={Vie_SoriesLogo} alt="Vie Stories" className="h-full object-contain" />
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <img src={Karnataka_News_NetworkLogo} alt="Karnataka News Network" className="h-full object-contain" />
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <img src={India_Wire_NewsLogo} alt="India Wire News" className="h-full object-contain" />
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <img src={Business_News_Logo} alt="Business News This Week" className="h-full object-contain" />
                        </div>

                        {/* 
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">school</span>
                            <span className="text-xl font-bold text-blue-600">shiksha</span>
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">public</span>
                            <span className="text-xl font-bold text-slate-700">OECD<span className="text-blue-500">.AI</span></span>
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">trending_up</span>
                            <span className="text-xl font-bold text-emerald-500">Groww</span>
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">rss_feed</span>
                            <span className="text-xl font-bold bg-black text-white px-1 rounded-sm">Bb</span>
                        </div> */}
                    </div>
                </div>
            </section>

            {/* Indian Legal Standards */}
            <section className="border-y border-[#f0f2f4] bg-white py-12">
                <div className="flex flex-col items-center gap-8 px-4 lg:px-40">
                    <h3 className="text-[#616f89] text-sm font-bold uppercase tracking-wider">Built Specifically For Indian Legal Standards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-[960px]">
                        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#f8faff] transition-colors">
                            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary shrink-0">
                                <span className="material-symbols-outlined">account_balance</span>
                            </div>
                            <div>
                                <h4 className="text-[#111318] text-lg font-bold">Indian Context</h4>
                                <p className="text-[#616f89] text-sm mt-1">Trained on IPC, CRPC, CPC & Indian Constitution.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#f8faff] transition-colors">
                            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary shrink-0">
                                <span className="material-symbols-outlined">verified</span>
                            </div>
                            <div>
                                <h4 className="text-[#111318] text-lg font-bold">Verified Citations</h4>
                                <p className="text-[#616f89] text-sm mt-1">Real-time links to Supreme Court & High Court judgments.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#f8faff] transition-colors">
                            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary shrink-0">
                                <span className="material-symbols-outlined">check_circle</span>
                            </div>
                            <div>
                                <h4 className="text-[#111318] text-lg font-bold">Zero Hallucinations</h4>
                                <p className="text-[#616f89] text-sm mt-1">Strict guardrails ensure no fake cases are invented.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 lg:px-40 bg-slate-50 dark:bg-[#101622]">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12">
                    <div className="flex flex-col gap-4 text-center">
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">Everything you need to modernize your practice</h2>
                        <p className="text-[#616f89] text-lg max-w-[600px] mx-auto">From research to filing, DraftMate acts as your intelligent digital junior.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: 'edit_document', title: 'Smart AI Legal Drafting', desc: 'Generate petitions, agreements, and notices in seconds tailored to your specific case facts.' },
                            { icon: 'library_books', title: 'Lex Bot Research', desc: 'Your personal research assistant. Ask complex legal queries and get precise answers with sources.' },
                            { icon: 'gavel', title: 'Authentic Case Laws', desc: 'Access a massive database of judgments. Only verified citations, ensuring total reliability.' },
                            { icon: 'picture_as_pdf', title: 'Chat with PDF', desc: 'Upload bulky case files or judgments and chat with them to extract summaries and key points instantly.' },
                            { icon: 'style', title: 'Personalized Style', desc: 'The AI learns your drafting tone and vocabulary over time, making every document sound like you wrote it.' },
                            { icon: 'calculate', title: 'Legal Calculators', desc: 'Built-in tools for Court Fees, Limitation periods, and Interest calculations based on Indian acts.' }
                        ].map((feature, idx) => (
                            <div key={idx} className="group flex flex-col gap-4 p-6 rounded-xl bg-white border border-[#f0f2f4] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">{feature.icon}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[#111318] text-xl font-bold">{feature.title}</h3>
                                    <p className="text-[#616f89] text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="py-20 px-4 lg:px-40 bg-white border-y border-[#f0f2f4]">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12">
                    <div className="flex flex-col gap-4 text-center">
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">Why DraftMate is Better than Generic AI</h2>
                        <p className="text-[#616f89] text-lg max-w-[600px] mx-auto">Specialized legal intelligence vs. general purpose chat.</p>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-[#f0f2f4] shadow-sm">
                        <table className="w-full text-left bg-white">
                            <thead className="bg-[#f8faff] border-b border-[#f0f2f4]">
                                <tr>
                                    <th className="py-5 px-6 text-sm font-bold text-[#616f89] uppercase tracking-wider w-1/3">Feature</th>
                                    <th className="py-5 px-6 text-lg font-bold text-[#111318] w-1/3">Generic AI (ChatGPT)</th>
                                    <th className="py-5 px-6 text-lg font-bold text-primary w-1/3 flex items-center gap-2">
                                        DraftMate
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                            Specialized
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f2f4]">
                                {[
                                    { feature: 'Indian Case Law Knowledge', generic: 'Limited, often outdated', draftmate: 'Real-time & Verified' },
                                    { feature: 'Citation Accuracy', generic: 'High risk of hallucinations', draftmate: '100% Verified Sources' },
                                    { feature: 'Document Formatting', generic: 'Plain text, needs reformatting', draftmate: 'Court-Ready Templates' },
                                    { feature: 'Data Privacy', generic: 'Data used for training', draftmate: 'Encrypted & Private Vault' },
                                    { feature: 'Legal Tone Customization', generic: 'Generic, robotic tone', draftmate: 'Learns Your Style' }
                                ].map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="py-4 px-6 text-[#111318] font-medium">{row.feature}</td>
                                        <td className="py-4 px-6 text-[#616f89]">{row.generic}</td>
                                        <td className="py-4 px-6 text-[#111318] font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-500">check_circle</span> {row.draftmate}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* See DraftMate in Action */}
            <section className="py-20 px-4 lg:px-40 bg-background-light dark:bg-background-dark">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12 items-center">
                    <div className="flex flex-col gap-4 text-center">
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">See DraftMate in Action</h2>
                        <p className="text-[#616f89] text-lg max-w-[600px] mx-auto">Watch how easy it is to draft a petition in under 5 minutes.</p>
                    </div>
                    <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#f0f2f4] bg-black relative group">
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/E41ONA1AmBw"
                            title="DraftMate in Action"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </section>

            {/* From Facts to Filing */}
            <section className="py-20 px-4 lg:px-40 bg-white">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12">
                    <h2 className="text-[#111318] text-3xl font-black leading-tight text-center lg:text-4xl">From Facts to Filing in 4 Steps</h2>
                    <div className="relative flex flex-col md:flex-row justify-between items-start w-full gap-8 md:gap-4">
                        <div className="absolute top-6 left-6 md:left-0 md:top-6 w-[2px] h-full md:w-full md:h-[2px] bg-[#f0f2f4] -z-10"></div>
                        <div className="flex md:flex-col items-center md:items-start gap-6 md:gap-4 flex-1">
                            <div className="size-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-primary/30 shrink-0">1</div>
                            <div className="bg-white md:bg-transparent pr-4 md:pr-0">
                                <h4 className="text-[#111318] text-lg font-bold">Enter Case Facts</h4>
                                <p className="text-[#616f89] text-sm mt-1">Input raw details, upload voice notes, or paste client emails.</p>
                            </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-start gap-6 md:gap-4 flex-1">
                            <div className="size-12 rounded-full bg-white border-2 border-primary text-primary flex items-center justify-center text-lg font-bold shrink-0">2</div>
                            <div className="bg-white md:bg-transparent pr-4 md:pr-0">
                                <h4 className="text-[#111318] text-lg font-bold">AI Analysis</h4>
                                <p className="text-[#616f89] text-sm mt-1">DraftMate finds relevant acts, sections, and precedents.</p>
                            </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-start gap-6 md:gap-4 flex-1">
                            <div className="size-12 rounded-full bg-white border-2 border-[#dbdfe6] text-[#616f89] flex items-center justify-center text-lg font-bold shrink-0">3</div>
                            <div className="bg-white md:bg-transparent pr-4 md:pr-0">
                                <h4 className="text-[#111318] text-lg font-bold">Draft Generated</h4>
                                <p className="text-[#616f89] text-sm mt-1">Get a comprehensive first draft in proper court format.</p>
                            </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-start gap-6 md:gap-4 flex-1">
                            <div className="size-12 rounded-full bg-white border-2 border-[#dbdfe6] text-[#616f89] flex items-center justify-center text-lg font-bold shrink-0">4</div>
                            <div className="bg-white md:bg-transparent pr-4 md:pr-0">
                                <h4 className="text-[#111318] text-lg font-bold">Edit & Export</h4>
                                <p className="text-[#616f89] text-sm mt-1">Fine-tune the content, export to Word/PDF, and file.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Digital Junior Advocate */}
            <section className="py-20 px-4 lg:px-40 bg-background-light dark:bg-background-dark">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12">
                    <div className="flex flex-col gap-4 text-center">
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">Not Just AI. Your Digital Junior Advocate.</h2>
                    </div>
                    <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-sm border border-[#f0f2f4]">
                        <div className="flex-1 bg-white p-8 border-b md:border-b-0 md:border-r border-[#f0f2f4]">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-gray-400 text-3xl">hourglass_empty</span>
                                <h3 className="text-xl font-bold text-gray-500">Traditional Drafting</h3>
                            </div>
                            <ul className="flex flex-col gap-4">
                                <li className="flex gap-3 text-[#616f89]">
                                    <span className="material-symbols-outlined text-red-400">close</span>
                                    <span>Hours spent researching case laws manually.</span>
                                </li>
                                <li className="flex gap-3 text-[#616f89]">
                                    <span className="material-symbols-outlined text-red-400">close</span>
                                    <span>Repetitive typing of standard formats.</span>
                                </li>
                                <li className="flex gap-3 text-[#616f89]">
                                    <span className="material-symbols-outlined text-red-400">close</span>
                                    <span>Risk of missing recent amendments.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 bg-gradient-to-br from-blue-50 to-white p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-primary text-white text-xs font-bold rounded-bl-lg">RECOMMENDED</div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary text-3xl">speed</span>
                                <h3 className="text-xl font-bold text-primary">With DraftMate</h3>
                            </div>
                            <ul className="flex flex-col gap-4">
                                <li className="flex gap-3 text-[#111318]">
                                    <span className="material-symbols-outlined text-green-500">check</span>
                                    <span className="font-medium">Instant research with relevant citations.</span>
                                </li>
                                <li className="flex gap-3 text-[#111318]">
                                    <span className="material-symbols-outlined text-green-500">check</span>
                                    <span className="font-medium">Auto-formatted templates for every court.</span>
                                </li>
                                <li className="flex gap-3 text-[#111318]">
                                    <span className="material-symbols-outlined text-green-500">check</span>
                                    <span className="font-medium">Always updated with latest laws.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Digital Profile */}
            <section className="py-20 px-4 lg:px-40 bg-white">
                <div className="layout-content-container flex flex-col lg:flex-row items-center max-w-[960px] mx-auto gap-12">
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm">
                            <span className="w-8 h-[2px] bg-primary"></span>
                            Digital Presence
                        </div>
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">Showcase Your Expertise with a Digital Profile</h2>
                        <p className="text-[#616f89] text-lg">
                            Every DraftMate subscription includes a premium public profile. Share your digital visiting card, highlight your areas of practice, and let clients discover you easily.
                        </p>
                        <button className="w-fit flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-white border border-[#dbdfe6] text-[#111318] text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#f8faff] transition-colors">
                            View Sample Profile
                        </button>
                    </div>
                    <div className="flex-1 w-full flex justify-center lg:justify-end">
                        <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-xl overflow-hidden border border-[#f0f2f4] hover:shadow-2xl transition-shadow duration-500">
                            <div className="h-24 bg-gradient-to-r from-primary to-blue-600 relative"></div>
                            <div className="px-6 pb-6 -mt-12 flex flex-col items-center text-center">
                                <div className="size-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden" data-alt="Portrait of an Indian Advocate in professional attire">
                                    <img alt="Advocate Portrait" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDingvAZZEdxxo8SsCLy-QfkJsniZjVY1Xv1VCZtLpC8yFGsKg4BMKDU6p-GLrPQ0djboAgRIZIInLcWC7vmUmKL9Q_vn5MBVj3h1lWhGSj-D_nNRoa3YTHZ_uuRDMnVsQyJGtYPrDerOi4VW5nRAr2CIio6UQRmoPZcINhqIotGqtux6Gi8A22K98MzwIdnZzs4kxVwMHp1hfR8TjoOusPr0PFuM1X9UwCKLk6ePqSFw8whhDJwb36IK9xuHsJGJWe8PxZZ-OBAkg9" />
                                </div>
                                <h3 className="mt-4 text-xl font-bold text-[#111318]">Adv. Rajesh Kumar</h3>
                                <p className="text-sm text-[#616f89]">Supreme Court of India • 15 Years Exp.</p>
                                <div className="flex gap-2 mt-4 w-full justify-center">
                                    <span className="px-3 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full">Civil Law</span>
                                    <span className="px-3 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full">Corporate</span>
                                    <span className="px-3 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full">Cyber</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                    <button className="flex items-center justify-center gap-2 h-10 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90">
                                        <span className="material-symbols-outlined text-base">call</span> Contact
                                    </button>
                                    <button className="flex items-center justify-center gap-2 h-10 bg-[#f0f2f4] text-[#111318] text-sm font-bold rounded-lg hover:bg-[#e0e2e4]">
                                        <span className="material-symbols-outlined text-base">share</span> Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-20 bg-background-light dark:bg-background-dark border-t border-[#f0f2f4] overflow-hidden">
                <div className="flex flex-col gap-12">
                    <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-4 text-center px-4 lg:px-40">
                        <div className="inline-flex items-center justify-center gap-2 text-primary font-bold uppercase tracking-wider text-sm">
                            <span className="w-8 h-[2px] bg-primary"></span>
                            User Feedback
                            <span className="w-8 h-[2px] bg-primary"></span>
                        </div>
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">Trusted by Advocates Across India</h2>
                        <p className="text-[#616f89] text-lg max-w-[600px] mx-auto">See how DraftMate is transforming legal practices from District Courts to the Supreme Court.</p>
                    </div>
                    <div className="w-full relative mask-linear-fade">
                        <div className="animate-scroll flex w-max hover:pause pl-4">
                            {[...testimonials, ...testimonials].map((testimonial, idx) => (
                                <div key={idx} className="flex flex-row bg-white rounded-xl border border-[#f0f2f4] shadow-sm w-[400px] h-[280px] mr-6 overflow-hidden group hover:shadow-md transition-all duration-300">
                                    <div className="flex-1 p-5 flex flex-col relative">
                                        <div className="mb-3 text-left">
                                            <h4 className="text-[#111318] text-lg font-bold">{testimonial.name}</h4>
                                            <p className="text-[#616f89] text-sm font-medium">{testimonial.role}</p>
                                        </div>
                                        <div className="flex-1 flex items-center">
                                            <p className="text-[#111318] text-sm leading-relaxed italic text-left line-clamp-[8]">"{testimonial.text}"</p>
                                        </div>
                                    </div>
                                    <div className="w-[140px] h-full relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent z-10"></div>
                                        <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover object-top" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted Partners */}
            < section className="py-20 px-4 lg:px-40 bg-white border-t border-[#f0f2f4]" >
                <div className="layout-content-container flex flex-col max-w-7xl mx-auto gap-8 items-center">
                    <h3 className="text-[#616f89] text-sm font-bold uppercase tracking-wider text-center">Our Trusted Partners</h3>
                    <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 opacity-60">
                        <img src={LawJuristLogo} alt="Law Jurist" className="h-12 w-auto grayscale hover:grayscale-0 transition-all cursor-pointer object-contain" />
                        <img src={ChristUniversityLogo} alt="Christ University" className="h-16 w-auto grayscale hover:grayscale-0 transition-all cursor-pointer object-contain" />
                        <img src={ImsUnisonLogo} alt="IMS Unison University" className="h-16 w-auto grayscale hover:grayscale-0 transition-all cursor-pointer object-contain" />
                        <img src={KesjpLawCollegeLogo} alt="KES' Shri Jayantilal H. Patel Law College" className="h-16 w-auto grayscale hover:grayscale-0 transition-all cursor-pointer object-contain" />
                        <img src={LegalVidyaLogo} alt="Legal Vidya" className="h-12 w-auto grayscale hover:grayscale-0 transition-all cursor-pointer object-contain" />
                        <img src={SxccalLogo} alt="St. Xavier's College" className="h-16 w-auto grayscale hover:grayscale-0 transition-all cursor-pointer object-contain" />
                    </div>
                    <SecurityDraftmate />
                </div>
            </section >

            {/* Future Roadmap / Coming Soon */}
            < section className="py-24 px-4 lg:px-40 bg-slate-900 overflow-hidden relative" >
                {/* Background Effects */}
                < div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" >
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>
                </div >

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
            </section >

            {/* CTA Section */}
            < section className="py-24 px-4 bg-primary relative overflow-hidden" >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col items-center text-center max-w-[800px] mx-auto gap-8">
                    <h2 className="text-white text-4xl lg:text-5xl font-black leading-tight tracking-tight">Upgrade Your Legal Practice Today</h2>
                    <p className="text-blue-100 text-lg lg:text-xl max-w-[600px]">Join thousands of Indian advocates who are drafting faster, researching smarter, and winning more cases.</p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Link to="/login" className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-white text-primary text-lg font-bold hover:bg-blue-50 transition-colors shadow-xl">
                            Get Started Now
                        </Link>
                        <button className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-blue-700 text-white border border-blue-500 text-lg font-bold hover:bg-blue-600 transition-colors">
                            Request Early Access
                        </button>
                    </div>
                    <p className="text-blue-200 text-xs mt-4">No credit card required for trial. 100% Secure & Confidential.</p>
                </div>
            </section >

            {/* Footer */}
            < footer className="bg-[#101622] text-white py-12 px-4 lg:px-40 border-t border-gray-800" >
                <div className="layout-content-container max-w-[960px] mx-auto flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex flex-col gap-4 max-w-xs">
                            <Link to="/" className="flex items-center gap-3 mb-6">
                                <img src={draftMateIcon} alt="DraftMate" className="h-12 w-12 object-contain rounded-xl" />
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold text-white leading-none tracking-tight">DraftMate</span>
                                    <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Your AI Assistant in Law</span>
                                </div>
                            </Link>

                            <div className="flex flex-col gap-2 text-sm text-gray-400">
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">mail</span>
                                    draftmate25@gmail.com
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">call</span>
                                    +91 6360756930
                                </p>
                                <p className="flex items-center gap-2 mt-2">
                                    <span className="font-bold text-gray-500">CIN:</span> U62090BR2026PTC082255
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-bold text-gray-500">PAN:</span> AAMCD4217D
                                </p>
                            </div>

                            <div className="flex gap-4 my-2">
                                <a href="https://x.com/draft_mate" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <span className="sr-only">X (Twitter)</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                                <a href="https://www.linkedin.com/company/draftmate-in/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <span className="sr-only">LinkedIn</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="https://www.facebook.com/profile.php?id=61584223401695" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <span className="sr-only">Facebook</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="https://www.instagram.com/draftmate.in/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <span className="sr-only">Instagram</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468 2.53c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="https://www.youtube.com/watch?v=E41ONA1AmBw" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <span className="sr-only">YouTube</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.418-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                                    </svg>
                                </a>
                            </div>

                            <div className="flex flex-col gap-1 mt-4">
                                <span className="text-[10px] text-gray-500 font-medium">Registered with</span>
                                <img src={startupIndiaLogo} alt="Recognized by Startup India" className="h-10 w-fit object-contain opacity-80 hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-12">
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">Platform</h4>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Features</a>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Pricing</a>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Testimonials</a>
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">Company</h4>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">About Us</a>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Contact</a>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Careers</a>
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">Legal</h4>
                                <Link to="/privacy-policy" className="text-sm text-gray-300 hover:text-white cursor-pointer">Privacy Policy</Link>
                                <Link to="/disclaimer" className="text-sm text-gray-300 hover:text-white cursor-pointer">Disclaimer</Link>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                        <p>© 2026 DraftMate Legal Tech Pvt Ltd. All rights reserved.</p>
                    </div>
                </div>
            </footer >
        </div >
    );
};

export default Landing;

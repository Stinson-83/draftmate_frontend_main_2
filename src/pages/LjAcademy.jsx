import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MonitorPlay, Award, Target, ArrowRight, BookOpen, Clock, Scale, FileText, Edit3, Library, Briefcase, Trophy, Sparkles } from 'lucide-react';

// Import your existing global components
import Navbar from '../components/landing/sections/Navbar';
import Footer from '../components/landing/sections/Footer';
import FAQSection from '../components/landing/sections/FAQSection';
import ScrollReveal from '../components/landing/ScrollReveal';
import LenisProvider from '../components/landing/LenisProvider';

const STUDENT_FEATURES = [
    { icon: Scale, title: "AI Live Courtroom", desc: "Practice real courtroom proceedings with AI judges and opposing counsel, receiving instant feedback to sharpen your advocacy skills." },
    { icon: FileText, title: "Moot Memorial Lab", desc: "Build professional moot memorials with AI-assisted legal research, argument structuring, and drafting guidance designed for law students." },
    { icon: Edit3, title: "Smart Drafting Learn Mode", desc: "Master legal drafting through step-by-step AI explanations that teach the purpose behind every clause while improving your drafting skills." },
    { icon: BookOpen, title: "AI Legal Notebook", desc: "Upload judgments, bare acts, and notes to chat with your documents, generate case briefs, and receive answers with precise legal citations." },
    { icon: Library, title: "Bare Acts AI", desc: "Understand complex legal provisions through simplified explanations, landmark judgments, and intelligent cross-references." },
    { icon: Target, title: "Exam & Moot Preparation", desc: "Prepare for CLAT PG, Judiciary, AIBE, and university exams with AI-powered mock tests, flashcards, and practice questions." },
    { icon: Briefcase, title: "Internship & Career Hub", desc: "Discover verified internships, build an ATS-ready legal CV, earn certifications, and connect with experienced mentors." },
    { icon: Trophy, title: "Certifications & Leaderboards", desc: "Earn verifiable DraftMate certifications, showcase your legal achievements, and compete with students nationwide." },
];

/* ─────────────────────────────────────────────────────────────
   Updated Course & Faculty Data (Native Indian Context)
───────────────────────────────────────────────────────────── */
const COURSES = [
    {
        id: 1,
        title: "AI Legal Drafting Fundamentals",
        duration: "2 Hours",
        price: "₹499",
        img: "/ljacademy/courses/fundamentals.png" // Law books/gavel
    },
    {
        id: 2,
        title: "Draft Contracts 10x Faster with AI",
        duration: "3 Hours",
        price: "₹999",
        img: "/ljacademy/courses/contract.png" // Indian business professionals meeting
    },
    {
        id: 3,
        title: "Master Legal Prompt Engineering",
        duration: "2.5 Hours",
        price: "₹799",
        img: "/ljacademy/courses/prompt_eng.png"
    },
    {
        id: 4,
        title: "AI-Powered Notice & Legal Letter Drafting",
        duration: "2 Hours",
        price: "₹699",
        img: "/ljacademy/courses/draft_doc.png" // Documents and typing
    },
    {
        id: 5,
        title: "Draft Your First Contract in Under 30 Minutes",
        duration: "90 Minutes",
        price: "₹599",
        img: "/ljacademy/courses/30_min.png" // Quick work desk
    },
    {
        id: 6,
        title: "AI for Law Students & Junior Associates",
        duration: "4 Hours",
        price: "₹1,499",
        img: "/ljacademy/courses/student.png" // Indian university students
    },
];

const FACULTY = [
    {
        id: 1,
        name: "Dr. Rajesh Desai",
        role: "Associate Professor of Constitutional Law",
        // Senior professional Indian male
        img: "/ljacademy/faculty/f3.png"
    },
    {
        id: 2,
        name: "Prof. Meera Menon",
        role: "Assistant Professor of Corporate Law",
        // Professional Indian female in business attire
        img: "/ljacademy/faculty/f1.png"
    },
    {
        id: 3,
        name: "Dr. Sanjay Verma",
        role: "Assistant Professor of Criminal Law",
        // Young professional Indian male
        img: "/ljacademy/faculty/f4.png"
    },
    {
        id: 4,
        name: "Prof. Kavita Iyer",
        role: "Professor of Human Rights Law",
        // Senior professional Indian female
        img: "/ljacademy/faculty/f2.png"
    },
];

const FEATURES = [
    { icon: Users, title: "Community & Networking", desc: "Interact, discuss, and network with like-minded individuals in exclusive chat groups." },
    { icon: MonitorPlay, title: "Live Interactions", desc: "Learn live with top educators, engage in interactive chats with teachers and fellow attendees." },
    { icon: Target, title: "Structured Learning", desc: "Our expertly curated structured curriculum provides you with a comprehensive understanding." },
    { icon: Award, title: "Get Certified", desc: "Our expert-designed curriculum ensures you receive the best learning experience and certificate." },
];

export default function LjAcademy() {
    const location = useLocation();
    const isDashboard = window.location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/dashboard');
    console.log("LJ Academy Render: pathname =", window.location.pathname, "routerPath =", location.pathname, "isDashboard =", isDashboard);

    const content = (
        <main className="flex flex-col bg-[#F8FAFF] min-h-screen">
                {!isDashboard && <Navbar />}

                {/* ── DRAFTMATE STUDENT CENTER (COMING SOON) ── */}
                <section className={`pb-16 lg:pb-20 relative overflow-hidden ${isDashboard ? 'pt-24' : 'pt-40 lg:pt-48'}`}>
                    {/* Infinite Marquee Banner */}
                    <div className="absolute top-10 left-0 w-full overflow-hidden bg-amber-300 py-3 z-20 shadow-lg -rotate-1 scale-110 border-y border-amber-400">
                        <div className="flex w-max animate-marquee-right items-center gap-10" style={{ willChange: "transform" }}>
                            {Array(15).fill("COMING SOON").map((text, i) => (
                                <div key={i} className="flex items-center gap-10">
                                    <span className="text-[13px] tracking-[0.3em] font-black text-amber-900 uppercase whitespace-nowrap">
                                        {text}
                                    </span>
                                    <Sparkles className="w-4 h-4 text-amber-700" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
                    
                    <div className="container-xl px-5 md:px-10 mx-auto max-w-7xl relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="max-w-3xl mx-auto space-y-6"
                        >
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#0F1C2E] leading-[1.15]">
                                DraftMate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Student Center</span>
                            </h1>
                            
                            <p className="text-[#475569] text-lg leading-relaxed md:text-xl">
                                The ultimate AI-powered ecosystem designed exclusively for law students. Prepare for exams, practice moot courts, and build your career with next-generation legal technology.
                            </p>
                        </motion.div>
                    </div>
                </section>

                <section className="py-16 bg-white border-y border-slate-200/60">
                    <div className="container-xl px-5 md:px-10 mx-auto max-w-7xl">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {STUDENT_FEATURES.map((feat, i) => (
                                <ScrollReveal key={i} delay={i * 50}>
                                    <div className="bg-[#F8FAFF] p-8 rounded-2xl border border-slate-100 h-full hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all duration-300">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm flex items-center justify-center mb-6 text-blue-600 border border-blue-200/50">
                                            <feat.icon className="w-7 h-7" strokeWidth={1.5} />
                                        </div>
                                        <h4 className="font-bold text-[#0F1C2E] text-lg mb-3 leading-tight">{feat.title}</h4>
                                        <p className="text-sm text-[#475569] leading-relaxed">{feat.desc}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>

                        {/* Notification CTA */}
                        <ScrollReveal delay={400}>
                            <div className="mt-16 bg-gradient-to-r from-[#0F1C2E] to-blue-900 rounded-3xl p-10 text-center text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                                <div className="relative z-10 max-w-2xl mx-auto">
                                    <h3 className="text-2xl md:text-3xl font-black mb-4">Want early access?</h3>
                                    <p className="text-blue-100 mb-8">Join the waitlist to be the first to experience the DraftMate Student Center when we launch.</p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <input 
                                            type="email" 
                                            placeholder="Enter your student email address" 
                                            className="px-6 py-3.5 rounded-xl text-[#0F1C2E] w-full sm:w-96 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        />
                                        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-xl transition-colors whitespace-nowrap shadow-lg shadow-blue-900/50">
                                            Join Waitlist
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                <div className="py-12 bg-[#F8FAFF]"></div>

                {/* ── LJ ACADEMY HERO SECTION ── */}
                <section className="pb-20 lg:pb-24 relative overflow-hidden pt-12">
                    {/* Background Glows */}
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

                    <div className="container-xl px-5 md:px-10 mx-auto max-w-7xl relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="space-y-6"
                            >
                                <span className="text-[11px] tracking-[0.25em] uppercase font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 inline-block">
                                    Meet Law Jurist Academy
                                </span>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#0F1C2E] leading-[1.15]">
                                    Achieve Legal Excellence with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">LJ Academy</span>
                                </h1>
                                <p className="text-[#475569] text-lg leading-relaxed max-w-lg">
                                    Expand your knowledge with our expert-led courses. From foundational education to advanced skills, master the intricacies of Indian law.
                                </p>
                                <div className="flex flex-wrap gap-4 pt-4">
                                    <button className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2">
                                        Join Community <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button className="bg-white text-[#0F1C2E] border border-slate-200 px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition-all">
                                        View Courses
                                    </button>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="relative h-[400px] lg:h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl border border-white/50"
                            >
                                {/* Indian law students / professionals working together */}
                                <img
                                    src="/ljacademy/ljacademy_3.png"
                                    alt="Law Students learning"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── COURSES SECTION ── */}
                <section className="py-24 bg-white border-y border-slate-200/60">
                    <div className="container-xl px-5 md:px-10 mx-auto max-w-7xl">
                        <ScrollReveal>
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-black text-[#0F1C2E]">
                                    What would you like to learn today?
                                </h2>
                            </div>
                        </ScrollReveal>

                        {/* Courses Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {COURSES.map((course, i) => (
                                <ScrollReveal key={course.id} delay={i * 100}>
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col h-full">
                                        <div className="h-48 relative overflow-hidden">
                                            <img src={course.img} alt={course.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
                                                    AI Mastery
                                                </div>
                                                {/* Duration Badge */}
                                                <div className="flex items-center gap-1 text-[12px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {course.duration}
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-[#0F1C2E] text-lg mb-6 flex-1">{course.title}</h3>

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                                <span className="text-2xl font-black text-blue-600">{course.price}</span>
                                                <button className="bg-[#0F1C2E] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors">
                                                    Buy Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>

                        {/* View Many More Button */}
                        <ScrollReveal delay={200}>
                            <div className="flex justify-center mt-14">
                                <button className="bg-white border border-slate-300 text-[#0F1C2E] px-10 py-3.5 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2 shadow-sm">
                                    View Many More Courses <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </ScrollReveal>

                    </div>
                </section>

                {/* ── FACULTY SECTION ── */}
                <section className="py-24 bg-[#F8FAFF]">
                    <div className="container-xl px-5 md:px-10 mx-auto max-w-7xl">
                        <ScrollReveal>
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-black text-[#0F1C2E]">
                                    Current Faculty Members
                                </h2>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
                            {FACULTY.map((member, i) => (
                                <ScrollReveal key={member.id} delay={i * 100}>
                                    <div className="flex flex-col items-center text-center group">
                                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-5 border-4 border-white shadow-lg group-hover:border-blue-100 transition-colors">
                                            <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <h4 className="font-bold text-[#0F1C2E] text-lg mb-1">{member.name}</h4>
                                        <p className="text-sm text-[#475569]">{member.role}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <button className="border border-slate-300 bg-white text-[#0F1C2E] px-8 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-2 shadow-sm">
                                View All <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── WHY CHOOSE US SECTION ── */}
                <section className="py-24 bg-white border-y border-slate-200/60">
                    <div className="container-xl px-5 md:px-10 mx-auto max-w-7xl">
                        <ScrollReveal>
                            <div className="text-center mb-16">
                                <span className="text-[11px] tracking-[0.25em] uppercase font-semibold block mb-3 text-[#94A3B8]">
                                    Why Choose Us?
                                </span>
                                <h2 className="text-3xl md:text-4xl font-black text-[#0F1C2E]">
                                    Empowering Legal Minds
                                </h2>
                            </div>
                        </ScrollReveal>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {FEATURES.map((feat, i) => (
                                <ScrollReveal key={i} delay={i * 100}>
                                    <div className="bg-[#F8FAFF] p-8 rounded-2xl border border-slate-100 text-center h-full hover:shadow-md hover:border-blue-100 transition-all">
                                        <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-6 text-blue-600 border border-slate-100">
                                            <feat.icon className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold text-[#0F1C2E] mb-3">{feat.title}</h4>
                                        <p className="text-sm text-[#475569] leading-relaxed">{feat.desc}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── STATS & ABOUT SECTION ── */}
                <section className="py-24 bg-[#F8FAFF]">
                    <div className="container-xl px-5 md:px-10 mx-auto max-w-7xl">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">

                            {/* Left: Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <ScrollReveal delay={0}>
                                    <div className="bg-blue-700 text-white p-8 rounded-3xl flex flex-col items-center justify-center text-center aspect-square shadow-xl shadow-blue-900/20">
                                        <div className="text-4xl font-black mb-2">1000+</div>
                                        <div className="text-sm font-medium text-blue-100">Learners</div>
                                    </div>
                                </ScrollReveal>
                                <ScrollReveal delay={100}>
                                    <div className="bg-[#0F1C2E] text-white p-8 rounded-3xl flex flex-col items-center justify-center text-center aspect-square shadow-xl">
                                        <div className="text-4xl font-black mb-2">1000+</div>
                                        <div className="text-sm font-medium text-slate-400">Certificates Issued</div>
                                    </div>
                                </ScrollReveal>
                                <ScrollReveal delay={200}>
                                    <div className="bg-white border border-slate-200 p-8 rounded-3xl flex flex-col items-center justify-center text-center aspect-square shadow-sm">
                                        {/* <BookOpen className="w-10 h-10 text-blue-500 mb-3" /> */}
                                        <div className="text-4xl font-black mb-2">50+</div>
                                        <div className="text-sm font-medium text-slate-400">Institutions</div>
                                    </div>
                                </ScrollReveal>
                                <ScrollReveal delay={300}>
                                    <div className="bg-white border border-slate-200 p-8 rounded-3xl flex flex-col items-center justify-center text-center aspect-square shadow-sm">
                                        <div className="text-4xl font-black text-[#0F1C2E] mb-2">500+</div>
                                        <div className="text-sm font-medium text-[#475569]">Active Members</div>
                                    </div>
                                </ScrollReveal>
                            </div>

                            {/* Right: Text Content */}
                            <ScrollReveal>
                                <div>
                                    <span className="text-[11px] tracking-[0.25em] uppercase font-bold text-blue-600 block mb-4">
                                        Meet LJ Academy
                                    </span>
                                    <h2 className="text-3xl md:text-4xl font-black text-[#0F1C2E] mb-6 leading-tight">
                                        Empowering All Stages of Learning
                                    </h2>
                                    <p className="text-[#475569] leading-relaxed mb-8">
                                        Expand your knowledge with our expert-led courses. From foundational education to advanced skills and beyond, we provide the resources, tools, and guidance needed to empower individuals to reach their full potential. By fostering curiosity, creativity, and confidence, we help learners grow, adapt, and thrive in an ever-changing legal world.
                                    </p>
                                    <button className="border border-slate-300 bg-white text-[#0F1C2E] px-8 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-2 shadow-sm">
                                        Know More <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </section>

                {/* ── FAQ SECTION (Reusing your global one) ── */}
                {/* <FAQSection /> */}

                {!isDashboard && <Footer />}
            </main>
    );

    // Only use Lenis smooth-scroll on the public landing page.
    // Inside the dashboard the scroll container is a nested div, not window —
    // Lenis blocks touch/finger scrolling while the scrollbar still works.
    if (isDashboard) return content;
    return <LenisProvider>{content}</LenisProvider>;
}
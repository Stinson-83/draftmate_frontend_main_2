import React from 'react';
import { motion } from 'framer-motion';
import { Users, MonitorPlay, Award, Target, ArrowRight, BookOpen, Clock } from 'lucide-react';

// Import your existing global components
import Navbar from '../components/landing/sections/Navbar';
import Footer from '../components/landing/sections/Footer';
import FAQSection from '../components/landing/sections/FAQSection';
import ScrollReveal from '../components/landing/ScrollReveal';
import LenisProvider from '../components/landing/LenisProvider';

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
    return (
        <LenisProvider>
            <main className="flex flex-col bg-[#F8FAFF] min-h-screen">
                <Navbar />

                {/* ── HERO SECTION ── */}
                <section className="pt-32 pb-20 lg:pt-40 lg:pb-24 relative overflow-hidden">
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

                <Footer />
            </main>
        </LenisProvider>
    );
}
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Scale,
    FileText,
    Search,
    ShieldCheck,
    Target,
    Eye,
    ArrowRight,
    Layers,
    Zap,
    FolderOpen,
    BookOpen,
    Clock
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Navbar from "../components/landing/sections/Navbar";
import Footer from "../components/landing/sections/Footer";
import ScrollReveal from "../components/landing/ScrollReveal";
import LenisProvider from "../components/landing/LenisProvider";

/* ─────────────────────────────────────────────────────────────
   Dynamic Card Component for Capabilities
───────────────────────────────────────────────────────────── */
// function CapabilityCard({ icon: Icon, title, desc, delay }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true, margin: "-50px" }}
//       transition={{ duration: 0.5, delay: delay }}
//       whileHover={{ y: -8 }}
//       className="group relative p-8 rounded-3xl bg-white border border-slate-200/80 transition-all duration-500 flex flex-col h-full overflow-hidden shadow-[0_4px_20px_rgba(15,28,46,0.04)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.12)] hover:border-blue-300"
//     >
//       {/* Soft blue-to-cyan gradient fill on hover */}
//       <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-cyan-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

//       <div 
//         className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md relative z-10"
//         style={{ background: "rgba(37,99,235,0.08)" }}
//       >
//         {/* Duotone Icon: Dark blue stroke, soft blue fill */}
//         <Icon 
//           className="w-6 h-6 text-blue-600 transition-colors duration-300 group-hover:text-blue-700" 
//           fill="#DBEAFE" 
//         />
//       </div>
//       <h3 className="text-xl font-bold text-[#0F1C2E] mb-3 relative z-10 transition-colors duration-300 group-hover:text-blue-700">{title}</h3>
//       <p className="text-slate-600 leading-relaxed text-[15px] flex-1 relative z-10">
//         {desc}
//       </p>
//     </motion.div>
//   );
// }

// function SolutionCard({ title, desc, icon: Icon, delay }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true }}
//       transition={{ duration: 0.5, delay }}
//       whileHover={{ y: -5 }}
//       className="group p-8 rounded-3xl bg-[#0F1C2E] border border-blue-900/30 shadow-xl hover:border-blue-500/50 transition-all duration-300"
//     >
//       <div className="w-12 h-12 rounded-xl bg-blue-900/30 flex items-center justify-center mb-6 border border-blue-800 group-hover:bg-blue-600 transition-colors">
//         <Icon className="w-6 h-6 text-blue-400 group-hover:text-white" />
//       </div>
//       <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
//       <p className="text-slate-400 text-[14px] leading-relaxed">{desc}</p>
//     </motion.div>
//   );
// }
function CapabilitiesSlider() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isPaused, setIsPaused] = useState(false);

    const SLIDE_DURATION = 4000;

    const slides = [
        {
            icon: Scale,
            title: "Indian Law Trained",
            desc: "Trained on millions of Indian legal docs, case laws & statutes — IPC, CrPC, CPC, Constitution.",
            highlight: "10M+ Legal Documents",
            tag: "Core Training",
            stats: [
                { label: "Statutes Covered", value: "500+" },
                { label: "Case Laws", value: "1M+" },
                { label: "Legal Acts", value: "200+" },
            ],
        },
        {
            icon: Zap,
            title: "Automated Process",
            desc: "Automated processes like cause lists, list of dates, and auto-formatting — eliminating repetitive manual work.",
            highlight: "90% Time Saved",
            tag: "Automation",
            stats: [
                { label: "Processes Automated", value: "25+" },
                { label: "Avg Time Saved", value: "4hrs/day" },
                { label: "Auto-Formats", value: "50+" },
            ],
        },
        {
            icon: FileText,
            title: "Error-Free Drafting",
            desc: "Smart validation and compliance checking reduce errors by up to 99%, ensuring every document meets professional standards.",
            highlight: "99% Error Reduction",
            tag: "Accuracy",
            stats: [
                { label: "Error Reduction", value: "99%" },
                { label: "Compliance Checks", value: "Real-time" },
                { label: "Document Types", value: "100+" },
            ],
        },
        {
            icon: Clock,
            title: "Hours into Minutes",
            desc: "Advanced AI generates complete legal documents in minutes instead of hours, dramatically accelerating workflow efficiency.",
            highlight: "10x Faster",
            tag: "Speed",
            stats: [
                { label: "Speed Increase", value: "10x" },
                { label: "Draft Time", value: "<5 min" },
                { label: "Daily Output", value: "3x More" },
            ],
        },
    ];

    // ── Blue accent color tokens (white-dominant theme) ──
    const BLUE = "#1D4ED8";   // primary blue
    const BLUE_MID = "#2563EB";   // mid blue
    const BLUE_LIGHT = "#DBEAFE";   // very light blue (fill/bg)
    const BLUE_BG = "rgba(37,99,235,0.08)";
    const BLUE_BORDER = "rgba(37,99,235,0.22)";

    // ── Auto-slide ──
    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            setDirection(1);
            setActiveIndex((prev) => (prev + 1) % slides.length);
        }, SLIDE_DURATION);
        return () => clearInterval(timer);
    }, [isPaused, slides.length]);

    const handleSlideChange = (index) => {
        setDirection(index > activeIndex ? 1 : -1);
        setActiveIndex(index);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 8000);
    };

    const handleNext = () => {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % slides.length);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 8000);
    };

    const handlePrev = () => {
        setDirection(-1);
        setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 8000);
    };

    const active = slides[activeIndex];
    const ActiveIcon = active.icon;

    const slideVariants = {
        enter: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }),
        center: { opacity: 1, x: 0 },
        exit: (dir) => ({ opacity: 0, x: dir > 0 ? -50 : 50 }),
    };

    return (
        <div
            className="relative w-full rounded-3xl overflow-hidden shadow-xl"
            style={{
                background: "#ffffff",
                border: "1px solid rgba(37,99,235,0.14)",
                boxShadow: "0 8px 40px rgba(37,99,235,0.08)",
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* ══════════════════════════════
          TAB BAR
      ══════════════════════════════ */}
            <div
                className="flex overflow-x-auto"
                style={{ borderBottom: "1px solid rgba(37,99,235,0.10)", background: "#F8FAFF" }}
            >
                {slides.map((slide, i) => {
                    const TabIcon = slide.icon;
                    const isActive = i === activeIndex;
                    return (
                        <button
                            key={i}
                            onClick={() => handleSlideChange(i)}
                            className="relative flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-4 text-[13px] font-semibold transition-all duration-300 whitespace-nowrap"
                            style={{
                                color: isActive ? BLUE_MID : "rgba(100,116,139,0.75)",
                                background: isActive ? "#ffffff" : "transparent",
                            }}
                        >
                            <TabIcon
                                className="w-4 h-4 shrink-0"
                                style={{ color: isActive ? BLUE_MID : "rgba(100,116,139,0.5)" }}
                            />
                            <span>{slide.title}</span>

                            {/* Animated progress bar */}
                            {isActive && (
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-[2.5px]"
                                    style={{ background: BLUE_LIGHT }}
                                >
                                    <motion.div
                                        key={`progress-${activeIndex}-${isPaused}`}
                                        className="h-full rounded-full"
                                        style={{ background: BLUE_MID }}
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={
                                            isPaused
                                                ? { duration: 0 }
                                                : { duration: SLIDE_DURATION / 1000, ease: "linear" }
                                        }
                                    />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ══════════════════════════════
          SLIDE CONTENT
      ══════════════════════════════ */}
            <div className="relative overflow-hidden min-h-[300px] lg:min-h-[340px]">
                <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                        key={activeIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        className="grid lg:grid-cols-5 h-full"
                    >
                        {/* ── LEFT: Main Content ── */}
                        <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-between bg-white">

                            {/* Tags Row */}
                            <div className="flex items-center gap-3 mb-7">
                                <span
                                    className="px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase"
                                    style={{
                                        background: BLUE_BG,
                                        color: BLUE_MID,
                                        border: `1px solid ${BLUE_BORDER}`,
                                    }}
                                >
                                    {active.tag}
                                </span>
                                <span
                                    className="px-3 py-1 rounded-full text-[12px] font-semibold"
                                    style={{
                                        background: "rgba(15,28,46,0.05)",
                                        color: "#0F1C2E",
                                        border: "1px solid rgba(15,28,46,0.08)",
                                    }}
                                >
                                    {active.highlight}
                                </span>
                            </div>

                            {/* Icon + Title + Desc */}
                            <div className="flex items-start gap-5 mb-8">
                                {/* Icon Box */}
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{
                                        background: BLUE_BG,
                                        border: `1px solid ${BLUE_BORDER}`,
                                    }}
                                >
                                    <ActiveIcon
                                        className="w-7 h-7"
                                        style={{ color: BLUE_MID }}
                                        fill={BLUE_LIGHT}
                                    />
                                </div>

                                <div>
                                    {/* ✅ FIX: text-[#0F1C2E] — visible on white background */}
                                    <h3
                                        className="text-2xl lg:text-3xl font-black leading-tight mb-3"
                                        style={{ color: "#0F1C2E" }}
                                    >
                                        {active.title}
                                    </h3>
                                    <p
                                        className="text-[15px] leading-relaxed max-w-md"
                                        style={{ color: "#64748B" }}
                                    >
                                        {active.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Controls Row */}
                            <div className="flex items-center gap-3">
                                {/* Prev */}
                                <button
                                    onClick={handlePrev}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 group"
                                    style={{
                                        border: "1px solid rgba(37,99,235,0.20)",
                                        color: "#94A3B8",
                                        background: "#F8FAFF",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = BLUE_MID;
                                        e.currentTarget.style.color = BLUE_MID;
                                        e.currentTarget.style.background = BLUE_BG;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(37,99,235,0.20)";
                                        e.currentTarget.style.color = "#94A3B8";
                                        e.currentTarget.style.background = "#F8FAFF";
                                    }}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {/* Next */}
                                <button
                                    onClick={handleNext}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                                    style={{
                                        border: "1px solid rgba(37,99,235,0.20)",
                                        color: "#94A3B8",
                                        background: "#F8FAFF",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = BLUE_MID;
                                        e.currentTarget.style.color = BLUE_MID;
                                        e.currentTarget.style.background = BLUE_BG;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "rgba(37,99,235,0.20)";
                                        e.currentTarget.style.color = "#94A3B8";
                                        e.currentTarget.style.background = "#F8FAFF";
                                    }}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                {/* Dot Indicators */}
                                <div className="flex items-center gap-2 ml-1">
                                    {slides.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSlideChange(i)}
                                        >
                                            <div
                                                className="rounded-full transition-all duration-300"
                                                style={{
                                                    width: i === activeIndex ? "28px" : "8px",
                                                    height: "8px",
                                                    background:
                                                        i === activeIndex
                                                            ? BLUE_MID
                                                            : "rgba(37,99,235,0.18)",
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Slide Counter */}
                                <span
                                    className="ml-auto text-[12px] font-mono"
                                    style={{ color: "#94A3B8" }}
                                >
                                    {String(activeIndex + 1).padStart(2, "0")} /{" "}
                                    {String(slides.length).padStart(2, "0")}
                                </span>
                            </div>
                        </div>

                        {/* ── RIGHT: Stats Panel ── */}
                        <div
                            className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden"
                            style={{
                                background: "#EFF6FF",   /* very light blue — white dominant */
                                borderLeft: "1px solid rgba(37,99,235,0.10)",
                            }}
                        >
                            {/* Subtle blue circle glow */}
                            <div
                                className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                                style={{ background: "rgba(37,99,235,0.10)" }}
                            />

                            {/* KEY METRICS label */}
                            <p
                                className="text-[11px] font-bold tracking-widest uppercase mb-6"
                                style={{ color: BLUE_MID }}
                            >
                                Key Metrics
                            </p>

                            {/* Stats rows */}
                            <div className="flex flex-col">
                                {active.stats.map((stat, i) => (
                                    <motion.div
                                        key={`${activeIndex}-stat-${i}`}
                                        initial={{ opacity: 0, x: 16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.09 + 0.1, duration: 0.35 }}
                                        className="flex items-center justify-between py-5"
                                        style={{
                                            borderBottom:
                                                i < active.stats.length - 1
                                                    ? "1px solid rgba(37,99,235,0.08)"
                                                    : "none",
                                        }}
                                    >
                                        <span
                                            className="text-[14px] font-medium"
                                            style={{ color: "#475569" }}
                                        >
                                            {stat.label}
                                        </span>
                                        <span
                                            className="text-xl font-black"
                                            style={{ color: "#0F1C2E" }}
                                        >
                                            {stat.value}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}



export default function About() {
    return (
        <LenisProvider>
            <main className="flex flex-col bg-[#F8FAFF] min-h-screen overflow-hidden">
                <Navbar />

                {/* ── HERO SECTION ── */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
                    {/* Background Ambient Glows */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute top-40 -left-40 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute top-40 -right-40 w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-[80px] pointer-events-none" />

                    {/* Grid Pattern */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.4]"
                        style={{
                            backgroundImage: "linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)",
                            backgroundSize: "40px 40px",
                            maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                            WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)"
                        }}
                    />

                    <div className="relative z-10 w-full max-w-5xl mx-auto px-5 md:px-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase mb-6"
                                style={{ background: "rgba(37,99,235,0.08)", color: "#1D4ED8", border: "1px solid rgba(37,99,235,0.2)" }}>
                                <Scale className="w-3.5 h-3.5" fill="#DBEAFE" />
                                The DraftMate Story
                            </span>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#0F1C2E] leading-[1.1] mb-8 tracking-tight">
                                India’s Next-Generation <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500">
                                    Legal AI Workspace
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto font-medium">
                                Built to transform how legal professionals, law firms, law students, researchers, and in-house teams work. Designed specifically for the legal ecosystem, DraftMate combines advanced artificial intelligence with reliable legal research and drafting tools to help users save time, improve accuracy, and increase productivity.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* ── PLATFORM CAPABILITIES ── */}
                <section className="py-20 lg:py-32 relative z-20">
                    <div className="w-full max-w-7xl mx-auto px-5 md:px-10">
                        <div className="mb-16 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <span
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase mb-6"
                                    style={{
                                        background: "rgba(37,99,235,0.08)",
                                        color: "#1D4ED8",
                                        border: "1px solid rgba(37,99,235,0.2)",
                                    }}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    What We Offer
                                </span>
                                <h2 className="text-3xl md:text-4xl font-black text-[#0F1C2E]">
                                    DraftMate AI: Legal AI, Reimagined
                                </h2>
                                <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
                                    Not just another AI tool. A comprehensive legal workspace designed
                                    from the ground up for Indian legal professionals.
                                </p>
                            </motion.div>
                        </div>

                        {/* Dynamic Slider */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <CapabilitiesSlider />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mt-10"
                        >
                            <motion.div
                                whileHover={{ y: -6, scale: 1.01 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="group relative p-10 rounded-3xl overflow-hidden cursor-default"
                                style={{
                                    background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 50%, #EEF2FF 100%)",
                                    border: "1px solid rgba(37,99,235,0.15)",
                                    boxShadow: "0 4px 24px rgba(37,99,235,0.06)",
                                }}
                            >
                                {/* ── Animated Glow on Hover ── */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(14,165,233,0.04) 100%)",
                                        boxShadow: "inset 0 0 60px rgba(37,99,235,0.05)",
                                    }}
                                />

                                {/* ── Top-right decorative circle ── */}
                                <div
                                    className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"
                                    style={{ background: "radial-gradient(circle, #2563EB, transparent)" }}
                                />

                                {/* ── Bottom-left decorative circle ── */}
                                <div
                                    className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full blur-2xl opacity-20 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"
                                    style={{ background: "radial-gradient(circle, #0EA5E9, transparent)" }}
                                />

                                {/* ── Grid Pattern Overlay ── */}
                                <div
                                    className="absolute inset-0 opacity-[0.3] pointer-events-none rounded-3xl"
                                    style={{
                                        backgroundImage:
                                            "linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)",
                                        backgroundSize: "28px 28px",
                                        maskImage: "linear-gradient(to bottom right, black 30%, transparent 100%)",
                                        WebkitMaskImage: "linear-gradient(to bottom right, black 30%, transparent 100%)",
                                    }}
                                />

                                {/* ── Main Content ── */}
                                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">

                                    {/* Left: Text */}
                                    <div className="text-center lg:text-left max-w-2xl">
                                        {/* Badge */}
                                        <div className="inline-flex items-center gap-2 mb-4">
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                className="w-2 h-2 rounded-full bg-blue-500"
                                            />
                                            <span
                                                className="text-[11px] font-bold tracking-widest uppercase"
                                                style={{ color: "#2563EB" }}
                                            >
                                                Why DraftMate
                                            </span>
                                        </div>

                                        <h4 className="text-xl lg:text-2xl font-black text-blue-900 mb-3 leading-tight">
                                            The DraftMate Difference
                                        </h4>

                                        <p className="text-blue-800/70 text-[15px] leading-relaxed">
                                            While others retrofit generic AI for legal use, DraftMate was{" "}
                                            <span className="font-semibold text-blue-800">conceived, designed & trained</span>{" "}
                                            specifically for Indian legal workflows from day one.
                                        </p>
                                    </div>

                                    {/* Right: 3 Highlight Chips */}
                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                                        {[
                                            { label: "Indian-First", icon: "🇮🇳" },
                                            { label: "Purpose-Built", icon: "⚡" },
                                            { label: "Legally Reliable", icon: "🛡️" },
                                        ].map((chip, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.1 + 0.3 }}
                                                whileHover={{ x: 4, scale: 1.03 }}
                                                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-blue-100 shadow-sm group-hover:border-blue-200 group-hover:shadow-md transition-all duration-300"
                                            >
                                                <span className="text-lg">{chip.icon}</span>
                                                <span className="text-sm font-bold text-blue-900 whitespace-nowrap">
                                                    {chip.label}
                                                </span>
                                                <svg
                                                    className="w-4 h-4 text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-0 group-hover:translate-x-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Bottom Shimmer Line ── */}
                                <div className="relative z-10 mt-8 pt-6 border-t border-blue-100/80 flex flex-wrap items-center justify-center gap-8">
                                    {[
                                        { num: "10M+", label: "Legal Documents Trained" },
                                        { num: "99%", label: "Drafting Accuracy" },
                                        { num: "10x", label: "Faster Than Manual" },
                                        { num: "500+", label: "Statutes Covered" },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08 + 0.4 }}
                                            className="text-center"
                                        >
                                            <div className="text-2xl font-black text-blue-700">{stat.num}</div>
                                            <div className="text-[12px] text-blue-500/80 font-medium mt-0.5">{stat.label}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>


                {/* ── THE LEGAL DIFFERENTIATOR ── */}
                <section className="py-20 lg:py-32 bg-white border-y border-slate-200/60 relative overflow-hidden">
                    {/* Subtle decoration */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl pointer-events-none" />

                    <div className="w-full max-w-7xl mx-auto px-5 md:px-10 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                            <ScrollReveal>
                                <div>
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, #1D4ED8, #0EA5E9)", boxShadow: "0 10px 25px rgba(37,99,235,0.3)" }}>
                                        <ShieldCheck className="w-8 h-8 text-white" fill="#60A5FA" />
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black text-[#0F1C2E] mb-6 leading-tight">
                                        Unlike generic AI tools, DraftMate is <span className="text-blue-600">built for legal workflows.</span>
                                    </h2>
                                    <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                        Every research output is backed by verifiable sources, case laws, statutes, and legal references that users can review directly within the platform.
                                    </p>
                                    <p className="text-lg text-slate-600 leading-relaxed">
                                        The workspace also includes intelligent document management, AI-powered legal assistants, case analysis tools, citation support, and collaborative features designed for modern legal practice.
                                    </p>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal delay={200}>
                                {/* Visual Representation of Features with filled icons */}
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { title: "Verifiable Sources", icon: Search, color: "text-emerald-600", fill: "#D1FAE5", bg: "bg-emerald-50", hoverBorder: "hover:border-emerald-300" },
                                        { title: "Document Management", icon: FolderOpen, color: "text-blue-600", fill: "#DBEAFE", bg: "bg-blue-50", hoverBorder: "hover:border-blue-300" },
                                        { title: "Citation Support", icon: BookOpen, color: "text-purple-600", fill: "#E9D5FF", bg: "bg-purple-50", hoverBorder: "hover:border-purple-300" },
                                        { title: "AI Assistants", icon: Zap, color: "text-amber-600", fill: "#FEF3C7", bg: "bg-amber-50", hoverBorder: "hover:border-amber-300" }
                                    ].map((feat, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ y: -6, scale: 1.02 }}
                                            className={`group p-6 rounded-3xl bg-white border border-slate-200 flex flex-col items-center text-center justify-center aspect-square shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden ${feat.hoverBorder}`}
                                        >
                                            {/* Entire card fills with the soft color on hover */}
                                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${feat.bg} pointer-events-none`} />

                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 bg-white shadow-sm border border-slate-100 relative z-10`}>
                                                <feat.icon className={`w-5 h-5 ${feat.color}`} fill={feat.fill} />
                                            </div>
                                            <h4 className={`font-bold text-[#0F1C2E] text-[15px] relative z-10 transition-colors duration-300 group-hover:${feat.color}`}>{feat.title}</h4>
                                        </motion.div>
                                    ))}
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </section>

                {/* ── MISSION & VISION ── */}
                <section className="py-20 lg:py-32 relative">
                    <div className="w-full max-w-7xl mx-auto px-5 md:px-10">
                        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">

                            {/* Mission */}
                            <ScrollReveal delay={100}>
                                <motion.div
                                    whileHover={{ y: -8 }}
                                    className="group bg-[#0F1C2E] rounded-3xl p-10 lg:p-14 relative overflow-hidden h-full flex flex-col shadow-xl transition-all duration-500 hover:shadow-blue-900/40 border border-transparent hover:border-blue-800/50"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] group-hover:bg-blue-400/30 transition-colors duration-500" />

                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mb-8 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                                        <Target className="w-6 h-6 text-blue-400" fill="#1E3A8A" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-6 relative z-10">Our Mission</h3>
                                    <p className="text-lg text-slate-300 leading-relaxed relative z-10 flex-1">
                                        To democratize access to high-quality legal technology by making powerful AI tools accessible to every lawyer, law student, legal researcher, and organization.
                                    </p>
                                </motion.div>
                            </ScrollReveal>

                            {/* Vision */}
                            <ScrollReveal delay={200}>
                                <motion.div
                                    whileHover={{ y: -8 }}
                                    className="group bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-10 lg:p-14 relative overflow-hidden h-full flex flex-col shadow-xl transition-all duration-500 hover:shadow-cyan-500/30"
                                >
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] group-hover:bg-white/20 transition-colors duration-500" />

                                    <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-8 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                                        <Eye className="w-6 h-6 text-white" fill="#38BDF8" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-6 relative z-10">Our Vision</h3>
                                    <p className="text-lg text-blue-50 leading-relaxed relative z-10 flex-1">
                                        We envision a future where legal professionals spend less time on repetitive tasks and more time on strategic thinking, advocacy, and delivering value to their clients.
                                    </p>
                                </motion.div>
                            </ScrollReveal>

                        </div>
                    </div>
                </section>

                {/* ── FINAL CTA BANNER ── */}
                <section className="py-20 mb-10">
                    <div className="w-full max-w-5xl mx-auto px-5 md:px-10">
                        <ScrollReveal>
                            <div
                                className="rounded-[40px] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl"
                                style={{
                                    background: "linear-gradient(160deg, #070E1A 0%, #0A1628 50%, #0D1E38 100%)",
                                    border: "1px solid rgba(37,99,235,0.2)"
                                }}
                            >
                                {/* Inner Glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-600/20 blur-[100px] pointer-events-none rounded-full" />

                                <div className="relative z-10">
                                    <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-8 max-w-3xl mx-auto">
                                        DraftMate AI is not just a legal research tool—it is a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">complete AI-powered legal workspace</span> built to help the legal community work faster, draft smarter, and research with confidence.
                                    </h2>
                                    <div className="flex flex-wrap justify-center gap-4">

                                        {/* Highly Interactive CTA Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.04, y: -2 }}
                                            whileTap={{ scale: 0.96 }}
                                            className="group relative bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-10 py-4 rounded-xl font-semibold overflow-hidden shadow-lg shadow-blue-500/30 flex items-center gap-2 text-[15px] transition-all"
                                        >
                                            {/* Gradient hover shift */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                            <span className="relative z-10 flex items-center gap-2">
                                                Join the Movement
                                                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                                            </span>
                                        </motion.button>

                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                <Footer />
            </main>
        </LenisProvider>
    );
}
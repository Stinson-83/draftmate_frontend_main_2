import { useState, useEffect } from "react";
import { X, Quote } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";

// ─── Avatar imports ───────────────────────────────────────────────────────────
import Abhiniti_Vats from "/reviews/Abhiniti_Vats.png";
import Prathana_Prakash from "/reviews/Prathana_Prakash.png";
import Nidhi_Sharma from "/reviews/Nidhi_Sharma.png";
import Palak_Roy from "/reviews/Palak_Roy.png";
import Jaineesh_V_Maharajwala from "/reviews/Jaineesh_V_Maharajwala.png";
import Ananya_Sharma from "/reviews/Ananya_Sharma.png";
import Yashaswi_Agrawal from "/reviews/Yashaswi_Agrawal.png";
import Aastha_Verma from "/reviews/Aastha_Verma.png";
import Pratyush_Sharma from "/reviews/Pratyush_Sharma.png";
import Abhinav_Jain from "/reviews/Abhinav_Jain.png";
import Kumar_Abhishek from "/reviews/Kumar_Abhishek.png";
import Rohil_Rai from "/reviews/Rohil_Rai.png";
import Subhradeep_Das from "/reviews/Subhradeep_Das.png";
import Manvi_Priya from "/reviews/Manvi_Priya.png";
import Shubham_Ranjan_Sharma from "/reviews/Shubham_Ranjan_Sharma.png";
import Pavan_Kumar from "/reviews/Pavan_Kumar.png";
import Kushagra_Sahi from "/reviews/Kushagra_Sahi.png";
import P_Mahima from "/reviews/P_Mahima.png";
import Abhijeet_Kumar_Pandey from "/reviews/Abhijeet_Kumar_Pandey.png";
import Abhishek_Kr_Anand from "/reviews/Abhishek_Kr_Anand.png";
import Adhiti_Sharma from "/reviews/Adhiti_Sharma.png";
import Amartya_Shivam from "/reviews/Amartya_Shivam.png";
import Anjali_Bharti from "/reviews/Anjali_Bharti.png";
import Ayushi from "/reviews/Ayushi.png";
import Bhavika_Verma from "/reviews/Bhavika_Verma.png";
import Divya_Malvi from "/reviews/Divya_Malvi.png";
import Madhumita_L from "/reviews/Madhumita_L.png";
import Pawan_raj_singh_chandel from "/reviews/Pawan_raj_singh_chandel.png";
import Puspalata_Chadni from "/reviews/Puspalata_Chadni.png";
import Richa from "/reviews/Richa.png";
import Rinki_khatun from "/reviews/Rinki_khatun.png";
import Shahil_Prashar from "/reviews/Shahil_Prashar.png";
import Shakshi_Suman from "/reviews/Shakshi_Suman.png";
import Smruti_Dhoot from "/reviews/Smruti_Dhoot.png";
import Soyansu_Dash from "/reviews/Soyansu_Dash.png";
import Sriya_Naik from "/reviews/Sriya_Naik.png";

// ─── Data ─────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
    {
        id: 1, name: "Abhiniti Vats", role: "Advocate, Patna High Court", image: Abhiniti_Vats,
        text: "It isn't just another generic AI tool. It understands Indian law context, legal formats, citation norms, and courtroom standards, and delivers clear, structured, court-ready drafts that are actually workable in practice."
    },
    {
        id: 2, name: "Prathana Prakash", role: "Associate at Deepak Kohli & Associates", image: Prathana_Prakash,
        text: "The AI-powered drafting and Lex Bot research assistant are particularly useful, providing relevant content with authentic case law references. Features like personalised drafting style and Chat with PDF enhance efficiency."
    },
    {
        id: 3, name: "Nidhi Sharma", role: "Advocate, District Court Hapur", image: Nidhi_Sharma,
        text: "The AI-powered drafting feature and case law summarisation are extremely helpful and save a lot of time. Lex Bot provides quick and relevant legal research support, making day-to-day legal work much more efficient."
    },
    {
        id: 4, name: "Palak Roy", role: "Advocate, Patna High Court", image: Palak_Roy,
        text: "Whether you're preparing notices, applications, or basic pleadings, DraftMate acts as a reliable guide and boosts confidence in legal drafting. User-friendly interface with clear formatting that's easy to customise."
    },
    {
        id: 5, name: "Jaineesh V Maharajwala", role: "Advocate, Surat District Court", image: Jaineesh_V_Maharajwala,
        text: "DraftMate makes legal research and drafting much easier. It pulls up relevant case laws quickly and helps with clean, usable drafts, which saves a lot of time in day-to-day legal work."
    },
    {
        id: 6, name: "Ananya Sharma", role: "Advocate, Punjab & Haryana High Court", image: Ananya_Sharma,
        text: "AI-powered templates tailored to Indian laws — especially the new criminal laws — let me produce pleadings quickly and confidently. It feels like having a senior mentor on every draft."
    },
    {
        id: 7, name: "Yashaswi Agrawal", role: "Advocate, Supreme Court", image: Yashaswi_Agrawal,
        text: "Have used the legal calculator, drafting and PDF editor feature. Highly impressed with the results it provides. It's a reliable tool that I'll continue using for my legal work."
    },
    {
        id: 8, name: "Aastha Verma", role: "Advocate, Delhi High Court", image: Aastha_Verma,
        text: "It provides relevant case laws with correct citations and is also very effective in giving clear case summaries. Overall, it's a handy tool to have in the legal field."
    },
    {
        id: 9, name: "Pratyush Sharma", role: "Advocate, Patna High Court", image: Pratyush_Sharma,
        text: "It assists in drafting, reviewing, and structuring legal documents with remarkable accuracy and clarity. Especially useful for advocates, law firms, and law students who want to streamline their workflow."
    },
    {
        id: 10, name: "Abhinav Jain", role: "Advocate, Supreme Court of India", image: Abhinav_Jain,
        text: "I have been using DraftMate for some time now and found it insightfully helpful in my day-to-day legal practice and research."
    },
    {
        id: 11, name: "Kumar Abhishek", role: "Advocate, Delhi High Court", image: Kumar_Abhishek,
        text: "I have been using DraftMate consistently for the past five weeks, and I find it efficient, reliable, easy to use, and highly recommended for any legal professional."
    },
    {
        id: 12, name: "Rohil Rai", role: "Advocate, Delhi High Court", image: Rohil_Rai,
        text: "It doesn't just suggest standard clauses; it flags when a provision might be unenforceable under specific state or regional laws — which feels less like a search tool and more like a seasoned peer review."
    },
    {
        id: 13, name: "Subhradeep Das", role: "Associate, Alphastream AI", image: Subhradeep_Das,
        text: "The drafts it generates are high quality, well-structured, and supported by real legal precedents. It also provides accurate and practical responses to queries related to legal procedures and laws."
    },
    {
        id: 14, name: "Manvi Priya", role: "Advocate, Delhi High Court", image: Manvi_Priya,
        text: "I've been using this for over a month now, and I'm genuinely impressed by how effectively it handles summarisation along with its seamless automatic drafting capabilities."
    },
    {
        id: 15, name: "Shubham Ranjan Sharma", role: "Advocate, Delhi High Court", image: Shubham_Ranjan_Sharma,
        text: "DraftMate is proving to be a quintessential tool in my legal endeavours — genuinely a life saver for research and drafting work every single day."
    },
    {
        id: 16, name: "Pavan Kumar", role: "Advocate, Delhi High Court", image: Pavan_Kumar,
        text: "The website is very helpful for daily work and keeps a tab on events. Overall great experience and I hope to see many new features being added going forward."
    },
    {
        id: 17, name: "Kushagra Sahi", role: "Advocate, Patna High Court", image: Kushagra_Sahi,
        text: "It provides streamlined access to relevant legal judgments, enabling quick and effective case law analysis. The drafting features are aligned with real-world legal practice, making document preparation accurate."
    },
    {
        id: 18, name: "P Mahima", role: "Advocate, High Court of Karnataka", image: P_Mahima,
        text: "The drafting is quick and accurate, case law citations are reliable, and Lex Bot makes research much easier. Features like Chat with PDF and personalised formats save a lot of time."
    },
    {
        id: 19, name: "Abhijeet Kumar Pandey", role: "Advocate, Patna High Court", image: Abhijeet_Kumar_Pandey,
        text: "I have been using DraftMate AI for my essays and assignments, and it is actually really helpful. It gives me a strong first draft quickly and corrects grammar mistakes I usually miss."
    },
    {
        id: 20, name: "Abhishek Kr. Anand", role: "Advocate, Delhi High Court", image: Abhishek_Kr_Anand,
        text: "I find DraftMate user-friendly, efficient, for legal professionals. It saves time, reduces manual effort, and helps maintain proper legal language and structure which supports faster turnaround."
    },
    {
        id: 21, name: "Amartya Shivam", role: "Associate, Gs law attorney", image: Amartya_Shivam,
        text: "DraftMate has significantly streamlined my legal research and drafting workflow. The platform delivers precise, well-structured outputs while saving considerable time on case law analysis."
    },
    {
        id: 22, name: "Anjali Bharti", role: "Advocate, Patna High Court", image: Anjali_Bharti,
        text: "As a Lawyer and LLM student, I found DraftMate genuinely helpful for quick drafting and research. Saves time and reduce the hassle of formatting. Highly recommended."
    },
    {
        id: 23, name: "Ayushi", role: "Advocate, Patna High Court", image: Ayushi,
        text: "Since using Draftmate, work has become quite smooth and it's a great tool overall. I would highly recommend people to use it for the ease of drafting."
    },
    {
        id: 24, name: "Bhavika Verma", role: "Advocate, Delhi High Court", image: Bhavika_Verma,
        text: "I am using Draftmate AI and I really like it. It helps me write better and faster, and the suggestions are clear and easy to apply. Definitely a useful tool."
    },
    {
        id: 25, name: "Divya Malvi", role: "Advocate, District Court Bhopal", image: Divya_Malvi,
        text: "I use draftmate for my legal research and drafting and it is really helpful. I highly recommend using it."
    },
    {
        id: 26, name: "Madhumita L", role: "Advocate, High Court of Karnataka", image: Madhumita_L,
        text: "I have gone through this, it's so useful and helpful for the legal fraternity and which make our work easier, so our research improves and we can gather the precedent in a easy way."
    },
    {
        id: 27, name: "Pawan Raj Singh Chandel", role: "Advocate, Himachal Pradesh High Court", image: Pawan_raj_singh_chandel,
        text: "A thoughtfully curated website that provides meaningful research assistance with clarity, depth."
    },
    {
        id: 28, name: "Puspalata Chadni", role: "Advocate, Gorakhpur District Court", image: Puspalata_Chadni,
        text: "I have been using it for 5 weeks now, I am really impressed with the summarisation function as well as the automatic drafting."
    },
    {
        id: 29, name: "Richa", role: "Advocate, Patna High Court", image: Richa,
        text: "The Draftmate is highly user-friendly and well-designed. It offers clear, reliable legal information with easy navigation and quick search features."
    },
    {
        id: 30, name: "Rinki Khatun", role: "Advocate, Kolkata high court", image: Rinki_khatun,
        text: "As someone who regularly works on legal research and drafting, DraftMate has been extremely helpful. It simplifies complex research and helps create clear, well-structured drafts in much less time."
    },
    {
        id: 31, name: "Shahil Prashar", role: "Advocate, Patna High court", image: Shahil_Prashar,
        text: "DraftMate AI is an AI-powered writing assistant designed to help with drafting and improving written content from basic text creation to grammar, style, and structure suggestions."
    },
    {
        id: 32, name: "Shakshi Suman", role: "Associate, Triple A Law Partners", image: Shakshi_Suman,
        text: "I regularly use DraftMate for legal drafting and research support, and it has been extremely helpful in improving the speed and structure of my drafts."
    },
    {
        id: 33, name: "Smruti Dhoot", role: "Advocate, Nagpur HC", image: Smruti_Dhoot,
        text: "I found DraftMate to be a highly effective tool for legal drafting and research. The AI-powered drafting feature is very accurate and has significantly reduced my workload."
    },
    {
        id: 34, name: "Soyansu Dash", role: "Advocate, Delhi High Court", image: Soyansu_Dash,
        text: "Draftmate gave really helpful insights while drafting contracts and the research notes that i got through the AI assistant were pretty good."
    },
    {
        id: 35, name: "Sriya Naik", role: "Advocate, High Court of Karnataka", image: Sriya_Naik,
        text: "Well-built platform. Very useful for legal research. Provides accurate information for the relevant topic."
    },
    {
        id: 36, name: "Adhiti Sharma", role: "Advocate, Mysore court complex", image: Adhiti_Sharma,
        text: "It is a well-structured and user-friendly platform for legal drafting. A handy one-stop solution for advocates with practical and easy-to-use resources."
    },
];

const ROW_A = TESTIMONIALS.slice(0, 18);
const ROW_B = TESTIMONIALS.slice(18);

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars() {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

// ─── Card (Redesigned for Massive Image) ──────────────────────────────────────
function TestimonialCard({ item, onExpand }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="relative shrink-0 mx-3 rounded-2xl overflow-hidden cursor-pointer select-none flex"
            style={{
                width: "420px",
                minHeight: "220px",
                background: "white",
                border: "1px solid rgba(226,232,240,0.7)",
                transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
                transform: hovered ? "scale(1.03) translateY(-4px)" : "scale(1) translateY(0)",
                boxShadow: hovered
                    ? "0 20px 50px rgba(15,28,46,0.15), 0 4px 16px rgba(15,28,46,0.08)"
                    : "0 4px 20px rgba(15,28,46,0.06), 0 1px 4px rgba(15,28,46,0.04)",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onExpand(item)}
        >
            {/* Top accent bar - Now spans across the absolute top */}
            <div
                className="absolute top-0 left-0 right-0 h-1.5 z-10"
                style={{ background: "linear-gradient(90deg, #1D4ED8, #2563EB, #60A5FA)" }}
            />

            {/* MASSIVE LEFT IMAGE */}
            <div className="relative w-[160px] shrink-0 bg-slate-100">
                <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {/* Subtle inner shadow overlay for depth */}
                <div className="absolute inset-0 shadow-[inset_-4px_0_12px_rgba(0,0,0,0.04)] pointer-events-none" />
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex flex-col gap-3 p-5 pt-6 flex-1 justify-center">
                {/* Quote icon + stars */}
                <div className="flex items-center justify-between">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(37,99,235,0.08)" }}
                    >
                        <Quote className="w-4 h-4" style={{ color: "#2563EB" }} />
                    </div>
                    <Stars />
                </div>

                {/* Quote text */}
                <p
                    className="text-[12.5px] leading-relaxed line-clamp-4 flex-1"
                    style={{ color: "#475569" }}
                >
                    "{item.text}"
                </p>

                {/* Divider */}
                <div style={{ borderTop: "1px solid rgba(226,232,240,0.8)" }} />

                {/* Author Details */}
                <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#0F1C2E] truncate leading-tight">
                        {item.name}
                    </div>
                    <div className="text-[11px] leading-tight truncate mt-0.5" style={{ color: "#94A3B8" }}>
                        {item.role}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Marquee row ──────────────────────────────────────────────────────────────
function MarqueeRow({ items, direction, onExpand }) {
    const [paused, setPaused] = useState(false);
    const tripled = [...items, ...items, ...items];
    const animClass =
        direction === "left" ? "animate-marquee-x-left" : "animate-marquee-x-right";

    return (
        <div
            className="overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div
                className={`flex w-max ${paused ? "" : animClass} marquee-track`}
                style={{
                    willChange: "transform",
                    animationPlayState: paused ? "paused" : "running",
                }}
            >
                {tripled.map((item, i) => (
                    <TestimonialCard
                        key={`${item.id}-${i}`}
                        item={item}
                        onExpand={onExpand}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function TestimonialModal({ item, onClose }) {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        const fn = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", fn);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", fn);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
            style={{ background: "rgba(15,28,46,0.75)", backdropFilter: "blur(20px)" }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col sm:flex-row"
                style={{
                    background: "white",
                    boxShadow: "0 32px 80px rgba(15,28,46,0.3)",
                    animation: "fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) forwards",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top gradient bar */}
                <div
                    className="absolute top-0 left-0 right-0 h-1.5 z-10"
                    style={{ background: "linear-gradient(90deg, #1D4ED8, #2563EB, #60A5FA)" }}
                />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-all z-20"
                    style={{ background: "rgba(15,28,46,0.06)" }}
                >
                    <X className="w-4 h-4 text-[#0F1C2E]" />
                </button>

                {/* Modal Large Image */}
                <div className="relative w-full sm:w-[260px] h-[240px] sm:h-auto shrink-0 bg-slate-100">
                    <img
                        src={item.image}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                </div>

                <div className="p-8 sm:p-10 flex-1 flex flex-col justify-center">
                    {/* Stars */}
                    <div className="flex gap-1 mb-5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>

                    {/* Large quote icon */}
                    <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(37,99,235,0.08)" }}
                    >
                        <Quote className="w-5 h-5" style={{ color: "#2563EB" }} />
                    </div>

                    {/* Full quote */}
                    <p className="text-[#0F1C2E] text-base leading-relaxed mb-7 italic">
                        &ldquo;{item.text}&rdquo;
                    </p>

                    {/* Divider */}
                    <div className="border-t border-slate-100 mb-6" />

                    {/* Modal Author */}
                    <div>
                        <div className="font-bold text-[#0F1C2E] text-lg">{item.name}</div>
                        <div className="text-[14px] mt-1" style={{ color: "#94A3B8" }}>
                            {item.role}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────
export default function Testimonials() {
    const [expanded, setExpanded] = useState(null);

    return (
        <section className="py-24 divider relative overflow-hidden bg-[#F8FAFF]">
            <div className="container-xl px-5 md:px-10 mb-14">
                <ScrollReveal>
                    <div className="text-center">
                        <span
                            className="text-[11px] tracking-[0.25em] uppercase font-semibold block mb-3"
                            style={{ color: "#94A3B8" }}
                        >
                            Trusted by Legal Professionals
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-[#0F1C2E]">
                            What Advocates Are{" "}
                            <span className="text-gradient">Saying</span>
                        </h2>
                        <p className="text-[#475569] text-base mt-3 max-w-lg mx-auto">
                            Real lawyers. Real results. Hover to pause, click to read full testimonial.
                        </p>
                    </div>
                </ScrollReveal>
            </div>

            <div className="space-y-6">
                {(
                    [
                        { cards: ROW_A, dir: "left" },
                        { cards: ROW_B, dir: "right" },
                    ]
                ).map(({ cards, dir }, rowIdx) => (
                    <div key={rowIdx} className="relative">
                        <div
                            className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                            style={{ background: "linear-gradient(to right, #F8FAFF, transparent)" }}
                        />
                        <div
                            className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                            style={{ background: "linear-gradient(to left, #F8FAFF, transparent)" }}
                        />
                        <MarqueeRow items={cards} direction={dir} onExpand={setExpanded} />
                    </div>
                ))}
            </div>

            {expanded && (
                <TestimonialModal item={expanded} onClose={() => setExpanded(null)} />
            )}
        </section>
    );
}
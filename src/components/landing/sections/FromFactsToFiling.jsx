import { motion } from "framer-motion";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    n: "01",
    label: "Enter Case Facts",
    desc: "Input raw details, upload voice notes, or paste client emails.",
    detail: "Accepts text, voice, PDFs, or WhatsApp forwards.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    n: "02",
    label: "AI Analysis",
    desc: "DraftMate finds relevant acts, sections, and precedents.",
    detail: "Cross-references BNS, CPC, Evidence Act & case law databases.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    n: "03",
    label: "Draft Generated",
    desc: "Get a comprehensive first draft in proper court format.",
    detail: "Formatted per district court, high court, or SC norms.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    n: "04",
    label: "Edit & Export",
    desc: "Fine-tune the content, export to Word/PDF, and file.",
    detail: "One-click export & save for later use.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
];

function StepNode({ step, index }) {
  return (
    <motion.div 
      className="flex flex-col items-center text-center select-none"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      {/* Circle */}
      <div className="relative mb-8" style={{ width: 100, height: 100 }}>
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg,#1D4ED8,#2563EB)",
            boxShadow: "0 4px 14px rgba(37,99,235,0.18)",
            border: "1px solid rgba(255,255,255,0.18)"
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.13)",
              color: "#FFFFFF",
            }}
          >
            {step.icon}
          </div>

          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.20) 0%,transparent 55%)" }}
          />
        </div>

        <div
          className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black z-10"
          style={{
            background: "linear-gradient(135deg,#1D4ED8,#2563EB)",
            color: "#FFFFFF",
            boxShadow: "0 2px 10px rgba(37,99,235,0.55)",
          }}
        >
          {index + 1}
        </div>
      </div>

      {/* Text */}
      <div className="space-y-1.5 px-2" style={{ maxWidth: 180 }}>
        <h3 className="text-[15px] font-bold leading-tight" style={{ color: "#0F1C2E" }}>
          {step.label}
        </h3>
        <p className="text-[12px] leading-relaxed" style={{ color: "#475569" }}>
          {step.desc}
        </p>
        <p className="text-[11px] italic" style={{ color: "#94A3B8" }}>
          {step.detail}
        </p>
      </div>
    </motion.div>
  );
}

function ProgressLine() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ top: 50, left: "calc(12.5% + 50px)", right: "calc(12.5% + 50px)", height: "2px" }}
    >
      <div className="absolute inset-0 rounded-full" style={{ background: "rgba(37,99,235,0.10)" }} />
      <motion.div
        className="absolute left-0 top-0 bottom-0 rounded-full"
        initial={{ width: "0%" }}
        whileInView={{ width: "100%" }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: "linear-gradient(to right,#1D4ED8,#2563EB 60%,#0EA5E9)",
            boxShadow: "0 0 8px rgba(37,99,235,0.70), 0 0 18px rgba(37,99,235,0.35)",
          }}
        />
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "10px", height: "10px", marginRight: "-5px",
            background: "#0EA5E9",
            boxShadow: "0 0 10px rgba(14,165,233,0.9), 0 0 22px rgba(37,99,235,0.6)",
          }}
        />
      </motion.div>
    </div>
  );
}

function MobileStep({ step, index, isLast }) {
  return (
    <motion.div
      className="flex gap-5"
      initial={{ opacity: 0, x: -22 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg,#1D4ED8,#2563EB)",
            border: "1px solid rgba(37,99,235,0.20)",
            boxShadow: "0 0 20px rgba(37,99,235,0.30)",
            color: "white",
          }}
        >
          {step.icon}
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 mt-3"
            style={{ minHeight: 48, background: "linear-gradient(to bottom,rgba(37,99,235,0.28),transparent)" }}
          />
        )}
      </div>
      <div className="pb-10">
        <div className="text-[11px] font-bold tracking-widest mb-1" style={{ color: "#2563EB" }}>
          STEP {index + 1}
        </div>
        <h3 className="text-[16px] font-bold text-[#0F1C2E] mb-1">{step.label}</h3>
        <p className="text-[13px] leading-relaxed" style={{ color: "#475569" }}>{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function FromFactsToFiling() {
  const navigate = useNavigate();
  return (
    <>
      {/* ── Desktop Section ── */}
      <section className="hidden md:block py-28" style={{ background: "#F8FAFF" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 3rem" }}>
          
          {/* Header */}
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span
              className="text-[11px] tracking-[0.25em] uppercase font-semibold block mb-3"
              style={{ color: "#94A3B8" }}
            >
              How It Works
            </span>
            <h2
              className="font-black text-[#0F1C2E]"
              style={{ fontSize: "clamp(2rem,4vw,3.25rem)" }}
            >
              From Facts to Filing{" "}
              <span className="text-gradient" style={{
                background: "linear-gradient(135deg,#1D4ED8,#0EA5E9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>in 4 Steps</span>
            </h2>
          </motion.div>

          {/* Steps grid */}
          <div className="relative">
            <ProgressLine />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: "1rem",
              }}
            >
              {STEPS.map((step, i) => (
                <StepNode key={step.n} step={step} index={i} />
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            className="text-center mt-20"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button onClick={() => navigate('/login')} className="btn-primary px-10 py-4 text-[15px]">
              Start Your First Draft Free
            </button>
          </motion.div>

        </div>
      </section>

      {/* ── Mobile Section ── */}
      <section id="steps-mobile" className="md:hidden" style={{ padding: "5rem 1.25rem", background: "#F8FAFF", borderBottom: "1px solid rgba(37,99,235,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-[11px] tracking-[0.25em] uppercase font-semibold block mb-3" style={{ color: "#94A3B8" }}>
                How It Works
              </span>
              <h2 className="text-4xl font-black text-[#0F1C2E]">
                From Facts to Filing{" "}
                <span className="text-gradient" style={{
                  background: "linear-gradient(135deg,#1D4ED8,#0EA5E9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>in 4 Steps</span>
              </h2>
            </div>
          </ScrollReveal>

          <div>
            {STEPS.map((step, i) => (
              <MobileStep key={step.n} step={step} index={i} isLast={i === STEPS.length - 1} />
            ))}
          </div>
          
          <ScrollReveal delay={350}>
            <div className="text-center mt-10">
              <button className="btn-primary px-10 py-4 text-[15px]">Start Your First Draft Free</button>
            </div>
          </ScrollReveal>

        </div>
      </section>
    </>
  );
}
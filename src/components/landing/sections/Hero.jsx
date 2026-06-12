import {
  useEffect, useRef, useState, useCallback,
} from "react";
import {
  FileText, Gavel, Scale, BookOpen,
  Zap, Shield,
} from "lucide-react";
import TypewriterText from "@/components/landing/TypewriterText";
import AnimatedCounter from "@/components/landing/AnimatedCounter";

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPED = [
  "Draft Court-Ready Legal Documents in Minutes",
  "Accurate Legal research with relevant citations.",
  "Auto-formatted draft for every court.",
  "Updated Case Laws and Statutes.",
  "End to end legal workflow with AI.",
];

// Floating card data — positions tuned to sit over the book image (right 58% of viewport)
const CARDS = [
  {
    icon: FileText, label: "Lease Deed",
    sub: "Ready in 90 sec", delay: "0s",
    pos: { top: "14%", right: "37%" },
  },
  {
    icon: Gavel, label: "SC Judgment",
    sub: "147 citations", delay: "1.6s",
    pos: { top: "10%", right: "9%" },
  },
  {
    icon: Scale, label: "Contract Review",
    sub: "3 risks flagged", delay: "3s",
    pos: { top: "55%", right: "39%" },
  },
  {
    icon: BookOpen, label: "Plaint Draft",
    sub: "Court-ready format", delay: "4.4s",
    pos: { top: "51%", right: "8%" },
  },
];

const STATS = [
  { to: 212,   suffix: "+", label: "Publishers"   },
  { to: 10000, suffix: "+", label: "Docs Drafted" },
  { to: 98,    suffix: "%", label: "Accuracy"     },
  { to: 5000,  suffix: "+", label: "Advocates"    },
];

const PARTICLES = [
  { top: "20%", right: "29%", size: 5, delay: "0s",   dur: "4.2s" },
  { top: "34%", right: "48%", size: 4, delay: "1.1s", dur: "5.1s" },
  { top: "61%", right: "21%", size: 6, delay: "2.2s", dur: "3.7s" },
  { top: "17%", right: "16%", size: 3, delay: "0.6s", dur: "6.3s" },
  { top: "73%", right: "34%", size: 4, delay: "3.1s", dur: "4.8s" },
  { top: "43%", right: "54%", size: 5, delay: "1.8s", dur: "5.5s" },
];

// ── Background image + parallax FX ──────────────────────────────────────────
function HeroBgImage() {
  const containerRef = useRef(null);
  const imageRef     = useRef(null);

  const onMove = useCallback((e) => {
    const c   = containerRef.current;
    const img = imageRef.current;
    if (!c || !img) return;
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    img.style.transform = `scale(1.05) translateX(${x * -20}px) translateY(${y * -13}px)`;
  }, []);

  const onLeave = useCallback(() => {
    if (imageRef.current)
      imageRef.current.style.transform = "scale(1.02) translateX(0) translateY(0)";
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [onMove, onLeave]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>

      {/* Parallax image wrapper */}
      <div
        ref={imageRef}
        className="absolute inset-0"
        style={{
          transform:  "scale(1.02)",
          transition: "transform 0.9s cubic-bezier(0.25,0.46,0.45,0.94)",
          willChange: "transform",
        }}
      >
        <img
          src="/image_bg.png"
          alt="DraftMate — Constitution of India"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "60% center" }}
        />
      </div>

      {/* Left-to-right text-readability fade */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(
          to right,
          rgba(248,250,255,1)    0%,
          rgba(248,250,255,0.99) 28%,
          rgba(248,250,255,0.93) 40%,
          rgba(248,250,255,0.55) 55%,
          rgba(248,250,255,0.10) 68%,
          rgba(248,250,255,0)    78%
        )`,
      }} />

      {/* Top + bottom atmospheric fades */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, rgba(248,250,255,0.60) 0%, transparent 18%, transparent 78%, rgba(248,250,255,0.70) 100%)",
      }} />

      {/* Feather glow halo over book */}
      <div className="absolute pointer-events-none" style={{
        top: "4%", right: "9%",
        width: "200px", height: "260px",
        background: "radial-gradient(ellipse, rgba(96,165,250,0.28) 0%, transparent 70%)",
        animation:  "featherGlow 3.5s ease-in-out infinite",
      }} />

      {/* Energy beam from book spine */}
      <div className="absolute pointer-events-none" style={{
        bottom: "29%", right: "21%",
        width: "300px", height: "3px",
        background:   "linear-gradient(to left, rgba(37,99,235,0.85), rgba(14,165,233,0.55), transparent)",
        borderRadius: "99px",
        animation:    "writingBeam 3s ease-in-out infinite",
        filter:       "blur(1px)",
      }} />
      <div className="absolute pointer-events-none" style={{
        bottom: "29.6%", right: "21%",
        width: "190px", height: "1px",
        background: "linear-gradient(to left, rgba(14,165,233,0.7), transparent)",
        animation:  "writingBeam 3s ease-in-out 0.6s infinite",
      }} />

      {/* Book spine light streak */}
      <div className="absolute pointer-events-none" style={{
        bottom: "21%", right: "17%",
        width: "340px", height: "4px",
        background:   "linear-gradient(to right, transparent, rgba(37,99,235,0.65), rgba(14,165,233,0.85), transparent)",
        borderRadius: "99px",
        animation:    "lightLeak 5.5s ease-in-out infinite",
        filter:       "blur(2px)",
      }} />

      {/* Floating AI particles */}
      {PARTICLES.map((p, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none" style={{
          top: p.top, right: p.right,
          width: p.size, height: p.size,
          background:  i % 2 === 0 ? "rgba(37,99,235,0.75)" : "rgba(14,165,233,0.85)",
          animation:   `particleDrift ${p.dur} ease-in-out ${p.delay} infinite`,
          boxShadow:   `0 0 ${p.size * 2}px rgba(37,99,235,0.55)`,
        }} />
      ))}

      {/* AI scan line over book area */}
      <div className="absolute pointer-events-none overflow-hidden" style={{
        top: "36%", right: "10%", width: "40%", height: "46%",
      }}>
        <div className="absolute left-0 right-0" style={{
          height:     "1px",
          background: "linear-gradient(to right, transparent, rgba(14,165,233,0.45), rgba(37,99,235,0.35), transparent)",
          animation:  "scanLine 4.5s linear infinite",
          top:        "0",
        }} />
      </div>
    </div>
  );
}

// ── Floating card ─────────────────────────────────────────────────────────────
function FloatingCard({ icon: Icon, label, sub, delay, pos }) {
  return (
    <div
      className="absolute z-20"
      style={{
        ...pos,
        animation: `floatCard 7s ease-in-out ${delay} infinite`,
        willChange: "transform",
      }}
    >
      <div
        className="surface-card rounded-2xl px-4 py-3 flex items-center gap-3 w-[178px] card-lift cursor-default select-none"
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(37,99,235,0.08)" }}
        >
          <Icon className="w-4 h-4" style={{ color: "#2563EB" }} />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[#0F1C2E] leading-tight truncate">
            {label}
          </div>
          <div className="text-[11px] mt-0.5 truncate" style={{ color: "#94A3B8" }}>
            {sub}
          </div>
        </div>
        {/* Live indicator dot */}
        <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
            style={{ animation: "pulseRing 2.5s ease-out infinite" }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      </div>
    </div>
  );
}

// ── Main Hero ─────────────────────────────────────────────────────────────────
export default function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      id="hero"
      className="relative flex flex-col overflow-hidden pt-[70px]"
      style={{ minHeight: "100svh" }}
    >
      {/* Full-bleed background with FX */}
      <HeroBgImage />

      {/* Floating cards — desktop only, hover-interactive */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block" style={{ zIndex: 20 }}>
        {CARDS.map((c) => (
          <FloatingCard
            key={c.label}
            icon={c.icon}
            label={c.label}
            sub={c.sub}
            delay={c.delay}
            pos={c.pos}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          LEFT CONTENT — constrained to ~42 % of viewport width
      ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-[1440px] mx-auto w-full px-5 md:px-10 lg:px-20 py-16">
          <div className="w-full lg:w-[42%] xl:max-w-[530px] space-y-6">

            {/* ① Badge */}
            <div
              className={`transition-all duration-500 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                           text-[11px] font-semibold tracking-widest uppercase"
                style={{
                  background: "rgba(37,99,235,0.07)",
                  border:     "1px solid rgba(37,99,235,0.18)",
                  color:      "#1D4ED8",
                }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"
                    style={{ animation: "pulseRing 2.5s ease-out infinite" }}
                  />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-600" />
                </span>
                🚀 India's Intelligent AI Legal Workspace
              </span>
            </div>

            {/* ② Headline */}
            <div
              className={`transition-all duration-700 delay-75 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
            >
              <h1
                className="font-black leading-[1.07] text-[#0F1C2E]"
                style={{ fontSize: "clamp(2.6rem, 4vw, 3.95rem)" }}
              >
                DraftMate AI:{" "}
                <span className="text-gradient">Your Intelligent</span>
                <br />
                AI Legal
                <br />
                <span className="text-[#0F1C2E]">Companion &amp; Workspace</span>
              </h1>
            </div>

            {/* ③ Typewriter pill */}
            <div
              className={`transition-all duration-700 delay-150 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
            >
              <div
                className="rounded-2xl px-5 py-4"
                style={{
                  background:  "rgba(255,255,255,0.92)",
                  border:      "1px solid rgba(226,232,240,0.7)",
                  borderLeft:  "3px solid #2563EB",
                  boxShadow:   "0 2px 12px rgba(15,28,46,0.06)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="relative flex h-2 w-2 mt-2 shrink-0">
                    <span
                      className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                      style={{ animation: "pulseRing 2.5s ease-out infinite" }}
                    />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <p className="text-[14px] md:text-[15px] font-medium text-[#0F1C2E] leading-relaxed min-h-[2.8rem]">
                    {mounted && (
                      <TypewriterText
                        texts={TYPED}
                        typingSpeed={52}
                        deletingSpeed={25}
                        pauseMs={2800}
                        cursorClass="bg-blue-600"
                      />
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* ④ Body copy */}
            <p
              className={`text-[14px] md:text-[15px] leading-relaxed transition-all duration-700 delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
              style={{ color: "#475569" }}
            >
              Research, draft, manage cases, collaborate, and grow your practice —
              all from one intelligent platform built for legal professionals.
            </p>

            {/* ⑤ CTA buttons */}
            <div
              className={`flex flex-wrap gap-3 transition-all duration-700 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
            >
              <button
                className="flex items-center gap-2 px-8 py-4 text-[15px] font-semibold
                           rounded-xl text-white transition-all duration-200
                           hover:opacity-90 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)",
                  boxShadow:  "0 4px 20px rgba(37,99,235,0.35)",
                }}
              >
                <Zap className="w-4 h-4" />
                Start Drafting Free
              </button>
              <button
                className="flex items-center gap-2 px-8 py-4 text-[15px] font-semibold
                           rounded-xl border border-slate-200 bg-white text-slate-700
                           hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Book a Demo
              </button>
            </div>

            {/* ⑥ Trust micro-row */}
            <div
              className={`flex flex-wrap items-center gap-x-5 gap-y-2 transition-all duration-700 delay-[400ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
            >
              {[
                { icon: Shield,   text: "DPDPA Compliant"  },
                { icon: Zap,      text: "~2 min avg. draft" },
                { icon: BookOpen, text: "Indian Law Trained" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-[12px]" style={{ color: "#94A3B8" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "#60A5FA" }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          Stats bar — pinned to bottom of hero
      ══════════════════════════════════════════════════════════ */}
      <div
        className={`relative z-10 transition-all duration-700 delay-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
        style={{
          background:     "rgba(255,255,255,0.90)",
          backdropFilter: "blur(20px)",
          borderTop:      "1px solid rgba(226,232,240,0.7)",
        }}
      >
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 lg:px-20">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200/60">
            {STATS.map((s) => (
              <div key={s.label} className="py-5 px-6 text-center">
                <div className="text-2xl md:text-3xl font-black text-gradient mb-0.5">
                  <AnimatedCounter to={s.to} suffix={s.suffix} />
                </div>
                <div
                  className="text-[11px] font-medium tracking-wide uppercase"
                  style={{ color: "#94A3B8" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll caret */}
      <div
        className={`absolute bottom-[80px] left-10 md:left-20 lg:left-24
                    flex flex-col items-start gap-2 pointer-events-none z-10
                    transition-all duration-700 delay-700
                    ${mounted ? "opacity-100" : "opacity-0"}`}
      >
        <span className="text-[10px] tracking-widest uppercase" style={{ color: "#CBD5E1" }}>
          Scroll
        </span>
        <div
          className="w-px h-10"
          style={{ background: "linear-gradient(to bottom, rgba(37,99,235,0.35), transparent)" }}
        />
      </div>
    </section>
  );
}
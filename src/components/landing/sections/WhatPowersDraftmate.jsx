import {
  useRef,
  useState,
  useCallback,
} from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { Globe, Zap, Shield, Layers } from "lucide-react";

/* ─────────────────────────────────────────────
   Shared easing
───────────────────────────────────────────── */
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1];
const EASE_SPRING   = { type: "spring", stiffness: 80, damping: 18, mass: 0.6 };

/* ─────────────────────────────────────────────
   Feature card data
───────────────────────────────────────────── */
const CARDS = [
  {
    id:    "legal-reality",
    icon:  Globe,
    side:  "left",
    row:   "top",
    title: "Built for Indian Legal Reality",
    desc:  "Shaped through deep empathy mapping with Indian lawyers, tested on real practice to give responses you can stand by in court.",
    initialX: -80,
    initialY:  0,
    delay:     0,
  },
  {
    id:    "intelligence",
    icon:  Shield,
    side:  "right",
    row:   "top",
    title: "Intelligence You Trust",
    desc:  "When DraftMate suggests, you can stand behind it in court. When it drafts, you can file with conviction.",
    initialX:  80,
    initialY: -40,
    delay:     0.12,
  },
  {
    id:    "precision",
    icon:  Zap,
    side:  "left",
    row:   "bottom",
    title: "Effortless Precision",
    desc:  "No learning curve, no prompt expertise. Speak like you brief a junior. Get structured legal clarity, not chatbot fluff.",
    initialX: -80,
    initialY:  40,
    delay:     0.08,
  },
  {
    id:    "platform",
    icon:  Layers,
    side:  "right",
    row:   "bottom",
    title: "One Platform. Full Control.",
    desc:  "One subscription, every tool you need — in a clutter-free, intuitive workspace that simply makes sense.",
    initialX:  80,
    initialY:  40,
    delay:     0.2,
  },
];

/* ─────────────────────────────────────────────
   3D tilt hook
   Returns onMouseMove / onMouseLeave handlers
   and motion values for rotateX / rotateY.
───────────────────────────────────────────── */
function use3DTilt(maxDeg = 8) {
  const x  = useMotionValue(0);
  const y  = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 120, damping: 20 });
  const sy = useSpring(y, { stiffness: 120, damping: 20 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-maxDeg, maxDeg]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [ maxDeg,-maxDeg]);

  const onMouseMove = useCallback(
    (e) => {
      const r   = e.currentTarget.getBoundingClientRect();
      const nx  = (e.clientX - r.left) / r.width  - 0.5;
      const ny  = (e.clientY - r.top)  / r.height - 0.5;
      x.set(nx);
      y.set(ny);
    },
    [x, y]
  );

  const onMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { rotateX, rotateY, onMouseMove, onMouseLeave };
}

/* ─────────────────────────────────────────────
   Feature card (surrounding 4)
───────────────────────────────────────────── */
function FeatureCard({ card, sectionInView }) {
  const [hovered, setHovered] = useState(false);
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = use3DTilt(5);

  return (
    <motion.div
      initial={{ opacity: 0, x: card.initialX, y: card.initialY }}
      animate={
        sectionInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, x: card.initialX, y: card.initialY }
      }
      transition={{
        duration: 0.75,
        delay:    card.delay,
        ease:     EASE_OUT_EXPO,
      }}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
        perspective: 800,
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        onMouseLeave();
        setHovered(false);
      }}
      onMouseEnter={() => setHovered(true)}
      className="rounded-2xl p-7 cursor-default"
      css-transition="all"
    >
      {/* Inner — actual visible card surface */}
      <motion.div
        className="rounded-2xl p-7 h-full"
        animate={{
          background:  hovered ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.72)",
          borderColor: hovered ? "rgba(37,99,235,0.22)" : "rgba(226,232,240,0.7)",
          boxShadow:   hovered
            ? "0 12px 40px rgba(37,99,235,0.12), 0 4px 12px rgba(15,28,46,0.08)"
            : "0 1px 4px rgba(15,28,46,0.05)",
          y: hovered ? -5 : 0,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ border: "1px solid rgba(226,232,240,0.7)" }}
      >
        {/* Icon */}
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
          animate={{
            background: hovered ? "rgba(37,99,235,0.11)" : "rgba(37,99,235,0.06)",
            scale:      hovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <card.icon className="w-5 h-5" style={{ color: "#2563EB" }} />
        </motion.div>

        <h3 className="text-[16px] font-bold text-[#0F1C2E] mb-2 leading-tight">
          {card.title}
        </h3>
        <p className="text-[14px] leading-relaxed" style={{ color: "#475569" }}>
          {card.desc}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Center Privacy Card
───────────────────────────────────────────── */
function PrivacyCard({ sectionInView }) {
  const [hovered, setHovered] = useState(false);
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = use3DTilt(7);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.78, y: 24 }}
      animate={
        sectionInView
          ? { opacity: 1, scale: 1, y: 0 }
          : { opacity: 0, scale: 0.78, y: 24 }
      }
      transition={{
        duration: 0.85,
        delay:    0.38,
        ease:     EASE_OUT_EXPO,
      }}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
        perspective: 900,
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { onMouseLeave(); setHovered(false); }}
      onMouseEnter={() => setHovered(true)}
      className="flex justify-center"
    >
      <motion.div
        className="relative overflow-hidden cursor-default"
        animate={{
          y:          hovered ? -12 : 0,
          scale:      hovered ? 1.035 : 1,
          boxShadow:  hovered
            ? "0 0 60px rgba(37,99,235,0.50), 0 0 120px rgba(37,99,235,0.20), 0 28px 72px rgba(15,28,46,0.28)"
            : "0 0 32px rgba(37,99,235,0.28), 0 0 64px rgba(37,99,235,0.10), 0 20px 56px rgba(15,28,46,0.20)",
        }}
        transition={{ duration: 0.5, ease: [0.34, 1.2, 0.64, 1] }}
        style={{
          width:        "290px",
          height:       "430px",
          borderRadius: "28px",
          background:   "linear-gradient(160deg, #070E1A 0%, #0F1C2E 45%, #1A2E50 100%)",
          border:       "1px solid rgba(37,99,235,0.28)",
          animation:    "glowPulse 4s ease-in-out infinite",
        }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.07 }}
          animate={{ backgroundPosition: ["0px 0px", "0px -48px"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),"
                + "linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </motion.div>

        <motion.div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          animate={{
            opacity: hovered ? 1 : 0.7,
          }}
          transition={{ duration: 0.5 }}
          style={{
            height:     "260px",
            background: "radial-gradient(ellipse at 50% -5%, rgba(37,99,235,0.55) 0%, transparent 68%)",
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius:        "28px",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.4), transparent 40%, rgba(14,165,233,0.25) 100%)",
            WebkitMask:          "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite:       "exclude",
            padding:             "1px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center">

          <motion.div
            className="mb-7"
            animate={{
              y:     [0, -10, 0],
              scale: hovered ? 1.1 : 1,
            }}
            transition={
              hovered
                ? { duration: 0.45, ease: [0.34, 1.2, 0.64, 1] }
                : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <div className="relative w-[130px] h-[130px]">

              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ scale: [1, 1.6, 1], opacity: [0.45, 0, 0.45] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                style={{ background: "rgba(37,99,235,0.22)" }}
              />
              <motion.div
                className="absolute rounded-full"
                animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
                transition={{
                  duration: 3,
                  repeat:   Infinity,
                  ease:     "easeOut",
                  delay:    0.7,
                }}
                style={{
                  inset:      "10px",
                  background: "rgba(37,99,235,0.3)",
                }}
              />

              <svg
                viewBox="0 0 100 100"
                className="w-full h-full relative z-10"
                style={{ filter: "drop-shadow(0 0 12px rgba(96,165,250,0.5))" }}
              >
                <defs>
                  <linearGradient id="sg3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#93C5FD" />
                    <stop offset="50%"  stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                  <filter id="glow3">
                    <feGaussianBlur stdDeviation="2.5" result="blur"/>
                    <feMerge>
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M50 6 L86 20 L86 52 C86 74 67 89 50 96 C33 89 14 74 14 52 L14 20 Z"
                  fill="url(#sg3)"
                  filter="url(#glow3)"
                />
                <rect x="35" y="44" width="30" height="26" rx="5"
                  fill="rgba(7,14,26,0.88)" />
                <path
                  d="M40 44 L40 36 A10 10 0 0 1 60 36 L60 44"
                  fill="none"
                  stroke="rgba(7,14,26,0.88)"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="58" r="4.5" fill="#60A5FA" />
                <line x1="50" y1="62" x2="50" y2="68"
                  stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
          </motion.div>

          <h3 className="text-[23px] font-bold text-white mb-2 leading-tight">
            Data Privacy
          </h3>
          <p
            className="text-[13px] leading-relaxed mb-6"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Your documents are yours.<br />
            Encrypted, never used for training.
          </p>

          <div className="flex gap-2.5 flex-wrap justify-center">
            {["SOC2 TYPE 1", "DPDPA"].map((b) => (
              <motion.span
                key={b}
                animate={{ opacity: hovered ? 1 : 0.8 }}
                transition={{ duration: 0.3 }}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest"
                style={{
                  background: "rgba(96,165,250,0.1)",
                  border:     "1px solid rgba(96,165,250,0.25)",
                  color:      "#93C5FD",
                }}
              >
                {b}
              </motion.span>
            ))}
          </div>

          <div className="absolute inset-0 overflow-hidden rounded-[28px] pointer-events-none">
            <motion.div
              className="absolute left-0 right-0"
              style={{
                height:     "1.5px",
                background: "linear-gradient(to right, transparent, rgba(96,165,250,0.5), rgba(37,99,235,0.4), transparent)",
              }}
              animate={{ top: ["-2%", "102%"] }}
              transition={{
                duration: 4,
                repeat:   Infinity,
                ease:     "linear",
              }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Main section export
───────────────────────────────────────────── */
export default function WhatPowersDraftmate() {
  const sectionRef  = useRef(null);

  const sectionInView = useInView(sectionRef, {
    once:   true,
    margin: "-15%",
  });

  const headerRef    = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-10%" });

  const leftCards  = CARDS.filter(c => c.side === "left");
  const rightCards = CARDS.filter(c => c.side === "right");

  return (
    <section className="section-pad divider bg-white/30">
      <div className="container-xl" ref={sectionRef}>

        {/* ── Header ── */}
        <div ref={headerRef} className="text-center mb-16">
          <motion.span
            className="text-[11px] tracking-[0.25em] uppercase font-semibold block mb-3"
            style={{ color: "#94A3B8" }}
            initial={{ opacity: 0, y: 12 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          >
            The DraftMate Movement
          </motion.span>

          <motion.h2
            className="text-4xl md:text-5xl font-black text-[#0F1C2E] mb-3"
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE_OUT_EXPO }}
          >
            What Powers the{" "}
            <span className="text-gradient">DraftMate Movement</span>
          </motion.h2>

          <motion.p
            className="text-base"
            style={{ color: "#475569" }}
            initial={{ opacity: 0, y: 12 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.16, ease: EASE_OUT_EXPO }}
          >
            One-stop solution designed to transform complexity into clarity.
          </motion.p>
        </div>

        {/* ── Card grid ── */}
        <div className="grid lg:grid-cols-3 gap-5 items-center">

          {/* Left column */}
          <div className="space-y-5">
            {leftCards.map((card) => (
              <FeatureCard
                key={card.id}
                card={card}
                sectionInView={sectionInView}
              />
            ))}
          </div>

          {/* Centre — Data Privacy card (appears last) */}
          <PrivacyCard sectionInView={sectionInView} />

          {/* Right column */}
          <div className="space-y-5">
            {rightCards.map((card) => (
              <FeatureCard
                key={card.id}
                card={card}
                sectionInView={sectionInView}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
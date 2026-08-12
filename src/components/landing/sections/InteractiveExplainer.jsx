import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText, Search, Workflow, FolderOpen,
  GraduationCap, Languages, ArrowRight,
  CheckCircle, Star, BookOpen, Brain,
  Scale, Users, Globe, Zap, ChevronRight,
  Boxes, FileEdit, Shield, Calculator, Library,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/landing/ScrollReveal";

const FEATURES = [
  // ... Keep your existing FEATURES array here ...
  {
    id: "drafting",
    icon: FileText,
    shortTitle: "AI-Powered Accurate Legal Drafting & Research",
    title: "AI-Powered Accurate Legal Drafting & Research",
    headline: "Draft court-ready documents and conduct legal research — simultaneously.",
    desc: "DraftMate understands Indian legal practice at its core. Generate fully structured, court-ready legal documents while simultaneously accessing verified case law, statutory references, and legal precedents. Every draft is formatted to the standards of the relevant court with zero hallucinations.",
    accent: "#2563EB",
    accentLight: "rgba(37,99,235,0.08)",
    items: [
      { icon: FileText, label: "Court-Ready Drafting", sub: "Petitions, plaints, notices, agreements" },
      { icon: Search, label: "Verified Legal Research", sub: "SC & HC judgments with real citations" },
      { icon: BookOpen, label: "Statute Intelligence", sub: "BNS, CPC, Evidence Act, Constitution" },
      { icon: CheckCircle, label: "Zero Hallucinations", sub: "Every reference is real and verifiable" },
    ],
  },
  {
    id: "workflow",
    icon: Workflow,
    shortTitle: "AI-Powered Legal Workflow & Automation",
    title: "AI-Powered Legal Workflow & Automation",
    headline: "Automate repetitive legal tasks and manage your practice intelligently.",
    desc: "Eliminate hours of manual legal work. DraftMate automates drafting workflows, case preparation, client communication, document organization, and end-to-end legal process management — so you can focus entirely on strategy and advocacy.",
    accent: "#0D9488",
    accentLight: "rgba(13,148,136,0.08)",
    items: [
      { icon: Zap, label: "Automated Drafting Pipelines", sub: "Trigger drafts from case facts" },
      { icon: Users, label: "Client Communication", sub: "Intake, updates, and follow-ups" },
      { icon: FolderOpen, label: "Case Preparation", sub: "Organize facts, evidence, and timelines" },
      { icon: CheckCircle, label: "Process Management", sub: "Track case status end-to-end" },
    ],
  },
  {
    id: "documents",
    icon: FolderOpen,
    shortTitle: "Document Analysis & Management",
    title: "Document Analysis & Management",
    headline: "Extract intelligence from any legal document in seconds.",
    desc: "Upload contracts, agreements, judgments, or any legal document. DraftMate's AI instantly identifies key clauses, obligations, risks, important dates, summaries, and legal insights — while keeping your entire document library organized and searchable.",
    accent: "#7C3AED",
    accentLight: "rgba(124,58,237,0.08)",
    items: [
      { icon: Search, label: "Clause Extraction", sub: "Obligations, rights, and restrictions" },
      { icon: Brain, label: "AI Risk Summary", sub: "Liabilities, gaps, and red flags" },
      { icon: FileText, label: "Document Intelligence", sub: "Key dates, milestones, terminations" },
      { icon: FolderOpen, label: "Smart Management", sub: "Case organizer and Folder based case chronology management" },
      { icon: FolderOpen, label: "Permission Based Access", sub: "Controlled Access and Permissions, including team vault and shared case folders" },
    ],
  },
  {
    id: "profile",
    icon: Users,
    shortTitle: "Lawyer's Profile for Visibility",
    title: "Lawyer Profile & Professional Visibility",
    headline: "Build your professional presence and reach clients who need you.",
    desc: "Create a verified professional profile that showcases your expertise, practice areas, court experience, and credentials. DraftMate's lawyer directory connects advocates with clients actively seeking legal help — increasing your visibility within India's legal ecosystem.",
    accent: "#B45309",
    accentLight: "rgba(180,83,9,0.08)",
    items: [
      { icon: Star, label: "Verified Advocate Profile", sub: "Credentials, bar registration, experience" },
      { icon: Globe, label: "Practice Area Showcase", sub: "Criminal, civil, corporate, family" },
      { icon: Users, label: "Client Discovery", sub: "Reach clients searching for legal help" },
      { icon: Scale, label: "Reputation Building", sub: "Reviews, ratings, and endorsements" },
    ],
  },
  {
    id: "student",
    icon: GraduationCap,
    shortTitle: "Built-In Student Mode",
    title: "Built-In Student Mode",
    headline: "A dedicated AI legal learning environment for the next generation of lawyers.",
    desc: "Student Mode is a purpose-built legal learning ecosystem within DraftMate. Designed specifically for law students, it bridges the gap between academic learning and real-world legal practice through AI-powered tools that make studying, drafting, and mooting faster and smarter.",
    accent: "#2563EB",
    accentLight: "rgba(37,99,235,0.06)",
    isStudent: true,
    items: [
      { icon: Scale, label: "Moot Court Assistant", sub: "AI-powered moot prep and argument building" },
      { icon: Brain, label: "AI Judge Mode", sub: "Simulates judicial questioning for practice" },
      { icon: BookOpen, label: "Legal Flash Cards", sub: "Key concepts, sections, and case law" },
      { icon: FileText, label: "Case Brief Generator", sub: "Structured briefs from judgment summaries" },
      { icon: GraduationCap, label: "Academic Writing Assistant", sub: "Research papers, memos, and essays" },
      { icon: CheckCircle, label: "Practice Quizzes", sub: "Topic-wise tests with instant feedback" },
    ],
  },
  {
    id: "translation",
    icon: Languages,
    shortTitle: "Legal Documents Translation with Accuracy",
    title: "Legal Document Translation with Accuracy",
    headline: "Translate legal documents while preserving their legal meaning and force.",
    desc: "Legal translation demands precision. DraftMate translates documents across multiple Indian languages while preserving legal terminology, jurisdictional context, clause structure, and formatting — ensuring the translated document carries the same legal weight as the original.",
    accent: "#0EA5E9",
    accentLight: "rgba(14,165,233,0.08)",
    items: [
      { icon: Languages, label: "Multi-Language Support", sub: "Hindi, Tamil, Marathi, Telugu & more" },
      { icon: FileText, label: "Legal Terminology Preserved", sub: "Technical terms stay legally precise" },
      { icon: Scale, label: "Side-by-Side Comparison", sub: "Original and translated view together" },
      { icon: CheckCircle, label: "Jurisdiction-Aware Context", sub: "State-specific legal nuances respected" },
    ],
  },
  {
    id: "advanced-tools",
    icon: Boxes, 
    shortTitle: "Advanced AI Legal Tools",
    title: "Comprehensive Advanced AI Tool Suite",
    headline: "Streamline your entire practice with an integrated suite of advanced legal utilities.",
    desc: "Beyond intelligent drafting and research, DraftMate equips you with a powerful arsenal of practice management tools. Manage client relationships, manipulate legal PDFs, securely store sensitive case files, and compute critical legal metrics—all within a single, unified ecosystem designed for Indian legal professionals.",
    accent: "#f312ac",
    accentLight: "rgba(246, 92, 200, 0.08)",
    items: [
      { icon: Users, label: "Client Management", sub: "Organize contacts, matters, and communication history" },
      { icon: FileEdit, label: "Smart PDF Toolkit", sub: "Merge, split, OCR, and redact legal documents" },
      { icon: Shield, label: "Personal Case Vault", sub: "End-to-end encrypted storage for sensitive files" },
      { icon: Calculator, label: "Legal Calculators", sub: "Quickly compute court fees, interest, and limitation periods" },
      { icon: Library, label: "Legal Depository", sub: "Centralized repository for your firm's templates and precedents" },
    ],
  }
];

function PreviewPanel({ feature }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={feature.id}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="h-full flex flex-col"
        style={{
          background: "white",
          border: `1px solid ${feature.accent}22`,
          borderRadius: 24,
          boxShadow: `0 4px 32px ${feature.accent}12, 0 1px 4px rgba(15,28,46,0.06)`,
          overflow: "hidden",
          minHeight: 460,
        }}
      >
        <div
          className="flex items-center gap-2 px-5 py-3.5 shrink-0"
          style={{
            background: "#F8FAFF",
            borderBottom: "1px solid rgba(226,232,240,0.7)",
          }}
        >
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <div
            className="ml-3 flex-1 rounded-lg px-4 py-1 text-[11px]"
            style={{
              background: "white",
              border: "1px solid rgba(226,232,240,0.7)",
              color: "#94A3B8",
            }}
          >
            draftmate.in / {feature.id}
          </div>
        </div>

        <div className="flex-1 p-7 overflow-y-auto">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: feature.accentLight,
                border: `1px solid ${feature.accent}20`,
              }}
            >
              <feature.icon className="w-6 h-6" style={{ color: feature.accent }} />
            </div>
            <div>
              <h3
                className="text-[18px] font-bold leading-tight mb-1"
                style={{ color: "#0F1C2E" }}
              >
                {feature.headline}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "#64748B" }}>
                {feature.desc}
              </p>
            </div>
          </div>

          {feature.isStudent ? (
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-5"
                style={{
                  background: "rgba(37,99,235,0.08)",
                  border: "1px solid rgba(37,99,235,0.18)",
                  color: "#1D4ED8",
                }}
              >
                <GraduationCap className="w-3 h-3" />
                Student Mode Features
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {feature.items.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-2.5 p-3 rounded-xl transition-all duration-200 hover:shadow-sm cursor-default"
                    style={{
                      background: "rgba(37,99,235,0.04)",
                      border: "1px solid rgba(37,99,235,0.10)",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(37,99,235,0.10)" }}
                    >
                      <item.icon className="w-3.5 h-3.5" style={{ color: "#2563EB" }} />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-[#0F1C2E] leading-tight">
                        {item.label}
                      </div>
                      <div className="text-[10px] leading-tight mt-0.5" style={{ color: "#94A3B8" }}>
                        {item.sub}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {feature.items.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 hover:shadow-sm cursor-default"
                  style={{
                    background: feature.accentLight,
                    border: `1px solid ${feature.accent}14`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${feature.accent}14` }}
                  >
                    <item.icon className="w-4 h-4" style={{ color: feature.accent }} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0F1C2E] leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
                      {item.sub}
                    </div>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 ml-auto shrink-0"
                    style={{ color: `${feature.accent}60` }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TabButton({ feature, isActive, progress, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all duration-300 relative"
      style={{
        background: isActive ? "white" : "rgba(255,255,255,0.5)",
        border: isActive
          ? `1px solid ${feature.accent}35`
          : "1px solid rgba(226,232,240,0.6)",
        boxShadow: isActive
          ? `0 4px 20px ${feature.accent}16, 0 1px 4px rgba(15,28,46,0.05)`
          : "0 1px 2px rgba(15,28,46,0.04)",
        transform: isActive ? "translateX(4px)" : "translateX(0)",
      }}
    >
      <div className="px-5 py-4 flex items-center gap-3.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: isActive ? `${feature.accent}12` : "rgba(15,28,46,0.04)",
          }}
        >
          <feature.icon
            className="w-4.5 h-4.5 transition-colors duration-300"
            style={{ color: isActive ? feature.accent : "#94A3B8" }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] font-semibold leading-tight transition-colors duration-200 truncate"
              style={{ color: isActive ? "#0F1C2E" : "#475569" }}
            >
              {feature.shortTitle}
            </span>
            {feature.badge && (
              <span
                className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
                style={{
                  background: isActive ? `${feature.accent}15` : "rgba(15,28,46,0.05)",
                  color: isActive ? feature.accent : "#94A3B8",
                  border: `1px solid ${isActive ? feature.accent + "25" : "rgba(226,232,240,0.6)"}`,
                }}
              >
                {feature.badge}
              </span>
            )}
          </div>
        </div>

        {isActive && (
          <ArrowRight
            className="w-4 h-4 shrink-0"
            style={{ color: feature.accent }}
          />
        )}
      </div>

      {isActive && (
        <div className="h-[2px]" style={{ background: "rgba(226,232,240,0.5)" }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
            style={{
              background: `linear-gradient(to right, ${feature.accent}, ${feature.accent}99)`,
            }}
          />
        </div>
      )}
    </button>
  );
}

const CYCLE_MS = 5000;

export default function InteractiveExplainer() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());

  const startCycle = useCallback((fromIdx) => {
    if (timerRef.current) clearInterval(timerRef.current);
    startRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min((elapsed / CYCLE_MS) * 100, 100);
      setProgress(pct);

      if (elapsed >= CYCLE_MS) {
        const next = (fromIdx + 1) % FEATURES.length;
        setActiveIdx(next);
        startCycle(next);
      }
    }, 16);
  }, []);

  useEffect(() => {
    startCycle(0);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startCycle]);

  const handleSelect = (i) => {
    setActiveIdx(i);
    startCycle(i);
  };

  const feature = FEATURES[activeIdx];

  return (
    <section id="features" className="py-24 lg:py-32 border-b border-slate-200/60 bg-white/40">
      <div className="container-xl px-5 md:px-10">

        <ScrollReveal>
          <div className="text-center mb-14">
            <span
              className="text-[11px] tracking-[0.25em] uppercase font-semibold block mb-3"
              style={{ color: "#94A3B8" }}
            >
              Platform Capabilities
            </span>
            <h2
              className="text-4xl md:text-5xl font-black mb-3"
              style={{ color: "#0F1C2E" }}
            >
              See What DraftMate{" "}
              <span className="text-gradient">Can Do For You</span>
            </h2>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ color: "#475569" }}
            >
              India&apos;s most comprehensive AI-powered legal platform — built for advocates,
              law firms, corporate legal teams, and law students.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-2 space-y-2">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.id} delay={i * 45}>
                <TabButton
                  feature={f}
                  isActive={activeIdx === i}
                  progress={activeIdx === i ? progress : 0}
                  onClick={() => handleSelect(i)}
                />
              </ScrollReveal>
            ))}
          </div>

          <div className="lg:col-span-3">
            <PreviewPanel feature={feature} />
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6 lg:hidden">
          {FEATURES.map((f, i) => (
            <button
              key={f.id}
              onClick={() => handleSelect(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: activeIdx === i ? 24 : 8,
                height: 8,
                background: activeIdx === i ? feature.accent : "rgba(226,232,240,0.8)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
import { useState } from "react";
import { Plus, Minus, Send, User, Mail, Phone, MessageSquare, CheckCircle } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "What is DraftMate?",
    a: "DraftMate is an AI-powered legal drafting, research, and workflow platform built exclusively for Indian advocates, law firms, corporate legal departments, and law students. It functions as your intelligent virtual co-counsel — helping you draft court-ready documents, conduct verified legal research, automate repetitive tasks, analyze documents, and manage your entire legal practice from one unified workspace.",
  },
  {
    q: "What types of legal documents can I draft using DraftMate?",
    a: "DraftMate supports virtually every Indian legal document type — including plaints, written statements, rejoinders, bail applications, legal notices, affidavits, petitions, written submissions, agreements, NDAs, employment contracts, sale and lease deeds, power of attorney, and more. Every document is formatted to the applicable court standards and styled in professional legal language.",
  },
  {
    q: "Does DraftMate provide real and verified legal citations?",
    a: "Absolutely. DraftMate is designed with a strict zero-hallucination policy. Every case law reference, statutory citation, and legal provision included in your research or drafts is sourced from authentic legal databases. We never fabricate judgments or citations. All references are real, verifiable, and professionally reliable.",
  },
  {
    q: "Can I conduct legal research on DraftMate?",
    a: "Yes. DraftMate includes Lex Bot — our AI legal research assistant trained on Indian statutes including the Bharatiya Nyaya Sanhita, CrPC, CPC, Indian Evidence Act, and the Constitution of India. You can ask questions in plain legal language, read judgments in-app, generate argument notes, find precedents, and produce detailed legal research summaries within minutes.",
  },
  {
    q: "What is Student Mode and who is it for?",
    a: "Student Mode is a dedicated legal learning environment within DraftMate built specifically for law students and legal academics. It includes a Moot Court Assistant, AI Judge Mode for practice sessions, Legal Flash Cards for concept revision, a Case Brief Generator, an Academic Writing Assistant, and Practice Quizzes with instant feedback. It bridges the gap between textbook learning and real-world legal practice.",
  },
  {
    q: "Is DraftMate suitable for independent advocates and junior lawyers?",
    a: "DraftMate is particularly valuable for independent practitioners and junior advocates. It eliminates the dependency on senior resources for drafting assistance, provides instant access to verified legal research, and helps first-generation lawyers produce professional-quality work from day one. No prior technical expertise or prompt engineering knowledge is required.",
  },
  {
    q: "Is my data and client information secure on DraftMate?",
    a: "Security and confidentiality are foundational to DraftMate. All documents, research sessions, and client data are encrypted in transit and at rest. Your data is never used to train AI models. DraftMate is DPDPA compliant and working towards SOC2 Type 1 certification — ensuring attorney-client privilege equivalent protection for every file in your workspace.",
  },
  {
    q: "Why choose DraftMate over generic AI tools like ChatGPT?",
    a: "Generic AI tools are not built for Indian law. They lack jurisdiction-specific training, frequently hallucinate citations, produce plain unformatted text, and do not understand Indian court standards. DraftMate is purpose-built for Indian legal practice — with verified citations, court-ready formatting, workflow automation, document analysis, and features like Lawyer Profile and Student Mode that no generic AI tool offers.",
  },
];

function FAQItem({ faq, index, isOpen, onToggle }) {
  return (
    <ScrollReveal delay={index * 35}>
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
        style={{
          background: "white",
          border: isOpen ? "1px solid rgba(37,99,235,0.22)" : "1px solid rgba(226,232,240,0.8)",
          boxShadow: isOpen
            ? "0 4px 24px rgba(37,99,235,0.08)"
            : "0 1px 3px rgba(15,28,46,0.04)",
        }}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5">
          <span
            className="font-semibold text-[14px] md:text-[15px] leading-snug transition-colors duration-200"
            style={{ color: isOpen ? "#1D4ED8" : "#0F1C2E" }}
          >
            {faq.q}
          </span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200"
            style={{
              background: isOpen ? "rgba(37,99,235,0.08)" : "rgba(15,28,46,0.04)",
            }}
          >
            {isOpen
              ? <Minus className="w-3.5 h-3.5" style={{ color: "#2563EB" }} />
              : <Plus className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
            }
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div
                className="px-6 pb-5 text-[13px] md:text-[14px] leading-relaxed"
                style={{
                  color: "#475569",
                  borderTop: "1px solid rgba(226,232,240,0.6)",
                  paddingTop: 16,
                }}
              >
                {faq.a}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollReveal>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", question: "" });
  const [focused, setFocused] = useState(null);
  const [formState, setFormState] = useState("idle");

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormState("loading");
    await new Promise(r => setTimeout(r, 1400));
    setFormState("success");
  };

  const inputBase = (field) => ({
    background: "white",
    border: `1.5px solid ${focused === field ? "rgba(37,99,235,0.45)" : "rgba(226,232,240,0.8)"}`,
    borderRadius: 12,
    boxShadow: focused === field
      ? "0 0 0 3px rgba(37,99,235,0.08)"
      : "0 1px 3px rgba(15,28,46,0.04)",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    width: "100%",
    padding: "12px 16px",
    fontSize: 14,
    color: "#0F1C2E",
  });

  return (
    <ScrollReveal delay={100}>
      <div
        className="rounded-3xl overflow-hidden h-full"
        style={{
          background: "white",
          border: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 4px 32px rgba(15,28,46,0.07), 0 1px 4px rgba(15,28,46,0.05)",
        }}
      >
        <div
          className="px-8 py-6"
          style={{
            background: "linear-gradient(135deg, #0F1C2E 0%, #1E3A5F 100%)",
            borderBottom: "1px solid rgba(37,99,235,0.2)",
          }}
        >
          <div className="flex items-start gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(37,99,235,0.25)" }}
            >
              <MessageSquare className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-white leading-tight">
                Got Questions?
              </h3>
              <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Submit here — our team will contact you shortly.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-7">
          {formState === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(16,185,129,0.1)" }}
              >
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="text-[18px] font-bold text-[#0F1C2E] mb-2">
                Message Received!
              </h4>
              <p className="text-[13px] leading-relaxed" style={{ color: "#475569" }}>
                Thank you for reaching out. Our team will review your query
                and get back to you within 24 hours.
              </p>
              <button
                className="mt-6 text-[13px] font-semibold"
                style={{ color: "#2563EB" }}
                onClick={() => { setFormState("idle"); setForm({ name: "", email: "", phone: "", question: "" }); }}
              >
                Submit another query →
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#475569" }}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: focused === "name" ? "#2563EB" : "#94A3B8" }} />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    placeholder="Adv. Arjun Sharma"
                    required
                    style={{ ...inputBase("name"), paddingLeft: 40 }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-[12px] font-semibold mb-1.5"
                  style={{ color: "#475569" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-10"
                    style={{
                      color: focused === "email" ? "#2563EB" : "#94A3B8",
                    }}
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    placeholder="attorney@lawfirm.com"
                    required
                    className="w-full h-14 rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-base outline-none transition-all duration-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#475569" }}>
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: focused === "phone" ? "#2563EB" : "#94A3B8" }} />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    onFocus={() => setFocused("phone")}
                    onBlur={() => setFocused(null)}
                    placeholder="+91 98XXX XXXXX"
                    style={{ ...inputBase("phone"), paddingLeft: 40 }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#475569" }}>
                  Your Question
                </label>
                <textarea
                  name="question"
                  value={form.question}
                  onChange={handleChange}
                  onFocus={() => setFocused("question")}
                  onBlur={() => setFocused(null)}
                  placeholder="Describe what you'd like to know about DraftMate..."
                  required
                  rows={4}
                  style={{
                    ...inputBase("question"),
                    resize: "vertical",
                    minHeight: 100,
                    lineHeight: 1.6,
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={formState === "loading"}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-[14px] text-white transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: formState === "loading"
                    ? "rgba(37,99,235,0.6)"
                    : "linear-gradient(135deg, #1D4ED8, #2563EB)",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                  cursor: formState === "loading" ? "wait" : "pointer",
                }}
              >
                {formState === "loading" ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Your Query
                  </>
                )}
              </button>

              <p className="text-center text-[11px]" style={{ color: "#94A3B8" }}>
                We typically respond within 24 hours on working days.
              </p>
            </form>
          )}
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main FAQ section
───────────────────────────────────────────────────────────── */
export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (i) =>
    setOpenIdx(prev => (prev === i ? null : i));

  return (
    <section id="faq" className="py-24 lg:py-32 border-b border-slate-200/60 bg-transparent">
      <div className="w-full max-w-7xl mx-auto px-5 md:px-10">

        <ScrollReveal>
          <div className="text-center mb-14">
            <span
              className="text-[11px] tracking-[0.25em] uppercase font-semibold block mb-3"
              style={{ color: "#94A3B8" }}
            >
              Support & FAQs
            </span>
            <h2
              className="text-4xl md:text-5xl font-black mb-3"
              style={{ color: "#0F1C2E" }}
            >
              Frequently Asked{" "}
              <span className="text-gradient">Questions</span>
            </h2>
            <p
              className="text-base max-w-lg mx-auto"
              style={{ color: "#475569" }}
            >
              Everything you need to know about DraftMate. Can&apos;t find your answer?
              Use the contact form to reach us directly.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-2.5">
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                index={i}
                isOpen={openIdx === i}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>

          <div className="lg:sticky lg:top-24">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
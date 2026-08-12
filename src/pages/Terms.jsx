import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  UserCheck, 
  Key, 
  CreditCard, 
  FolderOpen, 
  Cpu, 
  ShieldAlert, 
  Copyright, 
  Scale, 
  AlertTriangle, 
  Briefcase, 
  Lock, 
  AlertOctagon, 
  ShieldCheck, 
  XOctagon, 
  RefreshCcw, 
  Landmark, 
  Mail, 
  Phone, 
  MapPin,
  Clock,
  ArrowRight
} from "lucide-react";

import Navbar from "../components/landing/sections/Navbar";
import Footer from "../components/landing/sections/Footer";
import ScrollReveal from "../components/landing/ScrollReveal";
import LenisProvider from "../components/landing/LenisProvider";

/* ─────────────────────────────────────────────────────────────
   Exact Policy Content Data
───────────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: "about",
    icon: FileText,
    title: "1. About DraftMate AI",
    content: "DraftMate AI is an AI-powered legal workspace built for legal professionals, law firms, law students, legal researchers, in-house legal teams, and compliance professionals.\n\nThe Services may include:",
    list: [
      "AI-powered legal research",
      "Case law and statutory analysis",
      "Legal drafting and document generation",
      "Contract review and clause extraction",
      "Multi-document and PDF analysis",
      "Legal document summarization",
      "Citation and source verification tools",
      "Legal calculators",
      "Collaboration and document sharing tools",
      "Voice-assisted legal workflows",
      "Educational and student-focused legal learning tools",
      "Other legal technology features introduced from time to time"
    ],
    footerContent: "DraftMate AI is a technology platform and not a law firm. The platform does not provide legal advice, legal representation, or legal opinions.",
    color: "#3B82F6",
    fill: "#DBEAFE"
  },
  {
    id: "eligibility",
    icon: UserCheck,
    title: "2. Eligibility",
    content: "You must be at least 18 years of age and legally capable of entering into binding agreements to use the Services.\n\nBy using DraftMate AI, you represent and warrant that you satisfy these requirements.",
    color: "#10B981",
    fill: "#D1FAE5"
  },
  {
    id: "accounts",
    icon: Key,
    title: "3. User Accounts",
    content: "To access certain features of the Services, you may be required to create an account.\n\nYou agree to:",
    list: [
      "Provide accurate and complete registration information.",
      "Maintain the confidentiality of your login credentials.",
      "Accept responsibility for all activities under your account.",
      "Notify us immediately of any unauthorized use or security breach."
    ],
    footerContent: "DraftMate AI reserves the right to suspend or terminate accounts that violate these Terms.",
    color: "#6366F1",
    fill: "#E0E7FF"
  },
  {
    id: "subscription",
    icon: CreditCard,
    title: "4. Subscription Plans and Payments",
    content: "Certain features of the Services may require a paid subscription.\nUsers agree to pay all applicable fees associated with their selected plan.\n\nBilling\nSubscriptions may be billed monthly, annually, or under other pricing structures made available by DraftMate AI.\n\nAuto-Renewal\nUnless cancelled before the renewal date, subscriptions may automatically renew for the same billing period.\n\nRefunds\nPayments are generally non-refundable except where required by applicable law or expressly stated in a separate refund policy.",
    color: "#F59E0B",
    fill: "#FEF3C7"
  },
  {
    id: "user-content",
    icon: FolderOpen,
    title: "5. User Content and Uploaded Documents",
    content: "Users retain ownership of all content uploaded to the platform, including but not limited to:",
    list: [
      "Legal documents",
      "Contracts",
      "Pleadings",
      "Case files",
      "Research materials",
      "Notes",
      "PDFs",
      "Drafts",
      "Client-related documentation"
    ],
    footerContent: "(\"User Content\")\nDraftMate AI does not claim ownership of User Content.\n\nYou grant DraftMate AI a limited, non-exclusive, royalty-free license to process, analyze, store, transmit, and display User Content solely for the purpose of providing the Services.",
    color: "#EC4899",
    fill: "#FCE7F3"
  },
  {
    id: "ai-processing",
    icon: Cpu,
    title: "6. AI Processing and Third-Party Technologies",
    content: "DraftMate AI may utilize proprietary artificial intelligence systems as well as third-party AI models, cloud infrastructure providers, and technology partners.\n\nBy using the Services, you acknowledge and authorize the processing of User Content through such systems where necessary for delivering platform functionality.\n\nWe take reasonable measures to protect User Content but cannot guarantee absolute security.",
    color: "#8B5CF6",
    fill: "#EDE9FE"
  },
  {
    id: "acceptable-use",
    icon: ShieldAlert,
    title: "7. Acceptable Use",
    content: "You agree not to:",
    list: [
      "Use the Services for unlawful purposes.",
      "Upload content that violates intellectual property rights.",
      "Upload malicious software or harmful code.",
      "Attempt to reverse engineer, scrape, or copy platform functionality.",
      "Access the Services through unauthorized means.",
      "Share account credentials without authorization.",
      "Generate fraudulent, misleading, defamatory, or unlawful content.",
      "Interfere with the operation or security of the platform."
    ],
    footerContent: "Violation of these Terms may result in suspension or termination of access.",
    color: "#EF4444",
    fill: "#FEE2E2"
  },
  {
    id: "intellectual-property",
    icon: Copyright,
    title: "8. Intellectual Property",
    content: "All software, algorithms, designs, branding, trademarks, interfaces, databases, and proprietary technology associated with DraftMate AI remain the exclusive property of DraftMate AI and its licensors.\n\nNothing in these Terms transfers ownership of DraftMate AI intellectual property to users.",
    color: "#14B8A6",
    fill: "#CCFBF1"
  },
  {
    id: "no-legal-advice",
    icon: Scale,
    title: "9. No Legal Advice",
    content: "DraftMate AI is not a law firm.\n\nNothing provided through the Services constitutes legal advice, legal opinion, legal representation, or professional legal services.\n\nNo advocate-client, attorney-client, fiduciary, or professional relationship is created through use of the platform.\n\nUsers should consult qualified legal professionals before relying on any information generated through the Services.",
    color: "#F97316",
    fill: "#FFEDD5"
  },
  {
    id: "ai-disclaimer",
    icon: AlertTriangle,
    title: "10. AI Output Disclaimer",
    content: "DraftMate AI uses artificial intelligence and automated systems that may occasionally produce inaccurate, incomplete, outdated, or unsuitable outputs.\n\nUsers acknowledge that:",
    list: [
      "AI-generated content may contain errors.",
      "Legal authorities may change over time.",
      "Drafts may require modification and review.",
      "Research outputs may not be exhaustive."
    ],
    footerContent: "Users are solely responsible for independently reviewing, verifying, and validating all outputs generated by the platform.",
    color: "#3B82F6",
    fill: "#DBEAFE"
  },
  {
    id: "professional-responsibility",
    icon: Briefcase,
    title: "11. Professional Responsibility",
    content: "Legal professionals using DraftMate AI remain solely responsible for:",
    list: [
      "Legal advice provided to clients.",
      "Court filings and submissions.",
      "Drafted documents.",
      "Legal opinions.",
      "Compliance with professional obligations.",
      "Verification of legal authorities and citations.",
      "DraftMate AI acts solely as an assistive technology tool."
    ],
    color: "#10B981",
    fill: "#D1FAE5"
  },
  {
    id: "data-security",
    icon: Lock,
    title: "12. Data Security and Privacy",
    content: "We implement commercially reasonable safeguards to protect User Content and personal information.\n\nYour use of the Services is also governed by our Privacy Policy.\n\nWhile we strive to maintain secure systems, no method of storage or transmission can be guaranteed to be completely secure.",
    color: "#6366F1",
    fill: "#E0E7FF"
  },
  {
    id: "limitation",
    icon: AlertOctagon,
    title: "13. Limitation of Liability",
    content: "To the maximum extent permitted by law, DraftMate AI, its founders, directors, employees, affiliates, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including:",
    list: [
      "Loss of profits",
      "Loss of business opportunities",
      "Loss of data",
      "Loss of goodwill",
      "Professional losses arising from reliance on AI-generated outputs"
    ],
    footerContent: "Our aggregate liability shall not exceed the amount paid by the user to DraftMate AI during the twelve (12) months preceding the claim.",
    color: "#EF4444",
    fill: "#FEE2E2"
  },
  {
    id: "indemnification",
    icon: ShieldCheck,
    title: "14. Indemnification",
    content: "You agree to defend, indemnify, and hold harmless DraftMate AI and its affiliates, officers, employees, agents, and partners from any claims, damages, liabilities, costs, or expenses arising from:",
    list: [
      "Your use of the Services.",
      "Your violation of these Terms.",
      "Your User Content.",
      "Your violation of applicable laws or third-party rights."
    ],
    color: "#F59E0B",
    fill: "#FEF3C7"
  },
  {
    id: "termination",
    icon: XOctagon,
    title: "15. Termination",
    content: "DraftMate AI may suspend or terminate access to the Services at any time if:",
    list: [
      "You violate these Terms.",
      "Payment obligations remain unpaid.",
      "We reasonably believe your use presents legal, security, or operational risks."
    ],
    footerContent: "Upon termination, access to the platform may be revoked and stored data may be deleted in accordance with our data retention policies.",
    color: "#EC4899",
    fill: "#FCE7F3"
  },
  {
    id: "changes",
    icon: RefreshCcw,
    title: "16. Changes to Terms",
    content: "We reserve the right to modify these Terms at any time.\n\nUpdated Terms will be posted on the platform with the revised effective date.\n\nContinued use of the Services after such updates constitutes acceptance of the revised Terms.",
    color: "#8B5CF6",
    fill: "#EDE9FE"
  },
  {
    id: "governing-law",
    icon: Landmark,
    title: "17. Governing Law and Jurisdiction",
    content: "These Terms shall be governed by and construed in accordance with the laws of India.\n\nAny disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts located in New Delhi, India.",
    color: "#14B8A6",
    fill: "#CCFBF1"
  }
];

export default function TermsOfUse() {
  const [activeSection, setActiveIdx] = useState("about");
  const [isManualScroll, setIsManualScroll] = useState(false);

  /* ── Dynamic Scroll Spy Logic ── */
  useEffect(() => {
    if (isManualScroll) return;

    const observerOptions = {
      root: null,
      rootMargin: "-15% 0px -60% 0px",
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveIdx(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    SECTIONS.forEach((sec) => {
      const element = document.getElementById(sec.id);
      if (element) observer.observe(element);
    });

    const contactElement = document.getElementById("contact");
    if (contactElement) observer.observe(contactElement);

    return () => observer.disconnect();
  }, [isManualScroll]);

  const scrollToSection = (id) => {
    setIsManualScroll(true);
    setActiveIdx(id);
    
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      setTimeout(() => {
        setIsManualScroll(false);
      }, 800);
    }
  };

  return (
    <LenisProvider>
      <main className="flex flex-col bg-[#F8FAFF] min-h-screen">
        <Navbar />

        {/* ── HERO SECTION ── */}
        <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[12px] font-bold mb-6">
                <Clock className="w-3.5 h-3.5" />
                Last Updated: June 8, 2026
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-[#0F1C2E] mb-6">
                Terms of <span className="text-blue-600">Use</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-3xl leading-relaxed whitespace-pre-wrap">
                These Terms of Use (“Terms”) govern your access to and use of the DraftMate AI platform, website, applications, products, and services (collectively, the “Services”), operated by DraftMate AI (“DraftMate”, “we”, “us”, or “our”).{"\n\n"}
                By accessing or using the Services, you agree to be bound by these Terms, our Privacy Policy, and any additional policies that may apply to specific features of the platform.{"\n\n"}
                If you do not agree to these Terms, you must not access or use the Services.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── MAIN CONTENT AREA ── */}
        <section className="pb-24 relative z-10">
          <div className="w-full max-w-7xl mx-auto px-5 md:px-10">
            <div className="grid lg:grid-cols-[280px_1fr] gap-12 items-start">
              
              {/* STICKY NAVIGATION */}
              <aside className="hidden lg:block sticky top-32 space-y-2 h-[calc(100vh-160px)] overflow-y-auto pr-2 pb-4 scrollbar-hide">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Contents</div>
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-300 border flex items-center justify-between group ${
                      activeSection === sec.id 
                        ? "bg-white border-blue-200 text-blue-600 shadow-sm" 
                        : "bg-transparent border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate pr-2">{sec.title.split(". ")[1]}</span>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${activeSection === sec.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`} />
                  </button>
                ))}
                
                {/* Contact Nav Item */}
                <button
                  onClick={() => scrollToSection("contact")}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-300 border flex items-center justify-between group ${
                    activeSection === "contact" 
                      ? "bg-white border-blue-200 text-blue-600 shadow-sm" 
                      : "bg-transparent border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Contact Information
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeSection === "contact" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`} />
                </button>
              </aside>

              {/* POLICY TEXT CARDS */}
              <div className="space-y-8">
                {SECTIONS.map((sec) => (
                  <ScrollReveal key={sec.id}>
                    <div 
                      id={sec.id}
                      className="group p-8 md:p-10 rounded-[32px] bg-white border border-slate-200/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 scroll-mt-28"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110"
                          style={{ background: sec.fill }}
                        >
                          <sec.icon className="w-7 h-7" style={{ color: sec.color }} fill="white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-bold text-[#0F1C2E] mb-4">{sec.title}</h2>
                          
                          <p className="text-slate-600 leading-relaxed mb-6 text-[16px] whitespace-pre-wrap break-words">
                            {sec.content}
                          </p>

                          {sec.list && (
                            <div className="grid md:grid-cols-2 gap-3 mb-6">
                              {sec.list.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                  <span className="leading-tight break-words">{item}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {sec.footerContent && (
                            <p className="text-slate-600 leading-relaxed mb-6 text-[16px] whitespace-pre-wrap break-words">
                              {sec.footerContent}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}

                {/* SECTION 18 & 19: GRIEVANCE & CONTACT (Bottom Section) */}
                <ScrollReveal>
                  <div id="contact" className="grid md:grid-cols-2 gap-6 pt-10 scroll-mt-28">
                     {/* 18. Grievance Officer */}
                     <div className="p-8 rounded-[32px] bg-[#0F1C2E] text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                        <h3 className="text-xl font-bold mb-6 relative z-10">18. Grievance Officer</h3>
                        <p className="text-slate-300 text-sm mb-6 relative z-10">In accordance with applicable Indian laws, users may submit complaints or grievances to:</p>
                        
                        <div className="space-y-4 relative z-10">
                          <div className="font-semibold text-white mb-2">DraftMate AI</div>
                          <div className="flex items-center gap-4 text-slate-300">
                             <Mail className="w-5 h-5 text-blue-400 shrink-0" />
                             <span className="break-all">draftmate25@gmail.com</span>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm mt-6 relative z-10">We aim to acknowledge complaints within a reasonable period and resolve them in accordance with applicable laws.</p>
                     </div>

                     {/* 19. Contact Information */}
                     <div className="p-8 rounded-[32px] bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
                        <h3 className="text-xl font-bold mb-6">19. Contact Us</h3>
                        <p className="text-blue-50 text-sm mb-6">For questions, support requests, legal notices, or grievances regarding these Terms, please contact:</p>
                        
                        <div className="space-y-4 mb-6">
                          <div className="font-semibold text-white mb-2">DraftMate AI</div>
                          <div className="flex items-center gap-4 text-blue-50">
                             <Mail className="w-5 h-5 text-white shrink-0" />
                             <span className="break-all">draftmate25@gmail.com</span>
                          </div>
                          <div className="flex items-center gap-4 text-blue-50">
                             <Phone className="w-5 h-5 text-white shrink-0" />
                             <span>+91 6360756930</span>
                          </div>
                          <div className="flex items-start gap-4 text-blue-50">
                             <MapPin className="w-5 h-5 text-white shrink-0 mt-0.5" />
                             <span className="leading-snug break-words">Address: Lodhi Road, South Delhi, New Delhi, India</span>
                          </div>
                          <div className="flex items-center gap-4 text-blue-50">
                             <UserCheck className="w-5 h-5 text-white shrink-0" />
                             <span>Website: www.draftmate.in</span>
                          </div>
                        </div>
                        <p className="text-blue-50 text-sm border-t border-white/20 pt-4">For business partnerships, institutional collaborations, investment inquiries, or legal compliance matters, you may contact us using the details provided above.</p>
                     </div>
                  </div>
                </ScrollReveal>

              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </LenisProvider>
  );
}
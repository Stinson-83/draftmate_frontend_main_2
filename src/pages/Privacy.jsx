import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Database, 
  Eye, 
  Lock, 
  Cpu, 
  Share2, 
  Trash2, 
  Cookie, 
  UserCheck, 
  Info, 
  Mail, 
  Phone, 
  MapPin,
  Clock,
  ArrowRight,
  Users,
  Link2,
  RefreshCw
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
    id: "purpose",
    icon: Info,
    title: "1. Purpose",
    content: "This Privacy Policy explains how DraftMate AI collects, uses, stores, and protects information shared by users while using our legal technology platform.\n\nWe are committed to maintaining the confidentiality, integrity, and security of all information processed through our Services.",
    color: "#3B82F6",
    fill: "#DBEAFE"
  },
  {
    id: "collection",
    icon: Database,
    title: "2. Information We Collect",
    content: "We collect only the information necessary to operate the Platform and provide our Services effectively.\nThis may include:",
    list: [
      "Name and account details",
      "Email address",
      "Phone number",
      "Subscription and billing information",
      "Uploaded legal documents",
      "Contracts and agreements",
      "Research materials",
      "Case-related information",
      "User prompts and queries",
      "Platform usage information",
      "Customer support communications",
      "Device and browser information"
    ],
    color: "#10B981",
    fill: "#D1FAE5"
  },
  {
    id: "usage",
    icon: Eye,
    title: "3. How We Use Your Information",
    content: "We use information to:",
    list: [
      "Provide and improve DraftMate AI services",
      "Generate AI-powered legal research and drafting outputs",
      "Process subscriptions and payments",
      "Manage user accounts",
      "Provide customer support",
      "Improve platform performance and reliability",
      "Detect fraud, misuse, and security threats",
      "Comply with legal and regulatory obligations",
      "Communicate important updates and service notices"
    ],
    color: "#6366F1",
    fill: "#E0E7FF"
  },
  {
    id: "confidentiality",
    icon: Lock,
    title: "4. Confidential Legal and Client Data",
    content: "DraftMate AI understands the importance of confidentiality in legal practice.\n\nDocuments, contracts, case files, research materials, pleadings, and other user-uploaded content are treated as confidential information.\n\nSuch information remains accessible only to authorized users within the relevant account or workspace and is processed solely to provide the requested services.",
    highlight: "DraftMate AI does not sell, disclose, or commercially exploit confidential legal documents.",
    color: "#F59E0B",
    fill: "#FEF3C7"
  },
  {
    id: "ai-processing",
    icon: Cpu,
    title: "5. AI Processing and Generated Content",
    content: "When you use DraftMate AI features including legal research, document drafting, PDF analysis, document comparison, summarization, or AI assistants, your inputs and uploaded materials may be processed through AI systems to generate outputs.\n\nTo improve the platform, DraftMate AI may analyze:",
    list: [
      "Aggregated usage patterns",
      "Anonymous system performance metrics",
      "Non-identifiable interaction data"
    ],
    highlight: "DraftMate AI does not use confidential client documents, case files, contracts, or personally identifiable legal records for public training purposes.",
    color: "#EC4899",
    fill: "#FCE7F3"
  },
  {
    id: "sharing",
    icon: Share2,
    title: "6. Data Sharing",
    content: "We do not sell user data.\n\nWe may share limited information with trusted service providers including:",
    list: [
      "Cloud hosting providers",
      "Payment processors",
      "Communication service providers",
      "Security and analytics providers",
      "Third-party AI service providers used to deliver platform functionality"
    ],
    footerContent: "These providers are required to maintain appropriate confidentiality and security standards.\n\nWe may also disclose information when required by applicable law, court order, or governmental authority.",
    color: "#8B5CF6",
    fill: "#EDE9FE"
  },
  {
    id: "retention",
    icon: Trash2,
    title: "7. Data Retention and Deletion",
    content: "We retain information only as long as necessary to:",
    list: [
      "Provide Services",
      "Maintain account functionality",
      "Comply with legal obligations",
      "Resolve disputes",
      "Enforce our agreements"
    ],
    footerContent: "Upon account deletion, data will be removed from active systems within a reasonable period, subject to legal, regulatory, backup, or security requirements.",
    color: "#EF4444",
    fill: "#FEE2E2"
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "8. Cookies and Analytics",
    content: "DraftMate AI uses cookies and similar technologies to:",
    list: [
      "Maintain user sessions",
      "Improve platform functionality",
      "Analyze usage patterns",
      "Enhance user experience"
    ],
    footerContent: "Users may manage cookie preferences through browser settings.\nDisabling certain cookies may affect platform functionality.",
    color: "#F97316",
    fill: "#FFEDD5"
  },
  {
    id: "security",
    icon: Shield,
    title: "9. Data Security",
    content: "DraftMate AI implements commercially reasonable technical and organizational measures to protect user information, including:",
    list: [
      "Encryption of data in transit",
      "Secure cloud infrastructure",
      "Access controls and authentication systems",
      "Monitoring and security safeguards"
    ],
    footerContent: "While we strive to protect information, no internet-based system can guarantee absolute security.\nUsers are encouraged to maintain strong passwords and safeguard account credentials.",
    color: "#14B8A6",
    fill: "#CCFBF1"
  },
  {
    id: "rights",
    icon: UserCheck,
    title: "10. Your Rights",
    content: "Subject to applicable law, users may have the right to:",
    list: [
      "Access their personal information",
      "Correct inaccurate information",
      "Request deletion of personal information",
      "Withdraw consent where applicable",
      "Request information regarding data processing practices"
    ],
    footerContent: "Requests may be submitted using the contact details provided below.",
    color: "#3B82F6",
    fill: "#DBEAFE"
  },
  {
    id: "children",
    icon: Users,
    title: "11. Children’s Privacy",
    content: "DraftMate AI is not intended for individuals under 18 years of age.\nWe do not knowingly collect personal information from children.\nIf we become aware that such information has been collected, we will take reasonable steps to delete it.",
    color: "#06B6D4",
    fill: "#CFFAFE"
  },
  {
    id: "third-party",
    icon: Link2,
    title: "12. Third-Party Services",
    content: "The Platform may integrate with third-party services, tools, APIs, or websites.\nDraftMate AI is not responsible for the privacy practices of such third parties.\nUsers are encouraged to review their respective privacy policies.",
    color: "#8B5CF6",
    fill: "#EDE9FE"
  },
  {
    id: "updates",
    icon: RefreshCw,
    title: "13. Updates to this Policy",
    content: "We may update this Privacy Policy from time to time to reflect:",
    list: [
      "Product improvements",
      "Legal requirements",
      "Operational changes",
      "Security enhancements"
    ],
    footerContent: "The latest version will always be available on the Platform.\nContinued use of the Services after updates constitutes acceptance of the revised Privacy Policy.",
    color: "#F43F5E",
    fill: "#FFE4E6"
  }
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveIdx] = useState("purpose");
  const [isManualScroll, setIsManualScroll] = useState(false);

  /* ── Dynamic Scroll Spy Logic ── */
  useEffect(() => {
    // Prevent observer from firing while a user is actively clicking a sidebar link
    if (isManualScroll) return;

    const observerOptions = {
      root: null,
      // Triggers when a section crosses into the top 15% - 40% of the viewport
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

    // Observe every section
    SECTIONS.forEach((sec) => {
      const element = document.getElementById(sec.id);
      if (element) observer.observe(element);
    });

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

      // Resume observer tracking after the smooth scroll finishes
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
          {/* Background Ambient Glows */}
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
                Effective Date: June 8, 2026
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-[#0F1C2E] mb-6">
                Privacy <span className="text-blue-600">Policy</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-3xl leading-relaxed whitespace-pre-wrap">
                DraftMate AI (“DraftMate”, “we”, “our”, “us”) is committed to protecting the privacy, confidentiality, and security of our users. This Privacy Policy explains how we collect, use, store, process, and protect information when you use DraftMate AI’s website, applications, and services (collectively, the “Platform”).{"\n\n"}
                By accessing or using the Platform, you agree to the practices described in this Privacy Policy.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── MAIN CONTENT AREA ── */}
        <section className="pb-24 relative z-10">
          <div className="w-full max-w-7xl mx-auto px-5 md:px-10">
            <div className="grid lg:grid-cols-[280px_1fr] gap-12 items-start">
              
              {/* STICKY NAVIGATION */}
              <aside className="hidden lg:block sticky top-32 space-y-2">
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
                    {/* Display just the title text without the number */}
                    {sec.title.split(". ")[1]}
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeSection === sec.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`} />
                  </button>
                ))}
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
                        
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-[#0F1C2E] mb-4">{sec.title}</h2>
                          
                          {/* Main Content */}
                          <p className="text-slate-600 leading-relaxed mb-6 text-[16px] whitespace-pre-wrap">
                            {sec.content}
                          </p>

                          {/* Bulleted List */}
                          {sec.list && (
                            <div className="grid md:grid-cols-2 gap-3 mb-6">
                              {sec.list.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                  <span className="leading-tight">{item}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Footer Content (Content after the list) */}
                          {sec.footerContent && (
                            <p className="text-slate-600 leading-relaxed mb-6 text-[16px] whitespace-pre-wrap">
                              {sec.footerContent}
                            </p>
                          )}

                          {/* High-Impact Blue Highlight Box */}
                          {sec.highlight && (
                            <div className="mt-4 p-5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 text-sm font-semibold flex items-center gap-3">
                              <Shield className="w-6 h-6 text-blue-600 shrink-0" />
                              <span className="leading-relaxed">{sec.highlight}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}

                {/* SECTION 14 & 15: GRIEVANCE & CONTACT (Bottom Section) */}
                <div className="grid md:grid-cols-2 gap-6 pt-10">
                   {/* 14. Grievance Officer */}
                   <div className="p-8 rounded-[32px] bg-[#0F1C2E] text-white overflow-hidden relative group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                      <h3 className="text-xl font-bold mb-6 relative z-10">14. Grievance Officer</h3>
                      <p className="text-slate-300 text-sm mb-6 relative z-10">For privacy-related complaints, concerns, or requests, please contact:</p>
                      
                      <div className="space-y-4 relative z-10">
                        <div className="font-semibold text-white mb-2">DraftMate AI</div>
                        <div className="flex items-center gap-4 text-slate-300">
                           <Mail className="w-5 h-5 text-blue-400 shrink-0" />
                           <span>draftmate25@gmail.com</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300">
                           <Phone className="w-5 h-5 text-blue-400 shrink-0" />
                           <span>+91 6360756930</span>
                        </div>
                      </div>
                   </div>

                   {/* 15. Contact Information */}
                   <div className="p-8 rounded-[32px] bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
                      <h3 className="text-xl font-bold mb-6">15. Contact Information</h3>
                      <p className="text-blue-50 text-sm mb-6">For questions regarding this Privacy Policy or our data practices, please contact:</p>
                      
                      <div className="space-y-4">
                        <div className="font-semibold text-white mb-2">DraftMate AI</div>
                        <div className="flex items-center gap-4 text-blue-50">
                           <Mail className="w-5 h-5 text-white shrink-0" />
                           <span>draftmate25@gmail.com</span>
                        </div>
                        <div className="flex items-center gap-4 text-blue-50">
                           <Phone className="w-5 h-5 text-white shrink-0" />
                           <span>+91 6360756930</span>
                        </div>
                        <div className="flex items-start gap-4 text-blue-50">
                           <MapPin className="w-5 h-5 text-white shrink-0 mt-0.5" />
                           <span className="leading-snug">Lodhi Road, South Delhi, New Delhi, India</span>
                        </div>
                        <div className="flex items-center gap-4 text-blue-50">
                           <UserCheck className="w-5 h-5 text-white shrink-0" />
                           <span>www.draftmate.in</span>
                        </div>
                      </div>
                   </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </LenisProvider>
  );
}
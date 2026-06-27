import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Ban, 
  RefreshCcw, 
  Send, 
  ShieldAlert, 
  ArrowUpDown, 
  UserX, 
  Activity, 
  FileClock, 
  Mail, 
  Phone, 
  MapPin,
  Clock,
  ArrowRight,
  UserCheck
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
    id: "cancellation",
    icon: Ban,
    title: "1. Cancellation Policy",
    content: "1.1 How to Cancel\nUsers may cancel their subscription at any time through their account settings or subscription management dashboard.\nIf you are unable to access your account, you may request cancellation by contacting us at:\nEmail: draftmate25@gmail.com\n\n1.2 Subscription Cancellation\nAll subscriptions are billed in advance based on the selected billing cycle.\nUpon cancellation:",
    list: [
      "Your subscription will remain active until the end of the current billing period.",
      "Access to premium features will continue until the subscription expires.",
      "No partial refunds will be provided for unused subscription periods.",
      "Cancellation prevents future automatic renewals but does not terminate the current active subscription period."
    ],
    footerContent: "1.3 Free Trials and Promotional Access\nAny free trial, demo access, student trial, or promotional access may be discontinued at any time without charge.\nNo refund applies to free access programs.",
    color: "#EF4444",
    fill: "#FEE2E2"
  },
  {
    id: "refund-policy",
    icon: RefreshCcw,
    title: "2. Refund Policy",
    content: "Due to the digital nature of our services, subscription fees are generally non-refundable once access to the platform has been granted.\nHowever, refunds may be considered in limited circumstances including:",
    list: [
      "Duplicate payments",
      "Incorrect billing due to technical errors",
      "Unauthorized charges verified by DraftMate AI",
      "Payment processing errors attributable to DraftMate AI"
    ],
    footerContent: "Refund eligibility will be determined solely by DraftMate AI after review of the request.",
    color: "#10B981",
    fill: "#D1FAE5"
  },
  {
    id: "requests",
    icon: Send,
    title: "3. Refund Requests",
    content: "To request a refund, please contact:\nEmail: draftmate25@gmail.com\n\nPlease include:",
    list: [
      "Registered email address",
      "Payment receipt or transaction ID",
      "Description of the issue",
      "Date of payment"
    ],
    footerContent: "Processing Timeline\n• Refund requests are typically reviewed within 7 business days.\n• Approved refunds are generally processed within 14 business days.\n• Refunds will be issued to the original payment method wherever possible.\n\nProcessing times may vary depending on banking institutions and payment providers.",
    color: "#3B82F6",
    fill: "#DBEAFE"
  },
  {
    id: "non-refundable",
    icon: ShieldAlert,
    title: "4. Non-Refundable Items",
    content: "The following are non-refundable:",
    list: [
      "Subscription periods already used",
      "One-time onboarding or setup services",
      "Custom legal workflow configurations",
      "Consultation or training services",
      "Additional usage-based charges",
      "Promotional or discounted subscriptions",
      "Institutional or enterprise implementation fees"
    ],
    color: "#F97316",
    fill: "#FFEDD5"
  },
  {
    id: "upgrades-downgrades",
    icon: ArrowUpDown,
    title: "5. Subscription Upgrades and Downgrades",
    content: "Upgrades\nUsers may upgrade their plan at any time.\nUpon upgrade:",
    list: [
      "New features become available immediately.",
      "Additional charges may apply immediately.",
      "A new billing cycle may begin depending on the selected plan."
    ],
    footerContent: "Downgrades\nUsers may downgrade their plan at any time.\nThe downgraded plan will generally become effective from the next billing cycle.\nNo refund or credit will be issued for unused portions of the higher-tier subscription.",
    color: "#8B5CF6",
    fill: "#EDE9FE"
  },
  {
    id: "termination",
    icon: UserX,
    title: "6. Termination by DraftMate AI",
    content: "DraftMate AI reserves the right to suspend or terminate subscriptions if:",
    list: [
      "Users violate the Terms of Use.",
      "Fraudulent activity is detected.",
      "Payment obligations remain unpaid.",
      "The platform is used for unlawful purposes."
    ],
    footerContent: "In such cases, refunds will not be issued.",
    color: "#EC4899",
    fill: "#FCE7F3"
  },
  {
    id: "availability",
    icon: Activity,
    title: "7. Service Availability",
    content: "DraftMate AI continuously improves and updates its services.\nTemporary interruptions, maintenance periods, feature updates, or service enhancements shall not automatically entitle users to refunds unless required under applicable law.",
    color: "#06B6D4",
    fill: "#CFFAFE"
  },
  {
    id: "changes",
    icon: FileClock,
    title: "8. Changes to this Policy",
    content: "DraftMate AI reserves the right to modify this Refund and Cancellation Policy at any time.\nUpdated versions will be posted on our website with the revised effective date.\nContinued use of the Services following such updates constitutes acceptance of the revised policy.",
    color: "#14B8A6",
    fill: "#CCFBF1"
  }
];

export default function RefundPolicy() {
  const [activeSection, setActiveIdx] = useState("cancellation");
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

    // Also observe the contact section at the bottom
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
                Effective Date: June 8, 2026
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-[#0F1C2E] mb-6">
                Refund and Cancellation <span className="text-blue-600">Policy</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-3xl leading-relaxed whitespace-pre-wrap">
                This Refund and Cancellation Policy applies to all products, subscriptions, and services offered by DraftMate AI (“DraftMate”, “Company”, “we”, “our”, or “us”).{"\n\n"}
                By purchasing or using DraftMate AI services, you agree to this Refund and Cancellation Policy.
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
                    {sec.title.split(". ")[1]}
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeSection === sec.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`} />
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
                        
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-[#0F1C2E] mb-4">{sec.title}</h2>
                          
                          <p className="text-slate-600 leading-relaxed mb-6 text-[16px] whitespace-pre-wrap">
                            {sec.content}
                          </p>

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

                          {sec.footerContent && (
                            <p className="text-slate-600 leading-relaxed mb-6 text-[16px] whitespace-pre-wrap">
                              {sec.footerContent}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}

                {/* SECTION 9: CONTACT (Full width beautiful gradient card) */}
                <ScrollReveal>
                  <div id="contact" className="pt-10 scroll-mt-28">
                     <div className="p-8 md:p-12 rounded-[32px] bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <h3 className="text-2xl font-bold mb-4 relative z-10">9. Contact Information</h3>
                        <p className="text-blue-50 text-base mb-8 relative z-10">
                          For refund, cancellation, billing, or subscription-related inquiries, please contact:
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-8 relative z-10">
                          <div className="space-y-5">
                            <div className="font-semibold text-white text-lg border-b border-white/20 pb-2 inline-block">DraftMate AI</div>
                            <div className="flex items-center gap-4 text-blue-50">
                               <Mail className="w-5 h-5 text-white shrink-0" />
                               <span>Email: draftmate25@gmail.com</span>
                            </div>
                            <div className="flex items-center gap-4 text-blue-50">
                               <Phone className="w-5 h-5 text-white shrink-0" />
                               <span>Phone: +91 6360756930</span>
                            </div>
                          </div>
                          
                          <div className="space-y-5 md:pt-10">
                            <div className="flex items-start gap-4 text-blue-50">
                               <MapPin className="w-5 h-5 text-white shrink-0 mt-0.5" />
                               <span className="leading-snug">Address: Lodhi Road, South Delhi, New Delhi, India</span>
                            </div>
                            <div className="flex items-center gap-4 text-blue-50">
                               <UserCheck className="w-5 h-5 text-white shrink-0" />
                               <span>Website: www.draftmate.in</span>
                            </div>
                          </div>
                        </div>
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
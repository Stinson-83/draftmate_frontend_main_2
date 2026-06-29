import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { 
  Check, X, HelpCircle, ArrowRight, Sparkles, GraduationCap, Building2,
  Zap, Database, FileText, Search, ShieldCheck, Scale, XOctagon, Plus,
  Cpu, MessageSquare
} from 'lucide-react';

import Navbar from '../components/landing/sections/Navbar';
import Footer from '../components/landing/sections/Footer';
import ScrollReveal from '../components/landing/ScrollReveal';
import LenisProvider from '../components/landing/LenisProvider';

/* ─────────────────────────────────────────────────────────────
   Data Structures
───────────────────────────────────────────────────────────── */
const PLANS = [
  {
    name: "DraftMate Basic",
    for: "Law Students",
    priceMonthly: 699,
    priceAnnual: 559,
    features: [
      "500 AI Credits/day",
      "Legal Research",
      "Draft Generation",
      "Case Summaries",
      "Student Mode",
      "Flashcards",
      "Moot Court Assistant",
      "Academic Writing Support",
      "Translation Support"
    ],
    cta: "Start Learning",
    highlight: false
  },
  {
    name: "DraftMate Professional",
    for: "Lawyers & Professionals",
    badge: "Most Popular",
    priceMonthly: 999,
    priceAnnual: 799,
    features: [
      "2500 AI Credits/day",
      "Unlimited Draft Templates",
      "Advanced Legal Research",
      "Case Law Search",
      "Contract Analysis",
      "Legal Translation",
      "Lawyer Profile Visibility",
      "Workflow Automation",
      "Priority Support"
    ],
    cta: "Start Practicing",
    highlight: true
  },
  {
    name: "DraftMate Institution",
    for: "Firms & Universities",
    custom: true,
    priceText: "Custom Deployment",
    tagline: "For colleges, law firms, legal departments, and institutions.",
    features: [
      "Dedicated onboarding",
      "Custom credit allocation",
      "Centralized dashboard",
      "Team management",
      "Analytics",
      "API Access",
      "Dedicated Success Manager"
    ],
    cta: "Request Consultation",
    highlight: false
  }
];

const TOP_UPS = [
  { name: "Pack A", price: 199, credits: "2,000", highlight: false },
  { name: "Pack B", price: 499, credits: "6,000", badge: "Most Popular", highlight: true },
  { name: "Pack C", price: 999, credits: "15,000", highlight: false }
];

const COMPARISON = [
  {
    category: "Core Capabilities",
    items: [
      { feature: "Legal Research", basic: true, pro: "Advanced", inst: "Custom" },
      { feature: "Drafting", basic: "Standard", pro: "Unlimited Templates", inst: "Custom Workflows" },
      { feature: "Document Analysis", basic: "Limited", pro: true, inst: true },
      { feature: "Contract Review", basic: false, pro: true, inst: true },
    ]
  },
  {
    category: "Workflow & Support",
    items: [
      { feature: "Translation", basic: true, pro: true, inst: true },
      { feature: "Lawyer Visibility", basic: false, pro: true, inst: true },
      { feature: "Workflow Automation", basic: false, pro: true, inst: "Advanced" },
      { feature: "API Access", basic: false, pro: false, inst: true },
      { feature: "Priority Support", basic: false, pro: true, inst: "Dedicated Manager" },
    ]
  }
];

const FAQS = [
  { q: "How do AI Credits work?", a: "Credits are consumed based on the complexity of the AI task. Simple searches use fewer credits than full document generation." },
  { q: "What is the validity of my subscription and top-ups?", a: "Standard subscription plans are valid for 30 days from the date of purchase. However, any credits purchased through Top-Up packs are valid indefinitely until used—they never expire." },
  { q: "Will my subscription auto-renew?", a: "Yes, to ensure uninterrupted service, your subscription will automatically renew every 30 days (or annually, if you chose the yearly plan). You can easily cancel the auto-renewal at any time from your account settings." },
  { q: "Can I purchase additional credits?", a: "Yes! You can instantly top up your account using our Credit Packs whenever you run low." },
  { q: "Can I switch plans later?", a: "Absolutely. You can upgrade or downgrade your plan at any time. Prorated charges will be applied automatically." },
  { q: "Do institutions receive custom pricing?", a: "Yes, we offer tailored volume discounts and custom deployment options for law firms and universities." }
];

/* ─────────────────────────────────────────────────────────────
   Main Page Component
───────────────────────────────────────────────────────────── */
export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  return (
    <LenisProvider>
      <main className="flex flex-col bg-[#F8FAFF] min-h-screen font-sans">
        <Navbar />

        {/* ── SECTION 1: HERO ── */}
        <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="absolute inset-0 pointer-events-none opacity-[0.3]" style={{ backgroundImage: "linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)" }} />

          <div className="relative z-10 w-full max-w-5xl mx-auto px-5 md:px-10 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase mb-6 bg-blue-50 border border-blue-100 text-blue-600 shadow-sm">
                <Scale className="w-3.5 h-3.5" /> Trusted by 10,000+ Legal Professionals
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#0F1C2E] mb-6 leading-[1.1] tracking-tight">
                Simple, Transparent <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500">
                  Pricing for Every Workflow
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
                Whether you're a law student, practicing advocate, or institution, DraftMate scales with your legal practice.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-10">
                <span className={`text-sm font-semibold transition-colors ${!isAnnual ? "text-[#0F1C2E]" : "text-slate-500"}`}>Monthly</span>
                <button 
                  onClick={() => setIsAnnual(!isAnnual)}
                  className="w-16 h-8 rounded-full bg-[#0F1C2E] relative flex items-center px-1 cursor-pointer transition-colors shadow-inner"
                >
                  <motion.div 
                    className="w-6 h-6 rounded-full bg-white shadow-sm"
                    layout transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    initial={false} animate={{ x: isAnnual ? 32 : 0 }}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold transition-colors ${isAnnual ? "text-[#0F1C2E]" : "text-slate-500"}`}>Annually</span>
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm"
                  >
                    Save 20%
                  </motion.span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── SECTION 2: MAIN PRICING PLANS ── */}
          <div className="relative z-20 w-full max-w-7xl mx-auto px-5 md:px-10 mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {PLANS.map((plan, i) => (
                <motion.div 
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ y: -12, scale: 1.03 }}
                  className={`relative flex flex-col h-full rounded-[32px] p-8 transition-all duration-500 bg-white ${
                    plan.highlight 
                      ? "border-2 border-blue-500 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.3)] z-10" 
                      : "border border-slate-200 shadow-lg hover:shadow-xl hover:border-blue-200"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-[#0F1C2E]">{plan.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">For {plan.for}</p>
                  </div>

                  <div className="mb-8 min-h-[80px]">
                    {plan.custom ? (
                      <div>
                        <div className="text-3xl font-black text-[#0F1C2E] mb-2">{plan.priceText}</div>
                        <p className="text-sm text-slate-500 leading-relaxed">{plan.tagline}</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-[#0F1C2E]">
                            ₹{isAnnual ? plan.priceAnnual : plan.priceMonthly}
                          </span>
                          <span className="text-slate-500 font-medium">
                            {isAnnual ? '/month' : '/30 days'}
                          </span>
                        </div>
                        <div className="h-5 mt-1">
                          <AnimatePresence mode="wait">
                            {isAnnual ? (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-emerald-600 font-medium">
                                Billed ₹{plan.priceAnnual * 12} yearly
                              </motion.div>
                            ) : (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-slate-400 font-medium">
                                Auto-renews every 30 days
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </>
                    )}
                  </div>

                  {plan.custom ? (
                    <InstitutionModalTrigger />
                  ) : (
                    <button className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group mb-8 ${
                      plan.highlight 
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:opacity-90" 
                        : "bg-slate-50 text-[#0F1C2E] border border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    }`}>
                      {plan.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}

                  <div className="space-y-4 flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Includes</p>
                    {plan.features.map((feat, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-sm font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4: AI CREDIT VISUALIZATION ── */}
        <section className="py-20 lg:py-32 bg-white border-y border-slate-200/60 relative overflow-hidden">
          <div className="w-full max-w-7xl mx-auto px-5 md:px-10 text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-black text-[#0F1C2E] mb-4">What Are DraftMate Credits?</h2>
              <p className="text-slate-600 mb-16 max-w-2xl mx-auto">Credits power your AI operations. Simple tasks use fewer credits, while complex generative tasks use more.</p>
            </ScrollReveal>

            <div className="grid md:grid-cols-4 gap-6 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-100 via-cyan-200 to-blue-100 -translate-y-1/2 z-0" />
              
              {[
                { step: "1", icon: FileText, title: "Input Data", desc: "Upload docs or enter prompts" },
                { step: "2", icon: Cpu, title: "AI Processing", desc: "Our legal engines analyze context" },
                { step: "3", icon: Zap, title: "Credits Used", desc: "Deducted based on complexity" },
                { step: "4", icon: ShieldCheck, title: "Output Ready", desc: "Receive court-ready drafts" }
              ].map((item, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <motion.div 
                    whileHover={{ y: -8, scale: 1.02 }} 
                    className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-300 transition-all duration-300 relative z-10 h-full flex flex-col items-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center mb-4 text-sm transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
                      {item.step}
                    </div>
                    
                    <div className="w-16 h-16 rounded-2xl bg-[#F8FAFF] border border-blue-100 flex items-center justify-center mb-4 text-blue-500 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-cyan-500 group-hover:text-white group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-blue-500/30">
                      <item.icon className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    
                    <h4 className="font-bold text-[#0F1C2E] mb-2 transition-colors duration-300 group-hover:text-blue-700">{item.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed transition-colors duration-300 group-hover:text-slate-700">{item.desc}</p>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: TOP-UP CREDIT PACKS ── */}
        <section className="py-20 lg:py-32 bg-[#F8FAFF]">
          <div className="w-full max-w-5xl mx-auto px-5 md:px-10 text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-black text-[#0F1C2E] mb-4">Need More Credits?</h2>
              <p className="text-slate-600 mb-16">Top up anytime. <span className="font-semibold text-blue-600">These credits never expire and roll over indefinitely until used.</span></p>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-6">
              {TOP_UPS.map((pack, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <motion.div 
                    whileHover={{ y: -12, scale: 1.03 }}
                    className={`group relative p-8 rounded-3xl overflow-hidden transition-all duration-500 ${
                      pack.highlight 
                        ? "bg-[#0F1C2E] text-white shadow-2xl shadow-blue-900/40 border border-blue-800 hover:border-blue-500" 
                        : "bg-white text-[#0F1C2E] border border-slate-200 shadow-md hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10"
                    }`}
                  >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${
                       pack.highlight ? 'bg-gradient-to-br from-blue-600/30 via-transparent to-cyan-500/10' : 'bg-gradient-to-br from-blue-50/80 via-transparent to-transparent'
                    }`} />
                    
                    {pack.badge && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                        {pack.badge}
                      </div>
                    )}
                    
                    <h4 className={`font-bold mb-2 relative z-10 transition-colors duration-300 ${pack.highlight ? 'text-blue-200 group-hover:text-cyan-200' : 'text-slate-500 group-hover:text-blue-600'}`}>{pack.name}</h4>
                    <div className="text-4xl font-black mb-1 relative z-10">₹{pack.price}</div>
                    <div className={`text-xs mb-4 relative z-10 font-medium ${pack.highlight ? 'text-slate-400' : 'text-slate-400'}`}>Valid until used</div>
                    
                    <div className={`text-lg font-semibold flex items-center justify-center gap-2 mb-8 relative z-10 transition-colors duration-300 ${pack.highlight ? 'text-cyan-400 group-hover:text-cyan-300' : 'text-blue-600 group-hover:text-blue-500'}`}>
                      <Zap className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="currentColor" /> {pack.credits} Credits
                    </div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full py-3 rounded-xl font-semibold transition-all relative z-10 shadow-sm ${
                        pack.highlight ? 'bg-white text-[#0F1C2E] hover:bg-cyan-50 hover:shadow-cyan-500/20' : 'bg-slate-50 text-[#0F1C2E] border border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
                      }`}
                    >
                      Buy Pack
                    </motion.button>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 6: FEATURE COMPARISON ── */}
        <section className="py-20 lg:py-32 bg-white border-y border-slate-200/60">
          <div className="w-full max-w-5xl mx-auto px-5 md:px-10">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-[#0F1C2E] mb-4">Compare Features</h2>
                <p className="text-slate-600">A detailed breakdown of everything included in our plans.</p>
              </div>
            </ScrollReveal>

            <div className="overflow-x-auto pb-8 relative">
              <table className="w-full min-w-[800px] border-collapse">
                <thead className="sticky top-0 bg-white shadow-[0_1px_0_rgba(226,232,240,1)] z-10">
                  <tr>
                    <th className="w-2/5 p-6 text-left font-bold text-[#0F1C2E]">Features</th>
                    <th className="w-1/5 p-6 text-center font-bold text-slate-600">Basic</th>
                    <th className="w-1/5 p-6 text-center font-bold text-blue-600 bg-blue-50/30 rounded-t-2xl">Professional</th>
                    <th className="w-1/5 p-6 text-center font-bold text-slate-800">Institution</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((section, idx) => (
                    <React.Fragment key={idx}>
                      <tr>
                        <td colSpan="4" className="bg-slate-50/80 py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest border-y border-slate-200">
                          {section.category}
                        </td>
                      </tr>
                      {section.items.map((item, itemIdx) => (
                        <tr key={itemIdx} className="hover:bg-blue-50/40 transition-colors duration-300 group">
                          <td className="p-6 text-sm font-medium text-slate-700 border-b border-slate-100 group-hover:text-blue-900 transition-colors">{item.feature}</td>
                          <td className="p-6 text-center text-sm text-slate-600 border-b border-slate-100 group-hover:text-blue-800 transition-colors">
                            {typeof item.basic === 'boolean' ? (item.basic ? <Check className="w-5 h-5 mx-auto text-emerald-500" /> : <span className="text-slate-300">—</span>) : item.basic}
                          </td>
                          <td className="p-6 text-center text-sm font-medium text-[#0F1C2E] border-b border-slate-100 bg-blue-50/10 transition-colors group-hover:bg-blue-100/50">
                            {typeof item.pro === 'boolean' ? (item.pro ? <Check className="w-5 h-5 mx-auto text-blue-500" /> : <span className="text-slate-300">—</span>) : item.pro}
                          </td>
                          <td className="p-6 text-center text-sm text-slate-600 border-b border-slate-100 group-hover:text-blue-800 transition-colors">
                            {typeof item.inst === 'boolean' ? (item.inst ? <Check className="w-5 h-5 mx-auto text-emerald-500" /> : <span className="text-slate-300">—</span>) : item.inst}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: FAQ ── */}
        <section className="py-20 lg:py-32 bg-[#F8FAFF]">
          <div className="w-full max-w-3xl mx-auto px-5 md:px-10">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-[#0F1C2E] mb-4">Frequently Asked Questions</h2>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <ScrollReveal key={i} delay={i * 50}>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-200 transition-colors">
                    <button 
                      onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-[#0F1C2E] focus:outline-none hover:bg-slate-50 transition-colors"
                    >
                      {faq.q}
                      <motion.div animate={{ rotate: activeFaq === i ? 45 : 0 }} className="text-slate-400">
                        <Plus className="w-5 h-5" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {activeFaq === i && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-slate-50/50"
                        >
                          <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 8: SOCIAL PROOF (Stats) ── */}
        <section className="py-20 bg-white border-t border-slate-200/60">
          <div className="w-full max-w-7xl mx-auto px-5 md:px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { num: "5000+", label: "Legal Professionals Onboarded" },
                { num: "2M+", label: "Documents Generated" },
                { num: "98%", label: "Accuracy Rate" },
                { num: "24/7", label: "Workflow Automation" }
              ].map((stat, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="p-6">
                    <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-700 to-cyan-500 mb-2">{stat.num}</div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 9: FINAL CTA ── */}
        <section className="py-24">
          <div className="w-full max-w-5xl mx-auto px-5 md:px-10">
            <ScrollReveal>
              <div className="rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl"
                   style={{ background: "linear-gradient(160deg, #070E1A 0%, #0A1628 50%, #0D1E38 100%)" }}>
                
                {/* Internal Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-600/20 blur-[100px] pointer-events-none rounded-full" />
                
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-8">
                    Ready to Transform <br className="hidden md:block"/>Your Legal Workflow?
                  </h2>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                      Start Free Trial <ArrowRight className="w-5 h-5" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/10 text-white border border-white/20 hover:bg-white/20 px-10 py-4 rounded-xl font-bold transition-colors">
                      Book a Demo
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

/* ─────────────────────────────────────────────────────────────
   Consultation Modal Component (Radix UI)
───────────────────────────────────────────────────────────── */
function InstitutionModalTrigger() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="w-full py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group mb-8 bg-[#0F1C2E] text-white hover:bg-blue-900 shadow-lg shadow-slate-900/20">
          Request Consultation <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[90vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[32px] bg-white p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] focus:outline-none z-50 overflow-y-auto">
          <Dialog.Title className="text-2xl font-black text-[#0F1C2E] mb-2">Enterprise Consultation</Dialog.Title>
          <Dialog.Description className="text-sm text-slate-500 mb-6">
            Tell us about your institution, and our enterprise team will reach out with a custom deployment plan.
          </Dialog.Description>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">First Name</label>
                <input className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" placeholder="John" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Last Name</label>
                <input className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" placeholder="Doe" required />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Institution Name</label>
              <input className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 transition-all text-sm" placeholder="e.g. National Law School" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Work Email</label>
              <input type="email" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 transition-all text-sm" placeholder="name@institution.edu" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Institution Type</label>
              <select defaultValue="" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 transition-all text-sm text-slate-700" required>
                <option value="" disabled>Select an option</option>
                <option value="law_college">Law College / University</option>
                <option value="law_firm">Law Firm</option>
                <option value="corporate">Corporate Legal Team</option>
                <option value="gov">Government Department</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Additional Details
              </label>
              <textarea 
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-700 min-h-[90px] resize-y" 
                placeholder="Share your requirements, estimated user count, or any specific questions..." 
              />
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/30">
                Submit Request
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none bg-slate-100 hover:bg-slate-200 p-2 rounded-full" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
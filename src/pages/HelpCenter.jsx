import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    HelpCircle, Mail, Phone, MessageCircle, Clock, 
    Calendar, CheckCircle2, ChevronDown, Search, 
    ArrowUpRight, Zap, ShieldCheck, Headphones
} from 'lucide-react';
import { faqs } from '../data/faqs';

/* ─────────────────────────────────────────────────────────────
   Premium Design Tokens
───────────────────────────────────────────────────────────── */
const premiumCardStyle = {
    background: "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(248,251,255,1) 65%, rgba(227,238,255,0.9) 100%)"
};

const PremiumGlow = () => (
    <div 
        className="absolute inset-y-0 right-0 w-full md:w-1/2 pointer-events-none z-0" 
        style={{ background: "radial-gradient(circle at right center, rgba(37,99,235,0.08), transparent 65%)" }} 
    />
);

/* ─────────────────────────────────────────────────────────────
   FAQ Accordion Component
───────────────────────────────────────────────────────────── */
const FAQItem = ({ faq, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group border rounded-2xl transition-all duration-300 mb-3 overflow-hidden ${
                isOpen 
                ? "border-blue-200 bg-blue-50/40 shadow-sm" 
                : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/10 shadow-sm"
            }`}
        >
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left outline-none"
            >
                <span className={`text-sm md:text-base font-bold transition-colors ${
                    isOpen ? "text-blue-700" : "text-[#0F1C2E] group-hover:text-blue-600"
                }`}>
                    {faq.question}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className={`shrink-0 ml-4 transition-colors ${isOpen ? "text-blue-600" : "text-slate-400"}`}
                >
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="px-5 pb-5 pt-0">
                            <div className="h-px w-full bg-blue-100 mb-4" />
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                {faq.answer}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Main Help Center Component
───────────────────────────────────────────────────────────── */
export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFaqs = faqs.filter(f => 
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 md:px-0">
            
            {/* ── HERO HEADER ── */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-[32px] border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] overflow-hidden p-8 md:p-12"
                style={premiumCardStyle}
            >
                <PremiumGlow />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
                            <Headphones className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-[#0F1C2E] tracking-tight mb-4">
                            Help & Support
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Need assistance? Find answers instantly through our comprehensive FAQ base or reach out to our dedicated legal tech support team.
                        </p>
                    </div>

                    <div className="shrink-0">
                        <div className="flex items-center gap-3 px-5 py-3 bg-white border border-blue-200 rounded-2xl shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                            <Search className="w-5 h-5 text-blue-500" />
                            <input 
                                type="text" 
                                placeholder="Search help articles..." 
                                className="bg-transparent border-none outline-none text-sm font-bold text-[#0F1C2E] w-full md:w-64 placeholder:text-slate-400"
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── FAQ SECTION ── */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-[#0F1C2E]">Frequently Asked Questions</h2>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            {filteredFaqs.length} Articles
                        </span>
                    </div>

                    <div className="relative rounded-[28px] border border-blue-100 p-6 md:p-8 overflow-hidden shadow-sm" style={premiumCardStyle}>
                        <PremiumGlow />
                        <div className="relative z-10">
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq, i) => (
                                    <FAQItem key={i} faq={faq} index={i} />
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-slate-400 font-medium italic">No matches found for "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── SIDEBAR STATS & INFO ── */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-[#0F1C2E] px-2">Support Insights</h2>
                    
                    <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Response Time</p>
                                <p className="text-base font-black text-[#0F1C2E]">Under 15 Minutes</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Availability</p>
                                <p className="text-base font-black text-[#0F1C2E]">Mon – Sat, 9AM – 8PM IST</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Resolution Rate</p>
                                <p className="text-base font-black text-[#0F1C2E]">95% Within 24 Hours</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#0F1C2E] to-slate-900 rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
                        <Zap className="w-8 h-8 text-cyan-400 mb-4 fill-cyan-400/20" />
                        <h3 className="text-lg font-bold mb-2">Enterprise Support</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            Law firms and institutions on Professional plans get priority access to a dedicated Success Manager.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── CONTACT SUPPORT SECTION ── */}
            <div className="pt-8">
                <section className="relative rounded-[32px] border border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.06)] overflow-hidden p-8 md:p-10" style={premiumCardStyle}>
                    <PremiumGlow />
                    <div className="relative z-10">
                        <div className="mb-10 text-center md:text-left">
                            <h2 className="text-2xl md:text-3xl font-black text-[#0F1C2E] mb-2">Contact DraftMate Support</h2>
                            <p className="text-slate-500 font-medium">Reach our support team through your preferred channel for immediate assistance.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            {/* Email */}
                            <a href="mailto:draftmateinfo@gmail.com" className="group p-6 bg-white border border-slate-200 rounded-[20px] hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#0F1C2E] mb-1">Email Support</h3>
                                <p className="text-xs text-slate-500 font-bold mb-4">draftmateinfo@gmail.com</p>
                                <span className="mt-auto text-[10px] font-black uppercase text-blue-600 flex items-center gap-1">
                                    Send Message <ArrowUpRight className="w-3 h-3" />
                                </span>
                            </a>

                            {/* Phone */}
                            <a href="tel:+916360756930" className="group p-6 bg-white border border-slate-200 rounded-[20px] hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#0F1C2E] mb-1">Call Support</h3>
                                <p className="text-xs text-slate-500 font-bold mb-4">+91 63607 56930</p>
                                <span className="mt-auto text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1">
                                    Connect Now <ArrowUpRight className="w-3 h-3" />
                                </span>
                            </a>

                            {/* WhatsApp */}
                            <a href="https://wa.me/916360756930" target="_blank" rel="noopener noreferrer" className="group p-6 bg-white border border-slate-200 rounded-[20px] hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#0F1C2E] mb-1">WhatsApp Chat</h3>
                                <p className="text-xs text-slate-500 font-bold mb-4">+91 63607 56930</p>
                                <span className="mt-auto text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1">
                                    Start Chat <ArrowUpRight className="w-3 h-3" />
                                </span>
                            </a>
                        </div>
                    </div>
                </section>
            </div>
            
            <div className="text-center pt-8 opacity-40">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DraftMate Support Ecosystem v2.0</p>
            </div>
        </div>
    );
}
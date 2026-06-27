import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Clock, HelpCircle, User, CreditCard, 
  ChevronRight, Check, Zap, Download, AlertCircle, Building2, Briefcase, GraduationCap
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Data Extracted from Pricing.jsx
───────────────────────────────────────────────────────────── */
const PLANS = [
  {
    name: "DraftMate Basic",
    description: "Designed to let you experience DraftMate in your legal workflow.",
    priceMonthly: 699,
    priceAnnual: 559, 
    buttonText: "Upgrade to Basic",
    features: ["500 AI Credits/day", "Legal Research", "Draft Generation", "Student Mode"],
    highlight: false
  },
  {
    name: "DraftMate Professional",
    description: "Complete command. Built for serious legal work at scale.",
    badge: "RECOMMENDED",
    priceMonthly: 999,
    priceAnnual: 799, 
    buttonText: "Upgrade to Pro",
    features: ["2500 AI Credits/day", "Unlimited Draft Templates", "Case Law Search", "Priority Support"],
    highlight: true
  }
];

const TOP_UPS = [
  { name: "Pack A", price: 199, credits: "2,000", highlight: false },
  { name: "Pack B", price: 499, credits: "6,000", badge: "Most Popular", highlight: true },
  { name: "Pack C", price: 999, credits: "15,000", highlight: false }
];

const MOCK_HISTORY = [
  { id: "INV-2026-004", date: "Jun 01, 2026", amount: "₹999", plan: "Professional Plan", status: "Paid" },
  { id: "INV-2026-003", date: "May 01, 2026", amount: "₹999", plan: "Professional Plan", status: "Paid" },
  { id: "INV-2026-002", date: "Apr 15, 2026", amount: "₹499", plan: "Top-up Pack B", status: "Paid" },
  { id: "INV-2026-001", date: "Apr 01, 2026", amount: "₹699", plan: "Basic Plan", status: "Paid" },
];

/* ─────────────────────────────────────────────────────────────
   Main Billing Component
───────────────────────────────────────────────────────────── */
export default function Billing() {
  const [activeTab, setActiveTab] = useState('details'); // Defaulting to details as requested to view
  const [isAnnual, setIsAnnual] = useState(false);
  const [coupon, setCoupon] = useState('');
  
  // State for Account Details selection
  const [accountType, setAccountType] = useState('personal');

  const TABS = [
    { id: 'subscription', label: 'Subscription', icon: ShieldCheck },
    { id: 'history', label: 'Billing History', icon: Clock },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'details', label: 'Account Details', icon: User },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#0F1C2E]">Billing & Settings</h1>
        <p className="text-sm text-slate-500 font-medium">Manage your subscription, credits, and billing history.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* ── LEFT SUB-NAVIGATION ── */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-100/50 text-blue-700 border border-blue-200 shadow-sm" 
                    : "text-slate-600 hover:bg-white hover:shadow-sm border border-transparent"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── RIGHT CONTENT AREA ── */}
        <div className="flex-1 w-full bg-white rounded-[24px] border border-slate-200/60 shadow-sm p-6 md:p-8 min-h-[600px]">
          <AnimatePresence mode="wait">
            
            {/* ── 1. SUBSCRIPTION TAB ── */}
            {activeTab === 'subscription' && (
              <motion.div key="sub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-md text-xs font-bold text-slate-600 shadow-sm">Monthly</span>
                    <span className="text-sm font-medium text-slate-700">You are currently on the <strong className="text-blue-600 font-bold">Free</strong> plan.</span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 256-bit Secure Checkout
                  </div>
                </div>

                <div className="mb-10 max-w-md">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Have a coupon?</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Enter coupon code" 
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-medium"
                    />
                    <button className="px-6 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors">
                      Apply
                    </button>
                  </div>
                </div>

                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-[#0F1C2E]">Checkout our other plans</h2>
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                      <button onClick={() => setIsAnnual(false)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!isAnnual ? "bg-white text-[#0F1C2E] shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}>
                        Monthly
                      </button>
                      <button onClick={() => setIsAnnual(true)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${isAnnual ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}>
                        Yearly <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Save 20%</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {PLANS.map((plan, i) => (
                      <div key={i} className={`relative p-6 rounded-2xl border transition-all duration-300 flex flex-col ${plan.highlight ? 'border-blue-500 shadow-[0_8px_30px_rgb(37,99,235,0.12)]' : 'border-slate-200 hover:border-blue-300 shadow-sm'}`}>
                        {plan.badge && (
                          <div className="absolute -top-3.5 right-6 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest shadow-sm">
                            {plan.badge}
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-[#0F1C2E] mb-2">{plan.name.replace('DraftMate ', '')}</h3>
                        <p className="text-xs text-slate-500 font-medium mb-6 min-h-[32px]">{plan.description}</p>
                        
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-3xl font-black text-[#0F1C2E]">₹{isAnnual ? plan.priceAnnual : plan.priceMonthly}</span>
                          <span className="text-sm font-medium text-slate-500">/month</span>
                        </div>

                        <button className={`w-full py-3 rounded-xl text-sm font-bold transition-all mb-4 ${plan.highlight ? 'bg-[#0F1C2E] text-white hover:bg-slate-800 shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                          {plan.buttonText}
                        </button>

                        {isAnnual && (
                          <div className="text-center text-xs font-bold text-emerald-600 bg-emerald-50 py-1.5 rounded-lg mb-6 border border-emerald-100">
                            You are saving ₹{(plan.priceMonthly - plan.priceAnnual)}/month
                          </div>
                        )}

                        <div className="space-y-3 mt-auto pt-4 border-t border-slate-100">
                          {plan.features.map((feat, j) => (
                            <div key={j} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                              <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" /> {feat}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#0F1C2E] mb-2">Need More Credits?</h2>
                  <p className="text-sm text-slate-500 font-medium mb-6">Top up anytime. These credits never expire and roll over indefinitely.</p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {TOP_UPS.map((pack, i) => (
                      <div key={i} className={`relative p-5 rounded-2xl border transition-all duration-300 ${pack.highlight ? 'bg-[#0F1C2E] text-white border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm hover:border-blue-300'}`}>
                        {pack.badge && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {pack.badge}
                          </div>
                        )}
                        <h4 className={`text-xs font-bold mb-1 ${pack.highlight ? 'text-blue-300' : 'text-slate-400'}`}>{pack.name}</h4>
                        <div className="text-2xl font-black mb-3">₹{pack.price}</div>
                        <div className={`text-sm font-bold flex items-center gap-1.5 mb-5 ${pack.highlight ? 'text-cyan-400' : 'text-blue-600'}`}>
                          <Zap className="w-4 h-4" fill="currentColor" /> {pack.credits} Credits
                        </div>
                        <button className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${pack.highlight ? 'bg-white text-[#0F1C2E] hover:bg-slate-100' : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'}`}>
                          Buy Pack
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 2. BILLING HISTORY TAB ── */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-lg font-bold text-[#0F1C2E] mb-6">Billing History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-4 py-3 rounded-tl-xl">Invoice</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Plan / Top-Up</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right rounded-tr-xl">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium">
                      {MOCK_HISTORY.map((invoice, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4 text-blue-600 font-bold">{invoice.id}</td>
                          <td className="px-4 py-4 text-slate-500">{invoice.date}</td>
                          <td className="px-4 py-4 text-[#0F1C2E]">{invoice.plan}</td>
                          <td className="px-4 py-4 text-slate-700">{invoice.amount}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
                              <Check className="w-3 h-3" /> Paid
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── 3. SUPPORT TAB ── */}
            {activeTab === 'support' && (
              <motion.div key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <h2 className="text-2xl font-bold text-[#0F1C2E] mb-2">Get Help</h2>
                <p className="text-sm text-slate-500 font-medium mb-8 max-w-2xl">
                  Have a question or need assistance regarding your billing or subscription? Fill out the form below and our enterprise support team will get back to you immediately.
                </p>

                <form className="max-w-2xl space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#0F1C2E] uppercase tracking-wider">Name</label>
                    <input type="text" placeholder="Enter your name" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium" required />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#0F1C2E] uppercase tracking-wider">Issue Title</label>
                    <input type="text" placeholder="Enter the issue title (e.g., Payment failed)" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium" required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#0F1C2E] uppercase tracking-wider">Description</label>
                    <textarea placeholder="Enter a detailed description of your issue..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium min-h-[120px] resize-y" required />
                  </div>

                  <button type="submit" className="bg-[#0F1C2E] text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-md">
                    Submit Ticket
                  </button>

                  <div className="pt-6 border-t border-slate-100 flex items-start gap-3 text-xs text-slate-500 font-medium">
                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p>For urgent queries, please contact <strong className="text-blue-600">billing@draftmate.ai</strong>. If required, please reach out to your dedicated success manager.</p>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── 4. ACCOUNT DETAILS TAB ── */}
            {activeTab === 'details' && (
              <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                 <h2 className="text-xl font-bold text-[#0F1C2E] mb-2">Account Type</h2>
                 <p className="text-sm text-slate-500 font-medium mb-8">Select how you intend to use DraftMate. This helps us customize your billing and workspace experience.</p>
                 
                 <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
                    
                    {/* Personal */}
                    <div 
                      onClick={() => setAccountType('personal')}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                        accountType === 'personal' ? 'border-blue-500 bg-blue-50/30 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.15)]' : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${accountType === 'personal' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${accountType === 'personal' ? 'text-blue-900' : 'text-[#0F1C2E]'}`}>Personal</h3>
                        <p className="text-xs text-slate-500 mt-1">For independent advocates and solo practitioners.</p>
                      </div>
                    </div>

                    {/* Law Firms */}
                    <div 
                      onClick={() => setAccountType('law_firm')}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                        accountType === 'law_firm' ? 'border-blue-500 bg-blue-50/30 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.15)]' : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${accountType === 'law_firm' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${accountType === 'law_firm' ? 'text-blue-900' : 'text-[#0F1C2E]'}`}>Law Firm</h3>
                        <p className="text-xs text-slate-500 mt-1">For multi-lawyer practices requiring shared workspaces.</p>
                      </div>
                    </div>

                    {/* Institutional Access */}
                    <div 
                      onClick={() => setAccountType('institutional')}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                        accountType === 'institutional' ? 'border-blue-500 bg-blue-50/30 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.15)]' : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${accountType === 'institutional' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${accountType === 'institutional' ? 'text-blue-900' : 'text-[#0F1C2E]'}`}>Institutional Access</h3>
                        <p className="text-xs text-slate-500 mt-1">For law colleges, universities, and student batches.</p>
                      </div>
                    </div>

                    {/* Company */}
                    <div 
                      onClick={() => setAccountType('company')}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                        accountType === 'company' ? 'border-blue-500 bg-blue-50/30 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.15)]' : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${accountType === 'company' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${accountType === 'company' ? 'text-blue-900' : 'text-[#0F1C2E]'}`}>Company</h3>
                        <p className="text-xs text-slate-500 mt-1">For corporate legal departments and enterprise teams.</p>
                      </div>
                    </div>

                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all">
                      Save Account Details
                    </button>
                 </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
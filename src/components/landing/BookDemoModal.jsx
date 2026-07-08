import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Send } from 'lucide-react';

export default function BookDemoModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    userType: '',
    fullName: '',
    email: '',
    whatsapp: '',
    organization: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset form state after close animation completes
      setTimeout(() => {
        setFormData({ userType: '', fullName: '', email: '', whatsapp: '', organization: '', message: '' });
        setErrors({});
        setIsSuccess(false);
      }, 300);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.userType) newErrors.userType = 'Please select your user type';
    if (!formData.fullName.trim()) newErrors.fullName = 'Please enter your full name';
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your work email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'Please enter your contact number';
    if (!formData.message.trim()) newErrors.message = 'Please tell us what you’d like to see';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate API Call
    setTimeout(() => {
      console.log('Demo Request Payload:', formData);
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-[0_20px_60px_rgba(15,28,46,0.12)] border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 sm:px-8 py-6 border-b border-slate-100 bg-white z-10 shrink-0">
              <div className="pr-4">
                <h2 className="text-2xl font-black text-[#0F1C2E]">Book a Demo</h2>
                <p className="text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
                  Please fill out the form below so our team can understand your requirements and tailor a personalized DraftMate demo for you.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto custom-scrollbar flex-1">
              {isSuccess ? (
                <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100 shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-black text-[#0F1C2E] mb-2">Request Received!</h3>
                  <p className="text-slate-500 font-medium text-[15px] max-w-md mx-auto leading-relaxed">
                    Thank you for your interest in DraftMate. Our team will review your requirements and reach out to you shortly to schedule your demo.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-8 px-8 py-3 bg-[#0F1C2E] text-white font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/10"
                  >
                    Return to Homepage
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                  
                  {/* User Type */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Requesting Demo As *</label>
                    <div className="relative">
                      <select
                        name="userType"
                        value={formData.userType}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 rounded-xl border ${errors.userType ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'} appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700 transition-all cursor-pointer`}
                      >
                        <option value="" disabled>Select your profession/organization type</option>
                        <option value="Advocate">Advocate / Lawyer</option>
                        <option value="Law Firm">Law Firm</option>
                        <option value="In-house">In-house Legal Team / Corporate</option>
                        <option value="Institution">Law College / Institution</option>
                        <option value="Student">Law Student</option>
                        <option value="Researcher">Legal Researcher</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                    {errors.userType && <p className="text-xs text-red-500 font-semibold mt-1">{errors.userType}</p>}
                  </div>

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                        className={`w-full px-4 py-3.5 rounded-xl border ${errors.fullName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium placeholder-slate-400 transition-all`}
                      />
                      {errors.fullName && <p className="text-xs text-red-500 font-semibold mt-1">{errors.fullName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Work Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className={`w-full px-4 py-3.5 rounded-xl border ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium placeholder-slate-400 transition-all`}
                      />
                      {errors.email && <p className="text-xs text-red-500 font-semibold mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* WhatsApp & Organization Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">WhatsApp Number *</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 py-3.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-sm font-bold">
                          +91
                        </span>
                        <input
                          type="tel"
                          name="whatsapp"
                          value={formData.whatsapp}
                          onChange={handleChange}
                          placeholder="98765 43210"
                          className={`w-full px-4 py-3.5 rounded-r-xl border ${errors.whatsapp ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium placeholder-slate-400 transition-all`}
                        />
                      </div>
                      {errors.whatsapp && <p className="text-xs text-red-500 font-semibold mt-1">{errors.whatsapp}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Organization (Optional)</label>
                      <input
                        type="text"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        placeholder="Firm / College Name"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium placeholder-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">What would you like to see? *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your use case, specific features (drafting, research, etc.), and team size..."
                      rows={4}
                      className={`w-full px-4 py-3.5 rounded-xl border ${errors.message ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium placeholder-slate-400 transition-all resize-none`}
                    />
                    {errors.message && <p className="text-xs text-red-500 font-semibold mt-1">{errors.message}</p>}
                  </div>

                </form>
              )}
            </div>

            {/* Footer Actions */}
            {!isSuccess && (
              <div className="px-6 sm:px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                  Our team typically reaches out within 24 hours.
                </p>
                <div className="flex w-full sm:w-auto items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-[#0F1C2E] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        Submit Request <Send className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
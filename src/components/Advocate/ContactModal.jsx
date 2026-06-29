import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { advocateMessages } from '../../services/advocateApi';

export default function ContactModal({ isOpen, onClose, advocate }) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await advocateMessages.send({
        advocate_id: advocate.id,
        client_name: formData.name,
        client_email: formData.email,
        message: `Subject: ${formData.subject}\n\n${formData.message}`,
      });
      setIsSuccess(true);
      setTimeout(() => { setIsSuccess(false); onClose(); }, 3000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-20 sm:p-0">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          {isSuccess ? (
            <div className="p-12 text-center flex flex-col items-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
              <p className="text-slate-500 font-medium">Your inquiry has been delivered directly to {advocate?.title}'s inbox.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Message Advocate</h3>
                  <p className="text-sm font-medium text-slate-500">Direct inquiry to {advocate?.title}</p>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1.5 block">Your Name</label>
                  <Input required placeholder="John Doe" className="bg-slate-50 border-slate-200" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1.5 block">Email Address</label>
                  <Input required type="email" placeholder="john@example.com" className="bg-slate-50 border-slate-200" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1.5 block">Subject</label>
                  <select required className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                    <option value="">Select a topic...</option>
                    <option value="Need legal advice">Need legal advice</option>
                    <option value="Property dispute consultation">Property dispute consultation</option>
                    <option value="Corporate compliance query">Corporate compliance query</option>
                    <option value="Other inquiry">Other inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1.5 block">Message</label>
                  <Textarea required placeholder="Write your inquiry here..." className="bg-slate-50 border-slate-200 min-h-[120px] resize-none" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                </div>

                <div className="pt-2 space-y-3">
                  {submitError && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {submitError}
                    </div>
                  )}
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold h-12 rounded-xl transition-all shadow-md">
                    {isSubmitting ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
                  </Button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

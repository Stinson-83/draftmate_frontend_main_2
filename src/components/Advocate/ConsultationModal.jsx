import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Video, Phone, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { advocateConsultations } from '../../services/advocateApi';

export default function ConsultationModal({ isOpen, onClose, advocate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'video',
    date: '',
    time: '',
    summary: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await advocateConsultations.request({
        advocate_id: advocate.id,
        client_name: formData.name,
        client_email: formData.email,
        client_phone: formData.phone,
        preferred_type: formData.type,
        preferred_date: formData.date && formData.time ? `${formData.date}T${formData.time}:00` : undefined,
        case_summary: formData.summary,
      });
      setIsSuccess(true);
      setTimeout(() => { setIsSuccess(false); onClose(); }, 3000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to send request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-20 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {isSuccess ? (
            <div className="p-12 text-center flex flex-col items-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Sent!</h3>
              <p className="text-slate-500 font-medium">Your consultation request has been sent to {advocate?.title}. They will confirm the appointment shortly.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Book Consultation</h3>
                  <p className="text-sm font-medium text-slate-500">with {advocate?.title}</p>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-1.5 block">Full Name</label>
                      <Input required placeholder="John Doe" className="bg-slate-50 border-slate-200" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-1.5 block">Phone Number</label>
                      <Input required placeholder="+91 98765 43210" className="bg-slate-50 border-slate-200" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-1.5 block">Email Address</label>
                    <Input required type="email" placeholder="john@example.com" className="bg-slate-50 border-slate-200" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-3 block">Consultation Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'video', icon: Video, label: 'Video Call' },
                      { id: 'phone', icon: Phone, label: 'Phone Call' },
                      { id: 'in_person', icon: Users, label: 'In-Person' }
                    ].map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => setFormData({...formData, type: t.id})}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.type === t.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}
                      >
                        <t.icon className="w-5 h-5 mb-2" />
                        <span className="text-xs font-bold">{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-1.5 block">Preferred Date</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                      <Input required type="date" className="pl-10 bg-slate-50 border-slate-200 text-slate-700" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-1.5 block">Preferred Time</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                      <Input required type="time" className="pl-10 bg-slate-50 border-slate-200 text-slate-700" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1.5 block">Brief Legal Requirement</label>
                  <Textarea required placeholder="Please briefly describe what you need help with..." className="bg-slate-50 border-slate-200 min-h-[100px] resize-none" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  {submitError && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {submitError}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
                      {isSubmitting ? 'Sending Request...' : 'Submit Request'}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Link as LinkIcon, Mail, Smartphone, QrCode, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { advocateAnalytics } from '@/services/advocateApi';

export default function ShareProfileModal({ isOpen, onClose, advocate }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen || !advocate) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://draftmate.com';
  const profileUrl = `${origin}/advocate/${advocate.slug}`;
  const shareTitle = `View ${advocate.title}'s Legal Profile on DraftMate`;
  const whatsappMessage = `Check out my professional profile on DraftMate: ${profileUrl}`;

  const track = (platform) => {
    if (advocate?.slug) {
      advocateAnalytics.trackShare({ slug: advocate.slug, platform });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    track('Copy Link');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: profileUrl });
        track('Native Share');
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const shareLinks = [
    { name: 'WhatsApp', icon: Smartphone, color: 'bg-green-100 text-green-600 border-green-200 hover:bg-green-600 hover:text-white', action: () => { track('WhatsApp'); window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`); } },
    { name: 'LinkedIn', icon: LinkIcon, color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-700 hover:text-white', action: () => { track('LinkedIn'); window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`); } },
  ];

  if (advocate?.website) {
    shareLinks.push({ 
      name: 'Website', 
      icon: Globe, 
      color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-900 hover:text-white', 
      action: () => { 
        track('Website'); 
        window.open(advocate.website.startsWith('http') ? advocate.website : `https://${advocate.website}`); 
      } 
    });
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-20 sm:p-0">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 50 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 50 }} 
          transition={{ duration: 0.2 }}
          className="relative bg-white sm:rounded-3xl shadow-2xl w-full h-full sm:h-auto sm:max-w-sm overflow-hidden flex flex-col mt-auto sm:mt-0 rounded-t-3xl"
        >
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-bold text-slate-900">Share Your DraftMate Profile</h3>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors -mt-2 -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">Share your professional profile with clients and professional contacts.</p>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {showQR ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm flex flex-col items-center gap-4">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`} alt="QR Code" className="w-40 h-40" crossOrigin="anonymous" />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="font-bold text-slate-700 w-full"
                    onClick={() => {
                      fetch(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(profileUrl)}`)
                        .then(r => r.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `DraftMate-QR-${advocate.slug}.png`;
                          a.click();
                          window.URL.revokeObjectURL(url);
                        });
                    }}
                  >
                    Download QR Code
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => setShowQR(false)} className="text-blue-600 font-bold hover:bg-blue-50 w-full">Back to Share Options</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-3">
                  {shareLinks.map((link, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <button onClick={link.action} className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${link.color}`}>
                        <link.icon className="w-6 h-6" />
                      </button>
                      <span className="text-[11px] font-bold text-slate-600">{link.name}</span>
                    </div>
                  ))}
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => { track('QR Code'); setShowQR(true); }} className="w-14 h-14 rounded-2xl border bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-600 hover:text-white flex items-center justify-center transition-all">
                      <QrCode className="w-6 h-6" />
                    </button>
                    <span className="text-[11px] font-bold text-slate-600">QR Code</span>
                  </div>
                </div>

                {/* Native Share button for mobile */}
                <div className="pt-2 sm:hidden">
                  <Button onClick={handleNativeShare} className="w-full bg-slate-900 text-white font-bold h-12 rounded-xl">
                    Share via Device
                  </Button>
                </div>

                <div className="relative pt-4 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Public Profile</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-4">
                    <span className="text-sm text-slate-600 truncate flex-1 font-medium">{profileUrl}</span>
                    <Button onClick={handleCopyLink} variant="secondary" className="h-9 px-4 rounded-lg bg-white shadow-sm hover:bg-slate-100 font-bold text-slate-700 min-w-[150px]">
                      {copied ? <><CheckCircle2 className="w-4 h-4 text-green-500 mr-1.5" /> Profile link copied</> : <><Copy className="w-4 h-4 mr-1.5" /> Copy Link</>}
                    </Button>
                  </div>
                </div>
              </>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

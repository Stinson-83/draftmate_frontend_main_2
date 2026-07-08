import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, Star, ArrowRight, MessageSquare, ShieldCheck, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { advocateBookmarks, tokens } from '../../services/advocateApi';

const GRADIENTS = [
  'bg-gradient-to-br from-slate-800 to-slate-900',
  'bg-gradient-to-br from-blue-900 to-slate-900',
  'bg-gradient-to-br from-indigo-900 to-slate-900',
];

const getInitials = (name) => {
  if (!name) return 'L';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0].toUpperCase();
};

export default function AdvocateCard({ advocate }) {
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  // ─── DATA PROCESSING (Backend Fields) ───
  const name = advocate.title || advocate.name || 'Advocate';
  const hasValidImage = advocate.profile_image_url && !advocate.profile_image_url.includes('ui-avatars.com');
  const gradientClass = GRADIENTS[name.length % GRADIENTS.length];
  
  // Practice Areas Parsing
  const rawPA = advocate.practice_areas;
  let practiceAreas = [];
  if (Array.isArray(rawPA)) { practiceAreas = rawPA; } 
  else if (typeof rawPA === 'string') { try { practiceAreas = JSON.parse(rawPA); } catch { practiceAreas = []; } }

  const languages = Array.isArray(advocate.languages) ? advocate.languages : 
    (typeof advocate.languages === 'string' ? advocate.languages.split(',').map(l => l.trim()) : ["English", "Hindi"]);

  // ─── HANDLERS ───
  const handleSave = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!tokens.getAccess()) { toast.error('Please log in to save advocates'); return; }
    try {
      if (isSaved) { await advocateBookmarks.remove(advocate.id); setIsSaved(false); toast.success('Removed'); }
      else { await advocateBookmarks.add(advocate.id); setIsSaved(true); toast.success('Saved'); }
    } catch (err) { toast.error('Could not save advocate'); }
  };

  return (
    <motion.div 
      onClick={() => navigate(`/advocate/${advocate.slug}`)}
      className="bg-white rounded-[28px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,28,46,0.03)] hover:shadow-[0_24px_48px_rgba(37,99,235,0.08)] hover:-translate-y-2 hover:border-blue-200 transition-all duration-500 p-6 flex flex-col h-full group text-left relative overflow-hidden cursor-pointer"
    >
       {/* Accent Glow */}
       <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

       {/* Header: Image + Info */}
       <div className="flex gap-4 items-start mb-6 relative z-10">
          <div className="relative shrink-0 rounded-full p-1 border-2 border-transparent group-hover:border-blue-100 transition-colors duration-500">
             {hasValidImage ? (
                <img src={advocate.profile_image_url} alt={name} className="w-16 h-16 rounded-full object-cover shadow-sm group-hover:scale-110 transition-transform duration-500" />
             ) : (
                <div className={`w-16 h-16 rounded-full ${gradientClass} flex items-center justify-center text-white font-bold text-xl shadow-sm`}>{getInitials(name)}</div>
             )}
             {advocate.is_verified && (
                <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm z-20">
                   <ShieldCheck className="w-3 h-3" />
                </div>
             )}
          </div>
          <div className="pt-1">
             <h3 className="font-black text-[#0F1C2E] text-[18px] group-hover:text-blue-600 transition-colors leading-tight mb-1 truncate">{name}</h3>
             <p className="text-[13px] text-slate-500 font-bold truncate">{advocate.court_affiliation || 'High Court'}</p>
             <div className="flex items-center gap-1.5 mt-2 bg-amber-50/50 w-max px-2 py-0.5 rounded-lg border border-amber-100/50">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-[13px] font-extrabold text-slate-700">{advocate.rating || '4.8'}</span>
                <span className="text-[12px] font-medium text-slate-400">({advocate.review_count || '0'})</span>
             </div>
          </div>
       </div>

       {/* Practice Areas */}
       <div className="flex flex-wrap gap-2 mb-6 relative z-10">
          {practiceAreas.slice(0, 3).map((area, i) => (
             <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] font-extrabold text-slate-600 group-hover:bg-blue-50/60 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors duration-300">
                {area}
             </span>
          ))}
       </div>

       {/* Details Box */}
       <div className="space-y-3 mb-8 mt-auto bg-slate-50/60 p-4 rounded-[16px] border border-slate-100 group-hover:bg-white group-hover:border-blue-50 transition-colors duration-300 relative z-10">
          <div className="flex items-center gap-3 text-[13.5px] text-slate-600 font-semibold">
             <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><MapPin className="w-3.5 h-3.5" /></div>
             {advocate.location || 'India'}
          </div>
          <div className="flex items-center gap-3 text-[13.5px] text-slate-600 font-semibold">
             <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Briefcase className="w-3.5 h-3.5" /></div>
             {advocate.years_experience || '5+'} Years Exp.
          </div>
          <div className="flex items-center gap-3 text-[13.5px] text-slate-600 font-semibold">
             <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Globe className="w-3.5 h-3.5" /></div>
             <span className="truncate">{languages.join(', ')}</span>
          </div>
       </div>

       {/* Action Area */}
       <div className="mt-auto pt-4 border-t border-slate-100">
           <div className="flex gap-2 relative overflow-hidden">
            <Button 
              className="flex-1 h-10 text-sm font-bold bg-slate-900 hover:bg-blue-600 text-white rounded-xl transition-all duration-150 active:scale-95 group/btn"
              onClick={(e) => { e.stopPropagation(); navigate(`/advocate/${advocate.slug}?action=book`); }}
            >
              Book Consult
            </Button>
            <Button 
              variant="outline"
              className="px-3 h-10 text-sm font-bold border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all duration-150"
              onClick={(e) => { e.stopPropagation(); navigate(`/advocate/${advocate.slug}?action=message`); }}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
           </div>
       </div>
    </motion.div>
  );
}
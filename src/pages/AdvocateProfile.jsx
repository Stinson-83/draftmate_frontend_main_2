import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Briefcase, ExternalLink, GraduationCap, Gavel, Scale, MessageSquare, Share2, Globe, FileText, ArrowLeft, Building2, Clock, Eye, CalendarCheck, ShieldCheck, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import TimelineItem from '../components/Advocate/TimelineItem';
import ConsultationModal from '../components/Advocate/ConsultationModal';
import ContactModal from '../components/Advocate/ContactModal';
import ShareProfileModal from '../components/Advocate/ShareProfileModal';
import SeoHead from '../components/Advocate/SeoHead';

const getInitials = (name) => {
  if (!name) return 'L';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const GRADIENTS = [
  'bg-gradient-to-br from-blue-600 to-indigo-800',
  'bg-gradient-to-br from-emerald-600 to-teal-800',
  'bg-gradient-to-br from-violet-600 to-purple-800',
  'bg-gradient-to-br from-rose-600 to-pink-800',
  'bg-gradient-to-br from-amber-600 to-orange-800'
];

export default function AdvocateProfile() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/advocate-api/api/v1/profiles/public/${slug}`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        
        const data = await response.json();
        // Normalise languages to array
        const profileData = data.data;
        if (profileData && typeof profileData.languages === 'string') {
          try { profileData.languages = JSON.parse(profileData.languages); }
          catch { profileData.languages = profileData.languages.split(',').map(l => l.trim()).filter(Boolean); }
        }
        setProfile(profileData);

        fetch(`${import.meta.env.VITE_API_BASE_URL}/advocate-api/api/v1/analytics/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ advocate_id: data.data.id, referrer: document.referrer || '', source: 'web' })
        }).catch(() => {});
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] mt-16 pb-20">
        <div className="h-[280px] w-full bg-slate-200 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[360px] flex-shrink-0 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
          <div className="flex-1 space-y-8 mt-24 lg:mt-0">
            <Skeleton className="h-[300px] w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-slate-500 mb-8 font-medium">This advocate profile doesn't exist or may have been removed.</p>
          <Link to="/advocates">
            <Button className="w-full h-12 text-md rounded-xl bg-slate-900 hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const name = profile.title || 'Advocate';
  const hasValidImage = profile.profile_image_url && !profile.profile_image_url.includes('ui-avatars.com');
  const gradientClass = GRADIENTS[name.length % GRADIENTS.length];
  const practiceAreas = profile.practice_areas || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F8FAFC] pb-24 mt-16 font-sans text-slate-900"
    >
      <SeoHead 
        title={profile.seoMetadata?.title || `${name} - Advocate Profile`} 
        description={profile.seoMetadata?.description || profile.bio} 
        ogImage={hasValidImage ? profile.profile_image_url : null} 
        canonicalUrl={window.location.href}
      />
      
      {/* Executive Cover Banner */}
      <div className="h-[120px] sm:h-[180px] w-full relative bg-slate-900 overflow-hidden">
        {profile.banner_image_url ? (
          <img src={profile.banner_image_url} alt="Cover" className="w-full h-full object-cover opacity-50" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>
        )}
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sticky Left Profile Card - Action Center */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/60 p-6 sm:p-8 flex flex-col items-center text-center lg:sticky lg:top-24">
              
              {/* Premium Avatar */}
              <div className="relative -mt-20 sm:-mt-24 mb-5 group">
                {hasValidImage ? (
                  <img 
                    src={profile.profile_image_url} 
                    alt={name} 
                    className="w-[120px] h-[120px] rounded-full object-cover shadow-xl border-[6px] border-white ring-[3px] ring-blue-600 bg-white group-hover:shadow-[0_0_0_4px_rgba(37,99,235,0.2)] transition-shadow duration-300"
                  />
                ) : (
                  <div className={`w-[120px] h-[120px] rounded-full ${gradientClass} flex items-center justify-center text-white text-5xl font-bold shadow-xl border-[6px] border-white ring-[3px] ring-blue-600 group-hover:shadow-[0_0_0_4px_rgba(37,99,235,0.2)] transition-shadow duration-300`}>
                    {getInitials(name)}
                  </div>
                )}
                {profile.is_verified && (
                  <div className="absolute bottom-1 right-2 bg-white rounded-full p-0.5 shadow-md" title="Identity Verified by DraftMate">
                    <BadgeCheck className="w-7 h-7 text-blue-600 fill-white" />
                  </div>
                )}
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {name}
              </h1>
              
              <p className="text-slate-500 font-bold mt-2 text-md">
                {profile.court_affiliation || 'Independent Advocate'}
              </p>
              
              {/* Primary Call to Actions */}
              <div className="w-full mt-8 flex flex-col gap-3">
                <Button 
                  className="w-full h-14 text-lg rounded-xl transition-all duration-200 bg-slate-900 hover:bg-[#1D4ED8] hover:scale-[1.02] text-white font-bold group shadow-md"
                  onClick={() => setIsConsultModalOpen(true)}
                >
                  <CalendarCheck className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Book Consultation
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-[#F8FAFC] hover:border-blue-600 transition-all font-bold shadow-sm group"
                    onClick={() => setIsContactModalOpen(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2 group-hover:text-blue-600 transition-colors" /> Message
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-[0.5] h-12 rounded-xl border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-[#F8FAFC] hover:border-blue-600 transition-all font-bold shadow-sm"
                    onClick={() => setIsShareModalOpen(true)}
                  >
                    <Share2 className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                  </Button>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100 my-8"></div>

              {/* Profile Trust Builders */}
              <div className="w-full text-left space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Profile Trust & Status</h4>
                
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg"><Fingerprint className="w-4 h-4" /></div>
                  <span className="text-slate-500 mr-1">ID:</span> {profile.advocate_id || 'ADV-2026-0000X'}
                </div>

                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg"><Building2 className="w-4 h-4" /></div>
                  <span className="text-slate-500 mr-1">Court:</span> {profile.court_affiliation || 'Delhi High Court'}
                </div>

                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg"><Scale className="w-4 h-4" /></div>
                  <span className="text-slate-500 mr-1">Bar No:</span> {profile.bar_council_number || 'D/1234/2005'}
                </div>

                {profile.is_verified && (
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><ShieldCheck className="w-4 h-4" /></div>
                    Verified Advocate
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <div className="p-1.5 bg-green-50 text-green-600 rounded-lg"><Clock className="w-4 h-4" /></div>
                  Responds within 24 hours
                </div>
                
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><MessageSquare className="w-4 h-4" /></div>
                  {profile.total_consultations != null ? `${profile.total_consultations} Total Consultations` : 'No consultations yet'}
                </div>
                
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><BadgeCheck className="w-4 h-4" /></div>
                  {profile.rating != null ? `${profile.rating} Rating` : 'No ratings yet'}
                </div>
                
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg"><Globe className="w-4 h-4" /></div>
                  {(profile.languages || []).length > 0 ? (profile.languages || []).join(', ') : 'Not specified'}
                </div>

                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Eye className="w-4 h-4" /></div>
                  {profile.view_count != null ? `${profile.view_count} Profile Views` : 'No views yet'}
                </div>

                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg"><CalendarCheck className="w-4 h-4" /></div>
                  Member Since {profile.created_at ? new Date(profile.created_at).getFullYear() : '2022'}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><BadgeCheck className="w-4 h-4" /></div>
                    Profile Strength: {profile.profile_completion_score || 95}%
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 ml-9 max-w-[80%] overflow-hidden">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED]" style={{ width: `${profile.profile_completion_score || 95}%`, animation: 'fillProgress 600ms ease-out backwards' }}></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column (Main Portfolio Content) */}
          <div className="flex-1 space-y-8 lg:pt-3">
            
            {/* Quick Details Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="animate-on-scroll visible bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center transition-colors hover:bg-[#EFF6FF] hover:border-[#2563EB] group" style={{ animation: 'fadeUp 0.5s ease-out backwards', animationDelay: '100ms' }}>
                <MapPin className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                <span className="text-sm font-bold text-slate-900">{profile.location?.split(',')[0] || 'Unknown'}</span>
                <span className="text-xs font-medium text-slate-500 mt-1">Location</span>
              </div>
              <div className="animate-on-scroll visible bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center transition-colors hover:bg-[#EFF6FF] hover:border-[#2563EB] group" style={{ animation: 'fadeUp 0.5s ease-out backwards', animationDelay: '200ms' }}>
                <Briefcase className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                <span className="text-sm font-bold text-slate-900">{profile.years_experience} Years</span>
                <span className="text-xs font-medium text-slate-500 mt-1">Experience</span>
              </div>
              <div className="animate-on-scroll visible bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center transition-colors hover:bg-[#EFF6FF] hover:border-[#2563EB] group" style={{ animation: 'fadeUp 0.5s ease-out backwards', animationDelay: '300ms' }}>
                <Globe className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                <span className="text-sm font-bold text-slate-900">{profile.languages?.length || 2} Languages</span>
                <span className="text-xs font-medium text-slate-500 mt-1">Spoken</span>
              </div>
              <div className="animate-on-scroll visible bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center transition-colors hover:bg-[#EFF6FF] hover:border-[#2563EB] group" style={{ animation: 'fadeUp 0.5s ease-out backwards', animationDelay: '400ms' }}>
                <Scale className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                <span className="text-sm font-bold text-slate-900 line-clamp-1">{profile.bar_council_number || 'Registered'}</span>
                <span className="text-xs font-medium text-slate-500 mt-1">Bar Council</span>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-4 mt-4"
            >
              <div className="animate-on-scroll visible bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center transition-colors hover:bg-[#EFF6FF] hover:border-[#2563EB] group" style={{ animation: 'fadeUp 0.5s ease-out backwards', animationDelay: '500ms' }}>
                <Building2 className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                <span className="text-sm font-bold text-slate-900">{profile.court_affiliation || 'Delhi High Court'}</span>
                <span className="text-xs font-medium text-slate-500 mt-1">Court Affiliation</span>
              </div>
              <div className="animate-on-scroll visible bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center transition-colors hover:bg-[#EFF6FF] hover:border-[#2563EB] group" style={{ animation: 'fadeUp 0.5s ease-out backwards', animationDelay: '600ms' }}>
                <BadgeCheck className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                <span className="text-sm font-bold text-slate-900">{profile.rating || 4.8} / 5.0</span>
                <span className="text-xs font-medium text-slate-500 mt-1">Average Rating</span>
              </div>
            </motion.div>

            {/* Executive Bio */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8 sm:p-10"
            >
              <h3 className="text-2xl font-extrabold text-slate-900 mb-6">About the Advocate</h3>
              <div className="prose prose-slate max-w-none text-[16px] leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                {profile.bio || "This advocate has not added a detailed biography yet."}
              </div>
              
              {/* Practice Areas */}
              {practiceAreas.length > 0 && (
                <div className="mt-10 pt-8 border-t border-slate-100">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Core Practice Areas</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {practiceAreas.map((pa, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-sm font-bold transition-transform hover:-translate-y-0.5 cursor-pointer">
                        <Scale className="w-4 h-4" /> {pa}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Experience Timeline */}
            {(profile.experience && profile.experience.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8 sm:p-10"
              >
                <h3 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  Professional Experience
                </h3>
                <div className="space-y-0">
                  {profile.experience.map((exp, index) => (
                    <TimelineItem 
                      key={exp.id}
                      title={exp.role}
                      subtitle={exp.company}
                      dateRange={`${exp.start_date ? new Date(exp.start_date).getFullYear() : ''} - ${exp.is_current ? 'Present' : (exp.end_date ? new Date(exp.end_date).getFullYear() : '')}`}
                      description={exp.description}
                      isLast={index === profile.experience.length - 1}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Education Timeline */}
            {(profile.education && profile.education.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8 sm:p-10"
              >
                <h3 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  Education & Credentials
                </h3>
                <div className="space-y-0">
                  {profile.education.map((edu, index) => (
                    <TimelineItem 
                      key={edu.id}
                      title={edu.degree}
                      subtitle={edu.institution}
                      dateRange={`${edu.start_year || ''} - ${edu.end_year || ''}`}
                      isLast={index === profile.education.length - 1}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Achievements & Cases */}
            {(profile.achievements && profile.achievements.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8 sm:p-10"
              >
                <h3 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                    <Gavel className="w-6 h-6" />
                  </div>
                  Notable Cases & Achievements
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.achievements.map((ach) => (
                    <div key={ach.id} className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all group cursor-pointer">
                      <div className="p-3 bg-white text-slate-400 group-hover:text-amber-600 transition-colors rounded-xl shadow-sm h-fit shrink-0">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 leading-tight mb-1">{ach.title}</h4>
                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wide text-[11px] mt-2">
                          {ach.type} {ach.date_achieved ? `• ${new Date(ach.date_achieved).getFullYear()}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>

      <ConsultationModal 
        isOpen={isConsultModalOpen} 
        onClose={() => setIsConsultModalOpen(false)} 
        advocate={profile} 
      />
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
        advocate={profile} 
      />
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        advocate={profile}
      />

      {/* Sticky Bottom Bar on Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] p-4 flex gap-3 z-40">
        <Button 
          className="flex-1 h-12 text-md rounded-xl transition-all duration-200 bg-slate-900 hover:bg-[#1D4ED8] text-white font-bold"
          onClick={() => setIsConsultModalOpen(true)}
        >
          Book
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 h-12 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-[#F8FAFC] hover:border-blue-600"
          onClick={() => setIsContactModalOpen(true)}
        >
          Message
        </Button>
      </div>
    </motion.div>
  );
}

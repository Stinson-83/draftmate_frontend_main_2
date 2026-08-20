import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  BadgeCheck, MapPin, Briefcase, ExternalLink, GraduationCap, Gavel, 
  Scale, MessageSquare, Share2, Globe, FileText, ArrowLeft, Building2, 
  Clock, Eye, CalendarCheck, ShieldCheck, Fingerprint, Users, TrendingUp, 
  Phone, Linkedin, Instagram, Facebook, Twitter, Link as LinkIcon, Award
} from 'lucide-react';
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
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'book') setIsConsultModalOpen(true);
    if (params.get('action') === 'message') setIsContactModalOpen(true);
  }, [location.search]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/advocate-api/api/v1/profiles/public/${slug}`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        
        const data = await response.json();
        const profileData = data.data;
        if (profileData && typeof profileData.languages === 'string') {
          try { profileData.languages = JSON.parse(profileData.languages); }
          catch { profileData.languages = profileData.languages.split(',').map(l => l.trim()).filter(Boolean); }
        }
        setProfile(profileData);

        fetch(`${import.meta.env.VITE_API_BASE_URL}/advocate-api/api/v1/analytics/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: slug, referrer: document.referrer || '', source: 'web' })
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 flex flex-col lg:flex-row gap-8">
          <Skeleton className="h-[400px] w-full lg:w-[24%] rounded-2xl" />
          <Skeleton className="h-[600px] w-full lg:w-[50%] rounded-2xl" />
          <Skeleton className="h-[400px] w-full lg:w-[26%] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile || profile.is_public === false) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile Unavailable</h1>
          <p className="text-slate-500 mb-8 font-medium">This advocate profile is currently unavailable or set to private.</p>
          <Link to="/advocates">
            <Button className="w-full h-12 text-md rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold">
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
  const displayName = name.toLowerCase().includes('adv') ? name : `Adv. ${name}`;
  const primaryArea = practiceAreas.length > 0 ? practiceAreas[0] : '';
  const pageTitle = primaryArea ? `${displayName} | ${primaryArea} | DraftMate` : `${displayName} | Advocate Profile | DraftMate`;
  
  let pageDesc = profile.bio;
  if (!pageDesc) {
    const loc = profile.location ? ` in ${profile.location}` : '';
    const exp = profile.years_experience ? ` with ${profile.years_experience} years of experience` : '';
    pageDesc = `${displayName} is a verified legal professional practicing${loc}${exp}. Contact for legal consultation.`;
  } else if (pageDesc.length > 160) {
    pageDesc = pageDesc.substring(0, 157) + '...';
  }
  
  const canonical = typeof window !== 'undefined' ? `${window.location.origin}/advocate/${slug}` : `https://draftmate.com/advocate/${slug}`;

  const getSocialLinks = () => {
    if (!profile.social_links) return null;
    try {
      const links = typeof profile.social_links === 'string' ? JSON.parse(profile.social_links) : profile.social_links;
      const valid = {};
      Object.keys(links).forEach(key => {
        const url = links[key];
        if (url && typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
          valid[key] = url;
        }
      });
      return Object.keys(valid).length > 0 ? valid : null;
    } catch { return null; }
  };
  const socialLinks = getSocialLinks();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F8FAFC] pb-28 mt-16 font-sans text-slate-900">
      <SeoHead 
        title={pageTitle} 
        description={pageDesc} 
        ogImage={hasValidImage ? profile.profile_image_url : null} 
        canonicalUrl={canonical}
        advocateData={profile}
      />
      
      {/* Premium Hero Section */}
      <div className="relative bg-[#0B1B33] overflow-hidden">
        {profile.banner_image_url ? (
          <div className="absolute inset-0">
            <img src={profile.banner_image_url} alt="Cover" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B33] via-[#0B1B33]/60 to-transparent"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1B33] via-[#0d2242] to-[#122e56]">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>
        )}

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-8 justify-between">
          {/* Left: Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {displayName}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-300 font-medium">
              {profile.court_affiliation && (
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {profile.court_affiliation}</span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {profile.location.split(',')[0]}</span>
              )}
              {profile.years_experience && (
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {profile.years_experience} Years Exp.</span>
              )}
            </div>
            {profile.is_verified && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-bold">
                <ShieldCheck className="w-4 h-4" /> Verified Advocate
              </div>
            )}
            {profile.bio && (
              <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed line-clamp-2 md:line-clamp-3 mx-auto md:mx-0">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Center: Image */}
          <div className="flex-shrink-0 relative group">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-slate-800 shadow-2xl relative overflow-hidden bg-slate-800 group-hover:border-blue-500 transition-colors duration-300">
              {hasValidImage ? (
                <img src={profile.profile_image_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full ${gradientClass} flex items-center justify-center text-white text-4xl md:text-6xl font-bold`}>
                  {getInitials(name)}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex-shrink-0 flex flex-col gap-3 w-full md:w-auto">
            <Button onClick={() => setIsConsultModalOpen(true)} className="w-full md:w-64 h-14 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:scale-[1.02] transition-transform">
              <CalendarCheck className="w-5 h-5 mr-2" /> Book Consultation
            </Button>
            <div className="flex gap-3">
              <Button onClick={() => setIsContactModalOpen(true)} variant="outline" className="flex-1 h-12 rounded-xl border-slate-700 bg-slate-800/50 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-slate-600 font-bold backdrop-blur-sm">
                <MessageSquare className="w-4 h-4 mr-2" /> Message
              </Button>
              <Button onClick={() => setIsShareModalOpen(true)} variant="outline" className="h-12 w-12 rounded-xl border-slate-700 bg-slate-800/50 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-slate-600 font-bold backdrop-blur-sm p-0 flex items-center justify-center" aria-label="Share">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 lg:mt-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN (24%) - Professional Identity */}
          <div className="w-full lg:w-[24%] flex-shrink-0 space-y-6">
            
            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><UserIcon className="w-4 h-4 text-blue-600"/> About</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No professional biography provided."}
              </p>
            </div>

            {/* Specializations */}
            {practiceAreas.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Scale className="w-4 h-4 text-blue-600"/> Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {practiceAreas.map((pa, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                      {pa}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Locations */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600"/> Locations</h3>
              {profile.office_address ? (
                <p className="text-slate-600 text-sm whitespace-pre-wrap">{profile.office_address}</p>
              ) : (
                <p className="text-slate-600 text-sm">{profile.location || "Not specified."}</p>
              )}
            </div>

            {/* Languages */}
            {(profile.languages && profile.languages.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-600"/> Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Credentials */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Fingerprint className="w-4 h-4 text-blue-600"/> Credentials</h3>
              
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-slate-50 rounded text-slate-400"><Fingerprint className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bar Council No.</p>
                  <p className="text-sm font-semibold text-slate-700">{profile.bar_council_number || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-slate-50 rounded text-slate-400"><Building2 className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Court Affiliation</p>
                  <p className="text-sm font-semibold text-slate-700">{profile.court_affiliation || "Not specified"}</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {socialLinks && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-blue-600"/> Connect</h3>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-[#0A66C2] hover:bg-[#F3F9FF] rounded-xl bg-slate-50 transition-colors"><Linkedin className="w-5 h-5" /></a>}
                  {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl bg-slate-50 transition-colors"><Twitter className="w-5 h-5" /></a>}
                  {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-[#1877F2] hover:bg-[#F0F2F5] rounded-xl bg-slate-50 transition-colors"><Facebook className="w-5 h-5" /></a>}
                  {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-[#E4405F] hover:bg-pink-50 rounded-xl bg-slate-50 transition-colors"><Instagram className="w-5 h-5" /></a>}
                  {socialLinks.website && <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl bg-slate-50 transition-colors"><LinkIcon className="w-5 h-5" /></a>}
                </div>
              </div>
            )}

          </div>

          {/* CENTER COLUMN (50%) - Professional Journey */}
          <div className="w-full lg:w-[50%] flex-shrink-0 space-y-6">
            
            {((profile.experience && profile.experience.length > 0) || 
              (profile.education && profile.education.length > 0) || 
              (profile.certifications && profile.certifications.length > 0)) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900">My Professional Journey</h2>
                  <p className="text-slate-500 font-medium">Professional Experience & Educational Background</p>
                </div>

                {/* Experience */}
                {(profile.experience && profile.experience.length > 0) && (
                  <div className="mb-10">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600"/> Professional Experience</h3>
                    <div className="space-y-0">
                      {profile.experience.map((exp, index) => (
                        <TimelineItem 
                          key={exp.id || index}
                          title={exp.role}
                          subtitle={exp.company}
                          dateRange={`${exp.start_date ? new Date(exp.start_date).getFullYear() : ''} - ${exp.is_current ? 'Present' : (exp.end_date ? new Date(exp.end_date).getFullYear() : '')}`}
                          description={exp.description}
                          isLast={index === profile.experience.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {(profile.education && profile.education.length > 0) && (
                  <div className="mb-10">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-600"/> Education</h3>
                    <div className="space-y-0">
                      {profile.education.map((edu, index) => (
                        <TimelineItem 
                          key={edu.id || index}
                          title={edu.degree}
                          subtitle={edu.institution}
                          dateRange={`${edu.start_year || ''} - ${edu.end_year || ''}`}
                          isLast={index === profile.education.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {(profile.certifications && profile.certifications.length > 0) && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Award className="w-5 h-5 text-amber-600"/> Certifications</h3>
                    <div className="space-y-0">
                      {profile.certifications.map((cert, index) => (
                        <TimelineItem 
                          key={cert.id || index}
                          title={cert.title}
                          subtitle={cert.type}
                          dateRange={cert.date_achieved ? new Date(cert.date_achieved).getFullYear() : ''}
                          isLast={index === profile.certifications.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* RIGHT COLUMN (26%) - Stats & Actions */}
          <div className="w-full lg:w-[26%] flex-shrink-0 space-y-6">
            
            {/* Statistics */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600"/> Professional Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm font-medium">Cases Won</span>
                  <span className="font-bold text-slate-900">{profile.cases_won != null ? profile.cases_won : 'N/A'}</span>
                </div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm font-medium">Total Clients</span>
                  <span className="font-bold text-slate-900">{profile.total_clients != null ? profile.total_clients : 'N/A'}</span>
                </div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm font-medium">Success Rate</span>
                  <span className="font-bold text-green-600">{profile.success_rate != null ? `${profile.success_rate}%` : 'N/A'}</span>
                </div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm font-medium">Consultations</span>
                  <span className="font-bold text-slate-900">{profile.total_consultations != null ? profile.total_consultations : '0'}</span>
                </div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm font-medium">Profile Views</span>
                  <span className="font-bold text-slate-900">{profile.view_count != null ? profile.view_count : '0'}</span>
                </div>
              </div>
            </div>

            {/* Consultation Action */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Consultation</h3>
              {profile.consultation_fee && (
                <p className="text-blue-600 font-extrabold text-xl mb-4">₹{profile.consultation_fee}</p>
              )}
              {!profile.consultation_fee && <p className="text-slate-500 text-sm mb-4">Fee available upon request</p>}
              <Button onClick={() => setIsConsultModalOpen(true)} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold transition-colors">
                Book Consultation
              </Button>
            </div>

            {/* Contact Action */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Contact Advocate</h3>
              {profile.phone ? (
                <a href={`tel:${profile.phone}`} className="text-indigo-600 font-extrabold text-lg mb-4 hover:underline">{profile.phone}</a>
              ) : (
                <p className="text-slate-500 text-sm mb-4">Direct message via DraftMate</p>
              )}
              <Button onClick={() => setIsContactModalOpen(true)} variant="outline" className="w-full h-12 rounded-xl border-slate-300 text-slate-700 font-bold hover:bg-slate-50">
                Send Message
              </Button>
            </div>

            {/* Profile Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                <p className="text-sm font-bold text-slate-900 leading-none">LIVE Public Profile</p>
              </div>
            </div>

          </div>

        </div>
      </div>

      <ConsultationModal isOpen={isConsultModalOpen} onClose={() => setIsConsultModalOpen(false)} advocate={profile} />
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} advocate={profile} />
      <ShareProfileModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} advocate={profile} />

      {/* Sticky Bottom Bar on Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] p-4 flex gap-3 z-40 pb-safe">
        <Button onClick={() => setIsContactModalOpen(true)} variant="outline" className="flex-[0.8] h-12 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50">
          Message
        </Button>
        <Button onClick={() => setIsConsultModalOpen(true)} className="flex-[1.2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
          Book Consultation
        </Button>
      </div>

    </motion.div>
  );
}

function UserIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

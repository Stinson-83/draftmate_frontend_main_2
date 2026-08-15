import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Filter, MapPin, CheckCircle, Award, Briefcase,
  ChevronDown, SlidersHorizontal, Star, Scale, Building2,
  Users, Laptop, Calculator, Home, Globe, ShoppingBag,
  Gavel, Rocket, Fingerprint, Command, ShieldCheck, X, Clock, ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import AdvocateCard from '../components/Advocate/AdvocateCard';
import SeoHead from '../components/Advocate/SeoHead';
import Navbar from '../components/landing/sections/Navbar';
import Footer from '../components/landing/sections/Footer';
import { advocateDiscovery } from '../services/advocateApi';

// Custom debounce hook for search input
function useDebounceValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const SPECIALIZATIONS = [
  { name: 'Criminal Law', icon: Scale, color: 'text-rose-500', bg: 'bg-rose-50/80', border: 'hover:border-rose-200', glow: 'group-hover:bg-rose-50/40' },
  { name: 'Corporate Law', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50/80', border: 'hover:border-blue-200', glow: 'group-hover:bg-blue-50/40' },
  { name: 'Family Law', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50/80', border: 'hover:border-purple-200', glow: 'group-hover:bg-purple-50/40' },
  { name: 'Cyber Law', icon: Laptop, color: 'text-cyan-500', bg: 'bg-cyan-50/80', border: 'hover:border-cyan-200', glow: 'group-hover:bg-cyan-50/40' },
  { name: 'Tax Law', icon: Calculator, color: 'text-emerald-500', bg: 'bg-emerald-50/80', border: 'hover:border-emerald-200', glow: 'group-hover:bg-emerald-50/40' },
  { name: 'Property Law', icon: Home, color: 'text-amber-500', bg: 'bg-amber-50/80', border: 'hover:border-amber-200', glow: 'group-hover:bg-amber-50/40' },
  { name: 'Immigration Law', icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50/80', border: 'hover:border-indigo-200', glow: 'group-hover:bg-indigo-50/40' },
  { name: 'Consumer Rights', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50/80', border: 'hover:border-orange-200', glow: 'group-hover:bg-orange-50/40' },
  { name: 'Civil Law', icon: Gavel, color: 'text-slate-600', bg: 'bg-slate-100/80', border: 'hover:border-slate-300', glow: 'group-hover:bg-slate-50' },
  { name: 'Startup Law', icon: Rocket, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50/80', border: 'hover:border-fuchsia-200', glow: 'group-hover:bg-fuchsia-50/40' },
];

// ─── DUMMY DATA FOR UI TESTING ──────────────────────────────────────────
// const DUMMY_ADVOCATES = [
//   // --- Criminal Law ---
//   { id: 'adv_01', name: 'Adv. Vikram Singh', practice_areas: ['Criminal Law', 'Civil Law'], location: 'New Delhi, Delhi', experience: '15 Years', rating: 4.9, reviews: 142, verified: true, image: 'https://i.pravatar.cc/150?u=adv1', languages: ['English', 'Hindi'], court: 'Supreme Court' },
//   { id: 'adv_02', name: 'Adv. Neha Sharma', practice_areas: ['Criminal Law', 'Family Law'], location: 'Mumbai, Maharashtra', experience: '8 Years', rating: 4.7, reviews: 89, verified: true, image: 'https://i.pravatar.cc/150?u=adv2', languages: ['English', 'Marathi'], court: 'High Court' },
//   // --- Corporate Law ---
//   { id: 'adv_03', name: 'Adv. Rohan Desai', practice_areas: ['Corporate Law', 'Startup Law'], location: 'Bangalore, Karnataka', experience: '12 Years', rating: 4.8, reviews: 210, verified: true, image: 'https://i.pravatar.cc/150?u=adv3', languages: ['English', 'Kannada'], court: 'High Court' },
//   { id: 'adv_04', name: 'Adv. Priya Patel', practice_areas: ['Corporate Law', 'Tax Law'], location: 'Ahmedabad, Gujarat', experience: '20 Years', rating: 5.0, reviews: 305, verified: true, image: 'https://i.pravatar.cc/150?u=adv4', languages: ['English', 'Gujarati'], court: 'Supreme Court' },
//   { id: 'adv_05', name: 'Adv. Arjun Kapoor', practice_areas: ['Corporate Law', 'Property Law'], location: 'New Delhi, Delhi', experience: '5 Years', rating: 4.5, reviews: 45, verified: false, image: 'https://i.pravatar.cc/150?u=adv5', languages: ['English', 'Hindi'], court: 'District Court' },
//   // --- Family Law ---
//   { id: 'adv_06', name: 'Adv. Meera Reddy', practice_areas: ['Family Law', 'Civil Law'], location: 'Chennai, Tamil Nadu', experience: '18 Years', rating: 4.9, reviews: 178, verified: true, image: 'https://i.pravatar.cc/150?u=adv6', languages: ['English', 'Tamil'], court: 'High Court' },
//   { id: 'adv_07', name: 'Adv. Sanjay Gupta', practice_areas: ['Family Law'], location: 'Pune, Maharashtra', experience: '6 Years', rating: 4.6, reviews: 67, verified: false, image: 'https://i.pravatar.cc/150?u=adv7', languages: ['English', 'Hindi', 'Marathi'], court: 'District Court' },
//   // --- Cyber Law ---
//   { id: 'adv_08', name: 'Adv. Ananya Iyer', practice_areas: ['Cyber Law', 'Corporate Law'], location: 'Hyderabad, Telangana', experience: '9 Years', rating: 4.8, reviews: 112, verified: true, image: 'https://i.pravatar.cc/150?u=adv8', languages: ['English', 'Telugu'], court: 'High Court' },
//   { id: 'adv_09', name: 'Adv. Karan Malhotra', practice_areas: ['Cyber Law', 'Startup Law'], location: 'Gurugram, Haryana', experience: '7 Years', rating: 4.7, reviews: 94, verified: true, image: 'https://i.pravatar.cc/150?u=adv9', languages: ['English', 'Hindi'], court: 'High Court' },
//   // --- Property Law ---
//   { id: 'adv_10', name: 'Adv. Amit Verma', practice_areas: ['Property Law', 'Civil Law'], location: 'Noida, Haryana', experience: '22 Years', rating: 4.9, reviews: 420, verified: true, image: 'https://i.pravatar.cc/150?u=adv10', languages: ['English', 'Hindi'], court: 'Supreme Court' },
//   { id: 'adv_11', name: 'Adv. Sneha Joshi', practice_areas: ['Property Law', 'Family Law'], location: 'Jaipur, Gujarat', experience: '4 Years', rating: 4.4, reviews: 23, verified: false, image: 'https://i.pravatar.cc/150?u=adv11', languages: ['English', 'Hindi'], court: 'District Court' },
//   // --- Tax Law ---
//   { id: 'adv_12', name: 'Adv. Rajesh Kumar', practice_areas: ['Tax Law', 'Corporate Law'], location: 'Kolkata, West Bengal', experience: '16 Years', rating: 4.8, reviews: 156, verified: true, image: 'https://i.pravatar.cc/150?u=adv12', languages: ['English', 'Bengali'], court: 'High Court' },
//   // --- Immigration Law ---
//   { id: 'adv_13', name: 'Adv. Simran Kaur', practice_areas: ['Immigration Law'], location: 'Chandigarh, Punjab', experience: '11 Years', rating: 4.7, reviews: 134, verified: true, image: 'https://i.pravatar.cc/150?u=adv13', languages: ['English', 'Punjabi'], court: 'High Court' },
//   { id: 'adv_14', name: 'Adv. Manish Tiwari', practice_areas: ['Immigration Law', 'Corporate Law'], location: 'New Delhi, Delhi', experience: '14 Years', rating: 4.8, reviews: 189, verified: true, image: 'https://i.pravatar.cc/150?u=adv14', languages: ['English', 'Hindi'], court: 'Supreme Court' },
//   // --- Consumer Rights ---
//   { id: 'adv_15', name: 'Adv. Pooja Menon', practice_areas: ['Consumer Rights', 'Civil Law'], location: 'Kochi, Kerala', experience: '8 Years', rating: 4.5, reviews: 76, verified: false, image: 'https://i.pravatar.cc/150?u=adv15', languages: ['English', 'Malayalam'], court: 'District Court' },
//   { id: 'adv_16', name: 'Adv. Rahul Bajaj', practice_areas: ['Consumer Rights'], location: 'Indore, Gujarat', experience: '10 Years', rating: 4.6, reviews: 88, verified: true, image: 'https://i.pravatar.cc/150?u=adv16', languages: ['English', 'Hindi'], court: 'High Court' },
//   // --- Civil Law ---
//   { id: 'adv_17', name: 'Adv. Kavita Rao', practice_areas: ['Civil Law', 'Property Law'], location: 'Bangalore, Karnataka', experience: '25 Years', rating: 5.0, reviews: 512, verified: true, image: 'https://i.pravatar.cc/150?u=adv17', languages: ['English', 'Kannada', 'Hindi'], court: 'Supreme Court' },
//   { id: 'adv_18', name: 'Adv. Deepak Chawla', practice_areas: ['Civil Law'], location: 'Lucknow, UP', experience: '3 Years', rating: 4.2, reviews: 15, verified: false, image: 'https://i.pravatar.cc/150?u=adv18', languages: ['English', 'Hindi'], court: 'District Court' },
//   // --- Startup Law ---
//   { id: 'adv_19', name: 'Adv. Siddharth Jain', practice_areas: ['Startup Law', 'Cyber Law', 'Corporate Law'], location: 'Mumbai, Maharashtra', experience: '6 Years', rating: 4.9, reviews: 145, verified: true, image: 'https://i.pravatar.cc/150?u=adv19', languages: ['English', 'Hindi'], court: 'High Court' },
//   { id: 'adv_20', name: 'Adv. Nidhi Agrawal', practice_areas: ['Startup Law', 'Tax Law'], location: 'New Delhi, Delhi', experience: '13 Years', rating: 4.8, reviews: 204, verified: true, image: 'https://i.pravatar.cc/150?u=adv20', languages: ['English', 'Hindi'], court: 'Supreme Court' }
// ];

// // ─── PREMIUM DUMMY CARD FOR PITCH ──────────────────────────────────────────
// function DummyAdvocateCard({ advocate }) {
//   return (
//     <div className="bg-white rounded-[28px] border border-slate-200/60 shadow-[0_4px_24px_rgba(15,28,46,0.03)] hover:shadow-[0_24px_48px_rgba(37,99,235,0.08)] hover:-translate-y-2 hover:border-blue-200 transition-all duration-500 p-6 flex flex-col h-full group text-left relative overflow-hidden cursor-pointer">
       
//        {/* Subtle Top Gradient Glow on Hover */}
//        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

//        {/* Header: Image + Info */}
//        <div className="flex gap-4 items-start mb-6 relative z-10">
//           <div className="relative shrink-0 rounded-full p-1 border-2 border-transparent group-hover:border-blue-100 transition-colors duration-500">
//              <img src={advocate.image} alt={advocate.name} className="w-16 h-16 rounded-full object-cover shadow-sm group-hover:scale-110 transition-transform duration-500" />
//              {advocate.verified && (
//                 <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm z-20">
//                    <ShieldCheck className="w-3 h-3" />
//                 </div>
//              )}
//           </div>
//           <div className="pt-1">
//              <h3 className="font-black text-[#0F1C2E] text-[18px] group-hover:text-blue-600 transition-colors leading-tight mb-1">{advocate.name}</h3>
//              <p className="text-[13px] text-slate-500 font-bold">{advocate.court}</p>
//              <div className="flex items-center gap-1.5 mt-2 bg-amber-50/50 w-max px-2 py-0.5 rounded-lg border border-amber-100/50">
//                 <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
//                 <span className="text-[13px] font-extrabold text-slate-700">{advocate.rating}</span>
//                 <span className="text-[12px] font-medium text-slate-400">({advocate.reviews})</span>
//              </div>
//           </div>
//        </div>

//        {/* Specialization Tags */}
//        <div className="flex flex-wrap gap-2 mb-6 relative z-10">
//           {advocate.practice_areas.map(area => (
//              <span key={area} className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] font-extrabold text-slate-600 group-hover:bg-blue-50/60 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors duration-300">
//                 {area}
//              </span>
//           ))}
//        </div>

//        {/* Details Box */}
//        <div className="space-y-3 mb-8 mt-auto bg-slate-50/60 p-4 rounded-[16px] border border-slate-100 group-hover:bg-white group-hover:border-blue-50 transition-colors duration-300 relative z-10">
//           <div className="flex items-center gap-3 text-[13.5px] text-slate-600 font-semibold">
//              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><MapPin className="w-3.5 h-3.5" /></div>
//              {advocate.location}
//           </div>
//           <div className="flex items-center gap-3 text-[13.5px] text-slate-600 font-semibold">
//              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Briefcase className="w-3.5 h-3.5" /></div>
//              {advocate.experience} Experience
//           </div>
//           <div className="flex items-center gap-3 text-[13.5px] text-slate-600 font-semibold">
//              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Globe className="w-3.5 h-3.5" /></div>
//              <span className="truncate">{advocate.languages.join(', ')}</span>
//           </div>
//        </div>

//        {/* CTA Button */}
//        <button className="w-full py-4 rounded-[14px] bg-[#0F1C2E] border border-transparent text-white font-bold text-[14px] group-hover:bg-blue-600 group-hover:shadow-[0_8px_20px_rgba(37,99,235,0.25)] group-hover:-translate-y-1 transition-all duration-300 relative z-10 overflow-hidden flex justify-center items-center gap-2">
//           <span>View Full Profile</span>
//           {/* Arrow slides in on hover */}
//           <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
//        </button>
//     </div>
//   );
// }


// Framer Motion Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AdvocateDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounceValue(searchQuery, 500);

  const [location, setLocation] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedPracticeArea, setSelectedPracticeArea] = useState('');
  const [sortBy, setSortBy] = useState('relevant');
  const [page, setPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ─── LIVE BACKEND API QUERIES ──────────────────────────────────────────

  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['advocates', 'featured'],
    queryFn: () => advocateDiscovery.featured(5),
  });

  const { data: trendingData, isLoading: loadingTrending } = useQuery({
    queryKey: ['advocates', 'trending'],
    queryFn: () => advocateDiscovery.trending(5),
  });

  const { data: recentData, isLoading: loadingRecent } = useQuery({
    queryKey: ['advocates', 'recent'],
    queryFn: () => advocateDiscovery.recent(5),
  });

  const { data: recommendedData, isLoading: loadingRecommended } = useQuery({
    queryKey: ['advocates', 'recommended'],
    queryFn: () => advocateDiscovery.recommended(5),
  });

  const { data: practiceAreasData } = useQuery({
    queryKey: ['practice-areas'],
    queryFn: () => advocateDiscovery.practiceAreas(),
  });

  const { data: searchData, isLoading: loadingSearch, isFetching: isFetchingSearch } = useQuery({
    queryKey: ['advocates', 'search', debouncedSearch, location, verifiedOnly, selectedPracticeArea, sortBy, page],
    queryFn: () => advocateDiscovery.search({
      page,
      limit: 12,
      ...(debouncedSearch && { q: debouncedSearch }),
      ...(location && { location }),
      ...(verifiedOnly && { verified_only: 'true' }),
      ...(selectedPracticeArea && { practice_area: selectedPracticeArea }),
    }),
  });

  const featured = featuredData?.data || [];
  const trending = trendingData?.data || [];
  const recent = recentData?.data || [];
  const recommended = recommendedData?.data || [];
  const practiceAreas = practiceAreasData?.data || [];
  const searchResults = searchData?.data?.results || [];
  const total = searchData?.data?.total || 0;


  const isSearchActive = debouncedSearch || location || selectedPracticeArea || verifiedOnly || sortBy !== 'relevant';

  const renderCarousel = (title, subtitle, icon, data, isLoading) => {
    if (!isLoading && data.length === 0) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-16 relative"
      >
        <div className="flex flex-col mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-[0_4px_12px_rgba(15,28,46,0.04)] border border-slate-100/60">
              {icon}
            </div>
            <h2 className="text-[26px] font-black tracking-tight text-[#0F1C2E]">{title}</h2>
          </div>
          {subtitle && <p className="text-slate-500 mt-2 font-medium ml-[52px]">{subtitle}</p>}
        </div>

        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x snap-mandatory hide-scrollbar">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="w-[300px] sm:w-[340px] flex-shrink-0 snap-center">
                <Skeleton className="w-full h-[380px] rounded-[24px]" />
              </div>
            ))
          ) : (
            data.map((adv, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                key={adv.id}
                className="w-[300px] sm:w-[340px] flex-shrink-0 snap-center pb-2 pt-2"
              >
                <AdvocateCard advocate={adv} />
                {/* <DummyAdvocateCard advocate={adv} /> */}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFF] font-sans text-slate-900 relative overflow-hidden">

      {/* ── TOP NAVBAR ── */}
      <div className="w-full relative z-[60]">
        <Navbar />
      </div>

      <main className="flex-1 py-12 lg:pt-16 relative z-10">
        <SeoHead
          title="Find Top Advocates | Draftmate Legal Marketplace"
          description="Discover and consult with verified top-rated legal professionals across various practice areas."
        />

        {/* ── ATMOSPHERIC BACKGROUND OBJECTS ── */}
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-blue-400/10 rounded-full mix-blend-multiply filter blur-[120px] opacity-70 pointer-events-none" />
        <div className="absolute top-[10%] right-[-5%] w-[600px] h-[600px] bg-cyan-300/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">

          {/* ── PREMIUM HERO SECTION ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto pt-16 lg:pt-24 pb-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-blue-100 text-blue-700 text-[11px] font-bold mb-8 shadow-sm uppercase tracking-widest"
            >
              <ShieldCheck className="w-4 h-4 text-blue-500" /> India's Elite Legal Network
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black tracking-tight mb-6 text-[#0F1C2E] leading-[1.1] pb-2">
              Find the Right <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Legal Expert</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 mb-14 leading-relaxed max-w-2xl mx-auto font-medium">
              Connect directly with verified, top-rated advocates across India for consultations, drafting, and representation.
            </p>

            {/* Glassmorphic Animated Search Bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white/90 backdrop-blur-xl p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-[0_12px_40px_rgba(15,28,46,0.06)] flex items-center max-w-4xl mx-auto relative group hover:shadow-[0_16px_50px_rgba(37,99,235,0.12)] hover:border-blue-200 transition-all duration-300 z-20"
            >
              <div className="pl-5 pr-3">
                <Search className="w-6 h-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by name, city, practice area, or Advocate ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-1 pr-4 py-4 bg-transparent focus:outline-none text-[#0F1C2E] text-lg placeholder:text-slate-400 font-medium"
              />

              <div className="hidden sm:flex items-center gap-2 pr-2">
                {isFetchingSearch && (
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mr-3"></div>
                )}
              </div>
              <Button className="hidden sm:flex h-[52px] px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-base font-bold shadow-md shadow-blue-600/20 border-0">
                Search <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-slate-500 relative z-10"
            >
              <span className="font-bold text-slate-400 text-xs uppercase tracking-widest mr-2">Popular:</span>
              {['Criminal Law', 'Corporate', 'Family Law', 'Cyber Security', 'Property'].map(term => (
                <button
                  key={term}
                  onClick={() => { setSearchQuery(term); setPage(1); }}
                  className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200/80 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/50 transition-all shadow-sm font-bold text-[13px] text-slate-600 hover:-translate-y-0.5"
                >
                  {term}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* ── BROWSE BY SPECIALIZATION ── */}
          <AnimatePresence>
            {!isSearchActive && (
              <motion.div
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, height: 0 }}
                variants={staggerContainer}
                className="mb-16 lg:mb-24"
              >
                <div className="flex flex-col mb-10 items-center text-center">
                  <h2 className="text-3xl font-black tracking-tight text-[#0F1C2E]">Explore by Practice Area</h2>
                  <p className="text-slate-500 font-medium mt-3 text-lg">Find highly specialized experts tailored for your specific legal needs.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                  {SPECIALIZATIONS.map((spec, idx) => (
                    <motion.div
                      variants={fadeUpItem}
                      key={idx}
                      onClick={() => { setSelectedPracticeArea(spec.name); setPage(1); }}
                      className={`bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(15,28,46,0.03)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] ${spec.border} hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 cursor-pointer flex flex-col items-center text-center group relative overflow-hidden`}
                    >
                      {/* Background Soft Glow on Hover */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${spec.glow} pointer-events-none`} />

                      <div className={`w-16 h-16 rounded-[20px] ${spec.bg} flex items-center justify-center mb-5 group-hover:-translate-y-2 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500 relative z-10`}>
                        <spec.icon className={`w-8 h-8 ${spec.color}`} />
                      </div>
                      <span className="text-[16px] font-black text-[#0F1C2E] leading-tight mb-1.5 group-hover:text-blue-600 transition-colors relative z-10">{spec.name}</span>
                      <span className="text-[13px] font-bold text-slate-400 relative z-10">{24 + idx * 5} Advocates</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DYNAMIC CAROUSELS (Hidden if searching) ── */}
          <AnimatePresence>
            {!isSearchActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="pb-10 mb-12"
              >
                <div className="mb-12">
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> FEATURED ADVOCATES
                  </h2>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight text-[#0F1C2E]">Top-Rated Legal Experts</h3>
                  <p className="text-slate-500 font-medium mt-3 text-lg">Handpicked advocates with verified credentials and proven track records.</p>
                </div>
                {renderCarousel("Trending This Week", "Advocates receiving the most consultation requests right now.", <Star className="w-6 h-6 text-blue-500" />, trending, loadingTrending)}
                {renderCarousel("Top Rated Lawyers", "Consistently highly-reviewed by verified clients across the platform.", <Award className="w-6 h-6 text-amber-500" />, featured, loadingFeatured)}
                {renderCarousel("Fastest Response", "Professionals who typically respond to inquiries in under 2 hours.", <Clock className="w-6 h-6 text-emerald-500" />, recommended, loadingRecommended)}
                {renderCarousel("Recently Verified", "New top-tier legal talent that has passed our strict vetting process.", <ShieldCheck className="w-6 h-6 text-purple-500" />, recent, loadingRecent)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DISCOVERY LAYOUT (Sidebar + Grid) ── */}
          <div className="flex flex-col lg:flex-row gap-8 pb-20 relative z-10">

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex items-center justify-between bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 sticky top-[72px] z-40">
              <span className="font-bold text-[#0F1C2E] flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" /> Filters & Sort
              </span>
              <Button className="bg-[#0F1C2E] hover:bg-blue-900 text-white rounded-xl" size="sm" onClick={() => setIsMobileFilterOpen(true)}>
                Filters
              </Button>
            </div>

            {/* Mobile Overlay Background */}
            <AnimatePresence>
              {isMobileFilterOpen && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"
                  onClick={() => setIsMobileFilterOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* ── PREMIUM FILTER SIDEBAR ── */}
            <div className={`
            fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 transform lg:static lg:w-[300px] xl:w-[320px] lg:flex-shrink-0 lg:transform-none lg:shadow-none lg:bg-transparent lg:z-10
            ${isMobileFilterOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
              <div className="h-full overflow-y-auto lg:h-auto lg:overflow-visible bg-white lg:p-7 p-6 rounded-none lg:rounded-[24px] lg:shadow-[0_8px_30px_rgba(15,28,46,0.04)] lg:border lg:border-slate-200/80 lg:sticky lg:top-28 custom-scrollbar">

                <div className="flex items-center justify-between font-black text-[#0F1C2E] border-b border-slate-100 pb-5 mb-6 text-xl">
                  <div className="flex items-center gap-2.5"><Filter className="w-5 h-5 text-blue-600" /> Directory Filters</div>
                  <button className="lg:hidden p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600" onClick={() => setIsMobileFilterOpen(false)}><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-7">
                  {/* Sort By */}
                  <div>
                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Sort Results</label>
                    <div className="relative">
                      <select
                        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-semibold text-slate-700 transition-all cursor-pointer appearance-none"
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                      >
                        <option value="relevant">Most Relevant</option>
                        <option value="verified">Verified First</option>
                        <option value="experienced">Most Experienced</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-4 top-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Location</label>
                    <div className="relative group">
                      <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        placeholder="e.g. New Delhi"
                        className="pl-11 h-12 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl font-semibold text-[14.5px] text-slate-700 transition-all"
                        value={location}
                        onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                      />
                    </div>
                  </div>

                  {/* Practice Areas */}
                  <div>
                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Specialization</label>
                    <div className="relative">
                      <select
                        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-semibold text-slate-700 transition-all cursor-pointer appearance-none"
                        value={selectedPracticeArea}
                        onChange={(e) => { setSelectedPracticeArea(e.target.value); setPage(1); }}
                      >
                        <option value="">All Practice Areas</option>
                        {practiceAreas.map(pa => (
                          <option key={pa.id} value={pa.name}>{pa.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-4 top-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Experience</label>
                    <div className="relative">
                      <select className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-semibold text-slate-700 transition-all cursor-pointer appearance-none">
                        <option value="">Any Experience</option>
                        <option value="0-5">0-5 Years</option>
                        <option value="5-10">5-10 Years</option>
                        <option value="10-20">10-20 Years</option>
                        <option value="20+">20+ Years (Senior Counsel)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-4 top-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Languages</label>
                    <div className="relative">
                      <select className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-semibold text-slate-700 transition-all cursor-pointer appearance-none">
                        <option value="">All Languages</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Gujarati">Gujarati</option>
                        <option value="Tamil">Tamil</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-4 top-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Verified Toggle */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="flex items-center justify-between cursor-pointer group bg-blue-50/40 p-4 rounded-xl border border-blue-100/50 hover:bg-blue-50 hover:border-blue-200 transition-all">
                      <span className="text-[14.5px] font-bold text-slate-700 flex items-center gap-2.5 group-hover:text-blue-800 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        Verified Only
                      </span>
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={verifiedOnly}
                          onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Reset Filters */}
                {isSearchActive && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold h-12 rounded-xl border border-transparent hover:border-red-100 transition-all"
                      onClick={() => {
                        setSearchQuery(''); setLocation(''); setVerifiedOnly(false); setSelectedPracticeArea(''); setSortBy('relevant'); setPage(1);
                        setIsMobileFilterOpen(false);
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}

                {/* Mobile apply button */}
                <div className="mt-6 lg:hidden">
                  <Button className="w-full h-14 bg-[#0F1C2E] hover:bg-blue-700 transition-colors text-white rounded-xl font-bold text-lg shadow-lg shadow-[#0F1C2E]/20" onClick={() => setIsMobileFilterOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* ── MAIN CONTENT GRID ── */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col mb-8 gap-5 border-b border-slate-200/60 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-black tracking-tight text-[#0F1C2E]">
                    {isSearchActive ? 'Search Results' : 'Explore All Advocates'}
                  </h2>
                  <span className="text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(15,28,46,0.03)] inline-flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    {loadingSearch ? '...' : total} {total === 1 ? 'expert' : 'experts'} found
                  </span>
                </div>

                {/* Active Filter Chips */}
                {isSearchActive && (
                  <div className="flex flex-wrap items-center gap-2.5 mt-1">
                    {location && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white shadow-sm text-slate-700 text-[13px] font-bold border border-slate-200">
                        {location}
                        <button onClick={() => { setLocation(''); setPage(1); }} className="hover:bg-slate-100 text-slate-400 hover:text-rose-500 rounded-full p-0.5 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </span>
                    )}
                    {selectedPracticeArea && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white shadow-sm text-slate-700 text-[13px] font-bold border border-slate-200">
                        {selectedPracticeArea}
                        <button onClick={() => { setSelectedPracticeArea(''); setPage(1); }} className="hover:bg-slate-100 text-slate-400 hover:text-rose-500 rounded-full p-0.5 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </span>
                    )}
                    {verifiedOnly && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-green-50 shadow-sm text-green-700 text-[13px] font-bold border border-green-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        <button onClick={() => { setVerifiedOnly(false); setPage(1); }} className="hover:bg-green-100 text-green-600 hover:text-green-800 rounded-full p-0.5 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </span>
                    )}
                    <button
                      onClick={() => { setSearchQuery(''); setLocation(''); setVerifiedOnly(false); setSelectedPracticeArea(''); setSortBy('relevant'); setPage(1); }}
                      className="text-[13px] font-bold text-slate-400 hover:text-rose-600 ml-1 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {loadingSearch ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="w-full h-[380px] rounded-[24px] shadow-sm bg-white border border-slate-100" />
                  ))}
                </div>
              ) : searchResults.length === 0 && isSearchActive ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(15,28,46,0.03)] border border-slate-100 p-16 text-center"
                >
                  <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-[#0F1C2E] mb-3">No advocates found</h3>
                  <p className="text-slate-500 font-medium max-w-md mx-auto text-[15px] leading-relaxed">
                    We couldn't find any experts matching your exact filters. Try adjusting your search terms or clearing some filters to see more results.
                  </p>
                  <Button
                    className="mt-8 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F1C2E] h-12 px-8 rounded-xl font-bold transition-all shadow-sm"
                    onClick={() => {
                      setSearchQuery(''); setLocation(''); setVerifiedOnly(false); setSelectedPracticeArea(''); setSortBy('relevant'); setPage(1);
                    }}
                  >
                    Clear All Filters
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {searchResults.map((adv) => (
                      <motion.div variants={fadeUpItem} key={adv.id}>
                        <AdvocateCard advocate={adv} />
                        {/* <DummyAdvocateCard advocate={adv} /> */}
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Pagination */}
                  {total > 12 && (
                    <div className="flex justify-center items-center mt-14 gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 inline-flex mx-auto">
                      <Button
                        variant="ghost"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-11 px-6 rounded-xl font-bold hover:bg-slate-100 text-slate-600 disabled:opacity-50"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center justify-center min-w-[100px] font-bold text-[#0F1C2E]">
                        Page {page}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * 12 >= total}
                        className="h-11 px-6 rounded-xl font-bold hover:bg-slate-100 text-slate-600 disabled:opacity-50"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <div className="w-full relative z-20 mt-auto">
        <Footer />
      </div>

    </div>
  );
}
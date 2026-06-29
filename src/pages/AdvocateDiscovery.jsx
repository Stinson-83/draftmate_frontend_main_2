import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, MapPin, CheckCircle, Award, Briefcase, ChevronDown, SlidersHorizontal, Star, Scale, Building2, Users, Laptop, Calculator, Home, Globe, ShoppingBag, Gavel, Rocket, Fingerprint, Command, ShieldCheck, X, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import AdvocateCard from '../components/Advocate/AdvocateCard';
import SeoHead from '../components/Advocate/SeoHead';
import { advocateDiscovery } from '../services/advocateApi';

// Inlined useDebounce for safety
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
  { name: 'Criminal Law', icon: Scale, color: 'text-rose-500', bg: 'bg-rose-50' },
  { name: 'Corporate Law', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' },
  { name: 'Family Law', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  { name: 'Cyber Law', icon: Laptop, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { name: 'Tax Law', icon: Calculator, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { name: 'Property Law', icon: Home, color: 'text-amber-500', bg: 'bg-amber-50' },
  { name: 'Immigration Law', icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { name: 'Consumer Rights Law', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50' },
  { name: 'Civil Law', icon: Gavel, color: 'text-slate-500', bg: 'bg-slate-100' },
  { name: 'Startup & Business Law', icon: Rocket, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
];

export default function AdvocateDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounceValue(searchQuery, 500);
  
  const [location, setLocation] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedPracticeArea, setSelectedPracticeArea] = useState('');
  const [sortBy, setSortBy] = useState('relevant');
  const [page, setPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Queries — all routed through advocateDiscovery API client (correct /advocate-api/ base)
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14 relative"
      >
        <div className="flex flex-col mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
              {icon}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
          </div>
          {subtitle && <p className="text-slate-500 mt-2 font-medium ml-14">{subtitle}</p>}
        </div>
        
        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x snap-mandatory hide-scrollbar">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="w-[300px] sm:w-[340px] flex-shrink-0 snap-center">
                <Skeleton className="w-full h-[380px] rounded-[20px]" />
              </div>
            ))
          ) : (
            data.map((adv, i) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={adv.id} 
                className="w-[300px] sm:w-[340px] flex-shrink-0 snap-center pb-2 pt-2"
              >
                <AdvocateCard advocate={adv} />
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 mt-16 font-sans text-slate-900">
      <SeoHead 
        title="Find Top Advocates | Draftmate Legal Marketplace"
        description="Discover and consult with verified top-rated legal professionals across various practice areas."
      />
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Premium Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-5xl mx-auto pt-12 lg:pt-24 pb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold mb-6 shadow-sm uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> INDIA'S LEGAL EXPERT NETWORK
          </div>
          <h1 className="animate-on-scroll visible text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 text-slate-900 leading-[1.1] pb-2" style={{ animation: 'fadeUp 600ms ease-out backwards' }}>
            Find the Right Legal Expert
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto font-medium">
            Connect with verified advocates across India
          </p>
          
          {/* Animated Search Bar */}
          <div className="animate-on-scroll visible bg-white p-2 sm:p-3 rounded-xl border-1.5 border-[#E5E7EB] flex items-center max-w-4xl mx-auto relative group focus-within:border-[#2563EB] focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] transition-all duration-300 z-20 h-[56px] sm:h-auto" style={{ animation: 'fadeUp 700ms ease-out backwards', animationDelay: '100ms' }}>
            <div className="pl-4 pr-3 sm:pr-2">
              <Search className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by name, city, practice area, Advocate ID, or Bar Council No..."
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}}
              className="w-full pl-1 pr-4 py-4 sm:py-5 bg-transparent focus:outline-none text-slate-900 text-lg sm:text-xl placeholder:text-slate-400 font-medium"
            />
            
            <div className="hidden sm:flex items-center gap-2 pr-4">
              {isFetchingSearch && (
                <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mr-2"></div>
              )}
            </div>
            <Button className="hidden sm:flex h-14 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-lg font-bold">
              Search
            </Button>
          </div>
          
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-slate-500 relative z-10">
            <span className="font-bold text-slate-900">Quick Search:</span> 
            {['Criminal Law', 'Corporate Law', 'Family Law', 'Cyber Law', 'Property Law', 'Tax Law'].map(term => (
              <button 
                key={term}
                onClick={() => { setSearchQuery(term); setPage(1); }}
                className="px-4 py-2 rounded-full bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors shadow-sm font-bold"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Hero Statistics */}
          <div className="mt-16 flex items-center justify-center gap-6 max-w-4xl mx-auto border-t border-slate-200/60 pt-12 relative z-10 font-bold text-slate-700">
            <span className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> 5,000+ Advocates</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-600" /> 98% Verified</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
            <span className="flex items-center gap-2"><Globe className="w-5 h-5 text-indigo-600" /> 212+ Publishers</span>
          </div>
        </motion.div>

        {/* Browse by Specialization */}
        <AnimatePresence>
          {!isSearchActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="mb-14 lg:mb-20"
            >
              <div className="flex flex-col mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Explore by Practice Area</h2>
                <p className="text-slate-500 font-medium mt-2">Find specialized experts for your specific legal needs.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
                {SPECIALIZATIONS.map((spec, idx) => (
                  <div 
                    key={idx}
                    onClick={() => { setSelectedPracticeArea(spec.name); setPage(1); }}
                    className="bg-white p-5 rounded-xl border border-[#E5E7EB] hover:bg-[#EFF6FF] hover:border-[#2563EB] hover:-translate-y-[2px] transition-all duration-150 cursor-pointer flex flex-col group relative overflow-hidden"
                  >
                    <spec.icon className="w-8 h-8 text-[#2563EB] mb-3 group-hover:scale-110 transition-transform duration-150" />
                    <span className="text-[15px] font-bold text-slate-900 leading-tight mb-1">{spec.name}</span>
                    <span className="text-[12px] font-semibold text-slate-500">{24 + idx * 5} Advocates</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Section (Hidden if searching) */}
        <AnimatePresence>
          {!isSearchActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="pb-10 border-b border-slate-200/60 mb-12"
            >
              <div className="mb-8">
                 <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">FEATURED ADVOCATES</h2>
                 <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">Top-Rated Legal Experts</h3>
                 <p className="text-slate-500 font-medium mt-2">Handpicked advocates with proven track records</p>
              </div>
              {renderCarousel("Trending This Week", "Advocates receiving the most consultation requests right now.", <Star className="w-6 h-6 text-blue-500" />, trending, loadingTrending)}
              {renderCarousel("Top Rated Lawyers", "Consistently highly-reviewed by verified clients across the platform.", <Award className="w-6 h-6 text-amber-500" />, featured, loadingFeatured)}
              {renderCarousel("Fastest Response", "Professionals who typically respond to inquiries in under 2 hours.", <Clock className="w-6 h-6 text-emerald-500" />, recommended, loadingRecommended)}
              {renderCarousel("Recently Verified", "New top-tier legal talent that has passed our strict vetting process.", <ShieldCheck className="w-6 h-6 text-purple-500" />, recent, loadingRecent)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discovery Layout: Sidebar + Grid */}
        <div className="flex flex-col lg:flex-row gap-8 pb-20 relative">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-200 mb-6 sticky top-[72px] z-40">
            <span className="font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-600" /> Filters & Sort
            </span>
            <Button className="bg-slate-900 text-white rounded-xl" size="sm" onClick={() => setIsMobileFilterOpen(true)}>
              Filters
            </Button>
          </div>

          {/* Mobile Overlay Background */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setIsMobileFilterOpen(false)} />
          )}

          {/* Enterprise-Grade Filter Sidebar */}
          <div className={`
            fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 transform lg:static lg:w-[320px] lg:flex-shrink-0 lg:transform-none lg:shadow-none lg:bg-transparent lg:z-10
            ${isMobileFilterOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            <div className="h-full overflow-y-auto lg:h-auto lg:overflow-visible bg-white lg:p-7 p-6 rounded-none lg:rounded-3xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:border lg:border-slate-200 lg:sticky lg:top-28 custom-scrollbar">
              
              <div className="flex items-center justify-between font-extrabold text-slate-900 border-b border-slate-100 pb-5 mb-6 text-xl">
                <div className="flex items-center gap-2"><Filter className="w-5 h-5 text-blue-600" /> Filter Directory</div>
                <button className="lg:hidden p-2 text-slate-400 hover:text-slate-600" onClick={() => setIsMobileFilterOpen(false)}><X className="w-6 h-6"/></button>
              </div>
              
              <div className="space-y-8">
                {/* Sort By */}
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-3 block">Sort Results</label>
                  <div className="relative">
                    <select 
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-colors cursor-pointer appearance-none"
                      value={sortBy}
                      onChange={(e) => {setSortBy(e.target.value); setPage(1);}}
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
                  <label className="text-sm font-bold text-slate-900 mb-3 block">City / Court Location</label>
                  <div className="relative group">
                    <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input 
                      placeholder="e.g. New Delhi" 
                      className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white rounded-xl font-medium transition-all text-base"
                      value={location}
                      onChange={(e) => {setLocation(e.target.value); setPage(1);}}
                    />
                  </div>
                </div>

                {/* Practice Areas */}
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-3 block">
                    Specialization
                  </label>
                  <div className="relative">
                    <select 
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-colors cursor-pointer appearance-none"
                      value={selectedPracticeArea}
                      onChange={(e) => {setSelectedPracticeArea(e.target.value); setPage(1);}}
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
                  <label className="text-sm font-bold text-slate-900 mb-3 block">
                    Experience Level
                  </label>
                  <div className="relative">
                    <select className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-colors cursor-pointer appearance-none">
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
                  <label className="text-sm font-bold text-slate-900 mb-3 block">
                    Languages Spoken
                  </label>
                  <div className="relative">
                    <select className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-colors cursor-pointer appearance-none">
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

                {/* Court Affiliation */}
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-3 block">
                    Court Affiliation
                  </label>
                  <div className="relative">
                    <select className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-colors cursor-pointer appearance-none">
                      <option value="">All Courts</option>
                      <option value="Supreme">Supreme Court of India</option>
                      <option value="High">High Court</option>
                      <option value="District">District Court</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Verified Filter */}
                <div className="pt-6 border-t border-slate-100">
                  <label className="flex items-center justify-between cursor-pointer group bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 hover:bg-blue-50 transition-colors">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2 group-hover:text-slate-900 transition-colors">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      Verified Only
                    </span>
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        className="peer sr-only"
                        checked={verifiedOnly}
                        onChange={(e) => {setVerifiedOnly(e.target.checked); setPage(1);}}
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
                    className="w-full text-slate-600 hover:text-red-600 hover:bg-red-50 font-bold h-12 rounded-xl border border-slate-200 hover:border-red-200 transition-all"
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
                <Button className="w-full h-12 bg-slate-900 hover:bg-blue-600 transition-colors text-white rounded-xl font-bold" onClick={() => setIsMobileFilterOpen(false)}>
                  Show Results
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col mb-8 gap-4 border-b border-slate-200/60 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {isSearchActive ? 'Search Results' : 'Explore Advocates'}
                </h2>
                <span className="text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm inline-flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  {loadingSearch ? '...' : total} {total === 1 ? 'expert' : 'experts'} found
                </span>
              </div>
              {/* Active Filter Chips */}
              {isSearchActive && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {location && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                      {location} <button onClick={() => { setLocation(''); setPage(1); }} className="hover:bg-blue-200 rounded-full p-0.5"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  )}
                  {selectedPracticeArea && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                      {selectedPracticeArea} <button onClick={() => { setSelectedPracticeArea(''); setPage(1); }} className="hover:bg-blue-200 rounded-full p-0.5"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  )}
                  {verifiedOnly && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-bold border border-green-100">
                      Verified <button onClick={() => { setVerifiedOnly(false); setPage(1); }} className="hover:bg-green-200 rounded-full p-0.5"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  )}
                  <button 
                    onClick={() => { setSearchQuery(''); setLocation(''); setVerifiedOnly(false); setSelectedPracticeArea(''); setSortBy('relevant'); setPage(1); }}
                    className="text-sm font-bold text-slate-500 hover:text-slate-900 ml-2 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {loadingSearch ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <Skeleton key={i} className="w-full h-[380px] rounded-[20px] shadow-sm" />
                ))}
              </div>
            ) : searchResults.length === 0 && isSearchActive ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No advocates found</h3>
                <p className="text-slate-500 font-medium max-w-md mx-auto">
                  We couldn't find any advocates matching your current filters. Try broadening your search or clearing some filters.
                </p>
                <Button 
                  className="mt-8 bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl"
                  onClick={() => {
                    setSearchQuery(''); setLocation(''); setVerifiedOnly(false); setSelectedPracticeArea(''); setSortBy('relevant'); setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {searchResults.map((adv, index) => (
                    <motion.div
                      key={adv.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    >
                      <AdvocateCard advocate={adv} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {total > 12 && (
                  <div className="flex justify-center mt-12 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-11 px-6 rounded-xl font-semibold"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center px-4 font-medium text-slate-600">
                      Page {page}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * 12 >= total}
                      className="h-11 px-6 rounded-xl font-semibold"
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
    </div>
  );
}

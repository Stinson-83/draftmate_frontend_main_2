import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { API_CONFIG } from '../services/endpoints';
import { 
  Search, Bell, LayoutDashboard, FileText, Scale, FolderOpen, 
  Languages, Library, GraduationCap, Eye, Gavel, Wrench, 
  Settings, Menu, X, Zap, ChevronLeft, ChevronRight, LogOut,
  CreditCard, HelpCircle, BookOpen, MessageSquare, Gift, Bug, Copy, Share2, UploadCloud
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/home" },
  { icon: Scale, label: "Legal Research", path: "/dashboard/research" },
  { icon: FolderOpen, label: "Document Management", path: "/dashboard/cases" },
  { icon: FileText, label: "My Drafts", path: "/dashboard/drafts" },
  { icon: Languages, label: "Translations", path: "/dashboard/translate" },
  { icon: Library, label: "Legal Library", path: "/dashboard/library" },
  { icon: GraduationCap, label: "Student Mode", path: "/dashboard/academy" },
  { icon: Eye, label: "Visibility & Reach", path: "/dashboard/profile" },
  { icon: Gavel, label: "E-Court Services", path: "/dashboard/ecourt" },
  { icon: Wrench, label: "Tools", path: "/dashboard/tools" },
];

const UTILITY_ITEMS = [
  { icon: HelpCircle, label: "Help & Support", path: "/dashboard/help" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  { icon: CreditCard, label: "Billing & Plans", path: "/dashboard/billing" },
];

export default function MainLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Modal States
  const [isReferOpen, setIsReferOpen] = useState(false);
  const [isBugOpen, setIsBugOpen] = useState(false);

  const [userProfile, setUserProfile] = useState({
      firstName: 'Devendra',
      lastName: 'Gupta',
      workplace: 'DraftMate Legal'
  });

  useEffect(() => {
      const loadProfile = () => {
          const saved = localStorage.getItem('user_profile');
          if (saved) {
              const parsed = JSON.parse(saved);
              setUserProfile(prev => ({ ...prev, ...parsed }));
          }
      };
      loadProfile(); // Initial load
      window.addEventListener('user_profile_updated', loadProfile);
      return () => window.removeEventListener('user_profile_updated', loadProfile);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('session_id');
    try {
        if (sessionId) {
            const logoutUrl = `${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.LOGOUT}`;
            await fetch(logoutUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId })
            });
        }
    } catch (error) {
        console.error('Logout failed:', error);
    } finally {
        toast.success('Logged out successfully');
        navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFF] overflow-hidden font-sans">
      
      {/* ── DESKTOP SIDEBAR ── */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="hidden lg:flex flex-col bg-white border-r border-slate-200/60 z-20 relative shadow-[4px_0_24px_rgba(15,28,46,0.02)] transition-all duration-300"
      >
        <div className="h-[70px] flex items-center justify-center px-4 border-b border-slate-100">
          <Link to="/dashboard/home" className="flex items-center gap-2 group w-full overflow-hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(37,99,235,0.08)" }}>
              <img src="/logo.png" alt="DraftMate" className="w-6 h-6 object-contain" />
            </div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.img 
                  initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 130 }} exit={{ opacity: 0, width: 0 }}
                  src="/text-removebg-preview.png" alt="DraftMate" className="h-8 object-contain mix-blend-multiply" 
                />
              )}
            </AnimatePresence>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-hide">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link key={item.label} to={item.path} className="block">
                <motion.div 
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isActive ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-500 hover:bg-blue-50 hover:text-blue-600 font-medium"
                  }`}
                >
                  {isActive && <motion.div layoutId="activeNav" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />}
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500 transition-colors"}`} />
                  {isSidebarOpen && <span className="text-[13px] whitespace-nowrap">{item.label}</span>}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Footer Utilities */}
        <div className="p-3 border-t border-slate-100 max-h-[220px] overflow-y-auto scrollbar-hide space-y-1">
          {UTILITY_ITEMS.map((item) => {
             const isActive = location.pathname.includes(item.path);
             return (
               <Link key={item.label} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}>
                 <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
                 {isSidebarOpen && <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>}
               </Link>
             );
          })}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors group mt-2 border border-transparent hover:border-red-100">
            <LogOut className="w-4 h-4 shrink-0 text-red-400 group-hover:text-red-500" />
            {isSidebarOpen && <span className="text-xs font-semibold">Logout</span>}
          </button>
        </div>

        {/* User Profile in Sidebar with Plan Indicator */}
        <div onClick={() => navigate('/dashboard/settings')} className="p-4 border-t border-slate-100 bg-slate-50/50 hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-3 overflow-hidden group">
           <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-9 h-9 rounded-full shadow-sm shrink-0 border border-slate-200 group-hover:border-blue-300 transition-colors" />
           <AnimatePresence>
             {isSidebarOpen && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col overflow-hidden">
                 <span className="text-sm font-bold text-[#0F1C2E] truncate group-hover:text-blue-700 transition-colors">
                     {userProfile.firstName} {userProfile.lastName}
                 </span>
                 <span className="text-[10px] font-medium text-slate-500 truncate mb-1.5">
                     {userProfile.workplace || 'DraftMate Legal'}
                 </span>
                 <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-max">Pro Plan</span>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 shadow-sm z-50 transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </motion.aside>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" />
            <motion.aside 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 shadow-2xl flex flex-col lg:hidden"
            >
              <div className="h-[70px] flex items-center justify-between px-6 border-b border-slate-100">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <img src="/logo.png" alt="DraftMate" className="w-6 h-6 object-contain" />
                    </div>
                    <img src="/text-removebg-preview.png" alt="DraftMate" className="h-8 object-contain mix-blend-multiply" />
                 </div>
                 <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {SIDEBAR_ITEMS.map((item) => (
                  <Link key={item.label} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium">
                    <item.icon className="w-5 h-5" /> <span className="text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* ── TOP NAVBAR ── */}
        <header className={`absolute top-0 inset-x-0 z-30 transition-all duration-300 px-4 md:px-8 py-4 ${scrolled ? 'transform -translate-y-full' : 'translate-y-0'}`}>
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full h-14 flex items-center justify-between px-4 pl-6">
            
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-500 hover:text-[#0F1C2E]"><Menu className="w-5 h-5" /></button>
              
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-100/50 hover:bg-slate-100 transition-colors border border-slate-200/60 rounded-full flex-1 max-w-lg group focus-within:bg-white focus-within:border-blue-400 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.1)]">
                 <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                 <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-[13px] font-medium text-[#0F1C2E] w-full placeholder:text-slate-400" />
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <kbd className="px-2 py-1 rounded-md bg-slate-200/80 border border-slate-300/50 font-mono text-slate-500">CMD+K</kbd>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
               
               {/* New Dynamic Credits Meter with Tooltip */}
               <div className="relative group hidden md:flex items-center gap-3 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-all cursor-default">
                   <div className="flex flex-col w-32">
                       <div className="flex justify-between items-end mb-1 w-full">
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Credits</span>
                           <span className="text-xs font-black text-[#0F1C2E]">1,250 <span className="text-slate-400 font-medium text-[9px]">/ 5,000</span></span>
                       </div>
                       <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div className="bg-blue-600 h-full rounded-full" style={{ width: '25%' }} />
                       </div>
                   </div>
                   <button onClick={() => navigate('/dashboard/billing')} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                       Top Up
                   </button>

                   {/* Premium Tooltip */}
                   <div className="absolute top-full right-0 mt-3 w-64 bg-[#0F1C2E] text-white rounded-[16px] p-4 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform translate-y-2 group-hover:translate-y-0">
                       <div className="absolute -top-2 right-12 w-4 h-4 bg-[#0F1C2E] rotate-45" />
                       <div className="relative z-10">
                           <div className="flex justify-between items-center text-xs font-bold mb-2">
                               <span className="text-slate-400">Available Credits:</span>
                               <span className="text-white">1,250</span>
                           </div>
                           <div className="flex justify-between items-center text-xs font-bold mb-4 pb-3 border-b border-white/10">
                               <span className="text-slate-400">Monthly Limit:</span>
                               <span className="text-white">5,000</span>
                           </div>
                           <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Credits consumed when:</p>
                           <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                               <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500"/> Drafting Documents</li>
                               <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500"/> Legal Research</li>
                               <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500"/> AI Analysis</li>
                               <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500"/> Translation</li>
                           </ul>
                       </div>
                   </div>
               </div>

               {/* Refer & Earn Button */}
               <button onClick={() => setIsReferOpen(true)} className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50">
                 <Gift className="w-4 h-4" />
               </button>

               {/* Bug Report Button */}
               <button onClick={() => setIsBugOpen(true)} className="p-2.5 text-slate-400 hover:text-rose-600 transition-colors rounded-full hover:bg-rose-50 mr-1">
                 <Bug className="w-4 h-4" />
               </button>

               {/* Notifications */}
               <button className="relative p-2.5 text-slate-400 hover:text-[#0F1C2E] transition-colors rounded-full hover:bg-slate-100 border border-slate-200 bg-white shadow-sm">
                 <Bell onClick={() => navigate('/dashboard/notifications')} className="w-4 h-4" />
                 <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
               </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pt-24 pb-12 px-4 md:px-8 custom-scrollbar">
          <Outlet />
        </main>

        {/* ── REFER & EARN MODAL ── */}
        <AnimatePresence>
            {isReferOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-2xl border border-slate-200 relative">
                        <button onClick={() => setIsReferOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
                        
                        <div className="text-center mb-6 pt-4">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
                                <Gift className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-[#0F1C2E]">Refer & Earn</h2>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Invite colleagues to DraftMate and you both earn AI credits!</p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 border-dashed mb-6 text-center">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Your Referral Code</p>
                            <div className="flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg max-w-[200px] mx-auto shadow-sm">
                                <span className="font-black text-blue-600 text-lg tracking-wider">DRAFTMATE50</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <button className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"><Copy className="w-3.5 h-3.5" /> Copy</button>
                                <button className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F1C2E] px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors shadow-sm"><Share2 className="w-3.5 h-3.5" /> Share</button>
                            </div>
                        </div>

                        <div className="space-y-1.5 mb-6">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Have a friend's code?</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Enter referral code" className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-medium" />
                                <button className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors">Apply</button>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-8 border-t border-slate-100 pt-6">
                            <div className="text-center">
                                <div className="text-xl font-black text-emerald-600">+100</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase">You Earn</div>
                            </div>
                            <div className="w-px h-8 bg-slate-200" />
                            <div className="text-center">
                                <div className="text-xl font-black text-emerald-600">+100</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase">Friend Earns</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* ── BUG REPORT MODAL ── */}
        <AnimatePresence>
            {isBugOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-2xl border border-slate-200 relative">
                        <button onClick={() => setIsBugOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
                        
                        <div className="mb-6 pt-2">
                            <h2 className="text-xl font-black text-[#0F1C2E] flex items-center gap-2"><Bug className="w-5 h-5 text-rose-500" /> Send Feedback</h2>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Help us improve your workspace.</p>
                        </div>

                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsBugOpen(false); toast.success("Feedback sent!"); }}>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Feedback Type</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-700">
                                    <option value="bug">🐛 Bug Report</option>
                                    <option value="feature">✨ Feature Request</option>
                                    <option value="general">💬 General Feedback</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Your Feedback</label>
                                <textarea placeholder="Tell us what you think..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-medium min-h-[120px] resize-y" required />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Attachment (Optional)</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-500">
                                    <UploadCloud className="w-6 h-6 mb-2 text-slate-400" />
                                    <span className="text-xs font-bold">Click to upload screenshot</span>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <button type="button" onClick={() => setIsBugOpen(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors text-sm">Send Feedback</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}
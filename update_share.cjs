const fs = require('fs');
const file = 'src/pages/AdvocateDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add ShareProfileModal import if missing
if (!content.includes('ShareProfileModal')) {
    content = content.replace(
        "import { calculateProfileCompletion } from '../utils/profileHelpers';",
        "import { calculateProfileCompletion } from '../utils/profileHelpers';\nimport ShareProfileModal from '../components/Advocate/ShareProfileModal';"
    );
}

// 2. Add state for isShareModalOpen
if (!content.includes('isShareModalOpen')) {
    content = content.replace(
        "const [isPublishing, setIsPublishing] = useState(false);",
        "const [isPublishing, setIsPublishing] = useState(false);\n    const [isShareModalOpen, setIsShareModalOpen] = useState(false);"
    );
}

// 3. Inject Share Card and ShareModal before "Professional Information"
const shareCardCode = `                        {/* Share Your Lawyer Profile */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.25 }}
                            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700/50 p-6 md:p-8 text-white relative overflow-hidden mt-6"
                        >
                            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-stretch">
                                <div className="flex-1 flex flex-col justify-center text-center md:text-left w-full">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-teal-300 border border-white/10 w-fit mb-4 mx-auto md:mx-0">
                                        <Sparkles className="w-3.5 h-3.5" /> Core Feature
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold mb-2">Share Your Lawyer Profile</h3>
                                    <p className="text-slate-300 text-sm mb-6 max-w-md mx-auto md:mx-0">
                                        {profile?.is_public 
                                            ? (completionScore === 100 ? "Your profile is complete and ready to share." : "Complete your profile to create your strongest professional presence.")
                                            : "Publish your profile to generate a public shareable link."
                                        }
                                    </p>
                                    
                                    {profile?.is_public && profile?.slug ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 overflow-hidden">
                                                <Link className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="text-sm font-medium text-slate-300 truncate select-all flex-1">
                                                    {window.location.origin}/advocate/{profile.slug}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                                                <button type="button" onClick={() => {
                                                    navigator.clipboard.writeText(\`\${window.location.origin}/advocate/\${profile.slug}\`)
                                                        .then(() => toast.success('✓ Link copied'))
                                                        .catch(() => toast.error('Failed to copy link'));
                                                }} className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 h-11 text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors focus:outline-none">
                                                    <Copy className="w-4 h-4" /> Copy Profile Link
                                                </button>
                                                
                                                <div className="flex w-full sm:w-auto gap-3 flex-1">
                                                    <a href={\`/advocate/\${profile.slug}\`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 h-11 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors">
                                                        View Profile
                                                    </a>
                                                    <button type="button" onClick={() => setIsShareModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 h-11 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors focus:outline-none shadow-lg shadow-teal-500/20">
                                                        <Share2 className="w-4 h-4" /> Share
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-start gap-3">
                                            <Globe className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                            <p className="text-sm text-slate-300 text-left">Your profile must be LIVE to share it with clients. Use the Profile Visibility control above to publish your profile.</p>
                                        </div>
                                    )}
                                </div>
                                
                                {profile?.is_public && (
                                    <div className="w-full md:w-72 shrink-0">
                                        <div className="bg-white rounded-xl shadow-2xl p-5 border border-slate-200 h-full flex flex-col relative overflow-hidden transform md:rotate-2 md:hover:rotate-0 transition-transform duration-300">
                                            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-blue-600 to-teal-500 opacity-10"></div>
                                            
                                            <div className="flex items-start gap-4 relative z-10 mb-4 text-left">
                                                {profile?.profile_image_url ? (
                                                    <img src={profile.profile_image_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm shrink-0 bg-slate-100" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm shrink-0 flex items-center justify-center text-slate-400">
                                                        <User className="w-8 h-8" />
                                                    </div>
                                                )}
                                                <div className="pt-1">
                                                    <h4 className="text-slate-900 font-bold text-sm leading-tight line-clamp-1">{authUser?.name || authUser?.firstName || profile?.title || 'Advocate'}</h4>
                                                    <p className="text-teal-600 font-semibold text-[11px] uppercase tracking-wider mb-1 line-clamp-1">{profile?.title || 'Legal Professional'}</p>
                                                    {authUser?.googleId || authUser?.is_verified ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                                            <ShieldCheck className="w-3 h-3" /> Verified
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 mb-4 flex-1 text-left">
                                                {profile?.court_affiliation && (
                                                    <div className="flex items-start gap-2 text-slate-600 text-[11px]">
                                                        <Gavel className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                        <span className="line-clamp-2">{profile.court_affiliation}</span>
                                                    </div>
                                                )}
                                                {profile?.office_address && (
                                                    <div className="flex items-start gap-2 text-slate-600 text-[11px]">
                                                        <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                        <span className="line-clamp-2">{profile.office_address}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {profile?.practice_areas && profile.practice_areas.length > 0 && (
                                                <div className="border-t border-slate-100 pt-3 mt-auto text-left">
                                                    <div className="flex flex-wrap gap-1">
                                                        {profile.practice_areas.slice(0, 3).map((pa, idx) => (
                                                            <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-600 text-[9px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                                                {pa}
                                                            </span>
                                                        ))}
                                                        {profile.practice_areas.length > 3 && (
                                                            <span className="bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                                                                +{profile.practice_areas.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>\n\n`;

const targetIndex = content.indexOf('{/* Professional Information */}');
if (targetIndex !== -1 && !content.includes('Share Your Lawyer Profile')) {
    // Find the exact "                        {/* Professional Information */}" line
    const exactTarget = '                        {/* Professional Information */}';
    const splitIndex = content.indexOf(exactTarget);
    
    if (splitIndex !== -1) {
        content = content.substring(0, splitIndex) + shareCardCode + content.substring(splitIndex);
    }
}

// 4. Inject ShareProfileModal component at the end
if (!content.includes('<ShareProfileModal')) {
    const endContentIndex = content.indexOf('        </div>\n    );');
    if (endContentIndex !== -1) {
        const modalCode = `\n            <ShareProfileModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                advocate={profile} 
            />\n`;
        content = content.substring(0, endContentIndex) + modalCode + content.substring(endContentIndex);
    } else {
        console.log("Could not find end of component to inject modal");
    }
}

fs.writeFileSync(file, content);
console.log('Phase 13.4 implemented');

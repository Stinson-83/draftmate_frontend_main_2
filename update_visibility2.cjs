const fs = require('fs');
const file = 'src/pages/AdvocateDashboard.jsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const getChunk = (startMarker, endMarker) => {
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker, startIndex);
    if (startIndex !== -1 && endIndex !== -1) {
        return { startIndex, endIndex };
    }
    return null;
};

const visibilityBlock = `                            {/* Profile Visibility */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
                                className={\`bg-white rounded-2xl shadow-sm transition-shadow border p-6 flex flex-col \${profile?.is_public ? 'border-teal-200 shadow-[0_0_15px_rgba(20,184,166,0.05)]' : 'border-slate-200/60 hover:shadow-md'}\`}
                            >
                                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                                    <div className={\`p-2 rounded-lg \${profile?.is_public ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-600'}\`}>
                                        {profile?.is_public ? <Globe className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Profile Visibility</h3>
                                        <p className="text-xs text-slate-500">Manage public access to your profile</p>
                                    </div>
                                    {/* Premium Toggle Switch */}
                                    <button type="button" disabled={isPublishing} onClick={async () => {
                                        try {
                                            setIsPublishing(true);
                                            const newStatus = !profile.is_public;
                                            await advocateProfile.updateDetails({ is_public: newStatus });
                                            setProfile(prev => ({ ...prev, is_public: newStatus }));
                                        } catch (err) {
                                            toast.error(err.message || 'Profile visibility could not be updated.');
                                        } finally {
                                            setIsPublishing(false);
                                        }
                                    }} className={\`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 \${profile?.is_public ? 'bg-teal-500' : 'bg-slate-300'} \${isPublishing ? 'opacity-70 cursor-wait' : 'cursor-pointer'}\`}>
                                        <span className={\`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 \${profile?.is_public ? 'translate-x-6' : 'translate-x-1'}\`} />
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <AnimatePresence mode="wait">
                                        {isPublishing ? (
                                            <motion.div key="publishing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-800 flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <svg className="animate-spin h-6 w-6 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    <span className="font-bold text-slate-600 text-xs tracking-wide uppercase">Updating status...</span>
                                                </div>
                                            </motion.div>
                                        ) : profile?.is_public ? (
                                            <motion.div key="live" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="bg-white border border-teal-100 shadow-sm rounded-xl p-5 text-sm h-full flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="relative flex h-3 w-3">
                                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                                                        </span>
                                                        <strong className="text-teal-700 text-sm font-extrabold tracking-wide">LIVE &bull; Profile is public</strong>
                                                    </div>
                                                    <p className="text-slate-600 mb-5 text-sm font-medium">Your profile is visible to clients in Lawyer Search.</p>
                                                </div>
                                                
                                                {profile?.slug && (
                                                    <div className="mt-auto">
                                                        <div className="flex items-center gap-3">
                                                            <a href={\`/advocate/\${profile.slug}\`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm shadow-teal-500/20">
                                                                <Globe className="w-4 h-4" /> View Public Profile
                                                            </a>
                                                            <button type="button" onClick={() => {
                                                                navigator.clipboard.writeText(\`\${window.location.origin}/advocate/\${profile.slug}\`);
                                                                toast.success('Profile link copied to clipboard!');
                                                            }} className="flex items-center justify-center gap-2 h-10 px-4 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-colors focus:outline-none">
                                                                <Share2 className="w-4 h-4" /> Share Profile
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.div key="hidden" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-5 text-sm flex flex-col justify-between h-full">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                                                        <strong className="text-slate-700 text-sm font-extrabold tracking-wide">DRAFT &bull; Profile is private</strong>
                                                    </div>
                                                    <p className="text-slate-600 text-sm font-medium mb-3">Your profile is not currently visible in Lawyer Search.</p>
                                                    {completionScore < 100 && (
                                                        <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200/50 mb-4">
                                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                            <p className="text-xs font-semibold">Complete your profile before making it live.</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-auto">
                                                    <button type="button" disabled={isPublishing} onClick={async () => {
                                                        try {
                                                            setIsPublishing(true);
                                                            await advocateProfile.updateDetails({ is_public: true });
                                                            setProfile(prev => ({ ...prev, is_public: true }));
                                                        } catch (err) {
                                                            toast.error(err.message || 'Profile could not be published.');
                                                        } finally {
                                                            setIsPublishing(false);
                                                        }
                                                    }} className="w-full flex items-center justify-center gap-2 h-10 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors">
                                                        Make Profile Live
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
`;

let chunk = getChunk('{/* Profile Visibility */}', '                        </div>\n\n                        {/* Professional Information */}');

if (chunk) {
    let newContent = content.substring(0, chunk.startIndex) + visibilityBlock + '\n' + content.substring(chunk.endIndex - '                        </div>\n\n                        {/* Professional Information */}'.length);
    fs.writeFileSync(file, newContent);
    console.log('Visibility section updated successfully');
} else {
    console.log('Could not find visibility section markers');
}

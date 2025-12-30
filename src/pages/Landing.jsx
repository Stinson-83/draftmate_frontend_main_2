import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/draftmate_logo.png';

const Landing = () => {
    useEffect(() => {
        document.title = 'DraftMate';
    }, []);

    return (
        <div className="bg-slate-50 dark:bg-[#101622] text-[#111318] font-sans overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] bg-white/95 backdrop-blur-sm px-6 py-3 lg:px-40">
                <div className="flex items-center gap-4 text-[#111318]">
                    <div className="size-8 flex items-center justify-center">
                        <img src={logo} alt="DraftMate" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-[#111318] text-xl font-bold leading-tight tracking-[-0.015em]">DraftMate</h2>
                </div>
                <div className="hidden lg:flex flex-1 justify-end gap-8">
                    <div className="flex items-center gap-9">
                        <a className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer">Features</a>
                        <a className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer">Blogs</a>
                        <a className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer">About</a>
                        <a className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer">Pricing</a>
                        <a className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer">How it Works</a>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/login" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                            <span className="truncate">Start Drafting</span>
                        </Link>
                        <Link to="/login" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#f0f2f4] text-[#111318] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#e0e2e4] transition-colors">
                            <span className="truncate">Login</span>
                        </Link>
                    </div>
                </div>
                <div className="lg:hidden">
                    <span className="material-symbols-outlined text-2xl">menu</span>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center py-16 lg:py-24 px-4 bg-white overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#135bec 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                <div className="layout-content-container flex flex-col max-w-[960px] w-full gap-12 z-10">
                    <div className="flex flex-col gap-6 text-center items-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wide">
                            <span className="material-symbols-outlined text-sm">rocket_launch</span>
                            New: Supreme Court Style Formatting
                        </div>
                        <h1 className="text-[#111318] text-4xl font-black leading-tight tracking-[-0.033em] lg:text-6xl max-w-[800px]">
                            Draft Court-Ready Legal Documents in <span className="text-primary">Minutes with AI</span>
                        </h1>
                        <h2 className="text-[#616f89] text-lg font-normal leading-relaxed lg:text-xl max-w-[700px]">
                            India’s Smart Legal Drafting & Research Assistant for Advocates. Save hours on research and formatting with verified citations.
                        </h2>
                        <div className="flex flex-wrap gap-3 justify-center pt-4">
                            <Link to="/login" className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-all shadow-lg shadow-primary/30">
                                Start Drafting
                            </Link>
                            <button className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-white border border-[#dbdfe6] text-[#111318] text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#f8faff] transition-colors">
                                Book a Demo
                            </button>
                        </div>
                    </div>

                    {/* Hero Image/Preview */}
                    <div className="relative w-full aspect-[16/9] lg:aspect-[2/1] rounded-xl overflow-hidden shadow-2xl border border-[#f0f2f4] bg-white group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                        <div className="w-full h-full bg-[#f8faff] flex flex-col">
                            <div className="h-10 border-b flex items-center px-4 gap-2 bg-white">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <div className="ml-4 h-6 w-64 bg-slate-100 rounded text-xs flex items-center px-2 text-slate-400">draftmate.ai/editor/petition-102</div>
                            </div>
                            <div className="flex-1 flex overflow-hidden">
                                <div className="w-64 border-r bg-white p-4 hidden md:flex flex-col gap-3">
                                    <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse delay-75"></div>
                                    <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse delay-150"></div>
                                    <div className="mt-4 h-32 bg-primary/5 rounded border border-primary/10 p-3">
                                        <div className="text-primary text-xs font-bold mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">smart_toy</span> AI Suggestion</div>
                                        <div className="h-2 w-full bg-primary/10 rounded mb-1"></div>
                                        <div className="h-2 w-full bg-primary/10 rounded mb-1"></div>
                                        <div className="h-2 w-3/4 bg-primary/10 rounded"></div>
                                    </div>
                                </div>
                                <div className="flex-1 p-8 md:p-12 relative bg-white">
                                    <div className="max-w-2xl mx-auto shadow-sm border border-slate-100 min-h-full bg-white p-8">
                                        <div className="h-6 w-48 bg-slate-800 rounded mb-8"></div>
                                        <div className="space-y-3">
                                            <div className="h-3 w-full bg-slate-200 rounded"></div>
                                            <div className="h-3 w-full bg-slate-200 rounded"></div>
                                            <div className="h-3 w-11/12 bg-slate-200 rounded"></div>
                                            <div className="h-3 w-full bg-slate-200 rounded"></div>
                                            <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
                                        </div>
                                        <div className="mt-8 space-y-3">
                                            <div className="h-3 w-full bg-slate-200 rounded"></div>
                                            <div className="h-3 w-full bg-slate-200 rounded"></div>
                                            <div className="h-3 w-3/4 bg-slate-200 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured In */}
            <section className="bg-white pb-12 pt-6 px-4 lg:px-40">
                <div className="flex flex-col items-center gap-8 max-w-[960px] mx-auto">
                    <h3 className="text-[#616f89] text-xl font-serif text-center">We've been featured in</h3>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 w-full opacity-70">
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">balance</span>
                            <span className="text-xl font-bold font-serif">Bar & Bench</span>
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">school</span>
                            <span className="text-xl font-bold text-blue-600">shiksha</span>
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">public</span>
                            <span className="text-xl font-bold text-slate-700">OECD<span className="text-blue-500">.AI</span></span>
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">trending_up</span>
                            <span className="text-xl font-bold text-emerald-500">Groww</span>
                        </div>
                        <div className="h-8 md:h-10 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">rss_feed</span>
                            <span className="text-xl font-bold bg-black text-white px-1 rounded-sm">Bb</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 lg:px-40 bg-slate-50 dark:bg-[#101622]">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12">
                    <div className="flex flex-col gap-4 text-center">
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">Everything you need to modernize your practice</h2>
                        <p className="text-[#616f89] text-lg max-w-[600px] mx-auto">From research to filing, DraftMate acts as your intelligent digital junior.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: 'edit_document', title: 'Smart AI Legal Drafting', desc: 'Generate petitions, agreements, and notices in seconds tailored to your specific case facts.' },
                            { icon: 'library_books', title: 'Lex Bot Research', desc: 'Your personal research assistant. Ask complex legal queries and get precise answers with sources.' },
                            { icon: 'gavel', title: 'Authentic Case Laws', desc: 'Access a massive database of judgments. Only verified citations, ensuring total reliability.' },
                            { icon: 'picture_as_pdf', title: 'Chat with PDF', desc: 'Upload bulky case files or judgments and chat with them to extract summaries and key points instantly.' },
                            { icon: 'style', title: 'Personalized Style', desc: 'The AI learns your drafting tone and vocabulary over time, making every document sound like you wrote it.' },
                            { icon: 'calculate', title: 'Legal Calculators', desc: 'Built-in tools for Court Fees, Limitation periods, and Interest calculations based on Indian acts.' }
                        ].map((feature, idx) => (
                            <div key={idx} className="group flex flex-col gap-4 p-6 rounded-xl bg-white border border-[#f0f2f4] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">{feature.icon}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[#111318] text-xl font-bold">{feature.title}</h3>
                                    <p className="text-[#616f89] text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="py-20 px-4 lg:px-40 bg-white border-y border-[#f0f2f4]">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12">
                    <div className="flex flex-col gap-4 text-center">
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">Why DraftMate is Better than Generic AI</h2>
                        <p className="text-[#616f89] text-lg max-w-[600px] mx-auto">Specialized legal intelligence vs. general purpose chat.</p>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-[#f0f2f4] shadow-sm">
                        <table className="w-full text-left bg-white">
                            <thead className="bg-[#f8faff] border-b border-[#f0f2f4]">
                                <tr>
                                    <th className="py-5 px-6 text-sm font-bold text-[#616f89] uppercase tracking-wider w-1/3">Feature</th>
                                    <th className="py-5 px-6 text-lg font-bold text-[#111318] w-1/3">Generic AI (ChatGPT)</th>
                                    <th className="py-5 px-6 text-lg font-bold text-primary w-1/3 flex items-center gap-2">
                                        DraftMate
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                            Specialized
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f2f4]">
                                {[
                                    { feature: 'Indian Case Law Knowledge', generic: 'Limited, often outdated', draftmate: 'Real-time & Verified' },
                                    { feature: 'Citation Accuracy', generic: 'High risk of hallucinations', draftmate: '100% Verified Sources' },
                                    { feature: 'Document Formatting', generic: 'Plain text, needs reformatting', draftmate: 'Court-Ready Templates' },
                                    { feature: 'Data Privacy', generic: 'Data used for training', draftmate: 'Encrypted & Private Vault' },
                                    { feature: 'Legal Tone Customization', generic: 'Generic, robotic tone', draftmate: 'Learns Your Style' }
                                ].map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="py-4 px-6 text-[#111318] font-medium">{row.feature}</td>
                                        <td className="py-4 px-6 text-[#616f89]">{row.generic}</td>
                                        <td className="py-4 px-6 text-[#111318] font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-500">check_circle</span> {row.draftmate}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 bg-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col items-center text-center max-w-[800px] mx-auto gap-8">
                    <h2 className="text-white text-4xl lg:text-5xl font-black leading-tight tracking-tight">Upgrade Your Legal Practice Today</h2>
                    <p className="text-blue-100 text-lg lg:text-xl max-w-[600px]">Join thousands of Indian advocates who are drafting faster, researching smarter, and winning more cases.</p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Link to="/login" className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-white text-primary text-lg font-bold hover:bg-blue-50 transition-colors shadow-xl">
                            Get Started Now
                        </Link>
                        <button className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-blue-700 text-white border border-blue-500 text-lg font-bold hover:bg-blue-600 transition-colors">
                            Request Early Access
                        </button>
                    </div>
                    <p className="text-blue-200 text-xs mt-4">No credit card required for trial. 100% Secure & Confidential.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#101622] text-white py-12 px-4 lg:px-40 border-t border-gray-800">
                <div className="layout-content-container max-w-[960px] mx-auto flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex flex-col gap-4 max-w-xs">
                            <div className="flex items-center gap-2">
                                <div className="size-8">
                                    <img src={logo} alt="DraftMate" className="w-full h-full object-contain" />
                                </div>
                                <h2 className="text-lg font-bold">DraftMate</h2>
                            </div>
                            <p className="text-gray-400 text-sm">Empowering Indian Advocates with next-gen AI tools for drafting and research.</p>
                        </div>
                        <div className="flex flex-wrap gap-12">
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">Platform</h4>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Features</a>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Pricing</a>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Testimonials</a>
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">Company</h4>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">About Us</a>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Contact</a>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Careers</a>
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">Legal</h4>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Privacy Policy</a>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Terms of Service</a>
                                <a className="text-sm text-gray-300 hover:text-white cursor-pointer">Disclaimer</a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                        <p>© 2024 DraftMate Legal Tech Pvt Ltd. All rights reserved.</p>
                        <div className="flex gap-4">
                            <a className="hover:text-white cursor-pointer">Twitter</a>
                            <a className="hover:text-white cursor-pointer">LinkedIn</a>
                            <a className="hover:text-white cursor-pointer">Facebook</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import fullLogo from '../assets/FULL_LOGO.svg';

const Landing = () => {
    useEffect(() => {
        document.title = 'DraftMate';
    }, []);

    return (
        <div className="bg-slate-50 dark:bg-[#101622] text-[#111318] font-sans overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] bg-white/95 backdrop-blur-sm px-6 py-3 lg:px-40">
                <div className="flex items-center gap-4 text-[#111318]">
                    <div className="h-12 flex items-center justify-center">
                        <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                    </div>
                </div>
                <div className="hidden lg:flex flex-1 justify-end gap-8">
                    <div className="flex items-center gap-9">
                        <a className="text-[#111318] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer">Law Jurist</a>
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

            {/* Indian Legal Standards */}
            <section className="border-y border-[#f0f2f4] bg-white py-12">
                <div className="flex flex-col items-center gap-8 px-4 lg:px-40">
                    <h3 className="text-[#616f89] text-sm font-bold uppercase tracking-wider">Built Specifically For Indian Legal Standards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-[960px]">
                        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#f8faff] transition-colors">
                            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary shrink-0">
                                <span className="material-symbols-outlined">account_balance</span>
                            </div>
                            <div>
                                <h4 className="text-[#111318] text-lg font-bold">Indian Context</h4>
                                <p className="text-[#616f89] text-sm mt-1">Trained on IPC, CRPC, CPC & Indian Constitution.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#f8faff] transition-colors">
                            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary shrink-0">
                                <span className="material-symbols-outlined">verified</span>
                            </div>
                            <div>
                                <h4 className="text-[#111318] text-lg font-bold">Verified Citations</h4>
                                <p className="text-[#616f89] text-sm mt-1">Real-time links to Supreme Court & High Court judgments.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#f8faff] transition-colors">
                            <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary shrink-0">
                                <span className="material-symbols-outlined">check_circle</span>
                            </div>
                            <div>
                                <h4 className="text-[#111318] text-lg font-bold">Zero Hallucinations</h4>
                                <p className="text-[#616f89] text-sm mt-1">Strict guardrails ensure no fake cases are invented.</p>
                            </div>
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

            {/* See DraftMate in Action */}
            <section className="py-20 px-4 lg:px-40 bg-background-light dark:bg-background-dark">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12 items-center">
                    <div className="flex flex-col gap-4 text-center">
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">See DraftMate in Action</h2>
                        <p className="text-[#616f89] text-lg max-w-[600px] mx-auto">Watch how easy it is to draft a petition in under 5 minutes.</p>
                    </div>
                    <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-[#f0f2f4] bg-black relative group cursor-pointer">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="size-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <div className="size-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-4xl text-primary ml-1">play_arrow</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white/50 text-sm">
                            Video Placeholder (Embed YouTube Here)
                        </div>
                    </div>
                </div>
            </section>

            {/* From Facts to Filing */}
            <section className="py-20 px-4 lg:px-40 bg-white">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12">
                    <h2 className="text-[#111318] text-3xl font-black leading-tight text-center lg:text-4xl">From Facts to Filing in 4 Steps</h2>
                    <div className="relative flex flex-col md:flex-row justify-between items-start w-full gap-8 md:gap-4">
                        <div className="absolute top-6 left-6 md:left-0 md:top-6 w-[2px] h-full md:w-full md:h-[2px] bg-[#f0f2f4] -z-10"></div>
                        <div className="flex md:flex-col items-center md:items-start gap-6 md:gap-4 flex-1">
                            <div className="size-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-primary/30 shrink-0">1</div>
                            <div className="bg-white md:bg-transparent pr-4 md:pr-0">
                                <h4 className="text-[#111318] text-lg font-bold">Enter Case Facts</h4>
                                <p className="text-[#616f89] text-sm mt-1">Input raw details, upload voice notes, or paste client emails.</p>
                            </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-start gap-6 md:gap-4 flex-1">
                            <div className="size-12 rounded-full bg-white border-2 border-primary text-primary flex items-center justify-center text-lg font-bold shrink-0">2</div>
                            <div className="bg-white md:bg-transparent pr-4 md:pr-0">
                                <h4 className="text-[#111318] text-lg font-bold">AI Analysis</h4>
                                <p className="text-[#616f89] text-sm mt-1">DraftMate finds relevant acts, sections, and precedents.</p>
                            </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-start gap-6 md:gap-4 flex-1">
                            <div className="size-12 rounded-full bg-white border-2 border-[#dbdfe6] text-[#616f89] flex items-center justify-center text-lg font-bold shrink-0">3</div>
                            <div className="bg-white md:bg-transparent pr-4 md:pr-0">
                                <h4 className="text-[#111318] text-lg font-bold">Draft Generated</h4>
                                <p className="text-[#616f89] text-sm mt-1">Get a comprehensive first draft in proper court format.</p>
                            </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-start gap-6 md:gap-4 flex-1">
                            <div className="size-12 rounded-full bg-white border-2 border-[#dbdfe6] text-[#616f89] flex items-center justify-center text-lg font-bold shrink-0">4</div>
                            <div className="bg-white md:bg-transparent pr-4 md:pr-0">
                                <h4 className="text-[#111318] text-lg font-bold">Edit & Export</h4>
                                <p className="text-[#616f89] text-sm mt-1">Fine-tune the content, export to Word/PDF, and file.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Digital Junior Advocate */}
            <section className="py-20 px-4 lg:px-40 bg-background-light dark:bg-background-dark">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12">
                    <div className="flex flex-col gap-4 text-center">
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">Not Just AI. Your Digital Junior Advocate.</h2>
                    </div>
                    <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-sm border border-[#f0f2f4]">
                        <div className="flex-1 bg-white p-8 border-b md:border-b-0 md:border-r border-[#f0f2f4]">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-gray-400 text-3xl">hourglass_empty</span>
                                <h3 className="text-xl font-bold text-gray-500">Traditional Drafting</h3>
                            </div>
                            <ul className="flex flex-col gap-4">
                                <li className="flex gap-3 text-[#616f89]">
                                    <span className="material-symbols-outlined text-red-400">close</span>
                                    <span>Hours spent researching case laws manually.</span>
                                </li>
                                <li className="flex gap-3 text-[#616f89]">
                                    <span className="material-symbols-outlined text-red-400">close</span>
                                    <span>Repetitive typing of standard formats.</span>
                                </li>
                                <li className="flex gap-3 text-[#616f89]">
                                    <span className="material-symbols-outlined text-red-400">close</span>
                                    <span>Risk of missing recent amendments.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 bg-gradient-to-br from-blue-50 to-white p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-primary text-white text-xs font-bold rounded-bl-lg">RECOMMENDED</div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary text-3xl">speed</span>
                                <h3 className="text-xl font-bold text-primary">With DraftMate</h3>
                            </div>
                            <ul className="flex flex-col gap-4">
                                <li className="flex gap-3 text-[#111318]">
                                    <span className="material-symbols-outlined text-green-500">check</span>
                                    <span className="font-medium">Instant research with relevant citations.</span>
                                </li>
                                <li className="flex gap-3 text-[#111318]">
                                    <span className="material-symbols-outlined text-green-500">check</span>
                                    <span className="font-medium">Auto-formatted templates for every court.</span>
                                </li>
                                <li className="flex gap-3 text-[#111318]">
                                    <span className="material-symbols-outlined text-green-500">check</span>
                                    <span className="font-medium">Always updated with latest laws.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Digital Profile */}
            <section className="py-20 px-4 lg:px-40 bg-white">
                <div className="layout-content-container flex flex-col lg:flex-row items-center max-w-[960px] mx-auto gap-12">
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm">
                            <span className="w-8 h-[2px] bg-primary"></span>
                            Digital Presence
                        </div>
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">Showcase Your Expertise with a Digital Profile</h2>
                        <p className="text-[#616f89] text-lg">
                            Every DraftMate subscription includes a premium public profile. Share your digital visiting card, highlight your areas of practice, and let clients discover you easily.
                        </p>
                        <button className="w-fit flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-white border border-[#dbdfe6] text-[#111318] text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#f8faff] transition-colors">
                            View Sample Profile
                        </button>
                    </div>
                    <div className="flex-1 w-full flex justify-center lg:justify-end">
                        <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-xl overflow-hidden border border-[#f0f2f4] hover:shadow-2xl transition-shadow duration-500">
                            <div className="h-24 bg-gradient-to-r from-primary to-blue-600 relative"></div>
                            <div className="px-6 pb-6 -mt-12 flex flex-col items-center text-center">
                                <div className="size-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden" data-alt="Portrait of an Indian Advocate in professional attire">
                                    <img alt="Advocate Portrait" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDingvAZZEdxxo8SsCLy-QfkJsniZjVY1Xv1VCZtLpC8yFGsKg4BMKDU6p-GLrPQ0djboAgRIZIInLcWC7vmUmKL9Q_vn5MBVj3h1lWhGSj-D_nNRoa3YTHZ_uuRDMnVsQyJGtYPrDerOi4VW5nRAr2CIio6UQRmoPZcINhqIotGqtux6Gi8A22K98MzwIdnZzs4kxVwMHp1hfR8TjoOusPr0PFuM1X9UwCKLk6ePqSFw8whhDJwb36IK9xuHsJGJWe8PxZZ-OBAkg9" />
                                </div>
                                <h3 className="mt-4 text-xl font-bold text-[#111318]">Adv. Rajesh Kumar</h3>
                                <p className="text-sm text-[#616f89]">Supreme Court of India • 15 Years Exp.</p>
                                <div className="flex gap-2 mt-4 w-full justify-center">
                                    <span className="px-3 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full">Civil Law</span>
                                    <span className="px-3 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full">Corporate</span>
                                    <span className="px-3 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full">Cyber</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                    <button className="flex items-center justify-center gap-2 h-10 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90">
                                        <span className="material-symbols-outlined text-base">call</span> Contact
                                    </button>
                                    <button className="flex items-center justify-center gap-2 h-10 bg-[#f0f2f4] text-[#111318] text-sm font-bold rounded-lg hover:bg-[#e0e2e4]">
                                        <span className="material-symbols-outlined text-base">share</span> Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-4 lg:px-40 bg-background-light dark:bg-background-dark border-t border-[#f0f2f4]">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-12">
                    <div className="flex flex-col gap-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2 text-primary font-bold uppercase tracking-wider text-sm">
                            <span className="w-8 h-[2px] bg-primary"></span>
                            User Feedback
                            <span className="w-8 h-[2px] bg-primary"></span>
                        </div>
                        <h2 className="text-[#111318] text-3xl font-black leading-tight lg:text-4xl">Trusted by Advocates Across India</h2>
                        <p className="text-[#616f89] text-lg max-w-[600px] mx-auto">See how DraftMate is transforming legal practices from District Courts to the Supreme Court.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex flex-col p-6 bg-white rounded-xl border border-[#f0f2f4] shadow-sm">
                            <div className="flex gap-1 text-yellow-400 mb-4">
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                            </div>
                            <p className="text-[#111318] text-sm leading-relaxed mb-6">"DraftMate cut my drafting time by 60%. The case law finder is surprisingly accurate for Indian judgments. It's like having a senior associate available 24/7."</p>
                            <div className="mt-auto flex items-center gap-3">
                                <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold">AS</div>
                                <div>
                                    <h4 className="text-[#111318] text-sm font-bold">Adv. Amit Sharma</h4>
                                    <p className="text-[#616f89] text-xs">High Court, Delhi</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col p-6 bg-white rounded-xl border border-[#f0f2f4] shadow-sm">
                            <div className="flex gap-1 text-yellow-400 mb-4">
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star_half</span>
                            </div>
                            <p className="text-[#111318] text-sm leading-relaxed mb-6">"The regional translation feature is a lifesaver for my practice in lower courts. Drafting in English and converting to Marathi instantly has been a game changer."</p>
                            <div className="mt-auto flex items-center gap-3">
                                <div className="size-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">PP</div>
                                <div>
                                    <h4 className="text-[#111318] text-sm font-bold">Adv. Priya Patel</h4>
                                    <p className="text-[#616f89] text-xs">District Court, Pune</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col p-6 bg-white rounded-xl border border-[#f0f2f4] shadow-sm">
                            <div className="flex gap-1 text-yellow-400 mb-4">
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                                <span className="material-symbols-outlined text-lg fill-current">star</span>
                            </div>
                            <p className="text-[#111318] text-sm leading-relaxed mb-6">"I was skeptical about AI in law, but the hallucination guardrails are real. It cites cases that actually exist. The 'Digital Profile' also helped me land two new corporate clients."</p>
                            <div className="mt-auto flex items-center gap-3">
                                <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">VR</div>
                                <div>
                                    <h4 className="text-[#111318] text-sm font-bold">Adv. Vikram Rao</h4>
                                    <p className="text-[#616f89] text-xs">Supreme Court of India</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted Partners */}
            <section className="py-20 px-4 lg:px-40 bg-white border-t border-[#f0f2f4]">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-8 items-center">
                    <h3 className="text-[#616f89] text-sm font-bold uppercase tracking-wider text-center">Our Trusted Partners</h3>
                    <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-16 opacity-60">
                        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-4xl">gavel</span>
                            <span className="text-2xl font-black text-slate-800">Legal<span className="text-primary">Tech</span></span>
                        </div>
                        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-4xl">account_balance</span>
                            <span className="text-2xl font-serif font-bold text-slate-800">LawTimes</span>
                        </div>
                        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-4xl">policy</span>
                            <span className="text-2xl font-bold text-slate-800">INDIA<span className="font-light">JURIS</span></span>
                        </div>
                        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-4xl">library_books</span>
                            <span className="text-2xl font-bold text-slate-800">SCC<span className="text-red-600">Online</span></span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Coming Soon */}
            <section className="py-20 px-4 lg:px-40 bg-white border-t border-[#f0f2f4]">
                <div className="layout-content-container flex flex-col max-w-[960px] mx-auto gap-8">
                    <h2 className="text-[#111318] text-2xl font-bold leading-tight">Coming Soon to DraftMate</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-white border border-[#dbdfe6] flex flex-col gap-2">
                            <span className="material-symbols-outlined text-primary">groups</span>
                            <h4 className="font-bold text-[#111318]">Team Collaboration</h4>
                            <p className="text-xs text-[#616f89]">Edit drafts with your juniors in real-time.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white border border-[#dbdfe6] flex flex-col gap-2">
                            <span className="material-symbols-outlined text-primary">psychology</span>
                            <h4 className="font-bold text-[#111318]">Argument Gen</h4>
                            <p className="text-xs text-[#616f89]">AI suggested counter-arguments for defense.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white border border-[#dbdfe6] flex flex-col gap-2">
                            <span className="material-symbols-outlined text-primary">lock</span>
                            <h4 className="font-bold text-[#111318]">Secure Vault</h4>
                            <p className="text-xs text-[#616f89]">End-to-end encrypted client document storage.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white border border-[#dbdfe6] flex flex-col gap-2">
                            <span className="material-symbols-outlined text-primary">translate</span>
                            <h4 className="font-bold text-[#111318]">Regional Translation</h4>
                            <p className="text-xs text-[#616f89]">Draft in English, translate to Hindi/Regional instantly.</p>
                        </div>
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
                                <div className="h-12">
                                    <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                                </div>
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

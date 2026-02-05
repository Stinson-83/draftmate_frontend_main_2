import React from 'react';

const SecurityDraftmate = () => {
    return (
        <div className="w-full">
            <style>
                {`
          .circuit-bg {
            background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
            background-size: 24px 24px;
          }
        `}
            </style>
            <div className="mb-16 lg:mb-24 text-center lg:text-left">
                <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-[#1a2b4b] dark:text-slate-100">
                    What Powers the DraftMate Movement
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 font-light">
                    One-stop solution designed to transform complexity into clarity.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch mb-16">
                <div className="flex flex-col gap-8">
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-start text-left">
                        <h3 className="font-serif text-2xl mb-6 text-[#1a2b4b] dark:text-blue-400">Built for Indian Legal Reality</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            DraftMate is a movement to transform Indian Legal practice. It is shaped through deep empathy mapping with Indian lawyers, tested on real practice to give you responses that you can stand by.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-start text-left">
                        <h3 className="font-serif text-2xl mb-6 text-[#1a2b4b] dark:text-blue-400">Effortless Precision</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            DraftMate requires no learning curve, no prompt expertise, no technical friction. Speak the way you brief a junior. It responds with structured legal clarity, not chatbot fluff.
                        </p>
                    </div>
                </div>

                <div className="relative group h-full min-h-[400px]">
                    <div className="h-full bg-slate-950 rounded-xl p-10 flex flex-col justify-between overflow-hidden shadow-2xl relative">
                        <div className="absolute inset-0 circuit-bg opacity-30"></div>
                        <div className="relative z-10 flex items-center justify-center flex-grow py-12">
                            <div className="relative">
                                <span className="material-symbols-outlined text-[160px] text-blue-500/20 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none">security</span>
                                <svg className="w-48 h-auto relative z-20 text-blue-400/80" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 200 240">
                                    <rect height="110" rx="10" width="140" x="30" y="100"></rect>
                                    <path d="M60 100 V60 C60 40 80 30 100 30 C120 30 140 40 140 60 V100"></path>
                                    <path d="M80 140 H120 M100 140 V170 M90 170 H110" strokeOpacity="0.5"></path>
                                    <circle cx="100" cy="140" fill="currentColor" r="4"></circle>
                                    <path d="M40 120 H60 M40 150 H50 M140 130 H160 M150 160 H160" strokeOpacity="0.3"></path>
                                </svg>
                            </div>
                        </div>
                        <div className="relative z-10 text-center">
                            <h2 className="font-serif text-3xl text-white mb-3">Data Privacy</h2>
                            <div className="flex flex-wrap justify-center gap-3 text-xs font-mono text-blue-300 uppercase tracking-widest opacity-80">
                                <span>SOC2 Type 1</span>
                                <span className="text-slate-600">|</span>
                                <span>DPDPA Compliant</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-start text-left">
                        <h3 className="font-serif text-2xl mb-6 text-[#1a2b4b] dark:text-blue-400">Intelligence You Trust</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            This is intelligence you command, not algorithms you hope to understand. When DraftMate suggests, you can stand behind it in court. When it drafts, you can file with conviction.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-start text-left">
                        <h3 className="font-serif text-2xl mb-6 text-[#1a2b4b] dark:text-blue-400">One Platform. Full Control.</h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Experience seamless efficiency with one platform, one subscription, providing every connected tool you need in a clutter-free, intuitive workspace that simply makes sense.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityDraftmate;

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import fullLogo from '../assets/FULL_LOGO.svg';
import { faqs } from '../data/faqs';

const FAQs = () => {
    useEffect(() => {
        document.title = 'FAQs - DraftMate';
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-slate-50 text-slate-900 font-sans overflow-x-hidden min-h-screen">
            {/* Navigation */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-3 lg:px-20">
                <Link to="/" className="flex items-center gap-4">
                    <div className="h-12 flex items-center justify-center hover:opacity-80 transition-opacity">
                        <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-slate-600 hover:text-primary transition-colors font-medium">← Back to Home</Link>
                    <Link to="/login" className="hidden sm:flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-16 lg:py-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50" />
                <div className="absolute top-20 left-1/4 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700 uppercase tracking-wide mb-8">
                        <span className="material-symbols-outlined text-base">help</span>
                        Help Center
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-6">
                        Frequently Asked <span className="text-primary">Questions</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Find answers to common questions about DraftMate, its features, and how it can help your legal practice.
                    </p>
                </div>
            </section>

            {/* FAQs Section */}
            <section className="py-12 lg:py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6 md:p-10">
                        <div className="flex flex-col space-y-4">
                            {faqs.map((faq, index) => (
                                <details key={index} className="group border-b border-gray-100 last:border-0">
                                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors list-none">
                                        <span className="text-base font-semibold text-slate-800">{faq.question}</span>
                                        <span className="material-symbols-outlined text-slate-400 text-2xl transition-transform duration-200 group-open:rotate-180">expand_more</span>
                                    </summary>
                                    <div className="px-4 pb-4 pt-2">
                                        <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="h-8 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1 shadow-sm">
                            <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                        </div>
                    </Link>
                    <div className="flex gap-6">
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
                        <Link to="/features" className="text-slate-400 hover:text-white transition-colors">Features</Link>
                        <Link to="/login" className="text-slate-400 hover:text-white transition-colors">Login</Link>
                    </div>
                    <p className="text-slate-500 text-sm">© 2024 DraftMate. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default FAQs;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import fullLogo from '../assets/FULL_LOGO.svg';

const ComingSoon = ({ title = "Blog" }) => {
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        document.title = `${title} Coming Soon - DraftMate`;
        window.scrollTo(0, 0);
    }, [title]);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email) {
            setIsSubscribed(true);
            setEmail('');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Floating particles */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white/30 rounded-full"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            {/* Navigation */}
            <header className="relative z-50 flex items-center justify-between px-6 py-4 lg:px-20">
                <Link to="/" className="flex items-center gap-4">
                    <div className="h-8 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1 shadow-sm hover:bg-white transition-colors">
                        <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                    </div>
                </Link>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Home
                </Link>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center px-4 py-20 lg:py-32 min-h-[calc(100vh-80px)]">
                <div className="max-w-2xl mx-auto text-center">
                    {/* Icon */}
                    <div className="relative mb-8">
                        <div className="size-24 mx-auto rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/30">
                            <span className="material-symbols-outlined text-5xl text-white">
                                {title === 'Blog' ? 'article' : 'construction'}
                            </span>
                        </div>
                        <div className="absolute -top-2 -right-2 size-8 bg-amber-400 rounded-full flex items-center justify-center animate-bounce">
                            <span className="material-symbols-outlined text-amber-900 text-lg">schedule</span>
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
                        <span className="bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            {title}
                        </span>
                        <br />
                        <span className="text-white">Coming Soon</span>
                    </h1>

                    {/* Description */}
                    <p className="text-xl text-slate-400 mb-10 max-w-lg mx-auto">
                        {title === 'Blog'
                            ? "We're crafting insightful articles about legal tech, AI in law, and tips for modern advocates. Stay tuned!"
                            : "We're working hard to bring you something amazing. Check back soon!"
                        }
                    </p>

                    {/* Feature Preview Cards */}
                    {title === 'Blog' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                            {[
                                { icon: 'gavel', label: 'Legal Insights' },
                                { icon: 'smart_toy', label: 'AI in Law' },
                                { icon: 'tips_and_updates', label: 'Pro Tips' }
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-2xl text-primary mb-2">{item.icon}</span>
                                    <p className="text-sm font-medium text-white">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Email Subscription */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 max-w-md mx-auto">
                        {!isSubscribed ? (
                            <>
                                <h3 className="text-lg font-bold mb-2">Get Notified</h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    Be the first to know when we launch
                                </p>
                                <form onSubmit={handleSubscribe} className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex-1 h-12 px-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary transition-colors"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="h-12 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">notifications</span>
                                        <span className="hidden sm:inline">Notify Me</span>
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="py-4">
                                <div className="size-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-green-400">check_circle</span>
                                </div>
                                <h3 className="text-lg font-bold text-green-400 mb-2">You're on the list!</h3>
                                <p className="text-sm text-slate-400">
                                    We'll notify you as soon as we launch
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Back to Home */}
                    <div className="mt-12">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-medium transition-colors"
                        >
                            <span className="material-symbols-outlined">home</span>
                            Explore DraftMate
                        </Link>
                    </div>
                </div>
            </main>

            {/* Animated CSS */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
                    50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

export default ComingSoon;

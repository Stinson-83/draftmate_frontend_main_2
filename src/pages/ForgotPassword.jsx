import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import fullLogo from '../assets/FULL_LOGO.svg';
import { API_CONFIG } from '../services/endpoints';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = `${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.FORGOT_PASSWORD}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to send reset link');
            }

            // For dev purposes, if the backend returns the link, we can log it or show it (optional)
            if (data.dev_link) {
                console.log("DEV LINK:", data.dev_link);
            }

            setIsSubmitted(true);
            toast.success("Reset link sent to your email.");

        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 font-sans antialiased text-slate-900 dark:text-white h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300">

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-md w-full mx-4 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-10 relative">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link to="/">
                        <img src={fullLogo} alt="DraftMate" className="h-10 object-contain" />
                    </Link>
                </div>

                {!isSubmitted ? (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 mb-2">
                                Forgot Password?
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Enter your email and we'll send you a link to reset your password.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <label className="flex flex-col gap-2 group">
                                <span className="text-slate-900 dark:text-white text-sm font-medium">Email Address</span>
                                <input
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 h-12 px-4 placeholder:text-slate-400 text-base transition-all"
                                    placeholder="name@example.com"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </label>

                            <button
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-bold text-base transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">mark_email_read</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check your email</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                            We've sent a password reset link to<br />
                            <span className="font-medium text-slate-900 dark:text-white">{email}</span>
                        </p>

                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline mb-4 block w-full"
                        >
                            Try a different email
                        </button>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                    <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg mr-1">arrow_back</span>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // In a real app, you would handle authentication here.
        // For now, redirect to onboarding or dashboard.
        navigate('/onboarding');
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 font-sans antialiased text-slate-900 dark:text-white h-screen overflow-hidden flex transition-colors duration-300">
            {/* Left Side: Form Section */}
            <div className="w-full lg:w-1/2 h-full flex flex-col bg-white dark:bg-slate-900 relative overflow-y-auto z-10 transition-colors duration-300">
                {/* Logo Area */}
                <div className="px-8 py-6 lg:px-16 lg:py-8">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                        <div className="w-8 h-8 text-blue-600">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor"></path>
                                <path clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold leading-tight tracking-tight">Law Jurist</h2>
                    </div>
                </div>

                {/* Center Content Vertical Alignment */}
                <div className="flex-1 flex flex-col justify-center px-8 lg:px-24 xl:px-32">
                    <div className="max-w-md w-full mx-auto space-y-8">
                        {/* Heading */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight">Welcome back</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">Access your case files and legal resources securely.</p>
                        </div>

                        {/* Form */}
                        <form className="space-y-5" onSubmit={handleLogin}>
                            {/* Email */}
                            <label className="flex flex-col gap-2 group">
                                <span className="text-slate-900 dark:text-white text-sm font-medium leading-normal">Email or Username</span>
                                <input className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 h-14 px-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base transition-colors" placeholder="attorney@lawfirm.com" type="email" />
                            </label>

                            {/* Password */}
                            <label className="flex flex-col gap-2 group">
                                <span className="text-slate-900 dark:text-white text-sm font-medium leading-normal">Password</span>
                                <div className="relative flex items-center group-focus-within:ring-0">
                                    <input className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 h-14 pl-4 pr-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base transition-colors" placeholder="••••••••" type="password" />
                                    <div className="absolute right-0 top-0 bottom-0 pr-3 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
                                        <span className="material-symbols-outlined text-[24px]">visibility_off</span>
                                    </div>
                                </div>
                            </label>

                            {/* Forgot Password & Remember */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 w-4 h-4" type="checkbox" />
                                    <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">Remember me</span>
                                </label>
                                <a className="text-blue-600 hover:text-blue-700 text-sm font-normal underline underline-offset-4 decoration-blue-600/30 hover:decoration-blue-600 transition-all" href="#">Forgot Password?</a>
                            </div>

                            {/* Login Button */}
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-bold text-base transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-600/20 flex items-center justify-center gap-2 mt-4">
                                Log In
                            </button>

                            {/* Divider */}
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium tracking-wide">Or continue with</span>
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                            </div>

                            {/* SSO Button */}
                            <button className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 h-12 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-3" type="button">
                                <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8DktOKTysKP1Q8HJAjdsV8R_sdeQbqEh4Gk7fvao-3d2Y-NU2kHEoHcq3SUPFfpsCWPHlo97-0xHBmB24fyt3r-hqrurLrw5888y2Wlq7V-4xsMOboOhPjOq2AsG0ry9y8H-nSewGIro9qn0qHeX5XTu1aKbww73dfz0MytTJZNeJSFNr34GOSvCYSDAGQ1k8Ks4mH1PAwmEDQyvmWVLGN_SVOUYJe-1XnOdMUjie_nNLs_H_5srSaKjr98uXiuWccyuK69HnoiM" />
                                Sign in with Google
                            </button>
                        </form>

                        {/* Footer Links */}
                        <div className="text-center pt-2">
                            <p className="text-slate-400 text-xs leading-relaxed">
                                By clicking "Log In", you agree to our{' '}
                                <a className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2" href="#">Terms of Service</a> and{' '}
                                <a className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2" href="#">Privacy Policy</a>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Footer */}
                <div className="px-8 py-6 text-center lg:text-left">
                    <p className="text-slate-400 text-xs">© 2024 Law Jurist Inc. All rights reserved.</p>
                </div>
            </div>

            {/* Right Side: Image Section */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
                {/* Abstract gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-slate-900/90 mix-blend-multiply z-10"></div>
                {/* Main Image */}
                <img alt="Scales of justice" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9BpzvAdYdc52R7f6E07Ent3l2jeoEDSlU6cQyA0TAyaHwLFI_CQC_ugiIgFJ6CbZrcMHDN2838yW1UMRGpkoniNSyXmL6459xXyfmNMIIK4Z4Fjsimn-x0-9pnXHoXqU7EhrrQ9bE4ytXJzvi3LBnyMGSeKvPgTCQZZ9Z27lKQpM4HPUJFkG85ahT4msOI5kh7rWfkQBvLW6E53uxRJMyykPBDFOmgjdyO42vgPPzpdIEaIxbKIyxlW2Crckkax8WVftnuOzmT-8" />

                {/* Overlay Content */}
                <div className="relative z-20 max-w-lg px-12 text-center text-white">
                    <div className="mb-8 inline-flex p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                        <span className="material-symbols-outlined text-[40px] text-white">gavel</span>
                    </div>
                    <h3 className="text-4xl font-bold mb-6 tracking-tight leading-tight">Streamline your legal practice</h3>
                    <p className="text-slate-100 text-lg leading-relaxed font-light opacity-90 mb-10">
                        Join over 10,000 legal professionals who trust Law Jurist for secure case management, research, and client collaboration.
                    </p>
                    {/* Trust Indicators */}
                    <div className="flex items-center justify-center gap-8 opacity-80">
                        <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-[28px]">verified_user</span>
                            <span className="text-xs font-semibold uppercase tracking-wider">Bank-grade Security</span>
                        </div>
                        <div className="w-px h-10 bg-white/20"></div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-[28px]">cloud_done</span>
                            <span className="text-xs font-semibold uppercase tracking-wider">99.9% Uptime</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

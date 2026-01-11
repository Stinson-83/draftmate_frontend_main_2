import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import logo from '../assets/draftmate_logo.png';
import fullLogo from '../assets/Full_logo.png';
import { API_CONFIG } from '../services/endpoints';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const loadingToast = toast.loading("Logging in...");

        try {
            const loginUrl = `${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.LOGIN}`;
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Login failed');
            }

            // Save session
            localStorage.setItem('session_id', data.session_id);
            localStorage.setItem('user_id', data.user_id);
            // Also store a profile object for App.jsx RequireAuth check
            localStorage.setItem('user_profile', JSON.stringify({ email: email, id: data.user_id }));

            toast.dismiss(loadingToast);
            toast.success("Welcome back!");
            navigate('/dashboard/home');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            const loadingToast = toast.loading("Logging in with Google...");
            try {
                const googleLoginUrl = `${API_CONFIG.AUTH.BASE_URL}${API_CONFIG.AUTH.ENDPOINTS.GOOGLE_LOGIN}`;
                const response = await fetch(googleLoginUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenResponse.credential || tokenResponse.access_token }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || 'Google Login failed');
                }

                localStorage.setItem('session_id', data.session_id);
                localStorage.setItem('user_id', data.user_id);
                // We don't have email in response unless we modify backend to return it or decode token.
                // But let's set a dummy profile or fetch it? 
                // For now, let's just set a truthy profile to pass RequireAuth.
                localStorage.setItem('user_profile', JSON.stringify({ id: data.user_id, google: true }));

                toast.dismiss(loadingToast);
                toast.success("Welcome back!");
                navigate('/dashboard/home');

            } catch (error) {
                toast.dismiss(loadingToast);
                toast.error(error.message || "Google Login failed");
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => toast.error("Google Login Failed"),
    });

    return (
        <div className="bg-slate-50 dark:bg-slate-900 font-sans antialiased text-slate-900 dark:text-white h-screen overflow-hidden flex transition-colors duration-300">
            {/* Left Side: Form Section */}
            <div className="w-full lg:w-1/2 h-full flex flex-col bg-white dark:bg-slate-900 relative overflow-y-auto z-10 transition-colors duration-300">
                {/* Logo Area */}
                <div className="px-8 py-6 lg:px-16 lg:py-8">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                        <div className="h-12">
                            <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                        </div>
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
                                <input
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 h-14 px-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base transition-colors"
                                    placeholder="attorney@lawfirm.com"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </label>

                            {/* Password */}
                            <label className="flex flex-col gap-2 group">
                                <span className="text-slate-900 dark:text-white text-sm font-medium leading-normal">Password</span>
                                <div className="relative flex items-center group-focus-within:ring-0">
                                    <input
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 h-14 pl-4 pr-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base transition-colors"
                                        placeholder="••••••••"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <div
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-0 bottom-0 pr-3 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[24px]">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
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
                            <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-bold text-base transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-600/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
                                {isLoading ? 'Logging In...' : 'Sign In'}
                            </button>

                            <div className="text-center pt-2">
                                <span className="text-slate-500 dark:text-slate-400 text-sm">Don't have an account? </span>
                                <Link to="/signup" className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline">Create one</Link>
                            </div>

                            {/* Divider */}
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium tracking-wide">Or continue with</span>
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                            </div>

                            {/* SSO Button */}
                            <button onClick={() => googleLogin()} className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 h-12 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-3" type="button">
                                <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8DktOKTysKP1Q8HJAjdsV8R_sdeQbqEh4Gk7fvao-3d2Y-NU2kHEoHcq3SUPFfpsCWPHlo97-0xHBmB24fyt3r-hqrurLrw5888y2Wlq7V-4xsMOboOhPjOq2AsG0ry9y8H-nSewGIro9qn0qHeX5XTu1aKbww73dfz0MytTJZNeJSFNr34GOSvCYSDAGQ1k8Ks4mH1PAwmEDQyvmWVLGN_SVOUYJe-1XnOdMUjie_nNLs_H_5srSaKjr98uXiuWccyuK69HnoiM" />
                                Sign in with Google
                            </button>
                        </form>

                        {/* Footer Links */}
                        <div className="text-center pt-2">
                            <p className="text-slate-400 text-xs leading-relaxed">
                                By clicking "Sign In", you agree to our{' '}
                                <a className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2" href="#">Terms of Service</a> and{' '}
                                <a className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2" href="#">Privacy Policy</a>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Footer */}
                <div className="px-8 py-6 text-center lg:text-left">
                    <p className="text-slate-400 text-xs">© 2024 DraftMate Inc. All rights reserved.</p>
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
                        <img src={logo} alt="DraftMate" className="w-16 h-16 object-contain" />
                    </div>
                    <h3 className="text-4xl font-bold mb-6 tracking-tight leading-tight">Streamline your legal practice</h3>
                    <p className="text-slate-100 text-lg leading-relaxed font-light opacity-90 mb-10">
                        Join over 10,000 legal professionals who trust DraftMate for secure case management, research, and client collaboration.
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

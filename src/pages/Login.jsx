import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import logo from '../assets/draftmate_logo.png';
import fullLogo from '../assets/FULL_LOGO.svg';
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

                // Save profile from backend response
                const profileData = {
                    id: data.user_id,
                    email: data.email,
                    name: data.name,
                    image: data.picture,
                    firstName: data.name ? data.name.split(' ')[0] : '',
                    lastName: data.name ? data.name.split(' ').slice(1).join(' ') : '',
                    google: true
                };
                localStorage.setItem('user_profile', JSON.stringify(profileData));

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
                        <Link to="/" className="h-12 block">
                            <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
                        </Link>
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
                                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
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
                    <Link to="/" className="mb-8 inline-flex p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:bg-white/20 transition-colors">
                        <img src={logo} alt="DraftMate" className="w-16 h-16 object-contain" />
                    </Link>
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

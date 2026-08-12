import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import logo from '../assets/draftmate_logo.png';
import { advocateAuth } from '../services/advocateApi';

export default function AdvocateLogin() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Show session-expired banner if redirected here with ?session_expired=1
    useEffect(() => {
        if (searchParams.get('session_expired') === '1') {
            toast.error('Session expired. Please sign in again.', { duration: 5000 });
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const tid = toast.loading('Signing in...');
        try {
            const data = await advocateAuth.login(formData);
            advocateAuth.saveTokens(data);
            toast.dismiss(tid);
            toast.success('Welcome back!');
            navigate('/dashboard/advocate-profile');
        } catch (err) {
            toast.dismiss(tid);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <img src={logo} alt="DraftMate" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Advocate Sign In
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link to="/advocate/signup" className="font-medium text-blue-600 hover:text-blue-500">
                        register as a new advocate
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <Label htmlFor="email">Email address</Label>
                            <div className="mt-1">
                                <Input id="email" name="email" type="email" required
                                    value={formData.email} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <div className="mt-1">
                                <Input id="password" name="password" type="password" required
                                    value={formData.password} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full h-11" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

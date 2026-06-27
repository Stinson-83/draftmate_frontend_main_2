import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import logo from '../assets/draftmate_logo.png';
import { advocateAuth } from '../services/advocateApi';

export default function AdvocateSignup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters.');
            return;
        }

        setIsLoading(true);
        const tid = toast.loading('Creating your advocate account...');
        try {
            const data = await advocateAuth.register({
                email: formData.email,
                password: formData.password,
                first_name: formData.firstName,
                last_name: formData.lastName,
            });

            advocateAuth.saveTokens(data);
            toast.dismiss(tid);
            toast.success('Account created! Complete your profile to go live.');
            navigate('/advocate/onboarding');
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
                    Join the Advocate Network
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link to="/advocate/login" className="font-medium text-blue-600 hover:text-blue-500">
                        sign in to your existing account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSignup}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <div className="mt-1">
                                    <Input id="firstName" name="firstName" type="text" required
                                        value={formData.firstName} onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <div className="mt-1">
                                    <Input id="lastName" name="lastName" type="text" required
                                        value={formData.lastName} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Email address</Label>
                            <div className="mt-1">
                                <Input id="email" name="email" type="email" required
                                    value={formData.email} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password">
                                Password{' '}
                                <span className="text-slate-400 font-normal text-xs">
                                    (min 8 chars, must include a letter and digit)
                                </span>
                            </Label>
                            <div className="mt-1">
                                <Input id="password" name="password" type="password" required
                                    value={formData.password} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="mt-1">
                                <Input id="confirmPassword" name="confirmPassword" type="password" required
                                    value={formData.confirmPassword} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full h-11" disabled={isLoading}>
                                {isLoading ? 'Creating account...' : 'Create Advocate Account'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

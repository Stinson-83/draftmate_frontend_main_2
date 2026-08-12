import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AuthResolver() {
    const navigate = useNavigate();

    useEffect(() => {
        const resolveAuth = () => {
            const profileStr = localStorage.getItem('user_profile');
            
            if (!profileStr) {
                toast.error("Session missing. Please login again.");
                navigate('/login');
                return;
            }

            try {
                const profile = JSON.parse(profileStr);
                const role = profile.role?.toLowerCase() || 'client'; // Default to client

                if (role === 'admin') {
                    navigate('/admin/verifications', { replace: true });
                } else if (role === 'advocate') {
                    // Assuming backend sets profile_completed or slug when an advocate profile is created
                    if (profile.advocate_profile_completed || profile.slug) {
                        navigate('/dashboard/profile', { replace: true });
                    } else {
                        navigate('/advocate/onboarding', { replace: true });
                    }
                } else {
                    // Default client flow
                    navigate('/dashboard/home', { replace: true });
                }
            } catch (err) {
                console.error("Error parsing profile for auth resolution", err);
                navigate('/login');
            }
        };

        resolveAuth();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Resolving your workspace...</p>
            </div>
        </div>
    );
}

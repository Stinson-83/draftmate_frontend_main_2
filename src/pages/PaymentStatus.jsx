import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPayment } from '../services/CashfreeService';
import { toast } from 'sonner';

export default function PaymentStatus() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, failed
    const orderId = searchParams.get('order_id');

    useEffect(() => {
        if (!orderId) {
            setStatus('failed');
            toast.error("Invalid Payment Link");
            return;
        }

        const verify = async () => {
            try {
                // Call Backend to Verify
                const result = await verifyPayment(orderId);

                if (result.status === 'SUCCESS') {
                    setStatus('success');
                    toast.success("Payment Successful! Subscription Active.");
                    // Redirect to Settings after delay
                    setTimeout(() => navigate('/dashboard/settings'), 3000);
                } else {
                    setStatus('failed');
                    toast.error("Payment Verification Failed.");
                    toast.error("Payment Verification Failed.");
                    setTimeout(() => navigate('/dashboard/settings'), 3000);
                }
            } catch (error) {
                console.error("Verification Error:", error);
                setStatus('failed');
                toast.error("Verification Error. Please contact support.");
            }
        };

        verify();
    }, [orderId, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">

                {status === 'verifying' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verifying Payment...</h2>
                        <p className="text-slate-500 dark:text-slate-400">Please wait while we confirm your subscription.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">check_circle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Successful!</h2>
                        <p className="text-slate-500 dark:text-slate-400">Welcome to PRO. Redirecting you via settings...</p>
                        <button onClick={() => navigate('/dashboard/settings')} className="mt-4 text-blue-500 hover:text-blue-600 font-medium">
                            Go to Settings Now
                        </button>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-red-600 dark:text-red-400">error</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Failed</h2>
                        <p className="text-slate-500 dark:text-slate-400">We couldn't verify your payment. If money was deducted, it will be refunded automatically.</p>
                        <button onClick={() => navigate('/dashboard/settings')} className="mt-4 px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white font-medium hover:opacity-90 transition-opacity">
                            Back to Settings
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

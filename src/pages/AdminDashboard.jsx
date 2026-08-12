import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { API_CONFIG } from '../services/endpoints';

// Admin calls go through the advocate-api nginx route → port 8007
// Requires a JWT token with role=admin in localStorage as 'advocate_token'
const ADMIN_BASE = API_CONFIG.ADVOCATE.BASE_URL;

function adminFetch(path, options = {}) {
    const token = localStorage.getItem('advocate_token');
    return fetch(`${ADMIN_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
}

export default function AdminDashboard() {
    const [requests, setRequests] = useState([]);
    const [stats, setStats]       = useState({});
    const [loading, setLoading]   = useState(true);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setAuthError(false);
        try {
            const [resVerifications, resStats] = await Promise.all([
                adminFetch('/api/v1/admin/verifications'),
                adminFetch('/api/v1/admin/stats'),
            ]);

            if (resVerifications.status === 401 || resVerifications.status === 403 ||
                resStats.status === 401 || resStats.status === 403) {
                setAuthError(true);
                return;
            }

            if (resVerifications.ok) {
                const data = await resVerifications.json();
                setRequests(data.data || []);
            }
            if (resStats.ok) {
                const data = await resStats.json();
                setStats(data.data || {});
            }
        } catch (err) {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await adminFetch(`/api/v1/admin/verifications/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });

            if (res.status === 403) {
                toast.error('Admin access required.');
                return;
            }
            if (!res.ok) {
                const err = await res.json();
                toast.error(err.detail || 'Action failed');
                return;
            }

            toast.success(`Request ${status.toLowerCase()}`);
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        } catch (err) {
            toast.error('Action failed');
        }
    };

    // ── Auth error state ───────────────────────────────────────────────────────
    if (authError) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-800 mb-2">Admin Access Required</h2>
                    <p className="text-red-600 text-sm">
                        Your account does not have admin privileges. 
                        Contact the platform owner to grant admin access.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-500 animate-pulse">Loading Admin Panel...</div>
            </div>
        );
    }

    const pendingCount = requests.filter(r => r.status === 'PENDING').length;

    return (
        <div className="max-w-6xl mx-auto p-6 mt-16 pb-20">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <ShieldAlert className="w-8 h-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Moderation Panel</h1>
                    <p className="text-slate-500">Platform overview and verification requests</p>
                </div>
            </div>

            {/* Platform Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Advocates', value: stats.total_advocates ?? 0, color: 'text-slate-900' },
                    { label: 'Verified',         value: stats.verified_advocates ?? 0, color: 'text-green-600' },
                    { label: 'Consultations',    value: stats.total_consultations ?? 0, color: 'text-blue-600' },
                    { label: 'Profile Shares',   value: stats.total_shares ?? 0, color: 'text-indigo-600' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Verification Queue */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Verification Queue</h2>
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                        {pendingCount} Pending
                    </span>
                </div>

                {requests.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        No verification requests found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-sm">
                                    <th className="pb-3 font-semibold">Advocate</th>
                                    <th className="pb-3 font-semibold">Bar ID</th>
                                    <th className="pb-3 font-semibold">Submitted</th>
                                    <th className="pb-3 font-semibold">Document</th>
                                    <th className="pb-3 font-semibold">Status</th>
                                    <th className="pb-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 font-medium text-slate-900">
                                            {req.advocate_name}
                                        </td>
                                        <td className="py-4 text-slate-600 text-sm">
                                            {req.bar_council_number || 'N/A'}
                                        </td>
                                        <td className="py-4 text-slate-600 text-sm">
                                            {req.submitted_at
                                                ? new Date(req.submitted_at).toLocaleDateString('en-IN')
                                                : '—'}
                                        </td>
                                        <td className="py-4">
                                            {req.documents_url ? (
                                                <a
                                                    href={req.documents_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium"
                                                >
                                                    View Doc <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-sm">No document</span>
                                            )}
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                req.status === 'PENDING'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : req.status === 'APPROVED'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            {req.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                                        variant="outline"
                                                        className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

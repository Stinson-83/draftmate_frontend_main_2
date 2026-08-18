import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_CONFIG } from '../../services/endpoints';

const IntegrationSettings = () => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_CONFIG.LIBRARY.BASE_URL}/api/v1/integrations/ecourts/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      setStatus({ error: "Network Error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`${API_CONFIG.LIBRARY.BASE_URL}/api/v1/integrations/ecourts/test`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        const errData = await res.json();
        setStatus({ error: errData.detail || `HTTP ${res.status}` });
      }
    } catch (error) {
      setStatus({ error: "Network Error" });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusDisplay = () => {
    if (!status) return null;
    
    if (status.error) {
      if (status.error.includes("403")) return <span className="text-red-600 font-bold">❌ Unauthorized / Blocked</span>;
      if (status.error.includes("Invalid API Key")) return <span className="text-red-600 font-bold">❌ Invalid API Key</span>;
      if (status.error.includes("Network Error")) return <span className="text-red-600 font-bold">❌ Network Error</span>;
      return <span className="text-red-600 font-bold">❌ {status.error}</span>;
    }
    
    if (status.connected && status.authenticated) {
      return <span className="text-green-600 font-bold">✅ Connected</span>;
    } else if (status.connected && !status.authenticated) {
      return <span className="text-amber-600 font-bold">⚠️ Disconnected / Unauthorized</span>;
    } else {
      return <span className="text-red-600 font-bold">❌ API Offline</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard/library"
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Library
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integration Settings</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your e-Courts API integration
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
              {isRefreshing ? 'Testing Connection...' : 'Refresh Status'}
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">e-Courts India API</h2>
          
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg">
                Status: {getStatusDisplay()}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Latency</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{status?.latency ? `${status.latency} ms` : 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">API Version</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{status?.api_version || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Account</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{status?.account || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Last Checked</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {status?.last_checked ? new Date(status.last_checked * 1000).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              {status?.error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-mono break-all">
                  <strong>Error details:</strong> {status.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationSettings;

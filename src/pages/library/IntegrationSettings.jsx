import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { integrationService } from '../../services/library/integrationService';

const IntegrationSettings = () => {
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatus = async () => {
    try {
      setIsLoading(true);
      const data = await integrationService.getIntegrationStatus();
      setIntegrationStatus(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    getStatus();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    getStatus();
  };

  const getStatusBadge = (status) => {
    const styles = {
      connected: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      not_configured: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
      offline: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    };
    const labels = {
      connected: 'Connected',
      not_configured: 'Not Configured',
      offline: 'Offline'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.not_configured}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getHealthIcon = (health) => {
    if (health === 'healthy') {
      return <span className="w-2 h-2 rounded-full bg-green-500"></span>;
    } else if (health === 'degraded') {
      return <span className="w-2 h-2 rounded-full bg-amber-500"></span>;
    }
    return <span className="w-2 h-2 rounded-full bg-slate-400"></span>;
  };

  const getOverallIcon = (overall) => {
    if (overall === 'healthy') {
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400">wifi</span>
        </div>
      );
    } else if (overall === 'degraded') {
      return (
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">signal_cellular_connected_no_internet_4_bar</span>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
      </div>
    );
  };

  const getProviderIcon = (providerId) => {
    if (providerId === 'indiankanoon') {
      return <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">description</span>;
    } else if (providerId === 'ecourts') {
      return <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">gavel</span>;
    } else if (providerId === 'surepass') {
      return <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">link</span>;
    }
    return <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-2xl">widgets</span>;
  };

  const getProviderIconBg = (providerId) => {
    if (providerId === 'indiankanoon') {
      return 'bg-blue-100 dark:bg-blue-900/20';
    } else if (providerId === 'ecourts') {
      return 'bg-blue-100 dark:bg-blue-900/20';
    } else if (providerId === 'surepass') {
      return 'bg-purple-100 dark:bg-purple-900/20';
    }
    return 'bg-slate-100 dark:bg-slate-700';
  };

  const getFeatures = (providerId) => {
    if (providerId === 'indiankanoon') {
      return ['Judgment Search', 'Judgment Details', 'AI Summary'];
    } else if (providerId === 'ecourts') {
      return ['CNR Search', 'Case Status Tracking', 'Order and Judgment Download', 'Cause List Tracking'];
    } else if (providerId === 'surepass') {
      return ['Advanced CNR Search', 'Bulk Case Tracking', 'Push Notifications', 'Case History Analytics'];
    }
    return [];
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
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
                Manage your e-Courts and third-party integrations
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>

        {/* API Status Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-600 rounded"></div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-600 rounded"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                {getOverallIcon(integrationStatus?.overall)}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">API Status</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {integrationStatus?.overall === 'healthy' ? 'All services are operational' : 'Some services may have issues'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrationStatus?.providers?.map((provider) => (
                  <div key={provider.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getHealthIcon(provider.health)}
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{provider.name}</p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {provider.status === 'connected' ? 'Operational' : 'Not available'}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Provider Cards */}
        {!isLoading && integrationStatus?.providers?.map((provider) => (
          <div key={provider.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${getProviderIconBg(provider.id)} flex items-center justify-center`}>
                  {getProviderIcon(provider.id)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{provider.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {provider.id === 'indiankanoon' ? 'Indian Kanoon legal database integration' :
                     provider.id === 'ecourts' ? 'Official e-Courts integration' :
                     'Third-party e-Courts integration'}
                  </p>
                </div>
              </div>
              {getStatusBadge(provider.status)}
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Features</h4>
              <ul className="space-y-2">
                {(provider.features || getFeatures(provider.id)).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className={`material-symbols-outlined ${provider.configured ? 'text-green-500' : 'text-slate-400'} text-sm`}>
                      {provider.configured ? 'check_circle' : 'schedule'}
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Future Architecture Note */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Future-Ready Architecture
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            DraftMate is built with a modular architecture that will support:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-amber-700 dark:text-amber-300">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-sm">arrow_right</span>
              <code className="bg-amber-100 dark:bg-amber-900/20 px-1.5 py-0.5 rounded text-xs">
                https://ecourtsindia.com/api
              </code>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-sm">arrow_right</span>
              <code className="bg-amber-100 dark:bg-amber-900/20 px-1.5 py-0.5 rounded text-xs">
                https://surepass.io/ecourts-api/
              </code>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-sm">arrow_right</span>
              Easy plugin-based integration with other legal databases
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSettings;

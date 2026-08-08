import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { trackingService } from '../../services/library/trackingService';

const CaseTrackingDetails = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [trackingCase, setTrackingCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTrackedCase = useCallback(async () => {
    try {
      const data = await trackingService.getTrackedCaseById(trackingId);
      setTrackingCase(data);
    } catch {
      toast.error('Failed to load tracking details');
    } finally {
      setLoading(false);
    }
  }, [trackingId]);

  useEffect(() => {
    loadTrackedCase();
  }, [loadTrackedCase]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to stop tracking this case?')) {
      try {
        await trackingService.deleteTrackedCase(trackingId);
        toast.success('Case tracking removed');
        navigate('/dashboard/library/case-tracking');
      } catch {
        toast.error('Failed to remove case tracking');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 h-full flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!trackingCase) {
    return (
      <div className="p-6 md:p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-amber-500 text-3xl">track_changes</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tracking not found</h3>
          <Link
            to="/dashboard/library/case-tracking"
            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Tracking
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/dashboard/library/case-tracking"
                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{trackingCase.caseTitle}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                {trackingCase.cnrNumber}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                {trackingCase.caseStage}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{trackingCase.caseNumber}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined">edit</span>
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined">delete</span>
              Remove Tracking
            </button>
          </div>
        </div>

        {/* Placeholder Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-slate-500">info</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Case Status</p>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{trackingCase.caseStage}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-500">event</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Next Hearing</p>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {trackingCase.nextHearingDate ? `${new Date(trackingCase.nextHearingDate).toLocaleDateString()} at ${trackingCase.nextHearingTime}` : 'Not scheduled'}
            </p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-green-500">description</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest Order</p>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">{trackingCase.latestOrder}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-purple-500">history</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest Proceeding</p>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">{trackingCase.latestProceeding}</p>
          </div>
        </div>

        {/* Tracking Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Court Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Court Establishment</p>
                <p className="text-slate-900 dark:text-white">{trackingCase.courtEstablishment}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
                <p className="text-slate-900 dark:text-white">{new Date(trackingCase.lastUpdated).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {trackingCase.caseId && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Linked Case</h3>
              <Link
                to={`/dashboard/library/cases/${trackingCase.caseId}`}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined">open_in_new</span>
                View Case Details
              </Link>
            </div>
          )}
        </div>

        {/* Future Integration Placeholders */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">Future Integration</h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
            This section will be integrated with e-Courts India API, Surepass API, or other case tracking services.
            Planned features:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-700 dark:text-amber-300">
            <li>CNR search and automatic case import</li>
            <li>Real-time order tracking</li>
            <li>Cause list tracking</li>
            <li>Automatic updates from court websites</li>
            <li>Push notifications for new orders and hearings</li>
          </ul>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <CaseTrackingModal
          trackingCase={trackingCase}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            loadTrackedCase();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Case Tracking Modal Component
const CaseTrackingModal = ({ trackingCase, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    trackingCase || {
      cnrNumber: '',
      caseNumber: '',
      caseTitle: '',
      courtEstablishment: '',
      caseStage: '',
      lastUpdated: new Date().toISOString().split('T')[0],
      nextHearingDate: '',
      nextHearingTime: '',
      latestOrder: '',
      latestProceeding: '',
      caseId: ''
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (trackingCase) {
        await trackingService.updateTrackedCase(trackingCase.id, formData);
        toast.success('Tracking updated');
      } else {
        await trackingService.createTrackedCase(formData);
        toast.success('Case added to tracking');
      }
      onSave();
    } catch {
      toast.error('Failed to save tracking info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {trackingCase ? 'Update Tracking' : 'Track New Case'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                CNR Number
              </label>
              <input
                type="text"
                value={formData.cnrNumber}
                onChange={(e) => setFormData({ ...formData, cnrNumber: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. DL2501000000012024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Case Number
              </label>
              <input
                type="text"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Crl. Appeal 45/2024"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Case Title
            </label>
            <input
              type="text"
              value={formData.caseTitle}
              onChange={(e) => setFormData({ ...formData, caseTitle: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Court Establishment
            </label>
            <input
              type="text"
              value={formData.courtEstablishment}
              onChange={(e) => setFormData({ ...formData, courtEstablishment: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              placeholder="e.g. Bombay High Court, Principal Bench"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Case Stage
              </label>
              <input
                type="text"
                value={formData.caseStage}
                onChange={(e) => setFormData({ ...formData, caseStage: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Last Updated
              </label>
              <input
                type="date"
                value={formData.lastUpdated}
                onChange={(e) => setFormData({ ...formData, lastUpdated: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Next Hearing Date
              </label>
              <input
                type="date"
                value={formData.nextHearingDate}
                onChange={(e) => setFormData({ ...formData, nextHearingDate: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Next Hearing Time
              </label>
              <input
                type="time"
                value={formData.nextHearingTime}
                onChange={(e) => setFormData({ ...formData, nextHearingTime: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Latest Order
            </label>
            <textarea
              value={formData.latestOrder}
              onChange={(e) => setFormData({ ...formData, latestOrder: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Latest Proceeding
            </label>
            <textarea
              value={formData.latestProceeding}
              onChange={(e) => setFormData({ ...formData, latestProceeding: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            ></textarea>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
            >
              {trackingCase ? 'Update' : 'Track Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseTrackingDetails;

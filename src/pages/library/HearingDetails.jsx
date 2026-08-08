import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { hearingService } from '../../services/library/hearingService';
import { statusTypes } from '../../data/mockHearings';

const HearingDetails = () => {
  const { hearingId } = useParams();
  const navigate = useNavigate();
  const [hearing, setHearing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadHearing();
  }, [hearingId]);

  const loadHearing = async () => {
    try {
      const data = await hearingService.getHearingById(hearingId);
      if (data) {
        setHearing(data);
      } else {
        toast.error('Hearing not found');
        navigate('/dashboard/library/hearings');
      }
    } catch (err) {
      toast.error('Failed to load hearing');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this hearing?')) {
      try {
        await hearingService.deleteHearing(hearingId);
        toast.success('Hearing deleted');
        navigate('/dashboard/library/hearings');
      } catch (err) {
        toast.error('Failed to delete hearing');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'Adjourned': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'Cancelled': return 'bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'Missed': return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!hearing) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 md:px-8 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/library/hearings"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                {hearing.caseTitle}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{hearing.caseNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span className="hidden md:inline">Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span className="hidden md:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Hearing Info */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Hearing Information</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(hearing.status)}`}>
                {hearing.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Court</span>
                <span className="text-slate-900 dark:text-white">{hearing.court}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Judge</span>
                <span className="text-slate-900 dark:text-white">{hearing.judge}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Client</span>
                <span className="text-slate-900 dark:text-white">{hearing.client}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Opposite Party</span>
                <span className="text-slate-900 dark:text-white">{hearing.oppositeParty}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Hearing Date</span>
                <span className="text-slate-900 dark:text-white">
                  {new Date(hearing.hearingDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {hearing.nextHearingDate && (
                <div>
                  <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Next Hearing Date</span>
                  <span className="text-slate-900 dark:text-white">
                    {new Date(hearing.nextHearingDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
            {hearing.remarks && (
              <div className="mt-6">
                <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Remarks</span>
                <p className="text-slate-700 dark:text-slate-300">{hearing.remarks}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          {(hearing.timeline && hearing.timeline.length > 0) || hearing.nextHearingDate ? (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Hearing Timeline</h2>
              <div className="space-y-6">
                {/* Previous Hearings */}
                {hearing.timeline && hearing.timeline.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                      {index < hearing.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                      <p className={`text-xs font-semibold inline-block px-2 py-0.5 rounded mt-1 ${getStatusColor(item.status)}`}>
                        {item.status}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{item.remarks}</p>
                    </div>
                  </div>
                ))}
                {/* Current Hearing */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    {hearing.nextHearingDate && (
                      <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(hearing.hearingDate).toLocaleDateString()} (Current)
                    </p>
                    <p className={`text-xs font-semibold inline-block px-2 py-0.5 rounded mt-1 ${getStatusColor(hearing.status)}`}>
                      {hearing.status}
                    </p>
                    {hearing.remarks && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{hearing.remarks}</p>
                    )}
                  </div>
                </div>
                {/* Next Hearing */}
                {hearing.nextHearingDate && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {new Date(hearing.nextHearingDate).toLocaleDateString()} (Next)
                      </p>
                      <p className="text-xs font-semibold inline-block px-2 py-0.5 rounded mt-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                        Scheduled
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Edit Hearing Modal */}
      {isModalOpen && (
        <HearingModal
          hearing={hearing}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            loadHearing();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const HearingModal = ({ hearing, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    hearing || {
      caseNumber: '',
      caseTitle: '',
      court: '',
      judge: '',
      client: '',
      oppositeParty: '',
      hearingDate: new Date().toISOString().split('T')[0],
      nextHearingDate: '',
      status: 'Scheduled',
      remarks: '',
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (hearing) {
        await hearingService.updateHearing(hearing.id, formData);
        toast.success('Hearing updated');
      } else {
        await hearingService.createHearing(formData);
        toast.success('Hearing added');
      }
      onSave();
    } catch (err) {
      toast.error('Failed to save hearing');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {hearing ? 'Edit Hearing' : 'Add Hearing'}
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
                Case Number
              </label>
              <input
                type="text"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Court
              </label>
              <input
                type="text"
                value={formData.court}
                onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Judge
              </label>
              <input
                type="text"
                value={formData.judge}
                onChange={(e) => setFormData({ ...formData, judge: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              >
                {statusTypes.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Client
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Opposite Party
              </label>
              <input
                type="text"
                value={formData.oppositeParty}
                onChange={(e) => setFormData({ ...formData, oppositeParty: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hearing Date
              </label>
              <input
                type="date"
                value={formData.hearingDate}
                onChange={(e) => setFormData({ ...formData, hearingDate: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
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
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={4}
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
              {hearing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HearingDetails;

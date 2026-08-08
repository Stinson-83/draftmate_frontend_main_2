import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { caseService } from '../../services/library/caseService';
import { trackingService } from '../../services/library/trackingService';
import { caseTypes, statusTypes, priorityTypes } from '../../data/mockCases';

const CaseDetails = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadCase = useCallback(async () => {
    try {
      const data = await caseService.getCaseById(caseId);
      setCaseData(data);
    } catch {
      toast.error('Failed to load case');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      try {
        await caseService.deleteCase(caseId);
        toast.success('Case deleted');
        navigate('/dashboard/library/cases');
      } catch {
        toast.error('Failed to delete case');
      }
    }
  };

  // Mock data for tabs
  const mockHearings = [
    { id: 'h-1', date: '2024-07-15', time: '10:00', court: 'Bombay High Court', judge: 'Hon. Justice A.K. Desai', status: 'Scheduled' },
    { id: 'h-2', date: '2024-06-20', time: '14:30', court: 'Bombay High Court', judge: 'Hon. Justice A.K. Desai', status: 'Completed' }
  ];

  const mockNotes = [
    { id: 'note-1', date: '2024-06-18', content: 'Discussed strategy with client. Need to file additional affidavit.' },
    { id: 'note-2', date: '2024-06-10', content: 'Reviewed case law. Found favorable precedents.' }
  ];

  const mockTimeline = [
    { id: 'tl-1', date: '2024-01-15', event: 'Case Filed', description: 'Petition filed in Bombay High Court' },
    { id: 'tl-2', date: '2024-02-20', event: 'First Hearing', description: 'Notice issued to respondents' },
    { id: 'tl-3', date: '2024-05-10', event: 'Reply Filed', description: 'Counter affidavit submitted' },
    { id: 'tl-4', date: '2024-06-20', event: 'Hearing', description: 'Arguments heard, order reserved' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'In Progress': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Hearing Scheduled': return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Adjourned': return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Closed': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'Archived': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'Medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'High': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 h-full flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6 md:p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-slate-400 text-3xl">gavel</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Case not found</h3>
          <Link
            to="/dashboard/library/cases"
            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Cases
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
                to="/dashboard/library/cases"
                className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{caseData.caseTitle}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(caseData.status)}`}>
                {caseData.status}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(caseData.priority)}`}>
                {caseData.priority}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {caseData.caseType}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{caseData.caseNumber}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsTrackModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
            >
              <span className="material-symbols-outlined">track_changes</span>
              Track Case
            </button>
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
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-1 overflow-x-auto">
          {[
            { id: 'overview', icon: 'info', label: 'Overview' },
            { id: 'hearings', icon: 'event', label: 'Hearings' },
            { id: 'notes', icon: 'edit_note', label: 'Notes' },
            { id: 'timeline', icon: 'timeline', label: 'Timeline' },
            { id: 'client', icon: 'person', label: 'Client' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Case Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Court</p>
                    <p className="text-slate-900 dark:text-white">{caseData.court}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Filing Date</p>
                    <p className="text-slate-900 dark:text-white">{new Date(caseData.filingDate).toLocaleDateString()}</p>
                  </div>
                  {caseData.nextHearingDate && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Next Hearing</p>
                      <p className="text-slate-900 dark:text-white">{new Date(caseData.nextHearingDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {caseData.assignedAdvocate && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Assigned Advocate</p>
                      <p className="text-slate-900 dark:text-white">{caseData.assignedAdvocate}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Parties</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Client</p>
                    <p className="text-slate-900 dark:text-white">{caseData.client}</p>
                  </div>
                  {caseData.oppositeParty && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Opposite Party</p>
                      <p className="text-slate-900 dark:text-white">{caseData.oppositeParty}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {caseData.description && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Description</h3>
                <p className="text-slate-700 dark:text-slate-300">{caseData.description}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hearings' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hearings</h3>
              <Link
                to="/dashboard/library/hearings"
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-lg">visibility</span>
                View All
              </Link>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {mockHearings.map((h) => (
                <div key={h.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-lg">event</span>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                          {new Date(h.date).toLocaleDateString()} at {h.time}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{h.court}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{h.judge}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      h.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notes</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90">
                <span className="material-symbols-outlined text-lg">add</span>
                Add Note
              </button>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {mockNotes.map((note) => (
                <div key={note.id} className="p-6">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {new Date(note.date).toLocaleDateString()}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Case Timeline</h3>
            <div className="space-y-6">
              {mockTimeline.map((item, index) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-primary"></div>
                    {index < mockTimeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{item.event}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'client' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Client Details</h3>
                <Link
                  to="/dashboard/library/clients"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <span className="material-symbols-outlined text-lg">visibility</span>
                  View Client
                </Link>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Name</p>
                  <p className="text-slate-900 dark:text-white">{caseData.client}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <CaseModal
          caseData={caseData}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            loadCase();
            setIsModalOpen(false);
          }}
        />
      )}

      {/* Track Case Modal */}
      {isTrackModalOpen && (
        <CaseTrackingModal
          caseData={caseData}
          onClose={() => setIsTrackModalOpen(false)}
          onSave={() => {
            setIsTrackModalOpen(false);
            toast.success('Case added to tracking');
            navigate('/dashboard/library/case-tracking');
          }}
        />
      )}
    </div>
  );
};

// Case Tracking Modal Component (from Case Details)
const CaseTrackingModal = ({ caseData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    cnrNumber: '',
    caseNumber: caseData?.caseNumber || '',
    caseTitle: caseData?.caseTitle || '',
    courtEstablishment: caseData?.court || '',
    caseStage: '',
    lastUpdated: new Date().toISOString().split('T')[0],
    nextHearingDate: caseData?.nextHearingDate || '',
    nextHearingTime: '',
    latestOrder: '',
    latestProceeding: '',
    caseId: caseData?.id || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await trackingService.createTrackedCase(formData);
      onSave();
    } catch {
      toast.error('Failed to add case to tracking');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Track This Case</h2>
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
              Track Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Case Modal Component
const CaseModal = ({ caseData, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    caseData || {
      caseNumber: '',
      caseTitle: '',
      caseType: 'Civil',
      court: '',
      client: '',
      oppositeParty: '',
      filingDate: new Date().toISOString().split('T')[0],
      nextHearingDate: '',
      status: 'Open',
      priority: 'Medium',
      assignedAdvocate: '',
      description: ''
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (caseData) {
        await caseService.updateCase(caseData.id, formData);
        toast.success('Case updated');
      } else {
        await caseService.createCase(formData);
        toast.success('Case added');
      }
      onSave();
    } catch {
      toast.error('Failed to save case');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {caseData ? 'Edit Case' : 'Add Case'}
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
                Case Number *
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
                Court *
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
              Case Title *
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
                Case Type
              </label>
              <select
                value={formData.caseType}
                onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                {caseTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                {statusTypes.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Client *
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
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Filing Date
              </label>
              <input
                type="date"
                value={formData.filingDate}
                onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                {priorityTypes.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assigned Advocate
              </label>
              <input
                type="text"
                value={formData.assignedAdvocate}
                onChange={(e) => setFormData({ ...formData, assignedAdvocate: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {caseData ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseDetails;

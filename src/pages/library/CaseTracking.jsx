import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { trackingService } from '../../services/library/trackingService';
import { ecourtsService } from '../../services/library/ecourtsService';
import { hearingService } from '../../services/library/hearingService';

const CaseTracking = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [isCNRSearchModalOpen, setIsCNRSearchModalOpen] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const loadTrackedCases = useCallback(async () => {
    try {
      const data = await trackingService.getTrackedCases();
      setCases(data);
    } catch {
      toast.error('Failed to load tracked cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrackedCases();
  }, [loadTrackedCases]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to stop tracking this case?')) {
      try {
        await trackingService.deleteTrackedCase(id);
        toast.success('Case tracking removed');
        loadTrackedCases();
      } catch {
        toast.error('Failed to remove case tracking');
      }
    }
  };

  const handleCNRSearch = async (formData) => {
    setSearchLoading(true);
    try {
      const result = await ecourtsService.searchByCNR(formData.cnrNumber);
      setSearchResult(result);
    } catch {
      toast.error('Failed to search for CNR number');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleImport = async () => {
    if (!searchResult) return;
    
    try {
      // Import to tracking
      await trackingService.createTrackedCase({
        cnrNumber: searchResult.cnrNumber,
        caseNumber: searchResult.caseNumber,
        caseTitle: searchResult.caseTitle,
        courtEstablishment: searchResult.courtEstablishment,
        caseStage: searchResult.caseStage,
        lastUpdated: searchResult.lastUpdated,
        nextHearingDate: searchResult.nextHearingDate,
        nextHearingTime: searchResult.nextHearingTime,
        latestOrder: searchResult.latestOrder?.title || '',
        latestProceeding: searchResult.latestProceeding || ''
      });
      
      // Import to hearings
      const hearings = await ecourtsService.fetchHearings(searchResult.cnrNumber);
      for (const hearing of hearings) {
        await hearingService.createHearing({
          caseNumber: searchResult.caseNumber,
          caseTitle: searchResult.caseTitle,
          court: searchResult.court,
          date: hearing.date,
          time: hearing.time,
          judge: hearing.judge,
          status: hearing.status
        });
      }

      toast.success('Case imported successfully!');
      setSearchResult(null);
      setIsCNRSearchModalOpen(false);
      loadTrackedCases();
    } catch {
      toast.error('Failed to import case');
    }
  };

  const getStats = () => {
    const tracked = cases.length;
    const recentlyUpdated = cases.filter(c => new Date(c.lastUpdated) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
    const upcomingHearings = cases.filter(c => c.nextHearingDate).length;
    const ordersReceived = cases.filter(c => c.latestOrder).length;
    return { tracked, recentlyUpdated, upcomingHearings, ordersReceived };
  };

  const stats = getStats();

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Case Tracking</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track cases with e-Courts integration readiness
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setSearchResult(null);
                setIsCNRSearchModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined">search</span>
              Track By CNR Number
            </button>
            <button
              onClick={() => {
                setEditingCase(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined">track_changes</span>
              Track Case
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-500">track_changes</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tracked Cases</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.tracked}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-500">update</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Recently Updated</p>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.recentlyUpdated}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-purple-500">event</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming Hearings</p>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.upcomingHearings}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-green-500">description</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Orders Received</p>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.ordersReceived}</p>
          </div>
        </div>

        {/* Tracked Cases List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : cases.length > 0 ? (
          <div className="space-y-4">
            {cases.map((c) => (
              <div
                key={c.id}
                className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 transition-colors"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      to={`/dashboard/library/case-tracking/${c.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                          {c.cnrNumber}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                          {c.caseStage}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{c.caseTitle}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{c.courtEstablishment}</p>
                    </Link>

                    {/* Placeholder Status Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Case Status</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.caseStage}</p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-500 dark:text-blue-400">Next Hearing</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {c.nextHearingDate ? `${new Date(c.nextHearingDate).toLocaleDateString()} at ${c.nextHearingTime}` : 'Not scheduled'}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-green-500 dark:text-green-400">Latest Order</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{c.latestOrder}</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-xs text-purple-500 dark:text-purple-400">Latest Proceeding</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{c.latestProceeding}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center md:items-start">
                    <Link
                      to={`/dashboard/library/case-tracking/${c.id}`}
                      className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </Link>
                    <button
                      onClick={() => {
                        setEditingCase(c);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-amber-500 text-3xl">track_changes</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No tracked cases</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Start tracking your first case</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <CaseTrackingModal
          trackingCase={editingCase}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCase(null);
          }}
          onSave={() => {
            loadTrackedCases();
            setIsModalOpen(false);
            setEditingCase(null);
          }}
        />
      )}

      {/* CNR Search Modal */}
      {isCNRSearchModalOpen && (
        <CNRSearchModal
          isLoading={searchLoading}
          searchResult={searchResult}
          onSearch={handleCNRSearch}
          onImport={handleImport}
          onClose={() => {
            setIsCNRSearchModalOpen(false);
            setSearchResult(null);
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

// CNR Search Modal Component
const CNRSearchModal = ({ isLoading, searchResult, onSearch, onImport, onClose }) => {
  const [formData, setFormData] = useState({
    cnrNumber: '',
    courtType: 'High Court',
    state: 'Maharashtra',
    district: 'Mumbai'
  });

  const courtTypes = ['Supreme Court', 'High Court', 'District Court', 'Family Court', 'Labour Court'];
  const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
  const districts = ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSearch(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Track By CNR Number</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {!searchResult ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Court Type
                </label>
                <select
                  value={formData.courtType}
                  onChange={(e) => setFormData({ ...formData, courtType: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                >
                  {courtTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                >
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  District
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                >
                  {districts.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
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
                disabled={isLoading}
                className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">search</span>
                )}
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{searchResult.caseTitle}</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  {searchResult.cnrNumber}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  {searchResult.caseStage}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {searchResult.caseType}
                </span>
              </div>
            </div>

            {/* Case Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400">Case Status</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{searchResult.caseStage}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400">Petitioner</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{searchResult.petitioner}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400">Respondent</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{searchResult.respondent}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400">Court</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{searchResult.court}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-500 dark:text-blue-400">Next Hearing</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {searchResult.nextHearingDate ? `${new Date(searchResult.nextHearingDate).toLocaleDateString()} at ${searchResult.nextHearingTime}` : 'Not scheduled'}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-green-500 dark:text-green-400">Latest Order</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{searchResult.latestOrder?.title}</p>
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-6">
              <p className="text-xs text-purple-500 dark:text-purple-400">Latest Proceeding</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{searchResult.latestProceeding}</p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSearchResult(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Search Another
              </button>
              <button
                onClick={onImport}
                className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">download</span>
                Import To DraftMate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseTracking;

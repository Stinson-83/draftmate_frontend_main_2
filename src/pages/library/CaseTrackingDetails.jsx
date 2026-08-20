import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit2, Trash2, ShieldAlert, FolderOpen, Activity, Clock, Circle, CheckCircle2, FileText, Calendar, ExternalLink } from 'lucide-react';
import { trackingService } from '../../services/library/trackingService';

const CaseTrackingDetails = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [trackingCase, setTrackingCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTrackedCase = useCallback(async () => {
    try {
      setLoading(true);
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
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!trackingCase) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tracking Not Found</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md text-center">
          The case you are trying to view does not exist or you don't have permission to access it.
        </p>
        <Link to="/dashboard/library/case-tracking" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm hover:shadow-md">
          Back to Case Tracking
        </Link>
      </div>
    );
  }

  const getStatusColor = (stage) => {
    const s = stage?.toLowerCase() || '';
    if (s.includes('pending') || s.includes('hearing')) return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20';
    if (s.includes('disposed') || s.includes('closed')) return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
    if (s.includes('order')) return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20';
    return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20';
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900/50 pb-12">
      {/* Premium Header Workspace */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Link to="/dashboard/library/case-tracking" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Case Tracking
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {trackingCase.cnrNumber && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    CNR: {trackingCase.cnrNumber}
                  </span>
                )}
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider border ${getStatusColor(trackingCase.caseStage)}`}>
                  {trackingCase.caseStage || 'STAGE UNKNOWN'}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {trackingCase.caseNumber}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-3">
                {trackingCase.caseTitle}
              </h1>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <ShieldAlert className="w-4 h-4" />
                <span className="font-medium">{trackingCase.courtEstablishment || 'Court not specified'}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all font-medium shadow-sm hover:shadow">
                <Edit2 className="w-4 h-4" />
                <span>Edit Case</span>
              </button>
              <button onClick={handleDelete} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all font-medium shadow-sm hover:shadow">
                <Trash2 className="w-4 h-4" />
                <span>Stop Tracking</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 mt-8">
        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <MetricCard 
            title="Current Status" 
            value={trackingCase.caseStage} 
            icon={<Activity className="w-5 h-5 text-indigo-500" />} 
            bgClass="bg-indigo-500/10" 
          />
          <MetricCard 
            title="Next Hearing" 
            value={trackingCase.nextHearingDate ? new Date(trackingCase.nextHearingDate).toLocaleDateString() : 'Not scheduled'} 
            subtitle={trackingCase.nextHearingTime && `at ${trackingCase.nextHearingTime}`}
            icon={<Calendar className="w-5 h-5 text-amber-500" />} 
            bgClass="bg-amber-500/10" 
          />
          <MetricCard 
            title="Latest Order" 
            value={trackingCase.latestOrder || 'No orders'} 
            icon={<FileText className="w-5 h-5 text-emerald-500" />} 
            bgClass="bg-emerald-500/10" 
          />
          <MetricCard 
            title="Last Updated" 
            value={new Date(trackingCase.lastUpdated).toLocaleDateString()} 
            icon={<Clock className="w-5 h-5 text-blue-500" />} 
            bgClass="bg-blue-500/10" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Workspace Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Timeline Workspace */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Case Timeline & Proceedings</h3>
              </div>
              <div className="p-6 md:p-8">
                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-12">
                  
                  {/* Latest Proceeding */}
                  <div className="relative pl-8">
                    <div className="absolute -left-[17px] top-1 w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-800 shadow-sm">
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{new Date(trackingCase.lastUpdated).toLocaleDateString()}</div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">Latest Proceeding</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {trackingCase.latestProceeding || 'No proceeding notes available.'}
                      </p>
                    </div>
                  </div>

                  {/* Hearing */}
                  {trackingCase.nextHearingDate && (
                    <div className="relative pl-8">
                      <div className="absolute -left-[17px] top-1 w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-800 shadow-sm">
                        <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Scheduled</div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">Upcoming Hearing</h4>
                        <p className="text-slate-600 dark:text-slate-300">
                          Scheduled for <span className="font-semibold text-slate-900 dark:text-white">{new Date(trackingCase.nextHearingDate).toLocaleDateString()}</span> at <span className="font-semibold text-slate-900 dark:text-white">{trackingCase.nextHearingTime || 'TBD'}</span>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Initial Filing */}
                  <div className="relative pl-8">
                    <div className="absolute -left-[17px] top-1 w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-800 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Origin</div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Case Registered / Tracked</h4>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-medium transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                    <span>View Case Documents</span>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-medium transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <span>Generate Cause List</span>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>

            {/* Future Readiness */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 p-6">
              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">Automated Tracking</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                This workspace is future-ready. Soon, DraftMate will automatically sync cause lists, orders, and judgements directly from e-Courts in real-time.
              </p>
              <div className="w-full bg-white dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></div>
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">Integration rolling out soon</p>
            </div>

          </div>
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

const MetricCard = ({ title, value, subtitle, icon, bgClass }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bgClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1" title={value}>{value || '-'}</p>
        {subtitle && <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const CaseTrackingModal = ({ trackingCase, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    trackingCase || {
      cnrNumber: '', caseNumber: '', caseTitle: '', courtEstablishment: '',
      caseStage: '', lastUpdated: new Date().toISOString().split('T')[0],
      nextHearingDate: '', nextHearingTime: '', latestOrder: '', latestProceeding: ''
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

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all";
  const labelClasses = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {trackingCase ? 'Update Case Details' : 'Track New Case'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Fill in the case metadata manually.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-8 flex-1">
          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">
                <FolderOpen className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Case Identification</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={labelClasses}>Case Title <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.caseTitle} onChange={(e) => setFormData({...formData, caseTitle: e.target.value})} className={inputClasses} required placeholder="e.g. State vs John Doe" />
                </div>
                <div>
                  <label className={labelClasses}>CNR Number</label>
                  <input type="text" value={formData.cnrNumber} onChange={(e) => setFormData({...formData, cnrNumber: e.target.value})} className={inputClasses} placeholder="e.g. DL2501000000012024" />
                </div>
                <div>
                  <label className={labelClasses}>Case Number</label>
                  <input type="text" value={formData.caseNumber} onChange={(e) => setFormData({...formData, caseNumber: e.target.value})} className={inputClasses} placeholder="e.g. Crl. Appeal 45/2024" />
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Court Details</h3>
              </div>
              <div>
                <label className={labelClasses}>Court Establishment</label>
                <input type="text" value={formData.courtEstablishment} onChange={(e) => setFormData({...formData, courtEstablishment: e.target.value})} className={inputClasses} placeholder="e.g. High Court of Delhi, Principal Bench" />
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Status & Schedule</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClasses}>Current Stage</label>
                  <input type="text" value={formData.caseStage} onChange={(e) => setFormData({...formData, caseStage: e.target.value})} className={inputClasses} placeholder="e.g. Final Hearing" />
                </div>
                <div>
                  <label className={labelClasses}>Next Hearing Date</label>
                  <input type="date" value={formData.nextHearingDate} onChange={(e) => setFormData({...formData, nextHearingDate: e.target.value})} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Next Hearing Time</label>
                  <input type="time" value={formData.nextHearingTime} onChange={(e) => setFormData({...formData, nextHearingTime: e.target.value})} className={inputClasses} />
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Latest Updates</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>Latest Order Summary</label>
                  <textarea value={formData.latestOrder} onChange={(e) => setFormData({...formData, latestOrder: e.target.value})} rows={2} className={inputClasses} placeholder="Summarize the latest order..." />
                </div>
                <div>
                  <label className={labelClasses}>Latest Proceeding Notes</label>
                  <textarea value={formData.latestProceeding} onChange={(e) => setFormData({...formData, latestProceeding: e.target.value})} rows={2} className={inputClasses} placeholder="What happened in the last hearing?" />
                </div>
              </div>
            </section>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
            {trackingCase ? 'Save Changes' : 'Start Tracking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseTrackingDetails;

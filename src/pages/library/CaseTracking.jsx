import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, RefreshCw, Plus, Crosshair, ChevronRight, CheckCircle2, Circle, Clock, FileText, Calendar, MoreVertical, Trash2, Edit2, Activity, ShieldAlert, FolderOpen } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();

  const loadTrackedCases = useCallback(async () => {
    try {
      setLoading(true);
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
      if (result) {
         setSearchResult(result);
      } else {
         toast.error("No case found with that CNR number.");
      }
    } catch {
      toast.error('Failed to search for CNR number');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleImport = async () => {
    if (!searchResult) return;
    try {
      await trackingService.createTrackedCase({
        cnrNumber: searchResult.cnrNumber,
        caseNumber: searchResult.caseNumber,
        caseTitle: searchResult.caseTitle,
        courtEstablishment: searchResult.courtEstablishment,
        caseStage: searchResult.caseStage,
        lastUpdated: searchResult.lastUpdated || new Date().toISOString().split('T')[0],
        nextHearingDate: searchResult.nextHearingDate,
        nextHearingTime: searchResult.nextHearingTime,
        latestOrder: searchResult.latestOrder?.title || '',
        latestProceeding: searchResult.latestProceeding || ''
      });
      
      const hearings = await ecourtsService.fetchHearings(searchResult.cnrNumber);
      if(hearings) {
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
  
  const filteredCases = cases.filter(c => 
    c.caseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.cnrNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900/50 pb-12">
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Link to="/dashboard/library" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Case Tracking</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg leading-relaxed">
                Monitor all your court cases, hearings, orders, and case progress from one intelligent workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadTrackedCases}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all font-medium shadow-sm hover:shadow"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  setSearchResult(null);
                  setIsCNRSearchModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all font-medium shadow-sm hover:shadow"
              >
                <Crosshair className="w-4 h-4" />
                <span>Track by CNR</span>
              </button>
              <button
                onClick={() => {
                  setEditingCase(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Track New Case</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 mt-8">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard 
            title="Active Cases" 
            value={stats.tracked} 
            icon={<FolderOpen className="w-6 h-6 text-blue-500" />} 
            trend="+2 this week" 
            trendUp={true} 
            bgClass="bg-blue-500/10" 
          />
          <StatCard 
            title="Upcoming Hearings" 
            value={stats.upcomingHearings} 
            icon={<Calendar className="w-6 h-6 text-indigo-500" />} 
            trend="Next in 2 days" 
            trendUp={true} 
            bgClass="bg-indigo-500/10" 
          />
          <StatCard 
            title="Orders Received" 
            value={stats.ordersReceived} 
            icon={<FileText className="w-6 h-6 text-emerald-500" />} 
            trend="3 new orders" 
            trendUp={true} 
            bgClass="bg-emerald-500/10" 
          />
          <StatCard 
            title="Recently Updated" 
            value={stats.recentlyUpdated} 
            icon={<Activity className="w-6 h-6 text-amber-500" />} 
            trend="In last 7 days" 
            trendUp={true} 
            bgClass="bg-amber-500/10" 
          />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by CNR, Case Number, or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm group-focus-within:shadow-md"
            />
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-medium transition-colors shadow-sm">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Case List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <CaseCardSkeleton key={i} />)}
          </div>
        ) : filteredCases.length > 0 ? (
          <div className="space-y-6">
            {filteredCases.map(c => (
              <CaseCard 
                key={c.id} 
                caseData={c} 
                onEdit={() => { setEditingCase(c); setIsModalOpen(true); }}
                onDelete={() => handleDelete(c.id)}
                onClick={() => navigate(`/dashboard/library/case-tracking/${c.id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            onTrackNew={() => { setEditingCase(null); setIsModalOpen(true); }} 
            onTrackCNR={() => { setSearchResult(null); setIsCNRSearchModalOpen(true); }} 
          />
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <CaseTrackingModal
          trackingCase={editingCase}
          onClose={() => { setIsModalOpen(false); setEditingCase(null); }}
          onSave={() => { loadTrackedCases(); setIsModalOpen(false); setEditingCase(null); }}
        />
      )}
      {isCNRSearchModalOpen && (
        <CNRSearchModal
          isLoading={searchLoading}
          searchResult={searchResult}
          onSearch={handleCNRSearch}
          onImport={handleImport}
          onClose={() => { setIsCNRSearchModalOpen(false); setSearchResult(null); }}
        />
      )}
    </div>
  );
};

// Subcomponents

const StatCard = ({ title, value, icon, trend, trendUp, bgClass }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${bgClass} transition-transform group-hover:scale-110 duration-300`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-red-50 text-red-600 dark:bg-red-500/10'}`}>
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const CaseCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="h-6 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
      <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
    </div>
    <div className="h-16 w-full bg-slate-100 dark:bg-slate-700/50 rounded-xl mt-6"></div>
  </div>
);

const EmptyState = ({ onTrackNew, onTrackCNR }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
      <FolderOpen className="w-12 h-12 text-blue-500" />
    </div>
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No Tracked Cases Yet</h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-lg">
      Start tracking your first case using a CNR number or enter the details manually to keep all proceedings organized.
    </p>
    <div className="flex flex-col sm:flex-row gap-4">
      <button onClick={onTrackNew} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
        Track New Case
      </button>
      <button onClick={onTrackCNR} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
        Track by CNR
      </button>
    </div>
  </div>
);

const CaseCard = ({ caseData, onEdit, onDelete, onClick }) => {
  const getStatusColor = (stage) => {
    const s = stage?.toLowerCase() || '';
    if (s.includes('pending') || s.includes('hearing')) return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20';
    if (s.includes('disposed') || s.includes('closed')) return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
    if (s.includes('order')) return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20';
    return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20';
  };

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700/50 transition-all duration-300 overflow-hidden cursor-pointer" onClick={onClick}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {caseData.cnrNumber && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 tracking-wider">
                  CNR: {caseData.cnrNumber}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(caseData.caseStage)} tracking-wide`}>
                {caseData.caseStage || 'Unknown Stage'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {caseData.caseTitle}
            </h2>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>{caseData.courtEstablishment || 'Court not specified'}</span>
              <span className="mx-2">•</span>
              <span>{caseData.caseNumber}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button onClick={onEdit} className="p-2.5 text-slate-400 hover:text-blue-600 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2.5 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline Preview */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="flex-1 relative">
              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-col items-start z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center mb-2 ring-4 ring-slate-50 dark:ring-slate-900/50">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">Filed</span>
                  <span className="text-xs text-slate-500">{new Date(caseData.lastUpdated).toLocaleDateString()}</span>
                </div>
                <div className="flex-1 h-0.5 bg-emerald-500 mx-2 -mt-6"></div>
                <div className="flex flex-col items-center z-10">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mb-2 ring-4 ring-slate-50 dark:ring-slate-900/50 shadow-sm">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">Current</span>
                  <span className="text-xs text-slate-500 max-w-[80px] text-center truncate">{caseData.caseStage}</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2 -mt-6"></div>
                <div className="flex flex-col items-end z-10">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-2 ring-4 ring-slate-50 dark:ring-slate-900/50">
                    <Circle className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="font-medium text-slate-500 dark:text-slate-400">Next Hearing</span>
                  <span className="text-xs text-slate-500">
                    {caseData.nextHearingDate ? new Date(caseData.nextHearingDate).toLocaleDateString() : 'TBD'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
            
            <div className="md:w-1/3 flex flex-col gap-2">
              {caseData.latestOrder ? (
                <div className="flex gap-3 items-start">
                  <FileText className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Latest Order</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">{caseData.latestOrder}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 items-start opacity-50">
                  <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Latest Order</p>
                    <p className="text-sm text-slate-500">No orders uploaded yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modals

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
            {/* Section 1 */}
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

            {/* Section 2 */}
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

            {/* Section 3 */}
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

            {/* Section 4 */}
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

const CNRSearchModal = ({ isLoading, searchResult, onSearch, onImport, onClose }) => {
  const [cnrInput, setCnrInput] = useState('');
  const [step, setStep] = useState(1);
  
  const handleNext = (e) => {
    e.preventDefault();
    if(step === 1 && cnrInput) {
      setStep(2);
      onSearch({ cnrNumber: cnrInput });
    }
  };

  useEffect(() => {
    if(searchResult) setStep(3);
  }, [searchResult]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Wizard Header */}
        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Crosshair className="w-6 h-6 text-indigo-500" />
              Smart CNR Import
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full -z-10"></div>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full -z-10 transition-all duration-500`} style={{width: step===1 ? '0%' : step===2 ? '50%' : '100%'}}></div>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>2</div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>3</div>
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
            <span>Enter CNR</span>
            <span>Fetching Data</span>
            <span>Confirm & Import</span>
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <form onSubmit={handleNext} className="animate-in fade-in zoom-in-95">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Enter CNR Number</h3>
              <p className="text-slate-500 mb-8">DraftMate will automatically fetch court, judge, and hearing details from e-Courts.</p>
              
              <div className="relative">
                <input
                  type="text"
                  value={cnrInput}
                  onChange={e => setCnrInput(e.target.value)}
                  className="w-full pl-6 pr-16 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-lg font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all uppercase"
                  placeholder="e.g. DL2501000000012024"
                  required
                  autoFocus
                />
                <button type="submit" className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                <Crosshair className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connecting to e-Courts...</h3>
              <p className="text-slate-500">Retrieving case metadata, orders, and hearing schedule.</p>
            </div>
          )}

          {step === 3 && searchResult && (
            <div className="animate-in fade-in slide-in-from-right-8">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 mb-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Case Found Successfully</h3>
                <p className="text-emerald-700 dark:text-emerald-400 font-medium">Ready to import to your workspace</p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 mb-8">
                <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-4">{searchResult.caseTitle}</h4>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <span className="block text-slate-500 mb-1">CNR Number</span>
                    <span className="font-semibold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{searchResult.cnrNumber}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Case Stage</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{searchResult.caseStage}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-500 mb-1">Court</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{searchResult.court}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 py-4 text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">
                  Search Another
                </button>
                <button onClick={onImport} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
                  <FolderOpen className="w-5 h-5" />
                  Import to DraftMate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseTracking;

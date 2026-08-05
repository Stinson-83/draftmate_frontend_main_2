import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { caseService } from '../../services/library/caseService';
import { caseTypes, statusTypes, priorityTypes } from '../../data/mockCases';

const Cases = () => {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);

  const loadCases = useCallback(async () => {
    try {
      const data = await caseService.getCases();
      // Filter out internal system containers and document folders from legal cases view
      const realCases = (data || []).filter(c => 
        c.caseNumber !== 'GEN-0001' && 
        c.caseTitle !== 'General Documents' && 
        c.caseType !== 'Folder' &&
        !c.caseNumber?.startsWith('DIR-') &&
        !c.caseNumber?.startsWith('FLD-')
      );
      setCases(realCases);
      setFilteredCases(realCases);
    } catch {
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const q = query.toLowerCase();
    const filtered = cases.filter(c =>
      c.caseNumber.toLowerCase().includes(q) ||
      c.caseTitle.toLowerCase().includes(q) ||
      c.client.toLowerCase().includes(q) ||
      c.court.toLowerCase().includes(q)
    );
    setFilteredCases(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      try {
        await caseService.deleteCase(id);
        toast.success('Case deleted');
        loadCases();
      } catch {
        toast.error('Failed to delete case');
      }
    }
  };

  const getStats = () => {
    const total = cases.length;
    const active = cases.filter(c => !['Closed', 'Archived'].includes(c.status)).length;
    const closed = cases.filter(c => c.status === 'Closed' || c.status === 'Archived').length;
    const highPriority = cases.filter(c => c.priority === 'High' || c.priority === 'Urgent').length;
    return { total, active, closed, highPriority };
  };

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

  const stats = getStats();

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cases</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Central case management for all your matters
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCase(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">add</span>
            Add Case
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Cases</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Active Cases</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.active}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Closed Cases</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.closed}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">High Priority</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.highPriority}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search cases by case number, title, client, or court..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : filteredCases.length > 0 ? (
          <div className="space-y-4">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-colors"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(c.priority)}`}>
                        {c.priority}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {c.caseType}
                      </span>
                    </div>
                    <Link
                      to={`/dashboard/library/cases/${c.id}`}
                      className="block"
                    >
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {c.caseTitle}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{c.caseNumber}</p>
                    </Link>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Client: </span>
                        <span className="text-slate-900 dark:text-white">{c.client}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Court: </span>
                        <span className="text-slate-900 dark:text-white">{c.court}</span>
                      </div>
                      {c.nextHearingDate && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Next Hearing: </span>
                          <span className="text-slate-900 dark:text-white">{new Date(c.nextHearingDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center md:items-start">
                    <Link
                      to={`/dashboard/library/cases/${c.id}`}
                      className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </Link>
                    <button
                      onClick={() => {
                        setEditingCase(c);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
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
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-slate-400 text-3xl">gavel</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {searchQuery ? 'No cases found' : 'No cases yet'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {searchQuery ? 'Try a different search term' : 'Add your first case to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <CaseModal
          caseData={editingCase}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCase(null);
          }}
          onSave={() => {
            loadCases();
            setIsModalOpen(false);
            setEditingCase(null);
          }}
        />
      )}
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

export default Cases;

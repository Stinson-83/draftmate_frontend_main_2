import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { hearingService } from '../../services/library/hearingService';
import { statusTypes } from '../../data/mockHearings';

const Hearings = () => {
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);

  useEffect(() => {
    loadHearings();
  }, []);

  const loadHearings = async () => {
    try {
      const data = await hearingService.getHearings();
      setHearings(data);
    } catch (err) {
      toast.error('Failed to load hearings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hearing?')) {
      try {
        await hearingService.deleteHearing(id);
        toast.success('Hearing deleted');
        loadHearings();
      } catch (err) {
        toast.error('Failed to delete hearing');
      }
    }
  };

  const filterHearings = (type) => {
    const today = new Date().toISOString().split('T')[0];
    switch (type) {
      case 'today':
        return hearings.filter(h => h.hearingDate === today);
      case 'upcoming':
        return hearings.filter(h => h.hearingDate > today && h.status === 'Scheduled');
      case 'completed':
        return hearings.filter(h => h.status === 'Completed');
      case 'missed':
        return hearings.filter(h => h.status === 'Missed');
      default:
        return hearings;
    }
  };

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      today: hearings.filter(h => h.hearingDate === today).length,
      upcoming: hearings.filter(h => h.hearingDate > today && h.status === 'Scheduled').length,
      completed: hearings.filter(h => h.status === 'Completed').length,
      adjourned: hearings.filter(h => h.status === 'Adjourned').length,
    };
  };

  const stats = getStats();
  const todayHearings = filterHearings('today');
  const upcomingHearings = filterHearings('upcoming');
  const completedHearings = filterHearings('completed');
  const missedHearings = filterHearings('missed');

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

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hearing Tracker</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your hearings and litigation timeline
            </p>
          </div>
          <button
            onClick={() => {
              setEditingHearing(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">add</span>
            Add Hearing
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Today's Hearings</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.today}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.upcoming}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Adjourned</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.adjourned}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Today's Hearings */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Today's Hearings</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
              </div>
            ) : todayHearings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {todayHearings.map(hearing => (
                  <HearingCard
                    key={hearing.id}
                    hearing={hearing}
                    onDelete={handleDelete}
                    onEdit={(h) => {
                      setEditingHearing(h);
                      setIsModalOpen(true);
                    }}
                    statusColor={getStatusColor}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No hearings today" sub="Enjoy your free time!" />
            )}
          </section>

          {/* Upcoming Hearings */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upcoming Hearings</h2>
            {upcomingHearings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcomingHearings.map(hearing => (
                  <HearingCard
                    key={hearing.id}
                    hearing={hearing}
                    onDelete={handleDelete}
                    onEdit={(h) => {
                      setEditingHearing(h);
                      setIsModalOpen(true);
                    }}
                    statusColor={getStatusColor}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No upcoming hearings scheduled" sub="Add a new hearing to get started" />
            )}
          </section>

          {/* Completed Hearings */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Completed Hearings</h2>
            {completedHearings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {completedHearings.map(hearing => (
                  <HearingCard
                    key={hearing.id}
                    hearing={hearing}
                    onDelete={handleDelete}
                    onEdit={(h) => {
                      setEditingHearing(h);
                      setIsModalOpen(true);
                    }}
                    statusColor={getStatusColor}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No completed hearings yet" sub="Complete your first hearing!" />
            )}
          </section>

          {/* Missed Hearings */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Missed Hearings</h2>
            {missedHearings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {missedHearings.map(hearing => (
                  <HearingCard
                    key={hearing.id}
                    hearing={hearing}
                    onDelete={handleDelete}
                    onEdit={(h) => {
                      setEditingHearing(h);
                      setIsModalOpen(true);
                    }}
                    statusColor={getStatusColor}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="Great job! No missed hearings" sub="Keep up the good work!" />
            )}
          </section>
        </div>
      </div>

      {/* Add/Edit Hearing Modal */}
      {isModalOpen && (
        <HearingModal
          hearing={editingHearing}
          onClose={() => {
            setIsModalOpen(false);
            setEditingHearing(null);
          }}
          onSave={() => {
            loadHearings();
            setIsModalOpen(false);
            setEditingHearing(null);
          }}
        />
      )}
    </div>
  );
};

const HearingCard = ({ hearing, onDelete, onEdit, statusColor }) => {
  return (
    <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-colors">
      <div className="flex justify-between items-start gap-2 mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(hearing.status)}`}>
          {hearing.status}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(hearing)}
            className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={() => onDelete(hearing.id)}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
      <Link
        to={`/dashboard/library/hearings/${hearing.id}`}
        className="block"
      >
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 line-clamp-2">
          {hearing.caseTitle}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{hearing.caseNumber}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Court:</span>
            <span className="ml-1 text-slate-900 dark:text-white">{hearing.court}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Judge:</span>
            <span className="ml-1 text-slate-900 dark:text-white">{hearing.judge}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Hearing:</span>
            <span className="ml-1 text-slate-900 dark:text-white">
              {new Date(hearing.hearingDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

const EmptyState = ({ message, sub }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
      <span className="material-symbols-outlined text-slate-400 text-3xl">gavel</span>
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{message}</h3>
    <p className="text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
  </div>
);

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

export default Hearings;

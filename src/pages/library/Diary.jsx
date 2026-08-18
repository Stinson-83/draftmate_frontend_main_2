import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { diaryService } from '../../services/library/diaryService';
import { diaryCategories } from '../../data/mockDiary';

const Diary = () => {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('Today');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await diaryService.getEntries();
      setEntries(data);
    } catch (err) {
      toast.error('Failed to load diary entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hearing entry?')) {
      try {
        await diaryService.deleteEntry(id);
        toast.success('Entry deleted');
        loadEntries();
      } catch (err) {
        toast.error('Failed to delete entry');
      }
    }
  };

  const getFilteredEntries = () => {
    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (filter) {
      case 'Today':
        return entries.filter(e => e.hearingDate === today);
      case 'This Week':
        return entries.filter(e => e.hearingDate >= today && e.hearingDate <= weekEnd);
      case 'Upcoming':
        return entries.filter(e => e.hearingDate >= today && e.status !== 'completed');
      case 'Completed':
        return entries.filter(e => e.status === 'completed');
      default:
        return entries;
    }
  };

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: entries.length,
      today: entries.filter(e => e.hearingDate === today).length,
      upcoming: entries.filter(e => e.hearingDate >= today && e.status !== 'completed').length,
      completed: entries.filter(e => e.status === 'completed').length,
    };
  };

  const filteredEntries = getFilteredEntries();
  const stats = getStats();

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Link to="/dashboard/library" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2563EB] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Client Management</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your hearings and case schedule
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEntry(null);
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Cases</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Today's Hearings</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.today}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming Hearings</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.upcoming}</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Completed Matters</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {diaryCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === cat
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-colors"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        {entry.court}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        entry.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {entry.caseTitle}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{entry.caseNumber}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Hearing: </span>
                        <span className="text-slate-900 dark:text-white">{new Date(entry.hearingDate).toLocaleDateString()}</span>
                      </div>
                      {entry.nextDate && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Next Date: </span>
                          <span className="text-slate-900 dark:text-white">{new Date(entry.nextDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Client: </span>
                        <span className="text-slate-900 dark:text-white">{entry.client}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Opposite: </span>
                        <span className="text-slate-900 dark:text-white">{entry.oppositeParty}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center md:items-start">
                    <Link
                      to={`/dashboard/library/diary/${entry.id}`}
                      className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </Link>
                    <button
                      onClick={() => {
                        setEditingEntry(entry);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
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
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-slate-400 text-3xl">event</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No entries found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Try selecting a different filter or add a new hearing entry
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <HearingModal
          entry={editingEntry}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
          }}
          onSave={() => {
            loadEntries();
            setIsModalOpen(false);
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
};

// Hearing Modal Component
const HearingModal = ({ entry, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    entry || {
      caseNumber: '',
      caseTitle: '',
      court: '',
      client: '',
      oppositeParty: '',
      hearingDate: new Date().toISOString().split('T')[0],
      nextDate: '',
      remarks: '',
      status: 'upcoming',
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (entry) {
        await diaryService.updateEntry(entry.id, formData);
        toast.success('Entry updated');
      } else {
        await diaryService.createEntry(formData);
        toast.success('Entry added');
      }
      onSave();
    } catch (err) {
      toast.error('Failed to save entry');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {entry ? 'Edit Hearing' : 'Add Hearing'}
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
                Next Date
              </label>
              <input
                type="date"
                value={formData.nextDate}
                onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
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
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
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
              {entry ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Diary;

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { clientService } from '../../services/library/clientService';
import { clientTypes, clientStatuses } from '../../data/mockClients';

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const loadClient = useCallback(async () => {
    try {
      const data = await clientService.getClientById(clientId);
      setClient(data);
    } catch {
      toast.error('Failed to load client');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await clientService.deleteClient(clientId);
        toast.success('Client deleted');
        navigate('/dashboard/library/clients');
      } catch {
        toast.error('Failed to delete client');
      }
    }
  };

  // Mock data for cases, hearings, communication history
  const mockCases = [
    { id: 'case-1', caseNumber: 'Crl. Appeal 45/2024', caseTitle: 'Ramesh Sharma v. State of Maharashtra', status: 'Ongoing', court: 'Bombay High Court' },
    { id: 'case-2', caseNumber: 'WP 123/2024', caseTitle: 'Sharma v. Municipal Corporation', status: 'Pending', court: 'Delhi High Court' }
  ];

  const mockHearings = [
    { id: 'h-1', date: '2024-07-15', time: '10:00', court: 'Bombay High Court', judge: 'Hon. Justice A.K. Desai', status: 'Scheduled' },
    { id: 'h-2', date: '2024-06-20', time: '14:30', court: 'Bombay High Court', judge: 'Hon. Justice A.K. Desai', status: 'Completed' }
  ];

  const mockCommunications = [
    { id: 'comm-1', date: '2024-06-18', type: 'Email', subject: 'Case update - Bail application', from: 'You', to: client?.name },
    { id: 'comm-2', date: '2024-06-10', type: 'Phone', subject: 'Initial consultation', from: client?.name, to: 'You' },
    { id: 'comm-3', date: '2024-06-05', type: 'Message', subject: 'Document request', from: 'You', to: client?.name }
  ];

  const mockNotes = [
    { id: 'note-1', date: '2024-06-18', content: 'Discussed bail strategy. Next steps: File additional affidavit.' },
    { id: 'note-2', date: '2024-06-10', content: 'Initial meeting. Client is very stressed. Provide regular updates.' }
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8 h-full flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 md:p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-slate-400 text-3xl">person_off</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Client not found</h3>
          <Link
            to="/dashboard/library/clients"
            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Clients
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
                to="/dashboard/library/clients"
                className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{client.name}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                client.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                client.status === 'New' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                'bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {client.status}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {client.type}
              </span>
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
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-1 overflow-x-auto">
          {[
            { id: 'profile', icon: 'person', label: 'Profile' },
            { id: 'cases', icon: 'gavel', label: 'Cases' },
            { id: 'hearings', icon: 'event', label: 'Hearings' },
            { id: 'notes', icon: 'edit_note', label: 'Notes' },
            { id: 'communications', icon: 'chat', label: 'Communication' }
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
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {client.email && (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">email</span>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                        <p className="text-slate-900 dark:text-white">{client.email}</p>
                      </div>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">call</span>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                        <p className="text-slate-900 dark:text-white">{client.phone}</p>
                      </div>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-slate-400 mt-0.5">location_on</span>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                        <p className="text-slate-900 dark:text-white">{client.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Client Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Client Since</p>
                    <p className="text-slate-900 dark:text-white">{new Date(client.createdDate).toLocaleDateString()}</p>
                  </div>
                  {client.notes && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Notes</p>
                      <p className="text-slate-700 dark:text-slate-300">{client.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Cases</h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {mockCases.map((c) => (
                <Link
                  key={c.id}
                  to="#"
                  className="block p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{c.caseNumber}</p>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white mt-1">{c.caseTitle}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{c.court}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      c.status === 'Ongoing' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'hearings' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hearings</h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {mockHearings.map((h) => (
                <Link
                  key={h.id}
                  to="#"
                  className="block p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
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
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notes</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm">
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

        {activeTab === 'communications' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Communication History</h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {mockCommunications.map((comm) => (
                <div key={comm.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`material-symbols-outlined text-lg ${
                      comm.type === 'Email' ? 'text-blue-500' :
                      comm.type === 'Phone' ? 'text-emerald-500' :
                      'text-purple-500'
                    }`}>
                      {comm.type === 'Email' ? 'email' : comm.type === 'Phone' ? 'call' : 'chat'}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(comm.date).toLocaleDateString()} • {comm.type}
                    </p>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">{comm.subject}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{comm.from} → {comm.to}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <ClientModal
          client={client}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            loadClient();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Client Modal Component
const ClientModal = ({ client, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    client || {
      name: '',
      phone: '',
      email: '',
      address: '',
      type: 'Individual',
      notes: '',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'New'
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (client) {
        await clientService.updateClient(client.id, formData);
        toast.success('Client updated');
      } else {
        await clientService.createClient(formData);
        toast.success('Client added');
      }
      onSave();
    } catch {
      toast.error('Failed to save client');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {client ? 'Edit Client' : 'Add Client'}
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
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Client Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              >
                {clientTypes.map((type) => (
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
                required
              >
                {clientStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {client ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientDetails;

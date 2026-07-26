import { mockClients } from '../../data/mockClients';

const STORAGE_KEY = 'draftmate_clients';

const initializeStorage = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } else {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(c => c.id !== 'client-1' && c.id !== 'client-2' && c.id !== 'client-3' && c.id !== 'client-4' && !c.name?.includes('Ramesh Sharma') && !c.name?.includes('Priya Enterprises') && !c.name?.includes('Sunita Verma'));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      }
    } catch (e) {}
  }
};

export const clientService = {
  async getClients() {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  },

  async getClientById(id) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    const clients = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return clients.find(client => client.id === id);
  },

  async createClient(clientData) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    const clients = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newClient = {
      ...clientData,
      id: `client-${Date.now()}`
    };
    clients.unshift(newClient);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    return newClient;
  },

  async updateClient(id, clientData) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    let clients = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = clients.findIndex(client => client.id === id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...clientData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
      return clients[index];
    }
    throw new Error('Client not found');
  },

  async deleteClient(id) {
    await new Promise(r => setTimeout(r, 100));
    initializeStorage();
    let clients = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    clients = clients.filter(client => client.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    return true;
  }
};

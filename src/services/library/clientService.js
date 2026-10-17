import { API_CONFIG } from '../endpoints';

const BASE_URL = `${API_CONFIG.LIBRARY.BASE_URL}/api/v1/library/clients`;

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('session_id') || localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const mapClientToFrontend = (c) => ({
  id: String(c.id),
  name: c.name,
  phone: c.phone || '',
  email: c.email || '',
  address: c.address || '',
  clientType: c.client_type,
  notes: c.notes || '',
  status: c.status || 'Active',
  createdDate: c.created_date,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

export const clientService = {
  async getClients(search = null, status = null, clientType = null) {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (clientType) params.append('client_type', clientType);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${BASE_URL}/${queryStr}`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data.map(mapClientToFrontend) : [];
      }
    } catch (e) {
      console.error('[clientService] Failed to load clients from API:', e);
    }
    return [];
  },

  async getClientById(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Client not found: ${response.statusText}`);
    }
    const data = await response.json();
    return mapClientToFrontend(data);
  },

  async createClient(clientData) {
    const payload = {
      name: clientData.name,
      phone: clientData.phone || null,
      email: clientData.email || null,
      address: clientData.address || null,
      client_type: clientData.clientType || clientData.client_type || 'Individual',
      notes: clientData.notes || null,
      status: clientData.status || 'Active',
      created_date: clientData.createdDate || clientData.created_date || new Date().toISOString().split('T')[0],
    };

    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to create client: ${response.statusText}`);
    }
    const data = await response.json();
    return mapClientToFrontend(data);
  },

  async updateClient(id, clientData) {
    const payload = {};
    if (clientData.name !== undefined) payload.name = clientData.name;
    if (clientData.phone !== undefined) payload.phone = clientData.phone;
    if (clientData.email !== undefined) payload.email = clientData.email;
    if (clientData.address !== undefined) payload.address = clientData.address;
    if (clientData.clientType !== undefined || clientData.client_type !== undefined) {
      payload.client_type = clientData.clientType || clientData.client_type;
    }
    if (clientData.notes !== undefined) payload.notes = clientData.notes;
    if (clientData.status !== undefined) payload.status = clientData.status;

    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to update client: ${response.statusText}`);
    }
    const data = await response.json();
    return mapClientToFrontend(data);
  },

  async deleteClient(id) {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete client: ${response.statusText}`);
    }
    return true;
  }
};

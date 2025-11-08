import { apiRequest } from './api-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const BASE_URL = `${API_BASE_URL}/manufacturing/outsourcing`;

export const outsourcingAPI = {
  // Get all outsourcing requests
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const url = queryParams.toString() ? `${BASE_URL}/?${queryParams}` : `${BASE_URL}/`;
    return await apiRequest(url, { method: 'GET' });
  },

  // Get specific outsourcing request
  getById: async (id) => {
    return await apiRequest(`${BASE_URL}/${id}/`, { method: 'GET' });
  },

  // Create new outsourcing request
  create: async (data) => {
    return await apiRequest(`${BASE_URL}/`, { method: 'POST', body: data });
  },

  // Update outsourcing request
  update: async (id, data) => {
    return await apiRequest(`${BASE_URL}/${id}/`, { method: 'PATCH', body: data });
  },

  // Delete outsourcing request
  delete: async (id) => {
    return await apiRequest(`${BASE_URL}/${id}/`, { method: 'DELETE' });
  },

  // Send outsourcing request (creates OUT inventory transactions)
  send: async (id, data) => {
    return await apiRequest(`${BASE_URL}/${id}/send/`, { method: 'POST', body: data });
  },

  // Mark request as returned (creates IN inventory transactions)
  returnItems: async (id, data) => {
    return await apiRequest(`${BASE_URL}/${id}/return_items/`, { method: 'POST', body: data });
  },

  // Close outsourcing request
  close: async (id) => {
    return await apiRequest(`${BASE_URL}/${id}/close/`, { method: 'POST' });
  },

  // Get outsourcing summary statistics
  getSummary: async () => {
    return await apiRequest(`${BASE_URL}/summary/`, { method: 'GET' });
  }
};

export default outsourcingAPI;

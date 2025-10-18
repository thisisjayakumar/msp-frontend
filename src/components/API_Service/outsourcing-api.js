import { apiRequest } from './api-utils';

const BASE_URL = '/api/manufacturing/outsourcing';

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
    return await apiRequest(url, 'GET');
  },

  // Get specific outsourcing request
  getById: async (id) => {
    return await apiRequest(`${BASE_URL}/${id}/`, 'GET');
  },

  // Create new outsourcing request
  create: async (data) => {
    return await apiRequest(`${BASE_URL}/`, 'POST', data);
  },

  // Update outsourcing request
  update: async (id, data) => {
    return await apiRequest(`${BASE_URL}/${id}/`, 'PATCH', data);
  },

  // Delete outsourcing request
  delete: async (id) => {
    return await apiRequest(`${BASE_URL}/${id}/`, 'DELETE');
  },

  // Send outsourcing request (creates OUT inventory transactions)
  send: async (id, data) => {
    return await apiRequest(`${BASE_URL}/${id}/send/`, 'POST', data);
  },

  // Mark request as returned (creates IN inventory transactions)
  returnItems: async (id, data) => {
    return await apiRequest(`${BASE_URL}/${id}/return_items/`, 'POST', data);
  },

  // Close outsourcing request
  close: async (id) => {
    return await apiRequest(`${BASE_URL}/${id}/close/`, 'POST');
  },

  // Get outsourcing summary statistics
  getSummary: async () => {
    return await apiRequest(`${BASE_URL}/summary/`, 'GET');
  }
};

export default outsourcingAPI;

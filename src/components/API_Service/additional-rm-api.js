/**
 * Additional RM Request API Service
 * Handles all API calls related to additional RM requests
 */

import { apiRequest, handleResponse } from './api-utils';

const BASE_URL = '/api/manufacturing/additional-rm-requests';

const additionalRMAPI = {
  /**
   * Get all additional RM requests with optional filters
   * @param {Object} filters - Filter parameters (status, mo, etc.)
   * @returns {Promise<Array>} List of additional RM requests
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const url = params.toString() ? `${BASE_URL}/?${params}` : `${BASE_URL}/`;
    const response = await apiRequest(url);
    return handleResponse(response);
  },

  /**
   * Get pending approval requests (for Manager/PH)
   * @returns {Promise<Object>} Pending requests
   */
  async getPendingApprovals() {
    const response = await apiRequest(`${BASE_URL}/pending-approvals/`);
    return handleResponse(response);
  },

  /**
   * Get additional RM requests for a specific MO
   * @param {number} moId - Manufacturing Order ID
   * @returns {Promise<Object>} MO's RM summary and requests
   */
  async getByMO(moId) {
    const response = await apiRequest(`${BASE_URL}/by-mo/${moId}/`);
    return handleResponse(response);
  },

  /**
   * Get specific additional RM request by ID
   * @param {number} requestId - Request ID
   * @returns {Promise<Object>} Request details
   */
  async getById(requestId) {
    const response = await apiRequest(`${BASE_URL}/${requestId}/`);
    return handleResponse(response);
  },

  /**
   * Create a new additional RM request
   * @param {Object} data - Request data
   * @param {number} data.mo_id - MO ID
   * @param {number} data.additional_rm_requested_kg - Additional RM requested in kg
   * @param {string} data.reason - Reason for request
   * @param {number} [data.excess_batch_id] - Optional batch ID that caused excess
   * @returns {Promise<Object>} Created request
   */
  async create(data) {
    const response = await apiRequest(BASE_URL + '/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Approve an additional RM request (Manager only)
   * @param {number} requestId - Request ID
   * @param {Object} data - Approval data
   * @param {number} data.approved_quantity_kg - Approved quantity in kg
   * @param {string} [data.approval_notes] - Optional approval notes
   * @returns {Promise<Object>} Approved request
   */
  async approve(requestId, data) {
    const response = await apiRequest(`${BASE_URL}/${requestId}/approve/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Reject an additional RM request (Manager only)
   * @param {number} requestId - Request ID
   * @param {Object} data - Rejection data
   * @param {string} data.rejection_reason - Reason for rejection
   * @returns {Promise<Object>} Rejected request
   */
  async reject(requestId, data) {
    const response = await apiRequest(`${BASE_URL}/${requestId}/reject/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Mark an additional RM request as complete (RM Store only)
   * @param {number} requestId - Request ID
   * @param {Object} data - Completion data
   * @param {string} [data.completion_notes] - Optional completion notes
   * @returns {Promise<Object>} Completed request
   */
  async markComplete(requestId, data = {}) {
    const response = await apiRequest(`${BASE_URL}/${requestId}/mark-complete/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

export default additionalRMAPI;


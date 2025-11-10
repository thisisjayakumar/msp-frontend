/**
 * Process Supervisor API Service
 * Handles stop/resume, rework, verification, and FI operations
 */

import { apiRequest } from './api-utils';
import { throttledGet, throttledPost } from './throttled-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const BASE = `${API_BASE_URL}/manufacturing`;

/**
 * Helper method to handle API responses
 */
const handleResponse = async (response) => {
  if (response.success) {
    return response.data;
  }
  
  const errorMessage = response.error || 'API request failed';
  throw new Error(errorMessage);
};

class ProcessSupervisorAPI {
  constructor() {
    this.baseURL = BASE;
  }

  // ============================================
  // Process Stop/Resume APIs
  // ============================================

  /**
   * Stop a process with reason
   * @param {Object} data - { batch_id, process_execution_id, stop_reason, stop_reason_detail }
   */
  async stopProcess(data) {
    const response = await apiRequest(`${this.baseURL}/process-stops/`, {
      method: 'POST',
      body: data,
    });
    return handleResponse(response);
  }

  /**
   * Resume a stopped process
   * @param {number} stopId - Process stop ID
   * @param {string} notes - Optional resume notes
   */
  async resumeProcess(stopId, notes = '') {
    const response = await apiRequest(`${this.baseURL}/process-stops/${stopId}/resume/`, {
      method: 'POST',
      body: { resume_notes: notes },
    });
    return handleResponse(response);
  }

  /**
   * Get all active stops
   */
  async getActiveStops() {
    const response = await throttledGet(`${this.baseURL}/process-stops/active_stops/`);
    return handleResponse(response);
  }

  /**
   * Get my active stops (current user)
   */
  async getMyStops() {
    const response = await throttledGet(`${this.baseURL}/process-stops/my_stops/`);
    return handleResponse(response);
  }

  /**
   * Get all process stops with filters
   * @param {Object} filters - { batch_id, mo_id, process_id, is_resumed }
   */
  async getProcessStops(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/process-stops/?${queryParams}`
      : `${this.baseURL}/process-stops/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  // ============================================
  // Batch Completion with Rework APIs
  // ============================================

  /**
   * Complete batch with OK/Scrap/Rework quantities
   * @param {Object} data - { batch_id, process_execution_id, input_quantity_kg, ok_quantity_kg, scrap_quantity_kg, rework_quantity_kg, completion_notes, defect_description }
   */
  async completeBatchWithQuantities(data) {
    const response = await apiRequest(`${this.baseURL}/batch-completions/`, {
      method: 'POST',
      body: data,
    });
    return handleResponse(response);
  }

  /**
   * Get batch completion history
   * @param {number} batchId - Batch ID
   */
  async getBatchCompletions(batchId) {
    const response = await throttledGet(`${this.baseURL}/batch-completions/by_batch/?batch_id=${batchId}`);
    return handleResponse(response);
  }

  // ============================================
  // Rework Management APIs
  // ============================================

  /**
   * Get my pending rework batches
   */
  async getMyReworkBatches() {
    const response = await throttledGet(`${this.baseURL}/rework-batches/my_pending/`);
    return handleResponse(response);
  }

  /**
   * Get all rework batches with filters
   * @param {Object} filters - { status, assigned_supervisor, process_id }
   */
  async getReworkBatches(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/rework-batches/?${queryParams}`
      : `${this.baseURL}/rework-batches/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  /**
   * Start rework batch
   * @param {number} reworkId - Rework batch ID
   */
  async startRework(reworkId) {
    const response = await apiRequest(`${this.baseURL}/rework-batches/${reworkId}/start/`, {
      method: 'POST',
      body: {},
    });
    return handleResponse(response);
  }

  /**
   * Complete rework batch with OK/Scrap quantities
   * @param {number} reworkId - Rework batch ID
   * @param {number} okKg - OK quantity in kg
   * @param {number} scrapKg - Scrap quantity in kg
   */
  async completeRework(reworkId, okKg, scrapKg) {
    const response = await apiRequest(`${this.baseURL}/rework-batches/${reworkId}/complete/`, {
      method: 'POST',
      body: { ok_kg: okKg, scrap_kg: scrapKg },
    });
    return handleResponse(response);
  }

  // ============================================
  // Batch Receipt Verification APIs
  // ============================================

  /**
   * Verify batch receipt - OK
   * @param {Object} data - { batch_id, process_execution_id, expected_quantity_kg }
   */
  async verifyBatchReceipt(data) {
    const response = await apiRequest(`${this.baseURL}/batch-receipts/verify/`, {
      method: 'POST',
      body: data,
    });
    return handleResponse(response);
  }

  /**
   * Report batch receipt issue
   * @param {Object} data - { batch_id, process_execution_id, expected_quantity_kg, actual_quantity_kg, report_reason, report_details }
   */
  async reportBatchIssue(data) {
    const response = await apiRequest(`${this.baseURL}/batch-receipts/report/`, {
      method: 'POST',
      body: data,
    });
    return handleResponse(response);
  }

  /**
   * Get batches on hold
   */
  async getOnHoldBatches() {
    const response = await throttledGet(`${this.baseURL}/batch-receipts/on_hold/`);
    return handleResponse(response);
  }

  /**
   * Clear hold on reported batch (PH action)
   * @param {number} receiptId - Receipt verification ID
   * @param {string} notes - Clearance notes
   */
  async clearHold(receiptId, notes = '') {
    const response = await apiRequest(`${this.baseURL}/batch-receipts/${receiptId}/clear_hold/`, {
      method: 'POST',
      body: { clearance_notes: notes },
    });
    return handleResponse(response);
  }

  /**
   * Resolve reported issue (PH/Manager action)
   * @param {number} receiptId - Receipt verification ID
   * @param {string} notes - Resolution notes
   */
  async resolveIssue(receiptId, notes = '') {
    const response = await apiRequest(`${this.baseURL}/batch-receipts/${receiptId}/resolve/`, {
      method: 'POST',
      body: { resolution_notes: notes },
    });
    return handleResponse(response);
  }

  /**
   * Get all batch receipts with filters
   * @param {Object} filters - { on_hold, reported }
   */
  async getBatchReceipts(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/batch-receipts/?${queryParams}`
      : `${this.baseURL}/batch-receipts/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  // ============================================
  // Final Inspection Rework APIs
  // ============================================

  /**
   * Create FI rework assignment
   * @param {Object} data - { batch_id, defective_process_id, defect_description, rework_quantity_kg, fi_notes }
   */
  async createFIRework(data) {
    const response = await apiRequest(`${this.baseURL}/fi-reworks/`, {
      method: 'POST',
      body: data,
    });
    return handleResponse(response);
  }

  /**
   * Get my assigned FI reworks
   */
  async getMyFIReworks() {
    const response = await throttledGet(`${this.baseURL}/fi-reworks/my_assigned/`);
    return handleResponse(response);
  }

  /**
   * Get all FI reworks with filters
   * @param {Object} filters - { status, batch_id, defective_process_id }
   */
  async getFIReworks(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/fi-reworks/?${queryParams}`
      : `${this.baseURL}/fi-reworks/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  /**
   * Complete FI rework (supervisor action)
   * @param {number} fiReworkId - FI rework ID
   */
  async completeFIRework(fiReworkId) {
    const response = await apiRequest(`${this.baseURL}/fi-reworks/${fiReworkId}/complete/`, {
      method: 'POST',
      body: {},
    });
    return handleResponse(response);
  }

  /**
   * FI re-inspection after rework
   * @param {number} fiReworkId - FI rework ID
   * @param {boolean} passed - Whether batch passed re-inspection
   * @param {string} notes - Re-inspection notes
   */
  async passFIReinspection(fiReworkId, passed, notes = '') {
    const response = await apiRequest(`${this.baseURL}/fi-reworks/${fiReworkId}/reinspect/`, {
      method: 'POST',
      body: { passed, notes },
    });
    return handleResponse(response);
  }

  /**
   * Get FI rework report (which process caused most reworks)
   * @param {Object} filters - { start_date, end_date }
   */
  async getFIReworkReport(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/fi-reworks/report/?${queryParams}`
      : `${this.baseURL}/fi-reworks/report/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  // ============================================
  // Enhanced Supervisor Dashboard API
  // ============================================

  /**
   * Get supervisor dashboard with categorized batches
   * Returns: { to_process, in_progress, stopped, rework_pending, on_hold, completed }
   */
  async getSupervisorDashboard() {
    const response = await throttledGet(`${this.baseURL}/process-executions/supervisor_dashboard/`);
    return handleResponse(response);
  }

  // ============================================
  // Analytics APIs (PH View)
  // ============================================

  /**
   * Get downtime summary
   * @param {Object} filters - { start_date, end_date, process_id }
   */
  async getDowntimeSummary(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/downtime-analytics/?${queryParams}`
      : `${this.baseURL}/downtime-analytics/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  /**
   * Get downtime breakdown by reason
   * @param {Object} filters - { start_date, end_date, process_id }
   */
  async getDowntimeByReason(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/downtime-analytics/by_reason/?${queryParams}`
      : `${this.baseURL}/downtime-analytics/by_reason/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  /**
   * Get downtime trends over time
   * @param {Object} filters - { start_date, end_date, process_id }
   */
  async getDowntimeTrends(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/downtime-analytics/trends/?${queryParams}`
      : `${this.baseURL}/downtime-analytics/trends/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  /**
   * Get downtime by process
   * @param {Object} filters - { start_date, end_date }
   */
  async getDowntimeByProcess(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/downtime-analytics/by_process/?${queryParams}`
      : `${this.baseURL}/downtime-analytics/by_process/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  /**
   * Get rework rate by process
   * @param {Object} filters - { start_date, end_date }
   */
  async getReworkRateByProcess(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/rework-analytics/rate_by_process/?${queryParams}`
      : `${this.baseURL}/rework-analytics/rate_by_process/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  /**
   * Get rework trends over time
   * @param {number} months - Number of months to fetch (default: 6)
   */
  async getReworkTrends(months = 6) {
    const response = await throttledGet(`${this.baseURL}/rework-analytics/trends/?months=${months}`);
    return handleResponse(response);
  }

  /**
   * Get top processes with highest rework
   * @param {number} limit - Number of processes to return (default: 10)
   */
  async getTopReworkProcesses(limit = 10) {
    const response = await throttledGet(`${this.baseURL}/rework-analytics/top_processes/?limit=${limit}`);
    return handleResponse(response);
  }

  /**
   * Get batch traceability timeline
   * @param {number} batchId - Batch ID
   */
  async getBatchTraceability(batchId) {
    const response = await throttledGet(`${this.baseURL}/batch-traceability/${batchId}/`);
    return handleResponse(response);
  }

  /**
   * Search batch traceability
   * @param {Object} filters - { mo_id, batch_id, start_date, end_date }
   */
  async searchBatchTraceability(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/batch-traceability/search/?${queryParams}`
      : `${this.baseURL}/batch-traceability/search/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  /**
   * Get activity logs
   * @param {Object} filters - { batch_id, mo_id, process_id, activity_type, start_date, end_date }
   */
  async getActivityLogs(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString() 
      ? `${this.baseURL}/activity-logs/?${queryParams}`
      : `${this.baseURL}/activity-logs/`;

    const response = await throttledGet(url);
    return handleResponse(response);
  }

  /**
   * Get activity logs for a specific batch
   * @param {number} batchId - Batch ID
   */
  async getBatchActivityLogs(batchId) {
    const response = await throttledGet(`${this.baseURL}/activity-logs/by_batch/?batch_id=${batchId}`);
    return handleResponse(response);
  }
}

// Create and export singleton instance
const processSupervisorAPI = new ProcessSupervisorAPI();
export default processSupervisorAPI;

// Export class for testing
export { ProcessSupervisorAPI };


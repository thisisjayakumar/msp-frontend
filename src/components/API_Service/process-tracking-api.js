/**
 * API service for MO Process Tracking
 * Handles all process execution, step tracking, and alert management
 */

import { apiRequest } from './api-utils';
import { throttledGet, throttledPost, throttledPatch } from './throttled-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

class ProcessTrackingAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/manufacturing`;
  }

  // Helper method to handle API responses (for backward compatibility)
  async handleResponse(response) {
    if (response.success) {
      return response.data;
    }
    
    // Handle specific error cases gracefully
    const errorMessage = response.error || 'API request failed';
    
    // Check if it's a "not found" error (MO doesn't exist)
    if (errorMessage.includes('No ManufacturingOrder matches') || 
        errorMessage.includes('Not Found') ||
        errorMessage.includes('404')) {
      // Return a structured error object instead of throwing
      return {
        error: true,
        message: 'Manufacturing Order not found',
        details: errorMessage,
        status: 404
      };
    }
    
    throw new Error(errorMessage);
  }

  // Manufacturing Order Process Tracking (THROTTLED)
  async getMOWithProcesses(moId) {
    const url = `${this.baseURL}/manufacturing-orders/${moId}/process_tracking/`;
    const response = await throttledGet(url);
    return this.handleResponse(response);
  }

  async initializeMOProcesses(moId) {
    const response = await apiRequest(`${this.baseURL}/manufacturing-orders/${moId}/initialize_processes/`, {
      method: 'POST',
    });
    return this.handleResponse(response);
  }

  // Process Execution Management
  async getProcessExecutions(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await apiRequest(`${this.baseURL}/process-executions/?${queryParams}`, {
      method: 'GET',
    });
    return this.handleResponse(response);
  }

  // Get process executions filtered by user's department/role
  async getUserProcessExecutions(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await apiRequest(`${this.baseURL}/process-executions/?${queryParams}`, {
      method: 'GET',
    });
    return this.handleResponse(response);
  }

  async startProcess(executionId) {
    const response = await apiRequest(`${this.baseURL}/process-executions/${executionId}/start_process/`, {
      method: 'POST',
    });
    return this.handleResponse(response);
  }

  async completeProcess(executionId) {
    const response = await apiRequest(`${this.baseURL}/process-executions/${executionId}/complete_process/`, {
      method: 'POST',
    });
    return this.handleResponse(response);
  }

  async updateProcessProgress(executionId, progressData) {
    const response = await apiRequest(`${this.baseURL}/process-executions/${executionId}/update_progress/`, {
      method: 'POST',
      body: progressData,
    });
    return this.handleResponse(response);
  }

  async getProcessExecutionsByMO(moId) {
    const response = await apiRequest(`${this.baseURL}/process-executions/by_mo/?mo_id=${moId}`, {
      method: 'GET',
    });
    return this.handleResponse(response);
  }

  // Process Step Execution Management
  async getStepExecutions(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await apiRequest(`${this.baseURL}/step-executions/?${queryParams}`, {
      method: 'GET',
    });
    return this.handleResponse(response);
  }

  async getStepExecution(stepExecutionId) {
    const response = await apiRequest(`${this.baseURL}/step-executions/${stepExecutionId}/`, {
      method: 'GET',
    });
    return this.handleResponse(response);
  }

  async startStep(stepExecutionId) {
    const response = await apiRequest(`${this.baseURL}/step-executions/${stepExecutionId}/start_step/`, {
      method: 'POST',
    });
    return this.handleResponse(response);
  }

  async completeStep(stepExecutionId, stepData) {
    const response = await apiRequest(`${this.baseURL}/step-executions/${stepExecutionId}/complete_step/`, {
      method: 'POST',
      body: stepData,
    });
    return this.handleResponse(response);
  }

  async updateStepExecution(stepExecutionId, updateData) {
    const response = await apiRequest(`${this.baseURL}/step-executions/${stepExecutionId}/`, {
      method: 'PATCH',
      body: updateData,
    });
    return this.handleResponse(response);
  }

  // Process Alerts Management
  async getProcessAlerts(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await apiRequest(`${this.baseURL}/process-alerts/?${queryParams}`, {
      method: 'GET',
    });
    return this.handleResponse(response);
  }

  async createAlert(alertData) {
    const response = await apiRequest(`${this.baseURL}/process-alerts/`, {
      method: 'POST',
      body: alertData,
    });
    return this.handleResponse(response);
  }

  async resolveAlert(alertId, resolutionData) {
    const response = await apiRequest(`${this.baseURL}/process-alerts/${alertId}/resolve/`, {
      method: 'POST',
      body: resolutionData,
    });
    return this.handleResponse(response);
  }

  async getActiveAlerts(moId = null) {
    const url = moId 
      ? `${this.baseURL}/process-alerts/active_alerts/?mo_id=${moId}`
      : `${this.baseURL}/process-alerts/active_alerts/`;
    
    const response = await throttledGet(url);
    return this.handleResponse(response);
  }

  // Utility Methods
  async getProcesses() {
    const response = await apiRequest(`${API_BASE_URL}/api/processes/processes/dropdown/`, {
      method: 'GET',
    });
    return this.handleResponse(response);
  }

  async getProcessSteps(processId = null) {
    const url = processId 
      ? `${API_BASE_URL}/api/processes/process-steps/dropdown/?process_id=${processId}`
      : `${API_BASE_URL}/api/processes/process-steps/dropdown/`;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    return this.handleResponse(response);
  }

  // Real-time updates simulation (you can replace with WebSocket later)
  async pollProcessUpdates(moId, callback, interval = 5000) {
    const poll = async () => {
      try {
        const data = await this.getMOWithProcesses(moId);
        callback(data);
      } catch (error) {
        console.error('Error polling process updates:', error);
      }
    };

    // Initial call
    await poll();

    // Set up polling
    const intervalId = setInterval(poll, interval);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Get dashboard statistics
  async getDashboardStats() {
    const response = await apiRequest(`${this.baseURL}/process-executions/dashboard_stats/`, {
      method: 'GET',
    });
    return this.handleResponse(response);
  }

  // Batch Process Execution Management
  async startBatchProcess(batchId, processId) {
    const response = await apiRequest(`${this.baseURL}/batch-process-executions/start/`, {
      method: 'POST',
      body: { batch_id: batchId, process_id: processId },
    });
    return this.handleResponse(response);
  }

  async completeBatchProcess(batchId, processId, completionData = {}) {
    const response = await apiRequest(`${this.baseURL}/batch-process-executions/complete/`, {
      method: 'POST',
      body: { batch_id: batchId, process_id: processId, ...completionData },
    });
    return this.handleResponse(response);
  }

  async getBatchProcessExecutions(moId) {
    const response = await apiRequest(`${this.baseURL}/batch-process-executions/get_batch_process_executions/?mo_id=${moId}`, {
      method: 'GET',
    });
    return this.handleResponse(response);
  }

  async updateBatchProcessProgress(batchId, processId, progressData) {
    const response = await apiRequest(`${this.baseURL}/batch-process-executions/update-progress/`, {
      method: 'POST',
      body: { batch_id: batchId, process_id: processId, ...progressData },
    });
    return this.handleResponse(response);
  }
}

// Create and export singleton instance
const processTrackingAPI = new ProcessTrackingAPI();
export default processTrackingAPI;
// Export class for testing
export { ProcessTrackingAPI };

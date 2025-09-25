/**
 * API service for MO Process Tracking
 * Handles all process execution, step tracking, and alert management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ProcessTrackingAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/manufacturing`;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Manufacturing Order Process Tracking
  async getMOWithProcesses(moId) {
    const response = await fetch(`${this.baseURL}/manufacturing-orders/${moId}/process_tracking/`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async initializeMOProcesses(moId) {
    const response = await fetch(`${this.baseURL}/manufacturing-orders/${moId}/initialize_processes/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
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

    const response = await fetch(`${this.baseURL}/process-executions/?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getProcessExecution(executionId) {
    const response = await fetch(`${this.baseURL}/process-executions/${executionId}/`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async startProcess(executionId) {
    const response = await fetch(`${this.baseURL}/process-executions/${executionId}/start_process/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async completeProcess(executionId) {
    const response = await fetch(`${this.baseURL}/process-executions/${executionId}/complete_process/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateProcessProgress(executionId, progressData) {
    const response = await fetch(`${this.baseURL}/process-executions/${executionId}/update_progress/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(progressData),
    });
    return this.handleResponse(response);
  }

  async getProcessExecutionsByMO(moId) {
    const response = await fetch(`${this.baseURL}/process-executions/by_mo/?mo_id=${moId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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

    const response = await fetch(`${this.baseURL}/step-executions/?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getStepExecution(stepExecutionId) {
    const response = await fetch(`${this.baseURL}/step-executions/${stepExecutionId}/`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async startStep(stepExecutionId) {
    const response = await fetch(`${this.baseURL}/step-executions/${stepExecutionId}/start_step/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async completeStep(stepExecutionId, stepData) {
    const response = await fetch(`${this.baseURL}/step-executions/${stepExecutionId}/complete_step/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stepData),
    });
    return this.handleResponse(response);
  }

  async updateStepExecution(stepExecutionId, updateData) {
    const response = await fetch(`${this.baseURL}/step-executions/${stepExecutionId}/`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
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

    const response = await fetch(`${this.baseURL}/process-alerts/?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createAlert(alertData) {
    const response = await fetch(`${this.baseURL}/process-alerts/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(alertData),
    });
    return this.handleResponse(response);
  }

  async resolveAlert(alertId, resolutionData) {
    const response = await fetch(`${this.baseURL}/process-alerts/${alertId}/resolve/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(resolutionData),
    });
    return this.handleResponse(response);
  }

  async getActiveAlerts(moId = null) {
    const url = moId 
      ? `${this.baseURL}/process-alerts/active_alerts/?mo_id=${moId}`
      : `${this.baseURL}/process-alerts/active_alerts/`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Utility Methods
  async getProcesses() {
    const response = await fetch(`${API_BASE_URL}/api/processes/processes/dropdown/`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getProcessSteps(processId = null) {
    const url = processId 
      ? `${API_BASE_URL}/api/processes/process-steps/dropdown/?process_id=${processId}`
      : `${API_BASE_URL}/api/processes/process-steps/dropdown/`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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

  // Dashboard Statistics
  async getProcessDashboardStats() {
    const response = await fetch(`${this.baseURL}/process-executions/dashboard_stats/`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }
}

// Create and export singleton instance
const processTrackingAPI = new ProcessTrackingAPI();
export default processTrackingAPI;

// Export class for testing
export { ProcessTrackingAPI };

import { apiRequest } from './api-utils';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (response.success) {
    return response.data;
  }
  
  // Return error information for graceful UI handling instead of throwing
  const errorMessage = response.error || 'API request failed';
  const errorInfo = {
    error: true,
    message: errorMessage,
    status: response.status,
    details: response.data
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('Work Center API Warning:', errorMessage);
  }
  
  return errorInfo;
};

const WORK_CENTER_APIS = {
  // Work Center Master
  WORK_CENTERS: `${API_BASE_URL}/api/processes/work-centers/`,
  WORK_CENTER_DETAIL: (id) => `${API_BASE_URL}/api/processes/work-centers/${id}/`,
  AVAILABLE_WORK_CENTERS: `${API_BASE_URL}/api/processes/work-centers/available_work_centers/`,
  SUPERVISORS: `${API_BASE_URL}/api/processes/work-centers/supervisors/`,
  
  // Supervisor Status
  SUPERVISOR_STATUS: `${API_BASE_URL}/api/processes/supervisor-status/`,
  SUPERVISOR_STATUS_DETAIL: (id) => `${API_BASE_URL}/api/processes/supervisor-status/${id}/`,
  SUPERVISOR_STATUS_TODAY: `${API_BASE_URL}/api/processes/supervisor-status/today_dashboard/`,
  SUPERVISOR_STATUS_MANUAL_UPDATE: (id) => `${API_BASE_URL}/api/processes/supervisor-status/${id}/manual_update/`,
  RUN_ATTENDANCE_CHECK: `${API_BASE_URL}/api/processes/supervisor-status/run_attendance_check/`,
  
  // Supervisor Activity
  SUPERVISOR_ACTIVITY: `${API_BASE_URL}/api/processes/supervisor-activity/`,
  SUPERVISOR_ACTIVITY_SUMMARY: `${API_BASE_URL}/api/processes/supervisor-activity/summary/`,
  SUPERVISOR_ACTIVITY_TODAY: `${API_BASE_URL}/api/processes/supervisor-activity/today/`,
};

const workCenterAPI = {
  // Work Center Master Management
  workCenters: {
    // Get all work centers
    list: async () => {
      const response = await apiRequest(WORK_CENTER_APIS.WORK_CENTERS, {
        method: 'GET',
      });
      return handleResponse(response);
    },

    // Get single work center
    get: async (id) => {
      const response = await apiRequest(WORK_CENTER_APIS.WORK_CENTER_DETAIL(id), {
        method: 'GET',
      });
      return handleResponse(response);
    },

    // Create new work center
    create: async (data) => {
      const response = await apiRequest(WORK_CENTER_APIS.WORK_CENTERS, {
        method: 'POST',
        body: data,
      });
      return handleResponse(response);
    },

    // Update work center
    update: async (id, data) => {
      const response = await apiRequest(WORK_CENTER_APIS.WORK_CENTER_DETAIL(id), {
        method: 'PUT',
        body: data,
      });
      return handleResponse(response);
    },

    // Delete work center
    delete: async (id) => {
      const response = await apiRequest(WORK_CENTER_APIS.WORK_CENTER_DETAIL(id), {
        method: 'DELETE',
      });
      return handleResponse(response);
    },

    // Get available work centers (processes without work center master)
    getAvailable: async () => {
      const response = await apiRequest(WORK_CENTER_APIS.AVAILABLE_WORK_CENTERS, {
        method: 'GET',
      });
      return handleResponse(response);
    },

    // Get all supervisors
    getSupervisors: async () => {
      const response = await apiRequest(WORK_CENTER_APIS.SUPERVISORS, {
        method: 'GET',
      });
      return handleResponse(response);
    },
  },

  // Supervisor Status Management
  supervisorStatus: {
    // Get supervisor status list
    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString 
        ? `${WORK_CENTER_APIS.SUPERVISOR_STATUS}?${queryString}`
        : WORK_CENTER_APIS.SUPERVISOR_STATUS;
      
      const response = await apiRequest(url, {
        method: 'GET',
      });
      return handleResponse(response);
    },

    // Get today's dashboard
    getTodayDashboard: async () => {
      const response = await apiRequest(WORK_CENTER_APIS.SUPERVISOR_STATUS_TODAY, {
        method: 'GET',
      });
      return handleResponse(response);
    },

    // Manual update supervisor status
    manualUpdate: async (id, data) => {
      const response = await apiRequest(WORK_CENTER_APIS.SUPERVISOR_STATUS_MANUAL_UPDATE(id), {
        method: 'POST',
        body: data,
      });
      return handleResponse(response);
    },

    // Run attendance check
    runAttendanceCheck: async (date = null) => {
      const response = await apiRequest(WORK_CENTER_APIS.RUN_ATTENDANCE_CHECK, {
        method: 'POST',
        body: date ? { date } : {},
      });
      return handleResponse(response);
    },
  },

  // Supervisor Activity Logs
  supervisorActivity: {
    // Get activity logs
    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString 
        ? `${WORK_CENTER_APIS.SUPERVISOR_ACTIVITY}?${queryString}`
        : WORK_CENTER_APIS.SUPERVISOR_ACTIVITY;
      
      const response = await apiRequest(url, {
        method: 'GET',
      });
      return handleResponse(response);
    },

    // Get activity summary
    getSummary: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString 
        ? `${WORK_CENTER_APIS.SUPERVISOR_ACTIVITY_SUMMARY}?${queryString}`
        : WORK_CENTER_APIS.SUPERVISOR_ACTIVITY_SUMMARY;
      
      const response = await apiRequest(url, {
        method: 'GET',
      });
      return handleResponse(response);
    },

    // Get today's activities
    getToday: async () => {
      const response = await apiRequest(WORK_CENTER_APIS.SUPERVISOR_ACTIVITY_TODAY, {
        method: 'GET',
      });
      return handleResponse(response);
    },
  },
};

export default workCenterAPI;

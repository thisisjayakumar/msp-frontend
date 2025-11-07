// Patrol Management API Service
// Centralized API calls for Patrol Duties and Uploads

import { API_ENDPOINTS } from './api-list';
import { apiRequest, apiUpload } from './api-utils';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (response.success) {
    return response.data;
  }
  
  const errorMessage = response.error || 'API request failed';
  const errorInfo = {
    error: true,
    message: errorMessage,
    status: response.status,
    details: response.data
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('Patrol API Warning:', errorMessage);
  }
  
  return errorInfo;
};

// Patrol Duty API
export const patrolDutyAPI = {
  // Get all patrol duties with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.PATROL.DUTY_LIST}?${queryParams}`
      : API_ENDPOINTS.PATROL.DUTY_LIST;
    
    const response = await apiRequest(url, { method: 'GET' });
    return handleResponse(response);
  },

  // Get duty by ID
  getById: async (id) => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.DUTY_DETAIL(id), {
      method: 'GET',
    });
    return handleResponse(response);
  },

  // Create new patrol duty
  create: async (dutyData) => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.DUTY_CREATE, {
      method: 'POST',
      body: dutyData,
    });
    return handleResponse(response);
  },

  // Update patrol duty
  update: async (id, dutyData) => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.DUTY_UPDATE(id), {
      method: 'PATCH',
      body: dutyData,
    });
    return handleResponse(response);
  },

  // Delete patrol duty
  delete: async (id) => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.DUTY_DELETE(id), {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new Error(`Failed to delete patrol duty: ${response.status}`);
    }
    
    return true;
  },

  // Cancel patrol duty
  cancel: async (id) => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.DUTY_CANCEL(id), {
      method: 'POST',
      body: {},
    });
    return handleResponse(response);
  },

  // Get active duties
  getActiveDuties: async () => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.DUTY_ACTIVE, {
      method: 'GET',
    });
    return handleResponse(response);
  },

  // Get patrol users list (for dropdown)
  getPatrolUsers: async () => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.PATROL_USERS, {
      method: 'GET',
    });
    return handleResponse(response);
  },

  // Get process list (for dropdown)
  getProcessList: async () => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.PROCESS_LIST, {
      method: 'GET',
    });
    return handleResponse(response);
  },
};

// Patrol Upload API
export const patrolUploadAPI = {
  // Get all uploads with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.PATROL.UPLOAD_LIST}?${queryParams}`
      : API_ENDPOINTS.PATROL.UPLOAD_LIST;
    
    const response = await apiRequest(url, { method: 'GET' });
    return handleResponse(response);
  },

  // Get upload by ID
  getById: async (id) => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.UPLOAD_DETAIL(id), {
      method: 'GET',
    });
    return handleResponse(response);
  },

  // Get today's uploads for logged-in patrol user
  getMyTodayUploads: async () => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.MY_TODAY_UPLOADS, {
      method: 'GET',
    });
    return handleResponse(response);
  },

  // Submit QC image upload
  submitUpload: async (uploadId, imageFile, remarks = '') => {
    const formData = new FormData();
    formData.append('qc_image', imageFile);
    if (remarks) {
      formData.append('patrol_remarks', remarks);
    }

    const response = await apiRequest(
      API_ENDPOINTS.PATROL.UPLOAD_SUBMIT(uploadId),
      {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        },
      }
    );
    return handleResponse(response);
  },

  // Delete upload (within reupload window)
  deleteUpload: async (id) => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.UPLOAD_DELETE(id), {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Download uploads as ZIP
  downloadUploads: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.PATROL.UPLOAD_DOWNLOAD}?${queryParams}`
      : API_ENDPOINTS.PATROL.UPLOAD_DOWNLOAD;
    
    try {
      // Fetch with authentication
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download uploads');
      }

      // Get blob and create download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `patrol_uploads_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: error.message || 'Failed to download uploads'
      };
    }
  },
};

// Patrol Alert API
export const patrolAlertAPI = {
  // Get all alerts with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.PATROL.ALERT_LIST}?${queryParams}`
      : API_ENDPOINTS.PATROL.ALERT_LIST;
    
    const response = await apiRequest(url, { method: 'GET' });
    return handleResponse(response);
  },

  // Mark alert as read
  markAsRead: async (id) => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.ALERT_MARK_READ(id), {
      method: 'POST',
      body: {},
    });
    return handleResponse(response);
  },

  // Mark action taken
  markActionTaken: async (id) => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.ALERT_MARK_ACTION(id), {
      method: 'POST',
      body: {},
    });
    return handleResponse(response);
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.ALERT_UNREAD_COUNT, {
      method: 'GET',
    });
    return handleResponse(response);
  },
};

// Patrol Dashboard API
export const patrolDashboardAPI = {
  // Get dashboard statistics
  getStatistics: async () => {
    const response = await apiRequest(API_ENDPOINTS.PATROL.DASHBOARD_STATS, {
      method: 'GET',
    });
    return handleResponse(response);
  },
};

// Export default object with all services
export default {
  duties: patrolDutyAPI,
  uploads: patrolUploadAPI,
  alerts: patrolAlertAPI,
  dashboard: patrolDashboardAPI,
};


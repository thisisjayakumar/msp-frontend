// Notifications API Service
// Centralized API calls for Notifications and Alerts

import { NOTIFICATIONS_APIS } from './api-list';
import { apiRequest } from './api-utils';
import { throttledGet, throttledPost } from './throttled-api';

// Helper function to handle API responses with graceful error handling
const handleResponse = async (response) => {
  if (response.success) {
    return response.data;
  }
  
  // Instead of throwing, return error information for graceful UI handling
  // Components can check for error property and show toast notifications
  const errorMessage = response.error || 'API request failed';
  const errorInfo = {
    error: true,
    message: errorMessage,
    status: response.status,
    details: response.data
  };
  
  // Log as warning instead of error since it's handled gracefully
  // Only log in development to avoid console noise in production
  if (process.env.NODE_ENV === 'development') {
    console.warn('API Warning:', errorMessage);
  }
  
  return errorInfo;
};

// Notifications API Service
export const notificationsAPI = {
  // Get all alerts with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${NOTIFICATIONS_APIS.ALERTS_LIST}?${queryParams}`
      : NOTIFICATIONS_APIS.ALERTS_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get my notifications (THROTTLED - used frequently)
  getMyNotifications: async () => {
    const response = await throttledGet(NOTIFICATIONS_APIS.MY_NOTIFICATIONS);
    return handleResponse(response);
  },

  // Get unread count (THROTTLED - used frequently)
  getUnreadCount: async () => {
    const response = await throttledGet(NOTIFICATIONS_APIS.UNREAD_COUNT);
    return handleResponse(response);
  },

  // Acknowledge an alert
  acknowledgeAlert: async (id, notes = '') => {
    const response = await apiRequest(NOTIFICATIONS_APIS.ACKNOWLEDGE_ALERT(id), {
      method: 'POST',
      body: { notes },
    });
    
    return handleResponse(response);
  },

  // Dismiss an alert
  dismissAlert: async (id) => {
    const response = await apiRequest(NOTIFICATIONS_APIS.DISMISS_ALERT(id), {
      method: 'POST',
      body: {},
    });
    
    return handleResponse(response);
  },

  // Get alert rules
  getAlertRules: async () => {
    const response = await apiRequest(NOTIFICATIONS_APIS.ALERT_RULES, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Export default
export default notificationsAPI;


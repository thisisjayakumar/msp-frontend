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
  // Workflow Notifications
  getWorkflowNotifications: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${NOTIFICATIONS_APIS.WORKFLOW_NOTIFICATIONS}?${queryParams}`
      : NOTIFICATIONS_APIS.WORKFLOW_NOTIFICATIONS;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Mark workflow notification as read
  markWorkflowNotificationRead: async (id) => {
    const response = await apiRequest(NOTIFICATIONS_APIS.MARK_NOTIFICATION_READ(id), {
      method: 'POST',
      body: {},
    });
    
    return handleResponse(response);
  },

  // Mark workflow notification action as taken
  markWorkflowActionTaken: async (id) => {
    const response = await apiRequest(NOTIFICATIONS_APIS.MARK_ACTION_TAKEN(id), {
      method: 'POST',
      body: {},
    });
    
    return handleResponse(response);
  },
};

// Export default
export default notificationsAPI;


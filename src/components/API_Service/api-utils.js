// API utility functions for network configuration and common operations

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Get authentication token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
  return null;
};

// Set authentication token
const setAuthToken = (token, remember = false) => {
  if (typeof window !== 'undefined') {
    if (remember) {
      localStorage.setItem('authToken', token);
    } else {
      sessionStorage.setItem('authToken', token);
    }
  }
};

// Remove authentication token
const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  }
};

// Create headers with authentication
const createAuthHeaders = (additionalHeaders = {}) => {
  const token = getAuthToken();
  const headers = { ...DEFAULT_HEADERS, ...additionalHeaders };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Generic API request function
export const apiRequest = async (url, options = {}) => {
  const config = {
    method: 'GET',
    headers: createAuthHeaders(options.headers),
    ...options,
  };

  // Add body for POST, PUT, PATCH requests
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        removeAuthToken();
        // Redirect to login page or trigger auth refresh
        window?.location?.replace('/operator'); // Redirect to default login
      }
      
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    console.error('API Request Error:', error);
    return {
      success: false,
      error: error.message,
      status: error.status || 500,
    };
  }
};

// Specific HTTP method functions
export const apiGet = (url, options = {}) => {
  return apiRequest(url, { ...options, method: 'GET' });
};

export const apiPost = (url, data, options = {}) => {
  return apiRequest(url, { 
    ...options, 
    method: 'POST', 
    body: data 
  });
};

export const apiPut = (url, data, options = {}) => {
  return apiRequest(url, { 
    ...options, 
    method: 'PUT', 
    body: data 
  });
};

export const apiPatch = (url, data, options = {}) => {
  return apiRequest(url, { 
    ...options, 
    method: 'PATCH', 
    body: data 
  });
};

export const apiDelete = (url, options = {}) => {
  return apiRequest(url, { ...options, method: 'DELETE' });
};

// File upload function
export const apiUpload = async (url, file, additionalData = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add additional form data
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });

  const token = getAuthToken();
  const headers = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return apiRequest(url, {
    method: 'POST',
    headers,
    body: formData,
  });
};

// Authentication utilities
export const authUtils = {
  getToken: getAuthToken,
  setToken: setAuthToken,
  removeToken: removeAuthToken,
  isAuthenticated: () => !!getAuthToken(),
};

// Request interceptor for common error handling
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // You can add global error handling here
  // For example, show toast notifications, log to external service, etc.
  
  return error;
};

export default {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  apiUpload,
  authUtils,
  handleApiError,
};

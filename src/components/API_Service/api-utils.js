// API utility functions for network configuration and common operations

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Token refresh state management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  console.log('Processing queue with', failedQueue.length, 'requests');
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Get authentication token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
  return null;
};

// Get refresh token from localStorage
const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
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

// Set refresh token
const setRefreshToken = (token, remember = false) => {
  if (typeof window !== 'undefined') {
    if (remember) {
      localStorage.setItem('refreshToken', token);
    } else {
      sessionStorage.setItem('refreshToken', token);
    }
  }
};

// Set both tokens
const setTokens = (authToken, refreshToken, remember = false) => {
  setAuthToken(authToken, remember);
  setRefreshToken(refreshToken, remember);
};

// Remove authentication token
const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
  }
};

// Refresh token function
const refreshAuthToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  
  try {
    const refreshUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'}/auth/token/refresh/`;
    
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    // console.log('Refresh response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Token refresh failed:', response.status, errorData);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Update the auth token (keep the same storage type as before)
    const wasInLocalStorage = localStorage.getItem('authToken') !== null;
    setAuthToken(data.access, wasInLocalStorage);
    
    // Update refresh token if provided
    if (data.refresh) {
      setRefreshToken(data.refresh, wasInLocalStorage);
    }
    
    return data.access;
  } catch (error) {
    console.error('Token refresh error:', error);
    // If refresh fails, remove all tokens and redirect to login
    removeAuthToken();
    throw error;
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

// Generic API request function with automatic token refresh
export const apiRequest = async (url, options = {}, retryCount = 0) => {
  const config = {
    method: 'GET',
    headers: createAuthHeaders(options.headers),
    ...options,
  };
  
  // Prevent infinite retry loops
  if (retryCount > 2) {
    console.error('Maximum retry attempts reached');
    throw new Error('Maximum retry attempts reached');
  }

  // Add body for POST, PUT, PATCH requests
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    // console.log('Making API request to:', url, 'with method:', config.method);
    // console.log('Current auth token exists:', !!getAuthToken());
    // console.log('Current refresh token exists:', !!getRefreshToken());
    const response = await fetch(url, config);
    // console.log('Response status:', response.status, 'for URL:', url);
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      
      // Handle authentication errors with automatic token refresh
      if (response.status === 401) {
        
        if (getRefreshToken()) {
          // Don't try to refresh token for refresh endpoint itself
          if (url.includes('/auth/token/refresh/')) {
            console.log('Refresh token endpoint failed, removing tokens');
            removeAuthToken();
            window?.location?.replace('/operator');
            throw new Error('Refresh token expired');
          }

          // If already refreshing, queue this request
          if (isRefreshing) {
            console.log('Already refreshing token, queuing request');
            return new Promise((resolve, reject) => {
              failedQueue.push({ 
                resolve: (token) => {
                  console.log('Retrying queued request with new token');
                  resolve(apiRequest(url, options));
                }, 
                reject 
              });
            });
          }

          console.log('Starting token refresh process');
          isRefreshing = true;

          try {
            const newToken = await refreshAuthToken();
            console.log('Token refreshed successfully');
            processQueue(null, newToken);
            
            // Update the authorization header with new token
            const updatedOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`
              }
            };
            
            // Retry the original request with new token (non-recursive)
            console.log('Retrying original request with new token');
            // Add small delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            return apiRequest(url, updatedOptions, retryCount + 1);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            processQueue(refreshError, null);
            removeAuthToken();
            window?.location?.replace('/operator');
            throw new Error('Authentication failed');
          } finally {
            isRefreshing = false;
          }
        } else {
          // No refresh token available, redirect to login
          console.log('No refresh token available, redirecting to login');
          removeAuthToken();
          window?.location?.replace('/operator');
          throw new Error('No authentication token available');
        }
      }
      
      // Handle different types of error responses
      
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      if (data.message) {
        errorMessage = data.message;
      } else if (data.detail) {
        errorMessage = data.detail;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (typeof data === 'string') {
        errorMessage = data;
      } else if (typeof data === 'object') {
        // Handle validation errors
        const validationErrors = [];
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            validationErrors.push(`${key}: ${data[key].join(', ')}`);
          } else if (typeof data[key] === 'object' && data[key] !== null) {
            // Handle nested objects (like heat_numbers_data array)
            if (Array.isArray(data[key])) {
              data[key].forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                  Object.keys(item).forEach(subKey => {
                    if (Array.isArray(item[subKey])) {
                      validationErrors.push(`${key}[${index}].${subKey}: ${item[subKey].join(', ')}`);
                    } else {
                      validationErrors.push(`${key}[${index}].${subKey}: ${item[subKey]}`);
                    }
                  });
                } else {
                  validationErrors.push(`${key}[${index}]: ${item}`);
                }
              });
            } else {
              Object.keys(data[key]).forEach(subKey => {
                if (Array.isArray(data[key][subKey])) {
                  validationErrors.push(`${key}.${subKey}: ${data[key][subKey].join(', ')}`);
                } else {
                  validationErrors.push(`${key}.${subKey}: ${data[key][subKey]}`);
                }
              });
            }
          } else {
            validationErrors.push(`${key}: ${data[key]}`);
          }
        });
        if (validationErrors.length > 0) {
          errorMessage = validationErrors.join('; ');
        }
      }
      
      const error = new Error(errorMessage);
      error.response = { status: response.status, data };
      throw error;
    }

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    console.error('API Request Error:', error);
    
    // Don't return success: false for authentication errors that should redirect
    if (error.message.includes('Authentication failed') || 
        error.message.includes('Refresh token expired') ||
        error.message.includes('No authentication token available')) {
      throw error;
    }
    
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

// File upload function with automatic token refresh
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

  // Use apiRequest which now handles token refresh automatically
  return apiRequest(url, {
    method: 'POST',
    headers,
    body: formData,
  });
};

// Login utility function that properly handles both tokens
export const handleLoginSuccess = (loginResponse, remember = false) => {
  console.log('Handling login success, storing tokens...');
  
  if (loginResponse.access) {
    setAuthToken(loginResponse.access, remember);
  }
  
  if (loginResponse.refresh) {
    setRefreshToken(loginResponse.refresh, remember);
  }
  
  
  return {
    success: true,
    hasAuthToken: !!loginResponse.access,
    hasRefreshToken: !!loginResponse.refresh,
  };
};

// Debug function to check current token status
export const debugTokenStatus = () => {
  const authToken = getAuthToken();
  const refreshToken = getRefreshToken();
  
  
  return {
    hasAuthToken: !!authToken,
    hasRefreshToken: !!refreshToken,
    isRefreshing,
    queueLength: failedQueue.length
  };
};

// Authentication utilities
export const authUtils = {
  getToken: getAuthToken,
  getRefreshToken: getRefreshToken,
  setToken: setAuthToken,
  setRefreshToken: setRefreshToken,
  setTokens: setTokens,
  removeToken: removeAuthToken,
  refreshToken: refreshAuthToken,
  isAuthenticated: () => !!getAuthToken(),
  hasRefreshToken: () => !!getRefreshToken(),
  handleLoginSuccess: handleLoginSuccess,
  debugTokenStatus: debugTokenStatus,
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
  handleLoginSuccess,
  debugTokenStatus,
};

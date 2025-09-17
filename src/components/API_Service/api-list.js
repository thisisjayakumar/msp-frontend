// API endpoints configuration
// This file contains all the API network calls for the application

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Authentication APIs
export const AUTH_APIS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  
  // Role-specific authentication endpoints
  ADMIN_LOGIN: `${API_BASE_URL}/auth/admin/login`,
  MANAGER_LOGIN: `${API_BASE_URL}/auth/manager/login`,
  SUPERVISOR_LOGIN: `${API_BASE_URL}/auth/supervisor/login`,
  STORE_MANAGER_LOGIN: `${API_BASE_URL}/auth/store-manager/login`,
  OPERATOR_LOGIN: `${API_BASE_URL}/auth/operator/login`,
};

// User APIs
export const USER_APIS = {
  GET_PROFILE: `${API_BASE_URL}/user/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/user/profile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/user/change-password`,
  DELETE_ACCOUNT: `${API_BASE_URL}/user/delete`,
};

// Example: Additional API categories can be added here
// export const PRODUCT_APIS = {
//   GET_ALL: `${API_BASE_URL}/products`,
//   GET_BY_ID: (id) => `${API_BASE_URL}/products/${id}`,
//   CREATE: `${API_BASE_URL}/products`,
//   UPDATE: (id) => `${API_BASE_URL}/products/${id}`,
//   DELETE: (id) => `${API_BASE_URL}/products/${id}`,
// };

// Export all APIs
export const API_ENDPOINTS = {
  AUTH: AUTH_APIS,
  USER: USER_APIS,
  // Add more API categories here as needed
};

export default API_ENDPOINTS;

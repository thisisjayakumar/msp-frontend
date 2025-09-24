// API endpoints configuration
// This file contains all the API network calls for the application

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

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

// Manufacturing APIs
export const MANUFACTURING_APIS = {
  // Manufacturing Orders
  MO_LIST: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/`,
  MO_CREATE: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/`,
  MO_DETAIL: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/`,
  MO_UPDATE: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/`,
  MO_DELETE: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/`,
  MO_CHANGE_STATUS: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/change_status/`,
  MO_DASHBOARD_STATS: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/dashboard_stats/`,
  MO_PRODUCTS: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/products/`,
  MO_SUPERVISORS: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/supervisors/`,

  // Purchase Orders
  PO_LIST: `${API_BASE_URL}/manufacturing/api/purchase-orders/`,
  PO_CREATE: `${API_BASE_URL}/manufacturing/api/purchase-orders/`,
  PO_DETAIL: (id) => `${API_BASE_URL}/manufacturing/api/purchase-orders/${id}/`,
  PO_UPDATE: (id) => `${API_BASE_URL}/manufacturing/api/purchase-orders/${id}/`,
  PO_DELETE: (id) => `${API_BASE_URL}/manufacturing/api/purchase-orders/${id}/`,
  PO_CHANGE_STATUS: (id) => `${API_BASE_URL}/manufacturing/api/purchase-orders/${id}/change_status/`,
  PO_DASHBOARD_STATS: `${API_BASE_URL}/manufacturing/api/purchase-orders/dashboard_stats/`,
  PO_RAW_MATERIALS: `${API_BASE_URL}/manufacturing/api/purchase-orders/raw_materials/`,
  PO_VENDORS: `${API_BASE_URL}/manufacturing/api/purchase-orders/vendors/`,
  PO_MATERIAL_DETAILS: `${API_BASE_URL}/manufacturing/api/purchase-orders/material_details/`,
  PO_VENDOR_DETAILS: `${API_BASE_URL}/manufacturing/api/purchase-orders/vendor_details/`,
};

// Export all APIs
export const API_ENDPOINTS = {
  AUTH: AUTH_APIS,
  USER: USER_APIS,
  MANUFACTURING: MANUFACTURING_APIS,
};

export default API_ENDPOINTS;

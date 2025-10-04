// API endpoints configuration
// This file contains all the API network calls for the application

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Authentication APIs
export const AUTH_APIS = {
  LOGIN: `${API_BASE_URL}/auth/login/`,
  LOGOUT: `${API_BASE_URL}/auth/logout/`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/token/refresh/`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password/`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password/`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email/`,
  PROFILE: `${API_BASE_URL}/auth/profile/`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password/`,
  PERMISSIONS: `${API_BASE_URL}/auth/permissions/`,
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
  MO_PRODUCT_DETAILS: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/product_details/`,
  MO_SUPERVISORS: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/supervisors/`,
  MO_CUSTOMERS: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/customers/`,
  MO_UPDATE_DETAILS: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/update_mo_details/`,
  MO_APPROVE: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/approve_mo/`,
  MO_SUPERVISOR_DASHBOARD: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/supervisor_dashboard/`,
  MO_START: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/start_mo/`,

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

// Inventory APIs (RM Store)
export const INVENTORY_APIS = {
  // Products
  PRODUCT_LIST: `${API_BASE_URL}/inventory/products/`,
  PRODUCT_CREATE: `${API_BASE_URL}/inventory/products/`,
  PRODUCT_DETAIL: (id) => `${API_BASE_URL}/inventory/products/${id}/`,
  PRODUCT_UPDATE: (id) => `${API_BASE_URL}/inventory/products/${id}/`,
  PRODUCT_DELETE: (id) => `${API_BASE_URL}/inventory/products/${id}/`,
  PRODUCT_DASHBOARD: `${API_BASE_URL}/inventory/products/dashboard/`,
  PRODUCT_DROPDOWN: `${API_BASE_URL}/inventory/products/dropdown/`,

  // Stock Balances
  STOCK_BALANCE_LIST: `${API_BASE_URL}/inventory/stock-balances/`,
  STOCK_BALANCE_CREATE: `${API_BASE_URL}/inventory/stock-balances/`,
  STOCK_BALANCE_DETAIL: (id) => `${API_BASE_URL}/inventory/stock-balances/${id}/`,
  STOCK_BALANCE_UPDATE: (id) => `${API_BASE_URL}/inventory/stock-balances/${id}/`,
  STOCK_BALANCE_DELETE: (id) => `${API_BASE_URL}/inventory/stock-balances/${id}/`,
  STOCK_BALANCE_BULK_UPDATE: `${API_BASE_URL}/inventory/stock-balances/bulk_update/`,
  STOCK_BALANCE_UPDATE_BY_CODE: `${API_BASE_URL}/inventory/stock-balances/update_by_product_code/`,

  // Raw Materials
  RAW_MATERIAL_LIST: `${API_BASE_URL}/inventory/raw-materials/`,
  RAW_MATERIAL_DETAIL: (id) => `${API_BASE_URL}/inventory/raw-materials/${id}/`,
  RAW_MATERIAL_DROPDOWN: `${API_BASE_URL}/inventory/raw-materials/dropdown/`,

  // Dashboard
  DASHBOARD_STATS: `${API_BASE_URL}/inventory/dashboard/stats/`,
};

// Export all APIs
export const API_ENDPOINTS = {
  AUTH: AUTH_APIS,
  USER: USER_APIS,
  MANUFACTURING: MANUFACTURING_APIS,
  INVENTORY: INVENTORY_APIS,
};

export default API_ENDPOINTS;

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
  MO_RM_STORE_USERS: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/rm_store_users/`,
  MO_CUSTOMERS: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/customers/`,
  MO_UPDATE_DETAILS: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/update_mo_details/`,
  MO_APPROVE: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/approve_mo/`,
  MO_RM_APPROVE: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/rm_approve/`,
  MO_RM_STORE_DASHBOARD: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/rm_store_dashboard/`,
  MO_SUPERVISOR_DASHBOARD: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/supervisor_dashboard/`,
  MO_START: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/start_mo/`,
  MO_CALCULATE_RM: `${API_BASE_URL}/manufacturing/api/manufacturing-orders/calculate_rm_requirement/`,

  // Batches
  BATCH_LIST: `${API_BASE_URL}/manufacturing/api/batches/`,
  BATCH_CREATE: `${API_BASE_URL}/manufacturing/api/batches/`,
  BATCH_DETAIL: (id) => `${API_BASE_URL}/manufacturing/api/batches/${id}/`,
  BATCH_UPDATE: (id) => `${API_BASE_URL}/manufacturing/api/batches/${id}/`,
  BATCH_DELETE: (id) => `${API_BASE_URL}/manufacturing/api/batches/${id}/`,
  BATCH_BY_MO: `${API_BASE_URL}/manufacturing/api/batches/by_mo/`,
  BATCH_START: (id) => `${API_BASE_URL}/manufacturing/api/batches/${id}/start_batch/`,
  BATCH_COMPLETE: (id) => `${API_BASE_URL}/manufacturing/api/batches/${id}/complete_batch/`,
  BATCH_UPDATE_PROGRESS: (id) => `${API_BASE_URL}/manufacturing/api/batches/${id}/update_progress/`,
  BATCH_DASHBOARD_STATS: `${API_BASE_URL}/manufacturing/api/batches/dashboard_stats/`,

  // Purchase Orders
  PO_LIST: `${API_BASE_URL}/manufacturing/api/purchase-orders/`,
  PO_CREATE: `${API_BASE_URL}/manufacturing/api/purchase-orders/`,
  PO_DETAIL: (id) => `${API_BASE_URL}/manufacturing/api/purchase-orders/${id}/`,
  PO_UPDATE: (id) => `${API_BASE_URL}/manufacturing/api/purchase-orders/${id}/`,
  PO_DELETE: (id) => `${API_BASE_URL}/manufacturing/api/purchase-orders/${id}/`,
  PO_CHANGE_STATUS: (id) => `${API_BASE_URL}/manufacturing/api/purchase-orders/${id}/change_status/`,
  PO_DASHBOARD_STATS: `${API_BASE_URL}/manufacturing/api/purchase-orders/dashboard_stats/`,
  PO_RAW_MATERIALS: `${API_BASE_URL}/inventory/raw-materials/`,  // Use existing inventory API
  PO_VENDORS: `${API_BASE_URL}/third-party/vendors/`,  // Use existing third-party API
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
  STOCK_BALANCE_UPDATE_BY_MATERIAL: `${API_BASE_URL}/inventory/stock-balances/update_by_material_code/`,

  // Raw Materials
  RAW_MATERIAL_LIST: `${API_BASE_URL}/inventory/raw-materials/`,
  RAW_MATERIAL_DETAIL: (id) => `${API_BASE_URL}/inventory/raw-materials/${id}/`,
  RAW_MATERIAL_DROPDOWN: `${API_BASE_URL}/inventory/raw-materials/dropdown/`,

  // Dashboard
  DASHBOARD_STATS: `${API_BASE_URL}/inventory/dashboard/stats/`,

  // Transactions
  TRANSACTION_LIST: `${API_BASE_URL}/inventory/transactions/`,

  // GRM Receipts
  GRM_RECEIPTS_LIST: `${API_BASE_URL}/inventory/grm-receipts/`,
  GRM_RECEIPTS_CREATE: `${API_BASE_URL}/inventory/grm-receipts/`,
  GRM_RECEIPTS_DETAIL: (id) => `${API_BASE_URL}/inventory/grm-receipts/${id}/`,
  GRM_RECEIPTS_QUALITY_CHECK: (id) => `${API_BASE_URL}/inventory/grm-receipts/${id}/quality_check/`,
  GRM_RECEIPTS_COMPLETE: (id) => `${API_BASE_URL}/inventory/grm-receipts/${id}/complete_receipt/`,
};

// Notifications APIs
export const NOTIFICATIONS_APIS = {
  ALERTS_LIST: `${API_BASE_URL}/notifications/api/alerts/`,
  MY_NOTIFICATIONS: `${API_BASE_URL}/notifications/api/alerts/my_notifications/`,
  UNREAD_COUNT: `${API_BASE_URL}/notifications/api/alerts/unread_count/`,
  ACKNOWLEDGE_ALERT: (id) => `${API_BASE_URL}/notifications/api/alerts/${id}/acknowledge/`,
  DISMISS_ALERT: (id) => `${API_BASE_URL}/notifications/api/alerts/${id}/dismiss/`,
  ALERT_RULES: `${API_BASE_URL}/notifications/api/alert-rules/`,
};

// Process Tracking APIs
export const PROCESS_TRACKING_APIS = {
  MO_WITH_PROCESSES: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/process_tracking/`,
  INITIALIZE_PROCESSES: (id) => `${API_BASE_URL}/manufacturing/api/manufacturing-orders/${id}/initialize_processes/`,
  ACTIVE_ALERTS: `${API_BASE_URL}/manufacturing/api/process-alerts/active_alerts/`,
};

// Admin Dashboard APIs
export const ADMIN_APIS = {
  // User Management
  USERS_LIST: `${API_BASE_URL}/auth/admin/users/`,
  USERS_CREATE: `${API_BASE_URL}/auth/admin/users/`,
  USERS_DETAIL: (id) => `${API_BASE_URL}/auth/admin/users/${id}/`,
  USERS_UPDATE: (id) => `${API_BASE_URL}/auth/admin/users/${id}/`,
  USERS_DELETE: (id) => `${API_BASE_URL}/auth/admin/users/${id}/`,
  USERS_BULK_ACTION: `${API_BASE_URL}/auth/admin/users/bulk_action/`,
  USERS_MANAGE_ROLES: (id) => `${API_BASE_URL}/auth/admin/users/${id}/manage_roles/`,
  USERS_RESET_PASSWORD: (id) => `${API_BASE_URL}/auth/admin/users/${id}/reset_password/`,
  USERS_TOGGLE_ACTIVE: (id) => `${API_BASE_URL}/auth/admin/users/${id}/toggle_active/`,
  USERS_MULTIPLE_ROLES: `${API_BASE_URL}/auth/admin/users/multiple-roles/`,
  USERS_WITHOUT_ROLES: `${API_BASE_URL}/auth/admin/users/without-roles/`,

  // Role Management
  ROLES_LIST: `${API_BASE_URL}/auth/admin/roles/`,
  ROLES_CREATE: `${API_BASE_URL}/auth/admin/roles/`,
  ROLES_DETAIL: (id) => `${API_BASE_URL}/auth/admin/roles/${id}/`,
  ROLES_UPDATE: (id) => `${API_BASE_URL}/auth/admin/roles/${id}/`,
  ROLES_DELETE: (id) => `${API_BASE_URL}/auth/admin/roles/${id}/`,
  ROLES_USERS: (id) => `${API_BASE_URL}/auth/admin/roles/${id}/users/`,
  ROLES_HIERARCHY: `${API_BASE_URL}/auth/admin/roles/hierarchy/`,

  // Dashboard Statistics
  DASHBOARD_STATS: `${API_BASE_URL}/auth/admin/dashboard/stats/`,
  DEPARTMENT_SUMMARY: `${API_BASE_URL}/auth/admin/department-summary/`,
  ROLE_PERMISSIONS_MATRIX: `${API_BASE_URL}/auth/admin/role-permissions-matrix/`,
  SYNC_PROFILES: `${API_BASE_URL}/auth/admin/sync-profiles/`,
};

// Work Center & Supervisor Management APIs
export const WORK_CENTER_APIS = {
  // Work Center Masters
  WC_LIST: `${API_BASE_URL}/processes/api/work-centers/`,
  WC_CREATE: `${API_BASE_URL}/processes/api/work-centers/`,
  WC_DETAIL: (id) => `${API_BASE_URL}/processes/api/work-centers/${id}/`,
  WC_UPDATE: (id) => `${API_BASE_URL}/processes/api/work-centers/${id}/`,
  WC_DELETE: (id) => `${API_BASE_URL}/processes/api/work-centers/${id}/`,
  WC_AVAILABLE: `${API_BASE_URL}/processes/api/work-centers/available_work_centers/`,
  WC_SUPERVISORS: `${API_BASE_URL}/processes/api/work-centers/supervisors/`,

  // Daily Supervisor Status
  SUPERVISOR_STATUS_LIST: `${API_BASE_URL}/processes/api/supervisor-status/`,
  SUPERVISOR_STATUS_DETAIL: (id) => `${API_BASE_URL}/processes/api/supervisor-status/${id}/`,
  SUPERVISOR_STATUS_TODAY: `${API_BASE_URL}/processes/api/supervisor-status/today_dashboard/`,
  SUPERVISOR_STATUS_MANUAL_UPDATE: (id) => `${API_BASE_URL}/processes/api/supervisor-status/${id}/manual_update/`,
  SUPERVISOR_STATUS_RUN_CHECK: `${API_BASE_URL}/processes/api/supervisor-status/run_attendance_check/`,

  // Supervisor Activity Logs
  ACTIVITY_LOG_LIST: `${API_BASE_URL}/processes/api/supervisor-activity/`,
  ACTIVITY_LOG_DETAIL: (id) => `${API_BASE_URL}/processes/api/supervisor-activity/${id}/`,
  ACTIVITY_LOG_TODAY: `${API_BASE_URL}/processes/api/supervisor-activity/today/`,
  ACTIVITY_LOG_SUMMARY: `${API_BASE_URL}/processes/api/supervisor-activity/summary/`,
};

// Export all APIs
export const API_ENDPOINTS = {
  AUTH: AUTH_APIS,
  USER: USER_APIS,
  MANUFACTURING: MANUFACTURING_APIS,
  INVENTORY: INVENTORY_APIS,
  NOTIFICATIONS: NOTIFICATIONS_APIS,
  PROCESS_TRACKING: PROCESS_TRACKING_APIS,
  ADMIN: ADMIN_APIS,
  WORK_CENTER: WORK_CENTER_APIS,
};

export default API_ENDPOINTS;

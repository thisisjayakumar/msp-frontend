// API endpoints configuration
// This file contains all the API network calls for the application

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Debug logging for API base URL (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:');
  console.log('  - NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
  console.log('  - Using API_BASE_URL:', API_BASE_URL);
  console.log('  - Current hostname:', window.location.hostname);
}

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
  MO_LIST: `${API_BASE_URL}/manufacturing/manufacturing-orders/`,
  MO_CREATE: `${API_BASE_URL}/manufacturing/manufacturing-orders/`,
  MO_DETAIL: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/`,
  MO_UPDATE: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/`,
  MO_DELETE: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/`,
  MO_CHANGE_STATUS: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/change_status/`,
  MO_DASHBOARD_STATS: `${API_BASE_URL}/manufacturing/manufacturing-orders/dashboard_stats/`,
  MO_PRODUCTS: `${API_BASE_URL}/manufacturing/manufacturing-orders/products/`,
  MO_PRODUCT_DETAILS: `${API_BASE_URL}/manufacturing/manufacturing-orders/product_details/`,
  MO_SUPERVISORS: `${API_BASE_URL}/manufacturing/manufacturing-orders/supervisors/`,
  MO_RM_STORE_USERS: `${API_BASE_URL}/manufacturing/manufacturing-orders/rm_store_users/`,
  MO_CUSTOMERS: `${API_BASE_URL}/manufacturing/manufacturing-orders/customers/`,
  MO_UPDATE_DETAILS: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/update_mo_details/`,
  MO_RM_STORE_DASHBOARD: `${API_BASE_URL}/manufacturing/manufacturing-orders/rm_store_dashboard/`,
  MO_SUPERVISOR_DASHBOARD: `${API_BASE_URL}/manufacturing/manufacturing-orders/supervisor_dashboard/`,
  MO_START: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/start_mo/`,
  MO_CALCULATE_RM: `${API_BASE_URL}/manufacturing/manufacturing-orders/calculate_rm_requirement/`,
  MO_AVAILABLE_HEAT_NUMBERS: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/available-heat-numbers/`,
  
  // MO Priority & Resource Management
  MO_STOP: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/stop/`,
  MO_RESOURCE_STATUS: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/resource-status/`,
  MO_PRIORITY_QUEUE: `${API_BASE_URL}/manufacturing/manufacturing-orders/priority-queue/`,

  // Batches
  BATCH_LIST: `${API_BASE_URL}/manufacturing/batches/`,
  BATCH_CREATE: `${API_BASE_URL}/manufacturing/batches/`,
  BATCH_DETAIL: (id) => `${API_BASE_URL}/manufacturing/batches/${id}/`,
  BATCH_UPDATE: (id) => `${API_BASE_URL}/manufacturing/batches/${id}/`,
  BATCH_DELETE: (id) => `${API_BASE_URL}/manufacturing/batches/${id}/`,
  BATCH_BY_MO: `${API_BASE_URL}/manufacturing/batches/by_mo/`,
  BATCH_START: (id) => `${API_BASE_URL}/manufacturing/batches/${id}/start_batch/`,
  BATCH_COMPLETE: (id) => `${API_BASE_URL}/manufacturing/batches/${id}/complete_batch/`,
  BATCH_UPDATE_PROGRESS: (id) => `${API_BASE_URL}/manufacturing/batches/${id}/update_progress/`,
  BATCH_DASHBOARD_STATS: `${API_BASE_URL}/manufacturing/batches/dashboard_stats/`,

  // Purchase Orders
  PO_LIST: `${API_BASE_URL}/manufacturing/purchase-orders/`,
  PO_CREATE: `${API_BASE_URL}/manufacturing/purchase-orders/`,
  PO_DETAIL: (id) => `${API_BASE_URL}/manufacturing/purchase-orders/${id}/`,
  PO_UPDATE: (id) => `${API_BASE_URL}/manufacturing/purchase-orders/${id}/`,
  PO_DELETE: (id) => `${API_BASE_URL}/manufacturing/purchase-orders/${id}/`,
  PO_CHANGE_STATUS: (id) => `${API_BASE_URL}/manufacturing/purchase-orders/${id}/change_status/`,
  PO_DASHBOARD_STATS: `${API_BASE_URL}/manufacturing/purchase-orders/dashboard_stats/`,
  PO_RAW_MATERIALS: `${API_BASE_URL}/inventory/raw-materials/`,  // Use existing inventory API
  PO_VENDORS: `${API_BASE_URL}/third-party/vendors/`,  // Use existing third-party API

  // Raw Material Allocations
  RM_ALLOCATION_LIST: `${API_BASE_URL}/manufacturing/rm-allocations/`,
  RM_ALLOCATION_BY_MO: `${API_BASE_URL}/manufacturing/rm-allocations/by_mo/`,
  RM_ALLOCATION_SUMMARY: `${API_BASE_URL}/manufacturing/rm-allocations/summary/`,
};

// FG Store APIs
export const FG_STORE_APIS = {
  // Dashboard endpoints
  LOOSE_FG_STOCK: `${API_BASE_URL}/fg-store/dashboard/loose_fg_stock/`,
  STOCK_LEVELS: `${API_BASE_URL}/fg-store/dashboard/stock_levels/`,
  
  // Dispatch Batches
  DISPATCH_BATCH_LIST: `${API_BASE_URL}/fg-store/dispatch-batches/`,
  DISPATCH_BATCH_DETAIL: (id) => `${API_BASE_URL}/fg-store/dispatch-batches/${id}/`,
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
  RAW_MATERIAL_CREATE: `${API_BASE_URL}/inventory/raw-materials/`,
  RAW_MATERIAL_DETAIL: (id) => `${API_BASE_URL}/inventory/raw-materials/${id}/`,
  RAW_MATERIAL_UPDATE: (id) => `${API_BASE_URL}/inventory/raw-materials/${id}/`,
  RAW_MATERIAL_DELETE: (id) => `${API_BASE_URL}/inventory/raw-materials/${id}/`,
  RAW_MATERIAL_DROPDOWN: `${API_BASE_URL}/inventory/raw-materials/dropdown/`,
  RAW_MATERIAL_CODES: `${API_BASE_URL}/inventory/raw-materials/material-codes/`,  // Lightweight endpoint for dropdowns

  // Dashboard
  DASHBOARD_STATS: `${API_BASE_URL}/inventory/dashboard/stats/`,

  // Transactions
  TRANSACTION_LIST: `${API_BASE_URL}/inventory/transactions/`,
  TRANSACTION_DETAIL: (id) => `${API_BASE_URL}/inventory/transactions/${id}/`,

  // GRM Receipts
  GRM_RECEIPTS_LIST: `${API_BASE_URL}/inventory/grm-receipts/`,
  GRM_RECEIPTS_CREATE: `${API_BASE_URL}/inventory/grm-receipts/`,
  GRM_RECEIPTS_DETAIL: (id) => `${API_BASE_URL}/inventory/grm-receipts/${id}/`,
  GRM_RECEIPTS_QUALITY_CHECK: (id) => `${API_BASE_URL}/inventory/grm-receipts/${id}/quality_check/`,
  GRM_RECEIPTS_COMPLETE: (id) => `${API_BASE_URL}/inventory/grm-receipts/${id}/complete_receipt/`,

  // Heat Numbers
  HEAT_NUMBERS_LIST: `${API_BASE_URL}/inventory/heat-numbers/`,
  HEAT_NUMBERS_CREATE: `${API_BASE_URL}/inventory/heat-numbers/`,
  HEAT_NUMBERS_DETAIL: (id) => `${API_BASE_URL}/inventory/heat-numbers/${id}/`,
  HEAT_NUMBERS_UPDATE: (id) => `${API_BASE_URL}/inventory/heat-numbers/${id}/`,
  HEAT_NUMBERS_DELETE: (id) => `${API_BASE_URL}/inventory/heat-numbers/${id}/`,
  HEAT_NUMBERS_BY_MATERIAL: (materialId) => `${API_BASE_URL}/inventory/heat-numbers/by_material/${materialId}/`,
  HEAT_NUMBERS_BULK_CREATE: `${API_BASE_URL}/inventory/heat-numbers/bulk_create/`,

  // RM Returns
  RM_RETURNS_LIST: `${API_BASE_URL}/inventory/rm-returns/`,
  RM_RETURNS_CREATE: `${API_BASE_URL}/inventory/rm-returns/`,
  RM_RETURNS_DETAIL: (id) => `${API_BASE_URL}/inventory/rm-returns/${id}/`,
  RM_RETURNS_UPDATE: (id) => `${API_BASE_URL}/inventory/rm-returns/${id}/`,
  RM_RETURNS_DELETE: (id) => `${API_BASE_URL}/inventory/rm-returns/${id}/`,
  RM_RETURNS_PENDING: `${API_BASE_URL}/inventory/rm-returns/pending/`,
  RM_RETURNS_BY_BATCH: `${API_BASE_URL}/inventory/rm-returns/by-batch/`,
  RM_RETURNS_PROCESS_DISPOSITION: (id) => `${API_BASE_URL}/inventory/rm-returns/${id}/process-disposition/`,
};

// Notifications APIs
export const NOTIFICATIONS_APIS = {
  WORKFLOW_NOTIFICATIONS: `${API_BASE_URL}/notifications/api/workflow-notifications/`,
  MARK_NOTIFICATION_READ: (id) => `${API_BASE_URL}/notifications/api/workflow-notifications/${id}/mark_as_read/`,
  MARK_ACTION_TAKEN: (id) => `${API_BASE_URL}/notifications/api/workflow-notifications/${id}/mark_action_taken/`,
};

// Process Tracking APIs
export const PROCESS_TRACKING_APIS = {
  MO_WITH_PROCESSES: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/process_tracking/`,
  INITIALIZE_PROCESSES: (id) => `${API_BASE_URL}/manufacturing/manufacturing-orders/${id}/initialize_processes/`,
  ACTIVE_ALERTS: `${API_BASE_URL}/manufacturing/process-alerts/active_alerts/`,
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

// Patrol Management APIs
export const PATROL_APIS = {
  // Patrol Duties
  DUTY_LIST: `${API_BASE_URL}/patrol/duties/`,
  DUTY_CREATE: `${API_BASE_URL}/patrol/duties/`,
  DUTY_DETAIL: (id) => `${API_BASE_URL}/patrol/duties/${id}/`,
  DUTY_UPDATE: (id) => `${API_BASE_URL}/patrol/duties/${id}/`,
  DUTY_DELETE: (id) => `${API_BASE_URL}/patrol/duties/${id}/`,
  DUTY_CANCEL: (id) => `${API_BASE_URL}/patrol/duties/${id}/cancel_duty/`,
  DUTY_ACTIVE: `${API_BASE_URL}/patrol/duties/active_duties/`,
  PATROL_USERS: `${API_BASE_URL}/patrol/duties/patrol_users/`,
  PROCESS_LIST: `${API_BASE_URL}/patrol/duties/process_list/`,

  // Patrol Uploads
  UPLOAD_LIST: `${API_BASE_URL}/patrol/uploads/`,
  UPLOAD_DETAIL: (id) => `${API_BASE_URL}/patrol/uploads/${id}/`,
  UPLOAD_SUBMIT: (id) => `${API_BASE_URL}/patrol/uploads/${id}/submit_upload/`,
  UPLOAD_DELETE: (id) => `${API_BASE_URL}/patrol/uploads/${id}/delete_upload/`,
  MY_TODAY_UPLOADS: `${API_BASE_URL}/patrol/uploads/my_today_uploads/`,
  UPLOAD_DOWNLOAD: `${API_BASE_URL}/patrol/uploads/download_uploads/`,

  // Patrol Alerts
  ALERT_LIST: `${API_BASE_URL}/patrol/alerts/`,
  ALERT_MARK_READ: (id) => `${API_BASE_URL}/patrol/alerts/${id}/mark_as_read/`,
  ALERT_MARK_ACTION: (id) => `${API_BASE_URL}/patrol/alerts/${id}/mark_action_taken/`,
  ALERT_UNREAD_COUNT: `${API_BASE_URL}/patrol/alerts/unread_count/`,

  // Dashboard
  DASHBOARD_STATS: `${API_BASE_URL}/patrol/dashboard/statistics/`,
};

// Packing Zone Management APIs
export const PACKING_ZONE_APIS = {
  // Packing Batches
  BATCH_LIST: `${API_BASE_URL}/packing-zone/batches/`,
  BATCH_CREATE: `${API_BASE_URL}/packing-zone/batches/`,
  BATCH_DETAIL: (id) => `${API_BASE_URL}/packing-zone/batches/${id}/`,
  BATCH_UPDATE: (id) => `${API_BASE_URL}/packing-zone/batches/${id}/`,
  BATCH_DELETE: (id) => `${API_BASE_URL}/packing-zone/batches/${id}/`,
  BATCH_VERIFY: (id) => `${API_BASE_URL}/packing-zone/batches/${id}/verify/`,
  BATCH_REPORT_ISSUE: (id) => `${API_BASE_URL}/packing-zone/batches/${id}/report_issue/`,
  BATCH_RELEASE_HOLD: (id) => `${API_BASE_URL}/packing-zone/batches/${id}/release_from_hold/`,
  BATCH_TO_BE_PACKED: `${API_BASE_URL}/packing-zone/batches/to_be_packed/`,

  // Packing Transactions
  TRANSACTION_LIST: `${API_BASE_URL}/packing-zone/transactions/`,
  TRANSACTION_CREATE: `${API_BASE_URL}/packing-zone/transactions/`,
  TRANSACTION_DETAIL: (id) => `${API_BASE_URL}/packing-zone/transactions/${id}/`,
  TRANSACTION_MY_TRANSACTIONS: `${API_BASE_URL}/packing-zone/transactions/my_transactions/`,

  // Loose Stock
  LOOSE_STOCK_LIST: `${API_BASE_URL}/packing-zone/loose-stock/`,
  LOOSE_STOCK_DETAIL: (id) => `${API_BASE_URL}/packing-zone/loose-stock/${id}/`,
  LOOSE_STOCK_OLD: `${API_BASE_URL}/packing-zone/loose-stock/old_stock/`,

  // Merge Requests
  MERGE_REQUEST_LIST: `${API_BASE_URL}/packing-zone/merge-requests/`,
  MERGE_REQUEST_CREATE: `${API_BASE_URL}/packing-zone/merge-requests/`,
  MERGE_REQUEST_DETAIL: (id) => `${API_BASE_URL}/packing-zone/merge-requests/${id}/`,
  MERGE_REQUEST_APPROVE: (id) => `${API_BASE_URL}/packing-zone/merge-requests/${id}/approve/`,
  MERGE_REQUEST_REJECT: (id) => `${API_BASE_URL}/packing-zone/merge-requests/${id}/reject/`,

  // Stock Adjustments
  ADJUSTMENT_LIST: `${API_BASE_URL}/packing-zone/adjustments/`,
  ADJUSTMENT_CREATE: `${API_BASE_URL}/packing-zone/adjustments/`,
  ADJUSTMENT_DETAIL: (id) => `${API_BASE_URL}/packing-zone/adjustments/${id}/`,
  ADJUSTMENT_APPROVE: (id) => `${API_BASE_URL}/packing-zone/adjustments/${id}/approve/`,
  ADJUSTMENT_REJECT: (id) => `${API_BASE_URL}/packing-zone/adjustments/${id}/reject/`,

  // Packing Labels
  LABEL_LIST: `${API_BASE_URL}/packing-zone/labels/`,
  LABEL_CREATE: `${API_BASE_URL}/packing-zone/labels/`,
  LABEL_DETAIL: (id) => `${API_BASE_URL}/packing-zone/labels/${id}/`,
  LABEL_REPRINT: (id) => `${API_BASE_URL}/packing-zone/labels/${id}/reprint/`,
  LABEL_TRACEABILITY_EXPORT: `${API_BASE_URL}/packing-zone/labels/traceability_export/`,

  // FG Stock
  FG_STOCK_LIST: `${API_BASE_URL}/packing-zone/fg-stock/`,
  FG_STOCK_DETAIL: (id) => `${API_BASE_URL}/packing-zone/fg-stock/${id}/`,
  FG_STOCK_SUMMARY: `${API_BASE_URL}/packing-zone/fg-stock/summary/`,

  // Dashboard
  DASHBOARD_STATS: `${API_BASE_URL}/packing-zone/dashboard/statistics/`,
  PRODUCT_LIST: `${API_BASE_URL}/packing-zone/dashboard/product_list/`,
};

// Export all APIs
export const API_ENDPOINTS = {
  AUTH: AUTH_APIS,
  USER: USER_APIS,
  MANUFACTURING: MANUFACTURING_APIS,
  FG_STORE: FG_STORE_APIS,
  INVENTORY: INVENTORY_APIS,
  NOTIFICATIONS: NOTIFICATIONS_APIS,
  PROCESS_TRACKING: PROCESS_TRACKING_APIS,
  ADMIN: ADMIN_APIS,
  WORK_CENTER: WORK_CENTER_APIS,
  PATROL: PATROL_APIS,
  PACKING_ZONE: PACKING_ZONE_APIS,
};

export default API_ENDPOINTS;

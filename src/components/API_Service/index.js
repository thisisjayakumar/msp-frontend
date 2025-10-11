/**
 * Centralized API Services Export
 * 
 * This file consolidates all API services in one place for easy importing.
 * Instead of importing from individual service files, components can import from here.
 * 
 * Usage Example:
 * import { manufacturingAPI, inventoryAPI, purchaseOrdersAPI } from '@/components/API_Service';
 * 
 * Or for specific services:
 * import { purchaseOrdersAPI, grmReceiptsAPI } from '@/components/API_Service';
 */

// Import all API endpoint configurations
export { 
  AUTH_APIS, 
  USER_APIS, 
  MANUFACTURING_APIS, 
  INVENTORY_APIS, 
  NOTIFICATIONS_APIS, 
  PROCESS_TRACKING_APIS,
  API_ENDPOINTS 
} from './api-list';

// Import Manufacturing API services
export { 
  batchAPI, 
  manufacturingOrdersAPI, 
  purchaseOrdersAPI,
  getDashboardStats as getManufacturingDashboardStats 
} from './manufacturing-api';

// Import Inventory API services
export {
  productsAPI,
  stockBalancesAPI,
  rawMaterialsAPI,
  dashboardAPI as inventoryDashboardAPI,
  transactionsAPI,
  grmReceiptsAPI,
  inventoryAPI
} from './inventory-api';

// Import Process Tracking API services
export { processTrackingAPI } from './process-tracking-api';

// Import Notifications API services
export { notificationsAPI } from './notifications-api';

// Import utility functions
export { 
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
  debugTokenStatus
} from './api-utils';

// Import throttled API functions for special cases
export {
  throttledRequest,
  throttledGet,
  throttledPost,
  throttledPatch,
  throttledDelete,
  clearThrottledCache,
  clearAllThrottledCache,
  getThrottledCacheStats
} from './throttled-api';

/**
 * Grouped API services for better organization
 */
export const API_SERVICES = {
  // Manufacturing services
  manufacturing: {
    orders: manufacturingOrdersAPI,
    batches: batchAPI,
    purchaseOrders: purchaseOrdersAPI,
  },
  
  // Inventory services
  inventory: {
    products: productsAPI,
    stockBalances: stockBalancesAPI,
    rawMaterials: rawMaterialsAPI,
    dashboard: inventoryDashboardAPI,
    transactions: transactionsAPI,
    grmReceipts: grmReceiptsAPI,
  },
  
  // Process tracking services
  processTracking: processTrackingAPI,
  
  // Notifications services
  notifications: notificationsAPI,
};

/**
 * Default export with all services
 */
export default {
  ...API_SERVICES,
  auth: authUtils,
};


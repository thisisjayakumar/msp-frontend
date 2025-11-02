// FG Store API Service
import { apiRequest } from './api-utils';

const FG_STORE_API_BASE = '/api/fg-store';

export const fgStoreAPI = {
  // Dispatch Batch APIs
  getDispatchBatches: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-batches/?${queryParams}`);
  },

  getDispatchBatch: (batchId) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-batches/${batchId}/`);
  },

  createDispatchBatch: (data) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-batches/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateDispatchBatch: (batchId, data) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-batches/${batchId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  updateDispatchBatchStatus: (batchId, status) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-batches/${batchId}/update_status/`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  // Dispatch Transaction APIs
  getDispatchTransactions: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-transactions/?${queryParams}`);
  },

  getDispatchTransaction: (transactionId) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-transactions/${transactionId}/`);
  },

  createDispatchTransaction: (data) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-transactions/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  confirmDispatchTransaction: (transactionId, data = {}) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-transactions/${transactionId}/confirm/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Dispatch Order APIs
  getDispatchOrders: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-orders/?${queryParams}`);
  },

  getDispatchOrder: (orderId) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-orders/${orderId}/`);
  },

  createDispatchOrder: (data) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-orders/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateDispatchOrder: (orderId, data) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-orders/${orderId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Stock Alert APIs
  getStockAlerts: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`${FG_STORE_API_BASE}/stock-alerts/?${queryParams}`);
  },

  getStockAlert: (alertId) => {
    return apiRequest(`${FG_STORE_API_BASE}/stock-alerts/${alertId}/`);
  },

  createStockAlert: (data) => {
    return apiRequest(`${FG_STORE_API_BASE}/stock-alerts/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateStockAlert: (alertId, data) => {
    return apiRequest(`${FG_STORE_API_BASE}/stock-alerts/${alertId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  deleteStockAlert: (alertId) => {
    return apiRequest(`${FG_STORE_API_BASE}/stock-alerts/${alertId}/`, {
      method: 'DELETE'
    });
  },

  // Dashboard APIs
  getStockLevels: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`${FG_STORE_API_BASE}/dashboard/stock_levels/?${queryParams}`);
  },

  getPendingDispatchMOs: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`${FG_STORE_API_BASE}/dashboard/pending_dispatch_mos/?${queryParams}`);
  },

  getTransactionsLog: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`${FG_STORE_API_BASE}/dashboard/transactions_log/?${queryParams}`);
  },

  validateDispatch: (batchId, quantity) => {
    return apiRequest(`${FG_STORE_API_BASE}/dashboard/validate_dispatch/?batch_id=${batchId}&quantity_to_dispatch=${quantity}`);
  },

  // Export APIs
  exportTransactionsLog: (params = {}, format = 'csv') => {
    const queryParams = new URLSearchParams({ ...params, format }).toString();
    return apiRequest(`${FG_STORE_API_BASE}/dashboard/transactions_log/export/?${queryParams}`, {
      method: 'GET',
      responseType: 'blob'
    });
  },

  exportStockLevels: (params = {}, format = 'csv') => {
    const queryParams = new URLSearchParams({ ...params, format }).toString();
    return apiRequest(`${FG_STORE_API_BASE}/dashboard/stock_levels/export/?${queryParams}`, {
      method: 'GET',
      responseType: 'blob'
    });
  },

  // Utility functions
  getMOBatches: (moId) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-batches/?mo=${moId}`);
  },

  getMOTransactions: (moId) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-transactions/?mo=${moId}`);
  },

  getCustomerMOs: (customerId) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-orders/?customer_c_id=${customerId}`);
  },

  getProductStockLevel: (productCode) => {
    return apiRequest(`${FG_STORE_API_BASE}/dashboard/stock_levels/?product_code=${productCode}`);
  },

  getProductAlerts: (productCode) => {
    return apiRequest(`${FG_STORE_API_BASE}/stock-alerts/?product_code=${productCode}`);
  },

  // Batch operations
  createDispatchFromMO: (moId, batchData) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-orders/create_from_mo/`, {
      method: 'POST',
      body: JSON.stringify({ mo_id: moId, ...batchData })
    });
  },

  // Bulk operations
  bulkUpdateBatchStatus: (batchIds, status) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-batches/bulk_update_status/`, {
      method: 'POST',
      body: JSON.stringify({ batch_ids: batchIds, status })
    });
  },

  bulkCreateTransactions: (transactions) => {
    return apiRequest(`${FG_STORE_API_BASE}/dispatch-transactions/bulk_create/`, {
      method: 'POST',
      body: JSON.stringify({ transactions })
    });
  },

  // Analytics and reporting
  getDispatchAnalytics: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`${FG_STORE_API_BASE}/dashboard/analytics/?${queryParams}`);
  },

  getStockLevelTrends: (productCode, days = 30) => {
    return apiRequest(`${FG_STORE_API_BASE}/dashboard/stock_trends/?product_code=${productCode}&days=${days}`);
  },

  getDispatchPerformance: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`${FG_STORE_API_BASE}/dashboard/performance/?${queryParams}`);
  },

  // Real-time updates - polling removed, call getStockUpdates directly when needed
  subscribeToStockUpdates: async (callback) => {
    // Polling removed - just fetch once
    try {
      const updates = await apiRequest(`${FG_STORE_API_BASE}/dashboard/stock_updates/`);
      callback(updates);
    } catch (error) {
      console.error('Failed to fetch stock updates:', error);
    }
    // Return no-op cleanup function for compatibility
    return () => {};
  },

  // Notification management
  getActiveAlerts: () => {
    return apiRequest(`${FG_STORE_API_BASE}/stock-alerts/?is_active=true&last_triggered__isnull=false`);
  },

  markAlertAsRead: (alertId) => {
    return apiRequest(`${FG_STORE_API_BASE}/stock-alerts/${alertId}/mark_read/`, {
      method: 'POST'
    });
  },

  // Integration with other modules
  syncWithManufacturing: (moId) => {
    return apiRequest(`${FG_STORE_API_BASE}/sync/manufacturing/?mo_id=${moId}`, {
      method: 'POST'
    });
  },

  syncWithInventory: (batchId) => {
    return apiRequest(`${FG_STORE_API_BASE}/sync/inventory/?batch_id=${batchId}`, {
      method: 'POST'
    });
  }
};

export default fgStoreAPI;

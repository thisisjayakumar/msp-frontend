// Packing Zone API Service
// Centralized API calls for Packing Zone Management

import { PACKING_ZONE_APIS } from './api-list';
import { apiRequest } from './api-utils';

// Helper function to handle API responses with graceful error handling
const handleResponse = async (response) => {
  if (response.success) {
    return response.data;
  }
  
  const errorMessage = response.error || 'API request failed';
  const errorInfo = {
    error: true,
    message: errorMessage,
    status: response.status,
    details: response.data
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('API Warning:', errorMessage);
  }
  
  return errorInfo;
};

// Packing Batch API Service
export const packingBatchAPI = {
  // Get all batches with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${PACKING_ZONE_APIS.BATCH_LIST}?${queryParams}`
      : PACKING_ZONE_APIS.BATCH_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get batch by ID
  getById: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.BATCH_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new batch (from Final Inspection)
  create: async (batchData) => {
    const response = await apiRequest(PACKING_ZONE_APIS.BATCH_CREATE, {
      method: 'POST',
      body: batchData,
    });
    
    return handleResponse(response);
  },

  // Update batch
  update: async (id, batchData) => {
    const response = await apiRequest(PACKING_ZONE_APIS.BATCH_UPDATE(id), {
      method: 'PATCH',
      body: batchData,
    });
    
    return handleResponse(response);
  },

  // Delete batch
  delete: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.BATCH_DELETE(id), {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new Error(`Failed to delete batch: ${response.status}`);
    }
    
    return true;
  },

  // Verify batch
  verify: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.BATCH_VERIFY(id), {
      method: 'POST',
      body: { verified: true },
    });
    
    return handleResponse(response);
  },

  // Report issue with batch
  reportIssue: async (id, issueData) => {
    const response = await apiRequest(PACKING_ZONE_APIS.BATCH_REPORT_ISSUE(id), {
      method: 'POST',
      body: issueData,
    });
    
    return handleResponse(response);
  },

  // Release batch from hold (PH only)
  releaseFromHold: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.BATCH_RELEASE_HOLD(id), {
      method: 'POST',
      body: {},
    });
    
    return handleResponse(response);
  },

  // Get batches ready to be packed
  getToBePacked: async () => {
    const response = await apiRequest(PACKING_ZONE_APIS.BATCH_TO_BE_PACKED, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Packing Transaction API Service
export const packingTransactionAPI = {
  // Get all transactions with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${PACKING_ZONE_APIS.TRANSACTION_LIST}?${queryParams}`
      : PACKING_ZONE_APIS.TRANSACTION_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get transaction by ID
  getById: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.TRANSACTION_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new packing transaction
  create: async (transactionData) => {
    const response = await apiRequest(PACKING_ZONE_APIS.TRANSACTION_CREATE, {
      method: 'POST',
      body: transactionData,
    });
    
    return handleResponse(response);
  },

  // Get current user's transactions
  getMyTransactions: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    const url = queryParams.toString() 
      ? `${PACKING_ZONE_APIS.TRANSACTION_MY_TRANSACTIONS}?${queryParams}`
      : PACKING_ZONE_APIS.TRANSACTION_MY_TRANSACTIONS;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Loose Stock API Service
export const looseStockAPI = {
  // Get all loose stock with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${PACKING_ZONE_APIS.LOOSE_STOCK_LIST}?${queryParams}`
      : PACKING_ZONE_APIS.LOOSE_STOCK_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get loose stock by ID
  getById: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.LOOSE_STOCK_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get old stock (>50 days) eligible for merge
  getOldStock: async () => {
    const response = await apiRequest(PACKING_ZONE_APIS.LOOSE_STOCK_OLD, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Merge Request API Service
export const mergeRequestAPI = {
  // Get all merge requests with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${PACKING_ZONE_APIS.MERGE_REQUEST_LIST}?${queryParams}`
      : PACKING_ZONE_APIS.MERGE_REQUEST_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get merge request by ID
  getById: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.MERGE_REQUEST_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new merge request
  create: async (requestData) => {
    const response = await apiRequest(PACKING_ZONE_APIS.MERGE_REQUEST_CREATE, {
      method: 'POST',
      body: requestData,
    });
    
    return handleResponse(response);
  },

  // Approve merge request (PH only)
  approve: async (id, approvalData) => {
    const response = await apiRequest(PACKING_ZONE_APIS.MERGE_REQUEST_APPROVE(id), {
      method: 'POST',
      body: approvalData,
    });
    
    return handleResponse(response);
  },

  // Reject merge request (PH only)
  reject: async (id, rejectionData) => {
    const response = await apiRequest(PACKING_ZONE_APIS.MERGE_REQUEST_REJECT(id), {
      method: 'POST',
      body: rejectionData,
    });
    
    return handleResponse(response);
  },
};

// Stock Adjustment API Service
export const stockAdjustmentAPI = {
  // Get all adjustments with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${PACKING_ZONE_APIS.ADJUSTMENT_LIST}?${queryParams}`
      : PACKING_ZONE_APIS.ADJUSTMENT_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get adjustment by ID
  getById: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.ADJUSTMENT_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new adjustment
  create: async (adjustmentData) => {
    const response = await apiRequest(PACKING_ZONE_APIS.ADJUSTMENT_CREATE, {
      method: 'POST',
      body: adjustmentData,
    });
    
    return handleResponse(response);
  },

  // Approve adjustment (PH only)
  approve: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.ADJUSTMENT_APPROVE(id), {
      method: 'POST',
      body: {},
    });
    
    return handleResponse(response);
  },

  // Reject adjustment (PH only)
  reject: async (id, rejectionData) => {
    const response = await apiRequest(PACKING_ZONE_APIS.ADJUSTMENT_REJECT(id), {
      method: 'POST',
      body: rejectionData,
    });
    
    return handleResponse(response);
  },
};

// Packing Label API Service
export const packingLabelAPI = {
  // Get all labels with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${PACKING_ZONE_APIS.LABEL_LIST}?${queryParams}`
      : PACKING_ZONE_APIS.LABEL_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get label by ID
  getById: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.LABEL_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create labels for packs
  create: async (labelData) => {
    const response = await apiRequest(PACKING_ZONE_APIS.LABEL_CREATE, {
      method: 'POST',
      body: labelData,
    });
    
    return handleResponse(response);
  },

  // Reprint label
  reprint: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.LABEL_REPRINT(id), {
      method: 'POST',
      body: {},
    });
    
    return handleResponse(response);
  },

  // Get traceability export data
  getTraceabilityExport: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${PACKING_ZONE_APIS.LABEL_TRACEABILITY_EXPORT}?${queryParams}`
      : PACKING_ZONE_APIS.LABEL_TRACEABILITY_EXPORT;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// FG Stock API Service
export const fgStockAPI = {
  // Get all FG stock with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${PACKING_ZONE_APIS.FG_STOCK_LIST}?${queryParams}`
      : PACKING_ZONE_APIS.FG_STOCK_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get FG stock by ID
  getById: async (id) => {
    const response = await apiRequest(PACKING_ZONE_APIS.FG_STOCK_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get FG stock summary
  getSummary: async () => {
    const response = await apiRequest(PACKING_ZONE_APIS.FG_STOCK_SUMMARY, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Dashboard API Service
export const packingDashboardAPI = {
  // Get dashboard statistics
  getStatistics: async () => {
    const response = await apiRequest(PACKING_ZONE_APIS.DASHBOARD_STATS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get product list for dropdowns
  getProductList: async () => {
    const response = await apiRequest(PACKING_ZONE_APIS.PRODUCT_LIST, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Export default object with all services
export default {
  batches: packingBatchAPI,
  transactions: packingTransactionAPI,
  looseStock: looseStockAPI,
  mergeRequests: mergeRequestAPI,
  adjustments: stockAdjustmentAPI,
  labels: packingLabelAPI,
  fgStock: fgStockAPI,
  dashboard: packingDashboardAPI,
};


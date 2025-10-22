// Inventory API Service (RM Store)
// Centralized API calls for RM Store Dashboard functionality

import { INVENTORY_APIS } from './api-list';
import { apiRequest } from './api-utils';

// Helper function to handle API responses with graceful error handling
const handleResponse = async (response) => {
  if (response.success) {
    return response.data;
  }
  
  // Instead of throwing, return error information for graceful UI handling
  // Components can check for error property and show toast notifications
  const errorMessage = response.error || 'API request failed';
  const errorInfo = {
    error: true,
    message: errorMessage,
    status: response.status,
    details: response.data
  };
  
  // Log as warning instead of error since it's handled gracefully
  // Only log in development to avoid console noise in production
  if (process.env.NODE_ENV === 'development') {
    console.warn('API Warning:', errorMessage);
  }
  
  return errorInfo;
};

// Products API Service
export const productsAPI = {
  // Get all products with stock information for dashboard
  getDashboard: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${INVENTORY_APIS.PRODUCT_DASHBOARD}?${queryParams}`
      : INVENTORY_APIS.PRODUCT_DASHBOARD;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get all products with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${INVENTORY_APIS.PRODUCT_LIST}?${queryParams}`
      : INVENTORY_APIS.PRODUCT_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get product by ID
  getById: async (id) => {
    const response = await apiRequest(INVENTORY_APIS.PRODUCT_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new product
  create: async (productData) => {
    const response = await apiRequest(INVENTORY_APIS.PRODUCT_CREATE, {
      method: 'POST',
      body: productData,
    });
    
    return handleResponse(response);
  },

  // Update product
  update: async (id, productData) => {
    const response = await apiRequest(INVENTORY_APIS.PRODUCT_UPDATE(id), {
      method: 'PUT',
      body: productData,
    });
    
    return handleResponse(response);
  },

  // Partial update product
  partialUpdate: async (id, productData) => {
    const response = await apiRequest(INVENTORY_APIS.PRODUCT_UPDATE(id), {
      method: 'PATCH',
      body: productData,
    });
    
    return handleResponse(response);
  },

  // Delete product
  delete: async (id) => {
    const response = await apiRequest(INVENTORY_APIS.PRODUCT_DELETE(id), {
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },

  // Get products dropdown
  getDropdown: async () => {
    const response = await apiRequest(INVENTORY_APIS.PRODUCT_DROPDOWN, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Stock Balances API Service
export const stockBalancesAPI = {
  // Get all stock balances with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${INVENTORY_APIS.STOCK_BALANCE_LIST}?${queryParams}`
      : INVENTORY_APIS.STOCK_BALANCE_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get stock balance by ID
  getById: async (id) => {
    const response = await apiRequest(INVENTORY_APIS.STOCK_BALANCE_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new stock balance
  create: async (stockData) => {
    const response = await apiRequest(INVENTORY_APIS.STOCK_BALANCE_CREATE, {
      method: 'POST',
      body: stockData,
    });
    
    return handleResponse(response);
  },

  // Update stock balance
  update: async (id, stockData) => {
    const response = await apiRequest(INVENTORY_APIS.STOCK_BALANCE_UPDATE(id), {
      method: 'PUT',
      body: stockData,
    });
    
    return handleResponse(response);
  },

  // Update stock balance by material code
  updateByMaterialCode: async (materialCode, availableQuantity) => {
    const response = await apiRequest(INVENTORY_APIS.STOCK_BALANCE_UPDATE_BY_MATERIAL, {
      method: 'POST',
      body: {
        material_code: materialCode,
        available_quantity: availableQuantity,
      },
    });
    
    return handleResponse(response);
  },

  // Bulk update stock balances
  bulkUpdate: async (stockUpdates) => {
    const response = await apiRequest(INVENTORY_APIS.STOCK_BALANCE_BULK_UPDATE, {
      method: 'POST',
      body: stockUpdates,
    });
    
    return handleResponse(response);
  },

  // Delete stock balance
  delete: async (id) => {
    const response = await apiRequest(INVENTORY_APIS.STOCK_BALANCE_DELETE(id), {
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },
};

// Raw Materials API Service
export const rawMaterialsAPI = {
  // Get all raw materials with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${INVENTORY_APIS.RAW_MATERIAL_LIST}?${queryParams}`
      : INVENTORY_APIS.RAW_MATERIAL_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get raw material by ID
  getById: async (id) => {
    const response = await apiRequest(INVENTORY_APIS.RAW_MATERIAL_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new raw material
  create: async (rawMaterialData) => {
    const response = await apiRequest(INVENTORY_APIS.RAW_MATERIAL_CREATE, {
      method: 'POST',
      body: rawMaterialData,
    });
    
    return handleResponse(response);
  },

  // Update raw material
  update: async (id, rawMaterialData) => {
    const response = await apiRequest(INVENTORY_APIS.RAW_MATERIAL_UPDATE(id), {
      method: 'PUT',
      body: rawMaterialData,
    });
    
    return handleResponse(response);
  },

  // Partial update raw material
  partialUpdate: async (id, rawMaterialData) => {
    const response = await apiRequest(INVENTORY_APIS.RAW_MATERIAL_UPDATE(id), {
      method: 'PATCH',
      body: rawMaterialData,
    });
    
    return handleResponse(response);
  },

  // Delete raw material
  delete: async (id) => {
    const response = await apiRequest(INVENTORY_APIS.RAW_MATERIAL_DELETE(id), {
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },

  // Get raw materials dropdown
  getDropdown: async () => {
    const response = await apiRequest(INVENTORY_APIS.RAW_MATERIAL_DROPDOWN, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Dashboard API Service
export const dashboardAPI = {
  // Get dashboard statistics
  getStats: async () => {
    const response = await apiRequest(INVENTORY_APIS.DASHBOARD_STATS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// Inventory transactions API Service
export const transactionsAPI = {
  // Get all inventory transactions with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString()
      ? `${INVENTORY_APIS.TRANSACTION_LIST}?${queryParams}`
      : INVENTORY_APIS.TRANSACTION_LIST;

    const response = await apiRequest(url, {
      method: 'GET',
    });

    return handleResponse(response);
  },
};

// GRM Receipts API Service
export const grmReceiptsAPI = {
  // Get all GRM receipts with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString()
      ? `${INVENTORY_APIS.GRM_RECEIPTS_LIST}?${queryParams}`
      : INVENTORY_APIS.GRM_RECEIPTS_LIST;

    const response = await apiRequest(url, {
      method: 'GET',
    });

    return handleResponse(response);
  },

  // Get GRM receipt by ID
  getById: async (id) => {
    const response = await apiRequest(INVENTORY_APIS.GRM_RECEIPTS_DETAIL(id), {
      method: 'GET',
    });

    return handleResponse(response);
  },

  // Update quality check for GRM receipt
  updateQualityCheck: async (id, qualityCheckPassed) => {
    const response = await apiRequest(INVENTORY_APIS.GRM_RECEIPTS_QUALITY_CHECK(id), {
      method: 'POST',
      body: { quality_check_passed: qualityCheckPassed },
    });

    return handleResponse(response);
  },

  // Complete GRM receipt
  completeReceipt: async (id) => {
    const response = await apiRequest(INVENTORY_APIS.GRM_RECEIPTS_COMPLETE(id), {
      method: 'POST',
    });

    return handleResponse(response);
  },

  // Test basic GRM API connectivity
  testBasic: async () => {
    const response = await apiRequest(INVENTORY_APIS.GRM_TEST_BASIC, {
      method: 'GET',
    });

    return handleResponse(response);
  },

  // Test GRM models accessibility
  // testModels: async () => {
  //   const response = await apiRequest(INVENTORY_APIS.GRM_TEST_MODELS, {
  //     method: 'GET',
  //   });

  //   return handleResponse(response);
  // },
};

// Heat Numbers API Service
export const heatNumbersAPI = {
  // Get all heat numbers with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString()
      ? `${INVENTORY_APIS.HEAT_NUMBERS_LIST}?${queryParams}`
      : INVENTORY_APIS.HEAT_NUMBERS_LIST;

    const response = await apiRequest(url, {
      method: 'GET',
    });

    return handleResponse(response);
  },

  // Get heat number by ID
  getById: async (id) => {
    const response = await apiRequest(INVENTORY_APIS.HEAT_NUMBERS_DETAIL(id), {
      method: 'GET',
    });

    return handleResponse(response);
  },

  // Get heat numbers by material ID
  getByMaterial: async (materialId) => {
    const response = await apiRequest(INVENTORY_APIS.HEAT_NUMBERS_BY_MATERIAL(materialId), {
      method: 'GET',
    });

    return handleResponse(response);
  },

  // Create new heat number
  create: async (heatData) => {
    const response = await apiRequest(INVENTORY_APIS.HEAT_NUMBERS_CREATE, {
      method: 'POST',
      body: heatData,
    });

    return handleResponse(response);
  },

  // Bulk create heat numbers with child batches
  bulkCreate: async (heatNumbersData) => {
    const response = await apiRequest(INVENTORY_APIS.HEAT_NUMBERS_BULK_CREATE, {
      method: 'POST',
      body: { heat_numbers: heatNumbersData },
    });

    return handleResponse(response);
  },

  // Update heat number
  update: async (id, heatData) => {
    const response = await apiRequest(INVENTORY_APIS.HEAT_NUMBERS_UPDATE(id), {
      method: 'PUT',
      body: heatData,
    });

    return handleResponse(response);
  },

  // Delete heat number
  delete: async (id) => {
    const response = await apiRequest(INVENTORY_APIS.HEAT_NUMBERS_DELETE(id), {
      method: 'DELETE',
    });

    return handleResponse(response);
  },
};

// Combined inventory API service
export const inventoryAPI = {
  products: productsAPI,
  stockBalances: stockBalancesAPI,
  rawMaterials: rawMaterialsAPI,
  dashboard: dashboardAPI,
  transactions: transactionsAPI,
  grmReceipts: grmReceiptsAPI,
  heatNumbers: heatNumbersAPI,
};

// Export individual services for convenience
export default inventoryAPI;

// Export all services
export {
  productsAPI,
  stockBalancesAPI,
  rawMaterialsAPI,
  dashboardAPI,
  transactionsAPI,
  grmReceiptsAPI,
  heatNumbersAPI,
};

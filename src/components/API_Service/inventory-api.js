// Inventory API Service (RM Store)
// Centralized API calls for RM Store Dashboard functionality

import { INVENTORY_APIS } from './api-list';
import { apiRequest } from './api-utils';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (response.success) {
    return response.data;
  }
  throw new Error(response.error || 'API request failed');
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

  // Update stock balance by internal product code
  updateByProductCode: async (internalProductCode, availableQuantity) => {
    const response = await apiRequest(INVENTORY_APIS.STOCK_BALANCE_UPDATE_BY_CODE, {
      method: 'POST',
      body: {
        internal_product_code: internalProductCode,
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

// Combined inventory API service
export const inventoryAPI = {
  products: productsAPI,
  stockBalances: stockBalancesAPI,
  rawMaterials: rawMaterialsAPI,
  dashboard: dashboardAPI,
};

// Export individual services for convenience
export default inventoryAPI;

// Export all services
export {
  productsAPI,
  stockBalancesAPI,
  rawMaterialsAPI,
  dashboardAPI,
};

// Manufacturing API Service
// Centralized API calls for Manufacturing Orders and Purchase Orders

import { MANUFACTURING_APIS } from './api-list';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Manufacturing Orders API Service
export const manufacturingOrdersAPI = {
  // Get all MOs with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${MANUFACTURING_APIS.MO_LIST}?${queryParams}`
      : MANUFACTURING_APIS.MO_LIST;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get MO by ID
  getById: async (id) => {
    const response = await fetch(MANUFACTURING_APIS.MO_DETAIL(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Create new MO
  create: async (moData) => {
    const response = await fetch(MANUFACTURING_APIS.MO_CREATE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(moData),
    });
    
    return handleResponse(response);
  },

  // Update MO
  update: async (id, moData) => {
    const response = await fetch(MANUFACTURING_APIS.MO_UPDATE(id), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(moData),
    });
    
    return handleResponse(response);
  },

  // Delete MO
  delete: async (id) => {
    const response = await fetch(MANUFACTURING_APIS.MO_DELETE(id), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete MO: ${response.status}`);
    }
    
    return true;
  },

  // Change MO status
  changeStatus: async (id, statusData) => {
    const response = await fetch(MANUFACTURING_APIS.MO_CHANGE_STATUS(id), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusData),
    });
    
    return handleResponse(response);
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await fetch(MANUFACTURING_APIS.MO_DASHBOARD_STATS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get products for dropdown
  getProducts: async () => {
    const response = await fetch(MANUFACTURING_APIS.MO_PRODUCTS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get supervisors for dropdown
  getSupervisors: async () => {
    const response = await fetch(MANUFACTURING_APIS.MO_SUPERVISORS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },
};

// Purchase Orders API Service
export const purchaseOrdersAPI = {
  // Get all POs with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${MANUFACTURING_APIS.PO_LIST}?${queryParams}`
      : MANUFACTURING_APIS.PO_LIST;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get PO by ID
  getById: async (id) => {
    const response = await fetch(MANUFACTURING_APIS.PO_DETAIL(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Create new PO
  create: async (poData) => {
    const response = await fetch(MANUFACTURING_APIS.PO_CREATE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(poData),
    });
    
    return handleResponse(response);
  },

  // Update PO
  update: async (id, poData) => {
    const response = await fetch(MANUFACTURING_APIS.PO_UPDATE(id), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(poData),
    });
    
    return handleResponse(response);
  },

  // Delete PO
  delete: async (id) => {
    const response = await fetch(MANUFACTURING_APIS.PO_DELETE(id), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete PO: ${response.status}`);
    }
    
    return true;
  },

  // Change PO status
  changeStatus: async (id, statusData) => {
    const response = await fetch(MANUFACTURING_APIS.PO_CHANGE_STATUS(id), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusData),
    });
    
    return handleResponse(response);
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await fetch(MANUFACTURING_APIS.PO_DASHBOARD_STATS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get raw materials for dropdown
  getRawMaterials: async () => {
    const response = await fetch(MANUFACTURING_APIS.PO_RAW_MATERIALS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get vendors for dropdown
  getVendors: async (vendorType = null) => {
    const url = vendorType 
      ? `${MANUFACTURING_APIS.PO_VENDORS}?vendor_type=${vendorType}`
      : MANUFACTURING_APIS.PO_VENDORS;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get material details for auto-population
  getMaterialDetails: async (materialId) => {
    const response = await fetch(`${MANUFACTURING_APIS.PO_MATERIAL_DETAILS}?material_id=${materialId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },

  // Get vendor details for auto-population
  getVendorDetails: async (vendorId) => {
    const response = await fetch(`${MANUFACTURING_APIS.PO_VENDOR_DETAILS}?vendor_id=${vendorId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  },
};

// Combined dashboard stats
export const getDashboardStats = async () => {
  try {
    const [moStats, poStats] = await Promise.all([
      manufacturingOrdersAPI.getDashboardStats(),
      purchaseOrdersAPI.getDashboardStats(),
    ]);
    
    return {
      manufacturingOrders: moStats,
      purchaseOrders: poStats,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Export default object with all services
export default {
  manufacturingOrders: manufacturingOrdersAPI,
  purchaseOrders: purchaseOrdersAPI,
  getDashboardStats,
};

// Manufacturing API Service
// Centralized API calls for Manufacturing Orders and Purchase Orders

import { MANUFACTURING_APIS } from './api-list';
import { apiRequest } from './api-utils';

// Helper function to handle API responses (for backward compatibility)
const handleResponse = async (response) => {
  if (response.success) {
    return response.data;
  }
  throw new Error(response.error || 'API request failed');
};

// Batch API Service
export const batchAPI = {
  // Get all batches with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${MANUFACTURING_APIS.BATCH_LIST}?${queryParams}`
      : MANUFACTURING_APIS.BATCH_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get batch by ID
  getById: async (id) => {
    const response = await apiRequest(MANUFACTURING_APIS.BATCH_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get batches for a specific MO
  getByMO: async (moId) => {
    const response = await apiRequest(`${MANUFACTURING_APIS.BATCH_BY_MO}?mo_id=${moId}`, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new batch
  create: async (batchData) => {
    const response = await apiRequest(MANUFACTURING_APIS.BATCH_CREATE, {
      method: 'POST',
      body: batchData,
    });
    
    return handleResponse(response);
  },

  // Update batch
  update: async (id, batchData) => {
    const response = await apiRequest(MANUFACTURING_APIS.BATCH_UPDATE(id), {
      method: 'PATCH',
      body: batchData,
    });
    
    return handleResponse(response);
  },

  // Delete batch
  delete: async (id) => {
    const response = await apiRequest(MANUFACTURING_APIS.BATCH_DELETE(id), {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new Error(`Failed to delete batch: ${response.status}`);
    }
    
    return true;
  },

  // Start batch
  startBatch: async (id) => {
    const response = await apiRequest(MANUFACTURING_APIS.BATCH_START(id), {
      method: 'POST',
      body: {},
    });
    
    return handleResponse(response);
  },

  // Complete batch
  completeBatch: async (id, completionData) => {
    const response = await apiRequest(MANUFACTURING_APIS.BATCH_COMPLETE(id), {
      method: 'POST',
      body: completionData,
    });
    
    return handleResponse(response);
  },

  // Update batch progress
  updateProgress: async (id, progressData) => {
    const response = await apiRequest(MANUFACTURING_APIS.BATCH_UPDATE_PROGRESS(id), {
      method: 'PATCH',
      body: progressData,
    });
    
    return handleResponse(response);
  },

  // Get batch dashboard stats
  getDashboardStats: async () => {
    const response = await apiRequest(MANUFACTURING_APIS.BATCH_DASHBOARD_STATS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get MO batch summary - comprehensive RM tracking
  getMOBatchSummary: async (moId) => {
    const response = await apiRequest(`${MANUFACTURING_APIS.BATCH_LIST}mo-batch-summary/${moId}/`, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Add scrap RM to a batch
  addScrapRM: async (batchId, scrapRmKg) => {
    const response = await apiRequest(`${MANUFACTURING_APIS.BATCH_LIST}${batchId}/add-scrap-rm/`, {
      method: 'POST',
      body: { scrap_rm_kg: scrapRmKg },
    });
    
    return handleResponse(response);
  },
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
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get MO by ID
  getById: async (id) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Send remaining RM to scrap
  sendRemainingToScrap: async (moId, scrapRmKg = null, sendAll = false) => {
    const response = await apiRequest(`${MANUFACTURING_APIS.MO_LIST}${moId}/send-remaining-to-scrap/`, {
      method: 'POST',
      body: sendAll ? { send_all_remaining: true } : { scrap_rm_kg: scrapRmKg },
    });
    
    return handleResponse(response);
  },

  // Complete RM allocation (RM Store)
  completeRMAllocation: async (moId, notes = '') => {
    const response = await apiRequest(`${MANUFACTURING_APIS.MO_LIST}${moId}/complete-rm-allocation/`, {
      method: 'POST',
      body: { notes },
    });
    
    return handleResponse(response);
  },

  // Create new MO
  create: async (moData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_CREATE, {
      method: 'POST',
      body: moData,
    });
    
    return handleResponse(response);
  },

  // Update MO
  update: async (id, moData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_UPDATE(id), {
      method: 'PATCH',
      body: moData,
    });
    
    return handleResponse(response);
  },

  // Delete MO
  delete: async (id) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_DELETE(id), {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new Error(`Failed to delete MO: ${response.status}`);
    }
    
    return true;
  },

  // Change MO status
  changeStatus: async (id, statusData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_CHANGE_STATUS(id), {
      method: 'POST',
      body: statusData,
    });
    
    return handleResponse(response);
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_DASHBOARD_STATS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get products for dropdown
  getProducts: async () => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_PRODUCTS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get supervisors for dropdown
  getSupervisors: async () => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_SUPERVISORS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get RM store users for dropdown
  getRMStoreUsers: async () => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_RM_STORE_USERS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get customers for dropdown
  getCustomers: async () => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_CUSTOMERS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get product details with BOM and materials
  getProductDetails: async (productCode) => {
    const response = await apiRequest(`${MANUFACTURING_APIS.MO_PRODUCT_DETAILS}?product_code=${productCode}`, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Update MO details (supervisor, shift) - Manager only
  updateMODetails: async (id, updateData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_UPDATE_DETAILS(id), {
      method: 'PATCH',
      body: updateData,
    });
    
    return handleResponse(response);
  },

  // Approve MO - Manager only
  approveMO: async (id, approvalData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_APPROVE(id), {
      method: 'POST',
      body: approvalData,
    });
    
    return handleResponse(response);
  },

  // RM Approve MO - RM Store user only
  rmApproveMO: async (id, approvalData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_RM_APPROVE(id), {
      method: 'POST',
      body: approvalData,
    });
    
    return handleResponse(response);
  },

  // Get RM Store dashboard - RM Store user only
  getRMStoreDashboard: async () => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_RM_STORE_DASHBOARD, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get supervisor dashboard - Supervisor only
  getSupervisorDashboard: async () => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_SUPERVISOR_DASHBOARD, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Start MO - Supervisor only
  startMO: async (id, startData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_START(id), {
      method: 'POST',
      body: startData,
    });
    
    return handleResponse(response);
  },

  // Calculate RM requirement for MO
  calculateRMRequirement: async (calculationData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_CALCULATE_RM, {
      method: 'POST',
      body: calculationData,
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
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get PO by ID
  getById: async (id) => {
    const response = await apiRequest(MANUFACTURING_APIS.PO_DETAIL(id), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new PO
  create: async (poData) => {
    const response = await apiRequest(MANUFACTURING_APIS.PO_CREATE, {
      method: 'POST',
      body: poData,
    });
    
    return handleResponse(response);
  },

  // Update PO
  update: async (id, poData) => {
    const response = await apiRequest(MANUFACTURING_APIS.PO_UPDATE(id), {
      method: 'PATCH',
      body: poData,
    });
    
    return handleResponse(response);
  },

  // Delete PO
  delete: async (id) => {
    const response = await apiRequest(MANUFACTURING_APIS.PO_DELETE(id), {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new Error(`Failed to delete PO: ${response.status}`);
    }
    
    return true;
  },

  // Change PO status
  changeStatus: async (id, statusData) => {
    const response = await apiRequest(MANUFACTURING_APIS.PO_CHANGE_STATUS(id), {
      method: 'POST',
      body: statusData,
    });
    
    return handleResponse(response);
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await apiRequest(MANUFACTURING_APIS.PO_DASHBOARD_STATS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get raw materials for dropdown
  getRawMaterials: async () => {
    const response = await apiRequest(MANUFACTURING_APIS.PO_RAW_MATERIALS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get vendors for dropdown
  getVendors: async (vendorType = null) => {
    const url = vendorType 
      ? `${MANUFACTURING_APIS.PO_VENDORS}?vendor_type=${vendorType}`
      : MANUFACTURING_APIS.PO_VENDORS;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get material details for auto-population
  getMaterialDetails: async (materialId) => {
    const response = await apiRequest(`${MANUFACTURING_APIS.PO_MATERIAL_DETAILS}?material_id=${materialId}`, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get vendor details for auto-population
  getVendorDetails: async (vendorId) => {
    const response = await apiRequest(`${MANUFACTURING_APIS.PO_VENDOR_DETAILS}?vendor_id=${vendorId}`, {
      method: 'GET',
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
  batches: batchAPI,
  getDashboardStats,
};

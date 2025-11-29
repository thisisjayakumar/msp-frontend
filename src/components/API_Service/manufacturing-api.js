// Manufacturing API Service
// Centralized API calls for Manufacturing Orders and Purchase Orders

import { MANUFACTURING_APIS, API_ENDPOINTS, INVENTORY_APIS } from './api-list';
import { apiRequest } from './api-utils';
import { throttledGet, throttledPost, throttledPatch, throttledDelete } from './throttled-api';

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

  // Get batches for a specific MO (THROTTLED)
  getByMO: async (moId) => {
    const response = await throttledGet(`${MANUFACTURING_APIS.BATCH_BY_MO}?mo_id=${moId}`);
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

  // Get batch dashboard stats (THROTTLED)
  getDashboardStats: async () => {
    const response = await throttledGet(MANUFACTURING_APIS.BATCH_DASHBOARD_STATS);
    return handleResponse(response);
  },

  // Get MO batch summary - comprehensive RM tracking
  getMOBatchSummary: async (moId) => {
    const response = await apiRequest(`${MANUFACTURING_APIS.BATCH_LIST}mo-batch-summary/${moId}/`, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get available heat numbers for an MO
  getAvailableHeatNumbers: async (moId) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_AVAILABLE_HEAT_NUMBERS(moId), {
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

  // Raw Material Allocations
  rawMaterialAllocations: {
    // Get RM allocations for a specific MO
    getByMO: async (moId) => {
      const response = await apiRequest(`${MANUFACTURING_APIS.RM_ALLOCATION_BY_MO}?mo_id=${moId}`, {
        method: 'GET',
      });
      
      return handleResponse(response);
    },

    // Get all RM allocations
    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${MANUFACTURING_APIS.RM_ALLOCATION_LIST}?${queryString}` : MANUFACTURING_APIS.RM_ALLOCATION_LIST;
      
      const response = await apiRequest(url, {
        method: 'GET',
      });
      
      return handleResponse(response);
    },

    // Get allocation summary
    getSummary: async (moId) => {
      const response = await apiRequest(`${MANUFACTURING_APIS.RM_ALLOCATION_SUMMARY}?mo_id=${moId}`, {
        method: 'GET',
      });
      
      return handleResponse(response);
    },
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

  // Get dashboard statistics (THROTTLED)
  getDashboardStats: async () => {
    const response = await throttledGet(MANUFACTURING_APIS.MO_DASHBOARD_STATS);
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

  // Update MO details and handle all MO operations through single endpoint
  updateMODetails: async (id, updateData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_UPDATE_DETAILS(id), {
      method: 'PATCH',
      body: updateData,
    });
    
    return handleResponse(response);
  },

  // Simplified MO workflow - single approval by manager
  
  // Approve MO - Manager only (on_hold → mo_approved)
  approveMO: async (id, approvalData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_UPDATE_DETAILS(id), {
      method: 'PATCH',
      body: {
        action: 'approve',
        ...approvalData
      },
    });
    
    return handleResponse(response);
  },

  // Reject MO - Manager only (any status → rejected)
  rejectMO: async (id, rejectionData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_UPDATE_DETAILS(id), {
      method: 'PATCH',
      body: {
        action: 'reject',
        ...rejectionData
      },
    });
    
    return handleResponse(response);
  },

  // Start production - Manager only (mo_approved → in_progress)
  startProduction: async (id, startData) => {
    const response = await apiRequest(MANUFACTURING_APIS.MO_UPDATE_DETAILS(id), {
      method: 'PATCH',
      body: {
        action: 'start_production',
        ...startData
      },
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

  // Assign supervisor to process execution
  assignSupervisor: async (processExecutionId, supervisorId, notes = '') => {
    const response = await apiRequest(
      `${MANUFACTURING_APIS.MO_LIST.replace('manufacturing-orders', 'process-executions')}${processExecutionId}/assign_supervisor/`,
      {
        method: 'PUT',
        body: {
          assigned_supervisor: supervisorId,
          notes: notes,
        },
      }
    );
    
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

  // Get dashboard statistics (THROTTLED)
  getDashboardStats: async () => {
    try {
      const response = await throttledGet(MANUFACTURING_APIS.PO_DASHBOARD_STATS);
      return handleResponse(response);
    } catch (error) {
      // Handle permission errors gracefully
      if (error.message.includes('403') || error.message.includes('Permission denied')) {
        console.warn('User does not have permission to access purchase order dashboard stats');
        return { error: 'Permission denied', message: 'Purchase order data not available' };
      }
      throw error;
    }
  },

  // Get raw material codes only (LIGHTWEIGHT - for initial dropdown load)
  getRawMaterialCodes: async () => {
    const response = await throttledGet(INVENTORY_APIS.RAW_MATERIAL_CODES);
    return handleResponse(response);
  },

  // Get detailed information for a specific material (loaded on selection)
  getMaterialDetail: async (materialId) => {
    const response = await throttledGet(INVENTORY_APIS.RAW_MATERIAL_DETAIL(materialId));
    return handleResponse(response);
  },

  // DEPRECATED: Use getRawMaterialCodes() + getMaterialDetail() instead
  // Kept for backward compatibility
  getRawMaterials: async () => {
    const response = await throttledGet(MANUFACTURING_APIS.PO_RAW_MATERIALS);
    return handleResponse(response);
  },

  // Get vendors for dropdown (THROTTLED) - DEPRECATED, vendor now comes with material detail
  getVendors: async (vendorType = null) => {
    const url = vendorType 
      ? `${MANUFACTURING_APIS.PO_VENDORS}?vendor_type=${vendorType}`
      : MANUFACTURING_APIS.PO_VENDORS;
    
    const response = await throttledGet(url);
    return handleResponse(response);
  },
};

// Combined dashboard stats with graceful error handling
export const getDashboardStats = async () => {
  try {
    console.log('Fetching dashboard stats...');
    
    // Always try to get MO stats (most users can access this)
    let moStats = null;
    try {
      moStats = await manufacturingOrdersAPI.getDashboardStats();
      console.log('MO stats fetched successfully:', moStats);
    } catch (error) {
      console.error('Error fetching MO stats:', error);
      moStats = {
        error: 'Failed to fetch manufacturing order stats',
        total: 0,
        in_progress: 0,
        completed: 0,
        overdue: 0
      };
    }
    
    // Try to get PO stats, but handle errors gracefully
    let poStats = null;
    try {
      poStats = await purchaseOrdersAPI.getDashboardStats();
      console.log('PO stats fetched successfully:', poStats);
    } catch (error) {
      console.error('Error fetching PO stats:', error);
      poStats = {
        error: 'Failed to fetch purchase order stats',
        total: 0,
        po_approved: 0,
        rm_pending: 0,
        rm_completed: 0,
        total_value: 0
      };
    }
    
    // Check if PO stats returned an error object
    if (poStats && poStats.error === 'Permission denied') {
      console.warn('User does not have permission to access purchase order dashboard stats');
    }
    
    return {
      manufacturingOrders: moStats,
      purchaseOrders: poStats,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return mock data as fallback
    return {
      manufacturingOrders: {
        error: 'Failed to fetch manufacturing order stats',
        total: 0,
        in_progress: 0,
        completed: 0,
        overdue: 0
      },
      purchaseOrders: {
        error: 'Failed to fetch purchase order stats',
        total: 0,
        po_approved: 0,
        rm_pending: 0,
        rm_completed: 0,
        total_value: 0
      }
    };
  }
};

// Export default object with all services
// FG Store API Service
const fgStoreAPI = {
  // Get loose FG stock for a product
  getLooseFGStock: async (productCode) => {
    const response = await apiRequest(
      `${API_ENDPOINTS.FG_STORE.LOOSE_FG_STOCK}?product_code=${productCode}`,
      {
        method: 'GET',
      }
    );
    return handleResponse(response);
  },
};

// Supervisor Shift Management API
export const supervisorShiftsAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString()
      ? `/api/manufacturing/supervisor-shifts/?${queryParams}`
      : '/api/manufacturing/supervisor-shifts/';
    
    const response = await apiRequest(url, { method: 'GET' });
    return handleResponse(response);
  },

  get: async (id) => {
    const response = await apiRequest(`/api/manufacturing/supervisor-shifts/${id}/`, {
      method: 'GET'
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await apiRequest('/api/manufacturing/supervisor-shifts/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await apiRequest(`/api/manufacturing/supervisor-shifts/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await apiRequest(`/api/manufacturing/supervisor-shifts/${id}/`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  getSummary: async () => {
    const response = await apiRequest('/api/manufacturing/supervisor-shifts/summary/', {
      method: 'GET'
    });
    return handleResponse(response);
  }
};

// MO Supervisor Configuration API
export const moSupervisorConfigAPI = {
  getForMO: async (moId) => {
    const response = await apiRequest(`/api/manufacturing/mo-supervisor-config/for_mo/?mo_id=${moId}`, {
      method: 'GET'
    });
    return handleResponse(response);
  },

  addShiftToMO: async (data) => {
    const response = await apiRequest('/api/manufacturing/mo-supervisor-config/add_shift_to_mo/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  addSupervisorOverride: async (data) => {
    const response = await apiRequest('/api/manufacturing/mo-supervisor-config/add_supervisor_override/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  updateSupervisorOverride: async (data) => {
    const response = await apiRequest('/api/manufacturing/mo-supervisor-config/update_supervisor_override/', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  removeSupervisorOverride: async (overrideId) => {
    const response = await apiRequest(`/api/manufacturing/mo-supervisor-config/remove_supervisor_override/?override_id=${overrideId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// Daily Supervisor Status API
export const dailySupervisorStatusAPI = {
  getToday: async () => {
    const response = await apiRequest('/api/manufacturing/daily-supervisor-status/today/', {
      method: 'GET'
    });
    return handleResponse(response);
  },

  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString()
      ? `/api/manufacturing/daily-supervisor-status/?${queryParams}`
      : '/api/manufacturing/daily-supervisor-status/';
    
    const response = await apiRequest(url, { method: 'GET' });
    return handleResponse(response);
  },

  manualOverride: async (statusId, newSupervisorId, reason) => {
    const response = await apiRequest(`/api/manufacturing/daily-supervisor-status/${statusId}/manual_override/`, {
      method: 'POST',
      body: JSON.stringify({
        new_supervisor_id: newSupervisorId,
        reason: reason
      })
    });
    return handleResponse(response);
  }
};

// Supervisor Reports API
export const supervisorReportsAPI = {
  getAssignmentReport: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString()
      ? `/api/manufacturing/supervisor-reports/assignment_report/?${queryParams}`
      : '/api/manufacturing/supervisor-reports/assignment_report/';
    
    const response = await apiRequest(url, { method: 'GET' });
    return handleResponse(response);
  },

  getSupervisorWorkload: async (startDate, endDate) => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const url = `/api/manufacturing/supervisor-reports/supervisor_workload/?${queryParams}`;
    const response = await apiRequest(url, { method: 'GET' });
    return handleResponse(response);
  },

  getShiftSummary: async (date) => {
    const url = date 
      ? `/api/manufacturing/supervisor-reports/shift_summary/?date=${date}`
      : '/api/manufacturing/supervisor-reports/shift_summary/';
    
    const response = await apiRequest(url, { method: 'GET' });
    return handleResponse(response);
  }
};

// Supervisor Change Logs API
export const supervisorChangeLogsAPI = {
  getForMO: async (moId) => {
    const response = await apiRequest(`/api/manufacturing/supervisor-change-logs/for_mo/?mo_id=${moId}`, {
      method: 'GET'
    });
    return handleResponse(response);
  },

  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString()
      ? `/api/manufacturing/supervisor-change-logs/?${queryParams}`
      : '/api/manufacturing/supervisor-change-logs/';
    
    const response = await apiRequest(url, { method: 'GET' });
    return handleResponse(response);
  }
};

export default {
  manufacturingOrders: manufacturingOrdersAPI,
  purchaseOrders: purchaseOrdersAPI,
  batches: batchAPI,
  fgStore: fgStoreAPI,
  rawMaterialAllocations: manufacturingOrdersAPI.rawMaterialAllocations,
  getDashboardStats,
  supervisorShifts: supervisorShiftsAPI,
  moSupervisorConfig: moSupervisorConfigAPI,
  dailySupervisorStatus: dailySupervisorStatusAPI,
  supervisorReports: supervisorReportsAPI,
  supervisorChangeLogs: supervisorChangeLogsAPI,
};

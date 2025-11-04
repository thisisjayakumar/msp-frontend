/**
 * Admin Dashboard Service
 * Centralized service for all admin dashboard API calls
 */

import { ADMIN_APIS } from './api-list';
import { apiRequest } from './api-utils';

/**
 * Helper function to handle API responses with graceful error handling
 */
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

// ==================== USER MANAGEMENT ====================

// User Management API Service
export const usersAPI = {
  // Get all users with optional filters
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${ADMIN_APIS.USERS_LIST}?${queryParams}`
      : ADMIN_APIS.USERS_LIST;
    
    const response = await apiRequest(url, {
      method: 'GET',
    });
    
    const result = await handleResponse(response);
    
    // Handle paginated response from Django REST Framework
    // DRF returns { count, next, previous, results } for list endpoints
    if (result && result.results) {
      return result.results;
    }
    
    return result;
  },

  // Get user details by ID
  getById: async (userId) => {
    const response = await apiRequest(ADMIN_APIS.USERS_DETAIL(userId), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new user
  create: async (userData) => {
    const response = await apiRequest(ADMIN_APIS.USERS_CREATE, {
      method: 'POST',
      body: userData,
    });
    
    return handleResponse(response);
  },

  // Update existing user
  update: async (userId, userData) => {
    const response = await apiRequest(ADMIN_APIS.USERS_UPDATE(userId), {
      method: 'PUT',
      body: userData,
    });
    
    return handleResponse(response);
  },

  // Partial update user
  partialUpdate: async (userId, userData) => {
    const response = await apiRequest(ADMIN_APIS.USERS_UPDATE(userId), {
      method: 'PATCH',
      body: userData,
    });
    
    return handleResponse(response);
  },

  // Delete user
  delete: async (userId) => {
    const response = await apiRequest(ADMIN_APIS.USERS_DELETE(userId), {
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },

  // Perform bulk action on multiple users
  bulkAction: async (userIds, action, additionalData = {}) => {
    const response = await apiRequest(ADMIN_APIS.USERS_BULK_ACTION, {
      method: 'POST',
      body: {
        user_ids: userIds,
        action,
        ...additionalData,
      },
    });
    
    return handleResponse(response);
  },

  // Manage user roles
  manageRoles: async (userId, roleIds, replaceExisting = true) => {
    const response = await apiRequest(ADMIN_APIS.USERS_MANAGE_ROLES(userId), {
      method: 'POST',
      body: {
        role_ids: roleIds,
        replace_existing: replaceExisting,
      },
    });
    
    return handleResponse(response);
  },

  // Reset user password
  resetPassword: async (userId, newPassword) => {
    const response = await apiRequest(ADMIN_APIS.USERS_RESET_PASSWORD(userId), {
      method: 'POST',
      body: { new_password: newPassword },
    });
    
    return handleResponse(response);
  },

  // Toggle user active status
  toggleActive: async (userId) => {
    const response = await apiRequest(ADMIN_APIS.USERS_TOGGLE_ACTIVE(userId), {
      method: 'POST',
      body: {},
    });
    
    return handleResponse(response);
  },

  // Get users with multiple roles
  getMultipleRoles: async () => {
    const response = await apiRequest(ADMIN_APIS.USERS_MULTIPLE_ROLES, {
      method: 'GET',
    });
    
    const result = await handleResponse(response);
    
    // These endpoints return { count, users: [...] } format
    if (result && result.users) {
      return result.users;
    }
    
    return result;
  },

  // Get users without roles
  getWithoutRoles: async () => {
    const response = await apiRequest(ADMIN_APIS.USERS_WITHOUT_ROLES, {
      method: 'GET',
    });
    
    const result = await handleResponse(response);
    
    // These endpoints return { count, users: [...] } format
    if (result && result.users) {
      return result.users;
    }
    
    return result;
  },
};

// ==================== ROLE MANAGEMENT ====================

// Role Management API Service
export const rolesAPI = {
  // Get all roles
  getAll: async () => {
    const response = await apiRequest(ADMIN_APIS.ROLES_LIST, {
      method: 'GET',
    });
    
    const result = await handleResponse(response);
    
    // Handle paginated response from Django REST Framework
    if (result && result.results) {
      return result.results;
    }
    
    return result;
  },

  // Get role hierarchy with user counts
  getHierarchy: async () => {
    const response = await apiRequest(ADMIN_APIS.ROLES_HIERARCHY, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get role details by ID
  getById: async (roleId) => {
    const response = await apiRequest(ADMIN_APIS.ROLES_DETAIL(roleId), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Create new role
  create: async (roleData) => {
    const response = await apiRequest(ADMIN_APIS.ROLES_CREATE, {
      method: 'POST',
      body: roleData,
    });
    
    return handleResponse(response);
  },

  // Update existing role
  update: async (roleId, roleData) => {
    const response = await apiRequest(ADMIN_APIS.ROLES_UPDATE(roleId), {
      method: 'PUT',
      body: roleData,
    });
    
    return handleResponse(response);
  },

  // Partial update role
  partialUpdate: async (roleId, roleData) => {
    const response = await apiRequest(ADMIN_APIS.ROLES_UPDATE(roleId), {
      method: 'PATCH',
      body: roleData,
    });
    
    return handleResponse(response);
  },

  // Delete role
  delete: async (roleId) => {
    const response = await apiRequest(ADMIN_APIS.ROLES_DELETE(roleId), {
      method: 'DELETE',
    });
    
    return handleResponse(response);
  },

  // Get users assigned to a specific role
  getUsers: async (roleId) => {
    const response = await apiRequest(ADMIN_APIS.ROLES_USERS(roleId), {
      method: 'GET',
    });
    
    return handleResponse(response);
  },
};

// ==================== DASHBOARD STATISTICS ====================

// Dashboard Statistics API Service
export const dashboardAPI = {
  // Get admin dashboard statistics
  getStats: async () => {
    const response = await apiRequest(ADMIN_APIS.DASHBOARD_STATS, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get department summary
  getDepartmentSummary: async () => {
    const response = await apiRequest(ADMIN_APIS.DEPARTMENT_SUMMARY, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Get role permissions matrix
  getRolePermissionsMatrix: async () => {
    const response = await apiRequest(ADMIN_APIS.ROLE_PERMISSIONS_MATRIX, {
      method: 'GET',
    });
    
    return handleResponse(response);
  },

  // Sync user profiles
  syncProfiles: async () => {
    const response = await apiRequest(ADMIN_APIS.SYNC_PROFILES, {
      method: 'POST',
      body: {},
    });
    
    return handleResponse(response);
  },
};

// ==================== EXPORT ALL SERVICES ====================

// Combined admin API service (new structure)
export const adminAPI = {
  users: usersAPI,
  roles: rolesAPI,
  dashboard: dashboardAPI,
};

// Individual services are already exported inline above

// ==================== BACKWARD COMPATIBILITY WRAPPERS ====================
// These functions wrap the new API to maintain the old { success, data } format
// Note: These are deprecated and should be migrated to the new API structure

const wrapLegacyResponse = async (apiCall) => {
  try {
    const result = await apiCall();
    
    // Check if result has an error property (graceful error from handleResponse)
    if (result && result.error === true) {
      return {
        success: false,
        error: result.message,
        details: result.details,
        status: result.status,
      };
    }
    
    // Success case - wrap the data
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // Handle thrown errors (authentication errors, etc.)
    return {
      success: false,
      error: error.message || 'An error occurred',
    };
  }
};

// User Management - Legacy exports
export const fetchUsers = (filters) => wrapLegacyResponse(() => usersAPI.getAll(filters));
export const getUserDetails = (userId) => wrapLegacyResponse(() => usersAPI.getById(userId));
export const createUser = (userData) => wrapLegacyResponse(() => usersAPI.create(userData));
export const updateUser = (userId, userData) => wrapLegacyResponse(() => usersAPI.update(userId, userData));
export const deleteUser = (userId) => wrapLegacyResponse(() => usersAPI.delete(userId));
export const bulkUserAction = (userIds, action, additionalData) => 
  wrapLegacyResponse(() => usersAPI.bulkAction(userIds, action, additionalData));
export const manageUserRoles = (userId, roleIds, replaceExisting) => 
  wrapLegacyResponse(() => usersAPI.manageRoles(userId, roleIds, replaceExisting));
export const resetUserPassword = (userId, newPassword) => 
  wrapLegacyResponse(() => usersAPI.resetPassword(userId, newPassword));
export const toggleUserActive = (userId) => wrapLegacyResponse(() => usersAPI.toggleActive(userId));
export const getUsersWithMultipleRoles = () => wrapLegacyResponse(() => usersAPI.getMultipleRoles());
export const getUsersWithoutRoles = () => wrapLegacyResponse(() => usersAPI.getWithoutRoles());

// Role Management - Legacy exports
export const fetchRoles = () => wrapLegacyResponse(() => rolesAPI.getAll());
export const fetchRoleHierarchy = () => wrapLegacyResponse(() => rolesAPI.getHierarchy());
export const getRoleDetails = (roleId) => wrapLegacyResponse(() => rolesAPI.getById(roleId));
export const createRole = (roleData) => wrapLegacyResponse(() => rolesAPI.create(roleData));
export const updateRole = (roleId, roleData) => wrapLegacyResponse(() => rolesAPI.update(roleId, roleData));
export const deleteRole = (roleId) => wrapLegacyResponse(() => rolesAPI.delete(roleId));
export const getUsersByRole = (roleId) => wrapLegacyResponse(() => rolesAPI.getUsers(roleId));

// Dashboard Statistics - Legacy exports
export const fetchDashboardStats = () => wrapLegacyResponse(() => dashboardAPI.getStats());
export const fetchDepartmentSummary = () => wrapLegacyResponse(() => dashboardAPI.getDepartmentSummary());
export const fetchRolePermissionsMatrix = () => wrapLegacyResponse(() => dashboardAPI.getRolePermissionsMatrix());
export const syncUserProfiles = () => wrapLegacyResponse(() => dashboardAPI.syncProfiles());

// ==================== DEFAULT EXPORT (LEGACY COMPATIBILITY) ====================
// Default export with all legacy function names for backward compatibility
const adminService = {
  // User Management
  fetchUsers,
  getUserDetails,
  createUser,
  updateUser,
  deleteUser,
  bulkUserAction,
  manageUserRoles,
  resetUserPassword,
  toggleUserActive,
  getUsersWithMultipleRoles,
  getUsersWithoutRoles,

  // Role Management
  fetchRoles,
  fetchRoleHierarchy,
  getRoleDetails,
  createRole,
  updateRole,
  deleteRole,
  getUsersByRole,

  // Dashboard Statistics
  fetchDashboardStats,
  fetchDepartmentSummary,
  fetchRolePermissionsMatrix,
  syncUserProfiles,
};

export default adminService;


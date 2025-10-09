// Permission utility to check user roles before making API calls
import { authUtils } from '@/components/API_Service/api-utils';

class PermissionChecker {
  constructor() {
    this.permissionCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  // Get user role from localStorage with caching
  getUserRole() {
    const cacheKey = 'user_role';
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.role;
    }
    
    const role = localStorage.getItem('userRole') || 'unknown';
    this.permissionCache.set(cacheKey, {
      role,
      timestamp: Date.now()
    });
    
    return role;
  }

  // Check if user has permission for purchase order operations
  canAccessPurchaseOrders() {
    const role = this.getUserRole();
    return ['admin', 'manager', 'production_head', 'rm_store'].includes(role);
  }

  // Check if user has permission for manufacturing order operations
  canAccessManufacturingOrders() {
    const role = this.getUserRole();
    return ['admin', 'manager', 'production_head', 'supervisor', 'rm_store'].includes(role);
  }

  // Check if user has permission for inventory operations
  canAccessInventory() {
    const role = this.getUserRole();
    return ['admin', 'manager', 'rm_store', 'fg_store'].includes(role);
  }

  // Check if user has permission for process tracking
  canAccessProcessTracking() {
    const role = this.getUserRole();
    return ['admin', 'manager', 'production_head', 'supervisor'].includes(role);
  }

  // Get user-friendly permission message
  getPermissionMessage(operation) {
    const role = this.getUserRole();
    
    const messages = {
      purchaseOrders: 'Only Managers, Production Heads, and RM Store users can access purchase order data.',
      manufacturingOrders: 'Only Managers, Production Heads, Supervisors, and RM Store users can access manufacturing order data.',
      inventory: 'Only Managers, RM Store, and FG Store users can access inventory data.',
      processTracking: 'Only Managers, Production Heads, and Supervisors can access process tracking data.'
    };
    
    return messages[operation] || 'You do not have permission to access this data.';
  }

  // Clear permission cache (useful when user role changes)
  clearCache() {
    this.permissionCache.clear();
  }
}

// Create singleton instance
const permissionChecker = new PermissionChecker();

// Export utilities
export const checkPermission = (operation) => {
  switch (operation) {
    case 'purchaseOrders':
      return permissionChecker.canAccessPurchaseOrders();
    case 'manufacturingOrders':
      return permissionChecker.canAccessManufacturingOrders();
    case 'inventory':
      return permissionChecker.canAccessInventory();
    case 'processTracking':
      return permissionChecker.canAccessProcessTracking();
    default:
      return false;
  }
};

export const getPermissionMessage = (operation) => {
  return permissionChecker.getPermissionMessage(operation);
};

export const getUserRole = () => {
  return permissionChecker.getUserRole();
};

export const clearPermissionCache = () => {
  permissionChecker.clearCache();
};

export default permissionChecker;

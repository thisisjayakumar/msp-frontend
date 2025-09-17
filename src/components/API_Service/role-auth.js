import { apiPost } from './api-utils';
import { AUTH_APIS } from './api-list';

// Role-specific login functions
export const roleAuthService = {
  // Admin login
  adminLogin: async (credentials) => {
    const response = await apiPost(AUTH_APIS.ADMIN_LOGIN, {
      ...credentials,
      role: 'admin'
    });
    
    if (response.success) {
      // Store admin-specific token and role info
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('adminPermissions', JSON.stringify(response.data.permissions || []));
    }
    
    return response;
  },

  // Manager login
  managerLogin: async (credentials) => {
    const response = await apiPost(AUTH_APIS.MANAGER_LOGIN, {
      ...credentials,
      role: 'manager'
    });
    
    if (response.success) {
      localStorage.setItem('userRole', 'manager');
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('managerPermissions', JSON.stringify(response.data.permissions || []));
    }
    
    return response;
  },

  // Supervisor login
  supervisorLogin: async (credentials) => {
    const response = await apiPost(AUTH_APIS.SUPERVISOR_LOGIN, {
      ...credentials,
      role: 'supervisor'
    });
    
    if (response.success) {
      localStorage.setItem('userRole', 'supervisor');
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('supervisorPermissions', JSON.stringify(response.data.permissions || []));
    }
    
    return response;
  },

  // Store Manager login
  storeManagerLogin: async (credentials) => {
    const response = await apiPost(AUTH_APIS.STORE_MANAGER_LOGIN, {
      ...credentials,
      role: 'store_manager'
    });
    
    if (response.success) {
      localStorage.setItem('userRole', 'store_manager');
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('storeManagerPermissions', JSON.stringify(response.data.permissions || []));
    }
    
    return response;
  },

  // Operator login
  operatorLogin: async (credentials) => {
    const response = await apiPost(AUTH_APIS.OPERATOR_LOGIN, {
      ...credentials,
      role: 'operator'
    });
    
    if (response.success) {
      localStorage.setItem('userRole', 'operator');
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('operatorPermissions', JSON.stringify(response.data.permissions || []));
    }
    
    return response;
  },

  // Generic role login (determines endpoint based on role)
  loginByRole: async (role, credentials) => {
    const loginMethods = {
      admin: roleAuthService.adminLogin,
      manager: roleAuthService.managerLogin,
      supervisor: roleAuthService.supervisorLogin,
      store_manager: roleAuthService.storeManagerLogin,
      operator: roleAuthService.operatorLogin
    };

    const loginMethod = loginMethods[role];
    if (!loginMethod) {
      throw new Error(`Invalid role: ${role}`);
    }

    return await loginMethod(credentials);
  },

  // Get current user role
  getCurrentRole: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole');
    }
    return null;
  },

  // Get role-specific permissions
  getRolePermissions: (role) => {
    if (typeof window !== 'undefined') {
      const permissionsKey = `${role}Permissions`;
      const permissions = localStorage.getItem(permissionsKey);
      return permissions ? JSON.parse(permissions) : [];
    }
    return [];
  },

  // Check if user has specific permission
  hasPermission: (permission) => {
    const role = roleAuthService.getCurrentRole();
    if (!role) return false;
    
    const permissions = roleAuthService.getRolePermissions(role);
    return permissions.includes(permission) || permissions.includes('all');
  },

  // Logout (clears all role-specific data)
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userRole');
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminPermissions');
      localStorage.removeItem('managerPermissions');
      localStorage.removeItem('supervisorPermissions');
      localStorage.removeItem('storeManagerPermissions');
      localStorage.removeItem('operatorPermissions');
    }
  },

  // Check if user is authenticated with specific role
  isAuthenticatedAs: (role) => {
    const currentRole = roleAuthService.getCurrentRole();
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    return currentRole === role && !!token;
  }
};

export default roleAuthService;

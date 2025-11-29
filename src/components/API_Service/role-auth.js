import { apiPost } from './api-utils';
import { AUTH_APIS } from './api-list';

// Generic login function that works for all roles
const performLogin = async (credentials, expectedRole = null) => {
  console.log('🔐 Attempting login for:', credentials.email, 'Expected role:', expectedRole);
  
  const response = await apiPost(AUTH_APIS.LOGIN, credentials);
  
  console.log('📥 Login response:', response.success ? 'Success' : 'Failed', response);
  
  if (response.success) {
    const { access, refresh, user } = response.data;
    
    console.log('👤 User data:', user);
    console.log('🎭 User role:', user.primary_role?.name);
    
    // Validate role if specified
    if (expectedRole && user.primary_role?.name !== expectedRole) {
      const userRoleName = user.primary_role?.name || 'unknown';
      console.log('❌ Role mismatch! Expected:', expectedRole, 'Got:', userRoleName);
      return {
        success: false,
        error: `Access denied. Only ${expectedRole}s are allowed to login here. You are logged in as a ${userRoleName}.`
      };
    }
    
    // Store authentication data
    localStorage.setItem('authToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('userRole', user.primary_role?.name || 'unknown');
    localStorage.setItem('userData', JSON.stringify(user));
    
    console.log('💾 Stored in localStorage:', {
      hasToken: !!access,
      hasRefresh: !!refresh,
      role: user.primary_role?.name
    });
    
    // Store role-specific permissions if available
    if (user.primary_role?.name) {
      const permissionsKey = `${user.primary_role.name}Permissions`;
      localStorage.setItem(permissionsKey, JSON.stringify(user.permissions || []));
    }
    
    console.log('✅ Login successful! Returning role:', user.primary_role?.name);
    
    return {
      success: true,
      data: {
        token: access,
        refreshToken: refresh,
        user: user,
        role: user.primary_role?.name
      }
    };
  }
  
  console.log('❌ Login failed:', response.error);
  return response;
};

// Role-specific login functions
export const roleAuthService = {
  // Admin login
  adminLogin: async (credentials) => {
    return await performLogin(credentials, 'admin');
  },

  // Manager login
  managerLogin: async (credentials) => {
    return await performLogin(credentials, 'manager');
  },

  // Production Head login
  productionHeadLogin: async (credentials) => {
    return await performLogin(credentials, 'production_head');
  },

  // Supervisor login
  supervisorLogin: async (credentials) => {
    return await performLogin(credentials, 'supervisor');
  },

  // RM Store login
  rmStoreLogin: async (credentials) => {
    return await performLogin(credentials, 'rm_store');
  },

  // FG Store login
  fgStoreLogin: async (credentials) => {
    return await performLogin(credentials, 'fg_store');
  },

  // Generic login (no role validation)
  login: async (credentials) => {
    return await performLogin(credentials);
  },

  // Generic role login (determines endpoint based on role)
  loginByRole: async (role, credentials) => {
    const loginMethods = {
      admin: roleAuthService.adminLogin,
      manager: roleAuthService.managerLogin,
      production_head: roleAuthService.productionHeadLogin,
      supervisor: roleAuthService.supervisorLogin,
      rm_store: roleAuthService.rmStoreLogin,
      fg_store: roleAuthService.fgStoreLogin
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

  // Logout (clears all role-specific data and handles supervisor reassignment)
  logout: async () => {
    if (typeof window === 'undefined') {
      return { success: true };
    }

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const authToken = localStorage.getItem('authToken');
      
      // Call logout API if tokens exist
      if (authToken) {
        const response = await fetch(AUTH_APIS.LOGOUT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ refresh: refreshToken })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Logout successful:', data.message);
          
          // Show reassignment summary if supervisor logged out
          if (data.reassignment_summary && data.reassignment_summary.length > 0) {
            console.log('📋 Work reassignment summary:', data.reassignment_summary);
            
            // You can show a notification here if needed
            const reassignedCount = data.reassignment_summary.filter(
              r => r.status === 'reassigned_to_backup'
            ).length;
            const unassignedCount = data.reassignment_summary.filter(
              r => r.status !== 'reassigned_to_backup'
            ).length;
            
            if (reassignedCount > 0) {
              console.log(`✓ ${reassignedCount} process(es) reassigned to backup supervisor`);
            }
            if (unassignedCount > 0) {
              console.warn(`⚠ ${unassignedCount} process(es) left unassigned (no backup available)`);
            }
          }
          
          return {
            success: true,
            reassignment_summary: data.reassignment_summary
          };
        } else {
          console.warn('Logout API call failed, clearing local storage anyway');
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear all local storage data
      localStorage.removeItem('userRole');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('adminPermissions');
      localStorage.removeItem('managerPermissions');
      localStorage.removeItem('production_headPermissions');
      localStorage.removeItem('supervisorPermissions');
      localStorage.removeItem('rm_storePermissions');
      localStorage.removeItem('fg_storePermissions');
    }

    return { success: true };
  },

  // Check if user is authenticated with specific role
  isAuthenticatedAs: (role) => {
    const currentRole = roleAuthService.getCurrentRole();
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    return currentRole === role && !!token;
  }
};

export default roleAuthService;

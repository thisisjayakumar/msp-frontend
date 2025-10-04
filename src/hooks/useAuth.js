"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { roleAuthService } from '@/components/API_Service/role-auth';
import { getRoleConfig } from '@/components/config/roles';

/**
 * Custom hook for authentication and authorization
 * @param {string} requiredRole - Optional: specific role required to access the page
 * @returns {object} - { user, role, isLoading, isAuthenticated }
 */
export function useAuth(requiredRole = null) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Check if user is authenticated
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
      const userData = typeof window !== 'undefined' ? localStorage.getItem('userData') : null;

      if (!token || !userRole) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      // Parse user data
      const parsedUser = userData ? JSON.parse(userData) : null;
      setUser(parsedUser);
      setRole(userRole);
      setIsAuthenticated(true);

      // Check if user has required role
      if (requiredRole && userRole !== requiredRole) {
        // User doesn't have required role, redirect to their dashboard
        const roleConfig = getRoleConfig(userRole);
        const dashboardPath = roleConfig?.path 
          ? `${roleConfig.path}/dashboard` 
          : '/login';
        router.push(dashboardPath);
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [requiredRole, router]);

  return {
    user,
    role,
    isLoading,
    isAuthenticated
  };
}

/**
 * Higher-order component to protect routes
 * @param {React.Component} Component - Component to protect
 * @param {string} requiredRole - Optional: specific role required
 */
export function withAuth(Component, requiredRole = null) {
  return function ProtectedRoute(props) {
    const { isLoading } = useAuth(requiredRole);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function usePermission(permission) {
  const { role } = useAuth();
  
  if (!role) return false;
  
  return roleAuthService.hasPermission(permission);
}


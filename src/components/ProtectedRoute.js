"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRoleConfig } from '@/components/config/roles';

/**
 * Component to protect routes requiring authentication
 * Wraps pages that require authentication
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // Check authentication
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

      if (!token || !userRole) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      // Check if user has required role (if specified)
      if (requiredRole && userRole !== requiredRole) {
        // User doesn't have required role, redirect to their dashboard
        const roleConfig = getRoleConfig(userRole);
        const dashboardPath = roleConfig?.path 
          ? `${roleConfig.path}/dashboard` 
          : '/login';
        router.push(dashboardPath);
        return;
      }

      // User is authorized
      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}


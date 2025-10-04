"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RMStoreDashboard from '../../../components/rm-store/RMStoreDashboard';
import { authUtils } from '../../../components/API_Service/api-utils';
import LoadingSpinner from '../../../components/CommonComponents/ui/LoadingSpinner';

export default function RMStoreDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = authUtils.getToken();
      
      if (!token) {
        // No token, redirect to login
        router.replace('/operator'); // Assuming operator is the login page
        return;
      }

      // TODO: Add role verification here
      // For now, assume user has rm_store role if they have a token
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <RMStoreDashboard />;
}

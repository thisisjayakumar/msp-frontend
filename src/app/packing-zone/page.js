'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { roleAuthService } from '@/components/API_Service/role-auth';

export default function PackingZonePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (roleAuthService.isAuthenticated()) {
      const userRole = roleAuthService.getRole();
      
      // Redirect to appropriate dashboard based on role
      if (userRole === 'packing_zone' || userRole === 'production_head' || userRole === 'manager' || userRole === 'admin') {
        router.replace('/packing-zone/dashboard');
      } else {
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}


"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductionHeadPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (token && (userRole === 'production_head' || userRole === 'manager')) {
      // Already authenticated, redirect to dashboard
      router.replace('/production-head/dashboard');
    } else {
      // Not authenticated, redirect to unified login
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

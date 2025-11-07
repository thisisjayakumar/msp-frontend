"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PatrolPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');

    if (!token || userRole !== 'patrol') {
      router.push('/login');
    } else {
      router.push('/patrol/dashboard');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}


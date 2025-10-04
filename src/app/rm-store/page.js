"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RMStorePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace('/rm-store/dashboard');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to RM Store Dashboard...</p>
      </div>
    </div>
  );
}

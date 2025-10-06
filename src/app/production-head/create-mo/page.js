"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SimplifiedManufacturingOrderForm from '@/components/manager/SimplifiedManufacturingOrderForm';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import NotifyXTest from '@/components/NotifyXTest';

export default function CreateMOPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check authentication and role - allow both production_head and manager
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      
      // Allow both production_head and manager roles
      if (!token || (userRole !== 'production_head' && userRole !== 'manager')) {
        router.push('/production-head');
        return;
      }
      
      // Get user info from localStorage
      const userData = localStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleMOSuccess = () => {
    // Navigate back to dashboard after successful MO creation
    router.replace('/production-head/dashboard');
  };

  const handleBack = () => {
    router.replace('/production-head/dashboard');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <span className="text-xl">←</span>
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Create Manufacturing Order</h1>
                <p className="text-sm text-slate-600">Plan and initiate production orders</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-700">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-xs text-slate-500 capitalize">
                  {user?.primary_role?.name || 'Production Head'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl shadow-slate-200/50 p-8">
          <SimplifiedManufacturingOrderForm onSuccess={handleMOSuccess} />
        </div>
      </main>
      
      {/* Temporary NotifyX Test Component */}
      <NotifyXTest />
    </div>
  );
}

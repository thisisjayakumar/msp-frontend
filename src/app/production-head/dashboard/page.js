"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

// Components (reusing manager components)
import DashboardStats from '@/components/manager/DashboardStats';
import ManufacturingOrderForm from '@/components/manager/ManufacturingOrderForm';
import PurchaseOrderForm from '@/components/manager/PurchaseOrderForm';
import OrdersList from '@/components/manager/OrdersList';
import ProcessTrackingSummary from '@/components/manager/ProcessTrackingSummary';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import SimplifiedManufacturingOrderForm from '@/components/manager/SimplifiedManufacturingOrderForm';

export default function ProductionHeadDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [user, setUser] = useState(null);

  // Check authentication and role - allow both production_head and manager roles
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      
      // Allow both production_head and manager roles
      if (!token || (userRole !== 'production_head' && userRole !== 'manager')) {
        router.push('/production-head');
        return;
      }
      
      // Get user info from localStorage or API
      const userData = localStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await manufacturingAPI.getDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    if (!loading) {
      fetchStats();
    }
  }, [loading]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    router.replace('/login');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'process-tracking', label: 'Process Tracking', icon: '🏭' },
    { id: 'mo-list', label: 'MO List', icon: '📋' },
    { id: 'po-list', label: 'PO List', icon: '📄' },
  ];

  const navigationButtons = [
    { 
      id: 'create-mo', 
      label: 'Create Manufacturing Order', 
      icon: '🏭', 
      onClick: () => router.push('/production-head/create-mo')
    },
    { 
      id: 'create-po', 
      label: 'Create Purchase Order', 
      icon: '📦', 
      onClick: () => router.push('/production-head/create-po')
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Production Head Dashboard
              </h1>
              <p className="mt-1 text-amber-100">
                {user ? `Welcome, ${user.first_name || user.email}` : 'Production Management'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors backdrop-blur-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        {/* <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {navigationButtons.map((button) => (
            <button
              key={button.id}
              onClick={button.onClick}
              className="bg-white hover:bg-gray-50 border-2 border-amber-500 rounded-xl p-6 transition-all hover:shadow-lg group"
            >
              <div className="flex items-center space-x-4">
                <span className="text-4xl group-hover:scale-110 transition-transform">
                  {button.icon}
                </span>
                <span className="text-lg font-semibold text-gray-800 group-hover:text-amber-600">
                  {button.label}
                </span>
              </div>
            </button>
          ))}
        </div> */}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <DashboardStats stats={dashboardStats} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="text-2xl mr-2">🏭</span>
                      Quick Create MO
                    </h3>
                    <SimplifiedManufacturingOrderForm />
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="text-2xl mr-2">📦</span>
                      Quick Create PO
                    </h3>
                    <PurchaseOrderForm simplified={true} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'process-tracking' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Process Tracking Overview
                </h3>
                <ProcessTrackingSummary />
              </div>
            )}

            {activeTab === 'mo-list' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Manufacturing Orders
                  </h3>
                  <button
                    onClick={() => router.push('/production-head/create-mo')}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    + Create New MO
                  </button>
                </div>
                <OrdersList type="mo" />
              </div>
            )}

            {activeTab === 'po-list' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Purchase Orders
                  </h3>
                  <button
                    onClick={() => router.push('/production-head/create-po')}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    + Create New PO
                  </button>
                </div>
                <OrdersList type="po" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

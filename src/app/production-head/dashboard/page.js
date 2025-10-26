"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

// Components (reusing manager components)
import DashboardStats from '@/components/manager/DashboardStats';
import OrdersList from '@/components/manager/OrdersList';
import ProcessTrackingSummary from '@/components/manager/ProcessTrackingSummary';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';

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

  // Fetch dashboard statistics only once when authentication is complete
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await manufacturingAPI.getDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    // Only fetch once when component mounts and user is authenticated
    if (!loading && user && !dashboardStats) {
      fetchStats();
    }
  }, [loading, user, dashboardStats]);

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
    { id: 'outsourcing', label: 'Outsourcing', icon: '🚚' },
    { id: 'work-centers', label: 'Work Centers', icon: '⚙️' },
    { id: 'supervisor-dashboard', label: 'Supervisors', icon: '👥' },
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

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-8 px-6 min-w-max sm:min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-2 sm:py-4 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
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

            {activeTab === 'outsourcing' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Outsourcing Requests
                  </h3>
                  <button
                    onClick={() => router.push('/production-head/create-outsourcing')}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    + Create New Request
                  </button>
                </div>
                <div className="text-center py-8">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">
                    Outsourcing Management
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Track items sent to external vendors for processing
                  </p>
                  <button
                    onClick={() => router.push('/production-head/outsourcing')}
                    className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    <span className="text-2xl">🚚</span>
                    <div className="text-left">
                      <div className="font-semibold">Manage Outsourcing</div>
                      <div className="text-xs text-blue-100">View requests and track returns</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'work-centers' && (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Work Center Management
                </h3>
                <p className="text-gray-600 mb-6">
                  Configure work centers and supervisor assignments
                </p>
                <button
                  onClick={() => router.push('/manager/work-centers')}
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <span className="text-2xl">⚙️</span>
                  <div className="text-left">
                    <div className="font-semibold">Manage Work Centers</div>
                    <div className="text-xs text-amber-100">Configure supervisors and settings</div>
                  </div>
                </button>
              </div>
            )}

            {activeTab === 'supervisor-dashboard' && (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Supervisor Attendance Dashboard
                </h3>
                <p className="text-gray-600 mb-6">
                  Monitor daily supervisor attendance and assignments
                </p>
                <button
                  onClick={() => router.push('/admin/supervisor-dashboard')}
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <span className="text-2xl">👥</span>
                  <div className="text-left">
                    <div className="font-semibold">View Supervisor Dashboard</div>
                    <div className="text-xs text-green-100">Check attendance and manage overrides</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

// Components (reusing manager components)
import DashboardStats from '@/components/manager/DashboardStats';
import OrdersList from '@/components/manager/OrdersList';
import ProcessTrackingSummary from '@/components/manager/ProcessTrackingSummary';
import InventoryTransactionsList from '@/components/production-head/InventoryTransactionsList';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import PatrolManagementTab from '@/components/patrol/PatrolManagementTab';
import WorkCenterManagementTab from '@/components/manager/WorkCenterManagementTab';
import SupervisorDashboardTab from '@/components/manager/SupervisorDashboardTab';
import OutsourcingManagementTab from '@/components/manager/OutsourcingManagementTab';

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

  const handleRefreshStats = async () => {
    try {
      const stats = await manufacturingAPI.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error refreshing dashboard stats:', error);
    }
  };

  const handleRefreshProcessTracking = () => {
    // This will trigger a refresh in ProcessTrackingSummary component
    // We'll need to pass a refresh trigger to the component
    window.dispatchEvent(new CustomEvent('refreshProcessTracking'));
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'process-tracking', label: 'Process Tracking', icon: '🏭' },
    { id: 'mo-list', label: 'MO List', icon: '📋' },
    { id: 'po-list', label: 'PO List', icon: '📄' },
    { id: 'inventory-transactions', label: 'Inventory Transactions', icon: '📦' },
    { id: 'outsourcing', label: 'Outsourcing', icon: '🚚' },
    { id: 'work-centers', label: 'Work Centers', icon: '⚙️' },
    { id: 'supervisor-dashboard', label: 'Supervisors', icon: '👥' },
    { id: 'patrol', label: 'Patrol', icon: '🛡️' },
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
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">Dashboard Statistics</h3>
                  <button
                    onClick={handleRefreshStats}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Refresh Stats
                  </button>
                </div>
                <DashboardStats stats={dashboardStats} />
              </div>
            )}

            {activeTab === 'process-tracking' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
                <div className="p-6 border-b border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                        <span>🏭</span>
                        <span>Process Tracking Overview</span>
                      </h2>
                      <p className="text-slate-600 mt-1">Monitor manufacturing processes and production flow</p>
                    </div>
                    <button
                      onClick={handleRefreshProcessTracking}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <ProcessTrackingSummary />
                </div>
              </div>
            )}

            {activeTab === 'mo-list' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
                <div className="p-6 border-b border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                        <span>📋</span>
                        <span>Manufacturing Orders</span>
                      </h2>
                      <p className="text-slate-600 mt-1">View and manage manufacturing orders</p>
                    </div>
                    <button
                      onClick={() => router.push('/production-head/create-mo')}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      + Create New MO
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <OrdersList type="mo" />
                </div>
              </div>
            )}

            {activeTab === 'po-list' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
                <div className="p-6 border-b border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                        <span>📄</span>
                        <span>Purchase Orders</span>
                      </h2>
                      <p className="text-slate-600 mt-1">View and manage purchase orders</p>
                    </div>
                    <button
                      onClick={() => router.push('/production-head/create-po')}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      + Create New PO
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <OrdersList type="po" />
                </div>
              </div>
            )}

            {activeTab === 'inventory-transactions' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
                <div className="p-6 border-b border-slate-200/60">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                    <span>📦</span>
                    <span>Inventory Transactions</span>
                  </h2>
                  <p className="text-slate-600 mt-1">View and track inventory movements and transactions</p>
                </div>
                <div className="p-6">
                  <InventoryTransactionsList />
                </div>
              </div>
            )}

            {activeTab === 'outsourcing' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
                <div className="p-4 border-b border-slate-200/60">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                    <span>🚚</span>
                    <span>Outsourcing Management</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">Track items sent to external vendors for processing</p>
                </div>
                <div className="p-4">
                  <OutsourcingManagementTab isReadOnly={false} />
                </div>
              </div>
            )}

            {activeTab === 'work-centers' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
                <div className="p-4 border-b border-slate-200/60">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                    <span>⚙️</span>
                    <span>Work Center Management</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">Configure work centers and supervisor assignments</p>
                </div>
                <div className="p-4">
                  <WorkCenterManagementTab isReadOnly={false} />
                </div>
              </div>
            )}

            {activeTab === 'supervisor-dashboard' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
                <div className="p-4 border-b border-slate-200/60">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                    <span>👥</span>
                    <span>Supervisor Attendance Dashboard</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">Monitor daily supervisor attendance and assignments</p>
                </div>
                <div className="p-4">
                  <SupervisorDashboardTab isReadOnly={false} />
                </div>
              </div>
            )}

            {activeTab === 'patrol' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
                <div className="p-4 border-b border-slate-200/60">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                    <span>🛡️</span>
                    <span>Patrol Management</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">Manage patrol duties and uploads</p>
                </div>
                <div className="p-4">
                  <PatrolManagementTab isReadOnly={false} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

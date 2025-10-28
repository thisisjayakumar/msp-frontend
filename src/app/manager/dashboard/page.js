"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authUtils, apiRequest } from '../../../components/API_Service/api-utils';
import LoadingSpinner from '../../../components/CommonComponents/ui/LoadingSpinner';
import OrdersList from '../../../components/manager/OrdersList';
import ProcessTrackingSummary from '@/components/manager/ProcessTrackingSummary';
import DashboardStats from '@/components/manager/DashboardStats';
import manufacturingAPI, { getDashboardStats } from '@/components/API_Service/manufacturing-api';
import ManagerNotificationBell from '@/components/manager/NotificationBell';

export default function ManagerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Check authentication and role
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        console.log('Auth check - Token:', !!token, 'Role:', userRole);
        
        if (!token || userRole !== 'manager') {
          console.log('Auth failed - redirecting to /manager');
          router.push('/manager');
          return;
        }
        
        // Get user info from localStorage or API
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            setUser(JSON.parse(userData));
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            setError('Invalid user data');
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in auth check:', error);
        setError('Authentication error');
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch dashboard statistics only once when authentication is complete
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching dashboard stats...');
        
        // Fetch real stats from centralized API service
        // No need for separate connectivity test - the service handles errors gracefully
        const stats = await getDashboardStats();
        console.log('Dashboard stats received:', stats);
        setDashboardStats(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        
        // Provide mock data as fallback
        const mockStats = {
          manufacturingOrders: {
            total: 25,
            in_progress: 8,
            completed: 15,
            overdue: 2,
            by_priority: {
              high: 5,
              medium: 12,
              low: 8
            }
          },
          purchaseOrders: {
            total: 18,
            po_approved: 6,
            rm_pending: 4,
            rm_completed: 8,
            total_value: 450000
          }
        };
        console.log('Using mock stats:', mockStats);
        setDashboardStats(mockStats);
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

  const handleRefresh = () => {
    // Refresh dashboard stats when notification is clicked
    if (!loading && user && dashboardStats) {
      const fetchStats = async () => {
        try {
          const stats = await getDashboardStats();
          setDashboardStats(stats);
        } catch (error) {
          console.error('Error refreshing dashboard stats:', error);
        }
      };
      fetchStats();
    }
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

  // Error boundary for any unexpected errors
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              // Retry authentication
              const token = localStorage.getItem('authToken');
              const userRole = localStorage.getItem('userRole');
              if (token && userRole === 'manager') {
                setLoading(false);
              } else {
                router.push('/manager');
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-2"
          >
            Retry
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Authentication Error</div>
          <p className="text-gray-600 mb-4">Unable to load user data. Please try logging in again.</p>
          <button
            onClick={handleLogout}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MS</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">MicroSprings</h1>
                  <p className="text-xs text-slate-500">Manager Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              
              {/* Notification Bell */}
              <ManagerNotificationBell onNotificationClick={handleRefresh} />
              
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500">Manager</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-slate-200/40 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-3 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/80'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              <DashboardStats stats={dashboardStats} />
            </div>
          )}

          {/* Process Tracking Tab */}
          {activeTab === 'process-tracking' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <span>🏭</span>
                  <span>Process Tracking Overview</span>
                </h2>
                <p className="text-slate-600 mt-1">Monitor manufacturing processes and production flow</p>
              </div>
              <div className="p-6">
                <ProcessTrackingSummary />
              </div>
            </div>
          )}


          {/* MO List Tab */}
          {activeTab === 'mo-list' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <span>📋</span>
                  <span>Manufacturing Orders</span>
                </h2>
                <p className="text-slate-600 mt-1">View and manage manufacturing orders</p>
              </div>
              <div className="p-6">
                <OrdersList type="mo" />
              </div>
            </div>
          )}

          {/* PO List Tab */}
          {activeTab === 'po-list' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <span>📄</span>
                  <span>Purchase Orders</span>
                </h2>
                <p className="text-slate-600 mt-1">View and manage purchase orders</p>
              </div>
              <div className="p-6">
                <OrdersList type="po" />
              </div>
            </div>
          )}

          {/* Outsourcing Tab */}
          {activeTab === 'outsourcing' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <span>🚚</span>
                  <span>Outsourcing Management</span>
                </h2>
                <p className="text-slate-600 mt-1">Track items sent to external vendors for processing</p>
              </div>
              <div className="p-6 text-center">
                <div className="py-8">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">
                    Outsourcing Requests
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Monitor and manage outsourcing requests, track returns, and maintain inventory traceability
                  </p>
                  <button
                    onClick={() => router.push('/manager/outsourcing')}
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
            </div>
          )}

          {/* Work Centers Tab */}
          {activeTab === 'work-centers' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <span>⚙️</span>
                  <span>Work Center Management</span>
                </h2>
                <p className="text-slate-600 mt-1">Configure work centers and supervisor assignments</p>
              </div>
              <div className="p-6 text-center">
                <button
                  onClick={() => router.push('/manager/work-centers')}
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <span className="text-2xl">⚙️</span>
                  <div className="text-left">
                    <div className="font-semibold">Manage Work Centers</div>
                    <div className="text-xs text-blue-100">Configure supervisors and settings</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Supervisor Dashboard Tab */}
          {activeTab === 'supervisor-dashboard' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <span>👥</span>
                  <span>Supervisor Attendance Dashboard</span>
                </h2>
                <p className="text-slate-600 mt-1">Monitor daily supervisor attendance and assignments</p>
              </div>
              <div className="p-6 text-center">
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
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-slate-200/40 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-slate-500">
            <p>&copy; 2024 MicroSprings. All rights reserved.</p>
            <p className="mt-1">Precision, Performance, Perfection</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

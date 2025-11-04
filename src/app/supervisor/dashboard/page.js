"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon, PlayIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Components
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import NotificationBell from '@/components/supervisor/NotificationBell';

// API Services
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import { apiRequest } from '@/components/API_Service/api-utils';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

export default function SupervisorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await throttledGet(AUTH_APIS.PROFILE);
      
      if (response.success) {
        const role = response.data.primary_role?.name;
        
        if (role !== 'supervisor') {
          router.push('/supervisor');
          return null;
        }
        
        setUserProfile(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Handle rate limiting errors gracefully
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.warn('Rate limited while fetching profile - will retry');
        return null;
      }
      
      router.push('/supervisor');
      return null;
    }
  }, [router]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await manufacturingAPI.manufacturingOrders.getSupervisorDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.message.includes('403') || error.message.includes('401')) {
        router.push('/supervisor');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Check authentication and load data
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      router.push('/supervisor');
      return;
    }

    const initializeDashboard = async () => {
      const profile = await fetchUserProfile();
      if (profile) {
        await fetchDashboardData();
      }
    };

    initializeDashboard();
  }, [fetchUserProfile, fetchDashboardData, router, refreshTrigger]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.replace('/login');
  };

  const handleMOClick = (moId) => {
    router.push(`/supervisor/mo-detail/${moId}`);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      mo_approved: 'bg-green-100 text-green-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      on_hold: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  if (loading || !dashboardData) {
    return <LoadingSpinner />;
  }

  // Safely extract data with fallbacks
  const summary = dashboardData?.summary || { total_assigned: 0, pending_start: 0, in_progress: 0 };
  const pending_start = dashboardData?.pending_start || [];
  const in_progress = dashboardData?.in_progress || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Supervisor Dashboard</h1>
              {userProfile && (
                <p className="text-xs text-slate-500">{userProfile.full_name}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Links */}
              <button
                onClick={() => router.push('/supervisor/incoming-material-verification')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Material Verification
              </button>
              
              {/* Notification Bell */}
              <NotificationBell onNotificationClick={handleRefresh} />
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Assigned</p>
                <p className="text-3xl font-bold text-slate-800">{summary?.total_assigned || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ClockIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pending Start</p>
                <p className="text-3xl font-bold text-green-600">{summary?.pending_start || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <PlayIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{summary?.in_progress || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <CheckCircleIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Start MOs */}
        {pending_start.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <PlayIcon className="h-5 w-5 mr-2 text-green-600" />
              Pending Start ({pending_start.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pending_start.map((mo) => (
                <div
                  key={mo.id}
                  onClick={() => handleMOClick(mo.id)}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{mo.mo_id}</h3>
                      <p className="text-sm text-slate-600">{mo.product_code?.display_name || 'N/A'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(mo.status)}`}>
                      {mo.status_display}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Quantity:</span>
                      <span className="font-medium text-slate-800">{mo.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Priority:</span>
                      <span className={`font-medium ${getPriorityColor(mo.priority)}`}>
                        {mo.priority_display}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Planned Start:</span>
                      <span className="font-medium text-slate-800">
                        {new Date(mo.planned_start_date).toLocaleString()}
                      </span>
                    </div>
                    {mo.shift && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Shift:</span>
                        <span className="font-medium text-slate-800">{mo.shift_display}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                      <PlayIcon className="h-4 w-4" />
                      <span>Start Production</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In Progress MOs */}
        {in_progress.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
              In Progress ({in_progress.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {in_progress.map((mo) => (
                <div
                  key={mo.id}
                  onClick={() => handleMOClick(mo.id)}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{mo.mo_id}</h3>
                      <p className="text-sm text-slate-600">{mo.product_code?.display_name || 'N/A'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(mo.status)}`}>
                      {mo.status_display}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Quantity:</span>
                      <span className="font-medium text-slate-800">{mo.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Priority:</span>
                      <span className={`font-medium ${getPriorityColor(mo.priority)}`}>
                        {mo.priority_display}
                      </span>
                    </div>
                    {mo.actual_start_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Started:</span>
                        <span className="font-medium text-slate-800">
                          {new Date(mo.actual_start_date).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {mo.shift && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Shift:</span>
                        <span className="font-medium text-slate-800">{mo.shift_display}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pending_start.length === 0 && in_progress.length === 0 && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Manufacturing Orders</h3>
            <p className="text-slate-500">
              You don&apos;t have any manufacturing orders assigned yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}


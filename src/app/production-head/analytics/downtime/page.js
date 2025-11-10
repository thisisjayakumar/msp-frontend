"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClockIcon, ChartBarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

// Components
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import NotificationBell from '@/components/supervisor/NotificationBell';

// API Services
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

export default function DowntimeSummaryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downtimeData, setDowntimeData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    end_date: new Date().toISOString().split('T')[0]
  });

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await throttledGet(AUTH_APIS.PROFILE);
      
      if (response.success) {
        const role = response.data.primary_role?.name;
        
        if (!['production_head', 'manager', 'admin'].includes(role)) {
          router.push('/login');
          return null;
        }
        
        setUserProfile(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      router.push('/login');
      return null;
    }
  }, [router]);

  // Fetch downtime data
  const fetchDowntimeData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await processSupervisorAPI.getDowntimeAnalytics(dateRange.start_date, dateRange.end_date);
      setDowntimeData(data);
    } catch (error) {
      console.error('Error fetching downtime data:', error);
      alert('Failed to load downtime data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Initialize
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      router.push('/login');
      return;
    }

    const init = async () => {
      const profile = await fetchUserProfile();
      if (profile) {
        await fetchDowntimeData();
      }
    };

    init();
  }, [fetchUserProfile, fetchDowntimeData, router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.replace('/login');
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    fetchDowntimeData();
  };

  // Format time duration
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get reason color
  const getReasonColor = (reason) => {
    const colors = {
      machine_breakdown: 'bg-red-100 text-red-700 border-red-300',
      power_cut: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      maintenance: 'bg-blue-100 text-blue-700 border-blue-300',
      material_shortage: 'bg-orange-100 text-orange-700 border-orange-300',
      quality_issue: 'bg-purple-100 text-purple-700 border-purple-300',
      others: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[reason] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalDowntime = downtimeData?.total_downtime_minutes || 0;
  const reasonBreakdown = downtimeData?.reason_breakdown || {};
  const processBreakdown = downtimeData?.process_breakdown || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/production-head/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Process Downtime Summary</h1>
                {userProfile && (
                  <p className="text-xs text-slate-500">{userProfile.full_name} • {userProfile.primary_role?.display_name}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
              
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
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Date Range Filter</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => handleDateChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => handleDateChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleApplyFilter}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-slate-600 mb-2">Total Downtime</h3>
              <p className="text-4xl font-bold text-red-600">{formatDuration(totalDowntime)}</p>
              <p className="text-sm text-slate-500 mt-2">
                From {new Date(dateRange.start_date).toLocaleDateString()} to {new Date(dateRange.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 bg-red-100 rounded-2xl">
              <ClockIcon className="h-16 w-16 text-red-600" />
            </div>
          </div>
        </div>

        {/* Reason Breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
            Downtime by Reason
          </h3>
          
          <div className="space-y-4">
            {Object.keys(reasonBreakdown).length > 0 ? (
              Object.entries(reasonBreakdown).map(([reason, minutes]) => {
                const percentage = totalDowntime > 0 ? ((minutes / totalDowntime) * 100).toFixed(1) : 0;
                
                return (
                  <div key={reason} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getReasonColor(reason)}`}>
                        {reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-800">{formatDuration(minutes)}</span>
                        <span className="text-sm text-slate-500 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-500 py-8">No downtime data available for this period</p>
            )}
          </div>
        </div>

        {/* Process Breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600" />
            Downtime by Process
          </h3>
          
          <div className="space-y-4">
            {Object.keys(processBreakdown).length > 0 ? (
              Object.entries(processBreakdown)
                .sort(([, a], [, b]) => b - a) // Sort by downtime (descending)
                .map(([process, minutes]) => {
                  const percentage = totalDowntime > 0 ? ((minutes / totalDowntime) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={process} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{process}</span>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-800">{formatDuration(minutes)}</span>
                          <span className="text-sm text-slate-500 ml-2">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-center text-slate-500 py-8">No process downtime data available for this period</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowPathIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Components
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import NotificationBell from '@/components/supervisor/NotificationBell';

// API Services
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

export default function FIReworkReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fiReworkData, setFiReworkData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  // Fetch FI rework data
  const fetchFIReworkData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await processSupervisorAPI.getFIReworkReport(dateRange.start_date, dateRange.end_date);
      setFiReworkData(data);
    } catch (error) {
      console.error('Error fetching FI rework data:', error);
      alert('Failed to load FI rework data');
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
        await fetchFIReworkData();
      }
    };

    init();
  }, [fetchUserProfile, fetchFIReworkData, router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.replace('/login');
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    fetchFIReworkData();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalFIRework = fiReworkData?.total_fi_rework_quantity || 0;
  const totalFIReworkBatches = fiReworkData?.total_fi_rework_batches || 0;
  const processList = fiReworkData?.process_list || [];
  const recentReworks = fiReworkData?.recent_reworks || [];

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
                <h1 className="text-xl font-bold text-slate-800">Final Inspection Rework Report</h1>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total FI Rework Quantity</p>
                <p className="text-4xl font-bold text-orange-600">{totalFIRework.toFixed(0)} kg</p>
              </div>
              <div className="p-4 bg-orange-100 rounded-2xl">
                <ArrowPathIcon className="h-12 w-12 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total FI Rework Batches</p>
                <p className="text-4xl font-bold text-purple-600">{totalFIReworkBatches}</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-2xl">
                <ChartBarIcon className="h-12 w-12 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* FI Rework by Process */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600" />
            Rework Count by Process (Root Cause Analysis)
          </h3>
          
          <div className="space-y-4">
            {processList.length > 0 ? (
              processList
                .sort((a, b) => b.rework_count - a.rework_count) // Sort by rework count (descending)
                .map((process, index) => {
                  const percentage = totalFIReworkBatches > 0 
                    ? ((process.rework_count / totalFIReworkBatches) * 100).toFixed(1) 
                    : 0;
                  
                  return (
                    <div key={process.process_name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            index === 0 ? 'bg-red-100 text-red-700' :
                            index === 1 ? 'bg-orange-100 text-orange-700' :
                            index === 2 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            #{index + 1}
                          </span>
                          <span className="text-base font-semibold text-slate-700">{process.process_name}</span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                              Most Common
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-slate-800">{process.rework_count}</span>
                          <span className="text-sm text-slate-500 ml-2">({percentage}%)</span>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm pl-11">
                        <span className="text-slate-600">Total Rework Quantity:</span>
                        <span className="font-medium text-orange-700">{process.total_rework_quantity?.toFixed(0) || 0} kg</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            index === 0 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            index === 1 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                            index === 2 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-gray-500 to-gray-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-center text-slate-500 py-8">No FI rework data available for this period</p>
            )}
          </div>
        </div>

        {/* Recent FI Reworks */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-purple-600" />
            Recent FI Rework Details
          </h3>
          
          <div className="space-y-4">
            {recentReworks.length > 0 ? (
              recentReworks.map((rework) => (
                <div key={rework.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-800">{rework.batch_id}</h4>
                      <p className="text-sm text-slate-600">MO: {rework.mo_id}</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      FI Rework
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-slate-600">Process</p>
                      <p className="text-sm font-semibold text-slate-800">{rework.rework_to_process_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Quantity</p>
                      <p className="text-sm font-semibold text-orange-700">{rework.rework_quantity} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Status</p>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                        rework.status === 'completed' ? 'bg-green-100 text-green-700' :
                        rework.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {rework.status_display || rework.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Date</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(rework.redirected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {rework.defect_description && (
                    <div className="bg-slate-50 rounded p-3 border border-slate-200">
                      <p className="text-xs text-slate-600 mb-1">Defect Description:</p>
                      <p className="text-sm text-slate-800">{rework.defect_description}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">No recent FI reworks available</p>
            )}
          </div>
        </div>

        {/* Quality Alert */}
        {processList.length > 0 && processList[0]?.rework_count > 5 && (
          <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-semibold text-red-800 mb-2">Quality Alert</h4>
                <p className="text-red-700 mb-3">
                  <strong>{processList[0].process_name}</strong> has the highest FI rework count ({processList[0].rework_count} batches). 
                  This indicates potential quality issues in this process that require immediate attention.
                </p>
                <p className="text-sm text-red-600">
                  💡 Recommended Actions:
                </p>
                <ul className="list-disc list-inside text-sm text-red-600 mt-2 space-y-1">
                  <li>Review process parameters and operator training</li>
                  <li>Inspect equipment for maintenance issues</li>
                  <li>Conduct root cause analysis meeting with supervisors</li>
                  <li>Consider implementing additional quality checkpoints</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


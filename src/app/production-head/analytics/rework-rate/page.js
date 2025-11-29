"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon, ChartBarIcon, ArrowLeftIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

// Components
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import NotificationBell from '@/components/supervisor/NotificationBell';

// API Services
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

export default function ReworkRatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reworkData, setReworkData] = useState(null);
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

  // Fetch rework data
  const fetchReworkData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await processSupervisorAPI.getReworkAnalytics(dateRange.start_date, dateRange.end_date);
      setReworkData(data);
    } catch (error) {
      console.error('Error fetching rework data:', error);
      alert('Failed to load rework data');
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
        await fetchReworkData();
      }
    };

    init();
  }, [fetchUserProfile, fetchReworkData, router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.replace('/login');
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    fetchReworkData();
  };

  // Get rework rate color
  const getReworkRateColor = (rate) => {
    if (rate < 5) return 'text-green-600';
    if (rate < 10) return 'text-yellow-600';
    if (rate < 15) return 'text-orange-600';
    return 'text-red-600';
  };

  const getReworkRateBg = (rate) => {
    if (rate < 5) return 'bg-green-100';
    if (rate < 10) return 'bg-yellow-100';
    if (rate < 15) return 'bg-orange-100';
    return 'bg-red-100';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const overallReworkRate = reworkData?.overall_rework_rate || 0;
  const processList = reworkData?.process_list || [];
  const totalProduction = reworkData?.total_production_quantity || 0;
  const totalRework = reworkData?.total_rework_quantity || 0;

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
                <h1 className="text-xl font-bold text-slate-800">Rework Rate by Process</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Overall Rework Rate</p>
                <p className={`text-4xl font-bold ${getReworkRateColor(overallReworkRate)}`}>
                  {overallReworkRate.toFixed(2)}%
                </p>
              </div>
              <div className={`p-4 ${getReworkRateBg(overallReworkRate)} rounded-2xl`}>
                <ArrowPathIcon className={`h-12 w-12 ${getReworkRateColor(overallReworkRate)}`} />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Production</p>
                <p className="text-4xl font-bold text-blue-600">{totalProduction.toFixed(0)} kg</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-2xl">
                <ChartBarIcon className="h-12 w-12 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Rework</p>
                <p className="text-4xl font-bold text-orange-600">{totalRework.toFixed(0)} kg</p>
              </div>
              <div className="p-4 bg-orange-100 rounded-2xl">
                <ArrowPathIcon className="h-12 w-12 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Process-wise Rework Rate */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600" />
            Rework Rate by Process
          </h3>
          
          <div className="space-y-6">
            {processList.length > 0 ? (
              processList
                .sort((a, b) => b.rework_rate - a.rework_rate) // Sort by rework rate (descending)
                .map((process) => {
                  const reworkRate = process.rework_rate || 0;
                  const trend = process.trend || 0; // Positive = increasing, Negative = decreasing
                  
                  return (
                    <div key={process.process_name} className="space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-semibold text-slate-700">{process.process_name}</span>
                          {trend !== 0 && (
                            <span className={`flex items-center text-xs ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {trend > 0 ? <ArrowTrendingUpIcon className="h-4 w-4 mr-1" /> : <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />}
                              {Math.abs(trend).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <span className={`text-2xl font-bold ${getReworkRateColor(reworkRate)}`}>
                          {reworkRate.toFixed(2)}%
                        </span>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Production:</span>
                          <span className="ml-2 font-medium text-slate-800">{process.production_quantity?.toFixed(0) || 0} kg</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Rework:</span>
                          <span className="ml-2 font-medium text-orange-700">{process.rework_quantity?.toFixed(0) || 0} kg</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Rework Cycles:</span>
                          <span className="ml-2 font-medium text-purple-700">{process.total_rework_cycles || 0}</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all duration-300 ${
                            reworkRate < 5 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            reworkRate < 10 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            reworkRate < 15 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                            'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${Math.min(reworkRate, 100)}%` }}
                        ></div>
                      </div>
                      
                      {/* Warning for high rework rate */}
                      {reworkRate > 15 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-700">
                            ⚠️ High rework rate detected. Consider reviewing this process for quality improvements.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <p className="text-center text-slate-500 py-8">No rework data available for this period</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


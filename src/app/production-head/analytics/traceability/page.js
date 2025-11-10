"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Components
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import NotificationBell from '@/components/supervisor/NotificationBell';

// API Services
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

export default function BatchTraceabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [traceabilityData, setTraceabilityData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
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

  // Initialize
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserProfile();
  }, [fetchUserProfile, router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.replace('/login');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a Batch ID or MO ID');
      return;
    }

    try {
      setLoading(true);
      const data = await processSupervisorAPI.getBatchTraceability(
        searchQuery.trim(),
        dateRange.start_date,
        dateRange.end_date
      );
      setTraceabilityData(data);
    } catch (error) {
      console.error('Error fetching traceability:', error);
      alert(`Failed to fetch traceability data: ${error.message}`);
      setTraceabilityData(null);
    } finally {
      setLoading(false);
    }
  };

  // Get event icon
  const getEventIcon = (eventType) => {
    const icons = {
      process_started: CheckCircleIcon,
      process_completed: CheckCircleIcon,
      process_stopped: XCircleIcon,
      process_resumed: CheckCircleIcon,
      rework_created: ArrowPathIcon,
      rework_completed: CheckCircleIcon,
      batch_verified: CheckCircleIcon,
      batch_reported: XCircleIcon,
      fi_redirect: ArrowPathIcon
    };
    return icons[eventType] || ClockIcon;
  };

  // Get event color
  const getEventColor = (eventType) => {
    const colors = {
      process_started: 'bg-blue-100 text-blue-700 border-blue-300',
      process_completed: 'bg-green-100 text-green-700 border-green-300',
      process_stopped: 'bg-red-100 text-red-700 border-red-300',
      process_resumed: 'bg-green-100 text-green-700 border-green-300',
      rework_created: 'bg-orange-100 text-orange-700 border-orange-300',
      rework_completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      batch_verified: 'bg-green-100 text-green-700 border-green-300',
      batch_reported: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      fi_redirect: 'bg-purple-100 text-purple-700 border-purple-300'
    };
    return colors[eventType] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (loading && !traceabilityData) {
    return <LoadingSpinner />;
  }

  const events = traceabilityData?.events || [];
  const batchInfo = traceabilityData?.batch_info || null;

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
                <h1 className="text-xl font-bold text-slate-800">Batch Traceability</h1>
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
        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Search Batch</h3>
          
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Batch ID or MO ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
            
            {/* Date Range (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date (Optional)</label>
                <input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date (Optional)</label>
                <input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-5 w-5" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Info */}
        {batchInfo && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Batch Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-600">Batch ID</p>
                <p className="text-lg font-bold text-slate-800">{batchInfo.batch_id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">MO ID</p>
                <p className="text-lg font-bold text-slate-800">{batchInfo.mo_id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {batchInfo.status_display}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Rework Cycles</p>
                <p className="text-lg font-bold text-orange-600">{batchInfo.total_rework_cycles || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {events.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Event Timeline</h3>
            
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-300"></div>
              
              <div className="space-y-6">
                {events.map((event, index) => {
                  const Icon = getEventIcon(event.event_type);
                  const colorClass = getEventColor(event.event_type);
                  
                  return (
                    <div key={index} className="relative flex items-start space-x-4 pl-2">
                      {/* Icon */}
                      <div className={`relative z-10 p-2 rounded-full border-2 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-slate-800">
                              {event.event_type_display || event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h4>
                            <p className="text-sm text-slate-600">{event.process_name || 'N/A'}</p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(event.event_timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Quantities */}
                        {event.quantity_details && Object.keys(event.quantity_details).length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200">
                            {event.quantity_details.ok_quantity !== undefined && (
                              <div>
                                <p className="text-xs text-slate-600">OK Qty</p>
                                <p className="text-sm font-semibold text-green-700">{event.quantity_details.ok_quantity} kg</p>
                              </div>
                            )}
                            {event.quantity_details.scrap_quantity !== undefined && (
                              <div>
                                <p className="text-xs text-slate-600">Scrap Qty</p>
                                <p className="text-sm font-semibold text-red-700">{event.quantity_details.scrap_quantity} kg</p>
                              </div>
                            )}
                            {event.quantity_details.rework_quantity !== undefined && (
                              <div>
                                <p className="text-xs text-slate-600">Rework Qty</p>
                                <p className="text-sm font-semibold text-orange-700">{event.quantity_details.rework_quantity} kg</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* User and Remarks */}
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between text-sm">
                            {event.user_name && (
                              <span className="text-slate-600">By: <span className="font-medium text-slate-800">{event.user_name}</span></span>
                            )}
                            {event.rework_cycle_tag && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                {event.rework_cycle_tag}
                              </span>
                            )}
                          </div>
                          {event.remarks && (
                            <p className="text-sm text-slate-600 mt-2 italic">{event.remarks}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : traceabilityData ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Events Found</h3>
            <p className="text-slate-500">
              No traceability events found for the specified criteria.
            </p>
          </div>
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Search for a Batch</h3>
            <p className="text-slate-500">
              Enter a Batch ID or MO ID above to view its complete traceability timeline.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}


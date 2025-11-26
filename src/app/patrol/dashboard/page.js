"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import patrolAPI from '@/components/API_Service/patrol-api';
import PatrolUploadCard from '@/components/patrol/PatrolUploadCard';
import PatrolAlertBell from '@/components/patrol/PatrolAlertBell';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';

export default function PatrolDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState([]);
  const [duties, setDuties] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
      
      if (!token || userRole !== 'patrol') {
        router.push('/login');
        return;
      }
      
      const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch active duties
  const fetchDuties = useCallback(async () => {
    try {
      const data = await patrolAPI.duties.getActiveDuties();
      if (!data.error) {
        // Handle both array and paginated response formats
        const dutiesArray = Array.isArray(data) ? data : (data.results || []);
        setDuties(dutiesArray);
      }
    } catch (error) {
      console.error('Error fetching duties:', error);
      setDuties([]);
    }
  }, []);

  // Fetch today's uploads
  const fetchUploads = useCallback(async () => {
    try {
      const filters = { date: selectedDate };
      const data = await patrolAPI.uploads.getAll(filters);
      if (!data.error) {
        // Handle both array and paginated response formats
        const uploadsArray = Array.isArray(data) ? data : (data.results || []);
        setUploads(uploadsArray);
      }
    } catch (error) {
      console.error('Error fetching uploads:', error);
      setUploads([]);
    }
  }, [selectedDate]);

  // Initial fetch
  useEffect(() => {
    if (!loading) {
      fetchDuties();
      fetchUploads();
    }
  }, [loading, fetchDuties, fetchUploads]);

  // Refresh on trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchUploads();
    }
  }, [refreshTrigger, fetchUploads]);

  // Group uploads by process
  const uploadsByProcess = useMemo(() => {
    const grouped = {};
    // Ensure uploads is an array before iterating
    const uploadsArray = Array.isArray(uploads) ? uploads : [];
    uploadsArray.forEach(upload => {
      if (!grouped[upload.process_name]) {
        grouped[upload.process_name] = [];
      }
      grouped[upload.process_name].push(upload);
    });
    return grouped;
  }, [uploads]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.replace('/login');
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
      <header className="bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <span className="mr-3">🛡️</span>
                Patrol Dashboard
              </h1>
              <p className="mt-1 text-emerald-100">
                {user ? `Welcome, ${user.first_name || user.email}` : 'Quality Control Monitoring'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <PatrolAlertBell />
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-xs text-emerald-100">Designation</div>
                <div className="font-semibold text-white">Patrol</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Date Selector & Stats */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <label className="font-medium text-gray-700">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 text-slate-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Upload Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Total Uploads</div>
              <div className="text-2xl font-bold text-blue-700">{Array.isArray(uploads) ? uploads.length : 0}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Submitted</div>
              <div className="text-2xl font-bold text-green-700">
                {Array.isArray(uploads) ? uploads.filter(u => ['submitted', 'reuploaded'].includes(u.status)).length : 0}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-600 font-medium">Pending</div>
              <div className="text-2xl font-bold text-yellow-700">
                {Array.isArray(uploads) ? uploads.filter(u => u.status === 'pending').length : 0}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm text-red-600 font-medium">Missed</div>
              <div className="text-2xl font-bold text-red-700">
                {Array.isArray(uploads) ? uploads.filter(u => u.status === 'missed').length : 0}
              </div>
            </div>
          </div>
        </div>

        {/* Active Duties Info */}
        {Array.isArray(duties) && duties.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-emerald-900 mb-3">Active Duties</h3>
            <div className="space-y-2">
              {duties.map(duty => (
                <div key={duty.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        Processes: {Array.isArray(duty.process_names) ? duty.process_names.join(', ') : (duty.process_names || 'N/A')}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Frequency: Every {duty.frequency_hours} hour(s) | 
                        Shift: {duty.shift_start_time} - {duty.shift_end_time} | 
                        Period: {duty.start_date} to {duty.end_date}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Slots by Process */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">QC Upload Slots</h2>
          
          {Object.keys(uploadsByProcess).length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="text-gray-400 text-5xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Upload Slots</h3>
              <p className="text-gray-600">
                No patrol duties assigned for the selected date.
              </p>
            </div>
          ) : (
            Object.entries(uploadsByProcess).map(([processName, processUploads]) => (
              <div key={processName} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">⚙️</span>
                  {processName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {processUploads
                    .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
                    .map(upload => (
                      <PatrolUploadCard 
                        key={upload.id} 
                        upload={upload} 
                        onUploadSuccess={handleRefresh}
                      />
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}


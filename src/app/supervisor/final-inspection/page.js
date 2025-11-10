"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircleIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Components
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import NotificationBell from '@/components/supervisor/NotificationBell';
import ReworkHandlingModal from '@/components/supervisor/ReworkHandlingModal';
import FIReworkRedirectModal from '@/components/supervisor/FIReworkRedirectModal';

// API Services
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

export default function FinalInspectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [inspectionModal, setInspectionModal] = useState({ isOpen: false, batch: null });
  const [reworkRedirectModal, setReworkRedirectModal] = useState({ isOpen: false, fiCompletion: null, batch: null });
  const [completedBatch, setCompletedBatch] = useState(null);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await throttledGet(AUTH_APIS.PROFILE);
      
      if (response.success) {
        setUserProfile(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      router.push('/supervisor');
      return null;
    }
  }, [router]);

  // Fetch FI batches
  const fetchFIBatches = useCallback(async () => {
    try {
      setLoading(true);
      // This would fetch batches that have reached Final Inspection
      const data = await processSupervisorAPI.getFIBatches();
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching FI batches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      router.push('/supervisor');
      return;
    }

    const init = async () => {
      const profile = await fetchUserProfile();
      if (profile) {
        await fetchFIBatches();
      }
    };

    init();
  }, [fetchUserProfile, fetchFIBatches, router, refreshTrigger]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.replace('/login');
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleInspectionComplete = (batch, completionData) => {
    // After inspection is complete, if there's rework, show redirect modal
    if (completionData.rework_quantity > 0) {
      setCompletedBatch(completionData);
      setReworkRedirectModal({ isOpen: true, fiCompletion: completionData, batch });
    } else {
      handleRefresh();
    }
    setInspectionModal({ isOpen: false, batch: null });
  };

  const handleReworkRedirectComplete = () => {
    setReworkRedirectModal({ isOpen: false, fiCompletion: null, batch: null });
    setCompletedBatch(null);
    handleRefresh();
  };

  // Filter batches
  const filteredBatches = batches.filter(batch =>
    !searchQuery || 
    batch.batch_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.mo_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Final Inspection</h1>
              {userProfile && (
                <p className="text-xs text-slate-500">{userProfile.full_name} • {userProfile.primary_role?.display_name}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/supervisor/dashboard')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Dashboard
              </button>
              
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
                <p className="text-sm text-slate-600 mb-1">Pending Inspection</p>
                <p className="text-3xl font-bold text-blue-600">{filteredBatches.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <CheckCircleIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Passed Today</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Rework Sent</p>
                <p className="text-3xl font-bold text-orange-600">0</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <ArrowPathIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Batch ID or MO ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Batches List */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            Batches for Inspection ({filteredBatches.length})
          </h2>
        </div>

        {filteredBatches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBatches.map((batch) => (
              <div
                key={batch.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">{batch.batch_id}</h3>
                    <p className="text-sm text-slate-600">{batch.product_name || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{batch.mo_id}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {batch.status_display || 'Pending Inspection'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Quantity:</span>
                    <span className="font-medium text-slate-800">{batch.quantity || 0} kg</span>
                  </div>
                  {batch.completed_processes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Processes:</span>
                      <span className="font-medium text-slate-800">{batch.completed_processes}</span>
                    </div>
                  )}
                  {batch.arrived_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Arrived:</span>
                      <span className="font-medium text-slate-800">
                        {new Date(batch.arrived_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setInspectionModal({ isOpen: true, batch })}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Perform Inspection</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Batches for Inspection</h3>
            <p className="text-slate-500">
              All batches have been inspected or none have arrived yet.
            </p>
          </div>
        )}
      </main>

      {/* Inspection Modal (Rework Handling Modal) */}
      {inspectionModal.isOpen && (
        <ReworkHandlingModal
          batch={inspectionModal.batch}
          processExecution={{ process_name: 'Final Inspection', id: inspectionModal.batch?.id }}
          isReworkCompletion={false}
          onClose={() => setInspectionModal({ isOpen: false, batch: null })}
          onSuccess={(completionData) => handleInspectionComplete(inspectionModal.batch, completionData)}
        />
      )}

      {/* FI Rework Redirect Modal */}
      {reworkRedirectModal.isOpen && (
        <FIReworkRedirectModal
          fiCompletionRecord={reworkRedirectModal.fiCompletion}
          batch={reworkRedirectModal.batch}
          onClose={() => setReworkRedirectModal({ isOpen: false, fiCompletion: null, batch: null })}
          onSuccess={handleReworkRedirectComplete}
        />
      )}
    </div>
  );
}


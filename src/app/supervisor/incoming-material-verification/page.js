"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Components
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import IssueReportModal from '@/components/supervisor/IssueReportModal';

// API Services
import { apiRequest } from '@/components/API_Service/api-utils';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

export default function IncomingMaterialVerification() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingMaterials, setPendingMaterials] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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
      router.push('/supervisor');
      return null;
    }
  }, [router]);

  // Fetch pending handover materials
  const fetchPendingMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/inventory/coiling/pending-handover/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.success) {
        setPendingMaterials(response.data || []);
      } else {
        console.error('Failed to fetch pending materials:', response.error);
        setPendingMaterials([]);
      }
    } catch (error) {
      console.error('Error fetching pending materials:', error);
      if (error.message.includes('403') || error.message.includes('401')) {
        router.push('/supervisor');
      }
      setPendingMaterials([]);
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

    const initializePage = async () => {
      const profile = await fetchUserProfile();
      if (profile) {
        await fetchPendingMaterials();
      }
    };

    initializePage();
  }, [fetchUserProfile, fetchPendingMaterials, router, refreshTrigger]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.replace('/login');
  };

  const handleVerify = async (material) => {
    try {
      setActionLoading(true);
      const response = await apiRequest('/api/inventory/coiling/verify/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heat_number_id: material.id
        }),
      });

      if (response.success) {
        // Refresh the list
        setRefreshTrigger(prev => prev + 1);
        alert(`Handover verified successfully for heat number ${material.heat_number}`);
      } else {
        alert(`Failed to verify handover: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error verifying handover:', error);
      alert('Failed to verify handover. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportIssue = (material) => {
    setSelectedMaterial(material);
    setShowIssueModal(true);
  };

  const handleIssueReported = () => {
    setShowIssueModal(false);
    setSelectedMaterial(null);
    // Refresh the list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending_handover: 'bg-yellow-100 text-yellow-700',
      verified: 'bg-green-100 text-green-700',
      issue_reported: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/supervisor/dashboard')}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Incoming Material Verification</h1>
                {userProfile && (
                  <p className="text-xs text-slate-500">{userProfile.full_name}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Refresh
              </button>
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
        {/* Summary Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Pending Verification</h2>
              <p className="text-sm text-slate-600">
                Materials awaiting handover verification to Coiling department
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <span className="text-3xl font-bold text-yellow-600">{pendingMaterials.length}</span>
            </div>
          </div>
        </div>

        {/* Materials List */}
        {pendingMaterials.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{material.heat_number}</h3>
                    <p className="text-sm text-slate-600">
                      GRM: {material.grm_number}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(material.handover_status)}`}>
                    {material.handover_status_display}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Material:</span>
                    <span className="font-medium text-slate-800">
                      {material.raw_material_details?.material_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Grade:</span>
                    <span className="font-medium text-slate-800">
                      {material.raw_material_details?.grade || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Expected Weight:</span>
                    <span className="font-medium text-slate-800">
                      {material.total_weight_kg ? `${material.total_weight_kg} kg` : 'N/A'}
                    </span>
                  </div>
                  {material.coils_received > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Coils:</span>
                      <span className="font-medium text-slate-800">
                        {material.coils_received}
                      </span>
                    </div>
                  )}
                  {material.sheets_received > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Sheets:</span>
                      <span className="font-medium text-slate-800">
                        {material.sheets_received}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Received:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(material.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleVerify(material)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Verify</span>
                  </button>
                  <button
                    onClick={() => handleReportIssue(material)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>Report Issue</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Materials Pending Verification</h3>
            <p className="text-slate-500">
              All materials have been verified or there are no materials awaiting handover.
            </p>
          </div>
        )}
      </main>

      {/* Issue Report Modal */}
      {showIssueModal && selectedMaterial && (
        <IssueReportModal
          material={selectedMaterial}
          onClose={() => setShowIssueModal(false)}
          onIssueReported={handleIssueReported}
        />
      )}
    </div>
  );
}

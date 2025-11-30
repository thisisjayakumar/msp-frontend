"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BellIcon, 
  PlayIcon, 
  ClockIcon, 
  CheckCircleIcon,
  PauseCircleIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Components
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import NotificationBell from '@/components/supervisor/NotificationBell';
import ProcessStopModal from '@/components/supervisor/ProcessStopModal';
import ProcessResumeModal from '@/components/supervisor/ProcessResumeModal';
import ReworkHandlingModal from '@/components/supervisor/ReworkHandlingModal';
import BatchReceiptVerifyModal from '@/components/supervisor/BatchReceiptVerifyModal';

// API Services
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';
import { apiRequest } from '@/components/API_Service/api-utils';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

export default function SupervisorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Tab state - Default to 'in_progress' since 'to_process' is removed
  const [activeTab, setActiveTab] = useState('in_progress');
  
  // Modal states
  const [stopModal, setStopModal] = useState({ isOpen: false, batch: null, execution: null });
  const [resumeModal, setResumeModal] = useState({ isOpen: false, processStop: null, batch: null });
  const [reworkModal, setReworkModal] = useState({ isOpen: false, batch: null, execution: null, isReworkCompletion: false, reworkBatch: null });
  const [verifyModal, setVerifyModal] = useState({ isOpen: false, batch: null, execution: null, expectedQuantity: 0 });
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

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
      
      // Fetch additional data for new tabs
      const [reworkBatches, stoppedProcesses, onHoldBatches] = await Promise.all([
        processSupervisorAPI.getReworkBatches().catch(() => []),
        processSupervisorAPI.getStoppedProcesses().catch(() => []),
        processSupervisorAPI.getOnHoldBatches().catch(() => [])
      ]);
      
      setDashboardData({
        ...data,
        rework_pending: reworkBatches,
        stopped: stoppedProcesses,
        on_hold: onHoldBatches,
        completed: data.completed || []
      });
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

  const handleLogout = async () => {
    try {
      // Import roleAuthService dynamically
      const { default: roleAuthService } = await import('@/components/API_Service/role-auth');
      
      // Call logout with reassignment
      const result = await roleAuthService.logout();
      
      // Show notification about reassignments if any
      if (result.reassignment_summary && result.reassignment_summary.length > 0) {
        const reassignedCount = result.reassignment_summary.filter(
          r => r.status === 'reassigned_to_backup'
        ).length;
        const unassignedCount = result.reassignment_summary.filter(
          r => r.status !== 'reassigned_to_backup'
        ).length;
        
        let message = 'Logged out successfully.\n';
        if (reassignedCount > 0) {
          message += `✓ ${reassignedCount} process(es) reassigned to backup supervisor.\n`;
        }
        if (unassignedCount > 0) {
          message += `⚠ ${unassignedCount} process(es) left unassigned (no backup available).`;
        }
        
        alert(message);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage anyway
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
    } finally {
      router.replace('/login');
    }
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
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      stopped: 'bg-red-100 text-red-700',
      completed: 'bg-emerald-100 text-emerald-700',
      on_hold: 'bg-orange-100 text-orange-700'
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

  // Get rework badge color
  const getReworkBadgeColor = (cycle) => {
    if (cycle === 1) return 'bg-orange-100 text-orange-700 border-orange-300';
    if (cycle === 2) return 'bg-red-100 text-red-700 border-red-300';
    return 'bg-purple-100 text-purple-700 border-purple-300';
  };

  // Handle MO stop action
  const handleStopMO = async (moId) => {
    if (!window.confirm(`Are you sure you want to stop MO ${moId}?`)) {
      return;
    }

    try {
      // Find the first active process execution for this MO to stop
      const mo = dashboardData.in_progress?.find(m => m.id === moId || m.mo_id === moId);
      if (!mo) {
        alert('MO not found');
        return;
      }

      // Get the first in-progress process execution
      const processExecution = mo.process_executions?.find(pe => pe.status === 'in_progress');
      if (!processExecution) {
        alert('No active process found to stop');
        return;
      }

      setStopModal({ isOpen: true, batch: null, execution: processExecution, moId: moId });
    } catch (error) {
      console.error('Error stopping MO:', error);
      alert('Failed to stop MO: ' + error.message);
    }
  };

  // Get current tab data - Now filtering MOs instead of batches
  const currentTabData = useMemo(() => {
    if (!dashboardData) return [];
    
    let data = [];
    switch (activeTab) {
      case 'in_progress':
        data = dashboardData.in_progress || [];
        break;
      case 'stopped':
        data = dashboardData.stopped || [];
        break;
      case 'rework_pending':
        data = dashboardData.rework_pending || [];
        break;
      case 'on_hold':
        data = dashboardData.on_hold || [];
        break;
      case 'completed':
        data = dashboardData.completed || [];
        break;
      default:
        data = [];
    }
    
    // Filter MOs by search query and date
    return data.filter(mo => {
      const matchesSearch = !searchQuery || 
        mo.mo_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mo.product_code_display?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDate = !filterDate || 
        (mo.created_at && new Date(mo.created_at).toISOString().split('T')[0] === filterDate);
      
      return matchesSearch && matchesDate;
    });
  }, [activeTab, dashboardData, searchQuery, filterDate]);

  // Tab configuration - Removed 'to_process' tab as requested
  const tabs = [
    { id: 'in_progress', label: 'In Progress', icon: CheckCircleIcon, color: 'blue' },
    { id: 'stopped', label: 'Stopped', icon: PauseCircleIcon, color: 'red' },
    { id: 'rework_pending', label: 'Rework Pending', icon: ArrowPathIcon, color: 'orange' },
    { id: 'on_hold', label: 'On Hold', icon: ExclamationCircleIcon, color: 'yellow' },
    { id: 'completed', label: 'Completed', icon: CheckCircleIcon, color: 'emerald' }
  ];

  // Get tab count
  const getTabCount = (tabId) => {
    if (!dashboardData) return 0;
    
    switch (tabId) {
      case 'in_progress':
        return dashboardData.in_progress?.length || 0;
      case 'stopped':
        return dashboardData.stopped?.length || 0;
      case 'rework_pending':
        return dashboardData.rework_pending?.length || 0;
      case 'on_hold':
        return dashboardData.on_hold?.length || 0;
      case 'completed':
        return dashboardData.completed?.length || 0;
      default:
        return 0;
    }
  };

  // Render MO card - Updated to show MOs instead of batches
  const renderMOCard = (mo) => {
    const isReworkBatch = activeTab === 'rework_pending';
    
    return (
      <div
        key={mo.id || mo.mo_id}
        onClick={() => activeTab !== 'in_progress' && handleMOClick(mo.id || mo.mo_id)}
        className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 hover:shadow-xl transition-all ${
          activeTab !== 'in_progress' ? 'cursor-pointer' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-bold text-slate-800">{mo.mo_id}</h3>
              {isReworkBatch && mo.rework_cycle && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getReworkBadgeColor(mo.rework_cycle)}`}>
                  R{mo.rework_cycle}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">{mo.product_code_display || mo.product_code_value || 'N/A'}</p>
            <p className="text-xs text-slate-500">{mo.material_name || 'N/A'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(mo.status)}`}>
            {mo.status_display || mo.status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Quantity:</span>
            <span className="font-medium text-slate-800">
              {mo.quantity?.toLocaleString() || 0}
            </span>
          </div>
          {mo.overall_progress !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Progress:</span>
              <span className="font-medium text-slate-800">{mo.overall_progress}%</span>
            </div>
          )}
          {mo.created_at && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Created:</span>
              <span className="font-medium text-slate-800">
                {new Date(mo.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
          {activeTab === 'in_progress' && (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopMO(mo.id || mo.mo_id);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                <PauseCircleIcon className="h-4 w-4" />
                <span>Stop MO</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMOClick(mo.id || mo.mo_id);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>View Details</span>
              </button>
            </div>
          )}
          
          {activeTab === 'stopped' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle resume - you may need to implement this
                handleMOClick(mo.id || mo.mo_id);
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <PlayIcon className="h-4 w-4" />
              <span>View Details</span>
            </button>
          )}
          
          {activeTab === 'rework_pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMOClick(mo.id || mo.mo_id);
              }}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>View Details</span>
            </button>
          )}
          
          {activeTab === 'on_hold' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMOClick(mo.id || mo.mo_id);
              }}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              View Details
            </button>
          )}
          
          {activeTab === 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMOClick(mo.id || mo.mo_id);
              }}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading || !dashboardData) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Supervisor Dashboard</h1>
              {userProfile && (
                <p className="text-xs text-slate-500">{userProfile.full_name} • {userProfile.primary_role?.display_name}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/supervisor/incoming-material-verification')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Material Verification
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = getTabCount(tab.id);
            
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border-2 p-4 cursor-pointer transition-all hover:scale-105 ${
                  activeTab === tab.id ? `border-${tab.color}-500` : 'border-slate-200/60'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-2 bg-${tab.color}-100 rounded-lg mb-2`}>
                    <Icon className={`h-6 w-6 text-${tab.color}-600`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 mb-1">{count}</p>
                  <p className="text-xs text-slate-600">{tab.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by MO ID or Product Code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-slate-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {(searchQuery || filterDate) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDate('');
                  }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            {tabs.find(t => t.id === activeTab)?.label} ({currentTabData.length})
          </h2>
        </div>

        {currentTabData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentTabData.map(mo => renderMOCard(mo))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Manufacturing Orders</h3>
            <p className="text-slate-500">
              No MOs found in "{tabs.find(t => t.id === activeTab)?.label}".
            </p>
          </div>
        )}
      </main>

      {/* Modals */}
      {stopModal.isOpen && (
        <ProcessStopModal
          batch={stopModal.batch}
          processExecution={stopModal.execution}
          moId={stopModal.moId}
          onClose={() => setStopModal({ isOpen: false, batch: null, execution: null, moId: null })}
          onSuccess={handleRefresh}
        />
      )}

      {resumeModal.isOpen && (
        <ProcessResumeModal
          processStop={resumeModal.processStop}
          batch={resumeModal.batch}
          onClose={() => setResumeModal({ isOpen: false, processStop: null, batch: null })}
          onSuccess={handleRefresh}
        />
      )}

      {reworkModal.isOpen && (
        <ReworkHandlingModal
          batch={reworkModal.batch}
          processExecution={reworkModal.execution}
          isReworkCompletion={reworkModal.isReworkCompletion}
          reworkBatch={reworkModal.reworkBatch}
          onClose={() => setReworkModal({ isOpen: false, batch: null, execution: null, isReworkCompletion: false, reworkBatch: null })}
          onSuccess={handleRefresh}
        />
      )}

      {verifyModal.isOpen && (
        <BatchReceiptVerifyModal
          batch={verifyModal.batch}
          processExecution={verifyModal.execution}
          expectedQuantity={verifyModal.expectedQuantity}
          onClose={() => setVerifyModal({ isOpen: false, batch: null, execution: null, expectedQuantity: 0 })}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}

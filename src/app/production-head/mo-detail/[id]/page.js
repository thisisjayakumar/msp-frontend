"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, PlayIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

// Components
import ProcessFlowVisualization from '@/components/process/ProcessFlowVisualization';
import BatchProcessFlowVisualization from '@/components/process/BatchProcessFlowVisualization';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import SupervisorAssignmentModal from '@/components/supervisor/SupervisorAssignmentModal';

// API Services
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import processTrackingAPI from '@/components/API_Service/process-tracking-api';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';
import { toast } from '@/utils/notifications';

export default function MODetailPage() {
  const router = useRouter();
  const params = useParams();
  const moId = params.id;

  const [mo, setMO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processesInitialized, setProcessesInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [alerts, setAlerts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [selectedProcessExecution, setSelectedProcessExecution] = useState(null);
  const [rmAllocationData, setRmAllocationData] = useState(null);
  const [rmAllocationLoading, setRmAllocationLoading] = useState(false);
  const [batchData, setBatchData] = useState({ batches: [], summary: null });

  // Fetch user profile to get role (THROTTLED)
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await throttledGet(AUTH_APIS.PROFILE);
      
      if (response.success) {
        const role = response.data.primary_role?.name;
        
        if (role) {
          console.log('Fetched user role from profile:', role);
          localStorage.setItem('userRole', role);
          setUserRole(role);
        }
        
        return role;
      } else {
        console.error('Profile API error:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Handle rate limiting errors gracefully
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.warn('Rate limited while fetching profile - will retry');
        return null;
      }
      
      return null;
    }
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    let role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/production-head');
      return;
    }
    
    // If role is not available, fetch it from profile
    if (!role) {
      fetchUserProfile().then((fetchedRole) => {
        if (!['manager', 'production_head'].includes(fetchedRole)) {
          router.push('/production-head');
        }
      });
    } else if (!['manager', 'production_head'].includes(role)) {
      router.push('/production-head');
      return;
    } else {
      console.log('Using stored user role:', role);
      setUserRole(role);
    }
  }, [router, fetchUserProfile]);

  // Fetch supervisors list - using ref to prevent duplicate calls
  const hasFetchedSupervisors = useRef(false);
  const fetchSupervisors = useCallback(async () => {
    if (hasFetchedSupervisors.current) {
      return;
    }
    hasFetchedSupervisors.current = true;
    
    try {
      const supervisors = await manufacturingAPI.manufacturingOrders.getSupervisors();
      setSupervisorsList(supervisors);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      hasFetchedSupervisors.current = false; // Reset on error to allow retry
    }
  }, []);


  // Fetch RM allocation data
  const fetchRmAllocationData = useCallback(async () => {
    if (!moId) return;
    
    try {
      setRmAllocationLoading(true);
      const response = await manufacturingAPI.rawMaterialAllocations.getByMO(moId);
      
      // handleResponse already returns unwrapped data
      if (response && !response.error) {
        setRmAllocationData(response);
      } else if (response && response.error) {
        console.error('Error fetching RM allocation data:', response.message);
      }
    } catch (error) {
      console.error('Error fetching RM allocation data:', error);
    } finally {
      setRmAllocationLoading(false);
    }
  }, [moId]);

  // Fetch batch data
  const fetchBatchInfo = useCallback(async () => {
    try {
      const batchResponse = await manufacturingAPI.batches.getByMO(moId);
      
      setBatchData({ 
        batches: batchResponse.batches || [], 
        summary: batchResponse.summary || null 
      });
    } catch (error) {
      console.error('Error fetching batch info:', error);
    }
  }, [moId]);

  // Fetch MO data with process tracking
  const fetchMOData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch both MO details and process tracking data
      const [moData, processData] = await Promise.all([
        manufacturingAPI.manufacturingOrders.getById(moId),
        processTrackingAPI.getMOWithProcesses(moId)
      ]);
      
      // Merge the data, prioritizing MO details for basic fields
      const mergedData = {
        ...processData,
        ...moData,
        // Keep process-specific data from process tracking
        process_executions: processData.process_executions || [],
        alerts: processData.alerts || []
      };
      
      console.log('MO Data fetched:', {
        moId,
        rm_required_kg: mergedData.rm_required_kg,
        quantity: mergedData.quantity,
        product_code: mergedData.product_code
      });
      
      setMO(mergedData);
      setProcessesInitialized(mergedData.process_executions && mergedData.process_executions.length > 0);
      
      // Set edit data
      // NOTE: assigned_supervisor removed - supervisor tracking moved to work center level
      setEditData({
        shift: mergedData.shift || ''
      });
      
      // Fetch alerts
      const alertsData = await processTrackingAPI.getActiveAlerts(moId);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching MO data:', error);
      if (error.message.includes('404')) {
        router.replace('/production-head/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [moId, router]);

  // Initialize data - only run once on mount
  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      if (!mounted) return;
      
      await Promise.all([
        fetchMOData(), 
        fetchSupervisors(), 
        fetchRmAllocationData(), 
        fetchBatchInfo()
      ]);
    };

    initializeData();

    // Cleanup on unmount
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Initialize processes for the MO - Changes status from mo_approved to in_progress
  const handleInitializeProcesses = async () => {
    const confirmStart = window.confirm(
      `Are you sure you want to start production for MO ${mo.mo_id}? This will change the status to in_progress.`
    );

    if (!confirmStart) return;

    try {
      setLoading(true);
      // Use startProduction API which changes status from mo_approved to in_progress without checking RM availability
      const response = await manufacturingAPI.manufacturingOrders.startProduction(moId, {
        notes: 'Production started by production head'
      });
      
      // Check if response has error
      if (response && response.error) {
        toast.error('Failed to start production: ' + response.message);
        return;
      }
      
      // Response is already unwrapped by handleResponse, so it contains { message, mo }
      if (response && response.mo) {
        setMO(response.mo);
        toast.success('Production started successfully!');
        // Now initialize the processes
        await processTrackingAPI.initializeMOProcesses(moId);
        await fetchMOData();
      } else {
        toast.error('Failed to start production: Unexpected response format');
      }
    } catch (error) {
      console.error('Error initializing processes:', error);
      toast.error('Failed to initialize processes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle process click
  const handleProcessClick = (execution) => {
    console.log('Process clicked:', execution);
    // You can add process-specific actions here
  };

  // Handle step click
  const handleStepClick = (stepExecution) => {
    console.log('Step clicked:', stepExecution);
    // You can add step-specific actions here
  };

  // Handle edit MO details
  const handleEditMO = () => {
    setIsEditing(true);
    setEditData({
      quantity: mo.quantity,
      shift: mo.shift || ''
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    // NOTE: assigned_supervisor removed - supervisor tracking moved to work center level
    setEditData({
      quantity: mo.quantity,
      shift: mo.shift || ''
    });
  };

  // Handle save MO details
  const handleSaveMO = async () => {
    try {
      setLoading(true);
      console.log('Saving MO with data:', editData);
      const response = await manufacturingAPI.manufacturingOrders.updateMODetails(moId, editData);
      console.log('MO update response:', response);
      
      // Response is already unwrapped by handleResponse, so it contains { message, mo }
      if (response && response.mo) {
        setMO(response.mo);
        setIsEditing(false);
        toast.success('MO details updated successfully!');
      } else if (response && response.error) {
        toast.error(`Failed to update MO: ${response.message || response.error}`);
      } else {
        console.error('Unexpected response format:', response);
        toast.error('Failed to update MO details: Unexpected response format');
      }
    } catch (error) {
      console.error('Error updating MO:', error);
      toast.error('Failed to update MO details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle approve MO (Manager/Production Head - starts production)
  const handleApproveMO = async () => {
    // NOTE: Supervisor validation removed - supervisors are now assigned per work center automatically
    
    const confirmApproval = window.confirm(
      `Are you sure you want to approve MO ${mo.mo_id} and start production? This will consume raw materials and route to work centers.`
    );

    if (!confirmApproval) return;

    try {
      setLoading(true);
      const response = await manufacturingAPI.manufacturingOrders.approveMO(moId, {
        notes: 'MO approved by production head - Production started'
      });
      
      // Response is already unwrapped by handleResponse, so it contains { message, mo }
      if (response && response.mo) {
        setMO(response.mo);
        alert('MO approved successfully! Production has started and routed to work centers.');
      } else {
        alert('Failed to approve MO: Unexpected response format');
      }
    } catch (error) {
      console.error('Error approving MO:', error);
      alert('Failed to approve MO: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle reject MO (Manager/Production Head)
  const handleRejectMO = async () => {
    const rejectionReason = window.prompt(
      `Please provide a reason for rejecting MO ${mo.mo_id}:`,
      'MO rejected by manager'
    );

    if (!rejectionReason) return;

    const confirmRejection = window.confirm(
      `Are you sure you want to reject MO ${mo.mo_id}? This action cannot be undone.`
    );

    if (!confirmRejection) return;

    try {
      setLoading(true);
      const response = await manufacturingAPI.manufacturingOrders.rejectMO(moId, {
        notes: rejectionReason
      });
      
      // Response is already unwrapped by handleResponse, so it contains { message, mo }
      if (response && response.mo) {
        setMO(response.mo);
        toast.success('MO rejected successfully!');
      } else if (response && response.error) {
        toast.error(`Failed to reject MO: ${response.message || response.error}`);
      } else {
        console.error('Unexpected response format:', response);
        toast.error('Failed to reject MO: Unexpected response format');
      }
    } catch (error) {
      console.error('Error rejecting MO:', error);
      toast.error('Failed to reject MO: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle opening supervisor assignment modal
  const handleOpenSupervisorModal = (processExecution) => {
    setSelectedProcessExecution(processExecution);
    setShowSupervisorModal(true);
  };

  // Handle supervisor assignment success
  const handleSupervisorAssignmentSuccess = async () => {
    // Refresh the process tracking data to get updated supervisor information
    try {
      toast.success('Supervisor assigned successfully!');
      // Refresh the MO data with process tracking to get updated supervisor names
      await fetchMOData();
    } catch (error) {
      console.error('Error refreshing MO data after supervisor assignment:', error);
      toast.error('Supervisor assigned but failed to refresh data. Please refresh the page.');
    }
  };

  // Handle input changes for edit form
  const handleEditInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      gm_approved: 'bg-green-100 text-green-700',
      rm_allocated: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-orange-100 text-orange-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
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

  if (loading && !mo) {
    return <LoadingSpinner />;
  }

  if (!mo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Manufacturing Order Not Found</h2>
          <button
            onClick={() => router.replace('/production-head/dashboard')}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'processes', label: 'Process Flow', icon: '🏭' },
    { id: 'batch-flow', label: 'Batch Flow', icon: '📦' },
    { id: 'assignments', label: 'Supervisor Assignments', icon: '👥' },
    { id: 'alerts', label: 'Alerts', icon: '🚨', count: alerts.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.replace('/production-head/dashboard')}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{mo.mo_id}</h1>
                <p className="text-xs text-slate-500">Manufacturing Order Details</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mo.status)}`}>
                {mo.status_display}
              </span>
              {mo.priority && (
                <span className={`text-sm font-medium ${getPriorityColor(mo.priority)}`}>
                  {mo.priority_display}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-slate-200/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-3 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/80'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* MO Summary Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Panel: Order Information + Timeline */}
                <div className="space-y-6">
                  {/* Order Information */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">Order Information</h3>
                      {(userRole === 'production_head' && mo.status === 'on_hold') && !isEditing && (
                        <button
                          onClick={handleEditMO}
                          className="px-3 py-1 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          Edit Details
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Product Code:</span>
                        <span className="font-medium text-slate-800">{mo.product_code_value || mo.product_code_display || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Quantity:</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData.quantity || mo.quantity}
                            onChange={(e) => handleEditInputChange('quantity', parseInt(e.target.value) || 0)}
                            className="px-2 py-1 text-slate-800 border border-slate-300 rounded text-sm w-24 text-right"
                            min="1"
                          />
                        ) : (
                          <span className="font-medium text-slate-800">{mo.quantity.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Material:</span>
                        <span className="font-medium text-slate-800">{mo.material_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Grade:</span>
                        <span className="font-medium text-slate-800">{mo.grade}</span>
                      </div>
                      {/* NOTE: Supervisor field removed - supervisor tracking moved to work center level */}
                      {/* Supervisors are now automatically assigned per work center based on daily attendance */}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Shift:</span>
                        {isEditing ? (
                          <select
                            value={editData.shift}
                            onChange={(e) => handleEditInputChange('shift', e.target.value)}
                            className="px-2 py-1 text-slate-800 border border-slate-300 rounded text-sm"
                          >
                            <option value="">Select Shift</option>
                            <option value="I">I (9AM-5PM)</option>
                            <option value="II">II (5PM-2AM)</option>
                            <option value="III">III (2AM-9AM)</option>
                          </select>
                        ) : (
                          <span className="font-medium text-slate-800">{mo.shift_display || 'Not Assigned'}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Edit Controls */}
                    {isEditing && (
                      <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-slate-200">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveMO}
                          disabled={loading}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Created:</span>
                        <span className="font-medium text-slate-800">
                          {new Date(mo.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Planned Start:</span>
                        <span className="font-medium text-slate-800">
                          {new Date(mo.planned_start_date).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Planned End:</span>
                        <span className="font-medium text-slate-800">
                          {new Date(mo.planned_end_date).toLocaleString()}
                        </span>
                      </div>
                      {mo.actual_start_date && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Actual Start:</span>
                          <span className="font-medium text-slate-800">
                            {new Date(mo.actual_start_date).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {mo.actual_end_date && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Actual End:</span>
                          <span className="font-medium text-slate-800">
                            {new Date(mo.actual_end_date).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {mo.delivery_date && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Delivery Date:</span>
                          <span className="font-medium text-slate-800">
                            {new Date(mo.delivery_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Raw Material Allocation */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Raw Material Allocation</h3>
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    {rmAllocationLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                        <span className="ml-3 text-slate-600">Loading RM allocation data...</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* RM Requirements Summary */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="text-xs text-slate-600 mb-1">RM Required</div>
                            <div className="text-lg font-bold text-slate-800">
                              {mo.rm_required_kg ? `${parseFloat(mo.rm_required_kg).toFixed(2)} kg` : 'N/A'}
                            </div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-xs text-blue-600 mb-1">Reserved</div>
                            <div className="text-lg font-bold text-blue-800">
                              {rmAllocationData?.summary?.total_reserved_kg ? `${parseFloat(rmAllocationData.summary.total_reserved_kg).toFixed(2)} kg` : '0 kg'}
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-xs text-green-600 mb-1">Locked</div>
                            <div className="text-lg font-bold text-green-800">
                              {rmAllocationData?.summary?.total_locked_kg ? `${parseFloat(rmAllocationData.summary.total_locked_kg).toFixed(2)} kg` : '0 kg'}
                            </div>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3">
                            <div className="text-xs text-amber-600 mb-1">Tolerance</div>
                            <div className="text-lg font-bold text-amber-800">
                              {mo.tolerance_percentage ? `${mo.tolerance_percentage}%` : '2.00%'}
                            </div>
                          </div>
                        </div>

                        {/* Material Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Material Specifications</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Material Type:</span>
                                <span className="font-medium text-slate-800">{mo.material_type || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Grade:</span>
                                <span className="font-medium text-slate-800">{mo.grade || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Finishing:</span>
                                <span className="font-medium text-slate-800">{mo.finishing || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Manufacturer:</span>
                                <span className="font-medium text-slate-800">{mo.manufacturer_brand || 'N/A'}</span>
                              </div>
                              {mo.wire_diameter_mm && (
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Wire Diameter:</span>
                                  <span className="font-medium text-slate-800">{mo.wire_diameter_mm} mm</span>
                                </div>
                              )}
                              {mo.thickness_mm && (
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Thickness:</span>
                                  <span className="font-medium text-slate-800">{mo.thickness_mm} mm</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Allocation Status</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  rmAllocationData?.summary?.is_fully_allocated 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {rmAllocationData?.summary?.is_fully_allocated ? 'Fully Allocated' : 'Partially Allocated'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">RM Released:</span>
                                <span className="font-medium text-slate-800">
                                  {mo.rm_released_kg ? `${parseFloat(mo.rm_released_kg).toFixed(2)} kg` : 'Not Released'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Scrap Weight:</span>
                                <span className="font-medium text-slate-800">
                                  {mo.scrap_rm_weight ? `${mo.scrap_rm_weight} g` : '0 g'}
                                </span>
                              </div>
                              {mo.scrap_percentage && (
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Expected Scrap:</span>
                                  <span className="font-medium text-slate-800">{mo.scrap_percentage}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Allocation Details Table */}
                        {rmAllocationData?.allocations && rmAllocationData.allocations.length > 0 ? (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Allocation Details</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Material</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Allocated At</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Allocated By</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                  {rmAllocationData.allocations.map((allocation, index) => (
                                    <tr key={index}>
                                      <td className="px-4 py-3 text-sm text-slate-800">
                                        {allocation.raw_material_name || 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-800">
                                        {parseFloat(allocation.allocated_quantity_kg).toFixed(2)} kg
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          allocation.status === 'locked' ? 'bg-green-100 text-green-800' :
                                          allocation.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                                          allocation.status === 'swapped' ? 'bg-purple-100 text-purple-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {allocation.status_display || allocation.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-600">
                                        {allocation.allocated_at ? new Date(allocation.allocated_at).toLocaleDateString() : 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-600">
                                        {allocation.allocated_by_name || 'System'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-slate-50 rounded-lg">
                            <div className="text-slate-400 text-xl mb-1">📊</div>
                            <h4 className="text-sm font-medium text-slate-600 mb-1">Allocation Details</h4>
                            <p className="text-xs text-slate-500">RM allocation details are not available. This may be because the MO hasn&apos;t been allocated yet or the allocation API is not accessible.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Summary */}
              {processesInitialized && (
                <div className="mt-8 pt-6 border-t border-slate-200/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Production Progress</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">Overall:</span>
                      <span className="text-lg font-bold text-slate-800">{mo.overall_progress}%</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-1000"
                      style={{ width: `${mo.overall_progress}%` }}
                    />
                  </div>
                  
                  {mo.active_process && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <PlayIcon className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800">Currently Active Process</span>
                      </div>
                      <div className="text-sm text-amber-700">
                        {mo.active_process.process_name} - {mo.active_process.progress_percentage}%
                        {mo.active_process.assigned_operator && (
                          <span className="ml-2">({mo.active_process.assigned_operator})</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Special Instructions */}
              {mo.special_instructions && (
                <div className="mt-6 pt-6 border-t border-slate-200/60">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Special Instructions</h3>
                  <p className="text-slate-700 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    {mo.special_instructions}
                  </p>
                </div>
              )}
            </div>


            {/* Manager Actions - RM Allocated Status */}
            {['manager', 'production_head'].includes(userRole) && mo.status === 'rm_allocated' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 text-center">
                <div className="mb-4">
                  <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-800">Ready for Production</h3>
                  <p className="text-slate-600">
                    Raw materials have been allocated. Approve to start production and route to work centers.
                  </p>
                </div>
                <button
                  onClick={handleApproveMO}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Starting Production...' : 'Start Production'}
                </button>
              </div>
            )}

            {/* MO Rejected Status */}
            {mo.status === 'rejected' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-red-200/60 p-6 text-center">
                <div className="mb-4">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-800">MO Rejected</h3>
                  <p className="text-slate-600">
                    This Manufacturing Order has been rejected and cannot proceed with production.
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-red-800 mb-2">Rejection Details:</h4>
                  <p className="text-red-700 text-sm">
                    {mo.rejection_notes || 'No rejection reason provided.'}
                  </p>
                  {mo.rejected_at && (
                    <p className="text-red-600 text-xs mt-2">
                      Rejected on: {new Date(mo.rejected_at).toLocaleString()}
                    </p>
                  )}
                  {mo.rejected_by_name && (
                    <p className="text-red-600 text-xs">
                      Rejected by: {mo.rejected_by_name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Initialize Processes Button - Production Head Only */}
            {userRole === 'production_head' && !processesInitialized && mo.status === 'mo_approved' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 text-center">
                <div className="mb-4">
                  <ClockIcon className="h-12 w-12 text-amber-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-800">Start Production</h3>
                  <p className="text-slate-600">Start production for this MO and initialize process tracking.</p>
                </div>
                <button
                  onClick={handleInitializeProcesses}
                  disabled={loading}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Starting...' : 'Start Production'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Processes Tab */}
        {activeTab === 'processes' && (
          <div>
            {processesInitialized ? (
              <ProcessFlowVisualization
                processExecutions={mo.process_executions}
                onProcessClick={handleProcessClick}
                onStepClick={handleStepClick}
                showSteps={true}
                compact={false}
              />
            ) : (
              <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl">
                <div className="text-6xl mb-4">🏭</div>
                <h3 className="text-xl font-medium text-slate-600 mb-2">Processes Not Initialized</h3>
                <p className="text-slate-500 mb-6">
                  {mo.status === 'mo_approved'
                    ? 'Start production to initialize process tracking.'
                    : mo.status === 'in_progress'
                    ? 'Initialize processes to start tracking production flow.'
                    : `MO must be approved or in progress. Current status: ${mo.status_display}`
                  }
                </p>
                {(mo.status === 'in_progress' || mo.status === 'mo_approved') && userRole === 'production_head' && (
                  <button
                    onClick={handleInitializeProcesses}
                    disabled={loading}
                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Starting...' : 'Start Production'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Batch Flow Tab */}
        {activeTab === 'batch-flow' && (
          <div>
            {processesInitialized && batchData.batches.length > 0 ? (
              <BatchProcessFlowVisualization
                processExecutions={mo.process_executions}
                batchData={batchData}
                onStartBatchProcess={() => {}}
                onCompleteBatchProcess={() => {}}
                userRole="production_head"
                loadingStates={{}}
              />
            ) : (
              <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-medium text-slate-600 mb-2">
                  {!processesInitialized ? 'Processes Not Initialized' : 'No Batches Available'}
                </h3>
                <p className="text-slate-500 mb-6">
                  {!processesInitialized 
                    ? 'Initialize process tracking first to enable batch flow monitoring.'
                    : 'No batches have been created for this MO yet. Batches are created by the RM Store team.'
                  }
                </p>
                {!processesInitialized && mo.status === 'in_progress' && userRole === 'production_head' && (
                  <button
                    onClick={handleInitializeProcesses}
                    disabled={loading}
                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Starting...' : 'Start Production'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Supervisor Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            {mo.process_executions && mo.process_executions.length > 0 ? (
              <div className="space-y-4">
                {mo.process_executions.map((processExecution) => (
                  <div
                    key={processExecution.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-semibold text-slate-800">{processExecution.process_name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            processExecution.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                            processExecution.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            processExecution.status === 'completed' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {processExecution.status_display}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Current Supervisor</p>
                            <p className="text-sm font-medium text-slate-800">
                              {processExecution.assigned_supervisor_name || 'Not assigned'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Sequence Order</p>
                            <p className="text-sm font-medium text-slate-800">{processExecution.sequence_order}</p>
                          </div>
                        </div>

                        {/* Batch Counts */}
                        {processExecution.batch_counts && (
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              📦 {processExecution.batch_counts.total} batches
                            </span>
                            {processExecution.batch_counts.pending > 0 && (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                {processExecution.batch_counts.pending} pending
                              </span>
                            )}
                            {processExecution.batch_counts.in_progress > 0 && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {processExecution.batch_counts.in_progress} in progress
                              </span>
                            )}
                            {processExecution.batch_counts.completed > 0 && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                {processExecution.batch_counts.completed} completed
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Assign Button */}
                      {['manager', 'production_head'].includes(userRole) && (
                        <button
                          onClick={() => handleOpenSupervisorModal(processExecution)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          Assign Supervisor
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-medium text-slate-600 mb-2">No Process Executions</h3>
                <p className="text-slate-500">Initialize processes to assign supervisors.</p>
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-l-4 border-red-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                        <h4 className="font-semibold text-slate-800">{alert.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {alert.severity_display}
                        </span>
                      </div>
                      <p className="text-slate-700 mb-2">{alert.description}</p>
                      <div className="text-sm text-slate-500">
                        Created by {alert.created_by_name} on {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-medium text-slate-600 mb-2">No Active Alerts</h3>
                <p className="text-slate-500">All processes are running smoothly.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Supervisor Assignment Modal */}
      <SupervisorAssignmentModal
        isOpen={showSupervisorModal}
        onClose={() => setShowSupervisorModal(false)}
        processExecution={selectedProcessExecution}
        supervisors={supervisorsList}
        onSuccess={handleSupervisorAssignmentSuccess}
      />

      {/* Compact styling for SearchableDropdown */}
      <style jsx>{`
        :global(.searchable-dropdown-compact .relative > div) {
          padding: 0.5rem 0.75rem !important;
          border-radius: 0.5rem !important;
          font-size: 0.875rem !important;
        }
      `}</style>
    </div>
  );
}

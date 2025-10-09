"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, PlayIcon, PauseIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

// Components
import ProcessFlowVisualization from '@/components/process/ProcessFlowVisualization';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import SearchableDropdown from '@/components/CommonComponents/ui/SearchableDropdown';

// API Services
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import processTrackingAPI from '@/components/API_Service/process-tracking-api';
import { apiRequest } from '@/components/API_Service/api-utils';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

export default function MODetailPage() {
  const router = useRouter();
  const params = useParams();
  const moId = params.id;

  const [mo, setMO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processesInitialized, setProcessesInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [alerts, setAlerts] = useState([]);
  const [pollingCleanup, setPollingCleanup] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [rmStoreUsersList, setRMStoreUsersList] = useState([]);
  const [userRole, setUserRole] = useState(null);

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
        if (!['manager', 'production_head', 'rm_store'].includes(fetchedRole)) {
          router.push('/production-head');
        }
      });
    } else if (!['manager', 'production_head', 'rm_store'].includes(role)) {
      router.push('/production-head');
      return;
    } else {
      console.log('Using stored user role:', role);
      setUserRole(role);
    }
  }, [router, fetchUserProfile]);

  // Fetch supervisors list
  const fetchSupervisors = useCallback(async () => {
    try {
      const supervisors = await manufacturingAPI.manufacturingOrders.getSupervisors();
      setSupervisorsList(supervisors);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  }, []);

  // Fetch RM store users list
  const fetchRMStoreUsers = useCallback(async () => {
    try {
      const rmStoreUsers = await manufacturingAPI.manufacturingOrders.getRMStoreUsers();
      setRMStoreUsersList(rmStoreUsers);
    } catch (error) {
      console.error('Error fetching RM store users:', error);
    }
  }, []);

  // Fetch MO data with process tracking
  const fetchMOData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await processTrackingAPI.getMOWithProcesses(moId);
      setMO(data);
      setProcessesInitialized(data.process_executions && data.process_executions.length > 0);
      
      // Set edit data
      setEditData({
        assigned_rm_store: data.assigned_rm_store || '',
        assigned_supervisor: data.assigned_supervisor || '',
        shift: data.shift || ''
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

  // Initialize data and polling
  useEffect(() => {
    let cleanupFunction = null;

    const initializePolling = async () => {
      await Promise.all([fetchMOData(), fetchSupervisors(), fetchRMStoreUsers()]);

      // Set up real-time polling for updates
      cleanupFunction = await processTrackingAPI.pollProcessUpdates(moId, (data) => {
        setMO(data);
        setProcessesInitialized(data.process_executions && data.process_executions.length > 0);
      }, 30000); // Poll every 30 seconds (increased from 10 seconds)

      setPollingCleanup(() => cleanupFunction);
    };

    initializePolling();

    // Cleanup on unmount
    return () => {
      if (cleanupFunction && typeof cleanupFunction === 'function') {
        cleanupFunction();
      }
    };
  }, [fetchMOData, fetchSupervisors, fetchRMStoreUsers, moId]);

  // Initialize processes for the MO
  const handleInitializeProcesses = async () => {
    try {
      setLoading(true);
      await processTrackingAPI.initializeMOProcesses(moId);
      await fetchMOData();
    } catch (error) {
      console.error('Error initializing processes:', error);
      alert('Failed to initialize processes: ' + error.message);
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
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      assigned_rm_store: mo.assigned_rm_store || '',
      assigned_supervisor: mo.assigned_supervisor || '',
      shift: mo.shift || ''
    });
  };

  // Handle save MO details
  const handleSaveMO = async () => {
    try {
      setLoading(true);
      const response = await manufacturingAPI.manufacturingOrders.updateMODetails(moId, editData);
      
      // Response is already unwrapped by handleResponse, so it contains { message, mo }
      if (response && response.mo) {
        setMO(response.mo);
        setIsEditing(false);
        alert('MO details updated successfully!');
      } else {
        alert('Failed to update MO details: Unexpected response format');
      }
    } catch (error) {
      console.error('Error updating MO:', error);
      alert('Failed to update MO details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle approve MO (Manager/Production Head - starts production)
  const handleApproveMO = async () => {
    if (!mo.assigned_supervisor) {
      alert('Please assign a supervisor before approving the MO.');
      return;
    }

    const confirmApproval = window.confirm(
      `Are you sure you want to approve MO ${mo.mo_id} and start production? This will notify the assigned supervisor and consume raw materials.`
    );

    if (!confirmApproval) return;

    try {
      setLoading(true);
      const response = await manufacturingAPI.manufacturingOrders.approveMO(moId, {
        notes: 'MO approved by manager - Production started'
      });
      
      // Response is already unwrapped by handleResponse, so it contains { message, mo }
      if (response && response.mo) {
        setMO(response.mo);
        alert('MO approved successfully! Production has started and supervisor has been notified.');
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

  // Handle RM approve MO (RM Store user - allocates raw materials)
  const handleRMApproveMO = async () => {
    const confirmApproval = window.confirm(
      `Are you sure you want to approve RM allocation for MO ${mo.mo_id}? This will make the MO ready for production approval.`
    );

    if (!confirmApproval) return;

    try {
      setLoading(true);
      const response = await manufacturingAPI.manufacturingOrders.rmApproveMO(moId, {
        notes: 'Raw materials verified and allocated by RM store'
      });
      
      // Response is already unwrapped by handleResponse, so it contains { message, mo }
      if (response && response.mo) {
        setMO(response.mo);
        alert('RM allocation approved successfully! MO is now ready for production approval.');
      } else {
        alert('Failed to approve RM allocation: Unexpected response format');
      }
    } catch (error) {
      console.error('Error approving RM allocation:', error);
      alert('Failed to approve RM allocation: ' + error.message);
    } finally {
      setLoading(false);
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Order Information</h3>
                    {(['manager', 'production_head'].includes(userRole) && ['on_hold', 'rm_allocated'].includes(mo.status)) && !isEditing && (
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
                      <span className="font-medium text-slate-800">{mo.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Material:</span>
                      <span className="font-medium text-slate-800">{mo.material_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Grade:</span>
                      <span className="font-medium text-slate-800">{mo.grade}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">RM Store User:</span>
                      {isEditing ? (
                        <div className="searchable-dropdown-compact flex-1 ml-4">
                          <SearchableDropdown
                            options={rmStoreUsersList}
                            value={editData.assigned_rm_store}
                            onChange={(value) => handleEditInputChange('assigned_rm_store', value)}
                            placeholder="Select RM Store User"
                            displayKey="display_name"
                            valueKey="id"
                            searchKeys={["display_name", "username", "email"]}
                            className="w-full text-slate-800"
                            loading={rmStoreUsersList.length === 0}
                            allowClear={true}
                          />
                        </div>
                      ) : (
                        <span className="font-medium text-slate-800">{mo.assigned_rm_store_name || 'Not Assigned'}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Supervisor:</span>
                      {isEditing ? (
                        <div className="searchable-dropdown-compact flex-1 ml-4">
                          <SearchableDropdown
                            options={supervisorsList}
                            value={editData.assigned_supervisor}
                            onChange={(value) => handleEditInputChange('assigned_supervisor', value)}
                            placeholder="Select Supervisor"
                            displayKey="display_name"
                            valueKey="id"
                            searchKeys={["display_name", "username", "email"]}
                            className="w-full text-slate-800"
                            loading={supervisorsList.length === 0}
                            allowClear={true}
                          />
                        </div>
                      ) : (
                        <span className="font-medium text-slate-800">{mo.assigned_supervisor_name || 'Not Assigned'}</span>
                      )}
                    </div>
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

            {/* RM Store Actions */}
            {userRole === 'rm_store' && mo.status === 'on_hold' && mo.assigned_rm_store && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 text-center">
                <div className="mb-4">
                  <CheckCircleIcon className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-800">RM Allocation Required</h3>
                  <p className="text-slate-600">
                    Verify raw material availability and approve allocation for this MO.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Required: {mo.rm_required_kg} kg of raw material
                  </p>
                </div>
                <button
                  onClick={handleRMApproveMO}
                  disabled={loading}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Approving...' : 'Approve RM Allocation'}
                </button>
              </div>
            )}

            {/* Manager Actions */}
            {['manager', 'production_head'].includes(userRole) && mo.status === 'rm_allocated' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 text-center">
                <div className="mb-4">
                  <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-800">Ready for Production</h3>
                  <p className="text-slate-600">
                    Raw materials have been allocated. Approve to start production and notify the supervisor.
                  </p>
                  {!mo.assigned_supervisor && (
                    <p className="text-amber-600 text-sm mt-2">
                      ⚠️ Please assign a supervisor before starting production
                    </p>
                  )}
                </div>
                <button
                  onClick={handleApproveMO}
                  disabled={loading || !mo.assigned_supervisor}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Starting Production...' : 'Start Production'}
                </button>
              </div>
            )}

            {/* Initialize Processes Button */}
            {!processesInitialized && mo.status === 'in_progress' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 text-center">
                <div className="mb-4">
                  <ClockIcon className="h-12 w-12 text-amber-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-800">Production Started</h3>
                  <p className="text-slate-600">Initialize process tracking to begin monitoring production flow.</p>
                </div>
                <button
                  onClick={handleInitializeProcesses}
                  disabled={loading}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Initializing...' : 'Initialize Processes'}
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
                  {mo.status === 'in_progress' 
                    ? 'Initialize processes to start tracking production flow.'
                    : `MO must be in 'In Progress' status to initialize processes. Current status: ${mo.status_display}`
                  }
                </p>
                {mo.status === 'in_progress' && (
                  <button
                    onClick={handleInitializeProcesses}
                    disabled={loading}
                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Initializing...' : 'Initialize Processes'}
                  </button>
                )}
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

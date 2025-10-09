"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, PlayIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Components
import ProcessFlowVisualization from '@/components/process/ProcessFlowVisualization';
import BatchProcessFlowVisualization from '@/components/process/BatchProcessFlowVisualization';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import NotificationBell from '@/components/supervisor/NotificationBell';
import BatchSelectionModal from '@/components/supervisor/BatchSelectionModal';

// API Services
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import processTrackingAPI from '@/components/API_Service/process-tracking-api';
import { apiRequest } from '@/components/API_Service/api-utils';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

// Helper function to map process names to departments
const getProcessDepartment = (processName) => {
  const processDepartmentMapping = {
    'Coiling Setup': 'coiling',
    'Coiling Operation': 'coiling', 
    'Coiling QC': 'coiling',
    'Tempering Setup': 'tempering',
    'Tempering Process': 'tempering',
    'Tempering QC': 'tempering',
    'Plating Preparation': 'plating',
    'Plating Process': 'plating',
    'Plating QC': 'plating',
    'Packing Setup': 'packing',
    'Packing Process': 'packing',
    'Label Printing': 'packing'
  };
  return processDepartmentMapping[processName];
};

export default function SupervisorMODetailPage() {
  const router = useRouter();
  const params = useParams();
  const moId = params.id;

  const [mo, setMO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processesInitialized, setProcessesInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [alerts, setAlerts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [moActionLoading, setMoActionLoading] = useState(false);
  const [startingProcessId, setStartingProcessId] = useState(null);
  const [completingProcessId, setCompletingProcessId] = useState(null);
  const [batchData, setBatchData] = useState({ batches: [], summary: null });
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProcessForBatch, setSelectedProcessForBatch] = useState(null);
  const [batchProcessLoadingStates, setBatchProcessLoadingStates] = useState({});
  const [useBatchWiseFlow, setUseBatchWiseFlow] = useState(true);

  // Fetch user profile (THROTTLED)
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

  // Fetch MO data with process tracking
  const fetchMOData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await processTrackingAPI.getMOWithProcesses(moId);
      
      // Filter process executions based on user's department/role
      if (data.process_executions && userProfile) {
        const filteredProcesses = data.process_executions.filter(process => {
          // Admin, manager, production_head can see all processes
          const userRole = userProfile.primary_role?.name;
          if (['admin', 'manager', 'production_head'].includes(userRole)) {
            return true;
          }
          
          // Supervisors can only see processes in their department
          if (userRole === 'supervisor') {
            const userDepartment = userProfile.department;
            const processDepartment = getProcessDepartment(process.process_name);
            return processDepartment === userDepartment || process.assigned_supervisor === userProfile.id;
          }
          
          // RM Store and FG Store users can only see processes assigned to them
          if (['rm_store', 'fg_store'].includes(userRole)) {
            return process.assigned_supervisor === userProfile.id;
          }
          
          return false;
        });
        
        data.process_executions = filteredProcesses;
      }
      
      setMO(data);
      setProcessesInitialized(data.process_executions && data.process_executions.length > 0);

      // Fetch alerts
      const alertsData = await processTrackingAPI.getActiveAlerts(moId);
      setAlerts(alertsData);

      // Fetch batch data
      if (data.batches?.length) {
        setBatchData({ batches: data.batches, summary: null });
      } else {
        await fetchBatchInfo();
      }
    } catch (error) {
      console.error('Error fetching MO data:', error);
      
      // Handle rate limiting errors gracefully
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.warn('Rate limited - will retry on next interval');
        // Don't show error to user, just log it and continue
        return;
      }
      
      if (error.message.includes('404')) {
        router.replace('/supervisor/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [moId, router, userProfile]);

  const fetchBatchInfo = useCallback(async () => {
    try {
      const batchResponse = await manufacturingAPI.batches.getByMO(moId);
      
      // Enhance batch data with process execution tracking
      // TODO: This should come from the backend API
      const enhancedBatches = (batchResponse.batches || []).map(batch => ({
        ...batch,
        completed_processes: [], // Array of process IDs that this batch has completed
        current_process_executions: {}, // Object mapping process ID to execution status
        // Example: current_process_executions: { "1": { status: "in_progress", started_at: "..." } }
      }));
      
      setBatchData({ 
        batches: enhancedBatches, 
        summary: batchResponse.summary || null 
      });
    } catch (error) {
      console.error('Error fetching batch info:', error);
    }
  }, [moId]);

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
        await fetchMOData();
      }
    };

    initializePage();

    // Poll for updates every 30 seconds (reduced from 10 seconds)
    const interval = setInterval(fetchMOData, 30000);
    return () => clearInterval(interval);
  }, [fetchUserProfile, fetchMOData, router, moId]);

  // Handle start MO
  const handleStartMO = async () => {
    if (!window.confirm(`Are you sure you want to start production for MO ${mo.mo_id}?`)) {
      return;
    }

    try {
      setMoActionLoading(true);
      const response = await manufacturingAPI.manufacturingOrders.startMO(moId, {
        notes: 'Production started by supervisor'
      });
      
      if (response && response.mo) {
        setMO(response.mo);
        alert('Production started successfully!');
        await fetchMOData();
      }
    } catch (error) {
      console.error('Error starting MO:', error);
      alert('Failed to start production: ' + error.message);
    } finally {
      setMoActionLoading(false);
    }
  };

  // Initialize processes
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
    // Future: Navigate to process detail page
  };

  // Handle step click
  const handleStepClick = (stepExecution) => {
    console.log('Step clicked:', stepExecution);
    // Future: Open step detail modal
  };

  // Handle start process - show batch selection modal
  const handleStartProcess = async (execution) => {
    // Check if this is the first process and we have batches
    const isFirstProcess = execution.sequence_order === 1;
    
    if (isFirstProcess && batchData.batches.length > 0) {
      setSelectedProcessForBatch(execution);
      setShowBatchModal(true);
    } else {
      // Start process directly if no batches or not first process
      await startProcessDirectly(execution);
    }
  };

  // Start process with batch selection
  const handleStartProcessWithBatch = async (execution, selectedBatch) => {
    try {
      setStartingProcessId(execution.id);
      // TODO: Update API to accept batch information
      await processTrackingAPI.startProcess(execution.id, { batch_id: selectedBatch.id });
      await fetchMOData();
      alert(`Process "${execution.process_name}" started with batch ${selectedBatch.batch_id}!`);
    } catch (error) {
      console.error('Error starting process with batch:', error);
      alert('Failed to start process: ' + error.message);
    } finally {
      setStartingProcessId(null);
    }
  };

  // Start process directly without batch selection
  const startProcessDirectly = async (execution) => {
    try {
      setStartingProcessId(execution.id);
      await processTrackingAPI.startProcess(execution.id);
      await fetchMOData();
      alert(`Process "${execution.process_name}" started successfully!`);
    } catch (error) {
      console.error('Error starting process:', error);
      alert('Failed to start process: ' + error.message);
    } finally {
      setStartingProcessId(null);
    }
  };

  const handleCompleteProcess = async (execution) => {
    console.log('Attempting to complete process:', execution);
    
    // Check if process is in the right state to be completed
    if (execution.status !== 'in_progress') {
      alert(`Cannot complete process "${execution.process_name}". Process must be in progress to complete. Current status: ${execution.status_display || execution.status}`);
      return;
    }

    // Check if there are step executions and if they're all completed
    if (execution.step_executions && execution.step_executions.length > 0) {
      const incompleteSteps = execution.step_executions.filter(step => step.status !== 'completed');
      if (incompleteSteps.length > 0) {
        alert(`Cannot complete process "${execution.process_name}": ${incompleteSteps.length} step(s) are still incomplete. Please complete all steps first.`);
        return;
      }
    }

    if (!window.confirm(`Complete process "${execution.process_name}"? This will mark the entire process as finished.`)) {
      return;
    }

    try {
      setCompletingProcessId(execution.id);
      console.log('Calling completeProcess API for execution ID:', execution.id);
      await processTrackingAPI.completeProcess(execution.id);
      await fetchMOData();
      alert(`Process "${execution.process_name}" marked as completed!`);
    } catch (error) {
      console.error('Error completing process:', error);
      console.error('Execution details:', execution);
      
      // Provide more specific error messages
      if (error.message.includes('steps are still incomplete')) {
        alert(`Cannot complete process "${execution.process_name}": Some process steps are still incomplete. Please complete all steps first.`);
      } else if (error.message.includes('must be in progress')) {
        alert(`Cannot complete process "${execution.process_name}": Process must be in progress to complete.`);
      } else if (error.message.includes('Only supervisors or assigned operators')) {
        alert(`Cannot complete process "${execution.process_name}": You don't have permission to complete this process.`);
      } else {
        alert('Failed to complete process: ' + error.message);
      }
    } finally {
      setCompletingProcessId(null);
    }
  };

  // Handle start batch in specific process
  const handleStartBatchProcess = async (batch, process) => {
    const loadingKey = `${batch.id}_${process.id}`;
    
    try {
      setBatchProcessLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
      
      // Call API to start batch in specific process
      await processTrackingAPI.startBatchProcess(batch.id, process.id);
      
      await fetchMOData();
      alert(`Batch "${batch.batch_id}" started in process "${process.process_name}"!`);
    } catch (error) {
      console.error('Error starting batch process:', error);
      
      // Provide helpful error message for 404
      if (error.message.includes('404')) {
        alert(`Batch process API is not yet available. The backend endpoints are being set up. Please try again after the server restart.`);
      } else {
        alert('Failed to start batch process: ' + error.message);
      }
    } finally {
      setBatchProcessLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle complete batch in specific process
  const handleCompleteBatchProcess = async (batch, process) => {
    const loadingKey = `${batch.id}_${process.id}`;
    
    if (!window.confirm(`Complete batch "${batch.batch_id}" in process "${process.process_name}"?`)) {
      return;
    }
    
    try {
      setBatchProcessLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
      
      // Call API to complete batch in specific process
      await processTrackingAPI.completeBatchProcess(batch.id, process.id);
      
      await fetchMOData();
      alert(`Batch "${batch.batch_id}" completed in process "${process.process_name}"! It can now proceed to the next process.`);
    } catch (error) {
      console.error('Error completing batch process:', error);
      
      // Provide helpful error message for 404
      if (error.message.includes('404')) {
        alert(`Batch process API is not yet available. The backend endpoints are being set up. Please try again after the server restart.`);
      } else {
        alert('Failed to complete batch process: ' + error.message);
      }
    } finally {
      setBatchProcessLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.replace('/login');
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      mo_approved: 'bg-green-100 text-green-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Manufacturing Order Not Found</h2>
          <button
            onClick={() => router.replace('/supervisor/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    { id: 'alerts', label: 'Alerts', icon: '🚨', count: alerts.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.replace('/supervisor/dashboard')}
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
              <NotificationBell onNotificationClick={fetchMOData} />
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
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
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
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Order Information</h3>
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
                    {mo.shift && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Shift:</span>
                        <span className="font-medium text-slate-800">{mo.shift_display}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Timeline</h3>
                  <div className="space-y-3">
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
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000"
                      style={{ width: `${mo.overall_progress}%` }}
                    />
                  </div>
                  
                  {mo.active_process && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <PlayIcon className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Currently Active Process</span>
                      </div>
                      <div className="text-sm text-blue-700">
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

            {/* Start Production Button */}
            {['mo_approved', 'gm_approved', 'rm_allocated', 'on_hold'].includes(mo.status) && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 text-center">
                <div className="mb-4">
                  <PlayIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-800">Ready to Start Production</h3>
                  <p className="text-slate-600">Click below to start production for this manufacturing order.</p>
                </div>
                <button
                  onClick={handleStartMO}
                  disabled={moActionLoading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {moActionLoading ? 'Starting...' : 'Start Production'}
                </button>
              </div>
            )}

            {/* Initialize Processes Button */}
            {!processesInitialized && mo.status === 'in_progress' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 text-center">
                <div className="mb-4">
                  <ClockIcon className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-800">Initialize Process Tracking</h3>
                  <p className="text-slate-600">Set up process tracking to monitor production flow.</p>
                </div>
                <button
                  onClick={handleInitializeProcesses}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
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
                onStartProcess={handleStartProcess}
                onCompleteProcess={handleCompleteProcess}
                showSteps={true}
                compact={false}
                userRole="supervisor"
                startingProcessId={startingProcessId}
                completingProcessId={completingProcessId}
                batchData={batchData}
              />
            ) : (
              <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl">
                <div className="text-6xl mb-4">🏭</div>
                <h3 className="text-xl font-medium text-slate-600 mb-2">Processes Not Initialized</h3>
                <p className="text-slate-500 mb-6">
                  {mo.status === 'in_progress' 
                    ? 'Initialize process tracking to monitor production flow.'
                    : `MO must be in 'In Progress' status to track processes. Current status: ${mo.status_display}`
                  }
                </p>
                {mo.status === 'in_progress' && (
                  <button
                    onClick={handleInitializeProcesses}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Initializing...' : 'Initialize Processes'}
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
                onStartBatchProcess={handleStartBatchProcess}
                onCompleteBatchProcess={handleCompleteBatchProcess}
                userRole="supervisor"
                loadingStates={batchProcessLoadingStates}
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
                {!processesInitialized && mo.status === 'in_progress' && (
                  <button
                    onClick={handleInitializeProcesses}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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

      {/* Batch Selection Modal */}
      <BatchSelectionModal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setSelectedProcessForBatch(null);
        }}
        batches={batchData.batches}
        processExecution={selectedProcessForBatch}
        onStartProcess={handleStartProcessWithBatch}
      />
    </div>
  );
}


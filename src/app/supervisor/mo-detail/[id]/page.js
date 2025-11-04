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
import SupervisorReturnRMModal from '@/components/supervisor/SupervisorReturnRMModal';

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
  const [error, setError] = useState(null);
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
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnContext, setReturnContext] = useState(null); // { batch, process }

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
      
      // Check if the response is an error object (MO not found)
      if (data && data.error) {
        console.warn('MO not found:', data.message);
        setError('This manufacturing order is no longer available. It may have been completed or removed.');
        setLoading(false);
        return;
      }
      
      // Filter process executions based on user's role
      if (data.process_executions && userProfile) {
        const filteredProcesses = data.process_executions.filter(process => {
          // Admin, manager, production_head can see all processes
          const userRole = userProfile.primary_role?.name;
          if (['admin', 'manager', 'production_head'].includes(userRole)) {
            return true;
          }
          
          // Supervisors can only see processes assigned to them
          if (userRole === 'supervisor') {
            return process.assigned_supervisor === userProfile.id;
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

      // Always fetch batch data from dedicated endpoint to ensure freshness
      // This is important for getting updated batch.notes after process completion
      await fetchBatchInfo();
    } catch (error) {
      console.error('Error fetching MO data:', error);
      
      // Handle specific error cases
      if (error.message.includes('No ManufacturingOrder matches') || 
          error.message.includes('Not Found') ||
          error.message.includes('404')) {
        console.warn('MO not found, redirecting to dashboard');
        setError('This manufacturing order is no longer available. It may have been completed or removed.');
        setLoading(false);
        return;
      }
      
      // Handle rate limiting errors gracefully
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.warn('Rate limited - will retry on next interval');
        // Don't show error to user, just log it and continue
        return;
      }
      
      // Handle MO not found or not assigned to supervisor
      if (error.message.includes('404') || error.message.includes('No ManufacturingOrder matches')) {
        setMO(null);
        setLoading(false);
        return;
      }
      
      // Handle permission denied
      if (error.message.includes('403') || error.message.includes('Permission denied')) {
        setMO(null);
        setLoading(false);
        return;
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

  // Aggressive refresh function for batch operations
  const refreshBatchStatus = useCallback(async () => {
    try {
      console.log('🔄 Refreshing batch status...');
      
      // Multiple parallel calls to ensure we get the latest data
      const [moData, batchData] = await Promise.all([
        processTrackingAPI.getMOWithProcesses(moId),
        manufacturingAPI.batches.getByMO(moId)
      ]);
      
      // Update MO data
      if (moData && !moData.error) {
        // Filter process executions if user profile exists
        if (moData.process_executions && userProfile) {
          const filteredProcesses = moData.process_executions.filter(pe => {
            const userRole = userProfile.primary_role?.name;
            if (['admin', 'manager', 'production_head'].includes(userRole)) {
              return true;
            }
            if (userRole === 'supervisor') {
              return pe.assigned_supervisor === userProfile.id;
            }
            if (['rm_store', 'fg_store'].includes(userRole)) {
              return pe.assigned_supervisor === userProfile.id;
            }
            return false;
          });
          moData.process_executions = filteredProcesses;
        }
        
        setMO(moData);
        setProcessesInitialized(moData.process_executions && moData.process_executions.length > 0);
        console.log('✅ MO data updated with', moData.process_executions?.length, 'processes');
      }
      
      // Update batch data
      if (batchData) {
        const enhancedBatches = (batchData.batches || []).map(batch => ({
          ...batch,
          completed_processes: [],
          current_process_executions: {},
        }));
        
        setBatchData({ 
          batches: enhancedBatches, 
          summary: batchData.summary || null 
        });
        console.log('✅ Batch data updated with', enhancedBatches.length, 'batches');
      }
      
      // Force UI refresh
      setBatchProcessLoadingStates(prev => ({ ...prev, _refresh: Date.now() }));
      console.log('✅ UI refresh triggered');
    } catch (error) {
      console.error('❌ Error in aggressive refresh:', error);
    }
  }, [moId, userProfile]);

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
      // Auto-start the first batch if it's the first process
      const firstBatch = batchData.batches[0];
      if (firstBatch) {
        try {
          setStartingProcessId(execution.id);
          
          // Start the process
          await processTrackingAPI.startProcess(execution.id, { batch_id: firstBatch.id });
          
          // Immediately start the first batch in this process
          // Pass execution.id (MOProcessExecution ID), not execution.process_id (Process ID)
          await processTrackingAPI.startBatchProcess(firstBatch.id, execution.id);
          
          // Immediate refresh with multiple calls to ensure status updates
          await Promise.all([
            fetchMOData(),
            fetchBatchInfo()
          ]);
          
          // Additional refresh after a short delay to catch any backend processing
          setTimeout(async () => {
            await Promise.all([
              fetchMOData(),
              fetchBatchInfo()
            ]);
          }, 1000);
          
          alert(`Process "${execution.process_name}" started with batch ${firstBatch.batch_id}!\n\nThe first batch has been automatically started. You can now start subsequent batches manually.`);
        } catch (error) {
          console.error('Error starting process with auto-batch:', error);
          alert('Failed to start process: ' + error.message);
        } finally {
          setStartingProcessId(null);
        }
      } else {
        // Fallback to batch selection modal
        setSelectedProcessForBatch(execution);
        setShowBatchModal(true);
      }
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
      
      // Immediate refresh with multiple calls to ensure status updates
      await Promise.all([
        fetchMOData(),
        fetchBatchInfo()
      ]);
      
      // Additional refresh after a short delay to catch any backend processing
      setTimeout(async () => {
        await Promise.all([
          fetchMOData(),
          fetchBatchInfo()
        ]);
      }, 1000);
      
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

    // For batch-based production, check if all batches have completed this process
    const moBatches = batchData.batches || [];
    if (moBatches.length > 0) {
      const incompleteBatches = moBatches.filter(batch => {
        const batchProcKey = `PROCESS_${execution.id}_STATUS`;
        return !(batch.notes || '').includes(`${batchProcKey}:completed;`);
      });

      if (incompleteBatches.length > 0) {
        const incompleteBatchIds = incompleteBatches.map(b => b.batch_id).join(', ');
        alert(`Cannot complete process "${execution.process_name}": ${incompleteBatches.length} batch(es) have not completed this process yet.\n\nIncomplete batches: ${incompleteBatchIds}\n\nPlease complete all batches in this process first. The process will be automatically marked as completed when all batches are done.`);
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
      } else if (error.message.includes('not all batches have completed')) {
        alert(`Cannot complete process "${execution.process_name}": All batches must complete this process before marking the process as completed. Please complete all batches first.`);
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
      
      // Use aggressive refresh immediately
      await refreshBatchStatus();
      
      // Additional refreshes at different intervals to ensure status updates
      setTimeout(async () => {
        await refreshBatchStatus();
      }, 300);
      
      setTimeout(async () => {
        await refreshBatchStatus();
      }, 800);
      
      alert(`Batch "${batch.batch_id}" started in process "${process.process_name}"!\n\nYou can now complete this batch in the Process Flow tab.`);
      
      // Close modal and switch to processes tab to show completion UI
      setShowBatchModal(false);
      setSelectedProcessForBatch(null);
      setActiveTab('processes');
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
      const response = await processTrackingAPI.completeBatchProcess(batch.id, process.id);
      
      console.log('✅ Batch process completion response:', response);
      
      // Immediately update the batch notes in state if response contains batch data
      if (response && response.batch) {
        setBatchData(prev => ({
          ...prev,
          batches: prev.batches.map(b => 
            b.id === batch.id ? { ...b, notes: response.batch.notes || b.notes } : b
          )
        }));
      }
      
      // If process was completed, update the process execution status immediately
      if (response && response.process_completed && mo && mo.process_executions) {
        setMO(prev => ({
          ...prev,
          process_executions: prev.process_executions.map(pe => 
            pe.id === process.id 
              ? { 
                  ...pe, 
                  status: 'completed',
                  progress_percentage: 100,
                  actual_end_time: new Date().toISOString()
                }
              : pe
          )
        }));
        console.log('✅ Process status updated to completed');
      }
      
      // Use aggressive refresh to ensure everything is in sync
      await refreshBatchStatus();
      
      // Additional refresh after a short delay
      setTimeout(async () => {
        await refreshBatchStatus();
      }, 500);
      
      // Build success message with additional info
      let successMessage = `Batch "${batch.batch_id}" completed in process "${process.process_name}"!`;
      if (response && response.process_completed) {
        successMessage += `\n\n✅ The process has been marked as completed (${response.rm_batched_percentage?.toFixed(1)}% RM batched)`;
      } else if (response && response.rm_batched_percentage !== undefined) {
        successMessage += `\n\n📊 RM Batched: ${response.rm_batched_percentage.toFixed(1)}% (Process will complete when >= 90%)`;
      }
      successMessage += '\n\nThe batch can now proceed to the next process.';
      
      alert(successMessage);
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

  // Handle Return RM click
  const handleReturnRM = (batch, process) => {
    setReturnContext({ batch, process });
    setShowReturnModal(true);
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

  // Helper function to check if a process can be completed
  const canCompleteProcess = (execution) => {
    // Process must be in progress
    if (execution.status !== 'in_progress') {
      return false;
    }

    // All steps must be completed
    if (execution.step_executions && execution.step_executions.length > 0) {
      const incompleteSteps = execution.step_executions.filter(step => step.status !== 'completed');
      if (incompleteSteps.length > 0) {
        return false;
      }
    }

    // For batch-based production, all batches must have completed this process
    const moBatches = batchData.batches || [];
    if (moBatches.length > 0) {
      const incompleteBatches = moBatches.filter(batch => {
        const batchProcKey = `PROCESS_${execution.id}_STATUS`;
        return !(batch.notes || '').includes(`${batchProcKey}:completed;`);
      });
      return incompleteBatches.length === 0;
    }

    return true;
  };

  // Helper function to get batch completion status for a process
  const getBatchCompletionStatus = (execution) => {
    const moBatches = batchData.batches || [];
    if (moBatches.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const batchProcKey = `PROCESS_${execution.id}_STATUS`;
    const completedBatches = moBatches.filter(batch => 
      (batch.notes || '').includes(`${batchProcKey}:completed;`)
    );

    return {
      completed: completedBatches.length,
      total: moBatches.length,
      percentage: moBatches.length > 0 ? (completedBatches.length / moBatches.length) * 100 : 0
    };
  };

  if (loading && !mo && !error) {
    return <LoadingSpinner />;
  }

  // Show error state if there's an error (including MO not found)
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Manufacturing Order Not Available</h2>
          <p className="text-slate-600 mb-6">
            {error}
          </p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => router.replace('/supervisor/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setError(null);
                fetchMOData();
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Manufacturing Order Not Available</h2>
          <p className="text-slate-600 mb-6">
            This manufacturing order is either not assigned to you, has been deleted, or you don&apos;t have permission to access it.
          </p>
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
    { id: 'processes', label: 'Process & Batch Flow', icon: '🏭' },
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

            {/* Batch Completion Workflow Information */}
            {processesInitialized && batchData.batches.length > 0 && (
              <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-blue-200/50 border border-blue-200/60 p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Multi-Batch Production Workflow</h3>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p><strong>How it works:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Each batch must complete all processes before the MO is finished</li>
                        <li>Processes are marked as &quot;completed&quot; only when ALL batches have finished that process</li>
                        <li>You can start new batches in completed processes until all RM is released</li>
                        <li>Use the &quot;Process &amp; Batch Flow&quot; tab to manage individual batch progress</li>
                      </ul>
                      <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                        <p className="font-medium text-blue-800">💡 Tip:</p>
                        <p className="text-blue-700">Complete batches individually in each process. The process will automatically be marked as completed when all batches are done.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processes Tab */}
        {activeTab === 'processes' && (
          <div>
            {processesInitialized ? (
              <div className="space-y-6">
                {/* Process Flow Visualization */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <span className="mr-2">🏭</span>
                    Process Flow
                  </h3>
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
                    canCompleteProcess={canCompleteProcess}
                    getBatchCompletionStatus={getBatchCompletionStatus}
                  />
                </div>

                {/* Batch Flow Visualization */}
                {batchData.batches.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <span className="mr-2">📦</span>
                      Batch Flow Management
                    </h3>
                    <BatchProcessFlowVisualization
                      processExecutions={mo.process_executions}
                      batchData={batchData}
                      onStartBatchProcess={handleStartBatchProcess}
                      onCompleteBatchProcess={handleCompleteBatchProcess}
                      onReturnRM={handleReturnRM}
                      userRole="supervisor"
                      loadingStates={batchProcessLoadingStates}
                    />
                  </div>
                )}
              </div>
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

      {/* Return RM Modal */}
      <SupervisorReturnRMModal
        isOpen={showReturnModal}
        onClose={() => { setShowReturnModal(false); setReturnContext(null); }}
        moId={moId}
        mo={mo}
        batch={returnContext?.batch || null}
        processExecution={returnContext?.process || null}
        onSuccess={async () => {
          setShowReturnModal(false);
          setReturnContext(null);
          await refreshBatchStatus();
        }}
      />
    </div>
  );
}


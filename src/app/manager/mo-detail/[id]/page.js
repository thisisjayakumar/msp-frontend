"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, PlayIcon, PauseIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

// Components
import ProcessFlowVisualization from '@/components/process/ProcessFlowVisualization';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';

// API Services
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import processTrackingAPI from '@/components/API_Service/process-tracking-api';

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

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'manager') {
      router.push('/manager');
      return;
    }
  }, [router]);

  // Fetch MO data with process tracking
  const fetchMOData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await processTrackingAPI.getMOWithProcesses(moId);
      setMO(data);
      setProcessesInitialized(data.process_executions && data.process_executions.length > 0);
      
      // Fetch alerts
      const alertsData = await processTrackingAPI.getActiveAlerts(moId);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching MO data:', error);
      if (error.message.includes('404')) {
        router.push('/manager/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [moId, router]);

  // Initialize data and polling
  useEffect(() => {
    fetchMOData();

    // Set up real-time polling for updates
    const cleanup = processTrackingAPI.pollProcessUpdates(moId, (data) => {
      setMO(data);
      setProcessesInitialized(data.process_executions && data.process_executions.length > 0);
    }, 10000); // Poll every 10 seconds

    setPollingCleanup(() => cleanup);

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();
    };
  }, [fetchMOData, moId]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Manufacturing Order Not Found</h2>
          <button
            onClick={() => router.push('/manager/dashboard')}
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
                onClick={() => router.push('/manager/dashboard')}
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
                      <span className="text-slate-600">Product:</span>
                      <span className="font-medium text-slate-800">{mo.product_code_display}</span>
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
                    <div className="flex justify-between">
                      <span className="text-slate-600">Supervisor:</span>
                      <span className="font-medium text-slate-800">{mo.assigned_supervisor_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Shift:</span>
                      <span className="font-medium text-slate-800">{mo.shift_display}</span>
                    </div>
                  </div>
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

            {/* Initialize Processes Button */}
            {!processesInitialized && mo.status === 'rm_allocated' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 text-center">
                <div className="mb-4">
                  <ClockIcon className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-800">Ready to Start Production</h3>
                  <p className="text-slate-600">Initialize process tracking to begin monitoring production flow.</p>
                </div>
                <button
                  onClick={handleInitializeProcesses}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {mo.status === 'rm_allocated' 
                    ? 'Initialize processes to start tracking production flow.'
                    : `MO must be in 'RM Allocated' status to initialize processes. Current status: ${mo.status_display}`
                  }
                </p>
                {mo.status === 'rm_allocated' && (
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
    </div>
  );
}

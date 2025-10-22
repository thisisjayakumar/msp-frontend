'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkflowStatusTracker() {
  const router = useRouter();
  const [moId, setMoId] = useState('');
  const [workflowData, setWorkflowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkflowStatus = async () => {
    if (!moId.trim()) {
      setError('Please enter a MO ID');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Fetch MO details
      const moResponse = await fetch(`/api/manufacturing/manufacturing-orders/?mo_id=${moId}`);
      const moData = await moResponse.json();
      
      if (moData.results && moData.results.length > 0) {
        const mo = moData.results[0];
        
        // Fetch related data
        const [workflowResponse, batchesResponse, processExecutionsResponse] = await Promise.all([
          fetch(`/api/manufacturing/mo-approval-workflows/?mo=${mo.id}`),
          fetch(`/api/manufacturing/batches/?mo=${mo.id}`),
          fetch(`/api/manufacturing/process-executions/?mo=${mo.id}`)
        ]);

        const [workflowData, batchesData, processExecutionsData] = await Promise.all([
          workflowResponse.json(),
          batchesResponse.json(),
          processExecutionsResponse.json()
        ]);

        setWorkflowData({
          mo,
          workflow: workflowData.results?.[0],
          batches: batchesData.results || [],
          processExecutions: processExecutionsData.results || []
        });
      } else {
        setError('MO not found');
      }
    } catch (error) {
      console.error('Error fetching workflow status:', error);
      setError('Error fetching workflow status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': 'bg-yellow-100 text-yellow-800',
      'mo_approved': 'bg-green-100 text-green-800',
      'rm_allocated': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-gray-100 text-gray-800',
      'pending_manager_approval': 'bg-yellow-100 text-yellow-800',
      'manager_approved': 'bg-green-100 text-green-800',
      'rm_allocation_pending': 'bg-orange-100 text-orange-800',
      'ready_for_production': 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStepStatus = (step, currentStatus) => {
    const statusOrder = [
      'submitted',
      'mo_approved', 
      'rm_allocated',
      'in_progress',
      'completed'
    ];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'current':
        return '🔄';
      default:
        return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workflow Status Tracker</h1>
              <p className="mt-1 text-sm text-gray-500">Track Manufacturing Order progress</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturing Order ID
              </label>
              <input
                type="text"
                value={moId}
                onChange={(e) => setMoId(e.target.value)}
                placeholder="Enter MO ID (e.g., MO-20240115-0001)"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={fetchWorkflowStatus}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Track Status'}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Workflow Status */}
        {workflowData && (
          <div className="space-y-8">
            {/* MO Overview */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Manufacturing Order Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">MO ID</p>
                  <p className="text-lg text-gray-900">{workflowData.mo.mo_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Product</p>
                  <p className="text-lg text-gray-900">{workflowData.mo.product_code?.product_code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Quantity</p>
                  <p className="text-lg text-gray-900">{workflowData.mo.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workflowData.mo.status)}`}>
                    {workflowData.mo.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Priority</p>
                  <p className="text-lg text-gray-900">{workflowData.mo.priority}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-lg text-gray-900">{new Date(workflowData.mo.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Workflow Progress</h2>
              <div className="flow-root">
                <ul className="-mb-8">
                  {[
                    { step: 'submitted', label: 'MO Submitted', description: 'Manufacturing order created and submitted for approval' },
                    { step: 'mo_approved', label: 'Manager Approved', description: 'MO approved by manager and ready for RM allocation' },
                    { step: 'rm_allocated', label: 'RM Allocated', description: 'Raw materials allocated by RM store' },
                    { step: 'in_progress', label: 'In Progress', description: 'Production processes are being executed' },
                    { step: 'completed', label: 'Completed', description: 'Manufacturing order completed and ready for dispatch' }
                  ].map((workflowStep, index) => {
                    const stepStatus = getStepStatus(workflowStep.step, workflowData.mo.status);
                    return (
                      <li key={workflowStep.step}>
                        <div className="relative pb-8">
                          {index !== 4 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                stepStatus === 'completed' ? 'bg-green-500' :
                                stepStatus === 'current' ? 'bg-blue-500' : 'bg-gray-300'
                              }`}>
                                <span className="text-white text-sm">{getStepIcon(stepStatus)}</span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className={`text-sm font-medium ${
                                  stepStatus === 'completed' ? 'text-green-600' :
                                  stepStatus === 'current' ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                  {workflowStep.label}
                                </p>
                                <p className="text-sm text-gray-500">{workflowStep.description}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {stepStatus === 'completed' && (
                                  <span className="text-green-600">✓ Completed</span>
                                )}
                                {stepStatus === 'current' && (
                                  <span className="text-blue-600">In Progress</span>
                                )}
                                {stepStatus === 'pending' && (
                                  <span>Pending</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Batches */}
            {workflowData.batches.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Batches</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workflowData.batches.map((batch) => (
                        <tr key={batch.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {batch.batch_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {batch.planned_quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}>
                              {batch.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${batch.progress_percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500">{batch.progress_percentage}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(batch.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Process Executions */}
            {workflowData.processExecutions.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Process Executions</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sequence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workflowData.processExecutions.map((processExecution) => (
                        <tr key={processExecution.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {processExecution.process?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {processExecution.sequence_order}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {processExecution.assigned_operator ? 
                              `${processExecution.assigned_operator.first_name} ${processExecution.assigned_operator.last_name}` : 
                              'Not Assigned'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(processExecution.status)}`}>
                              {processExecution.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${processExecution.progress_percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500">{processExecution.progress_percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

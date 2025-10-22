'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OperatorDashboard() {
  const router = useRouter();
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [processForm, setProcessForm] = useState({
    location: '',
    notes: '',
    quantity_processed: ''
  });

  useEffect(() => {
    fetchAssignedBatches();
  }, []);

  const fetchAssignedBatches = async () => {
    try {
      // Get current user's assigned batches
      const response = await fetch('/api/manufacturing/batch-allocations/?allocated_to_operator=current');
      const data = await response.json();
      setAssignedBatches(data.results || []);
    } catch (error) {
      console.error('Error fetching assigned batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReceiveModal = (batch) => {
    setSelectedBatch(batch);
    setShowReceiveModal(true);
    setProcessForm({
      location: '',
      notes: '',
      quantity_processed: ''
    });
  };

  const openCompleteModal = (batch) => {
    setSelectedBatch(batch);
    setShowCompleteModal(true);
    setProcessForm({
      location: '',
      notes: '',
      quantity_processed: ''
    });
  };

  const handleReceiveBatch = async () => {
    try {
      const response = await fetch('/api/manufacturing/workflow/receive-batch/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allocation_id: selectedBatch.allocation_id,
          location: processForm.location,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Batch received successfully!');
        setShowReceiveModal(false);
        setSelectedBatch(null);
        fetchAssignedBatches();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error receiving batch:', error);
      alert('Error receiving batch');
    }
  };

  const handleCompleteProcess = async () => {
    try {
      const response = await fetch('/api/manufacturing/workflow/complete-process/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allocation_id: selectedBatch.allocation_id,
          completion_notes: processForm.notes,
          quantity_processed: parseInt(processForm.quantity_processed),
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Process completed successfully!');
        setShowCompleteModal(false);
        setSelectedBatch(null);
        fetchAssignedBatches();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error completing process:', error);
      alert('Error completing process');
    }
  };

  const logProcessAction = async (action, notes = '') => {
    try {
      const response = await fetch('/api/manufacturing/process-execution-logs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_allocation: selectedBatch.allocation_id,
          action: action,
          notes: notes,
          location: processForm.location,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`${action} logged successfully`);
      }
    } catch (error) {
      console.error(`Error logging ${action}:`, error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'allocated': 'bg-blue-100 text-blue-800',
      'received': 'bg-green-100 text-green-800',
      'in_process': 'bg-purple-100 text-purple-800',
      'completed': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assigned batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Operator Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Execute Assigned Processes</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/operator/notifications')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Notifications
              </button>
              <button
                onClick={() => router.push('/operator/dashboard')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Assigned Batches</p>
                <p className="text-2xl font-semibold text-gray-900">{assignedBatches.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Received</p>
                <p className="text-2xl font-semibold text-gray-900">{assignedBatches.filter(b => b.status === 'received').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Process</p>
                <p className="text-2xl font-semibold text-gray-900">{assignedBatches.filter(b => b.status === 'in_process').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{assignedBatches.filter(b => b.status === 'completed').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Batches Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Assigned Batches</h3>
            <p className="mt-1 text-sm text-gray-500">Receive batches and execute processes</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MO ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignedBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.batch_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{batch.mo?.mo_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{batch.allocated_to_process?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{batch.product_code?.product_code}</div>
                      <div className="text-sm text-gray-500">{batch.product_code?.part_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{batch.planned_quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(batch.mo?.priority)}`}>
                        {batch.mo?.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {batch.status === 'allocated' && (
                          <button
                            onClick={() => openReceiveModal(batch)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Receive
                          </button>
                        )}
                        {batch.status === 'received' && (
                          <button
                            onClick={() => openCompleteModal(batch)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/operator/batch-details/${batch.id}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {assignedBatches.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned batches</h3>
              <p className="mt-1 text-sm text-gray-500">No batches have been assigned to you yet.</p>
            </div>
          )}
        </div>

        {/* Current Process Status */}
        {currentProcess && (
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Current Process</h3>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentProcess.process_name}</p>
                  <p className="text-sm text-gray-500">Batch: {currentProcess.batch_id}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => logProcessAction('paused', 'Process paused by operator')}
                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => logProcessAction('resumed', 'Process resumed by operator')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                  >
                    Resume
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Receive Batch Modal */}
      {showReceiveModal && selectedBatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mt-2 px-7 py-3">
                <h3 className="text-lg font-medium text-gray-900 text-center">Receive Batch</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 text-center">
                    Batch ID: <span className="font-medium">{selectedBatch.batch_id}</span>
                  </p>
                  <p className="text-sm text-gray-500 text-center">
                    Process: <span className="font-medium">{selectedBatch.allocated_to_process?.name}</span>
                  </p>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={processForm.location}
                    onChange={(e) => setProcessForm({...processForm, location: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter current location..."
                  />
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleReceiveBatch}
                    className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                  >
                    Receive Batch
                  </button>
                  <button
                    onClick={() => setShowReceiveModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Process Modal */}
      {showCompleteModal && selectedBatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mt-2 px-7 py-3">
                <h3 className="text-lg font-medium text-gray-900 text-center">Complete Process</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 text-center">
                    Batch ID: <span className="font-medium">{selectedBatch.batch_id}</span>
                  </p>
                  <p className="text-sm text-gray-500 text-center">
                    Process: <span className="font-medium">{selectedBatch.allocated_to_process?.name}</span>
                  </p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity Processed</label>
                    <input
                      type="number"
                      value={processForm.quantity_processed}
                      onChange={(e) => setProcessForm({...processForm, quantity_processed: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter quantity processed..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completion Notes</label>
                    <textarea
                      value={processForm.notes}
                      onChange={(e) => setProcessForm({...processForm, notes: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Add any notes about the completion..."
                    />
                  </div>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleCompleteProcess}
                    className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    Complete Process
                  </button>
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

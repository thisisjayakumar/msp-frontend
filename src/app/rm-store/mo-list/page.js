'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RMStoreDashboard() {
  const router = useRouter();
  const [approvedMOs, setApprovedMOs] = useState([]);
  const [heatNumbers, setHeatNumbers] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMO, setSelectedMO] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    process_id: '',
    operator_id: '',
    heat_number_ids: [],
    location: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [moResponse, heatResponse, processResponse, operatorResponse] = await Promise.all([
        fetch('/api/manufacturing/manufacturing-orders/?status=mo_approved'),
        fetch('/api/inventory/heat-numbers/?is_available=true'),
        fetch('/api/processes/processes/'),
        fetch('/api/authentication/users/?role=operator')
      ]);

      const [moData, heatData, processData, operatorData] = await Promise.all([
        moResponse.json(),
        heatResponse.json(),
        processResponse.json(),
        operatorResponse.json()
      ]);

      setApprovedMOs(moData.results || []);
      setHeatNumbers(heatData.results || []);
      setProcesses(processData.results || []);
      setOperators(operatorData.results || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBatchModal = (mo) => {
    setSelectedMO(mo);
    setShowBatchModal(true);
    setBatchForm({
      process_id: '',
      operator_id: '',
      heat_number_ids: [],
      location: ''
    });
  };

  const handleBatchAllocation = async () => {
    try {
      // First create batch
      const batchResponse = await fetch('/api/manufacturing/batches/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mo: selectedMO.id,
          product_code: selectedMO.product_code.id,
          planned_quantity: selectedMO.quantity,
          planned_start_date: selectedMO.planned_start_date,
          planned_end_date: selectedMO.planned_end_date,
        }),
      });

      const batchData = await batchResponse.json();
      
      if (batchData.id) {
        // Then allocate batch to process
        const allocationResponse = await fetch('/api/manufacturing/workflow/allocate-batch/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batch_id: batchData.id,
            process_id: batchForm.process_id,
            operator_id: batchForm.operator_id,
            heat_number_ids: batchForm.heat_number_ids,
          }),
        });

        const allocationData = await allocationResponse.json();
        
        if (allocationData.success) {
          alert('Batch allocated successfully!');
          setShowBatchModal(false);
          setSelectedMO(null);
          fetchData();
        } else {
          alert(`Error: ${allocationData.error}`);
        }
      } else {
        alert('Error creating batch');
      }
    } catch (error) {
      console.error('Error allocating batch:', error);
      alert('Error allocating batch');
    }
  };

  const allocateRMToMO = async (moId) => {
    try {
      const response = await fetch('/api/manufacturing/workflow/allocate-rm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mo_id: moId,
          allocation_notes: 'RM allocated by RM Store Manager',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('RM allocated successfully!');
        fetchData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error allocating RM:', error);
      alert('Error allocating RM');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'mo_approved': 'bg-green-100 text-green-800',
      'rm_allocated': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">RM Store Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage Raw Material Allocation and Batch Creation</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/rm-store/heat-numbers')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Heat Numbers
              </button>
              <button
                onClick={() => router.push('/rm-store/dashboard')}
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
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved MOs</p>
                <p className="text-2xl font-semibold text-gray-900">{approvedMOs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Heat Numbers</p>
                <p className="text-2xl font-semibold text-gray-900">{heatNumbers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Processes</p>
                <p className="text-2xl font-semibold text-gray-900">{processes.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Operators</p>
                <p className="text-2xl font-semibold text-gray-900">{operators.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Approved MOs Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Approved Manufacturing Orders</h3>
            <p className="mt-1 text-sm text-gray-500">Allocate raw materials and create batches</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MO ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RM Required</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedMOs.map((mo) => (
                  <tr key={mo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mo.mo_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mo.product_code?.product_code}</div>
                      <div className="text-sm text-gray-500">{mo.product_code?.part_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mo.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mo.rm_required_kg} kg</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(mo.status)}`}>
                        {mo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {mo.status === 'mo_approved' && (
                          <button
                            onClick={() => allocateRMToMO(mo.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Allocate RM
                          </button>
                        )}
                        {mo.status === 'rm_allocated' && (
                          <button
                            onClick={() => openBatchModal(mo)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Create Batch
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/rm-store/mo-details/${mo.id}`)}
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
          
          {approvedMOs.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No approved MOs</h3>
              <p className="mt-1 text-sm text-gray-500">No manufacturing orders are ready for RM allocation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Batch Creation Modal */}
      {showBatchModal && selectedMO && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="mt-2 px-7 py-3">
                <h3 className="text-lg font-medium text-gray-900 text-center">Create Batch</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 text-center">
                    MO ID: <span className="font-medium">{selectedMO.mo_id}</span>
                  </p>
                  <p className="text-sm text-gray-500 text-center">
                    Product: <span className="font-medium">{selectedMO.product_code?.product_code}</span>
                  </p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Process</label>
                    <select
                      value={batchForm.process_id}
                      onChange={(e) => setBatchForm({...batchForm, process_id: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select Process</option>
                      {processes.map((process) => (
                        <option key={process.id} value={process.id}>{process.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Operator</label>
                    <select
                      value={batchForm.operator_id}
                      onChange={(e) => setBatchForm({...batchForm, operator_id: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select Operator</option>
                      {operators.map((operator) => (
                        <option key={operator.id} value={operator.id}>{operator.first_name} {operator.last_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Heat Numbers</label>
                    <div className="mt-1 max-h-32 overflow-y-auto border border-gray-300 rounded-md">
                      {heatNumbers.map((heatNumber) => (
                        <label key={heatNumber.id} className="flex items-center px-3 py-2 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={batchForm.heat_number_ids.includes(heatNumber.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBatchForm({
                                  ...batchForm,
                                  heat_number_ids: [...batchForm.heat_number_ids, heatNumber.id]
                                });
                              } else {
                                setBatchForm({
                                  ...batchForm,
                                  heat_number_ids: batchForm.heat_number_ids.filter(id => id !== heatNumber.id)
                                });
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-900">
                            {heatNumber.heat_number} ({heatNumber.total_weight_kg} kg)
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      value={batchForm.location}
                      onChange={(e) => setBatchForm({...batchForm, location: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter location..."
                    />
                  </div>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleBatchAllocation}
                    className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    Create Batch
                  </button>
                  <button
                    onClick={() => setShowBatchModal(false)}
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

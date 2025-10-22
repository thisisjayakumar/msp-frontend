'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductionHeadDashboard() {
  const router = useRouter();
  const [rmAllocatedMOs, setRmAllocatedMOs] = useState([]);
  const [processExecutions, setProcessExecutions] = useState([]);
  const [operators, setOperators] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcessExecution, setSelectedProcessExecution] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    operator_id: '',
    supervisor_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [moResponse, processResponse, operatorResponse, supervisorResponse] = await Promise.all([
        fetch('/api/manufacturing/manufacturing-orders/?status=rm_allocated'),
        fetch('/api/manufacturing/process-executions/?status=pending'),
        fetch('/api/authentication/users/?role=operator'),
        fetch('/api/authentication/users/?role=supervisor')
      ]);

      const [moData, processData, operatorData, supervisorData] = await Promise.all([
        moResponse.json(),
        processResponse.json(),
        operatorResponse.json(),
        supervisorResponse.json()
      ]);

      setRmAllocatedMOs(moData.results || []);
      setProcessExecutions(processData.results || []);
      setOperators(operatorData.results || []);
      setSupervisors(supervisorData.results || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAssignmentModal = (processExecution) => {
    setSelectedProcessExecution(processExecution);
    setShowAssignmentModal(true);
    setAssignmentForm({
      operator_id: '',
      supervisor_id: ''
    });
  };

  const handleProcessAssignment = async () => {
    try {
      const response = await fetch('/api/manufacturing/workflow/assign-process/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mo_process_execution_id: selectedProcessExecution.id,
          operator_id: assignmentForm.operator_id,
          supervisor_id: assignmentForm.supervisor_id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Process assigned successfully!');
        setShowAssignmentModal(false);
        setSelectedProcessExecution(null);
        fetchData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error assigning process:', error);
      alert('Error assigning process');
    }
  };

  const handleProcessReassignment = async (assignmentId, newOperatorId, reason) => {
    try {
      const response = await fetch('/api/manufacturing/workflow/reassign-process/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
          new_operator_id: newOperatorId,
          reassignment_reason: reason,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Process reassigned successfully!');
        fetchData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error reassigning process:', error);
      alert('Error reassigning process');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'reassigned': 'bg-orange-100 text-orange-800',
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
              <h1 className="text-3xl font-bold text-gray-900">Production Head Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Assign Processes to Operators</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/production-head/notifications')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Notifications
              </button>
              <button
                onClick={() => router.push('/production-head/dashboard')}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">RM Allocated MOs</p>
                <p className="text-2xl font-semibold text-gray-900">{rmAllocatedMOs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Processes</p>
                <p className="text-2xl font-semibold text-gray-900">{processExecutions.filter(p => p.status === 'pending').length}</p>
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
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">{processExecutions.filter(p => p.status === 'in_progress').length}</p>
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
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{processExecutions.filter(p => p.status === 'completed').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Process Executions Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Process Executions</h3>
            <p className="mt-1 text-sm text-gray-500">Assign processes to operators and track progress</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MO ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sequence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processExecutions.map((processExecution) => (
                  <tr key={processExecution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{processExecution.mo?.mo_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{processExecution.process?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{processExecution.sequence_order}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {processExecution.assigned_operator ? 
                          `${processExecution.assigned_operator.first_name} ${processExecution.assigned_operator.last_name}` : 
                          'Not Assigned'
                        }
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {processExecution.status === 'pending' && (
                          <button
                            onClick={() => openAssignmentModal(processExecution)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Assign
                          </button>
                        )}
                        {processExecution.status === 'assigned' && (
                          <button
                            onClick={() => openAssignmentModal(processExecution)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Reassign
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/production-head/process-details/${processExecution.id}`)}
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
          
          {processExecutions.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No process executions</h3>
              <p className="mt-1 text-sm text-gray-500">No processes are ready for assignment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedProcessExecution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="mt-2 px-7 py-3">
                <h3 className="text-lg font-medium text-gray-900 text-center">
                  {selectedProcessExecution.status === 'pending' ? 'Assign Process' : 'Reassign Process'}
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 text-center">
                    MO ID: <span className="font-medium">{selectedProcessExecution.mo?.mo_id}</span>
                  </p>
                  <p className="text-sm text-gray-500 text-center">
                    Process: <span className="font-medium">{selectedProcessExecution.process?.name}</span>
                  </p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Operator</label>
                    <select
                      value={assignmentForm.operator_id}
                      onChange={(e) => setAssignmentForm({...assignmentForm, operator_id: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select Operator</option>
                      {operators.map((operator) => (
                        <option key={operator.id} value={operator.id}>
                          {operator.first_name} {operator.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supervisor (Optional)</label>
                    <select
                      value={assignmentForm.supervisor_id}
                      onChange={(e) => setAssignmentForm({...assignmentForm, supervisor_id: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select Supervisor</option>
                      {supervisors.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.first_name} {supervisor.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleProcessAssignment}
                    className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {selectedProcessExecution.status === 'pending' ? 'Assign' : 'Reassign'}
                  </button>
                  <button
                    onClick={() => setShowAssignmentModal(false)}
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

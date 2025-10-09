"use client";

import { useState } from 'react';
import { XMarkIcon, CubeIcon, PlayIcon } from '@heroicons/react/24/outline';

export default function BatchSelectionModal({ 
  isOpen, 
  onClose, 
  batches = [], 
  processExecution, 
  onStartProcess 
}) {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [starting, setStarting] = useState(false);

  if (!isOpen) return null;

  const handleStartProcess = async () => {
    if (!selectedBatch) {
      alert('Please select a batch to start the process');
      return;
    }

    try {
      setStarting(true);
      await onStartProcess(processExecution, selectedBatch);
      onClose();
    } catch (error) {
      console.error('Error starting process:', error);
    } finally {
      setStarting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      created: 'bg-gray-100 text-gray-800',
      in_process: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center text-white">
              <CubeIcon className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-semibold">Select Batch for Process</h3>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Process Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">
                Starting Process: {processExecution?.process_name}
              </h4>
              <p className="text-sm text-blue-700">
                Select a batch to begin this process. Only batches with available material will be shown.
              </p>
            </div>

            {/* Batch Selection */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-slate-800">Available Batches</h4>
              
              {batches.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No batches available for this MO</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedBatch?.id === batch.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => setSelectedBatch(batch)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                              {selectedBatch?.id === batch.id && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-semibold text-slate-800">{batch.batch_id}</h5>
                            <p className="text-sm text-slate-600">
                              RM Allocated: {(batch.planned_quantity / 1000).toFixed(3)} kg
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                          {batch.status_display || batch.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Progress:</span>
                          <span className="ml-2 font-medium">{batch.progress_percentage || 0}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Created:</span>
                          <span className="ml-2 font-medium">{formatDate(batch.created_at)}</span>
                        </div>
                      </div>
                      
                      {batch.assigned_operator_name && (
                        <div className="mt-2 text-sm">
                          <span className="text-slate-500">Operator:</span>
                          <span className="ml-2 font-medium">{batch.assigned_operator_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleStartProcess}
              disabled={!selectedBatch || starting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <PlayIcon className="h-4 w-4" />
              <span>{starting ? 'Starting...' : 'Start Process'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

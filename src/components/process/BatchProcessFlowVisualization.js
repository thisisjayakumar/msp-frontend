"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronRightIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'Not set';
  try {
    return new Date(dateTime).toLocaleString();
  } catch (error) {
    return dateTime;
  }
};

export default function BatchProcessFlowVisualization({ 
  processExecutions = [], 
  batchData = { batches: [], summary: null },
  onStartBatchProcess,
  onCompleteBatchProcess,
  userRole = null,
  loadingStates = {}
}) {
  const [expandedProcesses, setExpandedProcesses] = useState(new Set());
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Toggle process expansion
  const toggleProcess = (processId) => {
    const newExpanded = new Set(expandedProcesses);
    if (newExpanded.has(processId)) {
      newExpanded.delete(processId);
    } else {
      newExpanded.add(processId);
    }
    setExpandedProcesses(newExpanded);
  };

  // Show message when no processes are available for the user
  if (!processExecutions.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Processes Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no processes assigned to your department for this manufacturing order.
          </p>
        </div>
      </div>
    );
  }

  // Get batch status in a specific process
  const getBatchProcessStatus = (batch, process) => {
    const notes = batch.notes || "";
    
    // Debug logging
    console.log(`Checking batch ${batch.batch_id} in process ${process.process_name}:`);
    console.log(`Batch notes: "${notes}"`);
    console.log(`Batch status: ${batch.status}`);
    
    // Handle both old Python dict format and new string format
    let processStatus = null;
    
    // Check new string format first
    const newProcessKey = `PROCESS_${process.id}_STATUS`;
    if (notes.includes(`${newProcessKey}:in_progress;`)) {
      processStatus = 'in_progress';
    } else if (notes.includes(`${newProcessKey}:completed;`)) {
      processStatus = 'completed';
    }
    
    // Check old Python dict format if new format not found
    if (!processStatus) {
      const oldProcessKey = `'process_${process.id}'`;
      if (notes.includes(oldProcessKey)) {
        // Look for the status within the same process block
        const processBlockStart = notes.indexOf(oldProcessKey);
        const processBlockEnd = notes.indexOf('}', processBlockStart);
        const processBlock = notes.substring(processBlockStart, processBlockEnd);
        
        if (processBlock.includes("'status': 'in_progress'")) {
          processStatus = 'in_progress';
        } else if (processBlock.includes("'status': 'completed'")) {
          processStatus = 'completed';
        }
      }
    }
    
    if (processStatus) {
      console.log(`Found ${processStatus} status for batch ${batch.batch_id} in process ${process.process_name}`);
      return processStatus;
    }
    
    // Check if batch has completed previous processes
    const processIndex = processExecutions.findIndex(p => p.id === process.id);
    const previousProcesses = processExecutions.slice(0, processIndex);
    
    // If this is the first process, check if batch is available
    if (processIndex === 0) {
      // For first process, if batch is created or in_process, it's available to start
      const status = ['created', 'in_process'].includes(batch.status) ? 'available' : 'waiting';
      console.log(`First process - batch status: ${batch.status}, returning: ${status}`);
      return status;
    }
    
    // For subsequent processes, check if batch completed all previous processes
    const completedPreviousProcesses = previousProcesses.every(prevProcess => {
      // Check both formats for previous process completion
      const newPrevKey = `PROCESS_${prevProcess.id}_STATUS`;
      const oldPrevKey = `'process_${prevProcess.id}'`;
      
      const completedNew = notes.includes(`${newPrevKey}:completed;`);
      const completedOld = notes.includes(oldPrevKey) && notes.includes("'status': 'completed'");
      
      const completed = completedNew || completedOld;
      console.log(`Previous process ${prevProcess.id} completed: ${completed}`);
      return completed;
    });
    
    if (!completedPreviousProcesses) {
      console.log(`Waiting for previous processes to complete`);
      return 'waiting';
    }
    
    console.log(`Previous processes completed, batch available`);
    return 'available';
  };

  // Check if batch can start in a process
  const canStartBatchInProcess = (batch, process) => {
    const status = getBatchProcessStatus(batch, process);
    return status === 'available' && userRole === 'supervisor';
  };

  // Check if batch can be completed in a process
  const canCompleteBatchInProcess = (batch, process) => {
    const status = getBatchProcessStatus(batch, process);
    return status === 'in_progress' && userRole === 'supervisor';
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    const statusMap = {
      available: {
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        icon: PlayIcon,
        bgColor: 'bg-blue-50'
      },
      in_progress: {
        color: 'bg-orange-100 text-orange-700 border-orange-300',
        icon: ClockIcon,
        bgColor: 'bg-orange-50'
      },
      completed: {
        color: 'bg-green-100 text-green-700 border-green-300',
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50'
      },
      waiting: {
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: PauseIcon,
        bgColor: 'bg-gray-50'
      }
    };
    return statusMap[status] || statusMap.waiting;
  };

  // Calculate overall progress for each batch
  const calculateBatchProgress = (batch) => {
    if (!processExecutions.length) return 0;
    
    // Count completed processes by checking batch notes
    let completedProcesses = 0;
    const notes = batch.notes || "";
    
    processExecutions.forEach(process => {
      const processKey = `PROCESS_${process.id}_STATUS`;
      if (notes.includes(`${processKey}:completed;`)) {
        completedProcesses++;
      }
    });
    
    return Math.round((completedProcesses / processExecutions.length) * 100);
  };

  if (!processExecutions.length) {
    return (
      <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl">
        <div className="text-6xl mb-4">🏭</div>
        <h3 className="text-xl font-medium text-slate-600 mb-2">No Processes Initialized</h3>
        <p className="text-slate-500">Initialize processes to start tracking production flow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Batch Overview */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Batch Production Flow</h3>
          <div className="text-sm text-slate-600">
            {batchData.batches.length} Batch{batchData.batches.length !== 1 ? 'es' : ''} • {processExecutions.length} Processes
          </div>
        </div>

        {/* Batch Progress Summary */}
        <div className="grid gap-4 mb-6">
          {batchData.batches.map((batch) => (
            <div key={batch.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 border flex items-center justify-center text-xs font-medium text-blue-700">
                  {batch.batch_id.slice(-2)}
                </div>
                <div>
                  <div className="font-medium text-slate-800">{batch.batch_id}</div>
                  <div className="text-xs text-slate-500">
                    RM: {(batch.planned_quantity / 1000).toFixed(3)} kg
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700">
                    {calculateBatchProgress(batch)}% Complete
                  </div>
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                      style={{ width: `${calculateBatchProgress(batch)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Process Flow with Batch Tracking */}
      <div className="space-y-4">
        {processExecutions
          .sort((a, b) => a.sequence_order - b.sequence_order)
          .map((process, processIndex) => {
            const isExpanded = expandedProcesses.has(process.id);

            return (
              <div key={process.id} className="relative">
                {/* Connection Line to Next Process */}
                {processIndex < processExecutions.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-8 bg-slate-300 z-0" />
                )}

                {/* Process Card */}
                <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-xl border-2 border-slate-200 p-6">
                  {/* Process Header */}
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleProcess(process.id)}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Sequence Number */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-bold text-lg">
                        {process.sequence_order}
                      </div>

                      {/* Process Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="text-lg font-semibold text-slate-800">
                            {process.process_name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span>Code: {process.process_code}</span>
                          {process.assigned_operator_name && (
                            <span>Operator: {process.assigned_operator_name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProcess(process.id);
                      }}
                      className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                    >
                      <ChevronRightIcon 
                        className={`h-5 w-5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Batch Status in This Process */}
                  {isExpanded && (
                    <div className="mt-6 border-t border-slate-200/60 pt-4">
                      <h5 className="text-sm font-medium text-slate-700 mb-3">
                        Batch Status in {process.process_name}
                      </h5>
                      <div className="space-y-3">
                        {batchData.batches.map((batch) => {
                          const batchStatus = getBatchProcessStatus(batch, process);
                          const statusInfo = getStatusInfo(batchStatus);
                          const StatusIcon = statusInfo.icon;
                          const canStart = canStartBatchInProcess(batch, process);
                          const canComplete = canCompleteBatchInProcess(batch, process);
                          const isLoading = loadingStates[`${batch.id}_${process.id}`];

                          return (
                            <div
                              key={batch.id}
                              className={`flex items-center justify-between p-4 rounded-lg border-2 ${statusInfo.color}`}
                              style={{ background: `linear-gradient(135deg, ${statusInfo.bgColor} 0%, white 100%)` }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border flex items-center justify-center text-xs font-medium">
                                  {batch.batch_id.slice(-2)}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-800">
                                    {batch.batch_id}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    RM: {(batch.planned_quantity / 1000).toFixed(3)} kg
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                {/* Status */}
                                <div className="flex items-center space-x-2">
                                  <StatusIcon className="h-4 w-4" />
                                  <span className="text-sm font-medium capitalize">
                                    {batchStatus.replace('_', ' ')}
                                  </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                  {canStart && (
                                    <button
                                      onClick={() => onStartBatchProcess?.(batch, process)}
                                      disabled={isLoading}
                                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                                    >
                                      <PlayIcon className="h-3 w-3" />
                                      <span>{isLoading ? 'Starting...' : 'Start'}</span>
                                    </button>
                                  )}
                                  
                                  {canComplete && (
                                    <button
                                      onClick={() => onCompleteBatchProcess?.(batch, process)}
                                      disabled={isLoading}
                                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                                    >
                                      <CheckCircleIcon className="h-3 w-3" />
                                      <span>{isLoading ? 'Completing...' : 'Complete'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

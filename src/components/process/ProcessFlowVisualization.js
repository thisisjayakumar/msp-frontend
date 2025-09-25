"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronRightIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

export default function ProcessFlowVisualization({ 
  processExecutions = [], 
  onProcessClick, 
  onStepClick,
  showSteps = true,
  compact = false 
}) {
  const [expandedProcesses, setExpandedProcesses] = useState(new Set());
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const containerRef = useRef(null);

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

  // Get status color and icon
  const getStatusInfo = (status, isOverdue = false) => {
    const statusMap = {
      pending: {
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: ClockIcon,
        bgColor: 'bg-gray-50',
        progressColor: 'bg-gray-200'
      },
      in_progress: {
        color: isOverdue ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300',
        icon: PlayIcon,
        bgColor: isOverdue ? 'bg-red-50' : 'bg-blue-50',
        progressColor: isOverdue ? 'bg-red-200' : 'bg-blue-200'
      },
      completed: {
        color: 'bg-green-100 text-green-700 border-green-300',
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50',
        progressColor: 'bg-green-200'
      },
      on_hold: {
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: PauseIcon,
        bgColor: 'bg-yellow-50',
        progressColor: 'bg-yellow-200'
      },
      failed: {
        color: 'bg-red-100 text-red-700 border-red-300',
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-red-50',
        progressColor: 'bg-red-200'
      },
      skipped: {
        color: 'bg-gray-100 text-gray-500 border-gray-200',
        icon: ChevronRightIcon,
        bgColor: 'bg-gray-25',
        progressColor: 'bg-gray-100'
      }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!processExecutions.length) return 0;
    const totalProgress = processExecutions.reduce((sum, exec) => sum + (exec.progress_percentage || 0), 0);
    return Math.round(totalProgress / processExecutions.length);
  };

  // Get quality status color
  const getQualityColor = (qualityStatus) => {
    const qualityMap = {
      pending: 'text-gray-500',
      passed: 'text-green-600',
      failed: 'text-red-600',
      rework_required: 'text-orange-600'
    };
    return qualityMap[qualityStatus] || 'text-gray-500';
  };

  const overallProgress = calculateOverallProgress();

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
    <div ref={containerRef} className="space-y-6">
      {/* Overall Progress Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Production Flow</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600">Overall Progress</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">{overallProgress}%</span>
            </div>
          </div>
        </div>

        {/* Process Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['pending', 'in_progress', 'completed', 'failed'].map(status => {
            const count = processExecutions.filter(exec => exec.status === status).length;
            const statusInfo = getStatusInfo(status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={status} className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <StatusIcon className="h-4 w-4 text-slate-600" />
                  <span className="text-2xl font-bold text-slate-800">{count}</span>
                </div>
                <span className="text-xs text-slate-500 capitalize">{status.replace('_', ' ')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Process Flow */}
      <div className="space-y-4">
        {processExecutions
          .sort((a, b) => a.sequence_order - b.sequence_order)
          .map((execution, index) => {
            const statusInfo = getStatusInfo(execution.status, execution.is_overdue);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedProcesses.has(execution.id);
            const hasSteps = execution.step_executions && execution.step_executions.length > 0;
            const completedSteps = execution.completed_steps || 0;
            const totalSteps = execution.step_count || 0;

            return (
              <div key={execution.id} className="relative">
                {/* Connection Line to Next Process */}
                {index < processExecutions.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-8 bg-slate-300 z-0" />
                )}

                {/* Process Card */}
                <div 
                  className={`relative z-10 bg-white/90 backdrop-blur-sm rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${statusInfo.color} ${
                    compact ? 'p-4' : 'p-6'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${statusInfo.bgColor} 0%, white 100%)`
                  }}
                >
                  {/* Process Header */}
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      toggleProcess(execution.id);
                      onProcessClick?.(execution);
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Sequence Number */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/80 border-2 border-current flex items-center justify-center font-bold text-lg">
                        {execution.sequence_order}
                      </div>

                      {/* Process Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="text-lg font-semibold text-slate-800">
                            {execution.process_name}
                          </h4>
                          <StatusIcon className="h-5 w-5" />
                          {execution.is_overdue && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                              Overdue
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span>Code: {execution.process_code}</span>
                          {execution.assigned_operator_name && (
                            <span>Operator: {execution.assigned_operator_name}</span>
                          )}
                          {totalSteps > 0 && (
                            <span>Steps: {completedSteps}/{totalSteps}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress and Controls */}
                    <div className="flex items-center space-x-4">
                      {/* Progress Circle */}
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-slate-200"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - (execution.progress_percentage || 0) / 100)}`}
                            className="transition-all duration-1000 ease-out"
                            style={{ color: statusInfo.color.includes('green') ? '#10b981' : statusInfo.color.includes('blue') ? '#3b82f6' : '#6b7280' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-700">
                            {Math.round(execution.progress_percentage || 0)}%
                          </span>
                        </div>
                      </div>

                      {/* Expand/Collapse */}
                      {hasSteps && showSteps && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProcess(execution.id);
                          }}
                          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                        >
                          <ChevronRightIcon 
                            className={`h-5 w-5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-90' : ''
                            }`} 
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timing Information */}
                  {!compact && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 font-medium">Planned Start:</span>
                        <div className="text-slate-700">
                          {execution.planned_start_time 
                            ? new Date(execution.planned_start_time).toLocaleString()
                            : 'Not set'
                          }
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Actual Start:</span>
                        <div className="text-slate-700">
                          {execution.actual_start_time 
                            ? new Date(execution.actual_start_time).toLocaleString()
                            : 'Not started'
                          }
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Planned End:</span>
                        <div className="text-slate-700">
                          {execution.planned_end_time 
                            ? new Date(execution.planned_end_time).toLocaleString()
                            : 'Not set'
                          }
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Duration:</span>
                        <div className="text-slate-700">
                          {execution.duration_minutes 
                            ? `${execution.duration_minutes} min`
                            : 'In progress'
                          }
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Process Steps */}
                  {isExpanded && hasSteps && showSteps && (
                    <div className="mt-6 border-t border-slate-200/60 pt-4">
                      <h5 className="text-sm font-medium text-slate-700 mb-3">Process Steps</h5>
                      <div className="space-y-2">
                        {execution.step_executions
                          .sort((a, b) => a.process_step?.sequence_order - b.process_step?.sequence_order)
                          .map((stepExecution, stepIndex) => {
                            const stepStatusInfo = getStatusInfo(stepExecution.status);
                            const StepIcon = stepStatusInfo.icon;
                            
                            return (
                              <div
                                key={stepExecution.id}
                                className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-slate-200/40 hover:bg-white/80 transition-colors cursor-pointer"
                                onClick={() => onStepClick?.(stepExecution)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border flex items-center justify-center text-xs font-medium">
                                    {stepIndex + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium text-slate-800">
                                      {stepExecution.process_step_name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {stepExecution.process_step_code}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  {/* Quality Status */}
                                  {stepExecution.quality_status && stepExecution.quality_status !== 'pending' && (
                                    <span className={`text-xs font-medium ${getQualityColor(stepExecution.quality_status)}`}>
                                      {stepExecution.quality_status_display}
                                    </span>
                                  )}

                                  {/* Efficiency */}
                                  {stepExecution.efficiency_percentage > 0 && (
                                    <span className="text-xs text-slate-600">
                                      {Math.round(stepExecution.efficiency_percentage)}% eff.
                                    </span>
                                  )}

                                  {/* Status */}
                                  <div className="flex items-center space-x-1">
                                    <StepIcon className="h-4 w-4" />
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stepStatusInfo.color}`}>
                                      {stepExecution.status_display}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Alerts */}
                  {execution.alerts && execution.alerts.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          {execution.alerts.length} Active Alert{execution.alerts.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      {execution.alerts.slice(0, 2).map(alert => (
                        <div key={alert.id} className="text-sm text-red-700 mb-1">
                          • {alert.title}
                        </div>
                      ))}
                      {execution.alerts.length > 2 && (
                        <div className="text-xs text-red-600">
                          +{execution.alerts.length - 2} more alerts
                        </div>
                      )}
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

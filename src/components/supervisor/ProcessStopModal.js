"use client";

import { useState } from 'react';
import { XMarkIcon, PauseCircleIcon } from '@heroicons/react/24/outline';
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';

export default function ProcessStopModal({ batch, processExecution, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    stop_reason: '',
    stop_reason_detail: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const stopReasons = [
    { value: 'machine_breakdown', label: 'Machine Breakdown / Repair' },
    { value: 'power_cut', label: 'Power Cut' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'material_shortage', label: 'Material Shortage' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'others', label: 'Others' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.stop_reason) {
      newErrors.stop_reason = 'Stop reason is required';
    }

    if (formData.stop_reason === 'others' && !formData.stop_reason_detail.trim()) {
      newErrors.stop_reason_detail = 'Please provide details for "Others" reason';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      await processSupervisorAPI.stopProcess({
        batch_id: batch.id,
        process_execution_id: processExecution.id,
        stop_reason: formData.stop_reason,
        stop_reason_detail: formData.stop_reason_detail.trim()
      });

      alert(`Process stopped successfully for batch ${batch.batch_id}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error stopping process:', error);
      alert(`Failed to stop process: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <PauseCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Stop Process</h2>
              <p className="text-sm text-slate-600">Batch: {batch.batch_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Process Details */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Process Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Process:</span>
                <span className="font-medium">{processExecution.process_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className="font-medium">{processExecution.status_display || processExecution.status}</span>
              </div>
              {processExecution.actual_start_time && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Started:</span>
                  <span className="font-medium">{new Date(processExecution.actual_start_time).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stop Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Stop Reason *
            </label>
            <select
              name="stop_reason"
              value={formData.stop_reason}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.stop_reason ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="">Select stop reason</option>
              {stopReasons.map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.stop_reason && (
              <p className="mt-1 text-sm text-red-600">{errors.stop_reason}</p>
            )}
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Details {formData.stop_reason === 'others' && '*'}
            </label>
            <textarea
              name="stop_reason_detail"
              value={formData.stop_reason_detail}
              onChange={handleInputChange}
              rows={4}
              placeholder={formData.stop_reason === 'others' ? 'Please describe the reason for stopping...' : 'Optional: Provide more details...'}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.stop_reason_detail ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.stop_reason_detail && (
              <p className="mt-1 text-sm text-red-600">{errors.stop_reason_detail}</p>
            )}
          </div>

          {/* Warning Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <PauseCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>The process will be paused immediately</li>
                  <li>Downtime will be tracked automatically</li>
                  <li>PH and Manager will be notified</li>
                  <li>You can resume the process when ready</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Stopping...</span>
                </>
              ) : (
                <>
                  <PauseCircleIcon className="h-4 w-4" />
                  <span>Stop Process</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


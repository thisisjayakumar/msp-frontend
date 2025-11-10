"use client";

import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';

export default function BatchReceiptVerifyModal({ batch, processExecution, expectedQuantity, onClose, onSuccess }) {
  const [mode, setMode] = useState('verify'); // 'verify' or 'report'
  const [formData, setFormData] = useState({
    report_reason: '',
    report_detail: '',
    actual_received_quantity: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const reportReasons = [
    { value: 'low_qty_received', label: 'Low Qty Received', requiresActual: true },
    { value: 'high_qty_received', label: 'High Qty Received', requiresActual: true },
    { value: 'damaged_defective', label: 'Damaged / Defective Parts', requiresActual: false },
    { value: 'wrong_product', label: 'Wrong Product Received', requiresActual: false },
    { value: 'others', label: 'Others', requiresActual: false }
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

  const validateReportForm = () => {
    const newErrors = {};

    if (!formData.report_reason) {
      newErrors.report_reason = 'Report reason is required';
    }

    const selectedReason = reportReasons.find(r => r.value === formData.report_reason);
    
    if (selectedReason?.requiresActual && !formData.actual_received_quantity) {
      newErrors.actual_received_quantity = 'Actual received quantity is required for this reason';
    }

    if (formData.actual_received_quantity && isNaN(parseFloat(formData.actual_received_quantity))) {
      newErrors.actual_received_quantity = 'Actual quantity must be a valid number';
    }

    if (formData.report_reason === 'others' && !formData.report_detail.trim()) {
      newErrors.report_detail = 'Please provide details for "Others" reason';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      
      await processSupervisorAPI.verifyBatchReceipt({
        batch_id: batch.id,
        process_id: processExecution.process_id || processExecution.id,
        received_quantity: expectedQuantity,
        is_verified: true
      });

      alert(`Batch ${batch.batch_id} verified successfully!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error verifying batch:', error);
      alert(`Failed to verify batch: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();

    if (!validateReportForm()) {
      return;
    }

    try {
      setLoading(true);
      
      await processSupervisorAPI.reportBatchIssue({
        batch_id: batch.id,
        process_id: processExecution.process_id || processExecution.id,
        received_quantity: expectedQuantity,
        is_reported: true,
        report_reason: formData.report_reason,
        report_detail: formData.report_detail.trim(),
        actual_received_quantity_on_report: formData.actual_received_quantity 
          ? parseFloat(formData.actual_received_quantity) 
          : null
      });

      alert(`Issue reported successfully for batch ${batch.batch_id}. Batch moved to On Hold.`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error reporting batch issue:', error);
      alert(`Failed to report issue: ${error.message}`);
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
            <div className={`p-2 rounded-lg ${mode === 'verify' ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {mode === 'verify' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {mode === 'verify' ? 'Verify Batch Receipt' : 'Report Issue'}
              </h2>
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Batch Details */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Batch Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">MO ID:</span>
                <span className="font-medium">{batch.mo_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Process:</span>
                <span className="font-medium">{processExecution.process_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Expected Quantity:</span>
                <span className="font-medium text-blue-700">{expectedQuantity.toFixed(3)} kg</span>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          {mode === 'verify' ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Verify Receipt</p>
                    <p className="text-green-700">
                      Click "Verify" to confirm that you received the correct quantity and the batch is in good condition.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Or</p>
                <button
                  onClick={() => setMode('report')}
                  className="text-yellow-600 hover:text-yellow-700 font-medium text-sm underline"
                >
                  Report an issue with this batch
                </button>
              </div>

              {/* Verify Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Verify Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleReport} className="space-y-6">
              {/* Report Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Report Reason *
                </label>
                <select
                  name="report_reason"
                  value={formData.report_reason}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                    errors.report_reason ? 'border-red-500' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select report reason</option>
                  {reportReasons.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                {errors.report_reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.report_reason}</p>
                )}
              </div>

              {/* Actual Received Quantity (conditional) */}
              {reportReasons.find(r => r.value === formData.report_reason)?.requiresActual && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Actual Received Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    name="actual_received_quantity"
                    value={formData.actual_received_quantity}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                      errors.actual_received_quantity ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.actual_received_quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.actual_received_quantity}</p>
                  )}
                </div>
              )}

              {/* Report Details */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Details {formData.report_reason === 'others' && '*'}
                </label>
                <textarea
                  name="report_detail"
                  value={formData.report_detail}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder={formData.report_reason === 'others' ? 'Please describe the issue...' : 'Optional: Provide more details...'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                    errors.report_detail ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.report_detail && (
                  <p className="mt-1 text-sm text-red-600">{errors.report_detail}</p>
                )}
              </div>

              {/* Warning Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>This batch will be moved to "On Hold" status</li>
                      <li>PH will be notified to review the issue</li>
                      <li>Batch will return to "To Process" after PH clears it</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('verify');
                    setErrors({});
                  }}
                  className="text-green-600 hover:text-green-700 font-medium text-sm underline"
                >
                  Back to Verify
                </button>
              </div>

              {/* Report Actions */}
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
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Reporting...</span>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <span>Report Issue</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


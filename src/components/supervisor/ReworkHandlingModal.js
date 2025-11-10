"use client";

import { useState, useMemo } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';

export default function ReworkHandlingModal({ batch, processExecution, isReworkCompletion = false, reworkBatch = null, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    ok_quantity: '',
    scrap_quantity: '',
    rework_quantity: '',
    completion_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculate available quantity
  const availableQuantity = useMemo(() => {
    if (isReworkCompletion && reworkBatch) {
      return reworkBatch.rework_quantity || 0;
    }
    return batch.planned_quantity || 0;
  }, [isReworkCompletion, reworkBatch, batch]);

  // Calculate total entered quantity
  const totalEntered = useMemo(() => {
    const ok = parseFloat(formData.ok_quantity) || 0;
    const scrap = parseFloat(formData.scrap_quantity) || 0;
    const rework = parseFloat(formData.rework_quantity) || 0;
    return ok + scrap + rework;
  }, [formData]);

  // Check if quantities match
  const quantitiesMatch = useMemo(() => {
    return Math.abs(totalEntered - availableQuantity) < 0.001; // Allow small floating point differences
  }, [totalEntered, availableQuantity]);

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

    const ok = parseFloat(formData.ok_quantity) || 0;
    const scrap = parseFloat(formData.scrap_quantity) || 0;
    const rework = parseFloat(formData.rework_quantity) || 0;

    if (ok < 0) {
      newErrors.ok_quantity = 'OK quantity cannot be negative';
    }
    if (scrap < 0) {
      newErrors.scrap_quantity = 'Scrap quantity cannot be negative';
    }
    if (rework < 0) {
      newErrors.rework_quantity = 'Rework quantity cannot be negative';
    }

    if (ok === 0 && scrap === 0 && rework === 0) {
      newErrors.ok_quantity = 'At least one quantity must be greater than 0';
    }

    if (!quantitiesMatch) {
      newErrors.ok_quantity = `Total entered (${totalEntered.toFixed(3)} kg) must equal available quantity (${availableQuantity.toFixed(3)} kg)`;
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
      
      const completionData = {
        batch_id: batch.id,
        process_id: processExecution.process_id || processExecution.id,
        ok_quantity: parseFloat(formData.ok_quantity) || 0,
        scrap_quantity: parseFloat(formData.scrap_quantity) || 0,
        rework_quantity: parseFloat(formData.rework_quantity) || 0,
        completion_notes: formData.completion_notes.trim(),
        is_rework_completion: isReworkCompletion
      };

      if (isReworkCompletion && reworkBatch) {
        completionData.rework_batch_id = reworkBatch.id;
      }

      await processSupervisorAPI.completeBatchProcess(completionData);

      const message = isReworkCompletion 
        ? `Rework completed successfully for batch ${batch.batch_id}`
        : `Process completed successfully for batch ${batch.batch_id}`;
      
      alert(message);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error completing process:', error);
      alert(`Failed to complete process: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {isReworkCompletion ? 'Complete Rework' : 'Complete Process'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Process/Batch Details */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">
              {isReworkCompletion ? 'Rework Details' : 'Process Details'}
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Process:</span>
                <span className="font-medium">{processExecution.process_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Available Quantity:</span>
                <span className="font-medium text-blue-700">{availableQuantity.toFixed(3)} kg</span>
              </div>
              {isReworkCompletion && reworkBatch && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Rework Cycle:</span>
                  <span className="font-medium">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">
                      R{reworkBatch.rework_cycle}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quantity Inputs */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-700">
              Enter Quantities (in kg) *
            </h3>

            {/* OK Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                OK Quantity (Moves Forward)
              </label>
              <input
                type="number"
                name="ok_quantity"
                value={formData.ok_quantity}
                onChange={handleInputChange}
                step="0.001"
                min="0"
                placeholder="0.000"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.ok_quantity ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.ok_quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.ok_quantity}</p>
              )}
            </div>

            {/* Scrap Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Scrap Quantity (Added to Scrap Count)
              </label>
              <input
                type="number"
                name="scrap_quantity"
                value={formData.scrap_quantity}
                onChange={handleInputChange}
                step="0.001"
                min="0"
                placeholder="0.000"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.scrap_quantity ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.scrap_quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.scrap_quantity}</p>
              )}
            </div>

            {/* Rework Quantity */}
            {!isReworkCompletion && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rework Quantity (Stays with You)
                </label>
                <input
                  type="number"
                  name="rework_quantity"
                  value={formData.rework_quantity}
                  onChange={handleInputChange}
                  step="0.001"
                  min="0"
                  placeholder="0.000"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.rework_quantity ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.rework_quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.rework_quantity}</p>
                )}
              </div>
            )}
          </div>

          {/* Total Calculation */}
          <div className={`rounded-lg p-4 border-2 ${
            quantitiesMatch 
              ? 'bg-green-50 border-green-300' 
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Total Entered:</span>
              <span className="text-lg font-bold">{totalEntered.toFixed(3)} kg</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-medium text-slate-700">Available:</span>
              <span className="text-lg font-bold">{availableQuantity.toFixed(3)} kg</span>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              {quantitiesMatch ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Quantities match!</span>
                </>
              ) : (
                <>
                  <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-yellow-700 font-medium">
                    Difference: {Math.abs(totalEntered - availableQuantity).toFixed(3)} kg
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Completion Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="completion_notes"
              value={formData.completion_notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Add any notes about the completion..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">On Completion:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>OK quantity will be sent to next process</li>
                  <li>Scrap will be added to scrap count</li>
                  {!isReworkCompletion && <li>Rework will appear in your "Rework Pending" tab</li>}
                  <li>Next supervisor will be notified (if OK qty &gt; 0)</li>
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
              disabled={loading || !quantitiesMatch}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Complete Process</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


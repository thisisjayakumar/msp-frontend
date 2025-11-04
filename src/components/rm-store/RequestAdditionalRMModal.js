"use client";

import { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import additionalRMAPI from '../API_Service/additional-rm-api';
import { toast } from 'react-hot-toast';

export default function RequestAdditionalRMModal({ mo, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    additional_rm_requested_kg: '',
    reason: '',
    excess_batch_id: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [rmSummary, setRmSummary] = useState(null);
  const [latestBatch, setLatestBatch] = useState(null);

  useEffect(() => {
    if (mo) {
      // Calculate RM summary
      const summary = calculateRMSummary(mo);
      setRmSummary(summary);

      // Get latest batch (likely the one that exceeded limit)
      if (mo.batches && mo.batches.length > 0) {
        const sortedBatches = [...mo.batches].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setLatestBatch(sortedBatches[0]);
        setFormData(prev => ({ ...prev, excess_batch_id: sortedBatches[0].id }));
      }

      // Pre-fill reason with excess amount
      if (summary && summary.excess_kg > 0) {
        setFormData(prev => ({
          ...prev,
          additional_rm_requested_kg: summary.excess_kg.toFixed(3),
          reason: `Coil weight variance - Last batch exceeded allocated RM by ${summary.excess_kg.toFixed(3)} kg. Total RM released: ${summary.total_released_kg.toFixed(3)} kg, Allocated: ${summary.allocated_rm_kg.toFixed(3)} kg.`
        }));
      }
    }
  }, [mo]);

  const calculateRMSummary = (moData) => {
    const allocatedKg = parseFloat(moData.rm_required_kg || 0);
    const additionalApprovedKg = parseFloat(moData.additional_rm_approved_kg || 0);
    const totalLimitKg = allocatedKg + additionalApprovedKg;
    
    // Calculate total released from batches (convert grams to kg)
    const totalReleasedGrams = (moData.batches || []).reduce(
      (sum, batch) => sum + parseInt(batch.planned_quantity || 0),
      0
    );
    const totalReleasedKg = totalReleasedGrams / 1000;
    
    const excessKg = totalReleasedKg - allocatedKg;

    return {
      allocated_rm_kg: allocatedKg,
      additional_approved_kg: additionalApprovedKg,
      total_limit_kg: totalLimitKg,
      total_released_kg: totalReleasedKg,
      excess_kg: Math.max(0, excessKg),
      remaining_capacity_kg: totalLimitKg - totalReleasedKg
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.additional_rm_requested_kg || parseFloat(formData.additional_rm_requested_kg) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      setSubmitting(true);

      const requestData = {
        mo_id: mo.id,
        additional_rm_requested_kg: parseFloat(formData.additional_rm_requested_kg),
        reason: formData.reason.trim(),
        excess_batch_id: formData.excess_batch_id
      };

      const response = await additionalRMAPI.create(requestData);

      toast.success('Additional RM request submitted successfully! Pending Manager approval.');
      
      if (onSuccess) {
        onSuccess(response);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating additional RM request:', error);
      toast.error(error.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mo || !rmSummary) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Request Additional Raw Material
                </h3>
                <p className="text-sm text-gray-500">MO: {mo.mo_id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* RM Summary Alert */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">RM Limit Exceeded</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-red-600">Original Allocated:</span>
                <span className="ml-2 font-medium">{rmSummary.allocated_rm_kg.toFixed(3)} kg</span>
              </div>
              <div>
                <span className="text-red-600">Total Released:</span>
                <span className="ml-2 font-medium">{rmSummary.total_released_kg.toFixed(3)} kg</span>
              </div>
              <div>
                <span className="text-red-600">Excess Amount:</span>
                <span className="ml-2 font-medium text-red-700">{rmSummary.excess_kg.toFixed(3)} kg</span>
              </div>
              {rmSummary.additional_approved_kg > 0 && (
                <div>
                  <span className="text-red-600">Previously Approved:</span>
                  <span className="ml-2 font-medium">{rmSummary.additional_approved_kg.toFixed(3)} kg</span>
                </div>
              )}
            </div>
          </div>

          {/* Latest Batch Info */}
          {latestBatch && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Latest Batch (Likely Cause)</h4>
              <div className="text-sm text-blue-700">
                <p><strong>Batch ID:</strong> {latestBatch.batch_id}</p>
                <p><strong>RM Released:</strong> {(latestBatch.planned_quantity / 1000).toFixed(3)} kg</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Additional RM Requested */}
            <div>
              <label htmlFor="additional_rm_requested_kg" className="block text-sm font-medium text-gray-700 mb-1">
                Additional RM Requested (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="additional_rm_requested_kg"
                step="0.001"
                min="0.001"
                value={formData.additional_rm_requested_kg}
                onChange={(e) => setFormData({ ...formData, additional_rm_requested_kg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter additional RM quantity needed"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Suggested: {rmSummary.excess_kg.toFixed(3)} kg (current excess)
              </p>
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Additional RM <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Explain why additional RM is needed (e.g., coil weight variance, measurement error, etc.)"
                required
                minLength={10}
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum 10 characters. Be specific about the cause.
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">📋 What Happens Next?</h4>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Request will be sent to Manager and Production Head</li>
                <li>Production Head can view but cannot approve</li>
                <li>Only Manager can approve the request</li>
                <li>Once approved, you can release RM up to the new limit</li>
                <li>Status will appear as &quot;Pending Approval&quot; in the system</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


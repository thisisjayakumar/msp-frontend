"use client";

import { useState, useEffect } from 'react';
import manufacturingAPI from '../API_Service/manufacturing-api';
import Button from '../CommonComponents/ui/Button';
import { toast } from '@/utils/notifications';
import { XMarkIcon, CubeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function BatchCreateModal({ mo, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    planned_quantity: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [rmCalculation, setRmCalculation] = useState(null);
  const [batchSummary, setBatchSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch batch summary on mount
  useEffect(() => {
    const fetchBatchSummary = async () => {
      try {
        setLoading(true);
        const summary = await manufacturingAPI.batches.getMOBatchSummary(mo.id);
        setBatchSummary(summary);
      } catch (err) {
        console.error('Error fetching batch summary:', err);
        toast.error('Failed to load batch summary');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBatchSummary();
  }, [mo.id]);

  // Calculate RM requirements when quantity changes
  const handleQuantityChange = (e) => {
    const quantity = e.target.value;
    setFormData((prev) => ({ ...prev, planned_quantity: quantity }));

    if (quantity && parseFloat(quantity) > 0 && batchSummary) {
      calculateRM(parseFloat(quantity));
    } else {
      setRmCalculation(null);
    }
  };

  const calculateRM = (rmKg) => {
    // User enters RM directly in kg
    // We just apply tolerance to get final release amount
    
    const tolerance = batchSummary.tolerance_percentage || 2;
    const toleranceFactor = 1 + (tolerance / 100);
    const finalRmKg = rmKg * toleranceFactor;

    // Check if exceeds remaining
    const exceedsRemaining = finalRmKg > batchSummary.remaining_rm;

    setRmCalculation({
      type: 'coil',
      rm_base_kg: rmKg.toFixed(3),
      tolerance_percentage: tolerance,
      tolerance_amount: (finalRmKg - rmKg).toFixed(3),
      final_rm_kg: finalRmKg.toFixed(3),
      exceeds_remaining: exceedsRemaining,
      remaining_after: Math.max(0, batchSummary.remaining_rm - finalRmKg).toFixed(3)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.planned_quantity || parseFloat(formData.planned_quantity) <= 0) {
      toast.error('Please enter a valid RM quantity');
      return;
    }

    // Check if exceeds remaining RM
    if (rmCalculation && rmCalculation.exceeds_remaining) {
      toast.error(`Cannot exceed remaining RM allocation of ${batchSummary.remaining_rm.toFixed(3)} ${batchSummary.rm_unit}`);
      return;
    }

    try {
      setSubmitting(true);

      // Convert kg to grams (integer) for storage
      const rmKg = parseFloat(formData.planned_quantity);
      const rmGrams = Math.round(rmKg * 1000);
      
      const batchData = {
        mo_id: mo.id,
        planned_quantity: rmGrams, // Send as grams (integer)
        status: 'created'
      };

      console.log('Creating batch with data:', batchData);
      await manufacturingAPI.batches.create(batchData);
      
      toast.success('Batch created successfully! RM has been released and production can start.');
      onSuccess();
    } catch (err) {
      console.error('Error creating batch:', err);
      toast.error(err.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center text-white">
              <CubeIcon className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-semibold">Create New Batch</h3>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                <span className="ml-3 text-slate-600">Loading batch information...</span>
              </div>
            ) : (
              <>
                {/* MO Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Manufacturing Order Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">MO ID:</span>
                      <span className="ml-2 font-medium text-slate-800">{mo.mo_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Product:</span>
                      <span className="ml-2 font-medium text-slate-800">{mo.product_code?.product_code}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Total Quantity:</span>
                      <span className="ml-2 font-medium text-slate-800">{mo.quantity?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Material Type:</span>
                      <span className="ml-2 font-medium text-slate-800">{batchSummary?.material_type || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* RM Allocation Summary */}
                {batchSummary && (
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-cyan-800 mb-3">RM Allocation Summary</h4>
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Batch Completion Progress</span>
                          <span className="font-semibold text-cyan-700">{batchSummary.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-cyan-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${batchSummary.completion_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* RM Stats */}
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-white rounded p-2">
                          <div className="text-xs text-slate-600 mb-1">Total RM Required</div>
                          <div className="font-bold text-slate-800">
                            {batchSummary.total_rm_required} {batchSummary.rm_unit}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2">
                          <div className="text-xs text-slate-600 mb-1">Already Released</div>
                          <div className="font-bold text-orange-600">
                            {batchSummary.cumulative_rm_released.toFixed(3)} {batchSummary.rm_unit}
                          </div>
                        </div>
                        <div className="bg-white rounded p-2">
                          <div className="text-xs text-slate-600 mb-1">Remaining</div>
                          <div className="font-bold text-green-600">
                            {batchSummary.remaining_rm.toFixed(3)} {batchSummary.rm_unit}
                          </div>
                        </div>
                      </div>

                      {/* Existing Batches */}
                      {batchSummary.batch_count > 0 && (
                        <div className="text-xs text-slate-600 bg-white rounded p-2">
                          <span className="font-medium">{batchSummary.batch_count}</span> batch(es) already created for this MO
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Batch RM Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Batch RM Quantity ({batchSummary?.rm_unit || 'kg'}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={formData.planned_quantity}
                      onChange={handleQuantityChange}
                      className="w-full px-3 py-2 border border-gray-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder={`Enter RM amount in ${batchSummary?.rm_unit || 'kg'}`}
                      required
                      disabled={loading || !batchSummary}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter the raw material amount to allocate. Tolerance will be applied automatically.
                    </p>
                  </div>

                  {/* RM Calculation Display */}
                  {rmCalculation && (
                    <div className={`border rounded-lg p-4 ${rmCalculation.exceeds_remaining ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-center mb-2">
                        {rmCalculation.exceeds_remaining ? (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        )}
                        <h5 className={`text-sm font-semibold ${rmCalculation.exceeds_remaining ? 'text-red-800' : 'text-green-800'}`}>
                          {rmCalculation.exceeds_remaining ? 'Exceeds Available RM!' : 'Batch RM Requirements'}
                        </h5>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Base RM Amount:</span>
                          <span className="font-medium text-slate-800">{rmCalculation.rm_base_kg} {batchSummary.rm_unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Tolerance ({rmCalculation.tolerance_percentage}%):</span>
                          <span className="font-medium text-slate-800">+{rmCalculation.tolerance_amount} {batchSummary.rm_unit}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                          <span className="text-slate-600 font-medium">Total RM to Release:</span>
                          <span className={`font-bold ${rmCalculation.exceeds_remaining ? 'text-red-600' : 'text-cyan-600'}`}>
                            {rmCalculation.final_rm_kg} {batchSummary.rm_unit}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                          <span className="text-slate-600 font-medium">Remaining RM After:</span>
                          <span className={`font-bold ${rmCalculation.exceeds_remaining ? 'text-red-600' : 'text-green-600'}`}>
                            {rmCalculation.remaining_after} {batchSummary.rm_unit}
                          </span>
                        </div>
                      </div>
                      
                      {rmCalculation.exceeds_remaining && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                          <strong>Error:</strong> This batch requires more RM than available. Maximum allowed is {batchSummary.remaining_rm} {batchSummary.rm_unit}.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Warning message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Creating this batch will release the calculated raw materials and production will start immediately.
                    {batchSummary?.batch_count === 0 && ' This is the first batch, so the MO status will change to "In Progress".'}
                  </p>
                </div>
              </>
            )}
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <Button onClick={onClose} variant="secondary" disabled={submitting || loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="primary"
              disabled={
                submitting || 
                loading || 
                !formData.planned_quantity || 
                !batchSummary ||
                (rmCalculation && rmCalculation.exceeds_remaining)
              }
              className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Batch & Release RM'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import outsourcingAPI from '@/components/API_Service/outsourcing-api';

export default function ReceiveFromOutsourceModal({ isOpen, onClose, batch, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity_received_kg: '',
    status: 'ok', // 'ok' or 'rework'
    notes: ''
  });

  if (!isOpen || !batch) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const receivedKg = parseFloat(formData.quantity_received_kg);
      const sentKg = parseFloat(batch.total_kg || 0);
      const difference = sentKg - receivedKg;

      // Prepare return data
      const returnData = {
        collection_date: new Date().toISOString().split('T')[0],
        collected_by_id: 1, // TODO: Get actual user ID from profile
        returned_items: batch.items?.map(item => ({
          id: item.id,
          returned_qty: item.qty || 0,
          returned_kg: receivedKg / (batch.items?.length || 1) // Distribute evenly
        })) || [],
        status: formData.status,
        notes: formData.notes
      };

      const result = await outsourcingAPI.returnItems(batch.id, returnData);

      if (result && !result.error) {
        // Check if tolerance case (received < sent)
        if (difference > 0) {
          alert(`⚠️ Tolerance Case: Received ${difference.toFixed(3)} kg less than sent. This batch will be moved to "Checked/Cleared" tab for verification.`);
        } else if (difference < 0) {
          alert(`ℹ️ Received ${Math.abs(difference).toFixed(3)} kg more than sent. The excess will not be transferred to the next process to avoid BoM calculation errors.`);
        }

        // Check if rework
        if (formData.status === 'rework') {
          alert('🔄 This batch has been marked for REWORK and will need to be sent again for the same process.');
        }

        onSuccess();
        onClose();
      } else {
        alert(`Error: ${result.message || 'Failed to receive batch'}`);
      }
    } catch (error) {
      console.error('Error receiving from outsource:', error);
      alert('Error receiving batch from outsource');
    } finally {
      setLoading(false);
    }
  };

  const sentKg = parseFloat(batch.total_kg || 0);
  const receivedKg = parseFloat(formData.quantity_received_kg || 0);
  const difference = sentKg - receivedKg;
  const showToleranceWarning = difference > 0 && formData.quantity_received_kg;
  const showExcessWarning = difference < 0 && formData.quantity_received_kg;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-slate-800">Receive from Outsource</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Batch Information */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-slate-800 mb-2">Batch Information</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Request ID:</span>
                <span className="font-medium text-slate-800">{batch.request_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Vendor:</span>
                <span className="font-medium text-slate-800">{batch.vendor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date Sent:</span>
                <span className="font-medium text-slate-800">{batch.date_sent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Quantity Sent:</span>
                <span className="font-medium text-slate-800">{sentKg.toFixed(3)} kg</span>
              </div>
            </div>
          </div>

          {/* Quantity Received */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity Received (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              required
              value={formData.quantity_received_kg}
              onChange={(e) => setFormData({ ...formData, quantity_received_kg: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter received quantity in kg"
            />
          </div>

          {/* Tolerance Warning */}
          {showToleranceWarning && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-orange-800 mb-1">Tolerance Case Detected</p>
                  <p className="text-orange-700">
                    Received <strong>{difference.toFixed(3)} kg</strong> less than sent.
                  </p>
                  <p className="text-orange-700 mt-1">
                    This batch will be moved to <strong>&quot;Checked/Cleared&quot;</strong> tab for verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Excess Warning */}
          {showExcessWarning && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-800 mb-1">Excess Quantity Received</p>
                  <p className="text-blue-700">
                    Received <strong>{Math.abs(difference).toFixed(3)} kg</strong> more than sent.
                  </p>
                  <p className="text-blue-700 mt-1">
                    ℹ️ Only the <strong>sent quantity ({sentKg.toFixed(3)} kg)</strong> will be transferred to the next process to avoid BoM calculation errors.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.status === 'ok' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="ok"
                  checked={formData.status === 'ok'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">✅</div>
                  <div className="font-medium text-slate-800">OK</div>
                  <div className="text-xs text-slate-600">Quality Passed</div>
                </div>
              </label>

              <label className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.status === 'rework' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="rework"
                  checked={formData.status === 'rework'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-1">🔄</div>
                  <div className="font-medium text-slate-800">Rework</div>
                  <div className="text-xs text-slate-600">Needs Reprocessing</div>
                </div>
              </label>
            </div>
          </div>

          {/* Rework Warning */}
          {formData.status === 'rework' && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-800 mb-1">Rework Required</p>
                  <p className="text-red-700">
                    This batch will need to be sent again for the same process.
                  </p>
                  <p className="text-red-700 mt-1">
                    🔄 A special &quot;Rework&quot; indicator will be displayed for tracking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any observations or notes about the received batch"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Receiving...' : 'Confirm Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



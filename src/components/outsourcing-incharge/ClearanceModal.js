"use client";

import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import outsourcingAPI from '@/components/API_Service/outsourcing-api';

export default function ClearanceModal({ isOpen, onClose, batch, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen || !batch) return null;

  const handleClear = async (clearAsChecked) => {
    setLoading(true);

    try {
      // Close the outsourcing request with clearance status
      const result = await outsourcingAPI.close(batch.id);

      if (result && !result.error) {
        if (clearAsChecked) {
          alert('✅ Batch verified and cleared. Moving to Completed tab with "Checked" mark.');
        } else {
          alert('⚠️ Batch closed without verification. Moving to Completed with "Unchecked Shortage" highlight.');
        }
        
        onSuccess();
        onClose();
      } else {
        alert(`Error: ${result.message || 'Failed to clear batch'}`);
      }
    } catch (error) {
      console.error('Error clearing batch:', error);
      alert('Error clearing batch');
    } finally {
      setLoading(false);
    }
  };

  const sentKg = parseFloat(batch.total_kg || 0);
  const receivedKg = parseFloat(batch.returned_kg || 0);
  const difference = sentKg - receivedKg;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="bg-orange-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">Batch Clearance Verification</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Batch Information */}
          <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-3 text-lg">⚠️ Tolerance Case Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Request ID:</span>
                <span className="font-medium text-slate-800">{batch.request_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Vendor:</span>
                <span className="font-medium text-slate-800">{batch.vendor_name}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-orange-200 pt-2 mt-2">
                <span className="text-slate-600">Quantity Sent:</span>
                <span className="font-bold text-slate-800">{sentKg.toFixed(3)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Quantity Received:</span>
                <span className="font-bold text-slate-800">{receivedKg.toFixed(3)} kg</span>
              </div>
              <div className="flex justify-between text-sm border-t border-orange-300 pt-2 mt-2">
                <span className="text-orange-700 font-semibold">Shortage:</span>
                <span className="font-bold text-orange-700 text-lg">{difference.toFixed(3)} kg</span>
              </div>
            </div>
          </div>

          {/* Verification Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-slate-800 mb-3">Verification Required</h3>
            <p className="text-sm text-slate-600 mb-4">
              Please verify the shortage with the vendor and confirm that you have:
            </p>
            <ul className="space-y-2 text-sm text-slate-600 mb-4">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Checked the physical quantity received</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Reviewed delivery documents and vendor notes</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Confirmed the shortage with the vendor</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Documented any agreed-upon actions</span>
              </li>
            </ul>

            <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-slate-700">
                I have verified the shortage and confirmed all details
              </span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Add any notes about the verification process or vendor communication"
            />
          </div>

          {/* Warning Box */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Once cleared, this batch will be moved to the Completed tab. Choose:
            </p>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1 ml-4">
              <li>• <strong>&quot;Checked and Cleared&quot;</strong> - Shortage verified and accepted</li>
              <li>• <strong>&quot;Close Without Verification&quot;</strong> - Close without full verification</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleClear(false)}
                disabled={loading}
                className="px-6 py-2 border border-orange-300 rounded-lg text-orange-700 hover:bg-orange-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Close Without Verification
              </button>
              <button
                type="button"
                onClick={() => handleClear(true)}
                disabled={loading || !verified}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                <span>{loading ? 'Processing...' : 'Checked and Cleared'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



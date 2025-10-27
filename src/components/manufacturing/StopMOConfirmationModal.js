'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MANUFACTURING_APIS } from '@/components/API_Service/api-list';

export default function StopMOConfirmationModal({ isOpen, onClose, moData, onConfirm }) {
  const [stopReason, setStopReason] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [resourceStatus, setResourceStatus] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    if (isOpen && moData) {
      // Fetch resource status when modal opens
      fetchResourceStatus();
      setStopReason('');
      setErrors({});
    }
  }, [isOpen, moData]);

  const fetchResourceStatus = async () => {
    if (!moData?.id) return;

    setLoadingResources(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(MANUFACTURING_APIS.MO_RESOURCE_STATUS(moData.id), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResourceStatus(data.resources);
      } else {
        console.error('Failed to fetch resource status');
      }
    } catch (error) {
      console.error('Error fetching resource status:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleConfirm = async () => {
    // Validate
    const newErrors = {};
    if (!stopReason || stopReason.trim().length < 10) {
      newErrors.stopReason = 'Stop reason must be at least 10 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(stopReason.trim());
      onClose();
    } catch (error) {
      setErrors({ general: error.message || 'Failed to stop MO' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Stop Manufacturing Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* MO Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">MO Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">MO ID:</span>
                <span className="ml-2 font-medium text-gray-900">{moData?.mo_id}</span>
              </div>
              <div>
                <span className="text-gray-600">Product:</span>
                <span className="ml-2 font-medium text-gray-900">{moData?.product_code?.product_code}</span>
              </div>
              <div>
                <span className="text-gray-600">Quantity:</span>
                <span className="ml-2 font-medium text-gray-900">{moData?.quantity}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium text-gray-900">{moData?.status}</span>
              </div>
            </div>
          </div>

          {/* Resource Impact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">What will be released:</h3>

            {loadingResources ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading resource information...</p>
              </div>
            ) : resourceStatus ? (
              <div className="space-y-3">
                {/* Reserved RM */}
                {resourceStatus.reserved_rm && resourceStatus.reserved_rm.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Reserved Raw Materials ({resourceStatus.reserved_rm.length})
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {resourceStatus.reserved_rm.map((rm, idx) => (
                        <li key={idx} className="text-yellow-800">
                          • {rm.quantity_kg}kg of {rm.material}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reserved FG */}
                {resourceStatus.reserved_fg && resourceStatus.reserved_fg.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Reserved Finished Goods ({resourceStatus.reserved_fg.length})
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {resourceStatus.reserved_fg.map((fg, idx) => (
                        <li key={idx} className="text-blue-800">
                          • {fg.quantity} units of {fg.product}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* In Progress Batches */}
                {resourceStatus.in_progress_batches && resourceStatus.in_progress_batches.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">
                      In-Progress Batches ({resourceStatus.in_progress_batches.length})
                    </h4>
                    <p className="text-sm text-green-800 mb-2">
                      ✓ These batches will continue to completion
                    </p>
                    <ul className="space-y-1 text-sm">
                      {resourceStatus.in_progress_batches.map((batch, idx) => (
                        <li key={idx} className="text-green-700">
                          • {batch.batch_id}: {batch.actual_quantity_completed}/{batch.planned_quantity/1000} Kg completed
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pending Batches */}
                {resourceStatus.pending_batches && resourceStatus.pending_batches.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">
                      Pending Batches ({resourceStatus.pending_batches.length})
                    </h4>
                    <p className="text-sm text-red-800 mb-2">
                      ✗ These batches will be blocked from release
                    </p>
                    <ul className="space-y-1 text-sm">
                      {resourceStatus.pending_batches.map((batch, idx) => (
                        <li key={idx} className="text-red-700">
                          • {batch.batch_id}: {batch.planned_quantity/1000} Kg
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* No resources */}
                {(!resourceStatus.reserved_rm || resourceStatus.reserved_rm.length === 0) &&
                 (!resourceStatus.reserved_fg || resourceStatus.reserved_fg.length === 0) &&
                 (!resourceStatus.in_progress_batches || resourceStatus.in_progress_batches.length === 0) &&
                 (!resourceStatus.pending_batches || resourceStatus.pending_batches.length === 0) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">No reserved resources found for this MO</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Unable to load resource information</p>
              </div>
            )}
          </div>

          {/* Stop Reason Input */}
          <div>
            <label htmlFor="stopReason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Stopping <span className="text-red-500">*</span>
            </label>
            <textarea
              id="stopReason"
              value={stopReason}
              onChange={(e) => {
                setStopReason(e.target.value);
                if (errors.stopReason) {
                  setErrors({ ...errors, stopReason: null });
                }
              }}
              placeholder="e.g., High priority MO_002 needs this material urgently"
              className={`w-full px-3 text-slate-500 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.stopReason ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="3"
              disabled={isLoading}
            />
            {errors.stopReason && (
              <p className="mt-1 text-sm text-red-600">{errors.stopReason}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Minimum 10 characters required
            </p>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Warning:</strong> This action cannot be undone. All reserved resources will be released immediately.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Stopping MO...
              </span>
            ) : (
              'Confirm Stop'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


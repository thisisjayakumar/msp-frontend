'use client';

import React, { useState } from 'react';
import { Card } from '@/components/CommonComponents/ui/Card';
import { Button } from '@/components/CommonComponents/ui/Button';
import { LoadingSpinner } from '@/components/CommonComponents/ui/LoadingSpinner';

const ConfirmDispatchModal = ({ dispatchData, onClose, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [supervisorConfirmed, setSupervisorConfirmed] = useState(false);

  const handleConfirmDispatch = async () => {
    if (!supervisorConfirmed) {
      setError('Please confirm that you have physically verified the dispatch');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create dispatch transactions for each batch
      const dispatchPromises = dispatchData.batches.map(async (batch) => {
        const transactionData = {
          mo: dispatchData.mo.mo_id,
          dispatch_batch: batch.batchId,
          customer_c_id: dispatchData.mo.customer_c_id,
          quantity_dispatched: batch.dispatchQuantity,
          supervisor_id: JSON.parse(localStorage.getItem('user')).id,
          notes: `${dispatchData.notes}\nConfirmation Notes: ${confirmationNotes}`.trim(),
          delivery_reference: dispatchData.deliveryReference
        };

        const response = await fetch('/api/fg-store/dispatch-transactions/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create dispatch transaction');
        }

        return response.json();
      });

      // Wait for all transactions to be created
      const transactions = await Promise.all(dispatchPromises);

      // Confirm all transactions
      const confirmPromises = transactions.map(async (transaction) => {
        const confirmResponse = await fetch(
          `/api/fg-store/dispatch-transactions/${transaction.id}/confirm/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              notes: confirmationNotes
            })
          }
        );

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          throw new Error(errorData.error || 'Failed to confirm dispatch transaction');
        }

        return confirmResponse.json();
      });

      // Wait for all confirmations
      await Promise.all(confirmPromises);

      // Dispatch completed successfully
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalQuantity = () => {
    return dispatchData.batches.reduce((sum, batch) => sum + batch.dispatchQuantity, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Confirm Dispatch</h3>
              <p className="text-sm text-gray-600">Please verify the dispatch details before confirmation</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Dispatch Summary */}
          <Card className="mb-6 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Dispatch Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">MO ID:</span>
                <div className="font-medium">{dispatchData.mo.mo_id}</div>
              </div>
              <div>
                <span className="text-gray-500">Customer:</span>
                <div className="font-medium">{dispatchData.mo.customer_name}</div>
              </div>
              <div>
                <span className="text-gray-500">Product:</span>
                <div className="font-medium">{dispatchData.mo.product_code}</div>
              </div>
              <div>
                <span className="text-gray-500">Total Quantity:</span>
                <div className="font-medium">{getTotalQuantity().toLocaleString()}</div>
              </div>
            </div>
          </Card>

          {/* Batch Details */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Batch Details</h4>
            <div className="space-y-2">
              {dispatchData.batches.map((batch) => (
                <div key={batch.batchId} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <div className="font-medium text-sm">{batch.batchId}</div>
                    <div className="text-xs text-gray-500">{batch.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{batch.dispatchQuantity.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">units</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          {(dispatchData.deliveryReference || dispatchData.notes) && (
            <Card className="mb-6 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Additional Information</h4>
              {dispatchData.deliveryReference && (
                <div className="mb-2">
                  <span className="text-sm text-gray-500">Delivery Reference:</span>
                  <div className="font-medium">{dispatchData.deliveryReference}</div>
                </div>
              )}
              {dispatchData.notes && (
                <div>
                  <span className="text-sm text-gray-500">Notes:</span>
                  <div className="font-medium">{dispatchData.notes}</div>
                </div>
              )}
            </Card>
          )}

          {/* Physical Verification Checklist */}
          <Card className="mb-6 p-4 bg-blue-50">
            <h4 className="font-medium text-gray-900 mb-3">Physical Verification Checklist</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="verify-quantity"
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="verify-quantity" className="ml-2 text-sm text-gray-700">
                  Verified that dispatched quantities match the order
                </label>
              </div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="verify-product"
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="verify-product" className="ml-2 text-sm text-gray-700">
                  Confirmed correct product codes and specifications
                </label>
              </div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="verify-packaging"
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="verify-packaging" className="ml-2 text-sm text-gray-700">
                  Checked packaging integrity and labeling
                </label>
              </div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="verify-documentation"
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="verify-documentation" className="ml-2 text-sm text-gray-700">
                  Verified dispatch documentation and references
                </label>
              </div>
            </div>
          </Card>

          {/* Supervisor Confirmation */}
          <Card className="mb-6 p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="supervisor-confirm"
                checked={supervisorConfirmed}
                onChange={(e) => setSupervisorConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="supervisor-confirm" className="ml-2 text-sm text-gray-700">
                <span className="font-medium">I confirm that I have physically verified the dispatch</span>
                <br />
                <span className="text-gray-500">
                  As the FG Store Supervisor, I certify that the above items have been properly checked and are ready for dispatch.
                </span>
              </label>
            </div>
          </Card>

          {/* Confirmation Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmation Notes
            </label>
            <textarea
              value={confirmationNotes}
              onChange={(e) => setConfirmationNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any additional notes or observations..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline" disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDispatch}
            disabled={!supervisorConfirmed || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Confirming...
              </>
            ) : (
              'Confirm Dispatch'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDispatchModal;

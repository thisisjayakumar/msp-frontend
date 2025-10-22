'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/CommonComponents/ui/Card';
import { Button } from '@/components/CommonComponents/ui/Button';
import { Input } from '@/components/CommonComponents/ui/Input';
import { LoadingSpinner } from '@/components/CommonComponents/ui/LoadingSpinner';

const DispatchModal = ({ mo, onClose, onConfirm }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dispatchData, setDispatchData] = useState({
    batches: [],
    totalQuantity: 0,
    notes: '',
    deliveryReference: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/fg-store/dispatch-batches/?mo=${mo.mo_id}&status=pending_dispatch,partially_dispatched`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }

      const data = await response.json();
      setBatches(data.results || data);
      
      // Initialize dispatch data with available batches
      const initialBatches = (data.results || data).map(batch => ({
        batchId: batch.batch_id,
        productCode: batch.product_code,
        availableQuantity: batch.quantity_available,
        dispatchQuantity: 0,
        location: batch.location_in_store || 'FG Store'
      }));
      
      setDispatchData(prev => ({
        ...prev,
        batches: initialBatches
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mo) {
      fetchBatches();
    }
  }, [mo]);

  const handleQuantityChange = (batchId, quantity) => {
    const numQuantity = parseInt(quantity) || 0;
    
    setDispatchData(prev => ({
      ...prev,
      batches: prev.batches.map(batch => 
        batch.batchId === batchId 
          ? { ...batch, dispatchQuantity: numQuantity }
          : batch
      )
    }));

    // Clear validation error for this batch
    if (validationErrors[batchId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[batchId];
        return newErrors;
      });
    }
  };

  const handleInputChange = (field, value) => {
    setDispatchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateDispatch = () => {
    const errors = {};
    let totalQuantity = 0;
    let hasValidDispatch = false;

    dispatchData.batches.forEach(batch => {
      if (batch.dispatchQuantity > 0) {
        hasValidDispatch = true;
        totalQuantity += batch.dispatchQuantity;
        
        if (batch.dispatchQuantity > batch.availableQuantity) {
          errors[batch.batchId] = `Cannot dispatch ${batch.dispatchQuantity} units. Available: ${batch.availableQuantity}`;
        }
        
        if (batch.dispatchQuantity <= 0) {
          errors[batch.batchId] = 'Dispatch quantity must be greater than 0';
        }
      }
    });

    if (!hasValidDispatch) {
      errors.general = 'Please specify quantities to dispatch for at least one batch';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirm = () => {
    if (validateDispatch()) {
      const selectedBatches = dispatchData.batches.filter(batch => batch.dispatchQuantity > 0);
      
      onConfirm({
        mo: mo,
        batches: selectedBatches,
        totalQuantity: dispatchData.batches.reduce((sum, batch) => sum + batch.dispatchQuantity, 0),
        notes: dispatchData.notes,
        deliveryReference: dispatchData.deliveryReference
      });
    }
  };

  const getTotalQuantity = () => {
    return dispatchData.batches.reduce((sum, batch) => sum + batch.dispatchQuantity, 0);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Dispatch Order</h3>
              <p className="text-sm text-gray-500">MO: {mo.mo_id} - {mo.customer_name}</p>
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

          {validationErrors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{validationErrors.general}</p>
            </div>
          )}

          {/* MO Details */}
          <Card className="mb-6 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Manufacturing Order Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Product:</span>
                <div className="font-medium">{mo.product_code}</div>
              </div>
              <div>
                <span className="text-gray-500">Ordered Qty:</span>
                <div className="font-medium">{mo.quantity_ordered.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-500">Packed Qty:</span>
                <div className="font-medium">{mo.quantity_packed.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-500">Delivery Date:</span>
                <div className="font-medium">
                  {mo.delivery_date ? new Date(mo.delivery_date).toLocaleDateString() : '-'}
                </div>
              </div>
            </div>
          </Card>

          {/* Batches */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Available Batches</h4>
            <div className="space-y-3">
              {batches.map((batch) => (
                <Card key={batch.batch_id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{batch.batch_id}</div>
                      <div className="text-xs text-gray-500">{batch.location_in_store || 'FG Store'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Available</div>
                      <div className="font-medium">{batch.quantity_available.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Loose Stock</div>
                      <div className="font-medium">{batch.loose_stock}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Dispatch Qty
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max={batch.quantity_available}
                        value={dispatchData.batches.find(b => b.batchId === batch.batch_id)?.dispatchQuantity || 0}
                        onChange={(e) => handleQuantityChange(batch.batch_id, e.target.value)}
                        className={validationErrors[batch.batch_id] ? 'border-red-300' : ''}
                      />
                      {validationErrors[batch.batch_id] && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors[batch.batch_id]}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Status</div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        batch.status === 'pending_dispatch' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {batch.status === 'pending_dispatch' ? 'Pending' : 'Partial'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Reference
              </label>
              <Input
                type="text"
                value={dispatchData.deliveryReference}
                onChange={(e) => handleInputChange('deliveryReference', e.target.value)}
                placeholder="Enter delivery reference or tracking ID..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={dispatchData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any special instructions or notes..."
              />
            </div>
          </div>

          {/* Summary */}
          <Card className="mt-6 p-4 bg-blue-50">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">Dispatch Summary</h4>
                <p className="text-sm text-gray-600">
                  Total quantity to dispatch: <span className="font-semibold">{getTotalQuantity().toLocaleString()}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Batches selected</div>
                <div className="font-semibold">
                  {dispatchData.batches.filter(b => b.dispatchQuantity > 0).length}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={getTotalQuantity() === 0}
          >
            Proceed to Confirmation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DispatchModal;

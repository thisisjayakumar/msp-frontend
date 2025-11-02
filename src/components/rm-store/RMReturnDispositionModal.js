"use client";

import { useState, useEffect } from 'react';
import { Card } from '../CommonComponents/ui/Card';
import Button from '../CommonComponents/ui/Button';

export default function RMReturnDispositionModal({ returnItem, onProcess, onCancel }) {
  const [disposition, setDisposition] = useState('return_to_rm');
  const [vendorAcceptanceType, setVendorAcceptanceType] = useState('unused_only');
  const [vendorAcceptedQuantity, setVendorAcceptedQuantity] = useState('');
  const [receivedReturnQty, setReceivedReturnQty] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalBatch = Number(returnItem.total_batch_quantity_kg || returnItem.quantity_kg || 0);
  const scrappedQty = Number(returnItem.scrapped_quantity_kg || 0);
  const unusedQty = Math.max(totalBatch - scrappedQty, 0);

  useEffect(() => {
    if (vendorAcceptanceType === 'unused_only') {
      setVendorAcceptedQuantity(unusedQty ? unusedQty.toFixed(3) : '0.000');
    } else if (vendorAcceptanceType === 'all') {
      setVendorAcceptedQuantity(totalBatch ? totalBatch.toFixed(3) : '0.000');
    } else {
      setVendorAcceptedQuantity('');
    }
  }, [vendorAcceptanceType, returnItem, totalBatch, unusedQty]);

  useEffect(() => {
    setReceivedReturnQty(totalBatch ? totalBatch.toFixed(3) : '');
  }, [totalBatch]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!receivedReturnQty || Number(receivedReturnQty) <= 0) {
        setError('Received return quantity is required');
        setLoading(false);
        return;
      }
      if (Number(receivedReturnQty) > Number(totalBatch)) {
        setError(`Received return quantity cannot exceed ${totalBatch.toFixed(3)} kg`);
        setLoading(false);
        return;
      }

      if (disposition === 'return_to_vendor') {
        if (!vendorAcceptedQuantity || Number(vendorAcceptedQuantity) <= 0) {
          setError('Vendor accepted quantity is required');
          setLoading(false);
          return;
        }
        const maxAcceptable = Number(receivedReturnQty);
        if (Number(vendorAcceptedQuantity) > maxAcceptable) {
          setError(`Vendor accepted quantity cannot exceed ${maxAcceptable.toFixed(3)} kg`);
          setLoading(false);
          return;
        }
      }
      
      await onProcess(disposition, receivedReturnQty, disposition === 'return_to_vendor' ? vendorAcceptedQuantity : null, notes);
    } catch (err) {
      setError(err.message || 'Failed to process disposition');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <h3 className="text-lg font-semibold text-slate-800">Process RM Return Disposition</h3>
          <p className="text-sm text-slate-600 mt-1">
            Choose how to handle this returned raw material
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Return Details</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600">Return ID</p>
                <p className="text-sm font-medium text-slate-800">{returnItem.return_id}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-600">Raw Material</p>
                <p className="text-sm font-medium text-slate-800">
                  {returnItem.raw_material_details?.material_code}
                </p>
                <p className="text-xs text-slate-500">
                  {returnItem.raw_material_details?.material_name}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-600">Batch / MO</p>
                <p className="text-sm font-medium text-slate-800">{returnItem.batch_id}</p>
                <p className="text-xs text-slate-500">MO: {returnItem.mo_id}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-xs text-slate-600">Returned From</p>
                <p className="text-sm font-medium text-slate-800">
                  {returnItem.returned_from_location_display}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-xs font-semibold text-slate-700 mb-2">Quantity Breakdown</h5>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded p-2 border border-gray-200">
                  <p className="text-xs text-slate-600">Complete Quantity</p>
                  <p className="text-base font-bold text-slate-800">{totalBatch.toFixed(3)} kg</p>
                </div>
                <div className="bg-white rounded p-2 border border-gray-200">
                  <p className="text-xs text-slate-600">Used</p>
                  <p className="text-base font-bold text-red-600">{scrappedQty.toFixed(3)} kg</p>
                </div>
                <div className="bg-white rounded p-2 border border-blue-200">
                  <p className="text-xs text-slate-600">Unused</p>
                  <p className="text-base font-bold text-blue-600">{unusedQty.toFixed(3)} kg</p>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600">Return Reason</p>
                <p className="text-sm text-slate-800">{returnItem.return_reason}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-600">Returned By</p>
                <p className="text-sm text-slate-800">{returnItem.returned_by_name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(returnItem.returned_at).toLocaleString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  disposition === 'return_to_rm'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
                onClick={() => setDisposition('return_to_rm')}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="disposition"
                    value="return_to_rm"
                    checked={disposition === 'return_to_rm'}
                    onChange={(e) => setDisposition(e.target.value)}
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <div className="ml-3 flex-1">
                    <h5 className="text-sm font-semibold text-slate-800">Return to RM</h5>
                    <p className="text-xs text-slate-600 mt-1">
                      Keep in stock for future MO usage
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  disposition === 'return_to_vendor'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setDisposition('return_to_vendor')}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="disposition"
                    value="return_to_vendor"
                    checked={disposition === 'return_to_vendor'}
                    onChange={(e) => setDisposition(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <h5 className="text-sm font-semibold text-slate-800">Return to Vendor</h5>
                    <p className="text-xs text-slate-600 mt-1">Send to vendor due to quality issue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Received Return Qty (kg) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.001"
              value={receivedReturnQty}
              onChange={(e) => setReceivedReturnQty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-800"
              placeholder="0.000"
            />
            <p className="text-xs text-slate-500 mt-1">Must be ≤ {totalBatch.toFixed(3)} kg</p>
          </div>

          {disposition === 'return_to_vendor' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-slate-800 mb-3">Vendor Acceptance</h5>
              
              <div className="space-y-3 mb-4">
                <div
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    vendorAcceptanceType === 'unused_only'
                      ? 'border-blue-500 bg-white'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                  onClick={() => setVendorAcceptanceType('unused_only')}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="vendorAcceptance"
                      value="unused_only"
                      checked={vendorAcceptanceType === 'unused_only'}
                      onChange={(e) => setVendorAcceptanceType(e.target.value)}
                      className="mt-0.5 h-4 w-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-800">Only Unused</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Vendor accepts only the unused material ({unusedQty.toFixed(3)} kg)
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    vendorAcceptanceType === 'all'
                      ? 'border-blue-500 bg-white'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                  onClick={() => setVendorAcceptanceType('all')}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="vendorAcceptance"
                      value="all"
                      checked={vendorAcceptanceType === 'all'}
                      onChange={(e) => setVendorAcceptanceType(e.target.value)}
                      className="mt-0.5 h-4 w-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-800">Send All Quantity</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Vendor accepts entire batch quantity ({totalBatch.toFixed(3)} kg)
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    vendorAcceptanceType === 'custom'
                      ? 'border-blue-500 bg-white'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                  onClick={() => setVendorAcceptanceType('custom')}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="vendorAcceptance"
                      value="custom"
                      checked={vendorAcceptanceType === 'custom'}
                      onChange={(e) => setVendorAcceptanceType(e.target.value)}
                      className="mt-0.5 h-4 w-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-800">Custom Quantity</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Specify a custom quantity accepted by the vendor
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Vendor Accepted Quantity (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={vendorAcceptedQuantity}
                  onChange={(e) => setVendorAcceptedQuantity(e.target.value)}
                  disabled={vendorAcceptanceType !== 'custom'}
                  className={`w-full px-3 py-2 border rounded-lg text-slate-800 ${
                    vendorAcceptanceType === 'custom'
                      ? 'border-gray-300 bg-white'
                      : 'border-gray-200 bg-gray-100'
                  }`}
                  placeholder="0.000"
                />
                <p className="text-xs text-slate-500 mt-1">Max: {Number(receivedReturnQty || 0).toFixed(3)} kg</p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Disposition Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800"
              placeholder="Add any additional notes about this disposition decision..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="secondary"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            className={`${
              disposition === 'return_to_vendor'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                {disposition === 'return_to_vendor' ? 'Return to Vendor' : 'Mark as Scrap'}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}


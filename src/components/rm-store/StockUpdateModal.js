"use client";

import { useState } from 'react';
import { Card } from '../CommonComponents/ui/Card';
import Button from '../CommonComponents/ui/Button';
import Input from '../CommonComponents/ui/Input';
// LoadingSpinner removed - using inline SVG spinner

export default function StockUpdateModal({ material, onSave, onCancel }) {
  const [quantity, setQuantity] = useState(
    material?.available_quantity?.toString() || '0'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const quantityNum = parseFloat(quantity);
    
    // Validate quantity
    if (isNaN(quantityNum) || quantityNum < 0) {
      setError('Please enter a valid quantity (0 or greater)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(material, quantityNum);
    } catch (err) {
      console.error('Error updating stock:', err);
      setError(err.message || 'Failed to update stock balance');
    } finally {
      setLoading(false);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    // Allow empty string, valid numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
      setError(null);
    }
  };

  // Get current stock status
  const getCurrentStockStatus = () => {
    const qty = material?.available_quantity || 0;
    if (qty > 0) {
      return `In Stock (${qty} kg)`;
    } else if (qty === 0) {
      return 'Out of Stock';
    }
    return 'No Stock Record';
  };

  // Get stock status color
  const getStockStatusColor = () => {
    const qty = material?.available_quantity || 0;
    if (qty > 0) {
      return 'text-green-600';
    } else if (qty === 0) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Update Raw Material Stock
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Material Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">
                {material.material_code}
              </h3>
              <span className={`text-sm font-medium ${getStockStatusColor()}`}>
                {getCurrentStockStatus()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {material.material_name}
            </p>
            <p className="text-sm text-gray-500">
              Grade: {material.grade} • {material.material_type_display}
            </p>
            {material.material_type === 'coil' && (
              <p className="text-sm text-gray-500">
                {material.wire_diameter_mm && `⌀${material.wire_diameter_mm}mm`}
                {material.weight_kg && ` • ${material.weight_kg}kg`}
              </p>
            )}
            {material.material_type === 'sheet' && material.thickness_mm && (
              <p className="text-sm text-gray-500">
                Thickness: {material.thickness_mm}mm
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Available Quantity (kg) *
              </label>
              <Input
                id="quantity"
                name="quantity"
                type="text"
                value={quantity}
                onChange={handleQuantityChange}
                placeholder="Enter quantity in kg"
                disabled={loading}
                className="text-lg"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the current available stock quantity for this raw material in kilograms
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setQuantity('0')}
                disabled={loading}
                className="px-3 py-2 text-slate-600 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +0
              </button>
              <button
                type="button"
                onClick={() => setQuantity('50')}
                disabled={loading}
                className="px-3 py-2 text-slate-600 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +50
              </button>
              <button
                type="button"
                onClick={() => setQuantity('100')}
                disabled={loading}
                className="px-3 py-2 text-slate-600 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +100
              </button>
              <button
                type="button"
                onClick={() => setQuantity('500')}
                disabled={loading}
                className="px-3 py-2 text-slate-600 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +500
              </button>
              <button
                type="button"
                onClick={() => setQuantity('1000')}
                disabled={loading}
                className="px-3 py-2 text-slate-600 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +1000
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={onCancel}
                variant="secondary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || quantity === ''}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Stock'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}


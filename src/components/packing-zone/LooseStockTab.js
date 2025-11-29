'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import packingZoneAPI from '@/components/API_Service/packing-zone-api';
import toast from 'react-hot-toast';

const MergeRequestModal = ({ oldStocks, onClose, onSubmit }) => {
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleStock = (stock) => {
    setSelectedStocks(prev =>
      prev.find(s => s.id === stock.id)
        ? prev.filter(s => s.id !== stock.id)
        : [...prev, stock]
    );
  };

  const totalData = useMemo(() => {
    const total_kg = selectedStocks.reduce((sum, s) => sum + parseFloat(s.loose_kg), 0);
    const total_pieces = selectedStocks.reduce((sum, s) => sum + s.loose_pieces, 0);
    return { total_kg: total_kg.toFixed(3), total_pieces };
  }, [selectedStocks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedStocks.length < 2) {
      toast.error('Please select at least 2 heat numbers to merge');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for merge');
      return;
    }

    setIsSubmitting(true);

    const mergeData = {
      product_code: selectedStocks[0].product_code,
      product: selectedStocks[0].product,
      ipc: selectedStocks[0].ipc,
      heat_numbers_data: selectedStocks.map(s => ({
        heat_no: s.heat_no,
        kg: parseFloat(s.loose_kg),
        pieces: s.loose_pieces,
        age_days: s.age_days,
        product_code: s.product_code,
        grams_per_product: parseFloat(s.grams_per_product)
      })),
      total_kg: parseFloat(totalData.total_kg),
      total_pieces: totalData.total_pieces,
      reason: reason
    };

    await onSubmit(mergeData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Request Heat Number Merge</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
            <p className="text-sm text-amber-800">
              Select at least 2 heat numbers older than 50 days to merge. Production Head will review and approve.
            </p>
          </div>

          {/* Stock Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Heat Numbers to Merge (Minimum 2)
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
              {oldStocks.stocks?.map((stock) => (
                <label
                  key={stock.id}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded cursor-pointer border border-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedStocks.some(s => s.id === stock.id)}
                    onChange={() => toggleStock(stock)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Heat No: {stock.heat_no}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {parseFloat(stock.loose_kg).toFixed(3)} kg • {stock.loose_pieces} pcs
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                        {stock.age_days} days old
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Selection Summary */}
          {selectedStocks.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Selected Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Heat Numbers:</span>
                  <span className="font-bold text-blue-900">{selectedStocks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Total Weight:</span>
                  <span className="font-bold text-blue-900">{totalData.total_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Total Pieces:</span>
                  <span className="font-bold text-blue-900">{totalData.total_pieces} pcs</span>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Merge <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Explain why these heat numbers should be merged..."
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedStocks.length < 2}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Merge Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdjustmentRequestModal = ({ stock, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    adjustment_kg: '',
    adjustment_pieces: '',
    reason: '',
    reason_details: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate pieces based on kg
  useEffect(() => {
    if (formData.adjustment_kg && stock) {
      const pieces = Math.floor(
        parseFloat(formData.adjustment_kg) / (parseFloat(stock.grams_per_product) / 1000)
      );
      setFormData(prev => ({ ...prev, adjustment_pieces: pieces.toString() }));
    }
  }, [formData.adjustment_kg, stock]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (parseFloat(formData.adjustment_kg) > parseFloat(stock.loose_kg)) {
      toast.error('Adjustment quantity cannot exceed available stock');
      return;
    }

    setIsSubmitting(true);

    const adjustmentData = {
      product_code: stock.product_code,
      product: stock.product,
      ipc: stock.ipc,
      heat_no: stock.heat_no,
      adjustment_kg: parseFloat(formData.adjustment_kg),
      adjustment_pieces: parseInt(formData.adjustment_pieces),
      reason: formData.reason,
      reason_details: formData.reason_details
    };

    await onSubmit(adjustmentData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Request Stock Adjustment</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Stock Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">IPC:</span>
              <span className="text-sm font-medium text-gray-900">{stock.ipc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Heat No:</span>
              <span className="text-sm font-medium text-gray-900">{stock.heat_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Available:</span>
              <span className="text-sm font-medium text-gray-900">
                {parseFloat(stock.loose_kg).toFixed(3)} kg ({stock.loose_pieces} pcs)
              </span>
            </div>
          </div>

          {/* Adjustment Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Quantity (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              max={parseFloat(stock.loose_kg)}
              value={formData.adjustment_kg}
              onChange={(e) => setFormData({ ...formData, adjustment_kg: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter kg to adjust"
              required
            />
          </div>

          {/* Auto-calculated Pieces */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pieces (Auto-calculated)
            </label>
            <input
              type="number"
              value={formData.adjustment_pieces}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select reason</option>
              <option value="rust">Rust</option>
              <option value="old_stock">Old Stock</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Detailed Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason_details}
              onChange={(e) => setFormData({ ...formData, reason_details: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Provide detailed explanation..."
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LooseStockTab = ({ isReadOnly, isProductionHead, onRefresh }) => {
  const [stocks, setStocks] = useState([]);
  const [oldStocks, setOldStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    product_code: '',
    heat_no: '',
    old_only: false
  });
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedOldStock, setSelectedOldStock] = useState(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Fetch stocks
  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      const result = await packingZoneAPI.looseStock.getAll(filters);
      if (!result.error) {
        setStocks(result);
      } else {
        toast.error('Failed to fetch loose stock');
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Failed to fetch loose stock');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch old stocks for merge
  const fetchOldStocks = useCallback(async () => {
    try {
      const result = await packingZoneAPI.looseStock.getOldStock();
      if (!result.error) {
        setOldStocks(result);
      }
    } catch (error) {
      console.error('Error fetching old stocks:', error);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    fetchOldStocks();
  }, [fetchStocks, fetchOldStocks]);

  // Handle merge request
  const handleMergeRequest = useCallback((productGroup) => {
    if (isReadOnly) {
      toast.error('Read-only mode - cannot request merges');
      return;
    }
    setSelectedOldStock(productGroup);
    setShowMergeModal(true);
  }, [isReadOnly]);

  const handleSubmitMerge = useCallback(async (mergeData) => {
    const toastId = toast.loading('Submitting merge request...');
    try {
      const result = await packingZoneAPI.mergeRequests.create(mergeData);
      if (!result.error) {
        toast.success('Merge request submitted successfully!', { id: toastId });
        setShowMergeModal(false);
        setSelectedOldStock(null);
        fetchStocks();
        fetchOldStocks();
        onRefresh?.();
      } else {
        toast.error(result.message || 'Failed to submit merge request', { id: toastId });
      }
    } catch (error) {
      console.error('Error submitting merge:', error);
      toast.error('Failed to submit merge request', { id: toastId });
    }
  }, [fetchStocks, fetchOldStocks, onRefresh]);

  // Handle adjustment request
  const handleAdjustmentRequest = useCallback((stock) => {
    if (isReadOnly) {
      toast.error('Read-only mode - cannot request adjustments');
      return;
    }
    setSelectedStock(stock);
    setShowAdjustmentModal(true);
  }, [isReadOnly]);

  const handleSubmitAdjustment = useCallback(async (adjustmentData) => {
    const toastId = toast.loading('Submitting adjustment request...');
    try {
      const result = await packingZoneAPI.adjustments.create(adjustmentData);
      if (!result.error) {
        toast.success('Adjustment request submitted successfully!', { id: toastId });
        setShowAdjustmentModal(false);
        setSelectedStock(null);
        fetchStocks();
        onRefresh?.();
      } else {
        toast.error(result.message || 'Failed to submit adjustment', { id: toastId });
      }
    } catch (error) {
      console.error('Error submitting adjustment:', error);
      toast.error('Failed to submit adjustment', { id: toastId });
    }
  }, [fetchStocks, onRefresh]);

  // Statistics
  const stats = useMemo(() => {
    const totalKg = stocks.reduce((sum, s) => sum + parseFloat(s.loose_kg), 0);
    const totalPieces = stocks.reduce((sum, s) => s.loose_pieces, 0);
    const oldCount = stocks.filter(s => s.is_old).length;
    
    return {
      count: stocks.length,
      totalKg: totalKg.toFixed(3),
      totalPieces,
      oldCount
    };
  }, [stocks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600">Loading loose stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Total Lots</div>
          <div className="text-2xl font-bold text-blue-900">{stats.count}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Total Weight</div>
          <div className="text-2xl font-bold text-green-900">{stats.totalKg} kg</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="text-sm text-indigo-600 font-medium">Total Pieces</div>
          <div className="text-2xl font-bold text-indigo-900">{stats.totalPieces}</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-sm text-amber-600 font-medium">Old Stock (&gt;50d)</div>
          <div className="text-2xl font-bold text-amber-900">{stats.oldCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Code</label>
            <input
              type="text"
              value={filters.product_code}
              onChange={(e) => setFilters({ ...filters, product_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Filter by product"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Heat No</label>
            <input
              type="text"
              value={filters.heat_no}
              onChange={(e) => setFilters({ ...filters, heat_no: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Filter by heat no"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.old_only}
                onChange={(e) => setFilters({ ...filters, old_only: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Show only old stock</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ product_code: '', heat_no: '', old_only: false })}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Old Stocks - Merge Available */}
      {oldStocks.length > 0 && !isReadOnly && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-semibold text-amber-800 mb-1">
                Eligible for Merge
              </h4>
              <p className="text-sm text-amber-700">
                {oldStocks.length} product(s) have loose stock older than 50 days and can be merged
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loose Stock Table */}
      {stocks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No loose stock found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.product_code || filters.heat_no || filters.old_only
              ? 'Try adjusting your filters'
              : 'No loose stock available'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heat No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pieces
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age (days)
                  </th>
                  {!isReadOnly && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stocks.map((stock) => (
                  <tr key={stock.id} className={`hover:bg-gray-50 ${stock.is_old ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stock.ipc}</div>
                      <div className="text-xs text-gray-500">{stock.product_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.heat_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {parseFloat(stock.loose_kg).toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.loose_pieces}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stock.is_old ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                        {stock.age_days} days
                      </span>
                    </td>
                    {!isReadOnly && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleAdjustmentRequest(stock)}
                          className="text-amber-600 hover:text-amber-900 font-medium"
                        >
                          Adjust
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Old Stocks Grouped by Product */}
      {oldStocks.length > 0 && !isReadOnly && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Products Eligible for Merge</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {oldStocks.map((group, index) => (
              <div key={index} className="bg-white border-2 border-amber-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{group.ipc}</h4>
                    <p className="text-xs text-gray-500">{group.product_code}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                    {group.stocks.length} heat nos
                  </span>
                </div>
                <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
                  {group.stocks.map((stock, idx) => (
                    <div key={idx} className="text-xs bg-gray-50 rounded px-2 py-1">
                      <span className="font-medium">{stock.heat_no}</span> - {parseFloat(stock.loose_kg).toFixed(3)} kg ({stock.age_days}d)
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleMergeRequest(group)}
                  className="w-full bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  🔄 Request Merge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showMergeModal && selectedOldStock && (
        <MergeRequestModal
          oldStocks={selectedOldStock}
          onClose={() => {
            setShowMergeModal(false);
            setSelectedOldStock(null);
          }}
          onSubmit={handleSubmitMerge}
        />
      )}

      {showAdjustmentModal && selectedStock && (
        <AdjustmentRequestModal
          stock={selectedStock}
          onClose={() => {
            setShowAdjustmentModal(false);
            setSelectedStock(null);
          }}
          onSubmit={handleSubmitAdjustment}
        />
      )}
    </div>
  );
};

export default LooseStockTab;

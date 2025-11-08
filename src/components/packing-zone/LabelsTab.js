'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import packingZoneAPI from '@/components/API_Service/packing-zone-api';
import toast from 'react-hot-toast';

const GenerateLabelModal = ({ fgStocks, onClose, onSubmit }) => {
  const [selectedStock, setSelectedStock] = useState('');
  const [numberOfLabels, setNumberOfLabels] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedStockData = useMemo(() => {
    return fgStocks.find(s => s.id.toString() === selectedStock);
  }, [fgStocks, selectedStock]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStock) {
      toast.error('Please select a product/heat number');
      return;
    }

    if (numberOfLabels < 1 || numberOfLabels > selectedStockData?.total_packs) {
      toast.error(`Please enter a valid number of labels (1-${selectedStockData?.total_packs})`);
      return;
    }

    setIsSubmitting(true);
    await onSubmit({
      fg_stock: selectedStock,
      number_of_labels: numberOfLabels
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Generate Packing Labels</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product & Heat Number <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStock}
              onChange={(e) => {
                setSelectedStock(e.target.value);
                setNumberOfLabels(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">-- Select Product/Heat No --</option>
              {fgStocks.map((stock) => (
                <option key={stock.id} value={stock.id}>
                  {stock.ipc} - {stock.heat_no} ({stock.total_packs} packs available)
                </option>
              ))}
            </select>
          </div>

          {/* Stock Details */}
          {selectedStockData && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Selected Stock Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-blue-700">Product Code:</span>
                  <p className="text-sm font-medium text-blue-900">{selectedStockData.product_code}</p>
                </div>
                <div>
                  <span className="text-xs text-blue-700">IPC:</span>
                  <p className="text-sm font-medium text-blue-900">{selectedStockData.ipc}</p>
                </div>
                <div>
                  <span className="text-xs text-blue-700">Packing Size:</span>
                  <p className="text-sm font-medium text-blue-900">{selectedStockData.packing_size} pcs</p>
                </div>
                <div>
                  <span className="text-xs text-blue-700">Grams per Product:</span>
                  <p className="text-sm font-medium text-blue-900">{selectedStockData.grams_per_product}g</p>
                </div>
                <div>
                  <span className="text-xs text-blue-700">Available Packs:</span>
                  <p className="text-sm font-bold text-blue-900">{selectedStockData.total_packs}</p>
                </div>
                <div>
                  <span className="text-xs text-blue-700">Heat Number:</span>
                  <p className="text-sm font-medium text-blue-900">{selectedStockData.heat_no}</p>
                </div>
              </div>
            </div>
          )}

          {/* Number of Labels */}
          {selectedStockData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Labels <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={numberOfLabels}
                onChange={(e) => setNumberOfLabels(parseInt(e.target.value) || 1)}
                min={1}
                max={selectedStockData.total_packs}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Max: {selectedStockData.total_packs} (available packs)
              </p>
            </div>
          )}

          {/* Label Preview Info */}
          {selectedStockData && numberOfLabels > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Label Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Company Name:</span>
                  <span className="font-medium text-gray-900">Microsprings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IPC:</span>
                  <span className="font-medium text-gray-900">{selectedStockData.ipc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium text-gray-900">{selectedStockData.product_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Packing Size:</span>
                  <span className="font-medium text-gray-900">{selectedStockData.packing_size} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight per Pack:</span>
                  <span className="font-medium text-gray-900">
                    {((selectedStockData.packing_size * selectedStockData.grams_per_product) / 1000).toFixed(3)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Labels:</span>
                  <span className="font-bold text-gray-900">{numberOfLabels}</span>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> Heat numbers are tracked internally but will NOT be printed on customer-facing labels.
                  Labels can be reprinted unlimited times for traceability.
                </p>
              </div>
            </div>
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
              disabled={isSubmitting || !selectedStock}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Generating...' : '🏷️ Generate Labels'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LabelPrintPreview = ({ label, onClose, onPrint }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Label Print Preview</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Preview */}
          <div ref={printRef} className="bg-white border-2 border-gray-300 rounded p-8 mb-6">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: label.number_of_labels }).map((_, index) => (
                <div key={index} className="border-2 border-black p-4 rounded" style={{ pageBreakInside: 'avoid' }}>
                  <div className="text-center space-y-2">
                    <h4 className="font-bold text-lg">Microsprings</h4>
                    <div className="border-t border-black pt-2">
                      <p className="text-sm"><strong>IPC:</strong> {label.ipc}</p>
                      <p className="text-sm"><strong>Product:</strong> {label.product_code}</p>
                      <p className="text-sm"><strong>Size:</strong> {label.packing_size} pcs</p>
                      <p className="text-sm">
                        <strong>Weight:</strong> {((label.packing_size * label.grams_per_product) / 1000).toFixed(3)} kg
                      </p>
                      <p className="text-xs mt-2"><strong>Mfg:</strong> {new Date(label.date_of_manufacture).toLocaleDateString()}</p>
                      <p className="text-xs"><strong>Packed:</strong> {new Date(label.date_packed).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                handlePrint();
                onPrint();
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              🖨️ Print Labels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LabelsTab = ({ isReadOnly, isProductionHead, onRefresh }) => {
  const [labels, setLabels] = useState([]);
  const [fgStocks, setFgStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ipc: '',
    product_code: '',
    date_from: '',
    date_to: ''
  });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);

  // Fetch labels
  const fetchLabels = useCallback(async () => {
    try {
      setLoading(true);
      const result = await packingZoneAPI.labels.getAll(filters);
      if (!result.error) {
        setLabels(result);
      } else {
        toast.error('Failed to fetch labels');
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
      toast.error('Failed to fetch labels');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch FG stocks for generation
  const fetchFGStocks = useCallback(async () => {
    try {
      const result = await packingZoneAPI.fgStock.getAll();
      if (!result.error) {
        setFgStocks(result);
      }
    } catch (error) {
      console.error('Error fetching FG stocks:', error);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  useEffect(() => {
    if (showGenerateModal) {
      fetchFGStocks();
    }
  }, [showGenerateModal, fetchFGStocks]);

  // Handle generate labels
  const handleGenerateLabels = useCallback(async (labelData) => {
    const toastId = toast.loading('Generating labels...');
    try {
      const result = await packingZoneAPI.labels.create(labelData);
      if (!result.error) {
        toast.success('Labels generated successfully!', { id: toastId });
        setShowGenerateModal(false);
        setSelectedLabel(result);
        setShowPrintPreview(true);
        fetchLabels();
        onRefresh?.();
      } else {
        toast.error(result.message || 'Failed to generate labels', { id: toastId });
      }
    } catch (error) {
      console.error('Error generating labels:', error);
      toast.error('Failed to generate labels', { id: toastId });
    }
  }, [fetchLabels, onRefresh]);

  // Handle reprint
  const handleReprint = useCallback(async (label) => {
    const toastId = toast.loading('Reprinting labels...');
    try {
      const result = await packingZoneAPI.labels.reprint(label.id);
      if (!result.error) {
        toast.success('Labels queued for reprint', { id: toastId });
        setSelectedLabel(result);
        setShowPrintPreview(true);
        fetchLabels();
      } else {
        toast.error(result.message || 'Failed to reprint labels', { id: toastId });
      }
    } catch (error) {
      console.error('Error reprinting labels:', error);
      toast.error('Failed to reprint labels', { id: toastId });
    }
  }, [fetchLabels]);

  // Handle export traceability
  const handleExportTraceability = useCallback(async () => {
    const toastId = toast.loading('Exporting traceability data...');
    try {
      const result = await packingZoneAPI.labels.exportTraceability(filters);
      if (!result.error) {
        // Create CSV
        const headers = ['Label ID', 'IPC', 'Product Code', 'Heat No', 'Packing Size', 'Quantity', 'Generated By', 'Date Generated', 'Print Count', 'Last Printed'];
        const csvContent = [
          headers.join(','),
          ...result.map(l => [
            l.id,
            l.ipc,
            l.product_code,
            l.heat_no,
            l.packing_size,
            l.number_of_labels,
            l.generated_by_name,
            new Date(l.created_at).toLocaleString(),
            l.print_count,
            l.last_printed_at ? new Date(l.last_printed_at).toLocaleString() : 'Never'
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `label_traceability_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Traceability data exported', { id: toastId });
      } else {
        toast.error('Failed to export traceability', { id: toastId });
      }
    } catch (error) {
      console.error('Error exporting traceability:', error);
      toast.error('Failed to export traceability', { id: toastId });
    }
  }, [filters]);

  // Statistics
  const stats = useMemo(() => {
    const totalLabels = labels.reduce((sum, l) => sum + l.number_of_labels, 0);
    const totalPrints = labels.reduce((sum, l) => sum + l.print_count, 0);
    const uniqueProducts = new Set(labels.map(l => l.product_code)).size;
    
    return { totalLabels, totalPrints, uniqueProducts, count: labels.length };
  }, [labels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600">Loading labels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="text-sm text-indigo-600 font-medium">Total Labels</div>
          <div className="text-2xl font-bold text-indigo-900">{stats.totalLabels}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium">Total Prints</div>
          <div className="text-2xl font-bold text-purple-900">{stats.totalPrints}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Products</div>
          <div className="text-2xl font-bold text-blue-900">{stats.uniqueProducts}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Label Batches</div>
          <div className="text-2xl font-bold text-green-900">{stats.count}</div>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-3 md:space-y-0">
          <h3 className="text-lg font-semibold text-gray-900">Label Register</h3>
          <div className="flex space-x-2">
            {!isReadOnly && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                🏷️ Generate New Labels
              </button>
            )}
            {isProductionHead && (
              <button
                onClick={handleExportTraceability}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                📊 Export Traceability
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IPC</label>
            <input
              type="text"
              value={filters.ipc}
              onChange={(e) => setFilters({ ...filters, ipc: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Filter by IPC"
            />
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ ipc: '', product_code: '', date_from: '', date_to: '' })}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Labels Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {labels.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No labels found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.ipc || filters.product_code || filters.date_from || filters.date_to
                ? 'Try adjusting your filters'
                : 'Generate your first label batch'}
            </p>
          </div>
        ) : (
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
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Labels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prints
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {labels.map((label) => (
                  <tr key={label.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{label.ipc}</div>
                      <div className="text-xs text-gray-500">{label.product_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {label.heat_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {label.packing_size} pcs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {label.number_of_labels}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {label.generated_by_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(label.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {label.print_count}x
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!isReadOnly && (
                        <button
                          onClick={() => handleReprint(label)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          🖨️ Reprint
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Traceability:</strong> All label generations and reprints are logged with timestamp and user information.
              Heat numbers are tracked internally but not displayed on customer-facing labels.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showGenerateModal && (
        <GenerateLabelModal
          fgStocks={fgStocks}
          onClose={() => setShowGenerateModal(false)}
          onSubmit={handleGenerateLabels}
        />
      )}

      {showPrintPreview && selectedLabel && (
        <LabelPrintPreview
          label={selectedLabel}
          onClose={() => {
            setShowPrintPreview(false);
            setSelectedLabel(null);
          }}
          onPrint={() => {
            toast.success('Labels printed successfully!');
          }}
        />
      )}
    </div>
  );
};

export default LabelsTab;

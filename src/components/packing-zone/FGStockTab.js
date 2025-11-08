'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import packingZoneAPI from '@/components/API_Service/packing-zone-api';
import toast from 'react-hot-toast';

const FGStockTab = ({ isReadOnly, isProductionHead, onRefresh }) => {
  const [stocks, setStocks] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    product_code: '',
    heat_no: ''
  });
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'
  const [expandedProducts, setExpandedProducts] = useState([]);

  // Fetch stocks
  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      const result = await packingZoneAPI.fgStock.getAll(filters);
      if (!result.error) {
        setStocks(result);
      } else {
        toast.error('Failed to fetch FG stock');
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Failed to fetch FG stock');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const result = await packingZoneAPI.fgStock.getSummary();
      if (!result.error) {
        setSummary(result);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    if (viewMode === 'summary') {
      fetchSummary();
    }
  }, [fetchStocks, fetchSummary, viewMode]);

  // Toggle product expansion
  const toggleProduct = useCallback((productCode) => {
    setExpandedProducts(prev =>
      prev.includes(productCode)
        ? prev.filter(p => p !== productCode)
        : [...prev, productCode]
    );
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const totalPacks = stocks.reduce((sum, s) => sum + s.total_packs, 0);
    const uniqueProducts = new Set(stocks.map(s => s.product_code)).size;
    const uniqueHeatNos = new Set(stocks.map(s => s.heat_no)).size;
    
    return {
      totalPacks,
      uniqueProducts,
      uniqueHeatNos,
      stockCount: stocks.length
    };
  }, [stocks]);

  // Export to CSV
  const handleExport = useCallback(() => {
    if (stocks.length === 0) {
      toast.error('No stock to export');
      return;
    }

    const headers = ['Product Code', 'IPC', 'Heat No', 'Packing Size', 'Total Packs', 'Grams per Product'];
    const csvContent = [
      headers.join(','),
      ...stocks.map(s => [
        s.product_code,
        s.ipc,
        s.heat_no,
        s.packing_size,
        s.total_packs,
        s.grams_per_product
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fg_stock_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('FG stock exported successfully');
  }, [stocks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600">Loading FG stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Total Packs</div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalPacks}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Products</div>
          <div className="text-2xl font-bold text-green-900">{stats.uniqueProducts}</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="text-sm text-indigo-600 font-medium">Heat Numbers</div>
          <div className="text-2xl font-bold text-indigo-900">{stats.uniqueHeatNos}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium">Stock Lots</div>
          <div className="text-2xl font-bold text-purple-900">{stats.stockCount}</div>
        </div>
      </div>

      {/* View Mode Toggle & Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-3 md:space-y-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'summary'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Summary View
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Detailed View
            </button>
          </div>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            📥 Export to CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <button
              onClick={() => setFilters({ product_code: '', heat_no: '' })}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="space-y-4">
          {summary.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No FG stock found</h3>
              <p className="mt-1 text-sm text-gray-500">No finished goods in stock</p>
            </div>
          ) : (
            summary.map((productGroup) => (
              <div key={productGroup.product_code} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Product Header */}
                <div
                  className="bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleProduct(productGroup.product_code)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{productGroup.ipc}</h3>
                      <p className="text-sm text-gray-500">{productGroup.product_code}</p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total Packs</div>
                        <div className="text-2xl font-bold text-indigo-600">{productGroup.total_packs}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Heat Numbers</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {productGroup.by_heat_no?.length || 0}
                        </div>
                      </div>
                      <svg
                        className={`w-6 h-6 text-gray-400 transition-transform ${
                          expandedProducts.includes(productGroup.product_code) ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Heat Number Details */}
                {expandedProducts.includes(productGroup.product_code) && (
                  <div className="border-t">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Heat No
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Packing Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Packs
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Pieces
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {productGroup.by_heat_no?.map((heatStock, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {heatStock.heat_no}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {heatStock.packing_size} pcs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {heatStock.packs}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {heatStock.packs * heatStock.packing_size} pcs
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Detailed View */}
      {viewMode === 'detailed' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {stocks.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No FG stock found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.product_code || filters.heat_no
                  ? 'Try adjusting your filters'
                  : 'No finished goods in stock'}
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
                      Packing Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Packs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Pieces
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grams/Pc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{stock.ipc}</div>
                        <div className="text-xs text-gray-500">{stock.product_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.heat_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stock.packing_size} pcs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {stock.total_packs}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stock.total_packs * stock.packing_size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {stock.grams_per_product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(stock.last_updated).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
              FG stock shows finished goods ready for dispatch. Use the Labels tab to generate packing labels.
              Heat numbers are tracked internally but not printed on customer-facing labels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FGStockTab;

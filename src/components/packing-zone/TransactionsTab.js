'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import packingZoneAPI from '@/components/API_Service/packing-zone-api';
import toast from 'react-hot-toast';

const TransactionDetailModal = ({ transaction, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Product Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">IPC:</span>
                <span className="text-sm font-medium text-gray-900">{transaction.ipc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Product Code:</span>
                <span className="text-sm font-medium text-gray-900">{transaction.product_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Heat No:</span>
                <span className="text-sm font-medium text-gray-900">{transaction.heat_no}</span>
              </div>
            </div>
          </div>

          {/* Packing Details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Packing Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-xs text-blue-600">Total Weight</div>
                <div className="text-xl font-bold text-blue-900">
                  {parseFloat(transaction.total_weight_kg).toFixed(3)} kg
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-xs text-green-600">Actual Packs</div>
                <div className="text-xl font-bold text-green-900">
                  {transaction.actual_packs}
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="text-xs text-amber-600">Loose Weight</div>
                <div className="text-xl font-bold text-amber-900">
                  {parseFloat(transaction.loose_weight_kg).toFixed(3)} kg
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-xs text-purple-600">Loose Pieces</div>
                <div className="text-xl font-bold text-purple-900">
                  {transaction.loose_pieces}
                </div>
              </div>
            </div>
          </div>

          {/* Calculations */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Calculations</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Packing Size:</span>
                <span className="text-sm font-medium text-gray-900">{transaction.packing_size} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Grams per Product:</span>
                <span className="text-sm font-medium text-gray-900">{transaction.grams_per_product} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Theoretical Packs:</span>
                <span className="text-sm font-medium text-gray-900">{transaction.theoretical_packs}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-semibold text-gray-700">Variance:</span>
                <span className={`text-sm font-bold ${Math.abs(parseFloat(transaction.variance_kg)) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                  {parseFloat(transaction.variance_kg).toFixed(3)} kg
                </span>
              </div>
            </div>
          </div>

          {/* Batch Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Batches Packed</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                {transaction.batch_count || 'N/A'} batch(es) were packed in this transaction
              </p>
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Timestamp</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Packed By:</span>
                <span className="text-sm font-medium text-gray-900">{transaction.packed_by_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Packed Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(transaction.packed_date).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TransactionsTab = ({ isReadOnly, isProductionHead, onRefresh }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    product_code: '',
    heat_no: '',
    my_transactions: true
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const result = filters.my_transactions
        ? await packingZoneAPI.transactions.getMyTransactions({
            start_date: filters.start_date,
            end_date: filters.end_date
          })
        : await packingZoneAPI.transactions.getAll(filters);
      
      if (!result.error) {
        setTransactions(result);
      } else {
        toast.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Get today's date for default filter
  const today = new Date().toISOString().split('T')[0];

  // Statistics
  const stats = useMemo(() => {
    const totalPacks = transactions.reduce((sum, t) => sum + t.actual_packs, 0);
    const totalWeight = transactions.reduce((sum, t) => sum + parseFloat(t.total_weight_kg), 0);
    const totalLoose = transactions.reduce((sum, t) => sum + parseFloat(t.loose_weight_kg), 0);
    
    return {
      count: transactions.length,
      totalPacks,
      totalWeight: totalWeight.toFixed(3),
      totalLoose: totalLoose.toFixed(3)
    };
  }, [transactions]);

  // Handle view details
  const handleViewDetails = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  }, []);

  // Export to CSV
  const handleExport = useCallback(() => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = [
      'Date/Time', 'Product Code', 'IPC', 'Heat No', 'Total Weight (kg)',
      'Actual Packs', 'Loose Weight (kg)', 'Loose Pieces', 'Variance (kg)', 'Packed By'
    ];

    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        new Date(t.packed_date).toLocaleString(),
        t.product_code,
        t.ipc,
        t.heat_no,
        parseFloat(t.total_weight_kg).toFixed(3),
        t.actual_packs,
        parseFloat(t.loose_weight_kg).toFixed(3),
        t.loose_pieces,
        parseFloat(t.variance_kg).toFixed(3),
        t.packed_by_name
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `packing_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Transactions exported successfully');
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Transactions</div>
          <div className="text-2xl font-bold text-blue-900">{stats.count}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Total Packs</div>
          <div className="text-2xl font-bold text-green-900">{stats.totalPacks}</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="text-sm text-indigo-600 font-medium">Total Weight</div>
          <div className="text-2xl font-bold text-indigo-900">{stats.totalWeight} kg</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-sm text-amber-600 font-medium">Total Loose</div>
          <div className="text-2xl font-bold text-amber-900">{stats.totalLoose} kg</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Heat No</label>
            <input
              type="text"
              value={filters.heat_no}
              onChange={(e) => setFilters({ ...filters, heat_no: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Filter by heat no"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => setFilters({ start_date: '', end_date: '', product_code: '', heat_no: '', my_transactions: true })}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              Clear
            </button>
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* My Transactions Toggle */}
        <div className="mt-4 pt-4 border-t">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.my_transactions}
              onChange={(e) => setFilters({ ...filters, my_transactions: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Show only my transactions</span>
          </label>
        </div>
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.start_date || filters.end_date || filters.product_code || filters.heat_no
              ? 'Try adjusting your filters'
              : 'No packing transactions available'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
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
                    Packs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loose (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.packed_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.ipc}</div>
                      <div className="text-xs text-gray-500">{transaction.product_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.heat_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {parseFloat(transaction.total_weight_kg).toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {transaction.actual_packs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseFloat(transaction.loose_weight_kg).toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${Math.abs(parseFloat(transaction.variance_kg)) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                        {parseFloat(transaction.variance_kg).toFixed(3)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetails(transaction)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export default TransactionsTab;

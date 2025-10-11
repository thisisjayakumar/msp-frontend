"use client";

import { useEffect, useState, useRef } from 'react';
import { inventoryAPI } from '../API_Service/inventory-api';
import DashboardLoader from '../CommonComponents/ui/DashboardLoader';
import Button from '../CommonComponents/ui/Button';
import { Card } from '../CommonComponents/ui/Card';

const TRANSACTION_TYPE_MAP = {
  inward: 'Inward Receipt',
  outward: 'Outward Issue',
  transfer: 'Location Transfer',
  adjustment: 'Stock Adjustment',
  consumption: 'Process Consumption',
  production: 'Process Output',
  scrap: 'Scrap Generation',
  return: 'Return to Stock',
};

const REFERENCE_TYPE_MAP = {
  mo: 'Manufacturing Order',
  po: 'Purchase Order',
  process: 'Process Execution',
  adjustment: 'Stock Adjustment',
};

const DEFAULT_FILTERS = {
  transaction_type: 'all',
  reference_type: 'all',
  search: '',
};

export default function InventoryTransactionsTab() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  
  // Prevent duplicate API calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filters.transaction_type !== 'all') {
        params.transaction_type = filters.transaction_type;
      }

      if (filters.reference_type !== 'all') {
        params.reference_type = filters.reference_type;
      }

      if (filters.search) {
        params.search = filters.search;
      }

      const data = await inventoryAPI.transactions.getAll(params);
      setTransactions(Array.isArray(data) ? data : data?.results ?? []);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory transactions:', err);
      setError(err.message || 'Failed to fetch inventory transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode (development only)
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = async () => {
    await fetchTransactions();
  };

  if (loading) {
    return <DashboardLoader message="Loading inventory transactions..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-xl mx-auto p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Loading Transactions</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchTransactions} variant="primary">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Inventory Transactions</h2>
        <Button onClick={fetchTransactions} variant="secondary">
          Refresh
        </Button>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={filters.transaction_type}
              onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
              className="w-full border border-gray-300 text-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All</option>
              {Object.entries(TRANSACTION_TYPE_MAP).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Type</label>
            <select
              value={filters.reference_type}
              onChange={(e) => handleFilterChange('reference_type', e.target.value)}
              className="w-full border border-gray-300 text-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All</option>
              {Object.entries(REFERENCE_TYPE_MAP).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by transaction ID, product code, MO ID..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <Button onClick={handleApplyFilters} variant="primary">
                Apply
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {transactions.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-600">
            Adjust your filters or date range to see different results.
          </p>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {txn.transaction_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {TRANSACTION_TYPE_MAP[txn.transaction_type] || txn.transaction_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {txn.product_display || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div>
                        <span className="font-medium">From:</span>{' '}
                        {txn.location_from_details?.location_name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">To:</span>{' '}
                        {txn.location_to_details?.location_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {txn.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div>
                        {REFERENCE_TYPE_MAP[txn.reference_type] || txn.reference_type || 'N/A'}
                      </div>
                      {txn.reference_id && (
                        <div className="text-xs text-gray-500">{txn.reference_id}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {txn.transaction_datetime
                        ? new Date(txn.transaction_datetime).toLocaleString('en-IN')
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

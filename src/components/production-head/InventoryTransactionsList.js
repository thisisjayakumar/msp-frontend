"use client";

import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, CalendarIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { apiRequest } from '@/components/API_Service/api-utils';
import { INVENTORY_APIS } from '@/components/API_Service/api-list';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function InventoryTransactionsList() {
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); // Store all fetched data
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    transaction_type: '',
    start_date: '',
    end_date: '',
  });
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, []); // Only fetch on initial load

  // Client-side filtering effect
  useEffect(() => {
    filterTransactions();
  }, [filters, allTransactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ordering: '-transaction_datetime',
      });

      const response = await apiRequest(`${INVENTORY_APIS.TRANSACTION_LIST}?${params.toString()}`, {
        method: 'GET',
      });

      if (response.success) {
        const fetchedData = response.data.results || response.data;
        setAllTransactions(fetchedData); // Store all data
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length,
        }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...allTransactions];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(transaction => 
        (transaction.transaction_id && typeof transaction.transaction_id === 'string' && transaction.transaction_id.toLowerCase().includes(searchTerm)) ||
        (transaction.mo_display && typeof transaction.mo_display === 'string' && transaction.mo_display.toLowerCase().includes(searchTerm)) ||
        (transaction.related_mo_display && typeof transaction.related_mo_display === 'string' && transaction.related_mo_display.toLowerCase().includes(searchTerm)) ||
        (transaction.raw_material_display && typeof transaction.raw_material_display === 'string' && transaction.raw_material_display.toLowerCase().includes(searchTerm)) ||
        (transaction.product_display && typeof transaction.product_display === 'string' && transaction.product_display.toLowerCase().includes(searchTerm))
      );
    }

    // Transaction type filter
    if (filters.transaction_type) {
      filtered = filtered.filter(transaction => 
        transaction.transaction_type === filters.transaction_type
      );
    }

    // Date range filter
    if (filters.start_date || filters.end_date) {
      filtered = filtered.filter(transaction => {
        if (!transaction.transaction_datetime) return false;
        
        const transactionDate = new Date(transaction.transaction_datetime);
        const startDate = filters.start_date ? new Date(filters.start_date) : null;
        const endDate = filters.end_date ? new Date(filters.end_date) : null;
        
        if (startDate && endDate) {
          return transactionDate >= startDate && transactionDate <= endDate;
        } else if (startDate) {
          return transactionDate >= startDate;
        } else if (endDate) {
          return transactionDate <= endDate;
        }
        return true;
      });
    }

    // Apply pagination
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedTransactions = filtered.slice(startIndex, endIndex);
    
    setTransactions(paginatedTransactions);
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRefresh = () => {
    fetchTransactions();
  };

  // Handle date range change
  const handleDateRangeChange = (update) => {
    setDateRange(update);
    if (update[0] && update[1]) {
      // Both dates selected
      setFilters(prev => ({
        ...prev,
        start_date: update[0].toISOString().split('T')[0],
        end_date: update[1].toISOString().split('T')[0]
      }));
    } else if (update[0]) {
      // Only start date selected
      setFilters(prev => ({
        ...prev,
        start_date: update[0].toISOString().split('T')[0],
        end_date: ''
      }));
    } else {
      // No dates selected
      setFilters(prev => ({
        ...prev,
        start_date: '',
        end_date: ''
      }));
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getTransactionTypeInfo = (type) => {
    const typeMap = {
      inward: { label: 'Inward Receipt', color: 'green', icon: ArrowDownIcon },
      outward: { label: 'Outward Issue', color: 'red', icon: ArrowUpIcon },
      transfer: { label: 'Transfer', color: 'blue', icon: ArrowRightIcon },
      adjustment: { label: 'Adjustment', color: 'yellow', icon: CalendarIcon },
      consumption: { label: 'Consumption', color: 'purple', icon: ArrowUpIcon },
      production: { label: 'Production', color: 'green', icon: ArrowDownIcon },
      scrap: { label: 'Scrap', color: 'red', icon: ArrowUpIcon },
      return: { label: 'Return to Stock', color: 'green', icon: ArrowDownIcon },
    };
    return typeMap[type] || { label: type, color: 'gray', icon: CalendarIcon };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Filters</h3>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Transaction ID, MO, Product..."
                className="w-full pl-10 text-slate-600 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Transaction Type
            </label>
            <select
              value={filters.transaction_type}
              onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
              className="w-full px-3 text-slate-600 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">All Types</option>
              <option value="inward">Inward Receipt</option>
              <option value="outward">Outward Issue</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
              <option value="consumption">Consumption</option>
              <option value="production">Production</option>
              <option value="scrap">Scrap</option>
              <option value="return">Return to Stock</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date Range
            </label>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              isClearable={true}
              placeholderText="Select date range"
              dateFormat="MMM d, yyyy"
              className="w-full px-3 py-2 text-sm text-slate-500 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-400"
              wrapperClassName="w-full"
              withPortal
              portalId="date-picker-portal"
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
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
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From → To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => {
                  const typeInfo = getTransactionTypeInfo(transaction.transaction_type);
                  const Icon = typeInfo.icon;
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.transaction_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.raw_material_display || transaction.product_display || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.quantity} {transaction.raw_material ? 'kg' : 'units'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.mo_display || transaction.related_mo_display || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span className="truncate max-w-[100px]">{transaction.from_location || 'N/A'}</span>
                          <span>→</span>
                          <span className="truncate max-w-[100px]">{transaction.to_location || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(transaction.transaction_datetime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.created_by_name || 'System'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.pageSize >= pagination.total}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {pagination.page}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page * pagination.pageSize >= pagination.total}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


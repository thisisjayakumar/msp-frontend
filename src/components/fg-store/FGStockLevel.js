'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/CommonComponents/ui/Card';
import { Button } from '@/components/CommonComponents/ui/Button';
import { Input } from '@/components/CommonComponents/ui/Input';
import { LoadingSpinner } from '@/components/CommonComponents/ui/LoadingSpinner';
import { SearchableDropdown } from '@/components/CommonComponents/ui/SearchableDropdown';

const FGStockLevel = ({ refreshTrigger }) => {
  const [stockLevels, setStockLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    product_code: '',
    customer_id: '',
    batch_id: '',
    status: ''
  });
  const [sortBy, setSortBy] = useState('packing_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const fetchStockLevels = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      queryParams.append('sort_by', sortBy);
      queryParams.append('sort_order', sortOrder);
      queryParams.append('page', currentPage);

      const response = await fetch(
        `/api/fg-store/dashboard/stock_levels/?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stock levels');
      }

      const data = await response.json();
      setStockLevels(data.results || data);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/third-party/customers/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.results || data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.results || data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    fetchStockLevels();
  }, [refreshTrigger, filters, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setFilters({
      product_code: '',
      customer_id: '',
      batch_id: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending_dispatch': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Dispatch' },
      'partially_dispatched': { color: 'bg-orange-100 text-orange-800', label: 'Partially Dispatched' },
      'fully_dispatched': { color: 'bg-green-100 text-green-800', label: 'Fully Dispatched' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStockLevelColor = (quantity) => {
    if (quantity === 0) return 'text-red-600 font-bold';
    if (quantity < 50) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  if (loading && stockLevels.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Code
            </label>
            <SearchableDropdown
              options={products.map(p => ({ value: p.product_code, label: p.product_code }))}
              value={filters.product_code}
              onChange={(value) => handleFilterChange('product_code', value)}
              placeholder="Search products..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <SearchableDropdown
              options={customers.map(c => ({ value: c.c_id, label: c.name }))}
              value={filters.customer_id}
              onChange={(value) => handleFilterChange('customer_id', value)}
              placeholder="Search customers..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch ID
            </label>
            <Input
              type="text"
              value={filters.batch_id}
              onChange={(e) => handleFilterChange('batch_id', e.target.value)}
              placeholder="Enter batch ID..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending_dispatch">Pending Dispatch</option>
              <option value="partially_dispatched">Partially Dispatched</option>
              <option value="fully_dispatched">Fully Dispatched</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
          <div className="text-sm text-gray-500">
            {stockLevels.length} batches found
          </div>
        </div>
      </Card>

      {/* Stock Levels Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">FG Stock Levels</h3>
        </div>
        
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('batch_id')}
                >
                  Batch ID {sortBy === 'batch_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('mo_id')}
                >
                  MO ID {sortBy === 'mo_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('product_code')}
                >
                  Product {sortBy === 'product_code' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity_in_stock')}
                >
                  Stock Qty {sortBy === 'quantity_in_stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loose Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('delivery_date')}
                >
                  Delivery Date {sortBy === 'delivery_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockLevels.map((item) => (
                <tr key={item.batch_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.batch_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.mo_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{item.product_code}</div>
                      <div className="text-gray-500">{item.product_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getStockLevelColor(item.quantity_in_stock)}>
                      {item.quantity_in_stock.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.loose_stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.location || 'FG Store'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.delivery_date ? new Date(item.delivery_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {stockLevels.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No stock levels found matching your criteria.</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FGStockLevel;

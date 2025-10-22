'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/CommonComponents/ui/Card';
import { Button } from '@/components/CommonComponents/ui/Button';
import { Input } from '@/components/CommonComponents/ui/Input';
import { LoadingSpinner } from '@/components/CommonComponents/ui/LoadingSpinner';
import { SearchableDropdown } from '@/components/CommonComponents/ui/SearchableDropdown';

const MOList = ({ onMOSelect, refreshTrigger }) => {
  const [mos, setMos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    customer_id: '',
    priority: '',
    delivery_date: '',
    status: ''
  });
  const [sortBy, setSortBy] = useState('delivery_date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [customers, setCustomers] = useState([]);

  const fetchMOs = async () => {
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
        `/api/fg-store/dashboard/pending_dispatch_mos/?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch manufacturing orders');
      }

      const data = await response.json();
      setMos(data.results || data);
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

  useEffect(() => {
    fetchMOs();
  }, [refreshTrigger, filters, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchCustomers();
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
      customer_id: '',
      priority: '',
      delivery_date: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'low': { color: 'bg-gray-100 text-gray-800', label: 'Low' },
      'medium': { color: 'bg-blue-100 text-blue-800', label: 'Medium' },
      'high': { color: 'bg-orange-100 text-orange-800', label: 'High' },
      'urgent': { color: 'bg-red-100 text-red-800', label: 'Urgent' }
    };
    
    const config = priorityConfig[priority] || { color: 'bg-gray-100 text-gray-800', label: priority };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending_dispatch': { color: 'bg-yellow-100 text-yellow-800', label: 'Ready for Dispatch' },
      'partially_dispatched': { color: 'bg-orange-100 text-orange-800', label: 'Partially Dispatched' },
      'fully_dispatched': { color: 'bg-green-100 text-green-800', label: 'Fully Dispatched' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getDispatchPercentageColor = (percentage) => {
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const isDeliveryOverdue = (deliveryDate) => {
    if (!deliveryDate) return false;
    return new Date(deliveryDate) < new Date();
  };

  if (loading && mos.length === 0) {
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
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Date
            </label>
            <Input
              type="date"
              value={filters.delivery_date}
              onChange={(e) => handleFilterChange('delivery_date', e.target.value)}
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
              <option value="pending_dispatch">Ready for Dispatch</option>
              <option value="partially_dispatched">Partially Dispatched</option>
              <option value="fully_dispatched">Fully Dispatched</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
          <div className="text-sm text-gray-500">
            {mos.length} manufacturing orders found
          </div>
        </div>
      </Card>

      {/* MO List Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Manufacturing Orders - Pending Dispatch</h3>
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
                  onClick={() => handleSort('mo_id')}
                >
                  MO ID {sortBy === 'mo_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity_ordered')}
                >
                  Ordered {sortBy === 'quantity_ordered' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity_packed')}
                >
                  Packed {sortBy === 'quantity_packed' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity_dispatched')}
                >
                  Dispatched {sortBy === 'quantity_dispatched' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('delivery_date')}
                >
                  Delivery Date {sortBy === 'delivery_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mos.map((mo) => (
                <tr key={mo.mo_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {mo.mo_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{mo.customer_name}</div>
                      <div className="text-gray-500">{mo.customer_c_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{mo.product_code}</div>
                      <div className="text-gray-500">{mo.product_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mo.quantity_ordered.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mo.quantity_packed.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mo.quantity_dispatched.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={mo.quantity_pending > 0 ? 'text-orange-600 font-semibold' : 'text-green-600'}>
                      {mo.quantity_pending.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className={isDeliveryOverdue(mo.delivery_date) ? 'text-red-600 font-semibold' : ''}>
                      {mo.delivery_date ? new Date(mo.delivery_date).toLocaleDateString() : '-'}
                      {isDeliveryOverdue(mo.delivery_date) && (
                        <span className="ml-1 text-xs">⚠️</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPriorityBadge(mo.priority)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(mo.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => onMOSelect(mo)}
                        size="sm"
                        disabled={mo.quantity_pending === 0}
                      >
                        Dispatch
                      </Button>
                      <Button
                        onClick={() => {/* TODO: Implement view details */}}
                        variant="outline"
                        size="sm"
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {mos.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No manufacturing orders found matching your criteria.</p>
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

export default MOList;

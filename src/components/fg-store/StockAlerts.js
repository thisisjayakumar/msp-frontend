'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/CommonComponents/ui/Card';
import { Button } from '@/components/CommonComponents/ui/Button';
import { Input } from '@/components/CommonComponents/ui/Input';
import { LoadingSpinner } from '@/components/CommonComponents/ui/LoadingSpinner';
import { SearchableDropdown } from '@/components/CommonComponents/ui/SearchableDropdown';

const StockAlerts = ({ refreshTrigger }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    product_code: '',
    alert_type: '',
    severity: '',
    is_active: ''
  });
  const [sortBy, setSortBy] = useState('last_triggered');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    product_code: '',
    alert_type: 'low_stock',
    severity: 'medium',
    min_stock_level: '',
    max_stock_level: '',
    expiry_days_threshold: '',
    description: '',
    is_active: true
  });

  const fetchAlerts = async () => {
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
        `/api/fg-store/stock-alerts/?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stock alerts');
      }

      const data = await response.json();
      setAlerts(data.results || data);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    fetchAlerts();
  }, [refreshTrigger, filters, sortBy, sortOrder, currentPage]);

  useEffect(() => {
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
      alert_type: '',
      severity: '',
      is_active: ''
    });
    setCurrentPage(1);
  };

  const handleCreateAlert = async () => {
    try {
      setLoading(true);
      
      const alertData = {
        ...newAlert,
        min_stock_level: newAlert.min_stock_level ? parseInt(newAlert.min_stock_level) : null,
        max_stock_level: newAlert.max_stock_level ? parseInt(newAlert.max_stock_level) : null,
        expiry_days_threshold: newAlert.expiry_days_threshold ? parseInt(newAlert.expiry_days_threshold) : null
      };

      const response = await fetch('/api/fg-store/stock-alerts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alertData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create alert');
      }

      setShowCreateModal(false);
      setNewAlert({
        product_code: '',
        alert_type: 'low_stock',
        severity: 'medium',
        min_stock_level: '',
        max_stock_level: '',
        expiry_days_threshold: '',
        description: '',
        is_active: true
      });
      fetchAlerts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlertStatus = async (alertId, isActive) => {
    try {
      const response = await fetch(`/api/fg-store/stock-alerts/${alertId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update alert status');
      }

      fetchAlerts();
    } catch (err) {
      setError(err.message);
    }
  };

  const getSeverityBadge = (severity) => {
    const severityConfig = {
      'low': { color: 'bg-gray-100 text-gray-800', label: 'Low' },
      'medium': { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      'high': { color: 'bg-orange-100 text-orange-800', label: 'High' },
      'critical': { color: 'bg-red-100 text-red-800', label: 'Critical' }
    };
    
    const config = severityConfig[severity] || { color: 'bg-gray-100 text-gray-800', label: severity };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getAlertTypeIcon = (type) => {
    const icons = {
      'low_stock': '📉',
      'expiring': '⏰',
      'overstock': '📈',
      'custom': '⚠️'
    };
    return icons[type] || '⚠️';
  };

  const getAlertTypeLabel = (type) => {
    const labels = {
      'low_stock': 'Low Stock',
      'expiring': 'Expiring Batch',
      'overstock': 'Overstock',
      'custom': 'Custom Alert'
    };
    return labels[type] || type;
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock Alerts</h2>
          <p className="text-gray-600">Manage proactive notifications for stock levels</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Create Alert
        </Button>
      </div>

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
              Alert Type
            </label>
            <select
              value={filters.alert_type}
              onChange={(e) => handleFilterChange('alert_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="low_stock">Low Stock</option>
              <option value="expiring">Expiring Batch</option>
              <option value="overstock">Overstock</option>
              <option value="custom">Custom Alert</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
          <div className="text-sm text-gray-500">
            {alerts.length} alerts found
          </div>
        </div>
      </Card>

      {/* Alerts Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Stock Alerts</h3>
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
                  onClick={() => handleSort('product_code')}
                >
                  Product {sortBy === 'product_code' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('alert_type')}
                >
                  Alert Type {sortBy === 'alert_type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('severity')}
                >
                  Severity {sortBy === 'severity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thresholds
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('last_triggered')}
                >
                  Last Triggered {sortBy === 'last_triggered' && (sortOrder === 'asc' ? '↑' : '↓')}
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
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {alert.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="flex items-center">
                      <span className="mr-2">{getAlertTypeIcon(alert.alert_type)}</span>
                      {getAlertTypeLabel(alert.alert_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSeverityBadge(alert.severity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-xs">
                      {alert.min_stock_level && (
                        <div>Min: {alert.min_stock_level}</div>
                      )}
                      {alert.max_stock_level && (
                        <div>Max: {alert.max_stock_level}</div>
                      )}
                      {alert.expiry_days_threshold && (
                        <div>Expiry: {alert.expiry_days_threshold} days</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {alert.last_triggered ? new Date(alert.last_triggered).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => toggleAlertStatus(alert.id, alert.is_active)}
                      variant="outline"
                      size="sm"
                    >
                      {alert.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {alerts.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No alerts found matching your criteria.</p>
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

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Create Stock Alert</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <SearchableDropdown
                  options={products.map(p => ({ value: p.product_code, label: p.product_code }))}
                  value={newAlert.product_code}
                  onChange={(value) => setNewAlert(prev => ({ ...prev, product_code: value }))}
                  placeholder="Select product..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Type
                </label>
                <select
                  value={newAlert.alert_type}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, alert_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low_stock">Low Stock</option>
                  <option value="expiring">Expiring Batch</option>
                  <option value="overstock">Overstock</option>
                  <option value="custom">Custom Alert</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={newAlert.severity}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Stock Level
                  </label>
                  <Input
                    type="number"
                    value={newAlert.min_stock_level}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, min_stock_level: e.target.value }))}
                    placeholder="Min level"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Stock Level
                  </label>
                  <Input
                    type="number"
                    value={newAlert.max_stock_level}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, max_stock_level: e.target.value }))}
                    placeholder="Max level"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Days Threshold
                </label>
                <Input
                  type="number"
                  value={newAlert.expiry_days_threshold}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, expiry_days_threshold: e.target.value }))}
                  placeholder="Days before expiry"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newAlert.description}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Alert description..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <Button onClick={() => setShowCreateModal(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleCreateAlert} disabled={loading}>
                {loading ? 'Creating...' : 'Create Alert'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;

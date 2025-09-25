"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

export default function OrdersList({ type }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    ordering: '-created_at'
  });
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1
  });

  const isMO = type === 'mo';
  const api = isMO ? manufacturingAPI.manufacturingOrders : manufacturingAPI.purchaseOrders;

  // Fetch orders
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const queryFilters = {
        ...filters,
        page
      };
      
      const response = await api.getAll(queryFilters);
      setOrders(response.results || []);
      setPagination({
        count: response.count || 0,
        next: response.next,
        previous: response.previous,
        current_page: page
      });
    } catch (error) {
      console.error(`Error fetching ${type} orders:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters, type]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStatusChange = async (orderId, newStatus, notes = '') => {
    try {
      await api.changeStatus(orderId, { status: newStatus, notes });
      fetchOrders(pagination.current_page);
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Failed to change status');
    }
  };

  const handleMOClick = (order) => {
    if (isMO) {
      router.push(`/manager/mo-detail/${order.id}`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      gm_approved: 'bg-green-100 text-green-700',
      rm_allocated: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-orange-100 text-orange-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
      gm_created_po: 'bg-indigo-100 text-indigo-700',
      vendor_confirmed: 'bg-teal-100 text-teal-700',
      partially_received: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-32"></div>
                <div className="h-3 bg-slate-200 rounded w-48"></div>
              </div>
              <div className="h-6 bg-slate-200 rounded w-20"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-3 bg-slate-200 rounded"></div>
              <div className="h-3 bg-slate-200 rounded"></div>
              <div className="h-3 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={`Search ${isMO ? 'MO ID, product' : 'PO ID, material, vendor'}...`}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {isMO ? (
                <>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="gm_approved">GM Approved</option>
                  <option value="rm_allocated">RM Allocated</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </>
              ) : (
                <>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="gm_approved">GM Approved</option>
                  <option value="gm_created_po">GM Created PO</option>
                  <option value="vendor_confirmed">Vendor Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
            <select
              value={filters.ordering}
              onChange={(e) => handleFilterChange('ordering', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              {isMO ? (
                <>
                  <option value="-planned_start_date">Start Date (Latest)</option>
                  <option value="planned_start_date">Start Date (Earliest)</option>
                  <option value="-delivery_date">Delivery Date (Latest)</option>
                  <option value="delivery_date">Delivery Date (Earliest)</option>
                </>
              ) : (
                <>
                  <option value="-expected_date">Expected Date (Latest)</option>
                  <option value="expected_date">Expected Date (Earliest)</option>
                  <option value="-total_amount">Amount (High to Low)</option>
                  <option value="total_amount">Amount (Low to High)</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl">
            <div className="text-6xl mb-4">{isMO ? '🏭' : '📦'}</div>
            <h3 className="text-xl font-medium text-slate-600 mb-2">
              No {isMO ? 'Manufacturing' : 'Purchase'} Orders Found
            </h3>
            <p className="text-slate-500">
              {filters.search || filters.status 
                ? 'Try adjusting your filters to see more results.'
                : `Create your first ${isMO ? 'manufacturing' : 'purchase'} order to get started.`
              }
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div 
              key={order.id} 
              className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 hover:shadow-xl hover:shadow-slate-300/50 transition-all ${
                isMO ? 'cursor-pointer hover:bg-white/90' : ''
              }`}
              onClick={() => handleMOClick(order)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                      <span>{isMO ? order.mo_id : order.po_id}</span>
                      {isMO && (
                        <span className="text-xs text-blue-600 font-normal">
                          → View Details
                        </span>
                      )}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status_display}
                    </span>
                    {isMO && order.priority && (
                      <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                        {order.priority_display}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">
                    {isMO 
                      ? `${order.product_code?.display_name || order.product_code?.product_code} - Qty: ${order.quantity}`
                      : `${order.rm_code?.display_name || order.rm_code?.product_code} - Qty: ${order.quantity_ordered}`
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                  {!isMO && order.total_amount && (
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Total Amount</p>
                      <p className="font-bold text-slate-800">₹{order.total_amount.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    {order.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'submitted', 'Submitted for approval')}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Submit
                      </button>
                    )}
                    {order.status === 'submitted' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'gm_approved', 'Approved by GM')}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 font-medium">Created:</span>
                  <span className="ml-2 text-slate-700">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                {isMO ? (
                  <>
                    <div>
                      <span className="text-slate-500 font-medium">Supervisor:</span>
                      <span className="ml-2 text-slate-700">
                        {order.assigned_supervisor?.display_name || 'Not assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Shift:</span>
                      <span className="ml-2 text-slate-700">{order.shift_display}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Delivery:</span>
                      <span className="ml-2 text-slate-700">
                        {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-500 font-medium">Vendor:</span>
                      <span className="ml-2 text-slate-700">{order.vendor_name?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Expected:</span>
                      <span className="ml-2 text-slate-700">
                        {new Date(order.expected_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Unit Price:</span>
                      <span className="ml-2 text-slate-700">₹{order.unit_price}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.count > 20 && (
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60">
          <div className="text-sm text-slate-600">
            Showing {((pagination.current_page - 1) * 20) + 1} to {Math.min(pagination.current_page * 20, pagination.count)} of {pagination.count} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchOrders(pagination.current_page - 1)}
              disabled={!pagination.previous}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => fetchOrders(pagination.current_page + 1)}
              disabled={!pagination.next}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

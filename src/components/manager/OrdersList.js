"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import { toast } from '@/utils/notifications';

export default function OrdersList({ type }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    ordering: '-created_at',
    start_date: '',
    end_date: ''
  });
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1
  });

  // Use ref to track if initial fetch is done
  const initialFetchDone = useRef(false);
  const lastFiltersRef = useRef(filters);

  const isMO = type === 'mo';
  const api = useMemo(() => 
    isMO ? manufacturingAPI.manufacturingOrders : manufacturingAPI.purchaseOrders,
    [isMO]
  );
  const isManager = userRole === 'manager';

  // Fetch orders
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const queryFilters = {
        ...filters,
        page
      };
      
      console.log(`Fetching ${type} orders with filters:`, queryFilters);
      const response = await api.getAll(queryFilters);
      console.log(`${type} orders response:`, response);
      
      // Handle both successful and failed responses
      if (response && response.success !== false) {
        setOrders(response.results || []);
        setPagination({
          count: response.count || 0,
          next: response.next,
          previous: response.previous,
          current_page: page
        });
      } else {
        // Handle failed API response
        console.warn(`API returned failed response for ${type} orders:`, response);
        setOrders([]);
        setPagination({
          count: 0,
          next: null,
          previous: null,
          current_page: 1
        });
      }
    } catch (error) {
      console.error(`Error fetching ${type} orders:`, error);
      // Set empty data on error to prevent crashes
      setOrders([]);
      setPagination({
        count: 0,
        next: null,
        previous: null,
        current_page: 1
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user role on mount only
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  // Fetch orders when filters or type change - with duplicate prevention
  useEffect(() => {
    // Check if filters have actually changed (deep comparison of values)
    const filtersChanged = 
      lastFiltersRef.current.status !== filters.status ||
      lastFiltersRef.current.search !== filters.search ||
      lastFiltersRef.current.ordering !== filters.ordering ||
      lastFiltersRef.current.start_date !== filters.start_date ||
      lastFiltersRef.current.end_date !== filters.end_date;

    if (!initialFetchDone.current || filtersChanged) {
      lastFiltersRef.current = filters;
      initialFetchDone.current = true;
      fetchOrders();
    }
  }, [filters.status, filters.search, filters.ordering, filters.start_date, filters.end_date, type, api]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStatusChange = async (orderId, newStatus, notes = '') => {
    try {
      console.log(`Changing ${type} order ${orderId} status to ${newStatus}`);
      await api.changeStatus(orderId, { status: newStatus, notes });
      console.log(`Successfully changed ${type} order ${orderId} status`);
      fetchOrders(pagination.current_page);
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error(`Failed to change ${type} order status: ${error.message || 'Unknown error'}`);
    }
  };

  const handleOrderClick = (order) => {
    if (isMO) {
      // Get user role to determine correct route
      const role = localStorage.getItem('userRole');
      
      if (role === 'production_head') {
        router.push(`/production-head/mo-detail/${order.id}`);
      } else {
        router.push(`/manager/mo-detail/${order.id}`);
      }
    } else {
      // Handle PO click - only managers can access PO details
      if (isManager) {
        router.push(`/manager/po-detail/${order.id}`);
      } else {
        toast.error('Only managers can view purchase order details');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      // MO Statuses
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      gm_approved: 'bg-green-100 text-green-700',
      rm_allocated: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-orange-100 text-orange-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
      mo_approved: 'bg-green-100 text-green-700',
      // PO Statuses
      po_initiated: 'bg-blue-100 text-blue-700',
      po_approved: 'bg-green-100 text-green-700',
      po_cancelled: 'bg-red-100 text-red-700',
      rm_pending: 'bg-yellow-100 text-yellow-700',
      rm_completed: 'bg-gray-100 text-gray-700'
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
      {/* Compact Filters - Single Row */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Search - Wider */}
          <div className="lg:col-span-3">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={isMO ? 'MO ID, Product Code...' : 'PO ID, Material, Vendor...'}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>
          
          {/* Date Range - From */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              placeholder="From Date"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="From Date"
            />
          </div>
          
          {/* Date Range - To */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              placeholder="To Date"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="To Date"
            />
          </div>
          
          {/* Status */}
          <div className="lg:col-span-2">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          
          {/* Sort */}
          <div className="lg:col-span-2">
            <select
              value={filters.ordering}
              onChange={(e) => handleFilterChange('ordering', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              {isMO ? (
                <>
                  <option value="-planned_start_date">Start Date ↓</option>
                  <option value="planned_start_date">Start Date ↑</option>
                  <option value="-delivery_date">Delivery Date ↓</option>
                  <option value="delivery_date">Delivery Date ↑</option>
                </>
              ) : (
                <>
                  <option value="-expected_date">Expected Date ↓</option>
                  <option value="expected_date">Expected Date ↑</option>
                  <option value="-total_amount">Amount ↓</option>
                  <option value="total_amount">Amount ↑</option>
                </>
              )}
            </select>
          </div>
          
          {/* Clear Filters Button */}
          <div className="lg:col-span-1 flex items-center">
            <button
              onClick={() => {
                setFilters({
                  status: '',
                  search: '',
                  ordering: '-created_at',
                  start_date: '',
                  end_date: ''
                });
              }}
              className="w-full px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              title="Clear all filters"
            >
              Clear
            </button>
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
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 hover:shadow-xl hover:shadow-slate-300/50 transition-all cursor-pointer hover:bg-white/90"
              onClick={() => handleOrderClick(order)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                      <span>{isMO ? order.mo_id : order.po_id}</span>
                      <span className="text-xs text-blue-600 font-normal">
                        → View Details
                      </span>
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
                      : `${order.rm_code?.material_name || order.rm_code?.material_code || 'N/A'} - Qty: ${order.quantity_ordered}`
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
                    {isMO ? (
                      <>
                        {order.status === 'draft' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(order.id, 'submitted', 'Submitted for approval');
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                          >
                            Submit
                          </button>
                        )}
                        {order.status === 'submitted' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(order.id, 'gm_approved', 'Approved by GM');
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                      </>
                    ) : (
                      // PO Actions - Only for Managers
                      isManager ? (
                        <>
                          {order.status === 'po_initiated' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(order.id, 'po_approved', 'Approved by GM');
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                              >
                                Approve PO
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(order.id, 'po_cancelled', 'Cancelled by Manager');
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {order.status === 'po_approved' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order.id, 'po_cancelled', 'Cancelled by Manager');
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </>
                      ) : (
                        // Non-manager users see read-only status
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                          View Only
                        </span>
                      )
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
                    {/* <div>
                      <span className="text-slate-500 font-medium">Supervisor:</span>
                      <span className="ml-2 text-slate-700">
                        {order.assigned_supervisor?.first_name + ' ' + order.assigned_supervisor?.last_name || 'Not assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Shift:</span>
                      <span className="ml-2 text-slate-700">{order.shift_display}</span>
                    </div> */}
                    <div>
                      <span className="text-slate-500 font-medium">Completed Date:</span>
                      <span className="ml-2 text-slate-700">
                        {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-500 font-medium">Vendor:</span>
                      <span className="ml-2 text-slate-700">{order.vendor_name?.name || 'N/A'}</span>
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

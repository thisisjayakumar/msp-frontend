"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import { toast } from '@/utils/notifications';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Pause, RefreshCw } from 'lucide-react';
import StopMOConfirmationModal from '@/components/manufacturing/StopMOConfirmationModal';
import { MANUFACTURING_APIS } from '@/components/API_Service/api-list';

export default function OrdersList({ type }) {
  const router = useRouter();
  const isMO = type === 'mo';
  const pageSize = isMO ? 5 : 20;  // 5 for MOs, 20 for POs
  
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all fetched data
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    ordering: '-created_at',
    start_date: '',
    end_date: '',
    page_size: pageSize
  });
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1
  });
  
  // Stop MO modal state
  const [showStopModal, setShowStopModal] = useState(false);
  const [selectedMO, setSelectedMO] = useState(null);

  // Use ref to track if initial fetch is done
  const initialFetchDone = useRef(false);
  const lastFiltersRef = useRef(filters);
  const searchTimeoutRef = useRef(null);

  // Date range picker state
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const api = isMO ? manufacturingAPI.manufacturingOrders : manufacturingAPI.purchaseOrders;
  const isManager = userRole === 'manager';

  // Fetch orders
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const queryFilters = {
        ordering: '-created_at',
        page_size: pageSize
      };

      console.log(`Fetching ${type} orders with filters:`, queryFilters);
      const response = await api.getAll(queryFilters);
      console.log(`${type} orders response:`, response);

      // Handle both successful and failed responses
      if (response && response.success !== false) {
        const fetchedData = response.results || [];
        setAllOrders(fetchedData); // Store all data
        setPagination({
          count: response.count || 0,
          next: response.next,
          previous: response.previous,
          current_page: page
        });
      } else {
        // Handle failed API response
        console.warn(`API returned failed response for ${type} orders:`, response);
        setAllOrders([]);
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
      setAllOrders([]);
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

  // Fetch orders only on initial load
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchOrders();
    }
  }, []);

  // Client-side filtering effect
  useEffect(() => {
    filterOrders();
  }, [filters, allOrders]);

  const filterOrders = () => {
    let filtered = [...allOrders];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => {
        if (isMO) {
          return (order.mo_id && typeof order.mo_id === 'string' && order.mo_id.toLowerCase().includes(searchTerm)) ||
                 (order.product_code && typeof order.product_code === 'string' && order.product_code.toLowerCase().includes(searchTerm)) ||
                 (order.product_name && typeof order.product_name === 'string' && order.product_name.toLowerCase().includes(searchTerm)) ||
                 (order.rm_required_kg && order.rm_required_kg.toString().includes(searchTerm));
        } else {
          return (order.po_id && typeof order.po_id === 'string' && order.po_id.toLowerCase().includes(searchTerm)) ||
                 (order.material_name && typeof order.material_name === 'string' && order.material_name.toLowerCase().includes(searchTerm)) ||
                 (order.vendor_name && typeof order.vendor_name === 'string' && order.vendor_name.toLowerCase().includes(searchTerm));
        }
      });
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Date range filter
    if (filters.start_date || filters.end_date) {
      filtered = filtered.filter(order => {
        if (!order.created_at) return false;
        
        const orderDate = new Date(order.created_at);
        const startDate = filters.start_date ? new Date(filters.start_date) : null;
        const endDate = filters.end_date ? new Date(filters.end_date) : null;
        
        if (startDate && endDate) {
          return orderDate >= startDate && orderDate <= endDate;
        } else if (startDate) {
          return orderDate >= startDate;
        } else if (endDate) {
          return orderDate <= endDate;
        }
        return true;
      });
    }

    // Apply sorting
    if (filters.ordering) {
      const [field, direction] = filters.ordering.startsWith('-') 
        ? [filters.ordering.slice(1), 'desc'] 
        : [filters.ordering, 'asc'];
      
      filtered.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const startIndex = (pagination.current_page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrders = filtered.slice(startIndex, endIndex);
    
    setOrders(paginatedOrders);
    setPagination(prev => ({
      ...prev,
      count: filtered.length,
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleRefresh = () => {
    fetchOrders();
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

  const handlePauseMO = async (pauseReason) => {
    if (!selectedMO) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(MANUFACTURING_APIS.MO_STOP(selectedMO.id), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stop_reason: pauseReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to pause MO');
      }

      toast.success(`MO ${selectedMO.mo_id} paused successfully!`);
      
      // Refresh the orders list
      await fetchOrders(pagination.current_page);
      
    } catch (error) {
      console.error('Error pausing MO:', error);
      throw error;
    }
  };

  const handleCancelMO = async (orderId) => {
    try {
      console.log(`Cancelling MO ${orderId}`);
      await api.changeStatus(orderId, { status: 'cancelled', notes: 'Cancelled by Production Head/Manager' });
      console.log(`Successfully cancelled MO ${orderId}`);
      toast.success(`MO cancelled successfully!`);
      fetchOrders(pagination.current_page);
    } catch (error) {
      console.error('Error cancelling MO:', error);
      toast.error(`Failed to cancel MO: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRejectMO = async (orderId) => {
    const reason = window.prompt('Please provide a reason for rejecting this MO:');
    if (reason === null) return; // User cancelled
    
    if (!reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      console.log(`Rejecting MO ${orderId} with reason: ${reason}`);
      await api.changeStatus(orderId, { status: 'rejected', notes: `Rejected by Manager: ${reason}` });
      console.log(`Successfully rejected MO ${orderId}`);
      toast.success(`MO rejected successfully!`);
      fetchOrders(pagination.current_page);
    } catch (error) {
      console.error('Error rejecting MO:', error);
      toast.error(`Failed to reject MO: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancelPO = async (orderId) => {
    try {
      console.log(`Cancelling PO ${orderId}`);
      await api.changeStatus(orderId, { status: 'po_cancelled', notes: 'Cancelled by Production Head' });
      console.log(`Successfully cancelled PO ${orderId}`);
      toast.success(`PO cancelled successfully!`);
      fetchOrders(pagination.current_page);
    } catch (error) {
      console.error('Error cancelling PO:', error);
      toast.error(`Failed to cancel PO: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRejectPO = async (orderId) => {
    const reason = window.prompt('Please provide a reason for rejecting this PO:');
    if (reason === null) return; // User cancelled
    
    if (!reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      console.log(`Rejecting PO ${orderId} with reason: ${reason}`);
      await api.changeStatus(orderId, { status: 'po_cancelled', notes: `Rejected by Manager: ${reason}` });
      console.log(`Successfully rejected PO ${orderId}`);
      toast.success(`PO rejected successfully!`);
      fetchOrders(pagination.current_page);
    } catch (error) {
      console.error('Error rejecting PO:', error);
      toast.error(`Failed to reject PO: ${error.message || 'Unknown error'}`);
    }
  };

  const canPauseMO = (status) => {
    return ['rm_allocated', 'in_progress'].includes(status);
  };

  const canCancelMO = (status) => {
    return status === 'on_hold';
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
      stopped: 'bg-red-100 text-red-700',
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700">Filters</h3>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Search - Wider */}
          <div className="lg:col-span-3">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={isMO ? 'MO ID, Product Code, RM kg...' : 'PO ID, Material, Vendor...'}
              className="w-full px-3 py-2 text-sm text-slate-500 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>

          {/* Date Range Picker */}
          <div className="lg:col-span-3">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              isClearable={true}
              placeholderText="Select date range"
              dateFormat="MMM d, yyyy"
              className="w-full px-3 py-2 text-sm text-slate-500 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              wrapperClassName="w-full"
              withPortal
              portalId="date-picker-portal"
            />
          </div>

          {/* Status */}
          <div className="lg:col-span-2">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 text-slate-500 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" className="text-slate-500">All Status</option>
              {isMO ? (
                <>
                  <option value="submitted" className="text-slate-500">Submitted</option>
                  <option value="rm_allocated" className="text-slate-500">RM Allocated</option>
                  <option value="mo_approved" className="text-slate-500">MO Approved</option>
                  <option value="in_progress" className="text-slate-500">In Progress</option>
                  <option value="completed" className="text-slate-500">Completed</option>
                  <option value="cancelled" className="text-slate-500">Cancelled</option>
                  <option value="rejected" className="text-slate-500">Rejected</option>
                  <option value="on_hold" className="text-slate-500">On Hold</option>
                </>
              ) : (
                <>
                  <option value="po_initiated" className="text-slate-500">PO Initiated</option>
                  <option value="po_approved" className="text-slate-500">PO Approved</option>
                  <option value="po_cancelled" className="text-slate-500">PO Cancelled</option>
                  <option value="rm_pending" className="text-slate-500">RM Pending</option>
                  <option value="rm_completed" className="text-slate-500">RM Completed</option>
                </>
              )}

            </select>
          </div>

          {/* Sort */}
          <div className="lg:col-span-2">
            <select
              value={filters.ordering}
              onChange={(e) => handleFilterChange('ordering', e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-500 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="-created_at" className="text-slate-500">Newest First</option>
              <option value="created_at" className="text-slate-500">Oldest First</option>
              {isMO ? (
                <>
                  <option value="-planned_start_date" className="text-slate-500">Start Date ↓</option>
                  <option value="planned_start_date" className="text-slate-500">Start Date ↑</option>
                  <option value="-delivery_date" className="text-slate-500">Delivery Date ↓</option>
                  <option value="delivery_date" className="text-slate-500">Delivery Date ↑</option>
                </>
              ) : (
                <>
                  <option value="-expected_date" className="text-slate-500">Expected Date ↓</option>
                  <option value="expected_date" className="text-slate-500">Expected Date ↑</option>
                  <option value="-total_amount">Amount ↓</option>
                  <option value="total_amount">Amount ↑</option>
                </>
              )}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="lg:col-span-2 flex items-center">
            <button
              onClick={() => {
                setFilters({
                  status: '',
                  search: '',
                  ordering: '-created_at',
                  start_date: '',
                  end_date: '',
                  page_size: pageSize
                });
                setDateRange([null, null]);
              }}
              className="w-full px-3 py-2 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
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
                  <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
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
                    {isMO && canCancelMO(order.status) && userRole === 'production_head' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to cancel MO ${order.mo_id}? This action cannot be undone.`)) {
                            handleCancelMO(order.id);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                        title="Cancel this MO permanently"
                      >
                        Cancel MO
                      </button>
                    )}
                    {isMO && order.status === 'submitted' && userRole === 'manager' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to reject MO ${order.mo_id}? This action cannot be undone.`)) {
                            handleRejectMO(order.id);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                        title="Reject this MO with reason"
                      >
                        Reject MO
                      </button>
                    )}
                    {isMO && canPauseMO(order.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMO(order);
                          setShowStopModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded-lg text-xs hover:bg-orange-700 transition-colors"
                        title="Pause this MO temporarily"
                      >
                        <Pause className="w-3 h-3" />
                        Pause MO
                      </button>
                    )}
                  </div>
                  <p className="text-slate-600">
                    {isMO
                      ? `${order.product_code?.display_name || order.product_code?.product_code} - Qty: ${order.quantity}${order.rm_required_kg ? ` | RM: ${parseFloat(order.rm_required_kg).toFixed(2)} kg` : ''}`
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
                      // PO Actions
                      <>
                        {order.status === 'po_initiated' && (
                          <>
                            {/* Production Head can cancel */}
                            {userRole === 'production_head' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to cancel PO ${order.po_id}? This action cannot be undone.`)) {
                                    handleCancelPO(order.id);
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                              >
                                Cancel PO
                              </button>
                            )}
                            {/* Manager can approve or reject */}
                            {isManager && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(order.id, 'po_approved', 'Approved by Manager');
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                >
                                  Approve PO
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to reject PO ${order.po_id}? This action cannot be undone.`)) {
                                      handleRejectPO(order.id);
                                    }
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                                >
                                  Reject PO
                                </button>
                              </>
                            )}
                          </>
                        )}
                        {order.status === 'po_approved' && isManager && (
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
                        {/* Non-manager users see read-only status for other statuses */}
                        {!isManager && order.status !== 'po_initiated' && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                            View Only
                          </span>
                        )}
                      </>
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
      {pagination.count > pageSize && (
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60">
          <div className="text-sm text-slate-600">
            Showing {((pagination.current_page - 1) * pageSize) + 1} to {Math.min(pagination.current_page * pageSize, pagination.count)} of {pagination.count} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
              disabled={pagination.current_page === 1}
              className="px-4 py-2 text-slate-700 text-sm font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
              disabled={pagination.current_page * pageSize >= pagination.count}
              className="px-4 py-2 text-slate-700 text-sm font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Pause MO Modal */}
      {isMO && (
        <StopMOConfirmationModal
          isOpen={showStopModal}
          onClose={() => {
            setShowStopModal(false);
            setSelectedMO(null);
          }}
          moData={selectedMO}
          onConfirm={handlePauseMO}
        />
      )}
    </div>
  );
}

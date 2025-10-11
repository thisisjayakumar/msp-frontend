"use client";

import { useState, useEffect, useRef } from 'react';
import Button from '../CommonComponents/ui/Button';
import { toast } from '@/utils/notifications';
import { grmReceiptsAPI } from '../API_Service/inventory-api';
import { 
  TruckIcon, EyeIcon, CheckCircleIcon, 
  ExclamationTriangleIcon, ClipboardDocumentListIcon,
  MapPinIcon, CalendarIcon
} from '@heroicons/react/24/outline';

export default function GRMReceiptsTab() {
  const [grmReceipts, setGrmReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGRM, setSelectedGRM] = useState(null);
  const [showGRMDetailModal, setShowGRMDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Prevent duplicate API calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Fetch GRM Receipts
  const fetchGRMReceipts = async () => {
    try {
      setLoading(true);
      
      // Fetch GRM receipts
      const data = await grmReceiptsAPI.getAll();
      
      // Check for graceful error response from API service
      if (data?.error) {
        setError(data.message || 'Failed to fetch GRM receipts');
        setGrmReceipts([]);
        return;
      }
      
      setGrmReceipts(data.results || data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching GRM receipts:', err);
      setError(err.message || 'Failed to fetch GRM receipts');
      // Set empty array as fallback
      setGrmReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode (development only)
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    fetchGRMReceipts();
  }, []);

  // Handle View GRM Details
  const handleViewDetails = (grm) => {
    setSelectedGRM(grm);
    setShowGRMDetailModal(true);
  };

  // Handle Quality Check
  const handleQualityCheck = async (grmId, passed) => {
    try {
      await grmReceiptsAPI.updateQualityCheck(grmId, passed);
      toast.success(`Quality check ${passed ? 'passed' : 'failed'}`);
      await fetchGRMReceipts(); // Refresh data
    } catch (err) {
      toast.error('Failed to update quality check');
    }
  };

  // Handle Complete Receipt
  const handleCompleteReceipt = async (grmId) => {
    try {
      await grmReceiptsAPI.completeReceipt(grmId);
      toast.success('GRM receipt completed successfully');
      await fetchGRMReceipts(); // Refresh data
    } catch (err) {
      toast.error('Failed to complete receipt');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'partial': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status display text
  const getStatusDisplay = (status) => {
    const statusDisplays = {
      'pending': 'Pending',
      'partial': 'Partial',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusDisplays[status] || status;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Filter GRM receipts
  const filteredGRMs = grmReceipts.filter(grm => {
    const matchesSearch = !searchTerm || 
      grm.grm_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grm.purchase_order_po_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grm.truck_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grm.driver_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || grm.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading GRM Receipts</h3>
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={fetchGRMReceipts} variant="primary">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">GRM Receipts</h2>
        <Button onClick={fetchGRMReceipts} variant="secondary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by GRM number, PO ID, truck number, or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRM Receipts List */}
      {filteredGRMs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <TruckIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No GRM Receipts</h3>
          <p className="text-gray-600">
            {searchTerm || filterStatus !== 'all'
              ? 'No GRM receipts match your search criteria.'
              : 'No GRM receipts found. Create one from an approved Purchase Order.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              GRM Receipts ({filteredGRMs.length})
            </h3>
            {(searchTerm || filterStatus !== 'all') && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredGRMs.length} of {grmReceipts.length} GRM receipts
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GRM Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heat Numbers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Check
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGRMs.map((grm) => (
                  <tr key={grm.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{grm.grm_number}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(grm.receipt_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{grm.purchase_order_po_id}</div>
                      <div className="text-xs text-gray-500">
                        {grm.vendor_name}
                      </div>
                      <div className="text-xs text-blue-600">
                        Received: {grm.quantity_received || 0} / {grm.quantity_ordered || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{grm.truck_number}</div>
                      <div className="text-xs text-gray-500">
                        {grm.driver_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{grm.heat_numbers_count}</div>
                      <div className="text-xs text-gray-500">
                        Heat Numbers
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(grm.status)}`}>
                        {getStatusDisplay(grm.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {grm.quality_check_passed ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => handleViewDetails(grm)}
                          variant="secondary"
                          size="sm"
                          className="flex items-center"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        
                        {grm.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handleQualityCheck(grm.id, true)}
                              variant="primary"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Pass QC
                            </Button>
                            <Button
                              onClick={() => handleCompleteReceipt(grm.id)}
                              variant="primary"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Complete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRM Detail Modal */}
      {showGRMDetailModal && selectedGRM && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  GRM Receipt Details - {selectedGRM.grm_number}
                </h3>
                <button
                  onClick={() => setShowGRMDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GRM Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedGRM.grm_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedGRM.status)}`}>
                      {getStatusDisplay(selectedGRM.status)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Order</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedGRM.purchase_order_po_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vendor</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedGRM.vendor_name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity Ordered</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedGRM.quantity_ordered || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity Received</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedGRM.quantity_received || 0}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Truck Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedGRM.truck_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Driver</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedGRM.driver_name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Receipt Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedGRM.receipt_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Received By</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedGRM.received_by_name}</p>
                  </div>
                </div>
                
                {selectedGRM.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedGRM.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  onClick={() => setShowGRMDetailModal(false)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

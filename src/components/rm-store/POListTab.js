"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import manufacturingAPI from '../API_Service/manufacturing-api';
import Button from '../CommonComponents/ui/Button';
import { toast } from '@/utils/notifications';
import { 
  CheckCircleIcon, EyeIcon, TruckIcon, 
  ExclamationTriangleIcon, ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import GRMReceiptForm from './GRMReceiptForm';

export default function POListTab() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('on_hold'); // 'on_hold', 'approved', 'completed'
  const [poData, setPoData] = useState({
    summary: { pending_approvals: 0, approved: 0, completed: 0, total: 0 },
    on_hold: [],
    approved: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showPODetailModal, setShowPODetailModal] = useState(false);
  const [showGRMForm, setShowGRMForm] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchMaterial, setSearchMaterial] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Fetch PO list for RM Store
  const fetchPOList = async () => {
    try {
      setLoading(true);
      const response = await manufacturingAPI.purchaseOrders.getAll();
      
      // Handle paginated response
      const data = Array.isArray(response) ? response : (response.results || []);
      
      // Organize POs by status
      const organizedData = {
        summary: {
          pending_approvals: 0,
          approved: 0,
          completed: 0,
          total: data.length || 0
        },
        on_hold: [],
        approved: [],
        completed: []
      };

      if (data && data.length > 0) {
        data.forEach(po => {
          switch (po.status) {
            case 'on_hold':
            case 'submitted':
              organizedData.on_hold.push(po);
              organizedData.summary.pending_approvals++;
              break;
            case 'approved':
              organizedData.approved.push(po);
              organizedData.summary.approved++;
              break;
            case 'completed':
              organizedData.completed.push(po);
              organizedData.summary.completed++;
              break;
            default:
              organizedData.on_hold.push(po);
              organizedData.summary.pending_approvals++;
          }
        });
      }

      setPoData(organizedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching PO list:', err);
      setError(err.message || 'Failed to fetch PO list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOList();
  }, []);

  // Handle View Details
  const handleViewDetails = (po) => {
    setSelectedPO(po);
    setShowPODetailModal(true);
  };

  // Handle GRM Receipt Creation
  const handleCreateGRMReceipt = (po) => {
    setSelectedPO(po);
    setShowGRMForm(true);
  };

  // Handle GRM Receipt Success
  const handleGRMReceiptSuccess = (grmReceipt) => {
    setShowGRMForm(false);
    setSelectedPO(null);
    toast.success(`GRM Receipt ${grmReceipt.grm_number} created successfully`);
    fetchPOList(); // Refresh PO list
  };

  // Handle Status Change
  const handleStatusChange = async (poId, newStatus, notes = '') => {
    try {
      await manufacturingAPI.purchaseOrders.changeStatus(poId, { 
        status: newStatus, 
        notes 
      });
      toast.success(`PO status updated to ${newStatus}`);
      await fetchPOList(); // Refresh data
    } catch (err) {
      console.error('Error changing PO status:', err);
      toast.error('Failed to change PO status');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status display text
  const getStatusDisplay = (status) => {
    const statusDisplays = {
      'on_hold': 'On Hold',
      'submitted': 'Submitted',
      'approved': 'Approved',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusDisplays[status] || status;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

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
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Purchase Orders</h3>
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={fetchPOList} variant="primary">
          Retry
        </Button>
      </div>
    );
  }

  const currentTabData = poData[activeTab] || [];

  // Filter and search logic
  const filteredPOs = currentTabData.filter(po => {
    const matchesName = !searchName || 
      po.po_id?.toLowerCase().includes(searchName.toLowerCase());

    const matchesMaterial = !searchMaterial ||
      po.rm_code?.material_name?.toLowerCase().includes(searchMaterial.toLowerCase()) ||
      po.rm_code?.material_code?.toLowerCase().includes(searchMaterial.toLowerCase());

    // Date range filter
    let matchesDateRange = true;
    if (po.expected_date) {
      const poDate = new Date(po.expected_date).toISOString().split('T')[0];
      if (filterDateFrom && poDate < filterDateFrom) {
        matchesDateRange = false;
      }
      if (filterDateTo && poDate > filterDateTo) {
        matchesDateRange = false;
      }
    } else if (filterDateFrom || filterDateTo) {
      // If date filters are set but PO has no date, exclude it
      matchesDateRange = false;
    }

    return matchesName && matchesMaterial && matchesDateRange;
  });

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">RM Inward</h2>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approval</p>
              <p className="text-2xl font-semibold text-gray-900">{poData.summary.pending_approvals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{poData.summary.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TruckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{poData.summary.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by PO ID</label>
            <input
              type="text"
              placeholder="Enter PO ID..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Material</label>
            <input
              type="text"
              placeholder="Enter material name or code..."
              value={searchMaterial}
              onChange={(e) => setSearchMaterial(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full border border-gray-300 text-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full border border-gray-300 text-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('on_hold')}
            className={`${
              activeTab === 'on_hold'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Pending Approval ({poData.summary.pending_approvals})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`${
              activeTab === 'approved'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Approved ({poData.summary.approved})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`${
              activeTab === 'completed'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Completed ({poData.summary.completed})
          </button>
        </nav>
      </div>

      {/* PO List */}
      {filteredPOs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <TruckIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Purchase Orders</h3>
          <p className="text-gray-600">
            {searchName || searchMaterial || filterDateFrom || filterDateTo
              ? 'No purchase orders match your search criteria.'
              : (
                  activeTab === 'on_hold' ? 'No pending purchase orders.' :
                  activeTab === 'approved' ? 'No approved purchase orders.' :
                  'No completed purchase orders.'
                )
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Purchase Orders - {getStatusDisplay(activeTab)} ({filteredPOs.length})
            </h3>
            {(searchName || searchMaterial || filterDateFrom || filterDateTo) && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredPOs.length} of {currentTabData.length} purchase orders
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{po.po_id}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(po.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{po.rm_code?.material_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">
                        {po.rm_code?.material_code || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{po.vendor_name?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">
                        {po.vendor_name?.contact_no || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{po.quantity_ordered}</div>
                      <div className="text-xs text-gray-500">
                        {po.rm_code?.material_type === 'coil' ? 'kg' : 'sheets'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(po.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(po.expected_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                        {getStatusDisplay(po.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => handleViewDetails(po)}
                          variant="secondary"
                          size="sm"
                          className="flex items-center"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        
                        {po.status === 'on_hold' && (
                          <Button
                            onClick={() => handleStatusChange(po.id, 'approved', 'Approved by RM Store')}
                            variant="primary"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                        )}
                        
                        {po.status === 'approved' && (
                          <>
                            <Button
                              onClick={() => handleCreateGRMReceipt(po)}
                              variant="primary"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 flex items-center"
                            >
                              <ClipboardDocumentListIcon className="w-4 h-4 mr-1" />
                              Create GRM
                            </Button>
                            <Button
                              onClick={() => handleStatusChange(po.id, 'completed', 'Materials received')}
                              variant="secondary"
                              size="sm"
                            >
                              Mark Received
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

      {/* PO Detail Modal */}
      {showPODetailModal && selectedPO && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Purchase Order Details - {selectedPO.po_id}
                </h3>
                <button
                  onClick={() => setShowPODetailModal(false)}
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
                    <label className="block text-sm font-medium text-gray-700">PO ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPO.po_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPO.status)}`}>
                      {getStatusDisplay(selectedPO.status)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Material</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPO.rm_code?.material_name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{selectedPO.rm_code?.material_code || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vendor</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPO.vendor_name?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{selectedPO.vendor_name?.contact_no || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity Ordered</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPO.quantity_ordered}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedPO.unit_price)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">{formatCurrency(selectedPO.total_amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedPO.expected_date)}</p>
                  </div>
                </div>
                
                {selectedPO.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPO.notes}</p>
                  </div>
                )}
                
                {selectedPO.terms_conditions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPO.terms_conditions}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  onClick={() => setShowPODetailModal(false)}
                  variant="secondary"
                >
                  Close
                </Button>
                
                {selectedPO.status === 'on_hold' && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedPO.id, 'approved', 'Approved by RM Store');
                      setShowPODetailModal(false);
                    }}
                    variant="primary"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve PO
                  </Button>
                )}
                
                {selectedPO.status === 'approved' && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedPO.id, 'completed', 'Materials received');
                      setShowPODetailModal(false);
                    }}
                    variant="primary"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Mark as Received
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRM Receipt Form Modal */}
      {showGRMForm && selectedPO && (
        <GRMReceiptForm
          purchaseOrder={selectedPO}
          onSuccess={handleGRMReceiptSuccess}
          onCancel={() => {
            setShowGRMForm(false);
            setSelectedPO(null);
          }}
        />
      )}
    </div>
  );
}

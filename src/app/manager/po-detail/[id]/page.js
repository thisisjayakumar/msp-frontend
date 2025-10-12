"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import manufacturingAPI from '../../../../components/API_Service/manufacturing-api';
import { authUtils } from '../../../../components/API_Service/api-utils';
import { toast } from '@/utils/notifications';
import LoadingSpinner from '../../../../components/CommonComponents/ui/LoadingSpinner';
import Button from '../../../../components/CommonComponents/ui/Button';
import { 
  ArrowLeftIcon,
  CheckCircleIcon, 
  XMarkIcon,
  TruckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function PODetailPage() {
  const router = useRouter();
  const params = useParams();
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch PO details
  const fetchPODetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await manufacturingAPI.purchaseOrders.getById(params.id);
      setPO(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching PO details:', err);
      setError(err.message || 'Failed to fetch PO details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    // Check authentication
    const token = authUtils.getToken();
    if (!token) {
      router.replace('/');
      return;
    }

    // Check user role - only managers can access PO details
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'manager') {
      toast.error('Access denied. Only managers can view purchase order details.');
      router.replace('/');
      return;
    }

    fetchPODetails();
  }, [fetchPODetails, router]);

  // Handle status change
  const handleStatusChange = async (newStatus, notes = '') => {
    try {
      setActionLoading(true);
      await manufacturingAPI.purchaseOrders.changeStatus(po.id, { 
        status: newStatus, 
        notes 
      });
      
      // Show success message
      const statusMessages = {
        'po_approved': 'Purchase Order approved successfully!',
        'po_cancelled': 'Purchase Order cancelled successfully!',
        'rm_pending': 'Purchase Order sent to RM Store successfully!'
      };
      
      toast.success(statusMessages[newStatus] || 'Status updated successfully!');
      
      // Refresh PO details
      await fetchPODetails();
    } catch (err) {
      console.error('Error changing PO status:', err);
      toast.error('Failed to change PO status');
    } finally {
      setActionLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      'po_initiated': 'bg-blue-100 text-blue-800',
      'po_approved': 'bg-green-100 text-green-800',
      'rm_pending': 'bg-yellow-100 text-yellow-800',
      'rm_completed': 'bg-gray-100 text-gray-800',
      'po_cancelled': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status display text
  const getStatusDisplay = (status) => {
    const statusDisplays = {
      'po_initiated': 'Purchase Order Initiated',
      'po_approved': 'Approved by GM',
      'rm_pending': 'Awaiting RM Store Action',
      'rm_completed': 'Goods Receipt Completed',
      'po_cancelled': 'Cancelled by Manager'
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
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Purchase Order</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="primary">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Purchase Order Not Found</h3>
          <p className="text-slate-600 mb-4">The requested purchase order could not be found.</p>
          <Button onClick={() => router.back()} variant="primary">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="flex items-center"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Purchase Order Details</h1>
                <p className="text-xs text-slate-500">{po.po_id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(po.status)}`}>
                {getStatusDisplay(po.status)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PO Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">PO ID</label>
                  <p className="mt-1 text-sm text-slate-900 font-mono">{po.po_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Created Date</label>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(po.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Expected Delivery</label>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(po.expected_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Material Type</label>
                  <p className="mt-1 text-sm text-slate-900 capitalize">{po.material_type}</p>
                </div>
              </div>
            </div>

            {/* Material Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Material Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Material Code</label>
                  <p className="mt-1 text-sm text-slate-900">{po.rm_code?.material_code || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Material Name</label>
                  <p className="mt-1 text-sm text-slate-900">{po.rm_code?.material_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Grade</label>
                  <p className="mt-1 text-sm text-slate-900">{po.grade_auto || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Finishing</label>
                  <p className="mt-1 text-sm text-slate-900">{po.finishing_auto || 'N/A'}</p>
                </div>
                {po.material_type === 'coil' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Wire Diameter (mm)</label>
                      <p className="mt-1 text-sm text-slate-900">{po.wire_diameter_mm_auto || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Weight (kg)</label>
                      <p className="mt-1 text-sm text-slate-900">{po.kg_auto || 'N/A'}</p>
                    </div>
                  </>
                )}
                {po.material_type === 'sheet' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Thickness (mm)</label>
                      <p className="mt-1 text-sm text-slate-900">{po.thickness_mm_auto || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Quantity (sheets)</label>
                      <p className="mt-1 text-sm text-slate-900">{po.qty_sheets_auto || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Vendor Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Vendor Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Vendor Name</label>
                  <p className="mt-1 text-sm text-slate-900">{po.vendor_name?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Contact Number</label>
                  <p className="mt-1 text-sm text-slate-900">{po.mob_no_auto || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">GST Number</label>
                  <p className="mt-1 text-sm text-slate-900">{po.gst_no_auto || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Address</label>
                  <p className="mt-1 text-sm text-slate-900">{po.vendor_address_auto || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {(po.terms_conditions || po.notes) && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Additional Information</h2>
                {po.terms_conditions && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700">Terms & Conditions</label>
                    <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{po.terms_conditions}</p>
                  </div>
                )}
                {po.notes && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Notes</label>
                    <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{po.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Quantity Ordered:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {po.quantity_ordered} {po.material_type === 'coil' ? 'kg' : 'sheets'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Unit Price:</span>
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(po.unit_price)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-slate-900">Total Amount:</span>
                    <span className="text-base font-bold text-slate-900">{formatCurrency(po.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Actions</h2>
              <div className="space-y-3">
                {po.status === 'po_initiated' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange('po_approved', 'Approved by GM')}
                      variant="primary"
                      className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
                      disabled={actionLoading}
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      {actionLoading ? 'Approving...' : 'Approve PO'}
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('po_cancelled', 'Cancelled by Manager')}
                      variant="secondary"
                      className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                      disabled={actionLoading}
                    >
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      {actionLoading ? 'Cancelling...' : 'Cancel PO'}
                    </Button>
                  </>
                )}
                
                {po.status === 'po_approved' && (
                  <Button
                    onClick={() => handleStatusChange('po_cancelled', 'Cancelled by Manager')}
                    variant="secondary"
                    className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                    disabled={actionLoading}
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    {actionLoading ? 'Cancelling...' : 'Cancel PO'}
                  </Button>
                )}

                {(po.status === 'rm_pending' || po.status === 'rm_completed' || po.status === 'po_cancelled') && (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-600">
                      {po.status === 'rm_pending' && 'PO is with RM Store for processing'}
                      {po.status === 'rm_completed' && 'PO has been completed'}
                      {po.status === 'po_cancelled' && 'PO has been cancelled'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status History */}
            {po.status_history && po.status_history.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Status History</h2>
                <div className="space-y-3">
                  {po.status_history.map((history, index) => (
                    <div key={index} className="border-l-2 border-slate-200 pl-4 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">
                          {history.from_status ? `${history.from_status} → ${history.to_status}` : history.to_status}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(history.changed_at)}
                        </span>
                      </div>
                      {history.changed_by && (
                        <p className="text-xs text-slate-600">
                          by {history.changed_by.first_name} {history.changed_by.last_name}
                        </p>
                      )}
                      {history.notes && (
                        <p className="text-xs text-slate-600 mt-1">{history.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import packingZoneAPI from '@/components/API_Service/packing-zone-api';
import toast from 'react-hot-toast';

const ApproveModal = ({ adjustment, onClose, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ notes });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Approve Adjustment Request</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Adjustment Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Product:</span>
              <span className="text-sm font-medium text-gray-900">{adjustment.ipc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Heat No:</span>
              <span className="text-sm font-medium text-gray-900">{adjustment.heat_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Requested By:</span>
              <span className="text-sm font-medium text-gray-900">{adjustment.requested_by_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Requested Date:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(adjustment.requested_date).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Adjustment Amount */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-semibold text-red-900">Adjustment Quantity</h4>
                <p className="text-xs text-red-700 mt-1">This stock will be moved to adjusted stock (excluded from FG)</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-900">{parseFloat(adjustment.quantity_kg).toFixed(3)} kg</div>
                <div className="text-sm text-red-700">{adjustment.quantity_pcs} pcs</div>
              </div>
            </div>
          </div>

          {/* Adjustment Reason */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Adjustment Reason</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  adjustment.reason === 'rust'
                    ? 'bg-orange-100 text-orange-800'
                    : adjustment.reason === 'old_stock'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {adjustment.reason === 'rust' ? '🔧 Rust' : adjustment.reason === 'old_stock' ? '📅 Old Stock' : '📝 Other'}
                </span>
              </div>
              {adjustment.reason_text && (
                <p className="text-sm text-gray-700 mt-2">{adjustment.reason_text}</p>
              )}
            </div>
          </div>

          {/* Current Stock Info */}
          {adjustment.loose_stock_data && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Loose Stock</h4>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Available:</span>
                    <span className="font-bold text-blue-900">
                      {parseFloat(adjustment.loose_stock_data.quantity_kg).toFixed(3)} kg
                      ({adjustment.loose_stock_data.quantity_pcs} pcs)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Grams per Piece:</span>
                    <span className="font-medium text-blue-900">{adjustment.loose_stock_data.grams_per_product}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">After Adjustment:</span>
                    <span className="font-bold text-blue-900">
                      {(parseFloat(adjustment.loose_stock_data.quantity_kg) - parseFloat(adjustment.quantity_kg)).toFixed(3)} kg
                      ({adjustment.loose_stock_data.quantity_pcs - adjustment.quantity_pcs} pcs)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add any notes about this approval..."
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  Approving will move this quantity from loose stock to adjusted stock. This action is logged for audit purposes.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Approving...' : 'Approve Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RejectModal = ({ adjustment, onClose, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ notes });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Reject Adjustment Request</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Product:</span> {adjustment.ipc}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-medium">Quantity:</span> {parseFloat(adjustment.quantity_kg).toFixed(3)} kg
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional: Provide reason for rejection..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdjustmentsTab = ({ isReadOnly, isProductionHead, onRefresh }) => {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch adjustments
  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await packingZoneAPI.adjustments.getAll({ status: activeTab });
      if (!result.error) {
        setAdjustments(result);
      } else {
        toast.error('Failed to fetch adjustments');
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error);
      toast.error('Failed to fetch adjustments');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  // Handle approve
  const handleApprove = useCallback((adjustment) => {
    setSelectedAdjustment(adjustment);
    setShowApproveModal(true);
  }, []);

  const handleSubmitApprove = useCallback(async (approvalData) => {
    const toastId = toast.loading('Approving adjustment...');
    try {
      const result = await packingZoneAPI.adjustments.approve(selectedAdjustment.id, approvalData);
      if (!result.error) {
        toast.success('Adjustment approved successfully', { id: toastId });
        setShowApproveModal(false);
        setSelectedAdjustment(null);
        fetchAdjustments();
        onRefresh?.();
      } else {
        toast.error(result.message || 'Failed to approve adjustment', { id: toastId });
      }
    } catch (error) {
      console.error('Error approving adjustment:', error);
      toast.error('Failed to approve adjustment', { id: toastId });
    }
  }, [selectedAdjustment, fetchAdjustments, onRefresh]);

  // Handle reject
  const handleReject = useCallback((adjustment) => {
    setSelectedAdjustment(adjustment);
    setShowRejectModal(true);
  }, []);

  const handleSubmitReject = useCallback(async (rejectionData) => {
    const toastId = toast.loading('Rejecting adjustment...');
    try {
      const result = await packingZoneAPI.adjustments.reject(selectedAdjustment.id, rejectionData);
      if (!result.error) {
        toast.success('Adjustment rejected', { id: toastId });
        setShowRejectModal(false);
        setSelectedAdjustment(null);
        fetchAdjustments();
        onRefresh?.();
      } else {
        toast.error(result.message || 'Failed to reject adjustment', { id: toastId });
      }
    } catch (error) {
      console.error('Error rejecting adjustment:', error);
      toast.error('Failed to reject adjustment', { id: toastId });
    }
  }, [selectedAdjustment, fetchAdjustments, onRefresh]);

  // Statistics
  const stats = useMemo(() => {
    const pending = adjustments.filter(a => a.status === 'pending').length;
    const approved = adjustments.filter(a => a.status === 'approved').length;
    const rejected = adjustments.filter(a => a.status === 'rejected').length;
    const totalKg = adjustments.reduce((sum, a) => sum + parseFloat(a.quantity_kg), 0);
    
    return { pending, approved, rejected, totalKg };
  }, [adjustments]);

  if (!isProductionHead) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Production Head Access Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Only Production Head can approve or reject adjustment requests
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600">Loading adjustments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
            {stats.pending > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {stats.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected ({stats.rejected})
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {activeTab === 'approved' && (
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-red-900">Total Adjusted Stock</h4>
              <p className="text-xs text-red-700 mt-1">Stock excluded from FG inventory</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-900">{stats.totalKg.toFixed(3)} kg</div>
              <div className="text-sm text-red-700">{adjustments.length} adjustments</div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustments List */}
      {adjustments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab} adjustments</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'pending'
              ? 'No adjustment requests awaiting approval'
              : `No ${activeTab} adjustment requests`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {adjustments.map((adjustment) => (
            <div key={adjustment.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{adjustment.ipc}</h4>
                  <p className="text-sm text-gray-500">{adjustment.product_code}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  adjustment.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : adjustment.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {adjustment.status.charAt(0).toUpperCase() + adjustment.status.slice(1)}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Heat No:</span>
                  <span className="font-medium text-gray-900">{adjustment.heat_no}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-bold text-gray-900">
                    {parseFloat(adjustment.quantity_kg).toFixed(3)} kg ({adjustment.quantity_pcs} pcs)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reason:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    adjustment.reason === 'rust'
                      ? 'bg-orange-100 text-orange-800'
                      : adjustment.reason === 'old_stock'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {adjustment.reason === 'rust' ? 'Rust' : adjustment.reason === 'old_stock' ? 'Old Stock' : 'Other'}
                  </span>
                </div>
                {adjustment.reason_text && (
                  <div className="pt-2">
                    <span className="text-xs text-gray-600">Details:</span>
                    <p className="text-sm text-gray-900 mt-1">{adjustment.reason_text}</p>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Requested By:</span>
                  <span className="font-medium text-gray-900">{adjustment.requested_by_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Requested Date:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(adjustment.requested_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Review Info */}
              {adjustment.status !== 'pending' && (
                <div className="pt-3 border-t space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reviewed By:</span>
                    <span className="font-medium text-gray-900">{adjustment.reviewed_by_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reviewed Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(adjustment.reviewed_date).toLocaleDateString()}
                    </span>
                  </div>
                  {adjustment.review_notes && (
                    <div className="text-sm">
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-gray-900 mt-1">{adjustment.review_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {adjustment.status === 'pending' && (
                <div className="flex space-x-2 pt-3 border-t">
                  <button
                    onClick={() => handleApprove(adjustment)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(adjustment)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showApproveModal && selectedAdjustment && (
        <ApproveModal
          adjustment={selectedAdjustment}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedAdjustment(null);
          }}
          onSubmit={handleSubmitApprove}
        />
      )}

      {showRejectModal && selectedAdjustment && (
        <RejectModal
          adjustment={selectedAdjustment}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedAdjustment(null);
          }}
          onSubmit={handleSubmitReject}
        />
      )}
    </div>
  );
};

export default AdjustmentsTab;

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import packingZoneAPI from '@/components/API_Service/packing-zone-api';
import toast from 'react-hot-toast';

const ApproveModal = ({ request, onClose, onSubmit }) => {
  const [mergedHeatNo, setMergedHeatNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mergedHeatNo.trim()) {
      toast.error('Please enter merged heat number');
      return;
    }

    // Validate format (e.g., H2025A42M1)
    const heatNoPattern = /^H\d{4}[A-Z]\d+M\d+$/;
    if (!heatNoPattern.test(mergedHeatNo)) {
      toast.error('Invalid format. Use format like: H2025A42M1');
      return;
    }

    setIsSubmitting(true);
    await onSubmit({ merged_heat_no: mergedHeatNo });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Approve Merge Request</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Request Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Product:</span>
              <span className="text-sm font-medium text-gray-900">{request.ipc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Requested By:</span>
              <span className="text-sm font-medium text-gray-900">{request.requested_by_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Requested Date:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(request.requested_date).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Heat Numbers to Merge */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Heat Numbers to Merge</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {request.heat_numbers_data?.map((heat, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 rounded p-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{heat.heat_no}</div>
                    <div className="text-xs text-gray-500">{heat.age_days} days old</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{parseFloat(heat.kg).toFixed(3)} kg</div>
                    <div className="text-xs text-gray-600">{heat.pieces} pcs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Merge Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Heat Numbers:</span>
                <span className="font-bold text-blue-900">{request.heat_numbers_data?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total Weight:</span>
                <span className="font-bold text-blue-900">{parseFloat(request.total_kg).toFixed(3)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total Pieces:</span>
                <span className="font-bold text-blue-900">{request.total_pieces} pcs</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          {request.reason && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Reason for Merge</h4>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                {request.reason}
              </div>
            </div>
          )}

          {/* New Merged Heat Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Merged Heat Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={mergedHeatNo}
              onChange={(e) => setMergedHeatNo(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., H2025A42M1"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: H + Year + Letter + Number + M + Sequence (e.g., H2025A42M1)
            </p>
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
                  Approving will merge all selected heat numbers into one. Original heat numbers will be stored in merge history for traceability.
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
              {isSubmitting ? 'Approving...' : 'Approve Merge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RejectModal = ({ request, onClose, onSubmit }) => {
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
            <h3 className="text-lg font-semibold text-gray-900">Reject Merge Request</h3>
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
              <span className="font-medium">Product:</span> {request.ipc}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-medium">Heat Numbers:</span> {request.heat_numbers_data?.length || 0}
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

const MergeRequestsTab = ({ isReadOnly, isProductionHead, onRefresh }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const result = await packingZoneAPI.mergeRequests.getAll({ status: activeTab });
      if (!result.error) {
        setRequests(result);
      } else {
        toast.error('Failed to fetch merge requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch merge requests');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle approve
  const handleApprove = useCallback((request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  }, []);

  const handleSubmitApprove = useCallback(async (approvalData) => {
    const toastId = toast.loading('Approving merge request...');
    try {
      const result = await packingZoneAPI.mergeRequests.approve(selectedRequest.id, approvalData);
      if (!result.error) {
        toast.success(`Merge approved! New heat no: ${approvalData.merged_heat_no}`, { id: toastId });
        setShowApproveModal(false);
        setSelectedRequest(null);
        fetchRequests();
        onRefresh?.();
      } else {
        toast.error(result.message || 'Failed to approve merge', { id: toastId });
      }
    } catch (error) {
      console.error('Error approving merge:', error);
      toast.error('Failed to approve merge', { id: toastId });
    }
  }, [selectedRequest, fetchRequests, onRefresh]);

  // Handle reject
  const handleReject = useCallback((request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  }, []);

  const handleSubmitReject = useCallback(async (rejectionData) => {
    const toastId = toast.loading('Rejecting merge request...');
    try {
      const result = await packingZoneAPI.mergeRequests.reject(selectedRequest.id, rejectionData);
      if (!result.error) {
        toast.success('Merge request rejected', { id: toastId });
        setShowRejectModal(false);
        setSelectedRequest(null);
        fetchRequests();
        onRefresh?.();
      } else {
        toast.error(result.message || 'Failed to reject merge', { id: toastId });
      }
    } catch (error) {
      console.error('Error rejecting merge:', error);
      toast.error('Failed to reject merge', { id: toastId });
    }
  }, [selectedRequest, fetchRequests, onRefresh]);

  // Statistics
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    
    return { pending, approved, rejected };
  }, [requests]);

  if (!isProductionHead) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Production Head Access Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Only Production Head can approve or reject merge requests
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600">Loading merge requests...</p>
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

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab} requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'pending'
              ? 'No merge requests awaiting approval'
              : `No ${activeTab} merge requests`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{request.ipc}</h4>
                  <p className="text-sm text-gray-500">{request.product_code}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  request.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : request.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Heat Numbers:</span>
                  <span className="font-medium text-gray-900">{request.heat_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Weight:</span>
                  <span className="font-medium text-gray-900">{parseFloat(request.total_kg).toFixed(3)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Pieces:</span>
                  <span className="font-medium text-gray-900">{request.total_pieces}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Requested By:</span>
                  <span className="font-medium text-gray-900">{request.requested_by_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Requested Date:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(request.requested_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Review Info */}
              {request.status !== 'pending' && (
                <div className="pt-3 border-t space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reviewed By:</span>
                    <span className="font-medium text-gray-900">{request.reviewed_by_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reviewed Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(request.reviewed_date).toLocaleDateString()}
                    </span>
                  </div>
                  {request.review_notes && (
                    <div className="text-sm">
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-gray-900 mt-1">{request.review_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {request.status === 'pending' && (
                <div className="flex space-x-2 pt-3 border-t">
                  <button
                    onClick={() => handleApprove(request)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(request)}
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
      {showApproveModal && selectedRequest && (
        <ApproveModal
          request={selectedRequest}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleSubmitApprove}
        />
      )}

      {showRejectModal && selectedRequest && (
        <RejectModal
          request={selectedRequest}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleSubmitReject}
        />
      )}
    </div>
  );
};

export default MergeRequestsTab;

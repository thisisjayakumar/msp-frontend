"use client";

import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/outline';
import additionalRMAPI from '../API_Service/additional-rm-api';
import { toast } from 'react-hot-toast';

export default function AdditionalRMApprovalTab({ userRole }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    approved_quantity_kg: '',
    approval_notes: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canApprove = userRole === 'manager'; // Only managers can approve
  const canView = ['manager', 'production_head'].includes(userRole);

  useEffect(() => {
    if (canView) {
      fetchPendingRequests();
    }
  }, [canView]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await additionalRMAPI.getPendingApprovals();
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setApprovalData({
      approved_quantity_kg: request.additional_rm_requested_kg,
      approval_notes: ''
    });
    setShowApprovalModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const submitApproval = async () => {
    if (!approvalData.approved_quantity_kg || parseFloat(approvalData.approved_quantity_kg) <= 0) {
      toast.error('Please enter a valid approved quantity');
      return;
    }

    try {
      setSubmitting(true);
      await additionalRMAPI.approve(selectedRequest.id, {
        approved_quantity_kg: parseFloat(approvalData.approved_quantity_kg),
        approval_notes: approvalData.approval_notes
      });

      toast.success(`Additional RM request approved! ${approvalData.approved_quantity_kg} kg approved for MO ${selectedRequest.mo_id}`);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      await fetchPendingRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRejection = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      toast.error('Please provide a detailed rejection reason (minimum 10 characters)');
      return;
    }

    try {
      setSubmitting(true);
      await additionalRMAPI.reject(selectedRequest.id, {
        rejection_reason: rejectionReason.trim()
      });

      toast.success(`Additional RM request rejected for MO ${selectedRequest.mo_id}`);
      setShowRejectModal(false);
      setSelectedRequest(null);
      await fetchPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canView) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You don't have permission to view approval requests.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Additional RM Approvals</h2>
          <p className="mt-1 text-sm text-gray-500">
            {canApprove ? 'Approve or reject additional raw material requests' : 'View additional raw material requests (Manager approval required)'}
          </p>
        </div>
        <div className="px-4 py-2 bg-orange-100 rounded-lg">
          <p className="text-sm font-medium text-orange-800">
            {requests.length} Pending {requests.length === 1 ? 'Request' : 'Requests'}
          </p>
        </div>
      </div>

      {/* Permission Notice for PH */}
      {userRole === 'production_head' && requests.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> As Production Head, you can view these requests but cannot approve them. 
            Only Manager has the authority to approve additional RM requests.
          </p>
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Pending Requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no additional RM requests waiting for approval.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {/* Request Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.mo_id}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                      {request.status_display}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{request.mo_product}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Request ID</p>
                  <p className="text-sm font-medium text-gray-700">{request.request_id}</p>
                </div>
              </div>

              {/* RM Details */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Original Allocated</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {parseFloat(request.original_allocated_rm_kg).toFixed(3)} kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Released So Far</p>
                  <p className="text-lg font-semibold text-red-600">
                    {parseFloat(request.rm_released_so_far_kg).toFixed(3)} kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Additional Requested</p>
                  <p className="text-lg font-semibold text-orange-600">
                    +{parseFloat(request.additional_rm_requested_kg).toFixed(3)} kg
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-1">Reason:</p>
                <p className="text-sm text-gray-700 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  {request.reason}
                </p>
              </div>

              {/* Request Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div>
                  <p>Requested by: <span className="font-medium">{request.requested_by_name}</span></p>
                  <p>Requested at: <span className="font-medium">{new Date(request.requested_at).toLocaleString()}</span></p>
                </div>
                {request.excess_batch_id && (
                  <p>Excess Batch: <span className="font-medium">{request.excess_batch_id}</span></p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {canApprove ? (
                  <>
                    <button
                      onClick={() => handleApprove(request)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(request)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      <span>Reject</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleViewDetails(request)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <EyeIcon className="h-5 w-5" />
                    <span>View Details</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowApprovalModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Approve Additional RM Request</h3>
                <p className="text-sm text-gray-500">MO: {selectedRequest.mo_id}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved Quantity (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={approvalData.approved_quantity_kg}
                    onChange={(e) => setApprovalData({ ...approvalData, approved_quantity_kg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="Enter approved quantity"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Requested: {parseFloat(selectedRequest.additional_rm_requested_kg).toFixed(3)} kg
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={approvalData.approval_notes}
                    onChange={(e) => setApprovalData({ ...approvalData, approval_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="Add any notes about this approval"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitApproval}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Approving...' : 'Approve Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRejectModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reject Additional RM Request</h3>
                <p className="text-sm text-gray-500">MO: {selectedRequest.mo_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                  placeholder="Explain why this request is being rejected (minimum 10 characters)"
                  minLength={10}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


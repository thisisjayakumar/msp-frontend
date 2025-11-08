'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import packingZoneAPI from '@/components/API_Service/packing-zone-api';
import toast from 'react-hot-toast';

const ReportIssueModal = ({ batch, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    reason: '',
    notes: '',
    actual_kg: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason) {
      toast.error('Please select a reason');
      return;
    }

    if (['low_qty', 'high_qty'].includes(formData.reason) && !formData.actual_kg) {
      toast.error('Please enter actual quantity received');
      return;
    }

    setIsSubmitting(true);
    const submitData = {
      reason: formData.reason,
      notes: formData.notes || ''
    };

    if (formData.actual_kg) {
      submitData.actual_kg = parseFloat(formData.actual_kg);
    }

    await onSubmit(submitData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Report Issue</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Batch Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">MO ID:</span>
              <span className="text-sm font-medium text-gray-900">{batch.mo_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">IPC:</span>
              <span className="text-sm font-medium text-gray-900">{batch.ipc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expected Qty:</span>
              <span className="text-sm font-medium text-gray-900">{batch.ok_quantity_kg} kg</span>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Issue <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select reason</option>
              <option value="low_qty">Received Low Qty</option>
              <option value="high_qty">Received High Qty</option>
              <option value="product_mismatch">Different Product Received</option>
              <option value="other">Others</option>
            </select>
          </div>

          {/* Actual Quantity (shown for qty issues) */}
          {['low_qty', 'high_qty'].includes(formData.reason) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actual Quantity Received (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.actual_kg}
                onChange={(e) => setFormData({ ...formData, actual_kg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter actual kg received"
                required
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes / Details
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add any additional details..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
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
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Reporting...' : 'Report Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BatchCard = ({ batch, onVerify, onReportIssue, isReadOnly }) => {
  const getStatusBadge = (status) => {
    const badges = {
      to_be_verified: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      on_hold: 'bg-orange-100 text-orange-800',
      reported: 'bg-red-100 text-red-800',
      packed: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      to_be_verified: 'To Be Verified',
      verified: 'Verified',
      on_hold: 'On Hold',
      reported: 'Reported',
      packed: 'Packed'
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{batch.ipc}</h4>
          <p className="text-sm text-gray-500">MO: {batch.mo_id}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(batch.status)}`}>
          {getStatusLabel(batch.status)}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-500">Product Code</p>
          <p className="text-sm font-medium text-gray-900">{batch.product_code}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Heat No</p>
          <p className="text-sm font-medium text-gray-900">{batch.heat_no}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Quantity</p>
          <p className="text-sm font-medium text-gray-900">{parseFloat(batch.ok_quantity_kg).toFixed(3)} kg</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Packing Size</p>
          <p className="text-sm font-medium text-gray-900">{batch.packing_size} pcs</p>
        </div>
      </div>

      {batch.coil_no && (
        <div className="mb-4">
          <p className="text-xs text-gray-500">Coil No</p>
          <p className="text-sm font-medium text-gray-900">{batch.coil_no}</p>
        </div>
      )}

      {/* Hold Info */}
      {(batch.status === 'on_hold' || batch.status === 'reported') && batch.hold_reason && (
        <div className="mb-4 p-3 bg-orange-50 rounded-md">
          <p className="text-xs font-medium text-orange-800 mb-1">Issue Reported</p>
          <p className="text-sm text-orange-900">
            {batch.hold_reason === 'low_qty' && 'Received Low Quantity'}
            {batch.hold_reason === 'high_qty' && 'Received High Quantity'}
            {batch.hold_reason === 'product_mismatch' && 'Product Mismatch'}
            {batch.hold_reason === 'other' && 'Other Issue'}
          </p>
          {batch.hold_notes && (
            <p className="text-xs text-orange-700 mt-1">{batch.hold_notes}</p>
          )}
          {batch.actual_received_kg && (
            <p className="text-xs text-orange-700 mt-1">
              Actual: {parseFloat(batch.actual_received_kg).toFixed(3)} kg
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {batch.status === 'to_be_verified' && !isReadOnly && (
        <div className="flex space-x-2">
          <button
            onClick={() => onVerify(batch)}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            ✓ Verify
          </button>
          <button
            onClick={() => onReportIssue(batch)}
            className="flex-1 bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            ⚠ Report Issue
          </button>
        </div>
      )}

      {/* Received Date */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Received: {new Date(batch.received_date).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

const VerificationTab = ({ isReadOnly, isProductionHead, onRefresh }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'to_be_verified',
    product_code: '',
    heat_no: ''
  });
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Fetch batches
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const result = await packingZoneAPI.batches.getAll(filters);
      if (!result.error) {
        setBatches(result);
      } else {
        toast.error('Failed to fetch batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Handle verify batch
  const handleVerify = useCallback(async (batch) => {
    if (isReadOnly) {
      toast.error('Read-only mode - cannot verify batches');
      return;
    }

    const toastId = toast.loading('Verifying batch...');
    try {
      const result = await packingZoneAPI.batches.verify(batch.id);
      if (!result.error) {
        toast.success('Batch verified successfully!', { id: toastId });
        fetchBatches();
        onRefresh?.();
      } else {
        toast.error(result.message || 'Failed to verify batch', { id: toastId });
      }
    } catch (error) {
      console.error('Error verifying batch:', error);
      toast.error('Failed to verify batch', { id: toastId });
    }
  }, [isReadOnly, fetchBatches, onRefresh]);

  // Handle report issue
  const handleReportIssue = useCallback((batch) => {
    if (isReadOnly) {
      toast.error('Read-only mode - cannot report issues');
      return;
    }
    setSelectedBatch(batch);
    setShowReportModal(true);
  }, [isReadOnly]);

  const handleSubmitIssue = useCallback(async (issueData) => {
    const toastId = toast.loading('Reporting issue...');
    try {
      const result = await packingZoneAPI.batches.reportIssue(selectedBatch.id, issueData);
      if (!result.error) {
        toast.success('Issue reported successfully!', { id: toastId });
        setShowReportModal(false);
        setSelectedBatch(null);
        fetchBatches();
        onRefresh?.();
      } else {
        toast.error(result.message || 'Failed to report issue', { id: toastId });
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error('Failed to report issue', { id: toastId });
    }
  }, [selectedBatch, fetchBatches, onRefresh]);

  // Statistics
  const stats = useMemo(() => {
    const toVerify = batches.filter(b => b.status === 'to_be_verified').length;
    const verified = batches.filter(b => b.status === 'verified').length;
    const onHold = batches.filter(b => b.status === 'on_hold' || b.status === 'reported').length;
    
    return { toVerify, verified, onHold };
  }, [batches]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">To Be Verified</div>
          <div className="text-2xl font-bold text-blue-900">{stats.toVerify}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Verified</div>
          <div className="text-2xl font-bold text-green-900">{stats.verified}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-orange-600 font-medium">Issues / On Hold</div>
          <div className="text-2xl font-bold text-orange-900">{stats.onHold}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="to_be_verified">To Be Verified</option>
              <option value="verified">Verified</option>
              <option value="on_hold">On Hold</option>
              <option value="reported">Reported</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Code</label>
            <input
              type="text"
              value={filters.product_code}
              onChange={(e) => setFilters({ ...filters, product_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Filter by product"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Heat No</label>
            <input
              type="text"
              value={filters.heat_no}
              onChange={(e) => setFilters({ ...filters, heat_no: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Filter by heat no"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'to_be_verified', product_code: '', heat_no: '' })}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Batch List */}
      {batches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No batches found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.status || filters.product_code || filters.heat_no
              ? 'Try adjusting your filters'
              : 'No batches available for verification'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onVerify={handleVerify}
              onReportIssue={handleReportIssue}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* Report Issue Modal */}
      {showReportModal && selectedBatch && (
        <ReportIssueModal
          batch={selectedBatch}
          onClose={() => {
            setShowReportModal(false);
            setSelectedBatch(null);
          }}
          onSubmit={handleSubmitIssue}
        />
      )}
    </div>
  );
};

export default VerificationTab;

"use client";

import { useState, useEffect } from 'react';
import manufacturingAPI from '../API_Service/manufacturing-api';
import Button from '../CommonComponents/ui/Button';
import { Card } from '../CommonComponents/ui/Card';
import { XMarkIcon, CubeIcon, ClipboardDocumentListIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

export default function MODetailModal({ mo, onClose, onRefresh, onCreateBatch }) {
  const [batches, setBatches] = useState([]);
  const [batchSummary, setBatchSummary] = useState(null);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [scrapModal, setScrapModal] = useState({ show: false, scrapKg: '', sendAll: false });
  const [submittingScrap, setSubmittingScrap] = useState(false);
  const [completingAllocation, setCompletingAllocation] = useState(false);

  useEffect(() => {
    fetchBatchData();
  }, [mo.id]);

  const fetchBatchData = async () => {
    try {
      setLoadingBatches(true);
      const [batchesData, summary] = await Promise.all([
        manufacturingAPI.batches.getByMO(mo.id),
        manufacturingAPI.batches.getMOBatchSummary(mo.id)
      ]);
      setBatches(batchesData.batches || []);
      setBatchSummary(summary);
    } catch (err) {
      console.error('Error fetching batch data:', err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendToScrap = async () => {
    if (!scrapModal.sendAll && !scrapModal.scrapKg) {
      alert('Please enter scrap weight or select "Send All Remaining"');
      return;
    }

    if (!scrapModal.sendAll) {
      const scrapKg = parseFloat(scrapModal.scrapKg);
      if (isNaN(scrapKg) || scrapKg <= 0) {
        alert('Please enter a valid positive number');
        return;
      }
    }

    try {
      setSubmittingScrap(true);
      const scrapKg = scrapModal.sendAll ? null : parseFloat(scrapModal.scrapKg);
      await manufacturingAPI.manufacturingOrders.sendRemainingToScrap(mo.id, scrapKg, scrapModal.sendAll);
      
      // Refresh data
      await fetchBatchData();
      onRefresh && onRefresh();
      
      // Close modal
      setScrapModal({ show: false, scrapKg: '', sendAll: false });
    } catch (err) {
      console.error('Error sending RM to scrap:', err);
      alert('Error sending RM to scrap: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmittingScrap(false);
    }
  };

  const handleCompleteAllocation = async () => {
    if (!confirm('Complete RM Allocation?\n\nThis will mark all RM as allocated and move the MO to the next stage.')) {
      return;
    }

    try {
      setCompletingAllocation(true);
      await manufacturingAPI.manufacturingOrders.completeRMAllocation(
        mo.id,
        'All RM allocated to batches by RM Store'
      );
      
      // Refresh dashboard
      onRefresh && onRefresh();
      
      // Close modal
      onClose();
      
      alert('RM Allocation completed successfully! MO moved to Completed tab.');
    } catch (err) {
      console.error('Error completing RM allocation:', err);
      alert('Error completing RM allocation: ' + (err.message || 'Unknown error'));
      setCompletingAllocation(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'created':
        return 'bg-gray-100 text-gray-800';
      case 'in_process':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center text-white">
              <ClipboardDocumentListIcon className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-semibold">Manufacturing Order Details</h3>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* MO Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-3">Order Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">MO ID:</span>
                    <span className="text-sm font-medium text-slate-800">{mo.mo_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Product Code:</span>
                    <span className="text-sm font-medium text-slate-800">{mo.product_code?.product_code || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Quantity:</span>
                    <span className="text-sm font-medium text-slate-800">{mo.quantity?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Status:</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(mo.status)}`}>
                      {mo.status_display || mo.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Priority:</span>
                    <span className="text-sm font-medium text-slate-800">{mo.priority_display || mo.priority}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-3">Raw Material Requirements</h4>
                <div className="space-y-2">
                  {mo.strips_required ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Strips Required:</span>
                        <span className="text-sm font-bold text-cyan-600">{mo.strips_required} strips</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Total Pieces from Strips:</span>
                        <span className="text-sm font-medium text-slate-800">{mo.total_pieces_from_strips}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Excess Pieces:</span>
                        <span className="text-sm font-medium text-slate-800">{mo.excess_pieces}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">RM Required:</span>
                        <span className="text-sm font-bold text-cyan-600">
                          {batchSummary ? `${batchSummary.total_rm_required} ${batchSummary.rm_unit}` : 'Loading...'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Tolerance:</span>
                        <span className="text-sm font-medium text-slate-800">
                          {mo.tolerance_percentage ? `${mo.tolerance_percentage}%` : 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Material Type:</span>
                    <span className="text-sm font-medium text-slate-800">{mo.material_type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Material Name:</span>
                    <span className="text-sm font-medium text-slate-800">{mo.material_name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-3">Dates</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-slate-600 block">Created</span>
                  <span className="text-sm font-medium text-slate-800">{formatDate(mo.created_at)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-600 block">Planned Start</span>
                  <span className="text-sm font-medium text-slate-800">{formatDate(mo.planned_start_date)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-600 block">Planned End</span>
                  <span className="text-sm font-medium text-slate-800">{formatDate(mo.planned_end_date)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-600 block">Delivery Date</span>
                  <span className="text-sm font-medium text-slate-800">{formatDate(mo.delivery_date)}</span>
                </div>
              </div>
            </div>

            {/* RM Allocation Summary */}
            {batchSummary && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-cyan-800 mb-3 flex items-center">
                  <CubeIcon className="h-5 w-5 mr-2" />
                  RM Allocation & Batch Progress
                </h4>
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Overall Completion</span>
                      <span className="font-semibold text-cyan-700">{batchSummary.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-cyan-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${batchSummary.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* RM Stats Grid */}
                  <div className="grid grid-cols-6 gap-2 text-sm">
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">Total RM</div>
                      <div className="font-bold text-slate-800 text-sm">
                        {batchSummary.total_rm_required} {batchSummary.rm_unit}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">Released</div>
                      <div className="font-bold text-orange-600 text-sm">
                        {batchSummary.cumulative_rm_released.toFixed(3)} {batchSummary.rm_unit}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">Prod. Scrap</div>
                      <div className="font-bold text-amber-600 text-sm">
                        {batchSummary.cumulative_scrap_rm.toFixed(3)} {batchSummary.rm_unit}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">RM Scrap</div>
                      <div className="font-bold text-red-600 text-sm">
                        {batchSummary.mo_scrap_rm.toFixed(3)} {batchSummary.rm_unit}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">Remaining</div>
                      <div className="font-bold text-green-600 text-sm">
                        {batchSummary.remaining_rm.toFixed(3)} {batchSummary.rm_unit}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">Batches</div>
                      <div className="font-bold text-blue-600 text-sm">
                        {batchSummary.batch_count}
                      </div>
                    </div>
                  </div>

                  {/* Send to Scrap Button - Show when there's remaining RM */}
                  {batchSummary.remaining_rm > 0 && (
                    <div className="mt-3">
                      <Button
                        onClick={() => setScrapModal({ show: true, scrapKg: '', sendAll: false })}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-300"
                        size="sm"
                      >
                        Send Remaining RM to Scrap
                      </Button>
                    </div>
                  )}

                  {/* Complete RM Allocation Button - Show when all RM is allocated */}
                  {batchSummary.remaining_rm <= 0 && batchSummary.completion_percentage === 100 && mo.status !== 'rm_allocated' && (
                    <div className="mt-3">
                      <Button
                        onClick={handleCompleteAllocation}
                        disabled={completingAllocation}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        {completingAllocation ? 'Completing...' : '✓ Complete RM Allocation'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Batches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-600 flex items-center">
                  <CubeIcon className="h-5 w-5 mr-2" />
                  Batches ({batches.length})
                </h4>
              </div>

              {loadingBatches ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                </div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No batches created yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Batch ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">RM Allocated (kg)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Production Scrap (kg)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Progress</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {batches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-slate-800">{batch.batch_id}</td>
                          <td className="px-4 py-2 text-sm text-slate-600">
                            {/* planned_quantity is in grams, convert to kg for display */}
                            {(batch.planned_quantity / 1000).toFixed(3)} kg
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`font-medium ${batch.scrap_rm_weight > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                              {(batch.scrap_rm_weight / 1000).toFixed(3)} kg
                            </span>
                            {batch.scrap_rm_weight > 0 && (
                              <span className="text-xs text-slate-500 ml-1">(by Supervisor)</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(batch.status)}`}>
                              {batch.status_display || batch.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-600">
                            {batch.progress_percentage}%
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-600">
                            {formatDate(batch.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div>
              {(mo.status === 'on_hold' || mo.status === 'in_progress') && (
                <Button
                  onClick={() => onCreateBatch && onCreateBatch(mo)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  Create Batch
                </Button>
              )}
            </div>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Scrap RM Modal */}
      {scrapModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">Send Remaining RM to Scrap</h3>
              <p className="text-sm text-red-100 mt-1">
                MO: {mo.mo_id}
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  <span className="font-semibold">Remaining RM:</span> {batchSummary?.remaining_rm.toFixed(3)} {batchSummary?.rm_unit || 'kg'}
                </p>
              </div>

              <div className="mb-4">
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={scrapModal.sendAll}
                    onChange={(e) => setScrapModal({ ...scrapModal, sendAll: e.target.checked, scrapKg: '' })}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    disabled={submittingScrap}
                  />
                  <span className="text-sm font-medium text-slate-700">Send all remaining RM to scrap</span>
                </label>

                {!scrapModal.sendAll && (
                  <>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Scrap Weight ({batchSummary?.rm_unit || 'kg'})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      max={batchSummary?.remaining_rm}
                      value={scrapModal.scrapKg}
                      onChange={(e) => setScrapModal({ ...scrapModal, scrapKg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter scrap weight"
                      disabled={submittingScrap}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter amount up to {batchSummary?.remaining_rm.toFixed(3)} {batchSummary?.rm_unit || 'kg'}
                    </p>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setScrapModal({ show: false, scrapKg: '', sendAll: false })}
                  variant="secondary"
                  disabled={submittingScrap}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendToScrap}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={submittingScrap || (!scrapModal.sendAll && !scrapModal.scrapKg)}
                >
                  {submittingScrap ? 'Sending...' : 'Send to Scrap'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

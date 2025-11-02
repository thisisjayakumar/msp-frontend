"use client";

import { useState } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  PlusCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import additionalRMAPI from '../API_Service/additional-rm-api';

export default function EnhancedMOCard({ 
  mo, 
  onCreateBatch, 
  onRequestAdditionalRM,
  onMarkComplete,
  onViewDetails
}) {
  const [loading, setLoading] = useState(false);

  // Calculate RM summary from MO data
  const getRMSummary = () => {
    if (!mo) return null;

    const allocatedKg = parseFloat(mo.rm_required_kg || 0);
    const additionalApprovedKg = parseFloat(mo.additional_rm_approved_kg || 0);
    const totalLimitKg = allocatedKg + additionalApprovedKg;
    
    // Calculate total released from batches
    const totalReleasedGrams = (mo.batches || []).reduce(
      (sum, batch) => sum + parseInt(batch.planned_quantity || 0),
      0
    );
    const totalReleasedKg = totalReleasedGrams / 1000;
    
    const excessKg = totalReleasedKg - allocatedKg;
    const remainingCapacityKg = totalLimitKg - totalReleasedKg;

    return {
      allocated_rm_kg: allocatedKg,
      additional_approved_kg: additionalApprovedKg,
      total_limit_kg: totalLimitKg,
      total_released_kg: totalReleasedKg,
      excess_kg: Math.max(0, excessKg),
      remaining_capacity_kg: remainingCapacityKg,
      is_limit_exceeded: totalReleasedKg >= allocatedKg,
      can_create_batch: totalReleasedKg < totalLimitKg && mo.rm_completion_status === 'active',
      should_show_request_additional_rm: totalReleasedKg >= allocatedKg && mo.rm_completion_status === 'active',
      should_show_mark_complete: false // Calculated separately based on batch status
    };
  };

  const rmSummary = getRMSummary();

  // Check if should show mark complete button
  const checkCanMarkComplete = async () => {
    if (!mo || !rmSummary?.should_show_request_additional_rm) return false;
    
    try {
      // Get additional RM requests for this MO
      const response = await additionalRMAPI.getByMO(mo.id);
      
      // Check if there's an approved request that can be marked complete
      const approvedRequests = response.requests?.filter(r => r.status === 'approved') || [];
      
      return approvedRequests.some(request => request.can_mark_complete);
    } catch (error) {
      console.error('Error checking mark complete status:', error);
      return false;
    }
  };

  const handleMarkComplete = async () => {
    if (!window.confirm(`Are you sure you want to mark MO ${mo.mo_id} as complete?\n\nThis will move the MO to the Completed tab.`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Get approved request
      const response = await additionalRMAPI.getByMO(mo.id);
      const approvedRequest = response.requests?.find(r => r.status === 'approved');
      
      if (!approvedRequest) {
        toast.error('No approved additional RM request found');
        return;
      }

      await additionalRMAPI.markComplete(approvedRequest.id, {
        completion_notes: `MO ${mo.mo_id} marked as complete - all additional RM consumed`
      });

      toast.success(`MO ${mo.mo_id} marked as complete!`);
      
      if (onMarkComplete) {
        onMarkComplete(mo);
      }
    } catch (error) {
      console.error('Error marking complete:', error);
      toast.error(error.message || 'Failed to mark as complete');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      on_hold: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      mo_approved: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (!mo || !rmSummary) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{mo.mo_id}</h3>
            <p className="text-sm text-gray-600">{mo.product_code_display || 'N/A'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(mo.status)}`}>
            {mo.status_display || mo.status}
          </span>
        </div>

        {/* RM Limit Exceeded Warning */}
        {rmSummary.is_limit_exceeded && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">RM Limit Exceeded</p>
              <p className="text-xs text-red-600 mt-0.5">
                Released: {rmSummary.total_released_kg.toFixed(3)} kg | 
                Allocated: {rmSummary.allocated_rm_kg.toFixed(3)} kg | 
                Excess: {rmSummary.excess_kg.toFixed(3)} kg
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RM Summary */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-600">Allocated RM</p>
            <p className="text-lg font-semibold text-gray-900">
              {rmSummary.allocated_rm_kg.toFixed(3)} kg
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Released RM</p>
            <p className={`text-lg font-semibold ${rmSummary.is_limit_exceeded ? 'text-red-600' : 'text-green-600'}`}>
              {rmSummary.total_released_kg.toFixed(3)} kg
            </p>
          </div>
          {rmSummary.additional_approved_kg > 0 && (
            <>
              <div>
                <p className="text-xs text-gray-600">Additional Approved</p>
                <p className="text-lg font-semibold text-orange-600">
                  +{rmSummary.additional_approved_kg.toFixed(3)} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Remaining Capacity</p>
                <p className="text-lg font-semibold text-blue-600">
                  {rmSummary.remaining_capacity_kg.toFixed(3)} kg
                </p>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>RM Release Progress</span>
            <span>
              {((rmSummary.total_released_kg / rmSummary.total_limit_kg) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${rmSummary.total_released_kg > rmSummary.allocated_rm_kg ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, (rmSummary.total_released_kg / rmSummary.total_limit_kg) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 pt-4 space-y-3">
        {/* Create Batch Button */}
        {rmSummary.can_create_batch && (
          <button
            onClick={() => onCreateBatch && onCreateBatch(mo)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <PlusCircleIcon className="h-5 w-5" />
            <span>Create Batch</span>
          </button>
        )}

        {/* Request Additional RM Button */}
        {rmSummary.should_show_request_additional_rm && (
          <button
            onClick={() => onRequestAdditionalRM && onRequestAdditionalRM(mo)}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>Request Additional RM</span>
          </button>
        )}

        {/* Mark as Complete Button (shown based on async check) */}
        {mo.rm_completion_status !== 'completed' && rmSummary.additional_approved_kg > 0 && (
          <button
            onClick={handleMarkComplete}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleIcon className="h-5 w-5" />
            <span>{loading ? 'Marking Complete...' : 'Mark as Complete'}</span>
          </button>
        )}

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails && onViewDetails(mo)}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          View Details
        </button>

        {/* Batch Count Info */}
        {mo.batches && mo.batches.length > 0 && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 pt-2 border-t border-gray-200">
            <ClockIcon className="h-4 w-4" />
            <span>{mo.batches.length} {mo.batches.length === 1 ? 'Batch' : 'Batches'} Created</span>
          </div>
        )}
      </div>
    </div>
  );
}


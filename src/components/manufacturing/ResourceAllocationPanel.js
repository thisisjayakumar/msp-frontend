'use client';

import { useState, useEffect } from 'react';
import { Package, Box, PlayCircle, PauseCircle, AlertCircle } from 'lucide-react';
import { MANUFACTURING_APIS } from '@/components/API_Service/api-list';

export default function ResourceAllocationPanel({ moId }) {
  const [resourceStatus, setResourceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (moId) {
      fetchResourceStatus();
    }
  }, [moId]);

  const fetchResourceStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(MANUFACTURING_APIS.MO_RESOURCE_STATUS(moId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resource status');
      }

      const data = await response.json();
      setResourceStatus(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching resource status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading resource allocation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Failed to Load Resources</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchResourceStatus}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!resourceStatus) {
    return null;
  }

  const resources = resourceStatus.resources;
  const hasReservedRM = resources?.reserved_rm?.length > 0;
  const hasAllocatedRM = resources?.allocated_rm?.length > 0;
  const hasReservedFG = resources?.reserved_fg?.length > 0;
  const hasInProgressBatches = resources?.in_progress_batches?.length > 0;
  const hasPendingBatches = resources?.pending_batches?.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Resource Allocation</h2>
          <button
            onClick={fetchResourceStatus}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          MO ID: <span className="font-medium">{resourceStatus.mo_id}</span> | 
          Status: <span className="font-medium">{resourceStatus.status}</span> |
          Priority: <span className="font-medium">{resourceStatus.priority_level || 0}</span>
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Reserved Raw Materials */}
        <div className="border border-yellow-200 rounded-lg overflow-hidden">
          <div className="bg-yellow-50 px-4 py-2 flex items-center justify-between border-b border-yellow-200">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-yellow-600" />
              <h3 className="font-medium text-yellow-900">Reserved Raw Materials</h3>
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                {resources.reserved_rm?.length || 0}
              </span>
            </div>
          </div>
          <div className="p-4">
            {hasReservedRM ? (
              <div className="space-y-2">
                {resources.reserved_rm.map((rm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-100">
                    <div>
                      <p className="font-medium text-gray-900">{rm.material_code}</p>
                      <p className="text-sm text-gray-600">{rm.material}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-yellow-900">{rm.quantity_kg} kg</p>
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                        {rm.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No reserved raw materials</p>
            )}
          </div>
        </div>

        {/* Allocated/Locked Raw Materials */}
        <div className="border border-green-200 rounded-lg overflow-hidden">
          <div className="bg-green-50 px-4 py-2 flex items-center justify-between border-b border-green-200">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-900">Allocated Raw Materials</h3>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                {resources.allocated_rm?.length || 0}
              </span>
            </div>
          </div>
          <div className="p-4">
            {hasAllocatedRM ? (
              <div className="space-y-2">
                {resources.allocated_rm.map((rm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-100">
                    <div>
                      <p className="font-medium text-gray-900">{rm.material_code}</p>
                      <p className="text-sm text-gray-600">{rm.material}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-900">{rm.quantity_kg} kg</p>
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                        {rm.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No allocated raw materials</p>
            )}
          </div>
        </div>

        {/* Reserved Finished Goods */}
        <div className="border border-blue-200 rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-4 py-2 flex items-center justify-between border-b border-blue-200">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Reserved Finished Goods</h3>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                {resources.reserved_fg?.length || 0}
              </span>
            </div>
          </div>
          <div className="p-4">
            {hasReservedFG ? (
              <div className="space-y-2">
                {resources.reserved_fg.map((fg, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-100">
                    <div>
                      <p className="font-medium text-gray-900">{fg.product_code}</p>
                      <p className="text-sm text-gray-600">{fg.product}</p>
                      <span className="text-xs text-gray-500">{fg.reservation_type}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-900">{fg.quantity} units</p>
                      <p className="text-xs text-gray-500">{fg.reservation_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No reserved finished goods</p>
            )}
          </div>
        </div>

        {/* In-Progress Batches */}
        <div className="border border-purple-200 rounded-lg overflow-hidden">
          <div className="bg-purple-50 px-4 py-2 flex items-center justify-between border-b border-purple-200">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-purple-900">In-Progress Batches</h3>
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                {resources.in_progress_batches?.length || 0}
              </span>
            </div>
          </div>
          <div className="p-4">
            {hasInProgressBatches ? (
              <div className="space-y-2">
                {resources.in_progress_batches.map((batch, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded border border-purple-100">
                    <div>
                      <p className="font-medium text-gray-900">{batch.batch_id}</p>
                      <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">
                        {batch.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-900">
                        {batch.actual_quantity_completed}/{batch.planned_quantity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round((batch.actual_quantity_completed / batch.planned_quantity) * 100)}% complete
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No batches in progress</p>
            )}
          </div>
        </div>

        {/* Pending Batches */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-2">
              <PauseCircle className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Pending Batches</h3>
              <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                {resources.pending_batches?.length || 0}
              </span>
            </div>
          </div>
          <div className="p-4">
            {hasPendingBatches ? (
              <div className="space-y-2">
                {resources.pending_batches.map((batch, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{batch.batch_id}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        batch.can_release 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {batch.can_release ? 'Can Release' : 'Blocked'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{batch.planned_quantity} units</p>
                      <span className="text-xs text-gray-500">{batch.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No pending batches</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


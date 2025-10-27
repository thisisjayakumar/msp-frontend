'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, ArrowUp, ArrowDown, Pause, Package, Box, RefreshCw } from 'lucide-react';
import StopMOConfirmationModal from './StopMOConfirmationModal';
import { MANUFACTURING_APIS } from '@/components/API_Service/api-list';

export default function MOPriorityManager() {
  const [mos, setMos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMO, setSelectedMO] = useState(null);
  const [showStopModal, setShowStopModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('on_hold,rm_allocated,in_progress');

  useEffect(() => {
    fetchPriorityQueue();
  }, [statusFilter]);

  const fetchPriorityQueue = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      let url = MANUFACTURING_APIS.MO_PRIORITY_QUEUE;
      
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch MO priority queue');
      }

      const data = await response.json();
      setMos(data.results || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching priority queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopMO = async (stopReason) => {
    if (!selectedMO) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(MANUFACTURING_APIS.MO_STOP(selectedMO.id), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stop_reason: stopReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop MO');
      }

      // Refresh the priority queue
      await fetchPriorityQueue();
      
      // Show success notification (you can replace this with your toast notification)
      alert(`MO ${selectedMO.mo_id} stopped successfully!`);
      
    } catch (error) {
      console.error('Error stopping MO:', error);
      throw error;
    }
  };

  const getPriorityColor = (priorityLevel) => {
    if (priorityLevel >= 100) return 'text-red-600 bg-red-100';
    if (priorityLevel >= 50) return 'text-orange-600 bg-orange-100';
    if (priorityLevel >= 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status) => {
    const colors = {
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'rm_allocated': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-green-100 text-green-800',
      'submitted': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading MO priority queue...</span>
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
            <h3 className="font-medium text-red-900">Failed to Load Priority Queue</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchPriorityQueue}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">MO Priority Manager</h2>
          <button
            onClick={fetchPriorityQueue}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Active</option>
            <option value="on_hold,rm_allocated,in_progress">Active MOs</option>
            <option value="on_hold">On Hold</option>
            <option value="rm_allocated">RM Allocated</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
          </select>
          <span className="text-sm text-gray-500">
            Total: {mos.length} MO{mos.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {mos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No MOs found matching the current filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mos.map((mo, index) => (
              <div
                key={mo.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Priority & Basic Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Priority Badge */}
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getPriorityColor(mo.priority_level)}`}>
                        {mo.priority_level || 0}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">Priority</span>
                    </div>

                    {/* MO Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{mo.mo_id}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(mo.status)}`}>
                          {mo.status_display}
                        </span>
                        {mo.priority_display && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            {mo.priority_display}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Product:</span>
                          <span className="ml-2 font-medium">{mo.product_code_display}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Customer:</span>
                          <span className="ml-2 font-medium">{mo.customer_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Quantity:</span>
                          <span className="ml-2 font-medium">{mo.quantity}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <span className="ml-2 font-medium">
                            {new Date(mo.planned_start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Resource Badges */}
                      <div className="flex items-center gap-3 mt-3">
                        {mo.reserved_rm_count > 0 && (
                          <div className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            <Package className="w-3 h-3" />
                            <span>{mo.reserved_rm_count} Reserved RM</span>
                          </div>
                        )}
                        {mo.allocated_rm_count > 0 && (
                          <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            <Package className="w-3 h-3" />
                            <span>{mo.allocated_rm_count} Allocated RM</span>
                          </div>
                        )}
                        {mo.reserved_fg_count > 0 && (
                          <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            <Box className="w-3 h-3" />
                            <span>{mo.reserved_fg_count} Reserved FG</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2">
                    {mo.can_be_stopped && (
                      <button
                        onClick={() => {
                          setSelectedMO(mo);
                          setShowStopModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Pause className="w-4 h-4" />
                        Stop MO
                      </button>
                    )}
                    
                    <a
                      href={`/production-head/manufacturing-orders/${mo.id}`}
                      className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
                    >
                      View Details
                    </a>
                  </div>
                </div>

                {/* Position Indicator */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Position #{index + 1} in queue</span>
                  {mo.reserved_rm_count > 0 && (
                    <span className="text-yellow-600">Has reserved resources that can be released</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stop MO Modal */}
      <StopMOConfirmationModal
        isOpen={showStopModal}
        onClose={() => {
          setShowStopModal(false);
          setSelectedMO(null);
        }}
        moData={selectedMO}
        onConfirm={handleStopMO}
      />
    </div>
  );
}


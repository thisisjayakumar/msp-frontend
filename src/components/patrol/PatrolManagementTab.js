"use client";

import { useState, useEffect, useCallback } from 'react';
import patrolAPI from '@/components/API_Service/patrol-api';
import PatrolDutyForm from './PatrolDutyForm';

export default function PatrolManagementTab({ isReadOnly = false }) {
  const [loading, setLoading] = useState(false);
  const [duties, setDuties] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [uploads, setUploads] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    patrol_user: '',
    start_date: '',
    end_date: '',
  });

  // Download filters
  const [downloadFilters, setDownloadFilters] = useState({
    start_date: '',
    end_date: '',
    process: '',
    duty_id: '',
  });
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const fetchDuties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await patrolAPI.duties.getAll(filters);
      console.log('Duties data received:', data);
      
      // Handle response structure - could be array, object with results, or error object
      if (data && !data.error) {
        if (Array.isArray(data)) {
          setDuties(data);
        } else if (data.results && Array.isArray(data.results)) {
          setDuties(data.results);
        } else if (data.data && Array.isArray(data.data)) {
          setDuties(data.data);
        } else {
          console.warn('Unexpected duties data structure:', data);
          setDuties([]);
        }
      } else {
        console.error('Error fetching duties:', data?.error || data?.message);
        setDuties([]);
      }
    } catch (error) {
      console.error('Error fetching duties:', error);
      setDuties([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStatistics = useCallback(async () => {
    try {
      const data = await patrolAPI.dashboard.getStatistics();
      console.log('Statistics data received:', data);
      
      // Handle response structure
      if (data && !data.error) {
        // Statistics should be an object, not an array
        if (typeof data === 'object' && !Array.isArray(data)) {
          setStatistics(data);
        } else if (data.data && typeof data.data === 'object') {
          setStatistics(data.data);
        } else {
          console.warn('Unexpected statistics data structure:', data);
          setStatistics(null);
        }
      } else {
        console.error('Error fetching statistics:', data?.error || data?.message);
        setStatistics(null);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics(null);
    }
  }, []);

  useEffect(() => {
    fetchDuties();
    fetchStatistics();
  }, [fetchDuties, fetchStatistics]);

  const handleCreateDuty = () => {
    setSelectedDuty(null);
    setShowCreateModal(true);
  };

  const handleEditDuty = (duty) => {
    setSelectedDuty(duty);
    setShowCreateModal(true);
  };

  const handleViewDetails = async (duty) => {
    setSelectedDuty(duty);
    setShowDetailsModal(true);
    // Fetch uploads for this duty
    try {
      const data = await patrolAPI.uploads.getAll({ duty_id: duty.id });
      console.log('Uploads data received:', data);
      
      // Handle response structure
      if (data && !data.error) {
        if (Array.isArray(data)) {
          setUploads(data);
        } else if (data.results && Array.isArray(data.results)) {
          setUploads(data.results);
        } else if (data.data && Array.isArray(data.data)) {
          setUploads(data.data);
        } else {
          console.warn('Unexpected uploads data structure:', data);
          setUploads([]);
        }
      } else {
        console.error('Error fetching uploads:', data?.error || data?.message);
        setUploads([]);
      }
    } catch (error) {
      console.error('Error fetching uploads:', error);
      setUploads([]);
    }
  };

  const handleCancelDuty = async (dutyId) => {
    if (!confirm('Are you sure you want to cancel this patrol duty?')) {
      return;
    }

    try {
      const result = await patrolAPI.duties.cancel(dutyId);
      if (result.error) {
        alert(result.message || 'Failed to cancel duty');
      } else {
        alert('Patrol duty cancelled successfully');
        fetchDuties();
      }
    } catch (error) {
      console.error('Error cancelling duty:', error);
      alert('Failed to cancel duty');
    }
  };

  const handleDownloadUploads = async () => {
    if (!downloadFilters.start_date || !downloadFilters.end_date) {
      alert('Please select start and end dates');
      return;
    }

    try {
      const result = await patrolAPI.uploads.downloadUploads(downloadFilters);
      if (result.success) {
        setShowDownloadModal(false);
        alert('Download started! Check your downloads folder.');
      } else {
        alert(result.error || 'Failed to download uploads');
      }
    } catch (error) {
      console.error('Error downloading uploads:', error);
      alert('Failed to download uploads');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-blue-600 font-medium">Active Duties</div>
            <div className="text-lg font-bold text-blue-700">{statistics.active_duties}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-green-600 font-medium">Uploads Today</div>
            <div className="text-lg font-bold text-green-700">{statistics.total_uploads_today}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-emerald-600 font-medium">Submitted</div>
            <div className="text-lg font-bold text-emerald-700">{statistics.submitted_today}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-red-600 font-medium">Missed</div>
            <div className="text-lg font-bold text-red-700">{statistics.missed_today}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-purple-600 font-medium">Compliance</div>
            <div className="text-lg font-bold text-purple-700">{statistics.compliance_rate}%</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Patrol Duties</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDownloadModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Uploads
          </button>
          {!isReadOnly && (
            <button
              onClick={handleCreateDuty}
              className="inline-flex items-center px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Duty
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            placeholder="Start Date"
            className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />

          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            placeholder="End Date"
            className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />

          <button
            onClick={() => setFilters({ status: '', patrol_user: '', start_date: '', end_date: '' })}
            className="text-xs px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Duties List */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-2 text-xs text-gray-600">Loading duties...</p>
          </div>
        ) : duties.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-3xl mb-2">📋</div>
            <p className="text-xs text-gray-600">No patrol duties found</p>
            {!isReadOnly && (
              <button
                onClick={handleCreateDuty}
                className="mt-3 inline-flex items-center px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Create First Patrol Duty
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patrol User
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processes
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shift
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {duties.map((duty) => (
                  <tr key={duty.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">{duty.patrol_user_name}</div>
                      <div className="text-xs text-gray-500">{duty.patrol_user_email}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-900">
                        {duty.process_names.slice(0, 2).join(', ')}
                        {duty.process_names.length > 2 && (
                          <span className="text-gray-500"> +{duty.process_names.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      Every {duty.frequency_hours}h
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {duty.shift_start_time} - {duty.shift_end_time}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{duty.start_date}</div>
                      <div className="text-xs text-gray-500">to {duty.end_date}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {getStatusBadge(duty.status)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                      <button
                        onClick={() => handleViewDetails(duty)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        View
                      </button>
                      {!isReadOnly && duty.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleEditDuty(duty)}
                            className="text-emerald-600 hover:text-emerald-900 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCancelDuty(duty.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedDuty ? 'Edit Patrol Duty' : 'Create New Patrol Duty'}
            </h2>
            <PatrolDutyForm
              duty={selectedDuty}
              onSuccess={() => {
                setShowCreateModal(false);
                fetchDuties();
                fetchStatistics();
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedDuty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full my-8 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Patrol Duty Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Patrol User</label>
                  <div className="text-gray-900 font-medium">{selectedDuty.patrol_user_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div>{getStatusBadge(selectedDuty.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Frequency</label>
                  <div className="text-gray-900">Every {selectedDuty.frequency_hours} hour(s)</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Shift</label>
                  <div className="text-gray-900">{selectedDuty.shift_start_time} - {selectedDuty.shift_end_time}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Period</label>
                  <div className="text-gray-900">{selectedDuty.start_date} to {selectedDuty.end_date}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Processes</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedDuty.process_names.map(process => (
                    <span key={process} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                      {process}
                    </span>
                  ))}
                </div>
              </div>

              {selectedDuty.remarks && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Remarks</label>
                  <div className="text-gray-900 mt-1">{selectedDuty.remarks}</div>
                </div>
              )}

              {/* Upload Summary */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Upload Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-xl font-bold text-gray-900">{uploads.length}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-sm text-green-600">Submitted</div>
                    <div className="text-xl font-bold text-green-700">
                      {uploads.filter(u => ['submitted', 'reuploaded'].includes(u.status)).length}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="text-sm text-yellow-600">Pending</div>
                    <div className="text-xl font-bold text-yellow-700">
                      {uploads.filter(u => u.status === 'pending').length}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-sm text-red-600">Missed</div>
                    <div className="text-xl font-bold text-red-700">
                      {uploads.filter(u => u.status === 'missed').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Download Patrol Uploads</h2>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={downloadFilters.start_date}
                  onChange={(e) => setDownloadFilters({ ...downloadFilters, start_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={downloadFilters.end_date}
                  onChange={(e) => setDownloadFilters({ ...downloadFilters, end_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Process <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={downloadFilters.process}
                  onChange={(e) => setDownloadFilters({ ...downloadFilters, process: e.target.value })}
                  placeholder="Leave empty for all processes"
                  className="w-full text-xs px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-gray-400 placeholder:text-gray-400"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex space-x-2 pt-4 border-t border-gray-200 mt-4">
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="flex-1 px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadUploads}
                  className="flex-1 px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all"
                >
                  Download ZIP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


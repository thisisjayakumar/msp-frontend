"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import workCenterAPI from '@/components/API_Service/work-center-api';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import { 
  CheckCircleIcon, XCircleIcon, ArrowPathIcon, UserIcon, ClockIcon,
  ExclamationTriangleIcon, ChartBarIcon
} from '@heroicons/react/24/outline';

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [manualFormData, setManualFormData] = useState({
    active_supervisor_id: '',
    manual_update_reason: '',
  });
  const [refreshing, setRefreshing] = useState(false);

  // Auth check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      
      if (!token || !['admin', 'manager', 'production_head'].includes(userRole)) {
        router.push('/login');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      let data;
      const today = new Date().toISOString().split('T')[0];
      
      if (selectedDate === today) {
        // Use today dashboard endpoint
        data = await workCenterAPI.supervisorStatus.getTodayDashboard();
      } else {
        // Use general list with date filter
        data = await workCenterAPI.supervisorStatus.list({ date: selectedDate });
        
        // Transform to dashboard format
        if (!data.error && Array.isArray(data)) {
          const present = data.filter(s => s.is_present).length;
          const backup = data.filter(s => !s.is_present).length;
          
          data = {
            date: selectedDate,
            total_work_centers: data.length,
            default_supervisors_present: present,
            backup_supervisors_active: backup,
            statuses: data
          };
        }
      }

      if (!data.error) {
        setDashboard(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, [selectedDate]);

  // Fetch supervisors
  const fetchSupervisors = useCallback(async () => {
    try {
      const data = await workCenterAPI.workCenters.getSupervisors();
      if (!data.error) {
        setSupervisors(data);
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchDashboard();
      fetchSupervisors();
    }
  }, [loading, fetchDashboard, fetchSupervisors]);

  // Handle manual attendance check
  const handleRunAttendanceCheck = async () => {
    if (!confirm('Run attendance check for ' + selectedDate + '?')) {
      return;
    }

    try {
      setRefreshing(true);
      await workCenterAPI.supervisorStatus.runAttendanceCheck(selectedDate);
      alert('Attendance check completed successfully!');
      fetchDashboard();
    } catch (error) {
      alert('Failed to run attendance check: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle manual override
  const handleManualOverride = (status) => {
    setSelectedStatus(status);
    setManualFormData({
      active_supervisor_id: status.active_supervisor.id,
      manual_update_reason: '',
    });
    setShowManualModal(true);
  };

  // Submit manual override
  const handleSubmitManualOverride = async (e) => {
    e.preventDefault();

    try {
      await workCenterAPI.supervisorStatus.manualUpdate(
        selectedStatus.id,
        manualFormData
      );
      alert('Supervisor updated successfully!');
      setShowManualModal(false);
      fetchDashboard();
    } catch (error) {
      alert('Failed to update supervisor: ' + error.message);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/manager/dashboard')}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <span className="text-xl">←</span>
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Supervisor Dashboard</h1>
                <p className="text-sm text-slate-600">Monitor daily supervisor attendance and assignments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/manager/work-centers')}
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                ⚙️ Work Centers
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          <div className="flex gap-3 items-center">
            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {/* Run Attendance Check */}
            <button
              onClick={handleRunAttendanceCheck}
              disabled={refreshing}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Running...' : 'Run Check'}
            </button>
          </div>
          </div>
        </div>

        {/* Summary Cards */}
        {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Work Centers</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {dashboard.total_work_centers}
                </p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Default Present</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {dashboard.default_supervisors_present}
                </p>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Backup Active</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {dashboard.backup_supervisors_active}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Attendance Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {dashboard.total_work_centers > 0
                    ? Math.round((dashboard.default_supervisors_present / dashboard.total_work_centers) * 100)
                    : 0}%
                </p>
              </div>
              <UserIcon className="h-12 w-12 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Status Cards */}
      {dashboard && dashboard.statuses && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboard.statuses.map((status) => (
            <div
              key={status.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-t-4 ${
                status.status_color === 'green' ? 'border-green-500' : 'border-red-500'
              }`}
            >
              {/* Card Header */}
              <div className={`px-6 py-4 ${
                status.status_color === 'green' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">
                    {status.work_center_name}
                  </h3>
                  {status.is_present ? (
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-8 w-8 text-red-600" />
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4 space-y-3">
                {/* Default Supervisor */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Default Supervisor</p>
                  <p className="text-sm text-slate-800 font-medium">
                    {status.default_supervisor_name}
                  </p>
                </div>

                {/* Login Time */}
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Login: {status.login_time || 'Not logged in'}</p>
                    <p className="text-xs text-slate-500">Deadline: {status.check_in_deadline}</p>
                  </div>
                </div>

                {/* Active Supervisor */}
                <div className={`p-3 rounded-lg ${
                  status.is_present ? 'bg-green-50' : 'bg-amber-50'
                }`}>
                  <p className="text-xs text-slate-600 font-medium mb-1">Active Supervisor</p>
                  <p className={`text-sm font-bold ${
                    status.is_present ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {status.active_supervisor_name}
                  </p>
                </div>

                {/* Manual Update Notice */}
                {status.manually_updated && (
                  <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                    <ExclamationTriangleIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-800 font-medium">Manually Updated</p>
                      {status.manual_update_reason && (
                        <p className="text-xs text-blue-600 mt-1">
                          {status.manual_update_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={() => handleManualOverride(status)}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Manual Override →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {dashboard && dashboard.statuses && dashboard.statuses.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Data Available</h3>
          <p className="text-slate-600 mb-4">
            No supervisor status records found for {selectedDate}.
          </p>
          <button
            onClick={handleRunAttendanceCheck}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Run Attendance Check
          </button>
        </div>
      )}

      {/* Manual Override Modal */}
      {showManualModal && selectedStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h2 className="text-xl font-bold text-white">
                Manual Supervisor Override
              </h2>
              <p className="text-sm text-blue-100 mt-1">
                {selectedStatus.work_center_name}
              </p>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitManualOverride} className="p-6">
              <div className="space-y-4">
                {/* Current Info */}
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Current Active Supervisor:</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {selectedStatus.active_supervisor_name}
                  </p>
                </div>

                {/* Select New Supervisor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Active Supervisor *
                  </label>
                  <select
                    value={manualFormData.active_supervisor_id}
                    onChange={(e) => setManualFormData({
                      ...manualFormData,
                      active_supervisor_id: e.target.value
                    })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for Change *
                  </label>
                  <textarea
                    value={manualFormData.manual_update_reason}
                    onChange={(e) => setManualFormData({
                      ...manualFormData,
                      manual_update_reason: e.target.value
                    })}
                    required
                    rows="3"
                    placeholder="E.g., Default supervisor on emergency leave"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import workCenterAPI from '@/components/API_Service/work-center-api';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import { 
  PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon 
} from '@heroicons/react/24/outline';

export default function WorkCentersManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workCenters, setWorkCenters] = useState([]);
  const [availableProcesses, setAvailableProcesses] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingWorkCenter, setEditingWorkCenter] = useState(null);
  const [formData, setFormData] = useState({
    work_center_id: '',
    default_supervisor_id: '',
    backup_supervisor_id: '',
    check_in_deadline: '09:15',
    is_active: true,
  });
  const [error, setError] = useState(null);

  // Auth check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      
      if (!token || !['admin', 'manager'].includes(userRole)) {
        router.push('/login');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [wcData, processesData, supervisorsData] = await Promise.all([
        workCenterAPI.workCenterMaster.getAll(),
        workCenterAPI.workCenterMaster.getAvailable(),
        workCenterAPI.workCenterMaster.getSupervisors(),
      ]);

      if (!wcData.error) setWorkCenters(wcData);
      if (!processesData.error) setAvailableProcesses(processesData);
      if (!supervisorsData.error) setSupervisors(supervisorsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [loading, fetchData]);

  // Handle create new
  const handleCreate = () => {
    setEditingWorkCenter(null);
    setFormData({
      work_center_id: '',
      default_supervisor_id: '',
      backup_supervisor_id: '',
      check_in_deadline: '09:15',
      is_active: true,
    });
    setShowModal(true);
  };

  // Handle edit
  const handleEdit = (wc) => {
    setEditingWorkCenter(wc);
    setFormData({
      work_center_id: wc.work_center.id,
      default_supervisor_id: wc.default_supervisor.id,
      backup_supervisor_id: wc.backup_supervisor.id,
      check_in_deadline: wc.check_in_deadline.substring(0, 5), // HH:MM format
      is_active: wc.is_active,
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this work center master?')) {
      return;
    }

    try {
      await workCenterAPI.workCenterMaster.delete(id);
      alert('Work center deleted successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to delete work center: ' + error.message);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.default_supervisor_id === formData.backup_supervisor_id) {
      alert('Default and backup supervisors must be different!');
      return;
    }

    try {
      const submitData = {
        ...formData,
        check_in_deadline: formData.check_in_deadline + ':00', // Add seconds
      };

      if (editingWorkCenter) {
        await workCenterAPI.workCenterMaster.update(editingWorkCenter.id, submitData);
        alert('Work center updated successfully!');
      } else {
        await workCenterAPI.workCenterMaster.create(submitData);
        alert('Work center created successfully!');
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      alert('Failed to save work center: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Work Center Management</h1>
            <p className="text-slate-600 mt-1">Manage work centers and supervisor assignments</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <PlusIcon className="h-5 w-5" />
            Add Work Center
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Work Centers Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Work Center</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Default Supervisor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Backup Supervisor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Check-in Deadline</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {workCenters.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No work centers configured. Click &quot;Add Work Center&quot; to create one.
                  </td>
                </tr>
              ) : (
                workCenters.map((wc) => (
                  <tr key={wc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{wc.work_center.name}</div>
                      <div className="text-sm text-slate-500">Code: {wc.work_center.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">{wc.default_supervisor.full_name}</div>
                      <div className="text-sm text-slate-500">{wc.default_supervisor.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">{wc.backup_supervisor.full_name}</div>
                      <div className="text-sm text-slate-500">{wc.backup_supervisor.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {wc.check_in_deadline}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {wc.is_active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          <CheckCircleIcon className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          <XCircleIcon className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(wc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(wc.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h2 className="text-xl font-bold text-white">
                {editingWorkCenter ? 'Edit Work Center' : 'Add New Work Center'}
              </h2>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Work Center */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Work Center (Process) *
                  </label>
                  <select
                    value={formData.work_center_id}
                    onChange={(e) => setFormData({ ...formData, work_center_id: e.target.value })}
                    required
                    disabled={editingWorkCenter}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                  >
                    <option value="">Select Work Center</option>
                    {editingWorkCenter && (
                      <option value={editingWorkCenter.work_center.id}>
                        {editingWorkCenter.work_center.name}
                      </option>
                    )}
                    {availableProcesses.map((process) => (
                      <option key={process.id} value={process.id}>
                        {process.name} (Code: {process.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default Supervisor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Default Supervisor *
                  </label>
                  <select
                    value={formData.default_supervisor_id}
                    onChange={(e) => setFormData({ ...formData, default_supervisor_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Default Supervisor</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.full_name} ({supervisor.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Backup Supervisor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Backup Supervisor *
                  </label>
                  <select
                    value={formData.backup_supervisor_id}
                    onChange={(e) => setFormData({ ...formData, backup_supervisor_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Backup Supervisor</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.full_name} ({supervisor.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Check-in Deadline */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Check-in Deadline *
                  </label>
                  <input
                    type="time"
                    value={formData.check_in_deadline}
                    onChange={(e) => setFormData({ ...formData, check_in_deadline: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-slate-500">
                    Time by which the default supervisor should log in
                  </p>
                </div>

                {/* Is Active */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                    Active Work Center
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  {editingWorkCenter ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


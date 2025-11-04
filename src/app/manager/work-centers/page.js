"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import workCenterAPI from '@/components/API_Service/work-center-api';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import { toast } from '@/utils/notifications';

export default function WorkCentersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workCenters, setWorkCenters] = useState([]);
  const [availableWorkCenters, setAvailableWorkCenters] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    work_center_id: '',
    default_supervisor_id: '',
    backup_supervisor_id: '',
    check_in_deadline: '09:15:00',
    is_active: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      
      if (!token || (userRole !== 'manager' && userRole !== 'production_head')) {
        router.push('/manager');
        return;
      }
      
      fetchData();
    };

    checkAuth();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wcData, availableData, supervisorsData] = await Promise.all([
        workCenterAPI.workCenters.list(),
        workCenterAPI.workCenters.getAvailable(),
        workCenterAPI.workCenters.getSupervisors()
      ]);
      
      // Check for permission errors
      if (wcData?.error || availableData?.error || supervisorsData?.error) {
        const errorMsg = wcData?.message || availableData?.message || supervisorsData?.message;
        if (errorMsg?.includes('permission')) {
          setErrors({ permission: 'You do not have permission to access work center management. Please contact an administrator.' });
        } else {
          toast.error(errorMsg || 'Failed to load work centers');
        }
        // Set empty arrays on error to prevent map errors
        setWorkCenters([]);
        setAvailableWorkCenters([]);
        setSupervisors([]);
        return;
      }
      
      // Ensure we always set arrays, not error objects
      const workCentersList = Array.isArray(wcData) ? wcData : [];
      const availableList = Array.isArray(availableData) ? availableData : [];
      const supervisorsList = Array.isArray(supervisorsData) ? supervisorsData : [];
      
      console.log('Work Centers loaded:', workCentersList.length, workCentersList);
      
      setWorkCenters(workCentersList);
      setAvailableWorkCenters(availableList);
      setSupervisors(supervisorsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load work centers');
      // Set empty arrays on error
      setWorkCenters([]);
      setAvailableWorkCenters([]);
      setSupervisors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.work_center_id) newErrors.work_center_id = 'Work Center is required';
    if (!formData.default_supervisor_id) newErrors.default_supervisor_id = 'Default Supervisor is required';
    if (!formData.backup_supervisor_id) newErrors.backup_supervisor_id = 'Backup Supervisor is required';
    if (!formData.check_in_deadline) newErrors.check_in_deadline = 'Check-in Deadline is required';
    
    if (formData.default_supervisor_id === formData.backup_supervisor_id) {
      newErrors.backup_supervisor_id = 'Backup must be different from default supervisor';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData = {
        work_center_id: parseInt(formData.work_center_id),
        default_supervisor_id: parseInt(formData.default_supervisor_id),
        backup_supervisor_id: parseInt(formData.backup_supervisor_id),
        check_in_deadline: formData.check_in_deadline,
        is_active: formData.is_active
      };

      let response;
      if (editingId) {
        response = await workCenterAPI.workCenters.update(editingId, submitData);
      } else {
        response = await workCenterAPI.workCenters.create(submitData);
      }

      // Check if response is an error
      if (response?.error) {
        toast.error(response.message || 'Failed to save work center');
        console.error('API Error:', response);
        return;
      }

      toast.success(editingId ? 'Work Center updated successfully' : 'Work Center created successfully');
      console.log('Work Center saved, refreshing data...');
      setShowModal(false);
      resetForm();
      await fetchData(); // Await to ensure data is refreshed
      console.log('Data refresh complete');
    } catch (error) {
      console.error('Error saving work center:', error);
      toast.error(error.message || 'Failed to save work center');
    }
  };

  const handleEdit = (workCenter) => {
    setEditingId(workCenter.id);
    setFormData({
      work_center_id: workCenter.work_center.id,
      default_supervisor_id: workCenter.default_supervisor.id,
      backup_supervisor_id: workCenter.backup_supervisor.id,
      check_in_deadline: workCenter.check_in_deadline,
      is_active: workCenter.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this work center assignment?')) return;

    try {
      await workCenterAPI.workCenters.delete(id);
      toast.success('Work Center deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting work center:', error);
      toast.error('Failed to delete work center');
    }
  };

  const resetForm = () => {
    setFormData({
      work_center_id: '',
      default_supervisor_id: '',
      backup_supervisor_id: '',
      check_in_deadline: '09:15:00',
      is_active: true
    });
    setEditingId(null);
    setErrors({});
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
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
                <h1 className="text-xl font-bold text-slate-800">Work Center Management</h1>
                <p className="text-sm text-slate-600">Manage work centers and supervisor assignments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/admin/supervisor-dashboard')}
                className="px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <span>👥</span>
                <span className="hidden sm:inline">Supervisor Dashboard</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Work Center</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Permission Error */}
        {errors.permission && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-900 mb-2">Management Access Required</h3>
                <p className="text-amber-800 mb-3">{errors.permission}</p>
                
                <div className="bg-white border border-amber-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-slate-800 mb-2">📋 Required Access Level:</h4>
                  <p className="text-sm text-slate-700 mb-3">
                    Work Center Management requires one of the following roles:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 mb-3">
                    <li><strong>Admin</strong></li>
                    <li><strong>Manager</strong></li>
                    <li><strong>Production Head</strong></li>
                  </ul>
                  <p className="text-xs text-slate-600">
                    If you believe you should have access, please contact your system administrator.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push('/manager/dashboard')}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    ← Back to Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Switch to Admin Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!errors.permission && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl shadow-slate-200/50">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Work Center
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Default Supervisor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Backup Supervisor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Check-in Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {!Array.isArray(workCenters) || workCenters.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      No work centers configured yet. Click &quot;Add Work Center&quot; to get started.
                    </td>
                  </tr>
                ) : (
                  workCenters.map((wc) => (
                    <tr key={wc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{wc.work_center.name}</div>
                        <div className="text-xs text-slate-500">{wc.work_center.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{wc.default_supervisor.full_name}</div>
                        <div className="text-xs text-slate-500">{wc.default_supervisor.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{wc.backup_supervisor.full_name}</div>
                        <div className="text-xs text-slate-500">{wc.backup_supervisor.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{wc.check_in_deadline}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          wc.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {wc.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(wc)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(wc.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingId ? 'Edit Work Center' : 'Add Work Center'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Work Center */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Work Center <span className="text-red-500">*</span>
                </label>
                <select
                  name="work_center_id"
                  value={formData.work_center_id}
                  onChange={handleInputChange}
                  disabled={editingId !== null}
                  className={`w-full text-slate-800 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.work_center_id ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  } ${editingId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Work Center</option>
                  {editingId && workCenters.find(wc => wc.id === editingId) && (
                    <option value={workCenters.find(wc => wc.id === editingId).work_center.id}>
                      {workCenters.find(wc => wc.id === editingId).work_center.name}
                    </option>
                  )}
                  {!editingId && availableWorkCenters.map((wc) => (
                    <option key={wc.id} value={wc.id}>
                      {wc.name} ({wc.code})
                    </option>
                  ))}
                </select>
                {errors.work_center_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.work_center_id}</p>
                )}
              </div>

              {/* Default Supervisor */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Default Supervisor <span className="text-red-500">*</span>
                </label>
                <select
                  name="default_supervisor_id"
                  value={formData.default_supervisor_id}
                  onChange={handleInputChange}
                  className={`w-full text-slate-800 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.default_supervisor_id ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select Default Supervisor</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.full_name} ({sup.email})
                    </option>
                  ))}
                </select>
                {errors.default_supervisor_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.default_supervisor_id}</p>
                )}
              </div>

              {/* Backup Supervisor */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Backup Supervisor <span className="text-red-500">*</span>
                </label>
                <select
                  name="backup_supervisor_id"
                  value={formData.backup_supervisor_id}
                  onChange={handleInputChange}
                  className={`w-full text-slate-800 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.backup_supervisor_id ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select Backup Supervisor</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.full_name} ({sup.email})
                    </option>
                  ))}
                </select>
                {errors.backup_supervisor_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.backup_supervisor_id}</p>
                )}
              </div>

              {/* Check-in Deadline */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Check-in Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="check_in_deadline"
                  value={formData.check_in_deadline}
                  onChange={handleInputChange}
                  className={`w-full px-3 text-slate-800 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.check_in_deadline ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {errors.check_in_deadline && (
                  <p className="text-red-500 text-xs mt-1">{errors.check_in_deadline}</p>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label className="ml-2 block text-sm text-slate-700">
                  Active
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


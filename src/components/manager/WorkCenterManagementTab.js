"use client";

import { useState, useEffect, useCallback } from 'react';
import workCenterAPI from '@/components/API_Service/work-center-api';
import { toast } from '@/utils/notifications';

export default function WorkCenterManagementTab({ isReadOnly = false }) {
  const [loading, setLoading] = useState(false);
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [wcData, availableData, supervisorsData] = await Promise.all([
        workCenterAPI.workCenters.list(),
        workCenterAPI.workCenters.getAvailable(),
        workCenterAPI.workCenters.getSupervisors()
      ]);
      
      // Handle response structures
      const workCentersList = Array.isArray(wcData) ? wcData : (wcData?.results || wcData?.data || []);
      const availableList = Array.isArray(availableData) ? availableData : (availableData?.results || availableData?.data || []);
      const supervisorsList = Array.isArray(supervisorsData) ? supervisorsData : (supervisorsData?.results || supervisorsData?.data || []);
      
      // Check for errors
      if (wcData?.error || availableData?.error || supervisorsData?.error) {
        const errorMsg = wcData?.message || availableData?.message || supervisorsData?.message;
        if (errorMsg?.includes('permission')) {
          setErrors({ permission: 'You do not have permission to access work center management.' });
        } else {
          toast.error(errorMsg || 'Failed to load work centers');
        }
        setWorkCenters([]);
        setAvailableWorkCenters([]);
        setSupervisors([]);
        return;
      }
      
      setWorkCenters(workCentersList);
      setAvailableWorkCenters(availableList);
      setSupervisors(supervisorsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load work centers');
      setWorkCenters([]);
      setAvailableWorkCenters([]);
      setSupervisors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
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

      if (response?.error) {
        toast.error(response.message || 'Failed to save work center');
        return;
      }

      toast.success(editingId ? 'Work Center updated successfully' : 'Work Center created successfully');
      setShowModal(false);
      resetForm();
      await fetchData();
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

  return (
    <div className="space-y-4">
      {/* Permission Error */}
      {errors.permission && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">{errors.permission}</p>
        </div>
      )}

      {/* Actions */}
      {!errors.permission && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Work Centers</h3>
            {!isReadOnly && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Work Center
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="mt-2 text-xs text-gray-600">Loading work centers...</p>
              </div>
            ) : !Array.isArray(workCenters) || workCenters.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-3xl mb-2">⚙️</div>
                <p className="text-xs text-gray-600">No work centers configured yet</p>
                {!isReadOnly && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-3 inline-flex items-center px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    Add First Work Center
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Work Center
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Default Supervisor
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Backup Supervisor
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in Deadline
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {!isReadOnly && (
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workCenters.map((wc) => (
                      <tr key={wc.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">{wc.work_center?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{wc.work_center?.code || ''}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{wc.default_supervisor?.full_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{wc.default_supervisor?.email || ''}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{wc.backup_supervisor?.full_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{wc.backup_supervisor?.email || ''}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {wc.check_in_deadline}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                            wc.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {wc.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {!isReadOnly && (
                          <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                            <button
                              onClick={() => handleEdit(wc)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
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
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && !isReadOnly && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  {editingId ? 'Edit Work Center' : 'Add Work Center'}
                </h2>
                <button
                  onClick={handleCloseModal}
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
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Work Center <span className="text-red-500">*</span>
                </label>
                <select
                  name="work_center_id"
                  value={formData.work_center_id}
                  onChange={handleInputChange}
                  disabled={editingId !== null}
                  className={`w-full text-xs px-3 py-2 text-gray-900 bg-white border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.work_center_id ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  } ${editingId ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
                >
                  <option value="" className="text-gray-500">Select Work Center</option>
                  {editingId && workCenters.find(wc => wc.id === editingId) && (
                    <option value={workCenters.find(wc => wc.id === editingId).work_center.id} className="text-gray-900">
                      {workCenters.find(wc => wc.id === editingId).work_center.name}
                    </option>
                  )}
                  {!editingId && availableWorkCenters.map((wc) => (
                    <option key={wc.id} value={wc.id} className="text-gray-900">
                      {wc.name} ({wc.code})
                    </option>
                  ))}
                </select>
                {errors.work_center_id && (
                  <p className="text-red-600 text-xs mt-1 font-medium">{errors.work_center_id}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Default Supervisor <span className="text-red-500">*</span>
                </label>
                <select
                  name="default_supervisor_id"
                  value={formData.default_supervisor_id}
                  onChange={handleInputChange}
                  className={`w-full text-xs px-3 py-2 text-gray-900 bg-white border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.default_supervisor_id ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <option value="" className="text-gray-500">Select Default Supervisor</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id} className="text-gray-900">
                      {sup.full_name} ({sup.email})
                    </option>
                  ))}
                </select>
                {errors.default_supervisor_id && (
                  <p className="text-red-600 text-xs mt-1 font-medium">{errors.default_supervisor_id}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Backup Supervisor <span className="text-red-500">*</span>
                </label>
                <select
                  name="backup_supervisor_id"
                  value={formData.backup_supervisor_id}
                  onChange={handleInputChange}
                  className={`w-full text-xs px-3 py-2 text-gray-900 bg-white border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.backup_supervisor_id ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <option value="" className="text-gray-500">Select Backup Supervisor</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id} className="text-gray-900">
                      {sup.full_name} ({sup.email})
                    </option>
                  ))}
                </select>
                {errors.backup_supervisor_id && (
                  <p className="text-red-600 text-xs mt-1 font-medium">{errors.backup_supervisor_id}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Check-in Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="check_in_deadline"
                  value={formData.check_in_deadline}
                  onChange={handleInputChange}
                  className={`w-full text-xs px-3 py-2 text-gray-900 bg-white border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.check_in_deadline ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {errors.check_in_deadline && (
                  <p className="text-red-600 text-xs mt-1 font-medium">{errors.check_in_deadline}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label className="text-xs font-medium text-gray-700 cursor-pointer">
                  Active Status
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all"
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


'use client';

import { useState, useEffect } from 'react';
import adminService from '@/components/API_Service/adminService';

export default function UserFormModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password_confirm: '',
    employee_id: '',
    designation: '',
    department: '',
    shift: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    profile_phone_number: '',
    is_active: true,
    role_ids: []
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRoles();
    if (user) {
      // Populate form with existing user data
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || user.full_name?.split(' ')[0] || '',
        last_name: user.last_name || user.full_name?.split(' ').slice(1).join(' ') || '',
        phone_number: user.phone_number || '',
        password: '',
        password_confirm: '',
        employee_id: user.employee_id || '',
        designation: user.designation || '',
        department: user.department || '',
        shift: user.shift || '',
        date_of_joining: user.date_of_joining || new Date().toISOString().split('T')[0],
        profile_phone_number: user.profile_phone_number || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
        role_ids: user.roles?.map(r => r.id) || []
      });
    }
  }, [user]);

  const fetchRoles = async () => {
    const result = await adminService.fetchRoles();
    if (result.success) {
      setRoles(result.data);
    } else {
      console.error('Error fetching roles:', result.error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: null}));
    }
  };

  const handleRoleToggle = (roleId) => {
    setFormData(prev => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter(id => id !== roleId)
        : [...prev.role_ids, roleId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Prepare data for sending
    const dataToSend = { ...formData };
    
    // Remove empty password fields for update
    if (user && !dataToSend.password) {
      delete dataToSend.password;
      delete dataToSend.password_confirm;
    }

    // Convert empty shift to null (backend accepts null for shift)
    if (dataToSend.shift === '') {
      dataToSend.shift = null;
    }
    
    // Keep empty strings for phone numbers (backend expects empty strings, not null)
    // profile_phone_number and phone_number can remain as empty strings

    const result = user
      ? await adminService.updateUser(user.id, dataToSend)
      : await adminService.createUser(dataToSend);

    if (result.success) {
      onSuccess();
    } else {
      if (result.details) {
        setErrors(result.details);
      } else {
        alert(result.error);
      }
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="col-span-2 font-medium text-gray-900 border-b pb-2 mb-2">
              Basic Information
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={!!user}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Employee Info */}
            <div className="col-span-2 font-medium text-gray-900 border-b pb-2 mb-2 mt-4">
              Employee Information
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.employee_id && <p className="text-xs text-red-600 mt-1">{errors.employee_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Designation *
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                <option value="rm_store">RM Store</option>
                <option value="coiling">Coiling</option>
                <option value="tempering">Tempering</option>
                <option value="plating">Plating</option>
                <option value="packing">Packing</option>
                <option value="fg_store">FG Store</option>
                <option value="quality">Quality Control</option>
                <option value="maintenance">Maintenance</option>
                <option value="admin">Administration</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Shift
              </label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Shift</option>
                <option value="I">Shift I (9AM-5PM)</option>
                <option value="II">Shift II (5PM-2AM)</option>
                <option value="III">Shift III (2AM-9AM)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Date of Joining *
              </label>
              <input
                type="date"
                name="date_of_joining"
                value={formData.date_of_joining}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="profile_phone_number"
                value={formData.profile_phone_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div className="col-span-2 font-medium text-gray-900 border-b pb-2 mb-2 mt-4">
              {user ? 'Change Password (leave blank to keep current)' : 'Password *'}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Password {!user && '*'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!user}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Confirm Password {!user && '*'}
              </label>
              <input
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                required={!user}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Roles */}
            <div className="col-span-2 font-medium text-gray-900 border-b pb-2 mb-2 mt-4">
              Assign Roles
            </div>

            <div className="col-span-2">
              <div className="grid grid-cols-3 gap-2">
                {roles.map(role => (
                  <label key={role.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.role_ids.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="col-span-2 mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-900">Active User</span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
          </button>
        </div>
      </div>
    </div>
  );
}


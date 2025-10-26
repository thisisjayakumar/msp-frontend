'use client';

import { useState, useEffect, useRef } from 'react';
import adminService from '@/components/API_Service/adminService';

export default function AdminRolesTable() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hierarchy_level: 5,
    permissions: {},
    restricted_departments: []
  });
  
  // Prevent duplicate API calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Skip if already fetched (React Strict Mode prevention)
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const result = await adminService.fetchRoleHierarchy();
    if (result.success) {
      setRoles(result.data);
    } else {
      console.error('Error fetching roles:', result.error);
      alert(result.error);
    }
    setLoading(false);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      hierarchy_level: role.hierarchy_level,
      permissions: role.permissions || {},
      restricted_departments: role.restricted_departments || []
    });
    setShowForm(true);
  };

  const handleDelete = async (roleId) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    const result = await adminService.deleteRole(roleId);
    if (result.success) {
      fetchRoles();
      alert(result.message);
    } else {
      alert(result.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = editingRole
      ? await adminService.updateRole(editingRole.id, formData)
      : await adminService.createRole(formData);

    if (result.success) {
      fetchRoles();
      setShowForm(false);
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        hierarchy_level: 5,
        permissions: {},
        restricted_departments: []
      });
      alert(result.message);
    } else {
      alert(result.error);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading roles...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Roles</h2>
          <p className="text-sm text-gray-800">Manage system roles and permissions</p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setFormData({
              name: '',
              description: '',
              hierarchy_level: 5,
              permissions: {},
              restricted_departments: []
            });
            setShowForm(true);
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          + New Role
        </button>
      </div>

      {/* Roles Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Role Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Description</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Hierarchy</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Active Users</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{role.name_display}</td>
                <td className="px-4 py-3 text-gray-900">{role.description}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    Level {role.hierarchy_level}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    {role.active_users} users
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(role)}
                    className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name *
                </label>
                <select
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  disabled={!!editingRole}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="production_head">Production Head</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="rm_store">RM Store</option>
                  <option value="fg_store">FG Store</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hierarchy Level (1=highest, 10=lowest)
                </label>
                <input
                  type="number"
                  value={formData.hierarchy_level}
                  onChange={(e) => setFormData({...formData, hierarchy_level: parseInt(e.target.value)})}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRole(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


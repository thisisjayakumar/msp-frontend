'use client';

import { useState, useEffect } from 'react';
import adminService from '@/components/API_Service/adminService';
import UserFormModal from './UserFormModal';

export default function AdminUsersTable() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, departmentFilter, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    const result = await adminService.fetchUsers();
    if (result.success) {
      setUsers(result.data);
    } else {
      console.error('Error fetching users:', result.error);
      alert(result.error);
    }
    setLoading(false);
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(user => user.department === departmentFilter);
    }

    if (roleFilter) {
      filtered = filtered.filter(user =>
        user.roles?.some(role => role.name === roleFilter)
      );
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => !user.is_active);
    }

    setFilteredUsers(filtered);
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    const result = await adminService.bulkUserAction(selectedUsers, action);
    if (result.success) {
      fetchUsers();
      setSelectedUsers([]);
      alert(result.message);
    } else {
      alert(result.error);
    }
  };

  const handleToggleActive = async (userId) => {
    const result = await adminService.toggleUserActive(userId);
    if (result.success) {
      fetchUsers();
    } else {
      alert(result.error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const result = await adminService.deleteUser(userId);
    if (result.success) {
      fetchUsers();
      alert(result.data?.message || 'User deleted successfully');
    } else {
      // Enhanced error handling for protected foreign key errors
      const errorData = result.details;
      
      if (errorData?.action === 'deactivate' && errorData?.suggestion) {
        // User has related records - offer to deactivate instead
        const userConfirm = confirm(
          `${errorData.error}\n\n` +
          `${errorData.detail}\n\n` +
          `${errorData.suggestion}\n\n` +
          `Would you like to deactivate this user instead?`
        );
        
        if (userConfirm) {
          // Deactivate the user instead
          const deactivateResult = await adminService.toggleUserActive(userId);
          if (deactivateResult.success) {
            fetchUsers();
            alert('User has been deactivated successfully');
          } else {
            alert('Failed to deactivate user: ' + deactivateResult.error);
          }
        }
      } else {
        // Generic error
        alert(result.error || 'Failed to delete user');
      }
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading users...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 text-sm text-gray-900 placeholder-gray-600 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Filters */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            <option value="coiling">Coiling</option>
            <option value="tempering">Tempering</option>
            <option value="plating">Plating</option>
            <option value="rm_store">RM Store</option>
            <option value="fg_store">FG Store</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Actions */}
          <div className="flex-1"></div>
          <button
            onClick={handleCreateUser}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            + New User
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
            <span className="text-sm text-gray-700">{selectedUsers.length} selected</span>
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
            >
              Deactivate
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(filteredUsers.map(u => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">User</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Employee ID</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Department</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Role(s)</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                    className="rounded"
                  />
                </td>
                <td className="px-3 py-2">
                  <div>
                    <div className="font-medium text-gray-900">{user.full_name}</div>
                    <div className="text-xs text-gray-800">{user.email}</div>
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-700">{user.employee_id}</td>
                <td className="px-3 py-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {user.department_display}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {user.roles?.map((role, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {role.name_display}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      className="px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded"
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="py-8 text-center text-gray-800">No users found</div>
        )}
      </div>

      {/* User Form Modal */}
      {showUserModal && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            fetchUsers();
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}


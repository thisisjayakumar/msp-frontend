'use client';

import { useState, useEffect } from 'react';
import adminService from '@/components/API_Service/adminService';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchDepartmentSummary();
  }, []);

  const fetchStats = async () => {
    const result = await adminService.fetchDashboardStats();
    if (result.success) {
      setStats(result.data);
    } else {
      console.error('Error fetching stats:', result.error);
      alert(result.error);
    }
    setLoading(false);
  };

  const fetchDepartmentSummary = async () => {
    const result = await adminService.fetchDepartmentSummary();
    if (result.success) {
      setDepartmentSummary(result.data);
    } else {
      console.error('Error fetching department summary:', result.error);
    }
  };

  if (loading || !stats) {
    return <div className="p-6 text-center">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-sm text-gray-900 font-medium">Total Users</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.total_users}</div>
          <div className="text-xs text-gray-800 mt-1">
            {stats.active_users} active, {stats.inactive_users} inactive
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm text-gray-900 font-medium">Available Users</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.available_users}</div>
          <div className="text-xs text-gray-800 mt-1">Not currently engaged</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="text-sm text-gray-900 font-medium">Engaged Users</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.engaged_users}</div>
          <div className="text-xs text-gray-800 mt-1">Currently in process</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="text-sm text-gray-900 font-medium">Active Sessions</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.active_sessions}</div>
          <div className="text-xs text-gray-800 mt-1">Currently logged in</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Users by Role</h3>
          <div className="space-y-3">
            {Object.entries(stats.users_by_role || {}).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">{role}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users by Department */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Users by Department</h3>
          <div className="space-y-3">
            {Object.entries(stats.users_by_department || {}).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">{dept}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Summary Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Department Summary</h3>
          <p className="text-sm text-gray-800">Detailed breakdown by department</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Department</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Total Users</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Engaged</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Available</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Role Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departmentSummary.map((dept) => (
                <tr key={dept.department_code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{dept.department}</td>
                  <td className="px-4 py-3 text-gray-900">{dept.total_users}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                      {dept.engaged_users}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                      {dept.available_users}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(dept.role_breakdown || {}).map(([role, count]) => (
                        <span key={role} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {role}: {count}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


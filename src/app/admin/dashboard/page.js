'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminUsersTable from '@/components/admin/AdminUsersTable';
import AdminRolesTable from '@/components/admin/AdminRolesTable';
import AdminStats from '@/components/admin/AdminStats';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for authentication token first
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!authToken) {
      router.push('/login');
      return;
    }
    
    // Get user data (stored as 'userData' by role-auth service)
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if user is admin or manager
      const roleName = parsedUser.primary_role?.name || userRole;
      const hasAdminAccess = roleName === 'admin' || roleName === 'manager';
      
      if (!hasAdminAccess) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    router.replace('/login');
  };

  if (!user) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">User and Role Management</p>
          </div>
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Roles
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'users' && <AdminUsersTable />}
        {activeTab === 'roles' && <AdminRolesTable />}
        {activeTab === 'stats' && <AdminStats />}
      </div>
    </div>
  );
}

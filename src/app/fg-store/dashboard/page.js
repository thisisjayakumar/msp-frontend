'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { roleAuthService } from '@/components/API_Service/role-auth';

const FGStoreDashboard = () => {
  const router = useRouter();
  const { user, role, isLoading } = useAuth('fg_store');
  const [activeTab, setActiveTab] = useState('stock-levels');

  // Handle logout
  const handleLogout = () => {
    roleAuthService.logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || role !== 'fg_store') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access the FG Store dashboard.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'stock-levels', label: 'FG Stock Levels', icon: '📦' },
    { id: 'mo-list', label: 'MO List (Pending Dispatch)', icon: '📋' },
    { id: 'transactions', label: 'Transactions Log', icon: '📊' },
    { id: 'alerts', label: 'Stock Alerts', icon: '⚠️' }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'stock-levels':
        return <div className="p-6 text-slate-800 bg-white rounded-lg shadow">FG Stock Levels - Coming Soon</div>;
      case 'mo-list':
        return <div className="p-6 text-slate-800 bg-white rounded-lg shadow">MO List - Coming Soon</div>;
      case 'transactions':
        return <div className="p-6 text-slate-800 bg-white rounded-lg shadow">Transactions Log - Coming Soon</div>;
      case 'alerts':
        return <div className="p-6 text-slate-800 bg-white rounded-lg shadow">Stock Alerts - Coming Soon</div>;
      default:
        return <div className="p-6 text-slate-800 bg-white rounded-lg shadow">FG Stock Levels - Coming Soon</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FG Store & Dispatch</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage finished goods inventory and dispatch operations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome, <span className="font-medium">{user.first_name} {user.last_name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-800 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-2 sm:py-4 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default FGStoreDashboard;
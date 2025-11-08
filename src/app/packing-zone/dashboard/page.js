'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { roleAuthService } from '@/components/API_Service/role-auth';
import packingZoneAPI from '@/components/API_Service/packing-zone-api';

// Import components (to be created)
import VerificationTab from '@/components/packing-zone/VerificationTab';
import PackingTab from '@/components/packing-zone/PackingTab';
import LooseStockTab from '@/components/packing-zone/LooseStockTab';
import FGStockTab from '@/components/packing-zone/FGStockTab';
import TransactionsTab from '@/components/packing-zone/TransactionsTab';
import MergeRequestsTab from '@/components/packing-zone/MergeRequestsTab';
import AdjustmentsTab from '@/components/packing-zone/AdjustmentsTab';
import LabelsTab from '@/components/packing-zone/LabelsTab';

const PackingZoneDashboard = () => {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('verification');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Check if user has access
  const hasAccess = useMemo(() => {
    return ['packing_zone', 'production_head', 'manager', 'admin'].includes(role);
  }, [role]);

  // Check if user is read-only (Manager)
  const isReadOnly = useMemo(() => {
    return role === 'manager';
  }, [role]);

  // Check if user is Production Head
  const isProductionHead = useMemo(() => {
    return ['production_head', 'admin'].includes(role);
  }, [role]);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const stats = await packingZoneAPI.dashboard.getStatistics();
      if (!stats.error) {
        setDashboardStats(stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchDashboardStats();
    }
  }, [hasAccess, fetchDashboardStats]);

  // Handle logout
  const handleLogout = useCallback(() => {
    roleAuthService.logout();
    router.replace('/login');
  }, [router]);

  // Handle tab change
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access the Packing Zone dashboard.</p>
        </div>
      </div>
    );
  }

  // Tabs configuration
  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'verification', label: 'Verification', icon: '✓', count: dashboardStats?.to_be_verified },
      { id: 'packing', label: 'Packing', icon: '📦', count: dashboardStats?.verified },
      { id: 'loose-stock', label: 'Loose Stock', icon: '📊' },
      { id: 'fg-stock', label: 'FG Stock', icon: '🏭' },
      { id: 'transactions', label: 'Transactions', icon: '📋' },
    ];

    // Add approval tabs for Production Head
    if (isProductionHead) {
      allTabs.push(
        { id: 'merge-requests', label: 'Merge Requests', icon: '🔄', count: dashboardStats?.pending_merge_requests },
        { id: 'adjustments', label: 'Adjustments', icon: '⚖️', count: dashboardStats?.pending_adjustments }
      );
    }

    allTabs.push({ id: 'labels', label: 'Labels', icon: '🏷️' });

    return allTabs;
  }, [isProductionHead, dashboardStats]);

  // Render active tab content
  const renderActiveTab = useCallback(() => {
    const commonProps = {
      isReadOnly,
      isProductionHead,
      onRefresh: fetchDashboardStats,
    };

    switch (activeTab) {
      case 'verification':
        return <VerificationTab {...commonProps} />;
      case 'packing':
        return <PackingTab {...commonProps} />;
      case 'loose-stock':
        return <LooseStockTab {...commonProps} />;
      case 'fg-stock':
        return <FGStockTab {...commonProps} />;
      case 'transactions':
        return <TransactionsTab {...commonProps} />;
      case 'merge-requests':
        return <MergeRequestsTab {...commonProps} />;
      case 'adjustments':
        return <AdjustmentsTab {...commonProps} />;
      case 'labels':
        return <LabelsTab {...commonProps} />;
      default:
        return <VerificationTab {...commonProps} />;
    }
  }, [activeTab, isReadOnly, isProductionHead, fetchDashboardStats]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Packing Zone {isReadOnly && '(View Only)'}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage batch verification, packing operations, and label generation
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* User info dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                    {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                  </div>
                  <span className="hidden md:block">{user.first_name} {user.last_name}</span>
                </button>
                
                {/* Dropdown menu */}
                <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-semibold">{user.first_name} {user.last_name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    <div className="text-xs text-indigo-600 mt-1">{role === 'packing_zone' ? 'Packing Zone' : role === 'production_head' ? 'Production Head' : role === 'manager' ? 'Manager' : 'Admin'}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      {!statsLoading && dashboardStats && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">To Be Verified</div>
                <div className="text-2xl font-bold text-blue-900">{dashboardStats.to_be_verified || 0}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Ready to Pack</div>
                <div className="text-2xl font-bold text-green-900">{dashboardStats.verified || 0}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600 font-medium">On Hold</div>
                <div className="text-2xl font-bold text-orange-900">{dashboardStats.on_hold || 0}</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-sm text-indigo-600 font-medium">Packed Today</div>
                <div className="text-2xl font-bold text-indigo-900">{dashboardStats.packed_today || 0}</div>
              </div>
            </div>
            {isProductionHead && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 font-medium">Pending Merges</div>
                  <div className="text-2xl font-bold text-purple-900">{dashboardStats.pending_merge_requests || 0}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-sm text-amber-600 font-medium">Pending Adjustments</div>
                  <div className="text-2xl font-bold text-amber-900">{dashboardStats.pending_adjustments || 0}</div>
                </div>
                <div className="bg-teal-50 rounded-lg p-4">
                  <div className="text-sm text-teal-600 font-medium">Total Loose (kg)</div>
                  <div className="text-2xl font-bold text-teal-900">{parseFloat(dashboardStats.total_loose_kg || 0).toFixed(3)}</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="text-sm text-emerald-600 font-medium">Total FG Packs</div>
                  <div className="text-2xl font-bold text-emerald-900">{dashboardStats.total_fg_packs || 0}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {tab.count}
                  </span>
                )}
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

export default PackingZoneDashboard;


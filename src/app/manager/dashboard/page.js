"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

// Components
import DashboardStats from '@/components/manager/DashboardStats';
import ManufacturingOrderForm from '@/components/manager/ManufacturingOrderForm';
import PurchaseOrderForm from '@/components/manager/PurchaseOrderForm';
import OrdersList from '@/components/manager/OrdersList';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';

export default function ManagerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [user, setUser] = useState(null);

  // Check authentication and role
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      
      if (!token || userRole !== 'manager') {
        router.push('/manager');
        return;
      }
      
      // Get user info from localStorage or API
      const userData = localStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await manufacturingAPI.getDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    if (!loading) {
      fetchStats();
    }
  }, [loading]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    router.push('/manager');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'create-mo', label: 'Create MO', icon: '🏭' },
    { id: 'create-po', label: 'Create PO', icon: '📦' },
    { id: 'mo-list', label: 'MO List', icon: '📋' },
    { id: 'po-list', label: 'PO List', icon: '📄' },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MS</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">MicroSprings</h1>
                  <p className="text-xs text-slate-500">Manager Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500">Manager</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-slate-200/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-3 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/80'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <DashboardStats stats={dashboardStats} />
          )}

          {/* Create MO Tab */}
          {activeTab === 'create-mo' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <span>🏭</span>
                  <span>Create Manufacturing Order</span>
                </h2>
                <p className="text-slate-600 mt-1">Create a new manufacturing order for production</p>
              </div>
              <div className="p-6">
                <ManufacturingOrderForm onSuccess={() => setActiveTab('mo-list')} />
              </div>
            </div>
          )}

          {/* Create PO Tab */}
          {activeTab === 'create-po' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <span>📦</span>
                  <span>Create Purchase Order</span>
                </h2>
                <p className="text-slate-600 mt-1">Create a new purchase order for raw materials</p>
              </div>
              <div className="p-6">
                <PurchaseOrderForm onSuccess={() => setActiveTab('po-list')} />
              </div>
            </div>
          )}

          {/* MO List Tab */}
          {activeTab === 'mo-list' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <span>📋</span>
                  <span>Manufacturing Orders</span>
                </h2>
                <p className="text-slate-600 mt-1">View and manage manufacturing orders</p>
              </div>
              <div className="p-6">
                <OrdersList type="mo" />
              </div>
            </div>
          )}

          {/* PO List Tab */}
          {activeTab === 'po-list' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="p-6 border-b border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <span>📄</span>
                  <span>Purchase Orders</span>
                </h2>
                <p className="text-slate-600 mt-1">View and manage purchase orders</p>
              </div>
              <div className="p-6">
                <OrdersList type="po" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-slate-200/40 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-slate-500">
            <p>&copy; 2024 MicroSprings. All rights reserved.</p>
            <p className="mt-1">Precision, Performance, Perfection</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import FGStockLevel from '@/components/fg-store/FGStockLevel';
import MOList from '@/components/fg-store/MOList';
import TransactionsLog from '@/components/fg-store/TransactionsLog';
import DispatchModal from '@/components/fg-store/DispatchModal';
import ConfirmDispatchModal from '@/components/fg-store/ConfirmDispatchModal';
import StockAlerts from '@/components/fg-store/StockAlerts';
import { Card } from '@/components/CommonComponents/ui/Card';
import { Button } from '@/components/CommonComponents/ui/Button';
import { LoadingSpinner } from '@/components/CommonComponents/ui/LoadingSpinner';

const FGStoreDashboard = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('stock-levels');
  const [selectedMO, setSelectedMO] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dispatchData, setDispatchData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user has FG Store access
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !user.roles?.includes('fg_store')) {
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

  const handleMOSelect = (mo) => {
    setSelectedMO(mo);
    setShowDispatchModal(true);
  };

  const handleDispatchConfirm = (data) => {
    setDispatchData(data);
    setShowDispatchModal(false);
    setShowConfirmModal(true);
  };

  const handleDispatchComplete = () => {
    setShowConfirmModal(false);
    setDispatchData(null);
    setSelectedMO(null);
    // Trigger refresh of all components
    setRefreshTrigger(prev => prev + 1);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'stock-levels':
        return <FGStockLevel refreshTrigger={refreshTrigger} />;
      case 'mo-list':
        return <MOList onMOSelect={handleMOSelect} refreshTrigger={refreshTrigger} />;
      case 'transactions':
        return <TransactionsLog refreshTrigger={refreshTrigger} />;
      case 'alerts':
        return <StockAlerts refreshTrigger={refreshTrigger} />;
      default:
        return <FGStockLevel refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                variant="outline"
                size="sm"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
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

      {/* Modals */}
      {showDispatchModal && selectedMO && (
        <DispatchModal
          mo={selectedMO}
          onClose={() => {
            setShowDispatchModal(false);
            setSelectedMO(null);
          }}
          onConfirm={handleDispatchConfirm}
        />
      )}

      {showConfirmModal && dispatchData && (
        <ConfirmDispatchModal
          dispatchData={dispatchData}
          onClose={() => {
            setShowConfirmModal(false);
            setDispatchData(null);
          }}
          onComplete={handleDispatchComplete}
        />
      )}
    </div>
  );
};

export default FGStoreDashboard;

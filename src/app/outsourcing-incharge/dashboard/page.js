"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BellIcon, 
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// API Services
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';
import outsourcingAPI from '@/components/API_Service/outsourcing-api';

// Components
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import SendToOutsourceModal from '@/components/outsourcing-incharge/SendToOutsourceModal';
import ReceiveFromOutsourceModal from '@/components/outsourcing-incharge/ReceiveFromOutsourceModal';
import ClearanceModal from '@/components/outsourcing-incharge/ClearanceModal';

export default function OutsourcingInchargeDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // pending, in_progress, completed, checked_cleared, transactions
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Data states
  const [pendingBatches, setPendingBatches] = useState([]);
  const [inProgressBatches, setInProgressBatches] = useState([]);
  const [completedBatches, setCompletedBatches] = useState([]);
  const [checkedClearedBatches, setCheckedClearedBatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  
  // Modal states
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await throttledGet(AUTH_APIS.PROFILE);
      
      if (response.success) {
        const role = response.data.primary_role?.name;
        
        if (role !== 'outsourcing_incharge') {
          router.push('/login');
          return null;
        }
        
        setUserProfile(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      router.push('/login');
      return null;
    }
  }, [router]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all outsourcing-related batches
      // Using the existing outsourcing API
      const outsourcingData = await outsourcingAPI.getAll({ 
        status: statusFilter,
        search: searchQuery,
        date: dateFilter
      });
      
      // Get summary
      const summaryData = await outsourcingAPI.getSummary();
      
      if (!outsourcingData?.error) {
        categorizeOutsourcingData(outsourcingData.results || outsourcingData || []);
      }
      
      if (!summaryData?.error) {
        setSummary(summaryData);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, dateFilter]);

  // Categorize outsourcing data into tabs
  const categorizeOutsourcingData = (data) => {
    const pending = [];
    const inProgress = [];
    const completed = [];
    const checkedCleared = [];
    const allTransactions = [];
    
    data.forEach(item => {
      allTransactions.push(item);
      
      if (item.status === 'draft') {
        pending.push(item);
      } else if (item.status === 'sent') {
        inProgress.push(item);
      } else if (item.status === 'returned') {
        // Check if there's a quantity difference requiring clearance
        if (item.requires_clearance) {
          checkedCleared.push(item);
        } else {
          completed.push(item);
        }
      } else if (item.status === 'closed') {
        completed.push(item);
      }
    });
    
    setPendingBatches(pending);
    setInProgressBatches(inProgress);
    setCompletedBatches(completed);
    setCheckedClearedBatches(checkedCleared);
    setTransactions(allTransactions);
  };

  // Check authentication and load data
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      router.push('/login');
      return;
    }

    const initializeDashboard = async () => {
      const profile = await fetchUserProfile();
      if (profile) {
        await fetchDashboardData();
      }
    };

    initializeDashboard();
  }, [fetchUserProfile, fetchDashboardData, router, refreshTrigger]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    router.replace('/login');
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSendToOutsource = (batch) => {
    setSelectedBatch(batch);
    setSendModalOpen(true);
  };

  const handleReceiveFromOutsource = (batch) => {
    setSelectedBatch(batch);
    setReceiveModalOpen(true);
  };

  const handleClearBatch = (batch) => {
    setSelectedBatch(batch);
    setClearanceModalOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      returned: 'bg-green-100 text-green-800',
      closed: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  if (loading || !userProfile) {
    return <LoadingSpinner />;
  }

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'pending':
        return <PendingTab 
          batches={pendingBatches} 
          onSendToOutsource={handleSendToOutsource}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />;
      case 'in_progress':
        return <InProgressTab 
          batches={inProgressBatches} 
          onReceiveFromOutsource={handleReceiveFromOutsource}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />;
      case 'completed':
        return <CompletedTab 
          batches={completedBatches}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />;
      case 'checked_cleared':
        return <CheckedClearedTab 
          batches={checkedClearedBatches} 
          onClearBatch={handleClearBatch}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
        />;
      case 'transactions':
        return <TransactionsTab 
          transactions={transactions}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />;
      default:
        return null;
    }
  };

  // Calculate badge counts
  const pendingCount = pendingBatches.length;
  const inProgressCount = inProgressBatches.length;
  const completedCount = completedBatches.length;
  const checkedClearedCount = checkedClearedBatches.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Outsourcing Management</h1>
              <p className="text-xs text-slate-500">
                {userProfile?.full_name} - <span className="font-medium">Outsourcing Incharge</span>
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {pendingCount > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <p className="text-sm text-yellow-700">
                <strong>Alert:</strong> {pendingCount} {pendingCount === 1 ? 'batch is' : 'batches are'} waiting to be sent for outsourcing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-gray-800">{pendingCount}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <ClockIcon className="h-8 w-8 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <TruckIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Needs Clearance</p>
                <p className="text-3xl font-bold text-orange-600">{checkedClearedCount}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                Pending {pendingCount > 0 && <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-800 rounded-full text-xs">{pendingCount}</span>}
              </button>
              <button
                onClick={() => setActiveTab('in_progress')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'in_progress'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                In Progress {inProgressCount > 0 && <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs">{inProgressCount}</span>}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'completed'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                Completed {completedCount > 0 && <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs">{completedCount}</span>}
              </button>
              <button
                onClick={() => setActiveTab('checked_cleared')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'checked_cleared'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                Checked/Cleared {checkedClearedCount > 0 && <span className="ml-2 px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs">{checkedClearedCount}</span>}
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'transactions'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <DocumentTextIcon className="h-4 w-4 inline-block mr-1" />
                Transactions
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Modals */}
      <SendToOutsourceModal
        isOpen={sendModalOpen}
        onClose={() => {
          setSendModalOpen(false);
          setSelectedBatch(null);
        }}
        batch={selectedBatch}
        onSuccess={handleRefresh}
      />

      <ReceiveFromOutsourceModal
        isOpen={receiveModalOpen}
        onClose={() => {
          setReceiveModalOpen(false);
          setSelectedBatch(null);
        }}
        batch={selectedBatch}
        onSuccess={handleRefresh}
      />

      <ClearanceModal
        isOpen={clearanceModalOpen}
        onClose={() => {
          setClearanceModalOpen(false);
          setSelectedBatch(null);
        }}
        batch={selectedBatch}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

// Tab Components
function PendingTab({ batches, onSendToOutsource, getStatusColor, getPriorityColor }) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Pending Batches</h3>
        <p className="text-slate-500">All batches have been sent for outsourcing.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {batches.map((batch) => (
        <div
          key={batch.id}
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{batch.request_id || batch.mo_number}</h3>
              <p className="text-sm text-slate-600">{batch.product_code || 'Product'}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
              Pending
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Vendor:</span>
              <span className="font-medium text-slate-800">{batch.vendor_name || 'To be assigned'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Quantity:</span>
              <span className="font-medium text-slate-800">{batch.qty || batch.kg ? `${batch.qty || 0} pcs / ${batch.kg || 0} kg` : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Expected Return:</span>
              <span className="font-medium text-slate-800">{batch.expected_return_date || 'Not set'}</span>
            </div>
          </div>

          <button
            onClick={() => onSendToOutsource(batch)}
            className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Send to Outsource
          </button>
        </div>
      ))}
    </div>
  );
}

function InProgressTab({ batches, onReceiveFromOutsource, getStatusColor, getPriorityColor }) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚚</div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Batches In Progress</h3>
        <p className="text-slate-500">No batches are currently with vendors.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {batches.map((batch) => (
        <div
          key={batch.id}
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{batch.request_id}</h3>
              <p className="text-sm text-slate-600">{batch.vendor_name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
              In Progress
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Date Sent:</span>
              <span className="font-medium text-slate-800">{batch.date_sent || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Quantity Sent:</span>
              <span className="font-medium text-slate-800">{batch.total_qty || 0} pcs / {batch.total_kg || 0} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Expected Return:</span>
              <span className="font-medium text-slate-800">{batch.expected_return_date}</span>
            </div>
            {batch.is_overdue && (
              <div className="flex items-center text-sm text-red-600 mt-2">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                <span>Overdue</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onReceiveFromOutsource(batch)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Receive from Outsource
          </button>
        </div>
      ))}
    </div>
  );
}

function CompletedTab({ batches, getStatusColor, getPriorityColor }) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Completed Batches</h3>
        <p className="text-slate-500">Completed batches will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {batches.map((batch) => (
            <tr key={batch.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {batch.request_id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {batch.vendor_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {batch.total_qty || 0} pcs / {batch.total_kg || 0} kg
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {batch.returned_qty || 0} pcs / {batch.returned_kg || 0} kg
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}>
                  Completed
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CheckedClearedTab({ batches, onClearBatch, getStatusColor, getPriorityColor }) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Batches Awaiting Clearance</h3>
        <p className="text-slate-500">Batches with quantity differences will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {batches.map((batch) => {
        const difference = (batch.total_qty || batch.total_kg || 0) - (batch.returned_qty || batch.returned_kg || 0);
        
        return (
          <div
            key={batch.id}
            className="bg-orange-50 rounded-xl shadow-lg border-2 border-orange-200 p-6 hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{batch.request_id}</h3>
                <p className="text-sm text-slate-600">{batch.vendor_name}</p>
              </div>
              <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
                Needs Clearance
              </span>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex items-center text-orange-600 mb-2">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Received less than sent</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Quantity Sent:</span>
                  <span className="font-medium text-slate-800">{batch.total_qty || batch.total_kg || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Quantity Received:</span>
                  <span className="font-medium text-slate-800">{batch.returned_qty || batch.returned_kg || 0}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-slate-600 font-medium">Difference:</span>
                  <span className="font-bold text-orange-600">{Math.abs(difference)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onClearBatch(batch)}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Check and Clear
            </button>
          </div>
        );
      })}
    </div>
  );
}

function TransactionsTab({ 
  transactions, 
  getStatusColor, 
  getPriorityColor,
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter
}) {
  return (
    <div>
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Filter</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Pending</option>
            <option value="sent">In Progress</option>
            <option value="returned">Returned</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setDateFilter('');
              setStatusFilter('');
            }}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Transactions</h3>
          <p className="text-slate-500">Transaction history will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Return</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {txn.request_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.vendor_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.date_sent || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.expected_return_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.total_qty || 0} / {txn.total_kg || 0} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {txn.returned_qty || 0} / {txn.returned_kg || 0} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(txn.status)}`}>
                      {txn.status_display || txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



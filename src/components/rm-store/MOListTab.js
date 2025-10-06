"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import manufacturingAPI from '../API_Service/manufacturing-api';
import Button from '../CommonComponents/ui/Button';
import { toast } from '@/utils/notifications';
import { 
  CheckCircleIcon, ClockIcon, EyeIcon, PlayCircleIcon, 
  PlusCircleIcon, CubeIcon 
} from '@heroicons/react/24/outline';
import MODetailModal from './MODetailModal';
import BatchCreateModal from './BatchCreateModal';

export default function MOListTab() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('on_hold'); // 'on_hold', 'in_progress', 'completed'
  const [moData, setMoData] = useState({
    summary: { pending_approvals: 0, in_progress: 0, completed: 0, total: 0 },
    on_hold: [],
    in_progress: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [selectedMO, setSelectedMO] = useState(null);
  const [showMODetailModal, setShowMODetailModal] = useState(false);
  const [showBatchCreateModal, setShowBatchCreateModal] = useState(false);

  // Fetch MO list for RM Store
  const fetchMOList = async () => {
    try {
      setLoading(true);
      const data = await manufacturingAPI.manufacturingOrders.getRMStoreDashboard();
      setMoData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching MO list:', err);
      setError(err.message || 'Failed to fetch MO list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMOList();
  }, []);

  // Handle View Details
  const handleViewDetails = (mo) => {
    setSelectedMO(mo);
    setShowMODetailModal(true);
  };

  // Handle Create Batch - opens batch create modal
  const handleCreateBatch = (mo) => {
    setShowMODetailModal(false); // Close detail modal first
    setSelectedMO(mo);
    setShowBatchCreateModal(true);
  };

  // Handle Batch Created Successfully
  const handleBatchCreated = async () => {
    setShowBatchCreateModal(false);
    setSelectedMO(null);
    toast.success('Batch created successfully!');
    await fetchMOList();
  };

  // Get priority badge style
  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status badge style
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get current MO list based on active tab
  const getCurrentMOList = () => {
    return moData[activeTab] || [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800">{error}</p>
        <Button onClick={fetchMOList} variant="primary" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const currentMOs = getCurrentMOList();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold opacity-90">Pending Approvals</h3>
              <p className="text-3xl font-bold mt-2">{moData.summary.pending_approvals}</p>
            </div>
            <ClockIcon className="h-12 w-12 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold opacity-90">In Progress</h3>
              <p className="text-3xl font-bold mt-2">{moData.summary.in_progress}</p>
            </div>
            <PlayCircleIcon className="h-12 w-12 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold opacity-90">Completed</h3>
              <p className="text-3xl font-bold mt-2">{moData.summary.completed}</p>
            </div>
            <CheckCircleIcon className="h-12 w-12 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('on_hold')}
            className={`${
              activeTab === 'on_hold'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            On Hold ({moData.summary.pending_approvals})
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`${
              activeTab === 'in_progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
          >
            <PlayCircleIcon className="h-5 w-5 mr-2" />
            In Progress ({moData.summary.in_progress})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`${
              activeTab === 'completed'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Completed ({moData.summary.completed})
          </button>
        </nav>
      </div>

      {/* MO List */}
      {currentMOs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <CheckCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No MOs Found</h3>
          <p className="text-slate-600">
            {activeTab === 'on_hold' && 'No manufacturing orders pending approval at the moment.'}
            {activeTab === 'in_progress' && 'No manufacturing orders currently in progress.'}
            {activeTab === 'completed' && 'No completed manufacturing orders yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    MO ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Start Date
                  </th>
                  {activeTab === 'in_progress' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                      Batches
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentMOs.map((mo) => (
                  <tr key={mo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">{mo.mo_id}</div>
                      <div className="text-xs text-slate-500">
                        {formatDate(mo.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800 font-medium">
                        {mo.product_code?.product_code || 'N/A'}
                      </div>
                      <div className="text-xs text-slate-600">
                        {mo.product_code?.customer_name || 'No customer'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-800 font-semibold">
                        {mo.quantity?.toLocaleString()}
                      </div>
                      {mo.strips_required && (
                        <div className="text-xs text-slate-600">
                          {mo.strips_required} strips
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityStyle(mo.priority)}`}>
                        {mo.priority_display || mo.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-800">
                        {formatDate(mo.planned_start_date)}
                      </div>
                    </td>
                    {activeTab === 'in_progress' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800 font-medium">
                          {mo.batches?.length || 0} batches
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        onClick={() => handleViewDetails(mo)}
                        variant="secondary"
                        size="sm"
                        className="inline-flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      
                      {(activeTab === 'on_hold' || activeTab === 'in_progress') && (
                        <Button
                          onClick={() => handleCreateBatch(mo)}
                          variant="primary"
                          size="sm"
                          className="inline-flex items-center bg-cyan-600 hover:bg-cyan-700"
                        >
                          <PlusCircleIcon className="h-4 w-4 mr-1" />
                          Create Batch
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MO Detail Modal */}
      {showMODetailModal && selectedMO && (
        <MODetailModal
          mo={selectedMO}
          onClose={() => {
            setShowMODetailModal(false);
            setSelectedMO(null);
          }}
          onRefresh={fetchMOList}
          onCreateBatch={handleCreateBatch}
        />
      )}

      {/* Batch Create Modal */}
      {showBatchCreateModal && selectedMO && (
        <BatchCreateModal
          mo={selectedMO}
          onClose={() => {
            setShowBatchCreateModal(false);
            setSelectedMO(null);
          }}
          onSuccess={handleBatchCreated}
        />
      )}
    </div>
  );
}
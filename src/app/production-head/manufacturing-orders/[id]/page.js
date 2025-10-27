'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Pause, CheckCircle } from 'lucide-react';
import StopMOConfirmationModal from '@/components/manufacturing/StopMOConfirmationModal';
import ResourceAllocationPanel from '@/components/manufacturing/ResourceAllocationPanel';
import { MANUFACTURING_APIS } from '@/components/API_Service/api-list';

export default function MODetailPage() {
  const params = useParams();
  const router = useRouter();
  const moId = params.id;

  const [mo, setMo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStopModal, setShowStopModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (moId) {
      fetchMODetails();
    }
  }, [moId]);

  const fetchMODetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(MANUFACTURING_APIS.MO_DETAIL(moId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch MO details');
      }

      const data = await response.json();
      setMo(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching MO details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopMO = async (stopReason) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(MANUFACTURING_APIS.MO_STOP(moId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stop_reason: stopReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop MO');
      }

      const data = await response.json();
      
      // Show success message
      setSuccessMessage(`MO ${data.mo_id} stopped successfully. Resources have been released.`);
      
      // Refresh MO details
      await fetchMODetails();
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Error stopping MO:', error);
      throw error;
    }
  };

  const canStopMO = (status) => {
    return ['on_hold', 'rm_allocated', 'in_progress'].includes(status);
  };

  const getStatusColor = (status) => {
    const colors = {
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'rm_allocated': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'stopped': 'bg-red-100 text-red-800',
      'submitted': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading MO details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mo) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Failed to Load MO Details</h3>
                <p className="text-sm text-red-700 mt-1">{error || 'MO not found'}</p>
                <button
                  onClick={() => router.back()}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{mo.mo_id}</h1>
                <p className="text-sm text-gray-600">Manufacturing Order Details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {mo.status === 'stopped' ? (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                  <Pause className="w-5 h-5" />
                  <span className="font-medium">MO Stopped</span>
                </div>
              ) : canStopMO(mo.status) ? (
                <button
                  onClick={() => setShowStopModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  Stop MO
                </button>
              ) : null}
              
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mo.status)}`}>
                {mo.status_display || mo.status}
              </span>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Stopped Info */}
          {mo.status === 'stopped' && mo.stopped_at && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">MO Stopped</h3>
              <div className="text-sm text-red-800 space-y-1">
                <p><strong>Stopped At:</strong> {new Date(mo.stopped_at).toLocaleString()}</p>
                {mo.stop_reason && <p><strong>Reason:</strong> {mo.stop_reason}</p>}
              </div>
            </div>
          )}

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Product Code</label>
              <p className="font-medium text-gray-900">{mo.product_code?.product_code || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Customer</label>
              <p className="font-medium text-gray-900">{mo.customer_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Quantity</label>
              <p className="font-medium text-gray-900">{mo.quantity}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Priority</label>
              <p className="font-medium text-gray-900">
                {mo.priority_display || mo.priority} (Level: {mo.priority_level || 0})
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Planned Start</label>
              <p className="font-medium text-gray-900">
                {mo.planned_start_date ? new Date(mo.planned_start_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Planned End</label>
              <p className="font-medium text-gray-900">
                {mo.planned_end_date ? new Date(mo.planned_end_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">RM Required</label>
              <p className="font-medium text-gray-900">{mo.rm_required_kg} kg</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Material Type</label>
              <p className="font-medium text-gray-900">{mo.material_type || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Created At</label>
              <p className="font-medium text-gray-900">
                {mo.created_at ? new Date(mo.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Resource Allocation Panel */}
        <ResourceAllocationPanel moId={moId} />

        {/* Additional sections can be added here */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <p>Add more MO details here: batches, process execution, quality checks, etc.</p>
          </div>
        </div>
      </div>

      {/* Stop MO Modal */}
      <StopMOConfirmationModal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        moData={mo}
        onConfirm={handleStopMO}
      />
    </div>
  );
}


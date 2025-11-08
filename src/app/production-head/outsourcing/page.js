"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import outsourcingAPI from '@/components/API_Service/outsourcing-api';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';

export default function ProductionHeadOutsourcingManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    vendor: '',
    search: ''
  });
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      
      if (!token || (role !== 'manager' && role !== 'production_head' && role !== 'supervisor')) {
        router.push('/login');
        return;
      }
      
      setUserRole(role);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [loading, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch requests with filters
      const requestsData = await outsourcingAPI.getAll(filters);
      if (requestsData?.error || !requestsData?.success) {
        console.error('Error fetching requests:', requestsData?.error || requestsData?.message || 'Unknown error');
        setRequests([]);
      } else {
        // apiRequest returns { success: true, data: {...} }
        const data = requestsData?.data || requestsData;
        setRequests(data?.results || data || []);
      }

      // Fetch summary
      const summaryData = await outsourcingAPI.getSummary();
      if (!summaryData?.error && summaryData?.success) {
        // apiRequest returns { success: true, data: {...} }
        setSummary(summaryData?.data || summaryData);
      }
    } catch (error) {
      console.error('Error fetching outsourcing data:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (requestId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await outsourcingAPI.send(requestId, {
        date_sent: today,
        vendor_contact_person: ''
      });
      
      if (result?.error || !result?.success) {
        alert(`Error: ${result?.error || result?.message || 'Unknown error'}`);
      } else {
        alert('Request sent successfully!');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error sending request:', error);
      alert('Error sending request');
    }
  };

  const handleReturnItems = async (requestId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const request = requests.find(r => r.id === requestId);
      
      if (!request?.items) {
        alert('No items found for this request');
        return;
      }

      // Create returned items data
      const returnedItems = request.items.map(item => ({
        id: item.id,
        returned_qty: item.qty || 0,
        returned_kg: item.kg || 0
      }));

      const result = await outsourcingAPI.returnItems(requestId, {
        collection_date: today,
        collected_by_id: 1, // TODO: Get current user ID
        returned_items: returnedItems
      });
      
      if (result?.error || !result?.success) {
        alert(`Error: ${result?.error || result?.message || 'Unknown error'}`);
      } else {
        alert('Items returned successfully!');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error returning items:', error);
      alert('Error returning items');
    }
  };

  const handleCloseRequest = async (requestId) => {
    try {
      const result = await outsourcingAPI.close(requestId);
      
      if (result?.error || !result?.success) {
        alert(`Error: ${result?.error || result?.message || 'Unknown error'}`);
      } else {
        alert('Request closed successfully!');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error closing request:', error);
      alert('Error closing request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'returned': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Outsourcing Management
              </h1>
              <p className="mt-1 text-amber-100">
                Track items sent to external vendors for processing
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/production-head/create-outsourcing')}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors backdrop-blur-sm"
              >
                + Create Request
              </button>
              <button
                onClick={() => router.back()}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors backdrop-blur-sm"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_requests}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Returns</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.pending_returns}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue Returns</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.overdue_returns}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">📈</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent (30 days)</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.recent_requests}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="returned">Returned</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder="Search by request ID or vendor..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({status: '', vendor: '', search: ''})}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Outsourcing Requests</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => {
                  const hasShortage = request.requires_clearance || (request.total_qty > request.returned_qty) || (request.total_kg > request.returned_kg);
                  const isRework = request.status === 'rework' || request.notes?.toLowerCase().includes('rework');
                  const rowBgColor = hasShortage ? 'bg-orange-50' : (isRework ? 'bg-yellow-50' : (request.is_overdue ? 'bg-red-50' : ''));
                  
                  return (
                    <tr key={request.id} className={rowBgColor}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.request_id}
                        {isRework && <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">🔄 Rework</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.vendor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status_display}
                        </span>
                        {request.is_overdue && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Overdue
                          </span>
                        )}
                        {hasShortage && request.status === 'returned' && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            ⚠️ Shortage
                          </span>
                        )}
                        {request.is_cleared && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✓ Checked
                          </span>
                        )}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.date_sent || '-'}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.expected_return_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{request.total_items} items</div>
                        {hasShortage && (
                          <div className="text-xs text-orange-600 mt-1">
                            Shortage: {((request.total_qty || request.total_kg || 0) - (request.returned_qty || request.returned_kg || 0)).toFixed(3)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {request.status === 'draft' && (
                            <button
                              onClick={() => handleSendRequest(request.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Send
                            </button>
                          )}
                          {request.status === 'sent' && (
                            <button
                              onClick={() => handleReturnItems(request.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Mark Returned
                            </button>
                          )}
                          {request.status === 'returned' && (
                            <button
                              onClick={() => handleCloseRequest(request.id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Close
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/production-head/outsourcing/${request.id}`)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {requests.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No outsourcing requests found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

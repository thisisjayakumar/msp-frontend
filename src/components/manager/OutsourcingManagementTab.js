"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import outsourcingAPI from '@/components/API_Service/outsourcing-api';

export default function OutsourcingManagementTab({ isReadOnly = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    vendor: '',
    search: ''
  });
  const fetchingRef = useRef(false);
  const lastFiltersRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (fetchingRef.current) {
      return;
    }
    
    fetchingRef.current = true;
    let loadingTimeout = null;
    try {
      setLoading(true);
      
      loadingTimeout = setTimeout(() => {
        setLoading(false);
      }, 30000);
      
      const requestsData = await outsourcingAPI.getAll(filters);
      
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      
      if (requestsData && typeof requestsData === 'object') {
        if (requestsData.error || (requestsData.success === false)) {
          setRequests([]);
        } else if (requestsData.success === true && requestsData.data) {
          const data = requestsData.data;
          setRequests(data?.results || data || []);
        } else if (requestsData.results || Array.isArray(requestsData)) {
          setRequests(requestsData.results || requestsData || []);
        } else {
          setRequests([]);
        }
      } else {
        setRequests([]);
      }

      try {
        const summaryData = await outsourcingAPI.getSummary();
        
        if (summaryData && typeof summaryData === 'object') {
          if (!summaryData.error && summaryData.success === true && summaryData.data) {
            setSummary(summaryData.data);
          } else if (!summaryData.error && !summaryData.success && (summaryData.total_requests !== undefined || Array.isArray(summaryData))) {
            setSummary(summaryData);
          }
        }
      } catch (summaryError) {
        console.error('Error fetching summary:', summaryError);
      }
    } catch (error) {
      console.error('Error fetching outsourcing data:', error);
      setRequests([]);
      setSummary(null);
    } finally {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [filters]);

  useEffect(() => {
    const filtersKey = JSON.stringify(filters);
    if (lastFiltersRef.current === null || lastFiltersRef.current !== filtersKey) {
      lastFiltersRef.current = filtersKey;
      fetchData();
    }
  }, [filters, fetchData]);

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
        fetchData();
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

      const returnedItems = request.items.map(item => ({
        id: item.id,
        returned_qty: item.qty || 0,
        returned_kg: item.kg || 0
      }));

      const result = await outsourcingAPI.returnItems(requestId, {
        collection_date: today,
        collected_by_id: 1,
        returned_items: returnedItems
      });
      
      if (result?.error || !result?.success) {
        alert(`Error: ${result?.error || result?.message || 'Unknown error'}`);
      } else {
        alert('Items returned successfully!');
        fetchData();
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
        fetchData();
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

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <span className="text-lg">📋</span>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Requests</p>
                <p className="text-lg font-bold text-gray-900">{summary.total_requests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <span className="text-lg">⏳</span>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending Returns</p>
                <p className="text-lg font-bold text-gray-900">{summary.pending_returns}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <span className="text-lg">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Overdue Returns</p>
                <p className="text-lg font-bold text-gray-900">{summary.overdue_returns}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <span className="text-lg">📈</span>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Recent (30 days)</p>
                <p className="text-lg font-bold text-gray-900">{summary.recent_requests}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Outsourcing Requests</h3>
        {!isReadOnly && (
          <button
            onClick={() => router.push('/manager/create-outsourcing')}
            className="inline-flex items-center px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Request
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="returned">Returned</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Search by request ID or vendor..."
              className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({status: '', vendor: '', search: ''})}
              className="w-full text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-2 text-xs text-gray-600">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-3xl mb-2">🚚</div>
            <p className="text-xs text-gray-600">No outsourcing requests found</p>
            {!isReadOnly && (
              <button
                onClick={() => router.push('/manager/create-outsourcing')}
                className="mt-3 inline-flex items-center px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Create First Request
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Sent
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Return
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {request.request_id}
                        {isRework && <span className="ml-1 inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">🔄 Rework</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {request.vendor_name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status_display}
                        </span>
                        {request.is_overdue && (
                          <span className="ml-1 inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Overdue
                          </span>
                        )}
                        {hasShortage && request.status === 'returned' && (
                          <span className="ml-1 inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            ⚠️ Shortage
                          </span>
                        )}
                        {request.is_cleared && (
                          <span className="ml-1 inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✓ Checked
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {request.date_sent || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {request.expected_return_date}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        <div>{request.total_items} items</div>
                        {hasShortage && (
                          <div className="text-xs text-orange-600 mt-0.5">
                            Shortage: {((request.total_qty || request.total_kg || 0) - (request.returned_qty || request.returned_kg || 0)).toFixed(3)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex space-x-1.5">
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
                              Return
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
                            onClick={() => router.push(`/manager/outsourcing/${request.id}`)}
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
          </div>
        )}
      </div>
    </div>
  );
}


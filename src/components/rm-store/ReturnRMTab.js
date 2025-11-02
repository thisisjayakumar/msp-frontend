"use client";

import { useState, useEffect, useRef } from 'react';
import { inventoryAPI } from '../API_Service/inventory-api';
import { Card } from '../CommonComponents/ui/Card';
import Button from '../CommonComponents/ui/Button';
import DashboardLoader from '../CommonComponents/ui/DashboardLoader';
import RMReturnDispositionModal from './RMReturnDispositionModal';

export default function ReturnRMTab() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDisposition, setFilterDisposition] = useState('all'); // 'all', 'pending', 'return_to_vendor', 'scrap'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  
  // Prevent duplicate API calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Fetch RM returns
  const fetchReturns = async () => {
    try {
      setLoading(true);
      const data = await inventoryAPI.rmReturns.getAll();
      
      if (data?.error) {
        setError(data.message);
        setReturns([]);
      } else {
        // Support multiple response shapes: array, paginated {results: []}, or wrapped {success, data: []}
        const items = Array.isArray(data) 
          ? data 
          : (data?.results || data?.data || []);
        
        setReturns(items);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching RM returns:', err);
      setError(err.message || 'Failed to fetch RM returns');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode (development only)
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    fetchReturns();
  }, []);

  // Filter returns based on search and disposition filter
  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = searchTerm === '' || 
      returnItem.return_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.raw_material_details?.material_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.batch_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.mo_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.return_reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterDisposition === 'all' || returnItem.disposition === filterDisposition;

    return matchesSearch && matchesFilter;
  });

  // Count by disposition
  const counts = {
    all: returns.length,
    pending: returns.filter(r => r.disposition === 'pending').length,
    return_to_rm: returns.filter(r => r.disposition === 'return_to_rm').length,
    return_to_vendor: returns.filter(r => r.disposition === 'return_to_vendor').length,
    scrap: returns.filter(r => r.disposition === 'scrap').length,
  };

  const handleProcessDisposition = async (disposition, receivedReturnQty, vendorAcceptedQuantity, notes) => {
    try {
      const extras = {
        category: disposition, // 'return_to_rm' | 'return_to_vendor'
        vendorAcceptedQuantity,
        receivedReturnQuantityKg: receivedReturnQty,
      };
      const result = await inventoryAPI.rmReturns.processDisposition(
        selectedReturn.id,
        disposition,
        notes,
        extras
      );

      if (result.error) {
        throw new Error(result.message);
      }

      await fetchReturns();
      setShowDispositionModal(false);
      setSelectedReturn(null);
    } catch (err) {
      console.error('Error processing disposition:', err);
      throw err;
    }
  };

  // Get disposition badge style
  const getDispositionBadgeStyle = (disposition) => {
    switch (disposition) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'return_to_rm':
        return 'bg-green-100 text-green-800';
      case 'return_to_vendor':
        return 'bg-blue-100 text-blue-800';
      case 'scrap':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <DashboardLoader message="Loading RM Returns..." />;
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.834-1.964-.834-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Returns</h3>
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={fetchReturns} variant="primary">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search returns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterDisposition('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterDisposition === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilterDisposition('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterDisposition === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => setFilterDisposition('return_to_vendor')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterDisposition === 'return_to_vendor'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Returned to Vendor ({counts.return_to_vendor})
          </button>
          <button
            onClick={() => setFilterDisposition('scrap')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterDisposition === 'scrap'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Scrapped ({counts.scrap})
          </button>
        </div>

        {/* Refresh Button */}
        <Button onClick={fetchReturns} variant="secondary" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Returns List */}
      {filteredReturns.length === 0 ? (
        <Card className="p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Returns Found</h3>
          <p className="text-slate-600">
            {searchTerm || filterDisposition !== 'all'
              ? 'No returns match your search criteria. Try adjusting your filters.'
              : 'No raw material returns have been recorded yet.'
            }
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Return ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Raw Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Batch / MO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    From Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Quantities (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Returned By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Returned At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Disposition
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReturns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">
                        {returnItem.return_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800">
                        {returnItem.raw_material_details?.material_code}
                      </div>
                      <div className="text-xs text-slate-600">
                        {returnItem.raw_material_details?.material_name}
                      </div>
                      {returnItem.heat_number_display && (
                        <div className="text-xs text-slate-500">
                          Heat: {returnItem.heat_number_display}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800">
                        {returnItem.batch_id}
                      </div>
                      <div className="text-xs text-slate-600">
                        MO: {returnItem.mo_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-800">
                        {returnItem.returned_from_location_display}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total:</span>
                          <span className="font-semibold text-slate-800">
                            {(Number(returnItem.total_batch_quantity_kg || returnItem.quantity_kg || 0)).toFixed(3)} kg
                          </span>
                        </div>
                        {returnItem.scrapped_quantity_kg && Number(returnItem.scrapped_quantity_kg) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Used:</span>
                            <span className="font-semibold text-red-600">
                              {(Number(returnItem.scrapped_quantity_kg || 0)).toFixed(3)} kg
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 pt-1">
                          <span className="text-slate-600">Unused:</span>
                          <span className="font-semibold text-blue-600">
                            {(Math.max(Number(returnItem.total_batch_quantity_kg || returnItem.quantity_kg || 0) - Number(returnItem.scrapped_quantity_kg || 0), 0)).toFixed(3)} kg
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-slate-800 truncate" title={returnItem.return_reason}>
                        {returnItem.return_reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-800">
                        {returnItem.returned_by_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-800">
                        {formatDate(returnItem.returned_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDispositionBadgeStyle(returnItem.disposition)}`}>
                          {returnItem.disposition_display}
                        </span>
                        {returnItem.disposed_at && (
                          <div className="text-xs text-slate-500 mt-1">
                            By: {returnItem.disposed_by_name}
                          </div>
                        )}
                        {returnItem.disposition === 'return_to_vendor' && returnItem.vendor_accepted_quantity && (
                          <div className="text-xs text-slate-600 mt-1">
                            Vendor accepted: <span className="font-semibold">{returnItem.vendor_accepted_quantity} kg</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {returnItem.disposition === 'pending' ? (
                        <Button
                          onClick={() => {
                            setSelectedReturn(returnItem);
                            setShowDispositionModal(true);
                          }}
                          variant="primary"
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Process
                        </Button>
                      ) : (
                        <span className="text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Disposition Modal */}
      {showDispositionModal && selectedReturn && (
        <RMReturnDispositionModal
          returnItem={selectedReturn}
          onProcess={handleProcessDisposition}
          onCancel={() => {
            setShowDispositionModal(false);
            setSelectedReturn(null);
          }}
        />
      )}
    </div>
  );
}


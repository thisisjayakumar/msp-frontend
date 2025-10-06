"use client";

import { useState, useEffect } from 'react';
import { inventoryAPI } from '../API_Service/inventory-api';
import DashboardLoader from '../CommonComponents/ui/DashboardLoader';
import { Card } from '../CommonComponents/ui/Card';
import Button from '../CommonComponents/ui/Button';
import StockUpdateModal from './StockUpdateModal';
import DashboardStats from './DashboardStats';
import MOListTab from './MOListTab';

export default function RMStoreDashboard() {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'mo_list'
  const [rawMaterials, setRawMaterials] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [rawMaterialsData, statsData] = await Promise.all([
        inventoryAPI.rawMaterials.getAll(),
        inventoryAPI.dashboard.getStats()
      ]);
      
      // Ensure rawMaterialsData is an array (handle paginated responses)
      const materials = Array.isArray(rawMaterialsData)
        ? rawMaterialsData
        : Array.isArray(rawMaterialsData?.results)
          ? rawMaterialsData.results
          : [];

      setRawMaterials(materials);
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter raw materials based on search and filter type
  const filteredMaterials = rawMaterials.filter(material => {
    const matchesSearch = searchTerm === '' || 
      material.material_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.grade?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || 
      (filterType === 'in_stock' && material.available_quantity > 0) ||
      (filterType === 'out_of_stock' && material.available_quantity === 0) ||
      (filterType === 'coil' && material.material_type === 'coil') ||
      (filterType === 'sheet' && material.material_type === 'sheet');

    return matchesSearch && matchesFilter;
  });

  // Handle stock update
  const handleStockUpdate = async (material, quantity) => {
    try {
      await inventoryAPI.stockBalances.updateByMaterialCode(material.material_code, quantity);
      setShowStockModal(false);
      setSelectedMaterial(null);
      await fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Error updating stock:', err);
      throw err; // Let the modal handle the error
    }
  };

  // Get stock status styling
  const getStockStatusStyle = (availableQuantity) => {
    if (availableQuantity > 0) {
      return 'bg-green-100 text-green-800';
    } else if (availableQuantity === 0) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-600';
  };

  // Get stock status text
  const getStockStatusText = (availableQuantity) => {
    if (availableQuantity > 0) {
      return `In Stock (${availableQuantity} kg)`;
    } else if (availableQuantity === 0) {
      return 'Out of Stock';
    }
    return 'No Stock Record';
  };

  if (loading) {
    return <DashboardLoader message="Loading RM Store Dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-slate-800 mb-4">{error}</p>
            <Button onClick={fetchDashboardData} variant="primary">
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">RM Store Dashboard</h1>
          <p className="text-slate-800">Monitor raw material stock levels and update inventory balances</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('stock')}
                className={`${
                  activeTab === 'stock'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Raw Material Stock
              </button>
              <button
                onClick={() => setActiveTab('mo_list')}
                className={`${
                  activeTab === 'mo_list'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                MO Approvals
              </button>
            </nav>
          </div>
        </div>

        {/* Stock Tab Content */}
        {activeTab === 'stock' && (
          <>
            {/* Dashboard Stats */}
            {stats && <DashboardStats stats={stats} />}

            {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search raw materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">All Materials</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="coil">Coil</option>
              <option value="sheet">Sheet</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={fetchDashboardData} variant="secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Raw Materials Table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-slate-800">
              Raw Material Stock Availability ({filteredMaterials.length})
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Monitor and update stock levels for all raw materials
            </p>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Raw Materials Found</h3>
              <p className="text-slate-800 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'No raw materials match your search criteria. Try adjusting your filters.' 
                  : 'No raw materials available in the system. Contact your administrator to add raw materials.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                      Material Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                      Material Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                      Specifications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-800 uppercase tracking-wider">
                      Stock Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMaterials.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-800">
                          {material.material_code}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-800">
                          {material.material_name}
                        </div>
                        <div className="text-xs text-slate-600">
                          Grade: {material.grade}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {material.material_type_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">
                          {material.material_type === 'coil' ? (
                            <>
                              {material.wire_diameter_mm && `⌀${material.wire_diameter_mm}mm`}
                              {material.weight_kg && ` • ${material.weight_kg}kg`}
                            </>
                          ) : (
                            <>
                              {material.thickness_mm && `t${material.thickness_mm}mm`}
                            </>
                          )}
                        </div>
                        {material.finishing_display && (
                          <div className="text-xs text-slate-600">
                            {material.finishing_display}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusStyle(material.available_quantity)}`}>
                          {getStockStatusText(material.available_quantity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          onClick={() => {
                            setSelectedMaterial(material);
                            setShowStockModal(true);
                          }}
                          variant="primary"
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-700"
                          title={`Update stock balance for ${material.material_code}`}
                        >
                          Update Balance
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Stock Update Modal */}
        {showStockModal && selectedMaterial && (
          <StockUpdateModal
            material={selectedMaterial}
            onSave={handleStockUpdate}
            onCancel={() => {
              setShowStockModal(false);
              setSelectedMaterial(null);
            }}
          />
        )}
          </>
        )}

        {/* MO List Tab */}
        {activeTab === 'mo_list' && <MOListTab />}
      </div>
    </div>
  );
}

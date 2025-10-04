"use client";

import { useState, useEffect } from 'react';
import { inventoryAPI } from '../API_Service/inventory-api';
import LoadingSpinner from '../CommonComponents/ui/LoadingSpinner';
import Card from '../CommonComponents/ui/Card';
import Button from '../CommonComponents/ui/Button';
import ProductForm from './ProductForm';
import StockUpdateModal from './StockUpdateModal';
import DashboardStats from './DashboardStats';

export default function RMStoreDashboard() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [productsData, statsData] = await Promise.all([
        inventoryAPI.products.getDashboard(),
        inventoryAPI.dashboard.getStats()
      ]);
      
      setProducts(productsData);
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

  // Filter products based on search and filter type
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.internal_product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.material_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || 
      (filterType === 'in_stock' && product.stock_info?.available_quantity > 0) ||
      (filterType === 'out_of_stock' && product.stock_info?.available_quantity === 0) ||
      (filterType === 'no_record' && product.stock_info?.stock_status === 'no_stock_record');

    return matchesSearch && matchesFilter;
  });

  // Handle product creation/update
  const handleProductSave = async (productData) => {
    try {
      if (editingProduct) {
        await inventoryAPI.products.update(editingProduct.id, productData);
      } else {
        await inventoryAPI.products.create(productData);
      }
      
      setShowProductForm(false);
      setEditingProduct(null);
      await fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Error saving product:', err);
      throw err; // Let the form handle the error
    }
  };

  // Handle stock update
  const handleStockUpdate = async (internalProductCode, quantity) => {
    try {
      await inventoryAPI.stockBalances.updateByProductCode(internalProductCode, quantity);
      setShowStockModal(false);
      setSelectedProduct(null);
      await fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Error updating stock:', err);
      throw err; // Let the modal handle the error
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await inventoryAPI.products.delete(productId);
      await fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product: ' + err.message);
    }
  };

  // Get stock status styling
  const getStockStatusStyle = (stockInfo) => {
    if (!stockInfo) return 'bg-gray-100 text-gray-600';
    
    switch (stockInfo.stock_status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'no_stock_record':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get stock status text
  const getStockStatusText = (stockInfo) => {
    if (!stockInfo) return 'Unknown';
    
    switch (stockInfo.stock_status) {
      case 'in_stock':
        return `In Stock (${stockInfo.available_quantity})`;
      case 'out_of_stock':
        return 'Out of Stock';
      case 'no_stock_record':
        return 'No Stock Record';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RM Store Dashboard</h1>
          <p className="text-gray-600">Manage raw material inventory, products, and stock balances</p>
        </div>

        {/* Dashboard Stats */}
        {stats && <DashboardStats stats={stats} />}

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search products..."
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
              <option value="all">All Products</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="no_record">No Stock Record</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowProductForm(true)}
              variant="primary"
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </Button>
            <Button onClick={fetchDashboardData} variant="secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Products ({filteredProducts.length})
            </h3>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'No products match your search criteria.' 
                  : 'Get started by adding your first product.'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button
                  onClick={() => setShowProductForm(true)}
                  variant="primary"
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Add First Product
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.internal_product_code}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.product_code}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.product_type_display}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.spring_type_display}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.material_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.material_type_display}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusStyle(product.stock_info)}`}>
                          {getStockStatusText(product.stock_info)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.stock_info?.last_updated 
                          ? new Date(product.stock_info.last_updated).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowStockModal(true);
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            Update Stock
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingProduct(product);
                              setShowProductForm(true);
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteProduct(product.id)}
                            variant="danger"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Product Form Modal */}
        {showProductForm && (
          <ProductForm
            product={editingProduct}
            onSave={handleProductSave}
            onCancel={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
          />
        )}

        {/* Stock Update Modal */}
        {showStockModal && selectedProduct && (
          <StockUpdateModal
            product={selectedProduct}
            onSave={handleStockUpdate}
            onCancel={() => {
              setShowStockModal(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

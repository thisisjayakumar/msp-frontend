"use client";

import { useState, useEffect } from 'react';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

export default function SimplifiedManufacturingOrderForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    product_code_id: '',
    customer_name: '',
    quantity: '',
    planned_start_date: '',
    planned_end_date: '',
    priority: 'medium',
    special_instructions: ''
  });

  const [productsList, setProductsList] = useState([]);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Fetch products list on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await manufacturingAPI.manufacturingOrders.getProducts();
        setProductsList(products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  // Handle product selection and fetch detailed product information
  const handleProductChange = async (productId) => {
    setFormData(prev => ({
      ...prev,
      product_code_id: productId
    }));

    if (!productId) {
      setSelectedProductDetails(null);
      return;
    }

    try {
      // Find the selected product to get its code
      const selectedProduct = productsList.find(p => p.id === parseInt(productId));
      if (selectedProduct) {
        // Fetch detailed product information with BOM and materials
        const productDetails = await manufacturingAPI.manufacturingOrders.getProductDetails(selectedProduct.product_code);
        console.log('Product details received:', productDetails);
        console.log('Materials array:', productDetails.materials);
        setSelectedProductDetails(productDetails);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setErrors(prev => ({
        ...prev,
        product_code_id: 'Failed to load product details'
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_code_id) newErrors.product_code_id = 'Product is required';
    if (!formData.customer_name.trim()) newErrors.customer_name = 'Customer name is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.planned_start_date) newErrors.planned_start_date = 'Start date is required';
    if (!formData.planned_end_date) newErrors.planned_end_date = 'End date is required';

    // Check if product details are loaded
    if (!selectedProductDetails) {
      newErrors.product_details = 'Product details must be loaded before submission';
    }

    // Check if end date is after start date
    if (formData.planned_start_date && formData.planned_end_date) {
      if (new Date(formData.planned_end_date) <= new Date(formData.planned_start_date)) {
        newErrors.planned_end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Convert string IDs to integers and prepare data
      const submitData = {
        ...formData,
        product_code_id: parseInt(formData.product_code_id),
        quantity: parseInt(formData.quantity)
      };

      await manufacturingAPI.manufacturingOrders.create(submitData);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);

      // Reset form
      setFormData({
        product_code_id: '',
        customer_name: '',
        quantity: '',
        planned_start_date: '',
        planned_end_date: '',
        priority: 'medium',
        special_instructions: ''
      });
      setSelectedProductDetails(null);

    } catch (error) {
      console.error('Error creating MO:', error);
      setErrors({ submit: error.message || 'Failed to create Manufacturing Order' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_code_id: '',
      customer_name: '',
      quantity: '',
      planned_start_date: '',
      planned_end_date: '',
      priority: 'medium',
      special_instructions: ''
    });
    setSelectedProductDetails(null);
    setErrors({});
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-600 mb-2">Manufacturing Order Created!</h3>
        <p className="text-slate-600">The manufacturing order has been successfully created and is pending manager approval.</p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Status:</strong> On Hold (Awaiting Manager Approval)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Create Manufacturing Order</h2>
          <p className="text-sm text-slate-600">Fill in the required information. Product details will be automatically populated from the BOM.</p>
        </div> */}

        {/* User Input Fields */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
          <h3 className="text-base font-medium text-slate-800 mb-3 flex items-center space-x-2">
            <span>📝</span>
            <span>Order Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Product Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                name="product_code_id"
                value={formData.product_code_id}
                onChange={(e) => handleProductChange(e.target.value)}
                className={`w-full px-3 py-2 text-sm text-slate-800 rounded-lg border ${
                  errors.product_code_id ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                } focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all`}
              >
                <option value="">Select Product</option>
                {productsList.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.display_name}
                  </option>
                ))}
              </select>
              {errors.product_code_id && (
                <p className="text-red-500 text-xs mt-1">{errors.product_code_id}</p>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm text-slate-800 rounded-lg border ${
                  errors.customer_name ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                } focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="Enter customer name"
              />
              {errors.customer_name && (
                <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 text-slate-800 text-sm rounded-lg border ${
                  errors.quantity ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                } focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-slate-800 text-sm rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Planned Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="planned_start_date"
                value={formData.planned_start_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm text-slate-800 rounded-lg border ${
                  errors.planned_start_date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                } focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
              {errors.planned_start_date && (
                <p className="text-red-500 text-xs mt-1">{errors.planned_start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Planned End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="planned_end_date"
                value={formData.planned_end_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm text-slate-800 rounded-lg border ${
                  errors.planned_end_date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                } focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
              {errors.planned_end_date && (
                <p className="text-red-500 text-xs mt-1">{errors.planned_end_date}</p>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          {/* <div className="mt-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">Special Instructions</label>
            <textarea
              name="special_instructions"
              value={formData.special_instructions}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Enter any special instructions..."
            />
          </div> */}
        </div>

        {/* Auto-populated Product Details - Single Compact Box */}
        {selectedProductDetails && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center space-x-1">
              <span>🔧</span>
              <span>Product Details</span>
            </h3>
            
            {/* All Details in One Compact Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs mb-2">
              <div>
                <span className="text-blue-600 font-medium">Code:</span>
                <div className="text-slate-700">{selectedProductDetails.product.product_code}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Type:</span>
                <div className="text-slate-700">{selectedProductDetails.auto_populate_data.product_type || 'N/A'}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">RM/Unit:</span>
                <div className="text-slate-700">{selectedProductDetails.auto_populate_data.rm_consumption_per_unit || 'N/A'} kg</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Material:</span>
                <div className="text-slate-700">{selectedProductDetails.auto_populate_data.material_type || 'N/A'}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Name:</span>
                <div className="text-slate-700">{selectedProductDetails.auto_populate_data.material_name || 'N/A'}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Grade:</span>
                <div className="text-slate-700">{selectedProductDetails.auto_populate_data.grade || 'N/A'}</div>
              </div>
              {selectedProductDetails.auto_populate_data.wire_diameter_mm && (
                <div>
                  <span className="text-blue-600 font-medium">Wire Dia:</span>
                  <div className="text-slate-700">{selectedProductDetails.auto_populate_data.wire_diameter_mm} mm</div>
                </div>
              )}
              {selectedProductDetails.auto_populate_data.thickness_mm && (
                <div>
                  <span className="text-blue-600 font-medium">Thickness:</span>
                  <div className="text-slate-700">{selectedProductDetails.auto_populate_data.thickness_mm} mm</div>
                </div>
              )}
              <div>
                <span className="text-blue-600 font-medium">Finishing:</span>
                <div className="text-slate-700">{selectedProductDetails.auto_populate_data.finishing || 'N/A'}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Manufacturer:</span>
                <div className="text-slate-700">{selectedProductDetails.auto_populate_data.manufacturer_brand || 'N/A'}</div>
              </div>
            </div>

            {/* Raw Materials - Inline */}
            {selectedProductDetails.bom_items && selectedProductDetails.bom_items.length > 0 && (
              <div className="border-t border-blue-200 pt-2 mt-2">
                <span className="text-xs font-medium text-blue-700">Raw Materials: </span>
                <span className="text-xs text-slate-600">
                  {(() => {
                    // Deduplicate materials by material_code
                    const uniqueMaterials = [];
                    const seenMaterialCodes = new Set();
                    
                    selectedProductDetails.bom_items.forEach(bomItem => {
                      if (bomItem.material && bomItem.material.material_code && !seenMaterialCodes.has(bomItem.material.material_code)) {
                        uniqueMaterials.push(bomItem.material);
                        seenMaterialCodes.add(bomItem.material.material_code);
                      }
                    });
                    
                    return uniqueMaterials.map(material => 
                      `${material?.material_code || 'N/A'} (${material?.material_name || 'N/A'})`
                    ).join(', ');
                  })()}
                </span>
              </div>
            )}

            {/* Processes - Inline */}
            {selectedProductDetails.processes && selectedProductDetails.processes.length > 0 && (
              <div className="border-t border-blue-200 pt-2 mt-2">
                <span className="text-xs font-medium text-blue-700">Processes: </span>
                <span className="text-xs text-slate-600">
                  {selectedProductDetails.processes.map((process, index) => 
                    `${index + 1}. ${process.name}`
                  ).join(' → ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-xs">{errors.submit}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/25"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </div>
            ) : (
              'Create MO'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

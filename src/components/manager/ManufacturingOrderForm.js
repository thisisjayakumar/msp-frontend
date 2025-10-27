"use client";

import { useState, useEffect } from 'react';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import SearchableDropdown from '@/components/CommonComponents/ui/SearchableDropdown';

export default function ManufacturingOrderForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    product_code_id: '',
    customer_id: '',
    customer_name: '',
    quantity: '',
    planned_start_date: '',
    planned_end_date: '',
    priority: 'medium',
    special_instructions: ''
  });

  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Fetch products and customers list on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [products, customers] = await Promise.all([
          manufacturingAPI.manufacturingOrders.getProducts(),
          manufacturingAPI.manufacturingOrders.getCustomers()
        ]);
        setProductsList(products);
        setCustomersList(customers);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  // Handle product selection and fetch detailed product information
  const handleProductChange = async (productId) => {
    setFormData(prev => ({
      ...prev,
      product_code_id: productId
    }));

    // Clear error for this field
    if (errors.product_code_id) {
      setErrors(prev => ({
        ...prev,
        product_code_id: ''
      }));
    }

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
        console.log('Product details received in ManufacturingOrderForm:', productDetails);
        console.log('BOM items array:', productDetails.bom_items);
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

  // Handle customer selection
  const handleCustomerChange = (customerId) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customerId
    }));

    // Clear error for this field
    if (errors.customer_id) {
      setErrors(prev => ({
        ...prev,
        customer_id: ''
      }));
    }

    // Auto-populate customer name
    if (customerId) {
      const selectedCustomer = customersList.find(c => c.id === parseInt(customerId));
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customer_name: selectedCustomer.name
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        customer_name: ''
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
    if (!formData.customer_id) newErrors.customer_id = 'Customer is required';
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
      // Prepare data for submission (customer_id and customer_name are only for UI reference)
      const submitData = {
        product_code_id: parseInt(formData.product_code_id),
        quantity: parseInt(formData.quantity),
        planned_start_date: formData.planned_start_date,
        planned_end_date: formData.planned_end_date,
        priority: formData.priority,
        special_instructions: formData.special_instructions
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
        customer_id: '',
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
      customer_id: '',
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
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Form Fields */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center space-x-2">
            <span>📝</span>
            <span>Manufacturing Order Information</span>
          </h3>

          {/* Basic Order Information */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-slate-700 mb-4 pb-2 border-b border-slate-200">Basic Information</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={productsList}
                  value={formData.product_code_id}
                  onChange={handleProductChange}
                  placeholder="Search and select product..."
                  displayKey="display_name"
                  valueKey="id"
                  searchKeys={["display_name", "product_code", "description"]}
                  error={!!errors.product_code_id}
                  className="w-full"
                  loading={productsList.length === 0}
                />
                {errors.product_code_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.product_code_id}</p>
                )}
              </div>

              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={customersList}
                  value={formData.customer_id}
                  onChange={handleCustomerChange}
                  placeholder="Search and select customer..."
                  displayKey="display_name"
                  valueKey="id"
                  searchKeys={["name", "c_id", "display_name", "industry_type_display", "gst_no"]}
                  error={!!errors.customer_id}
                  className="w-full"
                  loading={customersList.length === 0}
                />
                {errors.customer_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer_id}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.quantity ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                  } focus:ring-2 focus:ring-blue-500 text-slate-700 focus:border-transparent transition-all`}
                  placeholder="Enter quantity"
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-slate-700 mb-4 pb-2 border-b border-slate-200 flex items-center space-x-2">
              <span>🔧</span>
              <span>Product Specifications</span>
              {!selectedProductDetails && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  Select product to populate
                </span>
              )}
            </h4>
            
            {/* Basic Product Information */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
              <h5 className="font-medium text-blue-800 mb-3">Basic Information</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-600 mb-1">Product Code</label>
                  <input
                    type="text"
                    value={selectedProductDetails?.product?.product_code || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-blue-200 bg-blue-50/50 text-slate-700 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-600 mb-1">Product Type</label>
                  <input
                    type="text"
                    value={selectedProductDetails?.auto_populate_data?.product_type || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-blue-200 bg-blue-50/50 text-slate-700 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-600 mb-1">RM Consumption/Unit (kg)</label>
                  <input
                    type="text"
                    value={selectedProductDetails?.auto_populate_data?.rm_consumption_per_unit || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-blue-200 bg-blue-50/50 text-slate-700 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                </div>
              </div>
            </div>

            {/* Material Information */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-6">
              <h5 className="font-medium text-green-800 mb-3">Material Specifications</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-green-600 mb-1">Material Type</label>
                  <input
                    type="text"
                    value={selectedProductDetails?.auto_populate_data?.material_type || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-green-200 bg-green-50/50 text-slate-700 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-600 mb-1">Material Name</label>
                  <input
                    type="text"
                    value={selectedProductDetails?.auto_populate_data?.material_name || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-green-200 bg-green-50/50 text-slate-700 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-600 mb-1">Grade</label>
                  <input
                    type="text"
                    value={selectedProductDetails?.auto_populate_data?.grade || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-green-200 bg-green-50/50 text-slate-700 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-600 mb-1">Wire Diameter (mm)</label>
                  <input
                    type="text"
                    value={selectedProductDetails?.auto_populate_data?.wire_diameter_mm || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-green-200 bg-green-50/50 text-slate-700 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-600 mb-1">Thickness (mm)</label>
                  <input
                    type="text"
                    value={selectedProductDetails?.auto_populate_data?.thickness_mm || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-green-200 bg-green-50/50 text-slate-700 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-600 mb-1">Finishing</label>
                  <input
                    type="text"
                    value={selectedProductDetails?.auto_populate_data?.finishing || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-green-200 bg-green-50/50 text-slate-700 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-600 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={selectedProductDetails?.auto_populate_data?.manufacturer_brand || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm rounded-lg border border-green-200 bg-green-50/50 text-slate-700 cursor-not-allowed"
                    placeholder="Auto-populated"
                  />
                </div>
              </div>
            </div>

            {/* Manufacturing Processes */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mb-6">
              <h5 className="font-medium text-purple-800 mb-3">Manufacturing Processes</h5>
              {selectedProductDetails?.processes && selectedProductDetails.processes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedProductDetails.processes.map((process, index) => (
                    <div key={process.id} className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center space-x-2">
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700">{process.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Code: {process.code}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  Select a product to view manufacturing processes
                </div>
              )}
            </div>

            {/* Raw Materials */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <h5 className="font-medium text-orange-800 mb-3">Required Raw Materials</h5>
              {selectedProductDetails?.bom_items && selectedProductDetails.bom_items.length > 0 ? (
                <div className="space-y-3">
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
                    
                    console.log('Unique materials in ManufacturingOrderForm:', uniqueMaterials);
                    
                    return uniqueMaterials.map((material, index) => (
                      <div key={material.material_code || index} className="bg-white rounded-lg p-3 border border-orange-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-orange-600 font-medium">Material Code:</span>
                            <span className="ml-2 text-slate-700">{material?.material_code || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-orange-600 font-medium">Material Name:</span>
                            <span className="ml-2 text-slate-700">{material?.material_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-orange-600 font-medium">Type:</span>
                            <span className="ml-2 text-slate-700">{material?.material_type_display || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mt-2">
                          <div>
                            <span className="text-orange-600 font-medium">Grade:</span>
                            <span className="ml-2 text-slate-700">{material?.grade || 'N/A'}</span>
                          </div>
                          {material?.wire_diameter_mm && (
                            <div>
                              <span className="text-orange-600 font-medium">Wire Diameter:</span>
                              <span className="ml-2 text-slate-700">{material.wire_diameter_mm} mm</span>
                            </div>
                          )}
                          {material?.thickness_mm && (
                            <div>
                              <span className="text-orange-600 font-medium">Thickness:</span>
                              <span className="ml-2 text-slate-700">{material.thickness_mm} mm</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  Select a product to view required raw materials
                </div>
              )}
            </div>
          </div>

          {/* Schedule Information */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-slate-700 mb-4 pb-2 border-b border-slate-200">Schedule Information</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Planned Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="planned_start_date"
                  value={formData.planned_start_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl text-slate-700 border ${
                    errors.planned_start_date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                />
                {errors.planned_start_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.planned_start_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Planned End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="planned_end_date"
                  value={formData.planned_end_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl text-slate-700 border ${
                    errors.planned_end_date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                />
                {errors.planned_end_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.planned_end_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h4 className="text-md font-medium text-slate-700 mb-4 pb-2 border-b border-slate-200">Additional Information</h4>
            <div className="space-y-4">
              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Special Instructions</label>
                <textarea
                  name="special_instructions"
                  value={formData.special_instructions}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border text-slate-700 border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Enter any special instructions..."
                />
              </div>
            </div>
          </div>
        </div>


        {/* Error Messages */}
        {(errors.submit || errors.product_details) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            {errors.submit && <p className="text-red-600 text-sm">{errors.submit}</p>}
            {errors.product_details && <p className="text-red-600 text-sm">{errors.product_details}</p>}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/25"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </div>
            ) : (
              'Create Manufacturing Order'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
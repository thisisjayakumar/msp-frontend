"use client";

import { useState, useEffect } from 'react';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

export default function ManufacturingOrderForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    product_code_id: '',
    quantity: '',
    assigned_supervisor_id: '',
    shift: 'I',
    planned_start_date: '',
    planned_end_date: '',
    priority: 'medium',
    delivery_date: '',
    customer_order_reference: '',
    special_instructions: ''
  });

  const [dropdownData, setDropdownData] = useState({
    products: [],
    supervisors: []
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [products, supervisors] = await Promise.all([
          manufacturingAPI.manufacturingOrders.getProducts(),
          manufacturingAPI.manufacturingOrders.getSupervisors()
        ]);
        
        setDropdownData({ products, supervisors });
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  // Handle product selection and auto-populate fields
  const handleProductChange = (productId) => {
    const product = dropdownData.products.find(p => p.id === parseInt(productId));
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      product_code_id: productId
    }));
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
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.assigned_supervisor_id) newErrors.assigned_supervisor_id = 'Supervisor is required';
    if (!formData.planned_start_date) newErrors.planned_start_date = 'Start date is required';
    if (!formData.planned_end_date) newErrors.planned_end_date = 'End date is required';

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
      // Convert string IDs to integers
      const submitData = {
        ...formData,
        product_code_id: parseInt(formData.product_code_id),
        assigned_supervisor_id: parseInt(formData.assigned_supervisor_id),
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
        quantity: '',
        assigned_supervisor_id: '',
        shift: 'I',
        planned_start_date: '',
        planned_end_date: '',
        priority: 'medium',
        delivery_date: '',
        customer_order_reference: '',
        special_instructions: ''
      });
      setSelectedProduct(null);

    } catch (error) {
      console.error('Error creating MO:', error);
      setErrors({ submit: error.message || 'Failed to create Manufacturing Order' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-600 mb-2">Manufacturing Order Created!</h3>
        <p className="text-slate-600">The manufacturing order has been successfully created.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            name="product_code_id"
            value={formData.product_code_id}
            onChange={(e) => handleProductChange(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.product_code_id ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          >
            <option value="">Select Product</option>
            {dropdownData.products.map(product => (
              <option key={product.id} value={product.id}>
                {product.display_name}
              </option>
            ))}
          </select>
          {errors.product_code_id && (
            <p className="text-red-500 text-sm mt-1">{errors.product_code_id}</p>
          )}
        </div>

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
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            placeholder="Enter quantity"
          />
          {errors.quantity && (
            <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
          )}
        </div>
      </div>

      {/* Auto-populated Product Details */}
      {selectedProduct && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-3 flex items-center space-x-2">
            <span>ℹ️</span>
            <span>Product Details (Auto-populated)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Product Code:</span>
              <span className="ml-2 text-slate-700">{selectedProduct.product_code}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Part Number:</span>
              <span className="ml-2 text-slate-700">{selectedProduct.part_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Part Name:</span>
              <span className="ml-2 text-slate-700">{selectedProduct.part_name || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Assignment & Planning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Assigned Supervisor <span className="text-red-500">*</span>
          </label>
          <select
            name="assigned_supervisor_id"
            value={formData.assigned_supervisor_id}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.assigned_supervisor_id ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          >
            <option value="">Select Supervisor</option>
            {dropdownData.supervisors.map(supervisor => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.display_name}
              </option>
            ))}
          </select>
          {errors.assigned_supervisor_id && (
            <p className="text-red-500 text-sm mt-1">{errors.assigned_supervisor_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Shift</label>
          <select
            name="shift"
            value={formData.shift}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="I">Shift I (9AM-5PM)</option>
            <option value="II">Shift II (5PM-2AM)</option>
            <option value="III">Shift III (2AM-9AM)</option>
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Planned Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="planned_start_date"
            value={formData.planned_start_date}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 rounded-xl border ${
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
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.planned_end_date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          />
          {errors.planned_end_date && (
            <p className="text-red-500 text-sm mt-1">{errors.planned_end_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Date</label>
          <input
            type="date"
            name="delivery_date"
            value={formData.delivery_date}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Priority & Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Customer Order Reference</label>
          <input
            type="text"
            name="customer_order_reference"
            value={formData.customer_order_reference}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter customer reference"
          />
        </div>
      </div>

      {/* Special Instructions */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Special Instructions</label>
        <textarea
          name="special_instructions"
          value={formData.special_instructions}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          placeholder="Enter any special instructions..."
        />
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => {
            setFormData({
              product_code_id: '',
              quantity: '',
              assigned_supervisor_id: '',
              shift: 'I',
              planned_start_date: '',
              planned_end_date: '',
              priority: 'medium',
              delivery_date: '',
              customer_order_reference: '',
              special_instructions: ''
            });
            setSelectedProduct(null);
            setErrors({});
          }}
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
  );
}

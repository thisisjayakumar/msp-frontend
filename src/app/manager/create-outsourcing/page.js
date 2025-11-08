"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import outsourcingAPI from '@/components/API_Service/outsourcing-api';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';

export default function CreateOutsourcingRequest() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({
    vendor_id: '',
    expected_return_date: '',
    vendor_contact_person: '',
    notes: '',
    items_data: [
      {
        mo_number: '',
        product_code: '',
        qty: '',
        kg: '',
        notes: ''
      }
    ]
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      
      if (!token || (role !== 'manager' && role !== 'production_head' && role !== 'supervisor')) {
        router.push('/login');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
    fetchVendors();
  }, [router]);

  const fetchVendors = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/third-party/vendors/?vendor_type=outsource_vendor`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVendors(data.results || data || []);
      } else {
        console.error('Failed to fetch vendors:', response.status);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
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
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items_data];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return {
        ...prev,
        items_data: newItems
      };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items_data: [
        ...prev.items_data,
        {
          mo_number: '',
          product_code: '',
          qty: '',
          kg: '',
          notes: ''
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items_data.length > 1) {
      setFormData(prev => ({
        ...prev,
        items_data: prev.items_data.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendor_id) {
      newErrors.vendor_id = 'Vendor is required';
    }

    if (!formData.expected_return_date) {
      newErrors.expected_return_date = 'Expected return date is required';
    }

    // Validate items
    formData.items_data.forEach((item, index) => {
      if (!item.mo_number) {
        newErrors[`item_${index}_mo_number`] = 'MO Number is required';
      }
      if (!item.product_code) {
        newErrors[`item_${index}_product_code`] = 'Product Code is required';
      }
      if (!item.qty || parseFloat(item.qty) <= 0) {
        newErrors[`item_${index}_qty`] = 'Valid quantity is required';
      }
      if (!item.kg || parseFloat(item.kg) <= 0) {
        newErrors[`item_${index}_kg`] = 'Valid weight (kg) is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Prepare data for API
      const requestData = {
        vendor_id: parseInt(formData.vendor_id),
        expected_return_date: formData.expected_return_date,
        vendor_contact_person: formData.vendor_contact_person || '',
        notes: formData.notes || '',
        items_data: formData.items_data.map(item => ({
          mo_number: item.mo_number,
          product_code: item.product_code,
          qty: parseInt(item.qty),
          kg: parseFloat(item.kg),
          notes: item.notes || ''
        }))
      };

      const result = await outsourcingAPI.create(requestData);
      
      // Handle response - apiRequest returns { success: true, data: {...} } or { success: false, error: "..." }
      if (result?.error || !result?.success) {
        const errorMessage = result?.error || result?.message || 'Failed to create outsourcing request';
        alert(`Error: ${errorMessage}`);
      } else {
        // Success - result.data contains the created request
        alert('Outsourcing request created successfully!');
        router.push('/manager/outsourcing');
      }
    } catch (error) {
      console.error('Error creating outsourcing request:', error);
      alert('Error creating outsourcing request. Please try again.');
    } finally {
      setSubmitting(false);
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
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Create Outsourcing Request
              </h1>
              <p className="mt-1 text-blue-100">
                Create a new outsourcing request for external vendor processing
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors backdrop-blur-sm"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          {/* Vendor Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor <span className="text-red-500">*</span>
            </label>
            <select
              name="vendor_id"
              value={formData.vendor_id}
              onChange={handleInputChange}
              className={`w-full border rounded-md px-3 text-slate-500 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.vendor_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a vendor</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            {errors.vendor_id && (
              <p className="mt-1 text-sm text-red-500">{errors.vendor_id}</p>
            )}
          </div>

          {/* Expected Return Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Return Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="expected_return_date"
              value={formData.expected_return_date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full border text-slate-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.expected_return_date ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.expected_return_date && (
              <p className="mt-1 text-sm text-red-500">{errors.expected_return_date}</p>
            )}
          </div>

          {/* Vendor Contact Person */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Contact Person
            </label>
            <input
              type="text"
              name="vendor_contact_person"
              value={formData.vendor_contact_person}
              onChange={handleInputChange}
              placeholder="Contact person at vendor"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional notes about this outsourcing request"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Items Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Item
              </button>
            </div>

            {formData.items_data.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Item {index + 1}</h4>
                  {formData.items_data.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MO Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.mo_number}
                      onChange={(e) => handleItemChange(index, 'mo_number', e.target.value)}
                      placeholder="MO-20240115-0001"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`item_${index}_mo_number`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors[`item_${index}_mo_number`] && (
                      <p className="mt-1 text-xs text-red-500">{errors[`item_${index}_mo_number`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.product_code}
                      onChange={(e) => handleItemChange(index, 'product_code', e.target.value)}
                      placeholder="PROD-001"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`item_${index}_product_code`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors[`item_${index}_product_code`] && (
                      <p className="mt-1 text-xs text-red-500">{errors[`item_${index}_product_code`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      placeholder="1000"
                      min="1"
                      step="1"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`item_${index}_qty`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors[`item_${index}_qty`] && (
                      <p className="mt-1 text-xs text-red-500">{errors[`item_${index}_qty`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.kg}
                      onChange={(e) => handleItemChange(index, 'kg', e.target.value)}
                      placeholder="5.5"
                      min="0"
                      step="0.001"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`item_${index}_kg`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors[`item_${index}_kg`] && (
                      <p className="mt-1 text-xs text-red-500">{errors[`item_${index}_kg`]}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Notes
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      placeholder="Optional notes for this item"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}


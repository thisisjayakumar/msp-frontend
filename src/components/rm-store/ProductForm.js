"use client";

import { useState, useEffect } from 'react';
import { inventoryAPI } from '../API_Service/inventory-api';
import Card from '../CommonComponents/ui/Card';
import Button from '../CommonComponents/ui/Button';
import Input from '../CommonComponents/ui/Input';
import LoadingSpinner from '../CommonComponents/ui/LoadingSpinner';

export default function ProductForm({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    internal_product_code: '',
    product_code: '',
    product_type: 'spring',
    spring_type: 'tension',
    material: ''
  });
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const isEditing = !!product;

  // Product type options
  const productTypeOptions = [
    { value: 'spring', label: 'Spring' },
    { value: 'press_component', label: 'Press Component' }
  ];

  // Spring type options
  const springTypeOptions = [
    { value: 'tension', label: 'Tension Spring' },
    { value: 'wire_form', label: 'Wire Form Spring' },
    { value: 'compression', label: 'Compression Spring' },
    { value: 'torsion', label: 'Torsion Spring' },
    { value: 'clip', label: 'Clip' },
    { value: 'rivet', label: 'Rivet' },
    { value: 'helical', label: 'Helical Spring' },
    { value: 'length_pin', label: 'Length Pin' },
    { value: 'length_rod', label: 'Length Rod' },
    { value: 'double_torsion', label: 'Double Torsion Spring' },
    { value: 'cotter_pin', label: 'Cotter Pin' },
    { value: 'conical', label: 'Conical Spring' },
    { value: 'ring', label: 'Ring' },
    { value: 's-spring', label: 'S-Spring' }
  ];

  // Load raw materials and set form data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingMaterials(true);
        const materialsData = await inventoryAPI.rawMaterials.getDropdown();
        setRawMaterials(materialsData);

        // Set form data if editing
        if (product) {
          setFormData({
            internal_product_code: product.internal_product_code || '',
            product_code: product.product_code || '',
            product_type: product.product_type || 'spring',
            spring_type: product.spring_type || 'tension',
            material: product.material_details?.id || ''
          });
        }
      } catch (err) {
        console.error('Error loading raw materials:', err);
        setError('Failed to load raw materials');
      } finally {
        setLoadingMaterials(false);
      }
    };

    loadData();
  }, [product]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.internal_product_code.trim()) {
      errors.internal_product_code = 'Internal product code is required';
    }

    if (!formData.product_code.trim()) {
      errors.product_code = 'Product code is required';
    }

    if (!formData.material) {
      errors.material = 'Material selection is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert material to integer
      const submitData = {
        ...formData,
        material: parseInt(formData.material)
      };

      await onSave(submitData);
    } catch (err) {
      console.error('Error saving product:', err);
      
      // Handle validation errors from backend
      if (err.message.includes('already exists')) {
        if (err.message.includes('Internal product code')) {
          setFieldErrors({ internal_product_code: 'Internal product code already exists' });
        } else if (err.message.includes('Product code')) {
          setFieldErrors({ product_code: 'Product code already exists' });
        }
      } else {
        setError(err.message || 'Failed to save product');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loadingMaterials ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Loading materials...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Codes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="internal_product_code" className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Product Code *
                  </label>
                  <Input
                    id="internal_product_code"
                    name="internal_product_code"
                    type="text"
                    value={formData.internal_product_code}
                    onChange={handleChange}
                    placeholder="e.g., ABC123"
                    error={fieldErrors.internal_product_code}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="product_code" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Code *
                  </label>
                  <Input
                    id="product_code"
                    name="product_code"
                    type="text"
                    value={formData.product_code}
                    onChange={handleChange}
                    placeholder="e.g., SPR-001"
                    error={fieldErrors.product_code}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Product Type */}
              <div>
                <label htmlFor="product_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type *
                </label>
                <select
                  id="product_type"
                  name="product_type"
                  value={formData.product_type}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {productTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Spring Type (only show if product type is spring) */}
              {formData.product_type === 'spring' && (
                <div>
                  <label htmlFor="spring_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Spring Type *
                  </label>
                  <select
                    id="spring_type"
                    name="spring_type"
                    value={formData.spring_type}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {springTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Material Selection */}
              <div>
                <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-2">
                  Raw Material *
                </label>
                <select
                  id="material"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    fieldErrors.material ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a raw material...</option>
                  {rawMaterials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.display_name}
                    </option>
                  ))}
                </select>
                {fieldErrors.material && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.material}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="secondary"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditing ? 'Update Product' : 'Create Product'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}

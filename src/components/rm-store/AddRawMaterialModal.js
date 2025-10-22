"use client";

import { useState } from 'react';
import Button from '../CommonComponents/ui/Button';
import Input from '../CommonComponents/ui/Input';
import { toast } from '@/utils/notifications';
import { rawMaterialsAPI } from '../API_Service/inventory-api';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function AddRawMaterialModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    material_code: '',
    material_name: '',
    material_type: 'coil', // Default to coil
    grade: '',
    finishing: '',
    wire_diameter_mm: '',
    weight_kg: '',
    thickness_mm: '',
    length_mm: '',
    breadth_mm: '',
    quantity: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.material_code.trim()) {
      newErrors.material_code = 'Material code is required';
    }
    if (!formData.material_name.trim()) {
      newErrors.material_name = 'Material name is required';
    }
    if (!formData.material_type) {
      newErrors.material_type = 'Material type is required';
    }
    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade is required';
    }

    // Type-specific validation
    if (formData.material_type === 'coil') {
      if (!formData.wire_diameter_mm) {
        newErrors.wire_diameter_mm = 'Wire diameter is required for Coil materials';
      } else if (parseFloat(formData.wire_diameter_mm) <= 0) {
        newErrors.wire_diameter_mm = 'Wire diameter must be greater than 0';
      }
      
      // Weight is optional for coil, but if provided must be positive
      if (formData.weight_kg && parseFloat(formData.weight_kg) <= 0) {
        newErrors.weight_kg = 'Weight must be greater than 0';
      }
    } else if (formData.material_type === 'sheet') {
      if (!formData.thickness_mm) {
        newErrors.thickness_mm = 'Thickness is required for Sheet materials';
      } else if (parseFloat(formData.thickness_mm) <= 0) {
        newErrors.thickness_mm = 'Thickness must be greater than 0';
      }
      
      // Quantity is optional for sheet
      if (formData.quantity && parseInt(formData.quantity) <= 0) {
        newErrors.quantity = 'Quantity must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);

      // Prepare data for submission - only include relevant fields
      const submitData = {
        material_code: formData.material_code.trim(),
        material_name: formData.material_name.trim(),
        material_type: formData.material_type,
        grade: formData.grade.trim(),
      };

      // Add optional fields if provided
      if (formData.finishing) {
        submitData.finishing = formData.finishing;
      }

      // Type-specific fields
      if (formData.material_type === 'coil') {
        submitData.wire_diameter_mm = parseFloat(formData.wire_diameter_mm);
        if (formData.weight_kg) {
          submitData.weight_kg = parseFloat(formData.weight_kg);
        }
      } else if (formData.material_type === 'sheet') {
        submitData.thickness_mm = parseFloat(formData.thickness_mm);
        if (formData.length_mm) {
          submitData.length_mm = parseFloat(formData.length_mm);
        }
        if (formData.breadth_mm) {
          submitData.breadth_mm = parseFloat(formData.breadth_mm);
        }
        if (formData.quantity) {
          submitData.quantity = parseInt(formData.quantity);
        }
      }

      const response = await rawMaterialsAPI.create(submitData);

      if (response.error) {
        // Handle validation errors from backend
        if (response.details) {
          const backendErrors = {};
          Object.keys(response.details).forEach(key => {
            backendErrors[key] = Array.isArray(response.details[key]) 
              ? response.details[key][0] 
              : response.details[key];
          });
          setErrors(backendErrors);
          toast.error('Please fix the errors in the form');
        } else {
          toast.error(response.message || 'Failed to create raw material');
        }
        return;
      }

      toast.success('Raw material created successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating raw material:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Raw Material</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Material Code */}
          <div>
            <label htmlFor="material_code" className="block text-sm font-medium text-gray-700 mb-2">
              Material Code <span className="text-red-500">*</span>
            </label>
            <Input
              id="material_code"
              name="material_code"
              type="text"
              value={formData.material_code}
              onChange={handleChange}
              placeholder="e.g., RM-COIL-001"
              disabled={loading}
              className={errors.material_code ? 'border-red-500' : ''}
            />
            {errors.material_code && (
              <p className="mt-1 text-sm text-red-600">{errors.material_code}</p>
            )}
          </div>

          {/* Material Name */}
          <div>
            <label htmlFor="material_name" className="block text-sm font-medium text-gray-700 mb-2">
              Material Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="material_name"
              name="material_name"
              type="text"
              value={formData.material_name}
              onChange={handleChange}
              placeholder="e.g., Stainless Steel Wire"
              disabled={loading}
              className={errors.material_name ? 'border-red-500' : ''}
            />
            {errors.material_name && (
              <p className="mt-1 text-sm text-red-600">{errors.material_name}</p>
            )}
          </div>

          {/* Material Type */}
          <div>
            <label htmlFor="material_type" className="block text-sm font-medium text-gray-700 mb-2">
              Material Type <span className="text-red-500">*</span>
            </label>
            <select
              id="material_type"
              name="material_type"
              value={formData.material_type}
              onChange={handleChange}
              disabled={loading}
              className="w-full border text-slate-500 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="coil" className='text-slate-500'>Coil</option>
              <option value="sheet" className='text-slate-500'>Sheet</option>
            </select>
            {errors.material_type && (
              <p className="mt-1 text-sm text-red-600">{errors.material_type}</p>
            )}
          </div>

          {/* Grade */}
          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
              Grade <span className="text-red-500">*</span>
            </label>
            <Input
              id="grade"
              name="grade"
              type="text"
              value={formData.grade}
              onChange={handleChange}
              placeholder="e.g., 304, 316, EN10270"
              disabled={loading}
              className={errors.grade ? 'border-red-500' : ''}
            />
            {errors.grade && (
              <p className="mt-1 text-sm text-red-600">{errors.grade}</p>
            )}
          </div>

          {/* Finishing (Optional) */}
          <div>
            <label htmlFor="finishing" className="block text-sm font-medium text-gray-700 mb-2">
              Finishing
            </label>
            <select
              id="finishing"
              name="finishing"
              value={formData.finishing}
              onChange={handleChange}
              disabled={loading}
              className="w-full border text-slate-500 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="" className='text-slate-500'>Select Finishing (Optional)</option>
              <option value="soap_coated" className='text-slate-500'>Soap Coated</option>
              <option value="bright" className='text-slate-500'>Bright</option>
            </select>
          </div>

          {/* Conditional Fields Based on Material Type */}
          {formData.material_type === 'coil' ? (
            <>
              {/* Wire Diameter */}
              <div>
                <label htmlFor="wire_diameter_mm" className="block text-sm font-medium text-gray-700 mb-2">
                  Wire Diameter (mm) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="wire_diameter_mm"
                  name="wire_diameter_mm"
                  type="number"
                  step="0.001"
                  value={formData.wire_diameter_mm}
                  onChange={handleChange}
                  placeholder="e.g., 2.5"
                  disabled={loading}
                  className={errors.wire_diameter_mm ? 'border-red-500' : ''}
                />
                {errors.wire_diameter_mm && (
                  <p className="mt-1 text-sm text-red-600">{errors.wire_diameter_mm}</p>
                )}
              </div>

              {/* Weight (Optional) */}
              <div>
                <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-700 mb-2">
                  Weight per Coil (KG)
                </label>
                <Input
                  id="weight_kg"
                  name="weight_kg"
                  type="number"
                  step="0.001"
                  value={formData.weight_kg}
                  onChange={handleChange}
                  placeholder="e.g., 50.0"
                  disabled={loading}
                  className={errors.weight_kg ? 'border-red-500' : ''}
                />
                {errors.weight_kg && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight_kg}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Optional: Standard weight per coil</p>
              </div>
            </>
          ) : (
            <>
              {/* Thickness */}
              <div>
                <label htmlFor="thickness_mm" className="block text-sm font-medium text-gray-700 mb-2">
                  Thickness (mm) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="thickness_mm"
                  name="thickness_mm"
                  type="number"
                  step="0.001"
                  value={formData.thickness_mm}
                  onChange={handleChange}
                  placeholder="e.g., 1.5"
                  disabled={loading}
                  className={errors.thickness_mm ? 'border-red-500' : ''}
                />
                {errors.thickness_mm && (
                  <p className="mt-1 text-sm text-red-600">{errors.thickness_mm}</p>
                )}
              </div>

              {/* Sheet Dimensions (Optional) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="length_mm" className="block text-sm font-medium text-gray-700 mb-2">
                    Length (mm)
                  </label>
                  <Input
                    id="length_mm"
                    name="length_mm"
                    type="number"
                    step="0.001"
                    value={formData.length_mm}
                    onChange={handleChange}
                    placeholder="e.g., 1000"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="breadth_mm" className="block text-sm font-medium text-gray-700 mb-2">
                    Breadth (mm)
                  </label>
                  <Input
                    id="breadth_mm"
                    name="breadth_mm"
                    type="number"
                    step="0.001"
                    value={formData.breadth_mm}
                    onChange={handleChange}
                    placeholder="e.g., 500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Quantity (Optional) */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Standard Quantity (Sheets)
                </label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="e.g., 100"
                  disabled={loading}
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Optional: Standard number of sheets</p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
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
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Raw Material'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


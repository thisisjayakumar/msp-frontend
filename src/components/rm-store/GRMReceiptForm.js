"use client";

import { useState, useEffect } from 'react';
import { toast } from '@/utils/notifications';
import Button from '../CommonComponents/ui/Button';
import { apiRequest } from '../API_Service/api-utils';
import { INVENTORY_APIS } from '../API_Service/api-list';
import { rawMaterialsAPI } from '../API_Service/inventory-api';
import { 
  TruckIcon, PlusIcon, XMarkIcon, 
  CheckCircleIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function GRMReceiptForm({ purchaseOrder, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    truck_number: '',
    driver_name: '',
    heat_numbers: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rawMaterials, setRawMaterials] = useState([]);

  // Initialize with one heat number and load raw materials
  useEffect(() => {
    if (formData.heat_numbers.length === 0) {
      addHeatNumber();
    }
    
    // Load raw materials
    const loadRawMaterials = async () => {
      try {
        const materials = await rawMaterialsAPI.getDropdown();
        setRawMaterials(materials);
      } catch (err) {
        console.error('Error loading raw materials:', err);
        toast.error('Failed to load raw materials');
      }
    };
    
    loadRawMaterials();
  }, []);

  const addHeatNumber = () => {
    setFormData(prev => ({
      ...prev,
      heat_numbers: [
        ...prev.heat_numbers,
        {
          heat_number: '',
          raw_material: '',
          coils_received: '',
          total_weight_kg: '',
          sheets_received: '',
          test_certificate_date: ''
        }
      ]
    }));
  };

  const removeHeatNumber = (index) => {
    if (formData.heat_numbers.length > 1) {
      setFormData(prev => ({
        ...prev,
        heat_numbers: prev.heat_numbers.filter((_, i) => i !== index)
      }));
    }
  };

  const updateHeatNumber = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      heat_numbers: prev.heat_numbers.map((heat, i) => 
        i === index ? { ...heat, [field]: value } : heat
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate basic fields
    if (!formData.truck_number.trim()) {
      newErrors.truck_number = 'Truck number is required';
    }
    if (!formData.driver_name.trim()) {
      newErrors.driver_name = 'Driver name is required';
    }

    // Validate heat numbers
    formData.heat_numbers.forEach((heat, index) => {
      if (!heat.heat_number.trim()) {
        newErrors[`heat_${index}_number`] = 'Heat number is required';
      }
      if (!heat.raw_material) {
        newErrors[`heat_${index}_material`] = 'Raw material is required';
      }
      
      // Validate total weight - it's required
      if (!heat.total_weight_kg || heat.total_weight_kg.trim() === '') {
        newErrors[`heat_${index}_weight`] = 'Total weight is required';
      } else if (parseFloat(heat.total_weight_kg) <= 0) {
        newErrors[`heat_${index}_weight`] = 'Total weight must be greater than 0';
      }
      
      // Find the raw material to check its type
      const selectedMaterial = rawMaterials.find(m => m.id === parseInt(heat.raw_material));
      if (selectedMaterial) {
        // Validate quantities based on material type
        if (selectedMaterial.material_type === 'coil') {
          if (!heat.coils_received || parseInt(heat.coils_received) <= 0) {
            newErrors[`heat_${index}_coils`] = 'Number of coils is required for coil materials';
          }
          if (heat.sheets_received && parseInt(heat.sheets_received) > 0) {
            newErrors[`heat_${index}_sheets`] = 'Sheets should not be specified for coil materials';
          }
        } else if (selectedMaterial.material_type === 'sheet') {
          if (!heat.sheets_received || parseInt(heat.sheets_received) <= 0) {
            newErrors[`heat_${index}_sheets`] = 'Number of sheets is required for sheet materials';
          }
          if (heat.coils_received && parseInt(heat.coils_received) > 0) {
            newErrors[`heat_${index}_coils`] = 'Coils should not be specified for sheet materials';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      // Convert string values to proper types for API
      const processedHeatNumbers = formData.heat_numbers.map((heat, index) => {
        // Find the raw material to determine proper quantities
        const selectedMaterial = rawMaterials.find(m => m.id === parseInt(heat.raw_material));
        
        const processedHeat = {
          heat_number: heat.heat_number.trim(),
          raw_material: parseInt(heat.raw_material),
          total_weight_kg: parseFloat(heat.total_weight_kg), // This is required and validated
          test_certificate_date: heat.test_certificate_date || null
        };
        
        // Set quantities based on material type
        if (selectedMaterial) {
          if (selectedMaterial.material_type === 'coil') {
            processedHeat.coils_received = parseInt(heat.coils_received) || 0;
            processedHeat.sheets_received = 0; // Always 0 for coil materials
          } else if (selectedMaterial.material_type === 'sheet') {
            processedHeat.sheets_received = parseInt(heat.sheets_received) || 0;
            processedHeat.coils_received = 0; // Always 0 for sheet materials
          }
        } else {
          // Fallback if material not found
          processedHeat.coils_received = parseInt(heat.coils_received) || 0;
          processedHeat.sheets_received = parseInt(heat.sheets_received) || 0;
        }
        
        return processedHeat;
      });

      const requestData = {
        purchase_order: purchaseOrder.id,
        truck_number: formData.truck_number,
        driver_name: formData.driver_name,
        heat_numbers_data: processedHeatNumbers
      };


      const result = await apiRequest(INVENTORY_APIS.GRM_RECEIPTS_CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      toast.success('GRM Receipt created successfully');
      onSuccess(result);
    } catch (err) {
      console.error('Error creating GRM Receipt:', err);
      
      // Try to parse error message from response
      let errorMessage = err.message || 'Failed to create GRM Receipt';
      if (err.response && err.response.data) {
        // Handle validation errors
        if (err.response.data.heat_numbers_data) {
          const validationErrors = err.response.data.heat_numbers_data;
          const errorMessages = [];
          
          validationErrors.forEach((heatError, index) => {
            if (typeof heatError === 'object') {
              Object.keys(heatError).forEach(field => {
                if (Array.isArray(heatError[field])) {
                  errorMessages.push(`Heat ${index + 1} - ${field}: ${heatError[field].join(', ')}`);
                } else {
                  errorMessages.push(`Heat ${index + 1} - ${field}: ${heatError[field]}`);
                }
              });
            }
          });
          
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('; ');
          }
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Create GRM Receipt
                </h3>
                <p className="text-sm text-gray-600">
                  PO: {purchaseOrder.po_id} - {purchaseOrder.vendor_name?.name}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-slate-700 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Truck Number *
                  </label>
                  <input
                    type="text"
                    value={formData.truck_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, truck_number: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.truck_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter truck number"
                  />
                  {errors.truck_number && (
                    <p className="text-red-500 text-xs mt-1">{errors.truck_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Driver Name *
                  </label>
                  <input
                    type="text"
                    value={formData.driver_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, driver_name: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.driver_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter driver name"
                  />
                  {errors.driver_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.driver_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Heat Numbers */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-slate-700">Heat Numbers</h4>
                <Button
                  type="button"
                  onClick={addHeatNumber}
                  variant="secondary"
                  size="sm"
                  className="flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add Heat Number
                </Button>
              </div>

              <div className="space-y-4">
                {formData.heat_numbers.map((heat, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-semibold text-slate-700">
                        Heat Number {index + 1}
                      </h5>
                      {formData.heat_numbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHeatNumber(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Heat Number *
                        </label>
                        <input
                          type="text"
                          value={heat.heat_number}
                          onChange={(e) => updateHeatNumber(index, 'heat_number', e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`heat_${index}_number`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter heat number"
                        />
                        {errors[`heat_${index}_number`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`heat_${index}_number`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Raw Material *
                        </label>
                        <select
                          value={heat.raw_material}
                          onChange={(e) => updateHeatNumber(index, 'raw_material', e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`heat_${index}_material`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Raw Material</option>
                          {rawMaterials.map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.material_name} - {material.grade}
                            </option>
                          ))}
                        </select>
                        {errors[`heat_${index}_material`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`heat_${index}_material`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Total Weight (KG) *
                        </label>
                        <input
                          type="text"
                          value={heat.total_weight_kg || ''}
                          onChange={(e) => updateHeatNumber(index, 'total_weight_kg', e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`heat_${index}_weight`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter weight"
                        />
                        {errors[`heat_${index}_weight`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`heat_${index}_weight`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Coils Received
                          {(() => {
                            const selectedMaterial = rawMaterials.find(m => m.id === parseInt(heat.raw_material));
                            return selectedMaterial?.material_type === 'coil' ? ' *' : '';
                          })()}
                        </label>
                        <input
                          type="text"
                          value={heat.coils_received || ''}
                          onChange={(e) => updateHeatNumber(index, 'coils_received', e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`heat_${index}_coils`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter number of coils"
                        />
                        {errors[`heat_${index}_coils`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`heat_${index}_coils`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Sheets Received
                          {(() => {
                            const selectedMaterial = rawMaterials.find(m => m.id === parseInt(heat.raw_material));
                            return selectedMaterial?.material_type === 'sheet' ? ' *' : '';
                          })()}
                        </label>
                        <input
                          type="text"
                          value={heat.sheets_received || ''}
                          onChange={(e) => updateHeatNumber(index, 'sheets_received', e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`heat_${index}_sheets`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter number of sheets"
                        />
                        {errors[`heat_${index}_sheets`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`heat_${index}_sheets`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Test Certificate Date
                        </label>
                        <input
                          type="date"
                          value={heat.test_certificate_date}
                          onChange={(e) => updateHeatNumber(index, 'test_certificate_date', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creating...' : 'Create GRM Receipt'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { toast } from '@/utils/notifications';
import Button from '../CommonComponents/ui/Button';
import { apiRequest } from '../API_Service/api-utils';
import { INVENTORY_APIS } from '../API_Service/api-list';
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
  const [showWeightWarning, setShowWeightWarning] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(false);

  // Initialize with one heat number
  useEffect(() => {
    if (formData.heat_numbers.length === 0) {
      addHeatNumber();
    }
  }, []);

  const addHeatNumber = () => {
    setFormData(prev => ({
      ...prev,
      heat_numbers: [
        ...prev.heat_numbers,
        {
          heat_number: '',
          total_weight_kg: '',
          test_certificate_date: '',
          material_type: purchaseOrder.rm_code?.material_type || 'coil',
          total_quantity: '',
          items: [] // Dynamic coil/sheet items
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

  // Apply total quantity to generate dynamic input rows
  const applyTotalQuantity = (heatIndex) => {
    const heat = formData.heat_numbers[heatIndex];
    const quantity = parseInt(heat.total_quantity);
    
    if (quantity && quantity > 0) {
      const newItems = Array.from({ length: quantity }, (_, i) => ({
        id: i + 1,
        number: '',
        weight: ''
      }));
      
      updateHeatNumber(heatIndex, 'items', newItems);
      // Clear total weight as it will be calculated from individual items
      updateHeatNumber(heatIndex, 'total_weight_kg', '');
    }
  };

  // Update individual coil/sheet item
  const updateItem = (heatIndex, itemIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      heat_numbers: prev.heat_numbers.map((heat, i) => {
        if (i === heatIndex) {
          const updatedItems = heat.items.map((item, j) => 
            j === itemIndex ? { ...item, [field]: value } : item
          );
          
          // Calculate total weight
          const totalWeight = updatedItems.reduce((sum, item) => {
            const weight = parseFloat(item.weight) || 0;
            return sum + weight;
          }, 0);
          
          return {
            ...heat,
            items: updatedItems,
            total_weight_kg: totalWeight > 0 ? totalWeight.toString() : ''
          };
        }
        return heat;
      })
    }));
  };

  // Add a new coil/sheet item
  const addItem = (heatIndex) => {
    setFormData(prev => ({
      ...prev,
      heat_numbers: prev.heat_numbers.map((heat, i) => {
        if (i === heatIndex) {
          const newItem = {
            id: heat.items.length + 1,
            number: '',
            weight: ''
          };
          return {
            ...heat,
            items: [...heat.items, newItem]
          };
        }
        return heat;
      })
    }));
  };

  // Remove a coil/sheet item
  const removeItem = (heatIndex, itemIndex) => {
    setFormData(prev => ({
      ...prev,
      heat_numbers: prev.heat_numbers.map((heat, i) => {
        if (i === heatIndex) {
          const updatedItems = heat.items.filter((_, j) => j !== itemIndex);
          
          // Recalculate total weight
          const totalWeight = updatedItems.reduce((sum, item) => {
            const weight = parseFloat(item.weight) || 0;
            return sum + weight;
          }, 0);
          
          return {
            ...heat,
            items: updatedItems,
            total_weight_kg: totalWeight > 0 ? totalWeight.toString() : ''
          };
        }
        return heat;
      })
    }));
  };

  // Calculate total quantity received from all heat numbers
  const calculateTotalQuantityReceived = () => {
    return formData.heat_numbers.reduce((total, heat) => {
      const heatWeight = parseFloat(heat.total_weight_kg) || 0;
      return total + heatWeight;
    }, 0);
  };

  // Check if there's a significant weight difference that requires warning
  const checkWeightDifference = () => {
    const totalWeight = calculateTotalQuantityReceived();
    const orderedQuantity = purchaseOrder.quantity_ordered;
    
    // Allow 10% tolerance
    const tolerance = orderedQuantity * 0.1;
    const minAllowed = orderedQuantity - tolerance;
    const maxAllowed = orderedQuantity + tolerance;
    
    return totalWeight < minAllowed || totalWeight > maxAllowed;
  };

  // Get weight difference percentage
  const getWeightDifferencePercentage = () => {
    const totalWeight = calculateTotalQuantityReceived();
    const orderedQuantity = purchaseOrder.quantity_ordered;
    
    if (orderedQuantity === 0) return 0;
    return ((totalWeight - orderedQuantity) / orderedQuantity) * 100;
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
      
      // Validate total weight - it's required
      if (!heat.total_weight_kg || heat.total_weight_kg.trim() === '') {
        newErrors[`heat_${index}_weight`] = 'Total weight is required';
      } else if (parseFloat(heat.total_weight_kg) <= 0) {
        newErrors[`heat_${index}_weight`] = 'Total weight must be greater than 0';
      }
      
      // Validate individual items
      if (!heat.items || heat.items.length === 0) {
        newErrors[`heat_${index}_items`] = 'At least one item is required';
      } else {
        heat.items.forEach((item, itemIndex) => {
          if (!item.number.trim()) {
            newErrors[`heat_${index}_item_${itemIndex}_number`] = 'Item number is required';
          }
          if (!item.weight || parseFloat(item.weight) <= 0) {
            newErrors[`heat_${index}_item_${itemIndex}_weight`] = 'Item weight must be greater than 0';
          }
        });
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for weight difference warning
    if (checkWeightDifference() && !pendingSubmission) {
      setShowWeightWarning(true);
      return;
    }
    
    // If no warning needed, proceed with submission
    await performSubmission();
  };

  // Handle confirmation of weight difference
  const handleConfirmWeightDifference = async () => {
    setShowWeightWarning(false);
    setPendingSubmission(true);
    
    // Call the actual submission logic directly
    await performSubmission();
  };

  // Handle cancellation of weight difference warning
  const handleCancelWeightDifference = () => {
    setShowWeightWarning(false);
    setPendingSubmission(false);
  };

  // Extract the actual submission logic into a separate function
  const performSubmission = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      setPendingSubmission(false);
      return;
    }

    setLoading(true);
    try {
      // Convert string values to proper types for API
      const processedHeatNumbers = formData.heat_numbers.map((heat, index) => {
        const processedHeat = {
          heat_number: heat.heat_number.trim(),
          raw_material: purchaseOrder.rm_code.id, // Use material from PO
          total_weight_kg: parseFloat(heat.total_weight_kg), // This is required and validated
          test_certificate_date: heat.test_certificate_date || null,
          items: heat.items.map(item => ({
            number: item.number.trim(),
            weight: parseFloat(item.weight)
          }))
        };
        
        // Set quantities based on material type from PO
        if (heat.material_type === 'coil') {
          processedHeat.coils_received = heat.items.length;
          processedHeat.sheets_received = 0;
        } else if (heat.material_type === 'sheet') {
          processedHeat.sheets_received = heat.items.length;
          processedHeat.coils_received = 0;
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

      // Let parent component handle success toast message
      onSuccess(result.data || result);
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
      setPendingSubmission(false);
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

            {/* Total Quantity Received Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-slate-700 mb-4">Quantity Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantity Ordered
                  </label>
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-slate-700">
                    {purchaseOrder.quantity_ordered} {purchaseOrder.rm_code?.material_type === 'coil' ? 'coils' : 'sheets'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Quantity Received (KG)
                  </label>
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-green-100 text-green-800 font-semibold">
                    {calculateTotalQuantityReceived().toFixed(2)} KG
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <div className={`w-full border rounded-lg px-3 py-2 font-semibold ${
                    calculateTotalQuantityReceived() > 0 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }`}>
                    {calculateTotalQuantityReceived() > 0 ? 'Ready to Submit' : 'Add Heat Numbers'}
                  </div>
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

                    {/* Material Information from PO */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Material Information
                          </label>
                          <p className="text-sm text-slate-800 font-medium">
                            {purchaseOrder.rm_code?.material_name} - {purchaseOrder.rm_code?.grade}
                          </p>
                          <p className="text-xs text-slate-600">
                            Code: {purchaseOrder.rm_code?.material_code} | Type: {purchaseOrder.rm_code?.material_type_display}
                          </p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                          Total {heat.material_type === 'coil' ? 'Coils' : 'Sheets'} Received *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            value={heat.total_quantity || ''}
                            onChange={(e) => updateHeatNumber(index, 'total_quantity', e.target.value)}
                            className={`flex-1 border rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`heat_${index}_items`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={`Enter number of ${heat.material_type === 'coil' ? 'coils' : 'sheets'}`}
                          />
                          <Button
                            type="button"
                            onClick={() => applyTotalQuantity(index)}
                            variant="secondary"
                            size="sm"
                            className="px-3"
                          >
                            Apply
                          </Button>
                        </div>
                        {errors[`heat_${index}_items`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`heat_${index}_items`]}</p>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Items Input */}
                    {heat.items && heat.items.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="text-sm font-semibold text-slate-700">
                            {heat.material_type === 'coil' ? 'Coil' : 'Sheet'} Details
                          </h6>
                          <Button
                            type="button"
                            onClick={() => addItem(index)}
                            variant="secondary"
                            size="sm"
                            className="flex items-center"
                          >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add {heat.material_type === 'coil' ? 'Coil' : 'Sheet'}
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {heat.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  {heat.material_type === 'coil' ? 'Coil' : 'Sheet'} Number *
                                </label>
                                <input
                                  type="text"
                                  value={item.number}
                                  onChange={(e) => updateItem(index, itemIndex, 'number', e.target.value)}
                                  className={`w-full border rounded px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors[`heat_${index}_item_${itemIndex}_number`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                  placeholder={`Enter ${heat.material_type === 'coil' ? 'coil' : 'sheet'} number`}
                                />
                                {errors[`heat_${index}_item_${itemIndex}_number`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`heat_${index}_item_${itemIndex}_number`]}</p>
                                )}
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Weight (KG) *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.weight}
                                  onChange={(e) => updateItem(index, itemIndex, 'weight', e.target.value)}
                                  className={`w-full border rounded px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors[`heat_${index}_item_${itemIndex}_weight`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                  placeholder="Enter weight"
                                />
                                {errors[`heat_${index}_item_${itemIndex}_weight`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`heat_${index}_item_${itemIndex}_weight`]}</p>
                                )}
                              </div>
                              {heat.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(index, itemIndex)}
                                  className="text-red-500 hover:text-red-700 mt-6"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total Weight Display */}
                    {heat.total_weight_kg && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">Total Weight:</span>
                          <span className="text-lg font-semibold text-green-700">
                            {parseFloat(heat.total_weight_kg).toFixed(2)} KG
                          </span>
                        </div>
                      </div>
                    )}
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

      {/* Weight Difference Warning Modal */}
      {showWeightWarning && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Weight Difference Warning
                </h3>
                <div className="text-sm text-gray-600 mb-4">
                  <p className="mb-2">
                    The total weight received ({calculateTotalQuantityReceived().toFixed(2)} kg) 
                    differs significantly from the ordered quantity ({purchaseOrder.quantity_ordered} {purchaseOrder.rm_code?.material_type === 'coil' ? 'coils' : 'sheets'}).
                  </p>
                  <p className="font-semibold text-yellow-700">
                    Difference: {getWeightDifferencePercentage().toFixed(1)}%
                  </p>
                </div>
                
                <div className="flex justify-center space-x-3">
                  <Button
                    type="button"
                    onClick={handleCancelWeightDifference}
                    variant="secondary"
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmWeightDifference}
                    variant="primary"
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Confirm & Create GRM'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

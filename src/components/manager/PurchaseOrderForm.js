"use client";

import { useState, useEffect } from 'react';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import { toast } from '@/utils/notifications';

export default function PurchaseOrderForm({ onSuccess, autoFillData = null }) {
  const [formData, setFormData] = useState({
    rm_code_id: '',
    vendor_name_id: '',
    quantity_ordered: '',
    expected_date: '',
    unit_price: '',
    terms_conditions: '',
    notes: ''
  });

  const [dropdownData, setDropdownData] = useState({
    rawMaterials: [],
    vendors: []
  });

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [rawMaterials, vendors] = await Promise.all([
          manufacturingAPI.purchaseOrders.getRawMaterials(),
          manufacturingAPI.purchaseOrders.getVendors('rm_vendor')
        ]);
        
        setDropdownData({ rawMaterials, vendors });
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  // Auto-fill form when data is provided from MO
  useEffect(() => {
    if (autoFillData && dropdownData.rawMaterials.length > 0) {
      const { materials, requiredQuantity, productDetails, moReference } = autoFillData;
      
      if (materials && materials.length > 0) {
        // Find the material in dropdown that matches the MO material
        const material = materials[0]; // Take the first material
        const matchingMaterial = dropdownData.rawMaterials.find(rm => 
          rm.material_code === material.material_code || 
          rm.id === material.id ||
          rm.material_name === material.material_name
        );
        
        if (matchingMaterial) {
          // Auto-select the material and populate quantity
          setFormData(prev => ({
            ...prev,
            rm_code_id: matchingMaterial.id.toString(),
            quantity_ordered: requiredQuantity?.toString() || '',
            notes: `Auto-generated PO for MO: ${moReference || 'Manufacturing Order'}. Required to fulfill production demand.`
          }));
          
          // Set the selected material details
          setSelectedMaterial(material);
          setIsAutoFilled(true);
          
          // Also fetch the material details for complete info
          handleMaterialChange(matchingMaterial.id.toString());
        }
      }
    }
  }, [autoFillData, dropdownData.rawMaterials]);

  // Check for auto-fill data from sessionStorage (from MO form)
  useEffect(() => {
    if (!autoFillData && dropdownData.rawMaterials.length > 0) {
      const storedAutoFillData = sessionStorage.getItem('autoFillPOData');
      if (storedAutoFillData) {
        try {
          const parsedData = JSON.parse(storedAutoFillData);
          // Clear the stored data after use
          sessionStorage.removeItem('autoFillPOData');
          
          // Process the stored auto-fill data
          if (parsedData.materials && parsedData.materials.length > 0) {
            const material = parsedData.materials[0];
            const matchingMaterial = dropdownData.rawMaterials.find(rm => 
              rm.material_code === material.material_code || 
              rm.id === material.id ||
              rm.material_name === material.material_name
            );
            
            if (matchingMaterial) {
              setFormData(prev => ({
                ...prev,
                rm_code_id: matchingMaterial.id.toString(),
                quantity_ordered: parsedData.shortageQuantity?.toString() || '',
                notes: `Auto-generated PO for MO: ${parsedData.moReference || 'Manufacturing Order'}. Required to fulfill production demand.`
              }));
              
              setSelectedMaterial(material);
              setIsAutoFilled(true);
              handleMaterialChange(matchingMaterial.id.toString());
            }
          }
        } catch (error) {
          console.error('Error parsing stored auto-fill data:', error);
        }
      }
    }
  }, [dropdownData.rawMaterials]);

  // Handle material selection and auto-populate fields
  const handleMaterialChange = async (materialId) => {
    try {
      const material = dropdownData.rawMaterials.find(m => m.id === parseInt(materialId));
      setSelectedMaterial(material);
      
      // Fetch detailed material info for auto-population
      if (materialId) {
        const materialDetails = await manufacturingAPI.purchaseOrders.getMaterialDetails(materialId);
        setSelectedMaterial(materialDetails);
      }
      
      setFormData(prev => ({
        ...prev,
        rm_code_id: materialId
      }));
    } catch (error) {
      console.error('Error fetching material details:', error);
    }
  };

  // Handle vendor selection and auto-populate fields
  const handleVendorChange = async (vendorId) => {
    try {
      const vendor = dropdownData.vendors.find(v => v.id === parseInt(vendorId));
      setSelectedVendor(vendor);
      
      // Fetch detailed vendor info for auto-population
      if (vendorId) {
        const vendorDetails = await manufacturingAPI.purchaseOrders.getVendorDetails(vendorId);
        setSelectedVendor(vendorDetails);
      }
      
      setFormData(prev => ({
        ...prev,
        vendor_name_id: vendorId
      }));
    } catch (error) {
      console.error('Error fetching vendor details:', error);
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

    if (!formData.rm_code_id) newErrors.rm_code_id = 'Raw material is required';
    if (!formData.vendor_name_id) newErrors.vendor_name_id = 'Vendor is required';
    if (!formData.quantity_ordered || formData.quantity_ordered <= 0) newErrors.quantity_ordered = 'Valid quantity is required';
    if (!formData.expected_date) newErrors.expected_date = 'Expected date is required';
    if (!formData.unit_price || formData.unit_price <= 0) newErrors.unit_price = 'Valid unit price is required';

    // Check if expected date is in the future
    if (formData.expected_date) {
      const expectedDate = new Date(formData.expected_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expectedDate < today) {
        newErrors.expected_date = 'Expected date cannot be in the past';
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
      // Convert string IDs to integers and numbers
      const submitData = {
        ...formData,
        rm_code_id: parseInt(formData.rm_code_id),
        vendor_name_id: parseInt(formData.vendor_name_id),
        quantity_ordered: parseInt(formData.quantity_ordered),
        unit_price: parseFloat(formData.unit_price)
      };

      const response = await manufacturingAPI.purchaseOrders.create(submitData);
      
      // Show success notification with NotifyX
      if (isAutoFilled && autoFillData) {
        toast.po.autoGenerated({
          po_id: response.po_id || 'Generated',
          quantity_ordered: submitData.quantity_ordered,
          total_amount: (submitData.quantity_ordered * submitData.unit_price).toFixed(2)
        }, autoFillData.moReference);
      } else {
        toast.po.created({
          po_id: response.po_id || 'Generated',
          total_amount: (submitData.quantity_ordered * submitData.unit_price).toFixed(2)
        });
      }
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 2000);

      // Reset form
      setFormData({
        rm_code_id: '',
        vendor_name_id: '',
        quantity_ordered: '',
        expected_date: '',
        unit_price: '',
        terms_conditions: '',
        notes: ''
      });
      setSelectedMaterial(null);
      setSelectedVendor(null);

    } catch (error) {
      console.error('Error creating PO:', error);
      toast.po.error(error);
      setErrors({ submit: error.message || 'Failed to create Purchase Order' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total amount
  const totalAmount = formData.quantity_ordered && formData.unit_price 
    ? (parseFloat(formData.quantity_ordered) * parseFloat(formData.unit_price)).toFixed(2)
    : '0.00';

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-600 mb-2">Purchase Order Created!</h3>
        <p className="text-slate-600 mb-4">The purchase order has been successfully created.</p>
        <button
          onClick={() => {
            setSuccess(false);
            if (onSuccess) onSuccess();
          }}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-fill Context Banner */}
      {isAutoFilled && autoFillData && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🔄</span>
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">Auto-generated Purchase Order</h4>
              <p className="text-amber-700 text-sm mb-2">
                This PO is being created due to insufficient stock for manufacturing order.
              </p>
              {autoFillData.productDetails && (
                <div className="bg-white rounded-lg p-3 text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <span className="text-amber-600 font-medium">Product:</span>
                      <div className="text-slate-700">{autoFillData.productDetails.product_code}</div>
                    </div>
                    <div>
                      <span className="text-amber-600 font-medium">Required:</span>
                      <div className="text-slate-700">{autoFillData.requiredQuantity} kg</div>
                    </div>
                    <div>
                      <span className="text-amber-600 font-medium">Available:</span>
                      <div className="text-slate-700">{autoFillData.availableQuantity || 0} kg</div>
                    </div>
                    <div>
                      <span className="text-amber-600 font-medium">Shortage:</span>
                      <div className="text-red-600 font-semibold">{autoFillData.requiredQuantity - (autoFillData.availableQuantity || 0)} kg</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Material & Vendor Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Raw Material <span className="text-red-500">*</span>
          </label>
          <select
            name="rm_code_id"
            value={formData.rm_code_id}
            onChange={(e) => handleMaterialChange(e.target.value)}
            className={`w-full px-4 py-3 text-slate-800 rounded-xl border ${
              errors.rm_code_id ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
          >
            <option value="">Select Raw Material</option>
            {dropdownData.rawMaterials.map(material => (
              <option key={material.id} value={material.id}>
                {material.display_name} {material.available_quantity !== undefined ? `(Stock: ${material.available_quantity} kg)` : ''}
              </option>
            ))}
          </select>
          {errors.rm_code_id && (
            <p className="text-red-500 text-sm mt-1">{errors.rm_code_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Vendor <span className="text-red-500">*</span>
          </label>
          <select
            name="vendor_name_id"
            value={formData.vendor_name_id}
            onChange={(e) => handleVendorChange(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl text-slate-800 border ${
              errors.vendor_name_id ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
          >
            <option value="">Select Vendor</option>
            {dropdownData.vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
          {errors.vendor_name_id && (
            <p className="text-red-500 text-sm mt-1">{errors.vendor_name_id}</p>
          )}
        </div>
      </div>

      {/* Auto-populated Material Details */}
      {selectedMaterial && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <h4 className="font-medium text-purple-800 mb-3 flex items-center space-x-2">
            <span>📦</span>
            <span>Material Details (Auto-populated)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-purple-600 font-medium">Product Code:</span>
              <span className="ml-2 text-slate-700">{selectedMaterial.product_code}</span>
            </div>
            <div>
              <span className="text-purple-600 font-medium">Material:</span>
              <span className="ml-2 text-slate-700">{selectedMaterial.material_name_display}</span>
            </div>
            <div>
              <span className="text-purple-600 font-medium">Type:</span>
              <span className="ml-2 text-slate-700">{selectedMaterial.material_type_display}</span>
            </div>
            <div>
              <span className="text-purple-600 font-medium">Grade:</span>
              <span className="ml-2 text-slate-700">{selectedMaterial.grade}</span>
            </div>
            {selectedMaterial.wire_diameter_mm && (
              <div>
                <span className="text-purple-600 font-medium">Wire Diameter:</span>
                <span className="ml-2 text-slate-700">{selectedMaterial.wire_diameter_mm}mm</span>
              </div>
            )}
            {selectedMaterial.thickness_mm && (
              <div>
                <span className="text-purple-600 font-medium">Thickness:</span>
                <span className="ml-2 text-slate-700">{selectedMaterial.thickness_mm}mm</span>
              </div>
            )}
            {selectedMaterial.available_quantity !== undefined && (
              <div>
                <span className="text-purple-600 font-medium">Current Stock:</span>
                <span className={`ml-2 font-semibold ${
                  selectedMaterial.available_quantity > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedMaterial.available_quantity} kg
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-populated Vendor Details */}
      {selectedVendor && (
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
          <h4 className="font-medium text-indigo-800 mb-3 flex items-center space-x-2">
            <span>🏢</span>
            <span>Vendor Details (Auto-populated)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-indigo-600 font-medium">GST No:</span>
              <span className="ml-2 text-slate-700">{selectedVendor.gst_no}</span>
            </div>
            <div>
              <span className="text-indigo-600 font-medium">Contact:</span>
              <span className="ml-2 text-slate-700">{selectedVendor.contact_no}</span>
            </div>
            <div>
              <span className="text-indigo-600 font-medium">Contact Person:</span>
              <span className="ml-2 text-slate-700">{selectedVendor.contact_person || 'N/A'}</span>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <span className="text-indigo-600 font-medium">Address:</span>
              <span className="ml-2 text-slate-700">{selectedVendor.address}</span>
            </div>
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Quantity Ordered <span className="text-red-500">*</span>
            {isAutoFilled && autoFillData && (
              <span className="ml-2 text-amber-600 text-xs font-normal">
                (Required: {autoFillData.requiredQuantity - (autoFillData.availableQuantity || 0)} kg shortage)
              </span>
            )}
          </label>
          <input
            type="number"
            name="quantity_ordered"
            value={formData.quantity_ordered}
            onChange={handleInputChange}
            min="1"
            className={`w-full px-4 py-3 rounded-xl text-slate-600 border ${
              errors.quantity_ordered ? 'border-red-300 bg-red-50' : 
              isAutoFilled ? 'border-amber-300 bg-amber-50' : 'border-slate-300 bg-white'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
            placeholder={isAutoFilled ? "Auto-calculated quantity" : "Enter quantity"}
          />
          {errors.quantity_ordered && (
            <p className="text-red-500 text-sm mt-1">{errors.quantity_ordered}</p>
          )}
          {isAutoFilled && (
            <p className="text-amber-600 text-xs mt-1">
              💡 This quantity covers the shortage for your manufacturing order
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Unit Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.unit_price ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
            placeholder="0.00"
          />
          {errors.unit_price && (
            <p className="text-red-500 text-sm mt-1">{errors.unit_price}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Total Amount (₹)</label>
          <div className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-medium">
            ₹{totalAmount}
          </div>
        </div>
      </div>

      {/* Expected Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Expected Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="expected_date"
          value={formData.expected_date}
          onChange={handleInputChange}
          min={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 rounded-xl border ${
            errors.expected_date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
          } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
        />
        {errors.expected_date && (
          <p className="text-red-500 text-sm mt-1">{errors.expected_date}</p>
        )}
      </div>

      {/* Terms & Conditions */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Terms & Conditions</label>
        <textarea
          name="terms_conditions"
          value={formData.terms_conditions}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder="Enter terms and conditions (e.g., Net 30 days, FOB destination, etc.)"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder="Enter any additional notes or requirements..."
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
              rm_code_id: '',
              vendor_name_id: '',
              quantity_ordered: '',
              expected_date: '',
              unit_price: '',
              terms_conditions: '',
              notes: ''
            });
            setSelectedMaterial(null);
            setSelectedVendor(null);
            setErrors({});
            setIsAutoFilled(false);
          }}
          className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
        >
          {isAutoFilled ? 'Clear Auto-fill' : 'Reset'}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-600/25"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating...</span>
            </div>
          ) : (
            'Create Purchase Order'
          )}
        </button>
      </div>
    </form>
    </div>
  );
}

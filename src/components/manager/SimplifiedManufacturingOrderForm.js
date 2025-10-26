"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import SearchableDropdown from '@/components/CommonComponents/ui/SearchableDropdown';
import { toast } from '@/utils/notifications';

export default function SimplifiedManufacturingOrderForm({ 
  onSuccess, 
  onStockDataChange 
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    product_code_id: '',
    customer_name: '',
    quantity: '',
    planned_start_date: '',
    planned_end_date: '',
    priority: 'medium',
    special_instructions: '',
    tolerance_percentage: '2.00'
  });

  const [productsList, setProductsList] = useState([]);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [stockWarning, setStockWarning] = useState(null);
  const [isStockInsufficient, setIsStockInsufficient] = useState(false);
  const [looseFGStock, setLooseFGStock] = useState(null);
  const [fetchingFGStock, setFetchingFGStock] = useState(false);

  // Prevent duplicate API calls in React Strict Mode
  const hasFetchedProductsRef = useRef(false);

  // Fetch products list on component mount
  useEffect(() => {
    // Skip if already fetched (React Strict Mode prevention)
    if (hasFetchedProductsRef.current) return;
    hasFetchedProductsRef.current = true;

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

    // Clear error for this field
    if (errors.product_code_id) {
      setErrors(prev => ({
        ...prev,
        product_code_id: ''
      }));
    }

    if (!productId) {
      setSelectedProductDetails(null);
      setStockWarning(null);
      setIsStockInsufficient(false);
      setLooseFGStock(null);
      return;
    }

    try {
      // Find the selected product to get its code
      const selectedProduct = productsList.find(p => p.id === parseInt(productId));
      if (selectedProduct) {
        // Fetch detailed product information with BOM and materials
        const productDetails = await manufacturingAPI.manufacturingOrders.getProductDetails(selectedProduct.product_code);
        console.log('Product Details Response:', productDetails);

        // Validate response structure
        if (!productDetails || !productDetails.product) {
          console.error('Invalid product details response:', productDetails);
          setErrors(prev => ({
            ...prev,
            product_code_id: 'Invalid product details received. Please contact support.'
          }));
          return;
        }

        setSelectedProductDetails(productDetails);

        // Auto-populate customer name from product details
        if (productDetails.product && productDetails.product.customer_name) {
          setFormData(prev => ({
            ...prev,
            customer_name: productDetails.product.customer_name
          }));
        }

        // Fetch loose FG stock for this product
        setFetchingFGStock(true);
        try {
          const fgStockData = await manufacturingAPI.fgStore.getLooseFGStock(selectedProduct.product_code);
          console.log('Loose FG Stock:', fgStockData);
          setLooseFGStock(fgStockData);
        } catch (fgError) {
          console.warn('Failed to fetch loose FG stock:', fgError);
          setLooseFGStock({ total_loose_stock: 0, total_available_stock: 0, batches: [] });
        } finally {
          setFetchingFGStock(false);
        }
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setErrors(prev => ({
        ...prev,
        product_code_id: 'Failed to load product details'
      }));
    }
  };

  // Stock validation function - considers loose FG stock
  const validateStock = (quantity, materials, productDetails, looseFG) => {
    if (!quantity || !materials || materials.length === 0 || !productDetails) {
      setStockWarning(null);
      setIsStockInsufficient(false);
      return;
    }

    const enteredQuantity = parseFloat(quantity);
    if (isNaN(enteredQuantity) || enteredQuantity <= 0) {
      setStockWarning(null);
      setIsStockInsufficient(false);
      return;
    }

    // Check if loose FG can cover part or all of the requirement
    const looseFGAvailable = looseFG?.total_loose_stock || 0;
    const quantityToManufacture = Math.max(0, enteredQuantity - looseFGAvailable);

    // If loose FG covers all requirements, no RM needed
    if (quantityToManufacture === 0) {
      setStockWarning(null);
      setIsStockInsufficient(false);
      return;
    }

    // Get grams per product from product details
    const gramsPerProduct = parseFloat(productDetails.grams_per_product || productDetails.weight_kg * 1000 || 0);

    if (!gramsPerProduct || gramsPerProduct <= 0) {
      setStockWarning('Product weight/grams information not available');
      setIsStockInsufficient(false);
      return;
    }

    // Calculate required material in kg for quantity to manufacture
    const requiredMaterialKg = (quantityToManufacture * gramsPerProduct) / 1000;

    // Calculate total available stock (sum all materials)
    const totalAvailableStock = materials.reduce((sum, material) => {
      return sum + (material.available_quantity || 0);
    }, 0);

    if (requiredMaterialKg > totalAvailableStock) {
      const shortage = requiredMaterialKg - totalAvailableStock;
      const message = {
        title: 'Insufficient stock!',
        available: `${totalAvailableStock.toFixed(2)} kg`,
        required: `${requiredMaterialKg.toFixed(2)} kg`,
        forQuantity: looseFGAvailable > 0 
          ? `${quantityToManufacture} products (${looseFGAvailable} covered by loose FG)`
          : `${enteredQuantity} products`,
        shortage: `${shortage.toFixed(2)} kg`
      };
      setStockWarning(message);
      setIsStockInsufficient(true);
    } else {
      setStockWarning(null);
      setIsStockInsufficient(false);
    }
  };

  // Monitor quantity and stock changes
  useEffect(() => {
    if (selectedProductDetails?.materials && selectedProductDetails?.product) {
      validateStock(formData.quantity, selectedProductDetails.materials, selectedProductDetails.product, looseFGStock);
    }
  }, [formData.quantity, selectedProductDetails?.materials, selectedProductDetails?.product, looseFGStock]);

  // Notify parent component of stock data changes
  useEffect(() => {
    if (onStockDataChange) {
      onStockDataChange({
        looseFGStock,
        fetchingFGStock,
        stockWarning,
        isStockInsufficient,
        selectedProductDetails,
        formData,
        handleCreatePO
      });
    }
  }, [looseFGStock, fetchingFGStock, stockWarning, isStockInsufficient, selectedProductDetails, formData.quantity]);

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

    // Validate tolerance percentage
    if (!formData.tolerance_percentage || formData.tolerance_percentage < 0 || formData.tolerance_percentage > 100) {
      newErrors.tolerance_percentage = 'Tolerance must be between 0 and 100';
    }

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
        quantity: parseInt(formData.quantity),
        tolerance_percentage: parseFloat(formData.tolerance_percentage)
      };

      const response = await manufacturingAPI.manufacturingOrders.create(submitData);

      // Show success notification with react-hot-toast
      toast.mo.created({
        mo_id: response.mo_id || 'Generated',
        quantity: submitData.quantity
      });

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
        special_instructions: '',
        tolerance_percentage: '2.00'
      });
      setSelectedProductDetails(null);

    } catch (error) {
      console.error('Error creating MO:', error);
      toast.mo.error(error);
      setErrors({ submit: error.message || 'Failed to create Manufacturing Order' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Create PO from insufficient stock
  const handleCreatePO = () => {
    if (!selectedProductDetails?.materials || !formData.quantity || !selectedProductDetails?.product) return;

    const totalAvailableStock = selectedProductDetails.materials.reduce((sum, material) => {
      return sum + (material.available_quantity || 0);
    }, 0);

    const productQuantity = parseFloat(formData.quantity);

    // Get grams per product and calculate required material in kg
    const gramsPerProduct = parseFloat(selectedProductDetails.product.grams_per_product || selectedProductDetails.product.weight_kg * 1000 || 0);
    const requiredMaterialKg = (productQuantity * gramsPerProduct) / 1000;

    const shortage = requiredMaterialKg - totalAvailableStock;

    // Prepare auto-fill data for PO form
    const autoFillData = {
      materials: selectedProductDetails.materials,
      requiredQuantity: requiredMaterialKg, // Material quantity in kg
      productQuantity: productQuantity, // Number of products
      gramsPerProduct: gramsPerProduct, // Grams per product
      availableQuantity: totalAvailableStock,
      shortageQuantity: shortage,
      productDetails: selectedProductDetails.product,
      moReference: `MO for ${selectedProductDetails.product.product_code}`
    };

    // Store auto-fill data and navigate to PO creation page
    sessionStorage.setItem('autoFillPOData', JSON.stringify(autoFillData));

    // Show navigation notification
    toast.navigation.redirecting('Purchase Order Creation');

    // Navigate to PO creation page
    setTimeout(() => {
      router.push('/production-head/create-po');
    }, 1000);

    console.log('Auto-fill data for PO:', autoFillData);
  };

  const resetForm = () => {
    setFormData({
      product_code_id: '',
      customer_name: '',
      quantity: '',
      planned_start_date: '',
      planned_end_date: '',
      priority: 'medium',
      special_instructions: '',
      tolerance_percentage: '2.00'
    });
    setSelectedProductDetails(null);
    setErrors({});
    setStockWarning(null);
    setIsStockInsufficient(false);
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
        {/* User Input Fields */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
          <h3 className="text-base font-medium text-slate-800 mb-3 flex items-center space-x-2">
            <span>📝</span>
            <span>Order Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Product Selection */}
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Product Code <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                options={productsList}
                value={formData.product_code_id}
                onChange={handleProductChange}
                placeholder="Select Product"
                displayKey="display_name"
                valueKey="id"
                searchKeys={["display_name", "product_code", "description"]}
                error={!!errors.product_code_id}
                className="w-full"
                loading={productsList.length === 0}
              />
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
                value={
                  selectedProductDetails?.product?.customer_name && selectedProductDetails?.product?.customer_id
                    ? `${selectedProductDetails.product.customer_name} - ${selectedProductDetails.product.customer_id}`
                    : formData.customer_name
                }
                onChange={handleInputChange}
                readOnly={selectedProductDetails?.product?.customer_name ? true : false}
                className={`w-full px-3 py-2 text-sm text-slate-800 rounded-lg border ${errors.customer_name ? 'border-red-300 bg-red-50' :
                  selectedProductDetails?.product?.customer_name ? 'border-slate-300 bg-slate-50' : 'border-slate-300 bg-white'
                  } focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all ${selectedProductDetails?.product?.customer_name ? 'cursor-not-allowed' : ''
                  }`}
                placeholder={
                  selectedProductDetails?.product?.customer_name
                    ? "Auto-populated from product"
                    : "Enter customer name"
                }
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
                className={`w-full px-3 py-2 text-slate-800 text-sm rounded-lg border ${errors.quantity ? 'border-red-300 bg-red-50' :
                  stockWarning ? 'border-orange-300 bg-orange-50' : 'border-slate-300 bg-white'
                  } focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
              )}
              {/* Show calculated material requirement */}
              {formData.quantity && selectedProductDetails?.product && (
                (() => {
                  const qty = parseFloat(formData.quantity);
                  const gramsPerProd = parseFloat(selectedProductDetails.product.grams_per_product || selectedProductDetails.product.weight_kg * 1000 || 0);
                  if (qty > 0 && gramsPerProd > 0) {
                    const requiredKg = (qty * gramsPerProd) / 1000;
                    return (
                      <p className="text-blue-600 text-xs mt-1 flex items-center">
                        <span className="mr-1">📊</span>
                        Material Required: <strong className="ml-1">{requiredKg.toFixed(2)} kg</strong>
                      </p>
                    );
                  }
                  return null;
                })()
              )}
            </div>

            {/* Tolerance Percentage */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tolerance % <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="tolerance_percentage"
                value={formData.tolerance_percentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className={`w-full px-3 py-2 text-slate-800 text-sm rounded-lg border ${errors.tolerance_percentage ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                  } focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="2.00"
              />
              {errors.tolerance_percentage && (
                <p className="text-red-500 text-xs mt-1">{errors.tolerance_percentage}</p>
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

            {/* Planned Start Date */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Planned Start Date
              </label>
              <input
                type="datetime-local"
                name="planned_start_date"
                value={formData.planned_start_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm text-slate-800 rounded-lg border ${errors.planned_start_date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                  } focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
              {errors.planned_start_date && (
                <p className="text-red-500 text-xs mt-1">{errors.planned_start_date}</p>
              )}
            </div>

            {/* Planned End Date */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Planned End Date
              </label>
              <input
                type="datetime-local"
                name="planned_end_date"
                value={formData.planned_end_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm text-slate-800 rounded-lg border ${errors.planned_end_date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                  } focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
              {errors.planned_end_date && (
                <p className="text-red-500 text-xs mt-1">{errors.planned_end_date}</p>
              )}
            </div>
          </div>
        </div>

        {/* Auto-populated Product Details - Single Compact Box */}
        {selectedProductDetails && selectedProductDetails.product && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center space-x-1">
              <span>🔧</span>
              <span>Product Details</span>
            </h3>

            {/* All Details in One Compact Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs mb-2">
              <div className="lg:col-span-2">
                <span className="text-blue-600 font-medium">Product Code:</span>
                <div className="text-slate-700 break-words">
                  {selectedProductDetails.product.product_code}
                </div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Type:</span>
                <div className="text-slate-700">{selectedProductDetails.product.product_type_display || 'N/A'}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Grams per Product:</span>
                <div className="text-slate-700 font-semibold text-green-700">
                  {selectedProductDetails.product.grams_per_product
                    ? `${parseFloat(selectedProductDetails.product.grams_per_product).toFixed(3)} g`
                    : selectedProductDetails.product.weight_kg
                      ? `${(parseFloat(selectedProductDetails.product.weight_kg) * 1000).toFixed(3)} g`
                      : 'N/A'
                  }
                </div>
              </div>
              
              {/* Packing Size - Show based on material type */}
              {selectedProductDetails.bom_dimensions && (
                <div>
                  <span className="text-blue-600 font-medium">Packing Size:</span>
                  <div className="text-slate-700 font-semibold text-purple-700">
                    {(() => {
                      const materialType = selectedProductDetails.product.material_type?.toLowerCase();
                      const bomDims = selectedProductDetails.bom_dimensions;
                      
                      // For coil materials, show pcs_per_strip
                      if (materialType === 'coil' && bomDims.pcs_per_strip) {
                        return `${bomDims.pcs_per_strip} pcs/strip`;
                      }
                      // For sheet materials, show pcs_per_sheet
                      else if (materialType === 'sheet' && bomDims.pcs_per_sheet) {
                        return `${bomDims.pcs_per_sheet} pcs/sheet`;
                      }
                      // Fallback: show whichever is available
                      else if (bomDims.pcs_per_sheet) {
                        return `${bomDims.pcs_per_sheet} pcs/sheet`;
                      }
                      else if (bomDims.pcs_per_strip) {
                        return `${bomDims.pcs_per_strip} pcs/strip`;
                      }
                      return 'N/A';
                    })()}
                  </div>
                </div>
              )}

              <div>
                <span className="text-blue-600 font-medium">Available Stock:</span>
                <div className="text-slate-700">
                  {selectedProductDetails.materials && selectedProductDetails.materials.length > 0
                    ? selectedProductDetails.materials.map((material, index) => (
                      <div key={index}>
                        <span className={`font-medium ${material.available_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {material.available_quantity || 0} kg
                        </span>
                        {/* <span className="text-slate-500 ml-1">({material.material_name})</span> */}
                      </div>
                    ))
                    : 'N/A'
                  }
                </div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Material Type:</span>
                <div className="text-slate-700">{selectedProductDetails.product.material_type_display || 'N/A'}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Material Name:</span>
                <div className="text-slate-700">{selectedProductDetails.product.material_name || 'N/A'}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Grade:</span>
                <div className="text-slate-700">{selectedProductDetails.product.grade || 'N/A'}</div>
              </div>
              {selectedProductDetails.product.wire_diameter_mm && (
                <div>
                  <span className="text-blue-600 font-medium">Wire Dia:</span>
                  <div className="text-slate-700">{selectedProductDetails.product.wire_diameter_mm} mm</div>
                </div>
              )}
              {selectedProductDetails.product.thickness_mm && (
                <div>
                  <span className="text-blue-600 font-medium">Thickness:</span>
                  <div className="text-slate-700">{selectedProductDetails.product.thickness_mm} mm</div>
                </div>
              )}
              <div>
                <span className="text-blue-600 font-medium">Finishing:</span>
                <div className="text-slate-700">{selectedProductDetails.product.finishing || 'N/A'}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Weight:</span>
                <div className="text-slate-700">{selectedProductDetails.product.weight_kg ? `${selectedProductDetails.product.weight_kg} kg` : 'N/A'}</div>
              </div>
              
              {/* Sheet and Strip Dimensions */}
              {selectedProductDetails.bom_dimensions && (
                <>
                  {selectedProductDetails.bom_dimensions.sheet_length && (
                    <div>
                      <span className="text-blue-600 font-medium">Sheet Size:</span>
                      <div className="text-slate-700">
                        {selectedProductDetails.bom_dimensions.sheet_length} × {selectedProductDetails.bom_dimensions.sheet_breadth} mm
                      </div>
                    </div>
                  )}
                  {selectedProductDetails.bom_dimensions.strip_length && (
                    <div>
                      <span className="text-blue-600 font-medium">Strip Size:</span>
                      <div className="text-slate-700">
                        {selectedProductDetails.bom_dimensions.strip_length} × {selectedProductDetails.bom_dimensions.strip_breadth} mm
                      </div>
                    </div>
                  )}
                  {selectedProductDetails.bom_dimensions.strip_count && (
                    <div>
                      <span className="text-blue-600 font-medium">Strips per Sheet:</span>
                      <div className="text-slate-700">{selectedProductDetails.bom_dimensions.strip_count}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Processes - Inline */}
            {selectedProductDetails.processes && selectedProductDetails.processes.length > 0 && (
              <div className="border-t border-blue-200 pt-2 mt-2">
                <span className="text-xs font-medium text-blue-700">Processes flow: </span>
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
          <div className="relative">
            <button
              type="submit"
              disabled={loading || isStockInsufficient}
              className={`px-6 py-2 text-sm rounded-lg font-medium transition-all shadow-md ${loading || isStockInsufficient
                ? 'bg-slate-400 text-slate-200 cursor-not-allowed shadow-slate-400/25'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25'
                }`}
              title={isStockInsufficient ? 'Cannot create MO - Insufficient stock' : ''}
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
        </div>
      </form>
    </div>
  );
}

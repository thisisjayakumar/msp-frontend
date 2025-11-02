"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/CommonComponents/ui/Card';
import Button from '@/components/CommonComponents/ui/Button';
import { inventoryAPI } from '@/components/API_Service/inventory-api';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

export default function SupervisorReturnRMModal({ isOpen, onClose, moId, mo, batch, processExecution, onSuccess }) {
  const [derivedMaterialId, setDerivedMaterialId] = useState(null);
  const [materialDisplay, setMaterialDisplay] = useState('');
  const [derivedHeatId, setDerivedHeatId] = useState(null);
  const [totalBatchQuantityKg, setTotalBatchQuantityKg] = useState('');
  const [scrappedQuantityKg, setScrappedQuantityKg] = useState('0');
  const [returnQuantityKg, setReturnQuantityKg] = useState('');
  const [reason, setReason] = useState('');
  const [reasonOption, setReasonOption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const locationCode = useMemo(() => {
    if (!processExecution) return null;
    const processName = processExecution.process_name || '';
    
    const map = {
      'Coiling Setup': 'coiling', 'Coiling Operation': 'coiling', 'Coiling QC': 'coiling',
      'Coiling/Forming': 'coiling', 'Coiling': 'coiling',
      'Tempering Setup': 'tempering', 'Tempering Process': 'tempering', 'Tempering QC': 'tempering',
      'Tempering': 'tempering',
      'Plating Preparation': 'plating', 'Plating Process': 'plating', 'Plating QC': 'plating',
      'Plating': 'plating',
      'Packing Setup': 'packing', 'Packing Process': 'packing', 'Label Printing': 'packing',
      'Packing': 'packing'
    };
    
    return map[processName] || null;
  }, [processExecution]);

  useEffect(() => {
    const total = Number(totalBatchQuantityKg || 0);
    setReturnQuantityKg(total > 0 ? total.toFixed(3) : '0.000');
  }, [totalBatchQuantityKg]);

  useEffect(() => {
    if (!isOpen) return;
    const deriveDefaults = async () => {
      try {
        setError(null);
        
        let materialId = (
          mo?.product_code?.material?.id ||
          mo?.product?.material?.id ||
          mo?.material?.id ||
          mo?.material_id ||
          null
        );
        let materialName = mo?.material_name || '';

        if (!materialId) {
          try {
            const moDetails = await manufacturingAPI.manufacturingOrders.getById(moId);
            materialId = moDetails?.product?.material?.id
              || moDetails?.product_code?.material?.id
              || moDetails?.product_code?.raw_material?.id
              || moDetails?.product_code?.raw_material_id
              || moDetails?.material?.id
              || moDetails?.material_id
              || moDetails?.raw_material?.id
              || moDetails?.raw_material_id
              || null;
            materialName = materialName || moDetails?.material_name || moDetails?.product?.material?.material_name || '';
          } catch (e) {
            
          }
        }

        const batchHeatId = batch?.heat_number_id || batch?.heat_number?.id || null;
        setDerivedHeatId(batchHeatId);

        if (!materialId && batchHeatId) {
          try {
            const heat = await inventoryAPI.heatNumbers.getById(batchHeatId);
            if (heat && !heat.error) {
              materialId = heat.raw_material || heat.raw_material_id || null;
              materialName = materialName || heat.raw_material_details?.material_name || '';
            }
          } catch (e) {
            
          }
        }

        if (!materialId && materialName) {
          try {
            const materials = await inventoryAPI.rawMaterials.getAll({ search: materialName });
            
            const materialsList = Array.isArray(materials) ? materials : (materials?.results || []);
            
            if (materialsList.length > 0) {
              const exactMatch = materialsList.find(m => m.material_name === materialName);
              materialId = exactMatch?.id || materialsList[0]?.id || null;
            }
          } catch (e) {
            
          }
        }

        setDerivedMaterialId(materialId);
        setMaterialDisplay(materialName || (mo?.product_code_value ? `${mo.product_code_value}` : 'Raw Material'));

        let qtyKg = '';
        const pieces = Number(batch?.planned_quantity || 0);
        
        let gramsPerProduct = Number(mo?.grams_per_product || 0);
        if (!gramsPerProduct && batch?.grams_per_product) {
          gramsPerProduct = Number(batch.grams_per_product);
        }
        if (!gramsPerProduct && batch?.product_code_details?.grams_per_product) {
          gramsPerProduct = Number(batch.product_code_details.grams_per_product);
        }
        
        if (pieces > 0 && gramsPerProduct > 0) {
          qtyKg = ((pieces * gramsPerProduct) / 1000).toFixed(3);
        } else if (batch?.quantity_kg) {
          qtyKg = Number(batch.quantity_kg).toFixed(3);
        } else if (Number(batch?.planned_quantity) > 0) {
          qtyKg = (Number(batch.planned_quantity) / 1000).toFixed(3);
        }
        setTotalBatchQuantityKg(qtyKg);
      } catch (e) {
        setError('Failed to derive defaults');
      }
    };
    deriveDefaults();
  }, [isOpen, moId, mo, batch]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const finalReason = reasonOption && reasonOption !== 'other' ? reasonOption : reason;
      if (!finalReason || !finalReason.trim()) {
        setError('Return reason is required');
        setLoading(false);
        return;
      }
      
      if (!derivedMaterialId && !derivedHeatId) { 
        setError('Material not available from MO'); 
        setLoading(false); 
        return; 
      }
      
      if (!totalBatchQuantityKg || Number(totalBatchQuantityKg) <= 0) { 
        setError('Total batch quantity is required'); 
        setLoading(false); 
        return; 
      }
      
      if (Number(scrappedQuantityKg) < 0) { 
        setError('Scrapped quantity cannot be negative'); 
        setLoading(false); 
        return; 
      }
      
      if (Number(scrappedQuantityKg) > Number(totalBatchQuantityKg)) { 
        setError('Scrapped quantity cannot exceed total batch quantity'); 
        setLoading(false); 
        return; 
      }
      
      if (Number(returnQuantityKg) <= 0) { 
        setError('Return quantity must be greater than zero'); 
        setLoading(false); 
        return; 
      }
      
      if (!locationCode) { 
        setError('Unsupported process location'); 
        setLoading(false); 
        return; 
      }

      const payload = {
        raw_material: derivedMaterialId ? Number(derivedMaterialId) : undefined,
        heat_number: derivedHeatId ? Number(derivedHeatId) : null,
        batch: batch?.id,
        manufacturing_order: Number(moId),
        total_batch_quantity_kg: Number(totalBatchQuantityKg),
        scrapped_quantity_kg: Number(scrappedQuantityKg),
        quantity_kg: Number(returnQuantityKg),
        return_reason: finalReason || 'Returned by supervisor',
        returned_from_location_code: locationCode,
      };

      const resp = await inventoryAPI.rmReturns.create(payload);
      if (resp.error) throw new Error(resp.message || 'Failed to create return');

      onSuccess?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <h3 className="text-lg font-semibold text-slate-800">Return Raw Material</h3>
          <p className="text-sm text-slate-600 mt-1">Create a return for batch {batch?.batch_id} from {processExecution?.process_name}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Raw Material</label>
              <input
                value={materialDisplay || 'Raw Material'}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-slate-800 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Heat Number</label>
              <input
                value={batch?.heat_number_display || batch?.heat_number || (derivedHeatId ? `#${derivedHeatId}` : 'Not specified')}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-slate-800 bg-gray-50"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Quantity Breakdown</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Total Batch Qty (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  value={totalBatchQuantityKg}
                  onChange={(e) => setTotalBatchQuantityKg(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-800"
                  placeholder="0.000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Used Qty (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  value={scrappedQuantityKg}
                  onChange={(e) => setScrappedQuantityKg(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-800"
                  placeholder="0.000"
                />
                <p className="text-xs text-slate-600 mt-1">Material used/damaged</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Return Qty to RM (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  value={returnQuantityKg}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-slate-800 bg-gray-100 font-semibold"
                />
                <p className="text-xs text-slate-600 mt-1">Auto-calculated as full batch quantity</p>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-white rounded border border-blue-200">
              <p className="text-xs text-slate-600">
                <strong>Formula:</strong> Return Qty = Total Batch Qty (RM store will decide vendor acceptance later)
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Return From Location</label>
            <input
              value={locationCode || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-slate-800 bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Return Reason <span className="text-red-500">*</span></label>
              <select
                value={reasonOption}
                onChange={(e) => setReasonOption(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-800 bg-white"
              >
                <option value="">Select a reason…</option>
                <option value="Received wrong RM">Received wrong RM</option>
                <option value="Enough qty for MO reached">Enough qty for MO reached</option>
                <option value="Defect RM material">Defect RM material</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Return Reason Details</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-800"
                placeholder={reasonOption === 'other' ? 'Enter specific reason…' : 'Optional details'}
                disabled={reasonOption !== 'other'}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{error}</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
          <Button onClick={onClose} variant="secondary" disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} variant="primary" className="bg-orange-600 hover:bg-orange-700" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Return'}
          </Button>
        </div>
      </Card>
    </div>
  );
}




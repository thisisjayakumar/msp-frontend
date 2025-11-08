'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import packingZoneAPI from '@/components/API_Service/packing-zone-api';
import toast from 'react-hot-toast';

const PackingModal = ({ group, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    actualPacks: '',
    looseKg: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState(
    group.batches.map(b => b.id)
  );

  // Calculations using useMemo
  const calculations = useMemo(() => {
    const totalKg = group.batches
      .filter(b => selectedBatchIds.includes(b.id))
      .reduce((sum, b) => sum + parseFloat(b.available_kg), 0);

    const gramsPerProduct = parseFloat(group.grams_per_product);
    const packingSize = parseInt(group.packing_size);

    const theoreticalPacks = Math.floor(
      totalKg / (packingSize * gramsPerProduct / 1000)
    );

    const actualPacks = parseInt(formData.actualPacks) || 0;
    const looseKg = parseFloat(formData.looseKg) || 0;

    const loosePieces = Math.floor(looseKg / (gramsPerProduct / 1000));

    const packedWeight = (actualPacks * packingSize * gramsPerProduct) / 1000;
    const variance = (packedWeight + looseKg - totalKg).toFixed(3);

    return {
      totalKg: totalKg.toFixed(3),
      theoreticalPacks,
      loosePieces,
      packedWeight: packedWeight.toFixed(3),
      variance
    };
  }, [group, selectedBatchIds, formData, group.grams_per_product, group.packing_size]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedBatchIds.length === 0) {
      toast.error('Please select at least one batch');
      return;
    }

    if (!formData.actualPacks || parseInt(formData.actualPacks) <= 0) {
      toast.error('Please enter valid number of packs');
      return;
    }

    if (!formData.looseKg || parseFloat(formData.looseKg) < 0) {
      toast.error('Please enter valid loose weight');
      return;
    }

    setIsSubmitting(true);

    const packingData = {
      batch_ids: selectedBatchIds,
      product_code: group.product_code,
      product: group.product_id,
      ipc: group.ipc,
      heat_no: group.heat_no,
      total_weight_kg: parseFloat(calculations.totalKg),
      grams_per_product: parseFloat(group.grams_per_product),
      packing_size: parseInt(group.packing_size),
      theoretical_packs: calculations.theoreticalPacks,
      actual_packs: parseInt(formData.actualPacks),
      loose_weight_kg: parseFloat(formData.looseKg),
      loose_pieces: calculations.loosePieces,
      variance_kg: parseFloat(calculations.variance)
    };

    await onSubmit(packingData);
    setIsSubmitting(false);
  };

  const toggleBatchSelection = (batchId) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Pack Batches</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">IPC:</span>
              <span className="text-sm font-medium text-gray-900">{group.ipc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Heat No:</span>
              <span className="text-sm font-medium text-gray-900">{group.heat_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Packing Size:</span>
              <span className="text-sm font-medium text-gray-900">{group.packing_size} pcs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Grams per Product:</span>
              <span className="text-sm font-medium text-gray-900">{group.grams_per_product} g</span>
            </div>
          </div>

          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Batches to Pack
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
              {group.batches.map((batch) => (
                <label
                  key={batch.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedBatchIds.includes(batch.id)}
                    onChange={() => toggleBatchSelection(batch.id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      MO: {batch.mo_id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {parseFloat(batch.available_kg).toFixed(3)} kg
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Calculations Display */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Calculations</h4>
            <div className="flex justify-between">
              <span className="text-sm text-blue-700">Total Weight:</span>
              <span className="text-sm font-bold text-blue-900">{calculations.totalKg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blue-700">Theoretical Packs:</span>
              <span className="text-sm font-bold text-blue-900">{calculations.theoreticalPacks} packs</span>
            </div>
            {formData.actualPacks && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Packed Weight:</span>
                  <span className="text-sm font-bold text-blue-900">{calculations.packedWeight} kg</span>
                </div>
                {formData.looseKg && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Loose Pieces:</span>
                      <span className="text-sm font-bold text-blue-900">{calculations.loosePieces} pcs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Variance:</span>
                      <span className={`text-sm font-bold ${Math.abs(parseFloat(calculations.variance)) > 0.1 ? 'text-red-900' : 'text-green-900'}`}>
                        {calculations.variance} kg
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actual Packs Created <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.actualPacks}
                onChange={(e) => setFormData({ ...formData, actualPacks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter packs"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loose Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.looseKg}
                onChange={(e) => setFormData({ ...formData, looseKg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter loose kg"
                required
              />
            </div>
          </div>

          {/* Warning for high variance */}
          {Math.abs(parseFloat(calculations.variance)) > 0.5 && formData.actualPacks && formData.looseKg && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    High variance detected ({calculations.variance} kg). Please verify your inputs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedBatchIds.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Packing...' : 'Complete Packing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GroupCard = ({ group, onPack, isReadOnly }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{group.ipc}</h4>
          <p className="text-sm text-gray-500">Heat No: {group.heat_no}</p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Ready to Pack
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Total Weight</p>
          <p className="text-lg font-bold text-gray-900">
            {parseFloat(group.total_kg).toFixed(3)} kg
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Batches</p>
          <p className="text-lg font-bold text-gray-900">{group.batches.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Packing Size</p>
          <p className="text-sm font-medium text-gray-900">{group.packing_size} pcs</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Grams/Product</p>
          <p className="text-sm font-medium text-gray-900">{group.grams_per_product} g</p>
        </div>
      </div>

      {/* Theoretical Calculation */}
      <div className="bg-blue-50 rounded-md p-3 mb-4">
        <p className="text-xs text-blue-600 mb-1">Theoretical Packs</p>
        <p className="text-2xl font-bold text-blue-900">
          {Math.floor(
            parseFloat(group.total_kg) /
            (parseInt(group.packing_size) * parseFloat(group.grams_per_product) / 1000)
          )} packs
        </p>
      </div>

      {/* Batches List */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-700 mb-2">Batches:</p>
        <div className="space-y-1">
          {group.batches.map((batch, index) => (
            <div key={batch.id} className="flex justify-between text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
              <span>MO: {batch.mo_id}</span>
              <span className="font-medium">{parseFloat(batch.available_kg).toFixed(3)} kg</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pack Button */}
      {!isReadOnly && (
        <button
          onClick={() => onPack(group)}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium"
        >
          📦 Pack Batches
        </button>
      )}
    </div>
  );
};

const PackingTab = ({ isReadOnly, isProductionHead, onRefresh }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showPackingModal, setShowPackingModal] = useState(false);

  // Fetch groups ready to be packed
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const result = await packingZoneAPI.batches.getToBePacked();
      if (!result.error) {
        setGroups(result);
      } else {
        toast.error('Failed to fetch batches');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Handle pack
  const handlePack = useCallback((group) => {
    if (isReadOnly) {
      toast.error('Read-only mode - cannot pack batches');
      return;
    }
    setSelectedGroup(group);
    setShowPackingModal(true);
  }, [isReadOnly]);

  const handleSubmitPacking = useCallback(async (packingData) => {
    const toastId = toast.loading('Creating packing transaction...');
    try {
      const result = await packingZoneAPI.transactions.create(packingData);
      if (!result.error) {
        toast.success('Packing completed successfully!', { id: toastId });
        setShowPackingModal(false);
        setSelectedGroup(null);
        fetchGroups();
        onRefresh?.();
      } else {
        toast.error(result.message || 'Failed to complete packing', { id: toastId });
      }
    } catch (error) {
      console.error('Error completing packing:', error);
      toast.error('Failed to complete packing', { id: toastId });
    }
  }, [fetchGroups, onRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600">Loading packing groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Batches are grouped by product and heat number. Select a group to start packing.
              Enter actual packs created and loose weight to complete the packing transaction.
            </p>
          </div>
        </div>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No batches ready to pack</h3>
          <p className="mt-1 text-sm text-gray-500">
            Verify batches in the Verification tab to make them available for packing
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, index) => (
            <GroupCard
              key={`${group.product_code}_${group.heat_no}_${index}`}
              group={group}
              onPack={handlePack}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* Packing Modal */}
      {showPackingModal && selectedGroup && (
        <PackingModal
          group={selectedGroup}
          onClose={() => {
            setShowPackingModal(false);
            setSelectedGroup(null);
          }}
          onSubmit={handleSubmitPacking}
        />
      )}
    </div>
  );
};

export default PackingTab;

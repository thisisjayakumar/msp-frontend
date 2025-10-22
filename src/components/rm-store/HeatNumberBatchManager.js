"use client";

import { useState } from 'react';
import { Card } from '../CommonComponents/ui/Card';
import Button from '../CommonComponents/ui/Button';
import Input from '../CommonComponents/ui/Input';

export default function HeatNumberBatchManager({ material, onSave, onCancel }) {
  const [heatNumbers, setHeatNumbers] = useState([]);
  const [currentHeatNumber, setCurrentHeatNumber] = useState('');
  const [childBatches, setChildBatches] = useState([]);
  const [currentBatchNumber, setCurrentBatchNumber] = useState('');
  const [currentBatchKg, setCurrentBatchKg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedHeatIndex, setExpandedHeatIndex] = useState(null);

  // Add a new heat number
  const handleAddHeatNumber = () => {
    if (!currentHeatNumber.trim()) {
      setError('Please enter a heat number');
      return;
    }

    // Check for duplicates
    if (heatNumbers.some(h => h.heat_number === currentHeatNumber)) {
      setError('This heat number already exists');
      return;
    }

    const newHeat = {
      id: Date.now(),
      heat_number: currentHeatNumber,
      child_batches: [],
      total_kg: 0,
    };

    setHeatNumbers([...heatNumbers, newHeat]);
    setCurrentHeatNumber('');
    setError(null);
  };

  // Add child batch to current heat number
  const handleAddChildBatch = (heatIndex) => {
    if (!currentBatchNumber.trim()) {
      setError('Please enter a coil/batch number');
      return;
    }

    const batchKgNum = parseFloat(currentBatchKg);
    if (isNaN(batchKgNum) || batchKgNum <= 0) {
      setError('Please enter a valid weight in kg (greater than 0)');
      return;
    }

    const updatedHeatNumbers = [...heatNumbers];
    const heat = updatedHeatNumbers[heatIndex];

    // Check for duplicate batch numbers within this heat
    if (heat.child_batches.some(b => b.batch_number === currentBatchNumber)) {
      setError('This coil/batch number already exists in this heat number');
      return;
    }

    const newBatch = {
      id: Date.now(),
      batch_number: currentBatchNumber,
      weight_kg: batchKgNum,
    };

    heat.child_batches.push(newBatch);
    heat.total_kg += batchKgNum;

    setHeatNumbers(updatedHeatNumbers);
    setCurrentBatchNumber('');
    setCurrentBatchKg('');
    setError(null);
  };

  // Remove child batch
  const handleRemoveChildBatch = (heatIndex, batchId) => {
    const updatedHeatNumbers = [...heatNumbers];
    const heat = updatedHeatNumbers[heatIndex];
    const batchIndex = heat.child_batches.findIndex(b => b.id === batchId);

    if (batchIndex > -1) {
      const removedBatch = heat.child_batches[batchIndex];
      heat.total_kg -= removedBatch.weight_kg;
      heat.child_batches.splice(batchIndex, 1);
      setHeatNumbers(updatedHeatNumbers);
    }
  };

  // Remove heat number
  const handleRemoveHeatNumber = (heatIndex) => {
    const updatedHeatNumbers = heatNumbers.filter((_, idx) => idx !== heatIndex);
    setHeatNumbers(updatedHeatNumbers);
    if (expandedHeatIndex === heatIndex) {
      setExpandedHeatIndex(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (heatNumbers.length === 0) {
      setError('Please add at least one heat number with child batches');
      return;
    }

    // Validate that each heat number has at least one child batch
    const invalidHeat = heatNumbers.find(h => h.child_batches.length === 0);
    if (invalidHeat) {
      setError(`Heat number ${invalidHeat.heat_number} has no child batches. Please add at least one coil/batch.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(material, heatNumbers);
    } catch (err) {
      console.error('Error saving heat numbers:', err);
      setError(err.message || 'Failed to save heat numbers');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total kg across all heat numbers
  const totalKg = heatNumbers.reduce((sum, heat) => sum + heat.total_kg, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Heat Numbers & Child Batches
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

          {/* Material Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">
                {material.material_code}
              </h3>
              <span className="text-sm font-medium text-cyan-600">
                Total: {totalKg.toFixed(3)} kg
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {material.material_name}
            </p>
            <p className="text-sm text-gray-500">
              Grade: {material.grade} • {material.material_type_display}
            </p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Add Heat Number Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Add Heat Number</h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={currentHeatNumber}
                  onChange={(e) => {
                    setCurrentHeatNumber(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter heat number (e.g., HT-2024-001)"
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddHeatNumber}
                  variant="primary"
                  disabled={loading || !currentHeatNumber.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 whitespace-nowrap"
                >
                  Add Heat
                </Button>
              </div>
            </div>

            {/* Heat Numbers List */}
            {heatNumbers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Heat Numbers & Child Batches</h3>
                {heatNumbers.map((heat, heatIndex) => (
                  <div key={heat.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Heat Number Header */}
                    <div
                      onClick={() => setExpandedHeatIndex(expandedHeatIndex === heatIndex ? null : heatIndex)}
                      className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <svg
                          className={`w-5 h-5 text-gray-600 transition-transform ${
                            expandedHeatIndex === heatIndex ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">{heat.heat_number}</p>
                          <p className="text-xs text-gray-600">
                            {heat.child_batches.length} coil(s) • {heat.total_kg.toFixed(3)} kg
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveHeatNumber(heatIndex);
                        }}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Remove heat number"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Expanded Content - Child Batches */}
                    {expandedHeatIndex === heatIndex && (
                      <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                        {/* Add Child Batch Form */}
                        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                          <h4 className="text-sm font-medium text-gray-900">Add Coil/Batch</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="text"
                              value={currentBatchNumber}
                              onChange={(e) => {
                                setCurrentBatchNumber(e.target.value);
                                setError(null);
                              }}
                              placeholder="Coil/Batch #"
                              disabled={loading}
                            />
                            <Input
                              type="text"
                              value={currentBatchKg}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setCurrentBatchKg(value);
                                  setError(null);
                                }
                              }}
                              placeholder="Weight (kg)"
                              disabled={loading}
                            />
                            <Button
                              type="button"
                              onClick={() => handleAddChildBatch(heatIndex)}
                              variant="primary"
                              disabled={loading || !currentBatchNumber.trim() || !currentBatchKg}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Add
                            </Button>
                          </div>
                        </div>

                        {/* Child Batches List */}
                        {heat.child_batches.length > 0 ? (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900">Coils/Batches in this Heat</h4>
                            {heat.child_batches.map((batch) => (
                              <div
                                key={batch.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{batch.batch_number}</p>
                                  <p className="text-sm text-gray-600">{batch.weight_kg.toFixed(3)} kg</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveChildBatch(heatIndex, batch.id)}
                                  className="text-red-600 hover:text-red-700 transition-colors ml-2"
                                  title="Remove coil/batch"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 text-center py-4">
                            No coils/batches added yet. Add one above.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {heatNumbers.length === 0 && (
              <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-gray-600">No heat numbers added yet. Add one above to get started.</p>
              </div>
            )}

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
                disabled={loading || heatNumbers.length === 0}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Heat Numbers & Batches'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

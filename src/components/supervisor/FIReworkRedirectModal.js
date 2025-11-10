"use client";

import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';
import { API_ENDPOINTS } from '@/components/API_Service/api-list';
import { apiGet } from '@/components/API_Service/api-utils';

export default function FIReworkRedirectModal({ fiCompletionRecord, batch, onClose, onSuccess }) {
  const [processes, setProcesses] = useState([]);
  const [formData, setFormData] = useState({
    rework_to_process: '',
    rework_quantity: '',
    defect_description: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingProcesses, setLoadingProcesses] = useState(true);
  const [errors, setErrors] = useState({});

  // Fetch available processes for rework redirection
  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      setLoadingProcesses(true);
      const response = await apiGet(API_ENDPOINTS.PROCESS_TRACKING.PROCESSES);
      
      if (response.success && response.data) {
        // Filter to only show relevant manufacturing processes
        const manufacturingProcesses = response.data.filter(p => 
          !['final_inspection', 'packing', 'rm_store', 'fg_store'].includes(p.name?.toLowerCase().replace(/\s+/g, '_'))
        );
        setProcesses(manufacturingProcesses);
      }
    } catch (error) {
      console.error('Error fetching processes:', error);
      alert('Failed to load processes. Please try again.');
    } finally {
      setLoadingProcesses(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.rework_to_process) {
      newErrors.rework_to_process = 'Please select a process for rework';
    }

    if (!formData.rework_quantity) {
      newErrors.rework_quantity = 'Rework quantity is required';
    }

    const reworkQty = parseFloat(formData.rework_quantity) || 0;
    if (reworkQty <= 0) {
      newErrors.rework_quantity = 'Rework quantity must be greater than 0';
    }

    if (fiCompletionRecord?.rework_quantity && reworkQty > fiCompletionRecord.rework_quantity) {
      newErrors.rework_quantity = `Cannot exceed available rework quantity (${fiCompletionRecord.rework_quantity} kg)`;
    }

    if (!formData.defect_description.trim()) {
      newErrors.defect_description = 'Defect description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      await processSupervisorAPI.redirectFIRework({
        fi_batch_completion_id: fiCompletionRecord.id,
        batch_id: batch.id,
        rework_to_process_id: formData.rework_to_process,
        rework_quantity: parseFloat(formData.rework_quantity),
        defect_description: formData.defect_description.trim()
      });

      const selectedProcess = processes.find(p => p.id === parseInt(formData.rework_to_process));
      alert(`Rework successfully redirected to ${selectedProcess?.name || 'selected process'} for batch ${batch.batch_id}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error redirecting rework:', error);
      alert(`Failed to redirect rework: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ArrowPathIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Redirect Rework</h2>
              <p className="text-sm text-slate-600">Final Inspection - Batch: {batch.batch_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Batch Details */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Batch Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">MO ID:</span>
                <span className="font-medium">{batch.mo_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Batch ID:</span>
                <span className="font-medium">{batch.batch_id}</span>
              </div>
              {fiCompletionRecord && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-600">OK Quantity:</span>
                    <span className="font-medium text-green-700">{fiCompletionRecord.ok_quantity} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Scrap Quantity:</span>
                    <span className="font-medium text-red-700">{fiCompletionRecord.scrap_quantity} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Available for Rework:</span>
                    <span className="font-medium text-orange-700">{fiCompletionRecord.rework_quantity} kg</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Select Process */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Redirect to Process *
            </label>
            {loadingProcesses ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <select
                name="rework_to_process"
                value={formData.rework_to_process}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.rework_to_process ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="">Select process for rework</option>
                {processes.map(process => (
                  <option key={process.id} value={process.id}>
                    {process.name}
                  </option>
                ))}
              </select>
            )}
            {errors.rework_to_process && (
              <p className="mt-1 text-sm text-red-600">{errors.rework_to_process}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Select the process where the defect occurred
            </p>
          </div>

          {/* Rework Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rework Quantity (kg) *
            </label>
            <input
              type="number"
              name="rework_quantity"
              value={formData.rework_quantity}
              onChange={handleInputChange}
              step="0.001"
              min="0"
              max={fiCompletionRecord?.rework_quantity || undefined}
              placeholder="0.000"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.rework_quantity ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.rework_quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.rework_quantity}</p>
            )}
            {fiCompletionRecord?.rework_quantity && (
              <p className="mt-1 text-xs text-slate-500">
                Maximum: {fiCompletionRecord.rework_quantity} kg
              </p>
            )}
          </div>

          {/* Defect Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Defect Description *
            </label>
            <textarea
              name="defect_description"
              value={formData.defect_description}
              onChange={handleInputChange}
              rows={5}
              placeholder="Describe the defect in detail...&#10;e.g., Dimensional error in wire diameter, Surface coating defect, Improper heat treatment, etc."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.defect_description ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.defect_description && (
              <p className="mt-1 text-sm text-red-600">{errors.defect_description}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Provide detailed information to help the supervisor understand the issue
            </p>
          </div>

          {/* Info Notice */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ArrowPathIcon className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">On Redirection:</p>
                <ul className="list-disc list-inside space-y-1 text-orange-700">
                  <li>Selected process supervisor will be notified</li>
                  <li>Batch will appear in supervisor's "Rework Pending" tab</li>
                  <li>After rework completion, batch returns to FI for re-inspection</li>
                  <li>Rework cycle will be tracked (R1, R2, etc.)</li>
                  <li>Source will be tagged as "FI" for traceability</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingProcesses}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Redirect Rework</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


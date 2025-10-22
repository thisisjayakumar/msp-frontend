"use client";

import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/components/API_Service/api-utils';

export default function IssueReportModal({ material, onClose, onIssueReported }) {
  const [formData, setFormData] = useState({
    issue_type: '',
    actual_weight: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const issueTypes = [
    { value: 'incorrect_weight', label: 'Incorrect Weight' },
    { value: 'damaged_material', label: 'Damaged Material' },
    { value: 'wrong_material', label: 'Wrong Material' }
  ];

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

    if (!formData.issue_type) {
      newErrors.issue_type = 'Issue type is required';
    }

    if (!formData.remarks.trim()) {
      newErrors.remarks = 'Remarks are required';
    }

    if (formData.actual_weight && isNaN(parseFloat(formData.actual_weight))) {
      newErrors.actual_weight = 'Actual weight must be a valid number';
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
      
      const response = await apiRequest('/api/inventory/coiling/report/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heat_number: material.id,
          issue_type: formData.issue_type,
          actual_weight: formData.actual_weight ? parseFloat(formData.actual_weight) : null,
          remarks: formData.remarks.trim()
        }),
      });

      if (response.success) {
        alert(`Issue reported successfully for heat number ${material.heat_number}`);
        onIssueReported();
      } else {
        alert(`Failed to report issue: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Failed to report issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Report Issue</h2>
              <p className="text-sm text-slate-600">Heat Number: {material.heat_number}</p>
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
          {/* Material Details */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Material Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Material:</span>
                <span className="font-medium">{material.raw_material_details?.material_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Expected Weight:</span>
                <span className="font-medium">{material.total_weight_kg ? `${material.total_weight_kg} kg` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Issue Type *
            </label>
            <select
              name="issue_type"
              value={formData.issue_type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.issue_type ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="">Select issue type</option>
              {issueTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.issue_type && (
              <p className="mt-1 text-sm text-red-600">{errors.issue_type}</p>
            )}
          </div>

          {/* Actual Weight */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Actual Weight (kg)
            </label>
            <input
              type="number"
              name="actual_weight"
              value={formData.actual_weight}
              onChange={handleInputChange}
              step="0.001"
              min="0"
              placeholder="Enter actual weight if different from expected"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.actual_weight ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.actual_weight && (
              <p className="mt-1 text-sm text-red-600">{errors.actual_weight}</p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Remarks *
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe the issue in detail..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.remarks ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.remarks && (
              <p className="mt-1 text-sm text-red-600">{errors.remarks}</p>
            )}
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Reporting...</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>Report Issue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

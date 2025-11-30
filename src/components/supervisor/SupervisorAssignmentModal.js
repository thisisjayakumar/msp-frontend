"use client";

import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

export default function SupervisorAssignmentModal({ 
  isOpen, 
  onClose, 
  processExecution, 
  supervisors = [],
  onSuccess 
}) {
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen && processExecution) {
      setSelectedSupervisor(processExecution.assigned_supervisor);
      setNotes('');
      setError(null);
      setShowConfirmation(false);
    }
  }, [isOpen, processExecution]);

  const handleAssign = async () => {
    if (!selectedSupervisor) {
      setError('Please select a supervisor');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await manufacturingAPI.manufacturingOrders.assignSupervisor(
        processExecution.id,
        selectedSupervisor,
        notes
      );

      // Check if response has assigned_supervisor (success) or error
      if (response && response.assigned_supervisor) {
        // Success - show message and trigger refresh
        onSuccess && onSuccess();
        onClose();
      } else if (response && (response.error || response.message)) {
        // Error response from handleResponse
        setError(response.message || response.error || 'Failed to assign supervisor');
      } else {
        setError('Failed to assign supervisor: Unexpected response format');
      }
    } catch (err) {
      setError(err.message || 'Error assigning supervisor');
      console.error('Error assigning supervisor:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !processExecution) return null;

  const currentSupervisor = supervisors.find(s => s.id === processExecution.assigned_supervisor);
  const isChanging = selectedSupervisor !== processExecution.assigned_supervisor;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Assign Supervisor</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Process Info */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-600 mb-1">
            <span className="font-semibold">Process:</span> {processExecution.process_name}
          </p>
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Status:</span> {processExecution.status_display}
          </p>
        </div>

        {/* Current Supervisor */}
        {currentSupervisor && (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Current Supervisor:</span> {currentSupervisor.first_name} {currentSupervisor.last_name}
            </p>
          </div>
        )}

        {/* Supervisor Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select New Supervisor
          </label>
          <select
            value={selectedSupervisor || ''}
            onChange={(e) => setSelectedSupervisor(parseInt(e.target.value))}
            disabled={loading}
            className="w-full px-4 py-2 border border-slate-300 text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Choose a supervisor...</option>
            {supervisors.map((supervisor) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.first_name} {supervisor.last_name} ({supervisor.email})
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder="Add any notes about this assignment..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
            rows="3"
          />
        </div>

        {/* Warning if changing */}
        {isChanging && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              You are changing the supervisor. The new supervisor will have access to this process.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedSupervisor}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center space-x-2"
          >
            <CheckIcon className="h-5 w-5" />
            <span>{loading ? 'Assigning...' : 'Assign'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

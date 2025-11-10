"use client";

import { useState } from 'react';
import { XMarkIcon, PlayCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import processSupervisorAPI from '@/components/API_Service/process-supervisor-api';

export default function ProcessResumeModal({ processStop, batch, onClose, onSuccess }) {
  const [resumeNotes, setResumeNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate current downtime
  const getCurrentDowntime = () => {
    if (!processStop?.stopped_at) return 'N/A';
    
    const stoppedTime = new Date(processStop.stopped_at);
    const now = new Date();
    const diffMs = now - stoppedTime;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      await processSupervisorAPI.resumeProcess(processStop.id, resumeNotes.trim());

      alert(`Process resumed successfully. Downtime: ${getCurrentDowntime()}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error resuming process:', error);
      alert(`Failed to resume process: ${error.message}`);
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
            <div className="p-2 bg-green-100 rounded-lg">
              <PlayCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Resume Process</h2>
              <p className="text-sm text-slate-600">Batch: {batch.batch_id}</p>
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
          {/* Stop Details */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Stop Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Reason:</span>
                <span className="font-medium">{processStop.stop_reason_display || processStop.stop_reason}</span>
              </div>
              {processStop.stop_reason_detail && (
                <div>
                  <span className="text-slate-600">Details:</span>
                  <p className="font-medium mt-1">{processStop.stop_reason_detail}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Stopped By:</span>
                <span className="font-medium">{processStop.stopped_by_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Stopped At:</span>
                <span className="font-medium">{new Date(processStop.stopped_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Downtime Display */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Current Downtime</p>
                <p className="text-2xl font-bold text-red-700">{getCurrentDowntime()}</p>
              </div>
            </div>
          </div>

          {/* Resume Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Resume Notes (Optional)
            </label>
            <textarea
              value={resumeNotes}
              onChange={(e) => setResumeNotes(e.target.value)}
              rows={4}
              placeholder="Add any notes about the resolution or current status..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional: Provide information about what was done to resolve the issue
            </p>
          </div>

          {/* Info Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <PlayCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">On Resume:</p>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>Process will return to "In Progress" status</li>
                  <li>Downtime will be recorded automatically</li>
                  <li>PH and Manager will be notified</li>
                  <li>Production can continue immediately</li>
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Resuming...</span>
                </>
              ) : (
                <>
                  <PlayCircleIcon className="h-4 w-4" />
                  <span>Resume Process</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


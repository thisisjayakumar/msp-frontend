"use client";

import { useState, useEffect } from 'react';
import patrolAPI from '@/components/API_Service/patrol-api';

export default function PatrolDutyForm({ duty = null, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [patrolUsers, setPatrolUsers] = useState([]);
  const [processes, setProcesses] = useState([]);
  
  const [formData, setFormData] = useState({
    patrol_user: duty?.patrol_user || '',
    process_names: duty?.process_names || [],
    frequency_hours: duty?.frequency_hours || 2,
    shift_start_time: duty?.shift_start_time || '09:00',
    shift_end_time: duty?.shift_end_time || '17:00',
    shift_type: duty?.shift_type || 'I',
    start_date: duty?.start_date || new Date().toISOString().split('T')[0],
    end_date: duty?.end_date || '',
    remarks: duty?.remarks || '',
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [usersData, processesData] = await Promise.all([
        patrolAPI.duties.getPatrolUsers(),
        patrolAPI.duties.getProcessList()
      ]);

      if (!usersData.error) {
        setPatrolUsers(usersData);
      }
      if (!processesData.error) {
        setProcesses(processesData.processes || []);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleProcessToggle = (process) => {
    setFormData(prev => ({
      ...prev,
      process_names: prev.process_names.includes(process)
        ? prev.process_names.filter(p => p !== process)
        : [...prev.process_names, process]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.patrol_user) {
      alert('Please select a patrol user');
      return;
    }
    if (formData.process_names.length === 0) {
      alert('Please select at least one process');
      return;
    }
    if (!formData.end_date) {
      alert('Please select an end date');
      return;
    }
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      alert('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      const result = duty
        ? await patrolAPI.duties.update(duty.id, formData)
        : await patrolAPI.duties.create(formData);

      if (result.error) {
        alert(result.message || 'Failed to save patrol duty');
      } else {
        alert(duty ? 'Patrol duty updated successfully!' : 'Patrol duty created successfully!');
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error saving duty:', error);
      alert('Failed to save patrol duty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patrol User Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Patrol User *
        </label>
        <select
          value={formData.patrol_user}
          onChange={(e) => setFormData({ ...formData, patrol_user: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">Select Patrol User</option>
          {patrolUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.full_name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {/* Process Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Processes to Monitor * (Select multiple)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
          {processes.map(process => (
            <label key={process} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={formData.process_names.includes(process)}
                onChange={() => handleProcessToggle(process)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm">{process}</span>
            </label>
          ))}
        </div>
        {formData.process_names.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            Selected: {formData.process_names.join(', ')}
          </div>
        )}
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          QC Upload Frequency (hours) *
        </label>
        <select
          value={formData.frequency_hours}
          onChange={(e) => setFormData({ ...formData, frequency_hours: parseInt(e.target.value) })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="1">Every 1 hour</option>
          <option value="2">Every 2 hours</option>
          <option value="3">Every 3 hours</option>
          <option value="4">Every 4 hours</option>
          <option value="6">Every 6 hours</option>
        </select>
      </div>

      {/* Shift Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shift Type *
          </label>
          <select
            value={formData.shift_type}
            onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="I">Shift I (9AM-5PM)</option>
            <option value="II">Shift II (5PM-2AM)</option>
            <option value="III">Shift III (2AM-9AM)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shift Start Time *
          </label>
          <input
            type="time"
            value={formData.shift_start_time}
            onChange={(e) => setFormData({ ...formData, shift_start_time: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shift End Time *
          </label>
          <input
            type="time"
            value={formData.shift_end_time}
            onChange={(e) => setFormData({ ...formData, shift_end_time: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
            min={formData.start_date}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Remarks (Optional)
        </label>
        <textarea
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Additional notes or instructions..."
        />
      </div>

      {/* Buttons */}
      <div className="flex space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : duty ? 'Update Patrol Duty' : 'Create Patrol Duty'}
        </button>
      </div>
    </form>
  );
}


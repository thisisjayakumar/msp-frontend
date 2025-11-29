"use client";

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { WORK_CENTER_APIS, AUTHENTICATION_APIS } from '@/components/API_Service/api-list';
import { apiGet, apiPost, apiPut, apiDelete } from '@/components/API_Service/api-utils';

export default function WorkCenterShiftManagement() {
  const [processes, setProcesses] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [shiftConfigs, setShiftConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    shift: 'shift_1',
    shift_start_time: '09:00',
    shift_end_time: '17:00',
    primary_supervisor: '',
    backup_supervisor: '',
    check_in_deadline: '09:15',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch processes using centralized API
      const processesResponse = await apiGet(WORK_CENTER_APIS.PROCESSES_LIST);
      if (processesResponse.success) {
        setProcesses(processesResponse.data.results || processesResponse.data);
      } else {
        console.error('Failed to fetch processes:', processesResponse.error);
        throw new Error(processesResponse.error);
      }

      // Fetch supervisors using the dedicated supervisors endpoint
      const supervisorsResponse = await apiGet(WORK_CENTER_APIS.WC_SUPERVISORS);
      if (supervisorsResponse.success) {
        const supervisorsList = supervisorsResponse.data.results || supervisorsResponse.data;
        console.log('Fetched supervisors:', supervisorsList.length, 'supervisors');
        setSupervisors(supervisorsList);
      } else {
        console.warn('Failed to fetch supervisors:', supervisorsResponse.error);
        setSupervisors([]);
      }

      // Fetch all shift configurations using centralized API
      const configsResponse = await apiGet(WORK_CENTER_APIS.SUPERVISOR_SHIFTS_LIST);
      if (configsResponse.success) {
        setShiftConfigs(configsResponse.data.results || configsResponse.data);
      } else {
        console.warn('Failed to fetch shift configs:', configsResponse.error);
        setShiftConfigs([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert(`Error loading data: ${error.message}\n\nPlease ensure:\n1. Backend server is running\n2. You are logged in\n3. API endpoints are accessible`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (process, shift = null) => {
    setSelectedProcess(process);
    setEditingShift(shift);
    
    if (shift) {
      // Editing existing shift
      setFormData({
        shift: shift.shift,
        shift_start_time: shift.shift_start_time,
        shift_end_time: shift.shift_end_time,
        primary_supervisor: shift.primary_supervisor,
        backup_supervisor: shift.backup_supervisor,
        check_in_deadline: shift.check_in_deadline,
        is_active: shift.is_active
      });
    } else {
      // Adding new shift - find which shift to add
      const existingShifts = shiftConfigs
        .filter(s => s.work_center === process.id)
        .map(s => s.shift);
      
      const nextShift = existingShifts.includes('shift_1')
        ? existingShifts.includes('shift_2')
          ? 'shift_3'
          : 'shift_2'
        : 'shift_1';
      
      const defaultTimes = {
        shift_1: { start: '09:00', end: '17:00', deadline: '09:15' },
        shift_2: { start: '17:00', end: '01:00', deadline: '17:15' },
        shift_3: { start: '01:00', end: '09:00', deadline: '01:15' }
      };
      
      setFormData({
        shift: nextShift,
        shift_start_time: defaultTimes[nextShift].start,
        shift_end_time: defaultTimes[nextShift].end,
        primary_supervisor: '',
        backup_supervisor: '',
        check_in_deadline: defaultTimes[nextShift].deadline,
        is_active: true
      });
    }
    
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.primary_supervisor === formData.backup_supervisor) {
      alert('Primary and backup supervisors must be different!');
      return;
    }
    
    try {
      const payload = {
        work_center: selectedProcess.id,
        ...formData
      };
      
      let response;
      if (editingShift) {
        response = await apiPut(
          WORK_CENTER_APIS.SUPERVISOR_SHIFTS_UPDATE(editingShift.id),
          payload
        );
        if (response.success) {
          alert('Shift configuration updated successfully!');
        } else {
          throw new Error(response.error);
        }
      } else {
        response = await apiPost(
          WORK_CENTER_APIS.SUPERVISOR_SHIFTS_CREATE,
          payload
        );
        if (response.success) {
          alert('Shift configuration added successfully!');
        } else {
          throw new Error(response.error);
        }
      }
      
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving shift configuration:', error);
      alert(`Error saving shift configuration: ${error.message}`);
    }
  };

  const handleDelete = async (shiftId) => {
    if (!confirm('Are you sure you want to delete this shift configuration?')) return;
    
    try {
      const response = await apiDelete(WORK_CENTER_APIS.SUPERVISOR_SHIFTS_DELETE(shiftId));
      if (response.success) {
        alert('Shift configuration deleted successfully!');
        fetchData();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error deleting shift configuration:', error);
      alert(`Error deleting shift configuration: ${error.message}`);
    }
  };

  const getShiftLabel = (shift) => {
    const labels = {
      shift_1: 'Shift 1 (Day)',
      shift_2: 'Shift 2 (Evening)',
      shift_3: 'Shift 3 (Night)'
    };
    return labels[shift] || shift;
  };

  const getSupervisorName = (supervisorId) => {
    const supervisor = supervisors.find(s => s.id === supervisorId);
    return supervisor ? `${supervisor.first_name} ${supervisor.last_name}` : 'N/A';
  };

  // Group configs by process
  const configsByProcess = {};
  processes.forEach(process => {
    configsByProcess[process.id] = {
      process,
      shifts: shiftConfigs.filter(s => s.work_center === process.id)
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Work Center Supervisor Configuration</h2>
        <p className="text-sm text-slate-600 mt-1">
          Configure supervisor assignments for each process and shift
        </p>
      </div>

      {/* Process List */}
      <div className="space-y-4">
        {Object.values(configsByProcess).map(({ process, shifts }) => (
          <div key={process.id} className="bg-white rounded-lg shadow border border-slate-200">
            {/* Process Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{process.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {shifts.length === 0 && 'No shifts configured'}
                    {shifts.length === 1 && '1 shift configured'}
                    {shifts.length > 1 && `${shifts.length} shifts configured`}
                  </p>
                </div>
                {shifts.length < 3 && (
                  <button
                    onClick={() => handleOpenModal(process)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add Shift</span>
                  </button>
                )}
              </div>
            </div>

            {/* Shifts */}
            {shifts.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {shifts
                  .sort((a, b) => a.shift.localeCompare(b.shift))
                  .map((shift) => (
                    <div key={shift.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Shift</p>
                            <p className="text-base text-slate-800 font-semibold mt-1">
                              {getShiftLabel(shift.shift)}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {shift.shift_start_time} - {shift.shift_end_time}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Primary Supervisor</p>
                            <p className="text-base text-slate-800 mt-1">
                              {shift.primary_supervisor_name || getSupervisorName(shift.primary_supervisor)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Backup Supervisor</p>
                            <p className="text-base text-slate-800 mt-1">
                              {shift.backup_supervisor_name || getSupervisorName(shift.backup_supervisor)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Check-in Deadline</p>
                            <p className="text-base text-slate-800 mt-1">{shift.check_in_deadline}</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                              shift.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {shift.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleOpenModal(process, shift)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(shift.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p>No shifts configured for this process</p>
                <button
                  onClick={() => handleOpenModal(process)}
                  className="mt-3 text-blue-600 hover:underline"
                >
                  Add first shift
                </button>
              </div>
            )}
          </div>
        ))}

        {processes.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600">No processes found in the system.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingShift ? 'Edit' : 'Add'} Shift Configuration
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">Process: {selectedProcess?.name}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({...formData, shift: e.target.value})}
                    disabled={editingShift !== null}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  >
                    <option value="shift_1">Shift 1 (Day)</option>
                    <option value="shift_2">Shift 2 (Evening)</option>
                    <option value="shift_3">Shift 3 (Night)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Check-in Deadline</label>
                  <input
                    type="time"
                    value={formData.check_in_deadline}
                    onChange={(e) => setFormData({...formData, check_in_deadline: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Shift Start Time</label>
                  <input
                    type="time"
                    value={formData.shift_start_time}
                    onChange={(e) => setFormData({...formData, shift_start_time: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Shift End Time</label>
                  <input
                    type="time"
                    value={formData.shift_end_time}
                    onChange={(e) => setFormData({...formData, shift_end_time: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Supervisor</label>
                  <select
                    value={formData.primary_supervisor}
                    onChange={(e) => setFormData({...formData, primary_supervisor: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Primary Supervisor</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.first_name} {supervisor.last_name} ({supervisor.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Backup Supervisor</label>
                  <select
                    value={formData.backup_supervisor}
                    onChange={(e) => setFormData({...formData, backup_supervisor: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Backup Supervisor</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.first_name} {supervisor.last_name} ({supervisor.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  <span>{editingShift ? 'Update' : 'Add'} Shift</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

export default function SupervisorShiftManagement() {
  const [processes, setProcesses] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [shiftConfigs, setShiftConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    work_center: '',
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
      // Fetch processes
      const processesRes = await fetch('/api/processes/processes/');
      const processesData = await processesRes.json();
      setProcesses(processesData.results || processesData);

      // Fetch supervisors
      const supervisorsRes = await fetch('/api/authentication/users/?role=supervisor');
      const supervisorsData = await supervisorsRes.json();
      setSupervisors(supervisorsData.results || supervisorsData);

      // Fetch shift configurations
      const configsRes = await manufacturingAPI.supervisorShifts.getAll();
      setShiftConfigs(configsRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        work_center: config.work_center,
        shift: config.shift,
        shift_start_time: config.shift_start_time,
        shift_end_time: config.shift_end_time,
        primary_supervisor: config.primary_supervisor,
        backup_supervisor: config.backup_supervisor,
        check_in_deadline: config.check_in_deadline,
        is_active: config.is_active
      });
    } else {
      setEditingConfig(null);
      setFormData({
        work_center: '',
        shift: 'shift_1',
        shift_start_time: '09:00',
        shift_end_time: '17:00',
        primary_supervisor: '',
        backup_supervisor: '',
        check_in_deadline: '09:15',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingConfig) {
        await manufacturingAPI.supervisorShifts.update(editingConfig.id, formData);
      } else {
        await manufacturingAPI.supervisorShifts.create(formData);
      }
      
      setShowModal(false);
      fetchData();
      alert(`Shift configuration ${editingConfig ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving shift configuration:', error);
      alert('Error saving shift configuration');
    }
  };

  const handleDelete = async (configId) => {
    if (!confirm('Are you sure you want to delete this shift configuration?')) return;
    
    try {
      await manufacturingAPI.supervisorShifts.delete(configId);
      fetchData();
      alert('Shift configuration deleted successfully!');
    } catch (error) {
      console.error('Error deleting shift configuration:', error);
      alert('Error deleting shift configuration');
    }
  };

  const getProcessName = (processId) => {
    const process = processes.find(p => p.id === processId);
    return process ? process.name : processId;
  };

  const getSupervisorName = (supervisorId) => {
    const supervisor = supervisors.find(s => s.id === supervisorId);
    return supervisor ? `${supervisor.first_name} ${supervisor.last_name}` : supervisorId;
  };

  // Group configs by process
  const configsByProcess = shiftConfigs.reduce((acc, config) => {
    const processName = config.work_center_name || getProcessName(config.work_center);
    if (!acc[processName]) {
      acc[processName] = [];
    }
    acc[processName].push(config);
    return acc;
  }, {});

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Supervisor Shift Management</h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure default primary and backup supervisors for each process and shift
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Shift Configuration</span>
        </button>
      </div>

      {/* Configurations by Process */}
      <div className="space-y-6">
        {Object.keys(configsByProcess).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600">No shift configurations found. Add your first configuration to get started.</p>
          </div>
        ) : (
          Object.entries(configsByProcess).map(([processName, configs]) => (
            <div key={processName} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">{processName}</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {configs.map((config) => (
                  <div key={config.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Shift</p>
                          <p className="text-base text-slate-800 font-semibold mt-1">
                            {config.shift_display || config.shift}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {config.shift_start_time} - {config.shift_end_time}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Primary Supervisor</p>
                          <p className="text-base text-slate-800 mt-1">
                            {config.primary_supervisor_name || getSupervisorName(config.primary_supervisor)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Backup Supervisor</p>
                          <p className="text-base text-slate-800 mt-1">
                            {config.backup_supervisor_name || getSupervisorName(config.backup_supervisor)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Check-in Deadline</p>
                          <p className="text-base text-slate-800 mt-1">{config.check_in_deadline}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                            config.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {config.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleOpenModal(config)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
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
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingConfig ? 'Edit' : 'Add'} Shift Configuration
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Process (Work Center)
                  </label>
                  <select
                    value={formData.work_center}
                    onChange={(e) => setFormData({...formData, work_center: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Process</option>
                    {processes.map((process) => (
                      <option key={process.id} value={process.id}>
                        {process.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({...formData, shift: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="shift_1">Shift 1</option>
                    <option value="shift_2">Shift 2</option>
                    <option value="shift_3">Shift 3</option>
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
                  <span>{editingConfig ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

